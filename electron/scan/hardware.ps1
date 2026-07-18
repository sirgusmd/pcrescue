# Gathers basic hardware facts as JSON. Read-only; requires no elevation.
# Every section is wrapped so one failing query never breaks the whole scan.

$ErrorActionPreference = "SilentlyContinue"

$result = @{}

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$result.cpuName = if ($cpu) { $cpu.Name.Trim() } else { $null }
$result.cpuCores = if ($cpu) { [int]$cpu.NumberOfCores } else { $null }

$cs = Get-CimInstance Win32_ComputerSystem
$result.ramGB = if ($cs) { [math]::Round($cs.TotalPhysicalMemory / 1GB, 1) } else { $null }
$result.manufacturer = if ($cs) { $cs.Manufacturer } else { $null }
$result.model = if ($cs) { $cs.Model } else { $null }

$os = Get-CimInstance Win32_OperatingSystem
$result.osCaption = if ($os) { $os.Caption } else { $null }
$result.osBuild = if ($os) { $os.BuildNumber } else { $null }

$bios = Get-CimInstance Win32_BIOS
$result.biosYear = $null
if ($bios -and $bios.ReleaseDate) {
    $result.biosYear = $bios.ReleaseDate.Year
}

$gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
$result.gpuName = if ($gpu) { $gpu.Name } else { $null }

# Disk type: Get-PhysicalDisk needs the Storage module (Win8+); fall back gracefully.
$result.diskType = $null
$sysDisk = Get-PhysicalDisk | Select-Object -First 1
if ($sysDisk) { $result.diskType = "$($sysDisk.MediaType)" }

$sysDrive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$result.diskFreeGB = if ($sysDrive) { [math]::Round($sysDrive.FreeSpace / 1GB, 1) } else { $null }
$result.diskSizeGB = if ($sysDrive) { [math]::Round($sysDrive.Size / 1GB, 1) } else { $null }

# TPM presence often needs elevation; null means "unknown", not "absent".
$result.tpmPresent = $null
$tpm = Get-CimInstance -Namespace "root\cimv2\security\microsofttpm" -ClassName Win32_Tpm
if ($tpm) { $result.tpmPresent = $true }

$result | ConvertTo-Json -Compress
