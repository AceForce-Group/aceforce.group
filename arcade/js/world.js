/* ACEFORCE ARCADE — world.js
   One fixed hi-bit pixel canvas behind the page. Scroll position drives it.
   Chapters 1-1 to 1-5 share one stage: three planets (STORE, ERP, WMS) and the
   story of the manual layer, told as one continuous value J from 0 to 5. */
(function () {
  'use strict';
  var ACE = window.ACE, G = ACE.gfx, SPR = G.SPR, PAL = G.PAL;
  var cv = document.getElementById('world'); if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, SC = 4, vw = 0, vh = 0, TH = 0;
  var sY = 0, vel = 0, T = 0, frame = 0, lastNow = 0, prevJ = 0, curJ = 0, warp = 0, runS = 0;
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var secs = {}, CH = ['drift', 'integrate', 'rebuild', 'automate', 'vanish'];
  var stars = [], neb = [], home = null, parts = [], L = { P: [] }, PS = [], blocks = [], crates = [], ghosts = [], deco = [];
  var cbs = [], mouse = { x: -99, y: -99 };
  var TAU = Math.PI * 2, flash = 0, flashCol = 'L', FLASH = ['R', 'Y', 'c', 'L', 'M'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function seg(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function eio(t) { return t * t * (3 - 2 * t); }
  function eout(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
  var R = Math.round;
  function px(x, y, c) { ctx.fillStyle = PAL[c] || c; ctx.fillRect(R(x), R(y), 1, 1); }
  function spr(s, x, y) { ctx.drawImage(s, R(x - s.width / 2), R(y - s.height / 2)); }
  function sprD(s, x, y, vis) { G.dissolve(ctx, s, R(x - s.width / 2), R(y - s.height / 2), vis); }
  function text(c, x, y) { ctx.drawImage(c, R(x - c.width / 2), R(y)); }
  function sfx(n) { if (ACE.sfx) ACE.sfx.play(n); }

  function line(x0, y0, x1, y1, fn) {
    x0 = R(x0); y0 = R(y0); x1 = R(x1); y1 = R(y1);
    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy, i = 0, n = Math.max(dx, dy) || 1;
    for (;;) {
      fn(x0, y0, i, n);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
      i++;
    }
  }
  function ring(cx, cy, rx, ry, col, half) {
    var n = Math.ceil((rx + ry) * 3.6), i, a, s;
    ctx.fillStyle = PAL[col] || col;
    for (i = 0; i < n; i++) {
      a = i / n * TAU; s = Math.sin(a);
      if (half < 0 && s > 0) continue;
      if (half > 0 && s <= 0) continue;
      ctx.fillRect(R(cx + Math.cos(a) * rx), R(cy + s * ry), 1, 1);
    }
  }
  function puff(cx, cy, r, dens, col) {
    for (var dy = -R(r); dy <= R(r); dy++) {
      var w = Math.sqrt(Math.max(0, r * r - dy * dy));
      G.ditherRect(ctx, R(cx - w), R(cy + dy), Math.max(1, R(w * 2)), 1, col || (dy < 0 ? 'w' : 's'), dens);
    }
  }
  function twinkle(x, y, c) {
    if ((frame >> 2) & 1) { px(x - 1, y, c || 'Y'); px(x + 1, y, c || 'Y'); px(x, y - 1, c || 'Y'); px(x, y + 1, c || 'Y'); }
    else { px(x - 1, y - 1, 'w'); px(x + 1, y + 1, 'w'); px(x + 1, y - 1, 'w'); px(x - 1, y + 1, 'w'); }
    px(x, y, 'w');
  }
  function flame(cx, y, len) {
    var offs = [-5, -4, -2, -1, 1, 2, 4, 5];
    for (var k = 0; k < offs.length; k++) {
      var l = 1 + ((G.hash(offs[k] + 9, frame >> 1, 3) * len) | 0);
      for (var j = 0; j < l; j++) px(R(cx) + offs[k], R(y) + j, j < l * 0.4 ? 'Y' : j < l * 0.8 ? 'O' : 'R');
    }
  }

  /* ----------------------------------------------------------- particles -- */
  function emit(x, y, n, cols, spd, life) {
    if (reduced) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, v = (0.3 + Math.random()) * spd;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, life: 0, max: life * (0.6 + Math.random() * 0.7), c: cols[(Math.random() * cols.length) | 0], k: Math.random() < 0.4 ? 1 : 0 });
    }
    if (parts.length > 420) parts.splice(0, parts.length - 420);
  }
  function drawParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += dt;
      if (p.life > p.max) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 14 * dt;
      var t = p.life / p.max;
      if (t > 0.7 && ((frame + i) % 3 === 0)) continue;
      px(p.x, p.y, p.c);
      if (p.k && t < 0.55) { px(p.x - 1, p.y, p.c); px(p.x + 1, p.y, p.c); px(p.x, p.y - 1, p.c); px(p.x, p.y + 1, p.c); }
    }
  }

  /* -------------------------------------------------------------- layout -- */
  function surf(a, b, pad) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, r = (a.r || 0) + pad;
    return { x: a.x + dx / d * r, y: a.y + dy / d * r };
  }
  function mkPath(pts) {
    var len = [], total = 0;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], d = Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
      len.push(d); total += d;
    }
    return { pts: pts, len: len, total: total };
  }
  function along(path, s) {
    s = ((s % path.total) + path.total) % path.total;
    for (var i = 0; i < path.pts.length; i++) {
      if (s <= path.len[i]) {
        var a = path.pts[i], b = path.pts[(i + 1) % path.pts.length], t = path.len[i] ? s / path.len[i] : 0;
        return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
      }
      s -= path.len[i];
    }
    return path.pts[0];
  }

  var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0), VH = 0, ready = false;
  function measureSecs() {
    var sy0 = window.scrollY || 0;
    secs = {};
    Array.prototype.forEach.call(document.querySelectorAll('main > section'), function (el) {
      var r = el.getBoundingClientRect(); secs[el.id] = { top: r.top + sy0, h: r.height };
    });
  }
  function measure() {
    if (window.innerWidth < 8 || window.innerHeight < 8) { ready = false; return; }
    vw = window.innerWidth; vh = window.innerHeight; ready = true;
    // Slightly finer pixel grid (3..4 on desktop, 2..3 on mobile) for crisp hi-bit detail
    SC = clamp(Math.floor(Math.min(vw / 380, vh / 240)), 2, 4);
    W = Math.ceil(vw / SC); VH = Math.ceil(vh / SC); H = Math.ceil((vh + (touch ? 130 : 0)) / SC); TH = H * 2;
    cv.width = W; cv.height = H; cv.style.width = W * SC + 'px'; cv.style.height = H * SC + 'px';
    ctx.imageSmoothingEnabled = false;
    measureSecs();

    var wide = vw > 860, limit = 0, panel = document.querySelector('.chapter .panel');
    if (wide && panel) limit = Math.ceil((panel.offsetLeft + panel.offsetWidth) / SC) + 8;
    L.wide = wide; L.x0 = limit; L.hw = (W - limit) / 2;
    L.sx = R(limit + L.hw) - (wide ? 6 : 0);
    L.sy = R(VH * (wide ? 0.52 : 0.54));
    L.k = clamp((L.hw - (wide ? 42 : 28)) / 82, 0.52, 1.18);
    L.kv = clamp(VH / 240, 0.88, wide ? 1.28 : 1.55);
    var pr = clamp(L.k, 0.76, 1.12);
    L.P = [
      { x: R(L.sx - 80 * L.k), y: R(L.sy - 44 * L.kv), r: R(19 * pr), name: 'STORE' },
      { x: R(L.sx + 80 * L.k), y: R(L.sy - 44 * L.kv), r: R(21 * pr), name: 'ERP' },
      { x: L.sx, y: R(L.sy + 58 * L.kv), r: R(25 * pr), name: 'WMS' }
    ];
    L.hub = { x: L.sx, y: R(L.sy - 10 * L.kv), r: 22 };
    L.mag0 = { x: R(L.sx - L.hw + (wide ? 30 : 20)), y: R(L.sy + 50 * L.kv) };
    L.vc = { x: L.mag0.x + R(12 * L.k), y: L.mag0.y - 6 };
    L.rest = { x: R(L.P[2].x - L.P[2].r * 0.66), y: R(L.P[2].y - L.P[2].r * 0.75 - 5) };
    PS = [
      { r: L.P[0].r, seed: 3, kind: 'gas', a: ['x', 'm', 'M', 'K'], b: ['x', 'p', 'P', 'V'], freq: 3, sp: 0.05 },
      { r: L.P[1].r, seed: 5, kind: 'gas', a: ['n', 't', 'c', 'C'], b: ['n', 'B', 't', 'c'], freq: 3, sp: 0.035 },
      { r: L.P[2].r, seed: 9, kind: 'rock', a: ['x', 'o', 'O', 'Y'], b: ['x', 'r', 'o', 'W'], freq: 4, sp: 0.02 }
    ];
    PS.forEach(function (s, i) { G.planet(s, i * 0.3); });

    var rnd = G.rng(5), pts = [], order = [0, 2, 1];
    for (var i = 0; i < 3; i++) {
      var a = L.P[order[i]], b = L.P[order[(i + 1) % 3]], s = surf(a, b, 4), e = surf(b, a, 4);
      var nx = -(e.y - s.y), ny = e.x - s.x, nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
      pts.push(s);
      for (var m = 1; m <= 3; m++) { var off = (m % 2 ? 1 : -1) * (5 + rnd() * 6); pts.push({ x: lerp(s.x, e.x, m / 4) + nx * off, y: lerp(s.y, e.y, m / 4) + ny * off }); }
      pts.push(e);
    }
    L.loop = mkPath(pts);

    blocks = []; rnd = G.rng(77);
    var ST = G.STATION, cols = ST[0].length, rows = ST.length, jc = ['r', 'R', 'd', 'g', 'o', 'r', 'd'];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var ch = ST[y][x]; if (ch === '.') continue;
      var tx = (x - cols / 2) * 3, ty = (y - rows / 2) * 3, ang = rnd() * TAU, rad = Math.sqrt(rnd()) * 14, sa = rnd() * TAU, sr = 28 + rnd() * 32;
      blocks.push({ tx: tx, ty: ty, col: ch, jx: R(Math.cos(ang) * rad) - 1, jy: R(Math.sin(ang) * rad * 0.8) - 1, jcol: jc[(rnd() * jc.length) | 0],
        sx: Math.cos(sa) * sr, sy: Math.sin(sa) * sr * 0.7, d: clamp(Math.sqrt(tx * tx + ty * ty) / 24, 0, 1) });
    }
    crates = []; rnd = G.rng(21);
    for (i = 0; i < 12; i++) crates.push({ f1: 0.2 + rnd() * 0.35, f2: 0.25 + rnd() * 0.3, p1: rnd() * TAU, p2: rnd() * TAU, a: 0.45 + rnd() * 0.5, b: 0.45 + rnd() * 0.55, lost: rnd() < 0.45 });
    ghosts = [];
    for (i = 0; i < 5; i++) ghosts.push({ f1: 0.3 + rnd() * 0.3, f2: 0.35 + rnd() * 0.3, p1: rnd() * TAU, p2: rnd() * TAU });

    deco = [
      { id: 'cards', fx: 0.9, fy: 0.3, par: 0.45, sp: 0.03, ring: 'P', spec: { r: R(32 * pr), seed: 14, kind: 'gas', a: ['x', 'p', 'P', 'V'], b: ['x', 'u', 'p', 'M'], freq: 3 } },
      { id: 'versus', fx: 0.06, fy: 0.45, par: 0.55, rocks: 1 },
      { id: 'proof', fx: 0.93, fy: 0.25, par: 0.5, sp: 0.02, spec: { r: R(24 * pr), seed: 31, kind: 'earth', a: ['n', 'B', 't', 'c'], b: ['b', 't', 'c', 'C'], freq: 4 } },
      { id: 'proof', fx: 0.05, fy: 0.75, par: 0.6, rocks: 1 },
      { id: 'bonus', fx: 0.08, fy: 0.35, par: 0.5, sp: 0.04, spec: { r: R(16 * pr), seed: 40, kind: 'rock', a: ['x', 'r', 'R', 'O'], b: ['x', 'x', 'r', 'W'], freq: 3 } }
    ];
    deco.forEach(function (o) { if (o.spec) G.planet(o.spec, 0); });

    buildStars(); buildNebula(); buildHome();
  }

  function buildStars() {
    stars = []; var rnd = G.rng(7), n = R(W * TH / 100);
    for (var i = 0; i < n; i++) {
      var l = rnd(), c = rnd();
      stars.push({ x: (rnd() * W) | 0, y: (rnd() * TH) | 0, l: l < 0.6 ? 0 : l < 0.9 ? 1 : 2, ph: rnd() * TAU, c: c < 0.1 ? 'c' : c < 0.18 ? 'V' : c < 0.24 ? 'W' : null });
    }
  }
  function buildNebula() {
    var cell = TH / 6, mask = new Uint8Array(W * TH), x, y, i = 0;
    for (y = 0; y < TH; y++) for (x = 0; x < W; x++, i++) {
      var n = G.fbm(x / cell, y / cell, 11, 0, 6) + (G.BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.12;
      mask[i] = n > 0.67 ? 2 : n > 0.57 ? 1 : 0;
    }
    neb = [['#100a24', '#1d113d'], ['#220b18', '#381025'], ['#081a2d', '#0d2944']].map(function (t) {
      var c = G.canvas(W, TH), cx = c.getContext('2d'), im = cx.createImageData(W, TH), d = im.data, a = G.rgb(t[0]), b = G.rgb(t[1]);
      for (var k = 0; k < mask.length; k++) if (mask[k]) { var col = mask[k] === 2 ? b : a; d[k * 4] = col[0]; d[k * 4 + 1] = col[1]; d[k * 4 + 2] = col[2]; d[k * 4 + 3] = 255; }
      cx.putImageData(im, 0, 0); return c;
    });
  }
  function buildHome() {
    var hh = R(VH * 0.23) + 8, R0 = R(Math.max(W * 1.1, 260)), c = G.canvas(W, hh), cx = c.getContext('2d'), im = cx.createImageData(W, hh), d = im.data;
    var A = ['n', 'b', 't', 'c'].map(function (k) { return G.rgb(PAL[k]); }), B = ['b', 'l', 'G', 'L'].map(function (k) { return G.rgb(PAL[k]); }), atm = G.rgb(PAL.C);
    var ox = W / 2, oy = R0 + 6, i = 0;
    for (var y = 0; y < hh; y++) for (var x = 0; x < W; x++, i += 4) {
      var dx = x - ox, dy = y - oy, q = dx * dx + dy * dy, th = (G.BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      if (q > (R0 + 4) * (R0 + 4)) continue;
      if (q > R0 * R0) { if (th < 0.6) { d[i] = atm[0]; d[i + 1] = atm[1]; d[i + 2] = atm[2]; d[i + 3] = 220; } continue; }
      var nx = dx / R0, ny = dy / R0, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      var depth = (y - (oy - Math.sqrt(Math.max(0, R0 * R0 - dx * dx)))) / hh;
      var lam = clamp(0.96 - depth * 0.72 - nx * 0.85 + nz * 0.12, 0, 1);
      var land = G.fbm(x / 28 + 3, y / 12 + depth * 2, 23) > 0.55;
      var idx = clamp(Math.floor(lam * 4 + (th - 0.5) * 0.85), 0, 3), col = land ? B[idx] : A[idx];
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    cx.putImageData(im, 0, 0); home = c;
  }

  /* ------------------------------------------------------------ backdrop -- */
  function journey() {
    var j = 0;
    for (var i = 0; i < CH.length; i++) { var s = secs[CH[i]]; if (s) j += clamp((sY - s.top) / (i === CH.length - 1 ? Math.max(1, s.h - vh) : s.h), 0, 1); }
    return j;
  }
  function drawBackdrop(J) {
    ctx.fillStyle = PAL.k; ctx.fillRect(0, 0, W, H);
    if (neb.length) {
      var ny = -(((sY / SC) * 0.05 + T * 0.6) % TH), onStage = secs.drift && sY > secs.drift.top - vh;
      var wRed = onStage && J < 2 ? (J < 1.4 ? seg(J, 0.1, 0.7) : 1 - seg(J, 1.5, 1.9)) : 0;
      var wTeal = seg(J, 1.6, 2.0) * (1 - seg(J, 4.0, 4.3));
      ctx.drawImage(neb[0], 0, R(ny)); ctx.drawImage(neb[0], 0, R(ny) + TH);
      if (wRed > 0.01) { ctx.globalAlpha = wRed; ctx.drawImage(neb[1], 0, R(ny)); ctx.drawImage(neb[1], 0, R(ny) + TH); }
      if (wTeal > 0.01) { ctx.globalAlpha = wTeal; ctx.drawImage(neb[2], 0, R(ny)); ctx.drawImage(neb[2], 0, R(ny) + TH); }
      ctx.globalAlpha = 1;
    }
    var par = [0.05, 0.1, 0.2], base = ['d', 'g', 'w'], av = Math.abs(vel) / SC;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], yy = (s.y - (sY / SC) * par[s.l] - T * (0.4 + warp * 90) * (s.l + 1)) % TH; if (yy < 0) yy += TH;
      if (yy >= H) continue;
      if (s.l < 2 && Math.sin(T * 1.7 + s.ph) < -0.82) continue;
      var len = 1 + Math.min(16, R(av * par[s.l] * 7 + warp * 7 * (s.l + 1)));
      ctx.fillStyle = PAL[s.c || base[s.l]]; ctx.fillRect(s.x, R(yy), 1, len);
      if (s.l === 2 && s.c && len === 1) { ctx.fillRect(s.x - 1, R(yy), 3, 1); ctx.fillRect(s.x, R(yy) - 1, 1, 3); }
    }
    var ph = T % 7;
    if (ph < 0.6 && !reduced) {
      var q = Math.floor(T / 7), x0 = G.hash(q, 1, 2) * W, y0 = G.hash(q, 2, 2) * H * 0.5;
      for (var k = 0; k < 7; k++) px(x0 + (ph * 150) - k * 2, y0 + (ph * 70) - k, k < 2 ? 'w' : k < 4 ? 'c' : 'b');
    }
  }

  /* ---------------------------------------------------------- characters -- */
  function drawMag(mx, my, pose, vis, flip) {
    var x0 = R(mx - 9), y0 = R(my - 10), s, hx, hy, dx, dy;
    if (pose === 'bow') {
      G.dissolve(ctx, SPR.magBody, x0, y0 + 12, vis); G.dissolve(ctx, SPR.magHead, x0 + 2, y0 + 3, vis);
      return { x: x0 + 16, y: y0 + 17 };
    }
    if (pose === 'cast') s = flip ? SPR.magCastf : SPR.magCast;
    else s = flip ? SPR.magIdleAf : (((frame >> 4) & 1) ? SPR.magIdleB : SPR.magIdleA);
    G.dissolve(ctx, s, x0, y0, vis);
    if (pose === 'cast') { hx = flip ? x0 + 2 : x0 + 15; hy = y0 + 8; dx = flip ? -1 : 1; dy = -1; }
    else { hx = flip ? x0 + 5 : x0 + 12; hy = y0 + 14; dx = flip ? -1 : 1; dy = 1; }
    var tip = { x: hx + dx * 4, y: hy + dy * 4 };
    if (vis > 0.6) {
      for (var i = 1; i <= 3; i++) px(hx + dx * i, hy + dy * i, 'y');
      px(tip.x, tip.y, 'w');
      if (pose === 'cast') twinkle(tip.x, tip.y);
    }
    return tip;
  }

  /* --------------------------------------------------------------- title -- */
  function drawTitle() {
    var t0 = sY / vh; if (t0 > 1.5 || !home) return;
    ctx.drawImage(home, 0, VH - home.height + 8 + R(t0 * H * 0.5));
    var sx = ((T * 5) % (W + 60)) - 30, sy = H * 0.16 + Math.sin(T * 0.5) * 3 - t0 * H * 0.35;
    spr(SPR.sat, sx, sy); if ((frame >> 4) & 1) px(sx, sy + 2, 'R');
    var lift = t0 * t0 * H * 1.7 + t0 * H * 0.5, low = Math.max(22, VH * 0.13);
    // wide screens: stand right of the title menu, lower by the curve of the planet at that place
    var cx0 = L.wide ? R(W * 0.8) : W / 2, R0 = Math.max(W * 1.1, 260), dx0 = cx0 - W / 2;
    var drop = (R0 - Math.sqrt(Math.max(0, R0 * R0 - dx0 * dx0))) * 0.55;
    var bx = cx0 - 15, by = VH - low + drop - lift + Math.sin(T * 1.6) * 1.5;
    flame(bx, by + 10, 2 + t0 * 12); spr(SPR.ship, bx, by);
    var tip = drawMag(cx0 + 15, by - 2 + Math.sin(T * 1.6 + 1) * 1.5, 'cast', 1, 0);
    if (Math.random() < 0.2) emit(tip.x, tip.y, 1, ['Y', 'w', 'L'], 7, 0.6);
  }

  /* ------------------------------------------------------- the journey --- */
  var BEAM = [[0, 1], [1, 2], [2, 0]];
  function triPoint(u) {
    var i = Math.floor(u) % 3, f = u - Math.floor(u), a = L.P[BEAM[i][0]], b = L.P[BEAM[i][1]], s = surf(a, b, 3), e = surf(b, a, 3);
    return { x: lerp(s.x, e.x, f), y: lerp(s.y, e.y, f) };
  }
  function hubPoint(k, v) {
    var s = surf(L.hub, L.P[k], 2), e = surf(L.P[k], L.hub, 3);
    return { x: lerp(s.x, e.x, v), y: lerp(s.y, e.y, v) };
  }
  function tri(v) { v = ((v % 1) + 1) % 1; return 1 - Math.abs(v * 2 - 1); }
  function beam(a, b, prog, fade) {
    if (prog <= 0) return;
    var s = surf(a, b, 3), e = surf(b, a, 3), ex = lerp(s.x, e.x, prog), ey = lerp(s.y, e.y, prog), off = frame >> 1;
    line(s.x, s.y, ex, ey, function (x, y, i) {
      if (fade > 0 && G.hash(x, y, 4) < fade) return;
      var m = (i - off) % 10; if (m < 0) m += 10;
      ctx.fillStyle = m === 0 ? PAL.w : m < 3 ? PAL.L : (i & 1 ? PAL.G : PAL.B);
      ctx.fillRect(x, y, 1, 1);
    });
    if (prog < 1) twinkle(R(ex), R(ey), 'L');
  }

  function drawJourney(J, dt) {
    var d = secs.drift, v = secs.vanish; if (!d || !v) return;
    var end = v.top + v.h, yo = 0, i, k;
    if (sY < d.top) yo = (d.top - sY) / SC; else if (sY + vh > end) yo = -(sY + vh - end) / SC;
    if (yo > H + 70 || yo < -H - 70) return;
    yo = R(yo);
    ctx.save(); ctx.translate(0, yo);

    var P = L.P, hub = L.hub, VC = L.vc, rest = L.rest;
    var chaos0 = eio(seg(J, 0.12, 0.85)), linked = seg(J, 1.5, 1.86), chaos = chaos0 * (1 - eio(seg(J, 1.55, 1.86)));
    var saw = seg(J, 2.12, 2.3), scat = eout(seg(J, 2.3, 2.55)), built = seg(J, 2.55, 2.95), spokes = seg(J, 2.95, 3.2);
    var autoP = eio(seg(J, 3.2, 3.85)), magIn = seg(J, 1.02, 1.1), move = eio(seg(J, 4.02, 4.25));
    var mag = { x: lerp(L.mag0.x, VC.x, move), y: lerp(L.mag0.y, VC.y, move) + Math.sin(T * 2) * 1.5 };
    function cross(th) { return prevJ < th && J >= th && J - prevJ < 0.4; }

    var spot = seg(J, 4.05, 4.2) * (1 - seg(J, 4.8, 4.97));
    if (spot > 0) {
      var top = -yo, len = VC.y + 12 - top;
      for (var yy = 0; yy < len; yy++) { var hw = lerp(5, 24, yy / len); G.ditherRect(ctx, R(VC.x - hw), top + yy, R(hw * 2), 1, 'p', spot * 0.42); }
      for (k = -3; k <= 3; k++) { var ew = Math.sqrt(1 - (k / 4) * (k / 4)) * 26; G.ditherRect(ctx, R(VC.x - ew), VC.y + 10 + k, R(ew * 2), 1, 'P', spot * 0.5); }
    }

    if (chaos > 0.04) {
      var pts = L.loop.pts, onLen = 1 + R(chaos * 3), off = frame >> 2;
      for (i = 0; i < pts.length; i++) {
        if (i % 5 === 4) continue;
        var a = pts[i], b = pts[i + 1];
        line(a.x, a.y, b.x, b.y, function (x, y, n) { if (((n + off) % 6) < onLen) { ctx.fillStyle = (G.hash(x, y, frame >> 3) < 0.15) ? PAL.R : PAL.r; ctx.fillRect(x, y, 1, 1); } });
      }
    }
    if (linked > 0 && spokes < 1) for (i = 0; i < 3; i++) beam(P[BEAM[i][0]], P[BEAM[i][1]], clamp(linked * 3 - i, 0, 1), spokes);
    if (spokes > 0) for (i = 0; i < 3; i++) beam(hub, P[i], spokes, 0);

    var fl = [];
    for (i = 0; i < 3; i++) fl.push(seg(J, 1.3 + i * 0.07, 1.5 + i * 0.07));
    ring(P[1].x, P[1].y, P[1].r + 10, 4, 'B', -1);
    for (i = 0; i < 3; i++) if (fl[i] >= 1) ring(P[i].x, P[i].y, P[i].r + 6, (P[i].r + 6) * 0.42, 'y', -1);
    for (i = 0; i < 3; i++) {
      if (!reduced && (frame + i * 3) % 9 === 0) G.planet(PS[i], T * PS[i].sp);
      var bob = R(Math.sin(T * 0.8 + i * 2) * 1.2), half = (PS[i].cv.width / 2) | 0;
      ctx.drawImage(PS[i].cv, P[i].x - half, P[i].y - half + bob);
    }
    ring(P[1].x, P[1].y, P[1].r + 10, 4, 'C', 1);
    for (i = 0; i < 3; i++) if (fl[i] >= 1) ring(P[i].x, P[i].y, P[i].r + 6, (P[i].r + 6) * 0.42, 'W', 1);

    // crisp 5x7 planet names with dark pill plates + glowing sync counts
    var q = Math.floor(frame / 22), base = 120 + (J > 3.2 ? Math.floor(T * 0.8) % 60 : 0), hold = J < 1.5 ? chaos0 : 1;
    var dv = [0, -R(hold * (14 + G.hash(q, 1, 5) * 12)), R(hold * (8 + G.hash(q, 2, 5) * 10))];
    var sync = [linked > 0, linked >= 1 / 3, linked >= 2 / 3];
    for (i = 0; i < 3; i++) {
      var ly = i === 2 ? P[i].y + P[i].r + 5 : P[i].y - P[i].r - 21;
      text(G.micro(P[i].name, 'w', true), P[i].x, ly);
      var col = sync[i] ? 'L' : hold > 0.05 ? (((frame >> 4) & 1) ? 'R' : 'O') : 's';
      text(G.big(String(sync[i] ? base : base + dv[i]), col), P[i].x + 1, ly + 10);
    }

    var N = blocks.length, shown = J >= 2.1 ? N : Math.floor(Math.pow(chaos0, 0.8) * N);
    for (i = 0; i < shown; i++) {
      var bl = blocks[i], as = eio(seg(built, bl.d * 0.55, bl.d * 0.55 + 0.45)), up = bl.jy < 0 ? -1 : 1;
      var bx = bl.jx + up * 3 * saw * (1 - scat), by = bl.jy + up * 2 * saw * (1 - scat);
      if (as <= 0 && saw <= 0 && chaos > 0.2 && G.hash(i, frame >> 2, 1) < 0.14 * chaos) bx += G.hash(i, frame >> 2, 2) < 0.5 ? -1 : 1;
      bx = lerp(lerp(bx, bl.sx, scat), bl.tx, as); by = lerp(lerp(by, bl.sy, scat), bl.ty, as);
      var bc = as > 0.6 ? bl.col : bl.jcol; if (as > 0.42 && as < 0.7) bc = 'w';
      var X = R(hub.x + bx), Y = R(hub.y + by);
      ctx.fillStyle = PAL[bc]; ctx.fillRect(X, Y, 3, 3);
      ctx.fillStyle = 'rgba(5,7,15,.42)'; ctx.fillRect(X + 2, Y, 1, 3); ctx.fillRect(X, Y + 2, 2, 1);
    }
    if (built >= 1) {
      var pulse = (frame >> 4) & 1;
      ctx.fillStyle = pulse ? PAL.w : PAL.L; ctx.fillRect(R(hub.x - 1.5), R(hub.y - 16.5), 3, 3);
      ctx.fillStyle = pulse ? PAL.C : PAL.c; ctx.fillRect(R(hub.x - 21), R(hub.y), 2, 2); ctx.fillRect(R(hub.x + 19), R(hub.y), 2, 2);
    }
    if (chaos0 > 0.45 && J < 2.12) text(G.micro('WORKAROUNDS', 'R', true), hub.x, hub.y + 20);
    if (saw > 0 && saw < 1) {
      var cutx = hub.x - 24 + saw * 48;
      ctx.fillStyle = PAL.w; ctx.fillRect(R(hub.x - 24), hub.y, R(cutx - hub.x + 24), 1);
      twinkle(R(cutx), hub.y); if (Math.random() < 0.5) emit(cutx, hub.y + yo, 1, ['Y', 'w'], 10, 0.4);
    }

    var nShow = J < 1.5 ? 4 + chaos0 * 8 : 12;
    for (i = 0; i < 12; i++) {
      if (i >= nShow) continue;
      var c = crates[i], w1 = eio(seg(J, 1.6 + (i % 4) * 0.03, 1.9)), w2 = eio(seg(J, 2.98, 3.25));
      var cx = L.sx + Math.cos(T * c.f1 + c.p1) * (L.hw - 16) * c.a * 0.8, cy = L.sy + Math.sin(T * c.f2 + c.p2) * 62 * L.kv * c.b;
      var tp = triPoint((i / 12 * 3 + T * 0.1) % 3), hp = hubPoint(i % 3, tri(i / 12 * 2.7 + T * (0.16 + autoP * 0.14)));
      var x = lerp(lerp(cx, tp.x, w1), hp.x, w2), y = lerp(lerp(cy, tp.y, w1), hp.y, w2);
      spr(w1 > 0.5 ? SPR.crate : (c.lost && chaos > 0.5 && ((frame >> 3) & 1) ? SPR.crateR : SPR.crateO), x, y);
      if (c.lost && chaos > 0.75 && w1 <= 0 && i % 2 === 0 && ((frame >> 5) + i) % 3 === 0) text(G.micro('LOST?', 'R', true), x, y - 13);
    }

    for (i = 0; i < 5; i++) {
      var g = ghosts[i], ap = seg(chaos0, 0.15 + i * 0.15, 0.25 + i * 0.15), jz = 1.56 + i * 0.06, out = seg(J, jz, jz + 0.05);
      if (ap <= 0 || out >= 1) continue;
      var gx = L.sx + Math.cos(T * g.f1 + g.p1) * (L.hw - 26) * 0.75, gy = L.sy + Math.sin(T * g.f2 + g.p2) * 52 * L.kv + Math.sin(T * 5 + i);
      sprD((((frame >> 3) + i) & 1) ? SPR.sheetA : SPR.sheetB, gx, gy, ap * (1 - out));
      if (cross(jz)) { emit(gx, gy + yo, 12, ['w', 'R', 'Y'], 22, 0.5); sfx('hit'); }
    }

    runS += dt * (12 + chaos * 34);
    var rw = eio(seg(J, 1.62, 1.82)), rp = along(L.loop, runS), rn = along(L.loop, runS + 2);
    if (rw < 1) {
      var rx = lerp(rp.x, rest.x, rw), ry = lerp(rp.y, rest.y, rw) - 4, left = rn.x < rp.x, f2 = (Math.floor(runS / 3) & 1);
      spr(left ? (f2 ? SPR.runAf : SPR.runBf) : (f2 ? SPR.runA : SPR.runB), rx, ry);
      if (rw < 0.5) {
        var bobp = f2 ? 0 : 1, sxp = R(rx) - 5, syp = R(ry) - 15 + bobp;
        ctx.fillStyle = PAL.w; ctx.fillRect(sxp, syp, 10, 7);
        ctx.fillStyle = PAL.l; ctx.fillRect(sxp, syp, 10, 2);
        ctx.fillStyle = PAL.g; ctx.fillRect(sxp + 3, syp + 2, 1, 5); ctx.fillRect(sxp + 6, syp + 2, 1, 5); ctx.fillRect(sxp, syp + 4, 10, 1);
        px(rx - 4, ry - 8 + bobp, 's'); px(rx + 4, ry - 8 + bobp, 's');
      }
      if (chaos > 0.6 && ((frame >> 3) & 1)) { px(rx + 6, ry - 5 + ((frame >> 2) % 4), 'c'); px(rx - 6, ry - 3 + ((frame >> 2) % 3), 'c'); }
    } else {
      spr(SPR.runSit, rest.x, rest.y - 1);
    }
    var hatT = seg(J, 4.6, 4.9);
    if (hatT >= 1) {
      spr(SPR.hat, rest.x, rest.y - 10);
      if (J > 4.92) { spr(SPR.pad, rest.x, rest.y + 5); if ((frame >> 4) & 1) { text(G.micro('P1', 'L', true), rest.x, rest.y - 24); px(rest.x, rest.y - 15, 'L'); px(rest.x - 1, rest.y - 16, 'L'); px(rest.x + 1, rest.y - 16, 'L'); } }
    }

    var dr = seg(J, 3.1, 3.2);
    if (dr > 0) for (i = 0; i < 3; i++) {
      var da = T * (0.9 + i * 0.2) + i * 2.1, ddx = hub.x + Math.cos(da) * (32 + i * 7), ddy = hub.y + Math.sin(da) * (14 + i * 4);
      sprD(SPR.drone, ddx, ddy, dr);
    }

    var arr = eout(seg(J, 0.9, 1.04)), dep = seg(J, 4.72, 4.96);
    if (arr > 0 && dep < 1) {
      var shy = lerp(H + 30 - Math.min(0, yo), L.mag0.y + 26, arr) - dep * dep * (H + 90) + Math.sin(T * 1.6);
      flame(L.mag0.x, shy + 10, 2 + (1 - arr) * 9 + dep * 14); spr(SPR.ship, L.mag0.x, shy);
    }

    var tip = null;
    if (magIn > 0 && J < 4.66) {
      var vis = magIn * (1 - seg(J, 4.6, 4.65)), pose = 'idle', flip = 0;
      if ((J > 1.14 && J < 1.9) || (J > 2.1 && J < 2.95) || (J > 3.08 && J < 4.0)) pose = 'cast';
      if (J >= 4.36 && J < 4.5) pose = 'bow';
      if (J >= 4.5 && J < 4.6) { pose = 'cast'; flip = (frame >> 2) & 1; }
      tip = drawMag(mag.x, mag.y, pose, vis, flip);
      if (pose === 'cast' && vis >= 1 && Math.random() < 0.3) emit(tip.x, tip.y + yo, 1, ['Y', 'w', 'L'], 8, 0.5);
    }
    if (tip && J > 1.14) for (i = 0; i < 3; i++) {
      if (fl[i] >= 1) continue;
      if (fl[i] <= 0) { var ja = T * 4 + i * 2.09; ring(tip.x + Math.cos(ja) * 7, tip.y - 9 + Math.sin(ja) * 4, 3, 3, 'Y', 0); }
      else {
        var e = eio(fl[i]), rr = lerp(3, P[i].r + 6, e);
        ring(lerp(tip.x, P[i].x, e), lerp(tip.y - 9, P[i].y, e) - Math.sin(e * Math.PI) * 18, rr, rr * lerp(1, 0.42, e), 'Y', 0);
      }
    }
    var lev = seg(J, 3.08, 3.2) * (1 - seg(J, 3.94, 4.02));
    if (tip && lev > 0) for (i = 0; i < 3; i++) {
      var la = T * 1.6 + i * 2.09, lx = tip.x + 3 + Math.cos(la) * 10, lyy = tip.y - 17 + Math.sin(la) * 4 + Math.sin(T * 2.2) * 2;
      sprD(SPR.crate, lx, lyy, lev); if (((frame >> 2) + i) % 3 === 0) px(lx, lyy + 7, 'Y');
    }

    var pf = seg(J, 4.6, 4.8);
    if (pf > 0 && pf < 1) for (k = 0; k < 6; k++) { var pa = k * 1.05 + 0.4, prr = 3 + pf * 17; puff(VC.x + Math.cos(pa) * prr, VC.y + Math.sin(pa) * prr * 0.6 - pf * 7, 5 + pf * 3, 1 - pf); }
    if (J >= 4.6 && J < 4.76) text(G.big('POOF!', 'Y'), VC.x, VC.y - 30 - pf * 12);
    if (J >= 4.6 && hatT < 1) spr(SPR.hat, lerp(VC.x, rest.x, eio(hatT)) + Math.sin(hatT * 9) * 3, lerp(VC.y - 9, rest.y - 9, hatT) - Math.sin(hatT * Math.PI) * 16);
    var cardT = seg(J, 4.6, 5);
    if (J >= 4.6 && cardT < 1) {
      var cf = (frame >> 3) % 4, cxp = VC.x + 16 + Math.sin(cardT * 14) * 9, cyp = VC.y - 6 - cardT * (VC.y + yo + 40);
      spr(cf === 0 ? SPR.cardFace : cf === 2 ? SPR.cardBack : SPR.cardEdge, cxp, cyp);
      if (Math.random() < 0.3) emit(cxp, cyp + 6 + yo, 1, ['L', 'w'], 5, 0.5);
    }

    var st, sc, n;
    if (J < 0.12) { st = 'INVENTORY: IN SYNC'; sc = 's'; }
    else if (linked < 1) { st = 'INVENTORY: OUT OF SYNC'; sc = ((frame >> 4) & 1) ? 'R' : 'O'; }
    else if (J < 2.12) { st = 'THREE SYSTEMS. ONE COUNT.'; sc = 'L'; }
    else if (built < 1) { st = 'REBUILDING THE BACKEND'; sc = 'Y'; }
    else if (J < 3.2) { st = 'ONE LAYER: ONLINE'; sc = 'L'; }
    else if (J < 4.02) { n = R(99 * (1 - autoP)); st = 'MANUAL TASKS: ' + (n < 10 ? '0' : '') + n; sc = n ? 'O' : 'L'; }
    else if (J < 4.6) { st = 'NOW YOU SEE US...'; sc = 'M'; }
    else if (J < 4.9) { st = "NOW YOU DON'T."; sc = 'w'; }
    else { st = 'YOU HAVE THE CONTROLS'; sc = 'L'; }
    var stc = (st.length * 8 <= L.hw * 2 - 12) ? G.big(st, sc) : G.micro(st, sc, true);
    text(stc, L.sx, Math.max(18, P[0].y - P[0].r - 36));

    if (cross(1.02)) { emit(L.mag0.x, L.mag0.y + yo, 26, ['Y', 'w', 'M', 'L'], 30, 0.8); sfx('magic'); }
    if (cross(1.86)) { for (i = 0; i < 3; i++) emit(P[i].x, P[i].y + yo, 14, ['L', 'w', 'Y'], 28, 0.7); sfx('coin'); }
    if (cross(2.3)) { emit(hub.x, hub.y + yo, 20, ['R', 'g', 'w'], 34, 0.6); sfx('boom'); }
    if (cross(2.95)) { emit(hub.x, hub.y + yo, 30, ['L', 'w', 'c'], 36, 0.9); sfx('power'); }
    if (cross(3.85)) { emit(hub.x, hub.y - 20 + yo, 20, ['L', 'Y', 'w'], 30, 0.8); sfx('coin'); }
    if (cross(4.6)) { emit(VC.x, VC.y + yo, 40, ['w', 's', 'M', 'Y'], 40, 0.9); sfx('poof'); }
    if (cross(4.9)) { emit(rest.x, rest.y - 8 + yo, 18, ['L', 'Y', 'w'], 26, 0.8); sfx('levelup'); }
    ctx.restore();
  }

  /* --------------------------------------------------- deep space, finale -- */
  function drawDeep() {
    for (var i = 0; i < deco.length; i++) {
      var o = deco[i], s = secs[o.id]; if (!s) continue;
      var y = H / 2 + ((s.top + o.fy * s.h) - (sY + vh / 2)) / SC * o.par, x = R(o.fx * W);
      if (y < -80 || y > H + 80) continue;
      y = R(y);
      if (o.spec) {
        if (!reduced && (frame + i * 4) % 10 === 0) G.planet(o.spec, T * o.sp);
        if (o.ring) { ring(x, y, o.spec.r + 12, 5, 'p', -1); ring(x, y, o.spec.r + 8, 3, 'p', -1); }
        var half = (o.spec.cv.width / 2) | 0;
        ctx.drawImage(o.spec.cv, x - half, y - half);
        if (o.ring) { ring(x, y, o.spec.r + 12, 5, o.ring, 1); ring(x, y, o.spec.r + 8, 3, 'M', 1); }
      } else {
        for (var k = 0; k < 8; k++) spr(SPR.rock, x + (G.hash(k, i, 8) - 0.3) * 70 + Math.sin(T * 0.3 + k) * 3, y + (G.hash(k, i, 9) - 0.5) * 90 + Math.cos(T * 0.25 + k * 2) * 3);
      }
    }
    var v = secs.vanish, ms = secs.mission;
    if (v && sY > v.top + v.h - vh * 0.15 && !reduced && !(ms && sY + vh > ms.top + ms.h * 0.5)) {
      var ph = (T % 17) / 17;
      if (ph < 0.55) {
        var q = Math.floor(T / 17), cy = H * (0.2 + G.hash(q, 3, 3) * 0.6), cx = -50 + ph / 0.55 * (W + 190);
        for (var n = 0; n < 3; n++) {
          var sx = cx - n * 42, sy2 = cy + Math.sin(T * 2 + n) * 1.5;
          spr(SPR.crate, sx - 26, sy2); spr(SPR.crate, sx - 16, sy2);
          for (var j = 0; j < 3 + ((frame >> 1) & 1); j++) px(sx - 10 - j, sy2 + (j & 1 ? 1 : -1), j < 2 ? 'Y' : 'O');
          spr(SPR.shipR, sx, sy2);
        }
      }
    }
  }
  function drawFinale() {
    var m = secs.mission; if (!m || !home) return;
    var off = (m.top + m.h - (sY + vh)) / SC; if (off > H * 1.6) return;
    var hy = VH - home.height + 6 + R(Math.max(0, off) * 0.5);
    ctx.drawImage(home, 0, hy);
    var bx = R(W * (L.wide ? 0.84 : 0.78)), by = hy - 10 + Math.min(0, off) + Math.sin(T * 1.6) * 1.5;
    if (by < -40) return;
    flame(bx, by + 10, 2); spr(SPR.ship, bx, by);
    var tip = drawMag(bx - 22, by - 3 + Math.sin(T * 1.6 + 1) * 1.5, 'cast', 1, 1);
    if (Math.random() < 0.2) emit(tip.x, tip.y, 1, ['Y', 'w', 'L'], 7, 0.6);
    if ((frame >> 5) & 1) text(G.micro('NEXT MISSION: YOURS', 'L', true), bx - 12, by - 28);
  }

  /* ---------------------------------------------------------------- loop -- */
  function render(dt) {
    var J = curJ = journey();
    drawBackdrop(J);
    drawTitle();
    drawDeep();
    drawJourney(J, dt);
    drawFinale();
    drawParts(dt);
    if (!reduced && Math.floor(J) !== Math.floor(prevJ) && Math.abs(J - prevJ) < 0.4 && J > 0.001 && J < 4.999) { flash = 1; flashCol = FLASH[Math.max(Math.floor(J), Math.floor(prevJ))] || 'L'; }
    if (flash > 0) {
      var band = R(H * 0.34), fy = R((1 - flash) * (H + band)) - band;
      for (var fi = 0; fi < band; fi += 4) G.ditherRect(ctx, 0, fy + fi, W, 4, flashCol, (1 - Math.abs(fi / band * 2 - 1)) * 0.75);
      flash = Math.max(0, flash - dt * 2.4);
    }
    prevJ = J;
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) { lastNow = now; return; }
    if (!ready) { measure(); if (!ready) { lastNow = now; return; } }
    var dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016); lastNow = now;
    T += dt; frame++;
    if (warp > 0) warp = Math.max(0, warp - dt * 0.18);
    var ty = window.scrollY || 0, prev = sY;
    sY += (ty - sY) * 0.16; if (Math.abs(ty - sY) < 0.4) sY = ty;
    vel = vel * 0.8 + (sY - prev) * 0.2;
    render(dt);
    for (var i = 0; i < cbs.length; i++) cbs[i](dt, sY);
  }
  function still() { if (!ready) { measure(); if (!ready) return; } sY = window.scrollY || 0; vel = 0; T = 1; frame = 1; render(0); for (var i = 0; i < cbs.length; i++) cbs[i](0, sY); }

  var rz = 0;
  function onResize() {
    clearTimeout(rz);
    rz = setTimeout(function () {
      if (ready && window.innerWidth === vw && window.innerHeight <= H * SC && Math.abs(window.innerHeight - vh) < 140) { vh = window.innerHeight; VH = Math.ceil(vh / SC); measureSecs(); }
      else measure();
      if (reduced) still();
    }, 120);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('load', function () { measure(); if (reduced) still(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); if (reduced) still(); });

  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var x = e.clientX / SC, y = e.clientY / SC, dd = Math.abs(x - mouse.x) + Math.abs(y - mouse.y);
      mouse.x = x; mouse.y = y;
      if (dd > 1.2 && parts.length < 320) emit(x + 1, y + 1, 1, ['Y', 'w', 'L'], 5, 0.5);
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) { emit(e.clientX / SC, e.clientY / SC, 10, ['Y', 'w', 'L', 'M'], 26, 0.6); }, { passive: true });
    try {
      var cur = G.scaleUp(G.flipH(SPR.wand), 3).toDataURL();
      document.documentElement.style.cursor = 'url(' + cur + ') 3 3, auto';
    } catch (e) { /* cosmetic */ }
  } else {
    window.addEventListener('scroll', still, { passive: true });
  }

  measure();
  if (reduced) still(); else requestAnimationFrame(function (n) { lastNow = n; requestAnimationFrame(tick); });

  ACE.world = {
    measure: measure,
    onFrame: function (fn) { cbs.push(fn); },
    journey: function () { return curJ; },
    burst: function (cx, cy, n, cols) { emit(cx / SC, cy / SC, n || 16, cols || ['Y', 'w', 'L'], 30, 0.8); },
    warp: function () { warp = 1; },
    secs: function () { return secs; },
    scale: function () { return SC; },
    reduced: reduced
  };
})();
