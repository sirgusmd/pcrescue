// Turns a raw hardware scan (from electron/scan/hardware.ps1) into the same
// answer shape the manual questionnaire produces, plus plain-English facts
// for display. Pure module — no DOM, no Electron.

// CPU launch year is the most reliable age signal: BIOS release dates get
// refreshed by BIOS updates (observed in the wild), so they only serve as a
// fallback.

const INTEL_CORE_GEN_YEAR = {
  1: 2010, 2: 2011, 3: 2012, 4: 2013, 5: 2014, 6: 2015, 7: 2016, 8: 2017,
  9: 2018, 10: 2019, 11: 2020, 12: 2021, 13: 2022, 14: 2023, 15: 2024,
};

const RYZEN_SERIES_YEAR = {
  1: 2017, 2: 2018, 3: 2019, 4: 2020, 5: 2020, 6: 2022, 7: 2022, 8: 2024, 9: 2024,
};

export function estimateCpuYear(cpuName) {
  if (!cpuName) return null;
  // Registry names look like "Intel(R) Core(TM) i7-3740QM CPU @ 2.70GHz" —
  // strip the trademark noise before pattern-matching.
  const name = cpuName.toLowerCase().replace(/\((r|tm)\)/g, "");

  // Intel Core iX-NNNN(N): leading digit(s) of the model number = generation.
  const coreMatch = name.match(/i[3579]-(\d{4,5})/);
  if (coreMatch) {
    const digits = coreMatch[1];
    const gen = digits.length === 5 ? Number(digits.slice(0, 2)) : Number(digits[0]);
    return INTEL_CORE_GEN_YEAR[gen] ?? null;
  }
  // First-gen Core (i5 750, i7-920) had 3-digit models, often written
  // with "CPU" in between.
  if (/\bi[357][\s-]+(cpu\s+)?\d{3}\b/.test(name)) return 2010;
  if (name.includes("core ultra")) return 2024;
  if (/core\s?2/.test(name)) return 2007;

  // AMD Ryzen N NNNN: leading digit of model number = series.
  const ryzenMatch = name.match(/ryzen\s+\d\s+(\d{4})/);
  if (ryzenMatch) {
    return RYZEN_SERIES_YEAR[Number(ryzenMatch[1][0])] ?? null;
  }
  if (/\bamd (fx|a\d{1,2}-)/.test(name)) return 2013;

  return null;
}

export function ageTierFromYear(year, nowYear = new Date().getFullYear()) {
  if (!year) return "unsure";
  const age = nowYear - year;
  if (age > 10) return "10plus";
  if (age >= 5) return "5to10";
  return "lt5";
}

/**
 * @param {object|null} scan  raw JSON from hardware.ps1, or null on failure
 * @returns {{ age: string, facts: string[], cpuYear: number|null }|null}
 */
export function interpretScan(scan) {
  if (!scan) return null;

  const cpuYear = estimateCpuYear(scan.cpuName) ?? scan.biosYear ?? null;
  let age = ageTierFromYear(cpuYear);

  // Very low memory overrides age: only the lightest systems will feel good.
  if (scan.ramGB && scan.ramGB < 4) age = "10plus";

  const facts = [];
  if (scan.manufacturer && scan.model) {
    facts.push(`${scan.manufacturer.replace(/ inc\.?$/i, "")} ${scan.model}`.trim());
  }
  if (scan.cpuName) {
    const cleanCpu = scan.cpuName
      .replace(/\(R\)|\(TM\)/g, "")
      .replace(/ CPU @.*$/, "")
      .trim();
    facts.push(cpuYear ? `${cleanCpu} (from around ${cpuYear})` : cleanCpu);
  }
  if (scan.ramGB) facts.push(`${Math.round(scan.ramGB)} GB of memory`);
  if (scan.diskType === "SSD") {
    facts.push("Fast SSD storage");
  } else if (scan.diskType) {
    facts.push("Traditional hard drive");
  }
  if (scan.diskFreeGB != null) facts.push(`${Math.round(scan.diskFreeGB)} GB free disk space`);
  if (scan.osCaption) facts.push(scan.osCaption.replace("Microsoft ", ""));

  return { age, facts, cpuYear };
}
