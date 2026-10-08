using Microsoft.Extensions.Configuration;
using PgOrm;

namespace JasMaman.Modules.Migration {
    /// <summary>
    /// Создание <see cref="PgContext"/> для чтения fin_center (legacy УМОСК).
    /// Строка подключения — dbFcConnectionString (user-secrets / переменные окружения),
    /// schema.json и оверрайды схемы копируются в выходной каталог проектом JasMaman.FcMigrator.
    /// </summary>
    public static class FcContextFactory {
        public const string ConnectionStringKey = "dbFcConnectionString";

        public static Task<PgContext> CreateAsync(
            IConfiguration configuration,
            IReadOnlyDictionary<string, IReadOnlySet<string>>? resolveRefColumns = null,
            int defaultMaxDepth = 1
        ) {
            var connectionString = configuration[ConnectionStringKey];
            if (string.IsNullOrWhiteSpace(connectionString)) {
                throw new InvalidOperationException($"Не задана строка подключения к fin_center ({ConnectionStringKey})");
            }

            return PgContext.CreateAsync(new PgContextOptions {
                ConnectionString = connectionString,
                SchemaPath = Path.Combine(AppContext.BaseDirectory, "Schema", "schema.json"),
                OverridesDir = Path.Combine(AppContext.BaseDirectory, "Overrides"),
                VersionColumn = "c_tr_id",
                DefaultMaxDepth = defaultMaxDepth,
                ResolveRefColumns = resolveRefColumns,
            });
        }
    }
}
