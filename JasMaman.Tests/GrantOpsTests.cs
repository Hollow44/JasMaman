using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using static JasMaman.Tests.TestData;

namespace JasMaman.Tests {
    public class GrantOpsTests {
        private static readonly DateTime Today = new(2026, 10, 7);

        [Fact]
        public void Graduate_creates_obligation_with_arrival_deadline() {
            var state = Graduated(2026);

            Assert.Equal(StudentMovement.Graduated, state.Study.Movement);
            Assert.Equal(2026, state.Study.GraduationYear);
            Assert.NotNull(state.Obligation);
            Assert.Equal(36, state.Obligation!.RequiredMonths);
            Assert.Equal(new DateTime(2026, 9, 1), state.Obligation.ArrivalDeadline);
            Assert.Equal(RecoveryStatus.None, state.Obligation.RecoveryStatus);
        }

        [Fact]
        public void Graduate_for_master_sets_master_movement() {
            var state = AllGrantOps.Graduate.Apply(Studying(EducationLevel.Master), new GraduateModel(2026, "1", Today, 1m, null), Ctx(University));
            Assert.Equal(StudentMovement.GraduatedMaster, state.Study.Movement);
        }

        [Fact]
        public void University_can_work_only_with_own_students() {
            var state = Studying();
            Assert.True(AllGrantOps.Graduate.CheckAvailable(state, University).ok);
            Assert.False(AllGrantOps.Graduate.CheckAvailable(state, OtherUniversity).ok);
            Assert.False(AllGrantOps.Graduate.CheckAvailable(state, Guest).ok);
            Assert.True(AllGrantOps.Graduate.CheckAvailable(state, Monitoring).ok);
        }

        [Fact]
        public void Distribution_ops_require_obligation() {
            var studying = Studying();
            Assert.False(AllGrantOps.Assign.CheckAvailable(studying, Monitoring).ok);
            Assert.False(AllGrantOps.Defer.CheckAvailable(studying, Monitoring).ok);
            Assert.True(AllGrantOps.Assign.CheckAvailable(Graduated(), Monitoring).ok);
        }

        [Fact]
        public void Second_main_protocol_is_rejected() {
            var model = new AssignModel(AssignmentKind.Main, "П-1", Today, PlacementType.EducationDepartment, "123456789012", "Школа №1", null, null, null, null, null, null, null);
            var assigned = AllGrantOps.Assign.Apply(Graduated(), model, Ctx(University));

            Assert.Single(assigned.Assignments);
            Assert.Contains(AllGrantOps.Assign.Validate(assigned, model, Today), e => e.Contains("Основное распределение уже оформлено"));
            Assert.Empty(AllGrantOps.Assign.Validate(assigned, model with { Kind = AssignmentKind.Additional }, Today));
        }

        [Fact]
        public void Assign_to_career_center_sets_monitoring_status() {
            var model = new AssignModel(AssignmentKind.Main, "П-1", Today, PlacementType.CareerCenter, null, null, null, null, null, null, null, null, null);
            var state = AllGrantOps.Assign.Apply(Graduated(), model, Ctx(University));
            Assert.Equal(MonitoringStatus.EmploymentCenter, state.Obligation!.MonitoringStatus);
        }

        [Fact]
        public void Release_closes_obligation() {
            var state = AllGrantOps.Release.Apply(Graduated(), new ReleaseModel(ReleaseReason.ChildUnderThree, "Д-1", Today, "123", Today, null), Ctx(University));

            Assert.Equal(ReleaseReason.ChildUnderThree, state.Obligation!.ReleaseReason);
            Assert.Equal(MonitoringStatus.Released, state.Obligation.MonitoringStatus);
            Assert.Equal(GrantStage.Closed, GrantRules.DeriveStage(state));
            Assert.False(AllGrantOps.Assign.CheckAvailable(state, Monitoring).ok);
        }

        [Fact]
        public void Defer_requires_end_after_start_and_no_active_deferral() {
            var graduated = Graduated();
            var model = new DeferModel(DeferralType.MasterAbroad, new DateTime(2026, 9, 1), new DateTime(2028, 6, 30), "З-1", null, null);

            Assert.Empty(AllGrantOps.Defer.Validate(graduated, model, Today));
            Assert.NotEmpty(AllGrantOps.Defer.Validate(graduated, model with { Until = model.From }, Today));

            var deferred = AllGrantOps.Defer.Apply(graduated, model, Ctx(University));
            Assert.Equal(MonitoringStatus.TemporaryDeferral, deferred.Obligation!.MonitoringStatus);
            Assert.Contains(AllGrantOps.Defer.Validate(deferred, model, Today), e => e.Contains("уже есть действующая отсрочка"));
        }

        [Fact]
        public void EndDeferral_moves_arrival_deadline_thirty_days_after_end() {
            var deferred = AllGrantOps.Defer.Apply(Graduated(), new DeferModel(DeferralType.MasterKz, new DateTime(2026, 9, 1), new DateTime(2028, 6, 30), "З-1", null, null), Ctx());
            var ended = AllGrantOps.EndDeferral.Apply(deferred, new EndDeferralModel(new DateTime(2028, 6, 25), null), Ctx());

            Assert.Equal(new DateTime(2028, 6, 25), ended.Deferrals.Single().EndedAt);
            Assert.Null(ended.Obligation!.MonitoringStatus);
            Assert.Equal(new DateTime(2028, 7, 25), ended.Obligation.ArrivalDeadline);
        }

        [Fact]
        public void RecordWork_marks_specialist_as_arrived() {
            var model = new RecordWorkModel("123456789012", "Школа №1", "Учитель", new DateTime(2026, 9, 1), null, WorkConfirmationSource.Mtszn, null);
            var state = AllGrantOps.RecordWork.Apply(Graduated(), model, Ctx());

            Assert.Single(state.WorkPeriods);
            Assert.Equal(MonitoringStatus.Arrived, state.Obligation!.MonitoringStatus);
            Assert.NotEmpty(AllGrantOps.RecordWork.Validate(state, model with { To = new DateTime(2026, 1, 1) }, Today));
        }

        [Fact]
        public void CompleteObligation_requires_full_term_and_head_of_department() {
            var graduated = Graduated(2023);
            var model = new CompleteObligationModel(Today, null);

            Assert.False(AllGrantOps.CompleteObligation.CheckAvailable(graduated, Monitoring).ok);
            Assert.True(AllGrantOps.CompleteObligation.CheckAvailable(graduated, MonitoringHead).ok);
            Assert.NotEmpty(AllGrantOps.CompleteObligation.Validate(graduated, model, Today));

            var worked = WithWork(graduated, new DateTime(2023, 9, 1), new DateTime(2026, 8, 31));
            Assert.Empty(AllGrantOps.CompleteObligation.Validate(worked, model, Today));

            var completed = AllGrantOps.CompleteObligation.Apply(worked, model, Ctx(MonitoringHead));
            Assert.Equal(MonitoringStatus.Worked, completed.Obligation!.MonitoringStatus);
            Assert.Equal(GrantStage.Closed, GrantRules.DeriveStage(completed));
        }

        [Fact]
        public void Recovery_transitions_are_split_between_monitoring_head_and_legal() {
            Assert.Empty(ChangeRecoveryStatusOp.ValidateTransition(RecoveryStatus.None, RecoveryStatus.LegalDepartment, MonitoringHead));
            Assert.NotEmpty(ChangeRecoveryStatusOp.ValidateTransition(RecoveryStatus.None, RecoveryStatus.LegalDepartment, Legal));
            Assert.Empty(ChangeRecoveryStatusOp.ValidateTransition(RecoveryStatus.LegalDepartment, RecoveryStatus.EnforcementProceedings, Legal));
            Assert.NotEmpty(ChangeRecoveryStatusOp.ValidateTransition(RecoveryStatus.LegalDepartment, RecoveryStatus.EnforcementProceedings, MonitoringHead));
            Assert.NotEmpty(ChangeRecoveryStatusOp.ValidateTransition(RecoveryStatus.Archive, RecoveryStatus.Archive, Legal));

            Assert.Throws<GrantOpException>(() => AllGrantOps.ChangeRecoveryStatus.Apply(
                Graduated(), new ChangeRecoveryStatusModel(RecoveryStatus.ArchiveByCourtDecision, null, null, null), Ctx(MonitoringHead)));
        }

        [Fact]
        public void Full_payment_moves_recovery_status_to_archive() {
            var withDebt = AllGrantOps.CalculateDebt.Apply(Graduated(), new CalculateDebtModel(1_000_000m, 0, null), Ctx());
            Assert.False(AllGrantOps.RecordPayment.CheckAvailable(Graduated(), Accounting).ok);
            Assert.True(AllGrantOps.RecordPayment.CheckAvailable(withDebt, Accounting).ok);

            var partial = AllGrantOps.RecordPayment.Apply(withDebt, new RecordPaymentModel(400_000m, Today, "ПП-1", null), Ctx(Accounting));
            Assert.Equal(600_000m, GrantRules.DebtBalance(partial));
            Assert.Equal(RecoveryStatus.None, partial.Obligation!.RecoveryStatus);

            var paid = AllGrantOps.RecordPayment.Apply(partial, new RecordPaymentModel(600_000m, Today, "ПП-2", null), Ctx(Accounting));
            Assert.Equal(0m, GrantRules.DebtBalance(paid));
            Assert.Equal(RecoveryStatus.Archive, paid.Obligation!.RecoveryStatus);
            Assert.Equal(GrantStage.Closed, GrantRules.DeriveStage(paid));
        }

        [Fact]
        public void CalculateDebt_suggests_proportional_amount() {
            var state = WithWork(Graduated(2023), new DateTime(2023, 9, 1), new DateTime(2024, 8, 31));
            var model = AllGrantOps.CalculateDebt.EmptyModel(state);
            Assert.True(model.WorkedMonths >= 12);
            Assert.Equal(GrantRules.ProportionalDebt(3_600_000m, 36, model.WorkedMonths), model.Amount);
        }

        [Fact]
        public void Terminate_by_death_sets_deceased_statuses() {
            var state = AllGrantOps.Terminate.Apply(Graduated(), new TerminateModel(TerminationReason.Death, Today, "СС-1", null), Ctx(MonitoringHead));
            Assert.Equal(RecoveryStatus.Deceased, state.Obligation!.RecoveryStatus);
            Assert.Equal(MonitoringStatus.Deceased, state.Obligation.MonitoringStatus);
            Assert.Equal(GrantStage.Closed, GrantRules.DeriveStage(state));
        }

        [Fact]
        public void ChangeMovement_rejects_graduation_and_future_dates() {
            var studying = Studying();
            Assert.NotEmpty(AllGrantOps.ChangeMovement.Validate(studying, new ChangeMovementModel(StudentMovement.Graduated, Today, "1", Today, null, null, null, null), Today));
            Assert.NotEmpty(AllGrantOps.ChangeMovement.Validate(studying, new ChangeMovementModel(StudentMovement.Expelled, Today.AddDays(1), "1", Today, null, null, null, null), Today));

            var expelled = AllGrantOps.ChangeMovement.Apply(studying, new ChangeMovementModel(StudentMovement.Expelled, Today, "1", Today, null, null, null, "по собственному"), Ctx(University));
            Assert.Equal(GrantStage.StudyEnded, GrantRules.DeriveStage(expelled));
            Assert.Single(expelled.Notes);
            Assert.False(AllGrantOps.Graduate.CheckAvailable(expelled, University).ok);
        }

        [Fact]
        public void Create_builds_new_grant_with_level_from_category() {
            var model = new CreateGrantModel("010101300123", "Сериков", "Ерлан", null, null, null, null, 1, UniversityBin, "Университет", null, null, null,
                GrantCategory.MasterOtherSpecialities, 2025, "З-1", Today, null);
            var state = AllGrantOps.Create.Apply(null, model, Ctx(University));

            Assert.Equal(EducationLevel.Master, state.Study.EducationLevel);
            Assert.Equal(StudentMovement.EnteredMaster, state.Study.Movement);
            Assert.Null(state.Obligation);
            Assert.True(AllGrantOps.Create.CheckAvailable(null, University).ok);
            Assert.False(AllGrantOps.Create.CheckAvailable(null, Accounting).ok);
        }

        [Fact]
        public void Import_preserves_records_added_in_new_system() {
            var existing = AllGrantOps.RecordWork.Apply(Graduated(2023),
                new RecordWorkModel(null, "Новая работа", null, new DateTime(2025, 1, 1), null, WorkConfirmationSource.SpecialistDocument, null), Ctx());
            var snapshot = WithWork(Graduated(2023), new DateTime(2023, 9, 1), new DateTime(2024, 8, 31));

            var merged = AllGrantOps.Import.Apply(existing, new ImportGrantModel(1, 2, snapshot), Ctx(GrantOpUserContext.System));

            Assert.Equal(existing.GrantId, merged.GrantId);
            Assert.Equal(2, merged.WorkPeriods.Length);
            Assert.False(AllGrantOps.Import.CheckAvailable(null, Monitoring).ok);
        }

        [Theory]
        [InlineData("+77011234567", true)]
        [InlineData("87011234567", true)]
        [InlineData("+7 701 123 45 67", true)]
        [InlineData("7011234567", false)]
        public void Phone_must_be_kazakhstan_mobile_format(string phone, bool valid)
            => Assert.Equal(valid, GrantContacts.IsValidPhone(phone));
    }
}
