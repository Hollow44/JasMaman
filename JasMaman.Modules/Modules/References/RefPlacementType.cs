using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>Тип места распределения (fin_center ct583, без значений «Отсрочка …» — они в <see cref="DeferralType"/>).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum PlacementType {
        EducationDepartment,
        University,
        ResearchInstitute,
        Akimat,
        HealthDepartment,
        NationalExpertiseCenter,
        PublicHealthDepartment,
        ForensicInstitute,
        OtherEducation,
        OtherMedicine,
        CareerCenter,
        Army,
        Other,
    }

    /// <summary>Вид отсрочки отработки.</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum DeferralType {
        MilitaryConscription,
        MilitaryContract,
        MasterKz,
        MasterAbroad,
        Doctorate,
    }

    public class RefPlacementType : ReferenceEnum<PlacementType> {
        public const string RefName = nameof(RefPlacementType);
        public static IReadOnlyDictionary<PlacementType, string> Texts => _texts;
        private static readonly Dictionary<PlacementType, string> _texts = new() {
            [PlacementType.EducationDepartment] = "Управление образования",
            [PlacementType.University] = "Высшее учебное заведение",
            [PlacementType.ResearchInstitute] = "Научно-исследовательский институт",
            [PlacementType.Akimat] = "Акимат",
            [PlacementType.HealthDepartment] = "Управление здравоохранения",
            [PlacementType.NationalExpertiseCenter] = "Национальный центр экспертизы",
            [PlacementType.PublicHealthDepartment] = "Департамент охраны общественного здоровья",
            [PlacementType.ForensicInstitute] = "Институт судебных экспертиз",
            [PlacementType.OtherEducation] = "Остальное в образовании",
            [PlacementType.OtherMedicine] = "Остальное в медицине",
            [PlacementType.CareerCenter] = "Карьерный центр",
            [PlacementType.Army] = "Призыв на службу в армию",
            [PlacementType.Other] = "Прочие",
        };
        public RefPlacementType() : base(RefName, "Тип места распределения", _texts) { }
    }

    public class RefDeferralType : ReferenceEnum<DeferralType> {
        public const string RefName = nameof(RefDeferralType);
        public static IReadOnlyDictionary<DeferralType, string> Texts => _texts;
        private static readonly Dictionary<DeferralType, string> _texts = new() {
            [DeferralType.MilitaryConscription] = "Призыв на воинскую службу",
            [DeferralType.MilitaryContract] = "Воинская служба по контракту",
            [DeferralType.MasterKz] = "Поступление в магистратуру (РК)",
            [DeferralType.MasterAbroad] = "Поступление в магистратуру (за рубежом)",
            [DeferralType.Doctorate] = "Поступление в докторантуру",
        };
        public RefDeferralType() : base(RefName, "Вид отсрочки", _texts) { }
    }
}
