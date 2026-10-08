using System.Net;
using System.Text;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Yoda.Interfaces.Menu;

namespace JasMaman.Modules.Grants.Menus {
    public enum GrantCertificateKind {
        /// <summary>Справка о полном погашении задолженности.</summary>
        FullRepayment,
        /// <summary>Справка о соразмерном возврате (частичная отработка + оплата остатка).</summary>
        ProportionalRepayment,
        /// <summary>Справка об исполнении обязательства по отработке.</summary>
        ObligationFulfilled,
    }

    public class GrantCertificateArgs {
        public long GrantId { get; set; }
        public GrantCertificateKind Kind { get; set; }
    }

    /// <summary>
    /// Печатные справки (БП 3.6). Шаблон выбирается по виду; ФИО в именительном падеже,
    /// поэтому склонение по ГБД ФЛ не требуется.
    /// </summary>
    public class MnuGrantCertificate : FrmMenu<GrantCertificateArgs> {
        public const string MnuName = nameof(MnuGrantCertificate);

        public MnuGrantCertificate() : base(MnuName, "Справка") {
            AccessCheck(async (args, context) => {
                if (!context.User.IsAuthentificated) {
                    return new AccessCheckResult { HasAccess = false };
                }
                var user = context.GetUserContextForGrantOp();
                var state = await GrantState.TryGet(new GrantId(args.GrantId), context.QueryExecuter, context.GetMemoryCache());
                return new AccessCheckResult { HasAccess = state != null && user.Is(GrantActor.Monitoring | GrantActor.Accounting) && IsAvailable(state, args.Kind) };
            });
            ViewName("PdfView");
            OnRendering(async re => {
                var state = await GrantState.Get(new GrantId(re.Args.GrantId), re.QueryExecuter, re.RequestContext.GetMemoryCache());
                re.Form.Append(new HtmlTextV2(Render(state, re.Args.Kind, DateTime.Today), HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
            });
        }

        public static bool IsAvailable(GrantState state, GrantCertificateKind kind) {
            var obligation = state.Obligation;
            var repaid = obligation?.DebtAmount > 0 && GrantRules.DebtBalance(state) == 0;
            var worked = GrantRules.TotalWorkedMonths(state, DateTime.Today);
            return kind switch {
                GrantCertificateKind.FullRepayment => repaid && worked == 0,
                GrantCertificateKind.ProportionalRepayment => repaid && worked > 0,
                GrantCertificateKind.ObligationFulfilled => obligation?.CompletedAt != null,
                _ => false
            };
        }

        public static string Title(GrantCertificateKind kind) => kind switch {
            GrantCertificateKind.FullRepayment => "Справка о полном погашении",
            GrantCertificateKind.ProportionalRepayment => "Справка о соразмерном возврате",
            GrantCertificateKind.ObligationFulfilled => "Справка об исполнении обязательства",
            _ => throw new ArgumentOutOfRangeException(nameof(kind))
        };

        public static string Render(GrantState state, GrantCertificateKind kind, DateTime today) {
            string e(object? v) => WebUtility.HtmlEncode(v?.ToString() ?? "");
            var level = RefEducationLevel.Texts[state.Study.EducationLevel].ToLowerInvariant();
            var study = $"{level}, {state.Study.UniversityName}{(state.Study.GraduationYear is { } y ? $", год выпуска {y}" : "")}";
            var paid = GrantRules.PaidAmount(state.Payments);
            var payments = string.Join(", ", state.Payments.OrderBy(p => p.PaidAt).Select(p => $"{p.Amount:N2} тг ({p.PaidAt:dd.MM.yyyy}{(p.DocumentNumber == null ? "" : ", № " + p.DocumentNumber)})"));

            var body = kind switch {
                GrantCertificateKind.FullRepayment =>
                    $"полностью возместил(а) бюджетные средства, затраченные на обучение по государственному образовательному гранту ({e(study)}), "
                    + $"в сумме {paid:N2} тенге. Платежи: {e(payments)}.",
                GrantCertificateKind.ProportionalRepayment =>
                    $"отработал(а) {GrantRules.TotalWorkedMonths(state, today)} мес. из {state.Obligation!.RequiredMonths} установленных и возместил(а) "
                    + $"бюджетные средства соразмерно неотработанному сроку ({e(study)}) в сумме {paid:N2} тенге. Платежи: {e(payments)}.",
                GrantCertificateKind.ObligationFulfilled =>
                    $"исполнил(а) обязательство по отработке после обучения по государственному образовательному гранту ({e(study)}) "
                    + $"{state.Obligation!.CompletedAt:dd.MM.yyyy}.",
                _ => throw new ArgumentOutOfRangeException(nameof(kind))
            };

            var sb = new StringBuilder();
            sb.Append("<div style=\"max-width:780px;margin:40px auto;font-family:'Times New Roman',serif;font-size:15pt;line-height:1.5\">");
            sb.Append("<p style=\"text-align:right\">АО «Финансовый центр»</p>");
            sb.Append($"<h3 style=\"text-align:center\">{e(Title(kind)).ToUpperInvariant()}</h3>");
            sb.Append($"<p style=\"text-align:center\">№ {state.GrantId.Id}-{today:yyyyMMdd} от {today:dd.MM.yyyy}</p>");
            sb.Append($"<p style=\"text-indent:2em;text-align:justify\">Настоящим подтверждается, что {e(state.Person.FullName)} (ИИН {e(state.Person.Iin)}) {body}</p>");
            sb.Append("<p style=\"text-indent:2em\">Справка выдана для предъявления по месту требования.</p>");
            sb.Append("<p style=\"margin-top:60px\">Руководитель ______________________</p>");
            sb.Append("<p class=\"d-print-none\" style=\"margin-top:40px\"><button class=\"btn btn-primary\" onclick=\"window.print()\">Печать</button></p>");
            sb.Append("</div>");
            return sb.ToString();
        }
    }
}
