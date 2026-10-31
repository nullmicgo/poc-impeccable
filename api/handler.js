// Vercel entry: one Node function serves the page and POST /detect.
// The detect rules come from the upstream `impeccable` npm package (a native
// binary), so the server must run on Node and is never a static SPA.

// Vercel's filesystem handler serves any source file that matches the request
// path, so /api/index.js would return this file instead of invoking it (it did
// on the first deploy). Point the one real function at a path no static file
// can shadow, and leave a .js stub in api/ for Vercel's function detection.
module.exports = require("../server.js").handler;
