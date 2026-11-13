/* ACEFORCE ARCADE — ui.js (v2)
   Instant non-blocking entry (optional ?gate=1), HUD & hero audio sync,
   score & achievements, card flip + deal-all, Versus mode, interactive
   AceForce leadership player roster + dossier, workflow CTA picker,
   copy-email toast, hidden aces, and Konami warp cheat. */
(function () {
  'use strict';
  var ACE = window.ACE, G = ACE.gfx, SPR = G.SPR;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var qs = location.search;
  function sfx(n) { if (ACE.sfx) ACE.sfx.play(n); }

  /* --------------------------------------------------------------- toasts -- */
  var toasts = $('#toasts');
  function toast(title, sub, gold) {
    if (!toasts) return;
    var t = document.createElement('div'); t.className = 'toast' + (gold ? ' gold' : '');
    t.textContent = title;
    if (sub) { var s = document.createElement('small'); s.textContent = sub; t.appendChild(s); }
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.removeChild(toasts.firstChild);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3400);
  }

  /* ------------------------------------------------------- points labels -- */
  function pop(el, txt, gold) {
    if (reduced || !el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect(), p = document.createElement('span');
    p.className = 'pts' + (gold ? ' gold' : ''); p.textContent = txt; p.setAttribute('aria-hidden', 'true');
    p.style.left = Math.round(r.left + r.width / 2) + 'px'; p.style.top = Math.round(r.top + Math.min(r.height / 2, 70)) + 'px';
    document.body.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 950);
  }

  /* ---------------------------------------------------------------- score -- */
  var scoreEl = $('#score'), scoreBox = $('.hud-score'), score = 0, shown = 0, scoreRaf = 0;
  function pad6(n) { n = String(n); while (n.length < 6) n = '0' + n; return n; }
  function scoreStep() {
    if (shown < score) { shown += Math.max(10, Math.ceil((score - shown) / 7 / 10) * 10); if (shown > score) shown = score; scoreEl.textContent = pad6(shown); scoreRaf = requestAnimationFrame(scoreStep); }
    else scoreRaf = 0;
  }
  function addScore(n) {
    score += n; if (!scoreEl) return;
    if (reduced) { shown = score; scoreEl.textContent = pad6(score); return; }
    if (scoreBox) { scoreBox.classList.remove('bump'); void scoreBox.offsetWidth; scoreBox.classList.add('bump'); }
    if (!scoreRaf) scoreRaf = requestAnimationFrame(scoreStep);
  }

  /* --------------------------------------------------------- text effects -- */
  function typeOut(el, speed, onDone) {
    var full = el.textContent;
    if (reduced || el.dataset.typed) { if (onDone) onDone(); return function () {}; }
    el.dataset.typed = '1'; el.setAttribute('aria-label', full);
    var a = document.createElement('span'), b = document.createElement('span'); b.className = 'typed-rest'; a.className = 'typed-caret';
    a.setAttribute('aria-hidden', 'true'); b.setAttribute('aria-hidden', 'true');
    el.textContent = ''; el.appendChild(a); el.appendChild(b); b.textContent = full;
    var i = 0, timer = setInterval(function () {
      i += 2; if (i > full.length) i = full.length;
      a.textContent = full.slice(0, i); b.textContent = full.slice(i);
      if (full[i - 1] !== ' ') sfx('type');
      if (i >= full.length) finish();
    }, speed || 22);
    function finish() { clearInterval(timer); el.textContent = full; el.removeAttribute('aria-label'); if (onDone) onDone(); }
    return finish;
  }
  var GLYPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?';
  function decode(el) {
    if (reduced || el.dataset.decoded) return;
    el.dataset.decoded = '1';
    var full = el.textContent, n = 0, total = 12; el.setAttribute('aria-label', full);
    var timer = setInterval(function () {
      n++; var keep = Math.floor(full.length * n / total), out = '';
      for (var i = 0; i < full.length; i++) out += (i < keep || full[i] === ' ') ? full[i] : GLYPH[(Math.random() * GLYPH.length) | 0];
      el.textContent = out;
      if (n >= total) { clearInterval(timer); el.textContent = full; el.removeAttribute('aria-label'); }
    }, 38);
  }

  /* -------------------------------------------------------------- reveals -- */
  function onReveal(el) {
    el.classList.add('in');
    $$('[data-type]', el).forEach(function (h, i) { setTimeout(function () { typeOut(h, 20); }, 180 + i * 150); });
    if (el.hasAttribute('data-decode')) decode(el);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); onReveal(e.target); } });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io2.unobserve(e.target); decode(e.target); } });
    }, { threshold: 0.55 });
    $$('.lc-name[data-decode]').forEach(function (el) { io2.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ------------------------------------------------------------ portraits -- */
  $$('canvas[data-portrait]').forEach(function (c) {
    c.width = 32; c.height = 32;
    var x = c.getContext('2d'); x.clearRect(0, 0, 32, 32);
    x.drawImage(c.dataset.portrait === 'ace' ? SPR.portraitAce : SPR.portraitSuit, 0, 0);
  });
  $$('canvas[data-avatar]').forEach(function (c) { G.avatar(c, c.dataset.avatar); });
  var hat = $('#hat');
  if (hat) hat.style.backgroundImage = 'url(' + G.scaleUp(SPR.hat, 4).toDataURL() + ')';

  /* ------------------------------------- interactive leadership roster ----- */
  var TEAM = [
    {
      name: 'Vlad Shenderovich, MS',
      avatar: 'Vlad Shenderovich',
      role: 'Founder',
      bio: 'Vlad started in the Chanel mailroom and worked his way into retail operations, then built his career in operations and supply chain on the brand side. AceForce brings that client-side experience into every brand it supports, and half of the team comes from his Chanel years.',
      meta: [['Formerly', 'Chanel · Elemis · Versed Skincare']],
      link: ['Read the founder file', 'https://aceforce.group/founder/']
    },
    {
      name: 'Susan Lee',
      avatar: 'Susan Lee',
      role: 'Managing Principal, Commercial Strategy & Operations',
      bio: 'Twenty years of commercial strategy in beauty and consumer goods. At Revlon she led customer strategy for CVS and Rite Aid across a $155M portfolio and delivered 23% growth at Ulta after a four-year decline. At Chanel she led the launch of the brand\'s first US freestanding beauty boutique.',
      meta: [['Formerly', 'Revlon · Chanel · Coty'], ['Education', 'The Wharton School']]
    },
    {
      name: 'Josh Levine',
      avatar: 'Josh Levine',
      role: 'Head of Operations & Process Innovation',
      bio: 'Josh built retail operations for brands in growth mode: the first US fragrance and beauty boutiques at Chanel, store operations at Casper, digital transformation at SMCP, and project management at Michael Kors. He brings that process discipline to every client operation.',
      meta: [['Formerly', 'Chanel · Casper · SMCP · Michael Kors']]
    },
    {
      name: 'Ilya Smolensky',
      avatar: 'Ilya Smolensky',
      role: 'Head of Technology & Implementations',
      bio: 'Ilya leads technology and implementations at AceForce. He built the WMS, ERP tooling and app store that AceForce clients run on today, and he runs the integrations across NetSuite, Cin7, Shopify, 3PL systems and EDI. He came to engineering from accounting, so the systems he builds are designed around the books as well as the warehouse.',
      meta: [['Systems', 'NetSuite · Cin7 · Shopify · 3PL WMS · EDI']]
    },
    {
      name: 'Stephanie Taxel',
      avatar: 'Stephanie Taxel',
      role: 'Senior Director of Marketing & Business Development',
      bio: 'Stephanie builds brand campaigns for AceForce\'s CPG clients through social storytelling and digital marketing. At Gucci she ran retail, partner and event marketing, including a $10M wholesale marketing and events budget, after six years in client engagement and events at Chanel.',
      meta: [['Formerly', 'Gucci · Chanel · Jetblack (Walmart)'], ['Education', 'University of Michigan']]
    }
  ];

  var playerBtns = $$('.player-card'), pSeen = { 0: 1 }, pIdx = 0;
  var dosPortrait = $('#dos-portrait'), dosName = $('#dos-name'), dosBadge = $('#dos-badge'), dosRole = $('#dos-role'), dosBio = $('#dos-bio'), dosMeta = $('#dos-meta');

  function selectPlayer(idx, quiet, focusBtn) {
    pIdx = (idx + TEAM.length) % TEAM.length;
    var p = TEAM[pIdx];
    playerBtns.forEach(function (btn, k) {
      var on = k === pIdx;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
      var slot = $('.player-slot', btn);
      if (slot) slot.textContent = 'P' + (k + 1) + (on ? ' · Selected' : '');
      if (on && focusBtn) btn.focus();
    });
    if (dosPortrait) G.avatar(dosPortrait, p.avatar);
    if (dosName) dosName.textContent = p.name;
    if (dosBadge) dosBadge.textContent = 'Player 0' + (pIdx + 1) + ' / 0' + TEAM.length;
    if (dosRole) dosRole.textContent = p.role;
    if (dosBio) dosBio.textContent = p.bio;
    if (dosMeta) {
      dosMeta.textContent = '';
      p.meta.forEach(function (pair) {
        var sp = document.createElement('span'), b = document.createElement('b');
        b.textContent = pair[0];
        sp.appendChild(b);
        sp.appendChild(document.createTextNode(' ' + pair[1]));
        dosMeta.appendChild(sp);
      });
      if (p.link) {
        var la = document.createElement('a'); la.className = 'dos-link'; la.href = p.link[1]; la.target = '_blank'; la.rel = 'noopener';
        la.textContent = '▶ ' + p.link[0]; dosMeta.appendChild(la);
      }
    }
    if (!quiet) {
      sfx('select');
      if (!pSeen[pIdx]) { pSeen[pIdx] = 1; addScore(100); pop(playerBtns[pIdx], '+100'); }
    }
  }
  playerBtns.forEach(function (btn, k) {
    btn.addEventListener('click', function () { selectPlayer(k, false, false); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectPlayer(pIdx + 1, false, true); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectPlayer(pIdx - 1, false, true); }
    });
  });
  var dosPrev = $('#dos-prev'), dosNext = $('#dos-next');
  if (dosPrev) dosPrev.addEventListener('click', function () { selectPlayer(pIdx - 1, false, false); });
  if (dosNext) dosNext.addEventListener('click', function () { selectPlayer(pIdx + 1, false, false); });
  if (playerBtns.length) selectPlayer(0, true, false);

  /* ---------------------------------------------------- levels, hud, route -- */
  var sections = $$('main > section'), levels = $('#levels'), route = $('#route'), ship = $('#route-ship');
  var hudWorld = $('#hud-world'), hudName = $('#hud-name'), current = -1, visited = {}, nodes = [], dots = [];
  sections.forEach(function (s) {
    if (levels) {
      var a = document.createElement('a'); a.href = '#' + s.id;
      var sp = document.createElement('span'); sp.textContent = s.dataset.world + ' ' + s.dataset.name; a.appendChild(sp);
      a.setAttribute('aria-label', 'World ' + s.dataset.world + ', ' + s.dataset.name);
      levels.appendChild(a); dots.push(a);
    }
    if (route) { var n = document.createElement('i'); n.className = 'node'; route.insertBefore(n, ship); nodes.push(n); }
  });
  if (ship) ship.style.backgroundImage = 'url(' + G.scaleUp(SPR.shipR, 2).toDataURL() + ')';

  function layoutRoute() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), sy = window.scrollY || 0;
    sections.forEach(function (s, i) {
      if (!nodes[i]) return;
      var top = s.getBoundingClientRect().top + sy;
      nodes[i].style.left = 'calc(' + (Math.min(1, top / max) * 100).toFixed(2) + '% - 5px)';
      nodes[i]._at = top / max;
    });
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(track); } }
  function track() {
    ticking = false;
    var vh = window.innerHeight, sy = window.scrollY || 0, idx = 0, i;
    for (i = 0; i < sections.length; i++) if (sections[i].getBoundingClientRect().top <= vh * 0.5) idx = i;
    var max = Math.max(1, document.documentElement.scrollHeight - vh), p = Math.min(1, sy / max);
    if (ship) ship.style.left = (Math.round(p * 250) / 2.5) + '%';
    for (i = 0; i < nodes.length; i++) nodes[i].classList.toggle('done', (nodes[i]._at || 0) <= p + 0.002);
    if (idx !== current) {
      current = idx; var s = sections[idx];
      if (hudWorld) hudWorld.textContent = 'WORLD ' + s.dataset.world;
      if (hudName) hudName.textContent = s.dataset.name;
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); d.classList.toggle('done', k < idx); if (k === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (!visited[idx] && body.classList.contains('live')) { visited[idx] = 1; if (idx > 0) { addScore(500); sfx('levelup'); } }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layoutRoute(); onScroll(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return;
    var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault(); sfx('select');
    window.scrollTo({ top: t.getBoundingClientRect().top + (window.scrollY || 0), behavior: reduced ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + t.id);
  });

  var tls = $$('.title-h .tl'), lastStep = -1;
  if (tls.length && ACE.world && !reduced) ACE.world.onFrame(function (dt, sy) {
    var t = Math.min(1, sy / (window.innerHeight * 0.9)), step = Math.round(t * 40);
    if (step === lastStep) return; lastStep = step;
    tls.forEach(function (el, i) {
      el.style.transform = step ? 'translateX(' + ((i % 2 ? 1 : -1) * step * 8) + 'px)' : '';
      el.style.opacity = step ? String(Math.max(0, 1 - Math.floor(t * 5) / 4)) : '';
    });
  });

  /* ----------------------------------------------------------------- menu -- */
  var items = $$('[data-menu]'), sel = 0;
  function setSel(i, quiet) { sel = (i + items.length) % items.length; items.forEach(function (a, k) { a.classList.toggle('sel', k === sel); }); if (!quiet) sfx('blip'); }
  items.forEach(function (a, i) {
    a.addEventListener('mouseenter', function () { if (sel !== i) setSel(i); });
    a.addEventListener('focus', function () { if (sel !== i) setSel(i); });
    a.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(sel + 1); items[sel].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSel(sel - 1); items[sel].focus(); }
    });
  });
  if (items.length) setSel(0, true);

  /* ------------------------------------------------ cards + deal all btn -- */
  var cards = $$('.card'), dealBtn = $('#btn-deal-all'), flippedOnce = 0;
  function syncDealLabel() {
    if (!dealBtn) return;
    var allOpen = cards.every(function (c) { return c.classList.contains('flipped'); });
    dealBtn.textContent = allOpen ? 'Reset the deck' : 'Deal all four';
  }
  function flipCard(c, forceState) {
    var on = forceState !== undefined ? forceState : !c.classList.contains('flipped');
    c.classList.toggle('flipped', on);
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
    sfx('flip');
    if (on && !c.dataset.seen) {
      c.dataset.seen = '1'; flippedOnce++; addScore(250); pop(c, '+250');
      if (flippedOnce === cards.length) {
        setTimeout(function () { toast('Four of a kind!', '+1000. You turned the whole deck.', true); sfx('power'); addScore(1000); burstAt(c); pop($('#cardrow'), '+1000', true); }, 520);
      }
    }
    syncDealLabel();
  }
  cards.forEach(function (c) {
    c.addEventListener('click', function () { flipCard(c); });
  });
  if (dealBtn) {
    dealBtn.addEventListener('click', function () {
      var target = !cards.every(function (c) { return c.classList.contains('flipped'); });
      cards.forEach(function (c, idx) {
        setTimeout(function () { flipCard(c, target); }, reduced ? 0 : idx * 95);
      });
    });
  }

  /* --------------------------------------------------------------- versus -- */
  var rounds = $$('.round'), hpB = $('#hp-b'), fighterB = $('.fighter-b'), ko = $('#ko'), landed = 0;
  function land(r) {
    r.classList.add('in');
    setTimeout(function () {
      landed++; sfx('hit'); addScore(100); pop($('.f', r), '+100');
      if (hpB) hpB.style.width = Math.max(0, (rounds.length - landed) / rounds.length * 100) + '%';
      if (fighterB) { fighterB.classList.remove('hit'); void fighterB.offsetWidth; fighterB.classList.add('hit'); }
      if (landed === rounds.length && ko) setTimeout(function () { ko.classList.add('in'); sfx('ko'); addScore(1000); toast('K.O.', '+1000. Built beats briefed.', true); burstAt(ko); pop(ko, '+1000', true); quake($('#rounds')); }, 500);
    }, reduced ? 0 : 420);
  }
  if ('IntersectionObserver' in window && rounds.length) {
    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io3.unobserve(e.target); land(e.target); } });
    }, { threshold: 0.55, rootMargin: '0px 0px -10% 0px' });
    rounds.forEach(function (r) { io3.observe(r); });
  } else { rounds.forEach(function (r) { r.classList.add('in'); }); if (ko) ko.classList.add('in'); }

  function quake(el) { if (!el || reduced) return; el.classList.remove('quake'); void el.offsetWidth; el.classList.add('quake'); setTimeout(function () { el.classList.remove('quake'); }, 700); }

  /* ----------------------------------------------------------------- aces -- */
  function burstAt(el, cols) {
    if (!ACE.world || !el) return;
    var r = el.getBoundingClientRect(); ACE.world.burst(r.left + r.width / 2, r.top + r.height / 2, 28, cols);
  }
  var aces = $$('.ace'), acesEl = $('#aces'), got = 0, btnPal = $('#btn-palette');
  aces.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.stopPropagation(); if (a.classList.contains('got')) return;
      burstAt(a, ['L', 'w', 'Y']); pop(a, '+1000', true); a.classList.add('got'); a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1;
      got++; if (acesEl) acesEl.textContent = got; addScore(1000); sfx('coin');
      if (got < aces.length) toast('Ace ' + got + ' of ' + aces.length, '+1000. Keep looking.');
      else { setTimeout(function () { sfx('secret'); }, 300); toast('All five aces!', '+5000. Dialing up 1997...', true); addScore(5000); setTimeout(warp90s, 2400); }
    });
  });
  /* All five aces: dial up and warp to the 90s version of the site */
  var NINETIES = /^\/arcade\//.test(location.pathname) ? '/angelfire/' : 'https://aceforce.group/angelfire/';
  function modem() { // dial tone, touch tones, answer tone, then the handshake screech (about 5 seconds)
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var c = new AC(), out = c.createGain(), t0 = c.currentTime + 0.05; out.gain.value = 0.18; out.connect(c.destination);
      if (c.state === 'suspended' && c.resume) c.resume();
      function tone(f, t, d, type, vol) { var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.5, t + 0.01); g.gain.setValueAtTime(vol || 0.5, t + d - 0.01); g.gain.linearRampToValueAtTime(0, t + d);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02); return o; }
      function noise(t, d, f, q, vol) { var len = Math.ceil(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), x = b.getChannelData(0);
        for (var i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
        var s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
        g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + d - 0.05); g.gain.linearRampToValueAtTime(0, t + d);
        s.buffer = b; s.connect(bp); bp.connect(g); g.connect(out); s.start(t); return bp; }
      var t = t0;
      tone(350, t, 0.7, 'sine', 0.35); tone(440, t, 0.7, 'sine', 0.35); t += 0.8;                       // dial tone
      var DT = { '1': [697, 1209], '8': [852, 1336], '0': [941, 1336], '2': [697, 1336], '3': [697, 1477], '6': [770, 1477], '7': [852, 1209] };
      '18002233672'.split('').forEach(function (k) { tone(DT[k][0], t, 0.08, 'sine', 0.4); tone(DT[k][1], t, 0.08, 'sine', 0.4); t += 0.13; });
      t += 0.35;
      tone(440, t, 0.6, 'sine', 0.25); tone(480, t, 0.6, 'sine', 0.25); t += 0.75;                       // ringback
      tone(2100, t, 0.9, 'sine', 0.4); t += 0.95;                                                         // answer tone
      for (var k = 0; k < 8; k++) { tone(k % 2 ? 1300 : 2100, t, 0.06, 'square', 0.18); t += 0.065; }  // V.8 chirps
      tone(1800, t, 0.25, 'sine', 0.35); tone(600, t + 0.08, 0.2, 'sine', 0.3); t += 0.32;               // the bong
      var sweep = noise(t, 1.5, 900, 3, 0.9);                                                             // the screech
      sweep.frequency.setValueAtTime(900, t); sweep.frequency.linearRampToValueAtTime(2600, t + 0.7); sweep.frequency.linearRampToValueAtTime(1500, t + 1.5);
      for (var j = 0; j < 22; j++) tone(1000 + ((j * 397) % 1400), t + j * 0.065, 0.05, 'square', 0.1);
      noise(t + 1.5, 0.6, 1800, 0.7, 0.35);
      setTimeout(function () { try { c.close(); } catch (e) {} }, (t - t0 + 2.6) * 1000);
      return t - t0 + 2.1;
    } catch (e) { return 0; }
  }
  function warp90s() {
    var soundWanted = !ACE.sfx || ACE.sfx.isOn();
    if (ACE.sfx && ACE.sfx.isOn()) ACE.sfx.enable(false); // stop the arcade music so the modem is heard
    var ov = document.createElement('div'), pre = document.createElement('pre');
    ov.className = 'dialup'; ov.appendChild(pre); document.body.appendChild(ov);
    var lines = ['ATDT 1-800-ACE-FORCE', 'DIALING...', 'RINGING...', 'CARRIER DETECTED', 'CONNECT 28800', 'LOADING ACEFORCE.ANGELFIRE.COM...'], i = 0;
    var total = (soundWanted && !reduced) ? (modem() || 4) : 2.4, gap = Math.max(120, (total * 1000) / lines.length);
    if (reduced) gap = 120;
    (function next() {
      if (i < lines.length) { pre.innerHTML = lines.slice(0, ++i).join('\n') + '<span class="cur">_</span>'; setTimeout(next, gap); return; }
      pixelOut(function () { location.href = NINETIES; });
    })();
  }
  if (btnPal) btnPal.addEventListener('click', function () {
    var on = body.classList.toggle('dmg'); btnPal.setAttribute('aria-pressed', on ? 'true' : 'false'); sfx('select');
    toast(on ? 'Handheld mode' : 'Arcade mode', on ? 'Four shades of green. As it was in 1989.' : 'Full hi-bit color.');
  });

  /* ----------------------------------------- hud + hero sound & view btns -- */
  var btnSound = $('#btn-sound'), heroSound = $('#hero-sound'), btnView = $('#btn-view');
  function paintSound() {
    var on = !!(ACE.sfx && ACE.sfx.isOn());
    if (btnSound) { btnSound.textContent = on ? 'Sound on' : 'Sound off'; btnSound.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    if (heroSound) { heroSound.textContent = on ? '♪ 8-bit audio: On' : '♪ Enable 8-bit audio'; heroSound.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  }
  function toggleSound() {
    if (ACE.sfx) {
      ACE.sfx.enable(!ACE.sfx.isOn()); sfx('select');
      try { localStorage.setItem('aceforce-sound', ACE.sfx.isOn() ? 'on' : 'off'); } catch (e) { /* ignore */ }
    }
    paintSound();
  }
  if (btnSound) btnSound.addEventListener('click', toggleSound);
  if (heroSound) heroSound.addEventListener('click', toggleSound);
  if (btnView) btnView.addEventListener('click', function () {
    var on = body.classList.toggle('view-only'); btnView.setAttribute('aria-pressed', on ? 'true' : 'false'); btnView.textContent = on ? 'Read' : 'View'; sfx('select');
    if (on) toast('View mode', 'The story text is hidden. Press READ to show it.');
  });

  var hudSpade = $('.hud .spade'), beatN = 0, beatLast = -1;
  if (hudSpade && ACE.world && !reduced) ACE.world.onFrame(function () {
    if (++beatN % 3) return;
    var lv = ACE.sfx ? ACE.sfx.level() : 0, st = lv > 0.14 ? 2 : lv > 0.07 ? 1 : 0;
    if (st === beatLast) return; beatLast = st;
    hudSpade.style.transform = st ? 'scale(' + (1 + st * 0.2) + ')' : '';
  });

  var lastBlip = 0;
  document.addEventListener('pointerover', function (e) {
    var t = e.target.closest ? e.target.closest('.btn, .hud-btn, .sound-pill, .card, .levels a, .player-card, .wf-chip, .pad') : null;
    if (!t || t === document._lastHover) return; document._lastHover = t;
    var n = performance.now(); if (n - lastBlip > 70) { lastBlip = n; sfx('blip'); }
  });

  /* ---------------------------------------------------------------- cheat -- */
  var KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kpos = 0, cheated = false;
  window.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = (k === KON[kpos]) ? kpos + 1 : (k === KON[0] ? 1 : 0);
    if (kpos === KON.length) {
      kpos = 0; sfx('secret'); if (ACE.world) ACE.world.warp();
      body.classList.add('warp'); setTimeout(function () { body.classList.remove('warp'); }, 5200);
      toast('Cheat code accepted', cheated ? 'Warp speed. Again.' : '+30 lives. Warp speed.', true);
      if (!cheated) { cheated = true; addScore(3000); $$('.lc-lives').forEach(function (el) { el.lastChild.textContent = ' × 33'; }); }
    }
  });

  /* ----------------------------- single-pass countdown + workflow CTA ------ */
  var cd = $('#countdown'), cdN = 9, mission = $('#mission'), cdStarted = false;
  if (cd && mission && 'IntersectionObserver' in window && !reduced) {
    var cdIo = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !cdStarted) {
        cdStarted = true; cdIo.disconnect();
        var cdTimer = setInterval(function () {
          cdN--;
          if (cdN <= 0) { clearInterval(cdTimer); cd.textContent = 'READY'; return; }
          cd.textContent = cdN;
        }, 900);
      }
    }, { threshold: 0.35 });
    cdIo.observe(mission);
  }

  /* -------------------------------------------- mission form (Web3Forms) -- */
  // Same Web3Forms inbox as the contact form on aceforce.group. No mailto links,
  // so no visitor's mail app opens.
  var W3F_KEY = '1d1154fd-1717-4f0b-ac02-65efcb247832';
  var cta = $('#cta'), wfChips = $$('.wf-chip'), activeWf = '', mform = $('#mform'), mStatus = $('#m-status');
  wfChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var val = chip.dataset.wf || '';
      activeWf = (activeWf === val) ? '' : val;
      wfChips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.wf === activeWf ? 'true' : 'false'); });
      sfx('select');
    });
  });
  function mval(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function mSay(t) { if (mStatus) { mStatus.hidden = false; mStatus.textContent = t; } }
  if (mform) mform.addEventListener('submit', function (e) {
    e.preventDefault();
    var bot = mform.querySelector('[name=botcheck]'); if (bot && bot.checked) return;
    if (!mval('m-name') || !/^\S+@\S+\.\S+$/.test(mval('m-email')) || !mval('m-msg')) { sfx('hit'); mSay('Please add your name, a valid email and a short note.'); return; }
    var label = cta.innerHTML; cta.disabled = true; cta.textContent = 'Sending...'; mSay('Sending...');
    var payload = {
      access_key: W3F_KEY, from_name: 'aceforce.group arcade', topic: activeWf || 'Arcade',
      subject: 'AceForce inquiry (Arcade' + (activeWf ? ', ' + activeWf : '') + ')' + (mval('m-brand') ? ' from ' + mval('m-brand') : ''),
      name: mval('m-name'), email: mval('m-email'), brand: mval('m-brand'), message: mval('m-msg')
    };
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success) { mSay(mform.getAttribute('data-ok')); mform.reset(); sfx('start'); burstAt(cta, ['L', 'Y', 'w', 'M']); addScore(2000); pop(cta, '+2000', true); }
        else mSay('That did not go through. Please email info@aceforce.group directly.');
      })
      .catch(function () { mSay('That did not go through. Please email info@aceforce.group directly.'); })
      .then(function () { cta.disabled = false; cta.innerHTML = label; });
  });

  /* ------------------------------------------------- exit to the 2026 site -- */
  var exitBtn = $('#btn-exit');
  function clearMode() { try { localStorage.setItem('aceforce-mode', '26'); } catch (e) { /* ignore */ } }
  // Pixel wipe to black, then leave. Used by Exit to 2026.
  function pixelOut(done) {
    var c = $('#curtain'); if (!c || reduced) { done(); return; }
    var cell = 40, cols = Math.ceil(window.innerWidth / cell), rows = Math.ceil(window.innerHeight / cell), x = c.getContext('2d'), order = [], i;
    c.width = cols; c.height = rows; x.clearRect(0, 0, cols, rows); c.style.display = 'block'; x.fillStyle = '#05070f';
    for (i = 0; i < cols * rows; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = order[i]; order[i] = order[j]; order[j] = t; }
    var per = Math.ceil(order.length / 18), at = 0;
    var timer = setInterval(function () {
      for (var k = 0; k < per && at < order.length; k++, at++) x.fillRect(order[at] % cols, (order[at] / cols) | 0, 1, 1);
      if (at >= order.length) { clearInterval(timer); done(); }
    }, 24);
  }
  if (exitBtn) exitBtn.addEventListener('click', function (e) {
    clearMode();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); sfx('ko');
    try { sessionStorage.setItem('aceforce-px', 'in'); } catch (err) { /* ignore */ }
    pixelOut(function () { location.href = exitBtn.href; });
  });

  // Links that leave the arcade open in a new tab (Exit to 2026 stays in this one).
  $$('a[href^="http"]').forEach(function (a) {
    if (/mode=26/.test(a.href)) return;
    a.target = '_blank'; a.rel = 'noopener';
  });
  $$('a[href*="mode=26"]').forEach(function (a) { a.addEventListener('click', clearMode); });

  var copyBtn = $('#copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var addr = copyBtn.dataset.email || 'info@aceforce.group';
      var onCopied = function () {
        sfx('coin'); burstAt(copyBtn, ['L', 'Y', 'w']);
        copyBtn.textContent = 'Copied · ' + addr;
        toast('Email copied', addr + ' is on your clipboard.', true);
        setTimeout(function () { copyBtn.textContent = 'Copy ' + addr; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(onCopied, function () { onCopied(); });
      } else {
        var ta = document.createElement('textarea'); ta.value = addr; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta); onCopied();
      }
    });
  }

  /* ------------------------------------------------------------------ hat -- */
  var pulled = false;
  if (hat) hat.addEventListener('click', function () {
    sfx('magic'); burstAt(hat, ['w', 'M', 'Y']);
    var old = $('.bun', hat); if (old) hat.removeChild(old);
    var b = document.createElement('span'); b.className = 'bun'; b.style.backgroundImage = 'url(' + G.scaleUp(SPR.rabbit, 4).toDataURL() + ')'; hat.appendChild(b);
    if (!pulled) { pulled = true; addScore(500); pop(hat, '+500', true); toast('A rabbit!', '+500. Never trust a top hat.', true); }
  });

  /* ------------------------------- instant live boot (optional ?gate=1) ---- */
  var gate = $('#gate'), boot = $('#boot'), gateMain = $('#gate-main'), bSound = $('#start-sound'), bMute = $('#start-mute'), heroBoot = $('#hero-boot'), started = false;
  var BOOT = ['ACEFORCE SYSTEMS  (C) 2026', 'MEMORY CHECK .............. 640K OK', 'LOADING CARGO MANIFEST ........ OK', 'CALIBRATING WAND .............. OK', 'SYSTEM ONLINE. READY FOR LAUNCH.'];
  function curtain() {
    var c = $('#curtain'); if (!c || reduced) return;
    var cell = 40, cols = Math.ceil(window.innerWidth / cell), rows = Math.ceil(window.innerHeight / cell), x = c.getContext('2d'), order = [], i;
    c.width = cols; c.height = rows; c.style.display = 'block'; x.fillStyle = '#05070f'; x.fillRect(0, 0, cols, rows);
    for (i = 0; i < cols * rows; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = order[i]; order[i] = order[j]; order[j] = t; }
    var per = Math.ceil(order.length / 20), at = 0;
    var timer = setInterval(function () {
      for (var k = 0; k < per && at < order.length; k++, at++) x.clearRect(order[at] % cols, (order[at] / cols) | 0, 1, 1);
      if (at >= order.length) { clearInterval(timer); c.style.display = 'none'; }
    }, 24);
  }
  function begin(withSound, skipCurtain) {
    if (started) return; started = true;
    if (withSound && ACE.sfx) { ACE.sfx.enable(true); sfx('start'); }
    paintSound();
    if (!skipCurtain) curtain();
    if (gate) { gate.classList.add('gone'); gate.hidden = true; }
    body.classList.remove('gated'); body.classList.add('live');
    if (ACE.world) ACE.world.measure();
    layoutRoute(); visited[0] = 1; track();
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) window.scrollTo(0, t.getBoundingClientRect().top + (window.scrollY || 0)); }
    if (heroBoot && !reduced) decode(heroBoot);
    var main = $('#main'); if (main) main.setAttribute('tabindex', '-1');
  }
  function showGate() {
    if (gateMain) gateMain.classList.add('on');
    if (bSound) try { bSound.focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }
  var wantGate = /[?&]gate(=1|\b)/i.test(qs) && !/[?&](skip|nogate)\b/i.test(qs);
  if (gate && wantGate) {
    gate.hidden = false; body.classList.add('gated');
    if (reduced) { if (boot) boot.textContent = BOOT.join('\n'); showGate(); }
    else {
      var li = 0, out = '';
      var bt = setInterval(function () {
        out += (li ? '\n' : '') + BOOT[li]; li++; if (boot) boot.textContent = out;
        if (li >= BOOT.length) { clearInterval(bt); setTimeout(showGate, 240); }
      }, 190);
    }
    if (bSound) bSound.addEventListener('click', function () { begin(true, false); });
    if (bMute) bMute.addEventListener('click', function () { begin(false, false); });
    window.addEventListener('keydown', function (e) {
      if (started) return;
      if (e.key === 'Enter' && document.activeElement !== bMute) { e.preventDefault(); begin(true, false); }
      else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') begin(false, false);
    });
  } else {
    var fromToggle = false;
    try { fromToggle = sessionStorage.getItem('aceforce-px') === 'out'; sessionStorage.removeItem('aceforce-px'); } catch (e) { /* ignore */ }
    begin(false, !fromToggle);
    autoSound();
  }

  /* Sound is on by default. Browsers only let a page make sound after the
     visitor clicks, taps or presses a key on it, so if the browser holds the
     audio back, it starts on the first click, tap or key press anywhere. */
  function autoSound() {
    var pref = 'on';
    try { pref = localStorage.getItem('aceforce-sound') || 'on'; } catch (e) { /* ignore */ }
    if (pref === 'off' || !ACE.sfx) return;
    ACE.sfx.enable(true); paintSound();
    if (ACE.sfx.running()) return;
    var evs = ['pointerdown', 'keydown', 'touchstart'];
    function wake(e) {
      evs.forEach(function (n) { window.removeEventListener(n, wake, true); });
      if (!ACE.sfx.isOn()) return; // they switched it off in the meantime
      var onSoundBtn = e && e.target && e.target.closest && e.target.closest('#btn-sound, #hero-sound');
      if (!onSoundBtn) ACE.sfx.enable(true);
      paintSound();
    }
    evs.forEach(function (n) { window.addEventListener(n, wake, true); });
  }

  window.addEventListener('load', function () { layoutRoute(); track(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutRoute(); track(); });

  ACE.ui = {
    addScore: addScore, toast: toast,
    gameOver: function (pts, done) { addScore(pts); toast('Bonus stage clear', done + ' manual tasks automated. +' + pts + '.', done >= 24); }
  };
})();
