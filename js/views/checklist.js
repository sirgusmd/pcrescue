// Checklist view: renders the two questions from data definitions and keeps
// the form in sync with app state so answers survive back-navigation.

import { AGE_OPTIONS, APP_OPTIONS } from "../data/distros.js";

export function initChecklist({ state, onBack, onSubmit }) {
  const container = document.getElementById("checklist-questions");
  container.innerHTML = `
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

    <p class="form-error" id="age-error" role="alert" hidden>
      Please pick your computer's age (or "I'm not sure") so we can match a
      system to it.
    </p>
  `;

  const form = document.getElementById("checklist-form");
  const errorEl = document.getElementById("age-error");

  // Restore previous answers when returning to this view.
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
    onSubmit({ age, apps });
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
  }

  return { syncFromState };
}
