using JasMaman.Modules.Catalogs.DataSchema;
using JasMaman.Modules.Common;
using JasMaman.Modules.Migration;
using Microsoft.Extensions.DependencyInjection;
using JasMaman.Modules.References;
using PgOrm.Models;
using YodaApp;
using YodaApp.DbQueues;
using YodaQuery;

namespace JasMaman.Modules.Catalogs.Jobs {
    public record MigrateCatalogsJobInput();

    /// <summary>
    /// Перенос справочников-сущностей из fin_center: организации образования (ct317) и специальности (ct316).
    /// Идемпотентен: строки сопоставляются по flLegacyId, повторный запуск обновляет данные.
    /// </summary>
    public static class MigrateCatalogsJob {
        public static readonly PgJobs<MigrateCatalogsJobInput> Queue = new(nameof(MigrateCatalogsJob), DbKeys.DbJobs, "Миграция вузов и специальностей из УМОСК");

        public static IServiceCollection UseMigrateCatalogsJobConsumer(this IServiceCollection services)
            => services.AddDbQueueConsumer(jobs => jobs
                .DbQueue(Queue)
                .Consume(async (input, env) => {
                    try {
                        var ctx = await FcContextFactory.CreateAsync(env.Configuration, new Dictionary<string, IReadOnlySet<string>> {
                            ["ct317"] = new HashSet<string> { "область" },
                            ["ct325"] = new HashSet<string>(),
                            ["ct316"] = new HashSet<string>(),
                        });

                        var universities = await ctx.GetAllAsync<ВУЗ>(maxDepth: 1);
                        var specialities = await ctx.GetAllAsync<Специальность>(maxDepth: 0);

                        var now = DateTime.Now;
                        migrateUniversities(universities, now, env.QueryExecuter);
                        migrateSpecialities(specialities, now, env.QueryExecuter);

                        return JobFate.Finish();
                    } catch (Exception ex) {
                        return JobFate.Abandon(ex.ToString());
                    }
                }, runEachJobParallel: false));

        private static int migrateUniversities(IReadOnlyCollection<ВУЗ> legacyRows, DateTime now, IQueryExecuter queryExecuter) {
            var existing = loadExistingIds(CatalogsStore.Instance.TbUniversity(), t => t.flLegacyId, t => t.flUniversityId, queryExecuter);

            foreach (var row in legacyRows) {
                var nameRu = firstNotEmpty(row.Наименование_УМС, row.Наименование, row.Наименование_го) ?? $"Организация #{row.Id}";
                var nameKz = firstNotEmpty(row.Наименование_УМС_kz, row.Наименование_kz, row.Наименование_го_kz);
                var isNew = !existing.TryGetValue(row.Id, out var universityId);

                CatalogsStore.Instance.TbUniversity()
                    .Transform(t => isNew
                        ? t.Insert().SetT(x => x.flUniversityId, row.Id).SetT(x => x.flLegacyId, row.Id)
                        : t.AddFilter(x => x.flUniversityId, universityId).Update())
                    .SetT(t => t.flBin, row.Бин?.Trim())
                    .SetT(t => t.flNameRu, nameRu)
                    .SetT(t => t.flNameKz, nameKz)
                    .SetT(t => t.flShortName, firstNotEmpty(row.Наименование_краткое, row.Наименование_краткое_го))
                    .SetT(t => t.flRegion, row.Область?.Наименование ?? row.Область_го?.Наименование)
                    .SetT(t => t.flAddress, row.Улица)
                    .SetT(t => t.flPhone, row.Телефон)
                    .SetT(t => t.flEmail, row.Email)
                    .SetT(t => t.flIsCollege, (row.Колледж ?? false).ToYesNo())
                    .SetT(t => t.flIsResearchInstitute, (row.Нии ?? false).ToYesNo())
                    .SetT(t => t.flHasYoungSpecialists, (row.Есть_студенты_УМС ?? false).ToYesNo())
                    .SetT(t => t.flIsActive, (!(row.Не_отображать_в_спр ?? false)).ToYesNo())
                    .SetT(t => t.flUpdatedAt, now)
                    .Execute(queryExecuter);
            }
            return legacyRows.Count;
        }

        private static int migrateSpecialities(IReadOnlyCollection<Специальность> legacyRows, DateTime now, IQueryExecuter queryExecuter) {
            var existing = loadExistingIds(CatalogsStore.Instance.TbSpeciality(), t => t.flLegacyId, t => t.flSpecialityId, queryExecuter);

            foreach (var row in legacyRows) {
                var isNew = !existing.TryGetValue(row.Id, out var specialityId);

                CatalogsStore.Instance.TbSpeciality()
                    .Transform(t => isNew
                        ? t.Insert().SetT(x => x.flSpecialityId, row.Id).SetT(x => x.flLegacyId, row.Id)
                        : t.AddFilter(x => x.flSpecialityId, specialityId).Update())
                    .SetT(t => t.flCode, firstNotEmpty(row.Код_общий, row.Код, row.Специальность_код))
                    .SetT(t => t.flNameRu, row.Наименование ?? $"Специальность #{row.Id}")
                    .SetT(t => t.flNameKz, row.Наименование_kz)
                    .SetT(t => t.flParentId, row.РодительId)
                    .SetT(t => t.flStudyYears, row.Срок_обучения is { } years ? (int?)years : null)
                    .SetT(t => t.flIsYoungSpecialist, (row.Умс ?? false).ToYesNo())
                    .SetT(t => t.flIsActive, YesNo.Yes)
                    .SetT(t => t.flUpdatedAt, now)
                    .Execute(queryExecuter);
            }
            return legacyRows.Count;
        }

        private static Dictionary<long, long> loadExistingIds<TTable>(TTable table, Func<TTable, LongField> legacyIdField, Func<TTable, LongField> idField, IQueryExecuter queryExecuter)
            where TTable : QueryTable
            => table
                .AddFilter(t => legacyIdField(t), ConditionOperator.NotEqual, DBNull.Value)
                .Select(t => new FieldAlias[] { legacyIdField(t), idField(t) }, queryExecuter)
                .ToDictionary(r => r.GetVal(t => legacyIdField(t)), r => r.GetVal(t => idField(t)));

        private static string? firstNotEmpty(params string?[] values)
            => values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();
    }
}
