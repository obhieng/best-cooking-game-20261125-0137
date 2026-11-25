// Self-tests for Sizzle Rush game logic. Run: node --test tests/selftest.mjs
// Loads the same classic-script files the browser loads (they attach to
// globalThis.SR), then exercises orders, stations, plate and scoring.
// No browser, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', 'game', 'src');
for (const f of ['config.js', 'random.js', 'orders.js', 'kitchen.js', 'plate.js', 'score.js', 'render.js', 'input.js', 'shots.js', 'main.js']) {
  require(join(SRC, f));
}
const SR = globalThis.SR;

function freshState(seed) {
  const s = SR.createState(seed || 7);
  s.mode = 'playing';
  return s;
}

test('config: six recipes, plate holds six', () => {
  assert.equal(SR.RECIPES.length, 6);
  assert.equal(SR.PLATE_MAX, 6);
  assert.equal(SR.BIN_ORDER.length, 6);
});

test('random: same seed repeats the same sequence', () => {
  const a = SR.mulberry32(42), b = SR.mulberry32(42);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  assert.notEqual(SR.mulberry32(1)(), SR.mulberry32(2)());
});

test('plateMatches: exact multiset only', () => {
  const classic = SR.recipeById('classic');
  assert.equal(SR.plateMatches(['bun', 'patty', 'lettuce'], classic), true);
  assert.equal(SR.plateMatches(['lettuce', 'patty', 'bun'], classic), true);
  assert.equal(SR.plateMatches(['bun', 'patty'], classic), false);
  assert.equal(SR.plateMatches(['bun', 'patty', 'lettuce', 'cheese'], classic), false);
  assert.equal(SR.plateMatches(['bun', 'patty', 'tomato'], classic), false);
  const dbl = SR.recipeById('double');
  assert.equal(SR.plateMatches(['bun', 'patty', 'patty', 'cheese'], dbl), true);
  assert.equal(SR.plateMatches(['bun', 'patty', 'cheese'], dbl), false);
});

test('grill: patty cooks 6s, ready 4s, then burns', () => {
  const s = freshState();
  assert.equal(SR.startCooking(s.grill, 'patty'), true);
  assert.equal(s.grill[0].phase, 'cooking');
  SR.tickStations(s, 5.9);
  assert.equal(s.grill[0].phase, 'cooking');
  SR.tickStations(s, 0.2);
  assert.equal(s.grill[0].phase, 'ready');
  SR.tickStations(s, 3.9);
  assert.equal(s.grill[0].phase, 'ready');
  const burned = SR.tickStations(s, 0.2);
  assert.equal(s.grill[0].phase, 'burnt');
  assert.equal(burned.length, 1);
  assert.equal(SR.clearSlot(s.grill, 0), true);
  assert.equal(s.grill[0].phase, 'empty');
});

test('grill: collecting a ready patty plates it', () => {
  const s = freshState();
  SR.startCooking(s.grill, 'patty');
  SR.tickStations(s, 6.5);
  const item = SR.collectSlot(s, s.grill, 0);
  assert.equal(item, 'patty');
  assert.equal(s.grill[0].phase, 'empty');
  assert.equal(SR.collectSlot(s, s.grill, 0), null);
});

test('fryer: fries cook 5s; full station refuses a third', () => {
  const s = freshState();
  assert.equal(SR.startCooking(s.fryer, 'fries'), true);
  assert.equal(SR.startCooking(s.fryer, 'fries'), true);
  assert.equal(SR.startCooking(s.fryer, 'fries'), false);
  SR.tickStations(s, 5.1);
  assert.equal(s.fryer[0].phase, 'ready');
  assert.equal(s.fryer[1].phase, 'ready');
});

test('orders: patience drains and walk-outs strike', () => {
  const s = freshState();
  const t = SR.spawnTicket(s);
  assert.equal(t.state, 'waiting');
  assert.ok(t.patience > 25 && t.patience <= 40);
  SR.tickTickets(s, t.patience - 1);
  assert.equal(t.state, 'waiting');
  const walked = SR.tickTickets(s, 2);
  assert.equal(walked.length, 1);
  assert.equal(t.state, 'walked');
});

test('orders: recipe pool grows with the shift minute', () => {
  assert.deepEqual(
    SR.availableRecipes(30).map((r) => r.id).sort(),
    ['cheese', 'classic', 'fries', 'garden'],
  );
  assert.ok(SR.availableRecipes(70).some((r) => r.id === 'double'));
  assert.ok(SR.availableRecipes(130).some((r) => r.id === 'deluxe'));
  assert.ok(SR.patienceFor(170) < SR.patienceFor(10));
  assert.ok(SR.spawnInterval(170) < SR.spawnInterval(10));
});

test('score: full-patience serve pays price + 50% tip, combo adds more', () => {
  const s = freshState();
  const t = SR.spawnTicket(s);
  const v0 = SR.serveValue(s, t);
  assert.equal(v0.price, t.recipe.price);
  assert.equal(v0.tip, Math.round(t.recipe.price * 0.5));
  assert.equal(v0.comboBonus, 0);
  s.combo = 2;
  const v2 = SR.serveValue(s, t);
  assert.equal(v2.comboBonus, Math.round(v0.tip * 0.5));
  const paid = SR.applyServe(s, t);
  assert.equal(s.coins, paid.total);
  assert.equal(s.combo, 3);
  assert.equal(s.served, 1);
  assert.equal(t.state, 'served');
});

test('score: walk-out strikes and breaks the combo; three strikes lose', () => {
  const s = freshState();
  s.combo = 4;
  SR.applyWalkOut(s);
  assert.equal(s.combo, 0);
  assert.equal(s.strikes, 1);
  SR.applyWalkOut(s);
  SR.applyWalkOut(s);
  assert.equal(SR.hasLost(s), true);
});

test('flow: a full dish can be built and served through the real actions', () => {
  const s = freshState(99);
  SR.startShift(s);
  // Force a Classic ticket to the front.
  s.tickets = [{
    id: 1, customer: 'Maya', recipe: SR.recipeById('classic'),
    patience: 40, maxPatience: 40, state: 'waiting',
  }];
  SR.act(s, { kind: 'add-bin', ingredient: 'bun' });
  SR.act(s, { kind: 'add-bin', ingredient: 'lettuce' });
  SR.act(s, { kind: 'add-bin', ingredient: 'patty' }); // goes to grill
  assert.equal(s.grill[0].phase, 'cooking');
  SR.tick(s, 6.5); // patty ready; patience ticked a little
  SR.act(s, { kind: 'grill-slot', i: 0 });
  assert.deepEqual(s.plate.slice().sort(), ['bun', 'lettuce', 'patty']);
  const coinsBefore = s.coins;
  SR.act(s, { kind: 'serve' });
  assert.ok(s.coins > coinsBefore);
  assert.equal(s.served, 1);
  assert.equal(s.plate.length, 0);
});

test('flow: serving a wrong plate shakes and pays nothing', () => {
  const s = freshState(5);
  SR.startShift(s);
  s.tickets = [{
    id: 1, customer: 'Riko', recipe: SR.recipeById('classic'),
    patience: 40, maxPatience: 40, state: 'waiting',
  }];
  SR.act(s, { kind: 'add-bin', ingredient: 'bun' });
  SR.act(s, { kind: 'serve' });
  assert.equal(s.coins, 0);
  assert.equal(s.served, 0);
  assert.ok(s.shake > 0);
});

test('flow: shift ends on time; win needs the target', () => {
  const s = freshState(11);
  SR.startShift(s);
  s.coins = SR.CONFIG.targetCoins;
  SR.tick(s, SR.CONFIG.shiftLength);
  assert.equal(s.mode, 'dayend');
  assert.equal(s.won, true);
});

test('shots: all four staged scenes build and freeze', () => {
  for (const name of ['cover', 'mid', 'serve', 'rush']) {
    const s = freshState(3);
    const staged = SR.stageShot(s, name);
    assert.equal(staged, name);
    assert.equal(s.mode, 'playing');
    assert.equal(s.frozen, true);
    assert.ok(s.tickets.length >= 1);
    assert.ok(s.tickets.every((t) => t.recipe && t.recipe.items.length > 0));
    // A frozen scene does not advance.
    const t0 = s.time;
    SR.tick(s, 5);
    assert.equal(s.time, t0);
  }
});
