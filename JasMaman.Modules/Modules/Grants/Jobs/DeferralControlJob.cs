using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using YodaApp.CommonWorkers;
using YodaApp.DbQueues;
using YodaQuery;

namespace JasMaman.Modules.Grants.Jobs {
    /// <summary>
    /// Контроль сроков отсрочки (в УМОСК дата окончания не отслеживалась).
    /// Раз в сутки находит гранты с истёкшей отсрочкой и завершает её системной операцией:
    /// срок явки становится «дата окончания + 30 календарных дней», статус «Временная отсрочка» снимается.
    /// </summary>
    public static class DeferralControlJob {
        public const string TimerName = "JasMamanDeferralControl (Завершение истёкших отсрочек отработки)";
        private const int BatchSize = 500;

        public static IServiceCollection UseDeferralControlJob(this IServiceCollection services)
            => services.AddNamedTimer(new NamedTimer(TimerName, (int)TimeSpan.FromHours(6).TotalMilliseconds, async env => {
                var memoryCache = env.ServiceProvider.GetRequiredService<IMemoryCache>();
                var ended = await EndExpiredAsync(env.QueryExecuter, memoryCache, DateTime.Today);
                if (ended.failed > 0) {
                    env.Logger.LogWarning("Не удалось завершить отсрочки: {Failed}", ended.failed);
                }
                return HealthCheckResult.Healthy($"Завершено отсрочек: {ended.ended}");
            }));

        public static async Task<(int ended, int failed)> EndExpiredAsync(IQueryExecuter queryExecuter, IMemoryCache memoryCache, DateTime today) {
            var grantIds = GrantsStore.Instance.TbState()
                .AddFilter(t => t.flDeferralUntil, ConditionOperator.Less, today)
                .Select(t => new FieldAlias[] { t.flGrantId }, queryExecuter)
                .Take(BatchSize)
                .Select(r => r.GetVal(t => t.flGrantId))
                .ToList();

            int ended = 0, failed = 0;
            foreach (var grantId in grantIds) {
                try {
                    var state = await GrantState.Get(new GrantId(grantId), queryExecuter, memoryCache);
                    var expired = state.Deferrals.Safe().LastOrDefault(d => d.EndedAt == null && d.Until < today);
                    if (expired == null) {
                        // отсрочка уже завершена вручную — пересохранение обновит денормализованную дату
                        continue;
                    }
                    await AllGrantOps.EndDeferral.InvokeAsync(
                        state,
                        new EndDeferralModel(expired.Until!.Value, "Автоматически: срок отсрочки истёк"),
                        GrantOpUserContext.System,
                        "system",
                        queryExecuter,
                        memoryCache
                    );
                    ended++;
                } catch (Exception) {
                    failed++;
                }
            }
            return (ended, failed);
        }
    }
}
