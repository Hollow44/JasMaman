using JasMaman.Modules.Common;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Yoda.Interfaces.Menu;
using YodaApp.CommonWorkers;
using YodaApp.DbQueues;
using YodaApp.UiSearch;

namespace JasMaman.Modules.Notifications {
    /// <summary>Уведомления МС: формирование, утверждение руководителем, отправка и контроль доставки.</summary>
    public class NotificationsModule : YodaModule {
        public new const string ModuleName = nameof(NotificationsModule);
        public override string Text => "Уведомления";

        public const string SenderTimerName = "JasMamanNotificationsSender (Отправка уведомлений МС и проверка доставки)";

        public static class MenuNames {
            public const string List = "MnuNotifications",
                                Compose = "MnuNotificationsCompose",
                                Approve = "MnuNotificationsApprove";
        }

        public override ReferenceInfo[] ReferenceItems(IQueryExecuter queryExecuter) => new[] {
            new ReferenceInfo(RefNotificationChannel.RefName, () => new RefNotificationChannel()),
            new ReferenceInfo(RefNotificationKind.RefName, () => new RefNotificationKind()),
            new ReferenceInfo(RefNotificationStatus.RefName, () => new RefNotificationStatus()),
        };

        public override QueryTable[] DataSchema() => new QueryTable[] { new TbNotification() };

        public override void ConfigureServices(IServiceCollection serviceCollection, IConfiguration configuration) {
            serviceCollection.TryAddSingleton<INotificationGateway, LoggingNotificationGateway>();
            serviceCollection.AddNamedTimer(new NamedTimer(SenderTimerName, (int)TimeSpan.FromMinutes(5).TotalMilliseconds, async env => {
                var gateway = env.ServiceProvider.GetRequiredService<INotificationGateway>();
                var (sent, failed) = await NotificationService.SendApprovedAsync(gateway, env.QueryExecuter, env.ServiceProvider.GetRequiredService<IMemoryCache>());
                var delivered = await NotificationService.RefreshDeliveryAsync(gateway, env.QueryExecuter);
                return HealthCheckResult.Healthy($"Отправлено {sent}, ошибок {failed}, обновлено статусов {delivered}");
            }));
        }

        private static AccessCheckResult access(IYodaRequestContext context, GrantActor actor)
            => new() { HasAccess = context.User.IsAuthentificated && context.GetUserContextForGrantOp().Is(actor) };

        public override MenuLink[] Menu() => new MenuLink[] {
            new FrmMenu(MenuNames.List, "Уведомления")
                .ProjectsConfig(Projects.Staff)
                .Path("ms-notifications/list")
                .AccessCheck((args, context) => access(context, GrantActor.Monitoring))
                .OnRendering(re => {
                    new TbNotification()
                        .Order(t => t.flCreatedAt, OrderType.Desc)
                        .Search(search => search
                            .Filtering(filter => filter
                                .AddField(t => t.flStatus)
                                .AddField(t => t.flKind)
                                .AddField(t => t.flChannel)
                                .AddField(t => t.flIin)
                                .AddField(t => t.flFullName)
                            )
                            .TablePresentation(
                                t => new FieldAlias[] { t.flNotificationId, t.flCreatedAt, t.flIin, t.flFullName, t.flKind, t.flChannel, t.flStatus, t.flSentAt, t.flProviderId, t.flError },
                                t => new[] {
                                    t.Column(t => t.flCreatedAt), t.Column(t => t.flIin), t.Column(t => t.flFullName), t.Column(t => t.flKind),
                                    t.Column(t => t.flChannel), t.Column(t => t.flStatus), t.Column(t => t.flSentAt), t.Column(t => t.flProviderId), t.Column(t => t.flError),
                                }
                            )
                            .ExcelPresentation(
                                t => new FieldAlias[] { t.flIin, t.flFullName, t.flKind, t.flChannel, t.flAddress, t.flText, t.flStatus, t.flSentAt },
                                t => new[] {
                                    t.ExcelColumn(t => t.flIin, width: 14), t.ExcelColumn(t => t.flFullName, width: 40), t.ExcelColumn(t => t.flKind, width: 26),
                                    t.ExcelColumn(t => t.flChannel, width: 24), t.ExcelColumn(t => t.flAddress, width: 50), t.ExcelColumn(t => t.flText, width: 100),
                                    t.ExcelColumn(t => t.flStatus, width: 20), t.ExcelColumn(t => t.flSentAt, width: 16),
                                }
                            )
                        )
                        .Print(re.Form, re.AsFormEnv(), re.Form);
                }),

            new FrmMenu(MenuNames.Compose, "Сформировать уведомления")
                .ProjectsConfig(Projects.Staff)
                .Path("ms-notifications/compose")
                .AccessCheck((args, context) => access(context, GrantActor.Monitoring))
                .OnRendering(re => {
                    var env = re.AsFormEnv();
                    var f = GrantOpForm.Instance;
                    var nf = NotificationForm.Instance;
                    re.Form.Append(new Label("Отбор молодых специалистов с открытым обязательством по отработке. Уведомления создаются черновиками и отправляются после утверждения руководителем."));
                    nf.flKind.RenderT(re.Form, env, NotificationKind.ObligationReminder);
                    nf.flChannel.RenderT(re.Form, env, NotificationChannel.HybridMail);
                    f.flUniversityBin.RenderT(re.Form, env, null);
                    f.flGrantCategory.RenderT(re.Form, env, null);
                    f.flGraduationYear.RenderT(re.Form, env, null);
                    f.flMonitoringStatus.RenderT(re.Form, env, null);
                    re.Form.AddSubmitButton("Сформировать");
                })
                .OnProcessing(async pe => {
                    var env = pe.AsFormEnv();
                    var f = GrantOpForm.Instance;
                    var nf = NotificationForm.Instance;
                    nf.flKind.ValidateT(env, o => o.Required());
                    nf.flChannel.ValidateT(env, o => o.Required());
                    f.flUniversityBin.ValidateT(env);
                    f.flGrantCategory.ValidateT(env);
                    f.flGraduationYear.ValidateT(env);
                    f.flMonitoringStatus.ValidateT(env);
                    if (!env.IsValid) {
                        return;
                    }

                    var query = GrantsStore.Instance.TbState().AddFilter(t => t.flStage, GrantStage.Obligation);
                    if (GrantOpForm.Clean(f.flUniversityBin.GetValueOrNullT(env)) is { } bin) {
                        query = query.AddFilter(t => t.flUniversityBin, bin);
                    }
                    if (f.flGrantCategory.GetValueOrNullT(env) is { } category) {
                        query = query.AddFilter(t => t.flGrantCategory, category);
                    }
                    if (f.flGraduationYear.GetValueOrNullT(env) is { } year) {
                        query = query.AddFilter(t => t.flGraduationYear, year);
                    }
                    if (f.flMonitoringStatus.GetValueOrNullT(env) is { } status) {
                        query = query.AddFilter(t => t.flMonitoringStatus, status);
                    }
                    var grantIds = query.Select(t => new FieldAlias[] { t.flGrantId }, pe.QueryExecuter).Take(5000).Select(r => r.GetVal(t => t.flGrantId)).ToList();

                    var kind = nf.flKind.GetValueOrNullT(env)!.Value;
                    var channel = nf.flChannel.GetValueOrNullT(env)!.Value;
                    var author = pe.RequestContext.GetUserContextForGrantOp().Name;
                    int created = 0;
                    foreach (var grantId in grantIds) {
                        var state = await GrantState.Get(new GrantId(grantId), pe.QueryExecuter, pe.RequestContext.GetMemoryCache());
                        if (NotificationService.CreateDraft(state, kind, channel, author, pe.QueryExecuter)) {
                            created++;
                        }
                    }
                    pe.SetPostbackMessage($"Отобрано {grantIds.Count}, создано черновиков: {created} (по остальным уже есть неотправленные уведомления этого вида)");
                }),

            new FrmMenu(MenuNames.Approve, "Утверждение уведомлений")
                .ProjectsConfig(Projects.Staff)
                .Path("ms-notifications/approve")
                .AccessCheck((args, context) => access(context, GrantActor.MonitoringHead))
                .OnRendering(re => {
                    var drafts = new TbNotification()
                        .AddFilter(t => t.flStatus, NotificationStatus.Draft)
                        .Select(t => new FieldAlias[] { t.flKind, t.flChannel }, re.QueryExecuter)
                        .Select(r => (kind: r.GetVal(t => t.flKind), channel: r.GetVal(t => t.flChannel)))
                        .GroupBy(x => x)
                        .Select(g => $"{NotificationTexts.Kinds[g.Key.kind]} — {NotificationTexts.Channels[g.Key.channel]}: {g.Count()}")
                        .ToList();
                    re.Form.Append(new Label(drafts.Count == 0 ? "Черновиков нет" : "Черновики к утверждению: " + string.Join("; ", drafts)));
                    if (drafts.Count > 0) {
                        NotificationForm.Instance.flDecision.RenderT(re.Form, re.AsFormEnv(), YesNo.Yes);
                        re.Form.AddSubmitButton("Применить");
                    }
                })
                .OnProcessing(pe => {
                    var env = pe.AsFormEnv();
                    NotificationForm.Instance.flDecision.ValidateT(env, o => o.Required());
                    if (!env.IsValid) {
                        return;
                    }
                    if (NotificationForm.Instance.flDecision.GetValueOrNullT(env) == YesNo.Yes) {
                        var count = NotificationService.ApproveDrafts(pe.RequestContext.GetUserContextForGrantOp().Name, pe.QueryExecuter);
                        pe.SetPostbackMessage($"Утверждено уведомлений: {count}. Отправка выполняется автоматически в течение 5 минут.");
                    } else {
                        var count = NotificationService.CancelDrafts(pe.QueryExecuter);
                        pe.SetPostbackMessage($"Отменено черновиков: {count}");
                    }
                }),
        };
    }

    /// <summary>Поля форм модуля уведомлений.</summary>
    public class NotificationForm : QueryTable {
        public static readonly NotificationForm Instance = new();

        public NotificationForm() : base(nameof(NotificationForm), "Уведомление") {
            Fields = new Field[] {
                new RefField<RefNotificationKind, NotificationKind>(nameof(flKind), "Вид уведомления"),
                new RefField<RefNotificationChannel, NotificationChannel>(nameof(flChannel), "Канал"),
                new RefField<RfcYesNo, YesNo>(nameof(flDecision), "Утвердить все черновики (Нет — отменить)"),
            };
        }

        public RefField<RefNotificationKind, NotificationKind> flKind => (RefField<RefNotificationKind, NotificationKind>)this[nameof(flKind)];
        public RefField<RefNotificationChannel, NotificationChannel> flChannel => (RefField<RefNotificationChannel, NotificationChannel>)this[nameof(flChannel)];
        public RefField<RfcYesNo, YesNo> flDecision => (RefField<RfcYesNo, YesNo>)this[nameof(flDecision)];
    }
}
