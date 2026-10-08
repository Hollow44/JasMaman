using System.Collections.Immutable;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;

namespace JasMaman.Tests {
    internal static class TestData {
        public const string UniversityBin = "000140001234";

        public static readonly GrantOpUserContext Monitoring = user(GrantActor.Monitoring);
        public static readonly GrantOpUserContext MonitoringHead = user(GrantActor.MonitoringHead | GrantActor.Monitoring);
        public static readonly GrantOpUserContext Legal = user(GrantActor.Legal);
        public static readonly GrantOpUserContext Accounting = user(GrantActor.Accounting);
        public static readonly GrantOpUserContext University = new(10, "uni", UniversityBin, "Вуз", GrantActor.University, isAuthenticated: true);
        public static readonly GrantOpUserContext OtherUniversity = new(11, "uni2", "999940009999", "Другой вуз", GrantActor.University, isAuthenticated: true);
        public static readonly GrantOpUserContext Guest = new(0, "guest", "guest", "guest", GrantActor.None, isAuthenticated: false);

        private static GrantOpUserContext user(GrantActor actors) => new(1, "user", "870101300123", "Сотрудник", actors, isAuthenticated: true);

        private static long _nextId = 1000;

        public static GrantOpApplyContext Ctx(GrantOpUserContext? user = null, DateTime? now = null)
            => new(now ?? new DateTime(2026, 10, 7, 12, 0, 0), user ?? Monitoring, () => Interlocked.Increment(ref _nextId));

        public static GrantState Studying(EducationLevel level = EducationLevel.Bachelor) => GrantState.New(
            new GrantId(1),
            new GrantPerson("990101300123", "Иванова", "Айгерим", null, new DateTime(1999, 1, 1), "+77011234567", null, null),
            new GrantStudy(
                UniversityId: 1, UniversityBin: UniversityBin, UniversityName: "Университет",
                SpecialityId: 2, SpecialityCode: "6B01101", SpecialityName: "Педагогика",
                GrantCategory: level == EducationLevel.Master ? GrantCategory.Master : GrantCategory.StateOrder,
                EducationLevel: level,
                EnrollmentYear: 2022, GraduationYear: null, BudgetCost: 3_600_000m,
                Movement: StudentMovement.Enrolled, MovementDate: new DateTime(2022, 8, 25),
                OrderNumber: "1-З", OrderDate: new DateTime(2022, 8, 25)
            ),
            new DateTime(2022, 8, 25)
        ) with { BaseRowVersion = 1 };

        public static GrantState Graduated(int year = 2026) {
            var state = Studying();
            return AllGrantOps.Graduate.Apply(state, new GraduateModel(year, "77-В", new DateTime(year, 6, 30), 3_600_000m, null), Ctx(University));
        }

        public static GrantState WithWork(GrantState state, DateTime from, DateTime? to)
            => state with {
                WorkPeriods = state.WorkPeriods.Safe().Add(new GrantWorkPeriod(Interlocked.Increment(ref _nextId), "123456789012", "Школа", null, from, to, WorkConfirmationSource.Mtszn, null))
            };

        public static ImmutableArray<T> Arr<T>(params T[] items) => items.ToImmutableArray();
    }
}
