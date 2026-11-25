// plate.js — the assembly plate: what the cook has built so far.
// The plate is an array of finished items in the order they were added.
// A dish is served only when the plate matches a ticket exactly.
(function (root) {
  var SR = root.SR || (root.SR = {});

  SR.PLATE_MAX = 6;

  // Add a finished item to the plate. Returns false when the plate is full.
  SR.addToPlate = function (state, item) {
    if (state.plate.length >= SR.PLATE_MAX) return false;
    state.plate.push(item);
    return true;
  };

  // Take one item back off the plate (index i). Returns the item or null.
  SR.removeFromPlate = function (state, i) {
    if (i < 0 || i >= state.plate.length) return null;
    return state.plate.splice(i, 1)[0];
  };

  SR.clearPlate = function (state) {
    state.plate = [];
  };

  // Human-readable list of what the plate holds, for the message line.
  SR.plateSummary = function (state) {
    if (state.plate.length === 0) return 'Plate is empty.';
    var counts = {};
    state.plate.forEach(function (it) { counts[it] = (counts[it] || 0) + 1; });
    return Object.keys(counts).map(function (k) {
      return counts[k] > 1 ? counts[k] + 'x ' + SR.INGREDIENTS[k].label : SR.INGREDIENTS[k].label;
    }).join(' + ');
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
