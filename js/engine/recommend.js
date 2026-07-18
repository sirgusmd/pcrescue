// The recommendation engine. Pure function, no DOM access — in the desktop
// version this same module will be fed real hardware-scan data instead of
// questionnaire answers.

import { DISTROS } from "../data/distros.js";
import { APP_CATALOG } from "../data/apps.js";

// Hardware-age tiers. Mint and Zorin headline because their Windows-like
// layouts suit people coming from Windows; Ubuntu's desktop is too heavy for
// 10+ year-old machines, so it only appears in the newer tiers.
const TIERS = {
  "10plus": { top: "mint-xfce", alts: ["lubuntu", "zorin-lite"] },
  "unsure": { top: "mint-xfce", alts: ["lubuntu", "zorin-lite"] },
  "5to10": { top: "mint-cinnamon", alts: ["zorin-core", "ubuntu"] },
  "lt5": { top: "zorin-core", alts: ["ubuntu", "mint-cinnamon"] },
};

const AGE_REASONS = {
  "10plus":
    "It's built to run smoothly on computers more than 10 years old — your " +
    "machine will likely feel faster than it does today.",
  "unsure":
    "It runs well on almost any computer, old or new, so it's a safe choice " +
    "when you're not sure of your machine's age.",
  "5to10":
    "It's a comfortable match for a computer of your machine's age — modern " +
    "features without weighing it down.",
  "lt5":
    "Your computer has plenty of power for it, so you get the full, polished " +
    "experience.",
};

const APP_REASONS = {
  browsing:
    "It comes with the Firefox web browser ready to go (and Chrome is easy " +
    "to add).",
  email:
    "Email, Zoom, Teams and Google Meet all work in the browser, just like " +
    "on Windows.",
  office:
    "It includes LibreOffice, a free program that opens and edits Word and " +
    "Excel files.",
  streaming: "YouTube, Netflix and other streaming sites work out of the box.",
  photos:
    "Free photo tools are one click away in its app store — no hunting for " +
    "downloads.",
  gaming: "Steam installs easily, and a large share of games run well on it.",
};

// Age tiers with enough power for Pop!_OS's modern desktop; on older
// machines the gaming swap is skipped and expectations are set instead.
const GAMING_CAPABLE_AGES = new Set(["lt5", "5to10"]);

// Honest-trade-off and reassurance callouts shown on the results screen.
function buildNotes(apps, age) {
  const notes = [];
  if (apps.has("office")) {
    notes.push({
      tone: "heads-up",
      title: "About Microsoft Office",
      body:
        "The Microsoft Office programs you install on Windows don't install " +
        "here. Instead you'll use LibreOffice (free and included — it opens " +
        "Word and Excel files) or Microsoft's own free Office in your web " +
        "browser at office.com. For everyday letters and spreadsheets, most " +
        "people don't notice the difference.",
    });
  }
  if (apps.has("gaming")) {
    let body =
      "Many Steam games run well thanks to a built-in translation layer " +
      "called Proton — but some online multiplayer games with anti-cheat " +
      "protection won't work. Before switching, check your favourite games " +
      "on protondb.com (a free compatibility checker).";
    if (!GAMING_CAPABLE_AGES.has(age)) {
      body +=
        " One honest note: a computer this age will struggle with newer 3D " +
        "games on any system — older and lighter games are the sweet spot.";
    }
    notes.push({ tone: "heads-up", title: "About your Steam games", body });
  }
  notes.push({
    tone: "good-news",
    title: "Try it without installing anything",
    body:
      "Every system we recommend can run straight from a USB stick without " +
      "touching your hard drive. You can browse, watch videos and get a real " +
      "feel for it — then simply restart, and your computer is exactly as it " +
      "was.",
  });
  notes.push({
    tone: "important",
    title: "Back up your files first",
    body:
      "Before installing anything, copy your photos, documents and anything " +
      "precious to an external drive or a cloud service (like Google Drive " +
      "or OneDrive). This is the golden rule of any computer change.",
  });
  return notes;
}

function buildReasons(age, apps) {
  const reasons = [AGE_REASONS[age] ?? AGE_REASONS["unsure"]];
  for (const appId of Object.keys(APP_REASONS)) {
    if (apps.has(appId)) reasons.push(APP_REASONS[appId]);
  }
  return reasons;
}

// Groups the user's chosen programs by verdict, in the order the results
// screen should present them (best news first, worst news last but never
// hidden).
export const VERDICT_ORDER = ["native", "web", "alternative", "tricky", "no-go"];

export function buildProgramReport(programIds) {
  const ids = new Set(programIds);
  const groups = {};
  for (const app of APP_CATALOG) {
    if (!ids.has(app.id)) continue;
    (groups[app.verdict] ??= []).push(app);
  }
  return groups;
}

/**
 * @param {{ age: string, apps: Iterable<string>, programs?: Iterable<string> }} answers
 * @returns {{ topPick: object, alternatives: object[], notes: object[], programReport: object }}
 */
export function recommend(answers) {
  const apps = new Set(answers.apps);
  const tier = TIERS[answers.age] ?? TIERS["unsure"];

  const alts = [...tier.alts];
  if (
    apps.has("gaming") &&
    GAMING_CAPABLE_AGES.has(answers.age) &&
    tier.top !== "popos" &&
    !alts.includes("popos")
  ) {
    alts[alts.length - 1] = "popos";
  }

  return {
    topPick: {
      id: tier.top,
      ...DISTROS[tier.top],
      reasons: buildReasons(answers.age, apps),
    },
    alternatives: alts.map((id) => ({ id, ...DISTROS[id] })),
    notes: buildNotes(apps, answers.age),
    programReport: buildProgramReport(answers.programs ?? []),
  };
}
