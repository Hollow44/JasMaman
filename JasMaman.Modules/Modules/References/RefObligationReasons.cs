using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>Основание освобождения от отработки (fin_center ct436).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum ReleaseReason {
        Disability,
        Pregnancy,
        ChildUnderThree,
        NoVacancy,
        EnteringMasterOrResidency,
        Death,
        EnteredMasterOrResidency,
        CourtDecision,
        EnteredMasterOrDoctorate,
        MilitaryConscription,
        MilitaryContract,
        ChildWithDisability,
        CaregiverOfDisabledFirstGroup,
    }

    /// <summary>Основание прекращения обязательства по отработке (fin_center ct438).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum TerminationReason {
        Disability,
        HealthCondition,
        EmployerLiquidation,
        StaffReduction,
        ObligationFulfilled,
        Death,
        RefusedToContinue,
        DismissedNotByEmployer,
        Pregnancy,
        PregnancyOrChildUnderThree,
        NoVacancyAtDistribution,
        DismissedByEmployer,
        CourtDecision,
    }

    /// <summary>Льгота при распределении (fin_center ct452).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum Benefit {
        SpouseResidence,
        ParentsWithDisability,
    }

    public class RefReleaseReason : ReferenceEnum<ReleaseReason> {
        public const string RefName = nameof(RefReleaseReason);
        public static IReadOnlyDictionary<ReleaseReason, string> Texts => _texts;
        private static readonly Dictionary<ReleaseReason, string> _texts = new() {
            [ReleaseReason.Disability] = "Инвалидность I и II группы",
            [ReleaseReason.Pregnancy] = "Беременность",
            [ReleaseReason.ChildUnderThree] = "Беременные, лица, имеющие или самостоятельно воспитывающие ребёнка (детей) до трёх лет",
            [ReleaseReason.NoVacancy] = "Нет вакансии",
            [ReleaseReason.EnteringMasterOrResidency] = "Поступающие в магистратуру/резидентуру",
            [ReleaseReason.Death] = "В связи со смертью",
            [ReleaseReason.EnteredMasterOrResidency] = "Поступившие в магистратуру/резидентуру",
            [ReleaseReason.CourtDecision] = "В связи с решением суда",
            [ReleaseReason.EnteredMasterOrDoctorate] = "Поступившие в магистратуру/докторантуру",
            [ReleaseReason.MilitaryConscription] = "Прохождение воинской службы по призыву",
            [ReleaseReason.MilitaryContract] = "Прохождение воинской службы по контракту",
            [ReleaseReason.ChildWithDisability] = "Дети с инвалидностью",
            [ReleaseReason.CaregiverOfDisabledFirstGroup] = "Получатели госпособия по уходу за лицом с инвалидностью I группы",
        };
        public RefReleaseReason() : base(RefName, "Основание освобождения от отработки", _texts) { }
    }

    public class RefTerminationReason : ReferenceEnum<TerminationReason> {
        public const string RefName = nameof(RefTerminationReason);
        public static IReadOnlyDictionary<TerminationReason, string> Texts => _texts;
        private static readonly Dictionary<TerminationReason, string> _texts = new() {
            [TerminationReason.Disability] = "Установление инвалидности I и II группы",
            [TerminationReason.HealthCondition] = "Состояние здоровья, препятствующее выполнению трудовых обязанностей",
            [TerminationReason.EmployerLiquidation] = "Ликвидация работодателя",
            [TerminationReason.StaffReduction] = "Сокращение штата работников",
            [TerminationReason.ObligationFulfilled] = "Исполнение обязанности по отработке (3 года)",
            [TerminationReason.Death] = "В связи со смертью",
            [TerminationReason.RefusedToContinue] = "Отказ от дальнейшей отработки",
            [TerminationReason.DismissedNotByEmployer] = "Увольнение (не по основаниям работодателя)",
            [TerminationReason.Pregnancy] = "Беременность",
            [TerminationReason.PregnancyOrChildUnderThree] = "Беременность / женщины, имеющие ребёнка (детей) до 3 лет",
            [TerminationReason.NoVacancyAtDistribution] = "Отсутствие вакансий на момент распределения",
            [TerminationReason.DismissedByEmployer] = "Расторжение трудового договора по инициативе работодателя",
            [TerminationReason.CourtDecision] = "В связи с решением суда",
        };
        public RefTerminationReason() : base(RefName, "Основание прекращения обязательства", _texts) { }
    }

    public class RefBenefit : ReferenceEnum<Benefit> {
        public const string RefName = nameof(RefBenefit);
        public static IReadOnlyDictionary<Benefit, string> Texts => _texts;
        private static readonly Dictionary<Benefit, string> _texts = new() {
            [Benefit.SpouseResidence] = "Место проживания супруга (супруги)",
            [Benefit.ParentsWithDisability] = "Родители имеют инвалидность I, II группы",
        };
        public RefBenefit() : base(RefName, "Льгота при распределении", _texts) { }
    }
}
