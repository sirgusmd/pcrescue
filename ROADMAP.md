# PC Rescue — Roadmap & Feature Specs

Status after the July 2026 sprint: web prototype and Electron desktop app
with real hardware + installed-program scanning are **done**. The features
below are specced but deliberately unbuilt — they were not rushed because
they carry real risk (writing to drives) or need multi-machine testing.

## Phase 3: USB Flash Wizard (the big one)

Goal: from the results screen, "Start USB Flash Wizard" walks the user from
zero to a bootable Linux USB stick, then tells them exactly how to boot it.

### Steps

1. **Explain & check**: plain-English intro. Detect inserted USB drives.
   Require ≥ 8 GB. If the stick is too small, say so in plain English and
   stop. Warn clearly: "Everything currently on this stick will be erased."
2. **Download**: fetch the ISO for the recommended distro from its official
   mirror. Show progress in MB and minutes, not percentages alone. **Verify
   the SHA-256 checksum** against a value pinned in the app's data files —
   never skip this; a corrupted ISO produces cryptic boot failures novices
   cannot debug.
3. **Write**: flash the ISO to the stick, then verify the write.
4. **Boot instructions**: read the machine's manufacturer (already scanned —
   `manufacturer` field) and show the *specific* boot-menu key:
   Dell F12 · HP F9/Esc · Lenovo F12 (or Novo button) · Acer F12 (may need
   F2 → enable boot menu) · Asus F8/Esc · Toshiba F12 · Samsung Esc/F10 ·
   MSI F11 · Surface: hold Vol-Down + power. Fall back to "commonly F12 or
   Esc — press it repeatedly right after switching on."
   This step is the #1 novice drop-off point; it deserves the most care.

### Safety rules (non-negotiable — a bug here destroys someone's data)

- Device picker lists **removable USB drives only**. Never enumerate, show,
  or accept internal/fixed disks, no matter what. Filter on the Windows
  side (e.g. `Get-Disk | Where-Object BusType -eq USB` AND
  `-not $_.IsBoot -and -not $_.IsSystem`), and re-verify the target is still
  removable immediately before writing.
- Require the user to re-confirm by clicking the named device ("Erase
  'SanDisk 16GB (E:)' and continue").
- Writing requires admin elevation — request it only at the write step, not
  at app launch.
- If anything is uncertain (device disappeared, size changed, checksum
  mismatch), stop and say so plainly. Never retry silently.
- Implementation options, in order of preference: (a) bundle/shell out to a
  proven open-source flasher; (b) direct raw write via PowerShell/Win32 with
  the guards above. Do not hand-roll device enumeration heuristics.

## Phase 4: Backup Helper — BUILT (July 2026)

Implemented: folder size scan (`electron/scan/datasize.ps1`), cloud-vs-drive
advice with OneDrive-redirect awareness, browser-sync reminder, USB-only
drive picker (`electron/scan/drives.ps1` — internal drives deliberately
excluded), additive copy engine with progress (`electron/backup.js`), smoke
coverage.

Remaining for this phase:
- The copy path needs a real end-to-end test with a physical USB drive
  (measure → pick drive → copy → verify files landed).
- Possible later: hydrate OneDrive cloud-only placeholders before copy, or
  count and report them up front; remind about PST files / license keys.

## Smaller improvements (any order)

- Windows 11 eligibility check in the scan (TPM 2.0 + CPU list) so the app
  can honestly say "your PC actually could upgrade to Windows 11" when true —
  honesty cuts both ways.
- Live-USB "try it first" screen with per-distro screenshots.
- Grow `js/data/apps.js` beyond ~44 entries; add a free-text "other program"
  box that searches the catalog and admits ignorance gracefully.
- Localisation scaffolding (all copy already lives in data files/templates).
- Auto-update for the distro catalog (a simple pinned JSON fetched from the
  GitHub repo, with the bundled copy as fallback).

## Release checklist (when phase 3 lands)

- Test the full flow on the real 2013 Dell (this repo's dev machine).
- Test the flashed USB actually boots on at least two machines.
- Code-sign the installer if distributing beyond friends (unsigned exes
  trigger SmartScreen warnings — document the "More info → Run anyway" path
  for early users).
