// input.js — mouse clicks and keyboard, translated into game actions.
// Hit-testing uses the same SR.LAYOUT rects the renderer draws, so what
// you see is what you can click. All actions go through SR.act so the
// main loop stays the only place that mutates state.
(function (root) {
  var SR = root.SR || (root.SR = {});

  function inside(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  // Convert a canvas click (real pixels) to logical 1280x720 coordinates.
  SR.toLogical = function (canvas, clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var scale = Math.min(rect.width / SR.CONFIG.canvasW, rect.height / SR.CONFIG.canvasH);
    var ox = (rect.width - SR.CONFIG.canvasW * scale) / 2;
    var oy = (rect.height - SR.CONFIG.canvasH * scale) / 2;
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
    };
  };

  // The one action entry point. kind is one of:
  // select-ticket | add-bin | grill-slot | fryer-slot | serve | trash |
  // start | howto | back | again | resume | plate-item
  SR.act = function (state, action) {
    if (state.mode === 'title') {
      if (action.kind === 'start') SR.startShift(state);
      else if (action.kind === 'howto') state.mode = 'howto';
      return;
    }
    if (state.mode === 'howto') {
      if (action.kind === 'back') state.mode = 'title';
      return;
    }
    if (state.mode === 'dayend') {
      if (action.kind === 'again') SR.startShift(state);
      return;
    }
    if (state.mode === 'paused') {
      if (action.kind === 'resume') state.mode = 'playing';
      return;
    }
    // Playing.
    if (action.kind === 'pause') { state.mode = 'paused'; return; }
    if (action.kind === 'select-ticket') {
      state.selectedTicket = action.id;
      var t = state.tickets.filter(function (x) { return x.id === action.id; })[0];
      if (t) SR.say(state, t.customer + ' wants a ' + t.recipe.name + ' ($' + t.recipe.price + ').');
      return;
    }
    if (action.kind === 'add-bin') { SR.addIngredient(state, action.ingredient); return; }
    if (action.kind === 'grill-slot') { SR.clickStation(state, state.grill, action.i, 'grill'); return; }
    if (action.kind === 'fryer-slot') { SR.clickStation(state, state.fryer, action.i, 'fryer'); return; }
    if (action.kind === 'plate-item') {
      var removed = SR.removeFromPlate(state, action.i);
      if (removed) SR.say(state, 'Took the ' + SR.INGREDIENTS[removed].label + ' off the plate.');
      return;
    }
    if (action.kind === 'serve') { SR.tryServe(state); return; }
    if (action.kind === 'trash') { SR.trashPlate(state); return; }
  };

  // Map a logical click to an action (or null when it hits nothing).
  SR.clickAt = function (state, x, y) {
    if (state.mode === 'title') {
      var c = SR.LAYOUT.titleCard;
      if (x >= 490 && x <= 790 && y >= c.y + 272 && y <= c.y + 328) return { kind: 'start' };
      return { kind: 'howto' };
    }
    if (state.mode === 'howto') return { kind: 'back' };
    if (state.mode === 'dayend') return { kind: 'again' };
    if (state.mode === 'paused') return { kind: 'resume' };
    // Playing: tickets first.
    for (var i = 0; i < state.tickets.length; i++) {
      if (inside(x, y, SR.ticketRect(i))) return { kind: 'select-ticket', id: state.tickets[i].id };
    }
    for (var g = 0; g < state.grill.length; g++) {
      if (inside(x, y, SR.grillSlotRect(g))) return { kind: 'grill-slot', i: g };
    }
    for (var f = 0; f < state.fryer.length; f++) {
      if (inside(x, y, SR.fryerSlotRect(f))) return { kind: 'fryer-slot', i: f };
    }
    for (var b = 0; b < SR.BIN_ORDER.length; b++) {
      if (inside(x, y, SR.binRect(b))) return { kind: 'add-bin', ingredient: SR.BIN_ORDER[b] };
    }
    if (inside(x, y, SR.LAYOUT.serve)) return { kind: 'serve' };
    if (inside(x, y, SR.LAYOUT.trash)) return { kind: 'trash' };
    // Clicking the plate area removes the topmost item.
    if (inside(x, y, SR.LAYOUT.plate) && state.plate.length > 0) {
      return { kind: 'plate-item', i: state.plate.length - 1 };
    }
    return null;
  };

  // Keyboard. Returns true when the key did something.
  SR.keyAction = function (state, key) {
    var k = (key || '').toLowerCase();
    if (state.mode === 'title' && (k === 'enter' || k === ' ')) { SR.act(state, { kind: 'start' }); return true; }
    if (state.mode === 'title' && k === 'h') { SR.act(state, { kind: 'howto' }); return true; }
    if (state.mode === 'howto' && (k === 'h' || k === 'escape' || k === 'enter')) { SR.act(state, { kind: 'back' }); return true; }
    if (state.mode === 'dayend' && k === 'enter') { SR.act(state, { kind: 'again' }); return true; }
    if (k === 'p' && (state.mode === 'playing' || state.mode === 'paused')) {
      SR.act(state, state.mode === 'playing' ? { kind: 'pause' } : { kind: 'resume' });
      return true;
    }
    if (state.mode !== 'playing') return false;
    if (k >= '1' && k <= '4') {
      var t = state.tickets[+k - 1];
      if (t) SR.act(state, { kind: 'select-ticket', id: t.id });
      return true;
    }
    var binKeys = { b: 'bun', p: 'patty', c: 'cheese', l: 'lettuce', t: 'tomato', f: 'fries' };
    if (binKeys[k]) { SR.act(state, { kind: 'add-bin', ingredient: binKeys[k] }); return true; }
    if (k === ' ' || k === 'enter') { SR.act(state, { kind: 'serve' }); return true; }
    if (k === 'x') { SR.act(state, { kind: 'trash' }); return true; }
    return false;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
