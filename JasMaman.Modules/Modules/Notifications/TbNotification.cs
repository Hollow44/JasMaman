using JasMaman.Modules.Common;
using PostgreSQLQueryExecuterEngine;

namespace JasMaman.Modules.Notifications {
    /// <summary>Уведомления молодым специалистам и их доставка (заменяет «Журнал об обязательной отработке» и «Уведомления ПЭП» УМОСК).</summary>
    public class TbNotification : QueryTable {
        public TbNotification() : base("notification", "Уведомления молодым специалистам") {
            Fields = new Field[] {
                new LongField(nameof(flNotificationId), "Id").NotNull(),
                new LongField(nameof(flGrantId), "Грант").NotNull(),
                new TextField(nameof(flIin), "ИИН", 12).NotNull(),
                new TextField(nameof(flFullName), "ФИО", 512).NotNull(),
                new RefField<RefNotificationKind, NotificationKind>(nameof(flKind), "Вид").NotNull(),
                new RefField<RefNotificationChannel, NotificationChannel>(nameof(flChannel), "Канал").NotNull(),
                new RefField<RefNotificationStatus, NotificationStatus>(nameof(flStatus), "Статус").NotNull(),
                new TextField(nameof(flAddress), "Адрес / телефон", 1024),
                new TextField(nameof(flText), "Текст").NotNull().Encrypted(),
                new TextField(nameof(flProviderId), "Идентификатор у оператора доставки", 128),
                new TextField(nameof(flError), "Ошибка", 2000),
                new DateTimeField(nameof(flCreatedAt), "Создано").NotNull(),
                new TextField(nameof(flCreatedBy), "Создал", 512).NotNull(),
                new DateTimeField(nameof(flApprovedAt), "Утверждено"),
                new TextField(nameof(flApprovedBy), "Утвердил", 512),
                new DateTimeField(nameof(flSentAt), "Отправлено"),
                new DateTimeField(nameof(flStatusAt), "Статус на").NotNull(),
            };
            DbKey = DbKeys.DbJasMaman;
            PrimaryKey = new TablePrimaryKey($"PK_{Name}", new IndexCol(nameof(flNotificationId)));
            Indexes = new TableIndex[] {
                new TableIndex($"IX_{Name}_Grant", new[] { new IndexCol(nameof(flGrantId)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Status", new[] { new IndexCol(nameof(flStatus)) }, uniqueIndex: false),
                new TableIndex($"IX_{Name}_Iin", new[] { new IndexCol(nameof(flIin)) }, uniqueIndex: false),
            };
        }

        public LongField flNotificationId => (LongField)this[nameof(flNotificationId)];
        public LongField flGrantId => (LongField)this[nameof(flGrantId)];
        public TextField flIin => (TextField)this[nameof(flIin)];
        public TextField flFullName => (TextField)this[nameof(flFullName)];
        public RefField<RefNotificationKind, NotificationKind> flKind => (RefField<RefNotificationKind, NotificationKind>)this[nameof(flKind)];
        public RefField<RefNotificationChannel, NotificationChannel> flChannel => (RefField<RefNotificationChannel, NotificationChannel>)this[nameof(flChannel)];
        public RefField<RefNotificationStatus, NotificationStatus> flStatus => (RefField<RefNotificationStatus, NotificationStatus>)this[nameof(flStatus)];
        public TextField flAddress => (TextField)this[nameof(flAddress)];
        public TextField flText => (TextField)this[nameof(flText)];
        public TextField flProviderId => (TextField)this[nameof(flProviderId)];
        public TextField flError => (TextField)this[nameof(flError)];
        public DateTimeField flCreatedAt => (DateTimeField)this[nameof(flCreatedAt)];
        public TextField flCreatedBy => (TextField)this[nameof(flCreatedBy)];
        public DateTimeField flApprovedAt => (DateTimeField)this[nameof(flApprovedAt)];
        public TextField flApprovedBy => (TextField)this[nameof(flApprovedBy)];
        public DateTimeField flSentAt => (DateTimeField)this[nameof(flSentAt)];
        public DateTimeField flStatusAt => (DateTimeField)this[nameof(flStatusAt)];
    }
}
