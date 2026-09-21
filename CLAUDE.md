# CLAUDE.md

The landing page for NOESIS, the personal agent at `D:\Personal_Agent` (GitHub `notjwp/Noesis`).
One static page, no framework, no bundler, no build step; GitHub Pages serves `index.html` from
the root of `main`. The design combines two references: retronova's HUD loader and scrambled
text, vanlent's ruled grid, thin Montserrat type, particle sphere and light/dark toggle. The full
design is `docs/superpowers/specs/2026-09-20-noesis-site-design.md`; the plan that built it is
`docs/superpowers/plans/2026-09-20-noesis-site.md`.

## Layout

```
index.html                  the page; all copy lives here, edited directly
css/tokens.css              colour tokens for both themes, type scale, --cell / --cols
css/grid.css                body rules, .frame, .section (subgrid), .cell, header, ruler
css/site.css                per-section placement and styling
css/loader.css              the boot overlay
js/main.js                  boot order; cellSize(); section band → sphere state; readouts
js/theme.js                 resolveTheme(), initTheme(); dispatches `themechange`
js/install.js               COMMANDS (README lines verbatim), detectOS(), copy button
js/scramble.js              scrambleFrame() (pure), scramble(el)
js/reveal.js                TRACES (the gate's real output), heading scramble, terminal cycle, trace typing → `verdict` events
js/sphere.js                STATES, stateFor(), mountSphere(): three.js points + noise shader
js/loader.js                displayedProgress(), shouldBoot(), runLoader()
js/readouts.js              readout(name, text)
vendor/three/               three.js, pinned (see VERSION), MIT
tests/                      in-browser runner (index.html) + unittest for the Python script
scripts/check_numbers.py    every figure in index.html must exist in the agent's README or eval/CHANGELOG.md
.claude/launch.json         python -m http.server 8000
```

## Working here

- Run: `python -m http.server 8000` from the root, then http://localhost:8000/ (ES modules need
  http). JS tests: http://localhost:8000/tests/ — read the `<pre>`; `0 failing` is green. Python:
  `python -m unittest discover tests`.
- Before any commit: `python scripts/check_numbers.py` must print `0 unmatched figure(s)`.
- Do not `git add`, commit or push unless asked. No `Co-Authored-By` or other trailers.
- The page must work at 400 px with no horizontal scroll on the body; only the install line,
  the terminals and the numbers table may scroll inside their cells.
- No new runtime dependency beyond the vendored three.js. No `setInterval`. Every animation is a
  CSS transition or one of the rAF loops in `sphere.js`, `scramble.js`, `loader.js`, and every
  one of them honours `prefers-reduced-motion`.
- Edit `index.html` and the CSS/JS directly; there is nothing to build. `?boot` on the URL
  replays the loader.

## The numbers are borrowed, never owned

Every figure on the page is copied from the agent repository. This repository has no
measurement of its own and must never carry a figure the agent repository does not.

- When the agent's numbers change, change them here in the same sitting. A stale score on a
  public page is a false claim.
- Never round up, never quote the better of two runs, never drop the `n`.
- The `reverted` and `off by default` ledger rows stay. Do not trim them to make the page look
  better.
- The gate strings in the terminals are `agent/policy.py` output verbatim (`classified read`,
  `is destructive (recursive delete)`, `is deleting the root or home directory; refused, and no
  approval can allow it`) and the prompt is `agent/cli.py`'s. If their wording changes, change
  `TRACES` in `js/reveal.js` and the two `<pre>` blocks in `index.html`.
- The install commands are the README's lines verbatim, in `js/install.js` and `index.html`.
- `scripts/check_numbers.py` enforces the rule. `ALLOW` holds only facts about the page itself
  (the sphere's point counts, the loader's `0%`). Never add an agent figure to it.

## Design system

Two themes, one meaning per colour. Tokens live on `:root[data-theme="pm"|"am"]`.

| token | PM (dark) | AM (light) | role |
|---|---|---|---|
| `--ground` | `#0A0B0D` | `#F6F7F9` | page |
| `--surface` | `#1A1D21` | `#FFFFFF` | terminals, install line, loader panel |
| `--rule` | `#22262B` | `#D9DEE5` | every grid line and border |
| `--text` | `#E6E8EB` | `#111318` | body; the sphere at rest |
| `--muted` | `#848C9C` | `#6B7280` | labels, `auto`, secondary copy |
| `--accent` | `#A3E635` | `#4D7C0F` | `NOE`, `confirm`, `kept`, scores, loader frame, the sphere in measured/gate |
| `--refuse` | `#FF5F56` | `#C62828` | `deny`, `reverted`, ejected points — nowhere else |
| `--gold` | `#E5B84A` | `#9A6B00` | the sphere in the ledger |
| `--violet` | `#A78BFA` | `#6D4BD6` | the sphere in the properties section |

PM is the TUI's `noesis-mono` theme (`agent/ui/theme.py`), with `--muted` lifted for contrast.
The theme is chosen before first paint by the inline script in `<head>` (stored value, else the
OS), toggled by the header's icon, remembered in `localStorage['noesis.theme']`; the loader's
`THEME: PM` box is a readout of it.

Type: Montserrat 200/300/400/500 (headings 200, uppercase, tracked) and IBM Plex Mono 400/500 for
anything that reads as output — wordmark, install line, terminals, table figures, verdicts,
loader, readouts. Google Fonts with real fallback stacks.

The grid: `--cols` is 20 / 16 / 8 by viewport; `js/main.js` sets `--cell = floor(clientWidth /
cols)` and `--grid-x` (the leftover, split) so the `body` background rules and the `.frame` meet
on whole pixels. Sections are `subgrid`; children place with `grid-column`/`grid-row` in cell
units; below 768 px everything stacks in source order. A `.cell` has a 1 px `--rule` border and
draws a brighter inset border on hover via `clip-path` — the readout in `#numbers` prints the
live value.

The sphere (`js/sphere.js`): 14,000 points (7,000 on phones), one state per section —
`install` (text colour, parked right of the install block), `idle` (text colour, centre), `measured` (accent, snapped to a lattice, left), `gate` (accent,
right; `deny` ejects 3 % of points in `--refuse`, `confirm` pauses rotation, `auto` flashes),
`ledger` (gold, right; hovering a row tints it by verdict), `memory` (violet, breathing, dimmed
behind the property cells). The section crossing the middle of the viewport owns it.

The loader: shown once per session (`sessionStorage['noesis.booted']`), forced by `?boot`,
skipped under reduced motion. Progress is real — fonts 30, the sphere module 30, its first frame
30, the time floor 10 — displayed as `min(real, floor(t))` so it never runs ahead and stalls
visibly on a slow load; hard cap 6 s; `SKIP LOADING`, `Esc` or `Enter` end it.

## The page, top to bottom

1. `#boot` — the HUD loader.
2. Header — `NOE`+`SIS`, `M` menu, the theme icon.
3. `#install` — **the installer, a section of its own and the first thing under the header**:
   the README's block-letter NOESIS mark centred as the page's `h1`, then `01. Install`, "Not curl | sh", the requirements sub-line, OS toggle, the full command with copy,
   the virtualenv/PATH note and the first-run / `noesis --update` note. The sphere parks to its right.
4. `#hero` — labels, `JUDGED` / `MEASURED` either side of the sphere, one sentence, the cycling
   terminal, a sphere readout.
5. `#numbers` — "Measured, not claimed", the README's scores table, the model/tests/`real`
   footnote, `Read the changelog`.
6. `#gate` — `act → gate → execute → reflect`, the trace that types the three verdicts, the
   three tiers, the no-container line.
7. `#ledger` — kept / reverted / off by default, nine rows from `eval/CHANGELOG.md`.
8. `#properties` — it remembers, it can be left alone, it runs where you are.
9. `#footer` — github · readme · changelog · install, and the one-line provenance note.
10. The ruler — fixed at the bottom, its marker is scroll progress.
