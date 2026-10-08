namespace PgOrm.Models;

/// <summary>
/// Описывает обратную сторону коллекционного поля, реализованного через
/// линк-таблицу (<see cref="PgOrm.ColumnMeta.LinkTable"/>): для текущей строки
/// нужно найти все строки <see cref="ChildTableId"/>, у которых В ИХ
/// коллекции (через <see cref="LinkTable"/>) встречается Id текущей строки.
///
/// В отличие от <see cref="OneToManyRelation"/> (обратный FK - есть физическая
/// колонка на дочерней строке), здесь дочерняя строка вообще не хранит
/// никакой колонки, указывающей на родителя напрямую - связь проходит через
/// отдельную линк-таблицу <see cref="LinkTable"/> со структурой
/// <c>(c_obj_id, c_tr_id, c_del, {LinkColumn})</c>, где <see cref="LinkColumn"/>
/// (например "cm7460") хранит Id родителя (текущей строки), а c_obj_id -
/// Id строки <see cref="ChildTableId"/>.
///
/// Пример: "Дог_банк_вклада" (ct455) имеет обратную коллекцию "Зап_семейных_связей"
/// (ct852) через линк-таблицу "at852_7460" (cm7460 = id договора, c_obj_id =
/// id строки ct852) - подтверждено реальным SQL-запросом (см. README
/// "Коллекции через линк-таблицы").
///
/// Генерируется generate_models.py как статическое поле
/// <c>public static readonly ReverseLinkedCollectionRelation[] ReverseLinkedCollections</c>
/// на модели "родителя"; <see cref="EntityRepository.GetAllAsync{T}"/>/
/// <see cref="EntityRepository.GetByIdAsync{T}"/> читают это поле через
/// рефлексию и заполняют свойство <see cref="PropertyName"/>
/// (<c>List&lt;ChildModelType&gt;</c>) через
/// <see cref="EntityRepository.ResolveReverseLinkedCollectionsAsync"/>.
/// </summary>
public sealed record ReverseLinkedCollectionRelation(
    string ChildTableId,
    string LinkTable,
    string LinkColumn,
    string PropertyName,
    Type ChildModelType,
    int ChildMaxDepth = 0);