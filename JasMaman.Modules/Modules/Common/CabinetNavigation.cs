using JasMaman.Modules.Grants;
using JasMaman.Modules.Grants.Menus;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Migration;
using Yoda.Interfaces.Menu;
using YodaApp.Yoda.Interfaces.Forms.SelectUserRole;

namespace JasMaman.Modules.Common {
    /// <summary>
    /// Кабинеты, доступные пользователю по его ролям: плитки «Сервисы» в шапке и страница «Мои кабинеты»
    /// (на неё же ведёт HomeUrl:ForAuthenticatedUser после входа).
    /// </summary>
    public static class CabinetNavigation {
        public record Cabinet(string Text, string Project, string Module, string Menu);

        public static IReadOnlyList<Cabinet> ForUser(IYodaRequestContext context) {
            if (!context.User.IsAuthentificated) {
                return Array.Empty<Cabinet>();
            }
            var user = context.GetUserContextForGrantOp();
            var result = new List<Cabinet>();
            if ((user.Actors & (GrantActor.Monitoring | GrantActor.MonitoringHead | GrantActor.Legal | GrantActor.Accounting | GrantActor.Moderator)) != 0) {
                result.Add(new("Кабинет сотрудника", Projects.Internal, GrantsModule.ModuleName, MnuGrantStats.MnuName));
            }
            if ((user.Actors & GrantActor.University) != 0) {
                result.Add(new("Кабинет организации образования", Projects.University, GrantsModule.ModuleName, GrantsModule.MenuNames.All));
            }
            if ((user.Actors & GrantActor.Moderator) != 0) {
                result.Add(new("Кабинет модератора", Projects.Moderator, MigrationModule.ModuleName, MigrationModule.MenuNames.Log));
            }
            return result;
        }

        public static string Url(IYodaRequestContext context, Cabinet cabinet)
            => context.YodaActionUrl(cabinet.Module, cabinet.Menu, project: cabinet.Project, urlWithSchema: true);

        public static ProjectTileInfo[] Tiles(IYodaRequestContext context)
            => ForUser(context)
                .Select((c, i) => new ProjectTileInfo(c.Text, c.Module, c.Menu, string.Empty, i + 1, project: c.Project))
                .ToArray();
    }

    /// <summary>«Мои кабинеты» — выбор кабинета после входа (публичный проект).</summary>
    public class MnuCabinets : FrmMenu {
        public const string MnuName = nameof(MnuCabinets);

        public MnuCabinets() : base(MnuName, "Мои кабинеты") {
            ViewName("CabinetSelectRole");
            OnRendering(re => {
                if (!re.User.IsAuthentificated) {
                    re.Redirect.SetRedirectToHome();
                    return;
                }
                var links = CabinetNavigation.ForUser(re.RequestContext)
                    .Select(c => (text: re.RequestContext.T(c.Text).ToString(), url: CabinetNavigation.Url(re.RequestContext, c)))
                    .ToArray();
                new SelectUserRoleWidget(
                    "logo-template-dark",
                    links.Length == 0
                        ? re.RequestContext.T("У вашей учётной записи нет ролей Jas Maman. Обратитесь к администратору организации.")
                        : re.RequestContext.T("Мониторинг молодых специалистов — выберите кабинет"),
                    links,
                    re.RequestContext.YodaActionUrl("CabinetStartPageModule", "CabinetStartPage", project: "cabinet", urlWithSchema: true)
                ).AppendTo(re.Form);
            });
        }
    }
}
