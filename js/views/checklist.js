// Checklist view: renders the questions from data definitions and keeps the
// form in sync with app state so answers survive back-navigation.
// In the desktop app (window.pcrescue present) it also offers a one-click
// hardware + programs scan that pre-fills the answers.

import { AGE_OPTIONS, APP_OPTIONS } from "../data/distros.js";
import { APP_CATALOG, matchInstalledApps } from "../data/apps.js";
import { interpretScan } from "../engine/interpret-scan.js";

const isDesktop = () => typeof window.pcrescue !== "undefined";

export function initChecklist({ state, onBack, onSubmit }) {
  const container = document.getElementById("checklist-questions");
  container.innerHTML = `
    ${isDesktop() ? scanPanelTemplate() : ""}

    <fieldset class="question" aria-describedby="age-error">
      <legend>How old is your computer?</legend>
      <p class="question-help">A rough guess is fine.</p>
      ${AGE_OPTIONS.map(
        (opt) => `
        <label class="choice">
          <input type="radio" name="age" value="${opt.id}" />
          <span class="choice-text">
            ${opt.label}
            ${opt.hint ? `<small class="choice-hint">${opt.hint}</small>` : ""}
          </span>
        </label>`
      ).join("")}
    </fieldset>

    <fieldset class="question">
      <legend>What do you use your computer for?</legend>
      <p class="question-help">Tick everything that applies.</p>
      ${APP_OPTIONS.map(
        (opt) => `
        <label class="choice">
          <input type="checkbox" name="apps" value="${opt.id}" />
          <span class="choice-text">${opt.label}</span>
        </label>`
      ).join("")}
    </fieldset>

    <fieldset class="question">
      <legend>Any specific programs you rely on? <span class="optional-tag">optional</span></legend>
      <p class="question-help">
        Tick the ones you'd want to keep using — we'll tell you honestly how
        each one fares on Linux.
      </p>
      <p class="scan-note" id="programs-scan-note" hidden></p>
      <input type="search" id="program-search" class="program-search"
             placeholder="Search programs…" aria-label="Search programs" />
      <div class="program-list" id="program-list">
        ${APP_CATALOG.map(
          (app) => `
          <label class="choice program-choice" data-name="${app.name.toLowerCase()}">
            <input type="checkbox" name="programs" value="${app.id}" />
            <span class="choice-text">${app.name}</span>
          </label>`
        ).join("")}
      </div>
    </fieldset>

    <p class="form-error" id="age-error" role="alert" hidden>
      Please pick your computer's age (or "I'm not sure") so we can match a
      system to it.
    </p>
  `;

  const form = document.getElementById("checklist-form");
  const errorEl = document.getElementById("age-error");

  // Program search filters the catalog list as you type.
  const searchInput = document.getElementById("program-search");
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    for (const row of document.querySelectorAll(".program-choice")) {
      row.hidden = term !== "" && !row.dataset.name.includes(term);
    }
  });

  if (isDesktop()) wireScanPanel(form);

  syncFromState();

  form.addEventListener("change", () => {
    errorEl.hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const age = form.querySelector('input[name="age"]:checked')?.value ?? null;
    if (!age) {
      errorEl.hidden = false;
      form.querySelector('input[name="age"]').focus();
      return;
    }
    const apps = [...form.querySelectorAll('input[name="apps"]:checked')].map(
      (el) => el.value
    );
    const programs = [...form.querySelectorAll('input[name="programs"]:checked')].map(
      (el) => el.value
    );
    onSubmit({ age, apps, programs });
  });

  document.getElementById("checklist-back").addEventListener("click", onBack);

  function syncFromState() {
    if (state.age) {
      const radio = form.querySelector(`input[name="age"][value="${state.age}"]`);
      if (radio) radio.checked = true;
    }
    for (const el of form.querySelectorAll('input[name="apps"]')) {
      el.checked = state.apps.has(el.value);
    }
    for (const el of form.querySelectorAll('input[name="programs"]')) {
      el.checked = state.programs.has(el.value);
    }
  }

  function scanPanelTemplate() {
    return `
      <div class="scan-panel">
        <div class="scan-panel-text">
          <h2>Let your computer answer for you</h2>
          <p>
            We can read your computer's basic details — its age, memory, and
            which programs are installed — and fill in the questions below.
            <strong>Nothing leaves your machine.</strong>
          </p>
        </div>
        <button type="button" id="scan-button" class="btn btn-primary">
          Scan my computer
        </button>
        <div class="scan-result" id="scan-result" hidden>
          <h3>What we found</h3>
          <ul id="scan-facts"></ul>
          <p class="scan-note">
            We've answered the age question for you below — feel free to
            change it.
          </p>
        </div>
      </div>`;
  }

  function wireScanPanel(formEl) {
    const button = document.getElementById("scan-button");
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Scanning… (a few seconds)";
      try {
        const [hardware, installedNames] = await Promise.all([
          window.pcrescue.scanHardware(),
          window.pcrescue.scanApps(),
        ]);

        const interpreted = interpretScan(hardware);
        if (interpreted) {
          const radio = formEl.querySelector(
            `input[name="age"][value="${interpreted.age}"]`
          );
          if (radio) radio.checked = true;
          document.getElementById("scan-facts").innerHTML = interpreted.facts
            .map((f) => `<li>${f}</li>`)
            .join("");
          document.getElementById("scan-result").hidden = false;
        }

        if (Array.isArray(installedNames)) {
          const found = matchInstalledApps(installedNames);
          for (const id of found) {
            const box = formEl.querySelector(`input[name="programs"][value="${id}"]`);
            if (box) box.checked = true;
          }
          const note = document.getElementById("programs-scan-note");
          if (found.length > 0) {
            note.textContent =
              `We found ${found.length} of your installed programs and ticked ` +
              `them below — untick any you don't care about.`;
            note.hidden = false;
          }
        }

        button.textContent = "Scan again";
      } catch (err) {
        console.error("Scan failed:", err);
        button.textContent = "Scan didn't work — answer below instead";
      } finally {
        button.disabled = false;
      }
    });
  }

  return { syncFromState };
}
