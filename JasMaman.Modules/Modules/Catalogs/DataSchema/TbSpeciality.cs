using JasMaman.Modules.References;
using YodaQuery;

namespace JasMaman.Modules.Catalogs.DataSchema {
    /// <summary>Специальности (образовательные программы). Legacy: fin_center ct316 «Специальность».</summary>
    public class TbSpeciality : QueryTable {
        public TbSpeciality(string dbKey) : base("speciality", "Специальности") {
            Fields = new Field[] {
                new LongField(nameof(flSpecialityId), "Id специальности").NotNull(),
                new LongField(nameof(flLegacyId), "Id в УМОСК"),
                new TextField(nameof(flCode), "Шифр", 64),
                new TextField(nameof(flNameRu), "Наименование (рус.)", 1024).NotNull(),
                new TextField(nameof(flNameKz), "Наименование (каз.)", 1024),
                new LongField(nameof(flParentId), "Родительская специальность"),
                new IntField(nameof(flStudyYears), "Срок обучения, лет"),
                new RefField<RfcYesNo, YesNo>(nameof(flIsYoungSpecialist), "Подлежит распределению (УМС)").NotNull(),
                new RefField<RfcYesNo, YesNo>(nameof(flIsActive), "Действующая").NotNull(),
                new DateTimeField(nameof(flUpdatedAt), "Обновлено").NotNull(),
            };
            DbKey = dbKey;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flSpecialityId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_LegacyId", new[] { new IndexCol(nameof(flLegacyId)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Code", new[] { new IndexCol(nameof(flCode)) }, uniqueIndex: false),
            };
        }

        public LongField flSpecialityId => (LongField)this[nameof(flSpecialityId)];
        public LongField flLegacyId => (LongField)this[nameof(flLegacyId)];
        public TextField flCode => (TextField)this[nameof(flCode)];
        public TextField flNameRu => (TextField)this[nameof(flNameRu)];
        public TextField flNameKz => (TextField)this[nameof(flNameKz)];
        public LongField flParentId => (LongField)this[nameof(flParentId)];
        public IntField flStudyYears => (IntField)this[nameof(flStudyYears)];
        public RefField<RfcYesNo, YesNo> flIsYoungSpecialist => (RefField<RfcYesNo, YesNo>)this[nameof(flIsYoungSpecialist)];
        public RefField<RfcYesNo, YesNo> flIsActive => (RefField<RfcYesNo, YesNo>)this[nameof(flIsActive)];
        public DateTimeField flUpdatedAt => (DateTimeField)this[nameof(flUpdatedAt)];
    }
}
