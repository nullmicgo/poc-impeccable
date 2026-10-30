const slopped = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sample page - does impeccable catch it?</title>
<style>
  :root { --cream:#f7f1e6; --purple:#6d4aff; --blue:#2f80ff; }
  body { margin:0; background:var(--cream); font-family:Inter, system-ui, sans-serif; color:#3b3b3b; }
  .wrap { max-width: 1000px; margin: 0 auto; padding: 48px 24px; }
  .eyebrow { font-size:13px; letter-spacing:.18em; text-transform:uppercase; color:#8a8578; }
  h1 { font-size:96px; line-height:.95; letter-spacing:-.05em; margin:.2em 0; }
  .grad { background:linear-gradient(90deg,var(--purple),var(--blue));
          -webkit-background-clip:text; background-clip:text; color:transparent; }
  .card { background:#fffdf8; border-radius:16px; padding:24px; border-left:6px solid var(--purple);
          box-shadow:0 24px 60px rgba(0,0,0,.08); margin-bottom:24px; }
  .card .card { background:#fbf7ef; box-shadow:0 24px 60px rgba(0,0,0,.08); }
  .dot { width:10px; height:10px; border-radius:50%; background:var(--purple);
         display:inline-block; animation:pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.4);opacity:1} }
  button { border-radius:999px; border:none; padding:12px 22px; background:var(--purple); color:#fff;
           transition:transform .3s cubic-bezier(.68,-0.55,.27,1.55); }
  button:hover { transform:scale(1.08); }
</style>
</head>
<body>
<div class="wrap">
  <p class="eyebrow">Introducing</p>
  <h1>Build <span class="grad">faster</span> without the noise</h1>
  <p class="dot"></p>
  <div class="card">
    <div class="card">
      <p>Seamlessly unleash your workflow with a delightful, powerful, and effortless platform.</p>
      <button>Get started</button>
    </div>
  </div>
</div>
</body>
</html>`;

const clean = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Clean page - the control</title>
<style>
  body { margin:0; background:#ffffff; color:#111111; font-family:Georgia, "Times New Roman", serif; }
  .wrap { max-width: 640px; margin: 0 auto; padding: 64px 24px; }
  h1 { font-size: 40px; line-height: 1.15; margin: 0 0 16px; font-weight: 600; }
  p { font-size: 18px; line-height: 1.6; margin: 0 0 24px; color:#222222; }
  a.btn { display:inline-block; padding:12px 20px; background:#111111; color:#ffffff;
          text-decoration:none; border-radius:4px; font-family:system-ui,sans-serif; font-size:15px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>How the detector reads a page</h1>
  <p>Same markup rules, no decoration for its own sake. One heading, one paragraph, one link.
     The detector should report nothing here: this page is the control.</p>
  <p><a class="btn" href="https://github.com/pbakaus/impeccable">Upstream repository</a></p>
</div>
</body>
</html>`;

module.exports = { slopped, clean };
