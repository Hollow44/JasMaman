using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>
    /// Статус взыскания по обязательству (в legacy — «ТКС», fin_center ct360 Статус_заемщика_ткс).
    /// Ведётся отдельно по каждому уровню образования.
    /// </summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum RecoveryStatus {
        None,
        Archive,
        LegalDepartment,
        Deceased,
        Worked,
        EnforcementProceedings,
        ArchiveByCourtDecision,
        CourtDecisionRefused,
        Disability,
    }

    public class RefRecoveryStatus : ReferenceEnum<RecoveryStatus> {
        public const string RefName = nameof(RefRecoveryStatus);
        public static IReadOnlyDictionary<RecoveryStatus, string> Texts => _texts;
        private static readonly Dictionary<RecoveryStatus, string> _texts = new() {
            [RecoveryStatus.None] = "Нет",
            [RecoveryStatus.Archive] = "Архив",
            [RecoveryStatus.LegalDepartment] = "ЮРДЕП",
            [RecoveryStatus.Deceased] = "Умершие",
            [RecoveryStatus.Worked] = "Отработано",
            [RecoveryStatus.EnforcementProceedings] = "ИП (исполнительное производство)",
            [RecoveryStatus.ArchiveByCourtDecision] = "Архив (по решению суда)",
            [RecoveryStatus.CourtDecisionRefused] = "По решению суда (отказ)",
            [RecoveryStatus.Disability] = "Инвалидность I–II группы",
        };
        public RefRecoveryStatus() : base(RefName, "Статус взыскания (ТКС)", _texts) { }
    }
}
