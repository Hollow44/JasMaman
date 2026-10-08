using JasMaman.Modules.Catalogs.DataSchema;
using JasMaman.Modules.Common;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Migration;
using JasMaman.Modules.References;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using OpPatternAbstractions.Op;
using PgOrm;
using PgOrm.Models;
using YodaApp;
using YodaApp.DbQueues;
using YodaQuery;

namespace JasMaman.Modules.Grants.Jobs {
    public record MigrateGrantsJobInput(long AfterStudyId, int PageSize = 500, bool Continue = true);

    /// <summary>
    /// Перенос грантов из УМОСК постранично (keyset по id записи обучения ct322).
    /// Каждый запуск обрабатывает одну страницу, пишет строку в журнал миграции и
    /// ставит себя же на следующую страницу — прогресс не теряется при перезапуске приложения.
    /// Повторный перенос идемпотентен (см. <see cref="ImportGrantOp"/>).
    /// </summary>
    public static class MigrateGrantsJob {
        public const string JobName = "Перенос грантов";
        public static readonly PgJobs<MigrateGrantsJobInput> Queue = new(nameof(MigrateGrantsJob), DbKeys.DbJobs, "Миграция молодых специалистов из УМОСК");

        private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> resolveRefs = new Dictionary<string, IReadOnlySet<string>> {
            ["ct322"] = new HashSet<string>(),
            ["ct320"] = new HashSet<string> { "ад_зап_перс_данных", "ид_зап_перс_данных", "ад_зап_предварительного_статуса" },
            ["ct321"] = new HashSet<string>(),
            ["ct663"] = new HashSet<string>(),
            ["ct520"] = new HashSet<string>(),
        };

        public static IServiceCollection UseMigrateGrantsJobConsumer(this IServiceCollection services)
            => services.AddDbQueueConsumer(jobs => jobs
                .DbQueue(Queue)
                .Consume(async (input, env) => {
                    try {
                        var ctx = await FcContextFactory.CreateAsync(env.Configuration, resolveRefs);
                        var memoryCache = env.ServiceProvider.GetRequiredService<IMemoryCache>();
                        var stats = await migratePageAsync(ctx, input, env.QueryExecuter, memoryCache);

                        if (stats.Read == 0 || !input.Continue) {
                            return JobFate.Finish();
                        }
                        return JobFate<MigrateGrantsJobInput>.Repeat(input with { AfterStudyId = stats.LastId }, startAfterSec: 1);
                    } catch (Exception ex) {
                        writeLog(input.AfterStudyId, null, 0, 0, 0, 1, ex.ToString(), env.QueryExecuter);
                        return JobFate.Retry(600, ex.Message);
                    }
                }, runEachJobParallel: false));

        public record PageStats(long LastId, int Read, int Imported, int Skipped, int Failed);

        private static async Task<PageStats> migratePageAsync(PgContext ctx, MigrateGrantsJobInput input, IQueryExecuter queryExecuter, IMemoryCache memoryCache) {
            var studies = await ctx.Repository("ct322", maxDepth: 0).GetPageAsync<ЗапОбучения>(input.AfterStudyId, input.PageSize);
            if (studies.Count == 0) {
                writeLog(input.AfterStudyId, null, 0, 0, 0, 0, "Записи закончились — перенос завершён", queryExecuter);
                return new PageStats(input.AfterStudyId, 0, 0, 0, 0);
            }
            var lastId = studies[^1].Id;

            var grantStudies = studies.Where(s => s.Статус_УМСId != null && s.ПерсонаId != null).ToList();
            var personIds = grantStudies.Select(s => s.ПерсонаId!.Value).Distinct().ToArray();

            var persons = (await ctx.GetByIdsAsync<Персона>(personIds, maxDepth: 1)).ToDictionary(p => p.Id);
            var worksByPerson = (await ctx.Repository("ct520", maxDepth: 0).LoadChildrenAsync(personIds, "ct520", "персона"))
                .ToDictionary(x => x.Key, x => ModelMapper.MapAll<ЗапОтработкиМС>(x.Value));

            var lookups = await loadLookupsAsync(ctx, queryExecuter);
            var existing = loadExistingGrantIds(grantStudies.Select(s => s.Id).ToArray(), queryExecuter);

            var momento = new CurrentMomento();
            var batch = new BatchStateChangesExecuter();
            int imported = 0, skipped = 0, failed = 0;
            var errors = new List<string>();
            var skipReasons = new Dictionary<string, int>();
            void skip(string reason, int count = 1) {
                skipped += count;
                skipReasons[reason] = skipReasons.GetValueOrDefault(reason) + count;
            }
            skip("нет категории УМС (Статус_УМС пуст)", studies.Count(s => s.Статус_УМСId == null));
            skip("нет персоны (ПерсонаId пуст)", studies.Count(s => s.Статус_УМСId != null && s.ПерсонаId == null));

            foreach (var personStudies in grantStudies.GroupBy(s => s.ПерсонаId!.Value)) {
                if (!persons.TryGetValue(personStudies.Key, out var person)) {
                    skip("персона не найдена в ct320", personStudies.Count());
                    continue;
                }
                var works = worksByPerson.TryGetValue(person.Id, out var w) ? w : new List<ЗапОтработкиМС>();
                foreach (var (study, studyWorks) in distributeWorks(personStudies.ToList(), works)) {
                    try {
                        var result = LegacyGrantMapper.Map(study, person, studyWorks, lookups, momento.Now);
                        if (result.State == null) {
                            skip(result.SkipReason ?? "без причины");
                            continue;
                        }
                        var current = existing.TryGetValue(study.Id, out var grantId)
                            ? await GrantState.Get(new GrantId(grantId), queryExecuter, memoryCache)
                            : null;
                        var prepared = AllGrantOps.Import.Prepare(
                            current,
                            new ImportGrantModel(study.Id, person.Id, result.State),
                            GrantOpUserContext.System,
                            "migration",
                            momento
                        );
                        batch.AddRange(prepared.Changes);
                        imported++;
                    } catch (Exception ex) {
                        failed++;
                        if (errors.Count < 20) {
                            errors.Add($"обучение #{study.Id}: {ex.Message}");
                        }
                    }
                }
            }

            // Страница могла целиком уйти в skipped/failed — пустой batch Yoda не принимает.
            if (imported > 0) {
                await batch.ExecuteAsync(queryExecuter, memoryCache);
            }
            var details = skipReasons
                .Where(x => x.Value > 0)
                .OrderByDescending(x => x.Value)
                .Select(x => $"пропуск — {x.Key}: {x.Value}")
                .Concat(errors)
                .ToList();
            writeLog(input.AfterStudyId, lastId, studies.Count, imported, skipped, failed, details.Count == 0 ? null : string.Join("\n", details), queryExecuter);
            return new PageStats(lastId, studies.Count, imported, skipped, failed);
        }

        /// <summary>
        /// Записи отработки (ct520) привязываются к обучению по уровню образования их категории;
        /// записи без категории — к последнему выпуску персоны.
        /// </summary>
        public static IEnumerable<(ЗапОбучения study, IReadOnlyCollection<ЗапОтработкиМС> works)> distributeWorks(
            IReadOnlyList<ЗапОбучения> studies, IReadOnlyCollection<ЗапОтработкиМС> works) {
            EducationLevel? levelOf(long? categoryId)
                => categoryId is { } id && LegacyReferenceMap.GrantCategories.TryGetValue(id, out var c) ? c.ToEducationLevel() : null;

            var latest = studies.OrderBy(s => s.Год_окнч_вуза ?? 0).ThenBy(s => s.Id).Last();
            foreach (var study in studies) {
                var level = levelOf(study.Статус_УМСId);
                var matched = works
                    .Where(w => levelOf(w.Статус_УМСId) is { } workLevel ? workLevel == level : study == latest)
                    .ToList();
                yield return (study, matched);
            }
        }

        private static async Task<LegacyLookups> loadLookupsAsync(PgContext ctx, IQueryExecuter queryExecuter) {
            var movements = new Dictionary<long, StudentMovement>();
            foreach (var row in await ctx.Repository("ct314", maxDepth: 0).GetAllAsync()) {
                var code = (row["код"] ?? row["код_1"])?.ToString();
                if (int.TryParse(code, out var number) && Enum.IsDefined(typeof(StudentMovement), number)) {
                    movements[row.Id] = (StudentMovement)number;
                }
            }

            var universities = CatalogsStore.Instance.TbUniversity()
                .Select(t => new FieldAlias[] { t.flUniversityId, t.flBin, t.flNameRu }, queryExecuter)
                .ToDictionary(r => r.GetVal(t => t.flUniversityId), r => ((string?)r.GetVal(t => t.flBin), r.GetVal(t => t.flNameRu)));
            var specialities = CatalogsStore.Instance.TbSpeciality()
                .Select(t => new FieldAlias[] { t.flSpecialityId, t.flCode, t.flNameRu }, queryExecuter)
                .ToDictionary(r => r.GetVal(t => t.flSpecialityId), r => ((string?)r.GetVal(t => t.flCode), r.GetVal(t => t.flNameRu)));

            return new LegacyLookups(
                movements,
                id => universities.TryGetValue(id, out var u) ? u : null,
                id => specialities.TryGetValue(id, out var s) ? s : null
            );
        }

        private static Dictionary<long, long> loadExistingGrantIds(long[] legacyStudyIds, IQueryExecuter queryExecuter)
            => legacyStudyIds.Length == 0
                ? new()
                : GrantsStore.Instance.TbState()
                    .AddFilter(t => t.flLegacyStudyId, legacyStudyIds)
                    .Select(t => new FieldAlias[] { t.flLegacyStudyId, t.flGrantId }, queryExecuter)
                    .ToDictionary(r => r.GetVal(t => t.flLegacyStudyId), r => r.GetVal(t => t.flGrantId));

        private static void writeLog(long afterId, long? lastId, int read, int imported, int skipped, int failed, string? details, IQueryExecuter queryExecuter)
            => new TbMigrationLog()
                .Insert()
                .SetT(t => t.flId, new BasicIdGen(new CurrentMomento()).NextId())
                .SetT(t => t.flJob, JobName)
                .SetT(t => t.flAfterId, afterId)
                .SetT(t => t.flLastId, lastId)
                .SetT(t => t.flRead, read)
                .SetT(t => t.flImported, imported)
                .SetT(t => t.flSkipped, skipped)
                .SetT(t => t.flFailed, failed)
                .SetT(t => t.flDetails, details)
                .SetT(t => t.flAt, DateTime.Now)
                .Execute(queryExecuter);
    }
}
