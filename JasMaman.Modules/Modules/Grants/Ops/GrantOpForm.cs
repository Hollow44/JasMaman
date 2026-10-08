using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using YodaQuery;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>
    /// Поля форм операций по гранту — не таблица БД, только редакторы (рендер, проверка, чтение).
    /// Одна форма на все операции: каждая операция рисует нужное ей подмножество полей.
    /// </summary>
    public class GrantOpForm : QueryTable {
        public const string GeneralErrorKey = "grantOpError";

        public static readonly GrantOpForm Instance = new();

        public GrantOpForm() : base(nameof(GrantOpForm), "Операция по грантнику") {
            Fields = new Field[] {
                // персона
                new TextField(nameof(flIin), "ИИН", 12),
                new TextField(nameof(flLastName), "Фамилия", 128),
                new TextField(nameof(flFirstName), "Имя", 128),
                new TextField(nameof(flMiddleName), "Отчество", 128),
                new DateField(nameof(flBirthDate), "Дата рождения"),
                new TextField(nameof(flPhone), "Телефон (+7XXXXXXXXXX)", 32),
                new TextField(nameof(flEmail), "e-mail", 256),
                new TextField(nameof(flAddress), "Адрес", 1024),
                // обучение
                new TextField(nameof(flUniversityBin), "БИН организации образования", 12),
                new TextField(nameof(flSpecialityCode), "Шифр специальности", 64),
                new RefField<RefGrantCategory, GrantCategory>(nameof(flGrantCategory), "Категория гранта"),
                new IntField(nameof(flEnrollmentYear), "Год поступления"),
                new IntField(nameof(flGraduationYear), "Год выпуска"),
                new MoneyField(nameof(flBudgetCost), "Сумма бюджетных расходов на обучение"),
                new RefField<RefStudentMovement, StudentMovement>(nameof(flMovement), "Движение"),
                new DateField(nameof(flMovementDate), "Дата движения"),
                new TextField(nameof(flOrderNumber), "Номер приказа", 64),
                new DateField(nameof(flOrderDate), "Дата приказа"),
                // распределение
                new RefField<RefAssignmentKind, AssignmentKind>(nameof(flAssignmentKind), "Протокол"),
                new TextField(nameof(flProtocolNumber), "Номер протокола", 64),
                new DateField(nameof(flProtocolDate), "Дата протокола"),
                new RefField<RefPlacementType, PlacementType>(nameof(flPlacementType), "Тип места распределения"),
                new TextField(nameof(flEmployerBin), "БИН работодателя", 12),
                new TextField(nameof(flEmployerName), "Работодатель", 1024),
                new TextField(nameof(flRegion), "Область / город", 256),
                new TextField(nameof(flPosition), "Должность", 512),
                new TextField(nameof(flDirectionNumber), "Номер направления", 64),
                new DateField(nameof(flDirectionDate), "Дата направления"),
                new DateField(nameof(flWorkStart), "Дата явки на работу"),
                new RefField<RefBenefit, Benefit>(nameof(flBenefit), "Льгота при распределении"),
                // освобождение / отсрочка / прекращение
                new RefField<RefReleaseReason, ReleaseReason>(nameof(flReleaseReason), "Основание освобождения"),
                new RefField<RefDeferralType, DeferralType>(nameof(flDeferralType), "Вид отсрочки"),
                new RefField<RefTerminationReason, TerminationReason>(nameof(flTerminationReason), "Основание прекращения"),
                new TextField(nameof(flDocumentNumber), "Номер документа-основания", 128),
                new DateField(nameof(flDocumentDate), "Дата документа-основания"),
                new DateField(nameof(flDateFrom), "Дата с"),
                new DateField(nameof(flDateTo), "Дата по"),
                // мониторинг / взыскание / оплата
                new RefField<RefWorkConfirmationSource, WorkConfirmationSource>(nameof(flWorkSource), "Источник подтверждения"),
                new RefField<RefMonitoringStatus, MonitoringStatus>(nameof(flMonitoringStatus), "Статус мониторинга"),
                new RefField<RefRecoveryStatus, RecoveryStatus>(nameof(flRecoveryStatus), "Статус взыскания (ТКС)"),
                new MoneyField(nameof(flAmount), "Сумма"),
                new DateField(nameof(flDate), "Дата"),
                new TextField(nameof(flComment), "Примечание", 4000),
            };
        }

        public TextField flIin => (TextField)this[nameof(flIin)];
        public TextField flLastName => (TextField)this[nameof(flLastName)];
        public TextField flFirstName => (TextField)this[nameof(flFirstName)];
        public TextField flMiddleName => (TextField)this[nameof(flMiddleName)];
        public DateField flBirthDate => (DateField)this[nameof(flBirthDate)];
        public TextField flPhone => (TextField)this[nameof(flPhone)];
        public TextField flEmail => (TextField)this[nameof(flEmail)];
        public TextField flAddress => (TextField)this[nameof(flAddress)];
        public TextField flUniversityBin => (TextField)this[nameof(flUniversityBin)];
        public TextField flSpecialityCode => (TextField)this[nameof(flSpecialityCode)];
        public RefField<RefGrantCategory, GrantCategory> flGrantCategory => (RefField<RefGrantCategory, GrantCategory>)this[nameof(flGrantCategory)];
        public IntField flEnrollmentYear => (IntField)this[nameof(flEnrollmentYear)];
        public IntField flGraduationYear => (IntField)this[nameof(flGraduationYear)];
        public MoneyField flBudgetCost => (MoneyField)this[nameof(flBudgetCost)];
        public RefField<RefStudentMovement, StudentMovement> flMovement => (RefField<RefStudentMovement, StudentMovement>)this[nameof(flMovement)];
        public DateField flMovementDate => (DateField)this[nameof(flMovementDate)];
        public TextField flOrderNumber => (TextField)this[nameof(flOrderNumber)];
        public DateField flOrderDate => (DateField)this[nameof(flOrderDate)];
        public RefField<RefAssignmentKind, AssignmentKind> flAssignmentKind => (RefField<RefAssignmentKind, AssignmentKind>)this[nameof(flAssignmentKind)];
        public TextField flProtocolNumber => (TextField)this[nameof(flProtocolNumber)];
        public DateField flProtocolDate => (DateField)this[nameof(flProtocolDate)];
        public RefField<RefPlacementType, PlacementType> flPlacementType => (RefField<RefPlacementType, PlacementType>)this[nameof(flPlacementType)];
        public TextField flEmployerBin => (TextField)this[nameof(flEmployerBin)];
        public TextField flEmployerName => (TextField)this[nameof(flEmployerName)];
        public TextField flRegion => (TextField)this[nameof(flRegion)];
        public TextField flPosition => (TextField)this[nameof(flPosition)];
        public TextField flDirectionNumber => (TextField)this[nameof(flDirectionNumber)];
        public DateField flDirectionDate => (DateField)this[nameof(flDirectionDate)];
        public DateField flWorkStart => (DateField)this[nameof(flWorkStart)];
        public RefField<RefBenefit, Benefit> flBenefit => (RefField<RefBenefit, Benefit>)this[nameof(flBenefit)];
        public RefField<RefReleaseReason, ReleaseReason> flReleaseReason => (RefField<RefReleaseReason, ReleaseReason>)this[nameof(flReleaseReason)];
        public RefField<RefDeferralType, DeferralType> flDeferralType => (RefField<RefDeferralType, DeferralType>)this[nameof(flDeferralType)];
        public RefField<RefTerminationReason, TerminationReason> flTerminationReason => (RefField<RefTerminationReason, TerminationReason>)this[nameof(flTerminationReason)];
        public TextField flDocumentNumber => (TextField)this[nameof(flDocumentNumber)];
        public DateField flDocumentDate => (DateField)this[nameof(flDocumentDate)];
        public DateField flDateFrom => (DateField)this[nameof(flDateFrom)];
        public DateField flDateTo => (DateField)this[nameof(flDateTo)];
        public RefField<RefWorkConfirmationSource, WorkConfirmationSource> flWorkSource => (RefField<RefWorkConfirmationSource, WorkConfirmationSource>)this[nameof(flWorkSource)];
        public RefField<RefMonitoringStatus, MonitoringStatus> flMonitoringStatus => (RefField<RefMonitoringStatus, MonitoringStatus>)this[nameof(flMonitoringStatus)];
        public RefField<RefRecoveryStatus, RecoveryStatus> flRecoveryStatus => (RefField<RefRecoveryStatus, RecoveryStatus>)this[nameof(flRecoveryStatus)];
        public MoneyField flAmount => (MoneyField)this[nameof(flAmount)];
        public DateField flDate => (DateField)this[nameof(flDate)];
        public TextField flComment => (TextField)this[nameof(flComment)];

        /// <summary>Опции редактора: только чтение / обязательность.</summary>
        public static Action<IEditorOptions> Options(bool readOnly) => o => {
            if (readOnly) {
                o.Readonly();
            }
        };

        public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

