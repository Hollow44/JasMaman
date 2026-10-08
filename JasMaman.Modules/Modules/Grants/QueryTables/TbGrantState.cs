using PostgreSQLQueryExecuterEngine;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using YodaQuery;

namespace JasMaman.Modules.Grants.QueryTables {
    /// <summary>
    /// Грант (молодой специалист × уровень образования). Полное состояние — в flGrantState (JSON),
    /// остальные колонки — денормализованные поля для реестров и фильтров, пересчитываются при каждом сохранении.
    /// </summary>
    public class TbGrantState : QueryTable {
        public TbGrantState(string dbKey) : base("grantstate", "Грантники (молодые специалисты)") {
            Fields = new Field[] {
                new LongField(nameof(flGrantId), "Id").NotNull(),
                new LongField(nameof(flLegacyStudyId), "Id обучения в УМОСК"),
                new LongField(nameof(flLegacyPersonId), "Id персоны в УМОСК"),

                new TextField(nameof(flIin), "ИИН", 12).NotNull(),
                new TextField(nameof(flFullName), "ФИО", 512).NotNull(),

                new LongField(nameof(flUniversityId), "Организация образования"),
                new TextField(nameof(flUniversityBin), "БИН организации образования", 12),
                new TextField(nameof(flUniversityName), "Организация образования", 1024),
                new LongField(nameof(flSpecialityId), "Специальность"),
                new TextField(nameof(flSpecialityName), "Специальность", 1024),
                new RefField<RefGrantCategory, GrantCategory>(nameof(flGrantCategory), "Категория гранта"),
                new RefField<RefEducationLevel, EducationLevel>(nameof(flEducationLevel), "Уровень образования").NotNull(),
                new RefField<RefStudentMovement, StudentMovement>(nameof(flMovement), "Движение").NotNull(),
                new IntField(nameof(flGraduationYear), "Год выпуска"),

                new RefField<RefGrantStage, GrantStage>(nameof(flStage), "Этап").NotNull(),
                new RefField<RefMonitoringStatus, MonitoringStatus>(nameof(flMonitoringStatus), "Статус мониторинга"),
                new RefField<RefRecoveryStatus, RecoveryStatus>(nameof(flRecoveryStatus), "Статус взыскания (ТКС)"),
                new IntField(nameof(flWorkedMonths), "Отработано, мес."),
                new IntField(nameof(flRequiredMonths), "Срок отработки, мес."),
                new MoneyField(nameof(flDebtBalance), "Остаток долга"),
                new DateTimeField(nameof(flArrivalDeadline), "Срок явки"),
                new DateTimeField(nameof(flDeferralUntil), "Отсрочка до"),
                new TextField(nameof(flEmployerBin), "БИН работодателя", 12),

                new JsonField<GrantState>(nameof(flGrantState), "Состояние").NotNull().Encrypted(),
                new DateTimeField(nameof(flCreatedAt), "Дата создания").NotNull(),
                new IntField(nameof(flRowVersion), "Версия строки").NotNull(),
                new IntField(nameof(flPrevRowVersion), "Предыдущая версия строки").NotNull(),
                new DateTimeField(nameof(flMomento), "По состоянию на").NotNull(),
            };
            DbKey = dbKey;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flGrantId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_Iin", new[] { new IndexCol(nameof(flIin)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_LegacyStudyId", new[] { new IndexCol(nameof(flLegacyStudyId)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_University", new[] { new IndexCol(nameof(flUniversityId)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_UniversityBin", new[] { new IndexCol(nameof(flUniversityBin)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Stage", new[] { new IndexCol(nameof(flStage)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Monitoring", new[] { new IndexCol(nameof(flMonitoringStatus)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Recovery", new[] { new IndexCol(nameof(flRecoveryStatus)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_GraduationYear", new[] { new IndexCol(nameof(flGraduationYear)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_DeferralUntil", new[] { new IndexCol(nameof(flDeferralUntil)) }, uniqueIndex: false),
            };
            CheckConstraints = new CheckConstraint[] {
                new CheckConstraint($"ch_{Name.ToLower()}_opt_lock", "(flrowversion = (flprevrowversion + 1))")
            };
        }

        public LongField flGrantId => (LongField)this[nameof(flGrantId)];
        public LongField flLegacyStudyId => (LongField)this[nameof(flLegacyStudyId)];
        public LongField flLegacyPersonId => (LongField)this[nameof(flLegacyPersonId)];
        public TextField flIin => (TextField)this[nameof(flIin)];
        public TextField flFullName => (TextField)this[nameof(flFullName)];
        public LongField flUniversityId => (LongField)this[nameof(flUniversityId)];
        public TextField flUniversityBin => (TextField)this[nameof(flUniversityBin)];
        public TextField flUniversityName => (TextField)this[nameof(flUniversityName)];
        public LongField flSpecialityId => (LongField)this[nameof(flSpecialityId)];
        public TextField flSpecialityName => (TextField)this[nameof(flSpecialityName)];
        public RefField<RefGrantCategory, GrantCategory> flGrantCategory => (RefField<RefGrantCategory, GrantCategory>)this[nameof(flGrantCategory)];
        public RefField<RefEducationLevel, EducationLevel> flEducationLevel => (RefField<RefEducationLevel, EducationLevel>)this[nameof(flEducationLevel)];
        public RefField<RefStudentMovement, StudentMovement> flMovement => (RefField<RefStudentMovement, StudentMovement>)this[nameof(flMovement)];
        public IntField flGraduationYear => (IntField)this[nameof(flGraduationYear)];
        public RefField<RefGrantStage, GrantStage> flStage => (RefField<RefGrantStage, GrantStage>)this[nameof(flStage)];
        public RefField<RefMonitoringStatus, MonitoringStatus> flMonitoringStatus => (RefField<RefMonitoringStatus, MonitoringStatus>)this[nameof(flMonitoringStatus)];
        public RefField<RefRecoveryStatus, RecoveryStatus> flRecoveryStatus => (RefField<RefRecoveryStatus, RecoveryStatus>)this[nameof(flRecoveryStatus)];
        public IntField flWorkedMonths => (IntField)this[nameof(flWorkedMonths)];
        public IntField flRequiredMonths => (IntField)this[nameof(flRequiredMonths)];
        public MoneyField flDebtBalance => (MoneyField)this[nameof(flDebtBalance)];
        public DateTimeField flArrivalDeadline => (DateTimeField)this[nameof(flArrivalDeadline)];
        public DateTimeField flDeferralUntil => (DateTimeField)this[nameof(flDeferralUntil)];
        public TextField flEmployerBin => (TextField)this[nameof(flEmployerBin)];
        public JsonField<GrantState> flGrantState => (JsonField<GrantState>)this[nameof(flGrantState)];
        public DateTimeField flCreatedAt => (DateTimeField)this[nameof(flCreatedAt)];
        public IntField flRowVersion => (IntField)this[nameof(flRowVersion)];
        public IntField flPrevRowVersion => (IntField)this[nameof(flPrevRowVersion)];
        public DateTimeField flMomento => (DateTimeField)this[nameof(flMomento)];
    }
}
