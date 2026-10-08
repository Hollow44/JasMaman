using System.Collections.Concurrent;
using System.Reflection;

namespace PgOrm.Models;

/// <summary>
/// Маппит динамический <see cref="PgEntity"/> (результат EntityRepository) в
/// сгенерированные типизированные модели (Models/Generated/*.cs) по атрибутам
/// <see cref="PgColumnAttribute"/>.
///
/// Для каждого свойства с [PgColumn("логическое_имя")]:
///  - ищет значение по точному имени; если не найдено - пробует
///    "логическое_имя_1" (на случай мультиязычной колонки после
///    ApplyColumnOverrides - "_1" обычно русский вариант);
///  - если значение - вложенный <see cref="PgEntity"/> и тип свойства - другая
///    сгенерированная модель, рекурсивно маппит в неё;
///  - если значение - <see cref="PgEntityRef"/> (связь не подгружена, depth=0)
///    и тип свойства - сгенерированная модель, создаёт экземпляр с заполненным
///    только Id (остальные поля null/Raw=null);
///  - если тип свойства - <see cref="PgEntityRef"/> (связь на таблицу вне
///    сгенерированного набора): присваивает PgEntityRef как есть, либо (если
///    связь всё же была подгружена при depth выше ожидаемого) сворачивает
///    подгруженный PgEntity в PgEntityRef{Table, Id};
///  - если тип свойства - "{Имя}Id" (long?, companion-свойство для связей вне
///    набора): извлекает .Id из PgEntity/PgEntityRef - доступно НЕЗАВИСИМО от
///    того, подгружена ли сама связь;
///  - если тип свойства - object? (для "time"/"object"/"unknown" логических
///    типов) - присваивает значение как есть;
///  - иначе - примитивная конвертация в тип свойства (Convert.ChangeType).
///
/// Свойство "Raw" (если есть) получает исходный PgEntity целиком - там доступны
/// "наименование_2" и любые колонки, отсутствующие в типизированной модели.
/// Свойство "Id" получает PgEntity.Id.
///
/// ПРОИЗВОДИТЕЛЬНОСТЬ (важно на больших объёмах, см. README "Производительность"):
///  - метаданные свойств (PropertyInfo + [PgColumn] + классификация) считаются
///    через reflection ОДИН РАЗ на тип и кэшируются в <see cref="_plans"/> -
///    не на каждый вызов Map;
///  - в рамках одного Map/MapAll связанные строки, на которые ссылаются МНОГИЕ
///    родительские строки (банки, справочники и т.п.), маппятся ОДИН РАЗ и
///    результат переиспользуется (memo по (PgEntity, Type)) - без этого один
///    и тот же "Банк" пересоздавался бы заново для каждого из 200k вкладов.
/// </summary>
public static class ModelMapper {
    /// <summary>Маппит одну строку. Возвращает null, если <paramref name="entity"/> == null.</summary>
    public static T? Map<T>(PgEntity? entity) where T : class, new() {
        if (entity is null)
            return null;
        var cache = new Dictionary<(PgEntity, Type), object>();
        return (T)MapCached(typeof(T), entity, cache);
    }

    /// <summary>
    /// Маппит список строк (например результат GetAllAsync()). Один общий кэш
    /// memo на весь список - связанные строки, общие для многих родителей
    /// (банки, справочники), маппятся один раз.
    /// </summary>
    public static List<T> MapAll<T>(IEnumerable<PgEntity> entities) where T : class, new() {
        var cache = new Dictionary<(PgEntity, Type), object>();
        var result = new List<T>();
        foreach (var e in entities)
            result.Add((T)MapCached(typeof(T), e, cache));
        return result;
    }

    private static object MapCached(Type type, PgEntity entity, Dictionary<(PgEntity, Type), object> cache) {
        var key = (entity, type);
        if (cache.TryGetValue(key, out var existing))
            return existing;

        var model = Activator.CreateInstance(type)!;
        cache[key] = model; // до заполнения полей - на случай самоссылок (ct455 -> ct455)

        foreach (var plan in GetPlan(type))
            plan.Apply(model, entity, cache);

        return model;
    }

    // ------------------------------------------------------------------
    // Кэш плана маппинга по типу (reflection выполняется один раз на тип)
    // ------------------------------------------------------------------

    private static readonly ConcurrentDictionary<Type, PropertyPlan[]> _plans = new();
    private static readonly ConcurrentDictionary<Type, bool> _isGeneratedModel = new();

    private static PropertyPlan[] GetPlan(Type type) =>
        _plans.GetOrAdd(type, BuildPlan);

    private static PropertyPlan[] BuildPlan(Type type) {
        var plans = new List<PropertyPlan>();

        foreach (var prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance)) {
            if (prop.Name == "Id" && prop.PropertyType == typeof(long)) {
                plans.Add(PropertyPlan.ForId(prop));
                continue;
            }

            if (prop.Name == "Raw" && prop.PropertyType == typeof(PgEntity)) {
                plans.Add(PropertyPlan.ForRaw(prop));
                continue;
            }

            var attr = prop.GetCustomAttribute<PgColumnAttribute>();
            if (attr is null)
                continue;

            plans.Add(PropertyPlan.ForColumn(prop, attr.Name));
        }

        return plans.ToArray();
    }

    /// <summary>true, если тип - один из сгенерированных POCO (имеет Id/Raw и пустой конструктор).</summary>
    private static bool IsGeneratedModel(Type type) => _isGeneratedModel.GetOrAdd(type, t =>
        t.Namespace == typeof(PgColumnAttribute).Namespace
        && t.GetProperty("Id") is not null
        && t.GetProperty("Raw") is not null
        && t.GetConstructor(Type.EmptyTypes) is not null);

    /// <summary>
    /// Предвычисленный план заполнения одного свойства - reflection (GetCustomAttribute,
    /// проверка типа, Nullable.GetUnderlyingType и т.п.) выполняется один раз при
    /// построении плана, а не на каждую строку.
    /// </summary>
    private sealed class PropertyPlan {
        private enum Kind { Id, Raw, NestedModel, EntityRefStub, IdCompanion, RawObject, Primitive, LinkedList }

        private readonly PropertyInfo _prop;
        private readonly Kind _kind;
        private readonly string? _columnName;
        private readonly Type _targetType; // для NestedModel - тип модели; для Primitive - Nullable.GetUnderlyingType ?? propType

        private PropertyPlan(PropertyInfo prop, Kind kind, string? columnName, Type targetType) {
            _prop = prop;
            _kind = kind;
            _columnName = columnName;
            _targetType = targetType;
        }

        public static PropertyPlan ForId(PropertyInfo prop) => new(prop, Kind.Id, null, typeof(long));
        public static PropertyPlan ForRaw(PropertyInfo prop) => new(prop, Kind.Raw, null, typeof(PgEntity));

        public static PropertyPlan ForColumn(PropertyInfo prop, string columnName) {
            var propType = prop.PropertyType;

            if (propType == typeof(object))
                return new PropertyPlan(prop, Kind.RawObject, columnName, propType);

            // List<TModel> для коллекций через линк-таблицу (см. ColumnMeta.LinkTable) -
            // отличается от обычных OneToManyRelation коллекций (которые НЕ имеют
            // [PgColumn], их заполняет EntityRepository.AttachOneToManyAsync).
            if (propType.IsGenericType && propType.GetGenericTypeDefinition() == typeof(List<>)
                && IsGeneratedModel(propType.GetGenericArguments()[0])) {
                return new PropertyPlan(prop, Kind.LinkedList, columnName, propType.GetGenericArguments()[0]);
            }

            if (IsGeneratedModel(propType))
                return new PropertyPlan(prop, Kind.NestedModel, columnName, propType);

            if (propType == typeof(PgEntityRef))
                return new PropertyPlan(prop, Kind.EntityRefStub, columnName, propType);

            if (Nullable.GetUnderlyingType(propType) == typeof(long))
                return new PropertyPlan(prop, Kind.IdCompanion, columnName, propType);

            return new PropertyPlan(prop, Kind.Primitive, columnName, Nullable.GetUnderlyingType(propType) ?? propType);
        }

        public void Apply(object model, PgEntity entity, Dictionary<(PgEntity, Type), object> cache) {
            switch (_kind) {
                case Kind.Id:
                    _prop.SetValue(model, entity.Id);
                    return;

                case Kind.Raw:
                    _prop.SetValue(model, entity);
                    return;
            }

            var value = ResolveValue(entity, _columnName!);

            switch (_kind) {
                case Kind.RawObject:
                    _prop.SetValue(model, value);
                    return;

                case Kind.NestedModel:
                    switch (value) {
                        case PgEntity nested:
                            _prop.SetValue(model, MapCached(_targetType, nested, cache));
                            return;
                        case PgEntityRef pref:
                            // связь не подгружена (depth=0) - модель только с заполненным Id
                            var stub = Activator.CreateInstance(_targetType)!;
                            _targetType.GetProperty("Id")!.SetValue(stub, pref.Id);
                            _prop.SetValue(model, stub);
                            return;
                    }
                    return;

                case Kind.EntityRefStub:
                    switch (value) {
                        case PgEntityRef pref:
                            _prop.SetValue(model, pref);
                            return;
                        // связь вне набора, но почему-то подгрузилась (depth > 1) - сворачиваем
                        case PgEntity nested:
                            _prop.SetValue(model, new PgEntityRef(nested.Table, nested.Id));
                            return;
                    }
                    return;

                case Kind.IdCompanion:
                    switch (value) {
                        case PgEntity nested:
                            _prop.SetValue(model, nested.Id);
                            return;
                        case PgEntityRef pref:
                            _prop.SetValue(model, pref.Id);
                            return;
                    }
                    return;

                case Kind.LinkedList:
                    // entity[col.Name] - List<object>, элементы PgEntity (depth>0)
                    // или PgEntityRef (depth=0), заполненные ResolveLinkedCollectionsAsync
                    var listType = typeof(List<>).MakeGenericType(_targetType);
                    var list = (System.Collections.IList)Activator.CreateInstance(listType)!;

                    if (value is System.Collections.IEnumerable items) {
                        foreach (var item in items) {
                            switch (item) {
                                case PgEntity nestedItem:
                                    list.Add(MapCached(_targetType, nestedItem, cache));
                                    break;
                                case PgEntityRef prefItem:
                                    var itemStub = Activator.CreateInstance(_targetType)!;
                                    _targetType.GetProperty("Id")!.SetValue(itemStub, prefItem.Id);
                                    list.Add(itemStub);
                                    break;
                            }
                        }
                    }

                    _prop.SetValue(model, list);
                    return;

                case Kind.Primitive:
                    if (value is null)
                        return;
                    var coerced = CoerceTo(_targetType, value);
                    if (coerced is CoercionError err)
                        throw new InvalidOperationException(
                            $"ModelMapper: не удалось привести значение поля '{_columnName}' " +
                            $"к типу {_targetType.Name} свойства " +
                            $"{_prop.DeclaringType?.Name}.{_prop.Name}. " +
                            $"Postgres вернул {value.GetType().FullName} = '{value}'. {err.Hint}");
                    _prop.SetValue(model, coerced);
                    return;
            }
        }

        private static object? ResolveValue(PgEntity entity, string logicalName) {
            if (entity.ContainsKey(logicalName))
                return entity[logicalName];

            // мультиязычная колонка после ApplyColumnOverrides: "наименование" -> "наименование_1"
            var primaryVariant = $"{logicalName}_1";
            return entity.ContainsKey(primaryVariant) ? entity[primaryVariant] : null;
        }
    }

    /// <summary>
    /// Приводит <paramref name="raw"/> (CLR-тип от Npgsql) к <paramref name="target"/>
    /// без <c>Convert.ChangeType</c> (тот требует IConvertible, которого нет у
    /// DateTime, TimeSpan и т.п.). Поддерживает все типы, реально возвращаемые
    /// Npgsql: bool, short, int, long, float, double, decimal, string, DateTime,
    /// DateOnly, TimeOnly, TimeSpan, Guid, плюс числовые строки.
    ///
    /// Возвращает <see cref="CoercionError"/> (sentinel), если приведение
    /// невозможно — вызывающий код бросает исключение с деталями.
    /// </summary>
    private static object? CoerceTo(Type target, object raw) {
        // уже нужный тип (или наследник) - без конверсии
        if (target.IsInstanceOfType(raw))
            return raw;

        // Nullable<T> -> рекурсивно к T (null уже обработан выше в Apply)
        var under = Nullable.GetUnderlyingType(target);
        if (under is not null)
            return CoerceTo(under, raw);

        // Числа: Npgsql может вернуть int для integer, long для bigint, short
        // для smallint, double/float для real/double precision, decimal для numeric.
        // Convert.ToXxx понимает все числовые типы и числовые строки.
        try {
            if (target == typeof(long))
                return Convert.ToInt64(raw);
            if (target == typeof(int))
                return Convert.ToInt32(raw);
            if (target == typeof(short))
                return Convert.ToInt16(raw);
            if (target == typeof(decimal))
                return Convert.ToDecimal(raw);
            if (target == typeof(double))
                return Convert.ToDouble(raw);
            if (target == typeof(float))
                return Convert.ToSingle(raw);
            if (target == typeof(bool))
                return Convert.ToBoolean(raw);
            if (target == typeof(string))
                return raw.ToString();

            // Дата/время: Npgsql может вернуть DateTime, NpgsqlDateTime,
            // DateOnly, TimeOnly, TimeSpan в зависимости от типа колонки.
            if (target == typeof(DateTime)) {
                return raw switch {
                    DateTime dt => dt,
                    DateTimeOffset dto => dto.DateTime,
                    // DateOnly / TimeOnly не существуют в старых рантаймах, проверяем по имени
                    _ when raw.GetType().Name == "DateOnly" =>
                        DateTime.Parse(raw.ToString()!),
                    _ when raw.GetType().Name == "TimeOnly" =>
                        DateTime.Today.Add(TimeSpan.Parse(raw.ToString()!)),
                    TimeSpan ts => DateTime.Today.Add(ts),
                    string s => DateTime.Parse(s),
                    _ => new CoercionError(
                        $"Ожидался DateTime, получен {raw.GetType().FullName}. " +
                        $"Если колонка — чистое время (TIME), поправьте тип свойства на TimeSpan?.")
                };
            }

            if (target == typeof(TimeSpan)) {
                return raw switch {
                    TimeSpan ts => ts,
                    DateTime dt => dt.TimeOfDay,
                    _ when raw.GetType().Name == "TimeOnly" => TimeSpan.Parse(raw.ToString()!),
                    string s => TimeSpan.Parse(s),
                    _ => new CoercionError(
                        $"Ожидался TimeSpan, получен {raw.GetType().FullName}.")
                };
            }

            if (target == typeof(Guid)) {
                return raw switch {
                    Guid g => g,
                    string s => Guid.Parse(s),
                    _ => new CoercionError($"Ожидался Guid, получен {raw.GetType().FullName}.")
                };
            }

            // Всё остальное — несовместимость схемы и физического типа
            return new CoercionError(
                $"Нет правила конверсии {raw.GetType().FullName} -> {target.FullName}. " +
                $"Поправьте тип свойства в сгенерированной модели или column_overrides.json.");
        } catch (Exception ex) when (ex is InvalidCastException or FormatException or OverflowException) {
            return new CoercionError(
                $"Ошибка конверсии {raw.GetType().FullName} -> {target.FullName}: {ex.Message}.");
        }
    }

    private sealed record CoercionError(string Hint);
}