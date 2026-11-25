// kitchen.js — the hot stations: grill slots and fryer baskets.
// A slot is { kind, phase, t } where phase is
// 'empty' | 'cooking' | 'ready' | 'burnt' and t is seconds in that phase.
// Cooking runs on dt; a cooked item that is not collected in time burns.
(function (root) {
  var SR = root.SR || (root.SR = {});

  SR.emptySlots = function (n) {
    var slots = [];
    for (var i = 0; i < n; i++) slots.push({ kind: null, phase: 'empty', t: 0 });
    return slots;
  };

  // Start cooking kind ('patty' on the grill, 'fries' in the fryer).
  // Returns true when a free slot took it, false when the station is full.
  SR.startCooking = function (slots, kind) {
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].phase === 'empty') {
        slots[i].kind = kind;
        slots[i].phase = 'cooking';
        slots[i].t = 0;
        return true;
      }
    }
    return false;
  };

  SR.cookTimeFor = function (kind) {
    return kind === 'patty' ? SR.CONFIG.pattyCookTime : SR.CONFIG.friesCookTime;
  };

  // Advance every slot by dt. Returns the slots that just burned.
  SR.tickStations = function (state, dt) {
    var burned = [];
    [state.grill, state.fryer].forEach(function (slots) {
      for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        if (s.phase === 'cooking') {
          s.t += dt;
          if (s.t >= SR.cookTimeFor(s.kind)) {
            s.phase = 'ready';
            s.t = 0;
          }
        } else if (s.phase === 'ready') {
          s.t += dt;
          if (s.t >= SR.CONFIG.readyWindow) {
            s.phase = 'burnt';
            s.t = 0;
            burned.push(s);
          }
        }
      }
    });
    return burned;
  };

  // Collect a ready item from a slot onto the plate. Returns the item or null.
  SR.collectSlot = function (state, slots, i) {
    var s = slots[i];
    if (s.phase !== 'ready') return null;
    var item = s.kind;
    s.kind = null;
    s.phase = 'empty';
    s.t = 0;
    return item;
  };

  // Throw a burnt item away. Returns true when something was cleared.
  SR.clearSlot = function (slots, i) {
    var s = slots[i];
    if (s.phase !== 'burnt') return false;
    s.kind = null;
    s.phase = 'empty';
    s.t = 0;
    return true;
  };

  // Any slot still cooking or ready (used for the "station busy" hint).
  SR.anyBurning = function (state) {
    var all = state.grill.concat(state.fryer);
    for (var i = 0; i < all.length; i++) {
      if (all[i].phase === 'burnt') return true;
    }
    return false;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
