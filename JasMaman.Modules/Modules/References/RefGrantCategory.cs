using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>Категория гранта (fin_center ct464 «Статус_УМС» — в legacy назван статусом, по сути категория).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum GrantCategory {
        RuralQuota,
        StateOrder,
        Serpin,
        StateOrderOtherSpecialities,
        RuralQuotaOtherSpecialities,
        Master,
        MasterOtherSpecialities,
        Residency,
        DoctorPhd,
        DoctorPhdTargeted,
        DoctorProfile,
        Listener,
        VocationalTraining,
    }

    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]

    public enum EducationLevel {
        Bachelor,
        Master,
        Residency,
        Doctorate,
        Other,
    }

    public static class GrantCategoryExtensions {
        /// <summary>Уровень образования, к которому относится обязательство по категории гранта.</summary>
        public static EducationLevel ToEducationLevel(this GrantCategory category) => category switch {
            GrantCategory.RuralQuota
                or GrantCategory.StateOrder
                or GrantCategory.Serpin
                or GrantCategory.StateOrderOtherSpecialities
                or GrantCategory.RuralQuotaOtherSpecialities => EducationLevel.Bachelor,
            GrantCategory.Master or GrantCategory.MasterOtherSpecialities => EducationLevel.Master,
            GrantCategory.Residency => EducationLevel.Residency,
            GrantCategory.DoctorPhd or GrantCategory.DoctorPhdTargeted or GrantCategory.DoctorProfile => EducationLevel.Doctorate,
            GrantCategory.Listener or GrantCategory.VocationalTraining => EducationLevel.Other,
            _ => throw new ArgumentOutOfRangeException(nameof(category), category, null)
        };
    }

    public class RefGrantCategory : ReferenceEnum<GrantCategory> {
        public const string RefName = nameof(RefGrantCategory);
        public static IReadOnlyDictionary<GrantCategory, string> Texts => _texts;
        private static readonly Dictionary<GrantCategory, string> _texts = new() {
            [GrantCategory.RuralQuota] = "Сельская квота",
            [GrantCategory.StateOrder] = "Госзаказ",
            [GrantCategory.Serpin] = "Серпін",
            [GrantCategory.StateOrderOtherSpecialities] = "Госзаказ (другие специальности)",
            [GrantCategory.RuralQuotaOtherSpecialities] = "Сельская квота (другие специальности)",
            [GrantCategory.Master] = "Магистратура",
            [GrantCategory.MasterOtherSpecialities] = "Магистратура (другие специальности)",
            [GrantCategory.Residency] = "Резидентура",
            [GrantCategory.DoctorPhd] = "Доктор философии (PhD)",
            [GrantCategory.DoctorPhdTargeted] = "Доктор философии (целевик)",
            [GrantCategory.DoctorProfile] = "Доктор по профилю",
            [GrantCategory.Listener] = "Слушатель",
            [GrantCategory.VocationalTraining] = "Профессиональное обучение",
        };
        public RefGrantCategory() : base(RefName, "Категория гранта", _texts) { }
    }

    public class RefEducationLevel : ReferenceEnum<EducationLevel> {
        public const string RefName = nameof(RefEducationLevel);
        public static IReadOnlyDictionary<EducationLevel, string> Texts => _texts;
        private static readonly Dictionary<EducationLevel, string> _texts = new() {
            [EducationLevel.Bachelor] = "Бакалавриат",
            [EducationLevel.Master] = "Магистратура",
            [EducationLevel.Residency] = "Резидентура",
            [EducationLevel.Doctorate] = "Докторантура",
            [EducationLevel.Other] = "Другое",
        };
        public RefEducationLevel() : base(RefName, "Уровень образования", _texts) { }
    }
}
