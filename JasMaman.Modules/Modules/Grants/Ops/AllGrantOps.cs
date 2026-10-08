using System.Collections.Immutable;

namespace JasMaman.Modules.Grants.Ops {
    public static class AllGrantOps {
        public static readonly CreateGrantOp Create = new();
        public static readonly ImportGrantOp Import = new();
        public static readonly ChangeMovementOp ChangeMovement = new();
        public static readonly UpdateContactsOp UpdateContacts = new();
        public static readonly SyncPersonOp SyncPerson = new();
        public static readonly GraduateOp Graduate = new();
        public static readonly AssignOp Assign = new();
        public static readonly ReleaseOp Release = new();
        public static readonly DeferOp Defer = new();
        public static readonly EndDeferralOp EndDeferral = new();
        public static readonly RecordWorkOp RecordWork = new();
        public static readonly ChangeMonitoringStatusOp ChangeMonitoringStatus = new();
        public static readonly CompleteObligationOp CompleteObligation = new();
        public static readonly ChangeRecoveryStatusOp ChangeRecoveryStatus = new();
        public static readonly CalculateDebtOp CalculateDebt = new();
        public static readonly RecordPaymentOp RecordPayment = new();
        public static readonly TerminateOp Terminate = new();
        public static readonly AddNoteOp AddNote = new();

        /// <summary>Все операции в порядке показа в карточке (по ходу БП).</summary>
        public static readonly ImmutableArray<IGrantOpManager> All = ImmutableArray.Create<IGrantOpManager>(
            Create, Import,
            ChangeMovement, UpdateContacts, SyncPerson, Graduate,
            Assign, Release, Defer, EndDeferral,
            RecordWork, ChangeMonitoringStatus, CompleteObligation,
            ChangeRecoveryStatus, CalculateDebt, RecordPayment, Terminate,
            AddNote
        );

        public static IGrantOpManager Get(GrantOpType opType) => All.Single(x => x.OpType == opType);
    }
}
