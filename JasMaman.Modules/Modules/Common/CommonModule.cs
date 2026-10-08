using JasMaman.Modules.References;
using Yoda.Interfaces;
using Yoda.Interfaces.Menu;
using YodaQuery;

namespace JasMaman.Modules.Common {
    public class CommonModule : YodaModule, IProjectTileProvider {
        public override string Text => "Общий модуль";
        public static new string ModuleName = nameof(CommonModule);

        public override ReferenceInfo[] ReferenceItems(IQueryExecuter queryExecuter) => new[] {
            new ReferenceInfo(RfcYesNo.RefName, () => new RfcYesNo()),
            new ReferenceInfo(RefEducationLevel.RefName, () => new RefEducationLevel()),
            new ReferenceInfo(RefGrantCategory.RefName, () => new RefGrantCategory()),
            new ReferenceInfo(RefMonitoringStatus.RefName, () => new RefMonitoringStatus()),
            new ReferenceInfo(RefRecoveryStatus.RefName, () => new RefRecoveryStatus()),
            new ReferenceInfo(RefPlacementType.RefName, () => new RefPlacementType()),
            new ReferenceInfo(RefDeferralType.RefName, () => new RefDeferralType()),
            new ReferenceInfo(RefReleaseReason.RefName, () => new RefReleaseReason()),
            new ReferenceInfo(RefTerminationReason.RefName, () => new RefTerminationReason()),
            new ReferenceInfo(RefBenefit.RefName, () => new RefBenefit()),
        };

        public Task<ProjectTileInfo[]> GetProjectTiles(IYodaRequestContext context) => Task.FromResult(CabinetNavigation.Tiles(context));
        public Task<ProjectTileInfo[]> GetInternalProjectTiles(IYodaRequestContext context) => Task.FromResult(Array.Empty<ProjectTileInfo>());

        public override MenuLink[] Menu() => new MenuLink[] {
            new MnuCabinets()
                .ProjectsConfig(Projects.Public)
                .Path("cabinets"),

            new EmptyMenuLink("MnuCatalogsGroup", "Справочники", "catalogs") {
                ProjectsConfig = new ProjectsConfiguration { ProjectsList = new ProjectsList { Projects = Projects.Staff } },
                Weight = 5,
            },
            new EmptyMenuLink("MnuNotificationsGroup", "Уведомления", "ms-notifications") {
                ProjectsConfig = new ProjectsConfiguration { ProjectsList = new ProjectsList { Projects = Projects.Staff } },
                Weight = 3,
            },
        };
    }
}
