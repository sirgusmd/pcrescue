# Lists safe backup destinations: USB-attached drives only (memory sticks
# and external USB disks). Internal drives are deliberately excluded — a
# backup inside the same computer isn't safe when the goal is wiping that
# computer. Read-only.

$ErrorActionPreference = "SilentlyContinue"

# Drive letters that live on a USB-attached disk (covers external HDDs/SSDs,
# which report DriveType 3 "fixed" despite being external).
$usbLetters = @{}
foreach ($disk in (Get-Disk | Where-Object { $_.BusType -eq "USB" })) {
    foreach ($part in (Get-Partition -DiskNumber $disk.Number)) {
        if ($part.DriveLetter) { $usbLetters[[string]$part.DriveLetter] = $true }
    }
}

$result = @()
foreach ($ld in (Get-CimInstance Win32_LogicalDisk)) {
    if (-not $ld.Size) { continue }
    $letter = $ld.DeviceID.TrimEnd(":")
    $isRemovable = $ld.DriveType -eq 2
    if ($isRemovable -or $usbLetters.ContainsKey($letter)) {
        $result += @{
            letter = $letter
            label  = $(if ($ld.VolumeName) { $ld.VolumeName } else { "Untitled" })
            freeGB = [math]::Round($ld.FreeSpace / 1GB, 1)
            sizeGB = [math]::Round($ld.Size / 1GB, 1)
        }
    }
}

ConvertTo-Json @($result) -Compress
