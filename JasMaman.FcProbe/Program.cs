using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Npgsql;
using PgOrm;
using PgOrm.Models;
using JasMaman.Modules.Migration;

// Утилита для разведки базы fin_center (исходные данные УМОСК).
// Строка подключения берётся из user-secrets (общий UserSecretsId с веб-проектом)
// или из переменной окружения dbFcConnectionString.
//
//   dotnet run --project JasMaman.FcProbe -- ping
//   dotnet run --project JasMaman.FcProbe -- umosk            таблицы УМОСК из schema.json + число строк
//   dotnet run --project JasMaman.FcProbe -- columns ct520    физические колонки таблицы
//   dotnet run --project JasMaman.FcProbe -- dump ct464 [N]   первые N строк через PgContext (логические имена колонок)
//   dotnet run --project JasMaman.FcProbe -- check            проверка типизированных моделей (Models/*.cs) на живых данных
//   dotnet run --project JasMaman.FcProbe -- refs-check       полнота маппинга legacy-справочников (Modules/Migration/LegacyReferenceMap)
//   dotnet run --project JasMaman.FcProbe -- sql "SELECT ..."  произвольный запрос в READ ONLY транзакции (агрегаты, без ПДн)
//
// Файлы оверрайдов схемы (table/column_overrides, excluded_columns) генерируются из БД
// при первом запуске в JasMaman.FcMigrator/Overrides и дальше переиспользуются.

var config = new ConfigurationBuilder()
    .AddUserSecrets<Program>(optional: true)
    .AddEnvironmentVariables()
    .Build();

var connectionString = config["dbFcConnectionString"];
if (string.IsNullOrWhiteSpace(connectionString)) {
    Console.Error.WriteLine("Не задан dbFcConnectionString (user-secrets или переменная окружения).");
    return 1;
}

var command = args.FirstOrDefault() ?? "ping";
await using var dataSource = NpgsqlDataSource.Create(connectionString);

switch (command) {
    case "ping": {
        await using var cmd = dataSource.CreateCommand(
            "SELECT current_database(), version(), (SELECT count(*) FROM information_schema.tables WHERE table_name ~ '^ct[0-9]+$')");
        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        Console.WriteLine($"База: {reader.GetString(0)}");
        Console.WriteLine($"Сервер: {reader.GetString(1)}");
        Console.WriteLine($"Таблиц ctNNN: {reader.GetInt64(2)}");
        break;
    }
    case "umosk": {
        var schema = SchemaCatalog.Load(Path.Combine(AppContext.BaseDirectory, "Schema", "schema.json"));
        var pattern = new Regex(args.ElementAtOrDefault(1) ?? "МС|УМС|отработ|распредел|Иск|обучени|ВУЗ|оплат|Грантник", RegexOptions.IgnoreCase);
        var physical = await loadPhysicalTables(dataSource);
        foreach (var table in schema.Tables.Values.Where(t => pattern.IsMatch(t.Name)).OrderBy(t => t.Name)) {
            var count = physical.Contains(table.Id) ? (await countRows(dataSource, table.Id)).ToString() : "нет физ. таблицы";
            Console.WriteLine($"{table.Id,-7} {table.Name,-60} {count}");
        }
        break;
    }
    case "columns": {
        var table = args.ElementAtOrDefault(1) ?? throw new ArgumentException("Укажите таблицу, например ct520");
        await using var cmd = dataSource.CreateCommand(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = @t ORDER BY ordinal_position");
        cmd.Parameters.AddWithValue("t", table);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync()) {
            Console.WriteLine($"{reader.GetString(0),-20} {reader.GetString(1)}");
        }
        break;
    }
    case "dump": {
        var table = args.ElementAtOrDefault(1) ?? throw new ArgumentException("Укажите таблицу, например ct464");
        var limit = int.TryParse(args.ElementAtOrDefault(2), out var n) ? n : 50;
        var ctx = await createContext(connectionString, config);
        var rows = await ctx.Repository(table, maxDepth: 0).GetRangeAsync(0, limit);
        foreach (var row in rows) {
            var fields = row.Values
                .Where(kv => kv.Value is not null && kv.Key is not ("creating" or "deleting" or "user" or "дата_модификации" or "лог_модифицирован" or "лог_удален"))
                .Select(kv => $"{kv.Key}={kv.Value}");
            Console.WriteLine($"#{row.Id}: {string.Join(" | ", fields)}");
        }
        break;
    }
    case "check": {
        var ctx = await createContext(connectionString, config, new Dictionary<string, IReadOnlySet<string>> {
            ["ct520"] = new HashSet<string> { "персона", "вуз", "разделение мест распределения_МС", "статус_УМС" },
            ["ct320"] = new HashSet<string> { "ад_зап_перс_данных", "статус_заемщика_ткс", "ад_зап_предварительного_статуса" },
            ["ct663"] = new HashSet<string> { "статус" },
        });

        Console.WriteLine("--- Статус_заемщика_ткс (ct360)");
        foreach (var s in await ctx.GetAllAsync<СтатусЗаемщикаТкс>(maxDepth: 0)) {
            Console.WriteLine($"{s.Код,-3} {s.Наименование} / {s.Наименование_kz}");
        }

        Console.WriteLine("--- Зап_отработки_МС (ct520), последние 5 записей");
        var total = await ctx.CountAsync<ЗапОтработкиМС>(maxDepth: 0);
        foreach (var w in await ctx.GetRangeAsync<ЗапОтработкиМС>((int)Math.Max(0, total - 5), 5, maxDepth: 3)) {
            var person = w.Персона;
            var pd = person?.Ад_зап_перс_данных;
            Console.WriteLine($"#{w.Id} | ФИО={mask(pd?.Фамилия)} {mask(pd?.Имя)} ИИН={mask(pd?.Иин)} | ТКС={person?.Статус_заемщика_ткс?.Наименование} " +
                $"| мониторинг={person?.Ад_зап_предварительного_статуса?.Статус?.Наименование} | категория={w.Статус_УМС?.Наименование} " +
                $"| вуз={w.Вуз?.Наименование} | место={w.Разделение_мест_распределения_МС?.Наименование} " +
                $"| {w.Место_работы} ({w.Место_БИН}) | {w.Дата_начало:d}–{w.Дата_окончание:d}");
        }
        break;
    }
    case "refs-check": {
        var ctx = await createContext(connectionString, config);
        var results = await LegacyReferenceCheck.RunAsync(ctx);
        foreach (var r in results) {
            Console.WriteLine($"{(r.IsComplete ? "OK  " : "FAIL")} {r.Table.TableId} {r.Table.Title}: в legacy {r.LegacyRows}, сопоставлено {r.Table.MappedIds.Count}");
            foreach (var (id, name) in r.Unmapped) {
                Console.WriteLine($"       нет соответствия: #{id} {name}");
            }
            foreach (var id in r.MissingInLegacy) {
                Console.WriteLine($"       нет в legacy: #{id}");
            }
        }
        return results.All(r => r.IsComplete) ? 0 : 2;
    }
    case "sql": {
        var sql = args.ElementAtOrDefault(1) ?? throw new ArgumentException("Укажите запрос");
        await using var connection = await dataSource.OpenConnectionAsync();
        await using var tx = await connection.BeginTransactionAsync();
        await using (var readOnly = new NpgsqlCommand("SET TRANSACTION READ ONLY", connection, tx)) {
            await readOnly.ExecuteNonQueryAsync();
        }
        await using var cmd = new NpgsqlCommand(sql, connection, tx);
        await using var reader = await cmd.ExecuteReaderAsync();
        Console.WriteLine(string.Join(" | ", Enumerable.Range(0, reader.FieldCount).Select(reader.GetName)));
        while (await reader.ReadAsync()) {
            Console.WriteLine(string.Join(" | ", Enumerable.Range(0, reader.FieldCount).Select(i => reader.IsDBNull(i) ? "∅" : reader.GetValue(i).ToString())));
        }
        break;
    }
    default:
        Console.Error.WriteLine($"Неизвестная команда: {command}");
        return 1;
}
return 0;

// Персональные данные в выводе маскируются: видно только, что поле заполнено.
static string mask(string? value) =>
    string.IsNullOrWhiteSpace(value) ? "∅" : $"{value.Trim()[0]}***({value.Trim().Length})";

static Task<PgContext> createContext(string connectionString, IConfiguration config,
    IReadOnlyDictionary<string, IReadOnlySet<string>>? resolveRefColumns = null) =>
    PgContext.CreateAsync(new PgContextOptions {
        ConnectionString = connectionString,
        SchemaPath = Path.Combine(AppContext.BaseDirectory, "Schema", "schema.json"),
        OverridesDir = config["fcOverridesDir"] ?? findOverridesDir(),
        VersionColumn = "c_tr_id",
        ResolveRefColumns = resolveRefColumns,
    });

static string findOverridesDir() {
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "JasMaman.sln"))) {
        dir = dir.Parent;
    }
    return dir is null ? "Overrides" : Path.Combine(dir.FullName, "JasMaman.FcMigrator", "Overrides");
}

static async Task<HashSet<string>> loadPhysicalTables(NpgsqlDataSource dataSource) {
    var result = new HashSet<string>();
    await using var cmd = dataSource.CreateCommand("SELECT table_name FROM information_schema.tables WHERE table_name ~ '^ct[0-9]+$'");
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync()) {
        result.Add(reader.GetString(0));
    }
    return result;
}

static async Task<long> countRows(NpgsqlDataSource dataSource, string table) {
    await using var cmd = dataSource.CreateCommand($"SELECT count(*) FROM {table}");
    return (long)(await cmd.ExecuteScalarAsync())!;
}
