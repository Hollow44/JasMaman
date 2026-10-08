namespace PgOrm.Models;

/// <summary>
/// Помечает свойство сгенерированной модели логическим именем колонки из
/// schema.json (как оно было ДО ApplyColumnOverrides), например "наименование"
/// или "договор_номер". Используется <see cref="ModelMapper"/> для маппинга
/// <see cref="PgEntity"/> -> POCO.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class PgColumnAttribute : Attribute {
    public string Name { get; }
    public PgColumnAttribute(string name) => Name = name;
}
