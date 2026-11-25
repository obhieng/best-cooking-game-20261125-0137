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

## Validation log

- (to be filled as checks run)
