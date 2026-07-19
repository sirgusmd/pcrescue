// Direct ISO downloads with pinned SHA-256 checksums, keyed by distro id
// (see js/data/distros.js). Only distros with a STABLE official direct URL
// get an entry — anything absent falls back to the wizard's manual
// instructions. The app refuses to keep a download whose hash doesn't match.
//
// MAINTENANCE: these pin specific versions and must be refreshed when a new
// release lands. Verified 2026-07-20 against:
//   - https://mirrors.edge.kernel.org/linuxmint/stable/22.3/sha256sum.txt
//   - https://releases.ubuntu.com/26.04/SHA256SUMS
//   - https://cdimage.ubuntu.com/lubuntu/releases/26.04/release/SHA256SUMS
// Zorin OS: checksums are published (help.zorin.com) but downloads go
// through their website flow with no stable direct URL — manual fallback.

export const ISO_CATALOG = {
  "mint-xfce": {
    version: "22.3",
    filename: "linuxmint-22.3-xfce-64bit.iso",
    url: "https://mirrors.edge.kernel.org/linuxmint/stable/22.3/linuxmint-22.3-xfce-64bit.iso",
    sha256: "45a835b5dddaf40e84d776549e0b19b3fbd49673b6cc6434ebddbfcd217df776",
    approxGB: 3,
  },
  "mint-cinnamon": {
    version: "22.3",
    filename: "linuxmint-22.3-cinnamon-64bit.iso",
    url: "https://mirrors.edge.kernel.org/linuxmint/stable/22.3/linuxmint-22.3-cinnamon-64bit.iso",
    sha256: "a081ab202cfda17f6924128dbd2de8b63518ac0531bcfe3f1a1b88097c459bd4",
    approxGB: 3,
  },
  "lubuntu": {
    version: "26.04",
    filename: "lubuntu-26.04-desktop-amd64.iso",
    url: "https://cdimage.ubuntu.com/lubuntu/releases/26.04/release/lubuntu-26.04-desktop-amd64.iso",
    sha256: "a9eef9e75c139caa428d11799f681e2d29e6ba7e22aa045d9a64599d45cd12ff",
    approxGB: 3.5,
  },
  "ubuntu": {
    version: "26.04",
    filename: "ubuntu-26.04-desktop-amd64.iso",
    url: "https://releases.ubuntu.com/26.04/ubuntu-26.04-desktop-amd64.iso",
    sha256: "487f87faaf547ea30e0aba4d5b53346292571256b25333a978db1692bcee9dd2",
    approxGB: 6,
  },
};
