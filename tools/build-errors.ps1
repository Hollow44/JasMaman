# Сборка решения и краткий список ошибок компиляции (без дублей).
#   powershell -File tools/build-errors.ps1 [проект или решение]
param([string]$Target = 'JasMaman.sln')
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$errors = dotnet build $Target --no-restore 2>&1 |
    Where-Object { "$_".Contains(' error ') } |
    ForEach-Object {
        $line = "$_"
        $cut = $line.IndexOf(' [')
        if ($cut -gt 0) { $line = $line.Substring(0, $cut) }
        $start = $line.IndexOf('JasMaman.')
        if ($start -gt 0) { $line = $line.Substring($start) }
        $line
    } |
    Sort-Object -Unique
Write-Output "errors: $(@($errors).Count)"
$errors | Select-Object -First 60
