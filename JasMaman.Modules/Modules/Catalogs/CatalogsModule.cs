using JasMaman.Modules.Catalogs.DataSchema;
using JasMaman.Modules.Catalogs.Jobs;
using JasMaman.Modules.Catalogs.Menus;
using JasMaman.Modules.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoda.Interfaces;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using Yoda.Interfaces.Menu;
using Yoda.Interfaces.Permissions;
using YodaQuery;

namespace JasMaman.Modules.Catalogs {
    /// <summary>Справочники-сущности: организации образования и специальности.</summary>
    public class CatalogsModule : YodaModule {
        public new const string ModuleName = nameof(CatalogsModule);
        public override string Text => "Справочники";

        public static class Perms {
            public static readonly Permission
                Viewer = new(nameof(Viewer), "Просмотр");
        }

        public static class MenuNames {
            public const string UniversityList = nameof(UniversityList),
                                SpecialityList = nameof(SpecialityList);
        }

        public override Permission[] Permissions(IQueryExecuter queryExecuter) => new[] { Perms.Viewer };

        public override QueryTable[] DataSchema() => CatalogsStore.Instance.DataSchema();

        public override void ConfigureServices(IServiceCollection serviceCollection, IConfiguration configuration) {
            serviceCollection.UseMigrateCatalogsJobConsumer();
        }

        public override MenuLink[] Menu() => new MenuLink[] {
            new MnuUniversityList(MenuNames.UniversityList)
                .ProjectsConfig(Projects.Staff)
                .Path("catalogs/universities")
                .Access(Perms.Viewer.Name),

            new MnuSpecialityList(MenuNames.SpecialityList)
                .ProjectsConfig(Projects.Staff)
                .Path("catalogs/specialities")
                .Access(Perms.Viewer.Name),
        };
    }
}
