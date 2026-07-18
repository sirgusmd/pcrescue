// Catalog of recommendable systems. All user-facing copy lives here or in
// engine/recommend.js so the views stay purely presentational.
// Swapping a distro (e.g. when Zorin OS Lite sunsets after Zorin 19) is a
// one-entry change here plus the tier tables in engine/recommend.js.

export const DISTROS = {
  "mint-xfce": {
    name: "Linux Mint",
    edition: "Xfce Edition",
    tagline: "Light, simple, and dependable",
    description:
      "A gentle, familiar system with a menu and taskbar right where you'd " +
      "expect them. The Xfce edition is specially tuned to stay quick on " +
      "older computers.",
    website: "https://linuxmint.com",
  },
  "mint-cinnamon": {
    name: "Linux Mint",
    edition: "Cinnamon Edition",
    tagline: "The friendly all-rounder",
    description:
      "Polished, comfortable, and easy to learn. One of the most " +
      "recommended systems for people moving on from Windows.",
    website: "https://linuxmint.com",
  },
  "lubuntu": {
    name: "Lubuntu",
    edition: "",
    tagline: "Featherweight and fast",
    description:
      "One of the lightest systems around — a good fit when speed on an " +
      "older machine matters most.",
    website: "https://lubuntu.me",
  },
  "zorin-lite": {
    name: "Zorin OS",
    edition: "Lite",
    tagline: "Windows-like, made light",
    description:
      "Designed to look and feel like Windows, in a slimmed-down version " +
      "built for older computers.",
    website: "https://zorin.com/os",
  },
  "zorin-core": {
    name: "Zorin OS",
    edition: "Core",
    tagline: "Looks and feels like Windows",
    description:
      "Made especially for people switching from Windows — everything is " +
      "where you'd expect, so there's very little to relearn.",
    website: "https://zorin.com/os",
  },
  "ubuntu": {
    name: "Ubuntu",
    edition: "",
    tagline: "The most popular choice",
    description:
      "The world's best-known free system, with a huge community — almost " +
      "any question you have has already been answered online.",
    website: "https://ubuntu.com",
  },
  "popos": {
    name: "Pop!_OS",
    edition: "",
    tagline: "A favourite for gaming",
    description:
      "Built with PC gaming in mind — Steam and graphics drivers are well " +
      "looked after. Its modern desktop looks a little different from " +
      "Windows, so expect a short settling-in period.",
    website: "https://system76.com/pop",
  },
};

// Checklist question definitions (rendered by views/checklist.js).
export const AGE_OPTIONS = [
  { id: "lt5", label: "Less than 5 years old" },
  { id: "5to10", label: "5 to 10 years old" },
  { id: "10plus", label: "More than 10 years old" },
  {
    id: "unsure",
    label: "I'm not sure",
    hint:
      "Clues: if it has a DVD drive, or originally came with Windows 7 or 8, " +
      "it's probably more than 10 years old.",
  },
];

export const APP_OPTIONS = [
  { id: "browsing", label: "Browsing the web" },
  { id: "email", label: "Email & video calls" },
  { id: "office", label: "Microsoft Office documents (Word, Excel)" },
  { id: "streaming", label: "YouTube & streaming" },
  { id: "gaming", label: "Steam / PC games" },
  { id: "photos", label: "Photo editing" },
];
