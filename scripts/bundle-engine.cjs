// Build-time engine bundle for the Vercel deploy.
//
// Why this exists (proven the hard way, 2026-10-31): Vercel builds inside the
// repo, so the optional platform package for linux-x64 is NOT installed and the
// npm shim in node_modules/impeccable/cli/bin/cli.js downloads the engine at
// RUNTIME. That download fails in the function (read-only cache, a request from
// inside a serverless invocation) and the POC answers exit 127 - a server that
// looks alive while its one critical route is broken.
//
// So the build fetches the pinned release asset here, verifies it against the
// SHA-256 the package itself ships (skill/scripts/engine-checksums.txt, the same
// manifest the shim trusts), and drops it where the shim looks first. No checksum
// on record means NO download, exactly like the shim: fail closed.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const pkg = require(path.join(root, "node_modules", "impeccable", "package.json"));
const TARGET = "linux-x64";
const PLATFORM_PKG = "@impeccable/cli-" + TARGET;
const version = String(pkg.optionalDependencies?.[PLATFORM_PKG] || "").replace(/^[^\d]*/, "");
if (!version) throw new Error("no pinned version for " + PLATFORM_PKG);

const manifest = path.join(root, "node_modules", "impeccable", "skill", "scripts", "engine-checksums.txt");
const asset = "impeccable-" + TARGET;
let expected = "";
for (const line of fs.readFileSync(manifest, "utf8").split(/\r?\n/)) {
  const [v, a, sum] = line.trim().split(/\s+/);
  if (v === version && a === asset) expected = (sum || "").toLowerCase();
}
if (!expected) throw new Error("no checksum for engine " + version + " (" + asset + ") in " + manifest);

const base = (process.env.IMPECCABLE_DOWNLOAD_BASE || "https://github.com/pbakaus/impeccable/releases/download").replace(/\/$/, "");
const url = base + "/engine-v" + version + "/" + asset;
const outDir = path.join(root, "engine", version, TARGET);
const out = path.join(outDir, "impeccable");

async function main() {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error("download failed " + res.status + " for " + url);
  const buf = Buffer.from(await res.arrayBuffer());
  const got = crypto.createHash("sha256").update(buf).digest("hex");
  if (got !== expected) throw new Error("checksum mismatch: got " + got + " want " + expected);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(out, buf, { mode: 0o755 });
  fs.writeFileSync(path.join(outDir, "SHA256SUMS"), got + "  " + asset + "\n");
  console.log("engine " + version + " " + TARGET + " verified " + got.slice(0, 12) + "... " + buf.length + " B");
}

main().catch((err) => { console.error(err.message); process.exit(1); });
