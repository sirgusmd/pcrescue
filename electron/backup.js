// Backup copy engine. Copies the user's personal folders to a chosen
// external drive with byte-level progress. Purely additive: it only ever
// creates new files inside a fresh "PC Rescue Backup" folder on the target —
// it never deletes, overwrites user data, or touches the source.

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");

// Recursively lists real files (symlinks/junctions skipped — following them
// can loop forever or drag in cloud-placeholder trees).
function listFiles(dir, out, errors) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    errors.push(`${dir}: ${error.message}`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    try {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        listFiles(full, out, errors);
      } else if (entry.isFile()) {
        out.push({ path: full, size: fs.statSync(full).size });
      }
    } catch (error) {
      errors.push(`${full}: ${error.message}`);
    }
  }
}

/**
 * @param {{label: string, path: string}[]} sources  folders to back up
 * @param {string} targetRoot  e.g. "E:\\"
 * @param {(p: object) => void} onProgress
 * @returns {{ok: boolean, reason?: string, backupDir?: string, copiedFiles?: number,
 *            totalFiles?: number, errors?: string[]}}
 */
async function runBackup(sources, targetRoot, onProgress) {
  const errors = [];
  const jobs = [];
  let totalBytes = 0;

  for (const source of sources) {
    const files = [];
    listFiles(source.path, files, errors);
    for (const file of files) {
      jobs.push({ ...file, sourceLabel: source.label, sourceRoot: source.path });
      totalBytes += file.size;
    }
  }

  // Refuse rather than fill the target: require the data plus a 2 GB margin.
  const { bavail, bsize } = await fsp.statfs(targetRoot);
  const freeBytes = bavail * bsize;
  if (totalBytes + 2 * 1024 ** 3 > freeBytes) {
    return {
      ok: false,
      reason:
        `Not enough space: your files need ${(totalBytes / 1024 ** 3).toFixed(1)} GB ` +
        `but the drive only has ${(freeBytes / 1024 ** 3).toFixed(1)} GB free.`,
    };
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const backupDir = path.join(
    targetRoot,
    "PC Rescue Backup",
    `${os.hostname()} ${stamp}`
  );

  let doneBytes = 0;
  let doneFiles = 0;
  let lastReport = 0;

  for (const job of jobs) {
    const relative = path.relative(job.sourceRoot, job.path);
    const destination = path.join(backupDir, job.sourceLabel, relative);
    try {
      await fsp.mkdir(path.dirname(destination), { recursive: true });
      await fsp.copyFile(job.path, destination);
    } catch (error) {
      errors.push(`${job.path}: ${error.message}`);
    }
    doneBytes += job.size;
    doneFiles += 1;
    const now = Date.now();
    if (now - lastReport > 250 || doneFiles === jobs.length) {
      lastReport = now;
      onProgress({
        doneFiles,
        totalFiles: jobs.length,
        doneBytes,
        totalBytes,
      });
    }
  }

  return {
    ok: true,
    backupDir,
    copiedFiles: doneFiles - errors.length,
    totalFiles: jobs.length,
    errors: errors.slice(0, 50),
  };
}

module.exports = { runBackup };
