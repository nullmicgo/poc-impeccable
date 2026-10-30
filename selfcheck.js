const http = require("node:http");
const { start } = require("./server.js");

const cases = [
  ["slopped", require("./sample/sample.js").slopped, 200, 11],
  ["clean", require("./sample/sample.js").clean, 200, 0],
  ["empty", "   ", 400, 0],
  ["markup-only", "<!doctype html><html><head><title>t</title></head><body><p>plain words only</p></body></html>", 200, 0],
];

async function post(port, html) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ html });
    const req = http.request({ host: "127.0.0.1", port, path: "/detect", method: "POST",
      headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => { let j = null; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, json: j, raw: d }); });
    });
    req.on("error", reject); req.end(body);
  });
}

async function get(port, p) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path: p }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    }).on("error", reject);
  });
}

(async () => {
  const server = await start(0, "127.0.0.1");
  const port = server.address().port;
  const fails = [];
  const check = (ok, label, extra) => { console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  " + extra : "")); if (!ok) fails.push(label); };

  const home = await get(port, "/");
  check(home.status === 200 && home.body.includes("impeccable detect"), "GET / serves the page", home.status + " " + home.body.length + "B");
  check(home.body.includes("github.com/pbakaus/impeccable"), "page names upstream repo once");
  check(!/sk-[A-Za-z0-9]{8,}/.test(home.body), "page body has no token-shaped string");

  const health = await get(port, "/health");
  const hj = JSON.parse(health.body);
  check(health.status === 200 && hj.ok === true, "GET /health ok", String(hj.cli));

  const missing = await get(port, "/nope");
  check(missing.status === 404, "unknown path -> 404");

  for (const [name, html, wantStatus, wantCount] of cases) {
    const r = await post(port, html);
    const n = r.json && Array.isArray(r.json.findings) ? r.json.findings.length : -1;
    check(r.status === wantStatus && n === wantCount, "detect " + name, "http " + r.status + " findings " + n);
  }

  const slopped = await post(port, cases[0][1]);
  const ids = slopped.json.findings.map((f) => f.antipattern);
  for (const ap of ["side-tab", "gradient-text", "overused-font", "nested-cards", "pulsing-dot", "marketing-buzzword"]) {
    check(ids.includes(ap), "finding present: " + ap);
  }
  check(slopped.json.exit === 2, "exit code 2 for findings", String(slopped.json.exit));

  const orderA = ids.join(",");
  const again = await post(port, cases[0][1]);
  check(again.json.findings.map((f) => f.antipattern).join(",") === orderA, "same input -> same findings (run 2)");

  const cleanTwice = await post(port, cases[1][1]);
  check(cleanTwice.json.exit === 0 && cleanTwice.json.findings.length === 0, "clean page stays clean (run 2)");

  server.close();
  console.log(fails.length === 0 ? "ALL_PASS " + (13 + 6 + 1 + 1 + 1 + 1) : "FAILED " + fails.join("; "));
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error("ERROR", e); process.exit(1); });

