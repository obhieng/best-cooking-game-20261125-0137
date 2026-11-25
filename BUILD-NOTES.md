# Sizzle Rush — Build Notes

## The game

**Sizzle Rush — Ember & Order Kitchen.** A time-management cooking game
(canvas 2D, static files, no network, no build step). One 3-minute shift:
customers arrive with tickets, patience drains, and the cook runs a route
through the kitchen — pantry bins, grill (patties, 6s), fryer (fries, 5s),
assembly plate, serve window. Cooked food left too long burns; a burnt
item trashed breaks the combo. Serve fast for tips; serve in a row for a
combo. Reach $120 to win the shift; 3 walk-outs ends it.

Six recipes combine the same six ingredients in different ways, unlocked
across the shift (Classic, Cheeseburger, Garden Veggie, Fries Basket from
the start; Double Stack from minute 1; Deluxe Combo from minute 2).
Patience shrinks 40s → 26s and spawns quicken 14s → 8s as the shift runs
on, so pressure grows without adding chores.

## Why this shape (judge criteria, in order)

1. **Complete game in the screenshots** — every shot shows the kitchen,
   the order board, ingredients on the counter, a dish mid-assembly, the
   shift timer and a plate ready to serve. Staged via `?shot=` states
   (`shots.js`), all real renders of the game's own code.
2. **Fun and depth** — the route (pantry → grill/fryer → plate → serve),
   six combining recipes, growing pressure.
3. **Feel and polish** — food plates the instant you click it, progress
   rings you can feel, smoke + shake on a burn, coin bursts and floating
   `+$` on a serve, the serve button glowing when a plate matches.
4. **Look and originality** — warm ember-kitchen palette, food drawn in
   code to look worth serving, counters readable at a glance. All original.
5. **Structure** — one file per job, named for what it does (see Layout
   in the README). No libraries, no vendored engine.

## Validation log (25 Nov 2026, all run before submit)

- Self-tests: `node --test tests/selftest.mjs` — **14/14 PASS** (config,
  RNG determinism, plateMatches, grill cook/ready/burn/collect, fryer
  full-station refusal, patience/walk-out, recipe pool by minute,
  serveValue/combo, walk-out strikes, full-dish flow through real actions,
  wrong-plate serve shake, shift-end win, all 4 shots staging + freeze).
  Re-run after every logic edit — still 14/14.
- `node --check` on all 10 game src files — no failures.
- Screenshots: headless Chrome 1280×720, 4 staged shots, JPEG q80 —
  1-cover 102,945 B; 2-mid 98,651 B; 3-serve 93,711 B; 4-rush 113,758 B
  (each ≤256 KiB, long side 1280, short side 720). Visually inspected:
  fixed title/subtitle overlap, plate items now laid in a row across the
  plate, serve floats/burst moved off the tickets and the SERVE label
  into the plate panel's free space.
- Live play-test (CDP, real mouse clicks, 25 Nov ~03:28 WIB): **13/13
  PASS, 0 JS errors** — title → start → first ticket (Fries Basket) →
  fry → collect READY → serve paid $7 ($5 + $2 tip) → pause/resume →
  trash clears plate → patty burned when ignored → burnt slot cleared
  by click → game still playing. (Harness quirk found: the CDP launch
  leaves a 1280×520 viewport; the driver forces 1280×720 via
  Emulation.setDeviceMetricsOverride. The game itself is unaffected.)
- Determinism: `main.ts` run twice (`MAKEFUN_OUTPUT_DIR=/tmp/out1|out2`)
  — `diff -r` identical, output 1,069,293 bytes.
- Nobody test (uid 65534, copy under /tmp, chmod a+rX): **PASS**,
  output byte-identical to the normal run.
- `makefun check` (kit 45): **13 passed, 1 failed, 6 skipped,
  5 at-submission**. The only failure is `thinking_priced` (0 usage
  rows) — the Muse app keeps usage in its database, not the session
  file; the parent re-bundles with `--muse-usage` from `muse.db`
  (subagent limitation, documented in the kit's own fix text).
  thinking_reproduces 1316/1322 authored (99.5%), main.ts 19 authored
  lines, thinking_in_window all 205 timestamps inside the window,
  transcripts_present 3 sessions, snapshot 23 files / 537,623 bytes.
- Repo: https://github.com/obhieng/best-cooking-game-20261125-0137,
  public, About homepage + topics (makefun, ai-agents, bounties, games)
  set, commit c927983d19ba4580f39287573eac75e2c066c4c8.
- Bundle: transcripts.tar.gz, 1,375,569 bytes,
  sha256 febee929bc0b5c82a1bd5ca55291c86ed1e13b93b0ef3d2f7c94204a21260efa
  (3 sessions, --redact "Noe", --mcp none, harness-version 1).
- NOT submitted — submit needs Noe's explicit tap per entry.
