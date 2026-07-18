// Electron main process. Serves the existing web UI over a custom app://
// scheme (so ES modules load without a bundler) and exposes the PowerShell
// scanners to the renderer via IPC.

const { app, BrowserWindow, ipcMain, protocol, net, shell } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const {
  scanHardware,
  scanInstalledApps,
  scanDataSizes,
  listBackupDrives,
  listUsbSticks,
} = require("./scanners");
const { runBackup } = require("./backup");

// app:// must be registered as a standard scheme before app is ready,
// otherwise relative ES-module imports won't resolve.
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const ROOT = path.join(__dirname, "..");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 680,
    minHeight: 520,
    autoHideMenuBar: true,
    backgroundColor: "#f6f8f4",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links (distro websites) open in the user's default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadURL("app://bundle/index.html");

  // Smoke-test mode (PCRESCUE_SMOKE=1): drives the real UI through a full
  // scan-and-recommend flow, prints the outcome as JSON, and exits non-zero
  // on failure. Lets any contributor (or AI assistant) verify the desktop
  // build headlessly-ish: `$env:PCRESCUE_SMOKE="1"; npx electron .`
  if (process.env.PCRESCUE_SMOKE === "1") runSmokeTest(win);
}

function runSmokeTest(win) {
  win.webContents.once("did-finish-load", async () => {
    try {
      const result = await win.webContents.executeJavaScript(`(async () => {
        document.getElementById("start-button").click();
        document.getElementById("scan-button").click();
        for (let i = 0; i < 200; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (!document.getElementById("scan-result").hidden) break;
        }
        const facts = [...document.querySelectorAll("#scan-facts li")].map((li) => li.textContent);
        const age = document.querySelector('input[name="age"]:checked')?.value ?? null;
        const preticked = [...document.querySelectorAll('input[name="programs"]:checked')].map((el) => el.value);
        document.getElementById("checklist-submit").click();
        const onResults = !document.getElementById("view-results").hidden;
        const topPick = document.querySelector(".card-top-pick .distro-name")?.textContent.trim().replace(/\\s+/g, " ") ?? null;
        const verdictGroups = [...document.querySelectorAll(".verdict-group h4")].map((h) => h.textContent.trim().replace(/\\s+/g, " "));

        // Backup Helper: enter the view and wait for the size scan and drive
        // list. Never starts a copy.
        document.getElementById("backup-helper-button")?.click();
        const onBackupView = !document.getElementById("view-backup").hidden;
        let backupSizesShown = false;
        for (let i = 0; i < 300; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const sizesEl = document.getElementById("backup-sizes");
          if (sizesEl && !sizesEl.hidden) { backupSizesShown = true; break; }
        }
        const backupTotal = [...document.querySelectorAll("#backup-sizes li")].pop()?.textContent.trim() ?? null;
        const backupDrivesText = document.getElementById("backup-drives")?.textContent.trim().replace(/\\s+/g, " ").slice(0, 160) ?? null;

        // USB wizard (safe steps): enter from results, check the boot key
        // reflects the scanned manufacturer, and run the stick check.
        document.getElementById("backup-back").click();
        document.getElementById("wizard-button").click();
        const onWizardView = !document.getElementById("view-wizard").hidden;
        const bootKeyShown = document.querySelector(".boot-key")?.textContent.trim() ?? null;
        document.getElementById("wizard-check-sticks")?.click();
        let wizardSticksText = null;
        for (let i = 0; i < 120; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const el = document.getElementById("wizard-sticks");
          if (el && el.textContent.trim() !== "") {
            wizardSticksText = el.textContent.trim().replace(/\\s+/g, " ").slice(0, 160);
            break;
          }
        }

        return {
          scanCompleted: facts.length > 0,
          age,
          facts,
          preticked,
          onResults,
          topPick,
          verdictGroups,
          onBackupView,
          backupSizesShown,
          backupTotal,
          backupDrivesText,
          onWizardView,
          bootKeyShown,
          wizardSticksText,
        };
      })()`);
      const passed =
        result.scanCompleted &&
        result.age &&
        result.onResults &&
        result.topPick &&
        result.onBackupView &&
        result.backupSizesShown &&
        result.onWizardView &&
        result.bootKeyShown;
      console.log("SMOKE_RESULT " + JSON.stringify(result));
      app.exit(passed ? 0 : 1);
    } catch (error) {
      console.error("SMOKE_FAIL " + error.message);
      app.exit(1);
    }
  });
}

app.whenReady().then(() => {
  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.join(ROOT, decodeURIComponent(pathname));
    // Never serve files outside the app folder.
    if (!filePath.startsWith(ROOT)) return new Response("Forbidden", { status: 403 });
    return net.fetch(pathToFileURL(filePath).toString());
  });

  ipcMain.handle("scan:hardware", () => scanHardware());
  ipcMain.handle("scan:apps", () => scanInstalledApps());
  ipcMain.handle("backup:scanSizes", () => scanDataSizes());
  ipcMain.handle("backup:listDrives", () => listBackupDrives());
  ipcMain.handle("wizard:listSticks", () => listUsbSticks());

  // Copies the user's folders to a chosen USB drive. Additive only (never
  // deletes or overwrites user data). The target letter is re-verified
  // against the live USB drive list immediately before any write.
  ipcMain.handle("backup:start", async (event, targetLetter) => {
    if (!/^[A-Z]$/i.test(targetLetter ?? "")) {
      return { ok: false, reason: "Invalid drive." };
    }
    const drives = (await listBackupDrives()) ?? [];
    const target = drives.find(
      (d) => d.letter.toUpperCase() === targetLetter.toUpperCase()
    );
    if (!target) {
      return { ok: false, reason: "That drive is no longer connected." };
    }
    const sizes = (await scanDataSizes()) ?? [];
    const sources = sizes
      .filter((s) => s.files > 0)
      .map((s) => ({ label: s.label, path: s.path }));
    if (sources.length === 0) {
      return { ok: false, reason: "No files found to back up." };
    }
    const sender = event.sender;
    return runBackup(sources, `${target.letter.toUpperCase()}:\\`, (progress) => {
      if (!sender.isDestroyed()) sender.send("backup:progress", progress);
    });
  });

  createWindow();
});

app.on("window-all-closed", () => app.quit());
