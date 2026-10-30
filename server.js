const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const { execFile } = require("node:child_process");

const CLI_FALLBACK = path.join(__dirname, "node_modules", "impeccable", "cli", "bin", "cli.js");

function cliPath() {
  if (process.env.IMPECCABLE_CLI) return process.env.IMPECCABLE_CLI;
  return CLI_FALLBACK;
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>impeccable detect - local POC</title>
<style>
 :root{--bg:#101214;--panel:#0b0d0f;--line:#24282d;--ink:#e6e6e6;--dim:#7f8b99;--warn:#d9822b;--ok:#3fb950;--accent:#2b6cff}
 *{box-sizing:border-box}
 body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--bg);color:var(--ink)}
 header{padding:14px 20px;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
 h1{font-size:15px;margin:0;font-weight:600;letter-spacing:.02em}
 .u{color:var(--dim);font-size:12px}
 .u a{color:#8fb8ff;text-decoration:none}
 main{display:grid;grid-template-columns:1fr 1fr;gap:0;height:calc(100vh - 58px)}
 textarea{width:100%;height:100%;background:var(--panel);color:#cfe3ff;border:0;
   border-right:1px solid var(--line);padding:16px;font:13px/1.55 ui-monospace,Menlo,monospace;resize:none}
 #out{overflow:auto;padding:16px}
 button{background:var(--accent);color:#fff;border:0;border-radius:6px;padding:7px 14px;font:inherit;cursor:pointer}
 button.ghost{background:transparent;color:var(--dim);border:1px solid var(--line)}
 button:disabled{opacity:.5}
 .f{border-left:3px solid var(--warn);padding:8px 12px;margin:0 0 10px;background:#16191c}
 .f b{color:#ffcf87}.f small{color:var(--dim)}
 .f .sev{color:#ffcf87;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
 .ok{border-left-color:var(--ok);color:#8ee59a}
 .sum{margin:0 0 14px;color:#9fb0c0}
 .err{border-left-color:#e5534b;color:#ffb3ae}
 @media (max-width:820px){ main{grid-template-columns:1fr;grid-template-rows:40vh 1fr;height:auto} textarea{border-right:0;border-bottom:1px solid var(--line)} }
</style></head>
<body>
<header>
  <h1>impeccable detect</h1>
  <span class="u">local POC &middot; upstream <a href="https://github.com/pbakaus/impeccable" target="_blank" rel="noreferrer">github.com/pbakaus/impeccable</a></span>
  <button id="go">Check</button>
  <button id="slopped" class="ghost">Load slopped page</button>
  <button id="clean" class="ghost">Load clean page</button>
  <span class="u" id="msg"></span>
</header>
<main>
  <textarea id="src" spellcheck="false"></textarea>
  <div id="out"><p class="sum">Paste HTML on the left, press Check. Findings come from the real CLI.</p></div>
</main>
<div id="bootstrap" hidden>__BOOTSTRAP__</div>
<script>
var boot = JSON.parse(document.getElementById("bootstrap").textContent);
var src = document.getElementById("src");
var out = document.getElementById("out");
var msg = document.getElementById("msg");
var go  = document.getElementById("go");
src.value = boot.sample;
async function run(){
  go.disabled = true; msg.textContent = "running\u2026";
  try{
    var r = await fetch("/detect", {method:"POST", headers:{"content-type":"application/json"},
      body: JSON.stringify({html: src.value})});
    var d = await r.json();
    if(d.error){ out.innerHTML = '<p class="f err"><b>CLI error</b><br><small>' + esc(d.error) + '</small></p>'; msg.textContent = "error"; go.disabled = false; return; }
    msg.textContent = d.findings.length ? d.findings.length + " findings" : "no findings";
    if(d.findings.length === 0){
      out.innerHTML = '<p class="f ok"><b>0 anti-patterns</b><br><small>exit ' + d.exit + '</small></p>';
    } else {
      out.innerHTML = '<p class="sum">' + d.findings.length + ' anti-patterns found &middot; exit ' + d.exit + '</p>' +
        d.findings.map(function(f){ return '<p class="f"><b>[' + esc(f.antipattern) + ']</b> ' + esc(f.name) +
          ' <span class="sev">' + esc(f.severity) + '</span><br>' +
          (f.line ? '<small>line ' + f.line + '</small><br>' : '') + esc(f.description) + '</p>'; }).join("");
    }
  }catch(e){ msg.textContent = "error: " + e.message; }
  go.disabled = false;
}
function esc(s){ return String(s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; }); }
go.onclick = run;
document.getElementById("slopped").onclick = function(){ src.value = boot.slopped; run(); };
document.getElementById("clean").onclick = function(){ src.value = boot.clean; run(); };
</script>
</body></html>`;

const SAMPLE = require("./sample/sample.js").slopped;
const CLEAN = require("./sample/sample.js").clean;

function page() {
  const boot = JSON.stringify({ sample: SAMPLE, slopped: SAMPLE, clean: CLEAN }).replace(/</g, "\\u003c");
  return PAGE.replace("__BOOTSTRAP__", boot);
}

function runDetect(html) {
  return new Promise(async (resolve) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "imp-"));
    const file = path.join(dir, "page.html");
    await fs.writeFile(file, html, "utf8");
    execFile(process.execPath, [cliPath(), "detect", "--json", file],
      { cwd: __dirname, maxBuffer: 8 << 20, timeout: 30000 }, async (err, stdout, stderr) => {
        let findings = [];
        let error = null;
        try { findings = JSON.parse(stdout || "[]"); } catch (e) {
          error = (stderr || "").trim() || "unparseable CLI output";
        }
        if (!Array.isArray(findings)) { findings = []; error = error || "CLI output was not a list"; }
        const exit = err && typeof err.code === "number" ? err.code : 0;
        await fs.rm(dir, { recursive: true, force: true });
        resolve({ exit, findings, error });
      });
  });
}

function send(res, code, type, body) {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function handler(req, res) {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    return send(res, 200, "text/html; charset=utf-8", page());
  }
  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, cli: cliPath() }));
  }
  if (req.method === "POST" && req.url === "/detect") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 2 << 20) req.destroy(); });
    req.on("end", async () => {
      let html = "";
      try { html = JSON.parse(body).html || ""; } catch {}
      if (!html.trim()) return send(res, 400, "application/json; charset=utf-8", JSON.stringify({ exit: 0, findings: [], error: "empty input" }));
      const out = await runDetect(html);
      send(res, 200, "application/json; charset=utf-8", JSON.stringify(out));
    });
    return;
  }
  send(res, 404, "text/plain", "not found");
}

function start(port, host) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(port || 0, host || "0.0.0.0", () => resolve(server));
  });
}

if (require.main === module) {
  start(Number(process.env.PORT || 4173), process.env.HOST || "0.0.0.0").then((server) => {
    const a = server.address();
    console.log("impeccable POC on http://127.0.0.1:" + a.port);
  });
}

module.exports = { start, handler, runDetect, page };
