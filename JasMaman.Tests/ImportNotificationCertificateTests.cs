using JasMaman.Modules.Grants.Import;
using JasMaman.Modules.Grants.Menus;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Notifications;
using JasMaman.Modules.References;
using static JasMaman.Tests.TestData;

namespace JasMaman.Tests {
    public class WorkConfirmationParserTests {
        [Fact]
        public void Finds_header_below_title_rows_and_parses_rows() {
            var table = new List<string?[]> {
                new string?[] { "Ответ МТСЗН на запрос № 123", null, null, null, null },
                new string?[] { null, null, null, null, null },
                new string?[] { "№", "ИИН", "БИН работодателя", "Наименование организации", "Дата начала", "Дата окончания" },
                new string?[] { "1", "990101300123", "123456789012", "КГУ Школа №1", "01.09.2026", "" },
                new string?[] { "2", "99010130012", "", "ТОО Альфа", "2026-09-15", "31.12.2026" },
                new string?[] { "", "", "", "", "", "" },
            };

            var result = WorkConfirmationParser.Parse(table);

            Assert.True(result.Ok);
            Assert.Equal(2, result.Rows.Count);
            var first = result.Rows[0];
            Assert.Equal(4, first.RowNumber);
            Assert.Equal("990101300123", first.Iin);
            Assert.Equal("123456789012", first.EmployerBin);
            Assert.Equal("КГУ Школа №1", first.EmployerName);
            Assert.Equal(new DateTime(2026, 9, 1), first.From);
            Assert.Null(first.To);
            Assert.Equal("099010130012", result.Rows[1].Iin); // ведущий ноль, потерянный Excel, восстанавливается
            Assert.Equal(new DateTime(2026, 12, 31), result.Rows[1].To);
        }

        [Fact]
        public void Reports_missing_required_columns() {
            var result = WorkConfirmationParser.Parse(new List<string?[]> { new string?[] { "ФИО", "Организация" } });
            Assert.False(result.Ok);
        }

        [Fact]
        public void Check_rejects_incomplete_rows() {
            Assert.NotNull(WorkConfirmationParser.Check(new WorkConfirmationRow(1, "990101300123", null, null, null, new DateTime(2026, 1, 1), null)));
            Assert.NotNull(WorkConfirmationParser.Check(new WorkConfirmationRow(1, "990101300123", null, "Школа", null, null, null)));
            Assert.NotNull(WorkConfirmationParser.Check(new WorkConfirmationRow(1, "990101300123", null, "Школа", null, new DateTime(2026, 2, 1), new DateTime(2026, 1, 1))));
            Assert.Null(WorkConfirmationParser.Check(new WorkConfirmationRow(1, "990101300123", "123456789012", null, null, new DateTime(2026, 1, 1), null)));
        }

        [Fact]
        public void Duplicate_period_is_detected_by_start_date_and_employer() {
            var state = WithWork(Graduated(2025), new DateTime(2025, 9, 1), null);
            Assert.True(WorkConfirmationImport.IsDuplicate(state, new WorkConfirmationRow(1, state.Person.Iin, "123456789012", null, null, new DateTime(2025, 9, 1), null)));
            Assert.False(WorkConfirmationImport.IsDuplicate(state, new WorkConfirmationRow(1, state.Person.Iin, "123456789012", null, null, new DateTime(2025, 10, 1), null)));
        }

        [Theory]
        [InlineData("01.09.2026", 2026, 9, 1)]
        [InlineData("2026-09-01", 2026, 9, 1)]
        [InlineData("46266", 2026, 9, 1)]
        public void ParseDate_supports_common_formats(string text, int y, int m, int d)
            => Assert.Equal(new DateTime(y, m, d), WorkConfirmationParser.ParseDate(text));
    }

    public class NotificationTextTests {
        [Fact]
        public void Texts_contain_level_so_two_obligations_are_distinguishable() {
            var bachelor = Graduated();
            var reminder = NotificationService.BuildText(bachelor, NotificationKind.ObligationReminder, new DateTime(2026, 10, 7));
            Assert.Contains("бакалавриат", reminder);
            Assert.Contains(bachelor.Person.FullName, reminder);
            Assert.Contains("01.09.2026", reminder);

            var master = AllGrantOps.Graduate.Apply(Studying(EducationLevel.Master), new GraduateModel(2026, "1", new DateTime(2026, 6, 30), 1m, null), Ctx());
            Assert.Contains("магистратура", NotificationService.BuildText(master, NotificationKind.ObligationCompleted, DateTime.Today));
        }

        [Fact]
        public void Address_depends_on_channel() {
            var state = Graduated();
            Assert.Equal(state.Person.Phone, NotificationService.AddressFor(state, NotificationChannel.Sms));
            Assert.Equal(state.Person.Iin, NotificationService.AddressFor(state, NotificationChannel.EGovPortal));
        }
    }

    public class CertificateTests {
        [Fact]
        public void Certificate_kind_depends_on_repayment_and_work() {
            var debt = AllGrantOps.CalculateDebt.Apply(Graduated(2023), new CalculateDebtModel(1_000m, 0, null), Ctx());
            var repaid = AllGrantOps.RecordPayment.Apply(debt, new RecordPaymentModel(1_000m, new DateTime(2026, 1, 1), "1", null), Ctx(Accounting));

            Assert.False(MnuGrantCertificate.IsAvailable(debt, GrantCertificateKind.FullRepayment));
            Assert.True(MnuGrantCertificate.IsAvailable(repaid, GrantCertificateKind.FullRepayment));
            Assert.False(MnuGrantCertificate.IsAvailable(repaid, GrantCertificateKind.ProportionalRepayment));

            var workedThenRepaid = WithWork(repaid, new DateTime(2023, 9, 1), new DateTime(2024, 8, 31));
            Assert.True(MnuGrantCertificate.IsAvailable(workedThenRepaid, GrantCertificateKind.ProportionalRepayment));
            Assert.False(MnuGrantCertificate.IsAvailable(workedThenRepaid, GrantCertificateKind.ObligationFulfilled));
        }

        [Fact]
        public void Certificate_html_escapes_personal_data() {
            var state = Graduated();
            state = state with { Person = state.Person with { LastName = "<script>" }, Obligation = state.Obligation! with { CompletedAt = new DateTime(2026, 9, 1) } };
            var html = MnuGrantCertificate.Render(state, GrantCertificateKind.ObligationFulfilled, new DateTime(2026, 10, 7));
            Assert.DoesNotContain("<script>", html);
            Assert.Contains("&lt;script&gt;", html);
        }
    }
}
