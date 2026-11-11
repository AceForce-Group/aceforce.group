/* ACEFORCE ARCADE — game.js
   Bonus stage: SPREADSHEET STORM (Hi-Bit 320x240 Edition).
   Thirty seconds. Rogue spreadsheets fall on the warehouse.
   Each one you zap is one manual task automated. */
(function () {
  'use strict';
  var ACE = window.ACE, G = ACE.gfx, SPR = G.SPR, PAL = G.PAL;
  var cv = document.getElementById('game'); if (!cv) return;
  var ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  var GW = 320, GH = 240, FLOOR = 214, LEN = 30;
  var state = 'attract', T = 0, frame = 0, time = LEN, score = 0, done = 0, slipped = 0, hi = 0;
  var pxr = GW / 2, bolts = [], foes = [], fx = [], floats = [], cards = [], triple = 0, cool = 0, spawn = 0, shake = 0, cardsSent = 0;
  var keys = { l: 0, r: 0, f: 0 }, ptr = null, inView = false, running = false, last = 0, stars = [];
  var LABELS = ['#REF!', 'CSV', 'V7_FINAL', 'COPY', 'PASTE', 'VLOOKUP', '#N/A', 'TAB 14', 'MANUAL', 'RE-KEY'];
  var KINDS = [[SPR.sheetA, SPR.sheetB], SPR.sheetR, SPR.sheetO];
  var hiEl = document.getElementById('g-hi');
  try { hi = parseInt(localStorage.getItem('ace-arcade-hi') || '0', 10) || 0; } catch (e) { hi = 0; }
  if (hiEl) hiEl.textContent = hi;
  for (var i = 0; i < 65; i++) stars.push({ x: Math.random() * GW, y: Math.random() * GH, s: 10 + Math.random() * 34 });

  function sfx(n) { if (ACE.sfx) ACE.sfx.play(n); }
  function spr(s, x, y) { ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2)); }
  function text(c, x, y) { ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y)); }
  function p1(x, y, c) { ctx.fillStyle = PAL[c] || c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function boom(x, y, cols, n) {
    for (var i = 0; i < (n || 16); i++) { var a = Math.random() * 6.283, v = 16 + Math.random() * 70; fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, m: 0.32 + Math.random() * 0.42, c: cols[(Math.random() * cols.length) | 0] }); }
  }
  function float(x, y, s, c) { floats.push({ x: x, y: y, s: s, c: c, l: 0 }); }

  function start() {
    state = 'play'; time = LEN; score = 0; done = 0; slipped = 0; pxr = GW / 2; triple = 0; cool = 0; spawn = 0.4; cardsSent = 0;
    bolts = []; foes = []; fx = []; floats = []; cards = [];
    sfx('start'); if (ACE.sfx) ACE.sfx.duck(true);
    try { cv.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
  }
  function finish() {
    state = 'over'; T = 0;
    if (score > hi) { hi = score; try { localStorage.setItem('ace-arcade-hi', String(hi)); } catch (e) { /* private mode */ } if (hiEl) hiEl.textContent = hi; }
    sfx(done >= 15 ? 'levelup' : 'over'); if (ACE.sfx) ACE.sfx.duck(false);
    if (ACE.ui && ACE.ui.gameOver) ACE.ui.gameOver(score, done);
  }
  function rank() { return done >= 34 ? 'ACE' : done >= 24 ? 'ENGINEER' : done >= 12 ? 'OPERATOR' : 'INTERN'; }

  function update(dt) {
    T += dt; frame++;
    for (var i = 0; i < stars.length; i++) { var s = stars[i]; s.y += s.s * dt; if (s.y > GH) { s.y = 0; s.x = Math.random() * GW; } }
    for (i = fx.length - 1; i >= 0; i--) { var f = fx[i]; f.l += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.l > f.m) fx.splice(i, 1); }
    for (i = floats.length - 1; i >= 0; i--) { floats[i].l += dt; floats[i].y -= 20 * dt; if (floats[i].l > 0.9) floats.splice(i, 1); }
    if (shake > 0) shake = Math.max(0, shake - dt * 3);
    if (state !== 'play') return;

    time -= dt; if (time <= 0) { time = 0; finish(); return; }
    var el = LEN - time;
    var dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    if (ptr !== null) { var dx = ptr - pxr; dir = Math.abs(dx) < 3 ? 0 : dx > 0 ? 1 : -1; }
    pxr = Math.max(16, Math.min(GW - 16, pxr + dir * 200 * dt));
    cool -= dt; if (triple > 0) triple -= dt;
    if ((keys.f || ptr !== null) && cool <= 0) {
      cool = 0.19; sfx('laser');
      bolts.push({ x: pxr, y: FLOOR - 26, vx: 0 });
      if (triple > 0) { bolts.push({ x: pxr - 6, y: FLOOR - 22, vx: -52 }); bolts.push({ x: pxr + 6, y: FLOOR - 22, vx: 52 }); }
    }
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 0.88 - 0.44 * (el / LEN) + Math.random() * 0.2;
      var k = (Math.random() * 3) | 0;
      foes.push({ x: 24 + Math.random() * (GW - 48), y: -12, vy: 27 + el * 1.8 + Math.random() * 16, ph: Math.random() * 6, k: k, lab: Math.random() < 0.55 ? LABELS[(Math.random() * LABELS.length) | 0] : null });
    }
    if ((cardsSent === 0 && el > 7) || (cardsSent === 1 && el > 18)) { cardsSent++; cards.push({ x: 42 + Math.random() * (GW - 84), y: -12 }); }
    for (i = bolts.length - 1; i >= 0; i--) { var b = bolts[i]; b.y -= 295 * dt; b.x += b.vx * dt; if (b.y < -6) bolts.splice(i, 1); }
    for (i = foes.length - 1; i >= 0; i--) {
      var o = foes[i]; o.y += o.vy * dt; o.x += Math.sin(T * 2.4 + o.ph) * 22 * dt;
      var hit = false;
      for (var j = bolts.length - 1; j >= 0; j--) {
        if (Math.abs(bolts[j].x - o.x) < 10 && Math.abs(bolts[j].y - o.y) < 10) { bolts.splice(j, 1); hit = true; break; }
      }
      if (hit) { foes.splice(i, 1); score += 100; done++; boom(o.x, o.y, ['w', 'R', 'Y', 'L'], 16); float(o.x, o.y - 8, '+100', 'L'); sfx('boom'); continue; }
      if (o.y > FLOOR - 6) { foes.splice(i, 1); slipped++; shake = 1; boom(o.x, FLOOR - 2, ['R', 'O'], 12); float(o.x, FLOOR - 18, 'BY HAND!', 'R'); sfx('miss'); }
    }
    for (i = cards.length - 1; i >= 0; i--) {
      var c = cards[i]; c.y += 46 * dt; c.x += Math.sin(T * 3 + i) * 16 * dt;
      if (Math.abs(c.x - pxr) < 16 && Math.abs(c.y - (FLOOR - 14)) < 14) { cards.splice(i, 1); triple = 7; boom(c.x, c.y, ['L', 'Y', 'w'], 22); float(pxr, FLOOR - 42, 'ENGINEER ON BOARD', 'Y'); sfx('power'); continue; }
      if (c.y > GH + 12) cards.splice(i, 1);
    }
  }

  function draw() {
    var sx = shake > 0 ? Math.round((Math.random() - 0.5) * 6 * shake) : 0, i;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, GW, GH);
    ctx.translate(sx, 0);
    for (i = 0; i < stars.length; i++) p1(stars[i].x, stars[i].y, stars[i].s > 30 ? 'w' : stars[i].s > 18 ? 'g' : 'd');

    // warehouse dock
    ctx.fillStyle = PAL.b; ctx.fillRect(-6, FLOOR, GW + 12, GH - FLOOR);
    ctx.fillStyle = PAL.L; ctx.fillRect(-6, FLOOR, GW + 12, 2);
    for (i = 4; i < GW; i += 20) {
      ctx.fillStyle = PAL.n; ctx.fillRect(i, FLOOR + 5, 14, 10);
      ctx.fillStyle = (state === 'play' && slipped > ((i / 20) | 0) % 8) ? PAL.r : PAL.c;
      ctx.fillRect(i + 2, FLOOR + 7, 10, 2);
    }
    text(G.micro('YOUR WAREHOUSE DOCK', 's', true), GW / 2, GH - 11);

    if (state === 'attract') {
      for (i = 0; i < 6; i++) spr(KINDS[i % 3][(frame >> 4) & 1], 55 + i * 42, 48 + Math.sin(T * 2 + i) * 5);
      text(G.big('SPREADSHEET', 'L', 16), GW / 2, 82);
      text(G.big('STORM', 'w', 24), GW / 2, 104);
      spr(SPR.ship, GW / 2, FLOOR - 14 + Math.sin(T * 2) * 2);
      if ((frame >> 5) & 1) text(G.big('PRESS START', 'Y', 8), GW / 2, 146);
      text(G.micro('ZAP THE MANUAL WORK · 30 SECONDS', 's', true), GW / 2, 168);
      return;
    }

    for (i = 0; i < foes.length; i++) {
      var o = foes[i];
      spr(KINDS[o.k][((frame >> 3) + i) & 1], o.x, o.y);
      if (o.lab) text(G.micro(o.lab, 'w', true), o.x, o.y - 16);
    }
    for (i = 0; i < cards.length; i++) { var cf = (frame >> 3) % 4; spr(cf === 0 ? SPR.cardFace : cf === 2 ? SPR.cardBack : SPR.cardEdge, cards[i].x, cards[i].y); }
    for (i = 0; i < bolts.length; i++) {
      ctx.fillStyle = triple > 0 ? PAL.Y : PAL.L;
      ctx.fillRect(Math.round(bolts[i].x) - 1, Math.round(bolts[i].y), 2, 6);
      p1(bolts[i].x, bolts[i].y - 1, 'w');
    }
    if (state === 'play') {
      var py = FLOOR - 14;
      for (i = -1; i <= 1; i += 2) for (var j = 0; j < 2 + ((frame >> 1) & 1) * 3; j++) p1(pxr + i * 4, py + 10 + j, j < 2 ? 'Y' : 'O');
      spr(SPR.ship, pxr, py);
      if (triple > 0 && ((frame >> 2) & 1)) { p1(pxr - 12, py, 'Y'); p1(pxr + 12, py, 'Y'); }
    }
    for (i = 0; i < fx.length; i++) { ctx.fillStyle = PAL[fx[i].c] || fx[i].c; ctx.fillRect(Math.round(fx[i].x), Math.round(fx[i].y), 2, 2); }
    for (i = 0; i < floats.length; i++) text(G.micro(floats[i].s, floats[i].c, true), Math.max(54, Math.min(GW - 54, floats[i].x)), floats[i].y);

    // HUD
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(G.micro('AUTOMATED', 's', true), 8, 6);
    ctx.drawImage(G.big(String(done), 'L', 8), 10, 18);
    var tl = G.micro('TIME', 's', true);
    ctx.drawImage(tl, GW - 8 - tl.width, 6);
    ctx.fillStyle = PAL.D; ctx.fillRect(GW - 96, 19, 88, 7);
    ctx.fillStyle = time < 8 && ((frame >> 3) & 1) ? PAL.R : PAL.L;
    ctx.fillRect(GW - 96, 19, Math.round(88 * time / LEN), 7);
    if (triple > 0) text(G.micro('TRIPLE SHOT ' + Math.ceil(triple), 'Y', true), GW / 2, 6);

    if (state === 'over') {
      ctx.fillStyle = 'rgba(5, 7, 15, .88)'; ctx.fillRect(20, 38, GW - 40, 152);
      ctx.strokeStyle = PAL.L; ctx.lineWidth = 2; ctx.strokeRect(21, 39, GW - 42, 150);
      text(G.big('TIME!', 'Y', 16), GW / 2, 50);
      text(G.micro('MANUAL TASKS AUTOMATED', 's', true), GW / 2, 78);
      text(G.big(String(done), 'L', 16), GW / 2, 94);
      text(G.micro('SLIPPED BY: ' + slipped + '   SCORE: ' + score, 'w', true), GW / 2, 122);
      text(G.big('RANK: ' + rank(), 'M', 8), GW / 2, 142);
      if (T > 1 && ((frame >> 5) & 1)) text(G.micro('CLICK OR PRESS ENTER TO REPLAY', 'Y', true), GW / 2, 166);
    }
  }

  function loop(now) {
    if (!inView) { running = false; return; }
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    update(dt); draw();
  }
  function wake() { if (!running && inView) { running = true; last = performance.now(); requestAnimationFrame(loop); } }
  function press() { if (state === 'attract' || (state === 'over' && T > 0.8)) { start(); return true; } return false; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (inView) wake(); else if (state === 'play') { keys.l = keys.r = keys.f = 0; ptr = null; }
    }, { threshold: 0.15 }).observe(cv);
  } else { inView = true; wake(); }

  window.addEventListener('keydown', function (e) {
    if (!inView || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, focused = document.activeElement === cv;
    if (state !== 'play') { if (focused && (k === 'Enter' || k === ' ')) { e.preventDefault(); press(); } return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.l = 1; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.r = 1; e.preventDefault(); }
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') { keys.f = 1; e.preventDefault(); }
    else if (k === 'ArrowDown') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = 0;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = 0;
    else if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') keys.f = 0;
  });
  function toX(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * GW; }
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); if (press()) return; if (state === 'play') { ptr = toX(e); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } } });
  cv.addEventListener('pointermove', function (e) { if (ptr !== null) ptr = toX(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cv.addEventListener(n, function () { ptr = null; }); });
  function pad(id, key) {
    var el = document.getElementById(id); if (!el) return;
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); if (key === 'f' && press()) return; keys[key] = 1; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { el.addEventListener(n, function () { keys[key] = 0; }); });
    el.addEventListener('click', function (e) { if (key === 'f' && e.detail === 0) press(); });
  }
  pad('pad-l', 'l'); pad('pad-r', 'r'); pad('pad-f', 'f');

  update(0); draw();
  ACE.game = { state: function () { return state; }, start: start };
})();
