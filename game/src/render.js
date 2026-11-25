// render.js — every pixel the game draws. Canvas 2D, flat warm colours,
// no images, no fonts from the network: the whole look is drawn code.
// Entry: SR.renderFrame(ctx, state, vw, vh) scales the 1280x720 logical
// scene to the real canvas and draws the current mode on top.
(function (root) {
  var SR = root.SR || (root.SR = {});
  var COL = SR.COLORS;

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.fillStyle = color;
    ctx.font = (weight || 700) + ' ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  function panel(ctx, x, y, w, h, label) {
    ctx.fillStyle = COL.panel;
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = COL.panelEdge; ctx.lineWidth = 2; ctx.stroke();
    if (label) text(ctx, label, x + 14, y + 16, 15, COL.muted, 'left', 800);
  }

  // One ingredient, drawn centred at (x, y) at size s (its bounding box).
  SR.drawIngredient = function (ctx, kind, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    if (kind === 'bun') {
      ctx.fillStyle = '#e8a94e';
      ctx.beginPath(); ctx.arc(0, 2, s * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d18a2e';
      ctx.fillRect(-s * 0.42, 0, s * 0.84, s * 0.12);
      ctx.fillStyle = '#fff3d6';
      [[-0.2, -0.18], [0.05, -0.28], [0.22, -0.12]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * s, p[1] * s, s * 0.045, 0, 7); ctx.fill();
      });
    } else if (kind === 'patty') {
      ctx.fillStyle = '#8a5a33';
      rr(ctx, -s * 0.45, -s * 0.16, s * 0.9, s * 0.32, s * 0.12); ctx.fill();
      ctx.fillStyle = '#6e4525';
      [[-0.25, 0], [0, -0.05], [0.25, 0.03]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * s, p[1] * s, s * 0.05, 0, 7); ctx.fill();
      });
    } else if (kind === 'cheese') {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-s * 0.42, -s * 0.2); ctx.lineTo(s * 0.42, -s * 0.2);
      ctx.lineTo(0, s * 0.34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e0a92c';
      ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.06, 0, 7); ctx.fill();
    } else if (kind === 'lettuce') {
      ctx.fillStyle = '#7dc383';
      [[-0.22, 0.05], [0, -0.08], [0.22, 0.05]].forEach(function (p) {
        ctx.beginPath(); ctx.arc(p[0] * s, p[1] * s, s * 0.24, 0, 7); ctx.fill();
      });
      ctx.fillStyle = '#5da864';
      ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.2, 0, 7); ctx.fill();
    } else if (kind === 'tomato') {
      ctx.fillStyle = '#e4572e';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2825f';
      ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.1, s * 0.16, 0, 7); ctx.fill();
    } else if (kind === 'fries') {
      ctx.fillStyle = '#d43d2a';
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, -s * 0.1); ctx.lineTo(s * 0.34, -s * 0.1);
      ctx.lineTo(s * 0.26, s * 0.36); ctx.lineTo(-s * 0.26, s * 0.36);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f2d06b'; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      [-0.18, 0, 0.18].forEach(function (dx) {
        ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.08); ctx.lineTo(dx * s, -s * 0.42); ctx.stroke();
      });
    }
    ctx.restore();
  };

  function patienceColor(frac) {
    if (frac > 0.5) return COL.green;
    if (frac > 0.25) return COL.gold;
    return COL.red;
  }

  function drawTicket(ctx, t, rect, selected) {
    var gone = t.state !== 'waiting';
    ctx.save();
    if (gone) ctx.globalAlpha = 0.45;
    ctx.fillStyle = COL.ticket;
    rr(ctx, rect.x, rect.y + (selected ? -4 : 0), rect.w, rect.h, 10); ctx.fill();
    ctx.strokeStyle = selected ? COL.gold : COL.ticketEdge;
    ctx.lineWidth = selected ? 4 : 2; ctx.stroke();
    text(ctx, t.customer, rect.x + 12, rect.y + 18, 17, COL.ink, 'left', 800);
    text(ctx, t.recipe.name, rect.x + 12, rect.y + 40, 15, '#7a4a2b', 'left', 700);
    // Mini ingredient icons for the recipe.
    var ix = rect.x + 14;
    t.recipe.items.forEach(function (it) {
      SR.drawIngredient(ctx, it, ix + 14, rect.y + 68, 26);
      ix += 32;
    });
    text(ctx, '$' + t.recipe.price, rect.x + rect.w - 12, rect.y + 40, 16, COL.ink, 'right', 800);
    // Patience bar.
    var frac = Math.max(0, t.patience / t.maxPatience);
    ctx.fillStyle = '#e5d3ae';
    rr(ctx, rect.x + 12, rect.y + rect.h - 16, rect.w - 24, 8, 4); ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    if (frac > 0) { rr(ctx, rect.x + 12, rect.y + rect.h - 16, (rect.w - 24) * frac, 8, 4); ctx.fill(); }
    if (t.state === 'served') text(ctx, 'SERVED ✓', rect.x + rect.w / 2, rect.y + rect.h / 2, 22, COL.serve, 'center', 900);
    if (t.state === 'walked') text(ctx, 'WALKED OUT', rect.x + rect.w / 2, rect.y + rect.h / 2, 20, COL.red, 'center', 900);
    ctx.restore();
  }

  function drawSlot(ctx, slot, rect, station) {
    ctx.fillStyle = station === 'grill' ? COL.grill : '#4a3220';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
    ctx.strokeStyle = '#00000055'; ctx.lineWidth = 2; ctx.stroke();
    if (slot.phase === 'empty') {
      text(ctx, station === 'grill' ? '— grill —' : '— fryer —', rect.x + rect.w / 2, rect.y + rect.h / 2, 13, '#ffffff33', 'center', 600);
      return;
    }
    if (slot.phase === 'cooking') {
      var frac = slot.t / SR.cookTimeFor(slot.kind);
      // Sizzling item with a progress ring.
      SR.drawIngredient(ctx, slot.kind, rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 62);
      ctx.strokeStyle = COL.grillHot; ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 40, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      text(ctx, Math.ceil(SR.cookTimeFor(slot.kind) - slot.t) + 's', rect.x + rect.w / 2, rect.y + rect.h - 16, 14, '#ffb27a', 'center', 800);
    } else if (slot.phase === 'ready') {
      var pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180);
      ctx.strokeStyle = 'rgba(125,195,131,' + (0.5 + 0.5 * pulse) + ')';
      ctx.lineWidth = 4;
      rr(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 8); ctx.stroke();
      SR.drawIngredient(ctx, slot.kind, rect.x + rect.w / 2, rect.y + rect.h / 2 - 6, 66);
      text(ctx, 'READY — click!', rect.x + rect.w / 2, rect.y + rect.h - 16, 13, COL.green, 'center', 800);
    } else if (slot.phase === 'burnt') {
      ctx.fillStyle = '#1a1a1a';
      rr(ctx, rect.x + 18, rect.y + rect.h / 2 - 22, rect.w - 36, 34, 8); ctx.fill();
      text(ctx, 'BURNT!', rect.x + rect.w / 2, rect.y + rect.h - 16, 13, COL.red, 'center', 800);
      text(ctx, 'click to trash', rect.x + rect.w / 2, rect.y + 16, 11, '#ffffff88', 'center', 600);
    }
  }

  function drawBin(ctx, kind, rect, i) {
    var ing = SR.INGREDIENTS[kind];
    ctx.fillStyle = '#fff8e7';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
    ctx.strokeStyle = COL.ticketEdge; ctx.lineWidth = 2; ctx.stroke();
    SR.drawIngredient(ctx, kind, rect.x + rect.w / 2, rect.y + 32, 52);
    text(ctx, ing.label, rect.x + rect.w / 2, rect.y + rect.h - 14, 14, COL.ink, 'center', 800);
    if (ing.cook) text(ctx, '→ ' + ing.cook.station, rect.x + rect.w - 8, rect.y + 14, 11, '#a06a35', 'right', 700);
  }

  function drawPlateArea(ctx, state) {
    var L = SR.LAYOUT.plate;
    panel(ctx, L.x, L.y, L.w, L.h, 'ASSEMBLY PLATE');
    // The plate itself: a white ellipse with the stacked items on it.
    var cx = L.x + 150, cy = L.y + 82;
    ctx.fillStyle = '#fdfdfd';
    ctx.beginPath(); ctx.ellipse(cx, cy, 120, 44, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d8cdb4'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ece2c8';
    ctx.beginPath(); ctx.ellipse(cx, cy, 92, 30, 0, 0, 7); ctx.fill();
    // Ingredients laid out in a row across the plate, so each one reads.
    var n = state.plate.length;
    state.plate.forEach(function (it, i) {
      var px = n === 1 ? cx : cx - 84 + (168 * i) / (n - 1);
      var py = cy - 6 + ((i % 2) * 6 - 3);
      SR.drawIngredient(ctx, it, px, py, 46);
    });
    if (n === 0) text(ctx, 'Click pantry bins to build a dish', cx + 190, cy, 15, COL.muted, 'left', 600);
    else text(ctx, SR.plateSummary(state), cx + 190, cy - 12, 16, COL.cream, 'left', 700);
    var match = SR.matchingTicket(state);
    if (match) text(ctx, '✓ matches ' + match.customer + "'s " + match.recipe.name + ' — SERVE!', cx + 190, cy + 14, 15, COL.green, 'left', 800);
    else if (n > 0) text(ctx, 'No ticket matches this plate yet.', cx + 190, cy + 14, 14, COL.muted, 'left', 600);
  }

  function drawButtons(ctx, state) {
    var L = SR.LAYOUT.serve;
    var match = SR.matchingTicket(state);
    var glow = match ? 0.6 + 0.4 * Math.sin(Date.now() / 200) : 0;
    ctx.fillStyle = match ? COL.serve : '#4a4a4a';
    rr(ctx, L.x, L.y, L.w, L.h, 14); ctx.fill();
    if (match) {
      ctx.strokeStyle = 'rgba(255,255,255,' + glow + ')';
      ctx.lineWidth = 4; ctx.stroke();
    }
    text(ctx, 'SERVE', L.x + L.w / 2, L.y + 52, 34, '#fff', 'center', 900);
    text(ctx, match ? 'to ' + match.customer : 'plate must match a ticket', L.x + L.w / 2, L.y + 96, 13, '#ffffffcc', 'center', 600);
    text(ctx, '[Space]', L.x + L.w / 2, L.y + 118, 12, '#ffffff88', 'center', 600);

    var T = SR.LAYOUT.trash;
    ctx.fillStyle = COL.trash;
    rr(ctx, T.x, T.y, T.w, T.h, 14); ctx.fill();
    text(ctx, 'TRASH', T.x + T.w / 2, T.y + 52, 30, '#fff', 'center', 900);
    text(ctx, 'clear plate · burnt items', T.x + T.w / 2, T.y + 96, 13, '#ffffffcc', 'center', 600);
    text(ctx, '[X]', T.x + T.w / 2, T.y + 118, 12, '#ffffff88', 'center', 600);
  }

  function drawParticles(ctx, state) {
    state.particles.forEach(function (p) {
      var a = Math.max(0, p.life / p.maxLife);
      if (p.kind === 'smoke') {
        ctx.fillStyle = 'rgba(120,120,120,' + (a * 0.55) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.6), 0, 7); ctx.fill();
      } else if (p.kind === 'coin') {
        ctx.fillStyle = 'rgba(247,201,72,' + a + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(176,124,12,' + a + ')';
        ctx.font = '900 ' + Math.round(p.size * 1.1) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', p.x, p.y + 1);
      } else {
        ctx.fillStyle = p.color || '#ffcf5e';
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a + 1, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    state.floats.forEach(function (f) {
      var a = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = a;
      text(ctx, f.text, f.x, f.y, f.size || 22, f.color || COL.gold, 'center', 900);
      ctx.globalAlpha = 1;
    });
  }

  function drawTopBar(ctx, state) {
    var L = SR.LAYOUT.topBar;
    ctx.fillStyle = '#1e130d';
    ctx.fillRect(L.x, L.y, L.w, L.h);
    text(ctx, '🍳 SIZZLE RUSH', 24, 34, 30, COL.gold, 'left', 900);
    text(ctx, 'Ember & Order Kitchen', 308, 36, 15, COL.muted, 'left', 600);
    // Shift clock — big, and red under 30 seconds.
    var left = SR.timeLeft(state);
    var clockColor = left <= 30 ? COL.red : COL.cream;
    text(ctx, '⏱ ' + SR.formatClock(left), 640, 34, 32, clockColor, 'center', 900);
    text(ctx, 'SHIFT', 640, 56, 11, COL.muted, 'center', 700);
    text(ctx, '💰 $' + state.coins + ' / $' + SR.CONFIG.targetCoins, 1000, 30, 24, COL.cream, 'right', 800);
    var comboTxt = state.combo > 1 ? '🔥 COMBO x' + state.combo : 'combo x0';
    text(ctx, comboTxt, 1000, 54, 14, state.combo > 1 ? '#ff9d5c' : COL.muted, 'right', 800);
    text(ctx, 'served ' + state.served + ' · lost ' + state.lost + ' · strikes ' + state.strikes + '/' + SR.CONFIG.maxStrikes, 1256, 54, 13, COL.muted, 'right', 600);
  }

  function drawBottomBar(ctx, state) {
    var L = SR.LAYOUT.bottomBar;
    ctx.fillStyle = '#1e130d';
    ctx.fillRect(L.x, L.y, L.w, L.h);
    // Day progress.
    var f = Math.min(1, state.time / SR.CONFIG.shiftLength);
    ctx.fillStyle = '#3a2a20';
    rr(ctx, 24, L.y + 18, 1232, 10, 5); ctx.fill();
    ctx.fillStyle = COL.gold;
    if (f > 0) { rr(ctx, 24, L.y + 18, 1232 * f, 10, 5); ctx.fill(); }
    text(ctx, 'DAY PROGRESS', 24, L.y + 44, 12, COL.muted, 'left', 700);
    // Message line.
    var msg = state.message || 'Take an order, cook it, serve it before patience runs out!';
    text(ctx, msg, 24, L.y + 78, 19, COL.cream, 'left', 700);
    text(ctx, 'Click a ticket to pick it · click bins to add food · click READY food to plate it · Space = serve · X = trash · P = pause', 24, L.y + 112, 14, COL.muted, 'left', 600);
    text(ctx, 'Keys: 1–4 tickets · B bun · P patty · C cheese · L lettuce · T tomato · F fries', 24, L.y + 138, 14, COL.muted, 'left', 600);
  }

  function drawGame(ctx, state) {
    var W = SR.CONFIG.canvasW, H = SR.CONFIG.canvasH;
    // Wall + floor.
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#4a2c1c');
    grad.addColorStop(0.5, '#3a2115');
    grad.addColorStop(1, SR.COLORS.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Floor tiles.
    ctx.fillStyle = '#00000022';
    for (var x = 0; x < W; x += 80) ctx.fillRect(x, 560, 2, 160);
    // Order board.
    for (var i = 0; i < SR.CONFIG.maxTickets; i++) {
      var t = state.tickets[i];
      if (t) drawTicket(ctx, t, SR.ticketRect(i), state.selectedTicket === t.id);
    }
    if (state.tickets.length === 0) {
      text(ctx, 'No orders right now — the next customer is on the way…', 640, 126, 17, COL.muted, 'center', 600);
    }
    // Stations.
    panel(ctx, SR.LAYOUT.grill.x, SR.LAYOUT.grill.y, SR.LAYOUT.grill.w, SR.LAYOUT.grill.h, '🔥 GRILL — patties take ' + SR.CONFIG.pattyCookTime + 's');
    state.grill.forEach(function (s, i) { drawSlot(ctx, s, SR.grillSlotRect(i), 'grill'); });
    panel(ctx, SR.LAYOUT.fryer.x, SR.LAYOUT.fryer.y, SR.LAYOUT.fryer.w, SR.LAYOUT.fryer.h, '🍟 FRYER — fries take ' + SR.CONFIG.friesCookTime + 's');
    state.fryer.forEach(function (s, i) { drawSlot(ctx, s, SR.fryerSlotRect(i), 'fryer'); });
    panel(ctx, SR.LAYOUT.pantry.x, SR.LAYOUT.pantry.y, SR.LAYOUT.pantry.w, SR.LAYOUT.pantry.h, '🧺 PANTRY — click to add');
    SR.BIN_ORDER.forEach(function (kind, i) { drawBin(ctx, kind, SR.binRect(i), i); });
    drawPlateArea(ctx, state);
    drawButtons(ctx, state);
    drawParticles(ctx, state);
    drawTopBar(ctx, state);
    drawBottomBar(ctx, state);
    if (state.shake > 0.5) {
      ctx.fillStyle = 'rgba(228,87,46,0.12)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawTitle(ctx, state) {
    drawGame(ctx, state);
    ctx.fillStyle = 'rgba(20,10,5,0.72)';
    ctx.fillRect(0, 0, SR.CONFIG.canvasW, SR.CONFIG.canvasH);
    var c = SR.LAYOUT.titleCard;
    ctx.fillStyle = '#fff8e7';
    rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.fill();
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, '🍳 SIZZLE RUSH', 640, c.y + 62, 52, '#8a3c14', 'center', 900);
    text(ctx, 'Ember & Order Kitchen', 640, c.y + 104, 20, '#7a4a2b', 'center', 700);
    text(ctx, 'A rush-hour cooking game. Take orders, grill patties,', 640, c.y + 158, 17, COL.ink, 'center', 600);
    text(ctx, 'fry the fries, plate the dish and serve it smiling', 640, c.y + 182, 17, COL.ink, 'center', 600);
    text(ctx, 'before patience runs out.', 640, c.y + 206, 17, COL.ink, 'center', 600);
    text(ctx, 'Reach $' + SR.CONFIG.targetCoins + ' in ' + SR.formatClock(SR.CONFIG.shiftLength) + ' — 3 walk-outs ends the shift.', 640, c.y + 244, 16, '#8a3c14', 'center', 800);
    var pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
    ctx.fillStyle = 'rgba(47,158,68,' + pulse + ')';
    rr(ctx, 490, c.y + 272, 300, 56, 12); ctx.fill();
    text(ctx, '▶  START SHIFT', 640, c.y + 301, 24, '#fff', 'center', 900);
    text(ctx, 'or press Enter — H shows how to play', 640, c.y + 352, 14, COL.muted, 'center', 600);
    text(ctx, 'Mouse + keyboard · no sound needed · best played fast', 640, c.y + 380, 13, COL.muted, 'center', 600);
  }

  function drawHowTo(ctx, state) {
    drawGame(ctx, state);
    ctx.fillStyle = 'rgba(20,10,5,0.78)';
    ctx.fillRect(0, 0, SR.CONFIG.canvasW, SR.CONFIG.canvasH);
    var c = SR.LAYOUT.titleCard;
    ctx.fillStyle = '#fff8e7';
    rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.fill();
    ctx.strokeStyle = COL.gold; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, 'HOW TO PLAY', 640, c.y + 52, 34, '#8a3c14', 'center', 900);
    var lines = [
      ['1.', 'Click a ticket (or press 1–4) to pick an order.'],
      ['2.', 'Click pantry bins: buns & veg go straight to the plate.'],
      ['3.', 'Patty goes to the grill, fries to the fryer — watch the ring!'],
      ['4.', 'Click READY food to plate it. Left too long, it BURNS.'],
      ['5.', 'When the plate matches a ticket, hit SERVE (or Space).'],
      ['6.', 'Fast serves pay tips. Serve in a row to build a COMBO.'],
      ['7.', '3 walk-outs ends the shift. Reach $' + SR.CONFIG.targetCoins + ' to win.'],
    ];
    lines.forEach(function (l, i) {
      text(ctx, l[0], 400, c.y + 100 + i * 34, 17, '#8a3c14', 'left', 900);
      text(ctx, l[1], 432, c.y + 100 + i * 34, 16, COL.ink, 'left', 600);
    });
    text(ctx, 'Click anywhere or press H to go back', 640, c.y + 372, 14, COL.muted, 'center', 600);
  }

  function drawDayEnd(ctx, state) {
    drawGame(ctx, state);
    ctx.fillStyle = 'rgba(20,10,5,0.78)';
    ctx.fillRect(0, 0, SR.CONFIG.canvasW, SR.CONFIG.canvasH);
    var c = SR.LAYOUT.titleCard;
    var won = SR.hasWon(state);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.fill();
    ctx.strokeStyle = won ? COL.gold : COL.red; ctx.lineWidth = 4; ctx.stroke();
    text(ctx, won ? '🏆 SHIFT COMPLETE!' : '💨 SHIFT OVER', 640, c.y + 62, 40, won ? '#8a3c14' : COL.red, 'center', 900);
    text(ctx, won ? 'The kitchen hit its target — the crowd goes home happy.' : 'Too many walk-outs. The kitchen closes early tonight.', 640, c.y + 104, 16, COL.ink, 'center', 600);
    text(ctx, '💰 $' + state.coins + ' earned  ·  🍽 ' + state.served + ' served  ·  🚶 ' + state.lost + ' walked out', 640, c.y + 158, 19, COL.ink, 'center', 800);
    text(ctx, '🔥 Best combo x' + state.bestCombo + '  ·  🍳 ' + state.stats.burned + ' dishes burnt', 640, c.y + 196, 17, COL.ink, 'center', 700);
    text(ctx, won ? 'You beat the rush. Same time tomorrow?' : 'Tip: plate ready food fast — a burnt patty breaks the combo.', 640, c.y + 240, 15, '#7a4a2b', 'center', 600);
    ctx.fillStyle = COL.serve;
    rr(ctx, 490, c.y + 272, 300, 56, 12); ctx.fill();
    text(ctx, '↻  PLAY AGAIN', 640, c.y + 301, 24, '#fff', 'center', 900);
    text(ctx, 'or press Enter', 640, c.y + 352, 14, COL.muted, 'center', 600);
  }

  function drawPaused(ctx, state) {
    drawGame(ctx, state);
    ctx.fillStyle = 'rgba(20,10,5,0.66)';
    ctx.fillRect(0, 0, SR.CONFIG.canvasW, SR.CONFIG.canvasH);
    text(ctx, '⏸ PAUSED', 640, 330, 56, COL.cream, 'center', 900);
    text(ctx, 'Press P or click to resume', 640, 380, 18, COL.muted, 'center', 600);
  }

  // Particle spawners (called by main.js on game events).
  SR.burstCoins = function (state, x, y, n) {
    for (var i = 0; i < n; i++) {
      state.particles.push({
        kind: 'coin', x: x, y: y,
        vx: (Math.random() - 0.5) * 260, vy: -120 - Math.random() * 160,
        life: 0.9, maxLife: 0.9, size: 9 + Math.random() * 5,
      });
    }
  };

  SR.puffSmoke = function (state, x, y) {
    for (var i = 0; i < 6; i++) {
      state.particles.push({
        kind: 'smoke', x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20, vy: -24 - Math.random() * 20,
        life: 1.1, maxLife: 1.1, size: 10 + Math.random() * 8,
      });
    }
  };

  SR.sizzle = function (state, x, y) {
    state.particles.push({
      kind: 'spark', x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 40,
      life: 0.4, maxLife: 0.4, size: 2 + Math.random() * 2, color: '#ffcf5e',
    });
  };

  SR.addFloat = function (state, x, y, txt, color, size) {
    state.floats.push({ x: x, y: y, text: txt, color: color, size: size || 22, life: 1.3, maxLife: 1.3 });
  };

  // Main entry. vw/vh are the real canvas pixels; the scene is 1280x720.
  SR.renderFrame = function (ctx, state, vw, vh) {
    var scale = Math.min(vw / SR.CONFIG.canvasW, vh / SR.CONFIG.canvasH);
    var ox = (vw - SR.CONFIG.canvasW * scale) / 2;
    var oy = (vh - SR.CONFIG.canvasH * scale) / 2;
    ctx.save();
    ctx.fillStyle = '#160d08';
    ctx.fillRect(0, 0, vw, vh);
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    if (state.mode === 'title') drawTitle(ctx, state);
    else if (state.mode === 'howto') drawHowTo(ctx, state);
    else if (state.mode === 'dayend') drawDayEnd(ctx, state);
    else if (state.mode === 'paused') drawPaused(ctx, state);
    else drawGame(ctx, state);
    ctx.restore();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
