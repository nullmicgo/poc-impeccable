# poc-impeccable

A small local web app that runs the **real** [`impeccable detect`](https://github.com/pbakaus/impeccable)
checker on HTML you paste in, and shows the tool's own findings.

Upstream: **https://github.com/pbakaus/impeccable** (Apache-2.0).

This app adds no opinions of its own: it shells out to the installed `impeccable` CLI and
prints what it returns, including when it returns nothing.

## Run locally

```
npm install
node server.js
```

Then open <http://127.0.0.1:4173>.

## What it is and is not

- **It is** a thin front end over a real checker, so every finding on screen is the tool's.
- **It is not** the tool itself, and it is not a deploy. There is no hosted instance; run it
  on your own machine.
- `detect-sample.json` is the example payload the page loads as a starting point.

## Licence

The wrapper is MIT. `impeccable` itself is Apache-2.0 and is installed from npm; no upstream
source is vendored here.
