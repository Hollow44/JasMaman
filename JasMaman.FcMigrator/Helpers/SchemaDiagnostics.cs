using System.Text.Json;
using Npgsql;

namespace PgOrm;

/// <summary>
/// Утилиты для сравнения schema.json (метаданные из tables.xls) с реальной
/// базой Postgres:
///  - каких колонок/таблиц физически нет (<see cref="CheckAllTablesAsync"/>,
///    <see cref="GenerateExcludeFileAsync"/>);
///  - какие "справочники" (::спр::) физически лежат в общей таблице ct312,
///    отдельной таблице или их комбинации (<see cref="GenerateSprTableOverridesAsync"/>);
///  - какие колонки физически переехали в join-таблицу и/или разбиты на
///    мультиязычные варианты cmNNNN_1 / cmNNNN_2 / ... (<see cref="GenerateColumnOverridesAsync"/>).
/// </summary>
public static class SchemaDiagnostics {
    /// <summary>
    /// Одним запросом к information_schema.columns возвращает
    /// (table_name, column_name) -> data_type (например "timestamp without time zone",
    /// "numeric", "character varying", "boolean", ...) для всех физических
    /// таблиц, упомянутых в каталоге. Используется
    /// <see cref="ModelGenerator"/>, чтобы заменить "object?" на конкретный
    /// C#-тип для колонок с типом "time"/"object"/"unknown" в schema.json.
    /// </summary>
    public static async Task<Dictionary<(string Table, string Column), string>> GetPhysicalTypesAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema) {
        var tableNames = schema.Tables.Values
            .SelectMany(t => new[] { t.PhysicalTable, t.JoinTable })
            .Where(t => !string.IsNullOrEmpty(t))
            .Select(t => t!)
            .Distinct()
            .ToArray();

        var result = new Dictionary<(string, string), string>();
        await using var cmd = dataSource.CreateCommand(
            "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = ANY(@tables)");
        cmd.Parameters.AddWithValue("tables", tableNames);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            result[(reader.GetString(0), reader.GetString(1))] = reader.GetString(2);
        return result;
    }

    /// <summary>
    /// Одним запросом к information_schema.columns возвращает
    /// table_name -> множество column_name для всех физических таблиц,
    /// упомянутых в каталоге (PhysicalTable и JoinTable каждой TableMeta).
    /// </summary>
    private static async Task<Dictionary<string, HashSet<string>>> GetColumnsByTableAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema) {
        var tableNames = schema.Tables.Values
            .SelectMany(t => new[] { t.PhysicalTable, t.JoinTable })
            .Where(t => !string.IsNullOrEmpty(t))
            .Select(t => t!)
            .Distinct()
            .ToArray();

        var byTable = new Dictionary<string, HashSet<string>>();
        await using var cmd = dataSource.CreateCommand(
            "SELECT table_name, column_name FROM information_schema.columns WHERE table_name = ANY(@tables)");
        cmd.Parameters.AddWithValue("tables", tableNames);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync()) {
            var table = reader.GetString(0);
            var column = reader.GetString(1);
            if (!byTable.TryGetValue(table, out var set))
                byTable[table] = set = new HashSet<string>();
            set.Add(column);
        }
        return byTable;
    }

    /// <summary>Возвращает множество существующих колонок таблицы, в которой физически лежит <paramref name="col"/> (base или join).</summary>
    private static HashSet<string> ColumnsFor(ColumnMeta col, TableMeta meta, Dictionary<string, HashSet<string>> byTable) {
        var table = col.FromJoinTable ? meta.JoinTable : meta.PhysicalTable;
        return table is not null && byTable.TryGetValue(table, out var set) ? set : new HashSet<string>();
    }

    /// <summary>
    /// Проверяет одну таблицу. Возвращает список отсутствующих физических
    /// колонок в формате "cmNNNN (логическое_имя)". Если таблицы вообще нет
    /// в БД - будут "отсутствовать" все её колонки + PK.
    /// </summary>
    public static async Task<List<string>> GetMissingColumnsAsync(
        NpgsqlDataSource dataSource, TableMeta meta, string primaryKeyColumn) {
        var tableNames = new[] { meta.PhysicalTable, meta.JoinTable }
            .Where(t => !string.IsNullOrEmpty(t)).Select(t => t!).Distinct().ToArray();

        var existing = new HashSet<string>();
        await using var cmd = dataSource.CreateCommand(
            "SELECT column_name FROM information_schema.columns WHERE table_name = ANY(@tables)");
        cmd.Parameters.AddWithValue("tables", tableNames);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            existing.Add(reader.GetString(0));

        var missing = new List<string>();
        if (!existing.Contains(primaryKeyColumn))
            missing.Add($"{primaryKeyColumn} (PK)");

        foreach (var col in meta.Columns)
            if (!existing.Contains(col.Physical))
                missing.Add($"{col.Physical} ({col.Name})");

        return missing;
    }

    /// <summary>
    /// Проверяет ВСЕ таблицы каталога одним запросом к information_schema.
    /// Возвращает только те таблицы, где что-то отсутствует: ctId -> список
    /// отсутствующих колонок (формат "cmNNNN (логическое_имя)"; запись
    /// "&lt;таблица отсутствует в БД&gt;" означает, что физической таблицы
    /// (PhysicalTable) нет совсем).
    /// </summary>
    public static async Task<Dictionary<string, List<string>>> CheckAllTablesAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema, string primaryKeyColumn) {
        var byTable = await GetColumnsByTableAsync(dataSource, schema);

        var result = new Dictionary<string, List<string>>();
        foreach (var meta in schema.Tables.Values) {
            if (!byTable.TryGetValue(meta.PhysicalTable, out var existing)) {
                result[meta.Id] = new List<string> { "<таблица отсутствует в БД>" };
                continue;
            }

            var missing = new List<string>();
            if (!existing.Contains(primaryKeyColumn))
                missing.Add($"{primaryKeyColumn} (PK)");

            foreach (var col in meta.Columns)
                if (!col.IsLinkedCollection && !ColumnsFor(col, meta, byTable).Contains(col.Physical))
                    missing.Add($"{col.Physical} ({col.Name})");

            if (missing.Count > 0)
                result[meta.Id] = missing;
        }

        return result;
    }

    /// <summary>
    /// Генерирует table_overrides.json для таблиц, чьё логическое имя содержит
    /// <paramref name="namespaceMarker"/> (по умолчанию "::спр::"), ПЛЮС любых
    /// таблиц из <paramref name="extraTableIds"/> - таблиц, которые не
    /// являются справочниками ("::осн::" и т.п.), но физически следуют тому
    /// же паттерну ct312+c_class_id (например "фц::осн::Зап_семейных_связей",
    /// ct852 - в ct312 встречаются строки с c_class_id=852, видно по
    /// "SELECT c_obj_id, c_uid, c_class_id, c_tr_id, c_is_del FROM ct312 WHERE
    /// c_class_id = 852"). Такие таблицы по имени не находятся (нет
    /// "::спр::"), поэтому укажите их id явно.
    ///
    ///  - если у логической ctNNN НЕТ собственной физической таблицы - считает,
    ///    что все её данные лежат в <paramref name="sharedTable"/> (по умолчанию
    ///    "ct312"): <c>{ "physicalTable": "ct312", "filter": { "c_class_id": NNN } }</c>;
    ///
    ///  - если у ctNNN ЕСТЬ своя физическая таблица (паттерн class-table
    ///    inheritance, например "ct457" + общие колонки в "ct312"): добавляет
    ///    join на <paramref name="sharedTable"/>:
    ///    <c>{ "joinTable": "ct312", "filter": { "c_class_id": NNN } }</c>
    ///    (только если <paramref name="sharedTable"/> вообще существует в БД).
    ///
    /// Класс строки = числовая часть ctNNN (для "ct457" -> 457). Для
    /// поиска по id класс-фильтр не обязателен (id глобально уникален в
    /// общей таблице), но нужен для GetAllAsync() - иначе для ctNNN без
    /// собственной таблицы вернутся строки всех справочников, а для ctNNN со
    /// своей таблицей JOIN без фильтра обычно не помешает (id и так
    /// уникален), но фильтр добавляется для консистентности.
    ///
    /// Вызывать ПЕРВЫМ, затем <see cref="SchemaCatalog.ApplyTableOverrides"/> -
    /// до <see cref="GenerateColumnOverridesAsync"/>/<see cref="GenerateExcludeFileAsync"/>.
    /// </summary>
    public static async Task<string> GenerateSprTableOverridesAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema, string outputPath,
        string sharedTable = "ct312", string classFilterColumn = "c_class_id",
        string namespaceMarker = "::спр::", IEnumerable<string>? extraTableIds = null) {
        var byTable = await GetColumnsByTableAsync(dataSource, schema);
        var sharedTableExists = byTable.ContainsKey(sharedTable);

        var extraIds = new HashSet<string>(extraTableIds ?? Enumerable.Empty<string>());

        var overrides = new Dictionary<string, object>();
        foreach (var meta in schema.Tables.Values) {
            if (!meta.Name.Contains(namespaceMarker) && !extraIds.Contains(meta.Id))
                continue;

            var match = System.Text.RegularExpressions.Regex.Match(meta.Id, @"^ct(\d+)$");
            if (!match.Success)
                continue;
            var classId = long.Parse(match.Groups[1].Value);

            var hasOwnTable = byTable.ContainsKey(meta.PhysicalTable);

            if (!hasOwnTable) {
                if (!sharedTableExists)
                    continue; // ни своей таблицы, ни общей - ничего не сгенерировать
                overrides[meta.Id] = new Dictionary<string, object> {
                    ["physicalTable"] = sharedTable,
                    ["filter"] = new Dictionary<string, long> { [classFilterColumn] = classId },
                };
            } else if (sharedTableExists) {
                // своя таблица есть, плюс общие колонки (наименование/код/...) в ct312
                overrides[meta.Id] = new Dictionary<string, object> {
                    ["joinTable"] = sharedTable,
                    ["filter"] = new Dictionary<string, long> { [classFilterColumn] = classId },
                };
            }
        }

        var json = JsonSerializer.Serialize(overrides, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(outputPath, json);
        return outputPath;
    }

    /// <summary>
    /// Делает то же, что <see cref="CheckAllTablesAsync"/>, но сразу сохраняет
    /// результат в формате, понятном <see cref="SchemaCatalog.ApplyExclusions"/>:
    /// <c>{ "ct455": ["cm3385", "cm1234"], ... }</c> - только физические имена
    /// "потерянных" cm-колонок (PK и полностью отсутствующие таблицы в файл не
    /// попадают - PK нельзя исключить, а если таблицы целиком нет, нужен
    /// <see cref="SchemaCatalog.ApplyTableOverrides"/>, а не exclude).
    ///
    /// Вызывайте ПОСЛЕ <see cref="SchemaCatalog.ApplyTableOverrides"/> и
    /// <see cref="SchemaCatalog.ApplyColumnOverrides"/> - иначе
    /// мультиязычные/перенесённые в join-таблицу колонки попадут в exclude
    /// вместо того, чтобы быть переименованными/перенаправленными.
    /// </summary>
    public static async Task<string> GenerateExcludeFileAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema, string primaryKeyColumn, string outputPath) {
        var byTable = await GetColumnsByTableAsync(dataSource, schema);

        var exclude = new Dictionary<string, List<string>>();
        foreach (var meta in schema.Tables.Values) {
            if (!byTable.TryGetValue(meta.PhysicalTable, out _))
                continue; // таблицы целиком нет в БД - exclude её не лечит,
                          // но ref-колонки, которые на неё ссылаются, исключаются ниже

            var missingCols = meta.Columns
                .Where(c => !c.IsLinkedCollection // коллекция через линк-таблицу - физической
                                                  // колонки cmNNNN на самой строке нет по дизайну, это не "потеря"
                            && (!ColumnsFor(c, meta, byTable).Contains(c.Physical)
                                // ref-колонка на таблицу, у которой нет PhysicalTable в БД целиком -
                                // тоже нельзя селектить/резолвить
                                || (c.IsReference && !byTable.ContainsKey(schema.Get(c.RefTable!).PhysicalTable))))
                .Select(c => c.Physical)
                .ToList();

            if (missingCols.Count > 0)
                exclude[meta.Id] = missingCols;
        }

        var json = JsonSerializer.Serialize(exclude, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(outputPath, json);
        return outputPath;
    }

    /// <summary>
    /// Для каждой колонки, чьё физическое имя cmNNNN отсутствует "как есть" в
    /// <see cref="TableMeta.PhysicalTable"/>, ищет, где она физически находится:
    ///
    ///  1. cmNNNN_1, cmNNNN_2, ... в PhysicalTable (мультиязычная, та же таблица);
    ///  2. cmNNNN "как есть" в <see cref="TableMeta.JoinTable"/> (переехала в
    ///     общую таблицу, например "код" -> ct312.cm1622);
    ///  3. cmNNNN_1, cmNNNN_2, ... в JoinTable (переехала И мультиязычная,
    ///     например "наименование" -> ct312.cm1597_1/cm1597_2).
    ///
    /// Пишет в outputPath JSON вида
    /// <c>{ "ct457": { "cm1597": { "physical": ["cm1597_1","cm1597_2"], "join": true } } }</c>
    /// для <see cref="SchemaCatalog.ApplyColumnOverrides"/>. Если ничего из
    /// перечисленного не найдено - колонка остаётся как есть (и далее попадёт
    /// в exclude).
    ///
    /// Вызывайте ПОСЛЕ <see cref="SchemaCatalog.ApplyTableOverrides"/> (чтобы
    /// JoinTable был известен) и ПЕРЕД <see cref="GenerateExcludeFileAsync"/>.
    /// </summary>
    public static async Task<string> GenerateColumnOverridesAsync(
        NpgsqlDataSource dataSource, SchemaCatalog schema, string outputPath, int maxVariants = 6) {
        var byTable = await GetColumnsByTableAsync(dataSource, schema);

        var overrides = new Dictionary<string, Dictionary<string, object>>();
        foreach (var meta in schema.Tables.Values) {
            var baseCols = byTable.TryGetValue(meta.PhysicalTable, out var bc) ? bc : new HashSet<string>();
            var joinCols = meta.JoinTable is not null && byTable.TryGetValue(meta.JoinTable, out var jc) ? jc : null;

            foreach (var col in meta.Columns) {
                if (col.FromJoinTable)
                    continue; // уже переопределена ранее

                if (baseCols.Contains(col.Physical))
                    continue; // как есть существует в базовой таблице - ничего не нужно

                // 1. мультиязычные варианты в базовой таблице
                var baseVariants = FindVariants(col.Physical, baseCols, maxVariants);
                if (baseVariants.Count > 0) {
                    AddOverride(overrides, meta.Id, col.Physical, baseVariants, join: false);
                    continue;
                }

                if (joinCols is null)
                    continue;

                // 2. как есть в join-таблице
                if (joinCols.Contains(col.Physical)) {
                    AddOverride(overrides, meta.Id, col.Physical, new List<string> { col.Physical }, join: true);
                    continue;
                }

                // 3. мультиязычные варианты в join-таблице
                var joinVariants = FindVariants(col.Physical, joinCols, maxVariants);
                if (joinVariants.Count > 0)
                    AddOverride(overrides, meta.Id, col.Physical, joinVariants, join: true);
            }
        }

        var json = JsonSerializer.Serialize(overrides, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(outputPath, json);
        return outputPath;
    }

    private static List<string> FindVariants(string physical, HashSet<string> existing, int maxVariants) {
        var variants = new List<string>();
        for (var i = 1; i <= maxVariants; i++) {
            var candidate = $"{physical}_{i}";
            if (existing.Contains(candidate))
                variants.Add(candidate);
            else
                break;
        }
        return variants;
    }

    private static void AddOverride(
        Dictionary<string, Dictionary<string, object>> overrides, string tableId, string physical, List<string> variants, bool join) {
        if (!overrides.TryGetValue(tableId, out var tableMap))
            overrides[tableId] = tableMap = new Dictionary<string, object>();

        tableMap[physical] = new Dictionary<string, object> {
            ["physical"] = variants,
            ["join"] = join,
        };
    }
}