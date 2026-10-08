using Yoda.YodaReferences;

namespace JasMaman.Modules.References {
    /// <summary>
    /// Движение студента (fin_center ct314 «Движение»). Значения enum = legacy-код, перенос без потерь.
    /// </summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum StudentMovement {
        Enrolled = 0,
        NextCourse = 1,
        Graduated = 2,
        AcademicLeave = 3,
        ReturnedFromAcademicLeave = 4,
        LeftUnexcused = 5,
        LeftExcused = 6,
        TransferredToOtherUniversity = 8,
        TransferredFromOtherUniversity = 9,
        CreditToGrant = 10,
        PaidToCredit = 11,
        Death = 13,
        Expelled = 16,
        FullyRepaid = 18,
        PaidToGrant = 20,
        NotRegisteredAtUniversity = 21,
        FullTimeToPartTime = 22,
        EnteredCollege = 30,
        TransferredToOtherCollege = 31,
        TransferredFromOtherCollege = 32,
        GraduatedCollege = 33,
        Restored = 40,
        ExpectedGraduation = 50,
        GrantToPaid = 51,
        GraduatedNonCitizen = 52,
        EnteredNonResident = 58,
        EnteredMaster = 60,
        GraduatedMaster = 61,
        ListenerEntered = 65,
        ListenerExpelled = 66,
        ListenerGraduated = 67,
        EnteredPaid = 68,
        GraduatedPaid = 69,
        GraduatedOrphan = 70,
        GraduatedMasterOrphan = 71,
        EnteredResidency = 72,
        GraduatedResidency = 73,
        EnteredDoctorate = 74,
        GraduatedDoctorate = 75,
        ObligationTerminatedByDeath = 90,
    }

    public static class StudentMovementExtensions {
        /// <summary>Движения, после которых грантник подлежит распределению (флаг «распределение УМС?» в legacy).</summary>
        public static bool CreatesObligation(this StudentMovement movement) => movement is
            StudentMovement.Graduated
            or StudentMovement.GraduatedMaster
            or StudentMovement.GraduatedResidency
            or StudentMovement.GraduatedDoctorate
            or StudentMovement.GraduatedOrphan
            or StudentMovement.GraduatedMasterOrphan;

        /// <summary>Движения, прекращающие обучение по гранту без выпуска.</summary>
        public static bool EndsStudy(this StudentMovement movement) => movement is
            StudentMovement.Expelled
            or StudentMovement.LeftUnexcused
            or StudentMovement.LeftExcused
            or StudentMovement.TransferredToOtherUniversity
            or StudentMovement.TransferredToOtherCollege
            or StudentMovement.GrantToPaid
            or StudentMovement.Death
            or StudentMovement.ListenerExpelled
            or StudentMovement.NotRegisteredAtUniversity;

        public static string ToDisplayText(this StudentMovement movement) => RefStudentMovement.Texts[movement];
    }

    public class RefStudentMovement : ReferenceEnum<StudentMovement> {
        public const string RefName = nameof(RefStudentMovement);
        public static IReadOnlyDictionary<StudentMovement, string> Texts => _texts;
        private static readonly Dictionary<StudentMovement, string> _texts = new() {
            [StudentMovement.Enrolled] = "Поступил в вуз",
            [StudentMovement.NextCourse] = "Переведён на следующий курс",
            [StudentMovement.Graduated] = "Закончил вуз",
            [StudentMovement.AcademicLeave] = "Академический отпуск",
            [StudentMovement.ReturnedFromAcademicLeave] = "Возврат из академического отпуска",
            [StudentMovement.LeftUnexcused] = "Уход по неуважительной причине",
            [StudentMovement.LeftExcused] = "Выбытие по уважительной причине",
            [StudentMovement.TransferredToOtherUniversity] = "Перевод в другой вуз",
            [StudentMovement.TransferredFromOtherUniversity] = "Перевод из другого вуза",
            [StudentMovement.CreditToGrant] = "Перевод с кредита на грант",
            [StudentMovement.PaidToCredit] = "Перевод с платного обучения на кредит",
            [StudentMovement.Death] = "Выбытие в связи со смертью",
            [StudentMovement.Expelled] = "Отчислен",
            [StudentMovement.FullyRepaid] = "Полностью погасившие",
            [StudentMovement.PaidToGrant] = "С платного обучения на грант",
            [StudentMovement.NotRegisteredAtUniversity] = "В вузе не числится",
            [StudentMovement.FullTimeToPartTime] = "Перевод с очного на заочное обучение",
            [StudentMovement.EnteredCollege] = "Поступил в колледж",
            [StudentMovement.TransferredToOtherCollege] = "Перевод в другой колледж",
            [StudentMovement.TransferredFromOtherCollege] = "Перевод из другого колледжа",
            [StudentMovement.GraduatedCollege] = "Закончил колледж",
            [StudentMovement.Restored] = "Восстановлен",
            [StudentMovement.ExpectedGraduation] = "Ожидаемый выпуск",
            [StudentMovement.GrantToPaid] = "С гранта на платное",
            [StudentMovement.GraduatedNonCitizen] = "Закончил вуз (не гражданин РК)",
            [StudentMovement.EnteredNonResident] = "Поступил в вуз (нерезидент РК)",
            [StudentMovement.EnteredMaster] = "Поступил в магистратуру",
            [StudentMovement.GraduatedMaster] = "Закончил магистратуру",
            [StudentMovement.ListenerEntered] = "Поступил слушатель",
            [StudentMovement.ListenerExpelled] = "Отчислен слушатель",
            [StudentMovement.ListenerGraduated] = "Закончил слушатель",
            [StudentMovement.EnteredPaid] = "Поступил в вуз (платник)",
            [StudentMovement.GraduatedPaid] = "Закончил вуз (платник)",
            [StudentMovement.GraduatedOrphan] = "Закончил вуз (сирота)",
            [StudentMovement.GraduatedMasterOrphan] = "Закончил магистратуру (сирота)",
            [StudentMovement.EnteredResidency] = "Поступил в резидентуру",
            [StudentMovement.GraduatedResidency] = "Закончил резидентуру",
            [StudentMovement.EnteredDoctorate] = "Поступил в докторантуру",
            [StudentMovement.GraduatedDoctorate] = "Закончил докторантуру",
            [StudentMovement.ObligationTerminatedByDeath] = "Прекращение обязательств по ТКС в связи со смертью",
        };
        public RefStudentMovement() : base(RefName, "Движение студента", _texts) { }
    }
}
