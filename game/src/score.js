// score.js — coins, tips, combos, strikes and the win/lose arc.
// Serve pays the dish price plus a tip that grows with the patience left
// and with the combo. A walk-out or a trashed burnt item breaks the combo.
(function (root) {
  var SR = root.SR || (root.SR = {});

  // Coins for serving this ticket now. Tip scales with patience left.
  SR.serveValue = function (state, ticket) {
    var c = SR.CONFIG;
    var patienceFrac = ticket.maxPatience > 0 ? ticket.patience / ticket.maxPatience : 0;
    var tip = Math.round(ticket.recipe.price * c.tipRate * patienceFrac);
    var comboBonus = Math.round(tip * c.comboStep * state.combo);
    return {
      price: ticket.recipe.price,
      tip: tip,
      comboBonus: comboBonus,
      total: ticket.recipe.price + tip + comboBonus,
    };
  };

  // Apply a serve: pay out, grow the combo, count the serve.
  SR.applyServe = function (state, ticket) {
    var v = SR.serveValue(state, ticket);
    state.coins += v.total;
    state.combo += 1;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    state.served += 1;
    ticket.state = 'served';
    return v;
  };

  // A customer walked out: one strike, combo gone.
  SR.applyWalkOut = function (state) {
    state.strikes += 1;
    state.combo = 0;
    state.lost += 1;
  };

  // A burnt item was trashed: combo gone (the kitchen wasted food).
  SR.applyBurnTrash = function (state) {
    state.combo = 0;
    state.stats.burned += 1;
  };

  SR.hasWon = function (state) {
    return state.coins >= SR.CONFIG.targetCoins;
  };

  SR.hasLost = function (state) {
    return state.strikes >= SR.CONFIG.maxStrikes;
  };

  SR.timeLeft = function (state) {
    return Math.max(0, SR.CONFIG.shiftLength - state.time);
  };

  SR.formatClock = function (seconds) {
    var s = Math.max(0, Math.ceil(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
