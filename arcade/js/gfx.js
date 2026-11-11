/* ACEFORCE ARCADE — gfx.js
   Hi-bit art kit: expanded 32-color arcade palette, 32x32 character portraits,
   refined sprites with rim lighting, a 5x7 crisp canvas font with shadow backing,
   procedural planets with atmospheric limb glow, and Bayer dither patterns. */
(function () {
  'use strict';
  var ACE = window.ACE = window.ACE || {};

  var PAL = {
    k: '#05070f', n: '#091f34', N: '#0e2d4a', b: '#16395c', B: '#215380', t: '#2a6f97', c: '#4de8ff', C: '#a8f5ff',
    w: '#ffffff', s: '#e0dfda', S: '#b2bcc4', g: '#778891', d: '#405465', D: '#223140',
    L: '#c1fd5d', G: '#8ee034', l: '#5d9c22',
    P: '#8f6bff', V: '#baa4ff', p: '#4a2fa8', u: '#2a1863', x: '#1b1036',
    M: '#ff4fd8', K: '#ffa8ec', m: '#a3238a',
    Y: '#ffd23f', W: '#ffec99', y: '#c98a1a',
    O: '#ff8a3d', o: '#b3541e',
    R: '#ff4d5e', r: '#9e1f3a',
    F: '#ffc9a3', f: '#d98f6a', e: '#8c553a', h: '#1e192b', a: '#593728'
  };

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function mk(rows, swap) {
    var h = rows.length, w = 0, i, y;
    for (i = 0; i < h; i++) w = Math.max(w, rows[i].length);
    var c = canvas(w, h), x = c.getContext('2d');
    for (y = 0; y < h; y++) for (i = 0; i < rows[y].length; i++) {
      var ch = rows[y][i];
      if (ch === '.' || ch === ' ') continue;
      if (swap && swap[ch]) ch = swap[ch];
      x.fillStyle = PAL[ch] || '#f0f'; x.fillRect(i, y, 1, 1);
    }
    return c;
  }
  function mirror(half) {
    return half.map(function (r) { return r + r.slice(0, -1).split('').reverse().join(''); });
  }
  function flipH(src) {
    var c = canvas(src.width, src.height), x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c;
  }
  function rotCW(src) {
    var c = canvas(src.height, src.width), x = c.getContext('2d');
    x.translate(src.height, 0); x.rotate(Math.PI / 2); x.drawImage(src, 0, 0); return c;
  }
  function scaleUp(src, k) {
    var c = canvas(src.width * k, src.height * k), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height); return c;
  }

  /* ------------------------------------------------------------ sprites -- */
  var MAG_HEAD = [
    '.....kkkkkkkk.....',
    '.....kuupPPVk.....',
    '.....kupPPPPVk....',
    '.....kupPPYPpk....',
    '.....kLLLLLLGk....',
    '...kkppppppppVkk..',
    '...kkuuuuuuuuukk..',
    '.....kFFFFFFfk....',
    '.....kFkFFkFfk....',
    '.....kFFFFFFfk....',
    '.....kfhhhhffk....',
    '......kFFFFfk.....'
  ];
  var MAG_BODY_A = [
    '...kMKpwRRwpKMk...',
    '..kMMmppwwppmMMk..',
    '..kMmwppLYppwmMk..',
    '..kMm.ppwwpp.mMk..',
    '..kMm.pppppp.mMk..',
    '.kMMm.ppkkpp.mMMk.',
    '.kMmm.pp..pp.mmMk.',
    '.kM...pp..pp...Mk.',
    '....kssskksssk....'
  ];
  var MAG_BODY_B = [
    '...kMKpwRRwpKMk...',
    '..kMMmppwwppmMMk..',
    '..kMmwppLYppwmMk..',
    '..kMm.ppwwpp.mMk..',
    '..kMm.pppppp.mMk..',
    '..kMm.ppkkpp.mMk..',
    '.kMMm.pp..pp.mMMk.',
    '.kMm..pp..pp..mMk.',
    '....kssskksssk....'
  ];
  var MAG_CAST_HEAD = [
    '.....kkkkkkkk.....',
    '.....kuupPPVk.....',
    '.....kupPPPPVk....',
    '.....kupPPYPpk....',
    '.....kLLLLLLGk....',
    '...kkppppppppVkk..',
    '...kkuuuuuuuuukk..',
    '.....kFFFFFFfk..W.',
    '.....kFkFFkFfk.wY.',
    '.....kFFFFFFfky...',
    '.....kfhhhhfky....',
    '......kFFFFfy.....'
  ];
  var MAG_CAST_BODY = [
    '...kMKpwRRwppk....',
    '..kMMmppwwpp.MMk..',
    '..kMmwppLYppmmMk..',
    '..kMm.ppwwpp.mMk..',
    '..kMm.pppppp.mMk..',
    '.kMMm.ppkkpp.mMMk.',
    '.kMmm.pp..pp.mmMk.',
    '.kM...pp..pp...Mk.',
    '....kssskksssk....'
  ];

  var RUN_TOP = [
    '..kkkkkk..',
    '.kwsssswk.',
    'kwCccccCwk',
    'kwcwcccwck',
    'kwccccccwk',
    '.kwsssswk.',
    '.ksLLLLsk.',
    'ks.wSSw.sk',
    '...wSSw...'
  ];
  var SHEET_TOP = [
    'kwwwwwwwgk',
    'kwRRwRRwgk',
    'kwwwwwwwwk',
    'kwkkwwwkkw',
    'kwwkwwwkwk',
    'kwwwwwwwwk',
    'kwRwRwRwRk',
    'kssssssssk'
  ];
  var CRATE = [
    'kLLLLLLLk',
    'LLGGGGGGL',
    'LGllLllGL',
    'LGlLLLlGL',
    'LGlLYLlGL',
    'LGlLLLlGL',
    'LGllLllGL',
    'LLllllllL',
    'klllllllk'
  ];
  var SHIP_HALF = [
    '........w',
    '.......sw',
    '.......ss',
    '......ssw',
    '......sCc',
    '.....ssCc',
    '.....ssct',
    '.....ssSw',
    '.....LLLG',
    '.....ssSw',
    '....sssSn',
    '....ssSnn',
    '...dsssSn',
    '..ddssssS',
    '.dddsgSSg',
    'dddssgSSg',
    'dd.ssgsSs',
    'd..ssdddd',
    '...dd.dd.'
  ];
  var SAT_HALF = [
    '.......w',
    'tCtC..gs',
    'ctctggsw',
    'Bcbc..ds',
    '.......d'
  ];
  var STATION = [
    '.......L.......',
    '.......w.......',
    '.....ggggg.....',
    '...ggsssssgg...',
    '.ccgsCwwwCsggc.',
    'cCcsssLLLssscCc',
    '.ccgscGGGcsggc.',
    '...ggSSSSSgg...',
    '.....ggggg.....',
    '....d..L..d....',
    '...dd.....dd...'
  ];

  /* 32x32 Hi-Bit Portraits */
  var PORTRAIT_ACE_32 = [
    '................................',
    '.........kkkkkkkkkkkkkk.........',
    '........kkuupPPPPPPVVukk........',
    '........kupPPPPPPPPPPVVk........',
    '........kupPPPPPPPPPPVVk........',
    '........kupPPPPYYPPPPpuk........',
    '........kupPPPYYYYPPPpuk........',
    '........kupPPPPYYPPPPpuk........',
    '........kLLLLLLLLLLLLGGk........',
    '........kGGGGGGGGGGGGllk........',
    '.....kkkkppppppppppppVVkkkk.....',
    '....kkuuppppppppppppppppuukk....',
    '....kkkkkkkkkkkkkkkkkkkkkkkk....',
    '........kFFFFFFFFFFFFffk........',
    '.......kFFFFFFFFFFFFFFffk.......',
    '.......kFFhkFFFFFFhkFFffk.......',
    '.......kFFkkFFFFFFkkFFffk.......',
    '.......kFFFFFFFFFFFFFFffk.......',
    '.......kFFFFFFFFFFfFFFffk.......',
    '.......kFFFFhhhhhhFFFFffk.......',
    '........kFFFFFwwFFFFFffk........',
    '.........kFFFFFFFFFFFFk.........',
    '......kkkMKpwwRRRRwwpKMkkk......',
    '....kkMMMmmpppwwwwpppmmMMMkk....',
    '...kKMMmmmppppwYYwppppmmmMMKk...',
    '..kKMMmmm.ppppwwwwpppp.mmmMMKk..',
    '..kMMmmm..pppppppppppp..mmmMMk..',
    '.kMMmmm...ppppuukkpppp...mmmMMk.',
    '.kMMmm....ppppuukkpppp....mmMMk.',
    '.kMmm.....ppppuukkpppp.....mmMk.',
    '.kMm......ppppuukkpppp......mMk.',
    '................................'
  ];

  var PORTRAIT_SUIT_32 = [
    '................................',
    '..........kkkkkkkkkkkk..........',
    '........kkddddddddddddkk........',
    '.......kddDDDDddddddddggk.......',
    '......kddDDDDddddddddddggk......',
    '......kdFFFFFFFFFFFFFFFFdk......',
    '......kdFFFFFFFFFFFFFFFFfk......',
    '......kggggkkkkFFkkkkggggk......',
    '......kgcCgkhkFFFFkhkgcCgk......',
    '......kggggkkkkFFkkkkggggk......',
    '......kdFFFFFFFFFFFFFFFFfk......',
    '......kdFFFFFFffeeFFFFFFfk......',
    '.......kdFFFFeeeeeeFFFFfk.......',
    '........kdFFFFFFFFFFFFfk........',
    '.........kddFFFFFFFFffk.........',
    '......kkkgggwwRRRRwwgggkkk......',
    '....kkggggggwwwRRwwwggggggkk....',
    '...kgggggggggwwRRwwgggggggggk...',
    '..kgggggssssssssssssssssgggggk..',
    '..kggggswsssssssssssssswsggggk..',
    '..kggggswsRRssggggssddswsggggk..',
    '..kggggswsRRssOOssssddswsggggk..',
    '..kggggswsRRssOOssLLddswsggggk..',
    '..kggggswsRRssOOssLLddswsggggk..',
    '..kggggswsssssssssssssswsggggk..',
    '..kgggggssssssssssssssssgggggk..',
    '..kgggggggggggwwwwgggggggggggk..',
    '..kgggggggggggwwwwgggggggggggk..',
    '..kdddddddddddggggdddddddddddk..',
    '..kddddddddddddddddddddddddddk..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '................................'
  ];

  var SPR = {
    magIdleA: mk(MAG_HEAD.concat(MAG_BODY_A)),
    magIdleB: mk(MAG_HEAD.concat(MAG_BODY_B)),
    magCast: mk(MAG_CAST_HEAD.concat(MAG_CAST_BODY)),
    magHead: mk(MAG_HEAD),
    magBody: mk(MAG_BODY_A),
    runA: mk(RUN_TOP.concat(['...ww.ww..', '..ww...ww.', '..gg...gg.'])),
    runB: mk(RUN_TOP.concat(['...wwww...', '....www...', '...gg.gg..'])),
    runSit: mk(RUN_TOP.concat(['..wwwwww..', '.ww....ww.', '.gg....gg.'])),
    sheetA: mk(SHEET_TOP.concat(['..g.....g.', '.gg.....gg'])),
    sheetB: mk(SHEET_TOP.concat(['...g...g..', '...gg..gg.'])),
    crate: mk(CRATE),
    crateO: mk(CRATE, { L: 'O', G: 'O', l: 'o', Y: 'W' }),
    crateR: mk(CRATE, { L: 'R', G: 'R', l: 'r', Y: 'W' }),
    crateS: mk(CRATE, { L: 's', G: 'S', l: 'g', Y: 'w' }),
    ship: mk(mirror(SHIP_HALF)),
    sat: mk(mirror(SAT_HALF)),
    hat: mk([
      '..kkkkkkkk..',
      '..kupPPPVk..',
      '..kupPPPVk..',
      '..kupPPPVk..',
      '..kLLLLLGk..',
      'kkppppppppkk',
      'kkkkkkkkkkkk'
    ]),
    cardFace: mk([
      'ksssssssssk',
      'ksnsssssssk',
      'ksssssssssk',
      'kssssnssssk',
      'ksssnnnsssk',
      'kssnnnnnssk',
      'kssnnnnnssk',
      'kssnsnsnssk',
      'kssssnssssk',
      'ksssnnnsssk',
      'ksssssssnsk',
      'ksssssssssk'
    ]),
    cardBack: mk([
      'kLLLLLLLLLk',
      'LLnnnnnnnLL',
      'LnLnLnLnLnL',
      'LnnLnLnnLnL',
      'LnLnLYLnLnL',
      'LnnLYYYnnLL',
      'LnLnLYLnLnL',
      'LnnLnLnnLnL',
      'LnLnLnLnLnL',
      'LnnLnLnnLnL',
      'LLnnnnnnnLL',
      'kLLLLLLLLLk'
    ]),
    cardEdge: mk(['.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.', '.ks.']),
    pad: mk([
      '.kkkkkkkkkkkkkk.',
      'kssssssssssssssk',
      'kssdssssssssRRsk',
      'ksdddssssssssssk',
      'kssdsssddsLLsssk',
      'kSSSSSSSSSSSSSSk',
      '.kkkkkkkkkkkkkk.'
    ]),
    drone: mk([
      '.C.....C.',
      '..kgggk..',
      '.kgsLsLgk',
      '.kgssssgk',
      '..k.O.k..'
    ]),
    rabbit: mk([
      '.kw...wk.',
      '.kwM.Mwk.',
      '.kwM.Mwk.',
      '.kwwwwwk.',
      'kwwkwkwwk',
      'kwwwMwwwk',
      '.kwwwwwk.',
      '..kkkkk..'
    ]),
    rock: mk([
      '..kggk..',
      '.kggdgk.',
      'kgdgggdk',
      'kggggddk',
      '.kgdgddk',
      '..kdddk.'
    ]),
    wand: mk([
      '......W.',
      '.....wYw',
      '....y.W.',
      '...y....',
      '..y.....',
      '.y......',
      'k.......'
    ]),
    portraitAce: mk(PORTRAIT_ACE_32),
    portraitSuit: mk(PORTRAIT_SUIT_32)
  };
  SPR.shipR = rotCW(SPR.ship);
  SPR.runAf = flipH(SPR.runA); SPR.runBf = flipH(SPR.runB);
  SPR.magIdleAf = flipH(SPR.magIdleA); SPR.magCastf = flipH(SPR.magCast);
  SPR.sheetR = [mk(SHEET_TOP.concat(['..g.....g.', '.gg.....gg']), { R: 'M' }), mk(SHEET_TOP.concat(['...g...g..', '...gg..gg.']), { R: 'M' })];
  SPR.sheetO = [mk(SHEET_TOP.concat(['..g.....g.', '.gg.....gg']), { R: 'O' }), mk(SHEET_TOP.concat(['...g...g..', '...gg..gg.']), { R: 'O' })];

  /* --------------------------------------------------- 5x7 crisp bitmap -- */
  var MF57 = {
    A: ['01110','10001','10001','11111','10001','10001','10001'],
    B: ['11110','10001','10001','11110','10001','10001','11110'],
    C: ['01111','10000','10000','10000','10000','10000','01111'],
    D: ['11110','10001','10001','10001','10001','10001','11110'],
    E: ['11111','10000','10000','11110','10000','10000','11111'],
    F: ['11111','10000','10000','11110','10000','10000','10000'],
    G: ['01111','10000','10000','10111','10001','10001','01111'],
    H: ['10001','10001','10001','11111','10001','10001','10001'],
    I: ['01110','00100','00100','00100','00100','00100','01110'],
    J: ['00111','00010','00010','00010','10010','10010','01100'],
    K: ['10001','10010','10100','11000','10100','10010','10001'],
    L: ['10000','10000','10000','10000','10000','10000','11111'],
    M: ['10001','11011','10101','10101','10001','10001','10001'],
    N: ['10001','11001','10101','10011','10001','10001','10001'],
    O: ['01110','10001','10001','10001','10001','10001','01110'],
    P: ['11110','10001','10001','11110','10000','10000','10000'],
    Q: ['01110','10001','10001','10001','10101','10010','01101'],
    R: ['11110','10001','10001','11110','10100','10010','10001'],
    S: ['01111','10000','10000','01110','00001','00001','11110'],
    T: ['11111','00100','00100','00100','00100','00100','00100'],
    U: ['10001','10001','10001','10001','10001','10001','01110'],
    V: ['10001','10001','10001','10001','10001','01010','00100'],
    W: ['10001','10001','10001','10101','10101','11011','10001'],
    X: ['10001','10001','01010','00100','01010','10001','10001'],
    Y: ['10001','10001','01010','00100','00100','00100','00100'],
    Z: ['11111','00001','00010','00100','01000','10000','11111'],
    '0': ['01110','10011','10101','10101','11001','10001','01110'],
    '1': ['00100','01100','00100','00100','00100','00100','01110'],
    '2': ['01110','10001','00001','00110','01000','10000','11111'],
    '3': ['11110','00001','00001','01110','00001','00001','11110'],
    '4': ['00010','00110','01010','10010','11111','00010','00010'],
    '5': ['11111','10000','10000','11110','00001','00001','11110'],
    '6': ['01110','10000','10000','11110','10001','10001','01110'],
    '7': ['11111','00001','00010','00100','01000','01000','01000'],
    '8': ['01110','10001','10001','01110','10001','10001','01110'],
    '9': ['01110','10001','10001','01111','00001','00001','01110'],
    '!': ['00100','00100','00100','00100','00100','00000','00100'],
    '?': ['01110','10001','00010','00100','00100','00000','00100'],
    '.': ['00000','00000','00000','00000','00000','00100','00100'],
    ',': ['00000','00000','00000','00000','00000','00100','01000'],
    '-': ['00000','00000','00000','11111','00000','00000','00000'],
    '=': ['00000','00000','11111','00000','11111','00000','00000'],
    '+': ['00000','00100','00100','11111','00100','00100','00000'],
    '/': ['00001','00010','00100','00100','01000','10000','00000'],
    ':': ['00000','00100','00100','00000','00100','00100','00000'],
    '#': ['01010','11111','01010','01010','11111','01010','00000'],
    '%': ['11001','11010','00100','00100','01011','10011','00000'],
    '~': ['00000','01101','10010','00000','00000','00000','00000'],
    'x': ['00000','00000','10001','01010','00100','01010','10001'],
    '>': ['10000','01000','00100','00010','00100','01000','10000'],
    '<': ['00001','00010','00100','01000','00100','00010','00001'],
    '_': ['00000','00000','00000','00000','00000','00000','11111'],
    "'": ['00100','00100','00000','00000','00000','00000','00000'],
    '*': ['00100','10101','01110','11111','01110','10101','00000'],
    '\u00b7': ['00000','00000','00000','00100','00000','00000','00000']
  };
  var microCache = {};
  function micro(str, col, pill) {
    var key = (pill ? '1' : '0') + col + '|' + str; if (microCache[key]) return microCache[key];
    str = String(str).toUpperCase().replace(/X(?=\s|\d)/g, 'x');
    var padX = pill ? 2 : 0, padY = pill ? 1 : 0;
    var tw = Math.max(1, str.length * 6 - 1), w = tw + padX * 2 + 1, h = 7 + padY * 2 + 1;
    var c = canvas(w, h), x = c.getContext('2d');
    if (pill) {
      x.fillStyle = 'rgba(5, 7, 15, 0.86)';
      x.fillRect(0, 0, w, h);
    }
    var fg = PAL[col] || col;
    for (var i = 0; i < str.length; i++) {
      var g = MF57[str[i]] || MF57[str[i].toUpperCase()]; if (!g) continue;
      for (var r = 0; r < 7; r++) for (var q = 0; q < 5; q++) if (g[r][q] === '1') {
        x.fillStyle = '#05070f';
        x.fillRect(padX + i * 6 + q + 1, padY + r + 1, 1, 1);
        x.fillStyle = fg;
        x.fillRect(padX + i * 6 + q, padY + r, 1, 1);
      }
    }
    microCache[key] = c; return c;
  }

  /* big text: Press Start 2P with crisp 1px dark drop shadow */
  var bigCache = {}, bigReady = false;
  if (document.fonts && document.fonts.load) {
    document.fonts.load('8px PS2P').then(function () { bigReady = true; bigCache = {}; }, function () {});
  }
  function big(str, col, size) {
    size = size || 8;
    var key = size + col + '|' + str; if (bigReady && bigCache[key]) return bigCache[key];
    if (!bigReady) return micro(str, col, true);
    var w = str.length * size + 4, h = size + 3;
    var tmp = canvas(w, h), tx = tmp.getContext('2d', { willReadFrequently: true });
    tx.font = size + 'px PS2P'; tx.textBaseline = 'top'; tx.fillStyle = '#ffffff'; tx.fillText(str, 0, 0);
    var im = tx.getImageData(0, 0, w, h), d = im.data;
    var c = canvas(w, h), x = c.getContext('2d');
    var fg = PAL[col] || col;
    for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) {
      if (d[(py * w + px) * 4 + 3] > 110) {
        x.fillStyle = '#05070f';
        x.fillRect(px + 1, py + 1, 1, 1);
      }
    }
    for (var py2 = 0; py2 < h; py2++) for (var px2 = 0; px2 < w; px2++) {
      if (d[(py2 * w + px2) * 4 + 3] > 110) {
        x.fillStyle = fg;
        x.fillRect(px2, py2, 1, 1);
      }
    }
    bigCache[key] = c; return c;
  }

  /* ------------------------------------------------------------- dither -- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var holes = [];
  (function () {
    for (var n = 0; n <= 16; n++) {
      var c = canvas(4, 4), x = c.getContext('2d'); x.fillStyle = '#000';
      for (var i = 0; i < 16; i++) if (BAYER[i] < n) x.fillRect(i % 4, (i / 4) | 0, 1, 1);
      holes.push(c);
    }
  })();
  var scratch = canvas(128, 128), sx = scratch.getContext('2d'), holePat = [];
  function dissolve(ctx, spr, x, y, vis) {
    if (vis >= 1) { ctx.drawImage(spr, x, y); return; }
    if (vis <= 0) return;
    var n = 16 - Math.round(vis * 16), w = spr.width, h = spr.height;
    if (w > scratch.width || h > scratch.height) { scratch.width = Math.max(w, scratch.width); scratch.height = Math.max(h, scratch.height); holePat = []; }
    if (!holePat[n]) holePat[n] = sx.createPattern(holes[n], 'repeat');
    sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, w, h); sx.drawImage(spr, 0, 0);
    sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = holePat[n]; sx.fillRect(0, 0, w, h);
    ctx.drawImage(scratch, 0, 0, w, h, x, y, w, h);
  }
  var fillPat = {};
  function ditherRect(ctx, x, y, w, h, col, amt) {
    var n = Math.max(0, Math.min(16, Math.round(amt * 16))); if (!n) return;
    var key = col + n, p = fillPat[key];
    if (!p) {
      var c = canvas(4, 4), cx = c.getContext('2d'); cx.fillStyle = PAL[col] || col;
      for (var i = 0; i < 16; i++) if (BAYER[i] < n) cx.fillRect(i % 4, (i / 4) | 0, 1, 1);
      p = fillPat[key] = ctx.createPattern(c, 'repeat');
    }
    ctx.fillStyle = p; ctx.fillRect(x, y, w, h);
  }

  /* -------------------------------------------------------------- noise -- */
  function hash(x, y, s) {
    var h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function vnoise(x, y, s, px, py) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var x1 = xi + 1, y1 = yi + 1;
    if (px) { xi = ((xi % px) + px) % px; x1 = ((x1 % px) + px) % px; }
    if (py) { yi = ((yi % py) + py) % py; y1 = ((y1 % py) + py) % py; }
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(x1, yi, s), c = hash(xi, y1, s), d = hash(x1, y1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, px, py) {
    return vnoise(x, y, s, px, py) * 0.62 + vnoise(x * 2, y * 2, s + 7, px ? px * 2 : 0, py ? py * 2 : 0) * 0.38;
  }
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  /* -------------------------------------------- hi-bit planets + rimglow -- */
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  var LX = -0.55, LY = -0.6, LZ = 0.58;
  function planet(spec, rot) {
    var r = spec.r, size = r * 2 + 3;
    if (!spec.cv || spec.cv.width !== size) {
      spec.cv = canvas(size, size); spec.cx = spec.cv.getContext('2d'); spec.im = spec.cx.createImageData(size, size);
      spec.A = spec.a.map(function (c) { return rgb(PAL[c] || c); });
      spec.B = (spec.b || spec.a).map(function (c) { return rgb(PAL[c] || c); });
      spec.rim = spec.A[3];
    }
    var d = spec.im.data, fq = spec.freq || 4, per = fq * 2, i = 0, rad = r + 1;
    for (var y = -rad; y <= rad; y++) for (var x = -rad; x <= rad; x++, i += 4) {
      var q = x * x + y * y;
      if (q > (r + 1.4) * (r + 1.4)) { d[i + 3] = 0; continue; }
      if (q > r * r + r * 0.55) {
        // subtle lit-side atmospheric halo
        var ldot = (x / rad) * LX + (y / rad) * LY;
        var bth = (BAYER[((y + 64) & 3) * 4 + ((x + 64) & 3)] + 0.5) / 16;
        if (ldot > 0.08 && bth < ldot * 0.75) {
          d[i] = spec.rim[0]; d[i + 1] = spec.rim[1]; d[i + 2] = spec.rim[2]; d[i + 3] = 210;
        } else { d[i + 3] = 0; }
        continue;
      }
      var nx = x / r, ny = y / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      var lam = Math.max(0, nx * LX + ny * LY + nz * LZ) * 1.28 + 0.06;
      var u = (Math.atan2(nx, nz) / Math.PI + 1 + rot) * fq, v = (Math.asin(Math.max(-1, Math.min(1, ny))) / Math.PI + 0.5) * fq;
      var f, land;
      if (spec.kind === 'gas') { f = Math.sin(v * 5.4 + vnoise(u, v, spec.seed, per, 0) * 2.4) * 0.5 + 0.5; land = f > 0.55; lam += (f - 0.5) * 0.2; }
      else if (spec.kind === 'rock') { f = fbm(u * 1.5, v * 1.5, spec.seed, per * 1.5 | 0, 0); land = f > 0.58; if (land) lam -= 0.2; }
      else { f = fbm(u, v, spec.seed, per, 0); land = f > 0.52; }
      // Fresnel rim boost on sunlit limb
      if (nz < 0.36 && lam > 0.48) lam += 0.22;
      var th = (BAYER[((y + 64) & 3) * 4 + ((x + 64) & 3)] + 0.5) / 16 - 0.5;
      var idx = Math.floor(lam * 4 + th * 0.82); idx = idx < 0 ? 0 : idx > 3 ? 3 : idx;
      var c = land ? spec.B[idx] : spec.A[idx];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    spec.cx.putImageData(spec.im, 0, 0);
    return spec.cv;
  }

  /* ------------------------------------- 32x32 bespoke operator avatars -- */
  var PRESETS = {
    'vlad': { V: 'P', v: 'p', H: 'V', S: 's', Z: 'S', T: 'L', t: 'G', C: 'u', ant: 3 }, // Founder: royal purple visor + lime crest
    'susan': { V: 'M', v: 'm', H: 'K', S: 'w', Z: 's', T: 'Y', t: 'y', C: 'p', ant: 1 }, // Commercial Strategy: magenta-gold twin array
    'josh': { V: 'c', v: 't', H: 'C', S: 's', Z: 'S', T: 'L', t: 'G', C: 'N', ant: 2 }, // Ops & Process: cyan-lime tactical HUD
    'ilya': { V: 'L', v: 'G', H: 'w', S: 'S', Z: 'g', T: 'c', t: 't', C: 'n', ant: 1 }, // Tech & Implementations: matrix-lime dual comms
    'stephanie': { V: 'O', v: 'R', H: 'W', S: 'w', Z: 's', T: 'M', t: 'm', C: 'x', ant: 0 } // Marketing & BD: sunset-coral broadcast star
  };

  function avatar(cv, name) {
    cv.width = 32; cv.height = 32;
    var low = String(name || '').toLowerCase(), cfg = null;
    Object.keys(PRESETS).forEach(function (k) { if (low.indexOf(k) !== -1) cfg = PRESETS[k]; });
    if (!cfg) {
      var s = 0, i; for (i = 0; i < low.length; i++) s = (s * 31 + low.charCodeAt(i)) >>> 0;
      var R = rng(s + 99);
      var vList = [['c','t','C'], ['Y','O','W'], ['M','m','K'], ['P','p','V'], ['L','G','w']];
      var sList = [['w','s'], ['s','S']];
      var tList = [['L','G'], ['Y','y'], ['c','t'], ['M','m'], ['O','o']];
      var vp = vList[(R() * vList.length) | 0], sp = sList[(R() * sList.length) | 0], tp = tList[(R() * tList.length) | 0];
      cfg = { V: vp[0], v: vp[1], H: vp[2], S: sp[0], Z: sp[1], T: tp[0], t: tp[1], C: 'N', ant: (R() * 3) | 0 };
    }
    var antRows;
    if (cfg.ant === 3) {
      // Top-hat command crest (Founder signature)
      antRows = [
        '...........kkkkkkkkkk...........',
        '...........kupPPPPPVk...........',
        '...........kupPPYPpVk...........',
        '...........kLLLLLLGGk...........',
        '.........kkppppppppppkk.........'
      ];
    } else if (cfg.ant === 1) {
      // Twin comms array
      antRows = [
        '.......kk..............kk.......',
        '......kTTk............kTTk......',
        '.......gg..............gg.......',
        '.......gg...kkkkkkkk...gg.......',
        '......kggkkSSSSSSSSSSkkggk......'
      ];
    } else if (cfg.ant === 2) {
      // Tactical radar mast + HUD sensor
      antRows = [
        '...................kkkk.........',
        '..................kTTTTk........',
        '...................kggk.........',
        '..........kkkkkkkkkkggkk........',
        '........kkSSSSSSSSSSSSSSkk......'
      ];
    } else {
      // Central star beacon
      antRows = [
        '..............kkkk..............',
        '.............kTTTTk.............',
        '..............kggk..............',
        '..........kkkkkggkkkkk..........',
        '........kkSSSSSSSSSSSSkk........'
      ];
    }
    var bodyRows = [
      '.......kSSSSSSSSSSSSSSZZk.......',
      '......kSSSSkkkkkkkkkkSSZZk......',
      '.....kSSSkkHHHHHHHHVVkkSZZk.....',
      '....kSSSkHHwwwwVVVVVVvvkkZZk....',
      '....kSSkHHwwVVVVVVVVVVvvkZZk....',
      '....kSSkHVVVVVVVVVVVVvvvkZZk....',
      '....kSSkVVVVVVVVVVVVvvvvkkZk....',
      '....kSSkvvvVVVVVVVVvvvvvkZZk....',
      '....kSSkkvvvvvvvvvvvvvvkkZZk....',
      '.....kSSSkkkkkkkkkkkkkkSZZk.....',
      '.....kSSSSSSTTTTTTTTSSSSZZk.....',
      '......kSSSSSSttttttSSSSZZk......',
      '.......kkSSSSSSSSSSSSZZkk.......',
      '.....kkkkTTTTTTTTTTTTttkkkk.....',
      '...kkSSSSkkCCCCCCCCCCkkSSSSkk...',
      '..kSSSSSSkCCCCCTTTTCCCCkSSSSZZk.',
      '.kSSSSSSSkCCCCCTTTTCCCCkSSSSSZZk',
      '.kSSSSSSSkCCCCCCCCCCCCCCkSSSSZZk',
      '.kSSSSSSkCCCCCCCCCCCCCCCCkSSSZZk',
      '.kSSSSSSkCCCLLCCCCCCYYCCCkSSSZZk',
      '.kZZZZZZkCCCCCCCCCCCCCCCCkZZZZZk',
      '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..'
    ];
    var padTop = ['................................', '................................'];
    var padBot = ['................................', '................................', '................................'];
    var rows = padTop.concat(antRows, bodyRows, padBot);
    var x = cv.getContext('2d'); x.clearRect(0, 0, 32, 32);
    x.drawImage(mk(rows, cfg), 0, 0);
  }

  ACE.gfx = {
    PAL: PAL, SPR: SPR, STATION: STATION, BAYER: BAYER, canvas: canvas, mk: mk, flipH: flipH, rotCW: rotCW, scaleUp: scaleUp,
    micro: micro, big: big, dissolve: dissolve, ditherRect: ditherRect, hash: hash, vnoise: vnoise, fbm: fbm, rng: rng,
    planet: planet, avatar: avatar, rgb: rgb
  };
})();
