namespace PgOrm.Models;

/// <summary>
/// Описывает связь "один-ко-многим" в обратную сторону: дочерняя таблица
/// <see cref="ChildTableId"/> имеет колонку <see cref="FkColumnName"/> (ref),
/// которая ссылается НА текущую таблицу - то есть для одной строки текущей
/// таблицы может быть много строк <see cref="ChildTableId"/>, у которых
/// <see cref="FkColumnName"/> == Id текущей строки.
///
/// Пример: "Дог_банк_вклада" (ct455) 1-ко-многим "Зап_накопления" (ct456) -
/// у ct456 есть колонка "дог_банк_вкладчик" (ref -> ct455).
///
/// Генерируется generate_models.py как статическое поле
/// <c>public static readonly OneToManyRelation[] OneToManyRelations</c> на
/// модели "родителя"; <see cref="EntityRepository.GetAllAsync{T}"/>/
/// <see cref="EntityRepository.GetByIdAsync{T}"/> читают это поле через
/// рефлексию и заполняют свойство <see cref="PropertyName"/>
/// (<c>List&lt;ChildModelType&gt;</c>) через
/// <see cref="EntityRepository.LoadChildrenAsync"/>.
/// </summary>
public sealed record OneToManyRelation(
    string ChildTableId,
    string FkColumnName,
    string PropertyName,
    Type ChildModelType,
    int ChildMaxDepth = 0);