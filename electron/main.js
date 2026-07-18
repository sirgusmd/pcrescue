// Electron main process. Serves the existing web UI over a custom app://
// scheme (so ES modules load without a bundler) and exposes the PowerShell
// scanners to the renderer via IPC.

const { app, BrowserWindow, ipcMain, protocol, net, shell } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const { scanHardware, scanInstalledApps } = require("./scanners");

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
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (!document.getElementById("scan-result").hidden) break;
        }
        const facts = [...document.querySelectorAll("#scan-facts li")].map((li) => li.textContent);
        const age = document.querySelector('input[name="age"]:checked')?.value ?? null;
        const preticked = [...document.querySelectorAll('input[name="programs"]:checked')].map((el) => el.value);
        document.getElementById("checklist-submit").click();
        return {
          scanCompleted: facts.length > 0,
          age,
          facts,
          preticked,
          onResults: !document.getElementById("view-results").hidden,
          topPick: document.querySelector(".card-top-pick .distro-name")?.textContent.trim().replace(/\\s+/g, " ") ?? null,
          verdictGroups: [...document.querySelectorAll(".verdict-group h4")].map((h) => h.textContent.trim().replace(/\\s+/g, " ")),
        };
      })()`);
      const passed = result.scanCompleted && result.age && result.onResults && result.topPick;
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

  createWindow();
});

app.on("window-all-closed", () => app.quit());
