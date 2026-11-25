// shots.js — staged screenshot states. ?shot=cover|mid|serve|rush (plus
// &seed=N) puts the game into a fixed, deterministic mid-game scene and
// freezes the clock, so a screenshot is a real render of the game's own
// code in a state a player could reach. Shots are listed in shots.json.
(function (root) {
  var SR = root.SR || (root.SR = {});

  function ticket(state, customer, recipeId, patienceFrac) {
    var recipe = SR.recipeById(recipeId);
    var patience = SR.patienceFor(state.time) * patienceFrac;
    return {
      id: 100 + state.tickets.length,
      customer: customer,
      recipe: recipe,
      patience: patience,
      maxPatience: SR.patienceFor(state.time),
      state: 'waiting',
    };
  }

  function slot(kind, phase, t) {
    return { kind: kind, phase: phase, t: t };
  }

  // Stage one of the four scenes. Returns the scene name.
  SR.stageShot = function (state, name) {
    state.mode = 'playing';
    state.frozen = true;
    state.particles = [];
    state.floats = [];
    state.plate = [];
    state.combo = 0;
    if (name === 'cover') {
      state.time = 56; // 01:24 left on the clock
      state.coins = 64;
      state.combo = 3;
      state.bestCombo = 3;
      state.served = 7;
      state.tickets = [
        ticket(state, 'Maya', 'cheese', 0.72),
        ticket(state, 'Riko', 'classic', 0.55),
        ticket(state, 'Sinta', 'double', 0.86),
      ];
      state.selectedTicket = state.tickets[0].id;
      state.grill = [
        slot('patty', 'cooking', 2.5),
        slot('patty', 'ready', 1.2),
        slot('patty', 'cooking', 4.8),
        slot(null, 'empty', 0),
      ];
      state.fryer = [slot('fries', 'cooking', 2.0), slot(null, 'empty', 0)];
      state.plate = ['bun', 'patty', 'cheese'];
      SR.say(state, 'Cheeseburger for Maya — one tomato to go!');
    } else if (name === 'mid') {
      state.time = 92; // 01:08 left
      state.coins = 41;
      state.combo = 2;
      state.bestCombo = 2;
      state.served = 4;
      state.tickets = [
        ticket(state, 'Budi', 'deluxe', 0.64),
        ticket(state, 'Ayu', 'garden', 0.8),
      ];
      state.selectedTicket = state.tickets[0].id;
      state.grill = [
        slot('patty', 'ready', 0.6),
        slot('patty', 'cooking', 1.1),
        slot(null, 'empty', 0),
        slot(null, 'empty', 0),
      ];
      state.fryer = [slot('fries', 'ready', 0.4), slot(null, 'empty', 0)];
      state.plate = ['bun', 'patty', 'cheese', 'lettuce'];
      SR.say(state, 'Deluxe Combo for Budi — tomato + fries to finish!');
    } else if (name === 'serve') {
      state.time = 118; // 01:02 left
      state.coins = 96;
      state.combo = 4;
      state.bestCombo = 4;
      state.served = 11;
      var t = ticket(state, 'Dewi', 'classic', 0.9);
      t.state = 'served';
      t.goneT = 0.4;
      state.tickets = [t, ticket(state, 'Joko', 'cheese', 0.7)];
      state.selectedTicket = null;
      state.grill = [
        slot('patty', 'cooking', 3.3),
        slot(null, 'empty', 0),
        slot(null, 'empty', 0),
        slot(null, 'empty', 0),
      ];
      state.fryer = [slot(null, 'empty', 0), slot(null, 'empty', 0)];
      state.plate = [];
      SR.burstCoins(state, 500, 450, 12);
      SR.addFloat(state, 500, 416, '+$18', '#f7c948', 30);
      SR.addFloat(state, 500, 444, 'COMBO x4', '#ff9d5c', 20);
      SR.say(state, "Served Dewi's Classic Burger — $8 + $6 tip + $4 combo!");
    } else if (name === 'rush') {
      state.time = 149; // 00:31 left
      state.coins = 108;
      state.combo = 5;
      state.bestCombo = 5;
      state.served = 13;
      state.lost = 2;
      state.strikes = 2;
      state.tickets = [
        ticket(state, 'Lina', 'deluxe', 0.18),
        ticket(state, 'Fajar', 'double', 0.31),
        ticket(state, 'Nina', 'cheese', 0.44),
        ticket(state, 'Eko', 'fries', 0.62),
      ];
      state.selectedTicket = state.tickets[0].id;
      state.grill = [
        slot('patty', 'burnt', 0),
        slot('patty', 'ready', 3.1),
        slot('patty', 'cooking', 5.2),
        slot(null, 'empty', 0),
      ];
      state.fryer = [slot('fries', 'cooking', 4.4), slot('fries', 'ready', 2.2)];
      state.plate = ['bun', 'patty', 'cheese'];
      SR.puffSmoke(state, 24 + 12 + 50, 196 + 44 + 40);
      SR.say(state, 'RUSH! A patty burned — trash it, serve Lina, hold the line!');
    } else {
      return SR.stageShot(state, 'cover');
    }
    return name;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
