using JasMaman.Modules.Catalogs.DataSchema;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Notifications;
using JasMaman.Modules.References;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using YodaApp.CommonWorkers;
using YodaApp.DbQueues;

namespace JasMaman.Modules.Grants.Diagnostics {
    /// <summary>
    /// Сквозная самопроверка на локальной БД (только разработка): полный жизненный цикл гранта
    /// через настоящий QueryExecuter — запись/чтение состояния (шифрование, JSON, колонки),
    /// журнал операций, уведомления. Запуск: <c>dotnet run -- --jasmaman-selftest true</c>.
    /// Тестовые данные удаляются в конце.
    /// </summary>
    public static class GrantSelfTest {
        public const string ConfigKey = "jasmaman-selftest";
        private const string TestIin = "000101300001";
        private const string TestBin = "000140009999";
        private const long TestUniversityId = 999_000_001;

        public static IServiceCollection UseGrantSelfTestIfRequested(this IServiceCollection services, IConfiguration configuration) {
            if (configuration[ConfigKey] != "true") {
                return services;
            }
            return services.AddNamedTimer(new NamedTimer("JasMamanSelfTest", (int)TimeSpan.FromDays(1).TotalMilliseconds, async env => {
                var cache = new MemoryCache(new MemoryCacheOptions());
                var log = env.Logger;
                try {
                    await RunAsync(env.QueryExecuter, cache, env.ServiceProvider.GetRequiredService<INotificationGateway>(), log);
                    log.LogWarning("SELFTEST PASSED");
                    return HealthCheckResult.Healthy("selftest passed");
                } catch (Exception ex) {
                    log.LogError(ex, "SELFTEST FAILED: {Message}", ex.Message);
                    return HealthCheckResult.Unhealthy("selftest failed: " + ex.Message);
                } finally {
                    cleanup(env.QueryExecuter);
                }
            }));
        }

        private static void check(bool condition, string what, ILogger log) {
            if (!condition) {
                throw new InvalidOperationException("Проверка не прошла: " + what);
            }
            log.LogWarning("SELFTEST ok: {What}", what);
        }

        public static async Task RunAsync(IQueryExecuter qe, IMemoryCache cache, INotificationGateway gateway, ILogger log) {
            cleanup(qe);
            CatalogsStore.Instance.TbUniversity()
                .Insert()
                .SetT(t => t.flUniversityId, TestUniversityId)
                .SetT(t => t.flBin, TestBin)
                .SetT(t => t.flNameRu, "Тестовый университет (selftest)")
                .SetT(t => t.flIsCollege, YesNo.No)
                .SetT(t => t.flIsResearchInstitute, YesNo.No)
                .SetT(t => t.flHasYoungSpecialists, YesNo.Yes)
                .SetT(t => t.flIsActive, YesNo.Yes)
                .SetT(t => t.flUpdatedAt, DateTime.Now)
                .Execute(qe);

            var user = GrantOpUserContext.System;
            var today = DateTime.Today;

            var state = await AllGrantOps.Create.InvokeAsync(null,
                new CreateGrantModel(TestIin, "Тестов", "Тест", null, new DateTime(2000, 1, 1), "+77010000000", null,
                    TestUniversityId, TestBin, "Тестовый университет (selftest)", null, null, null, GrantCategory.RuralQuota, today.Year - 4, "1-З", today.AddYears(-4), "selftest"),
                user, "selftest", qe, cache);
            check(state.BaseRowVersion == 1, "регистрация обучающегося", log);

            state = await AllGrantOps.Graduate.InvokeAsync(state, new GraduateModel(today.Year - 1, "77-В", today.AddYears(-1), 3_600_000m, null), user, "selftest", qe, cache);
            state = await AllGrantOps.Assign.InvokeAsync(state,
                new AssignModel(AssignmentKind.Main, "П-1", today.AddYears(-1), PlacementType.EducationDepartment, "123456789012", "КГУ Школа", "Абай", "Учитель", "Н-1", today.AddYears(-1), today.AddMonths(-10), null, null),
                user, "selftest", qe, cache);
            state = await AllGrantOps.RecordWork.InvokeAsync(state,
                new RecordWorkModel("123456789012", "КГУ Школа", "Учитель", today.AddMonths(-10), today.AddMonths(-4), WorkConfirmationSource.Mtszn, null),
                user, "selftest", qe, cache);
            check(state.Obligation?.MonitoringStatus == MonitoringStatus.Arrived, "период работы → «Прибыл»", log);

            var debt = AllGrantOps.CalculateDebt.EmptyModel(state);
            state = await AllGrantOps.CalculateDebt.InvokeAsync(state, debt, user, "selftest", qe, cache);
            state = await AllGrantOps.RecordPayment.InvokeAsync(state, new RecordPaymentModel(debt.Amount, today, "ПП-1", null), user, "selftest", qe, cache);
            check(state.Obligation?.RecoveryStatus == RecoveryStatus.Archive, "полная оплата → ТКС «Архив»", log);

            // чтение из БД мимо кэша: JSON + шифрование + нормализация
            var fromDb = await GrantState.Get(state.GrantId, qe, new MemoryCache(new MemoryCacheOptions()));
            check(fromDb.Person == state.Person && fromDb.Study == state.Study && fromDb.Obligation == state.Obligation, "состояние читается из БД без потерь", log);
            check(fromDb.WorkPeriods.SequenceEqual(state.WorkPeriods) && fromDb.Payments.SequenceEqual(state.Payments), "вложенные коллекции читаются из БД", log);

            var row = GrantsStore.Instance.TbState()
                .AddFilter(t => t.flGrantId, state.GrantId.Id)
                .SelectFirst(t => new FieldAlias[] { t.flStage, t.flRecoveryStatus, t.flWorkedMonths, t.flDebtBalance, t.flIin }, qe);
            check(row.GetVal(t => t.flStage) == GrantStage.Closed && row.GetVal(t => t.flIin) == TestIin, "денормализованные колонки реестра", log);

            var journal = GrantsStore.Instance.TbOpState().AddFilter(t => t.flGrantId, state.GrantId.Id).Count(qe);
            check(journal == 6, $"журнал операций (6 записей, фактически {journal})", log);

            var drafts = new TbNotification().AddFilter(t => t.flGrantId, state.GrantId.Id).AddFilter(t => t.flStatus, NotificationStatus.Draft).Count(qe);
            check(drafts == 1, "черновик уведомления о погашении создан автоматически", log);
            NotificationService.ApproveDrafts("selftest", qe);
            var (sent, failed) = await NotificationService.SendApprovedAsync(gateway, qe, cache);
            check(sent >= 1 && failed == 0, "отправка уведомления через шлюз", log);
            await NotificationService.RefreshDeliveryAsync(gateway, qe);
            var delivered = new TbNotification().AddFilter(t => t.flGrantId, state.GrantId.Id).AddFilter(t => t.flStatus, NotificationStatus.Delivered).Count(qe);
            check(delivered == 1, "статус доставки обновлён", log);

            var afterNotify = await GrantState.Get(state.GrantId, qe, cache);
            check(afterNotify.Notes.Any(n => n.Text.Contains("Уведомление")), "отметка об уведомлении в истории гранта", log);
            check(GrantsStore.Instance.TbOpState().AddFilter(t => t.flGrantId, state.GrantId.Id).Count(qe) == 7, "отметка об уведомлении записана в журнал операций", log);

            // отсрочка с истёкшим сроком закрывается контролем
            var second = await AllGrantOps.Create.InvokeAsync(null,
                new CreateGrantModel(TestIin, "Тестов", "Тест", null, null, null, null, TestUniversityId, TestBin, "Тестовый университет (selftest)",
                    null, null, null, GrantCategory.Master, today.Year - 3, null, null, null),
                user, "selftest", qe, cache);
            second = await AllGrantOps.Graduate.InvokeAsync(second, new GraduateModel(today.Year - 1, "1", today.AddYears(-1), 1_000_000m, null), user, "selftest", qe, cache);
            second = second with {
                Deferrals = second.Deferrals.Add(new GrantDeferral(1, DeferralType.MasterAbroad, today.AddYears(-1), today.AddDays(-2), null, null, null, null))
            };
            second = second.Save(new OpPatternAbstractions.Op.CurrentMomento(), out var changes);
            await new OpPatternAbstractions.Op.BatchStateChangesExecuter().AddRange(changes).ExecuteAsync(qe, cache);
            var (ended, _) = await Jobs.DeferralControlJob.EndExpiredAsync(qe, cache, today);
            var afterControl = await GrantState.Get(second.GrantId, qe, cache);
            check(ended >= 1 && afterControl.Deferrals.Single().EndedAt == today.AddDays(-2), "истёкшая отсрочка закрыта контролем", log);
            check(GrantRules.ArrivalDeadline(afterControl) == today.AddDays(28), "срок явки = окончание отсрочки + 30 дней", log);
        }

        private static void cleanup(IQueryExecuter qe) {
            var ids = GrantsStore.Instance.TbState().AddFilter(t => t.flIin, TestIin)
                .Select(t => new FieldAlias[] { t.flGrantId }, qe).Select(r => r.GetVal(t => t.flGrantId)).ToArray();
            if (ids.Length > 0) {
                new TbNotification().AddFilter(t => t.flGrantId, ids).Remove().Execute(qe);
                GrantsStore.Instance.TbOpState().AddFilter(t => t.flGrantId, ids).Remove().Execute(qe);
                GrantsStore.Instance.TbState().AddFilter(t => t.flGrantId, ids).Remove().Execute(qe);
            }
            CatalogsStore.Instance.TbUniversity().AddFilter(t => t.flUniversityId, TestUniversityId).Remove().Execute(qe);
        }
    }
}
