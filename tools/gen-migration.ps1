# Генерация SQL-миграции из DataSchema() модулей (режим Yoda "gen-migrations").
#
# Запускает JasMaman с --gen-migrations true против локальной БД (appsettings.json → dbConnections),
# ждёт появления файла "!V..._code-gen.sql" в db/dbJasMaman/migrations и останавливает приложение.
# Файл с "!" — черновик: проверьте SQL и уберите "!" из имени, чтобы миграция применилась при следующем запуске.
#
#   powershell -File tools/gen-migration.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root 'JasMaman'
$migrations = Join-Path $project 'db\dbJasMaman\migrations'

dotnet build (Join-Path $root 'JasMaman.sln') --no-restore -v q
if ($LASTEXITCODE -ne 0) { throw 'Сборка завершилась с ошибкой' }

$before = @(Get-ChildItem $migrations -Filter '!*' -ErrorAction SilentlyContinue)
$log = Join-Path $env:TEMP 'jas-maman-gen-migration.log'
Remove-Item $log, "$log.err" -ErrorAction SilentlyContinue
$process = Start-Process dotnet -ArgumentList 'run', '--no-build', '--launch-profile', '"Yoda Development"', '--', '--gen-migrations', 'true' `
    -WorkingDirectory $project -PassThru -NoNewWindow -RedirectStandardOutput $log -RedirectStandardError "$log.err"

try {
    $deadline = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
        $draft = @(Get-ChildItem $migrations -Filter '!*' -ErrorAction SilentlyContinue) | Where-Object { $before.Name -notcontains $_.Name }
        if ($draft) {
            Start-Sleep -Seconds 2
            Write-Host "Черновик миграции: $($draft.FullName)"
            exit 0
        }
        if ($process.HasExited) { throw "Приложение завершилось (код $($process.ExitCode)) без миграции, см. $log" }
        if ((Test-Path $log) -and (Select-String -Path $log -Pattern 'Application started' -Quiet)) {
            Start-Sleep -Seconds 3
            if (-not (@(Get-ChildItem $migrations -Filter '!*' -ErrorAction SilentlyContinue) | Where-Object { $before.Name -notcontains $_.Name })) {
                Write-Host 'Изменений схемы не найдено.'
                exit 0
            }
            continue
        }
        Start-Sleep -Seconds 2
    }
    Write-Host 'Изменений схемы не найдено (или генерация не уложилась в 3 минуты).'
} finally {
    Get-Process JasMaman -ErrorAction SilentlyContinue | Stop-Process -Force
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force }
}
