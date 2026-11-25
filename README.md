# Sizzle Rush — Ember &amp; Order Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/obhieng/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/obhieng/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A rush-hour cooking game. Take customer orders, grill patties, fry the fries, plate the dish and serve it smiling — before patience runs out. Reach $120 in a 3-minute shift; 3 walk-outs ends the night.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests: the whole game is static files under `game/`.

## How to play

1. Click a ticket (or press 1–4) to pick an order.
2. Click pantry bins: buns and vegetables go straight to the plate.
3. Patty goes to the grill, fries to the fryer — watch the ring! Left too long, food burns.
4. Click READY food to plate it. When the plate matches a ticket, hit SERVE (or Space).
5. Fast serves pay tips. Serve in a row to build a COMBO. A walk-out or a burnt dish breaks it.

Six recipes combine in different ways — Classic Burger, Cheeseburger, Garden Veggie, Fries Basket, Double Stack, Deluxe Combo — and the shift gets busier and less patient as the clock runs down.

## Layout

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`.
- `game/index.html` + `game/src/*.js` — the game. One file, one job: `config` (tuning + recipes), `random` (seeded RNG), `orders` (tickets), `kitchen` (grill + fryer), `plate` (assembly), `score` (coins, tips, combos), `render` (all drawing), `input` (mouse + keyboard), `shots` (staged screenshot scenes), `main` (loop + rules).
- `screenshots/` — 4 staged renders of the game's own code (`?shot=cover|mid|serve|rush`).
- `tests/selftest.mjs` — logic tests: `node --test tests/selftest.mjs`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=zv8dnn3m&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
