using PostgreSQLQueryExecuterEngine;
using JasMaman.Modules.Grants.Ops;
using YodaQuery;

namespace JasMaman.Modules.Grants.QueryTables {
    /// <summary>Журнал операций по гранту: кто, когда, что изменил (модель операции в JSON).</summary>
    public class TbGrantOpState : QueryTable {
        public TbGrantOpState(string dbKey) : base("grantopstate", "Операции по грантникам") {
            Fields = new Field[] {
                new LongField(nameof(flOperationId), "Id операции").NotNull(),
                new LongField(nameof(flGrantId), "Id гранта").NotNull(),
                new IntField(nameof(flGrantRowVersion), "Версия гранта").NotNull(),
                new TextField(nameof(flInvokedByXin), "ИИН/БИН инициатора", 15).NotNull(),
                new TextField(nameof(flInvokedByLogin), "Логин инициатора", 128).NotNull(),
                new TextField(nameof(flInvokedByName), "Инициатор", 512),
                new TextField(nameof(flOperationNumber), "Номер операции", 20).NotNull(),
                new RefField<RefGrantOpType, GrantOpType>(nameof(flOperationType), "Тип операции").NotNull(),
                new TextField(nameof(flSummary), "Кратко", 1024),
                new TextField(nameof(flOpModel), "Операция (модель)").NotNull().Encrypted(),
                new TextField(nameof(flInvokeIpAddress), "IP-адрес", 64).NotNull(),
                new DateTimeField(nameof(flInvokedAt), "Дата операции").NotNull(),
                new DateTimeField(nameof(flMomento), "Момент операции").NotNull(),
            };
            DbKey = dbKey;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flOperationId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_GrantId", new[] { new IndexCol(nameof(flGrantId)) }, false),
                new TableIndex($"IX_{Name}_InvokedAt", new[] { new IndexCol(nameof(flInvokedAt)) }, false),
                new TableIndex($"IX_{Name}_Type", new[] { new IndexCol(nameof(flOperationType)) }, false),
            };
        }

        public LongField flOperationId => (LongField)this[nameof(flOperationId)];
        public LongField flGrantId => (LongField)this[nameof(flGrantId)];
        public IntField flGrantRowVersion => (IntField)this[nameof(flGrantRowVersion)];
        public TextField flInvokedByXin => (TextField)this[nameof(flInvokedByXin)];
        public TextField flInvokedByLogin => (TextField)this[nameof(flInvokedByLogin)];
        public TextField flInvokedByName => (TextField)this[nameof(flInvokedByName)];
        public TextField flOperationNumber => (TextField)this[nameof(flOperationNumber)];
        public RefField<RefGrantOpType, GrantOpType> flOperationType => (RefField<RefGrantOpType, GrantOpType>)this[nameof(flOperationType)];
        public TextField flSummary => (TextField)this[nameof(flSummary)];
        public TextField flOpModel => (TextField)this[nameof(flOpModel)];
        public TextField flInvokeIpAddress => (TextField)this[nameof(flInvokeIpAddress)];
        public DateTimeField flInvokedAt => (DateTimeField)this[nameof(flInvokedAt)];
        public DateTimeField flMomento => (DateTimeField)this[nameof(flMomento)];
    }
}
