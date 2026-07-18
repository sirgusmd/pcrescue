// Backup Helper view (desktop app only — the results screen hides the entry
// button when window.pcrescue is absent). Measures the user's personal
// folders, recommends cloud vs external drive, and copies to a USB drive
// with progress.

function gb(bytes) {
  return bytes / 1024 ** 3;
}

function formatSize(bytes) {
  if (bytes < 100 * 1024 * 1024) return "less than 0.1 GB";
  return `${gb(bytes).toFixed(1)} GB`;
}

export function initBackup({ onBack }) {
  document.getElementById("backup-back").addEventListener("click", onBack);
}

export async function renderBackup() {
  const container = document.getElementById("backup-content");
  container.innerHTML = `
    <p class="lead">
      Before changing anything on this computer, let's get your files
      somewhere safe. We'll measure what you have, then help you copy it.
    </p>
    <div class="card">
      <h2 class="backup-section-title">What you have</h2>
      <p id="backup-sizes-status">Measuring your folders… this can take a few
      minutes if you have lots of photos or videos.</p>
      <ul id="backup-sizes" hidden></ul>
      <p id="backup-advice" hidden></p>
    </div>

    <div class="note note-good-news">
      <span class="note-icon" aria-hidden="true">🔑</span>
      <div>
        <h4>Don't forget your passwords and bookmarks</h4>
        <p>
          In Chrome or Firefox, sign in and turn on Sync (look for your
          picture or initial in the top-right corner). Your bookmarks and
          saved passwords will then follow you to your new system
          automatically — this is the thing people most regret skipping.
        </p>
      </div>
    </div>

    <div class="card" id="backup-drive-card">
      <h2 class="backup-section-title">Copy to a USB drive</h2>
      <p>
        Plug in a memory stick or external drive, then choose it below. We
        only ever <strong>add</strong> a new "PC Rescue Backup" folder — nothing
        on the drive is deleted.
      </p>
      <div class="button-row">
        <button type="button" id="backup-refresh-drives" class="btn btn-quiet">
          Look for drives
        </button>
      </div>
      <div id="backup-drives" role="radiogroup" aria-label="Choose a drive"></div>
      <div class="button-row">
        <button type="button" id="backup-start" class="btn btn-primary" disabled>
          Start the copy
        </button>
      </div>
      <div id="backup-progress-wrap" hidden>
        <progress id="backup-progress" max="100" value="0"></progress>
        <p id="backup-progress-text"></p>
      </div>
      <div id="backup-done" class="note note-good-news" hidden>
        <span class="note-icon" aria-hidden="true">🎉</span>
        <div>
          <h4>Backup finished</h4>
          <p id="backup-done-text"></p>
        </div>
      </div>
      <p class="form-error" id="backup-error" role="alert" hidden></p>
    </div>
  `;

  const sizes = await window.pcrescue.scanBackupSizes();
  const statusEl = document.getElementById("backup-sizes-status");
  if (!Array.isArray(sizes)) {
    statusEl.textContent =
      "We couldn't measure your folders automatically. You can still copy " +
      "them by hand: look in Documents, Pictures, Desktop, Videos and Music.";
  } else {
    const nonEmpty = sizes.filter((s) => s.files > 0);
    const totalBytes = nonEmpty.reduce((sum, s) => sum + s.bytes, 0);
    statusEl.hidden = true;
    const listEl = document.getElementById("backup-sizes");
    listEl.hidden = false;
    listEl.innerHTML =
      nonEmpty
        .map(
          (s) =>
            `<li><strong>${s.label}</strong>: ${formatSize(s.bytes)} ` +
            `(${s.files.toLocaleString()} files)</li>`
        )
        .join("") +
      `<li class="backup-total"><strong>Total</strong>: ${formatSize(totalBytes)}</li>`;

    const advice = document.getElementById("backup-advice");
    advice.hidden = false;
    advice.innerHTML =
      gb(totalBytes) < 4.5
        ? "That's small enough for a free cloud account (Google Drive gives " +
          "15 GB free, OneDrive 5 GB) — upload your folders at " +
          "drive.google.com or onedrive.com. A USB drive works too, below."
        : "That's more than the free cloud services comfortably hold, so a " +
          "USB memory stick or external drive is the way to go — one with " +
          `at least ${Math.ceil(gb(totalBytes) + 2)} GB free.`;

    // Folders redirected into OneDrive are already cloud-backed — say so
    // honestly rather than implying nothing is safe yet.
    if (nonEmpty.some((s) => s.path.includes("OneDrive"))) {
      advice.innerHTML +=
        " <strong>Good news:</strong> some of these folders live inside " +
        "OneDrive, so those files are already in the cloud (as long as sync " +
        "was up to date). The USB copy below is still a sensible " +
        "belt-and-braces step — cloud-only files may be skipped unless you " +
        "open OneDrive and mark them \"Always keep on this device\" first.";
    }
  }

  wireDrives();
}

function wireDrives() {
  const drivesEl = document.getElementById("backup-drives");
  const refreshBtn = document.getElementById("backup-refresh-drives");
  const startBtn = document.getElementById("backup-start");
  const errorEl = document.getElementById("backup-error");

  async function refresh() {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Looking…";
    const drives = await window.pcrescue.listBackupDrives();
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Look again";
    if (!Array.isArray(drives) || drives.length === 0) {
      drivesEl.innerHTML = `<p class="question-help">No USB drives found —
        plug one in and click "Look again". (Drives inside this computer
        aren't offered: they'd be lost along with Windows.)</p>`;
      startBtn.disabled = true;
      return;
    }
    drivesEl.innerHTML = drives
      .map(
        (d) => `
        <label class="choice">
          <input type="radio" name="backup-drive" value="${d.letter}" />
          <span class="choice-text">
            ${d.label} (${d.letter}:) — ${d.freeGB} GB free of ${d.sizeGB} GB
          </span>
        </label>`
      )
      .join("");
    drivesEl.addEventListener("change", () => {
      startBtn.disabled = false;
      errorEl.hidden = true;
    });
  }

  refreshBtn.addEventListener("click", refresh);
  refresh();

  startBtn.addEventListener("click", async () => {
    const chosen = document.querySelector('input[name="backup-drive"]:checked');
    if (!chosen) return;
    startBtn.disabled = true;
    refreshBtn.disabled = true;
    errorEl.hidden = true;
    const progressWrap = document.getElementById("backup-progress-wrap");
    const progressBar = document.getElementById("backup-progress");
    const progressText = document.getElementById("backup-progress-text");
    progressWrap.hidden = false;
    progressText.textContent = "Getting ready…";

    window.pcrescue.onBackupProgress((p) => {
      progressBar.value = p.totalBytes ? (p.doneBytes / p.totalBytes) * 100 : 0;
      progressText.textContent =
        `Copied ${p.doneFiles.toLocaleString()} of ` +
        `${p.totalFiles.toLocaleString()} files ` +
        `(${formatSize(p.doneBytes)} of ${formatSize(p.totalBytes)})`;
    });

    const result = await window.pcrescue.startBackup(chosen.value);
    refreshBtn.disabled = false;
    if (!result.ok) {
      progressWrap.hidden = true;
      startBtn.disabled = false;
      errorEl.textContent = result.reason ?? "The copy didn't work — try again.";
      errorEl.hidden = false;
      return;
    }
    progressBar.value = 100;
    const done = document.getElementById("backup-done");
    const doneText = document.getElementById("backup-done-text");
    done.hidden = false;
    const skipped = result.totalFiles - result.copiedFiles;
    doneText.textContent =
      `${result.copiedFiles.toLocaleString()} files are now safe in ` +
      `"${result.backupDir}".` +
      (skipped > 0
        ? ` ${skipped.toLocaleString()} file(s) couldn't be copied (usually ` +
          `files that are open or cloud-only) — worth a quick look before ` +
          `you go further.`
        : " Everything copied cleanly.");
  });
}
