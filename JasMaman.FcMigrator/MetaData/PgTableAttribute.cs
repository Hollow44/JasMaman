namespace PgOrm.Models;

/// <summary>
/// Помечает сгенерированную модель идентификатором её таблицы (ctNNN) из
/// schema.json. Генерируется generate_models.py. Позволяет <see cref="PgContext"/>
/// определять таблицу по типу модели: <c>ctx.GetAllAsync&lt;ДогБанкВклада&gt;()</c>
/// без явного "ct455".
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class PgTableAttribute : Attribute {
    public string TableId { get; }
    public PgTableAttribute(string tableId) => TableId = tableId;
}