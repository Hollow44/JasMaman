using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;

namespace JasMaman.Modules.Grants.Logic {
    /// <summary>
    /// Чистые правила предметной области (без БД и UI) — покрыты тестами в JasMaman.Tests.
    /// </summary>
    public static class GrantRules {
        /// <summary>
        /// Отработанные полные месяцы по периодам работы. Пересекающиеся периоды объединяются,
        /// открытый период (без даты окончания) считается по <paramref name="today"/>.
        /// </summary>
        public static int WorkedMonths(IEnumerable<GrantWorkPeriod> periods, DateTime today) {
            var intervals = periods
                .Select(p => (from: p.From.Date, to: (p.To ?? today).Date))
                .Where(p => p.to >= p.from)
                .OrderBy(p => p.from)
                .ToList();

            var merged = new List<(DateTime from, DateTime to)>();
            foreach (var interval in intervals) {
                if (merged.Count > 0 && interval.from <= merged[^1].to.AddDays(1)) {
                    var last = merged[^1];
                    merged[^1] = (last.from, interval.to > last.to ? interval.to : last.to);
                } else {
                    merged.Add(interval);
                }
            }

            return merged.Sum(m => FullMonths(m.from, m.to));
        }

        /// <summary>
        /// Отработано всего: по периодам работы, но не меньше значения, перенесённого из УМОСК
        /// (там отработка частично велась числом месяцев без периодов).
        /// </summary>
        public static int TotalWorkedMonths(GrantState state, DateTime today)
            => Math.Max(WorkedMonths(state.WorkPeriods.Safe(), today), state.Obligation?.LegacyWorkedMonths ?? 0);

        /// <summary>Полные месяцы между датами включительно (01.09–31.08 = 12).</summary>
        public static int FullMonths(DateTime from, DateTime to) {
            if (to < from) {
                return 0;
            }
            var end = to.Date.AddDays(1);
            var months = (end.Year - from.Year) * 12 + end.Month - from.Month;
            if (end.Day < from.Day) {
                months--;
            }
            return Math.Max(0, months);
        }

        /// <summary>
        /// Сумма к возмещению пропорционально неотработанному сроку (соразмерный возврат):
        /// затраты бюджета × (требуемый срок − отработано) / требуемый срок.
        /// </summary>
        public static decimal ProportionalDebt(decimal budgetCost, int requiredMonths, int workedMonths) {
            if (requiredMonths <= 0 || budgetCost <= 0) {
                return 0;
            }
            var remaining = Math.Clamp(requiredMonths - workedMonths, 0, requiredMonths);
            return Math.Round(budgetCost * remaining / requiredMonths, 2, MidpointRounding.AwayFromZero);
        }

        public static decimal PaidAmount(IEnumerable<GrantPayment> payments) => payments.Sum(p => p.Amount);

        /// <summary>Остаток долга; null — долг не рассчитан.</summary>
        public static decimal? DebtBalance(GrantState state)
            => state.Obligation?.DebtAmount is { } debt
                ? Math.Max(0, debt - PaidAmount(state.Payments))
                : null;

        public static bool HasActiveDeferral(GrantState state, DateTime today)
            => state.Deferrals.Any(d => d.IsActive(today));

        /// <summary>
        /// Этап по текущим данным: обязательство закрыто, если оно выполнено, освобождено, прекращено
        /// или долг погашен полностью.
        /// </summary>
        public static GrantStage DeriveStage(GrantState state) {
            if (state.Obligation is { } obligation) {
                var closed = obligation.CompletedAt != null
                    || obligation.ReleasedAt != null
                    || obligation.TerminatedAt != null
                    || obligation.RecoveryStatus is RecoveryStatus.Archive or RecoveryStatus.ArchiveByCourtDecision or RecoveryStatus.Worked or RecoveryStatus.Deceased
                    || (obligation.DebtAmount > 0 && DebtBalance(state) == 0);
                return closed ? GrantStage.Closed : GrantStage.Obligation;
            }

            return state.Study.Movement switch {
                StudentMovement.ExpectedGraduation => GrantStage.ExpectedGraduation,
                var movement when movement.EndsStudy() => GrantStage.StudyEnded,
                _ => GrantStage.Studying
            };
        }

        /// <summary>Срок явки: 1 сентября года выпуска; при отсрочке — 30 календарных дней после её окончания.</summary>
        public static DateTime? ArrivalDeadline(GrantState state) {
            var lastEndedDeferral = state.Deferrals
                .Where(d => d.Until != null || d.EndedAt != null)
                .Select(d => (d.EndedAt ?? d.Until)!.Value)
                .DefaultIfEmpty()
                .Max();
            var baseDeadline = state.Obligation?.ArrivalDeadline;
            if (lastEndedDeferral != default) {
                var afterDeferral = lastEndedDeferral.Date.AddDays(30);
                return baseDeadline == null || afterDeferral > baseDeadline ? afterDeferral : baseDeadline;
            }
            return baseDeadline;
        }

        public static bool IsValidIin(string? iin) => iin is { Length: 12 } && iin.All(char.IsDigit);
        public static bool IsValidBin(string? bin) => IsValidIin(bin);
    }
}
