// main.js — the game itself: state, the loop, and every rule that ties
// orders, stations, plate and score together. Wires canvas + input.
// No network, no storage writes: the whole game is this state + the draw.
(function (root) {
  var SR = root.SR || (root.SR = {});

  SR.createState = function (seed) {
    SR._resetTicketIds();
    return {
      mode: 'title',
      time: 0,
      coins: 0,
      combo: 0,
      bestCombo: 0,
      strikes: 0,
      served: 0,
      lost: 0,
      tickets: [],
      grill: SR.emptySlots(SR.CONFIG.grillSlots),
      fryer: SR.emptySlots(SR.CONFIG.fryerSlots),
      plate: [],
      selectedTicket: null,
      particles: [],
      floats: [],
      message: '',
      messageT: 0,
      shake: 0,
      rng: SR.mulberry32(seed || 20261125),
      spawnT: SR.CONFIG.spawnFirstAt,
      stats: { burned: 0 },
      frozen: false,
    };
  };

  SR.say = function (state, msg) {
    state.message = msg;
    state.messageT = 4;
  };

  SR.startShift = function (state) {
    var fresh = SR.createState(20261125 + ((Math.random() * 100000) | 0));
    fresh.mode = 'playing';
    for (var k in fresh) state[k] = fresh[k];
    SR.say(state, 'Shift started! First customer in ' + SR.CONFIG.spawnFirstAt + 's — reach $' + SR.CONFIG.targetCoins + '.');
  };

  // Pantry click: raw patty/fries go to their station, the rest to the plate.
  SR.addIngredient = function (state, kind) {
    var ing = SR.INGREDIENTS[kind];
    if (!ing) return;
    if (ing.cook) {
      var slots = ing.cook.station === 'grill' ? state.grill : state.fryer;
      if (SR.startCooking(slots, kind)) {
        SR.say(state, ing.label + ' on the ' + ing.cook.station + ' — ' + ing.cook.time + 's to cook. Watch the ring!');
      } else {
        SR.say(state, 'The ' + ing.cook.station + ' is full — collect the ready food first.');
        state.shake = 6;
      }
      return;
    }
    if (SR.addToPlate(state, kind)) {
      SR.say(state, SR.INGREDIENTS[kind].label + ' on the plate. ' + SR.plateSummary(state) + '.');
    } else {
      SR.say(state, 'The plate is full — serve it or trash it first.');
      state.shake = 6;
    }
  };

  // Click on a station slot: collect ready food, or clear a burnt one.
  SR.clickStation = function (state, slots, i, station) {
    var s = slots[i];
    if (s.phase === 'ready') {
      var item = SR.collectSlot(state, slots, i);
      if (item) {
        SR.addToPlate(state, item);
        SR.say(state, 'Hot ' + SR.INGREDIENTS[item].label + ' on the plate — just in time!');
      }
      return;
    }
    if (s.phase === 'burnt') {
      if (SR.clearSlot(slots, i)) {
        SR.applyBurnTrash(state);
        SR.say(state, 'Burnt food trashed. Combo lost — keep an eye on the ring!');
        state.shake = 8;
      }
      return;
    }
    if (s.phase === 'cooking') {
      SR.say(state, 'Still cooking — ' + Math.ceil(SR.cookTimeFor(s.kind) - s.t) + 's left. Don\'t let it burn!');
    }
  };

  // Serve the plate to the ticket it matches.
  SR.tryServe = function (state) {
    if (state.plate.length === 0) {
      SR.say(state, 'The plate is empty — build a dish first.');
      return;
    }
    var ticket = SR.matchingTicket(state);
    if (!ticket) {
      SR.say(state, 'No ticket matches this plate. Check the order board!');
      state.shake = 8;
      return;
    }
    var v = SR.applyServe(state, ticket);
    SR.clearPlate(state);
    SR.selectedTicket = null;
    // Celebration bursts over the (just-emptied) plate panel, never over
    // the tickets or the SERVE label.
    SR.burstCoins(state, 500, 450, 12);
    SR.addFloat(state, 500, 416, '+$' + v.total, '#f7c948', 26);
    if (v.comboBonus > 0) SR.addFloat(state, 500, 444, 'COMBO x' + state.combo + '  +$' + v.comboBonus, '#ff9d5c', 18);
    SR.say(state, 'Served ' + ticket.customer + "'s " + ticket.recipe.name + ' — $' + v.price + ' + $' + v.tip + ' tip' + (v.comboBonus ? ' + $' + v.comboBonus + ' combo' : '') + '!');
    if (SR.hasWon(state)) SR.endShift(state, true);
  };

  SR.trashPlate = function (state) {
    if (state.plate.length === 0) {
      SR.say(state, 'Nothing on the plate to trash.');
      return;
    }
    SR.clearPlate(state);
    state.combo = 0;
    SR.say(state, 'Plate cleared. Combo lost — rebuild it clean.');
  };

  SR.endShift = function (state, won) {
    state.mode = 'dayend';
    state.won = won;
  };

  // One simulation step. dt is seconds (clamped by the caller).
  SR.tick = function (state, dt) {
    if (state.mode !== 'playing' || state.frozen) return;
    state.time += dt;
    if (state.messageT > 0) state.messageT -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    // Spawn customers on schedule while there is room.
    state.spawnT -= dt;
    if (state.spawnT <= 0 && state.tickets.filter(function (t) { return t.state === 'waiting'; }).length < SR.CONFIG.maxTickets) {
      SR.spawnTicket(state);
      state.spawnT = SR.spawnInterval(state.time);
    }
    // Patience + walk-outs.
    var walked = SR.tickTickets(state, dt);
    walked.forEach(function (t) {
      SR.applyWalkOut(state);
      SR.say(state, t.customer + ' walked out! Strike ' + state.strikes + '/' + SR.CONFIG.maxStrikes + '.');
      state.shake = 8;
      if (state.selectedTicket === t.id) state.selectedTicket = null;
    });
    // Cooking + burns.
    var burned = SR.tickStations(state, dt);
    burned.forEach(function (s) {
      SR.say(state, 'Something BURNED on the ' + (state.grill.indexOf(s) >= 0 ? 'grill' : 'fryer') + '! Click it to trash it.');
      var rect = state.grill.indexOf(s) >= 0
        ? SR.grillSlotRect(state.grill.indexOf(s))
        : SR.fryerSlotRect(state.fryer.indexOf(s));
      SR.puffSmoke(state, rect.x + rect.w / 2, rect.y + 20);
    });
    // Fade finished tickets off the board after a beat.
    state.tickets.forEach(function (t) {
      if (t.state !== 'waiting') t.goneT = (t.goneT || 0) + dt;
    });
    SR.pruneTickets(state);
    // Sizzle sparks from cooking slots, now and then.
    if (Math.random() < dt * 6) {
      var hot = [];
      state.grill.forEach(function (s, i) { if (s.phase === 'cooking') hot.push(SR.grillSlotRect(i)); });
      state.fryer.forEach(function (s, i) { if (s.phase === 'cooking') hot.push(SR.fryerSlotRect(i)); });
      if (hot.length) {
        var r = hot[(Math.random() * hot.length) | 0];
        SR.sizzle(state, r.x + r.w / 2, r.y + r.h / 2);
      }
    }
    // Particles.
    state.particles.forEach(function (p) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    });
    state.particles = state.particles.filter(function (p) { return p.life > 0; });
    state.floats.forEach(function (f) { f.life -= dt; f.y -= 34 * dt; });
    state.floats = state.floats.filter(function (f) { return f.life > 0; });
    // End conditions.
    if (SR.hasLost(state)) SR.endShift(state, false);
    else if (SR.timeLeft(state) <= 0) SR.endShift(state, SR.hasWon(state));
  };

  // Browser wiring. canvas is the <canvas> element; state is the game state.
  SR.boot = function (canvas, state) {
    var ctx = canvas.getContext('2d');
    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    }
    window.addEventListener('resize', resize);
    resize();
    canvas.addEventListener('click', function (e) {
      var p = SR.toLogical(canvas, e.clientX, e.clientY);
      var action = SR.clickAt(state, p.x, p.y);
      if (action) SR.act(state, action);
    });
    window.addEventListener('keydown', function (e) {
      if ([' ', 'ArrowUp', 'ArrowDown'].indexOf(e.key) >= 0) e.preventDefault();
      SR.keyAction(state, e.key);
    });
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      SR.tick(state, dt);
      SR.renderFrame(ctx, state, canvas.width, canvas.height);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
