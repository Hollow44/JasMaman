using JasMaman.Modules.Grants.Jobs;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Migration;
using JasMaman.Modules.References;
using Newtonsoft.Json;
using PgOrm.Models;
using static JasMaman.Tests.TestData;

namespace JasMaman.Tests {
    public class GrantStateSerializationTests {
        [Fact]
        public void State_roundtrips_through_json() {
            var state = AllGrantOps.Defer.Apply(
                WithWork(Graduated(2024), new DateTime(2024, 9, 1), new DateTime(2025, 8, 31)),
                new DeferModel(DeferralType.MilitaryConscription, new DateTime(2025, 9, 1), new DateTime(2026, 9, 1), "В-1", null, null),
                Ctx());

            var json = JsonConvert.SerializeObject(state);
            var restored = JsonConvert.DeserializeObject<GrantState>(json)!.Normalize();

            Assert.Equal(state.Person, restored.Person);
            Assert.Equal(state.Study, restored.Study);
            Assert.Equal(state.Obligation, restored.Obligation);
            Assert.Equal(state.WorkPeriods, restored.WorkPeriods);
            Assert.Equal(state.Deferrals, restored.Deferrals);
            Assert.Contains("\"MilitaryConscription\"", json); // enum хранится строкой — устойчиво к перестановке значений
        }

        [Fact]
        public void Import_model_does_not_store_snapshot_in_journal() {
            var json = JsonConvert.SerializeObject(new ImportGrantModel(5, 6, Graduated()));
            Assert.DoesNotContain("Snapshot", json);
            Assert.DoesNotContain("990101300123", json);
        }
    }

    public class LegacyMappingTests {
        private const long StateOrderCategory = 35926391;
        private const long MasterCategory = 53490427;
        private const long CareerCenterPlacement = 61622912;
        private const long MasterKzDeferral = 225426389;

        private static readonly LegacyLookups lookups = new(
            new Dictionary<long, StudentMovement> { [100] = StudentMovement.Graduated, [101] = StudentMovement.NextCourse },
            id => id == 1 ? ("000140001234", "Университет") : null,
            id => id == 2 ? ("6B01101", "Педагогика") : null
        );

        private static Персона person() => new() {
            Id = 77,
            Ад_зап_перс_данных = new ЗапПерсДанных { Id = 1, Иин = "990101300123", Фамилия = "Иванова", Имя = "Айгерим" },
            Статус_заемщика_тксId = 59384093, // ИП — по бакалавриату
            УмсМ_статус_заемщика_тксId = 26595916, // Архив — по магистратуре
            Отработано_бак_месяцев = 7,
            Техн_телефон = "+77011234567",
        };

        private static ЗапОбучения study(long id, long category, long movement) => new() {
            Id = id, ПерсонаId = 77, Статус_УМСId = category, ДвижениеId = movement, ВузId = 1, СпециальностьId = 2,
            Год_поступл_в_вуз = 2019, Год_окнч_вуза = 2023, Умс_сумма = 3_600_000,
        };

        [Fact]
        public void Maps_graduated_study_with_obligation_and_level_specific_person_fields() {
            var works = new[] {
                new ЗапОтработкиМС { Id = 1, Направление_номер = "Н-1", Направление_дата = new DateTime(2023, 7, 1), Место_работы = "Школа", Место_БИН = "123456789012", Дата_начало = new DateTime(2023, 9, 1), Дата_окончание = new DateTime(2024, 5, 31) },
                new ЗапОтработкиМС { Id = 2, Разделение_мест_распределения_МСId = CareerCenterPlacement, Дата_начало = new DateTime(2024, 6, 1), Место_работы = "КЦ" },
                new ЗапОтработкиМС { Id = 3, Разделение_мест_распределения_МСId = MasterKzDeferral, Дата_начало = new DateTime(2024, 9, 1), Срок_отсрочки = 24 },
            };

            var result = LegacyGrantMapper.Map(study(10, StateOrderCategory, 100), person(), works, lookups, new DateTime(2026, 10, 7));
            var state = result.State!;

            Assert.Null(result.SkipReason);
            Assert.Equal(10, state.LegacyStudyId);
            Assert.Equal("Иванова", state.Person.LastName);
            Assert.Equal(GrantCategory.StateOrder, state.Study.GrantCategory);
            Assert.Equal(EducationLevel.Bachelor, state.Study.EducationLevel);
            Assert.Equal("Университет", state.Study.UniversityName);
            Assert.Equal(3_600_000m, state.Study.BudgetCost);

            var obligation = state.Obligation!;
            Assert.Equal(RecoveryStatus.EnforcementProceedings, obligation.RecoveryStatus);
            Assert.Equal(7, obligation.LegacyWorkedMonths);
            Assert.Equal(new DateTime(2023, 9, 1), obligation.ArrivalDeadline);

            Assert.Equal(2, state.Assignments.Length); // направление + Карьерный центр
            Assert.Equal(AssignmentKind.Main, state.Assignments[0].Kind);
            Assert.Single(state.WorkPeriods); // КЦ и отсрочка не засчитываются как работа
            var deferral = Assert.Single(state.Deferrals);
            Assert.Equal(DeferralType.MasterKz, deferral.Type);
            Assert.Equal(new DateTime(2026, 9, 1), deferral.Until);
        }

        [Fact]
        public void Uses_master_fields_for_master_study() {
            var state = LegacyGrantMapper.Map(study(11, MasterCategory, 100), person(), Array.Empty<ЗапОтработкиМС>(), lookups, DateTime.Today).State!;
            Assert.Equal(EducationLevel.Master, state.Study.EducationLevel);
            Assert.Equal(RecoveryStatus.Archive, state.Obligation!.RecoveryStatus);
            Assert.Null(state.Obligation.LegacyWorkedMonths);
        }

        [Fact]
        public void Student_without_graduation_and_works_has_no_obligation() {
            var state = LegacyGrantMapper.Map(study(12, StateOrderCategory, 101), person(), Array.Empty<ЗапОтработкиМС>(), lookups, DateTime.Today).State!;
            Assert.Null(state.Obligation);
            Assert.Empty(state.Assignments);
        }

        [Fact]
        public void Skips_non_grant_and_invalid_iin() {
            var noCategory = study(13, StateOrderCategory, 100);
            noCategory.Статус_УМСId = null;
            Assert.Null(LegacyGrantMapper.Map(noCategory, person(), Array.Empty<ЗапОтработкиМС>(), lookups, DateTime.Today).State);

            var badPerson = person();
            badPerson.Ад_зап_перс_данных!.Иин = "123";
            Assert.Null(LegacyGrantMapper.Map(study(14, StateOrderCategory, 100), badPerson, Array.Empty<ЗапОтработкиМС>(), lookups, DateTime.Today).State);
        }

        [Fact]
        public void Works_are_distributed_by_education_level() {
            var bachelor = study(20, StateOrderCategory, 100);
            var master = study(21, MasterCategory, 100);
            master.Год_окнч_вуза = 2025;
            var works = new[] {
                new ЗапОтработкиМС { Id = 1, Статус_УМСId = StateOrderCategory },
                new ЗапОтработкиМС { Id = 2, Статус_УМСId = MasterCategory },
                new ЗапОтработкиМС { Id = 3 }, // без категории — к последнему выпуску
            };

            var distributed = MigrateGrantsJob.distributeWorks(new[] { bachelor, master }, works).ToDictionary(x => x.study.Id, x => x.works.Select(w => w.Id).ToArray());

            Assert.Equal(new long[] { 1 }, distributed[20]);
            Assert.Equal(new long[] { 2, 3 }, distributed[21]);
        }
    }

    public class LegacyReferenceMapTests {
        [Fact]
        public void Every_enum_value_has_a_legacy_source() {
            Assert.Equal(Enum.GetValues<RecoveryStatus>().Where(x => x != RecoveryStatus.None).OrderBy(x => x), LegacyReferenceMap.RecoveryStatuses.Values.Distinct().OrderBy(x => x));
            Assert.Equal(Enum.GetValues<MonitoringStatus>().OrderBy(x => x), LegacyReferenceMap.MonitoringStatuses.Values.Distinct().OrderBy(x => x));
            Assert.Equal(Enum.GetValues<GrantCategory>().OrderBy(x => x), LegacyReferenceMap.GrantCategories.Values.Distinct().OrderBy(x => x));
            Assert.Equal(Enum.GetValues<ReleaseReason>().OrderBy(x => x), LegacyReferenceMap.ReleaseReasons.Values.Distinct().OrderBy(x => x));
            Assert.Equal(Enum.GetValues<TerminationReason>().OrderBy(x => x), LegacyReferenceMap.TerminationReasons.Values.Distinct().OrderBy(x => x));
            Assert.Equal(Enum.GetValues<DeferralType>().OrderBy(x => x), LegacyReferenceMap.Placements.Values.Where(p => p.Deferral != null).Select(p => p.Deferral!.Value).OrderBy(x => x));
        }

        [Fact]
        public void Placement_maps_to_exactly_one_of_placement_or_deferral()
            => Assert.All(LegacyReferenceMap.Placements.Values, p => Assert.True(p.Placement.HasValue ^ p.Deferral.HasValue));

        [Fact]
        public void Every_reference_has_text_for_each_value() {
            Assert.All(Enum.GetValues<MonitoringStatus>(), v => Assert.True(RefMonitoringStatus.Texts.ContainsKey(v)));
            Assert.All(Enum.GetValues<RecoveryStatus>(), v => Assert.True(RefRecoveryStatus.Texts.ContainsKey(v)));
            Assert.All(Enum.GetValues<StudentMovement>(), v => Assert.True(RefStudentMovement.Texts.ContainsKey(v)));
            Assert.All(Enum.GetValues<GrantOpType>(), v => Assert.True(GrantOpTypeExtensions.Options.ContainsKey(v)));
            Assert.All(Enum.GetValues<GrantOpType>(), v => Assert.Contains(AllGrantOps.All, op => op.OpType == v));
        }
    }
}
