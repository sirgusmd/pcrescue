// App entry point: holds the answer state and switches between the three
// views. Views live in js/views/, the recommendation logic in js/engine/.

import { initWelcome } from "./views/welcome.js";
import { initChecklist } from "./views/checklist.js";
import { renderResults, initResults } from "./views/results.js";
import { recommend } from "./engine/recommend.js";

const state = {
  age: null,
  apps: new Set(),
  programs: new Set(),
};

const views = ["welcome", "checklist", "results"];

function show(name) {
  for (const view of views) {
    document.getElementById(`view-${view}`).hidden = view !== name;
  }
  window.scrollTo(0, 0);
  // Move focus to the view heading so keyboard and screen-reader users land
  // at the start of the new content.
  document.getElementById(`${name}-heading`).focus();
}

const checklist = initChecklist({
  state,
  onBack: () => show("welcome"),
  onSubmit: ({ age, apps, programs }) => {
    state.age = age;
    state.apps = new Set(apps);
    state.programs = new Set(programs);
    renderResults(recommend(state));
    show("results");
  },
});

initWelcome({
  onStart: () => {
    checklist.syncFromState();
    show("checklist");
  },
});

initResults({
  onBack: () => {
    checklist.syncFromState();
    show("checklist");
  },
});
