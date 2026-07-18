// Bridge between the sandboxed renderer and the main process. The web build
// simply lacks window.pcrescue, and the UI falls back to manual questions.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pcrescue", {
  scanHardware: () => ipcRenderer.invoke("scan:hardware"),
  scanApps: () => ipcRenderer.invoke("scan:apps"),
});
