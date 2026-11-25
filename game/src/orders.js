// orders.js — customer tickets: spawn, patience, matching, walk-outs.
// A ticket is { id, customer, recipe, patience, maxPatience, state }.
// state: 'waiting' | 'served' | 'walked'. Patience drains with dt while waiting.
(function (root) {
  var SR = root.SR || (root.SR = {});

  var nextTicketId = 1;

  SR.recipeById = function (id) {
    for (var i = 0; i < SR.RECIPES.length; i++) {
      if (SR.RECIPES[i].id === id) return SR.RECIPES[i];
    }
    return null;
  };

  // Recipes unlocked at this point of the shift (minute = floor(elapsed/60)).
  SR.availableRecipes = function (elapsed) {
    var minute = Math.floor(elapsed / 60);
    return SR.RECIPES.filter(function (r) { return r.minMinute <= minute; });
  };

  // Patience shrinks as the shift goes on: early customers wait longer.
  SR.patienceFor = function (elapsed) {
    var c = SR.CONFIG;
    var f = Math.min(1, elapsed / c.shiftLength);
    return c.patienceStart + (c.patienceEnd - c.patienceStart) * f;
  };

  SR.spawnInterval = function (elapsed) {
    var c = SR.CONFIG;
    var f = Math.min(1, elapsed / c.shiftLength);
    return c.spawnIntervalStart + (c.spawnIntervalEnd - c.spawnIntervalStart) * f;
  };

  SR.spawnTicket = function (state) {
    var rng = state.rng;
    var pool = SR.availableRecipes(state.time);
    var recipe = SR.pick(rng, pool);
    var patience = SR.patienceFor(state.time);
    var ticket = {
      id: nextTicketId++,
      customer: SR.pick(rng, SR.CUSTOMERS),
      recipe: recipe,
      patience: patience,
      maxPatience: patience,
      state: 'waiting',
    };
    state.tickets.push(ticket);
    return ticket;
  };

  // Drain patience for every waiting ticket. Returns the tickets that walked.
  SR.tickTickets = function (state, dt) {
    var walked = [];
    for (var i = 0; i < state.tickets.length; i++) {
      var t = state.tickets[i];
      if (t.state !== 'waiting') continue;
      t.patience -= dt;
      if (t.patience <= 0) {
        t.patience = 0;
        t.state = 'walked';
        walked.push(t);
      }
    }
    return walked;
  };

  // Does the plate hold exactly the recipe's items (multiset equality)?
  SR.plateMatches = function (plate, recipe) {
    if (plate.length !== recipe.items.length) return false;
    var have = {};
    plate.forEach(function (it) { have[it] = (have[it] || 0) + 1; });
    for (var i = 0; i < recipe.items.length; i++) {
      var want = recipe.items[i];
      if (!have[want]) return false;
      have[want]--;
    }
    return true;
  };

  // First waiting ticket whose recipe the plate matches, or null.
  SR.matchingTicket = function (state) {
    for (var i = 0; i < state.tickets.length; i++) {
      var t = state.tickets[i];
      if (t.state === 'waiting' && SR.plateMatches(state.plate, t.recipe)) return t;
    }
    return null;
  };

  // Drop finished tickets (served / walked) once they have been shown
  // on the board for a beat (goneT > 1.5s, advanced by the main loop).
  SR.pruneTickets = function (state) {
    state.tickets = state.tickets.filter(function (t) {
      return t.state === 'waiting' || (t.goneT || 0) <= 1.5;
    });
  };

  // Reset the module counter (tests / fresh game).
  SR._resetTicketIds = function () { nextTicketId = 1; };
})(typeof globalThis !== 'undefined' ? globalThis : this);
