using System.Diagnostics;
using System.Dynamic;

namespace PgOrm;

/// <summary>
/// Строка таблицы, загруженная ORM-ом. Значения хранятся под логическими именами
/// колонок (как в metaданных, например "договор_номер", "контрагент_банк").
///
/// Доступ к значениям:
///   entity["договор_номер"]                  - через индексатор (всегда работает)
///   ((dynamic)entity).договор_номер          - через dynamic, если имя — валидный
///                                               идентификатор C# (без пробелов)
///
/// Значение колонки-связи (Type == "ref") — это либо:
///   - вложенный <see cref="PgEntity"/>, если связанная строка была подгружена
///     (глубина связей не исчерпана), либо
///   - <see cref="PgEntityRef"/> — "заглушка" с таблицей и id, если строка не
///     подгружалась (глубина = 0) или связанная строка не найдена, либо
///   - null, если внешний ключ в базе пуст (NULL).
///
/// В дебаггере Visual Studio PgEntity по умолчанию показывается как
/// "{ct457#35464950}", а сами поля (наименование_1, наименование_2, ...)
/// лежат под отдельным узлом "Dynamic View" - его нужно развернуть отдельно.
/// Чтобы поля были видны сразу при разворачивании объекта, добавлен
/// DebuggerTypeProxy - в дереве объекта появляется узел "Fields" со всеми
/// логическими именами и значениями.
/// </summary>
[DebuggerDisplay("{Table}#{Id}")]
[DebuggerTypeProxy(typeof(PgEntityDebugView))]
public sealed class PgEntity : DynamicObject
{
    private readonly Dictionary<string, object?> _values = new();

    /// <summary>Физическое имя таблицы (ctNNN), из которой загружена строка.</summary>
    public string Table { get; }

    /// <summary>Первичный ключ строки.</summary>
    public long Id { get; internal set; }

    /// <summary>
    /// Используется во время загрузки: сырые значения внешних ключей (cmXXXX -> id),
    /// пока связанные строки ещё не подгружены. После резолва связей очищается -
    /// конечному пользователю не нужен.
    /// </summary>
    internal Dictionary<string, long?> RawRefs { get; } = new();

    public PgEntity(string table) => Table = table;

    public object? this[string key]
    {
        get => _values.TryGetValue(key, out var v) ? v : null;
        set => _values[key] = value;
    }

    public bool ContainsKey(string key) => _values.ContainsKey(key);

    /// <summary>Все логические имена колонок, заполненные у этой строки.</summary>
    public IReadOnlyDictionary<string, object?> Values => _values;

    public override bool TryGetMember(GetMemberBinder binder, out object? result) =>
        _values.TryGetValue(binder.Name, out result);

    public override bool TrySetMember(SetMemberBinder binder, object? value)
    {
        _values[binder.Name] = value;
        return true;
    }

    public override IEnumerable<string> GetDynamicMemberNames() => _values.Keys;

    public override string ToString() => $"{Table}#{Id}";
}

/// <summary>
/// Debugger proxy для <see cref="PgEntity"/>: показывает все логические поля
/// (включая "наименование_1"/"наименование_2" и т.п.) как плоский список
/// "Fields" сразу при разворачивании объекта, без отдельного узла "Dynamic View".
/// </summary>
internal sealed class PgEntityDebugView
{
    private readonly PgEntity _entity;

    public PgEntityDebugView(PgEntity entity) => _entity = entity;

    public string Table => _entity.Table;
    public long Id => _entity.Id;

    [DebuggerBrowsable(DebuggerBrowsableState.RootHidden)]
    public KeyValuePair<string, object?>[] Fields => _entity.Values.ToArray();
}

/// <summary>
/// "Заглушка" для связи, которая не была подгружена (глубина исчерпана) или
/// для которой не нашлась строка в связанной таблице. Содержит только физическое
/// имя таблицы и id — этого достаточно, чтобы при необходимости подгрузить строку
/// отдельным запросом через <c>new EntityRepository(...,  refTable).GetByIdAsync(id)</c>.
/// </summary>
[DebuggerDisplay("{Table}#{Id} (не подгружено)")]
public sealed class PgEntityRef
{
    public string Table { get; }
    public long Id { get; }

    public PgEntityRef(string table, long id)
    {
        Table = table;
        Id = id;
    }

    public override string ToString() => $"{Table}#{Id} (не подгружено)";
}
