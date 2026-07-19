// USB Flash Wizard — the SAFE parts only. This view detects USB sticks,
// gives honest manual instructions for downloading and writing the system,
// and shows the machine-specific boot-menu key. It contains NO code that
// writes to any drive; the automated write step is specced in ROADMAP.md
// and must follow the safety rules there.

import { bootKeyFor } from "../data/bootkeys.js";
import { ISO_CATALOG } from "../data/isos.js";

// Users buy "8 GB" sticks (decimal), Windows reports ~7.3 GB (binary) —
// so the size check accepts anything over 7 while the copy talks in the
// units printed on the stick. Verified against a real Transcend "8GB"
// stick reporting 7.3.
const MIN_STICK_GB = 7;
const MIN_STICK_LABEL = "8 GB";

export function initWizard({ onBack, onBackup }) {
  document.getElementById("wizard-back").addEventListener("click", onBack);
  document.getElementById("view-wizard").addEventListener("click", (event) => {
    if (event.target.id === "wizard-backup-link") onBackup();
  });
}

export function renderWizard({ topPick, hardware }) {
  const container = document.getElementById("wizard-content");
  const boot = bootKeyFor(hardware?.manufacturer);
  const isDesktop = typeof window.pcrescue !== "undefined";

  container.innerHTML = `
    <p class="lead">
      Four steps take you from here to trying ${topPick.name} on this
      computer — without touching your hard drive.
    </p>

    <div class="card wizard-step">
      <h2><span class="step-number">1</span> Back up first</h2>
      <p>
        If you haven't yet, copy your files somewhere safe. It costs ten
        minutes and removes all the risk from everything that follows.
      </p>
      ${
        isDesktop
          ? `<button type="button" id="wizard-backup-link" class="btn btn-quiet">
               Open the Backup Helper
             </button>`
          : ""
      }
    </div>

    <div class="card wizard-step">
      <h2><span class="step-number">2</span> Get a USB memory stick ready</h2>
      <p>
        You need a stick of <strong>${MIN_STICK_LABEL} or more</strong>.
        <strong>Everything on it will be erased</strong> when it's turned into
        an installer, so use one with nothing precious on it.
      </p>
      ${
        isDesktop
          ? `<div class="button-row">
               <button type="button" id="wizard-check-sticks" class="btn btn-quiet">
                 Check my USB stick
               </button>
             </div>
             <div id="wizard-sticks"></div>`
          : ""
      }
    </div>

    <div class="card wizard-step">
      <h2><span class="step-number">3</span> Put ${topPick.name} on the stick</h2>
      ${downloadSectionTemplate(topPick, isDesktop)}
    </div>

    <div class="card wizard-step">
      <h2><span class="step-number">4</span> Start your computer from the stick</h2>
      <p>
        With the stick plugged in, restart the computer and tap
        <strong class="boot-key">${boot.key}</strong>
        ${hardware?.manufacturer
          ? `— that's the boot-menu key for <strong>${hardware.manufacturer.replace(/ inc\.?$/i, "")}</strong> machines.`
          : "."}
      </p>
      ${boot.note ? `<p>${boot.note}</p>` : ""}
      <p>
        A simple menu appears — choose the entry mentioning
        <strong>USB</strong>, and ${topPick.name} starts up
        <strong>without installing anything</strong>. Have a proper look
        around: open the web browser, play a video, check your printer.
        When you're done, restart and remove the stick — your computer is
        exactly as it was. If you love it, the desktop has an
        "Install" icon waiting.
      </p>
    </div>
  `;

  if (isDesktop) {
    wireStickCheck();
    if (ISO_CATALOG[topPick.id]) {
      wireDownload(topPick);
      wireFlash(topPick);
      revealFlashIfIsoPresent(topPick);
    }
  }
}

// If the ISO was downloaded in an earlier session, skip straight to writing.
async function revealFlashIfIsoPresent(topPick) {
  const iso = ISO_CATALOG[topPick.id];
  const status = await window.pcrescue.checkIso(iso);
  if (!status.present) return;
  const button = document.getElementById("wizard-download");
  if (button && !button.hidden) {
    const done = document.getElementById("wizard-dl-done");
    document.getElementById("wizard-dl-done-text").textContent =
      `Already downloaded — it's at ${status.path}.`;
    done.hidden = false;
    button.hidden = true;
  }
  showFlashArea();
}

function showFlashArea() {
  const area = document.getElementById("wizard-flash-area");
  if (area && area.hidden) {
    area.hidden = false;
    document.getElementById("wizard-flash-refresh").click();
  }
}

function downloadSectionTemplate(topPick, isDesktop) {
  const iso = ISO_CATALOG[topPick.id];
  const manualSteps = `
      <ol class="wizard-substeps">
        <li>
          Download ${topPick.name}${topPick.edition ? ` (${topPick.edition})` : ""}
          from the official site:
          <a href="${topPick.downloadUrl ?? topPick.website}" target="_blank" rel="noopener">
            ${(topPick.downloadUrl ?? topPick.website).replace("https://", "")}
          </a>
          — it's one big file (a few GB), so let it finish.
        </li>
        <li>
          Download <a href="https://etcher.balena.io" target="_blank" rel="noopener">
          balenaEtcher</a> (free) — a simple tool trusted by millions for
          exactly this job.
        </li>
        <li>
          Open Etcher: pick the file you downloaded, pick your USB stick,
          click <strong>Flash</strong>. It double-checks everything when done.
        </li>
      </ol>`;

  if (!iso || !isDesktop) {
    return `
      <p>
        One day this app will do this step for you. Until then, the honest
        truth is you'll use two trusted free tools — it's a 15-minute job:
      </p>
      ${manualSteps}`;
  }

  return `
      <p>
        We can fetch ${topPick.name} ${iso.version} for you from its official
        home and double-check the copy is perfect (about ${iso.approxGB} GB —
        give it time on slower internet):
      </p>
      <div class="button-row">
        <button type="button" id="wizard-download" class="btn btn-primary">
          Download it for me
        </button>
        <button type="button" id="wizard-cancel-download" class="btn btn-quiet" hidden>
          Cancel
        </button>
      </div>
      <div id="wizard-dl-progress-wrap" hidden>
        <progress id="wizard-dl-progress" max="100" value="0"></progress>
        <p id="wizard-dl-progress-text"></p>
      </div>
      <div id="wizard-dl-done" class="note note-good-news" hidden>
        <span class="note-icon" aria-hidden="true">✅</span>
        <div>
          <h4>Downloaded and checked — it's perfect</h4>
          <p id="wizard-dl-done-text"></p>
        </div>
      </div>
      <p class="form-error" id="wizard-dl-error" role="alert" hidden></p>

      <div id="wizard-flash-area" hidden>
        <h3 class="flash-title">Write it to your stick</h3>
        <p>
          <strong>This erases everything on the stick</strong> and turns it
          into a ${topPick.name} installer. Windows will show a permission
          prompt — that's us asking for the access needed to write it.
        </p>
        <div class="button-row">
          <button type="button" id="wizard-flash-refresh" class="btn btn-quiet">
            Look for sticks
          </button>
        </div>
        <div id="wizard-flash-sticks" role="radiogroup" aria-label="Choose the stick to erase"></div>
        <label class="choice">
          <input type="checkbox" id="wizard-flash-consent" />
          <span class="choice-text">I understand everything on this stick will be erased</span>
        </label>
        <div class="button-row">
          <button type="button" id="wizard-flash-button" class="btn btn-primary" disabled>
            Erase the stick and write
          </button>
        </div>
        <div id="wizard-flash-progress-wrap" hidden>
          <progress id="wizard-flash-progress" max="100" value="0"></progress>
          <p id="wizard-flash-progress-text"></p>
        </div>
        <div id="wizard-flash-done" class="note note-good-news" hidden>
          <span class="note-icon" aria-hidden="true">🎉</span>
          <div>
            <h4>The stick is ready</h4>
            <p>
              We wrote it and read every bit back to make sure it's perfect.
              Windows may pop up asking to format the stick — just close
              those; the stick is exactly as it should be. On to step 4!
            </p>
          </div>
        </div>
        <p class="form-error" id="wizard-flash-error" role="alert" hidden></p>
        <p class="question-help">
          Prefer the well-known
          <a href="https://etcher.balena.io" target="_blank" rel="noopener">balenaEtcher</a>
          tool instead? That works too — point it at the file in your
          Downloads folder.
        </p>
      </div>`;
}

function wireDownload(topPick) {
  const iso = ISO_CATALOG[topPick.id];
  const button = document.getElementById("wizard-download");
  const cancelBtn = document.getElementById("wizard-cancel-download");
  const wrap = document.getElementById("wizard-dl-progress-wrap");
  const bar = document.getElementById("wizard-dl-progress");
  const text = document.getElementById("wizard-dl-progress-text");
  const errorEl = document.getElementById("wizard-dl-error");

  window.pcrescue.onDownloadProgress((p) => {
    if (p.totalBytes) bar.value = (p.doneBytes / p.totalBytes) * 100;
    const doneGB = (p.doneBytes / 1024 ** 3).toFixed(2);
    const totalGB = p.totalBytes ? (p.totalBytes / 1024 ** 3).toFixed(2) : "?";
    text.textContent = `Downloaded ${doneGB} GB of ${totalGB} GB…`;
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    cancelBtn.hidden = false;
    errorEl.hidden = true;
    wrap.hidden = false;
    bar.value = 0;
    text.textContent = "Connecting…";

    const result = await window.pcrescue.downloadIso(iso);

    cancelBtn.hidden = true;
    if (!result.ok) {
      wrap.hidden = true;
      button.disabled = false;
      button.textContent = "Try the download again";
      errorEl.textContent = result.reason ?? "The download didn't work — try again.";
      errorEl.hidden = false;
      return;
    }
    bar.value = 100;
    text.textContent = "";
    wrap.hidden = true;
    button.hidden = true;
    const done = document.getElementById("wizard-dl-done");
    document.getElementById("wizard-dl-done-text").textContent =
      `Saved to ${result.path}.`;
    done.hidden = false;
    showFlashArea();
  });

  cancelBtn.addEventListener("click", () => {
    window.pcrescue.cancelIsoDownload();
  });
}

const FLASH_STAGE_TEXT = {
  "checking-file": "Checking the downloaded file is still perfect…",
  preparing: "Preparing the stick…",
  writing: "Writing",
  "checking-stick": "Double-checking the stick",
};

function wireFlash(topPick) {
  const iso = ISO_CATALOG[topPick.id];
  const refreshBtn = document.getElementById("wizard-flash-refresh");
  const sticksEl = document.getElementById("wizard-flash-sticks");
  const consent = document.getElementById("wizard-flash-consent");
  const flashBtn = document.getElementById("wizard-flash-button");
  const wrap = document.getElementById("wizard-flash-progress-wrap");
  const bar = document.getElementById("wizard-flash-progress");
  const text = document.getElementById("wizard-flash-progress-text");
  const errorEl = document.getElementById("wizard-flash-error");

  function updateButtonState() {
    const chosen = document.querySelector('input[name="flash-stick"]:checked');
    flashBtn.disabled = !(chosen && consent.checked);
  }

  refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Looking…";
    const sticks = await window.pcrescue.listUsbSticks();
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Look again";
    const usable = (Array.isArray(sticks) ? sticks : []).filter(
      (s) => s.sizeGB >= MIN_STICK_GB
    );
    if (usable.length === 0) {
      sticksEl.innerHTML = `<p class="question-help">No suitable stick found —
        plug in one of ${MIN_STICK_LABEL} or more and click "Look again".</p>`;
    } else {
      sticksEl.innerHTML = usable
        .map(
          (s) => `
          <label class="choice">
            <input type="radio" name="flash-stick" value="${s.diskNumber}" />
            <span class="choice-text">${s.friendlyName || "USB drive"} — ${s.sizeGB} GB</span>
          </label>`
        )
        .join("");
    }
    updateButtonState();
  });

  sticksEl.addEventListener("change", updateButtonState);
  consent.addEventListener("change", updateButtonState);

  window.pcrescue.onFlashProgress((p) => {
    const label = FLASH_STAGE_TEXT[p.stage] ?? p.stage;
    if (p.stage === "writing" || p.stage === "checking-stick") {
      if (p.totalBytes) bar.value = (p.doneBytes / p.totalBytes) * 100;
      const doneGB = (p.doneBytes / 1024 ** 3).toFixed(2);
      const totalGB = (p.totalBytes / 1024 ** 3).toFixed(2);
      text.textContent = `${label} — ${doneGB} GB of ${totalGB} GB`;
    } else {
      bar.removeAttribute("value");
      text.textContent = label;
    }
  });

  flashBtn.addEventListener("click", async () => {
    const chosen = document.querySelector('input[name="flash-stick"]:checked');
    if (!chosen) return;
    flashBtn.disabled = true;
    refreshBtn.disabled = true;
    consent.disabled = true;
    errorEl.hidden = true;
    wrap.hidden = false;
    bar.removeAttribute("value");
    text.textContent = "Waiting for the Windows permission prompt…";

    const result = await window.pcrescue.flashIso(Number(chosen.value), iso);

    if (!result.ok) {
      wrap.hidden = true;
      flashBtn.disabled = false;
      refreshBtn.disabled = false;
      consent.disabled = false;
      errorEl.textContent = result.reason ?? "The write didn't work — nothing to worry about, try again.";
      errorEl.hidden = false;
      return;
    }
    bar.value = 100;
    wrap.hidden = true;
    flashBtn.hidden = true;
    document.getElementById("wizard-flash-done").hidden = false;
  });
}

function wireStickCheck() {
  const button = document.getElementById("wizard-check-sticks");
  const listEl = document.getElementById("wizard-sticks");
  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Looking…";
    const sticks = await window.pcrescue.listUsbSticks();
    button.disabled = false;
    button.textContent = "Check again";
    if (!Array.isArray(sticks) || sticks.length === 0) {
      listEl.innerHTML = `<p class="question-help">No USB stick found — plug
        one in and click "Check again".</p>`;
      return;
    }
    listEl.innerHTML = sticks
      .map((stick) => {
        const bigEnough = stick.sizeGB >= MIN_STICK_GB;
        return `
        <div class="note ${bigEnough ? "note-good-news" : "note-heads-up"}">
          <span class="note-icon" aria-hidden="true">${bigEnough ? "👍" : "⚠️"}</span>
          <div>
            <h4>${stick.friendlyName || "USB drive"} — ${stick.sizeGB} GB</h4>
            <p>${
              bigEnough
                ? "Big enough — this one will do nicely. Double-check there's nothing on it you want to keep."
                : `Too small, sorry — you need ${MIN_STICK_LABEL} and this one holds ${stick.sizeGB} GB.`
            }</p>
          </div>
        </div>`;
      })
      .join("");
  });
}
