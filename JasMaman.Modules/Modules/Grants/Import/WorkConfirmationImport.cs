using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Caching.Memory;

namespace JasMaman.Modules.Grants.Import {
    public record WorkImportLine(int RowNumber, string Iin, bool Ok, string Result, long? GrantId);

    /// <summary>
    /// Разнесение ответов о трудоустройстве по обязательствам: строка → открытое обязательство по ИИН
    /// (при нескольких — по последнему выпуску) → операция «Период работы».
    /// Идемпотентно: период с той же датой начала у того же работодателя повторно не добавляется.
    /// </summary>
    public static class WorkConfirmationImport {
        public static async Task<IReadOnlyList<WorkImportLine>> ApplyAsync(
            IReadOnlyList<WorkConfirmationRow> rows,
            WorkConfirmationSource source,
            GrantOpUserContext user,
            string ipAddress,
            IQueryExecuter queryExecuter,
            IMemoryCache memoryCache
        ) {
            var iins = rows.Select(r => r.Iin).Distinct().ToArray();
            var grantsByIin = GrantsStore.Instance.TbState()
                .AddFilter(t => t.flIin, iins)
                .AddFilter(t => t.flStage, GrantStage.Obligation)
                .Select(t => new FieldAlias[] { t.flIin, t.flGrantId, t.flGraduationYear }, queryExecuter)
                .Select(r => (iin: r.GetVal(t => t.flIin), id: r.GetVal(t => t.flGrantId), year: r.GetValOrNull(t => t.flGraduationYear) ?? 0))
                .GroupBy(x => x.iin)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.year).First().id);

            var result = new List<WorkImportLine>();
            foreach (var row in rows) {
                var error = WorkConfirmationParser.Check(row);
                if (error != null) {
                    result.Add(new(row.RowNumber, row.Iin, false, error, null));
                    continue;
                }
                if (!grantsByIin.TryGetValue(row.Iin, out var grantId)) {
                    result.Add(new(row.RowNumber, row.Iin, false, "Нет открытого обязательства по отработке", null));
                    continue;
                }
                try {
                    var state = await GrantState.Get(new GrantId(grantId), queryExecuter, memoryCache);
                    if (IsDuplicate(state, row)) {
                        result.Add(new(row.RowNumber, row.Iin, true, "Период уже загружен ранее", grantId));
                        continue;
                    }
                    await AllGrantOps.RecordWork.InvokeAsync(
                        state,
                        new RecordWorkModel(row.EmployerBin, row.EmployerName ?? row.EmployerBin!, row.Position, row.From!.Value, row.To, source, null),
                        user, ipAddress, queryExecuter, memoryCache);
                    result.Add(new(row.RowNumber, row.Iin, true, "Период работы добавлен", grantId));
                } catch (GrantOpException ex) {
                    result.Add(new(row.RowNumber, row.Iin, false, ex.Message, grantId));
                }
            }
            return result;
        }

        public static bool IsDuplicate(GrantState state, WorkConfirmationRow row)
            => state.WorkPeriods.Safe().Any(w => w.From.Date == row.From!.Value.Date
                && ((row.EmployerBin != null && w.EmployerBin == row.EmployerBin)
                    || (row.EmployerBin == null && string.Equals(w.EmployerName, row.EmployerName, StringComparison.OrdinalIgnoreCase))));
    }
}
