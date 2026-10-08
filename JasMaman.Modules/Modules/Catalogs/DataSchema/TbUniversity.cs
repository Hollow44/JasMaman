using JasMaman.Modules.References;
using YodaQuery;

namespace JasMaman.Modules.Catalogs.DataSchema {
    /// <summary>Организации образования (вузы, колледжи, НИИ). Legacy: fin_center ct317 «ВУЗ».</summary>
    public class TbUniversity : QueryTable {
        public TbUniversity(string dbKey) : base("university", "Организации образования") {
            Fields = new Field[] {
                new LongField(nameof(flUniversityId), "Id организации").NotNull(),
                new LongField(nameof(flLegacyId), "Id в УМОСК"),
                new TextField(nameof(flBin), "БИН", 12),
                new TextField(nameof(flNameRu), "Наименование (рус.)", 1024).NotNull(),
                new TextField(nameof(flNameKz), "Наименование (каз.)", 1024),
                new TextField(nameof(flShortName), "Краткое наименование", 256),
                new TextField(nameof(flRegion), "Область", 256),
                new TextField(nameof(flAddress), "Адрес", 1024),
                new TextField(nameof(flPhone), "Телефон", 128),
                new TextField(nameof(flEmail), "e-mail", 256),
                new RefField<RfcYesNo, YesNo>(nameof(flIsCollege), "Колледж").NotNull(),
                new RefField<RfcYesNo, YesNo>(nameof(flIsResearchInstitute), "НИИ").NotNull(),
                new RefField<RfcYesNo, YesNo>(nameof(flHasYoungSpecialists), "Есть молодые специалисты").NotNull(),
                new RefField<RfcYesNo, YesNo>(nameof(flIsActive), "Действующая").NotNull(),
                new DateTimeField(nameof(flUpdatedAt), "Обновлено").NotNull(),
            };
            DbKey = dbKey;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flUniversityId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_LegacyId", new[] { new IndexCol(nameof(flLegacyId)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Bin", new[] { new IndexCol(nameof(flBin)) }, uniqueIndex: false),
            };
        }

        public LongField flUniversityId => (LongField)this[nameof(flUniversityId)];
        public LongField flLegacyId => (LongField)this[nameof(flLegacyId)];
        public TextField flBin => (TextField)this[nameof(flBin)];
        public TextField flNameRu => (TextField)this[nameof(flNameRu)];
        public TextField flNameKz => (TextField)this[nameof(flNameKz)];
        public TextField flShortName => (TextField)this[nameof(flShortName)];
        public TextField flRegion => (TextField)this[nameof(flRegion)];
        public TextField flAddress => (TextField)this[nameof(flAddress)];
        public TextField flPhone => (TextField)this[nameof(flPhone)];
        public TextField flEmail => (TextField)this[nameof(flEmail)];
        public RefField<RfcYesNo, YesNo> flIsCollege => (RefField<RfcYesNo, YesNo>)this[nameof(flIsCollege)];
        public RefField<RfcYesNo, YesNo> flIsResearchInstitute => (RefField<RfcYesNo, YesNo>)this[nameof(flIsResearchInstitute)];
        public RefField<RfcYesNo, YesNo> flHasYoungSpecialists => (RefField<RfcYesNo, YesNo>)this[nameof(flHasYoungSpecialists)];
        public RefField<RfcYesNo, YesNo> flIsActive => (RefField<RfcYesNo, YesNo>)this[nameof(flIsActive)];
        public DateTimeField flUpdatedAt => (DateTimeField)this[nameof(flUpdatedAt)];
    }
}
