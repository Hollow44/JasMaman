using System.Collections.Immutable;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using PgOrm.Models;

namespace JasMaman.Modules.Migration {
    /// <summary>Справочные данные для маппинга (без обращения к БД внутри маппера).</summary>
    public record LegacyLookups(
        IReadOnlyDictionary<long, StudentMovement> Movements,
        Func<long, (string? Bin, string Name)?> University,
        Func<long, (string? Code, string Name)?> Speciality
    );

    /// <summary>
    /// Сопоставление записи обучения УМОСК (ct322) с персоной (ct320) и её записями отработки (ct520)
    /// в агрегат <see cref="GrantState"/>. Чистая функция — покрыта тестами.
    /// </summary>
    public static class LegacyGrantMapper {
        public record Result(GrantState? State, string? SkipReason);

        public static Result Map(ЗапОбучения study, Персона person, IReadOnlyCollection<ЗапОтработкиМС> works, LegacyLookups lookups, DateTime now) {
            if (study.Статус_УМСId is not { } categoryId || !LegacyReferenceMap.GrantCategories.TryGetValue(categoryId, out var category)) {
                return new(null, $"Неизвестная категория УМС #{study.Статус_УМСId} (нет в LegacyReferenceMap)");
            }

            var pd = person.Ад_зап_перс_данных ?? person.Ид_зап_перс_данных;
            var iin = pd?.Иин?.Trim();
            if (!GrantRules.IsValidIin(iin)) {
                return new(null, "Нет корректного ИИН");
            }

            var level = category.ToEducationLevel();
            var movement = study.ДвижениеId is { } movementId && lookups.Movements.TryGetValue(movementId, out var m) ? m : StudentMovement.Enrolled;
            var university = study.ВузId is { } universityId ? lookups.University(universityId) : null;
            var speciality = study.СпециальностьId is { } specialityId ? lookups.Speciality(specialityId) : null;
            var graduationYear = study.Год_окнч_вуза is > 1990 and < 2100 ? (int?)study.Год_окнч_вуза : null;

            var grantPerson = new GrantPerson(
                iin!,
                pd!.Фамилия?.Trim() ?? "",
                pd.Имя?.Trim() ?? "",
                string.IsNullOrWhiteSpace(pd.Отчество) ? null : pd.Отчество.Trim(),
                pd.Дата_рождения,
                string.IsNullOrWhiteSpace(person.Техн_телефон) ? null : person.Техн_телефон.Trim(),
                person.Email ?? pd.Email,
                pd.Удл_адрес_прописки
            );
            if (grantPerson.LastName == "") {
                return new(null, "Нет фамилии");
            }

            var grantStudy = new GrantStudy(
                study.ВузId, university?.Bin, university?.Name,
                study.СпециальностьId, speciality?.Code, speciality?.Name,
                category, level,
                study.Год_поступл_в_вуз is > 1990 and < 2100 ? (int?)study.Год_поступл_в_вуз : null,
                graduationYear,
                study.Умс_сумма is > 0 ? (decimal)study.Умс_сумма.Value : null,
                movement,
                study.Дата_движения,
                study.Приказ_номер,
                study.Приказ_дата
            );

            var hasObligation = movement.CreatesObligation() || works.Count > 0;
            var obligation = hasObligation ? mapObligation(person, works, level, graduationYear) : null;

            var state = new GrantState(
                new GrantId(0),
                study.Id,
                person.Id,
                grantPerson,
                grantStudy,
                obligation,
                hasObligation ? mapAssignments(works, study, now) : ImmutableArray<GrantAssignment>.Empty,
                hasObligation ? mapWorkPeriods(works) : ImmutableArray<GrantWorkPeriod>.Empty,
                hasObligation ? mapDeferrals(works, graduationYear) : ImmutableArray<GrantDeferral>.Empty,
                ImmutableArray<GrantPayment>.Empty,
                notes(person, level, study.Дата_создания ?? now),
                study.Дата_создания ?? now,
                BaseRowVersion: null,
                Momento: null
            );
            return new(state, null);
        }

        private static GrantObligation mapObligation(Персона person, IReadOnlyCollection<ЗапОтработкиМС> works, EducationLevel level, int? graduationYear) {
            var (recoveryId, releaseId, releasedAt, legacyMonths) = level switch {
                EducationLevel.Master => (person.УмсМ_статус_заемщика_тксId, person.УмсМ_освобождение_от_отработкиId, person.УмсМ_освобождение_дата_записи, person.Отработано_маг_месяцев),
                EducationLevel.Residency => (person.УмсР_статус_заемщика_тксId, person.УмсР_освобождение_от_отработкиId, person.УмсР_освобождение_дата_записи, person.Отработано_рез_месяцев),
                EducationLevel.Doctorate => (person.УмсД_статус_заемщика_тксId, person.УмсД_освобождение_от_отработкиId, person.УмсД_освобождение_дата_записи, person.Отработано_док_месяцев),
                _ => (person.Статус_заемщика_тксId, person.Умс_освобождение_от_отработкиId, person.Умс_освобождение_дата_записи, person.Отработано_бак_месяцев),
            };

            var lastWork = works.OrderBy(w => w.Дата_начало ?? w.Направление_дата ?? DateTime.MinValue).LastOrDefault();
            var terminationId = level == EducationLevel.Bachelor
                ? person.Умс_прекращение_обязан_по_отработкеId ?? lastWork?.Прекращение_обязан_по_отработкеId
                : lastWork?.Прекращение_обязан_по_отработкеId;
            var benefitId = level == EducationLevel.Bachelor
                ? person.Умс_льгота_при_распределенииId ?? lastWork?.Льгота_при_распределенииId
                : lastWork?.Льгота_при_распределенииId;

            var monitoring = person.Ад_зап_предварительного_статуса is { } status
                && (status.Категория_умсId == null
                    || (LegacyReferenceMap.GrantCategories.TryGetValue(status.Категория_умсId.Value, out var statusCategory) && statusCategory.ToEducationLevel() == level))
                && status.СтатусId is { } statusId
                && LegacyReferenceMap.MonitoringStatuses.TryGetValue(statusId, out var ms)
                    ? ms
                    : (MonitoringStatus?)null;

            ReleaseReason? release = releaseId is { } r && LegacyReferenceMap.ReleaseReasons.TryGetValue(r, out var rr) ? rr : null;
            TerminationReason? termination = terminationId is { } t && LegacyReferenceMap.TerminationReasons.TryGetValue(t, out var tr) ? tr : null;

            return new GrantObligation(
                MonitoringStatus: monitoring,
                RecoveryStatus: recoveryId is { } rec && LegacyReferenceMap.RecoveryStatuses.TryGetValue(rec, out var rs) ? rs : RecoveryStatus.None,
                RequiredMonths: GrantObligation.DefaultRequiredMonths,
                ArrivalDeadline: graduationYear is { } year ? new DateTime(year, 9, 1) : null,
                Benefit: benefitId is { } b && LegacyReferenceMap.Benefits.TryGetValue(b, out var bb) ? bb : null,
                ReleaseReason: release,
                ReleasedAt: release == null ? null : releasedAt ?? lastWork?.Дата_начало,
                TerminationReason: termination,
                TerminatedAt: termination == null ? null : lastWork?.Дата_окончание ?? lastWork?.Дата_начало,
                DebtAmount: null,
                CompletedAt: termination == TerminationReason.ObligationFulfilled ? lastWork?.Дата_окончание : null,
                LegacyWorkedMonths: legacyMonths is > 0 and < 600 ? (int)legacyMonths.Value : null
            );
        }

        private static LegacyPlacement? placement(ЗапОтработкиМС work)
            => work.Разделение_мест_распределения_МСId is { } id && LegacyReferenceMap.Placements.TryGetValue(id, out var p) ? p : null;

        private static ImmutableArray<GrantAssignment> mapAssignments(IReadOnlyCollection<ЗапОтработкиМС> works, ЗапОбучения study, DateTime now) {
            var rows = works
                .Where(w => placement(w)?.Deferral == null && w.Отсрочка_служба_армии != true)
                .Where(w => w.Направление_номер != null || w.Комиссия_протоколId != null || placement(w)?.Placement != null)
                .OrderBy(w => w.Направление_дата ?? w.Дата_начало ?? DateTime.MaxValue)
                .ToList();
            return rows.Select((w, index) => new GrantAssignment(
                w.Id,
                index == 0 ? AssignmentKind.Main : AssignmentKind.Additional,
                index == 0 ? study.Умс_протокол : null,
                index == 0 ? study.Умс_протокол_дата : null,
                placement(w)?.Placement,
                w.Место_БИН?.Trim(),
                w.Место_работы?.Trim(),
                null,
                w.Должность_текст,
                w.Направление_номер,
                w.Направление_дата,
                w.Дата_начало,
                w.Примечание,
                w.Направление_дата ?? w.Дата_начало ?? now
            )).ToImmutableArray();
        }

        private static ImmutableArray<GrantWorkPeriod> mapWorkPeriods(IReadOnlyCollection<ЗапОтработкиМС> works)
            => works
                .Where(w => w.Дата_начало != null && (!string.IsNullOrWhiteSpace(w.Место_работы) || !string.IsNullOrWhiteSpace(w.Место_БИН)))
                .Where(w => placement(w) is not { Placement: PlacementType.CareerCenter } && placement(w)?.Deferral == null && w.Отсрочка_служба_армии != true)
                .OrderBy(w => w.Дата_начало)
                .Select(w => new GrantWorkPeriod(
                    w.Id,
                    w.Место_БИН?.Trim(),
                    w.Место_работы?.Trim() ?? w.Место_БИН!.Trim(),
                    w.Должность_текст,
                    w.Дата_начало!.Value,
                    w.Дата_окончание,
                    WorkConfirmationSource.Legacy,
                    w.Примечание
                ))
                .ToImmutableArray();

        private static ImmutableArray<GrantDeferral> mapDeferrals(IReadOnlyCollection<ЗапОтработкиМС> works, int? graduationYear)
            => works
                .Select(w => (work: w, type: placement(w)?.Deferral ?? (w.Отсрочка_служба_армии == true ? DeferralType.MilitaryConscription : (DeferralType?)null)))
                .Where(x => x.type != null)
                .Select(x => {
                    var from = x.work.Дата_начало ?? x.work.Направление_дата ?? (graduationYear is { } year ? new DateTime(year, 9, 1) : DateTime.Today);
                    var months = x.work.Срок_отсрочки ?? x.work.Срок_службы_в_армии;
                    var until = x.work.Дата_окончание ?? (months is > 0 and < 120 ? from.AddMonths((int)months.Value) : (DateTime?)null);
                    return new GrantDeferral(x.work.Id, x.type!.Value, from, until, x.work.Подтверджающий_документ_номер, x.work.Подтверджающий_документ_дата, x.work.Примечание, EndedAt: null);
                })
                .OrderBy(d => d.From)
                .ToImmutableArray();

        private static ImmutableArray<GrantNote> notes(Персона person, EducationLevel level, DateTime at) {
            var text = level switch {
                EducationLevel.Master => person.УмсМ_примечание,
                EducationLevel.Residency => person.УмсР_примечание,
                EducationLevel.Doctorate => person.УмсД_примечание,
                _ => person.Умс_примечание,
            };
            return string.IsNullOrWhiteSpace(text)
                ? ImmutableArray<GrantNote>.Empty
                : ImmutableArray.Create(new GrantNote(at, "УМОСК", text.Trim()));
        }
    }
}
