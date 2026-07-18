# Continuing PC Rescue with other AI models

This project was built with AI assistance (Claude) and is set up so any
capable coding model can pick it up. This file is for **Angus** — practical
instructions for continuing development after the original session ends.

## The 60-second orientation for any new AI session

Paste this as your first message in any new AI coding session:

> Read CLAUDE.md and ROADMAP.md in this repo before doing anything. This is
> PC Rescue, an Electron app helping Windows 10 users move to Linux. The
> product principles in CLAUDE.md are non-negotiable. Verify the app still
> works before and after your changes with:
> `$env:PCRESCUE_SMOKE="1"; npx electron .` (exit code 0 = healthy).
> Current task: [describe what you want done, or pick the next item in
> ROADMAP.md].

## Option A: Claude Code with Opus 4.8 (recommended)

Claude Code works with whatever models your plan includes; Opus is very
capable of everything in ROADMAP.md.

1. Open Claude Code (desktop app or `claude` in a terminal) in
   `D:\Claude\Angus\PCRescue`.
2. It reads CLAUDE.md automatically. Give it a task from ROADMAP.md.
3. For the USB flash wizard specifically, paste this framing:
   > Implement Phase 3 from ROADMAP.md. Read the safety rules section first
   > and repeat them back to me before writing any code. Build the device
   > picker and its removable-only filtering first, with the write step
   > stubbed out, and show me the device list it produces on this machine
   > before we go further.

   (Building the dangerous part last, behind a review, is deliberate.)

## Option B: Open-source models, running locally

Realistic setup on a machine like this dev laptop (32 GB RAM, no big GPU):

1. Install [Ollama](https://ollama.com) (easiest) or LM Studio.
2. Pull a coding model that fits in RAM — as of mid-2026, a ~14–30B coding
   model (e.g. Qwen-coder class) is the sweet spot for CPU-only; bigger is
   slow without a GPU.
3. Use a coding agent that drives local models:
   - [aider](https://aider.chat) — terminal-based, works with Ollama
     (`aider --model ollama/<model>`), edits files and commits for you.
   - Continue (VS Code extension) — chat + edits inside the editor.
4. Open-source models need smaller steps than Claude. Give them one file or
   one function at a time, and always end with: "run
   `$env:PCRESCUE_SMOKE=\"1\"; npx electron .` and show me the output."

**Honest caution**: do NOT let a local model implement the USB write step
unsupervised. Everything else in ROADMAP.md is fair game; that one feature
erases drives when done wrong. Save it for a strong model, review the device
filter yourself, and test on a stick you don't care about with no other
drives plugged in.

## Option C: Cloud, repo-connected (Claude Code on the web / GitHub)

Once the repo is on GitHub, cloud agents (claude.ai/code, GitHub-connected
tools) can work on it without your laptop. Good for docs, catalogs, and UI
work; scanner/USB work needs a real Windows machine, so keep those tasks
local.

## Development basics (no AI involved)

```
npm start                                # run the desktop app
npm run web                              # run web build at localhost:8317
$env:PCRESCUE_SMOKE="1"; npx electron .  # self-test, exit 0 = pass
npm run dist                             # build .exe into dist/
```

Requirements: Node.js LTS (installed via winget), Python (for `npm run web`
only). Everything else is `npm install`.

## Rules of thumb for directing any model

- Point it at CLAUDE.md first, every session. Models start blank.
- One task per session; commit between tasks. Small commits are your undo
  button.
- Ask it to *verify* (run the smoke test, show output) — don't accept "this
  should work."
- If a model wants to add a framework, a build step, or rewrite working
  code, say no. This project is deliberately plain.
- The product principles (honesty, no jargon, no dual-boot, nothing leaves
  the machine) outrank any model's suggestion, however confident it sounds.
