// Runs the PowerShell scan scripts and returns parsed JSON. Any failure
// returns null — the renderer then falls back to the manual questionnaire,
// so a broken scan can never strand the user.

const { execFile } = require("child_process");
const path = require("path");

const PS_ARGS = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"];

function runScript(scriptName, timeoutMs) {
  // In the packaged app the scripts live in app.asar.unpacked (see
  // asarUnpack in package.json) — powershell.exe can't read inside an asar.
  const scriptPath = path
    .join(__dirname, "scan", scriptName)
    .replace("app.asar", "app.asar.unpacked");
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [...PS_ARGS, scriptPath],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            `${scriptName} failed (code ${error.code}):`,
            error.message,
            "stderr:",
            (stderr || "").slice(0, 2000)
          );
          return resolve(null);
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (parseError) {
          console.error(`${scriptName} returned unparseable output:`, parseError.message);
          resolve(null);
        }
      }
    );
  });
}

// Generous timeouts: PowerShell's CIM/Storage modules can take a long time
// to cold-start on old hardware — which is exactly the hardware this app
// targets (observed >30s on a 2012 laptop under disk load).
exports.scanHardware = () => runScript("hardware.ps1", 90000);
exports.scanInstalledApps = () => runScript("apps.ps1", 90000);
// Size scan walks whole photo/video libraries — give it longest of all.
exports.scanDataSizes = () => runScript("datasize.ps1", 300000);
exports.listBackupDrives = () => runScript("drives.ps1", 60000);
exports.listUsbSticks = () => runScript("usbsticks.ps1", 60000);
