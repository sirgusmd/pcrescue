# Lists USB-attached disks for the flash wizard. Read-only detection ONLY —
# the wizard's write step is not built yet, and when it is, it must re-verify
# this filter immediately before writing (see ROADMAP.md safety rules).
# IsBoot/IsSystem exclusion is belt-and-braces: a disk Windows is running
# from must never be offered, whatever bus it claims.

$ErrorActionPreference = "SilentlyContinue"

$result = @()
foreach ($disk in (Get-Disk | Where-Object {
        $_.BusType -eq "USB" -and -not $_.IsBoot -and -not $_.IsSystem })) {
    $letters = @()
    foreach ($part in (Get-Partition -DiskNumber $disk.Number)) {
        if ($part.DriveLetter) { $letters += [string]$part.DriveLetter }
    }
    $result += @{
        diskNumber   = [int]$disk.Number
        friendlyName = "$($disk.FriendlyName)".Trim()
        sizeGB       = [math]::Round($disk.Size / 1GB, 1)
        letters      = $letters
    }
}

ConvertTo-Json @($result) -Compress
