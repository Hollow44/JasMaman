using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Yoda.YodaReferences;
using YodaApp.UiSearch;

namespace JasMaman.Modules.Notifications {
    [JsonConverter(typeof(StringEnumConverter))]
    public enum NotificationChannel {
        HybridMail,
        EGovPortal,
        Sms,
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum NotificationKind {
        /// <summary>Об обязательной отработке (БП 3.4, гибридная почта).</summary>
        ObligationReminder,
        /// <summary>О завершении отработки (БП 3.3, ПЭП).</summary>
        ObligationCompleted,
        /// <summary>О полном погашении задолженности (БП 3.6, ПЭП).</summary>
        DebtRepaid,
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum NotificationStatus {
        Draft,
        Approved,
        Sent,
        Delivered,
        Returned,
        Failed,
        Cancelled,
    }

    public static class NotificationTexts {
        public static readonly Dictionary<NotificationChannel, string> Channels = new() {
            [NotificationChannel.HybridMail] = "Гибридная почта (КазПочта)",
            [NotificationChannel.EGovPortal] = "Портал электронного правительства",
            [NotificationChannel.Sms] = "SMS",
        };
        public static readonly Dictionary<NotificationKind, string> Kinds = new() {
            [NotificationKind.ObligationReminder] = "Об обязательной отработке",
            [NotificationKind.ObligationCompleted] = "О завершении отработки",
            [NotificationKind.DebtRepaid] = "О погашении задолженности",
        };
        public static readonly Dictionary<NotificationStatus, (string text, BootstrapColor color)> Statuses = new() {
            [NotificationStatus.Draft] = ("Черновик", BootstrapColor.Light),
            [NotificationStatus.Approved] = ("Утверждено, ожидает отправки", BootstrapColor.Info),
            [NotificationStatus.Sent] = ("Отправлено", BootstrapColor.Primary),
            [NotificationStatus.Delivered] = ("Доставлено", BootstrapColor.Success),
            [NotificationStatus.Returned] = ("Возврат", BootstrapColor.Warning),
            [NotificationStatus.Failed] = ("Ошибка отправки", BootstrapColor.Danger),
            [NotificationStatus.Cancelled] = ("Отменено", BootstrapColor.Secondary),
        };
    }

    public class RefNotificationChannel : ReferenceEnum<NotificationChannel> {
        public const string RefName = nameof(RefNotificationChannel);
        public RefNotificationChannel() : base(RefName, "Канал уведомления", NotificationTexts.Channels) { }
    }

    public class RefNotificationKind : ReferenceEnum<NotificationKind> {
        public const string RefName = nameof(RefNotificationKind);
        public RefNotificationKind() : base(RefName, "Вид уведомления", NotificationTexts.Kinds) { }
    }

    public class RefNotificationStatus : ReferenceEnum<NotificationStatus> {
        public const string RefName = nameof(RefNotificationStatus);
        public RefNotificationStatus() : base(RefName, "Статус уведомления", NotificationTexts.Statuses.ToDictionary(x => x.Key, x => x.Value.text)) { }
    }
}
