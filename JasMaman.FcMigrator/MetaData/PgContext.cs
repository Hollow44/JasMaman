using System.Collections.Concurrent;
using System.Reflection;
using Npgsql;
using PgOrm.Models;

namespace PgOrm;

/// <summary>Настройки <see cref="PgContext"/>.</summary>
public sealed class PgContextOptions {
    /// <summary>Строка подключения Npgsql. Обязательно.</summary>
    public required string ConnectionString { get; init; }

    /// <summary>Путь к schema.json (из extract_schema.py). По умолчанию "schema.json".</summary>
    public string SchemaPath { get; init; } = "schema.json";

    /// <summary>Имя колонки первичного ключа во всех таблицах. По умолчанию "c_obj_id".</summary>
    public string PrimaryKeyColumn { get; init; } = "c_obj_id";

    /// <summary>Глубина подгрузки связей по умолчанию (можно переопределить в каждом вызове).</summary>
    public int DefaultMaxDepth { get; init; } = 1;

    /// <summary>
    /// Коллекции "один-ко-многим", которые НЕ подгружать: имя модели -> имена свойств.
    /// Связи объявлены в сгенерированных моделях и подтягиваются безусловно, а на медленном канале
    /// каждая лишняя коллекция — отдельный batch-запрос на страницу. Если маппер коллекцию не
    /// использует, её дешевле не читать вовсе.
    /// Пример: ["ДогБанкВклада"] = { "Примечания", "ЗапросыБанк" }.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>> SkipCollections { get; init; }
        = new Dictionary<string, IReadOnlySet<string>>();

    /// <summary>
    /// Каталог, где лежат/создаются файлы оверрайдов
    /// (table_overrides.json / column_overrides.json / excluded_columns.json).
    /// По умолчанию - текущий каталог.
    /// </summary>
    public string OverridesDir { get; init; } = ".";

    /// <summary>
    /// true - перегенерировать файлы оверрайдов из БД даже если они уже есть
    /// (после изменения схемы БД или schema.json). false (по умолчанию) -
    /// использовать существующие файлы; генерировать только отсутствующие.
    /// </summary>
    public bool RegenerateOverrides { get; init; }

    /// <summary>
    /// Имя колонки версионности (например "c_tr_id"). Если задано - при чтении
    /// любой таблицы добавляется фильтр <c>WHERE {VersionColumn} = {VersionValue}</c>,
    /// чтобы читать только актуальные версии записей (не исторические).
    /// Например: VersionColumn = "c_tr_id", VersionValue = 0.
    /// </summary>
    public string? VersionColumn { get; init; }

    /// <summary>Значение для <see cref="VersionColumn"/>. По умолчанию 0.</summary>
    public long VersionValue { get; init; } = 0;

    /// <summary>
    /// Выборочный резолв связей: tableId -&gt; ref-колонки, которые нужно подгружать.
    /// Таблицы без записи резолвятся полностью (прежнее поведение). См.
    /// <see cref="EntityRepository.ResolveRefColumns"/> - это главный рычаг скорости:
    /// число SELECT'ов пропорционально количеству резолвимых целевых таблиц.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>>? ResolveRefColumns { get; init; }

    /// <summary>
    /// Проекция колонок: tableId -&gt; читаемые колонки (см. <see cref="EntityRepository.SelectColumnsOnly"/>).
    /// Главный рычаг по объёму трафика: ширина строки, а не число запросов.
    /// </summary>
    public IReadOnlyDictionary<string, IReadOnlySet<string>>? SelectColumnsOnly { get; init; }

    /// <summary>Общая таблица справочников (см. GenerateSprTableOverridesAsync). По умолчанию "ct312".</summary>
    public string SharedSprTable { get; init; } = "ct312";

    /// <summary>
    /// Id таблиц, которые НЕ являются справочниками (не "::спр::"), но
    /// физически следуют тому же паттерну "общая таблица + c_class_id"
    /// (см. GenerateSprTableOverridesAsync). Пример: "фц::осн::Зап_семейных_связей"
    /// (ct852) - строки с c_class_id=852 встречаются в ct312, хотя это "::осн::",
    /// а не справочник. Подтверждайте такие случаи на реальных данных
    /// (SELECT c_obj_id, c_class_id FROM ct312 WHERE c_class_id = N), прежде
    /// чем добавлять id сюда.
    /// </summary>
    public IReadOnlyList<string> ExtraSharedTableIds { get; init; } = Array.Empty<string>();

    /// <summary>
    /// Переопределения для колонок-коллекций, физически реализованных через
    /// отдельную линк-таблицу <c>at{class_id}_{field_id}</c> (см.
    /// <see cref="ColumnMeta.LinkTable"/> и README "Коллекции через
    /// линк-таблицы"). Ключ - (таблица ctNNN, логическое имя колонки),
    /// значение - имя линк-таблицы. В отличие от ExtraSharedTableIds, это
    /// НЕ диагностируется автоматически из БД - подтверждается только на
    /// реальных данных (см. generate_models.py LINKED_COLLECTIONS - тот же
    /// список нужно продублировать здесь для runtime-резолва).
    ///
    /// Пример:
    /// <code>
    /// LinkTableOverrides = new Dictionary&lt;(string, string), string&gt;
    /// {
    ///     [("ct852", "договор_банка")] = "at852_7460",
    ///     [("ct852", "опекун")] = "at852_7463",
    /// }
    /// </code>
    /// </summary>
    public IReadOnlyDictionary<(string TableId, string ColumnName), string> LinkTableOverrides { get; init; } =
        new Dictionary<(string, string), string>();
}

/// <summary>
/// Единая точка входа в ORM. Прячет весь пайплайн подготовки схемы
/// (table/column overrides, exclusions - генерируются из БД при первом запуске
/// и кэшируются в json-файлах) и фабрику репозиториев. Минимальное использование:
///
/// <code>
/// var ctx = await PgContext.CreateAsync("Host=...;Database=...");
///
/// // типизированные модели (Models/Generated, generate_models.py):
/// var deposits = await ctx.GetAllAsync&lt;ДогБанкВклада&gt;();          // со связями 1-к-1 (maxDepth=1)
/// var one      = await ctx.GetByIdAsync&lt;ДогБанкВклада&gt;(123);      // + коллекции 1-ко-многим (Пополнения)
///
/// // динамический доступ к любой из 723 таблиц без модели:
/// var rows = await ctx.Repository("ct320").GetAllAsync();          // PgEntity
/// </code>
///
/// Потокобезопасен после создания; репозитории кэшируются по (tableId, maxDepth).
/// </summary>
public sealed class PgContext {
    public NpgsqlDataSource DataSource { get; }
    public SchemaCatalog Schema { get; }
    public PgContextOptions Options { get; }

    private readonly ConcurrentDictionary<(string TableId, int Depth), EntityRepository> _repos = new();
    private static readonly ConcurrentDictionary<Type, string> TableIdByType = new();

    private PgContext(NpgsqlDataSource dataSource, SchemaCatalog schema, PgContextOptions options) {
        DataSource = dataSource;
        Schema = schema;
        Options = options;
    }

    /// <summary>Краткая форма <see cref="CreateAsync(PgContextOptions)"/> с настройками по умолчанию.</summary>
    public static Task<PgContext> CreateAsync(string connectionString, string schemaPath = "schema.json") =>
        CreateAsync(new PgContextOptions { ConnectionString = connectionString, SchemaPath = schemaPath });

    /// <summary>
    /// Создаёт контекст: загружает schema.json и приводит его в соответствие с
    /// реальной БД (справочники в ct312, join/мультиязычные колонки, exclude
    /// отсутствующих колонок). Файлы оверрайдов генерируются из БД при первом
    /// запуске и переиспользуются дальше (см. <see cref="PgContextOptions.RegenerateOverrides"/>).
    /// </summary>
    public static async Task<PgContext> CreateAsync(PgContextOptions options) {
        var dataSource = NpgsqlDataSource.Create(options.ConnectionString);
        var schema = SchemaCatalog.Load(options.SchemaPath);

        Directory.CreateDirectory(options.OverridesDir);
        var tableOverridesPath = Path.Combine(options.OverridesDir, "table_overrides.json");
        var columnOverridesPath = Path.Combine(options.OverridesDir, "column_overrides.json");
        var exclusionsPath = Path.Combine(options.OverridesDir, "excluded_columns.json");

        // Порядок важен: таблицы -> колонки -> exclude (каждый следующий шаг
        // опирается на результат предыдущего).
        if (options.RegenerateOverrides || !File.Exists(tableOverridesPath))
            await SchemaDiagnostics.GenerateSprTableOverridesAsync(
                dataSource, schema, tableOverridesPath, options.SharedSprTable,
                extraTableIds: options.ExtraSharedTableIds);
        schema.ApplyTableOverrides(tableOverridesPath);

        if (options.RegenerateOverrides || !File.Exists(columnOverridesPath))
            await SchemaDiagnostics.GenerateColumnOverridesAsync(dataSource, schema, columnOverridesPath);
        schema.ApplyColumnOverrides(columnOverridesPath);

        // Линк-таблицы коллекций (at{class}_{field}) - не диагностируются из
        // БД, только вручную подтверждённые связи (см. PgContextOptions.LinkTableOverrides).
        schema.ApplyLinkTableOverrides(options.LinkTableOverrides);

        if (options.RegenerateOverrides || !File.Exists(exclusionsPath))
            await SchemaDiagnostics.GenerateExcludeFileAsync(dataSource, schema, options.PrimaryKeyColumn, exclusionsPath);
        schema.ApplyExclusions(exclusionsPath);

        return new PgContext(dataSource, schema, options);
    }

    // ------------------------------------------------------------------
    // Репозитории
    // ------------------------------------------------------------------

    /// <summary>
    /// Репозиторий для произвольной таблицы (динамические PgEntity).
    /// Кэшируется по (tableId, maxDepth).
    /// </summary>
    public EntityRepository Repository(string tableId, int? maxDepth = null) {
        var depth = maxDepth ?? Options.DefaultMaxDepth;
        return _repos.GetOrAdd((tableId, depth),
            key => new EntityRepository(DataSource, Schema, key.TableId, key.Depth, Options.PrimaryKeyColumn) {
                VersionColumn = Options.VersionColumn,
                VersionValue = Options.VersionValue,
                ResolveRefColumns = Options.ResolveRefColumns,
                SkipCollections = Options.SkipCollections,
                SelectColumnsOnly = Options.SelectColumnsOnly,
            });
    }

    /// <summary>Репозиторий для таблицы, соответствующей сгенерированной модели T ([PgTable]).</summary>
    public EntityRepository Repository<T>(int? maxDepth = null) where T : class =>
        Repository(ResolveTableId<T>(), maxDepth);

    // ------------------------------------------------------------------
    // Простейший типизированный доступ: ctx.GetAllAsync<ДогБанкВклада>()
    // ------------------------------------------------------------------

    /// <summary>Количество строк таблицы модели T (SELECT count(*)).</summary>
    public Task<long> CountAsync<T>(int? maxDepth = null) where T : class =>
        Repository<T>(maxDepth).CountAsync();

    /// <summary>
    /// Все строки таблицы модели T - со связями 1-к-1 (maxDepth) и коллекциями
    /// 1-ко-многим (OneToManyRelations модели), одним batch-запросом на связь.
    /// </summary>
    public Task<List<T>> GetAllAsync<T>(int? maxDepth = null) where T : class, new() =>
        Repository<T>(maxDepth).GetAllAsync<T>();

    /// <summary>Одна строка по id - со связями 1-к-1 и коллекциями 1-ко-многим.</summary>
    public Task<T?> GetByIdAsync<T>(long id, int? maxDepth = null) where T : class, new() =>
        Repository<T>(maxDepth).GetByIdAsync<T>(id);

    /// <summary>Несколько строк по списку id - со связями 1-к-1 и коллекциями 1-ко-многим.</summary>
    public async Task<List<T>> GetByIdsAsync<T>(IEnumerable<long> ids, int? maxDepth = null) where T : class, new() {
        var repo = Repository<T>(maxDepth);
        var rows = await repo.GetByIdsAsync(ids);
        var models = ModelMapper.MapAll<T>(rows);
        await repo.AttachOneToManyAsync(models, rows);
        return models;
    }

    /// <summary>Одна страница со связями: "result range" с произвольной сортировкой - см. <see cref="EntityRepository.GetRangeAsync"/>.</summary>
    public Task<List<T>> GetRangeAsync<T>(int skip, int take, string? orderByLogicalColumn = null,
        bool descending = false, int? maxDepth = null) where T : class, new() =>
        Repository<T>(maxDepth).GetRangeAsync<T>(skip, take, orderByLogicalColumn, descending);

    /// <summary>
    /// Дочерние строки 1-ко-многим для одного родителя, без загрузки самого
    /// родителя: например все Пополнения (ct456) одного договора. fkColumnLogicalName -
    /// логическое имя ref-колонки ДОЧЕРНЕЙ таблицы, указывающей на родителя
    /// ("дог_банк_вкладчик").
    /// </summary>
    public async Task<List<TChild>> GetChildrenAsync<TChild>(long parentId, string fkColumnLogicalName,
        int childMaxDepth = 0) where TChild : class, new() {
        var childTableId = ResolveTableId<TChild>();
        var repo = Repository(childTableId, childMaxDepth);
        var byParent = await repo.LoadChildrenAsync(new[] { parentId }, childTableId, fkColumnLogicalName, childMaxDepth);
        return byParent.TryGetValue(parentId, out var children)
            ? children.Select(ModelMapper.Map<TChild>).Where(m => m is not null).Select(m => m!).ToList()
            : new List<TChild>();
    }

    /// <summary>
    /// Постранично проходит ВСЮ таблицу (keyset-пагинация по Id, см.
    /// <see cref="EntityRepository.GetPageAsync"/>) - для ETL/конвертации
    /// больших таблиц (сотни тысяч строк) без загрузки всего в память сразу:
    /// <code>
    /// await foreach (var page in ctx.EnumeratePagesAsync&lt;ДогБанкВклада&gt;(pageSize: 2000))
    ///     foreach (var d in page)
    ///         /* INSERT/UPSERT в свою БД */;
    /// </code>
    /// Каждая страница - отдельные batch-запросы для связей 1-к-1/1-ко-многим
    /// (как <see cref="GetAllAsync{T}"/>), но память освобождается между
    /// страницами.
    /// </summary>
    public async IAsyncEnumerable<List<T>> EnumeratePagesAsync<T>(
        int pageSize = 2000, int? maxDepth = null, long afterId = 0)
        where T : class, IPgEntityModel, new() {
        var repo = Repository<T>(maxDepth);
        while (true) {
            var page = await repo.GetPageAsync<T>(afterId, pageSize);
            if (page.Count == 0)
                yield break;

            yield return page;

            afterId = page[^1].Id;
        }
    }

    private static string ResolveTableId<T>() =>
        TableIdByType.GetOrAdd(typeof(T), t =>
            t.GetCustomAttribute<PgTableAttribute>()?.TableId
            ?? throw new InvalidOperationException(
                $"У типа {t.Name} нет атрибута [PgTable(\"ctNNN\")]. " +
                "Используйте сгенерированную модель (generate_models.py) или Repository(tableId)."));
}