# Getting Started — a plain-English guide for Angus

This is your personal cheat sheet: how to run the app, how GitHub works,
and how to keep developing with AI help. No jargon without an explanation.
(HANDOFF.md is the companion file — it's what you show an AI; this one is
for you.)

## 1. Just running the app

You don't need any of the developer stuff to *use* PC Rescue:

- **From this computer**: double-click
  `D:\Claude\Angus\PCRescue\dist\win-unpacked\PC Rescue.exe`
- **On any other computer**: go to
  https://github.com/sirgusmd/pcrescue/releases — download the latest
  "Setup" file and run it. Windows may show a blue "SmartScreen" warning
  because the app isn't signed by a company — click **More info**, then
  **Run anyway**.

## 2. What GitHub actually is (30 seconds)

GitHub is a website that stores your code plus its entire history. Your
project lives at **https://github.com/sirgusmd/pcrescue**. Three words to
know:

- **Repository (repo)** — the project's folder on GitHub.
- **Commit** — a saved snapshot. Your project has a growing list of them;
  each one is a point you can go back to. This is your safety net.
- **Push / pull** — *push* sends your latest commits from your computer up
  to GitHub; *pull* brings down anything newer from GitHub. Your laptop and
  GitHub are two copies of the same thing, kept in sync by these commands.

The **Releases** page is the "finished downloads" shelf — that's where the
.exe files for normal users live, separate from the code.

## 3. The commands you'll actually type

Open PowerShell (Start menu → type "powershell"), then go to the project:

```
cd D:\Claude\Angus\PCRescue
```

| You want to… | Type this |
|---|---|
| Run the app from code | `npm start` |
| Check the app is healthy | `$env:PCRESCUE_SMOKE="1"; npx electron .` — wait for it to close, then `echo $LASTEXITCODE` (0 = healthy) |
| See what's changed since the last snapshot | `git status` |
| Save a snapshot of your changes | `git add -A` then `git commit -m "what I changed"` |
| Send snapshots up to GitHub | `git push` |
| Get the latest from GitHub | `git pull` |
| Build a fresh .exe | `npm run dist` (result appears in the `dist` folder) |
| See the project's history | `git log --oneline` |

In practice, AI assistants will run most of these *for* you — but knowing
them means you can check their work and rescue yourself.

## 4. Setting up on a brand-new computer

1. Install **Git**: https://git-scm.com (accept all defaults).
2. Install **Node.js LTS**: https://nodejs.org (the "LTS" button).
3. In PowerShell:
   ```
   git clone https://github.com/sirgusmd/pcrescue.git
   cd pcrescue
   npm install
   npm start
   ```
   `git clone` copies the whole project down; `npm install` fetches its
   parts; `npm start` runs it. That's the entire setup.

## 5. Working with AI models from here on

The full instructions are in **HANDOFF.md**, but the short version:

1. Start the AI tool (Claude Code, aider, etc.) in the project folder.
2. First message: tell it to read `CLAUDE.md` and `ROADMAP.md`.
3. One task at a time. After each task, have it run the health check and
   then `git push`.
4. If an AI session goes wrong, nothing is lost: `git status` shows the
   mess, and asking the AI to "discard uncommitted changes" (or typing
   `git checkout -- .`) returns you to the last snapshot.

## 6. If something breaks

- **App won't start after changes** → run the health check; if it fails,
  ask your AI to read the error, or go back: `git log --oneline` to find
  the last good snapshot, then `git checkout <its-code> -- .` to restore
  the files from it.
- **Forgot whether you pushed** → `git status` says "your branch is ahead"
  (need to push) or "up to date" (all safe on GitHub).
- **Lost this laptop entirely** → nothing is lost: section 4 on any other
  machine brings everything back from GitHub.

## 7. What's left to build

See ROADMAP.md. The one thing waiting on *you*: plug in a USB stick some
day and test the Backup Helper's copy for real. The one thing to be careful
with: the USB wizard's automated write step — read the safety rules in
ROADMAP.md before letting any AI build it.
