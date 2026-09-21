# NOESIS landing page — design

## Context

`D:\noesis-site` is an empty repo (one draft `CLAUDE.md`, nothing committed) that will hold the
single-page site for NOESIS, the personal agent at `D:\Personal_Agent` (GitHub `notjwp/Noesis`).
It will be served by GitHub Pages from `main`/root at `https://notjwp.github.io/noesis-site/`.

The owner wants one page that combines two references:

- **retronovaworld.webflow.io** — the full-screen HUD loader (framed lines, progress bar, corner
  readouts, "skip loading"), text that scrambles/randomises before resolving, and colour.
- **vanlent.dev** — the type (Montserrat weight 200 headings + IBM Plex Mono readouts), the
  minimalism, the WebGL particle sphere that changes colour per section, and the ruled grid whose
  cells each hold their own content, with an AM/PM light–dark toggle.

Decisions made with the owner:

| question | answer |
|---|---|
| The draft `CLAUDE.md` (forbids animation, names Bricolage Grotesque, "nothing centred") | **Draft.** Content and design are both open; rewrite it at the end to describe what was built. Every figure still comes from the agent repo — the agent's README makes the same promise. |
| Intro | **Full retronova-style loader** — framed HUD, progress bar 0–100 %, corner status text, skip button. |
| Colour | **The sphere carries it.** Base palette is the terminal's (`noesis-mono`: near-black, lime, red). The sphere shifts hue and behaviour per section; every colour means something. |
| Theme | **AM/PM toggle** — both palettes, remembered in `localStorage`, default follows the OS. |
| Order | **The install line comes first** — top of the hero, directly under the header, before the display words; first in source order so it leads on phones too. |

Verified against the agent repo: `noesis-mono` tokens in `agent/ui/theme.py:27-48`; the gate's
reason strings in `agent/policy.py:82-110` (DANGER/HARDLINE rule names) and `:244,269`; the
approval prompt in `agent/cli.py:212`; install lines and the numbers table in
`README.md:34-42,192-204`; ledger figures in `eval/CHANGELOG.md` (e.g. `:396` `edit_file`
0/9 → 4/7, `:766` planning +30 %). Both reference sites were inspected live: vanlent uses
Montserrat + IBM Plex Mono and a WebGL canvas; retronova uses GSAP + three.js + Unicorn Studio +
Howler + Lenis and three paid fonts — we borrow the ideas, not the stack.

## Approach

**Static vanilla HTML/CSS/JS + a vendored three.js, no bundler.**

- `index.html` at the root is what Pages serves; ES modules under `js/`; CSS under `css/`;
  `vendor/three/three.module.min.js` + `three.core.min.js` pinned, so the site has no third-party
  runtime dependency and previews offline.
- Dev server is `python -m http.server` (ES modules need http, not `file://`). No node toolchain.
- Scroll-driven state uses `IntersectionObserver` + one `requestAnimationFrame` loop. No GSAP, no
  Lenis, no smooth-scroll hijack — native scroll.
- Tests: a zero-dependency in-browser runner (`tests/index.html`) for the JS modules' pure
  functions, `unittest` for the Python check script, and a browser checklist for what only eyes
  can verify.

Alternative considered and rejected: Vite + three (npm) + GSAP, deployed by a GitHub Action.
Smaller three.js bundle and shorter animation code, but a node toolchain, CI deploy and `dist/`
indirection for a one-page site whose owner works in Python.

## Repository layout

```
index.html                  the page; semantic sections, all copy lives here
css/tokens.css              colour tokens for both themes, type scale, --cell/--cols
css/grid.css                body rules, .frame, .section (subgrid), .cell, header, ruler, readout
css/site.css                per-section placement and styling, table, tiers, ledger, install line
css/loader.css              the boot overlay and its exit transition
js/main.js                  boot order; cellSize(); section observer → sphere; scroll → ruler
js/theme.js                 resolveTheme(), initTheme(); `themechange` event
js/install.js               COMMANDS, detectOS(), initInstall()
js/scramble.js              scrambleFrame() (pure), scramble(el) (rAF)
js/reveal.js                data-scramble headings, header scramble-in, terminal cycle, trace typing
js/sphere.js                STATES, stateFor(), fibonacciSphere(), latticeOf(), mountSphere()
js/loader.js                displayedProgress(), shouldBoot(), runLoader()
js/readouts.js              readout(name, text)
vendor/three/               three.module.min.js, three.core.min.js, LICENSE, VERSION
tests/index.html            opens the runner
tests/harness.js            test(), eq(), approx()
tests/runner.js             imports every *.test.js, prints PASS/FAIL, sets window.__results
tests/*.test.js             one per module
tests/test_check_numbers.py unittest for the Python script
scripts/check_numbers.py    every figure in index.html must appear in the agent's README/CHANGELOG
.claude/launch.json         `python -m http.server 8000`
.nojekyll
CLAUDE.md                   rewritten to describe this design
README.md                   what, run locally, deploy
docs/superpowers/specs/2026-09-20-noesis-site-design.md    Part A of this file
docs/superpowers/plans/2026-09-20-noesis-site.md           Part B of this file
```

## Design system

### Colour — two themes, one meaning per colour

| token | PM (dark) | AM (light) | role |
|---|---|---|---|
| `--ground` | `#0A0B0D` | `#F6F7F9` | page |
| `--surface` | `#1A1D21` | `#FFFFFF` | code blocks, install line, trace, loader panel |
| `--rule` | `#22262B` | `#D9DEE5` | every grid line and border |
| `--text` | `#E6E8EB` | `#111318` | body, sphere at rest |
| `--muted` | `#848C9C` | `#6B7280` | labels, `auto`, secondary copy (PM lifted from the TUI's `#6B7280` so 11 px text clears 4.5:1) |
| `--accent` | `#A3E635` | `#4D7C0F` | wordmark `NOE`, `confirm`, `kept`, scores, loader frame |
| `--refuse` | `#FF5F56` | `#C62828` | `deny`, `reverted`, ejected points — nowhere else |
| `--gold` | `#E5B84A` | `#9A6B00` | sphere in the ledger section only |
| `--violet` | `#A78BFA` | `#6D4BD6` | sphere in the memory section only |

Other PM tokens are the TUI's `noesis-mono` theme verbatim. Tokens live on
`:root[data-theme="pm"]` / `:root[data-theme="am"]`; an inline `<script>` in `<head>` sets
`data-theme` before first paint (stored value, else `prefers-color-scheme`). The sphere reads its
colours from `getComputedStyle` on start and on `themechange`.

### Type

- **Montserrat** 200 / 300 / 400 / 500 — headings (200, uppercase, `letter-spacing: 0.06em`),
  body (300/400). Google Fonts, `display=swap`, `preconnect`.
- **IBM Plex Mono** 400 / 500 — everything that reads as output: wordmark, install line, trace,
  table figures (`tabular-nums`), verdict labels, loader text, cell-corner readouts (11 px).
- Fallbacks: `Montserrat, "Segoe UI", system-ui, sans-serif`; `"IBM Plex Mono", Consolas,
  "SF Mono", monospace`.

### The grid

- `--cols`: 20 at ≥1200 px, 16 at 768–1199, 8 below 768. `--cell` = `floor(clientWidth / cols)`
  set by `js/main.js` on resize (`100vw` would misalign by the scrollbar on Windows); the
  leftover pixels split left/right as `--grid-x`, which also offsets the body background so
  the rules meet the frame's edges.
- The rules are the `body` background: two 1 px `linear-gradient` layers at `background-size:
  var(--cell) var(--cell)`. They scroll with content, so anything sized in whole cells sits on
  the lines.
- `.frame` is `display: grid; grid-template-columns: repeat(var(--cols), var(--cell));
  grid-auto-rows: var(--cell)`; each `.section` spans all columns and uses `subgrid`, so children
  place with `grid-column` / `grid-row` in cell units. Below 768 px every child becomes
  `grid-column: 1 / -1; grid-row: auto` and stacks in source order.
- A `.cell` is `border: 1px solid var(--rule); background: var(--ground)`; hover draws a
  brighter inset border via a `clip-path: inset()` transition on `::after`, and the readout in
  its corner prints the live `clip-path` value.
- **Header**: fixed, one cell tall, opaque. Cells: `NOE`+`SIS` wordmark, `M` menu (a one-column
  list of section anchors), spacer, the theme icon (the one toggle).
- **Ruler**: fixed at the bottom, one cell tall, tick marks every `--cell/8`, a 1 px marker whose
  `left` is scroll progress.

### Motion rules

- CSS transitions or the one rAF loop. No idle `setInterval`. The hero terminal cycle runs on
  rAF and stops when offscreen (IntersectionObserver) or the tab is hidden (`visibilitychange`).
- `prefers-reduced-motion: reduce`: loader skipped, scramble resolves instantly, sphere drawn
  once and not rotated, section colour changes instant.
- Durations: scramble 600–900 ms, cell hover 180 ms, sphere state tween ~800 ms, loader exit 700 ms.

## The page, top to bottom

Cell coordinates are for the 20-column grid; 16 columns keep the same relative placement; 8
columns stack.

### 0. Loader (`#boot`)

Retronova's frame, NOESIS's content. Nothing on it is fake.

- Full-viewport `--ground` overlay. Top and bottom **notched frame lines** (inline SVG, stroke
  `--accent`). Corner readouts, mono 12 px, `--accent`:
  - TL `NOESIS // PERSONAL AGENT` · TR `PY 3.12+ · GIT · NO DOCKER`
  - row 2 TL `STATUS CHECK ................ OK` (dots type in, `OK` scrambles in)
  - row 2 TR, boxed: `THEME: PM` (or `AM`)
  - BL, two tiny lines: `LOADING FONTS, THE RENDERER AND 14,000 POINTS.` / `THE PAGE IS STATIC;
    NOTHING IS SENT ANYWHERE.` · BR: **`SKIP LOADING`** button
- Centre panel (`--surface`, top border `--accent`): the block-letter **NOESIS** mark from the
  README (`<pre>`) scrambling into place; `//SYSTEM LOADING`; `PROGRESS` chip, bar, `NN%`;
  beneath, `< esc skips >`.
- **Honest progress.** Milestones: `document.fonts.ready` 30, `import('./sphere.js')` 30, the
  sphere's first frame 30; 10 is the time floor's share. Displayed = `min(real, floor(t))`, floor
  rising 0→100 over 2.6 s, so the bar never runs ahead and stalls visibly if a load is slow. Hard
  cap 6 s. Skip = button, `Esc`, `Enter`.
- **Exit**: panel collapses, frame lines retract, overlay fades 700 ms → `<html
  data-state="live">` → a diagonal veil wipes off the page (900 ms) and header cells scramble in
  staggered 60 ms.
- Plays **once per session** (`sessionStorage['noesis.booted']`); `?boot` forces it;
  reduced-motion skips it. No audio.

### 1. Hero (`#hero`, rows 1–10)

- Sphere centred (cols 8–13) — the only centred thing on the page.
- `01. A PERSONAL AGENT` (col 3, row 2); `02. RUNS ON YOUR MACHINE` (right, row 2).
- **The install line comes first** (rows 3–4, cols 3–9), directly under the label and before
  anything else on the page — the one call to action. OS toggle `macOS, Linux` | `Windows`
  (pre-selected from the platform), the command in a `--surface` cell that scrolls horizontally
  if it must, a copy button that reads `copied` for 1.2 s. Under it, muted: *Python 3.12+ and
  git. No Docker, no VM. The clone is about 1 MB.* It is first in source order too, so on a
  phone it is the first block under the header, and the loader hands focus to it.
  Commands, verbatim from the README:
  - `git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git && cd Noesis && python3 install.py`
  - `git clone --filter=blob:none --sparse https://github.com/notjwp/Noesis.git; cd Noesis; python install.py`
- Below it (rows 6–7), Montserrat 200: **`JUDGED`** / `every tool call` on the left of the
  sphere; **`MEASURED`** / `every number` on the right.
- Under the left words (row 8): *"Give it a goal in plain English — fix these tests, cut a
  release, answer my email — and it plans, uses tools, and works until it is done or tells you
  why it stopped."*
- Right (rows 7–9, cols 15–18): **the terminal box** — cycles three real traces every ~6 s via
  scramble:

  ```
  > noesis "fix the failing tests in tests/"
  act      read_file tests/test_parse.py
  gate     read_file classified read                          auto
  ```
  ```
  act      run_shell rm -rf build
  gate     run_shell is destructive (recursive delete)        confirm
           [a]llow  [s]ession  [d]eny  [q]uit >
  ```
  ```
  act      run_shell rm -rf ~
  gate     run_shell is deleting the root or home directory;
           refused, and no approval can allow it              deny
  ```
  Verdicts coloured `--muted` / `--accent` / `--refuse`.
- Readout, hero bottom-left: `sphere: idle · 14,000 pts · 60 fps`.

### 2. Measured, not claimed (`#numbers`, rows 11–20)

- Heading `MEASURED, NOT CLAIMED`; sub *"Every change is scored three times per case and kept
  only if a number moved. The agent is never the judge of its own success."* Right cell: boxed
  link `Read the changelog` → `https://github.com/notjwp/Noesis/blob/main/eval/CHANGELOG.md`.
- Sphere to the left third, **measured** state (lime, points snap to a lattice).
- The table (cols 8–20), figures mono tabular, scores `--accent`, the `real` row's score `--text`:

  | split | what it measures | score |
  |---|---|---|
  | dev | bug fixes in small projects | 15/15 |
  | held out | the same, on cases never tuned against | 30/30 |
  | real repositories | six real projects, real bugs | 9/18 |
  | tools | long-running processes, asking the user | 9/9 |
  | search / web | finding things out | 9/9 · 18/18 |
  | memory recall | remembering across sessions | 85.7% |
  | skills | loading the right procedure | 94.4% |

- Footnote, muted: model `nvidia/nemotron-3-super-120b-a12b` on NVIDIA's free tier; 1,197
  offline tests with no API key and no network; `real` is the one split with headroom and has
  been flat since early September — 10, 11 and 9 of 18 across three runs of the same code —
  recorded as flat, not as progress; two of its six cases have never passed on this model.

### 3. The gate (`#gate`, rows 21–32)

- Heading `EVERY CALL IS JUDGED BEFORE IT RUNS`; sub *"Four nodes in a loop, and only one of
  them talks to a model."*
- Four cells: `act` (tag `→ model`) · `gate` · `execute` · `reflect` (tag `no API key needed`).
- Sphere right, **gate** state. The trace cell (cols 1–10) types the three traces from §1 in
  sequence on first intersection; each resolved verdict dispatches
  `new CustomEvent('verdict', { detail: 'auto' | 'confirm' | 'deny' })` on `document`: `auto`
  brightens the sphere, `confirm` pauses its rotation for a beat, `deny` ejects ~3 % of points in
  `--refuse`, reabsorbed over 1.5 s.
- Three tier cells: **auto** — reads, searches, edits and commands inside the workspace; reads
  outside it too. **confirm** — recursive deletes, force-push, `sudo`, writing `/etc` or the shell
  profile, reading `.ssh` or `.env`, piping the internet into a shell, a program run through a
  read-only tool's flag; refused unattended; `s` allows that rule for the session (`rm -rf build`
  once and recursive deletes stop asking; a force-push still asks). **deny, even if you say
  yes** — deleting `/` or home, writing a block device, formatting a filesystem, shutting the
  machine down, a fork bomb. *"Saying allow trusts it with your files. It does not trust it with
  the disk."*
- One muted line: *"On your machine, natively — no container. The gate is the whole boundary, a
  deliberate trade: a sandbox would keep it from the files a personal assistant exists to read.
  `noesis --doctor` says which one you are in."*

### 4. The ledger (`#ledger`, rows 33–44)

- Heading `KEPT · REVERTED · OFF BY DEFAULT`, the three words in `--accent` / `--refuse` /
  `--muted`; sub *"A month of change-one-thing cycles. The ones that did not make it stay on the
  record."*
- Sphere right, **ledger** state (gold); hovering a row tints it lime (kept) or red (reverted).
- Rows (label mono · change · before → after mono), each checked against the changelog by
  `scripts/check_numbers.py`:
  - kept — `edit_file`, a targeted edit, described as one — real repositories 0/9 → 4/7
  - kept — turn cap 12 → 30 — dev 13/15 → 15/15; runs were starved of turns, not tokens
  - kept — dense retrieval over keyword search for memory — 0/40 → 37/40 on 170 episodes
  - kept — extract lessons at session end instead of asking the model to — authoring 3.3% → 11/11
  - reverted — hybrid keyword + dense retrieval — 6/6 against 5/6, and the gain was a bug; fixed, 3/6
  - reverted — naming line numbers on ambiguous edits — 0/3 → 0/3
  - reverted — two nudges for a stalled run — fired 0 of 30 and 1 of 15
  - off by default — a planning phase before acting — +30% tokens, same pass rate; still `/plan`
  - off by default — rewriting a skill the run found wanting — real 3/3 vs 1/3, then found to flag
    good skills: 6 of the 7 it marked had passed
- Readout: `rows: 9 · kept 4 · reverted 3 · off 2`.

### 5. Three properties (`#properties`, rows 45–52)

Three cells (cols 1–6, 8–13, 15–20):

- `03. IT REMEMBERS` — what you told it, what worked, how you like things done; a local SQLite
  file you can open. A runbook it reads becomes a skill it loads next time.
- `04. IT CAN BE LEFT ALONE` — queue tasks, schedule them with cron, point it at a mailbox with a
  default-deny allowlist. State is written after every step; it survives being killed mid-task.
- `05. IT RUNS WHERE YOU ARE` — Python 3.12+, any OpenAI-compatible endpoint or Anthropic, NVIDIA's
  free tier by default. `noesis --doctor` checks every precondition and changes nothing.

Sphere behind the middle cell, **memory** state (violet, slow breathing).

### 6. Footer (`#footer`, rows 53–55)

Links `github` · `readme` · `changelog` · `install` (to `#hero`); one muted line: *"Every figure
on this page is in the README and `eval/CHANGELOG.md`, next to the runs that produced it and the
changes that did not make it."* Sphere back to **idle**.

## Accessibility and performance

- Sections have `aria-labelledby`; `#boot` is `role="status"`, focus lands on `SKIP LOADING`
  while it shows and moves to the install command after; the menu is a `<nav>`.
- The canvas is `aria-hidden`; scrambled elements keep their final text in `data-text`.
- All text ≥ 4.5:1 in both themes.
- 400 px: no horizontal scroll on the body; only the install line and the table scroll inside
  their cells.
- Budget: three.js ~170 KB gz, own code < 40 KB, two fonts. Lighthouse ≥ 90 / 90 / 90 with the
  loader skipped.

## Follow-up 2 — the installer gets its own section (owner request, 2026-09-20)

`#install` is now the first section under the header, before `#hero`: the block-letter NOESIS
mark centred as the page's `h1` (the hero's `Judged` becomes an `h2`), label `01. Install`,
heading `Not curl | sh` / *an installer the agent's own gate would run*, the requirements sub-line (clone ≈ 1 MB; pip dependencies ≈ 130 MB, both README figures), the OS toggle, the full command (fits one line at
20 and 16 columns), copy, and two notes from the README — *Not `curl | sh`, deliberately…* and
*Then `noesis`… Updating later is `noesis --update`.* The hero keeps the words, sentence,
terminal and readout; labels renumber `02.`–`06.`. The sphere gains an `install` state (idle
colours, parked right) so it stays clear of the block; `stateFor('install') → 'install'`. Menu
and footer `install` anchors point at `#install`.
