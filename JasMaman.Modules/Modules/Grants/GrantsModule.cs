using JasMaman.Modules.Common;
using JasMaman.Modules.Grants.Diagnostics;
using JasMaman.Modules.Grants.Jobs;
using JasMaman.Modules.Grants.Menus;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoda.Interfaces;
using Yoda.Interfaces.Menu;
using YodaQuery;

namespace JasMaman.Modules.Grants {
    /// <summary>Молодые специалисты: учёт обучающихся по гранту, распределение, мониторинг отработки, взыскание.</summary>
    public class GrantsModule : YodaModule {
        public new const string ModuleName = nameof(GrantsModule);
        public override string Text => "Молодые специалисты";

        public static class MenuNames {
            public const string Group = "MnuGrantsGroup",
                                All = "MnuGrantsAll",
                                Studying = "MnuGrantsStudying",
                                Expected = "MnuGrantsExpected",
                                Monitoring = "MnuGrantsMonitoring",
                                ArrivalOverdue = "MnuGrantsArrivalOverdue",
                                Deferrals = "MnuGrantsDeferrals",
                                LegalDepartment = "MnuGrantsLegalDepartment",
                                Enforcement = "MnuGrantsEnforcement",
                                Debtors = "MnuGrantsDebtors",
                                Closed = "MnuGrantsClosed";
        }

        public override ReferenceInfo[] ReferenceItems(IQueryExecuter queryExecuter) => new[] {
            new ReferenceInfo(RefGrantStage.RefName, () => new RefGrantStage()),
            new ReferenceInfo(RefGrantOpType.RefName, () => new RefGrantOpType()),
            new ReferenceInfo(RefStudentMovement.RefName, () => new RefStudentMovement()),
            new ReferenceInfo(RefAssignmentKind.RefName, () => new RefAssignmentKind()),
            new ReferenceInfo(RefWorkConfirmationSource.RefName, () => new RefWorkConfirmationSource()),
        };

        public override QueryTable[] DataSchema() => GrantsStore.Instance.DataSchema();

        public override void ConfigureServices(IServiceCollection serviceCollection, IConfiguration configuration) {
            serviceCollection
                .UseMigrateGrantsJobConsumer()
                .UseDeferralControlJob()
                .UseGrantSelfTestIfRequested(configuration);
        }

        private static readonly string[] staffAndUniversity = { Projects.Moderator, Projects.Internal, Projects.University };

        public override MenuLink[] Menu() => new MenuLink[] {
            new EmptyMenuLink(MenuNames.Group, "Молодые специалисты", "grants") {
                ProjectsConfig = new ProjectsConfiguration { ProjectsList = new ProjectsList { Projects = staffAndUniversity } },
                Weight = 1,
            },

            list(MenuNames.All, "Все", "grants/all", staffAndUniversity),
            list(MenuNames.Studying, "Обучаются", "grants/studying", staffAndUniversity,
                t => t.AddFilter(x => x.flStage, GrantStage.Studying)),
            list(MenuNames.Expected, "Ожидаемый выпуск", "grants/expected", staffAndUniversity,
                t => t.AddFilter(x => x.flStage, GrantStage.ExpectedGraduation)),
            list(MenuNames.Monitoring, "Отработка", "grants/monitoring", staffAndUniversity,
                t => t.AddFilter(x => x.flStage, GrantStage.Obligation)),
            list(MenuNames.ArrivalOverdue, "Срок явки истёк", "grants/arrival-overdue", Projects.Staff,
                t => t
                    .AddFilter(x => x.flStage, GrantStage.Obligation)
                    .AddFilter(x => x.flArrivalDeadline, ConditionOperator.Less, DateTime.Today)
                    .AddFilter(x => x.flWorkedMonths, 0)
                    .AddFilter(x => x.flDeferralUntil, DBNull.Value)),
            list(MenuNames.Deferrals, "Отсрочки", "grants/deferrals", staffAndUniversity,
                t => t.AddFilter(x => x.flDeferralUntil, ConditionOperator.NotEqual, DBNull.Value)),
            list(MenuNames.LegalDepartment, "В ЮРДЕПе", "grants/legal", Projects.Staff,
                t => t.AddFilter(x => x.flRecoveryStatus, RecoveryStatus.LegalDepartment)),
            list(MenuNames.Enforcement, "Исполнительное производство", "grants/enforcement", Projects.Staff,
                t => t.AddFilter(x => x.flRecoveryStatus, RecoveryStatus.EnforcementProceedings)),
            list(MenuNames.Debtors, "Возмещение средств", "grants/debtors", Projects.Staff,
                t => t.AddFilter(x => x.flDebtBalance, ConditionOperator.Greate, 0m)),
            list(MenuNames.Closed, "Обязательство закрыто", "grants/closed", staffAndUniversity,
                t => t.AddFilter(x => x.flStage, GrantStage.Closed)),

            new MnuGrantStats()
                .ProjectsConfig(Projects.Staff)
                .Path("grants/stats"),

            new MnuGrantCertificate()
                .ProjectsConfig(Projects.Staff)
                .AsCallback()
                .Path("grants/certificate/{GrantId}/{Kind}"),

            new MnuWorkImport()
                .ProjectsConfig(Projects.Staff)
                .Path("grants/import-work"),

            new MnuGrantView(ModuleName)
                .ProjectsConfig(staffAndUniversity)
                .AsCallback()
                .Path("grants/card/{GrantId}"),

            new MnuGrantOp(ModuleName)
                .ProjectsConfig(staffAndUniversity)
                .AsCallback()
                .Path("grants/op/{GrantId}/{OperationId}/{MenuAction}"),
        };

        private static MenuLink list(string name, string text, string path, string[] projects, Func<TbGrantState, TbGrantState>? preset = null)
            => new MnuGrantList(name, text, preset)
                .ProjectsConfig(projects)
                .Path(path);
    }
}
