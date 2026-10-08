using System.Collections.Immutable;
using JasMaman.Modules.References;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Yoda.YodaReferences;
using YodaApp.UiSearch;

namespace JasMaman.Modules.Grants.States {
    /// <summary>Молодой специалист (обучающийся по гранту) — персональные данные.</summary>
    public record GrantPerson(
        string Iin,
        string LastName,
        string FirstName,
        string? MiddleName,
        DateTime? BirthDate,
        string? Phone,
        string? Email,
        string? Address
    ) {
        public string FullName => string.Join(" ", new[] { LastName, FirstName, MiddleName }.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    /// <summary>Обучение по гранту на одном уровне образования.</summary>
    public record GrantStudy(
        long? UniversityId,
        string? UniversityBin,
        string? UniversityName,
        long? SpecialityId,
        string? SpecialityCode,
        string? SpecialityName,
        GrantCategory? GrantCategory,
        EducationLevel EducationLevel,
        int? EnrollmentYear,
        int? GraduationYear,
        decimal? BudgetCost,
        StudentMovement Movement,
        DateTime? MovementDate,
        string? OrderNumber,
        DateTime? OrderDate
    );

    /// <summary>Обязательство по отработке. Появляется после выпуска (см. <see cref="StudentMovementExtensions.CreatesObligation"/>).</summary>
    public record GrantObligation(
        MonitoringStatus? MonitoringStatus,
        RecoveryStatus RecoveryStatus,
        int RequiredMonths,
        DateTime? ArrivalDeadline,
        Benefit? Benefit,
        ReleaseReason? ReleaseReason,
        DateTime? ReleasedAt,
        TerminationReason? TerminationReason,
        DateTime? TerminatedAt,
        decimal? DebtAmount,
        DateTime? CompletedAt,
        int? LegacyWorkedMonths = null
    ) {
        /// <summary>Стандартный срок отработки — 3 года.</summary>
        public const int DefaultRequiredMonths = 36;

        public static GrantObligation New(int graduationYear) => new(
            MonitoringStatus: null,
            RecoveryStatus: RecoveryStatus.None,
            RequiredMonths: DefaultRequiredMonths,
            ArrivalDeadline: new DateTime(graduationYear, 9, 1),
            Benefit: null,
            ReleaseReason: null,
            ReleasedAt: null,
            TerminationReason: null,
            TerminatedAt: null,
            DebtAmount: null,
            CompletedAt: null
        );
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum AssignmentKind {
        Main,
        Additional
    }

    /// <summary>Распределение по протоколу комиссии (основному или дополнительному).</summary>
    public record GrantAssignment(
        long AssignmentId,
        AssignmentKind Kind,
        string? ProtocolNumber,
        DateTime? ProtocolDate,
        PlacementType? PlacementType,
        string? EmployerBin,
        string? EmployerName,
        string? Region,
        string? Position,
        string? DirectionNumber,
        DateTime? DirectionDate,
        DateTime? WorkStart,
        string? Note,
        DateTime CreatedAt
    );

    [JsonConverter(typeof(StringEnumConverter))]
    public enum WorkConfirmationSource {
        Mtszn,
        Mio,
        CareerCenter,
        SpecialistDocument,
        Legacy
    }

    /// <summary>Подтверждённый период работы (засчитывается в отработку).</summary>
    public record GrantWorkPeriod(
        long WorkPeriodId,
        string? EmployerBin,
        string? EmployerName,
        string? Position,
        DateTime From,
        DateTime? To,
        WorkConfirmationSource Source,
        string? Note
    );

    /// <summary>Отсрочка отработки с явной датой окончания (в legacy дата не фиксировалась).</summary>
    public record GrantDeferral(
        long DeferralId,
        DeferralType Type,
        DateTime From,
        DateTime? Until,
        string? DocumentNumber,
        DateTime? DocumentDate,
        string? Note,
        DateTime? EndedAt
    ) {
        public bool IsActive(DateTime today) => EndedAt == null && (Until == null || Until.Value.Date >= today.Date);
    }

    /// <summary>Платёж в счёт возмещения бюджетных средств.</summary>
    public record GrantPayment(
        long PaymentId,
        decimal Amount,
        DateTime PaidAt,
        string? DocumentNumber,
        string? Note
    );

    public record GrantNote(DateTime At, string Author, string Text);

    /// <summary>Этап жизненного цикла гранта (верхнеуровневый, для реестров и фильтров).</summary>
    [JsonConverter(typeof(StringEnumConverter))]
    public enum GrantStage {
        Studying,
        ExpectedGraduation,
        StudyEnded,
        Obligation,
        Closed
    }

    public static class GrantStageExtensions {
        public static readonly Dictionary<GrantStage, (string text, BootstrapColor color)> Options = new() {
            [GrantStage.Studying] = ("Обучается", BootstrapColor.Info),
            [GrantStage.ExpectedGraduation] = ("Ожидаемый выпуск", BootstrapColor.Primary),
            [GrantStage.StudyEnded] = ("Обучение прекращено", BootstrapColor.Secondary),
            [GrantStage.Obligation] = ("Обязательство по отработке", BootstrapColor.Warning),
            [GrantStage.Closed] = ("Обязательство закрыто", BootstrapColor.Success),
        };
        public static string ToDisplayText(this GrantStage stage) => Options[stage].text;
        public static BootstrapColor ToBootstrapColor(this GrantStage stage) => Options[stage].color;
    }

    public class RefGrantStage : ReferenceEnum<GrantStage> {
        public const string RefName = nameof(RefGrantStage);
        private static readonly Dictionary<GrantStage, string> _texts = GrantStageExtensions.Options.ToDictionary(x => x.Key, x => x.Value.text);
        public RefGrantStage() : base(RefName, "Этап", _texts) { }
    }

    public class RefAssignmentKind : ReferenceEnum<AssignmentKind> {
        public const string RefName = nameof(RefAssignmentKind);
        private static readonly Dictionary<AssignmentKind, string> _texts = new() {
            [AssignmentKind.Main] = "Основной протокол",
            [AssignmentKind.Additional] = "Дополнительный протокол (перераспределение)",
        };
        public RefAssignmentKind() : base(RefName, "Вид протокола", _texts) { }
    }

    public class RefWorkConfirmationSource : ReferenceEnum<WorkConfirmationSource> {
        public const string RefName = nameof(RefWorkConfirmationSource);
        public static IReadOnlyDictionary<WorkConfirmationSource, string> Texts => _texts;
        private static readonly Dictionary<WorkConfirmationSource, string> _texts = new() {
            [WorkConfirmationSource.Mtszn] = "МТСЗН РК",
            [WorkConfirmationSource.Mio] = "МИО",
            [WorkConfirmationSource.CareerCenter] = "Карьерный центр",
            [WorkConfirmationSource.SpecialistDocument] = "Документы молодого специалиста",
            [WorkConfirmationSource.Legacy] = "Перенесено из УМОСК",
        };
        public RefWorkConfirmationSource() : base(RefName, "Источник подтверждения", _texts) { }
    }

    public static class ImmutableArrayExtensions {
        public static ImmutableArray<T> Safe<T>(this ImmutableArray<T> array) => array.IsDefault ? ImmutableArray<T>.Empty : array;
    }
}
