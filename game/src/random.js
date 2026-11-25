// random.js — a tiny seeded RNG so staged states and tests repeat exactly.
// Gameplay itself may use Math.random; anything that must repeat (shots,
// tests) goes through mulberry32.
(function (root) {
  var SR = root.SR || (root.SR = {});

  // mulberry32: small, fast, deterministic. seed is any 32-bit integer.
  SR.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  SR.pick = function (rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  };

  SR.shuffle = function (rng, arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
