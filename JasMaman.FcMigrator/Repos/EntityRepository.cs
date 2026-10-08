using Npgsql;

namespace PgOrm;

/// <summary>
/// Универсальный репозиторий поверх таблицы ctNNN, описанной в schema.json.
///
/// Загружает строки таблицы и, рекурсивно (на глубину <see cref="MaxDepth"/>),
/// строки связанных таблиц (колонки с Type == "ref"), подставляя их вместо
/// "сырых" id внешних ключей.
///
/// Связи грузятся пакетно (batch) на каждом уровне глубины: сначала читаются
/// все строки текущего уровня, затем для каждой связной таблицы собираются все
/// встретившиеся id и выполняется один запрос <c>WHERE id = ANY(@ids)</c> —
/// не N+1 запросов на каждую строку.
/// </summary>
public class EntityRepository {
    private readonly NpgsqlDataSource _dataSource;
    protected readonly SchemaCatalog Schema;

    /// <summary>Физическое имя таблицы (ctNNN), которой управляет этот репозиторий.</summary>
    public string TableId { get; }

    /// <summary>
    /// Глубина подгрузки связей. 0 - связи не подгружаются (только "сырые" id в виде
    /// <see cref="PgEntityRef"/>). 1 (по умолчанию) - подгружаются строки таблиц,
    /// на которые ссылается данная таблица, без их собственных связей. И так далее.
    /// </summary>
    public int MaxDepth { get; }

    /// <summary>
    /// Имя колонки первичного ключа во ВСЕХ таблицах ctNNN. По умолчанию "c_obj_id".
    /// Если в вашей Postgres-базе первичный ключ называется иначе, передайте
    /// его в конструктор.
    /// </summary>
    public string PrimaryKeyColumn { get; }

    public EntityRepository(NpgsqlDataSource dataSource, SchemaCatalog schema, string tableId,
        int maxDepth = 1, string primaryKeyColumn = "c_obj_id") {
        if (maxDepth < 0)
            throw new ArgumentOutOfRangeException(nameof(maxDepth));

        _dataSource = dataSource;
        Schema = schema;
        TableId = tableId;
        MaxDepth = maxDepth;
        PrimaryKeyColumn = primaryKeyColumn;

        // Бросит KeyNotFoundException сразу, если tableId отсутствует в schema.json.
        Schema.Get(TableId);
    }

    /// <summary>
    /// Максимальный размер одного "WHERE col = ANY(@ids)". Большие массивы id
    /// (например >5000 различных персон при резолве связей на 200к+ строк)
    /// бьются на чанки этого размера - несколько запросов вместо одного
    /// гигантского массива-параметра. См. README "Производительность".
    /// </summary>
    public int IdBatchSize { get; init; } = 5000;

    /// <summary>
    /// Если задано - при каждом SELECT добавляется фильтр
    /// <c>WHERE {VersionColumn} = {VersionValue}</c> чтобы читать только
    /// актуальные версии записей. Например "c_tr_id" = 0.
    /// </summary>
    public string? VersionColumn { get; init; }
    public long VersionValue { get; init; } = 0;

    /// <summary>
    /// Ограничение резолва ссылок: tableId -&gt; имена ref-колонок, которые РАЗРЕШЕНО подгружать.
    /// Если для таблицы записи нет - резолвятся все её ссылки (прежнее поведение).
    /// Смысл: число SELECT'ов = страниц × число целевых таблиц, а мапперу обычно нужны единицы
    /// связей из десятков. Неразрешённая ссылка остаётся <see cref="PgEntityRef"/> (только Id),
    /// поэтому companion-свойства "{Имя}Id" в моделях продолжают работать - теряется лишь
    /// типизированная навигация внутрь связи.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>>? ResolveRefColumns { get; init; }

    /// <summary>
    /// Проекция колонок: tableId -&gt; имена колонок, которые нужно читать. Таблицы без записи
    /// читаются целиком (прежнее поведение). Первичный ключ добавляется всегда.
    /// ОСТОРОЖНО: колонка, не попавшая в список, приедет как null — список должен покрывать всё,
    /// что читает маппер. Проверять сравнением результата с непроекцированным прогоном.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>>? SelectColumnsOnly { get; init; }

    /// <summary>
    /// Коллекции "один-ко-многим", которые НЕ подгружать: имя модели -&gt; имена свойств.
    /// См. <see cref="PgContextOptions.SkipCollections"/>.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>>? SkipCollections { get; init; }

    private static IEnumerable<long[]> Chunk(long[] ids, int size) {
        for (var i = 0; i < ids.Length; i += size)
            yield return ids[i..Math.Min(i + size, ids.Length)];
    }

    /// <summary>Как ReadRowsAsync(meta, whereIdIn: ids), но при ids.Length &gt; IdBatchSize выполняет несколько запросов по <see cref="IdBatchSize"/> и объединяет результат.</summary>
    private async Task<List<PgEntity>> ReadRowsBatchedAsync(TableMeta meta, long[] ids) {
        if (ids.Length <= IdBatchSize)
            return await ReadRowsAsync(meta, whereIdIn: ids);

        var result = new List<PgEntity>(ids.Length);
        foreach (var chunk in Chunk(ids, IdBatchSize))
            result.AddRange(await ReadRowsAsync(meta, whereIdIn: chunk));
        return result;
    }

    /// <summary>Загрузить все строки таблицы вместе со связями (на глубину MaxDepth).</summary>
    public async Task<List<PgEntity>> GetAllAsync() {
        var meta = Schema.Get(TableId);
        var entities = await ReadRowsAsync(meta, whereIdIn: null);
        await ResolveRelationsAsync(entities, meta, MaxDepth);
        return entities;
    }

    /// <summary>Количество строк в таблице (SELECT count(*)).</summary>
    public async Task<long> CountAsync() {
        var meta = Schema.Get(TableId);
        var joinColumn = meta.JoinColumn ?? PrimaryKeyColumn;

        var sql = meta.JoinTable is null
            ? $"SELECT count(*) FROM {meta.PhysicalTable} b"
            : $"SELECT count(*) FROM {meta.PhysicalTable} b " +
              $"LEFT JOIN {meta.JoinTable} j ON j.{joinColumn} = b.{joinColumn}";

        // Условия те же, что и при чтении строк, — иначе count не сходится с тем, что реально
        // вернут ReadRows/GetPage: без фильтра версии считались бы и архивные копии объектов.
        var conditions = new List<string>();
        if (meta.ClassFilterColumn is not null) {
            var filterAlias = meta.JoinTable is not null ? "j" : "b";
            conditions.Add($"{filterAlias}.{meta.ClassFilterColumn} = @classId");
        }
        if (VersionColumn is not null)
            conditions.Add($"b.{VersionColumn} = @versionValue");
        if (conditions.Count > 0)
            sql += " WHERE " + string.Join(" AND ", conditions);

        await using var cmd = _dataSource.CreateCommand(sql);
        if (meta.ClassFilterColumn is not null)
            cmd.Parameters.AddWithValue("classId", meta.ClassFilterValue!.Value);
        if (VersionColumn is not null)
            cmd.Parameters.AddWithValue("versionValue", VersionValue);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt64(result);
    }

    /// <summary>Количество строк в таблице модели T.</summary>
    public async Task<long> CountAsync<T>() where T : class => await CountAsync();

    /// <summary>
    /// Постраничная загрузка по возрастанию первичного ключа (keyset-пагинация:
    /// <c>WHERE id &gt; afterId ORDER BY id LIMIT pageSize</c>) - для больших
    /// таблиц вместо <see cref="GetAllAsync"/>, который читает всё в память
    /// одним вызовом. Передавайте <c>Id</c> последней строки предыдущей
    /// страницы; пустой результат = страниц больше нет.
    /// <code>
    /// long afterId = 0;
    /// while (true)
    /// {
    ///     var page = await repo.GetPageAsync(afterId, 2000);
    ///     if (page.Count == 0) break;
    ///     // ... обработать page ...
    ///     afterId = page[^1].Id;
    /// }
    /// </code>
    /// </summary>
    public async Task<List<PgEntity>> GetPageAsync(long afterId, int pageSize) {
        var meta = Schema.Get(TableId);
        var entities = await ReadRowsAsync(meta, whereIdIn: null, afterId: afterId, limit: pageSize);
        await ResolveRelationsAsync(entities, meta, MaxDepth);
        return entities;
    }

    /// <summary>Как <see cref="GetAllAsync{T}"/>, но постранично (keyset-пагинация) - см. <see cref="GetPageAsync"/>.</summary>
    public async Task<List<T>> GetPageAsync<T>(long afterId, int pageSize) where T : class, new() {
        var rows = await GetPageAsync(afterId, pageSize);
        var models = PgOrm.Models.ModelMapper.MapAll<T>(rows);
        await AttachOneToManyAsync(models, rows);
        return models;
    }

    /// <summary>
    /// "Result range" - OFFSET/LIMIT-пагинация с произвольной сортировкой:
    /// <c>ORDER BY {orderByLogicalColumn ?? PrimaryKeyColumn} [DESC] LIMIT take OFFSET skip</c>
    /// (PrimaryKeyColumn добавляется вторым ключом сортировки для стабильности
    /// при равных значениях). <paramref name="orderByLogicalColumn"/> - логическое
    /// имя колонки из schema.json (например "договор_дата"); null = сортировка по Id.
    ///
    /// Для постраничного ОБХОДА всей таблицы по Id предпочтительнее
    /// <see cref="GetPageAsync"/> (keyset, не деградирует на больших страницах).
    /// GetRangeAsync - когда нужна сортировка по другому полю или произвольный
    /// skip (например для UI с номерами страниц).
    /// </summary>
    public async Task<List<PgEntity>> GetRangeAsync(int skip, int take, string? orderByLogicalColumn = null, bool descending = false) {
        var meta = Schema.Get(TableId);

        (string Alias, string Physical)? orderBy = null;
        if (orderByLogicalColumn is not null) {
            var col = meta.Columns.FirstOrDefault(c => c.Name == orderByLogicalColumn)
                ?? throw new InvalidOperationException($"Колонка \"{orderByLogicalColumn}\" не найдена в \"{TableId}\" для сортировки");
            orderBy = (col.FromJoinTable ? "j" : "b", col.Physical);
        }

        var entities = await ReadRowsAsync(meta, whereIdIn: null, offset: skip, limit: take, orderBy: orderBy, descending: descending);
        await ResolveRelationsAsync(entities, meta, MaxDepth);
        return entities;
    }

    /// <summary>Как <see cref="GetRangeAsync"/>, но сразу маппит в сгенерированную модель T (+ коллекции 1-ко-многим).</summary>
    public async Task<List<T>> GetRangeAsync<T>(int skip, int take, string? orderByLogicalColumn = null, bool descending = false) where T : class, new() {
        var rows = await GetRangeAsync(skip, take, orderByLogicalColumn, descending);
        var models = PgOrm.Models.ModelMapper.MapAll<T>(rows);
        await AttachOneToManyAsync(models, rows);
        return models;
    }

    /// <summary>Загрузить одну строку по первичному ключу вместе со связями (на глубину MaxDepth).</summary>
    public async Task<PgEntity?> GetByIdAsync(long id) {
        var meta = Schema.Get(TableId);
        var entities = await ReadRowsAsync(meta, whereIdIn: new[] { id });
        if (entities.Count == 0)
            return null;

        await ResolveRelationsAsync(entities, meta, MaxDepth);
        return entities[0];
    }

    /// <summary>Загрузить несколько строк по списку первичных ключей вместе со связями (большие списки бьются по <see cref="IdBatchSize"/>).</summary>
    public async Task<List<PgEntity>> GetByIdsAsync(IEnumerable<long> ids) {
        var meta = Schema.Get(TableId);
        var idArray = ids.Distinct().ToArray();
        if (idArray.Length == 0)
            return new List<PgEntity>();

        var entities = await ReadRowsBatchedAsync(meta, idArray);
        await ResolveRelationsAsync(entities, meta, MaxDepth);
        return entities;
    }

    // ------------------------------------------------------------------
    // Типизированные модели (Models/Generated/*.cs, см. generate_models.py) -
    // все поля таблицы видны как свойства сгенерированного класса T (null,
    // если данных нет), плюс коллекции "один-ко-многим" (см. AttachOneToManyAsync).
    // ------------------------------------------------------------------

    /// <summary>Как <see cref="GetAllAsync"/>, но сразу маппит в сгенерированную модель T (через ModelMapper) и подгружает её коллекции "один-ко-многим".</summary>
    public async Task<List<T>> GetAllAsync<T>() where T : class, new() {
        var rows = await GetAllAsync();
        var models = PgOrm.Models.ModelMapper.MapAll<T>(rows);
        await AttachOneToManyAsync(models, rows);
        return models;
    }

    /// <summary>Как <see cref="GetByIdAsync"/>, но сразу маппит в сгенерированную модель T (через ModelMapper) и подгружает её коллекции "один-ко-многим".</summary>
    public async Task<T?> GetByIdAsync<T>(long id) where T : class, new() {
        var row = await GetByIdAsync(id);
        if (row is null)
            return null;

        var model = PgOrm.Models.ModelMapper.Map<T>(row)!;
        await AttachOneToManyAsync(new List<T> { model }, new List<PgEntity> { row });
        return model;
    }

    /// <summary>
    /// Загружает строки "дочерней" таблицы <paramref name="childTableId"/>, у
    /// которых колонка <paramref name="fkColumnLogicalName"/> (внешний ключ -
    /// "один-ко-многим" в обратную сторону, например "дог_банк_вкладчик" в
    /// "Зап_накопления" -> "Дог_банк_вклада") равна одному из
    /// <paramref name="parentIds"/>. Batch-запрос <c>WHERE {fk} = ANY(@ids)</c>
    /// (несколько запросов по <see cref="IdBatchSize"/>, если parentIds больше),
    /// результат группируется по значению fk.
    /// </summary>
    public async Task<Dictionary<long, List<PgEntity>>> LoadChildrenAsync(
        IEnumerable<long> parentIds, string childTableId, string fkColumnLogicalName, int maxDepth = 0) {
        var ids = parentIds.Distinct().ToArray();
        if (ids.Length == 0)
            return new();

        if (ids.Length <= IdBatchSize)
            return await LoadChildrenChunkAsync(ids, childTableId, fkColumnLogicalName, maxDepth);

        var result = new Dictionary<long, List<PgEntity>>();
        foreach (var chunk in Chunk(ids, IdBatchSize))
            foreach (var (parentId, children) in await LoadChildrenChunkAsync(chunk, childTableId, fkColumnLogicalName, maxDepth))
                result[parentId] = children;
        return result;
    }

    private async Task<Dictionary<long, List<PgEntity>>> LoadChildrenChunkAsync(
        long[] ids, string childTableId, string fkColumnLogicalName, int maxDepth) {
        var result = new Dictionary<long, List<PgEntity>>();

        var meta = Schema.Get(childTableId);
        var fkCol = meta.Columns.FirstOrDefault(c => c.Name == fkColumnLogicalName)
            ?? throw new InvalidOperationException($"Колонка \"{fkColumnLogicalName}\" не найдена в таблице \"{childTableId}\"");

        var columns = SelectColumns(meta, PrimaryKeyColumn);
        var fkAlias = fkCol.FromJoinTable ? "j" : "b";
        var fkExpr = $"{fkAlias}.{fkCol.Physical}";
        columns.Add($"{fkExpr} AS __fk");

        var joinColumn = meta.JoinColumn ?? PrimaryKeyColumn;
        var sql = meta.JoinTable is null
            ? $"SELECT {string.Join(", ", columns)} FROM {meta.PhysicalTable} b"
            : $"SELECT {string.Join(", ", columns)} FROM {meta.PhysicalTable} b " +
              $"LEFT JOIN {meta.JoinTable} j ON j.{joinColumn} = b.{joinColumn}";

        var conditions = new List<string> { $"{fkExpr} = ANY(@ids)" };
        if (meta.ClassFilterColumn is not null) {
            var filterAlias = meta.JoinTable is not null ? "j" : "b";
            conditions.Add($"{filterAlias}.{meta.ClassFilterColumn} = @classId");
        }
        sql += " WHERE " + string.Join(" AND ", conditions);

        await using var cmd = _dataSource.CreateCommand(sql);
        cmd.Parameters.AddWithValue("ids", ids);
        if (meta.ClassFilterColumn is not null)
            cmd.Parameters.AddWithValue("classId", meta.ClassFilterValue!.Value);

        var entities = new List<PgEntity>();
        var fkValues = new List<long>();

        await using var reader = await cmd.ExecuteReaderAsync();
        var pkOrdinal = reader.GetOrdinal(PrimaryKeyColumn);
        var fkOrdinal = reader.GetOrdinal("__fk");
        var readableColumns = ReadableColumns(meta);
        var colOrdinals = readableColumns.Select(c => reader.GetOrdinal(c.Physical)).ToArray();

        while (await reader.ReadAsync()) {
            var entity = new PgEntity(meta.Id) { Id = ConvertPk(reader.GetValue(pkOrdinal), meta) };
            fkValues.Add(ConvertPk(reader.GetValue(fkOrdinal), meta));

            for (var i = 0; i < readableColumns.Length; i++) {
                var col = readableColumns[i];
                var ordinal = colOrdinals[i];

                if (reader.IsDBNull(ordinal)) {
                    if (col.IsReference)
                        entity.RawRefs[col.Name] = null;
                    else
                        entity[col.Name] = null;
                    continue;
                }

                if (col.IsReference)
                    entity.RawRefs[col.Name] = ConvertRefId(reader.GetValue(ordinal), meta, col);
                else
                    entity[col.Name] = ConvertCell(reader.GetValue(ordinal), meta, col);
            }

            entities.Add(entity);
        }

        await ResolveRelationsAsync(entities, meta, maxDepth);

        for (var i = 0; i < entities.Count; i++) {
            var fk = fkValues[i];
            if (!result.TryGetValue(fk, out var list))
                result[fk] = list = new List<PgEntity>();
            list.Add(entities[i]);
        }

        return result;
    }

    /// <summary>
    /// Если у T есть статическое поле
    /// <c>public static readonly OneToManyRelation[] OneToManyRelations</c>
    /// (генерируется generate_models.py для таблиц с настроенными связями
    /// "один-ко-многим"), для каждой связи одним batch-запросом
    /// (<see cref="LoadChildrenAsync"/>) подгружает дочерние строки и
    /// заполняет соответствующее List-свойство у каждой модели.
    /// </summary>
    internal async Task AttachOneToManyAsync<T>(List<T> models, List<PgEntity> rows) where T : class {
        var relationsField = typeof(T).GetField("OneToManyRelations",
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
        if (relationsField?.GetValue(null) is Models.OneToManyRelation[] { Length: > 0 } relations) {
            var ids = rows.Select(r => r.Id).ToArray();

            IReadOnlySet<string>? skipped = null;
            SkipCollections?.TryGetValue(typeof(T).Name, out skipped);

            foreach (var rel in relations) {
                // Коллекция объявлена в модели, но маппером не используется — не читаем её вовсе.
                if (skipped != null && skipped.Contains(rel.PropertyName)) {
                    continue;
                }

                var childrenByParent = await LoadChildrenAsync(ids, rel.ChildTableId, rel.FkColumnName, rel.ChildMaxDepth);

                // один MapAll на ВСЕ дочерние строки сразу (а не Map() на каждую) -
                // меньше reflection-вызовов и общий memo-кэш для shared-сущностей
                var allChildren = childrenByParent.Values.SelectMany(c => c).ToList();
                var mapAllMethod = typeof(Models.ModelMapper)
                    .GetMethod(nameof(Models.ModelMapper.MapAll), System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)!
                    .MakeGenericMethod(rel.ChildModelType);
                var mappedAll = (System.Collections.IList)mapAllMethod.Invoke(null, new object?[] { allChildren })!;

                var mappedByEntity = new Dictionary<PgEntity, object>();
                for (var i = 0; i < allChildren.Count; i++)
                    mappedByEntity[allChildren[i]] = mappedAll[i]!;

                var prop = typeof(T).GetProperty(rel.PropertyName)
                    ?? throw new InvalidOperationException($"Свойство \"{rel.PropertyName}\" не найдено в {typeof(T).Name}");
                var listType = typeof(List<>).MakeGenericType(rel.ChildModelType);

                for (var i = 0; i < models.Count; i++) {
                    var list = (System.Collections.IList)Activator.CreateInstance(listType)!;
                    if (childrenByParent.TryGetValue(rows[i].Id, out var children))
                        foreach (var child in children)
                            list.Add(mappedByEntity[child]);

                    prop.SetValue(models[i], list);
                }
            }
        }

        await AttachReverseLinkedCollectionsAsync(models, rows);
    }

    /// <summary>
    /// Если у T есть статическое поле
    /// <c>public static readonly ReverseLinkedCollectionRelation[] ReverseLinkedCollections</c>
    /// (генерируется generate_models.py для обратной стороны коллекций через
    /// линк-таблицу - см. <see cref="Models.ReverseLinkedCollectionRelation"/>),
    /// для каждой связи находит дочерние строки через линк-таблицу
    /// (<c>WHERE {LinkColumn} = ANY(@ids)</c>, а не через FK-колонку на
    /// дочерней строке - её физически нет) и заполняет List-свойство.
    /// </summary>
    internal async Task AttachReverseLinkedCollectionsAsync<T>(List<T> models, List<PgEntity> rows) where T : class {
        var relationsField = typeof(T).GetField("ReverseLinkedCollections",
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);

        // ДИАГНОСТИКА: поле есть, но не того типа/null - раньше тихо выходили (return),
        // из-за чего "не подгрузило связь" выглядело одинаково и при отсутствии поля,
        // и при реальной ошибке рефлексии. Теперь различаем эти случаи явно.
        if (relationsField is null)
            return; // у T нет такого поля - это нормально (нет обратных линк-коллекций)

        var rawValue = relationsField.GetValue(null);
        if (rawValue is not Models.ReverseLinkedCollectionRelation[] relations)
            throw new InvalidOperationException(
                $"{typeof(T).Name}.ReverseLinkedCollections имеет тип {rawValue?.GetType().FullName ?? "null"}, " +
                $"ожидался ReverseLinkedCollectionRelation[]. Модель сгенерирована устаревшей версией " +
                $"generate_models.py - перегенерируйте Models/Generated.");

        if (relations.Length == 0)
            return;

        var ids = rows.Select(r => r.Id).ToArray();

        foreach (var rel in relations) {
            // (childRowId родителя коллекции, id строки rel.ChildTableId)
            var linkRows = new List<(long ParentId, long ChildRowId)>();
            foreach (var chunk in Chunk(ids, IdBatchSize)) {
                var sql = $"SELECT {rel.LinkColumn}, c_obj_id FROM {rel.LinkTable} " +
                          $"WHERE {rel.LinkColumn} = ANY(@ids) AND c_del = 0";
                await using var cmd = _dataSource.CreateCommand(sql);
                cmd.Parameters.AddWithValue("ids", chunk);

                try {
                    await using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync()) {
                        if (await reader.IsDBNullAsync(0))
                            continue;
                        linkRows.Add((Convert.ToInt64(reader.GetValue(0)), Convert.ToInt64(reader.GetValue(1))));
                    }
                } catch (Exception ex) {
                    throw new InvalidOperationException(
                        $"Не удалось прочитать обратную линк-коллекцию \"{rel.PropertyName}\" " +
                        $"({typeof(T).Name} -> {rel.ChildTableId}): запрос \"{sql}\" к таблице " +
                        $"\"{rel.LinkTable}\" завершился ошибкой. Проверьте, что линк-таблица " +
                        $"существует и колонка \"{rel.LinkColumn}\" в ней есть. Исходная ошибка: {ex.Message}", ex);
                }
            }

            var childRowIds = linkRows.Select(r => r.ChildRowId).Distinct().ToArray();
            var childMeta = Schema.Get(rel.ChildTableId);
            var childRows = childRowIds.Length == 0
                ? new List<PgEntity>()
                : await ReadRowsBatchedAsync(childMeta, childRowIds);
            await ResolveRelationsAsync(childRows, childMeta, rel.ChildMaxDepth);

            var rowsById = new Dictionary<long, PgEntity>(childRows.Count);
            foreach (var e in childRows)
                rowsById.TryAdd(e.Id, e);

            var mapAllMethod = typeof(Models.ModelMapper)
                .GetMethod(nameof(Models.ModelMapper.MapAll), System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)!
                .MakeGenericMethod(rel.ChildModelType);
            var mappedAll = (System.Collections.IList)mapAllMethod.Invoke(null, new object?[] { childRows })!;

            var mappedByEntity = new Dictionary<PgEntity, object>();
            for (var i = 0; i < childRows.Count; i++)
                mappedByEntity[childRows[i]] = mappedAll[i]!;

            var byParent = new Dictionary<long, List<object>>();
            foreach (var (parentId, childRowId) in linkRows) {
                if (!rowsById.TryGetValue(childRowId, out var childRow))
                    continue;
                if (!byParent.TryGetValue(parentId, out var list))
                    byParent[parentId] = list = new List<object>();
                list.Add(mappedByEntity[childRow]);
            }

            var prop = typeof(T).GetProperty(rel.PropertyName)
                ?? throw new InvalidOperationException($"Свойство \"{rel.PropertyName}\" не найдено в {typeof(T).Name}");
            var listType = typeof(List<>).MakeGenericType(rel.ChildModelType);

            for (var i = 0; i < models.Count; i++) {
                var list = (System.Collections.IList)Activator.CreateInstance(listType)!;
                if (byParent.TryGetValue(rows[i].Id, out var items))
                    foreach (var item in items)
                        list.Add(item);

                prop.SetValue(models[i], list);
            }
        }
    }

    // ------------------------------------------------------------------
    // Внутренняя реализация
    // ------------------------------------------------------------------

    /// <summary>
    /// Строит список выражений для SELECT с алиасами таблиц: "b" - PhysicalTable,
    /// "j" - JoinTable (если задан). PK всегда читается из "b". Колонки-коллекции
    /// через линк-таблицу (<see cref="ColumnMeta.IsLinkedCollection"/>)
    /// исключаются - физически на строке такой колонки нет, она резолвится
    /// отдельным запросом в <see cref="ResolveLinkedCollectionsAsync"/>.
    /// </summary>
    /// <summary>
    /// Колонки строки, которые реально попадают в SELECT и потому читаются из reader'а.
    /// ЕДИНСТВЕННЫЙ источник истины: список формируется здесь и используется и при построении
    /// SQL, и при разборе строки — иначе разбор пойдёт по колонке, которой нет в результате
    /// (IndexOutOfRangeException "Field not found in row").
    /// </summary>
    private ColumnMeta[] ReadableColumns(TableMeta meta) {
        var source = meta.Columns.Where(c => !c.IsLinkedCollection);

        // Проекция: широкие таблицы (напр. ct320 «Персона» — 207 колонок) участвуют в пути чтения
        // лишь как пересадка к паре FK, а тянутся целиком.
        if (SelectColumnsOnly is not null && SelectColumnsOnly.TryGetValue(meta.Id, out var only))
            source = source.Where(c => only.Contains(c.Name));

        return source.ToArray();
    }

    private List<string> SelectColumns(TableMeta meta, string primaryKeyColumn) {
        var cols = new List<string>(meta.Columns.Count + 1) { $"b.{primaryKeyColumn} AS {primaryKeyColumn}" };
        cols.AddRange(ReadableColumns(meta).Select(c => {
            var alias = c.FromJoinTable ? "j" : "b";
            return $"{alias}.{c.Physical} AS {c.Physical}";
        }));
        return cols;
    }

    /// <summary>
    /// Читает строки одной таблицы (без связей). Если <paramref name="whereIdIn"/> не null,
    /// фильтрует по PrimaryKeyColumn = ANY(ids); иначе читает всю таблицу.
    /// Если у <paramref name="meta"/> задан <see cref="TableMeta.JoinTable"/>,
    /// строится "FROM PhysicalTable b LEFT JOIN JoinTable j ON j.pk = b.pk" -
    /// колонки с <see cref="ColumnMeta.FromJoinTable"/> читаются из "j", остальные - из "b".
    /// Значения колонок-связей (Type == "ref") складываются в PgEntity.RawRefs,
    /// сам PgEntity[col.Name] для них пока не устанавливается.
    /// </summary>
    private async Task<List<PgEntity>> ReadRowsAsync(TableMeta meta, long[]? whereIdIn, long? afterId = null,
        int? limit = null, int? offset = null, (string Alias, string Physical)? orderBy = null, bool descending = false) {
        var columns = SelectColumns(meta, PrimaryKeyColumn);
        var joinColumn = meta.JoinColumn ?? PrimaryKeyColumn;

        var sql = meta.JoinTable is null
            ? $"SELECT {string.Join(", ", columns)} FROM {meta.PhysicalTable} b"
            : $"SELECT {string.Join(", ", columns)} FROM {meta.PhysicalTable} b " +
              $"LEFT JOIN {meta.JoinTable} j ON j.{joinColumn} = b.{joinColumn}";

        var conditions = new List<string>();
        if (whereIdIn is not null)
            conditions.Add($"b.{PrimaryKeyColumn} = ANY(@ids)");
        if (afterId is not null)
            conditions.Add($"b.{PrimaryKeyColumn} > @afterId");
        if (meta.ClassFilterColumn is not null) {
            var filterAlias = meta.JoinTable is not null ? "j" : "b";
            conditions.Add($"{filterAlias}.{meta.ClassFilterColumn} = @classId");
        }
        if (VersionColumn is not null)
            conditions.Add($"b.{VersionColumn} = @versionValue");
        if (conditions.Count > 0)
            sql += " WHERE " + string.Join(" AND ", conditions);

        if (limit is not null || offset is not null || orderBy is not null || afterId is not null) {
            // afterId (keyset-пагинация) требует детерминированного порядка -
            // ORDER BY добавляется даже если limit не задан.
            var orderExpr = orderBy is { } ob
                ? $"{ob.Alias}.{ob.Physical} {(descending ? "DESC" : "ASC")}, b.{PrimaryKeyColumn}"
                : $"b.{PrimaryKeyColumn}";
            sql += $" ORDER BY {orderExpr}";
            if (limit is not null)
                sql += " LIMIT @limit";
            if (offset is not null)
                sql += " OFFSET @offset";
        }

        await using var cmd = _dataSource.CreateCommand(sql);
        if (whereIdIn is not null)
            cmd.Parameters.AddWithValue("ids", whereIdIn);
        if (afterId is not null)
            cmd.Parameters.AddWithValue("afterId", afterId.Value);
        if (meta.ClassFilterColumn is not null)
            cmd.Parameters.AddWithValue("classId", meta.ClassFilterValue!.Value);
        if (VersionColumn is not null)
            cmd.Parameters.AddWithValue("versionValue", VersionValue);
        if (limit is not null)
            cmd.Parameters.AddWithValue("limit", limit.Value);
        if (offset is not null)
            cmd.Parameters.AddWithValue("offset", offset.Value);

        var result = new List<PgEntity>();
        await using var reader = await cmd.ExecuteReaderAsync();

        var pkOrdinal = reader.GetOrdinal(PrimaryKeyColumn);
        // колонки-коллекции (LinkTable) физически отсутствуют на строке -
        // не входят в SELECT (см. SelectColumns), поэтому не входят и в ordinals
        var readableColumns = ReadableColumns(meta);
        var colOrdinals = readableColumns.Select(c => reader.GetOrdinal(c.Physical)).ToArray();

        while (await reader.ReadAsync()) {
            var entity = new PgEntity(meta.Id) {
                Id = ConvertPk(reader.GetValue(pkOrdinal), meta)
            };

            // строка уже считана в память (ReadAsync), поэтому per-cell доступ -
            // синхронный (без async-аллокаций на каждую из 100+ колонок * N строк).
            for (var i = 0; i < readableColumns.Length; i++) {
                var col = readableColumns[i];
                var ordinal = colOrdinals[i];

                if (reader.IsDBNull(ordinal)) {
                    if (col.IsReference)
                        entity.RawRefs[col.Name] = null;
                    else
                        entity[col.Name] = null;
                    continue;
                }

                if (col.IsReference)
                    entity.RawRefs[col.Name] = ConvertRefId(reader.GetValue(ordinal), meta, col);
                else
                    entity[col.Name] = ConvertCell(reader.GetValue(ordinal), meta, col);
            }

            result.Add(entity);
        }

        return result;
    }

    /// <summary>
    /// Для каждой колонки-связи в <paramref name="meta"/>: собирает все встретившиеся
    /// в <paramref name="entities"/> id, одним запросом на таблицу подгружает связанные
    /// строки (если depth &gt; 0), рекурсивно резолвит ИХ связи на depth-1, и проставляет
    /// результат (PgEntity, PgEntityRef или null) в каждую запись.
    /// </summary>
    private async Task ResolveRelationsAsync(List<PgEntity> entities, TableMeta meta, int depth) {
        if (entities.Count == 0)
            return;

        var refColumns = meta.Columns.Where(c => c.IsReference && !c.IsLinkedCollection).ToList();

        // Какие связи РАЗРЕШЕНО подгружать (см. ResolveRefColumns). ВАЖНО: этот список сужает только
        // ЧТЕНИЕ целевых таблиц. Присвоение значений ниже идёт по ВСЕМ ref-колонкам — иначе у
        // неразрешённых колонок не выставился бы PgEntityRef, и companion-свойства "{Имя}Id"
        // в моделях стали бы null (тихая потеря данных).
        var columnsToRead = ResolveRefColumns is not null && ResolveRefColumns.TryGetValue(meta.Id, out var allowed)
            ? refColumns.Where(c => allowed.Contains(c.Name)).ToList()
            : refColumns;
        var linkedColumns = meta.Columns.Where(c => c.IsLinkedCollection).ToList();

        if (linkedColumns.Count > 0)
            await ResolveLinkedCollectionsAsync(entities, meta, linkedColumns, depth);

        if (refColumns.Count == 0)
            return;

        // Группируем по целевой таблице: несколько ref-колонок на одну и ту же
        // таблицу (например 4 самоссылки ct455 или вкладчик+вноситель -> Персона)
        // резолвятся ОДНИМ запросом, а не по запросу на колонку.
        var resolvedByTable = new Dictionary<string, Dictionary<long, PgEntity>>();

        if (depth > 0) {
            foreach (var group in columnsToRead.GroupBy(c => c.RefTable!)) {
                var ids = entities
                    .SelectMany(e => group.Select(col =>
                        e.RawRefs.TryGetValue(col.Name, out var v) ? v : null))
                    .Where(v => v.HasValue)
                    .Select(v => v!.Value)
                    .Distinct()
                    .ToArray();

                if (ids.Length == 0)
                    continue;

                var refMeta = Schema.Get(group.Key);
                var refEntities = await ReadRowsBatchedAsync(refMeta, ids);
                await ResolveRelationsAsync(refEntities, refMeta, depth - 1);

                // при дублях id (теоретически) - берём первый
                var map = new Dictionary<long, PgEntity>(refEntities.Count);
                foreach (var e in refEntities)
                    map[e.Id] = e;
                resolvedByTable[group.Key] = map;
            }
        }

        foreach (var col in refColumns) {
            resolvedByTable.TryGetValue(col.RefTable!, out var resolved);

            foreach (var entity in entities) {
                if (!entity.RawRefs.TryGetValue(col.Name, out var fk) || fk is null) {
                    entity[col.Name] = null;
                } else if (resolved is not null && resolved.TryGetValue(fk.Value, out var related)) {
                    entity[col.Name] = related;
                } else {
                    entity[col.Name] = new PgEntityRef(col.RefTable!, fk.Value);
                }

                entity.RawRefs.Remove(col.Name);
            }
        }
    }

    /// <summary>
    /// Резолвит коллекционные поля (c_col_type=2 в метаданных платформы),
    /// физически реализованные как отдельная линк-таблица
    /// <c>at{class_id}_{field_id}(c_obj_id, c_tr_id, c_del, cmFIELD_ID)</c>
    /// (см. <see cref="ColumnMeta.LinkTable"/>). В отличие от обычных
    /// одиночных ref - значение FK НЕ читается со строки самой сущности
    /// (там его физически нет), а отдельным запросом к линк-таблице по
    /// <c>c_obj_id = ANY(@parentIds)</c>.
    ///
    /// Результат - <c>List&lt;PgEntity&gt;</c> (если depth &gt; 0 и связанные
    /// строки подгружены) либо <c>List&lt;PgEntityRef&gt;</c> (если depth = 0)
    /// в <c>entity[col.Name]</c>.
    /// </summary>
    private async Task ResolveLinkedCollectionsAsync(
        List<PgEntity> entities, TableMeta meta, List<ColumnMeta> linkedColumns, int depth) {
        var parentIds = entities.Select(e => e.Id).Distinct().ToArray();

        foreach (var col in linkedColumns) {
            // линк-таблица: c_obj_id = id строки meta (родителя),
            // col.Physical (cmFIELD_ID) = id элемента коллекции в col.RefTable
            var linkRows = new List<(long ParentId, long ChildId)>();

            foreach (var chunk in Chunk(parentIds, IdBatchSize)) {
                var sql = $"SELECT c_obj_id, {col.Physical} FROM {col.LinkTable} " +
                          $"WHERE c_obj_id = ANY(@ids) AND c_del = 0";
                await using var cmd = _dataSource.CreateCommand(sql);
                cmd.Parameters.AddWithValue("ids", chunk);

                try {
                    await using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync()) {
                        if (await reader.IsDBNullAsync(1))
                            continue;
                        linkRows.Add((Convert.ToInt64(reader.GetValue(0)), Convert.ToInt64(reader.GetValue(1))));
                    }
                } catch (Exception ex) {
                    throw new InvalidOperationException(
                        $"Не удалось прочитать коллекцию \"{col.Name}\" ({meta.Id} -> {col.RefTable}): " +
                        $"запрос \"{sql}\" к линк-таблице \"{col.LinkTable}\" завершился ошибкой. " +
                        $"Проверьте, что линк-таблица существует и колонка \"{col.Physical}\" в ней есть. " +
                        $"Исходная ошибка: {ex.Message}", ex);
                }
            }

            var childIds = linkRows.Select(r => r.ChildId).Distinct().ToArray();

            Dictionary<long, PgEntity>? resolved = null;
            if (depth > 0 && childIds.Length > 0) {
                var childMeta = Schema.Get(col.RefTable!);
                var childEntities = await ReadRowsBatchedAsync(childMeta, childIds);
                await ResolveRelationsAsync(childEntities, childMeta, depth - 1);

                // ToDictionary(e => e.Id) упадёт с ArgumentException при дублирующихся
                // Id. Дубли возникают, если у таблицы есть JoinTable (LEFT JOIN ct312)
                // и одна физическая строка даёт несколько строк результата (несколько
                // записей в ct312 с одним c_obj_id), либо при race condition в данных.
                // При дублях берём первый - данные одинаковы, ошибки нет.
                resolved = new Dictionary<long, PgEntity>(childEntities.Count);
                foreach (var e in childEntities)
                    resolved.TryAdd(e.Id, e);
            }

            var byParent = new Dictionary<long, List<object>>();
            foreach (var (parentId, childId) in linkRows) {
                if (!byParent.TryGetValue(parentId, out var list))
                    byParent[parentId] = list = new List<object>();

                if (resolved is not null && resolved.TryGetValue(childId, out var child))
                    list.Add(child);
                else
                    list.Add(new PgEntityRef(col.RefTable!, childId));
            }

            foreach (var entity in entities)
                entity[col.Name] = byParent.TryGetValue(entity.Id, out var list) ? list : new List<object>();
        }
    }

    // ------------------------------------------------------------------
    // Конверсия значений с КОНТЕКСТОМ. При несовпадении физического типа в
    // Postgres со схемой (из tables.xls) бросаем DataMappingException, где
    // явно указано: таблица, колонка (логическая + cmNNNN), ожидаемый тип,
    // фактический CLR-тип и само значение - чтобы сразу видеть, где и из-за
    // чего отвалилось, а не безликий InvalidCastException.
    // ------------------------------------------------------------------

    private static long ConvertPk(object raw, TableMeta meta) {
        try { return Convert.ToInt64(raw); } catch (Exception ex) when (ex is InvalidCastException or FormatException or OverflowException) {
            throw new DataMappingException(meta, null, "long (PK)", raw, ex);
        }
    }

    private static long? ConvertRefId(object raw, TableMeta meta, ColumnMeta col) {
        try { return Convert.ToInt64(raw); } catch (Exception ex) when (ex is InvalidCastException or FormatException or OverflowException) {
            throw new DataMappingException(meta, col, $"long (FK -> {col.RefTable})", raw, ex);
        }
    }

    private static object ConvertCell(object raw, TableMeta meta, ColumnMeta col) {
        try {
            return col.Type switch {
                "long" => Convert.ToInt64(raw),
                "float" => Convert.ToDouble(raw),
                "boolean" => Convert.ToBoolean(raw),
                // Npgsql возвращает DateOnly для date-колонок и TimeOnly для time.
                // Конвертируем в DateTime чтобы PgEntity всегда хранил единый тип
                // и YodaQuery/любой внешний код мог кастовать напрямую без сюрпризов.
                "date" => raw switch {
                    DateOnly d => d.ToDateTime(TimeOnly.MinValue),
                    DateTime dt => dt,
                    _ => DateTime.Parse(raw.ToString()!),
                },
                "time" => raw switch {
                    TimeOnly t => DateTime.Today.Add(t.ToTimeSpan()),
                    TimeSpan ts => DateTime.Today.Add(ts),
                    DateTime dt => dt,
                    _ => DateTime.Parse(raw.ToString()!),
                },
                // string, memo, object -> как есть
                _ => raw,
            };
        } catch (Exception ex) when (ex is InvalidCastException or FormatException or OverflowException) {
            throw new DataMappingException(meta, col, col.Type, raw, ex);
        }
    }
}

/// <summary>
/// Бросается при невозможности привести значение из Postgres к типу,
/// заявленному в schema.json (метаданные tables.xls). Сообщение содержит
/// таблицу, колонку, ожидаемый тип, фактический CLR-тип и значение - этого
/// достаточно, чтобы найти расхождение схемы с физической БД (обычно колонку
/// нужно дополнить в column_overrides/exclude или поправить тип в метаданных).
/// </summary>
public sealed class DataMappingException : Exception {
    public DataMappingException(TableMeta meta, ColumnMeta? col, string expectedType, object? rawValue, Exception inner)
        : base(BuildMessage(meta, col, expectedType, rawValue), inner) { }

    private static string BuildMessage(TableMeta meta, ColumnMeta? col, string expectedType, object? rawValue) {
        var colDesc = col is null ? "(первичный ключ)" : $"{col.Name} [{col.Physical}]";
        var actualType = rawValue?.GetType().FullName ?? "null";
        var valuePreview = rawValue?.ToString();
        if (valuePreview is { Length: > 200 })
            valuePreview = valuePreview[..200] + "…";

        return $"Не удалось привести значение колонки {colDesc} таблицы " +
               $"{meta.Id} ({meta.Name}; физ. {meta.PhysicalTable}): ожидался тип '{expectedType}', " +
               $"но Postgres вернул {actualType} = '{valuePreview}'. " +
               $"Вероятно, схема (tables.xls) разошлась с физическим типом колонки - " +
               $"проверьте column_overrides.json / тип в метаданных.";
    }
}