# USB flash writer. Runs ELEVATED (launched via Start-Process -Verb RunAs by
# electron/flash.js). This is the only code in PC Rescue that writes to a raw
# disk — read ROADMAP.md's safety rules before changing ANYTHING here.
#
# Safety layers, in order:
#   1. Re-verifies INSIDE this elevated process that the target disk is
#      USB-attached and not a boot/system disk — never trusts the caller.
#   2. Re-hashes the ISO file against the pinned SHA-256 before writing.
#   3. Writes sector-aligned, then reads the entire image back off the stick
#      and compares hashes — success is only reported on a perfect match.
#
# Progress and results are exchanged through files because an elevated
# process cannot write to the non-elevated app's stdout.

param(
    [Parameter(Mandatory = $true)][int]$DiskNumber,
    [Parameter(Mandatory = $true)][string]$IsoPath,
    [Parameter(Mandatory = $true)][string]$ExpectedSha256,
    [Parameter(Mandatory = $true)][string]$ProgressFile,
    [Parameter(Mandatory = $true)][string]$ResultFile
)

$ErrorActionPreference = "Stop"

function Report($stage, $done, $total) {
    @{ stage = $stage; doneBytes = [long]$done; totalBytes = [long]$total } |
        ConvertTo-Json -Compress | Set-Content -Path $ProgressFile -Encoding Ascii
}
function Finish($obj) {
    $obj | ConvertTo-Json -Compress | Set-Content -Path $ResultFile -Encoding Ascii
}

try {
    # --- Safety layer 1: revalidate the target disk in THIS process -------
    $disk = Get-Disk -Number $DiskNumber
    if ($disk.BusType -ne "USB") { throw "Safety stop: the chosen drive is not a USB drive." }
    if ($disk.IsBoot -or $disk.IsSystem) { throw "Safety stop: that drive is part of Windows itself." }

    $iso = Get-Item -LiteralPath $IsoPath
    if ($iso.Length -gt $disk.Size) { throw "The system file is bigger than the stick." }

    # --- Safety layer 2: the ISO must still match its pinned checksum -----
    Report "checking-file" 0 $iso.Length
    $fileHash = (Get-FileHash -LiteralPath $IsoPath -Algorithm SHA256).Hash.ToLower()
    if ($fileHash -ne $ExpectedSha256.ToLower()) {
        throw "The downloaded file has changed since we checked it. Please download it again."
    }

    # --- Prepare: remove partitions so no volume is mounted while we write
    Report "preparing" 0 $iso.Length
    "select disk $DiskNumber`nclean" | diskpart | Out-Null
    Start-Sleep -Seconds 2

    Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
public static class RawDisk {
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern SafeFileHandle CreateFile(string fileName, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
    public static FileStream Open(int diskNumber, bool write) {
        uint access = write ? 0xC0000000u : 0x80000000u;          // read+write : read
        uint flags = write ? 0x80000000u : 0u;                    // FILE_FLAG_WRITE_THROUGH
        SafeFileHandle handle = CreateFile("\\\\.\\PhysicalDrive" + diskNumber, access, 0x3u, IntPtr.Zero, 3u, flags, IntPtr.Zero);
        if (handle.IsInvalid) throw new IOException("Cannot open the drive (Windows error " + Marshal.GetLastWin32Error() + ").");
        return new FileStream(handle, write ? FileAccess.ReadWrite : FileAccess.Read);
    }
}
'@

    # --- Write, sector-aligned ---------------------------------------------
    $bufferSize = 4MB
    $buffer = New-Object byte[] $bufferSize
    $source = [System.IO.File]::OpenRead($IsoPath)
    $device = [RawDisk]::Open($DiskNumber, $true)
    $written = [long]0
    try {
        while (($read = $source.Read($buffer, 0, $bufferSize)) -gt 0) {
            if ($read % 512 -ne 0) {
                $aligned = [int]([math]::Ceiling($read / 512.0) * 512)
                for ($i = $read; $i -lt $aligned; $i++) { $buffer[$i] = 0 }
                $read = $aligned
            }
            $device.Write($buffer, 0, $read)
            $written += $read
            if (($written % 64MB) -lt $bufferSize) { Report "writing" $written $iso.Length }
        }
        $device.Flush()
    } finally {
        $device.Dispose()
        $source.Dispose()
    }

    # --- Safety layer 3: read the stick back and prove it matches ----------
    Report "checking-stick" 0 $iso.Length
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $reader = [RawDisk]::Open($DiskNumber, $false)
    $remaining = [long]$iso.Length
    $checked = [long]0
    try {
        while ($remaining -gt 0) {
            $want = [long][math]::Ceiling($remaining / 512.0) * 512
            if ($want -gt $bufferSize) { $want = $bufferSize }
            $read = $reader.Read($buffer, 0, [int]$want)
            if ($read -le 0) { throw "Could not read the stick back to check it." }
            $use = [long]$read
            if ($use -gt $remaining) { $use = $remaining }
            $sha.TransformBlock($buffer, 0, [int]$use, $null, 0) | Out-Null
            $remaining -= $use
            $checked += $use
            if (($checked % 128MB) -lt $bufferSize) { Report "checking-stick" $checked $iso.Length }
        }
        $sha.TransformFinalBlock($buffer, 0, 0) | Out-Null
        $stickHash = ([BitConverter]::ToString($sha.Hash) -replace "-", "").ToLower()
    } finally {
        $reader.Dispose()
        $sha.Dispose()
    }

    if ($stickHash -ne $ExpectedSha256.ToLower()) {
        throw "The stick read back differently than what we wrote. Try again, or try a different stick."
    }

    Finish @{ ok = $true }
} catch {
    Finish @{ ok = $false; reason = $_.Exception.Message }
}
