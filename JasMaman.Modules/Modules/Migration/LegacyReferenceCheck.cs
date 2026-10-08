using PgOrm;

namespace JasMaman.Modules.Migration {
    public sealed record LegacyReferenceCheckResult(
        LegacyReferenceTable Table,
        int LegacyRows,
        IReadOnlyList<(long Id, string? Name)> Unmapped,
        IReadOnlyList<long> MissingInLegacy) {
        public bool IsComplete => Unmapped.Count == 0 && MissingInLegacy.Count == 0;
    }

    /// <summary>
    /// Сверяет <see cref="LegacyReferenceMap"/> с актуальными справочниками fin_center:
    /// каждая legacy-строка должна иметь соответствие, и каждое соответствие — существовать в legacy.
    /// Запускать перед миграцией записей: несопоставленное значение = потеря данных.
    /// </summary>
    public static class LegacyReferenceCheck {
        public static async Task<IReadOnlyList<LegacyReferenceCheckResult>> RunAsync(PgContext ctx) {
            var results = new List<LegacyReferenceCheckResult>();
            foreach (var table in LegacyReferenceMap.Tables) {
                var rows = await ctx.Repository(table.TableId, maxDepth: 0).GetAllAsync();
                var mapped = table.MappedIds.ToHashSet();
                var legacyIds = rows.Select(r => r.Id).ToHashSet();

                var unmapped = rows
                    .Where(r => !mapped.Contains(r.Id))
                    .Select(r => (r.Id, (r["наименование_1"] ?? r["наименование"])?.ToString()))
                    .ToList();
                var missing = mapped.Where(id => !legacyIds.Contains(id)).ToList();

                results.Add(new LegacyReferenceCheckResult(table, rows.Count, unmapped, missing));
            }
            return results;
        }
    }
}
