'use strict';
// =====================================================================
//  GALAXY DEFENDERS — pixel art. Each sprite is rows of letters; each letter is a color.
//  sym(...) sprites are drawn as their left half (plus the middle column) and mirrored.
// =====================================================================

const PAL = {
  W: '#ffffff', w: '#c8d0e0', g: '#7a8296', k: '#262b40', K: '#10121e',
  B: '#3b7dff', b: '#8fd3ff', N: '#1d2f8a', C: '#36f0ff',
  R: '#ff3b4e', r: '#ff8fa3', D: '#8a1830',
  O: '#ff9a2e', o: '#ffc98a', Y: '#ffe44d', y: '#fff3a8',
  G: '#3ee06b', L: '#a6ff4d', T: '#1d8f4e',
  P: '#a84dff', p: '#d9a6ff', V: '#5a1fa8',
  M: '#ff4df0', m: '#ffa6f7',
  S: '#5b6b8f', s: '#94a3c7',
  E: '#ff2a2a',
};

function sym(rows) { return rows.map(r => r + r.slice(0, -1).split('').reverse().join('')); }

/** Turns a letter sprite into a canvas. swap = { letter: otherLetter } recolors it. */
function makeSprite(rows, swap = null, solid = null) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    let ch = rows[y][x];
    if (ch === '.' || ch === ' ') continue;
    if (swap && swap[ch]) ch = swap[ch];
    g.fillStyle = solid || PAL[ch] || '#f0f';
    g.fillRect(x, y, 1, 1);
  }
  return c;
}
/** A sprite plus its white "just got hit" version. */
function spr(rows, swap) { return { img: makeSprite(rows, swap), flash: makeSprite(rows, null, '#fff'), w: rows[0].length, h: rows.length }; }
function drawSpr(s, x, y, flash = false, scale = 1) {
  const w = s.w * scale, h = s.h * scale;
  bx.drawImage(flash ? s.flash : s.img, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}

// ---------------------------------------------------------------- player ships (13 wide)
const SHIP_ART = {
  falcon: sym([
    '......W',
    '.....bW',
    '.....bB',
    '....bBB',
    '....BBC',
    '...BBBC',
    '.R.BBBB',
    '.RBBBww',
    'RRBBwBB',
    'RBBB.BB',
    'RB...NB',
    '.....N.',
  ]),
  hornet: sym([
    '......Y',
    '......Y',
    '.....YY',
    '.....YC',
    '....kYC',
    'Y...YYY',
    'YY.YYkY',
    'YYYYYkY',
    '.YYYkkY',
    '..YY.kY',
    '...Y..k',
  ]),
  titan: sym([
    '.....GGG',
    '....GLLL',
    '...GGLCC',
    '.GGGGLCC',
    'GGLGGGGG',
    'GLLGTGGG',
    'GGLGTTGG',
    'GGGGTGGG',
    'GTGGGGTT',
    'GT.GGG..',
    'GT..TT..',
  ]),
  comet: sym([
    '......M',
    '.....MM',
    '.....mM',
    '....MmM',
    '...PMMC',
    '..PPMMC',
    '.PPMMMM',
    'PPMMPMM',
    'PM.PPMM',
    'P...PMP',
    '.....P.',
  ]),
};
// Second-player colors, used when both players pick the same ship.
const SHIP_SWAP2 = {
  falcon: { B: 'R', b: 'r', N: 'D', R: 'B', C: 'Y' },
  hornet: { Y: 'O', C: 'b' },
  titan: { G: 'S', L: 's', T: 'k', C: 'O' },
  comet: { M: 'C', m: 'b', P: 'N', C: 'Y' },
};

// ---------------------------------------------------------------- aliens (2 animation frames each)
const ALIEN_ART = {
  bug: [[
    '..G.....G..',
    '...G...G...',
    '..GGGGGGG..',
    '.GG.GGG.GG.',
    'GGGGGGGGGGG',
    'G.GGGGGGG.G',
    'G.G.....G.G',
    '...GG.GG...',
  ], [
    '..G.....G..',
    'G..G...G..G',
    'G.GGGGGGG.G',
    'GGG.GGG.GGG',
    'GGGGGGGGGGG',
    '.GGGGGGGGG.',
    '..G.....G..',
    '.G.......G.',
  ]],
  squid: [[
    '...MM...',
    '..MMMM..',
    '.MMMMMM.',
    'MM.MM.MM',
    'MMMMMMMM',
    '..M..M..',
    '.M.MM.M.',
    'M.M..M.M',
  ], [
    '...MM...',
    '..MMMM..',
    '.MMMMMM.',
    'MM.MM.MM',
    'MMMMMMMM',
    '.M.MM.M.',
    'M......M',
    '.M....M.',
  ]],
  crab: [[
    '....OOOO....',
    '.OOOOOOOOOO.',
    'OOOOOOOOOOOO',
    'OOO..OO..OOO',
    'OOOOOOOOOOOO',
    '...OO..OO...',
    '..OO.OO.OO..',
    'OO........OO',
  ], [
    '....OOOO....',
    '.OOOOOOOOOO.',
    'OOOOOOOOOOOO',
    'OOO..OO..OOO',
    'OOOOOOOOOOOO',
    '..OOO..OOO..',
    '.OO..OO..OO.',
    '..OO....OO..',
  ]],
  armor: [sym([
    '...SSs',
    '..SwwW',
    '.SSSSS',
    'SSCCCS',
    'SSSSSS',
    '.SgSgS',
    '..S...',
    '.SS...',
  ]), sym([
    '...SSs',
    '..SwwW',
    '.SSSSS',
    'SSCCCS',
    'SSSSSS',
    '.SgSgS',
    '.S....',
    '..S...',
  ])],
  diver: [sym([
    '.b....',
    '..b...',
    '...YYY',
    '..YkYY',
    '.YYYYY',
    'Ykkkkk',
    '.YYYYY',
    '..kkkk',
    '...Y..',
  ]), sym([
    '......',
    'bb....',
    '..bYYY',
    '..YkYY',
    '.YYYYY',
    'Ykkkkk',
    '.YYYYY',
    '..kkkk',
    '....Y.',
  ])],
};

// ---------------------------------------------------------------- bosses
const BOSS_ART = {
  saucer: sym([
    '..............bbbbb',
    '............bbCCCCC',
    '...........bCCWWCCC',
    '...........bCCCCCCC',
    '......gggggggggggggg'.slice(0, 19),
    '...ggwwwwwwwwwwwwww',
    '.ggwwYwwwwYwwwwYwww',
    'gwwwwwwwwwwwwwwwwww',
    'gggggggggggggggggggg'.slice(0, 19),
    '.kkkSSSSSSSSSSSSSSS',
    '...kkkkSSSSSSSSSSSS',
    '......kkkkkkkkkkkkk',
    '.........R...R....R',
    '........R...R....R.',
  ]),
  crabking: sym([
    '.OO................',
    'OOOO...............',
    'OO.OO..............',
    'OO..O.......OOOOOOO',
    'OOO.O.....OOOOOOOOO',
    '.OOO.....OOOOOOOOOO',
    '..OO....OOOOWkOOOOO',
    '...OO..OOOOOkkOOOOO',
    '....OOOOOOOOOOOOOOO',
    '.....OOOOOOOOOOOOOO',
    '........OOOOOOOOOOO',
    '.......OO..OO..OOOO',
    '......OO..OO..OO...',
    '.....OO..OO...OO...',
    '.....O...O....O....',
  ]),
  eye: sym([
    '.........PPPPPPPPPP',
    '......PPPppppppppPP',
    '....PPpppwwwwwwwwww',
    '...PppwwwwwwwwwwwWW',
    '..PpwwwwwwwRRRRRRRR',
    '.PpwwwwwwRRRRRRRRRR',
    '.PpwwwwwRRRRKKKKKKK',
    'PpwwwwwwRRRKKKKKKKK',
    'PpwwwwwwRRRKKKWWKKK',
    'PpwwwwwwRRRKKKKKKKK',
    '.PpwwwwwRRRRKKKKKKK',
    '.PpwwwwwwRRRRRRRRRR',
    '..PpwwwwwwwRRRRRRRR',
    '...PppwwwwwwwwwwwWW',
    '....PPpppwwwwwwwwww',
    '......PPPppppppppPP',
    '..P.P....PPPPPPPPPP',
    '.P...P....P....P...',
    'P.....P....P....P..',
  ]),
  queen: sym([
    '...........Y...Y...',
    '............Y.Y....',
    '.........YYYYYYYYYY',
    '..bbb...YYkYYYYYkYY',
    '.bbbbb..YYYYYYYYYYY',
    'bbbbbbb..YYYYYYYYYY',
    '.bbbbbbb.kkkkkkkkkk',
    '..bbbbbbbYYYYYYYYYY',
    '...bbbbb.kkkkkkkkkk',
    '.........YYYYYYYYYY',
    '..........kkkkkkkkk',
    '..........YYYYYYYYY',
    '...........kkkkkkkk',
    '............YYYYYYY',
    '..............kkkkk',
    '................YYY',
    '..................k',
  ]),
  dread: sym([
    '..................R',
    '.................gR',
    '................ggg',
    '...............gwwg',
    '..............gwSSw',
    '.....R.......gwSCCS',
    '.....g......gwSSCCS',
    '....gwg....gwSSSSSS',
    '...gwSwg..gwSSkkSSS',
    '..gwSSSwggwSSkRRkSS',
    '.gwSSSSSwwSSSkRRkSS',
    'gwSSSSSSSSSSSSkkSSS',
    'gSSkSSkSSSSSSSSSSSS',
    'gSSSSSSSSSkSSSSkSSS',
    '.ggSSSSSSkk.SSkk.SS',
    '...ggSSSk...Sk...SS',
    '.....gg.....O....OO',
    '............Y....YY',
  ]),
};

// ---------------------------------------------------------------- build all sprites
const SPR = { ship: {}, ship2: {}, alien: {}, boss: {} };
for (const id in SHIP_ART) { SPR.ship[id] = spr(SHIP_ART[id]); SPR.ship2[id] = spr(SHIP_ART[id], SHIP_SWAP2[id]); }
for (const id in ALIEN_ART) SPR.alien[id] = ALIEN_ART[id].map(f => spr(f));
for (const id in BOSS_ART) SPR.boss[id] = spr(BOSS_ART[id]);

// ---------------------------------------------------------------- planets for the backgrounds
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/** A dithered pixel planet. colors = [dark, mid, light], ring = optional ring color. */
function makePlanet(r, colors, ring = null, bands = false) {
  const size = r * 2 + (ring ? r * 2 : 4);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const ringPix = (front) => {
    if (!ring) return;
    g.fillStyle = ring;
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      const x = Math.cos(a) * r * 1.8, y = Math.sin(a) * r * 0.35;
      if ((y > 0) !== front) continue;
      g.fillRect(Math.round(cx + x), Math.round(cy + y - x * 0.2), 1, 1);
    }
  };
  ringPix(false);
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y;
    if (d > r * r) continue;
    // light from the top-left
    let l = 1 - ((x + r * 0.45) ** 2 + (y + r * 0.45) ** 2) / (r * r * 2.2);
    if (bands) l += Math.sin(y * 0.6) * 0.12;
    const th = (BAYER[(y + 64) & 3][(x + 64) & 3] + 0.5) / 16;
    const lv = l * 2.2;
    const idx = lv > 1 + th ? 2 : lv > th ? 1 : 0;
    g.fillStyle = colors[idx];
    g.fillRect(cx + x, cy + y, 1, 1);
  }
  ringPix(true);
  return c;
}
