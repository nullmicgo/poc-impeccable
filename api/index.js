// Vercel entry: one Node function serves the page and POST /detect.
// The detect rules come from the upstream `impeccable` npm package (a native
// binary), so the server must run on Node and is never a static SPA.
const { handler } = require("../server.js");

module.exports = handler;
