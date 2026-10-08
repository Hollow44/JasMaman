using System.Text.Json;

namespace PgOrm;

/// <summary>
/// Описание одной колонки физической таблицы.
/// </summary>
public sealed class ColumnMeta {
    /// <summary>Физическое имя колонки в Postgres, например "cm3037".</summary>
    public required string Physical { get; init; }

    /// <summary>Логическое (человекочитаемое) имя из метаданных, например "контрагент_вкладчик_персона".</summary>
    public required string Name { get; init; }

    /// <summary>
    /// "string" | "float" | "long" | "date" | "time" | "boolean" | "memo" | "object" | "ref" | "unknown".
    /// "ref" означает, что значение колонки — это id строки в таблице <see cref="RefTable"/>.
    /// </summary>
    public required string Type { get; init; }

    /// <summary>Для Type == "ref": физическое имя связанной таблицы (например "ct320").</summary>
    public string? RefTable { get; init; }

    /// <summary>Для Type == "ref": логическое имя связанной таблицы (например "фц::осн::Персона").</summary>
    public string? RefTableName { get; init; }

    /// <summary>
    /// Если true - колонка физически берётся из <see cref="TableMeta.JoinTable"/>
    /// (например "наименование_1"/"наименование_2"/"код" в ct312), а не из
    /// <see cref="TableMeta.PhysicalTable"/>. Задаётся через
    /// <see cref="SchemaCatalog.ApplyColumnOverrides"/>.
    /// </summary>
    public bool FromJoinTable { get; set; }

    /// <summary>
    /// Имя линк-таблицы для колонок-коллекций (c_col_type=2 в метаданных
    /// платформы): такие поля физически НЕ хранятся как FK на самой строке -
    /// для КАЖДОЙ коллекционной колонки создаётся отдельная таблица вида
    /// <c>at{class_id}_{field_id}</c> со структурой
    /// <c>(c_obj_id, c_tr_id, c_del, cmFIELD_ID)</c>, где c_obj_id - id строки
    /// родительской таблицы, cmFIELD_ID - id одного элемента коллекции
    /// (несколько строк линк-таблицы на один c_obj_id = несколько элементов).
    ///
    /// Пример: "опекун" (cm7463) на ct852 имеет c_col_type=2 - элементы лежат
    /// в "at852_7463" (c_obj_id = ct852.c_obj_id, cm7463 = id опекуна в ct851),
    /// а не как FK прямо на ct852.
    ///
    /// Если задано - EntityRepository резолвит колонку как коллекцию (через
    /// LoadLinkedAsync), а не как одиночный ref. Задаётся через
    /// <see cref="SchemaCatalog.ApplyColumnOverrides"/> с "linkTable".
    /// </summary>
    public string? LinkTable { get; set; }

    /// <summary>Является ли колонка коллекцией через линк-таблицу (см. <see cref="LinkTable"/>).</summary>
    public bool IsLinkedCollection => LinkTable is not null && RefTable is not null;

    public bool IsReference => Type == "ref" && RefTable is not null;
}

/// <summary>
/// Описание одной физической таблицы (ctNNN) и всех её колонок.
/// </summary>
public sealed class TableMeta {
    /// <summary>Логический идентификатор таблицы из schema.json, например "ct455".</summary>
    public required string Id { get; init; }

    /// <summary>Логическое имя из метаданных, например "фц::осн::Дог_банк_вклада".</summary>
    public required string Name { get; init; }

    public required List<ColumnMeta> Columns { get; init; }

    /// <summary>
    /// Имя основной ("базовой") физической таблицы в Postgres. По умолчанию
    /// равно <see cref="Id"/>. Колонки с <see cref="ColumnMeta.FromJoinTable"/> == false
    /// читаются отсюда. Задаётся через <see cref="SchemaCatalog.ApplyTableOverrides"/>.
    /// </summary>
    public string PhysicalTable { get; set; } = "";

    /// <summary>
    /// Имя "общей" таблицы-расширения (например "ct312"), если часть колонок
    /// этой логической таблицы физически лежит в ней (паттерн class-table
    /// inheritance: "ct457" хранит свои специфичные колонки, а общие
    /// "наименование"/"код" - в "ct312", связь по <see cref="JoinColumn"/>).
    /// Если null - JOIN не строится, все колонки берутся из <see cref="PhysicalTable"/>.
    /// </summary>
    public string? JoinTable { get; set; }

    /// <summary>
    /// Колонка, по которой <see cref="PhysicalTable"/> соединяется с
    /// <see cref="JoinTable"/> (с обеих сторон одно и то же имя). По умолчанию -
    /// PrimaryKeyColumn репозитория (обычно "c_obj_id").
    /// </summary>
    public string? JoinColumn { get; set; }

    /// <summary>
    /// Если задано - при чтении добавляется "AND {ClassFilterColumn} = {ClassFilterValue}"
    /// (например "c_class_id = 457"), чтобы из общей физической таблицы выбрать
    /// только строки нужного логического класса. Применяется к
    /// <see cref="JoinTable"/>, если он задан, иначе к <see cref="PhysicalTable"/>.
    /// </summary>
    public string? ClassFilterColumn { get; set; }

    /// <summary>Значение для <see cref="ClassFilterColumn"/>, см. там же.</summary>
    public long? ClassFilterValue { get; set; }
}

/// <summary>
/// Каталог схемы, загруженный из schema.json (сгенерированного extract_schema.py из tables.xls).
/// Используется EntityRepository для построения SQL и маппинга строк.
/// </summary>
public sealed class SchemaCatalog {
    public IReadOnlyDictionary<string, TableMeta> Tables { get; }

    private SchemaCatalog(Dictionary<string, TableMeta> tables) => Tables = tables;

    public static SchemaCatalog Load(string path) {
        using var stream = File.OpenRead(path);
        using var doc = JsonDocument.Parse(stream);

        var tables = new Dictionary<string, TableMeta>();
        foreach (var tableProp in doc.RootElement.GetProperty("tables").EnumerateObject()) {
            var ctId = tableProp.Name;
            var name = tableProp.Value.GetProperty("name").GetString() ?? ctId;

            var columns = new List<ColumnMeta>();
            foreach (var col in tableProp.Value.GetProperty("columns").EnumerateArray()) {
                columns.Add(new ColumnMeta {
                    Physical = col.GetProperty("physical").GetString()!,
                    Name = col.GetProperty("name").GetString()!,
                    Type = col.GetProperty("type").GetString()!,
                    RefTable = col.TryGetProperty("refTable", out var rt) ? rt.GetString() : null,
                    RefTableName = col.TryGetProperty("refTableName", out var rtn) ? rtn.GetString() : null,
                });
            }

            tables[ctId] = new TableMeta { Id = ctId, Name = name, Columns = columns, PhysicalTable = ctId };
        }

        return new SchemaCatalog(tables);
    }

    /// <summary>Найти таблицу по физическому имени (например "ct455"). Бросает, если не найдена.</summary>
    public TableMeta Get(string ctId) =>
        Tables.TryGetValue(ctId, out var meta)
            ? meta
            : throw new KeyNotFoundException($"Таблица '{ctId}' не найдена в schema.json");

    /// <summary>Найти физическое имя таблицы (ctNNN) по её логическому имени (например "фц::осн::Персона").</summary>
    public string? FindTableIdByLogicalName(string logicalName) =>
        Tables.Values.FirstOrDefault(t => t.Name == logicalName)?.Id;

    /// <summary>
    /// Применяет файл исключений (сгенерированный <see cref="SchemaDiagnostics.GenerateExcludeFileAsync"/>):
    /// удаляет из каждой <see cref="TableMeta.Columns"/> колонки, перечисленные
    /// в JSON вида <c>{ "ct455": ["cm3385", "cm1234"], ... }</c>.
    /// После вызова EntityRepository больше никогда не подставит эти физические
    /// колонки в SELECT и не будет резолвить их как связи.
    ///
    /// Колонки с <see cref="ColumnMeta.IsLinkedCollection"/> НИКОГДА не
    /// удаляются, даже если присутствуют в excludeJsonPath - физической
    /// колонки на строке у них и не должно быть (это by design, не потеря,
    /// см. <see cref="ColumnMeta.LinkTable"/>). Без этой защиты УСТАРЕВШИЙ
    /// excluded_columns.json (сгенерированный до того, как для колонки
    /// настроили LinkTable) мог бы целиком вырезать линк-коллекцию из модели -
    /// именно так это проявляется: SQL вживую работает, а ORM возвращает
    /// пустую коллекцию, потому что колонки уже нет в meta.Columns на момент
    /// чтения. Если подозреваете эту ситуацию - удалите excluded_columns.json
    /// или поставьте PgContextOptions.RegenerateOverrides = true.
    ///
    /// Вызывать ПОСЛЕДНИМ - после <see cref="ApplyTableOverrides"/>,
    /// <see cref="ApplyColumnOverrides"/> и <see cref="ApplyLinkTableOverrides"/>,
    /// и до создания репозиториев.
    /// </summary>
    public void ApplyExclusions(string excludeJsonPath) {
        using var stream = File.OpenRead(excludeJsonPath);
        using var doc = JsonDocument.Parse(stream);

        foreach (var tableProp in doc.RootElement.EnumerateObject()) {
            if (!Tables.TryGetValue(tableProp.Name, out var meta))
                continue;

            var excludedPhysical = tableProp.Value.EnumerateArray()
                .Select(e => e.GetString()!)
                .ToHashSet();

            meta.Columns.RemoveAll(c => excludedPhysical.Contains(c.Physical) && !c.IsLinkedCollection);
        }
    }

    /// <summary>
    /// Применяет переопределения линк-таблиц для коллекционных полей
    /// (c_col_type=2 в метаданных платформы, физически реализованных как
    /// отдельная таблица <c>at{class_id}_{field_id}</c>, см. <see cref="ColumnMeta.LinkTable"/>):
    /// словарь (таблица ctNNN, логическое имя колонки) -> имя линк-таблицы.
    ///
    /// Эти связи НЕ определяются автоматически (в отличие от справочников в
    /// ct312) - находятся только проверкой на реальных данных (см. README
    /// "Коллекции через линк-таблицы (at{class}_{field})") и прописываются
    /// вручную через <see cref="PgContextOptions.LinkTableOverrides"/>.
    ///
    /// Вызывать ПОСЛЕ <see cref="ApplyTableOverrides"/>, вместе с
    /// <see cref="ApplyColumnOverrides"/> (порядок между ними не важен - они
    /// трогают разные колонки) и ДО <see cref="ApplyExclusions"/>.
    /// </summary>
    public void ApplyLinkTableOverrides(IReadOnlyDictionary<(string TableId, string ColumnName), string> overrides) {
        foreach (var ((tableId, columnName), linkTable) in overrides) {
            if (!Tables.TryGetValue(tableId, out var meta))
                throw new InvalidOperationException(
                    $"LinkTableOverrides: таблица \"{tableId}\" не найдена в schema.json. " +
                    $"Проверьте id (например \"ct852\", не \"852\" или \"852\").");

            var col = meta.Columns.FirstOrDefault(c => c.Name == columnName);
            if (col is null) {
                var available = string.Join(", ", meta.Columns.Select(c => $"\"{c.Name}\""));
                throw new InvalidOperationException(
                    $"LinkTableOverrides: колонка \"{columnName}\" не найдена в таблице \"{tableId}\". " +
                    $"Проверьте точное соответствие логическому имени из schema.json (регистр, " +
                    $"пробелы, кодировка кириллицы). Колонки, реально доступные в {tableId}: {available}.");
            }

            col.LinkTable = linkTable;
        }
    }

    /// <summary>
    /// Применяет файл переопределений колонок (сгенерированный
    /// <see cref="SchemaDiagnostics.GenerateColumnOverridesAsync"/>): JSON вида
    /// <code>
    /// {
    ///   "ct457": {
    ///     "cm1597": { "physical": ["cm1597_1", "cm1597_2"], "join": true },
    ///     "cm1622": { "physical": ["cm1622"], "join": true }
    ///   }
    /// }
    /// </code>
    ///
    /// Для колонки cm1597 ("наименование") это означает: в реальной БД она
    /// физически представлена как cm1597_1 (обычно рус.) и cm1597_2 (обычно
    /// каз.), и читается из <see cref="TableMeta.JoinTable"/> (ct312), а не из
    /// <see cref="TableMeta.PhysicalTable"/> (ct457). Исходная колонка
    /// заменяется на "наименование_1"/"наименование_2" с тем же типом/связью,
    /// что у исходной, и <see cref="ColumnMeta.FromJoinTable"/> = "join".
    /// Если "physical" содержит один элемент - просто переименование
    /// физической колонки (без суффиксов).
    ///
    /// Вызывать ПОСЛЕ <see cref="ApplyTableOverrides"/> (чтобы JoinTable уже
    /// был задан) и ДО <see cref="ApplyExclusions"/>.
    /// </summary>
    public void ApplyColumnOverrides(string overridesJsonPath) {
        using var stream = File.OpenRead(overridesJsonPath);
        using var doc = JsonDocument.Parse(stream);

        foreach (var tableProp in doc.RootElement.EnumerateObject()) {
            if (!Tables.TryGetValue(tableProp.Name, out var meta))
                continue;

            foreach (var colProp in tableProp.Value.EnumerateObject()) {
                var origPhysical = colProp.Name;
                var idx = meta.Columns.FindIndex(c => c.Physical == origPhysical);
                if (idx < 0)
                    continue;

                var original = meta.Columns[idx];
                var spec = colProp.Value;

                var variants = spec.GetProperty("physical").EnumerateArray().Select(e => e.GetString()!).ToList();
                var fromJoin = spec.TryGetProperty("join", out var j) && j.GetBoolean();

                var replacement = new List<ColumnMeta>(variants.Count);
                for (var i = 0; i < variants.Count; i++) {
                    replacement.Add(new ColumnMeta {
                        Physical = variants[i],
                        Name = variants.Count == 1 ? original.Name : $"{original.Name}_{i + 1}",
                        Type = original.Type,
                        RefTable = original.RefTable,
                        RefTableName = original.RefTableName,
                        FromJoinTable = fromJoin,
                    });
                }

                meta.Columns.RemoveAt(idx);
                meta.Columns.InsertRange(idx, replacement);
            }
        }
    }

    /// <summary>
    /// Применяет файл переопределений физических таблиц: JSON вида
    /// <code>
    /// {
    ///   "ct457": { "joinTable": "ct312", "filter": { "c_class_id": 457 } },
    ///   "ct315": { "physicalTable": "ct312", "filter": { "c_class_id": 315 } }
    /// }
    /// </code>
    ///
    /// - "physicalTable" - переопределяет основную таблицу (если у логической
    ///   ctNNN нет собственной физической таблицы, и все её данные лежат в
    ///   общей "ct312" - как "ct315");
    /// - "joinTable" - таблица-расширение, к которой LEFT JOIN по
    ///   PrimaryKeyColumn (как "ct312" для "ct457", у которой есть и своя
    ///   таблица, и общие колонки в ct312);
    /// - "filter" - ровно одна пара колонка/значение, добавляется как
    ///   "AND col = value" к joinTable (если задан) либо к physicalTable.
    ///
    /// Вызывать ПЕРВЫМ (до ApplyColumnOverrides и ApplyExclusions) и до
    /// создания репозиториев.
    /// </summary>
    public void ApplyTableOverrides(string overridesJsonPath) {
        using var stream = File.OpenRead(overridesJsonPath);
        using var doc = JsonDocument.Parse(stream);

        foreach (var tableProp in doc.RootElement.EnumerateObject()) {
            if (!Tables.TryGetValue(tableProp.Name, out var meta))
                continue;

            if (tableProp.Value.TryGetProperty("physicalTable", out var pt))
                meta.PhysicalTable = pt.GetString() ?? meta.Id;

            if (tableProp.Value.TryGetProperty("joinTable", out var jt))
                meta.JoinTable = jt.GetString();

            if (tableProp.Value.TryGetProperty("filter", out var filter)) {
                foreach (var f in filter.EnumerateObject()) {
                    meta.ClassFilterColumn = f.Name;
                    meta.ClassFilterValue = f.Value.GetInt64();
                    break; // поддерживается только одно условие фильтра
                }
            }
        }
    }
}