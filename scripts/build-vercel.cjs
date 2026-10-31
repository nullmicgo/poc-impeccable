// Vercel build step: fetch and verify the pinned linux engine, then publish it
// inside the function bundle at the path the npm shim reads first.
//
// Why the function bundle and not a public asset (learned from the deploys
// before this one): a path under public/ is served over the network by Vercel,
// and the engine shim runs the file directly - it must be a real executable on
// disk. So the binary is written into the handler's directory, and the handler
// points IMPECCABLE_HOME at it before any detect call.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const version = String(
  require(path.join(root, "node_modules", "impeccable", "package.json"))
    .optionalDependencies["@impeccable/cli-linux-x64"] || ""
).replace(/^[^\d]*/, "");

const src = path.join(root, "engine", version, "linux-x64", "impeccable");
const dest = path.join(root, "api", "engine", "bin", version, "impeccable");
if (!fs.existsSync(src)) throw new Error("engine not built: " + src);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
fs.chmodSync(dest, 0o755);
console.log("engine ready for the function bundle: " + path.relative(root, dest));
