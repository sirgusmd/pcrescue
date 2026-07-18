# Lists installed program names from the standard uninstall registry keys
# (64-bit, 32-bit, and per-user). Read-only; names only — nothing else leaves
# the machine.

$ErrorActionPreference = "SilentlyContinue"

$paths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

$names = foreach ($path in $paths) {
    Get-ItemProperty $path |
        Where-Object { $_.DisplayName -and -not $_.SystemComponent } |
        Select-Object -ExpandProperty DisplayName
}

$unique = $names | Sort-Object -Unique

ConvertTo-Json @($unique) -Compress
