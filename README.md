# PC Rescue

A friendly, jargon-free Windows desktop app that helps non-technical users
keep their older Windows 10 computer alive by finding the right free
(Linux-based) operating system for it — and, eventually, walking them
through the switch.

**Status: working desktop app with real scanning.** The app scans the
machine's hardware (CPU age, memory, disk) and installed programs, then
recommends a Linux system with plain-English reasons and an honest,
per-program compatibility report. The USB flash wizard is specced
(ROADMAP.md) but not yet built.

## Run it

```
npm install
npm start          # desktop app (Electron)
npm run web        # browser version with manual questions only (no scanning)
npm run dist       # build a Windows .exe into dist/
$env:PCRESCUE_SMOKE="1"; npx electron .   # self-test; exit code 0 = healthy
```

Requires Node.js LTS. The web version also needs Python
(`python -m http.server`) and skips the scanners — it exists so the UI can be
developed and demoed anywhere.

## How it works

| Path | Role |
|---|---|
| `index.html`, `css/`, `js/views/` | The three screens (Welcome, Checklist, Results); presentation only |
| `js/engine/recommend.js` | **The recommendation engine** — pure function: answers → top pick, alternatives, honest trade-off notes, per-program verdicts |
| `js/engine/interpret-scan.js` | Pure function: raw hardware scan → questionnaire answers (CPU generation ≈ machine age) |
| `js/data/distros.js`, `js/data/apps.js` | All catalogs and user-facing copy — the product's content lives here |
| `electron/main.js`, `electron/preload.js` | Desktop shell; renderer talks to the system only via a narrow `window.pcrescue` bridge |
| `electron/scan/*.ps1` | Read-only PowerShell scanners (hardware + installed programs); JSON out, no elevation, nothing leaves the machine |

## Product principles

- **Honest, not just cheerful**: Microsoft Office, iTunes device sync, and
  anti-cheat gaming limitations are stated plainly, never softened.
- **One confident pick** with two quieter alternatives — novices want to be
  told, not offered a menu.
- **Try before you switch**: every recommended system runs live from USB.
- **No dual-boot**: the guided path is try-from-USB → back up → clean install.
- **Nothing leaves the machine**: scans are local; there is no telemetry.
- **No jargon**: "operating system", never bare "distro", in user-facing copy.

## For contributors (human or AI)

- `CLAUDE.md` — architecture, conventions, and the non-negotiable product
  principles. Read first.
- `ROADMAP.md` — specs for what's next, including the USB wizard's safety
  rules.
- `HANDOFF.md` — how to continue development with various AI coding tools.
- `GETTING-STARTED.md` — plain-English basics: running the app, git/GitHub,
  and setting up on a new machine.

## License

MIT — see LICENSE.
