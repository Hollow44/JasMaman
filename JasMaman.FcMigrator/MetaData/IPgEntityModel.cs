namespace PgOrm.Models;

/// <summary>Реализуется всеми сгенерированными моделями (generate_models.py) - даёт типобезопасный доступ к Id без reflection.</summary>
public interface IPgEntityModel {
    long Id { get; set; }
}
