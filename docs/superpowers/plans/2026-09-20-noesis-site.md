# NOESIS landing page — implementation plan

Implements `docs/superpowers/specs/2026-09-20-noesis-site-design.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the NOESIS single-page site described in Part A, ready for GitHub Pages.

**Architecture:** One static `index.html` styled by four CSS files and driven by small ES modules
(theme, install, scramble, reveal, sphere, loader, readouts) orchestrated by `js/main.js`; a
vendored three.js renders the point sphere. Pure logic is separated from DOM wiring so it runs
in a zero-dependency in-browser test runner.

**Tech Stack:** HTML, CSS (custom properties, grid + subgrid), ES modules, three.js (vendored,
pinned), Python 3 (`http.server`, `unittest`) for the dev server and the figure check.

**Spec:** Part A of this file (copied to `docs/superpowers/specs/2026-09-20-noesis-site-design.md`
in Task 0).

## Global Constraints

- Every figure on the page exists in `D:\Personal_Agent\README.md` or
  `D:\Personal_Agent\eval\CHANGELOG.md`; `python scripts/check_numbers.py` exits 0 before any commit.
- Install commands are the README's lines verbatim (Part A §1). Gate strings are
  `agent/policy.py` output verbatim (Part A §1).
- Colours only via the tokens in Part A; no other hex values in CSS or JS.
- Fonts: Montserrat 200/300/400/500, IBM Plex Mono 400/500, from Google Fonts with the
  fallback stacks in Part A.
- No bundler, no npm, no third-party runtime dependency beyond the vendored three.js.
- No `setInterval`; animation is CSS transitions or the rAF loops named in this plan.
  `prefers-reduced-motion` is honoured by every animated thing.
- 400 px wide: `document.body.scrollWidth === document.documentElement.clientWidth`.
- **Commits:** the owner's rule is no `git add`/`commit`/`push` unless asked. Each task ends
  with a *checkpoint* naming the files; run it only if the owner has asked for commits. No
  `Co-Authored-By` or other trailers.
- Dev server: `python -m http.server 8000` from the repo root, in the background. Browser
  checks use the Playwright MCP tools (`browser_navigate`, `browser_resize`, `browser_evaluate`,
  `browser_emulate_media`, `browser_take_screenshot`, `browser_console_messages`).
- **Running the JS tests:** open `http://localhost:8000/tests/` and read the `<pre id="out">`
  (or `browser_evaluate` → `window.__results`). A test file whose module does not exist yet shows
  as `FAIL ./x.test.js  TypeError: Failed to fetch dynamically imported module` — that is the
  expected "red" before implementation.

---

### Task 0: Scaffold, dev server, in-browser test harness

**Files:**
- Create: `.nojekyll` (empty), `.claude/launch.json`, `README.md`, `tests/index.html`,
  `tests/harness.js`, `tests/runner.js`, `tests/harness.test.js`,
  `docs/superpowers/specs/2026-09-20-noesis-site-design.md`,
  `docs/superpowers/plans/2026-09-20-noesis-site.md`

**Interfaces:**
- Produces: `tests/harness.js` exports `test(name, fn)`, `eq(actual, expected)`,
  `approx(actual, expected, eps = 1e-6)`. `tests/runner.js` holds `MODULES`, the list of test
  files; later tasks append to it.

- [ ] **Step 1: Copy Part A and Part B of this file** into
  `docs/superpowers/specs/2026-09-20-noesis-site-design.md` and
  `docs/superpowers/plans/2026-09-20-noesis-site.md`. Create an empty `.nojekyll`.

- [ ] **Step 2: Write `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "site", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8000"], "port": 8000 }
  ]
}
```

- [ ] **Step 3: Write `README.md`**

```markdown
# noesis-site

The landing page for [NOESIS](https://github.com/notjwp/Noesis). One static page, no build step.

Run locally: `python -m http.server 8000` in this folder, then open http://localhost:8000/
(ES modules need http, not file://). Tests: http://localhost:8000/tests/ and
`python -m unittest discover tests`. Before committing: `python scripts/check_numbers.py`.

Deploys from `main` / root with GitHub Pages. Every figure on the page is copied from the agent
repository's README and `eval/CHANGELOG.md`; the check script enforces it.
```

- [ ] **Step 4: Write the harness**

`tests/harness.js`:
```js
export const results = [];

export function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, error: String(e) }); }
}

export function eq(actual, expected) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`expected ${b}, got ${a}`);
}

export function approx(actual, expected, eps = 1e-6) {
  if (Math.abs(actual - expected) > eps) throw new Error(`expected ~${expected}, got ${actual}`);
}
```

`tests/runner.js`:
```js
import { results } from './harness.js';

// One entry per module. Later tasks append here.
const MODULES = ['./harness.test.js'];

for (const m of MODULES) {
  try { await import(m); }
  catch (e) { results.push({ name: m, ok: false, error: String(e) }); }
}

window.__results = results;
const failing = results.filter(r => !r.ok).length;
document.getElementById('out').textContent =
  results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.error ? `\n      ${r.error}` : ''}`).join('\n')
  + `\n\n${failing} failing of ${results.length}`;
```

`tests/index.html`:
```html
<!doctype html>
<meta charset="utf-8">
<title>noesis-site tests</title>
<pre id="out" style="font: 13px/1.5 monospace; padding: 16px">running…</pre>
<script type="module" src="./runner.js"></script>
```

`tests/harness.test.js`:
```js
import { test, eq, approx } from './harness.js';

test('harness: eq passes on deep-equal values', () => eq({ a: [1, 2] }, { a: [1, 2] }));
test('harness: approx tolerates float noise', () => approx(0.1 + 0.2, 0.3));
test('harness: eq throws with a readable message', () => {
  let msg = '';
  try { eq(1, 2); } catch (e) { msg = e.message; }
  eq(msg, 'expected 2, got 1');
});
```

- [ ] **Step 5: Start the server and run the harness**

Run (background): `python -m http.server 8000`
Open `http://localhost:8000/tests/`.
Expected: three `PASS harness: …` lines and `0 failing of 3`.

- [ ] **Step 6: Checkpoint** — `.nojekyll .claude/launch.json README.md tests/ docs/` —
  `chore: scaffold, dev server and in-browser test harness`.

---

### Task 1: Tokens, grid and the static page

**Files:**
- Create: `css/tokens.css`, `css/grid.css`, `css/site.css`, `index.html`

**Interfaces:**
- Produces: the DOM contract every later module relies on —
  `html[data-theme]`, `html[data-state="booting"|"live"]`, `#sphere` canvas, `#veil`,
  `.header`, `.frame > section.section[id]` with ids `hero numbers gate ledger properties footer`,
  `[data-theme-toggle]`, `[data-theme-label]`, `[data-install-os]`, `[data-install-command]`,
  `[data-install-copy]`, `[data-scramble]`, `[data-scramble-onload]`, `[data-terminal]`,
  `[data-trace]` with `[data-verdict]` lines, `[data-readout="sphere|scroll|cell|ledger"]`,
  `.ruler .ruler__marker`, and `#boot` (markup added in Task 7).

- [ ] **Step 1: Write `css/tokens.css`**

```css
:root {
  --cols: 20;
  --cell: 64px;            /* overwritten by js/main.js */
  --grid-x: 0px;
  --scroll: 0;
  --font-sans: Montserrat, "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", Consolas, "SF Mono", monospace;
  --fs-display: clamp(2.4rem, 5.5vw, 5rem);
  --fs-h2: clamp(1.5rem, 3vw, 2.4rem);
  --fs-body: 1rem;
  --fs-small: 0.8125rem;
  --fs-readout: 0.6875rem;
  --t-fast: 180ms;
  --t-mid: 800ms;
}
@media (max-width: 1199px) { :root { --cols: 16; } }
@media (max-width: 767px)  { :root { --cols: 8; } }

:root[data-theme="pm"] {
  color-scheme: dark;
  --ground: #0A0B0D; --surface: #1A1D21; --rule: #22262B; --text: #E6E8EB; --muted: #7C8494;
  --accent: #A3E635; --refuse: #FF5F56; --gold: #E5B84A; --violet: #A78BFA;
}
:root[data-theme="am"] {
  color-scheme: light;
  --ground: #F6F7F9; --surface: #FFFFFF; --rule: #D9DEE5; --text: #111318; --muted: #6B7280;
  --accent: #4D7C0F; --refuse: #C62828; --gold: #9A6B00; --violet: #6D4BD6;
}
@media (prefers-reduced-motion: reduce) {
  :root { --t-fast: 0ms; --t-mid: 0ms; }
}
```

- [ ] **Step 2: Write `css/grid.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html { background: var(--ground); scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  margin: 0; color: var(--text); background-color: var(--ground);
  font: 300 var(--fs-body)/1.55 var(--font-sans);
  background-image:
    linear-gradient(var(--rule) 1px, transparent 1px),
    linear-gradient(90deg, var(--rule) 1px, transparent 1px);
  background-size: var(--cell) var(--cell);
  background-position: var(--grid-x) 0;
  overflow-x: hidden;
}
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.accent { color: var(--accent); }
.muted { color: var(--muted); }
.refuse { color: var(--refuse); }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--accent); }
:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }

#sphere { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

.frame {
  position: relative; z-index: 1;
  width: calc(var(--cell) * var(--cols)); margin: 0 auto;
  padding-top: var(--cell);                 /* under the fixed header */
  display: grid; grid-template-columns: repeat(var(--cols), var(--cell)); grid-auto-rows: var(--cell);
}
.section { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; grid-auto-rows: var(--cell); }
.section > * { min-width: 0; }

.cell {
  position: relative; border: 1px solid var(--rule); background: var(--ground);
  padding: calc(var(--cell) * 0.25);
}
.cell--surface { background: var(--surface); }
.cell--scroll { overflow-x: auto; }
.cell::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border: 1px solid var(--text); clip-path: inset(0 100% 100% 0);
  transition: clip-path var(--t-fast) ease-out;
}
.cell:hover::after { clip-path: inset(0); }

.label { margin: 0; font-size: var(--fs-small); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.label--right { text-align: right; }
.readout { margin: 0; font-size: var(--fs-readout); color: var(--muted); align-self: end; }

.header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 5; height: var(--cell);
  background: var(--ground); border-bottom: 1px solid var(--rule);
}
.header__grid {
  width: calc(var(--cell) * var(--cols)); margin: 0 auto; height: 100%;
  display: grid; grid-template-columns: repeat(var(--cols), var(--cell));
}
.header .cell { display: grid; place-items: center; padding: 0; border-top: 0; border-bottom: 0; cursor: pointer; color: inherit; background: none; font: inherit; }
.header__wordmark { grid-column: 2 / span 2; letter-spacing: 0.12em; }
.header__menu     { grid-column: 4; }
.header__theme    { grid-column: -3; }
.header__ampm     { grid-column: -2; letter-spacing: 0.1em; }
.menu {
  position: fixed; top: var(--cell); left: calc(50% - var(--cell) * var(--cols) / 2 + var(--cell) * 3);
  width: calc(var(--cell) * 3); background: var(--ground); border: 1px solid var(--rule); z-index: 5;
  display: grid;
}
.menu a { height: var(--cell); display: grid; align-items: center; padding: 0 calc(var(--cell) * 0.25); border-bottom: 1px solid var(--rule); font-size: var(--fs-small); letter-spacing: 0.08em; text-transform: uppercase; }

.ruler {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 4; height: calc(var(--cell) * 0.5);
  background: var(--ground); border-top: 1px solid var(--rule); pointer-events: none;
}
.ruler__ticks {
  position: absolute; left: calc(50% - var(--cell) * var(--cols) / 2); width: calc(var(--cell) * var(--cols)); bottom: 0; height: 40%;
  background: repeating-linear-gradient(90deg, var(--rule) 0 1px, transparent 1px calc(var(--cell) / 8));
}
.ruler__marker {
  position: absolute; bottom: 0; height: 100%; width: 1px; background: var(--text);
  left: calc(50% - var(--cell) * var(--cols) / 2 + var(--scroll) * var(--cell) * var(--cols));
}

@media (max-width: 767px) {
  .section > * { grid-column: 1 / -1 !important; grid-row: auto !important; }
  .header__wordmark { grid-column: 1 / span 3; } .header__menu { grid-column: 4; }
  .header__theme { grid-column: -3; } .header__ampm { grid-column: -2; }
}
```

- [ ] **Step 3: Write `css/site.css`** — placement and styling per section. Use this pattern
  for every block; positions follow Part A (rows are relative to each section's first row).

```css
/* shared */
.display { margin: 0; font-weight: 200; font-size: var(--fs-display); line-height: 1; letter-spacing: 0.06em; text-transform: uppercase; }
.display small { display: block; margin-top: 0.4em; font-size: var(--fs-small); letter-spacing: 0.08em; color: var(--muted); }
.display--right { text-align: right; }
.h2 { margin: 0; font-weight: 200; font-size: var(--fs-h2); letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.1; }
.sub { margin: 0.5em 0 0; color: var(--muted); max-width: 60ch; }
.lede { margin: 0; max-width: 46ch; }
.box { display: grid; place-items: center; text-align: center; font-size: var(--fs-small); letter-spacing: 0.08em; text-transform: uppercase; }

/* hero */
#hero { grid-auto-rows: var(--cell); }
#hero .label--left  { grid-column: 3 / span 5; grid-row: 2; align-self: center; }
#hero .label--right { grid-column: -8 / span 6; grid-row: 2; align-self: center; }
#hero .install { grid-column: 3 / span 7; grid-row: 3 / span 2; }          /* first thing on the page */
#hero .display--left  { grid-column: 3 / span 6; grid-row: 6 / span 2; align-self: center; }
#hero .display--right { grid-column: -8 / span 6; grid-row: 6 / span 2; align-self: center; }
#hero .lede { grid-column: 3 / span 6; grid-row: 8; }
#hero .terminal { grid-column: -7 / span 5; grid-row: 7 / span 3; }
#hero .readout { grid-column: 3 / span 6; grid-row: 10; }

.install { display: grid; grid-template-rows: auto 1fr auto; gap: 0.5rem; }
.install__os { display: flex; gap: 0; }
.install__os button { font: 500 var(--fs-small) var(--font-mono); color: var(--muted); background: none; border: 1px solid var(--rule); padding: 0.35em 0.8em; cursor: pointer; }
.install__os button[aria-pressed="true"] { color: var(--text); border-color: var(--text); }
.install__line { display: flex; align-items: center; gap: 0.75rem; background: var(--surface); border: 1px solid var(--rule); padding: 0.6em 0.8em; }
.install__line code { flex: 1; overflow-x: auto; white-space: nowrap; font-size: var(--fs-small); }
.install__copy { font: 500 var(--fs-small) var(--font-mono); color: var(--accent); background: none; border: 1px solid var(--accent); padding: 0.35em 0.8em; cursor: pointer; }
.install__copy[data-state="copied"] { color: var(--ground); background: var(--accent); }
.install__note { margin: 0; font-size: var(--fs-small); color: var(--muted); }

.terminal { margin: 0; font-size: var(--fs-small); line-height: 1.6; white-space: pre; overflow: hidden; background: var(--surface); }
.terminal [data-verdict="auto"] { color: var(--muted); }
.terminal [data-verdict="confirm"] { color: var(--accent); }
.terminal [data-verdict="deny"] { color: var(--refuse); }

/* numbers */
#numbers .h2 { grid-column: 1 / span 14; grid-row: 1 / span 2; align-self: end; padding: 0 calc(var(--cell) * 0.25); }
#numbers .box { grid-column: -5 / span 4; grid-row: 1 / span 2; }
#numbers .numbers { grid-column: 8 / -1; grid-row: 3 / span 7; }
#numbers .footnote { grid-column: 8 / -1; grid-row: 10; }
.numbers table { width: 100%; border-collapse: collapse; }
.numbers th, .numbers td { height: var(--cell); padding: 0 calc(var(--cell) * 0.25); text-align: left; border-bottom: 1px solid var(--rule); font-weight: 300; }
.numbers th { font-size: var(--fs-small); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.numbers td.score { color: var(--accent); text-align: right; }
.numbers tr.real td.score { color: var(--text); }
.footnote { margin: 0; font-size: var(--fs-small); color: var(--muted); }

/* gate */
#gate .h2 { grid-column: 1 / span 16; grid-row: 1 / span 2; align-self: end; padding: 0 calc(var(--cell) * 0.25); }
#gate .node { grid-row: 4; display: grid; align-content: center; font-family: var(--font-mono); }
#gate .node:nth-of-type(1) { grid-column: 1 / span 4; } #gate .node:nth-of-type(2) { grid-column: 5 / span 4; }
#gate .node:nth-of-type(3) { grid-column: 9 / span 4; } #gate .node:nth-of-type(4) { grid-column: 13 / span 4; }
#gate .node small { color: var(--muted); font-size: var(--fs-readout); }
#gate .trace { grid-column: 1 / span 10; grid-row: 5 / span 5; }
#gate .tier { grid-row: 10 / span 3; }
#gate .tier--auto { grid-column: 1 / span 6; } #gate .tier--confirm { grid-column: 7 / span 7; } #gate .tier--deny { grid-column: 14 / span 7; }
.tier h3 { margin: 0 0 0.5em; font: 500 var(--fs-small) var(--font-mono); letter-spacing: 0.08em; }
.tier p { margin: 0; font-size: var(--fs-small); }
#gate .native { grid-column: 1 / span 14; grid-row: 13; }

/* ledger */
#ledger .h2 { grid-column: 1 / span 14; grid-row: 1 / span 2; align-self: end; padding: 0 calc(var(--cell) * 0.25); }
#ledger .row { grid-column: 1 / span 14; display: grid; grid-template-columns: 7ch 1fr auto; gap: 1rem; align-items: center; font-size: var(--fs-small); }
#ledger .row .verdict { font-family: var(--font-mono); font-weight: 500; }
#ledger .row[data-kind="kept"] .verdict { color: var(--accent); }
#ledger .row[data-kind="reverted"] .verdict { color: var(--refuse); }
#ledger .row[data-kind="off"] .verdict { color: var(--muted); }
#ledger .readout { grid-column: 1 / span 6; }

/* properties */
#properties .prop { grid-row: 1 / span 6; }
#properties .prop:nth-of-type(1) { grid-column: 1 / span 6; } #properties .prop:nth-of-type(2) { grid-column: 8 / span 6; } #properties .prop:nth-of-type(3) { grid-column: 15 / span 6; }
.prop h3 { margin: 0.5em 0; font-weight: 200; font-size: var(--fs-h2); line-height: 1.1; }
.prop p { margin: 0; font-size: var(--fs-small); }

/* footer */
#footer { padding-bottom: calc(var(--cell) * 1.5); }
#footer .links { grid-column: 1 / span 8; grid-row: 1; display: flex; gap: 2rem; align-items: center; font-size: var(--fs-small); letter-spacing: 0.08em; text-transform: uppercase; }
#footer .footnote { grid-column: 1 / span 14; grid-row: 2; }

/* veil — wiped off after the loader (Task 7) */
#veil { position: fixed; inset: 0; z-index: 6; background: var(--ground); pointer-events: none;
  mask-image: linear-gradient(135deg, transparent 0 40%, #000 60% 100%); -webkit-mask-image: linear-gradient(135deg, transparent 0 40%, #000 60% 100%);
  mask-size: 300% 300%; -webkit-mask-size: 300% 300%; mask-position: 100% 100%; -webkit-mask-position: 100% 100%;
  transition: mask-position 900ms ease-in-out, -webkit-mask-position 900ms ease-in-out; }
html[data-state="live"] #veil { mask-position: 0 0; -webkit-mask-position: 0 0; }
html:not([data-state="live"]) .frame, html:not([data-state="live"]) .header, html:not([data-state="live"]) .ruler { visibility: hidden; }
```

- [ ] **Step 4: Write `index.html`** — the whole document. Head, then body in this order:
  `#sphere` canvas, `#veil`, header, `.frame` with the six sections, ruler, and the module
  script. The copy is Part A §1–§6, pasted verbatim. Structure:

```html
<!doctype html>
<html lang="en" data-theme="pm" data-state="live">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NOESIS — a personal agent, measured before it is believed</title>
<meta name="description" content="A personal AI agent that runs on your machine. Every tool call is judged before it runs; every number about it is measured.">
<script>
(function () {
  var stored = null; try { stored = localStorage.getItem('noesis.theme'); } catch (e) {}
  var dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = (stored === 'am' || stored === 'pm') ? stored : (dark ? 'pm' : 'am');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var booted = false; try { booted = sessionStorage.getItem('noesis.booted') === '1'; } catch (e) {}
  var forced = /[?&]boot\b/.test(location.search);
  document.documentElement.dataset.state = (forced || (!reduced && !booted)) ? 'booting' : 'live';
})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Montserrat:wght@200;300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/grid.css">
<link rel="stylesheet" href="css/site.css">
<link rel="stylesheet" href="css/loader.css">
</head>
<body>
<canvas id="sphere" aria-hidden="true"></canvas>
<div id="veil" aria-hidden="true"></div>

<header class="header">
  <div class="header__grid">
    <a class="cell header__wordmark mono" href="#hero" data-scramble-onload><span class="accent">NOE</span>SIS</a>
    <button class="cell header__menu mono" type="button" aria-expanded="false" aria-controls="menu" data-menu data-scramble-onload>M</button>
    <button class="cell header__theme" type="button" data-theme-toggle aria-label="Switch between light and dark">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor"/><path d="M8 2v12A6 6 0 0 0 8 2z" fill="currentColor"/></svg>
    </button>
    <button class="cell header__ampm mono" type="button" data-theme-toggle data-theme-label>PM</button>
  </div>
  <nav id="menu" class="menu mono" hidden>
    <a href="#numbers">measured</a><a href="#gate">the gate</a><a href="#ledger">the ledger</a><a href="#properties">what it does</a><a href="#footer">links</a>
  </nav>
</header>

<main class="frame">
  <section id="hero" class="section" aria-labelledby="hero-title">
    <p class="label label--left mono">01. A personal agent</p>
    <p class="label label--right mono">02. Runs on your machine</p>
    <div class="cell install">
      <div class="install__os" role="group" aria-label="Operating system">
        <button type="button" data-install-os="unix" aria-pressed="true">macOS, Linux</button>
        <button type="button" data-install-os="windows" aria-pressed="false">Windows</button>
      </div>
      <div class="install__line mono">
        <code data-install-command tabindex="-1">git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git &amp;&amp; cd Noesis &amp;&amp; python3 install.py</code>
        <button type="button" class="install__copy" data-install-copy>copy</button>
      </div>
      <p class="install__note">Python 3.12+ and git. No Docker, no VM. The clone is about 1 MB.</p>
    </div>
    <h1 id="hero-title" class="display display--left" data-scramble>Judged<small>every tool call</small></h1>
    <p class="display display--right" data-scramble>Measured<small>every number</small></p>
    <p class="lede">Give it a goal in plain English — fix these tests, cut a release, answer my email — and it plans, uses tools, and works until it is done or tells you why it stopped.</p>
    <pre class="cell terminal mono" data-terminal aria-live="off">&gt; noesis "fix the failing tests in tests/"
act      read_file tests/test_parse.py
gate     read_file classified read                          <span data-verdict="auto">auto</span></pre>
    <p class="readout mono" data-readout="sphere">sphere: —</p>
  </section>

  <section id="numbers" class="section" aria-labelledby="numbers-title">
    <div class="h2-wrap"><h2 id="numbers-title" class="h2" data-scramble>Measured, not claimed</h2>
      <p class="sub">Every change is scored three times per case and kept only if a number moved. The agent is never the judge of its own success.</p></div>
    <a class="cell box mono" href="https://github.com/notjwp/Noesis/blob/main/eval/CHANGELOG.md">Read the changelog</a>
    <div class="cell cell--scroll numbers"><table> …7 rows from Part A §2; `<tr class="real">` on the real row; `<td class="score mono">`… </table></div>
    <p class="footnote">…Part A §2 footnote…</p>
  </section>

  <section id="gate" class="section" aria-labelledby="gate-title"> …nodes, trace, tiers, native line per Part A §3… </section>
  <section id="ledger" class="section" aria-labelledby="ledger-title"> …9 `.cell.row[data-kind]` per Part A §4 + readout… </section>
  <section id="properties" class="section" aria-labelledby="properties-title"> …3 `.cell.prop` per Part A §5… </section>
  <footer id="footer" class="section" aria-label="Links"> …links + footnote per Part A §6… </footer>
</main>

<div class="ruler" aria-hidden="true"><div class="ruler__ticks"></div><div class="ruler__marker"></div></div>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

  Notes while writing the sections: the `.h2-wrap` in `#numbers`, `#gate`, `#ledger` takes the
  `.h2` placement rules (change the selectors in `site.css` from `.h2` to `.h2-wrap`). The gate
  trace is a `<pre class="cell terminal mono" data-trace>` containing the three traces from Part
  A §1 as consecutive lines, each verdict word wrapped in `<span data-verdict="…">`. Ledger rows:
  `<div class="cell row" data-kind="kept"><span class="verdict">kept</span><span>edit_file, a targeted edit, described as one</span><span class="mono">real repositories 0/9 → 4/7</span></div>`.
  Ledger readout: `<p class="readout mono" data-readout="ledger">rows: 9 · kept 4 · reverted 3 · off 2</p>`.
  Until Task 7 there is no `#boot`, so the inline script's `booting` state would hide the page:
  for this task only, set `data-state="live"` at the end of the inline script unconditionally
  (`document.documentElement.dataset.state = 'live';`) and remove that line in Task 7.

- [ ] **Step 5: Look at it** — open `http://localhost:8000/`, `browser_resize` to 1440×900,
  1024×768 and 400×800; `browser_take_screenshot` at each; `browser_evaluate`
  `() => document.body.scrollWidth === document.documentElement.clientWidth` → `true` at 400.
  Flip theme: `browser_evaluate` `() => document.documentElement.dataset.theme = 'am'`, screenshot
  again. Fix any cell that does not sit on the grid lines (the header, install cell and table
  are the usual suspects — heights must be whole `--cell` multiples).
  Expected: content on the rules at all three widths; no horizontal scroll; both palettes read.

- [ ] **Step 6: Checkpoint** — `index.html css/` — `feat: static page on the ruled grid, both themes`.

---

### Task 2: `main.js` — cell sizing, section observer, scroll progress

**Files:**
- Create: `js/main.js`, `tests/main.test.js`; Modify: `tests/runner.js` (append `'./main.test.js'`)

**Interfaces:**
- Produces: `cellSize(clientWidth, cols) → { cell, offset }`; sets `--cell` and `--grid-x` on
  `:root`; sets `--scroll` (0–1) on `:root` on scroll; dispatches nothing yet — later tasks add
  their `init*()` calls to `main.js` in the order theme → install → reveal → sphere → loader.

- [ ] **Step 1: Write the failing test** — `tests/main.test.js`

```js
import { test, eq } from './harness.js';
import { cellSize } from '../js/main.js';

test('cellSize floors to whole pixels and centres the remainder', () => {
  eq(cellSize(1437, 20), { cell: 71, offset: 8 });   // 1437 - 1420 = 17 → 8 left
  eq(cellSize(400, 8), { cell: 50, offset: 0 });
});
```

- [ ] **Step 2: Run it** — reload `/tests/`. Expected: `FAIL ./main.test.js … Failed to fetch dynamically imported module`.

- [ ] **Step 3: Write `js/main.js`**

```js
export function cellSize(clientWidth, cols) {
  const cell = Math.floor(clientWidth / cols);
  return { cell, offset: Math.floor((clientWidth - cell * cols) / 2) };
}

function applyGrid() {
  const root = document.documentElement;
  const cols = parseInt(getComputedStyle(root).getPropertyValue('--cols'), 10);
  const { cell, offset } = cellSize(root.clientWidth, cols);
  root.style.setProperty('--cell', `${cell}px`);
  root.style.setProperty('--grid-x', `${offset}px`);
}

function trackScroll() {
  const root = document.documentElement;
  const update = () => {
    const max = root.scrollHeight - root.clientHeight;
    root.style.setProperty('--scroll', max > 0 ? (root.scrollTop / max).toFixed(4) : '0');
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

function menu() {
  const btn = document.querySelector('[data-menu]'), nav = document.getElementById('menu');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => { nav.hidden = !nav.hidden; btn.setAttribute('aria-expanded', String(!nav.hidden)); });
  nav.addEventListener('click', () => { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
}

if (typeof document !== 'undefined' && document.querySelector('.frame')) {
  applyGrid();
  addEventListener('resize', applyGrid);
  trackScroll();
  menu();
}
```

- [ ] **Step 4: Run tests** — Expected: `PASS cellSize …`, `0 failing`.
  Open `/` at 1437×900: `browser_evaluate` `() => getComputedStyle(document.documentElement).getPropertyValue('--cell')` → `71px`; the body's vertical rules meet the frame's edges; the `M` button opens the menu.

- [ ] **Step 5: Checkpoint** — `js/main.js tests/` — `feat: cell sizing, scroll progress, menu`.

---

### Task 3: `theme.js` — AM/PM

**Files:**
- Create: `js/theme.js`, `tests/theme.test.js`; Modify: `js/main.js` (import + call `initTheme()` first), `tests/runner.js`

**Interfaces:**
- Produces: `resolveTheme(stored, prefersDark) → 'am' | 'pm'`; `initTheme()` wires every
  `[data-theme-toggle]`, keeps `[data-theme-label]` text in sync (`AM`/`PM`), persists to
  `localStorage['noesis.theme']`, and dispatches `document` `CustomEvent('themechange', { detail: { theme } })` on init and on every toggle. `sphere.js` (Task 6) listens to it.

- [ ] **Step 1: Failing test** — `tests/theme.test.js`

```js
import { test, eq } from './harness.js';
import { resolveTheme } from '../js/theme.js';

test('resolveTheme: stored value wins', () => { eq(resolveTheme('am', true), 'am'); eq(resolveTheme('pm', false), 'pm'); });
test('resolveTheme: falls back to the OS preference', () => { eq(resolveTheme(null, true), 'pm'); eq(resolveTheme('junk', false), 'am'); });
```

- [ ] **Step 2: Run** — Expected `FAIL ./theme.test.js`.

- [ ] **Step 3: Write `js/theme.js`**

```js
// Mirrors the inline <head> script in index.html, which must run before first paint.
export function resolveTheme(stored, prefersDark) {
  return stored === 'am' || stored === 'pm' ? stored : (prefersDark ? 'pm' : 'am');
}

export function initTheme() {
  const root = document.documentElement;
  const apply = theme => {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-label]').forEach(el => { el.textContent = theme.toUpperCase(); });
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };
  apply(resolveTheme(root.dataset.theme, matchMedia('(prefers-color-scheme: dark)').matches));
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'pm' ? 'am' : 'pm';
    try { localStorage.setItem('noesis.theme', next); } catch {}
    apply(next);
  }));
}
```

- [ ] **Step 4: Wire it** — in `js/main.js` add `import { initTheme } from './theme.js';` and
  call `initTheme();` as the first line inside the `if (…'.frame')` block.

- [ ] **Step 5: Run** — tests `0 failing`. On `/`: click `PM` → page turns light, label reads
  `AM`; reload → still light; `localStorage.getItem('noesis.theme')` → `'am'`.

- [ ] **Step 6: Checkpoint** — `js/theme.js js/main.js tests/` — `feat: AM/PM theme toggle`.

---

### Task 4: `install.js` — OS toggle and copy

**Files:**
- Create: `js/install.js`, `tests/install.test.js`; Modify: `js/main.js`, `tests/runner.js`

**Interfaces:**
- Produces: `COMMANDS = { unix, windows }` (verbatim README lines), `detectOS(platform) →
  'unix' | 'windows'`, `initInstall(root = document)`.

- [ ] **Step 1: Failing test** — `tests/install.test.js`

```js
import { test, eq } from './harness.js';
import { COMMANDS, detectOS } from '../js/install.js';

test('COMMANDS are the README lines verbatim', () => {
  eq(COMMANDS.unix, 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git && cd Noesis && python3 install.py');
  eq(COMMANDS.windows, 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git; cd Noesis; python install.py');
});
test('detectOS', () => { eq(detectOS('Win32'), 'windows'); eq(detectOS('Windows'), 'windows'); eq(detectOS('MacIntel'), 'unix'); eq(detectOS('Linux x86_64'), 'unix'); eq(detectOS(''), 'unix'); });
```

- [ ] **Step 2: Run** — Expected `FAIL ./install.test.js`.

- [ ] **Step 3: Write `js/install.js`**

```js
export const COMMANDS = {
  unix: 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git && cd Noesis && python3 install.py',
  windows: 'git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git; cd Noesis; python install.py',
};

export function detectOS(platform = '') { return /win/i.test(platform) ? 'windows' : 'unix'; }

export function initInstall(root = document) {
  const code = root.querySelector('[data-install-command]');
  const buttons = [...root.querySelectorAll('[data-install-os]')];
  const copy = root.querySelector('[data-install-copy]');
  if (!code) return;
  const select = os => {
    code.textContent = COMMANDS[os];
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.installOs === os)));
  };
  buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.installOs)));
  select(detectOS(navigator.userAgentData?.platform || navigator.platform));
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent); } catch { return; }
    copy.textContent = 'copied'; copy.dataset.state = 'copied';
    setTimeout(() => { copy.textContent = 'copy'; delete copy.dataset.state; }, 1200);
  });
}
```

- [ ] **Step 4: Wire** — `import { initInstall } from './install.js';` and `initInstall();` after `initTheme()`.

- [ ] **Step 5: Run** — tests `0 failing`. On `/` (Windows host): `Windows` pre-selected and
  the `;` command shown; click `macOS, Linux` → `&&` command; click `copy` → reads `copied`
  for ~1.2 s and the clipboard holds the exact line (paste it somewhere to check).

- [ ] **Step 6: Checkpoint** — `js/install.js js/main.js tests/` — `feat: install line with OS toggle and copy`.

---

### Task 5: `scramble.js` + `reveal.js` — randomised text

**Files:**
- Create: `js/scramble.js`, `js/reveal.js`, `tests/scramble.test.js`; Modify: `js/main.js`, `tests/runner.js`

**Interfaces:**
- Produces: `scrambleFrame(target, progress, rand = Math.random) → string` (pure);
  `scramble(el, { duration = 800 } = {}) → Promise<void>` (stores the final text in
  `el.dataset.text` on first call); `reducedMotion() → boolean`;
  `initReveal()` — (a) `[data-scramble]` scrambles once on first intersection; (b) `[data-terminal]`
  cycles the three traces while visible; (c) `[data-trace]` types its lines on first intersection
  and dispatches `verdict` events; (d) `revealHeader()` scrambles `[data-scramble-onload]` staggered
  60 ms — called by `main.js` when the page goes live. `TRACES` is exported for the terminal.

- [ ] **Step 1: Failing test** — `tests/scramble.test.js`

```js
import { test, eq } from './harness.js';
import { scrambleFrame } from '../js/scramble.js';

const zero = () => 0;   // always the first glyph, '█'
test('scrambleFrame at progress 1 is the target', () => eq(scrambleFrame('ab cd', 1), 'ab cd'));
test('scrambleFrame at progress 0 keeps whitespace and length', () => eq(scrambleFrame('ab cd\nef', 0, zero), '██ ██\n██'));
test('scrambleFrame resolves left to right', () => eq(scrambleFrame('abcd', 0.5, zero), 'ab██'));
```

- [ ] **Step 2: Run** — Expected `FAIL ./scramble.test.js`.

- [ ] **Step 3: Write `js/scramble.js`**

```js
const GLYPHS = '█▓▒░<>/\\|=+-*#@%ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scrambleFrame(target, progress, rand = Math.random) {
  const resolved = Math.floor(progress * target.length);
  let out = '';
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    out += (i < resolved || /\s/.test(ch)) ? ch : GLYPHS[Math.floor(rand() * GLYPHS.length)];
  }
  return out;
}

export function scramble(el, { duration = 800 } = {}) {
  const target = el.dataset.text ?? (el.dataset.text = el.textContent);
  if (reducedMotion()) { el.textContent = target; return Promise.resolve(); }
  return new Promise(resolve => {
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = scrambleFrame(target, p);
      if (p < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}
```

  `scramble()` writes `textContent`, which flattens child `<span data-verdict>`s. Elements that
  need coloured verdicts are handled line-by-line by `reveal.js` (below), which scrambles each
  line's text node and then appends the verdict span.

- [ ] **Step 4: Write `js/reveal.js`**

```js
import { scramble, reducedMotion } from './scramble.js';

// The gate's real output: agent/policy.py:82,105,244,269 and agent/cli.py:212.
export const TRACES = [
  { lines: ['> noesis "fix the failing tests in tests/"', 'act      read_file tests/test_parse.py', 'gate     read_file classified read                          '], verdict: 'auto' },
  { lines: ['act      run_shell rm -rf build', 'gate     run_shell is destructive (recursive delete)        ', '         [a]llow  [s]ession  [d]eny  [q]uit >'], verdict: 'confirm', verdictLine: 1 },
  { lines: ['act      run_shell rm -rf ~', 'gate     run_shell is deleting the root or home directory;', '         refused, and no approval can allow it              '], verdict: 'deny' },
];

function renderTrace(pre, trace) {
  pre.textContent = '';
  const at = trace.verdictLine ?? trace.lines.length - 1;
  trace.lines.forEach((text, i) => {
    pre.append(document.createTextNode(text));
    if (i === at) { const s = document.createElement('span'); s.dataset.verdict = trace.verdict; s.textContent = trace.verdict; pre.append(s); }
    if (i < trace.lines.length - 1) pre.append('\n');
  });
}

async function typeTrace(pre, trace, { fire = false } = {}) {
  renderTrace(pre, trace);
  const nodes = [...pre.childNodes];
  for (const n of nodes) {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
      const span = document.createElement('span'); span.textContent = n.textContent; n.replaceWith(span);
      await scramble(span, { duration: 350 });
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      await scramble(n, { duration: 250 });
      if (fire) document.dispatchEvent(new CustomEvent('verdict', { detail: n.dataset.verdict }));
    }
  }
}

function observeOnce(selector, fn, threshold = 0.4) {
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), { threshold });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
}

function terminalCycle(pre) {
  if (reducedMotion()) return;
  let i = 0, visible = false, waitUntil = 0, busy = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }).observe(pre);
  const tick = async now => {
    if (visible && !document.hidden && !busy && now >= waitUntil) {
      busy = true; i = (i + 1) % TRACES.length;
      await typeTrace(pre, TRACES[i]);
      waitUntil = performance.now() + 6000; busy = false;
    }
    requestAnimationFrame(tick);
  };
  waitUntil = performance.now() + 6000;
  requestAnimationFrame(tick);
}

export function revealHeader() {
  document.querySelectorAll('[data-scramble-onload]').forEach((el, i) => setTimeout(() => scramble(el, { duration: 600 }), i * 60));
}

export function initReveal() {
  observeOnce('[data-scramble]', el => {
    // headings hold a <small>; scramble only the first text node
    const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!node) return scramble(el, { duration: 700 });
    const span = document.createElement('span'); span.textContent = node.textContent; node.replaceWith(span);
    scramble(span, { duration: 700 });
  });
  observeOnce('[data-trace]', async pre => {
    for (const trace of TRACES) { await typeTrace(pre, trace, { fire: true }); await new Promise(r => setTimeout(r, 900)); }
    // leave all three on screen
    pre.textContent = '';
    TRACES.forEach((t, i) => { const block = document.createElement('span'); pre.append(block); renderTrace(block, t); if (i < 2) pre.append('\n\n'); });
  });
  document.querySelectorAll('[data-terminal]').forEach(terminalCycle);
}
```

  `data-trace` in `index.html` must be tall enough for all three traces (Task 1 gave it 5 rows).
  The `[data-terminal]` `<pre>` in the hero starts with trace 0 already rendered (Task 1), so
  the first cycle after 6 s moves to trace 1.

- [ ] **Step 5: Wire** — in `main.js`: `import { initReveal, revealHeader } from './reveal.js';`,
  call `initReveal();` after `initInstall();`, and `revealHeader();` right after the state
  becomes `live` (for now: immediately after `initReveal()`; Task 7 moves it after the loader).

- [ ] **Step 6: Run** — tests `0 failing`. On `/`: header cells scramble in; `JUDGED` /
  `MEASURED` scramble once when first seen; scroll to the gate: the trace types the three
  verdicts and stays; `browser_evaluate` `() => new Promise(r => document.addEventListener('verdict', e => r(e.detail), { once: true }))`
  then scroll the trace into view → resolves `'auto'`. Hero terminal: after ~6 s it scrambles
  to the `confirm` trace; `browser_emulate_media` `reducedMotion: 'reduce'`, reload → text is
  plain and static, terminal does not cycle.

- [ ] **Step 7: Checkpoint** — `js/scramble.js js/reveal.js js/main.js tests/` — `feat: scrambled text, trace typing, terminal cycle`.

---

### Task 6: `sphere.js` — the point sphere

**Files:**
- Create: `vendor/three/three.module.min.js`, `vendor/three/three.core.min.js`,
  `vendor/three/LICENSE`, `vendor/three/VERSION`, `js/sphere.js`, `tests/sphere.test.js`;
  Modify: `js/main.js`, `tests/runner.js`

**Interfaces:**
- Consumes: `themechange` (Task 3), `verdict` (Task 5), section ids (Task 1).
- Produces: `STATES`, `stateFor(sectionId) → key of STATES`, `fibonacciSphere(n) → Float32Array(3n)`,
  `latticeOf(positions, k = 6) → Float32Array`, `mountSphere(canvas) → { ready: Promise<boolean>,
  setState(name), retint(), verdict(kind), unavailable?: true }`. `main.js` exposes the mounted
  instance as `window.__sphere` for verification only.

- [ ] **Step 1: Vendor three.js**

```bash
mkdir -p vendor/three && cd vendor/three && \
curl -sL -o three.module.min.js https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js && \
curl -sL -o three.core.min.js  https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.min.js && \
curl -sL -o LICENSE https://cdn.jsdelivr.net/npm/three@0.180.0/LICENSE && echo 0.180.0 > VERSION && \
grep -c 'three.core.min.js' three.module.min.js
```
  Expected: the last line prints `1` (the module imports its core by relative path, so both
  files must sit side by side). If 0.180.0 is unavailable, use the newest `0.18x.0` that has
  both files and write that into `VERSION`.

- [ ] **Step 2: Failing test** — `tests/sphere.test.js`

```js
import { test, eq, approx } from './harness.js';
import { STATES, stateFor, fibonacciSphere, latticeOf } from '../js/sphere.js';

test('stateFor maps sections to states, unknown → idle', () => {
  eq(['hero', 'numbers', 'gate', 'ledger', 'properties', 'footer', 'nope'].map(stateFor),
     ['idle', 'measured', 'gate', 'ledger', 'memory', 'idle', 'idle']);
});
test('every state names a colour token and the shader knobs', () => {
  for (const s of Object.values(STATES)) { eq(typeof s.color, 'string'); eq(s.color.startsWith('--'), true); for (const k of ['amp', 'order', 'x', 'breathe']) eq(typeof s[k], 'number'); }
});
test('fibonacciSphere points are unit length', () => {
  const p = fibonacciSphere(50); eq(p.length, 150);
  for (let i = 0; i < 50; i++) approx(Math.hypot(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]), 1, 1e-5);
});
test('latticeOf snaps to 1/k steps', () => eq([...latticeOf(new Float32Array([0.26, -0.9, 0.05]), 4)], [0.25, -1, 0]));
```

- [ ] **Step 3: Run** — Expected `FAIL ./sphere.test.js`.

- [ ] **Step 4: Write `js/sphere.js`**

```js
import * as THREE from '../vendor/three/three.module.min.js';

export const STATES = {
  idle:     { color: '--text',   amp: 0.35, order: 0, x: 0,    breathe: 0 },
  measured: { color: '--accent', amp: 0.06, order: 1, x: -0.3, breathe: 0 },
  gate:     { color: '--accent', amp: 0.25, order: 0, x: 0.3,  breathe: 0 },
  ledger:   { color: '--gold',   amp: 0.30, order: 0, x: 0.3,  breathe: 0 },
  memory:   { color: '--violet', amp: 0.50, order: 0, x: 0,    breathe: 1 },
};
const BY_SECTION = { hero: 'idle', numbers: 'measured', gate: 'gate', ledger: 'ledger', properties: 'memory', footer: 'idle' };
export function stateFor(id) { return BY_SECTION[id] ?? 'idle'; }

export function fibonacciSphere(n) {
  const out = new Float32Array(n * 3), golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), phi = i * golden;
    out[i * 3] = Math.cos(phi) * r; out[i * 3 + 1] = y; out[i * 3 + 2] = Math.sin(phi) * r;
  }
  return out;
}
export function latticeOf(positions, k = 6) {
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i++) out[i] = Math.round(positions[i] * k) / k;
  return out;
}

// Ashima / Stefan Gustavson 3D simplex noise (MIT).
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = /* glsl */`
attribute vec3 aSphere; attribute vec3 aLattice; attribute float aRand;
uniform float uTime, uAmp, uOrder, uBurst, uBurstT, uPointSize, uBreathe;
varying float vBurst;
${SNOISE}
void main(){
  vec3 p = mix(aSphere, aLattice, uOrder);
  vec3 n = normalize(aSphere);
  float breathe = 1.0 + uBreathe * 0.08 * sin(uTime * 0.8);
  float d = snoise(p * 1.6 + vec3(0.0, uTime * 0.15, 0.0)) * uAmp;
  p = p * breathe + n * d;
  vBurst = step(aRand, uBurst);
  p += n * vBurst * uBurstT * 2.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPointSize * (3.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
precision mediump float;
uniform vec3 uColor, uRefuse; uniform float uOpacity;
varying float vBurst;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, r) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(mix(uColor, uRefuse, vBurst), a);
}`;

const cssColor = name => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 767px)').matches;

export function mountSphere(canvas) {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) { canvas.remove(); return { ready: Promise.resolve(false), setState() {}, retint() {}, verdict() {}, unavailable: true }; }

  const N = phone() ? 7000 : 14000;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20); camera.position.z = 3.2;

  const sphere = fibonacciSphere(N), rand = new Float32Array(N).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(sphere, 3));
  geo.setAttribute('aSphere', new THREE.BufferAttribute(sphere, 3));
  geo.setAttribute('aLattice', new THREE.BufferAttribute(latticeOf(sphere), 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  const u = {
    uTime: { value: 0 }, uAmp: { value: 0.35 }, uOrder: { value: 0 }, uBurst: { value: 0 }, uBurstT: { value: 0 },
    uPointSize: { value: 2.2 * Math.min(devicePixelRatio, 2) }, uBreathe: { value: 0 }, uOpacity: { value: phone() ? 0.35 : 0.9 },
    uColor: { value: new THREE.Color() }, uRefuse: { value: new THREE.Color() },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat); scene.add(points);

  // targets the loop eases toward (~800 ms settle)
  let state = STATES.idle, targetColor = new THREE.Color(), targetX = 0, rotSpeed = 0.08, pauseUntil = 0, flash = 0, burst = null;
  const baseOpacity = u.uOpacity.value;

  function retint() {
    const theme = document.documentElement.dataset.theme;
    targetColor = cssColor(state.color); u.uRefuse.value = cssColor('--refuse');
    mat.blending = theme === 'pm' ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (reduced()) { u.uColor.value.copy(targetColor); render(); }
  }
  function visibleWidth() { return 2 * camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180) * camera.aspect; }
  function setState(name) {
    state = STATES[name] ?? STATES.idle;
    targetColor = cssColor(state.color);
    targetX = phone() ? 0 : state.x * visibleWidth();
    if (reduced()) { u.uAmp.value = state.amp; u.uOrder.value = state.order; u.uBreathe.value = state.breathe; u.uColor.value.copy(targetColor); points.position.x = targetX; render(); }
  }
  function verdict(kind) {
    if (kind === 'deny') { burst = { t: 0 }; u.uBurst.value = 0.03; }
    if (kind === 'confirm') pauseUntil = performance.now() + 600;
    if (kind === 'auto') flash = 1;
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    points.scale.setScalar(Math.min(1, w / h) * 0.9); setState(Object.keys(STATES).find(k => STATES[k] === state));
  }
  function render() { renderer.render(scene, camera); }

  let last = performance.now(), ready;
  const readyPromise = new Promise(r => { ready = r; });
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt / 0.25);
    u.uAmp.value += (state.amp - u.uAmp.value) * k;
    u.uOrder.value += (state.order - u.uOrder.value) * k;
    u.uBreathe.value += (state.breathe - u.uBreathe.value) * k;
    u.uColor.value.lerp(targetColor, k);
    points.position.x += (targetX - points.position.x) * k;
    if (now > pauseUntil) points.rotation.y += rotSpeed * dt;
    flash = Math.max(0, flash - dt * 2); u.uOpacity.value = baseOpacity + flash * 0.4;
    if (burst) { burst.t += dt / 1.5; u.uBurstT.value = Math.sin(Math.min(1, burst.t) * Math.PI); if (burst.t >= 1) { burst = null; u.uBurst.value = 0; u.uBurstT.value = 0; } }
    u.uTime.value += dt;
    render(); ready(true);
    if (!document.hidden) requestAnimationFrame(frame); else document.addEventListener('visibilitychange', () => { last = performance.now(); requestAnimationFrame(frame); }, { once: true });
  }

  new ResizeObserver(resize).observe(canvas); resize(); retint();
  document.addEventListener('themechange', retint);
  document.addEventListener('verdict', e => verdict(e.detail));
  if (reduced()) { render(); ready(true); } else requestAnimationFrame(frame);
  return { ready: readyPromise, setState, retint, verdict };
}
```

- [ ] **Step 5: Wire in `main.js`** — after `initReveal()`:

```js
import { mountSphere, stateFor } from './sphere.js';
import { readout } from './readouts.js';   // Task 8 creates it; until then, use a local no-op: const readout = () => {};
// …inside the init block:
const sphere = mountSphere(document.getElementById('sphere'));
window.__sphere = sphere;
const sections = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { const s = stateFor(e.target.id); sphere.setState(s); readout('sphere', `sphere: ${s}`); } });
}, { threshold: 0.5 });
document.querySelectorAll('.section[id]').forEach(s => sections.observe(s));
if (sphere.unavailable) readout('sphere', 'sphere: webgl unavailable');
```
  Task 7 changes `mountSphere` into a dynamic `import()` so the loader can count it as a milestone.

- [ ] **Step 6: Run** — tests `0 failing`; no console errors on `/`. Visual: white noisy sphere
  centred in the hero; scrolling to `#numbers` → it moves left, turns lime and snaps to a
  lattice; `#gate` → right, noisy; when the trace types `deny`, a red spray leaves and returns;
  `#ledger` → gold; `#properties` → violet, breathing; toggle `AM/PM` → sphere re-tints without
  a reload (blending switches to normal in AM). `browser_emulate_media` reduced motion + reload
  → one static frame, changes on scroll are instant. `browser_resize` 400×800 → sphere dimmer,
  centred, still behind content. Tab hidden → no frames (DevTools Performance shows 0 rAF).

- [ ] **Step 7: Checkpoint** — `vendor/ js/sphere.js js/main.js tests/` — `feat: point sphere with per-section states`.

---

### Task 7: `loader.js` — the boot sequence

**Files:**
- Create: `js/loader.js`, `css/loader.css`, `tests/loader.test.js`; Modify: `index.html` (add
  `#boot`, remove the temporary `state = 'live'` line from Task 1), `js/main.js`, `tests/runner.js`

**Interfaces:**
- Consumes: `scramble` (Task 5), the sphere's `ready` promise (Task 6).
- Produces: `displayedProgress(real, elapsedMs, floorMs = 2600) → number`;
  `shouldBoot({ reducedMotion, booted, forced }) → boolean` (the inline `<head>` script's twin);
  `runLoader({ milestones: [[Promise, weight], …], floorMs = 2600, capMs = 6000 }) → Promise<void>`
  which removes `#boot` when done and sets `sessionStorage['noesis.booted']`.

- [ ] **Step 1: Failing test** — `tests/loader.test.js`

```js
import { test, eq } from './harness.js';
import { displayedProgress, shouldBoot } from '../js/loader.js';

test('displayedProgress never runs ahead of the time floor', () => { eq(displayedProgress(100, 1300), 50); eq(displayedProgress(100, 0), 0); });
test('displayedProgress stalls at what has really loaded', () => { eq(displayedProgress(40, 2600), 40); eq(displayedProgress(40, 9999), 40); });
test('displayedProgress reaches 100 only when both agree', () => eq(displayedProgress(100, 2600), 100));
test('shouldBoot', () => {
  eq(shouldBoot({ reducedMotion: false, booted: false, forced: false }), true);
  eq(shouldBoot({ reducedMotion: true, booted: false, forced: false }), false);
  eq(shouldBoot({ reducedMotion: false, booted: true, forced: false }), false);
  eq(shouldBoot({ reducedMotion: true, booted: true, forced: true }), true);
});
```

- [ ] **Step 2: Run** — Expected `FAIL ./loader.test.js`.

- [ ] **Step 3: Write `js/loader.js`**

```js
import { scramble } from './scramble.js';

export function displayedProgress(real, elapsedMs, floorMs = 2600) {
  const floor = Math.min(100, (elapsedMs / floorMs) * 100);
  return Math.max(0, Math.min(real, floor));
}

// Twin of the inline <head> script in index.html (which must run before first paint).
export function shouldBoot({ reducedMotion, booted, forced }) { return Boolean(forced || (!reducedMotion && !booted)); }

function typeDots(el, count = 16) {
  return new Promise(resolve => {
    let n = 0, last = 0;
    const tick = now => { if (now - last > 60) { el.textContent = '.'.repeat(++n); last = now; } if (n < count) requestAnimationFrame(tick); else resolve(); };
    requestAnimationFrame(tick);
  });
}

export async function runLoader({ milestones = [], floorMs = 2600, capMs = 6000 } = {}) {
  const el = document.getElementById('boot');
  if (!el) return;
  const fill = el.querySelector('[data-boot-fill]'), pct = el.querySelector('[data-boot-pct]'), skipBtn = el.querySelector('[data-boot-skip]');
  let real = 10, done = false;                           // 10 = the time floor's share
  milestones.forEach(([p, w]) => Promise.resolve(p).then(() => { real += w; }, () => { real += w; }));
  const skip = () => { done = true; };
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Enter') skip(); };
  skipBtn.addEventListener('click', skip); addEventListener('keydown', onKey); skipBtn.focus();

  scramble(el.querySelector('[data-boot-mark]'), { duration: 1200 });
  typeDots(el.querySelector('[data-boot-dots]')).then(() => scramble(el.querySelector('[data-boot-ok]'), { duration: 300 }));

  const start = performance.now();
  await new Promise(resolve => {
    const tick = now => {
      const elapsed = now - start, shown = displayedProgress(real, elapsed, floorMs);
      fill.style.width = `${shown}%`; pct.textContent = `${Math.round(shown)}%`;
      if (done || shown >= 100 || elapsed >= capMs) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  removeEventListener('keydown', onKey);
  try { sessionStorage.setItem('noesis.booted', '1'); } catch {}
  el.dataset.exit = '';
  await new Promise(r => {
    const onEnd = e => { if (e.target === el && e.propertyName === 'opacity') { el.removeEventListener('transitionend', onEnd); r(); } };
    el.addEventListener('transitionend', onEnd);
    setTimeout(r, 1500);                                 // safety if transitions are disabled
  });
  el.remove();
}
```

- [ ] **Step 4: Add `#boot` to `index.html`** — directly after `<div id="veil">`, and remove
  the Task 1 line that forced `state = 'live'`. The mark is the README's block letters.

```html
<div id="boot" class="boot mono" role="status" aria-live="polite">
  <svg class="boot__line boot__line--top" viewBox="0 0 1520 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 H560 L580 60 H940 L960 40 H1520" vector-effect="non-scaling-stroke"/></svg>
  <svg class="boot__line boot__line--bottom" viewBox="0 0 1520 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 H560 L580 20 H940 L960 40 H1520" vector-effect="non-scaling-stroke"/></svg>
  <p class="boot__corner boot__tl">NOESIS // PERSONAL AGENT</p>
  <p class="boot__corner boot__tr">PY 3.12+ · GIT · NO DOCKER</p>
  <p class="boot__corner boot__tl2">STATUS CHECK <span data-boot-dots></span> <span data-boot-ok data-text="OK"></span></p>
  <p class="boot__corner boot__tr2 boot__box">THEME: <span data-theme-label>PM</span></p>
  <div class="boot__panel">
    <pre class="boot__mark" data-boot-mark aria-label="NOESIS">███╗   ██╗ ██████╗ ███████╗███████╗██╗███████╗
████╗  ██║██╔═══██╗██╔════╝██╔════╝██║██╔════╝
██╔██╗ ██║██║   ██║█████╗  ███████╗██║███████╗
██║╚██╗██║██║   ██║██╔══╝  ╚════██║██║╚════██║
██║ ╚████║╚██████╔╝███████╗███████║██║███████║
╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝</pre>
    <p class="boot__title">//SYSTEM LOADING</p>
    <div class="boot__row"><span class="boot__chip">PROGRESS</span><div class="boot__bar"><div class="boot__fill" data-boot-fill></div></div><span class="boot__pct" data-boot-pct>0%</span></div>
    <p class="boot__hint">&lt; esc skips &gt;</p>
  </div>
  <p class="boot__corner boot__bl">LOADING FONTS, THE RENDERER AND 14,000 POINTS.<br>THE PAGE IS STATIC; NOTHING IS SENT ANYWHERE.</p>
  <button class="boot__skip" type="button" data-boot-skip>SKIP LOADING</button>
</div>
```

- [ ] **Step 5: Write `css/loader.css`**

```css
#boot { position: fixed; inset: 0; z-index: 10; background: var(--ground); color: var(--accent); font-size: 12px; letter-spacing: 0.06em; display: none; transition: opacity 700ms ease 300ms; }
html[data-state="booting"] #boot { display: block; }
.boot__line { position: absolute; left: 0; width: 100%; height: 80px; fill: none; stroke: var(--accent); stroke-width: 1; transition: transform 300ms ease-in; }
.boot__line--top { top: 0; } .boot__line--bottom { bottom: 0; }
.boot__corner { position: absolute; margin: 0; }
.boot__tl { top: 24px; left: 40px; } .boot__tr { top: 24px; right: 40px; }
.boot__tl2 { top: 64px; left: 40px; } .boot__tr2 { top: 60px; right: 40px; }
.boot__bl { bottom: 24px; left: 40px; font-size: 8px; line-height: 1.5; }
.boot__box { border: 1px solid var(--accent); padding: 6px 10px; }
.boot__panel { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(640px, calc(100% - 48px)); background: var(--surface); border: 1px solid var(--rule); border-top-color: var(--accent); padding: 32px 40px; transition: transform 300ms ease-in, opacity 300ms ease-in; }
.boot__mark { margin: 0 0 20px; font-size: clamp(6px, 1.2vw, 12px); line-height: 1.1; white-space: pre; color: var(--accent); }
.boot__title { margin: 0 0 16px; color: var(--text); text-align: center; }
.boot__row { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; }
.boot__chip { border: 1px solid var(--accent); padding: 8px 12px; }
.boot__bar { height: 14px; border: 1px solid var(--accent); padding: 2px; }
.boot__fill { height: 100%; width: 0; background: var(--accent); }
.boot__pct { min-width: 4ch; text-align: right; }
.boot__hint { margin: 16px 0 0; text-align: center; }
.boot__skip { position: absolute; right: 40px; bottom: 40px; font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--rule); padding: 8px 14px; cursor: pointer; letter-spacing: 0.08em; }
.boot__skip:hover { border-color: var(--accent); color: var(--accent); }
#boot[data-exit] { opacity: 0; }
#boot[data-exit] .boot__panel { transform: translate(-50%, -50%) scaleY(0.02); opacity: 0; }
#boot[data-exit] .boot__line--top { transform: translateY(-100%); } #boot[data-exit] .boot__line--bottom { transform: translateY(100%); }
@media (max-width: 767px) { .boot__tl2, .boot__tr2, .boot__bl { display: none; } .boot__panel { padding: 24px; } .boot__skip { right: 16px; bottom: 16px; } }
```

- [ ] **Step 6: Wire the boot order in `main.js`** — replace the sphere mounting from Task 6:

```js
import { runLoader } from './loader.js';
// …inside the init block, after initReveal():
const sphereReady = import('./sphere.js').then(m => {
  const s = m.mountSphere(document.getElementById('sphere')); window.__sphere = s; return s;
});
if (document.documentElement.dataset.state === 'booting') {
  await runLoader({ milestones: [[document.fonts.ready, 30], [sphereReady, 30], [sphereReady.then(s => s.ready), 30]] });
}
document.documentElement.dataset.state = 'live';
revealHeader();
document.querySelector('[data-install-command]')?.focus({ preventScroll: true });
const sphere = await sphereReady;
const { stateFor } = await import('./sphere.js');
// …then the section observer from Task 6 (using `sphere` and `stateFor`).
```
  Make the init block an `async` IIFE so `await` is allowed. Remove the static
  `import { mountSphere, stateFor }` line.

- [ ] **Step 7: Run** — tests `0 failing`. In the browser: clear `sessionStorage`, reload →
  the framed loader shows, dots type, `OK` scrambles in, the mark resolves, the bar climbs and
  reaches 100 % at ≈2.6 s, exits, the veil wipes diagonally, header scrambles in, focus is on
  the install command. Reload → straight to the page. `/?boot` → loader again. Press `Esc` at
  40 % → immediate exit. DevTools network throttled to "Slow 3G" + `/?boot` → the bar stalls at
  40 % until the sphere module lands (or 6 s). `browser_emulate_media` reduced motion → no loader.
  `browser_console_messages` → no errors.

- [ ] **Step 8: Checkpoint** — `js/loader.js css/loader.css index.html js/main.js tests/` — `feat: boot sequence with honest progress`.

---

### Task 8: `readouts.js`, cell hover readout, reduced-motion pass

**Files:**
- Create: `js/readouts.js`, `tests/readouts.test.js`; Modify: `js/main.js` (real import replaces
  the no-op), `tests/runner.js`, `index.html` (readout elements where missing)

**Interfaces:**
- Produces: `readout(name, text)` → writes `text` into every `[data-readout="name"]`.

- [ ] **Step 1: Failing test** — `tests/readouts.test.js`

```js
import { test, eq } from './harness.js';
import { readout } from '../js/readouts.js';

test('readout writes to every matching element and nothing else', () => {
  const a = document.createElement('p'), b = document.createElement('p'), c = document.createElement('p');
  a.dataset.readout = 'x'; b.dataset.readout = 'x'; c.dataset.readout = 'y';
  document.body.append(a, b, c);
  readout('x', 'hello');
  eq([a.textContent, b.textContent, c.textContent], ['hello', 'hello', '']);
  a.remove(); b.remove(); c.remove();
});
```

- [ ] **Step 2: Run** — Expected `FAIL ./readouts.test.js`.

- [ ] **Step 3: Write `js/readouts.js`**

```js
export function readout(name, text) {
  document.querySelectorAll(`[data-readout="${name}"]`).forEach(el => { el.textContent = text; });
}
```

- [ ] **Step 4: Wire the live values in `main.js`** — import `readout`; delete the no-op. Add:

```js
// scroll readout (rides the existing scroll listener)
readout('scroll', `scroll: ${getComputedStyle(document.documentElement).getPropertyValue('--scroll')}`);
// sphere readout with a coarse fps
let frames = 0, fpsAt = performance.now(), fps = 0;
(function fpsTick(now) { frames++; if (now - fpsAt > 1000) { fps = frames; frames = 0; fpsAt = now; readout('sphere', `sphere: ${currentState} · ${sphere.unavailable ? 'webgl unavailable' : `${matchMedia('(max-width: 767px)').matches ? '7,000' : '14,000'} pts · ${fps} fps`}`); } if (!document.hidden) requestAnimationFrame(fpsTick); })(performance.now());
// hovered cell's live clip-path
document.querySelectorAll('.cell').forEach(cell => cell.addEventListener('pointermove', () => readout('cell', `clip-path: ${getComputedStyle(cell, '::after').clipPath}`)));
```
  Keep `currentState` updated in the section observer. Add `<p class="readout mono" data-readout="scroll">`
  in the footer and `<p class="readout mono" data-readout="cell">` in `#numbers` (left of the
  table, grid-column 1 / span 6, last row), placed in `site.css` like the other readouts. Skip
  the fps loop entirely under reduced motion (`readout('sphere', 'sphere: static')`).

- [ ] **Step 5: Reduced-motion pass** — `browser_emulate_media` `reducedMotion: 'reduce'`, reload:
  no loader, no scramble, static sphere, no cycling terminal, no fps loop, `--t-fast`/`--t-mid`
  are `0ms`, veil is already off (check `html[data-state="live"] #veil` applies with no
  transition delay — add `@media (prefers-reduced-motion: reduce) { #veil { transition: none; } }`
  to `site.css`). Then `reducedMotion: 'no-preference'` and confirm everything animates again.

- [ ] **Step 6: Run** — tests `0 failing`; readouts show real values; the cell readout changes
  while a cell's hover border draws.

- [ ] **Step 7: Checkpoint** — `js/readouts.js js/main.js index.html css/site.css tests/` — `feat: live readouts; reduced-motion pass`.

---

### Task 9: `scripts/check_numbers.py` — every figure is borrowed

**Files:**
- Create: `scripts/check_numbers.py`, `tests/test_check_numbers.py`, `tests/__init__.py` (empty)

**Interfaces:**
- Produces: `figures(html_text) → sorted list[str]`, `normalise(text) → str`,
  `unmatched(page_text, sources: list[str]) → list[str]`, `ALLOW` (the page's own facts),
  `main() → int`. Env `NOESIS_AGENT_DIR` overrides the agent repo path (default `..\Personal_Agent`).

- [ ] **Step 1: Failing test** — `tests/test_check_numbers.py`

```python
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_numbers import figures, unmatched


class Figures(unittest.TestCase):
    def test_extracts_and_normalises(self):
        self.assertEqual(figures("<td>15/15</td> 85.7 % and 1,197 tests, 5 × 3"),
                         ["1,197", "15/15", "5x3", "85.7%"])

    def test_unmatched_reports_only_missing(self):
        self.assertEqual(unmatched("9/18 and 99/99", ["real 9/18"]), ["99/99"])

    def test_allowlist_covers_the_pages_own_facts(self):
        self.assertEqual(unmatched("14,000 pts and 7,000 pts", [""]), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run** — `python -m unittest tests.test_check_numbers -v`. Expected: `ModuleNotFoundError: No module named 'check_numbers'`.

- [ ] **Step 3: Write `scripts/check_numbers.py`**

```python
#!/usr/bin/env python3
"""Every figure on the page must exist in the agent repository's README or eval/CHANGELOG.

The site has no measurement of its own. Run before every commit; exit 1 lists the figures
that the agent repo does not carry.
"""
import html
import os
import re
import sys
from pathlib import Path

FIGURE = re.compile(r"\d+/\d+|\d+(?:\.\d+)?\s?%|\d{1,3}(?:,\d{3})+|\d+\s*(?:x|×)\s*\d+")

# Facts about the page itself, not claims about the agent.
ALLOW = {"14,000", "7,000"}


def normalise(text: str) -> str:
    return re.sub(r"\s+", "", text).replace("×", "x")


def figures(page_text: str) -> list[str]:
    text = html.unescape(re.sub(r"<[^>]+>", " ", page_text))
    return sorted({normalise(m.group(0)) for m in FIGURE.finditer(text)})


def unmatched(page_text: str, sources: list[str]) -> list[str]:
    corpus = normalise("\n".join(sources))
    return [f for f in figures(page_text) if f not in ALLOW and f not in corpus]


def main() -> int:
    site = Path(__file__).resolve().parents[1]
    agent = Path(os.environ.get("NOESIS_AGENT_DIR", site.parent / "Personal_Agent"))
    sources = [(agent / p).read_text(encoding="utf-8") for p in ("README.md", "eval/CHANGELOG.md")]
    missing = unmatched((site / "index.html").read_text(encoding="utf-8"), sources)
    for figure in missing:
        print(f"not in the agent repo: {figure}")
    print(f"{len(missing)} unmatched figure(s)")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the unit tests** — `python -m unittest tests.test_check_numbers -v`. Expected: 3 `ok`.

- [ ] **Step 5: Run it against the page** — `python scripts/check_numbers.py`. Expected:
  `0 unmatched figure(s)`. If any figure is listed, it is either a typo on the page (fix the
  page) or a figure the agent repo does not carry (remove it from the page — never add it to
  `ALLOW`). Add `python scripts/check_numbers.py` to the commit routine in `README.md` if not
  already there (Task 0 wrote it).

- [ ] **Step 6: Checkpoint** — `scripts/ tests/` — `feat: check that every figure is borrowed from the agent repo`.

---

### Task 10: `CLAUDE.md`, final verification, Pages

**Files:**
- Modify: `CLAUDE.md` (full rewrite), `README.md` (if anything changed)

- [ ] **Step 1: Rewrite `CLAUDE.md`** with these sections, each a few lines:
  1. *What this is* — the landing page for NOESIS at `D:\Personal_Agent` (GitHub `notjwp/Noesis`);
     one static page; Pages from `main`/root.
  2. *Layout* — the tree from Part A "Repository layout", one line each.
  3. *Working here* — `python -m http.server 8000`; tests at `/tests/` and
     `python -m unittest discover tests`; `python scripts/check_numbers.py` before any commit;
     no `git add`/commit/push unless asked; no attribution trailers; 400 px rule; no new runtime
     dependency; edit `index.html` directly (there is no build step).
  4. *The numbers are borrowed, never owned* — the four rules from the draft (change here when the
     agent's numbers change; never round up or quote the better run or drop the `n`; `reverted`
     and `off by default` rows stay; gate strings are `agent/policy.py` output).
  5. *Design system* — the token table from Part A (both themes), the two fonts, the grid
     (`--cols`/`--cell`, subgrid, cells on the rules), and the sphere's state table.
  6. *Motion rules* — Part A "Motion rules" verbatim, plus: the loader is once per session,
     `?boot` forces it, everything honours `prefers-reduced-motion`.
  7. *The page, top to bottom* — one line per section naming its id and what it holds.

- [ ] **Step 2: Full verification pass**
  - `python -m unittest discover tests -v` → all `ok`; `/tests/` → `0 failing`.
  - `python scripts/check_numbers.py` → `0 unmatched figure(s)`.
  - `browser_console_messages` on `/`, `/?boot`, and after a full scroll → no errors or warnings.
  - Screenshots at 1440×900, 1024×768, 400×800 in both themes; `scrollWidth === clientWidth` at 400.
  - Loader: fresh session shows it; reload does not; `?boot` does; `SKIP LOADING`, `Esc`, and a
    throttled load all end on the live page with focus on the install command.
  - Sphere: five state changes on scroll; `deny` ejects red; AM/PM re-tints live; hidden tab → 0 % CPU.
  - Copy: both OS lines land on the clipboard exactly.
  - Lighthouse (Chrome DevTools, mobile + desktop, on `/` with the loader already booted):
    Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90; no contrast failures in either theme.
  - Serve with `python -m http.server` from the root and open `http://localhost:8000/index.html`
    in a fresh browser profile — the same path Pages serves.

- [ ] **Step 3: Checkpoint** — `CLAUDE.md README.md` — `docs: describe the built page`.

- [ ] **Step 4: Publish (owner's actions)** — create `notjwp/noesis-site` on GitHub, push
  `main`, Settings → Pages → Deploy from a branch → `main` / `/ (root)`. Open
  `https://notjwp.github.io/noesis-site/` and `…/?boot`; re-run the console and 400 px checks there.

---

## Self-review against Part A

- Loader §0 → Task 7 (frame, corners, mark, honest progress, exit, once-per-session, `?boot`,
  reduced motion, no audio). Hero §1 → Tasks 1, 4, 5, 6. Numbers §2 → Task 1 (+ Task 9 guards
  the figures). Gate §3 → Tasks 1, 5 (`verdict` events), 6 (burst/pause/flash). Ledger §4 →
  Task 1; hover tint of the sphere on ledger rows is *not* covered — add to Task 8 Step 4:
  `document.querySelectorAll('#ledger .row').forEach(r => { r.addEventListener('pointerenter', () => sphere.tint(r.dataset.kind === 'reverted' ? '--refuse' : r.dataset.kind === 'kept' ? '--accent' : null)); r.addEventListener('pointerleave', () => sphere.tint(null)); })`
  and to `mountSphere`'s return a `tint(token)` that sets `targetColor = cssColor(token ?? state.color)`.
  Properties §5, Footer §6 → Task 1. Theme → Task 3. Grid, header, ruler → Tasks 1, 2. Readouts
  → Task 8. Accessibility list → Tasks 1, 7, 8, 10. `check_numbers` → Task 9. CLAUDE.md → Task 10.
- Names used across tasks: `cellSize`, `initTheme`, `resolveTheme`, `initInstall`, `COMMANDS`,
  `detectOS`, `scramble`, `scrambleFrame`, `reducedMotion`, `initReveal`, `revealHeader`, `TRACES`,
  `STATES`, `stateFor`, `fibonacciSphere`, `latticeOf`, `mountSphere` → `{ ready, setState,
  retint, verdict, tint, unavailable }`, `displayedProgress`, `shouldBoot`, `runLoader`, `readout`,
  `figures`, `normalise`, `unmatched`, `ALLOW` — consistent between definition and use.

## Out of scope (possible follow-ups)

- Interactive `[a]llow [s]ession [d]eny` keys in the trace that drive the sphere.
- Sound. A `/changelog` timeline page. Any figure the agent repo does not carry.
