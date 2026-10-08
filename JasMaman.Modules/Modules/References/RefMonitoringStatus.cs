using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>
    /// Статус мониторинга отработки (fin_center ct664 «Предварительный статус УМС»).
    /// Перенесён 1-в-1, чтобы миграция была без потерь; упрощение — отдельным решением (docs/domain-model.md).
    /// </summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum MonitoringStatus {
        Arrived,
        NotArrived,
        Released,
        Worked,
        Paid,
        EmploymentCenter,
        NotArrivedArmy,
        Deceased,
        ArrivedMaternityLeave,
        NotArrivedReturnedFromCourt,
        RefusedInAllInstances,
        AwaitingSpecialistResponse,
        AwaitingAdditionalProtocol,
        AwaitingReturnFromLegalDepartment,
        ArrivedYouthPractice,
        Other,
        NotArrivedNotified,
        NotArrivedNotNotified,
        NotArrivedNoMioResponse,
        NotArrivedIncompleteDocuments,
        ArrivedWithoutPensionContributions,
        TemporaryDeferral,
        RepeatCourse,
    }

    public class RefMonitoringStatus : ReferenceEnum<MonitoringStatus> {
        public const string RefName = nameof(RefMonitoringStatus);
        public static IReadOnlyDictionary<MonitoringStatus, string> Texts => _texts;
        private static readonly Dictionary<MonitoringStatus, string> _texts = new() {
            [MonitoringStatus.Arrived] = "Прибыл",
            [MonitoringStatus.NotArrived] = "Не прибыл",
            [MonitoringStatus.Released] = "Освобожден",
            [MonitoringStatus.Worked] = "Отработал",
            [MonitoringStatus.Paid] = "Оплатил",
            [MonitoringStatus.EmploymentCenter] = "ЦЗН",
            [MonitoringStatus.NotArrivedArmy] = "Не прибыл (армия)",
            [MonitoringStatus.Deceased] = "Умерший",
            [MonitoringStatus.ArrivedMaternityLeave] = "Прибыл (декрет)",
            [MonitoringStatus.NotArrivedReturnedFromCourt] = "Не прибыл (возврат с суда)",
            [MonitoringStatus.RefusedInAllInstances] = "Отказ во всех инстанциях",
            [MonitoringStatus.AwaitingSpecialistResponse] = "Ожидание ответа от МС",
            [MonitoringStatus.AwaitingAdditionalProtocol] = "Ожидание доп. протокола",
            [MonitoringStatus.AwaitingReturnFromLegalDepartment] = "Ожидается возврат с ЮД",
            [MonitoringStatus.ArrivedYouthPractice] = "Прибыл (молодежная практика)",
            [MonitoringStatus.Other] = "Другое (см. примечание)",
            [MonitoringStatus.NotArrivedNotified] = "Не прибыл (уведомлен)",
            [MonitoringStatus.NotArrivedNotNotified] = "Не прибыл (не уведомлен)",
            [MonitoringStatus.NotArrivedNoMioResponse] = "Не прибыл (нет ответа с МИО)",
            [MonitoringStatus.NotArrivedIncompleteDocuments] = "Не прибыл (неполный пакет документов)",
            [MonitoringStatus.ArrivedWithoutPensionContributions] = "Прибыл (без пенс. отчислений: МВД, военные…)",
            [MonitoringStatus.TemporaryDeferral] = "Временная отсрочка",
            [MonitoringStatus.RepeatCourse] = "Оставлен на повторный курс обучения",
        };
        public RefMonitoringStatus() : base(RefName, "Статус мониторинга отработки", _texts) { }
    }
}
