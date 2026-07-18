// Results view: renders the recommendation returned by engine/recommend.js.

import { VERDICTS } from "../data/apps.js";
import { VERDICT_ORDER } from "../engine/recommend.js";

const NOTE_ICONS = {
  "heads-up": "💡",
  "good-news": "🧪",
  important: "🗂️",
};

export function renderResults(recommendation) {
  const { topPick, alternatives, notes } = recommendation;
  const container = document.getElementById("results-content");

  container.innerHTML = `
    <div class="card card-top-pick">
      <p class="badge">Our top pick for you</p>
      <h2 class="distro-name">${distroTitle(topPick)}</h2>
      <p class="distro-tagline">${topPick.tagline}</p>
      <p>${topPick.description}</p>
      <h3>Why this fits your computer</h3>
      <ul class="reasons">
        ${topPick.reasons.map((r) => `<li>${r}</li>`).join("")}
      </ul>
      <a class="distro-link" href="${topPick.website}" target="_blank" rel="noopener">
        Visit the ${topPick.name} website &rarr;
      </a>
    </div>

    <h3 class="alternatives-heading">Also worth a look</h3>
    <div class="alternatives">
      ${alternatives
        .map(
          (alt) => `
        <div class="card card-alt">
          <h4 class="distro-name">${distroTitle(alt)}</h4>
          <p class="distro-tagline">${alt.tagline}</p>
          <p class="distro-description">${alt.description}</p>
          <a class="distro-link" href="${alt.website}" target="_blank" rel="noopener">
            Learn more &rarr;
          </a>
        </div>`
        )
        .join("")}
    </div>

    ${programReportSection(recommendation.programReport)}

    <h3 class="notes-heading">Good to know before you switch</h3>
    <div class="notes">
      ${notes
        .map(
          (note) => `
        <div class="note note-${note.tone}">
          <span class="note-icon" aria-hidden="true">${NOTE_ICONS[note.tone] ?? "ℹ️"}</span>
          <div>
            <h4>${note.title}</h4>
            <p>${note.body}</p>
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

export function initResults({ onBack }) {
  document.getElementById("results-back").addEventListener("click", onBack);
}

function distroTitle(distro) {
  return distro.edition ? `${distro.name} <small>(${distro.edition})</small>` : distro.name;
}

function programReportSection(report) {
  const groups = VERDICT_ORDER.filter((v) => report?.[v]?.length);
  if (groups.length === 0) return "";
  return `
    <h3 class="programs-heading">Your programs on Linux</h3>
    <div class="programs-report">
      ${groups
        .map((verdict) => {
          const meta = VERDICTS[verdict];
          return `
          <div class="verdict-group verdict-${verdict}">
            <h4>
              <span aria-hidden="true">${meta.icon}</span>
              ${meta.title}
            </h4>
            <p class="verdict-blurb">${meta.blurb}</p>
            <ul>
              ${report[verdict]
                .map(
                  (app) => `
                <li>
                  <strong>${app.name}</strong>
                  <span class="program-advice">${app.advice}</span>
                </li>`
                )
                .join("")}
            </ul>
          </div>`;
        })
        .join("")}
    </div>`;
}
