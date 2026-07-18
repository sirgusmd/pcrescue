// USB Flash Wizard — the SAFE parts only. This view detects USB sticks,
// gives honest manual instructions for downloading and writing the system,
// and shows the machine-specific boot-menu key. It contains NO code that
// writes to any drive; the automated write step is specced in ROADMAP.md
// and must follow the safety rules there.

import { bootKeyFor } from "../data/bootkeys.js";

const MIN_STICK_GB = 8;

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
        You need a stick of <strong>${MIN_STICK_GB} GB or more</strong>.
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
      <p>
        One day this app will do this step for you. Until then, the honest
        truth is you'll use two trusted free tools — it's a 15-minute job:
      </p>
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
      </ol>
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

  if (isDesktop) wireStickCheck();
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
                : `Too small, sorry — you need ${MIN_STICK_GB} GB and this one holds ${stick.sizeGB} GB.`
            }</p>
          </div>
        </div>`;
      })
      .join("");
  });
}
