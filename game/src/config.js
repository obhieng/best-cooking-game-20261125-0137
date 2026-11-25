// Sizzle Rush — Ember & Order Kitchen
// config.js — every tunable number, recipe and layout rect in one place.
// Nothing here runs; it only declares. The game reads it, the tests read it.
(function (root) {
  var SR = root.SR || (root.SR = {});

  SR.CONFIG = {
    canvasW: 1280,
    canvasH: 720,
    shiftLength: 180, // seconds per day
    targetCoins: 120, // reach this to win the shift
    maxStrikes: 3, // walk-outs that end the shift in failure
    maxTickets: 4,
    grillSlots: 4,
    fryerSlots: 2,
    pattyCookTime: 6, // seconds on the grill
    friesCookTime: 5, // seconds in the fryer
    readyWindow: 4, // seconds a cooked item waits before it burns
    spawnFirstAt: 2,
    spawnIntervalStart: 14,
    spawnIntervalEnd: 8,
    patienceStart: 40,
    patienceEnd: 26,
    tipRate: 0.5, // tip = price * tipRate * patience fraction
    comboStep: 0.25, // each combo level adds 25% to the tip
  };

  // Ingredients. cook: null = goes straight on the plate; otherwise the
  // station that must cook it first and what it becomes when cooked.
  SR.INGREDIENTS = {
    bun:     { label: 'Bun',     color: '#e8a94e', cook: null },
    patty:   { label: 'Patty',   color: '#8a5a33', cook: { station: 'grill', time: 6, becomes: 'patty' } },
    cheese:  { label: 'Cheese',  color: '#f7c948', cook: null },
    lettuce: { label: 'Lettuce', color: '#7dc383', cook: null },
    tomato:  { label: 'Tomato',  color: '#e4572e', cook: null },
    fries:   { label: 'Fries',   color: '#f2d06b', cook: { station: 'fryer', time: 5, becomes: 'fries' } },
  };
  SR.BIN_ORDER = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'fries'];

  // Recipes. items are the finished items the plate must hold (multiset).
  // minMinute unlocks the recipe as the shift goes on: 0 = from the start.
  SR.RECIPES = [
    { id: 'classic',  name: 'Classic Burger', items: ['bun', 'patty', 'lettuce'],            price: 8,  minMinute: 0 },
    { id: 'cheese',   name: 'Cheeseburger',   items: ['bun', 'patty', 'cheese', 'tomato'],   price: 10, minMinute: 0 },
    { id: 'garden',   name: 'Garden Veggie',  items: ['bun', 'lettuce', 'tomato', 'cheese'], price: 9,  minMinute: 0 },
    { id: 'fries',    name: 'Fries Basket',   items: ['fries'],                              price: 5,  minMinute: 0 },
    { id: 'double',   name: 'Double Stack',   items: ['bun', 'patty', 'patty', 'cheese'],    price: 13, minMinute: 1 },
    { id: 'deluxe',   name: 'Deluxe Combo',   items: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'fries'], price: 16, minMinute: 2 },
  ];

  SR.CUSTOMERS = ['Maya', 'Riko', 'Sinta', 'Budi', 'Ayu', 'Dewi', 'Joko', 'Lina', 'Fajar', 'Nina', 'Eko', 'Rani'];

  SR.COLORS = {
    bg: '#2b1d16',
    counterTop: '#7a4a2b',
    counterSide: '#5d3620',
    panel: '#3a2a20',
    panelEdge: '#6b4a2f',
    cream: '#fff3d6',
    ink: '#2b1d16',
    muted: '#c9a98a',
    gold: '#f7c948',
    green: '#7dc383',
    red: '#e4572e',
    grill: '#3d3d3d',
    grillHot: '#ff7a3c',
    ticket: '#fff8e7',
    ticketEdge: '#e0b25e',
    serve: '#2f9e44',
    trash: '#8c2f2f',
  };

  // One source of truth for hit-testing and drawing. Every rect is
  // { x, y, w, h }. Input and render both read these.
  SR.LAYOUT = {
    topBar: { x: 0, y: 0, w: 1280, h: 64 },
    orders: { x: 24, y: 76, w: 290, h: 100, gap: 12 },
    grill: { x: 24, y: 196, w: 446, h: 184, slotW: 100, slotH: 118 },
    fryer: { x: 486, y: 196, w: 252, h: 184, slotW: 108, slotH: 118 },
    pantry: { x: 754, y: 196, w: 502, h: 184, binW: 158, binH: 84 },
    plate: { x: 24, y: 400, w: 714, h: 140 },
    serve: { x: 754, y: 400, w: 240, h: 140 },
    trash: { x: 1010, y: 400, w: 246, h: 140 },
    bottomBar: { x: 0, y: 556, w: 1280, h: 164 },
    titleCard: { x: 340, y: 150, w: 600, h: 420 },
  };

  // Where each pantry bin sits (row-major, 3 columns x 2 rows).
  SR.binRect = function (i) {
    var L = SR.LAYOUT.pantry;
    var col = i % 3, row = (i / 3) | 0;
    return {
      x: L.x + 8 + col * (L.binW + 6),
      y: L.y + 30 + row * (L.binH + 8),
      w: L.binW,
      h: L.binH,
    };
  };

  SR.ticketRect = function (i) {
    var L = SR.LAYOUT.orders;
    return { x: L.x + i * (L.w + L.gap), y: L.y, w: L.w, h: L.h };
  };

  SR.grillSlotRect = function (i) {
    var L = SR.LAYOUT.grill;
    return { x: L.x + 12 + i * (L.slotW + 6), y: L.y + 44, w: L.slotW, h: L.slotH };
  };

  SR.fryerSlotRect = function (i) {
    var L = SR.LAYOUT.fryer;
    return { x: L.x + 12 + i * (L.slotW + 8), y: L.y + 44, w: L.slotW, h: L.slotH };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
