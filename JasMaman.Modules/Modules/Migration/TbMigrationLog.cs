using JasMaman.Modules.Common;
using YodaQuery;

namespace JasMaman.Modules.Migration {
    /// <summary>Журнал миграции из УМОСК: одна строка на обработанную страницу (видно прогресс и ошибки).</summary>
    public class TbMigrationLog : QueryTable {
        public TbMigrationLog() : base("migrationlog", "Журнал миграции из УМОСК") {
            Fields = new Field[] {
                new LongField(nameof(flId), "Id").NotNull(),
                new TextField(nameof(flJob), "Задание", 128).NotNull(),
                new LongField(nameof(flAfterId), "Начиная после id").NotNull(),
                new LongField(nameof(flLastId), "Последний id страницы"),
                new IntField(nameof(flRead), "Прочитано").NotNull(),
                new IntField(nameof(flImported), "Перенесено").NotNull(),
                new IntField(nameof(flSkipped), "Пропущено").NotNull(),
                new IntField(nameof(flFailed), "Ошибок").NotNull(),
                new TextField(nameof(flDetails), "Подробности"),
                new DateTimeField(nameof(flAt), "Время").NotNull(),
            };
            DbKey = DbKeys.DbJasMaman;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_JobAt", new[] { new IndexCol(nameof(flJob)), new IndexCol(nameof(flAt)) }, uniqueIndex: false),
            };
        }

        public LongField flId => (LongField)this[nameof(flId)];
        public TextField flJob => (TextField)this[nameof(flJob)];
        public LongField flAfterId => (LongField)this[nameof(flAfterId)];
        public LongField flLastId => (LongField)this[nameof(flLastId)];
        public IntField flRead => (IntField)this[nameof(flRead)];
        public IntField flImported => (IntField)this[nameof(flImported)];
        public IntField flSkipped => (IntField)this[nameof(flSkipped)];
        public IntField flFailed => (IntField)this[nameof(flFailed)];
        public TextField flDetails => (TextField)this[nameof(flDetails)];
        public DateTimeField flAt => (DateTimeField)this[nameof(flAt)];
    }
}
