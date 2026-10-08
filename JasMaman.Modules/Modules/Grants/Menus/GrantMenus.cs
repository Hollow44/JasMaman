using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using Yoda.Interfaces.Forms.Components;
using Yoda.Interfaces.Menu;
using YodaApp;
using YodaApp.UiSearch;
using YodaHelpers.ActionMenus;
using YodaQuery;

namespace JasMaman.Modules.Grants.Menus {
    /// <summary>
    /// Реестр грантников. Один класс на все реестры БП — отличаются предустановленным фильтром
    /// (ожидаемый выпуск, мониторинг, не прибывшие, ЮРДЕП, истекающие отсрочки …).
    /// Сотрудник вуза всегда видит только студентов своей организации.
    /// </summary>
    public class MnuGrantList : FrmMenu {
        public const string MnuName = nameof(MnuGrantList);

        public MnuGrantList(string menuName, string text, Func<TbGrantState, TbGrantState>? preset = null) : base(menuName, text) {
            AccessCheck((args, context) => new AccessCheckResult {
                HasAccess = context.User.IsAuthentificated && context.GetUserContextForGrantOp().Actors != GrantActor.None
            });
            OnRendering(re => {
                var context = re.RequestContext;
                var user = context.GetUserContextForGrantOp();

                var table = GrantsStore.Instance.TbState();
                if (preset != null) {
                    table = preset(table);
                }
                if (!user.Is(GrantActor.Monitoring | GrantActor.MonitoringHead | GrantActor.Legal | GrantActor.Accounting)) {
                    table = table.AddFilter(t => t.flUniversityBin, user.Xin);
                }

                var canCreate = AllGrantOps.Create.CheckAvailable(null, user).ok;
                table
                    .Order(t => t.flFullName)
                    .Search(search => search
                        .Toolbar(toolbar => toolbar.AddIf(canCreate,
                            new LinkUrl(re.RequestContext.T("Зарегистрировать обучающегося"), AllGrantOps.Create.GetCreateUrl(context, null), "btn btn-secondary")))
                        .Filtering(filter => filter
                            .AddField(t => t.flIin)
                            .AddField(t => t.flFullName)
                            .AddField(t => t.flUniversityName)
                            .AddField(t => t.flGrantCategory)
                            .AddField(t => t.flEducationLevel)
                            .AddField(t => t.flGraduationYear)
                            .AddField(t => t.flStage)
                            .AddField(t => t.flMovement)
                            .AddField(t => t.flMonitoringStatus)
                            .AddField(t => t.flRecoveryStatus)
                        )
                        .TablePresentation(
                            t => new FieldAlias[] {
                                t.flGrantId, t.flIin, t.flFullName, t.flUniversityName, t.flEducationLevel, t.flGrantCategory,
                                t.flGraduationYear, t.flStage, t.flMonitoringStatus, t.flRecoveryStatus, t.flWorkedMonths, t.flDebtBalance,
                            },
                            t => new[] {
                                t.Column("Действия", (env, r) => new LinkUrl(
                                    "Открыть",
                                    env.YodaActionUrl(GrantsModule.ModuleName, MnuGrantView.MnuName, new GrantViewQueryArgs { GrantId = r.GetVal(x => x.flGrantId) })
                                ), width: new WidthAttr(80, WidthMeasure.Px)),
                                t.Column(t => t.flIin),
                                t.Column(t => t.flFullName),
                                t.Column(t => t.flUniversityName),
                                t.Column(t => t.flEducationLevel),
                                t.Column(t => t.flGraduationYear),
                                t.Column(t => t.flStage),
                                t.Column(t => t.flMonitoringStatus),
                                t.Column(t => t.flRecoveryStatus),
                                t.Column(t => t.flWorkedMonths),
                                t.Column(t => t.flDebtBalance),
                            }
                        )
                        .ExcelPresentation(
                            t => new FieldAlias[] {
                                t.flIin, t.flFullName, t.flUniversityName, t.flSpecialityName, t.flEducationLevel, t.flGrantCategory,
                                t.flGraduationYear, t.flMovement, t.flStage, t.flMonitoringStatus, t.flRecoveryStatus,
                                t.flWorkedMonths, t.flRequiredMonths, t.flArrivalDeadline, t.flDeferralUntil, t.flDebtBalance,
                            },
                            t => new[] {
                                t.ExcelColumn(t => t.flIin, width: 14),
                                t.ExcelColumn(t => t.flFullName, width: 40),
                                t.ExcelColumn(t => t.flUniversityName, width: 50),
                                t.ExcelColumn(t => t.flSpecialityName, width: 40),
                                t.ExcelColumn(t => t.flEducationLevel, width: 16),
                                t.ExcelColumn(t => t.flGrantCategory, width: 24),
                                t.ExcelColumn(t => t.flGraduationYear, width: 10),
                                t.ExcelColumn(t => t.flMovement, width: 24),
                                t.ExcelColumn(t => t.flStage, width: 22),
                                t.ExcelColumn(t => t.flMonitoringStatus, width: 24),
                                t.ExcelColumn(t => t.flRecoveryStatus, width: 20),
                                t.ExcelColumn(t => t.flWorkedMonths, width: 10),
                                t.ExcelColumn(t => t.flRequiredMonths, width: 10),
                                t.ExcelColumn(t => t.flArrivalDeadline, width: 12),
                                t.ExcelColumn(t => t.flDeferralUntil, width: 12),
                                t.ExcelColumn(t => t.flDebtBalance, width: 14),
                            }
                        )
                    )
                    .Print(re.Form, re.AsFormEnv(), re.Form);
            });
        }
    }

    public class GrantViewQueryArgs : ActionQueryArgsBase {
        public long GrantId { get; set; }
    }

    /// <summary>Карточка гранта: данные, доступные операции, журнал.</summary>
    public class MnuGrantView : MnuActionsExt<GrantViewQueryArgs> {
        public const string MnuName = nameof(MnuGrantView);

        public MnuGrantView(string moduleName) : base(moduleName, MnuName, "Карточка молодого специалиста") { }

        protected override string GetDefaultActionName() => Actions.View;

        public override void Configure(ActionConfig<GrantViewQueryArgs> config) {
            config.OnAction(Actions.View, action => action
                .IsValid(async env => {
                    var state = await GrantState.TryGet(new GrantId(env.Args.GrantId), env.QueryExecuter, env.RequestContext.GetMemoryCache());
                    return state != null && env.RequestContext.GetUserContextForGrantOp().CanSee(state)
                        ? new OkResult()
                        : new AccessDeniedResult();
                })
                .OnRendering(async re => {
                    var state = await GrantState.Get(new GrantId(re.Args.GrantId), re.QueryExecuter, re.RequestContext.GetMemoryCache());
                    GrantCardRenderer.RenderOperations(re.Form, state, re.RequestContext);
                    GrantCardRenderer.RenderCard(re.Form, state, re.RequestContext);
                    GrantCardRenderer.RenderJournal(re.Form, state, re.RequestContext);
                })
            );
        }

        public static class Actions {
            public const string View = "view";
        }
    }

    /// <summary>Точка входа всех операций по гранту (мастер создания и просмотр записи журнала).</summary>
    public class MnuGrantOp : MnuActionsExt<GrantOpQueryArgs> {
        public const string MnuName = nameof(MnuGrantOp);

        public MnuGrantOp(string moduleName) : base(moduleName, MnuName, "Операция по молодому специалисту") { }

        public override void Configure(ActionConfig<GrantOpQueryArgs> config)
            => config.UseGrantOperations(ModuleName, MnuName, AllGrantOps.All.Where(x => x.AvailableInUi || x.OpType == GrantOpType.Import));
    }
}
