// ISO download engine: streams to the user's Downloads folder while hashing,
// and only keeps the file if the SHA-256 matches the pinned checksum. This is
// the app's ONLY network access, always user-initiated, and only from hosts
// on the allowlist below.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const https = require("https");

const ALLOWED_HOSTS = new Set([
  "mirrors.edge.kernel.org",
  "releases.ubuntu.com",
  "cdimage.ubuntu.com",
]);

let active = null; // { cancelled, request }

function cancelDownload() {
  if (active) {
    active.cancelled = true;
    active.request?.destroy();
  }
}

/**
 * @param {{url: string, sha256: string, filename: string}} entry
 * @param {string} downloadsDir
 * @param {(p: {doneBytes: number, totalBytes: number}) => void} onProgress
 */
function downloadIso(entry, downloadsDir, onProgress) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(entry.url);
    } catch {
      return resolve({ ok: false, reason: "Bad download address." });
    }
    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return resolve({ ok: false, reason: "Download address not on the trusted list." });
    }
    if (!/^[\w.-]+$/.test(entry.filename)) {
      return resolve({ ok: false, reason: "Bad file name." });
    }

    const destination = path.join(downloadsDir, entry.filename);
    const partPath = destination + ".part";
    const file = fs.createWriteStream(partPath);
    const hash = crypto.createHash("sha256");
    const state = { cancelled: false, request: null };
    active = state;

    let doneBytes = 0;
    let totalBytes = 0;
    let lastReport = 0;
    let settled = false;

    const fail = (reason) => {
      if (settled) return;
      settled = true;
      try {
        file.close(() => fs.rm(partPath, { force: true }, () => {}));
      } catch {}
      resolve({ ok: false, reason });
    };

    const get = (target, redirectsLeft) => {
      const request = https.get(target, (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.resume();
          if (redirectsLeft <= 0) return fail("Too many redirects.");
          let next;
          try {
            next = new URL(response.headers.location, target);
          } catch {
            return fail("Bad redirect from the download server.");
          }
          if (next.protocol !== "https:" || !ALLOWED_HOSTS.has(next.hostname)) {
            return fail("The server redirected somewhere we don't trust — stopped for safety.");
          }
          return get(next.toString(), redirectsLeft - 1);
        }
        if (status !== 200) {
          response.resume();
          return fail(`The download server answered with an error (${status}). Try again in a few minutes.`);
        }
        totalBytes = Number(response.headers["content-length"]) || 0;
        response.on("data", (chunk) => {
          hash.update(chunk);
          doneBytes += chunk.length;
          const now = Date.now();
          if (now - lastReport > 500) {
            lastReport = now;
            onProgress({ doneBytes, totalBytes });
          }
        });
        response.on("error", () => fail(state.cancelled ? "Cancelled." : "The connection dropped — try again."));
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            if (settled) return;
            if (state.cancelled) return fail("Cancelled.");
            const digest = hash.digest("hex");
            if (digest !== entry.sha256.toLowerCase()) {
              return fail(
                "The downloaded copy failed its safety check, so we deleted " +
                  "it. That's usually a network hiccup — please try again."
              );
            }
            try {
              fs.renameSync(partPath, destination);
            } catch (error) {
              return fail(error.message);
            }
            settled = true;
            onProgress({ doneBytes, totalBytes });
            resolve({ ok: true, path: destination });
          });
        });
      });
      state.request = request;
      request.on("error", (error) =>
        fail(state.cancelled ? "Cancelled." : `Connection problem: ${error.message}`)
      );
    };

    get(entry.url, 5);
  });
}

module.exports = { downloadIso, cancelDownload };
