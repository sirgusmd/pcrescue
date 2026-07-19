// Launches the elevated flash script (electron/flash.ps1) and relays its
// progress. Elevation goes through the standard Windows UAC prompt — the
// user must approve it. The elevated process talks back through temp files
// because it cannot share stdout with the non-elevated app.

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FLASH_TIMEOUT_MS = 45 * 60 * 1000;

function flashIso({ diskNumber, isoPath, expectedSha256 }, onProgress) {
  return new Promise((resolve) => {
    const stamp = Date.now();
    const progressFile = path.join(os.tmpdir(), `pcrescue-flash-progress-${stamp}.json`);
    const resultFile = path.join(os.tmpdir(), `pcrescue-flash-result-${stamp}.json`);
    const script = path
      .join(__dirname, "flash.ps1")
      .replace("app.asar", "app.asar.unpacked");

    // Quoting a nested elevated command line through Node → PowerShell →
    // Start-Process is hopeless with string escaping (paths like
    // "...\Programs\PC Rescue\..." contain spaces). Instead the outer
    // launcher is passed base64-encoded, and arguments are built as a
    // PowerShell array with paths explicitly quoted.
    const psArgs = [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
      "-File", `"${script}"`,
      "-DiskNumber", String(diskNumber),
      "-IsoPath", `"${isoPath}"`,
      "-ExpectedSha256", expectedSha256,
      "-ProgressFile", `"${progressFile}"`,
      "-ResultFile", `"${resultFile}"`,
    ];
    const argList = psArgs.map((a) => `'${a.replace(/'/g, "''")}'`).join(",");
    const outerScript =
      `try { $p = Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList @(${argList}); exit $p.ExitCode } catch { exit 1 }`;
    const encoded = Buffer.from(outerScript, "utf16le").toString("base64");

    const launcher = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded],
      { windowsHide: true }
    );

    let launcherFailed = false;
    launcher.on("exit", (code) => {
      // Non-zero here usually means the user clicked "No" on the UAC prompt.
      if (code !== 0) launcherFailed = true;
    });
    launcher.on("error", () => {
      launcherFailed = true;
    });

    const started = Date.now();
    const timer = setInterval(() => {
      try {
        const progress = JSON.parse(fs.readFileSync(progressFile, "utf8"));
        onProgress(progress);
      } catch {}
      try {
        const result = JSON.parse(fs.readFileSync(resultFile, "utf8"));
        finish(result);
        return;
      } catch {}
      if (launcherFailed && !fs.existsSync(progressFile) && Date.now() - started > 4000) {
        finish({
          ok: false,
          reason:
            "Windows didn't allow the write to start — the permission " +
            "prompt was closed or declined. Nothing was changed.",
        });
        return;
      }
      if (Date.now() - started > FLASH_TIMEOUT_MS) {
        finish({ ok: false, reason: "The write took far too long and was abandoned." });
      }
    }, 800);

    function finish(result) {
      clearInterval(timer);
      for (const file of [progressFile, resultFile]) {
        fs.rm(file, { force: true }, () => {});
      }
      resolve(result);
    }
  });
}

module.exports = { flashIso };
