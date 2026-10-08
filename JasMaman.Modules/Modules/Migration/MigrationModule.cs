using System.Net;
using System.Text;
using JasMaman.Modules.Catalogs.Jobs;
using JasMaman.Modules.Common;
using JasMaman.Modules.Grants.Jobs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Yoda.Interfaces;
using Yoda.Interfaces.Forms.Components;
using Yoda.Interfaces.Menu;
using Yoda.Interfaces.Permissions;
using YodaApp.UiSearch;
using YodaQuery;

namespace JasMaman.Modules.Migration {
    /// <summary>Перенос данных из УМОСК (fin_center): запуск заданий, проверка справочников, журнал.</summary>
    public class MigrationModule : YodaModule {
        public new const string ModuleName = nameof(MigrationModule);
        public override string Text => "Миграция из УМОСК";

        public static class MenuNames {
            public const string Group = "MnuMigrationGroup",
                                RefsCheck = "MnuMigrationRefsCheck",
                                Catalogs = "MnuMigrationCatalogs",
                                Grants = "MnuMigrationGrants",
                                Log = "MnuMigrationLog";
        }

        public static class Perms {
            public static readonly Permission Migrator = new(nameof(Migrator), "Миграция из УМОСК");
        }

        public override Permission[] Permissions(IQueryExecuter queryExecuter) => new[] { Perms.Migrator };

        public override QueryTable[] DataSchema() => new QueryTable[] { new TbMigrationLog() };

        public override MenuLink[] Menu() => new MenuLink[] {
            new EmptyMenuLink(MenuNames.Group, "Миграция из УМОСК", "migration") {
                ProjectsConfig = new ProjectsConfiguration { ProjectsList = new ProjectsList { Projects = new[] { Projects.Moderator } } },
                Weight = 10,
            },

            new FrmMenu(MenuNames.RefsCheck, "Проверка справочников")
                .ProjectsConfig(Projects.Moderator)
                .Path("migration/refs-check")
                .Access(Perms.Migrator.Name)
                .OnRendering(async re => {
                    var ctx = await FcContextFactory.CreateAsync(re.RequestContext.AppEnv.ServiceProvider.GetRequiredService<IConfiguration>());
                    var results = await LegacyReferenceCheck.RunAsync(ctx);
                    var sb = new StringBuilder("<table class=\"table table-sm\"><thead><tr><th>Таблица</th><th>Справочник</th><th>В УМОСК</th><th>Сопоставлено</th><th>Результат</th></tr></thead><tbody>");
                    foreach (var r in results) {
                        var problems = r.Unmapped.Select(u => $"нет соответствия: #{u.Id} {u.Name}")
                            .Concat(r.MissingInLegacy.Select(id => $"нет в УМОСК: #{id}"));
                        sb.Append($"<tr><td>{r.Table.TableId}</td><td>{WebUtility.HtmlEncode(r.Table.Title)}</td><td>{r.LegacyRows}</td><td>{r.Table.MappedIds.Count}</td>"
                            + $"<td>{(r.IsComplete ? "<span class=\"badge bg-success\">OK</span>" : WebUtility.HtmlEncode(string.Join("; ", problems)))}</td></tr>");
                    }
                    sb.Append("</tbody></table>");
                    re.Form.Append(new HtmlTextV2(sb.ToString(), HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
                }),

            new FrmMenu(MenuNames.Catalogs, "Перенос вузов и специальностей")
                .ProjectsConfig(Projects.Moderator)
                .Path("migration/catalogs")
                .Access(Perms.Migrator.Name)
                .OnRendering(re => {
                    re.Form.Append(new Label("Переносит организации образования (ct317) и специальности (ct316). Повторный запуск обновляет данные. Выполняется до переноса грантов."));
                    re.Form.AddSubmitButton("Запустить");
                })
                .OnProcessing(pe => {
                    MigrateCatalogsJob.Queue.AddImmediately(new MigrateCatalogsJobInput(), pe.QueryExecuter, null);
                    pe.SetPostbackMessage("Задание поставлено в очередь");
                }),

            new FrmMenu(MenuNames.Grants, "Перенос молодых специалистов")
                .ProjectsConfig(Projects.Moderator)
                .Path("migration/grants")
                .Access(Perms.Migrator.Name)
                .OnRendering(re => {
                    var lastId = new TbMigrationLog()
                        .AddFilter(t => t.flJob, MigrateGrantsJob.JobName)
                        .AddFilter(t => t.flLastId, ConditionOperator.NotEqual, DBNull.Value)
                        .Order(t => t.flAt, OrderType.Desc)
                        .SelectScalar(t => t.flLastId, re.QueryExecuter);
                    re.Form.Append(new Label(
                        "Переносит записи обучения по гранту (ct322) вместе с данными отработки (ct520) и статусами персоны. "
                        + "Задание обрабатывает страницы по 500 записей и продолжает себя само; ход — в журнале миграции. "
                        + (lastId == null ? "Перенос ещё не запускался." : $"Последняя обработанная запись: #{lastId}.")));
                    re.Form.AddSubmitButton("Продолжить с последней записи");
                })
                .OnProcessing(pe => {
                    var lastId = new TbMigrationLog()
                        .AddFilter(t => t.flJob, MigrateGrantsJob.JobName)
                        .AddFilter(t => t.flLastId, ConditionOperator.NotEqual, DBNull.Value)
                        .Order(t => t.flAt, OrderType.Desc)
                        .SelectScalar(t => t.flLastId, pe.QueryExecuter);
                    MigrateGrantsJob.Queue.AddImmediately(new MigrateGrantsJobInput(lastId == null ? 0 : Convert.ToInt64(lastId)), pe.QueryExecuter, null);
                    pe.SetPostbackMessage("Задание поставлено в очередь");
                }),

            new FrmMenu(MenuNames.Log, "Журнал миграции")
                .ProjectsConfig(Projects.Moderator)
                .Path("migration/log")
                .Access(Perms.Migrator.Name)
                .OnRendering(re => {
                    new TbMigrationLog()
                        .Order(t => t.flAt, OrderType.Desc)
                        .Search(search => search
                            .Filtering(filter => filter.AddField(t => t.flJob))
                            .TablePresentation(
                                t => new FieldAlias[] { t.flAt, t.flJob, t.flAfterId, t.flLastId, t.flRead, t.flImported, t.flSkipped, t.flFailed, t.flDetails },
                                t => new[] {
                                    t.Column(t => t.flAt), t.Column(t => t.flJob), t.Column(t => t.flAfterId), t.Column(t => t.flLastId),
                                    t.Column(t => t.flRead), t.Column(t => t.flImported), t.Column(t => t.flSkipped), t.Column(t => t.flFailed),
                                    t.Column(t => t.flDetails),
                                }
                            )
                        )
                        .Print(re.Form, re.AsFormEnv(), re.Form);
                }),
        };
    }
}
