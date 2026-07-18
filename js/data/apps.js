// Catalog of common Windows programs and their honest Linux verdicts.
// `match` holds lowercase substrings tested against installed-program names
// from the registry scan (electron/scan/apps.ps1) — keep them specific
// enough to avoid false positives (e.g. "google chrome", not "chrome").
//
// Verdicts: native | web | alternative | tricky | no-go

export const VERDICTS = {
  native: {
    icon: "✅",
    title: "Will work — same program, free Linux version",
    blurb: "These install on Linux just like on Windows, free.",
  },
  web: {
    icon: "🌐",
    title: "Works in your web browser",
    blurb: "No program to install — you use these at their website, same as many people already do on Windows.",
  },
  alternative: {
    icon: "🔄",
    title: "Free replacement, included or one click away",
    blurb: "The Windows program doesn't run here, but a well-regarded free equivalent does.",
  },
  tricky: {
    icon: "⚠️",
    title: "Possible, but fiddly — for confident users",
    blurb: "These can be made to work, but it takes patience. Be honest with yourself about whether you'd enjoy that.",
  },
  "no-go": {
    icon: "❌",
    title: "Won't work — the honest truth",
    blurb: "No good way to run these on Linux today. If one of these is essential to you, that matters more than anything else on this page.",
  },
};

export const APP_CATALOG = [
  // Browsers
  { id: "chrome", name: "Google Chrome", match: ["google chrome"], verdict: "native",
    advice: "Installs on Linux and syncs your bookmarks and passwords when you sign in." },
  { id: "firefox", name: "Firefox", match: ["mozilla firefox", "firefox"], verdict: "native",
    advice: "Comes pre-installed on nearly every Linux system." },
  { id: "edge", name: "Microsoft Edge", match: ["microsoft edge"], verdict: "native",
    advice: "Microsoft makes a Linux version — sign in and your favourites follow you." },
  { id: "brave", name: "Brave", match: ["brave"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "opera", name: "Opera", match: ["opera"], verdict: "native",
    advice: "Official Linux version available." },

  // Office & documents
  { id: "office", name: "Microsoft Office (Word, Excel, PowerPoint)",
    match: ["microsoft office", "microsoft 365", "office 16", "office 15"], verdict: "web",
    advice: "The installed programs don't run on Linux. Use free Office at office.com, or LibreOffice (included) which opens Word and Excel files." },
  { id: "outlook", name: "Outlook", match: ["microsoft outlook"], verdict: "web",
    advice: "Use outlook.com in the browser, or the included Thunderbird mail program." },
  { id: "onenote", name: "OneNote", match: ["onenote"], verdict: "web",
    advice: "Works fully at onenote.com — your notebooks are already there." },
  { id: "teams", name: "Microsoft Teams", match: ["microsoft teams", "teams machine"], verdict: "web",
    advice: "Runs in the browser at teams.microsoft.com; calls and video work." },
  { id: "acrobat", name: "Adobe Acrobat / PDF Reader", match: ["adobe acrobat", "adobe reader"], verdict: "alternative",
    advice: "Every Linux system opens PDFs out of the box. For editing, free tools like PDF Arranger cover the basics." },
  { id: "notepadpp", name: "Notepad++", match: ["notepad++"], verdict: "alternative",
    advice: "Similar free editors (Kate, gedit) come built in; Notepad++ itself can also run via a compatibility layer." },

  // Cloud storage
  { id: "onedrive", name: "OneDrive", match: ["onedrive"], verdict: "tricky",
    advice: "Microsoft doesn't make a Linux version. Files stay reachable at onedrive.com; automatic folder syncing needs third-party tools." },
  { id: "gdrive", name: "Google Drive", match: ["google drive"], verdict: "web",
    advice: "Use drive.google.com; several Linux systems can also connect your Google account for file access." },
  { id: "dropbox", name: "Dropbox", match: ["dropbox"], verdict: "native",
    advice: "Official Linux app with full folder syncing." },

  // Communication
  { id: "zoom", name: "Zoom", match: ["zoom"], verdict: "native",
    advice: "Official Linux app, works the same." },
  { id: "slack", name: "Slack", match: ["slack"], verdict: "native",
    advice: "Official Linux app available." },
  { id: "discord", name: "Discord", match: ["discord"], verdict: "native",
    advice: "Official Linux app available." },
  { id: "whatsapp", name: "WhatsApp Desktop", match: ["whatsapp"], verdict: "web",
    advice: "Use web.whatsapp.com — same chats, synced from your phone." },
  { id: "telegram", name: "Telegram", match: ["telegram"], verdict: "native",
    advice: "Official Linux app available." },

  // Media
  { id: "spotify", name: "Spotify", match: ["spotify"], verdict: "native",
    advice: "Official Linux app, plus it works in the browser." },
  { id: "vlc", name: "VLC Media Player", match: ["vlc"], verdict: "native",
    advice: "VLC started on Linux — it's right at home." },
  { id: "itunes", name: "iTunes / Apple Devices", match: ["itunes", "apple mobile device", "apple software update"], verdict: "no-go",
    advice: "iTunes doesn't run on Linux, and syncing an iPhone or iPad by cable won't work. Music can be played at music.apple.com, but device backups need a Windows or Mac machine." },
  { id: "audacity", name: "Audacity", match: ["audacity"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "obs", name: "OBS Studio", match: ["obs studio"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "kindle", name: "Amazon Kindle", match: ["amazon kindle", "kindle"], verdict: "web",
    advice: "Read at read.amazon.com; the free Calibre app manages e-book files nicely on Linux." },

  // Photo & video editing
  { id: "photoshop", name: "Adobe Photoshop", match: ["adobe photoshop"], verdict: "alternative",
    advice: "Photoshop doesn't run on Linux. GIMP (free) covers most everyday editing; there's a learning curve for heavy users." },
  { id: "lightroom", name: "Adobe Lightroom", match: ["lightroom"], verdict: "alternative",
    advice: "Darktable (free) is the closest equivalent for photo cataloguing and RAW editing." },
  { id: "premiere", name: "Adobe Premiere", match: ["adobe premiere"], verdict: "alternative",
    advice: "Kdenlive (free) handles everyday video editing; DaVinci Resolve (free tier) is the professional option with a real Linux version." },
  { id: "illustrator", name: "Adobe Illustrator", match: ["adobe illustrator"], verdict: "alternative",
    advice: "Inkscape (free) is the standard vector-drawing alternative." },
  { id: "paintnet", name: "Paint.NET", match: ["paint.net"], verdict: "alternative",
    advice: "Pinta (free) was modelled directly on it." },
  { id: "canva", name: "Canva", match: ["canva"], verdict: "web",
    advice: "Canva is a website — works exactly the same." },

  // Gaming
  { id: "steam", name: "Steam", match: ["steam"], verdict: "native",
    advice: "Official Linux app. Many games run via its built-in Proton layer — check yours at protondb.com. Games with strict anti-cheat are the main exception." },
  { id: "epic", name: "Epic Games Launcher", match: ["epic games"], verdict: "tricky",
    advice: "No official Linux version; the community-made Heroic launcher runs many Epic games, but it's tinkering territory." },
  { id: "minecraft", name: "Minecraft", match: ["minecraft"], verdict: "native",
    advice: "Official Linux version of Minecraft: Java Edition available." },
  { id: "riot", name: "League of Legends / Valorant", match: ["riot", "league of legends", "valorant"], verdict: "no-go",
    advice: "Riot's anti-cheat blocks Linux entirely." },
  { id: "roblox", name: "Roblox", match: ["roblox"], verdict: "no-go",
    advice: "Roblox's anti-cheat blocks Linux." },

  // Utilities & tools
  { id: "7zip", name: "7-Zip", match: ["7-zip"], verdict: "alternative",
    advice: "Not needed — Linux opens zip, 7z and rar files out of the box." },
  { id: "winrar", name: "WinRAR", match: ["winrar"], verdict: "alternative",
    advice: "Not needed — archive handling is built in." },
  { id: "ccleaner", name: "CCleaner", match: ["ccleaner"], verdict: "alternative",
    advice: "Not needed — Linux doesn't accumulate clutter the way Windows does." },
  { id: "antivirus", name: "Antivirus (Norton, McAfee, Avast…)",
    match: ["norton", "mcafee", "avast", "avg ", "kaspersky", "bitdefender"], verdict: "alternative",
    advice: "Generally not needed on Linux for everyday use — and that's one subscription you can cancel." },
  { id: "teamviewer", name: "TeamViewer", match: ["teamviewer"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "anydesk", name: "AnyDesk", match: ["anydesk"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "vscode", name: "Visual Studio Code", match: ["visual studio code", "microsoft vs code"], verdict: "native",
    advice: "Official Linux version available." },
  { id: "thunderbird", name: "Thunderbird", match: ["thunderbird"], verdict: "native",
    advice: "Comes pre-installed on many Linux systems." },

  // Finance
  { id: "quicken", name: "Quicken", match: ["quicken"], verdict: "no-go",
    advice: "No Linux version and no reliable workaround. The web version (Quicken on the Web) covers some, not all, features." },
  { id: "quickbooks", name: "QuickBooks", match: ["quickbooks"], verdict: "web",
    advice: "QuickBooks Online works fully in the browser; the desktop edition does not run on Linux." },
];

// Returns the catalog entries whose match strings appear in any of the
// installed-program names reported by the registry scan.
export function matchInstalledApps(installedNames) {
  const haystack = installedNames.map((n) => n.toLowerCase());
  return APP_CATALOG.filter((app) =>
    app.match.some((needle) => haystack.some((name) => name.includes(needle)))
  ).map((app) => app.id);
}
