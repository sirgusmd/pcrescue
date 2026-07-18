# PC Rescue

A friendly, jargon-free guide that helps non-technical users keep their older
Windows 10 computer alive by finding the right free (Linux-based) operating
system for it — and, eventually, walking them through the switch.

**Status: Phase 1 prototype.** This is a mock-data web prototype that locks in
the UI, copy, and recommendation logic. It performs no real hardware scan yet.

## Run it

No build step, no dependencies — it's plain HTML/CSS/JS with ES modules.
Because browsers block ES modules on `file://` pages, serve the folder with
any static server:

```
# Python (preinstalled on many systems)
python -m http.server 8080

# or Node
npx serve .
```

Then open http://localhost:8080

## How it works

| Path | Role |
|---|---|
| `index.html` | Single page with the three views (Welcome, Checklist, Results) |
| `css/styles.css` | Design tokens + components; light & dark themes |
| `js/app.js` | State + view switching |
| `js/views/` | One module per view; presentation only |
| `js/engine/recommend.js` | **The recommendation engine** — a pure function mapping answers to a top pick, alternatives, and honest trade-off notes. No DOM access, so the desktop app can feed it real scan data unchanged. |
| `js/data/distros.js` | Distro catalog and question definitions — all user-facing copy is data-driven |

## Product principles

- **Honest, not just cheerful**: Microsoft Office and anti-cheat gaming
  limitations are stated plainly on the results screen.
- **One confident pick**: novices want to be told, so one highlighted
  recommendation with two de-emphasized alternatives.
- **Try before you switch**: every recommended system runs live from USB
  without touching the hard drive — the results screen says so.
- **No dual-boot**: the guided path is try-from-USB → back up → clean install.
- **No jargon**: "operating system", never bare "distro", in user-facing copy.

## Roadmap

1. ~~Web prototype with mock questionnaire (this repo)~~
2. Desktop shell (Tauri or Electron — decision pending a WebView2 availability
   check on real, un-updated Windows 10 hardware) with a real hardware scan
   via PowerShell/WMI
3. Guided USB flash wizard (ISO download + verified write)
