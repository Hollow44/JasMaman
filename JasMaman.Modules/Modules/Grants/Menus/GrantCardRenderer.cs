using System.Net;
using System.Text;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Yoda.Interfaces;
using Yoda.Interfaces.Forms.Components;
using YodaApp;
using YodaQuery;

namespace JasMaman.Modules.Grants.Menus {
    /// <summary>
    /// Отрисовка карточки гранта. HTML собирается вручную, все данные экранируются <see cref="e"/>.
    /// </summary>
    public static class GrantCardRenderer {
        private static string e(object? value) => WebUtility.HtmlEncode(value?.ToString() ?? "—");
        private static string d(DateTime? date) => date?.ToString("dd.MM.yyyy") ?? "—";
        private static string m(decimal? amount) => amount?.ToString("N2") ?? "—";

        private static string badge(string text, string color) => $"<span class=\"badge bg-{color}\">{e(text)}</span>";

        public static void RenderShortInfo(WidgetBase panel, GrantState state) {
            var html = $"<div class=\"alert alert-light\"><b>{e(state.Person.FullName)}</b>, ИИН {e(state.Person.Iin)}<br>"
                + $"{e(state.Study.UniversityName)} · {e(RefEducationLevel.Texts[state.Study.EducationLevel])} · "
                + $"{badge(GrantRules.DeriveStage(state).ToDisplayText(), GrantRules.DeriveStage(state).ToBootstrapColor().ToString().ToLower())}</div>";
            panel.Append(new HtmlTextV2(html, HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
        }

        public static void RenderCard(WidgetBase panel, GrantState state, IYodaRequestContext context) {
            var today = DateTime.Today;
            var stage = GrantRules.DeriveStage(state);
            var sb = new StringBuilder();

            sb.Append($"<div class=\"d-flex align-items-center gap-2 mb-3\"><h4 class=\"m-0\">{e(state.Person.FullName)}</h4>"
                + $"{badge(stage.ToDisplayText(), stage.ToBootstrapColor().ToString().ToLower())}</div>");

            sb.Append("<div class=\"row\">");
            sb.Append(section("Молодой специалист", new (string, string)[] {
                ("ИИН", e(state.Person.Iin)),
                ("Дата рождения", d(state.Person.BirthDate)),
                ("Телефон", e(state.Person.Phone)),
                ("e-mail", e(state.Person.Email)),
                ("Адрес", e(state.Person.Address)),
            }));
            sb.Append(section("Обучение", new (string, string)[] {
                ("Организация образования", e(state.Study.UniversityName)),
                ("Специальность", e(string.Join(" ", new[] { state.Study.SpecialityCode, state.Study.SpecialityName }.Where(x => x != null)))),
                ("Уровень", e(RefEducationLevel.Texts[state.Study.EducationLevel])),
                ("Категория гранта", e(state.Study.GrantCategory is { } c ? RefGrantCategory.Texts[c] : null)),
                ("Годы обучения", e($"{state.Study.EnrollmentYear?.ToString() ?? "?"} – {state.Study.GraduationYear?.ToString() ?? "?"}")),
                ("Движение", $"{e(state.Study.Movement.ToDisplayText())} ({d(state.Study.MovementDate)})"),
                ("Приказ", e(state.Study.OrderNumber == null ? null : $"№ {state.Study.OrderNumber} от {d(state.Study.OrderDate)}")),
                ("Бюджетные расходы", m(state.Study.BudgetCost)),
            }));
            sb.Append("</div>");

            if (state.Obligation is { } o) {
                var worked = GrantRules.TotalWorkedMonths(state, today);
                var activeDeferral = state.Deferrals.FirstOrDefault(x => x.IsActive(today));
                sb.Append("<div class=\"row\">");
                sb.Append(section("Обязательство по отработке", new (string, string)[] {
                    ("Статус мониторинга", e(o.MonitoringStatus is { } ms ? RefMonitoringStatus.Texts[ms] : "не установлен")),
                    ("Статус взыскания (ТКС)", e(RefRecoveryStatus.Texts[o.RecoveryStatus])),
                    ("Отработано", $"{worked} из {o.RequiredMonths} мес."),
                    ("Срок явки", d(GrantRules.ArrivalDeadline(state))),
                    ("Отсрочка", activeDeferral == null ? "—" : $"{e(RefDeferralType.Texts[activeDeferral.Type])} до {d(activeDeferral.Until)}"),
                    ("Льгота", e(o.Benefit is { } b ? RefBenefit.Texts[b] : null)),
                    ("Освобождение", o.ReleaseReason is { } rr ? $"{e(RefReleaseReason.Texts[rr])} ({d(o.ReleasedAt)})" : "—"),
                    ("Прекращение", o.TerminationReason is { } tr ? $"{e(RefTerminationReason.Texts[tr])} ({d(o.TerminatedAt ?? o.CompletedAt)})" : "—"),
                }));
                sb.Append(section("Возмещение бюджетных средств", new (string, string)[] {
                    ("Сумма к возмещению", m(o.DebtAmount)),
                    ("Оплачено", m(GrantRules.PaidAmount(state.Payments))),
                    ("Остаток", m(GrantRules.DebtBalance(state))),
                }));
                sb.Append("</div>");
            }

            sb.Append(table("Распределение", new[] { "Протокол", "Тип места", "Работодатель", "Направление", "Явка" },
                state.Assignments.OrderBy(a => a.CreatedAt).Select(a => new[] {
                    $"{(a.Kind == AssignmentKind.Main ? "Осн." : "Доп.")} № {e(a.ProtocolNumber)} от {d(a.ProtocolDate)}",
                    e(a.PlacementType is { } pt ? RefPlacementType.Texts[pt] : null),
                    $"{e(a.EmployerName)}<br><small>БИН {e(a.EmployerBin)}, {e(a.Region)}</small>",
                    a.DirectionNumber == null ? "—" : $"№ {e(a.DirectionNumber)} от {d(a.DirectionDate)}",
                    d(a.WorkStart),
                })));
            sb.Append(table("Периоды работы", new[] { "Работодатель", "Должность", "Период", "Источник" },
                state.WorkPeriods.OrderBy(w => w.From).Select(w => new[] {
                    $"{e(w.EmployerName)}<br><small>БИН {e(w.EmployerBin)}</small>",
                    e(w.Position),
                    $"{d(w.From)} – {(w.To == null ? "н.в." : d(w.To))}",
                    e(RefWorkConfirmationSource.Texts[w.Source]),
                })));
            sb.Append(table("Отсрочки", new[] { "Вид", "Период", "Документ", "Завершена" },
                state.Deferrals.OrderBy(x => x.From).Select(x => new[] {
                    e(RefDeferralType.Texts[x.Type]),
                    $"{d(x.From)} – {d(x.Until)}",
                    x.DocumentNumber == null ? "—" : $"№ {e(x.DocumentNumber)} от {d(x.DocumentDate)}",
                    d(x.EndedAt),
                })));
            sb.Append(table("Платежи", new[] { "Дата", "Сумма", "Документ" },
                state.Payments.OrderBy(p => p.PaidAt).Select(p => new[] { d(p.PaidAt), m(p.Amount), e(p.DocumentNumber) })));
            sb.Append(table("Примечания", new[] { "Дата", "Автор", "Текст" },
                state.Notes.OrderByDescending(n => n.At).Select(n => new[] { n.At.ToString("dd.MM.yyyy HH:mm"), e(n.Author), e(n.Text) })));

            panel.Append(new HtmlTextV2(sb.ToString(), HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
        }

        /// <summary>Кнопки операций, доступных пользователю для этого гранта.</summary>
        public static void RenderOperations(WidgetBase panel, GrantState state, IYodaRequestContext context) {
            var user = context.GetUserContextForGrantOp();
            var buttons = AllGrantOps.All
                .Where(op => op.AvailableInUi && op.OpType != GrantOpType.Create && op.CheckAvailable(state, user).ok)
                .Select(op => $"<a class=\"btn btn-sm btn-outline-{op.OpType.ToBootstrapColor().ToString().ToLower()} me-1 mb-1\" href=\"{e(op.GetCreateUrl(context, state.GrantId))}\">"
                    + $"<i class=\"{op.OpType.ToIconClass()}\"></i> {e(op.OpType.ToDisplayText())}</a>")
                .ToArray();
            if (user.Is(GrantActor.Monitoring | GrantActor.Accounting)) {
                buttons = buttons.Concat(Enum.GetValues<GrantCertificateKind>()
                    .Where(kind => MnuGrantCertificate.IsAvailable(state, kind))
                    .Select(kind => $"<a class=\"btn btn-sm btn-outline-success me-1 mb-1\" target=\"_blank\" href=\"{e(context.YodaActionUrl(GrantsModule.ModuleName, MnuGrantCertificate.MnuName, new GrantCertificateArgs { GrantId = state.GrantId.Id, Kind = kind }))}\">"
                        + $"<i class=\"mdi mdi-file-certificate-outline\"></i> {e(MnuGrantCertificate.Title(kind))}</a>"))
                    .ToArray();
            }
            if (buttons.Length == 0) {
                return;
            }
            panel.Append(new HtmlTextV2($"<div class=\"mb-3\">{string.Concat(buttons)}</div>", HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
        }

        /// <summary>Журнал операций по гранту.</summary>
        public static void RenderJournal(WidgetBase panel, GrantState state, IYodaRequestContext context) {
            var rows = GrantsStore.Instance.TbOpState()
                .AddFilter(t => t.flGrantId, state.GrantId.Id)
                .Order(t => t.flInvokedAt, OrderType.Desc)
                .Select(t => new FieldAlias[] { t.flOperationId, t.flOperationType, t.flOperationNumber, t.flSummary, t.flInvokedAt, t.flInvokedByName, t.flInvokedByLogin }, context.QueryExecuter)
                .Take(1000)
                .Select(r => {
                    var type = r.GetVal(t => t.flOperationType);
                    var url = context.YodaActionUrl(GrantsModule.ModuleName, MnuGrantOp.MnuName, new GrantOpQueryArgs {
                        GrantId = state.GrantId.Id,
                        OperationId = r.GetVal(t => t.flOperationId),
                        MenuAction = $"{type}View",
                    });
                    return new[] {
                        r.GetVal(t => t.flInvokedAt).ToString("dd.MM.yyyy HH:mm"),
                        $"<a href=\"{e(url)}\">{e(type.ToDisplayText())} № {e(r.GetVal(t => t.flOperationNumber))}</a>",
                        e(r.GetVal(t => t.flSummary)),
                        e(r.GetVal(t => t.flInvokedByName) ?? r.GetVal(t => t.flInvokedByLogin)),
                    };
                });
            panel.Append(new HtmlTextV2(table("Журнал операций", new[] { "Дата", "Операция", "Содержание", "Исполнитель" }, rows), HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
        }

        private static string section(string title, (string label, string value)[] rows) {
            var sb = new StringBuilder($"<div class=\"col-lg-6\"><div class=\"card mb-3\"><div class=\"card-body\"><h5 class=\"card-title\">{e(title)}</h5><dl class=\"row mb-0\">");
            foreach (var (label, value) in rows) {
                sb.Append($"<dt class=\"col-sm-5\">{e(label)}</dt><dd class=\"col-sm-7\">{value}</dd>");
            }
            sb.Append("</dl></div></div></div>");
            return sb.ToString();
        }

        /// <summary>Таблица; ячейки должны быть уже экранированы.</summary>
        private static string table(string title, string[] headers, IEnumerable<string[]> rows) {
            var list = rows.ToList();
            if (list.Count == 0) {
                return string.Empty;
            }
            var sb = new StringBuilder($"<div class=\"card mb-3\"><div class=\"card-body\"><h5 class=\"card-title\">{e(title)}</h5><div class=\"table-responsive\"><table class=\"table table-sm mb-0\"><thead><tr>");
            foreach (var header in headers) {
                sb.Append($"<th>{e(header)}</th>");
            }
            sb.Append("</tr></thead><tbody>");
            foreach (var row in list) {
                sb.Append("<tr>");
                foreach (var cell in row) {
                    sb.Append($"<td>{cell}</td>");
                }
                sb.Append("</tr>");
            }
            sb.Append("</tbody></table></div></div></div>");
            return sb.ToString();
        }
    }
}
