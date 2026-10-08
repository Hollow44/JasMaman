using Yoda.Interfaces.Menu;

namespace Yoda.Controllers {
    public class PageNotFoundModule : YodaModule {
        public override string Text {
            get { return "Дефолтный конфигурационный модуль."; }
        }

        public override MenuLink[] Menu() {
            return new MenuLink[] {
                new FrmMenu("PageNotFound", "Страница не найдена")
                    .Path("page-not-founds")
                    .AsCallback()
                    .ProjectsConfig(ProjectsList.All)
                    .OnRendering(re => {

                    })
            };
        }
    }
}