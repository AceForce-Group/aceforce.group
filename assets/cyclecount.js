// Cycle count: everything on screen falls into a pile, then a forklift restocks it.
// Trigger: the "Run a cycle count" link in the footer, or ?cyclecount in the URL.
(function () {
  var running = false;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function audio() { try { var C = window.AudioContext || window.webkitAudioContext; return C ? new C() : null; } catch (e) { return null; } }
  var ac = null;
  function thud(vol) { // a short low knock for each item that lands
    if (!ac) return; var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(140 + Math.random() * 60, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.16);
  }
  function beep(t) { // forklift reversing beeper
    if (!ac) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 1050;
    g.gain.setValueAtTime(0.05, t); g.gain.setValueAtTime(0, t + 0.28); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.3);
  }
  function ding() {
    if (!ac) return; var t = ac.currentTime;
    [880, 1320].forEach(function (f, i) { var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f;
      g.gain.setValueAtTime(0.07, t + i * 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5); o.connect(g); g.connect(ac.destination); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.55); });
  }

  function pickItems() {
    var sel = 'header .brand, header nav a, h1, h2, h3, h4, p, li, img, video, .btn, button, figure, blockquote, label, input, textarea, footer a, footer p, footer .theme-play';
    var vh = innerHeight, vw = innerWidth, out = [];
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.closest('[data-cc-skip]')) return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 6 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
      if (r.width > vw * 0.95 && r.height > vh * 0.6) return; // skip full-screen backdrops
      var cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'inline' && !el.matches('a,img')) return;
      for (var i = 0; i < out.length; i++) if (out[i].el.contains(el) || el.contains(out[i].el)) return; // keep the outermost
      out.push({ el: el, r: r });
    });
    return out.slice(0, 60);
  }

  function run() {
    if (running) return; running = true;
    if (!ac) ac = audio(); if (ac && ac.state === 'suspended') ac.resume();
    var items = pickItems(), vh = innerHeight, vw = innerWidth, floor = vh - 8;
    var col = new Array(Math.ceil(vw / 8) + 2).fill(floor); // pile height map, 8px columns
    items.forEach(function (it, i) {
      it.prev = { t: it.el.style.transform, tr: it.el.style.transition, z: it.el.style.zIndex, p: it.el.style.position, wc: it.el.style.willChange };
      if (getComputedStyle(it.el).position === 'static') it.el.style.position = 'relative';
      it.el.style.willChange = 'transform'; it.el.style.zIndex = 900 + i;
      it.x = 0; it.y = 0; it.vy = 0; it.rot = 0; it.vr = (Math.random() - 0.5) * 6; it.delay = Math.random() * 450 + (it.r.top / vh) * 250;
      it.drift = (Math.random() - 0.5) * 1.6; it.landed = false;
    });
    // order the landing by height so lower items land first and the pile stacks naturally
    var t0 = performance.now(), landedCount = 0;
    function fall(now) {
      var dt = 16;
      items.forEach(function (it) {
        if (it.landed || now - t0 < it.delay) return;
        it.vy += 0.9; it.y += it.vy; it.x += it.drift; it.rot += it.vr;
        var left = it.r.left + it.x, w = it.r.width, c0 = Math.max(0, Math.floor(left / 8)), c1 = Math.min(col.length - 1, Math.floor((left + w) / 8));
        var top = floor; for (var c = c0; c <= c1; c++) top = Math.min(top, col[c]);
        var h = Math.min(it.r.height, 60) * 0.4 + 4;
        if (it.r.bottom + it.y >= top) {
          it.y = top - it.r.bottom; it.landed = true; landedCount++;
          it.rot = Math.max(-28, Math.min(28, it.rot)); for (var k = c0; k <= c1; k++) col[k] = top - h;
          thud(0.12);
        }
        it.el.style.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px) rotate(' + it.rot.toFixed(1) + 'deg)';
      });
      if (landedCount < items.length) requestAnimationFrame(fall); else setTimeout(restock, 700);
    }
    requestAnimationFrame(fall);

    function restock() {
      var fl = document.createElement('img'); fl.src = '/assets/img/forklift.gif'; fl.alt = '';
      fl.style.cssText = 'position:fixed;left:0;bottom:4px;width:104px;height:76px;z-index:2000;image-rendering:pixelated;pointer-events:none;transform:translateX(-120px)';
      document.body.appendChild(fl);
      var badge = document.createElement('div');
      badge.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2001;background:#05070f;color:#c1fd5d;font:600 13px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.06em;padding:10px 16px;border:1px solid #c1fd5d;pointer-events:none;text-transform:uppercase';
      document.body.appendChild(badge);
      var queue = items.slice().sort(function (a, b) { return (a.r.left + a.x) - (b.r.left + b.x); }), done = 0, total = items.length;
      badge.textContent = 'Cycle count in progress: 0 / ' + total;
      var fx = -120, speed = reduced ? 40 : 7, bt = ac ? ac.currentTime : 0;
      function drive() {
        fx += speed; fl.style.transform = 'translateX(' + fx + 'px)';
        if (ac && ac.currentTime > bt) { beep(ac.currentTime); bt = ac.currentTime + 0.6; }
        while (queue.length && queue[0].r.left + queue[0].x < fx + 90) {
          var it = queue.shift(); done++;
          it.el.style.transition = 'transform .7s cubic-bezier(.3,1.4,.5,1)';
          it.el.style.transform = 'translate(0,0) rotate(0)';
          badge.textContent = 'Cycle count in progress: ' + done + ' / ' + total;
        }
        if (fx < vw + 20 || queue.length) requestAnimationFrame(drive); else finish();
      }
      requestAnimationFrame(drive);
      function finish() {
        fl.remove(); ding();
        badge.textContent = 'Cycle count complete: ' + total + ' / ' + total + ' on hand. Variance: 0.';
        setTimeout(function () {
          items.forEach(function (it) { var p = it.prev; it.el.style.transform = p.t; it.el.style.transition = p.tr; it.el.style.zIndex = p.z; it.el.style.position = p.p; it.el.style.willChange = p.wc; });
          badge.style.transition = 'opacity .6s'; badge.style.opacity = '0'; setTimeout(function () { badge.remove(); running = false; }, 700);
        }, 2600);
      }
    }
  }

  window.aceCycleCount = run;
  var link = document.getElementById('cycleCount');
  if (link) link.addEventListener('click', function (e) { e.preventDefault(); run(); });
  if (/[?&]cyclecount\b/.test(location.search)) setTimeout(run, 900);
})();
