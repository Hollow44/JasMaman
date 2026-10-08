using JasMaman.Modules.References;

namespace JasMaman.Modules.Migration {
    /// <summary>Тип места распределения в legacy (ct583) смешан с видами отсрочки — после маппинга заполнено ровно одно поле.</summary>
    public sealed record LegacyPlacement(PlacementType? Placement, DeferralType? Deferral);

    /// <summary>Описание одной legacy-таблицы справочника для проверки полноты маппинга.</summary>
    public sealed record LegacyReferenceTable(string TableId, string Title, IReadOnlyCollection<long> MappedIds);

    /// <summary>
    /// Сопоставление строк справочников fin_center (по c_obj_id — на него ссылаются FK в legacy-записях)
    /// со справочниками Jas Maman. Полнота проверяется <see cref="LegacyReferenceCheck"/>.
    /// </summary>
    public static class LegacyReferenceMap {
        /// <summary>ct360 Статус_заемщика_ткс.</summary>
        public static readonly IReadOnlyDictionary<long, RecoveryStatus> RecoveryStatuses = new Dictionary<long, RecoveryStatus> {
            [26595916] = RecoveryStatus.Archive,
            [26595917] = RecoveryStatus.LegalDepartment,
            [26595918] = RecoveryStatus.Deceased,
            [44132150] = RecoveryStatus.Worked,
            [59384093] = RecoveryStatus.EnforcementProceedings,
            [66772085] = RecoveryStatus.ArchiveByCourtDecision,
            [125367336] = RecoveryStatus.CourtDecisionRefused,
            [223496291] = RecoveryStatus.Disability,
        };

        /// <summary>ct664 Предварительный статус УМС (коды 1–23 по порядку enum).</summary>
        public static readonly IReadOnlyDictionary<long, MonitoringStatus> MonitoringStatuses = new Dictionary<long, MonitoringStatus> {
            [72909547] = MonitoringStatus.Arrived,
            [72909548] = MonitoringStatus.NotArrived,
            [72909549] = MonitoringStatus.Released,
            [72909550] = MonitoringStatus.Worked,
            [72909551] = MonitoringStatus.Paid,
            [72909552] = MonitoringStatus.EmploymentCenter,
            [72909553] = MonitoringStatus.NotArrivedArmy,
            [72909554] = MonitoringStatus.Deceased,
            [72909555] = MonitoringStatus.ArrivedMaternityLeave,
            [72909556] = MonitoringStatus.NotArrivedReturnedFromCourt,
            [72909557] = MonitoringStatus.RefusedInAllInstances,
            [72909558] = MonitoringStatus.AwaitingSpecialistResponse,
            [72909559] = MonitoringStatus.AwaitingAdditionalProtocol,
            [72909560] = MonitoringStatus.AwaitingReturnFromLegalDepartment,
            [72909561] = MonitoringStatus.ArrivedYouthPractice,
            [72909562] = MonitoringStatus.Other,
            [72909563] = MonitoringStatus.NotArrivedNotified,
            [72909564] = MonitoringStatus.NotArrivedNotNotified,
            [72909565] = MonitoringStatus.NotArrivedNoMioResponse,
            [72909566] = MonitoringStatus.NotArrivedIncompleteDocuments,
            [72909567] = MonitoringStatus.ArrivedWithoutPensionContributions,
            [72909568] = MonitoringStatus.TemporaryDeferral,
            [75500224] = MonitoringStatus.RepeatCourse,
        };

        /// <summary>ct464 Статус_УМС.</summary>
        public static readonly IReadOnlyDictionary<long, GrantCategory> GrantCategories = new Dictionary<long, GrantCategory> {
            [35926389] = GrantCategory.RuralQuota,
            [35926390] = GrantCategory.DoctorPhd,
            [35926391] = GrantCategory.StateOrder,
            [46916134] = GrantCategory.DoctorPhdTargeted,
            [53490427] = GrantCategory.Master,
            [53490428] = GrantCategory.Residency,
            [56337136] = GrantCategory.Serpin,
            [65051029] = GrantCategory.StateOrderOtherSpecialities,
            [69963814] = GrantCategory.RuralQuotaOtherSpecialities,
            [94997577] = GrantCategory.Listener,
            [118254013] = GrantCategory.DoctorProfile,
            [136902746] = GrantCategory.VocationalTraining,
            [158724032] = GrantCategory.MasterOtherSpecialities,
        };

        /// <summary>ct436 Освобождение_от_отработки.</summary>
        public static readonly IReadOnlyDictionary<long, ReleaseReason> ReleaseReasons = new Dictionary<long, ReleaseReason> {
            [34247865] = ReleaseReason.Disability,
            [34247866] = ReleaseReason.Pregnancy,
            [34247867] = ReleaseReason.ChildUnderThree,
            [34247868] = ReleaseReason.NoVacancy,
            [34247869] = ReleaseReason.EnteringMasterOrResidency,
            [44911638] = ReleaseReason.Death,
            [57027948] = ReleaseReason.EnteredMasterOrResidency,
            [62086590] = ReleaseReason.CourtDecision,
            // В legacy две строки с одинаковым кодом 10 и наименованием — дубль.
            [161536209] = ReleaseReason.EnteredMasterOrDoctorate,
            [165466173] = ReleaseReason.EnteredMasterOrDoctorate,
            [211485819] = ReleaseReason.MilitaryConscription,
            [211485820] = ReleaseReason.MilitaryContract,
            [223504550] = ReleaseReason.ChildWithDisability,
            [223504551] = ReleaseReason.CaregiverOfDisabledFirstGroup,
        };

        /// <summary>ct438 Прекращение_обязан_по_отработке.</summary>
        public static readonly IReadOnlyDictionary<long, TerminationReason> TerminationReasons = new Dictionary<long, TerminationReason> {
            [34247859] = TerminationReason.Disability,
            [34247860] = TerminationReason.HealthCondition,
            [34247861] = TerminationReason.EmployerLiquidation,
            [34247862] = TerminationReason.StaffReduction,
            [34247863] = TerminationReason.ObligationFulfilled,
            [34247864] = TerminationReason.Death,
            [34378722] = TerminationReason.RefusedToContinue,
            [34378723] = TerminationReason.DismissedNotByEmployer,
            [34676813] = TerminationReason.Pregnancy,
            [34676814] = TerminationReason.PregnancyOrChildUnderThree,
            [35025902] = TerminationReason.NoVacancyAtDistribution,
            [35737963] = TerminationReason.DismissedByEmployer,
            [66772084] = TerminationReason.CourtDecision,
        };

        /// <summary>ct452 Льгота_при_распределении.</summary>
        public static readonly IReadOnlyDictionary<long, Benefit> Benefits = new Dictionary<long, Benefit> {
            [34676701] = Benefit.SpouseResidence,
            [34676702] = Benefit.ParentsWithDisability,
        };

        /// <summary>ct583 Разделение мест распределения_МС.</summary>
        public static readonly IReadOnlyDictionary<long, LegacyPlacement> Placements = new Dictionary<long, LegacyPlacement> {
            [61622901] = new(PlacementType.EducationDepartment, null),
            [61622902] = new(PlacementType.University, null),
            [61622904] = new(PlacementType.ResearchInstitute, null),
            [61622905] = new(PlacementType.Akimat, null),
            [61622906] = new(PlacementType.HealthDepartment, null),
            [61622907] = new(PlacementType.NationalExpertiseCenter, null),
            [61622908] = new(PlacementType.PublicHealthDepartment, null),
            [61622909] = new(PlacementType.ForensicInstitute, null),
            [61622910] = new(PlacementType.OtherEducation, null),
            [61622911] = new(PlacementType.OtherMedicine, null),
            [61622912] = new(PlacementType.CareerCenter, null),
            [61785795] = new(PlacementType.Other, null),
            [64326812] = new(PlacementType.Army, null),
            // «Центр занятости (неактуальный)», обозначение КЦ — объединён с Карьерным центром.
            [145928884] = new(PlacementType.CareerCenter, null),
            [225426384] = new(null, DeferralType.MilitaryConscription),
            [225426385] = new(null, DeferralType.MilitaryContract),
            [225426389] = new(null, DeferralType.MasterKz),
            [225426473] = new(null, DeferralType.MasterAbroad),
            [225426477] = new(null, DeferralType.Doctorate),
        };

        public static readonly IReadOnlyList<LegacyReferenceTable> Tables = new LegacyReferenceTable[] {
            new("ct360", "Статус взыскания (ТКС)", RecoveryStatuses.Keys.ToArray()),
            new("ct664", "Статус мониторинга", MonitoringStatuses.Keys.ToArray()),
            new("ct464", "Категория гранта", GrantCategories.Keys.ToArray()),
            new("ct436", "Основание освобождения", ReleaseReasons.Keys.ToArray()),
            new("ct438", "Основание прекращения", TerminationReasons.Keys.ToArray()),
            new("ct452", "Льгота при распределении", Benefits.Keys.ToArray()),
            new("ct583", "Тип места распределения / отсрочка", Placements.Keys.ToArray()),
        };
    }
}
