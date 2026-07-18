# PC Rescue — guide for AI assistants working on this repo

PC Rescue helps non-technical users keep older Windows 10 PCs alive by
finding the right Linux system for them and (eventually) walking them through
the switch. Read this file fully before making changes.

## Commands

```
npm start          # run the desktop app (Electron)
npm run web        # run the web/mock build (python -m http.server 8317)
npm run dist       # build Windows .exe (portable + installer) into dist/
```

There is no build step for the UI — plain HTML/CSS/JS with ES modules, loaded
by Electron over a custom `app://` scheme (see `electron/main.js`).

## Architecture

- `index.html`, `css/styles.css`, `js/views/*` — presentation only. Views
  never contain product logic or copy beyond structure.
- `js/engine/recommend.js` — **pure function** answers → recommendation
  (top pick, alternatives, honest notes, per-program verdict report).
  Keep it DOM-free and Electron-free; it must run identically in the web
  build and desktop app.
- `js/engine/interpret-scan.js` — pure function raw hardware scan → the same
  answer shape the manual questionnaire produces. CPU generation is the age
  signal; **BIOS release dates are unreliable** (BIOS updates refresh them —
  observed on real hardware).
- `js/data/distros.js`, `js/data/apps.js` — ALL user-facing copy and catalogs.
  Product content changes happen here, not in views.
- `electron/main.js` + `preload.js` — desktop shell. `contextIsolation: true`,
  renderer talks to main only via the `window.pcrescue` bridge. The web build
  simply lacks `window.pcrescue` and every desktop feature must degrade
  gracefully when it's absent.
- `electron/scan/*.ps1` — PowerShell scanners, read-only, no elevation, JSON
  to stdout. Test them directly:
  `powershell -NoProfile -ExecutionPolicy Bypass -File electron\scan\hardware.ps1`

## Product principles (do not violate)

1. **Fully honest, never just cheerful.** Trade-offs (Microsoft Office,
   anti-cheat games, iTunes device sync) are stated plainly on the results
   screen. Never soften a "won't work" into a "might work."
2. **One confident pick.** One highlighted recommendation, two de-emphasized
   alternatives. Novices want to be told, not offered a menu.
3. **No jargon in user-facing copy.** "Operating system" or "system", never
   bare "distro". Plain English throughout; reading level ~age 12.
4. **No dual-boot.** The guided path is: try from USB → back up → clean
   install. Do not add dual-boot messaging or features.
5. **Nothing leaves the machine.** Scans are local; no telemetry, no network
   calls except opening distro websites in the default browser.
6. **Old hardware gets light systems.** Ubuntu (GNOME) and Pop!_OS are too
   heavy for 10+ year machines — see the tier table in `recommend.js`.
7. **Accessibility is a requirement**: keyboard navigable, visible focus,
   WCAG AA contrast, semantic HTML, light + dark theme.

## Catalog maintenance notes

- Zorin OS Lite is supported until June 2029 but sunsets from Zorin 19 —
  when that lands, swap `zorin-lite` for another light distro in
  `js/data/distros.js` and the tier table in `js/engine/recommend.js`.
- App verdicts in `js/data/apps.js`: `match` strings are lowercase substrings
  tested against Windows uninstall-registry display names. Keep them specific
  (e.g. "google chrome", never "chrome" — it would match "chrome plugins").

## Gotchas

- **Browser caching during web-mode dev**: `python -m http.server` sends no
  cache headers and Chromium caches ES modules aggressively. Hard-refresh
  (Ctrl+F5) or vary the origin (localhost / 127.0.0.1 / 127.0.0.2) when
  changes don't appear.
- Git warns about LF→CRLF on Windows; harmless, ignore.
- `Linuxmigration.md` and the WhatsApp screenshots in the repo folder are
  private planning material, gitignored on purpose — never commit them.
- The dev machine (Dell Precision M4700, i7-3740QM, Win10) is itself a
  target-audience machine: scans can be tested for real, and `Get-Tpm`-style
  TPM queries return null without elevation (null = unknown, not absent).

## Roadmap

See ROADMAP.md for full specs of unbuilt features (USB flash wizard, backup
helper). The USB wizard has strict safety rules — read them before touching
anything that writes to drives.
