using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Yoda.YodaReferences;
using YodaApp.UiSearch;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>Операции по гранту — по шагам БП (см. БП УМОСК.md, разделы 1–3).</summary>
    [JsonConverter(typeof(StringEnumConverter))]
    public enum GrantOpType {
        Create,
        Import,
        ChangeMovement,
        UpdateContacts,
        SyncPerson,
        Graduate,
        Assign,
        Release,
        Defer,
        EndDeferral,
        RecordWork,
        ChangeMonitoringStatus,
        CompleteObligation,
        ChangeRecoveryStatus,
        CalculateDebt,
        RecordPayment,
        Terminate,
        AddNote,
    }

    public static class GrantOpTypeExtensions {
        public static readonly Dictionary<GrantOpType, (string text, BootstrapColor color, string iconClass)> Options = new() {
            [GrantOpType.Create] = ("Регистрация обучающегося", BootstrapColor.Success, "mdi mdi-account-plus-outline"),
            [GrantOpType.Import] = ("Перенос из УМОСК", BootstrapColor.Secondary, "mdi mdi-database-import-outline"),
            [GrantOpType.ChangeMovement] = ("Изменение статуса студента", BootstrapColor.Info, "mdi mdi-swap-horizontal"),
            [GrantOpType.UpdateContacts] = ("Изменение контактов", BootstrapColor.Info, "mdi mdi-card-account-phone-outline"),
            [GrantOpType.SyncPerson] = ("Обновление из ГБД ФЛ", BootstrapColor.Info, "mdi mdi-account-sync-outline"),
            [GrantOpType.Graduate] = ("Приказ об окончании", BootstrapColor.Primary, "mdi mdi-school-outline"),
            [GrantOpType.Assign] = ("Распределение", BootstrapColor.Primary, "mdi mdi-briefcase-outline"),
            [GrantOpType.Release] = ("Освобождение от отработки", BootstrapColor.Success, "mdi mdi-account-check-outline"),
            [GrantOpType.Defer] = ("Отсрочка", BootstrapColor.Warning, "mdi mdi-calendar-clock"),
            [GrantOpType.EndDeferral] = ("Завершение отсрочки", BootstrapColor.Info, "mdi mdi-calendar-check"),
            [GrantOpType.RecordWork] = ("Период работы", BootstrapColor.Success, "mdi mdi-briefcase-check-outline"),
            [GrantOpType.ChangeMonitoringStatus] = ("Статус мониторинга", BootstrapColor.Info, "mdi mdi-eye-outline"),
            [GrantOpType.CompleteObligation] = ("Закрытие отработки", BootstrapColor.Success, "mdi mdi-check-decagram-outline"),
            [GrantOpType.ChangeRecoveryStatus] = ("Статус взыскания (ТКС)", BootstrapColor.Danger, "mdi mdi-scale-balance"),
            [GrantOpType.CalculateDebt] = ("Расчёт суммы возмещения", BootstrapColor.Warning, "mdi mdi-calculator-variant-outline"),
            [GrantOpType.RecordPayment] = ("Оплата", BootstrapColor.Success, "mdi mdi-cash-check"),
            [GrantOpType.Terminate] = ("Прекращение обязательства", BootstrapColor.Secondary, "mdi mdi-close-octagon-outline"),
            [GrantOpType.AddNote] = ("Примечание", BootstrapColor.Light, "mdi mdi-note-text-outline"),
        };

        public static string ToDisplayText(this GrantOpType opType) => Options[opType].text;
        public static BootstrapColor ToBootstrapColor(this GrantOpType opType) => Options[opType].color;
        public static string ToIconClass(this GrantOpType opType) => Options[opType].iconClass;
    }

    public class RefGrantOpType : ReferenceEnum<GrantOpType> {
        public const string RefName = nameof(RefGrantOpType);
        private static readonly Dictionary<GrantOpType, string> _texts = GrantOpTypeExtensions.Options.ToDictionary(x => x.Key, x => x.Value.text);
        public RefGrantOpType() : base(RefName, "Операция по грантнику", _texts) { }
    }
}
