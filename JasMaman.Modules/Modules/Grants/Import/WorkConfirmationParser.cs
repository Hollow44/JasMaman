using System.Globalization;
using JasMaman.Modules.Grants.Logic;
using OfficeOpenXml;

namespace JasMaman.Modules.Grants.Import {
    /// <summary>Строка ответа госоргана (МТСЗН / МИО / КЦ) о трудоустройстве молодого специалиста.</summary>
    public record WorkConfirmationRow(int RowNumber, string Iin, string? EmployerBin, string? EmployerName, string? Position, DateTime? From, DateTime? To);

    public record WorkConfirmationParseResult(IReadOnlyList<WorkConfirmationRow> Rows, string? Error) {
        public bool Ok => Error == null;
    }

    /// <summary>
    /// Разбор Excel-ответов о трудоустройстве. У каждого ведомства свой формат, поэтому колонки
    /// определяются по ключевым словам заголовка (первые 10 строк листа). Обязательны ИИН и дата начала.
    /// </summary>
    public static class WorkConfirmationParser {
        private static readonly string[] iinHeaders = { "иин", "iin", "жсн" };
        private static readonly string[] binHeaders = { "бин", "bin", "бсн" };
        private static readonly string[] employerHeaders = { "работодат", "организац", "место работы", "наименование" };
        private static readonly string[] positionHeaders = { "должност", "лауазым" };
        private static readonly string[] fromHeaders = { "дата начала", "начало", "дата приема", "дата приёма", "период с", "с даты", "дата с" };
        private static readonly string[] toHeaders = { "дата окончания", "окончание", "дата увольнения", "период по", "по дату", "дата по" };

        public const int HeaderSearchRows = 10;

        public static WorkConfirmationParseResult Parse(byte[] content) {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage(new MemoryStream(content));
            var sheet = package.Workbook.Worksheets.FirstOrDefault();
            if (sheet?.Dimension == null) {
                return new(Array.Empty<WorkConfirmationRow>(), "Файл пуст");
            }
            var cells = new List<string?[]>();
            for (var row = 1; row <= sheet.Dimension.End.Row; row++) {
                var values = new string?[sheet.Dimension.End.Column];
                for (var col = 1; col <= sheet.Dimension.End.Column; col++) {
                    var value = sheet.Cells[row, col].Value;
                    values[col - 1] = value switch {
                        null => null,
                        DateTime date => date.ToString("dd.MM.yyyy"),
                        double number when sheet.Cells[row, col].Style.Numberformat.Format.Contains('y') => DateTime.FromOADate(number).ToString("dd.MM.yyyy"),
                        _ => sheet.Cells[row, col].Text
                    };
                }
                cells.Add(values);
            }
            return Parse(cells);
        }

        /// <summary>Разбор уже прочитанной таблицы (строки × колонки) — отделено от EPPlus для тестов.</summary>
        public static WorkConfirmationParseResult Parse(IReadOnlyList<string?[]> table) {
            for (var headerRow = 0; headerRow < Math.Min(HeaderSearchRows, table.Count); headerRow++) {
                var header = table[headerRow].Select(h => h?.Trim().ToLowerInvariant() ?? "").ToArray();
                var iin = find(header, iinHeaders);
                var from = find(header, fromHeaders);
                if (iin < 0 || from < 0) {
                    continue;
                }
                var bin = find(header, binHeaders);
                var employer = find(header, employerHeaders, except: new[] { iin, bin });
                var position = find(header, positionHeaders);
                var to = find(header, toHeaders, except: new[] { from });

                var rows = new List<WorkConfirmationRow>();
                for (var r = headerRow + 1; r < table.Count; r++) {
                    var cells = table[r];
                    var rowIin = digits(cell(cells, iin));
                    if (string.IsNullOrEmpty(rowIin)) {
                        continue;
                    }
                    rows.Add(new WorkConfirmationRow(
                        r + 1,
                        rowIin.PadLeft(12, '0'),
                        bin < 0 ? null : nullIfEmpty(digits(cell(cells, bin)))?.PadLeft(12, '0'),
                        employer < 0 ? null : nullIfEmpty(cell(cells, employer)?.Trim()),
                        position < 0 ? null : nullIfEmpty(cell(cells, position)?.Trim()),
                        ParseDate(cell(cells, from)),
                        to < 0 ? null : ParseDate(cell(cells, to))
                    ));
                }
                return new(rows, rows.Count == 0 ? "В файле нет строк с ИИН" : null);
            }
            return new(Array.Empty<WorkConfirmationRow>(), "Не найдены колонки «ИИН» и «Дата начала» в первых строках листа");
        }

        public static DateTime? ParseDate(string? value) {
            if (string.IsNullOrWhiteSpace(value)) {
                return null;
            }
            var text = value.Trim();
            string[] formats = { "dd.MM.yyyy", "d.M.yyyy", "dd.MM.yy", "yyyy-MM-dd", "dd/MM/yyyy", "dd.MM.yyyy H:mm:ss", "dd.MM.yyyy HH:mm:ss" };
            if (DateTime.TryParseExact(text, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)) {
                return date.Date;
            }
            if (double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var oa) && oa > 20000 && oa < 80000) {
                return DateTime.FromOADate(oa).Date;
            }
            return null;
        }

        /// <summary>Проверка строки перед записью периода работы; null — строка корректна.</summary>
        public static string? Check(WorkConfirmationRow row) {
            if (!GrantRules.IsValidIin(row.Iin)) {
                return "Некорректный ИИН";
            }
            if (row.From == null) {
                return "Не указана дата начала";
            }
            if (row.To is { } to && to < row.From) {
                return "Дата окончания раньше даты начала";
            }
            if (row.EmployerBin != null && !GrantRules.IsValidBin(row.EmployerBin)) {
                return "Некорректный БИН";
            }
            if (row.EmployerName == null && row.EmployerBin == null) {
                return "Не указан работодатель";
            }
            return null;
        }

        private static int find(string[] header, string[] keys, int[]? except = null) {
            for (var i = 0; i < header.Length; i++) {
                if (except?.Contains(i) == true) {
                    continue;
                }
                if (keys.Any(k => header[i].Contains(k))) {
                    return i;
                }
            }
            return -1;
        }

        private static string? cell(string?[] row, int index) => index >= 0 && index < row.Length ? row[index] : null;
        private static string digits(string? value) => new((value ?? "").Where(char.IsDigit).ToArray());
        private static string? nullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
    }
}
