# Measures the size of the user's personal folders for the Backup Helper.
# Read-only. Slow on huge libraries — the caller uses a generous timeout.

$ErrorActionPreference = "SilentlyContinue"

$folders = [ordered]@{
    documents = @{ label = "Documents"; path = [Environment]::GetFolderPath("MyDocuments") }
    pictures  = @{ label = "Pictures";  path = [Environment]::GetFolderPath("MyPictures") }
    desktop   = @{ label = "Desktop";   path = [Environment]::GetFolderPath("Desktop") }
    videos    = @{ label = "Videos";    path = [Environment]::GetFolderPath("MyVideos") }
    music     = @{ label = "Music";     path = [Environment]::GetFolderPath("MyMusic") }
}

$result = @()
foreach ($key in $folders.Keys) {
    $info = $folders[$key]
    if ($info.path -and (Test-Path -LiteralPath $info.path)) {
        $m = Get-ChildItem -LiteralPath $info.path -Recurse -Force -File -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum
        $result += @{
            id    = $key
            label = $info.label
            path  = $info.path
            bytes = [long]$(if ($m.Sum) { $m.Sum } else { 0 })
            files = [int]$m.Count
        }
    }
}

ConvertTo-Json @($result) -Compress
