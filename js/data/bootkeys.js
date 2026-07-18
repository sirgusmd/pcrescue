// Boot-menu keys by PC manufacturer — the #1 novice drop-off point in the
// whole journey, which is why the app shows the user THEIR key rather than
// a generic list. Matched against the scanned Win32_ComputerSystem
// Manufacturer string (lowercased substring).

export const BOOT_KEYS = [
  {
    match: ["dell"],
    key: "F12",
    note: "Tap it repeatedly as soon as the Dell logo appears.",
  },
  {
    match: ["hewlett", "hp"],
    key: "F9",
    note: "If nothing happens, restart and tap Esc instead, then choose the boot menu.",
  },
  {
    match: ["lenovo"],
    key: "F12",
    note:
      "Some Lenovo laptops instead have a tiny button (or pinhole) next to " +
      "the power socket called the Novo button — press it with the machine off.",
  },
  {
    match: ["acer"],
    key: "F12",
    note:
      "On some Acers F12 is switched off from the factory: restart, tap F2, " +
      'find "F12 Boot Menu" in the settings and set it to Enabled first.',
  },
  {
    match: ["asus"],
    key: "F8",
    note: "On some models it's Esc instead.",
  },
  { match: ["toshiba", "dynabook"], key: "F12", note: "" },
  { match: ["samsung"], key: "Esc", note: "On some models it's F10." },
  { match: ["msi", "micro-star"], key: "F11", note: "" },
  {
    match: ["microsoft"],
    key: "Volume Down",
    note:
      "Surface devices: with the machine off, hold Volume Down, press and " +
      "release the power button, and keep holding Volume Down until it starts.",
  },
];

const FALLBACK = {
  key: "F12 or Esc",
  note:
    "Those are the two most common keys. Restart and tap one repeatedly the " +
    "moment the maker's logo appears; if a menu doesn't come up, try the other.",
};

export function bootKeyFor(manufacturer) {
  if (!manufacturer) return FALLBACK;
  const name = manufacturer.toLowerCase();
  for (const entry of BOOT_KEYS) {
    if (entry.match.some((needle) => name.includes(needle))) return entry;
  }
  return FALLBACK;
}
