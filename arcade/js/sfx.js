/* ACEFORCE ARCADE — sfx.js
   A small chiptune engine: square, triangle and noise voices on the Web Audio API.
   The music and all effects are synthesized here. There are no audio files. */
(function () {
  'use strict';
  var ACE = window.ACE = window.ACE || {};
  var ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
  var on = false, timer = null, step = 0, nextT = 0, lastType = 0, meter = null, meterBuf = null;

  var NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(name) {
    var m = /^([A-G]#?)(\d)$/.exec(name);
    var n = NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.6;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6800;
    master.connect(lp); lp.connect(ctx.destination);
    meter = ctx.createAnalyser(); meter.fftSize = 1024; lp.connect(meter); meterBuf = new Float32Array(meter.fftSize);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.85; sfxGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(type, f0, f1, t0, dur, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.setValueAtTime(vol, t0 + dur * 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, vol, f0, f1, type, dest) {
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; s.loop = true;
    f.type = type || 'highpass'; f.frequency.setValueAtTime(f0 || 1000, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }
  function seq(notes, t0, len, vol, type) {
    notes.forEach(function (n, i) { if (n) tone(type || 'square', hz(n), 0, t0 + i * len, len * 0.95, vol); });
  }

  var FX = {
    blip: function (t) { tone('square', 880, 0, t, 0.035, 0.10); },
    select: function (t) { seq(['E5', 'B5'], t, 0.06, 0.13); },
    start: function (t) { seq(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], t, 0.075, 0.14); },
    coin: function (t) { tone('square', hz('B5'), 0, t, 0.07, 0.14); tone('square', hz('E6'), 0, t + 0.07, 0.32, 0.14); },
    levelup: function (t) { seq(['G4', 'C5', 'E5', 'G5', 'C6'], t, 0.07, 0.13); tone('triangle', hz('C4'), 0, t, 0.35, 0.2); },
    flip: function (t) { noise(t, 0.04, 0.2, 3000); noise(t + 0.09, 0.05, 0.16, 1800); tone('square', 520, 780, t + 0.1, 0.06, 0.07); },
    hit: function (t) { noise(t, 0.12, 0.3, 400, 120, 'lowpass'); tone('square', 220, 70, t, 0.14, 0.14); },
    ko: function (t) { seq(['E5', 'C5', 'A4', 'F4', 'D4', 'C4'], t, 0.09, 0.14); noise(t, 0.5, 0.25, 800, 80, 'lowpass'); },
    poof: function (t) { noise(t, 0.5, 0.3, 4000, 200, 'lowpass'); tone('triangle', 900, 120, t, 0.4, 0.12); },
    magic: function (t) { seq(['E6', 'G6', 'B6', 'E7'], t, 0.045, 0.07); },
    laser: function (t) { tone('square', 1300, 320, t, 0.09, 0.08); },
    boom: function (t) { noise(t, 0.22, 0.28, 1200, 100, 'lowpass'); tone('square', 160, 50, t, 0.18, 0.1); },
    power: function (t) { seq(['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'], t, 0.04, 0.11); },
    miss: function (t) { tone('square', 180, 90, t, 0.22, 0.12); },
    over: function (t) { seq(['C5', 'G4', 'E4', 'A4', 'B4', 'A4', 'G#4', 'A#4', 'G#4', 'G4'], t, 0.11, 0.12); },
    type: function (t) { tone('square', 1500, 0, t, 0.012, 0.035); },
    count: function (t) { tone('square', hz('A4'), 0, t, 0.06, 0.08); },
    secret: function (t) { seq(['G5', 'F#5', 'D#5', 'A4', 'G#4', 'E5', 'G#5', 'C6'], t, 0.09, 0.12); }
  };

  /* ---- music: eight bars, sixteen steps to the bar ---------------------- */
  var BPM = 126, STEP = 60 / BPM / 4;
  var CH = {
    Am: ['A3', 'C4', 'E4', 'A4'], F: ['F3', 'A3', 'C4', 'F4'], C: ['C4', 'E4', 'G4', 'C5'], G: ['G3', 'B3', 'D4', 'G4'],
    Dm: ['D4', 'F4', 'A4', 'D5'], E: ['E3', 'G#3', 'B3', 'E4']
  };
  var BARS = ['Am', 'F', 'C', 'G', 'Dm', 'Am', 'F', 'E'];
  var ROOT = { Am: 'A2', F: 'F2', C: 'C3', G: 'G2', Dm: 'D3', E: 'E2' };
  var ARP = [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2];
  var LEAD = [
    'E5:4 -:2 D5:1 E5:1 -:2 C5:2 A4:4',
    'F5:4 -:2 E5:1 F5:1 -:2 A5:2 G5:2 F5:2',
    'E5:4 -:2 D5:1 E5:1 -:2 G5:2 C6:4',
    'B5:4 -:2 A5:1 B5:1 -:2 D6:2 B5:2 G5:2',
    'A5:2 F5:2 D5:2 F5:2 A5:2 D6:2 C6:2 A5:2',
    'G5:2 E5:2 C5:2 E5:2 A5:4 -:4',
    'F5:2 A5:2 C6:2 A5:2 F5:2 A5:2 G5:2 F5:2',
    'E5:4 G#5:4 B5:4 E6:2 -:2'
  ].map(function (bar) {
    var out = [], pos = 0;
    bar.split(' ').forEach(function (tok) {
      var p = tok.split(':'), len = parseInt(p[1], 10);
      if (p[0] !== '-') out[pos] = { n: p[0], len: len };
      pos += len;
    });
    return out;
  });

  function schedule(t, s) {
    var bar = Math.floor(s / 16) % 8, i = s % 16, ch = BARS[bar];
    var round = Math.floor(s / 128);
    // arpeggio
    tone('square', hz(CH[ch][ARP[i]]), 0, t, STEP * 0.8, 0.028, musicGain);
    // bass
    if (i % 2 === 0) {
      var r = hz(ROOT[ch]) * ((i / 2) % 2 ? 2 : 1);
      tone('triangle', r, 0, t, STEP * 1.8, 0.2, musicGain);
    }
    // lead (rests on the first pass so the tune builds)
    var L = LEAD[bar][i];
    if (L && round > 0) tone('square', hz(L.n), 0, t, STEP * L.len * 0.92, 0.06, musicGain);
    // drums
    if (i === 0 || i === 8 || (bar % 2 === 1 && i === 10)) tone('sine', 150, 45, t, 0.11, 0.3, musicGain);
    if (i === 4 || i === 12) noise(t, 0.09, 0.11, 1800, 0, 'highpass', musicGain);
    if (i % 2 === 0) noise(t, 0.025, i % 4 === 2 ? 0.05 : 0.025, 7000, 0, 'highpass', musicGain);
  }
  function tick() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.18) { schedule(nextT, step); step++; nextT += STEP; }
  }
  function startMusic() {
    if (timer) return;
    step = 0; nextT = ctx.currentTime + 0.08;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    timer = setInterval(tick, 40); tick();
  }
  function stopMusic() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
  }

  ACE.sfx = {
    isOn: function () { return on; },
    running: function () { return !!(ctx && ctx.state === 'running'); },
    enable: function (v) {
      if (v) {
        if (!ensure()) return false;
        if (ctx.state === 'suspended') ctx.resume();
        on = true; startMusic();
      } else {
        on = false; if (ctx) stopMusic();
      }
      return on;
    },
    duck: function (v) { // lower the music under the mini game
      if (!ctx || !on) return;
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(v ? 0.22 : 0.55, ctx.currentTime + 0.3);
    },
    level: function () { // output peak, 0..1 (for the HUD meter and the tests)
      if (!meter || !on) return 0;
      meter.getFloatTimeDomainData(meterBuf);
      var p = 0; for (var i = 0; i < meterBuf.length; i++) { var a = Math.abs(meterBuf[i]); if (a > p) p = a; }
      return p;
    },
    play: function (name) {
      if (!on || !ctx || !FX[name]) return;
      if (name === 'type') { var n = performance.now(); if (n - lastType < 38) return; lastType = n; }
      try { FX[name](ctx.currentTime + 0.005); } catch (e) { /* audio is optional */ }
    }
  };

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
  });
})();
