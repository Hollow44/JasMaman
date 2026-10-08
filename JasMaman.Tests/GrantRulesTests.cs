using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;

namespace JasMaman.Tests {
    public class GrantRulesTests {
        [Theory]
        [InlineData("2023-09-01", "2024-08-31", 12)]
        [InlineData("2023-09-01", "2023-09-30", 1)]
        [InlineData("2023-09-15", "2023-10-13", 0)]
        [InlineData("2023-09-15", "2023-10-14", 1)]
        [InlineData("2023-09-01", "2026-08-31", 36)]
        public void FullMonths_counts_complete_months_inclusive(string from, string to, int expected)
            => Assert.Equal(expected, GrantRules.FullMonths(DateTime.Parse(from), DateTime.Parse(to)));

        [Fact]
        public void WorkedMonths_merges_overlapping_and_adjacent_periods() {
            var state = TestData.Graduated(2023);
            state = TestData.WithWork(state, new DateTime(2023, 9, 1), new DateTime(2024, 8, 31));
            state = TestData.WithWork(state, new DateTime(2024, 3, 1), new DateTime(2024, 12, 31)); // пересекается
            state = TestData.WithWork(state, new DateTime(2025, 1, 1), new DateTime(2025, 2, 28)); // примыкает

            Assert.Equal(18, GrantRules.WorkedMonths(state.WorkPeriods, new DateTime(2026, 1, 1)));
        }

        [Fact]
        public void WorkedMonths_counts_open_period_until_today() {
            var state = TestData.WithWork(TestData.Graduated(2025), new DateTime(2025, 9, 1), null);
            Assert.Equal(13, GrantRules.WorkedMonths(state.WorkPeriods, new DateTime(2026, 10, 7)));
        }

        [Fact]
        public void TotalWorkedMonths_uses_legacy_months_as_lower_bound() {
            var state = TestData.Graduated(2020);
            state = state with { Obligation = state.Obligation! with { LegacyWorkedMonths = 24 } };
            state = TestData.WithWork(state, new DateTime(2025, 1, 1), new DateTime(2025, 12, 31));
            Assert.Equal(24, GrantRules.TotalWorkedMonths(state, new DateTime(2026, 1, 1)));
        }

        [Theory]
        [InlineData(3_600_000, 36, 0, 3_600_000)]
        [InlineData(3_600_000, 36, 12, 2_400_000)]
        [InlineData(3_600_000, 36, 36, 0)]
        [InlineData(3_600_000, 36, 40, 0)]
        [InlineData(1_000_000, 36, 1, 972_222.22)]
        public void ProportionalDebt_is_proportional_to_unworked_months(double cost, int required, int worked, double expected)
            => Assert.Equal((decimal)expected, GrantRules.ProportionalDebt((decimal)cost, required, worked));

        [Fact]
        public void DeriveStage_follows_lifecycle() {
            var studying = TestData.Studying();
            Assert.Equal(GrantStage.Studying, GrantRules.DeriveStage(studying));

            var expected = studying with { Study = studying.Study with { Movement = StudentMovement.ExpectedGraduation } };
            Assert.Equal(GrantStage.ExpectedGraduation, GrantRules.DeriveStage(expected));

            var expelled = studying with { Study = studying.Study with { Movement = StudentMovement.Expelled } };
            Assert.Equal(GrantStage.StudyEnded, GrantRules.DeriveStage(expelled));

            var graduated = TestData.Graduated();
            Assert.Equal(GrantStage.Obligation, GrantRules.DeriveStage(graduated));

            var archived = graduated with { Obligation = graduated.Obligation! with { RecoveryStatus = RecoveryStatus.Archive } };
            Assert.Equal(GrantStage.Closed, GrantRules.DeriveStage(archived));

            var inLegal = graduated with { Obligation = graduated.Obligation! with { RecoveryStatus = RecoveryStatus.LegalDepartment } };
            Assert.Equal(GrantStage.Obligation, GrantRules.DeriveStage(inLegal));
        }

        [Fact]
        public void ArrivalDeadline_is_september_first_or_thirty_days_after_deferral() {
            var graduated = TestData.Graduated(2026);
            Assert.Equal(new DateTime(2026, 9, 1), GrantRules.ArrivalDeadline(graduated));

            var deferred = graduated with {
                Deferrals = TestData.Arr(new GrantDeferral(1, DeferralType.MasterKz, new DateTime(2026, 9, 1), new DateTime(2028, 6, 30), null, null, null, EndedAt: null))
            };
            Assert.Equal(new DateTime(2028, 7, 30), GrantRules.ArrivalDeadline(deferred));
        }

        [Theory]
        [InlineData("990101300123", true)]
        [InlineData("99010130012", false)]
        [InlineData("99010130012A", false)]
        [InlineData(null, false)]
        public void IsValidIin(string? iin, bool expected) => Assert.Equal(expected, GrantRules.IsValidIin(iin));
    }
}
