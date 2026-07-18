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
