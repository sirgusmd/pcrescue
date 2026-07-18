// Runs the PowerShell scan scripts and returns parsed JSON. Any failure
// returns null — the renderer then falls back to the manual questionnaire,
// so a broken scan can never strand the user.

const { execFile } = require("child_process");
const path = require("path");

const PS_ARGS = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File"];

function runScript(scriptName, timeoutMs) {
  const scriptPath = path.join(__dirname, "scan", scriptName);
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

exports.scanHardware = () => runScript("hardware.ps1", 30000);
exports.scanInstalledApps = () => runScript("apps.ps1", 30000);
