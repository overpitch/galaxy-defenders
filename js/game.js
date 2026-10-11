'use strict';
// =====================================================================
//  GALAXY DEFENDERS — the game itself: ships, aliens, bosses, levels
// =====================================================================

// ---------------------------------------------------------------- the four starfighters
const SHIPS = [
  { id: 'falcon', name: 'FALCON', desc: 'TWIN BLASTERS', speed: 1.6, hp: 6, cool: 11, bars: [3, 3, 3],
    fire: (p, g) => { g.pshot(p, p.x - 4, p.y - 4, 0, -4.5, 1, 'twin'); g.pshot(p, p.x + 4, p.y - 4, 0, -4.5, 1, 'twin'); sfx.shoot(); } },
  { id: 'hornet', name: 'HORNET', desc: 'RAPID FIRE', speed: 2.15, hp: 5, cool: 6, bars: [5, 3, 2],
    fire: (p, g) => { g.pshot(p, p.x + (p.alt ^= 1 ? 1 : -1), p.y - 6, 0, -5.2, 1, 'rapid'); sfx.shoot(); } },
  { id: 'titan', name: 'TITAN', desc: 'TRIPLE SPREAD', speed: 1.15, hp: 9, cool: 17, bars: [1, 4, 5],
    fire: (p, g) => { for (const vx of [-0.9, 0, 0.9]) g.pshot(p, p.x + vx * 3, p.y - 5, vx, -4.2, 1, 'spread'); sfx.shoot(); } },
  { id: 'comet', name: 'COMET', desc: 'PIERCING LASER', speed: 1.75, hp: 6, cool: 20, bars: [4, 5, 3],
    fire: (p, g) => { g.pshot(p, p.x, p.y - 8, 0, -6, 3, 'pierce', true); sfx.laser(); } },
];
const SHIP_BY_ID = Object.fromEntries(SHIPS.map(s => [s.id, s]));

// ---------------------------------------------------------------- aliens
const ALIENS = {
  bug:   { hp: 1, score: 10, color: ['#3ee06b', '#a6ff4d'] },
  squid: { hp: 1, score: 20, color: ['#ff4df0', '#ffa6f7'] },
  crab:  { hp: 2, score: 30, color: ['#ff9a2e', '#ffe44d'] },
  armor: { hp: 4, score: 50, color: ['#94a3c7', '#36f0ff'] },
  diver: { hp: 1, score: 40, color: ['#ffe44d', '#8fd3ff'] },
};

// ---------------------------------------------------------------- the five levels
const LEVELS = [
  { name: 'EARTH ORBIT', sky: '#070b22', planet: [26, ['#123a8a', '#2f74d6', '#7fd0ff'], null, false, 250, 70],
    cols: 8, speed: 0.30, fire: 78, dive: 0, boss: 'saucer',
    waves: [['squid', 'bug', 'bug'], ['squid', 'bug', 'bug', 'bug'], ['crab', 'squid', 'bug', 'bug']] },
  { name: 'RED PLANET', sky: '#1a0710', planet: [22, ['#6b1a12', '#c2452a', '#ff9a6b'], null, false, 60, 60],
    cols: 9, speed: 0.34, fire: 68, dive: 380, boss: 'crabking',
    waves: [['crab', 'squid', 'bug', 'bug'], ['diver', 'crab', 'bug', 'bug'], ['diver', 'squid', 'crab', 'bug', 'bug']] },
  { name: 'ICE MOONS', sky: '#04141c', planet: [30, ['#2a5a7a', '#7fb8d6', '#e6f6ff'], '#b8e8ff', false, 240, 55],
    cols: 9, speed: 0.38, fire: 60, dive: 320, boss: 'eye',
    waves: [['armor', 'squid', 'bug', 'bug'], ['diver', 'armor', 'crab', 'bug'], ['armor', 'diver', 'crab', 'squid', 'bug']] },
  { name: 'HIVE NEBULA', sky: '#120a02', planet: [28, ['#6b4a00', '#d69a1a', '#ffe48a'], null, true, 70, 75],
    cols: 10, speed: 0.42, fire: 52, dive: 240, boss: 'queen',
    waves: [['diver', 'diver', 'crab', 'bug', 'bug'], ['armor', 'diver', 'squid', 'squid', 'bug'], ['diver', 'armor', 'armor', 'crab', 'bug']] },
  { name: 'DARK STAR', sky: '#0b0414', planet: [34, ['#2a0a3a', '#6a1f8a', '#c86bff'], '#ff6b9a', true, 230, 65],
    cols: 10, speed: 0.46, fire: 50, dive: 200, boss: 'dread',
    waves: [['armor', 'diver', 'crab', 'squid', 'bug'], ['armor', 'armor', 'diver', 'diver', 'crab'], ['diver', 'armor', 'armor', 'crab', 'squid', 'bug']] },
];
const PLANETS = LEVELS.map(L => makePlanet(L.planet[0], L.planet[1], L.planet[2], L.planet[3]));

const SPX = 22, SPY = 13;                     // gap between aliens in the formation
const TOP = 22;                               // where the formation starts
const LAND_Y = 171;                           // aliens that reach this line have landed
const PY_MIN = 116, PY_MAX = 168;             // how far up and down ships can fly

// ---------------------------------------------------------------- bosses
// Each boss's think() runs every frame. b.t counts frames; b.p2 is true once it's below half health.
const BOSSES = {
  saucer: { name: 'MEGA SAUCER', hp: 170, color: ['#c8d0e0', '#36f0ff', '#ffe44d'],
    think(b, g) {
      b.x = 160 + Math.sin(b.t / 90) * 95;
      if (b.t % (b.p2 ? 70 : 90) === 0) g.spreadAt(b.x, b.y + 10, b.p2 ? 5 : 3, b.p2 ? 0.9 : 0.6, 1.3);
      if (b.t % 240 === 120) { g.freeDiver(b.x - 24, b.y + 8); g.freeDiver(b.x + 24, b.y + 8); }
    } },
  crabking: { name: 'CRAB KING', hp: 240, color: ['#ff9a2e', '#ffe44d', '#ffffff'],
    think(b, g) {
      if (!b.laser) b.x = 160 + Math.sin(b.t / 110) * 95;
      const every = b.p2 ? 34 : 46;
      if (!b.laser && b.t % every === 0) {
        b.claw = -(b.claw || 1);
        g.aimed(b.x + b.claw * 30, b.y - 6, 1.7);
        if (b.p2) g.aimed(b.x - b.claw * 30, b.y - 6, 1.4);
      }
      if (b.t % (b.p2 ? 260 : 330) === 200) g.startLaser(b, 0, 14, 8);
    } },
  eye: { name: 'THE EYE', hp: 300, color: ['#ff3b4e', '#ffffff', '#d9a6ff'],
    think(b, g) {
      b.x = 160 + Math.sin(b.t / 100) * 95;
      b.y = b.homeY + Math.sin(b.t / 50) * 8;
      const cyc = b.t % 360;
      if (cyc < 240) {
        if (cyc % (b.p2 ? 80 : 110) === 0) g.ring(b.x, b.y, b.p2 ? 16 : 13, 1.05, b.t * 0.1);
      } else if (cyc % 7 === 0) {
        // the spiral
        const a = b.t * 0.13;
        g.eshot(b.x, b.y, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 'orb');
        g.eshot(b.x, b.y, Math.cos(a + Math.PI) * 1.3, Math.sin(a + Math.PI) * 1.3, 'orb');
      }
    } },
  queen: { name: 'HIVE QUEEN', hp: 330, color: ['#ffe44d', '#8fd3ff', '#262b40'],
    think(b, g) {
      b.x = 160 + Math.sin(b.t / 120) * 100;
      if (b.t % (b.p2 ? 170 : 230) === 60) for (const dx of [-24, 24]) g.freeDiver(b.x + dx, b.y + 10);
      if (b.t % 80 === 0) g.spreadAt(b.x, b.y + 18, 5, 0.9, 1.3, Math.PI / 2);
      if (b.p2 && b.t % 80 === 40) for (const dx of [-14, 14]) g.aimed(b.x + dx, b.y, 1.8);
    } },
  dread: { name: 'DREADNOUGHT', hp: 460, color: ['#94a3c7', '#ff3b4e', '#ffe44d'],
    think(b, g) {
      if (!b.laser) b.x = 160 + Math.sin(b.t / 130) * 90;
      if (!b.laser && b.t % 62 === 0) g.spreadAt(b.x, b.y + 16, 5, 0.7, 1.5);
      if (!b.laser && b.t % 90 === 45) for (const dx of [-50, 50]) g.aimed(b.x + dx, b.y + 4, 1.7);
      if (b.p2) {
        if (b.t % 300 === 150) g.startLaser(b, 0, 18, 10);
        if (b.t % 160 === 80) g.ring(b.x, b.y, 12, 1.0, b.t);
        if (b.t % 380 === 20) { g.freeDiver(b.x - 30, b.y); g.freeDiver(b.x + 30, b.y); }
      }
    } },
};

// =====================================================================
class Game {
  /** players: [{ dev: 'pad0' | 'kb1' | null(bot), ship: 'falcon' }], level: 0-4, loop: 0+ (harder each loop) */
  constructor(players, level = 0, loop = 0) {
    this.level = level; this.loop = loop;
    this.score = 0;
    this.players = players.map((p, i) => this.makePlayer(p, i, players.length));
    // both on the same ship? the second one gets other colors
    if (this.players.length === 2 && this.players[0].ship.id === this.players[1].ship.id) this.players[1].alt2 = true;
    this.pb = []; this.eb = []; this.enemies = []; this.parts = []; this.pops = [];
    this.boss = null; this.beams = [];
    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push({ x: rand(0, W), y: rand(0, H), z: pick([1, 1, 1, 2, 2, 3]) });
    this.planetY = 0;
    this.frame = 0;
    this.hurtLog = {};
    this.msg = null;
    this.over = null;          // set when the game ends: 'landed', 'defeated' or 'victory'
    this.marchN = 0; this.marchT = 0;
    this.startLevel(level);
  }

  makePlayer(p, i, n) {
    const ship = SHIP_BY_ID[p.ship];
    return { i, dev: p.dev, ship, x: n === 1 ? 160 : 115 + i * 90, y: 160, hp: ship.hp, maxHp: ship.hp,
      cool: 0, inv: 120, alive: true, tilt: 0, alt: 0, kills: 0, shots: 0, hits: 0 };
  }
  get nPlayers() { return this.players.length; }
  get L() { return LEVELS[this.level]; }
  get hard() { return 1 + this.loop * 0.25; }

  // ---------------------------------------------------------------- flow
  startLevel(n) {
    this.level = n;
    this.wave = 0;
    this.planetY = -60;
    this.setState('intro', 150);
    this.msg = { big: 'LEVEL ' + (n + 1 + this.loop * LEVELS.length), small: this.L.name, t: 150 };
  }
  setState(s, t = 0) { this.state = s; this.st = t; }

  startWave() {
    const L = this.L, rows = L.waves[this.wave];
    this.form = { ox: 160 - (L.cols - 1) * SPX / 2, oy: TOP - 90, dir: 1, drop: 0, total: 0 };
    this.enemies = [];
    rows.forEach((type, r) => {
      for (let c = 0; c < L.cols; c++) {
        this.enemies.push(this.makeEnemy(type, { c, r }));
        this.form.total++;
      }
    });
    this.fireT = 150; this.diveT = L.dive ? L.dive : 0;
    this.setState('wave');
    this.msg = { big: 'WAVE ' + (this.wave + 1), t: 90 };
  }
  makeEnemy(type, slot) {
    const A = ALIENS[type], s = SPR.alien[type][0];
    return { type, hp: Math.ceil(A.hp * (this.loop ? 1.5 : 1)), slot, x: 0, y: -20, w: s.w, h: s.h, state: slot ? 'form' : 'dive',
      flash: 0, vx: 0, vy: 0, shot: false, target: null };
  }

  /** inputs: one { ax, ay, fire } per player */
  update(inputs) {
    this.frame++;
    if (this.msg && --this.msg.t <= 0) this.msg = null;
    this.updateBackground();
    if (this.over) { this.updateEffects(); return; }

    this.players.forEach((p, i) => this.updatePlayer(p, inputs[i] || EMPTY));
    this.updateShots();

    switch (this.state) {
      case 'intro':
        if (--this.st <= 0) this.startWave();
        break;
      case 'wave':
        this.updateFormation();
        if (!this.enemies.length) {
          this.addScore(100 * (this.level + 1), 160, 80);
          this.healAll(1);
          sfx.clear();
          this.msg = { big: 'WAVE CLEAR!', t: 100 };
          this.setState('clear', 110);
        }
        break;
      case 'clear':
        if (--this.st <= 0) {
          this.wave++;
          if (this.wave < this.L.waves.length) this.startWave();
          else { this.setState('warn', 180); sfx.warn(); this.msg = { big: 'WARNING!', small: 'BOSS APPROACHING', t: 180, blink: true }; }
        }
        break;
      case 'warn':
        if (this.st % 60 === 0 && this.st > 0) sfx.warn();
        if (--this.st <= 0) this.spawnBoss();
        break;
      case 'boss':
        this.updateBoss();
        this.updateEnemies();
        break;
      case 'bossDead': {
        const b = this.boss;
        if (this.st % 6 === 0) { this.explode(b.x + rand(-b.w / 2, b.w / 2), b.y + rand(-b.h / 2, b.h / 2), b.def.color, 14); sfx.boom(); }
        this.updateEnemies();
        if (--this.st <= 0) {
          this.explode(b.x, b.y, b.def.color, 90, 3);
          sfx.bigboom();
          this.boss = null;
          this.addScore(1000 * (this.level + 1), b.x, b.y);
          this.setState('levelClear', 220);
          this.msg = { big: 'LEVEL CLEAR!', small: 'SHIPS REPAIRED', t: 200 };
          this.healAll(99);
          setTimeout(() => sfx.win(), 500);
        }
        break;
      }
      case 'levelClear':
        if (--this.st <= 0) {
          if (this.level + 1 < LEVELS.length) this.startLevel(this.level + 1);
          else this.over = 'victory';
        }
        break;
    }
    this.updateEffects();
    this.updateMarch();
  }

  // ---------------------------------------------------------------- players
  updatePlayer(p, inp) {
    if (!p.alive) return;
    const sp = p.ship.speed;
    let ax = inp.ax || 0, ay = inp.ay || 0;
    const m = Math.hypot(ax, ay);
    if (m > 1) { ax /= m; ay /= m; }
    p.x = clamp(p.x + ax * sp, 8, W - 8);
    p.y = clamp(p.y + ay * sp * 0.85, PY_MIN, PY_MAX);
    p.tilt = lerp(p.tilt, ax, 0.2);
    if (p.cool > 0) p.cool--;
    if (inp.fire && p.cool <= 0 && this.state !== 'levelClear') {
      p.ship.fire(p, this);
      p.cool = p.ship.cool;
    }
    if (p.inv > 0) p.inv--;
  }
  pshot(p, x, y, vx, vy, dmg, kind, pierce = false) {
    this.pb.push({ x, y, vx, vy, dmg, kind, pierce, owner: p, hitSet: pierce ? new Set() : null });
    p.shots++;
  }
  hurt(p, dmg, why = '') {
    if (!p.alive || p.inv > 0 || this.over) return;
    this.hurtLog[why] = (this.hurtLog[why] || 0) + 1;
    p.hp -= dmg;
    p.inv = 100;
    rumble(p.dev, 220, 0.8);
    this.explode(p.x, p.y, ['#ffffff', '#ff3b4e', '#ffe44d'], 12);
    if (p.hp <= 0) {
      p.hp = 0; p.alive = false;
      this.explode(p.x, p.y, ['#ffffff', '#ffe44d', '#ff9a2e', '#ff3b4e'], 60, 2.5);
      sfx.dead();
      rumble(p.dev, 600, 1);
      if (this.players.every(q => !q.alive)) { this.over = 'defeated'; this.overT = 0; }
      else this.pops.push({ x: p.x, y: p.y - 10, s: 'P' + (p.i + 1) + ' BACK NEXT WAVE', t: 120, c: '#ff8fa3' });
    } else sfx.hurt();
  }
  /** Heal everyone a bit; knocked-out players come back with half health. */
  healAll(n) {
    for (const p of this.players) {
      if (!p.alive) {
        Object.assign(p, { alive: true, hp: Math.ceil(p.maxHp / 2), inv: 150, x: 160 + (p.i - 0.5) * (this.nPlayers - 1) * 90, y: 160 });
        this.pops.push({ x: p.x, y: p.y - 12, s: 'P' + (p.i + 1) + ' IS BACK!', t: 90, c: '#a6ff4d' });
      } else if (p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + n);
      }
    }
    sfx.heal();
  }
  addScore(n, x, y) {
    this.score += n;
    if (x !== undefined) this.pops.push({ x, y, s: String(n), t: 45, c: '#ffffff' });
  }

  // ---------------------------------------------------------------- shots
  updateShots() {
    for (const s of this.pb) {
      s.x += s.vx; s.y += s.vy;
      if (s.y < -10 || s.x < -10 || s.x > W + 10) { s.dead = true; continue; }
      const hw = s.kind === 'pierce' ? 2 : 1.5, hh = s.kind === 'pierce' ? 5 : 3;
      for (const e of this.enemies) {
        if (e.dead || (s.hitSet && s.hitSet.has(e))) continue;
        if (Math.abs(s.x - e.x) < e.w / 2 + hw && Math.abs(s.y - e.y) < e.h / 2 + hh) {
          this.hitEnemy(e, s.dmg, s.owner);
          s.owner.hits++;
          if (s.pierce) s.hitSet.add(e); else { s.dead = true; break; }
        }
      }
      const b = this.boss;
      if (!s.dead && b && this.state === 'boss' && b.y > 10 &&
          Math.abs(s.x - b.x) < b.w * 0.42 && Math.abs(s.y - b.y) < b.h * 0.4) {
        if (!s.hitSet || !s.hitSet.has(b)) {
          b.hp -= s.dmg; if (b.flashCD <= 0) { b.flash = 2; b.flashCD = 7; } sfx.hit(); s.owner.hits++;
          this.parts.push({ x: s.x, y: s.y + 2, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.6), life: 10, c: '#fff' });
          if (s.pierce) s.hitSet.add(b); else s.dead = true;
          if (b.hp <= 0) this.killBoss();
        }
      }
    }
    this.pb = this.pb.filter(s => !s.dead);

    for (const s of this.eb) {
      s.x += s.vx; s.y += s.vy; s.t++;
      if (s.y > H + 8 || s.y < -20 || s.x < -10 || s.x > W + 10) { s.dead = true; continue; }
      for (const p of this.players) {
        if (p.alive && Math.abs(s.x - p.x) < 2.5 + s.r && Math.abs(s.y - (p.y + 1)) < 3 + s.r) {
          this.hurt(p, 1, s.kind); s.dead = true; break;
        }
      }
    }
    this.eb = this.eb.filter(s => !s.dead);

    for (const bm of this.beams) {
      bm.t++;
      const b = bm.boss;
      bm.x = b.x + bm.dx; bm.y = b.y + bm.dy;
      if (bm.t === bm.charge) sfx.beam();
      if (bm.t > bm.charge && bm.t < bm.charge + bm.fireT) {
        for (const p of this.players) if (p.alive && Math.abs(p.x - bm.x) < bm.w / 2 + 3 && p.y > bm.y) this.hurt(p, 2, 'laser');
      }
      if (bm.t >= bm.charge + bm.fireT || !this.boss || this.state !== 'boss') { bm.dead = true; b.laser = false; }
    }
    this.beams = this.beams.filter(bm => !bm.dead);
  }
  eshot(x, y, vx, vy, kind = 'pellet') {
    const k = 1 + this.loop * 0.12;
    this.eb.push({ x, y, vx: vx * k, vy: vy * k, kind, r: kind === 'orb' ? 1.5 : 1, t: 0 });
    sfx.ebullet();
  }
  nearestPlayer(x, y) {
    let best = null, bd = 1e9;
    for (const p of this.players) if (p.alive) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
    return best;
  }
  randomPlayer() { const a = this.players.filter(p => p.alive); return a.length ? pick(a) : null; }
  aimed(x, y, speed, kind = 'pellet') {
    const p = this.randomPlayer();
    const a = p ? Math.atan2(p.y - y, p.x - x) : Math.PI / 2;
    this.eshot(x, y, Math.cos(a) * speed, Math.sin(a) * speed, kind);
  }
  /** n shots fanned out over 'arc' radians, pointed at a player (or straight down if 'angle' is given). */
  spreadAt(x, y, n, arc, speed, angle = null) {
    if (angle === null) {
      const p = this.nearestPlayer(x, y);
      angle = p ? Math.atan2(p.y - y, p.x - x) : Math.PI / 2;
      angle = clamp(angle, 0.5, Math.PI - 0.5);
    }
    for (let i = 0; i < n; i++) {
      const a = angle + (n === 1 ? 0 : (i / (n - 1) - 0.5) * arc);
      this.eshot(x, y, Math.cos(a) * speed, Math.sin(a) * speed, 'orb');
    }
  }
  ring(x, y, n, speed, off = 0) {
    for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2;
      this.eshot(x, y, Math.cos(a) * speed, Math.sin(a) * speed, 'orb');
    }
  }
  startLaser(b, dx, dy, w) {
    b.laser = true;
    this.beams.push({ boss: b, dx, dy, w, x: b.x + dx, y: b.y + dy, t: 0, charge: 70, fireT: 55 });
    sfx.charge();
  }

  // ---------------------------------------------------------------- aliens
  hitEnemy(e, dmg, owner) {
    e.hp -= dmg; e.flash = 4;
    if (e.hp > 0) { sfx.hit(); return; }
    e.dead = true;
    const A = ALIENS[e.type];
    const pts = A.score * (e.state === 'dive' ? 2 : 1);
    this.addScore(pts, e.x, e.y);
    if (owner) owner.kills++;
    this.explode(e.x, e.y, A.color, 16);
    sfx.pop();
    if (owner) rumble(owner.dev, 40, 0.25);
  }
  updateFormation() {
    const f = this.form, L = this.L;
    // the formation slides in from above at the start
    const entering = f.oy < TOP;
    if (entering) f.oy = Math.min(TOP, f.oy + 1.2);
    const alive = this.enemies.length;
    const speed = L.speed * this.hard * (1 + 1.6 * (1 - alive / f.total));
    this.formSpeed = speed;
    if (!entering) {
      f.ox += f.dir * speed;
      // edges
      let minX = 1e9, maxX = -1e9;
      for (const e of this.enemies) {
        if (!e.slot) continue;
        const x = f.ox + e.slot.c * SPX;
        minX = Math.min(minX, x - e.w / 2); maxX = Math.max(maxX, x + e.w / 2);
      }
      if ((f.dir > 0 && maxX > W - 6) || (f.dir < 0 && minX < 6)) { f.dir *= -1; f.drop += 6; }
      if (f.drop > 0) { const d = Math.min(f.drop, 0.5); f.oy += d; f.drop -= d; }
    }
    this.updateEnemies();
    if (entering) return;

    // shooting: the lowest alien in a random column fires
    if (--this.fireT <= 0) {
      this.fireT = Math.round(L.fire / this.hard * (this.nPlayers > 1 ? 0.8 : 1) * rand(0.6, 1.4));
      const lowest = {};
      for (const e of this.enemies) if (e.state === 'form' && (!lowest[e.slot.c] || e.slot.r > lowest[e.slot.c].slot.r)) lowest[e.slot.c] = e;
      const cands = Object.values(lowest);
      if (cands.length) this.alienShoot(pick(cands));
    }
    // diving: an alien breaks away and swoops at a player
    if (L.dive && --this.diveT <= 0) {
      this.diveT = Math.round(L.dive / this.hard * rand(0.7, 1.3));
      const free = this.enemies.filter(e => e.state === 'form');
      const divers = free.filter(e => e.type === 'diver');
      const e = divers.length && Math.random() < 0.75 ? pick(divers) : free.length ? pick(free) : null;
      if (e) this.startDive(e);
    }
    // landed?
    for (const e of this.enemies) {
      if (e.state === 'form' && e.y + e.h / 2 >= LAND_Y) {
        this.over = 'landed'; this.overT = 0;
        for (const p of this.players) if (p.alive) this.explode(p.x, p.y, ['#fff', '#ff3b4e', '#ffe44d'], 40, 2);
        sfx.dead();
        break;
      }
    }
  }
  alienShoot(e) {
    const y = e.y + e.h / 2;
    switch (e.type) {
      case 'squid': this.aimed(e.x, y, 1.5); break;
      case 'crab': this.eshot(e.x - 3, y, -0.35, 1.4); this.eshot(e.x + 3, y, 0.35, 1.4); break;
      case 'armor': this.eshot(e.x, y, 0, 1.2, 'orb'); break;
      default: this.eshot(e.x, y, 0, 1.4);
    }
  }
  startDive(e) {
    e.state = 'dive';
    e.target = this.randomPlayer();
    e.vx = (e.x < 160 ? -1 : 1) * 0.8;
    e.vy = -0.8;
    e.shot = false;
    sfx.dive();
  }
  freeDiver(x, y) {
    const e = this.makeEnemy('diver', null);
    e.x = x; e.y = y;
    this.enemies.push(e);
    this.startDive(e);
  }
  updateEnemies() {
    const f = this.form;
    const anim = Math.floor(this.frame / 30) % 2;
    for (const e of this.enemies) {
      if (e.flash > 0) e.flash--;
      e.anim = anim;
      if (e.state === 'form') {
        e.x = f.ox + e.slot.c * SPX; e.y = f.oy + e.slot.r * SPY;
      } else if (e.state === 'dive') {
        e.anim = Math.floor(this.frame / 6) % 2;
        if (!e.target || !e.target.alive) e.target = this.randomPlayer();
        const tx = e.target ? e.target.x : 160;
        if (e.y < 130) e.vx = clamp(e.vx + Math.sign(tx - e.x) * 0.045, -1.5, 1.5);
        e.vy = Math.min(e.vy + 0.05, 1.9 * this.hard * (e.type === 'diver' ? 1 : 0.85));
        e.x += e.vx; e.y += e.vy;
        if (!e.shot && e.y > 70 && e.vy > 0) { e.shot = true; this.aimed(e.x, e.y + 4, 1.6); }
        if (e.y > H + 12) {
          if (!e.slot) e.dead = true;
          else { e.state = 'return'; e.y = -14; e.x = f.ox + e.slot.c * SPX; }
        }
      } else if (e.state === 'return') {
        const sx = f.ox + e.slot.c * SPX, sy = f.oy + e.slot.r * SPY;
        const dx = sx - e.x, dy = sy - e.y, d = Math.hypot(dx, dy);
        if (d < 2) e.state = 'form';
        else { e.x += dx / d * Math.min(2, d); e.y += dy / d * Math.min(2, d); }
      }
      // bumping into a ship hurts the ship and destroys the alien
      if (!e.dead) for (const p of this.players) {
        if (p.alive && p.inv <= 0 && Math.abs(e.x - p.x) < e.w / 2 + 3 && Math.abs(e.y - p.y) < e.h / 2 + 3) {
          this.hurt(p, 2, 'ram-' + (e.slot ? e.state : 'bossdiver'));
          this.hitEnemy(e, 99, null);
          break;
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }
  updateMarch() {
    // the classic marching heartbeat: faster as the aliens get faster
    if (this.state !== 'wave' || !this.formSpeed || this.form.oy < TOP) return;
    const gap = clamp(Math.round(22 / this.formSpeed), 14, 70);
    if (++this.marchT >= gap) { this.marchT = 0; sfx.march(this.marchN++); }
  }

  // ---------------------------------------------------------------- boss
  spawnBoss() {
    const id = this.L.boss, def = BOSSES[id], s = SPR.boss[id];
    const hp = Math.round(def.hp * (1 + 0.6 * (this.nPlayers - 1)) * (1 + 0.3 * this.loop));
    this.boss = { id, def, spr: s, w: s.w * 2, h: s.h * 2, x: 160, y: -s.h * 2, homeY: 50, flashCD: 0, hp, maxHp: hp, t: 0, flash: 0, p2: false, laser: false };
    this.enemies = [];
    this.form = { ox: 0, oy: TOP, dir: 1, drop: 0, total: 1 };
    this.setState('boss');
    this.msg = { big: def.name, t: 120 };
  }
  updateBoss() {
    const b = this.boss;
    if (b.flash > 0) b.flash--;
    if (b.flashCD > 0) b.flashCD--;
    if (b.y < b.homeY) { b.y += 0.6; return; }       // flying in
    b.t++;
    b.p2 = b.hp < b.maxHp / 2;
    b.def.think(b, this);
    for (const p of this.players) {
      if (p.alive && Math.abs(p.x - b.x) < b.w * 0.4 && Math.abs(p.y - b.y) < b.h * 0.4) this.hurt(p, 2, 'boss');
    }
  }
  killBoss() {
    const b = this.boss;
    b.hp = 0;
    this.eb = [];
    this.beams = [];
    for (const e of this.enemies) this.hitEnemy(e, 99, null);
    this.setState('bossDead', 140);
  }

  // ---------------------------------------------------------------- effects
  explode(x, y, colors, n, power = 1.5) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(0.3, power);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: irand(15, 40), c: pick(colors) });
    }
  }
  updateEffects() {
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vx *= 0.96; q.vy *= 0.96; q.life--; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const q of this.pops) { q.y -= 0.3; q.t--; }
    this.pops = this.pops.filter(q => q.t > 0);
    if (this.over) this.overT++;
  }
  updateBackground() {
    const boost = this.state === 'levelClear' ? 6 : 1;
    for (const s of this.stars) { s.y += s.z * 0.25 * boost; if (s.y > H) { s.y = 0; s.x = rand(0, W); } }
    this.planetY += 0.025 * boost;
  }

  // ================================================================ drawing
  draw() {
    const L = this.L;
    bx.fillStyle = L.sky;
    bx.fillRect(0, 0, W, H);
    // planet
    const pl = PLANETS[this.level];
    bx.drawImage(pl, Math.round(L.planet[4] - pl.width / 2), Math.round(L.planet[5] + this.planetY - pl.height / 2));
    // stars
    for (const s of this.stars) {
      bx.fillStyle = s.z === 3 ? '#ffffff' : s.z === 2 ? '#8fa0d0' : '#4a5480';
      bx.fillRect(Math.round(s.x), Math.round(s.y), 1, this.state === 'levelClear' ? s.z * 3 : 1);
    }
    // the landing line
    if (this.state === 'wave' && this.form) {
      let low = 0;
      for (const e of this.enemies) if (e.state === 'form') low = Math.max(low, e.y + e.h / 2);
      const danger = low > LAND_Y - 40;
      bx.fillStyle = danger && this.frame % 20 < 10 ? '#ff3b4e' : '#3a1830';
      for (let x = 0; x < W; x += 4) bx.fillRect(x, LAND_Y + 1, 2, 1);
    }
    // laser beams
    for (const bm of this.beams) {
      if (bm.t < bm.charge) {
        if (bm.t % 8 < 4) { bx.fillStyle = '#ff3b4e'; bx.fillRect(Math.round(bm.x), Math.round(bm.y), 1, H); }
        bx.fillStyle = '#ffffff';
        const r = Math.round(bm.t / bm.charge * 4);
        bx.fillRect(Math.round(bm.x - r), Math.round(bm.y - r), r * 2, r * 2);
      } else {
        const w = bm.w + (this.frame % 4 < 2 ? 2 : 0);
        bx.fillStyle = '#ff3b4e'; bx.fillRect(Math.round(bm.x - w / 2 - 1), Math.round(bm.y), w + 2, H);
        bx.fillStyle = '#ffe44d'; bx.fillRect(Math.round(bm.x - w / 2 + 1), Math.round(bm.y), w - 2, H);
        bx.fillStyle = '#ffffff'; bx.fillRect(Math.round(bm.x - 1), Math.round(bm.y), 2, H);
      }
    }
    // aliens
    for (const e of this.enemies) drawSpr(SPR.alien[e.type][e.anim || 0], e.x, e.y, e.flash > 0);
    // boss
    const b = this.boss;
    if (b && this.state !== 'levelClear') {
      const shake = this.state === 'bossDead' ? (this.frame % 2 ? 1 : -1) : 0;
      drawSpr(b.spr, b.x + shake, b.y, b.flash > 0 || (this.state === 'bossDead' && this.frame % 8 < 3), 2);
      // the eye looks at you
      if (b.id === 'eye') {
        const p = this.nearestPlayer(b.x, b.y);
        const a = p ? Math.atan2(p.y - b.y, p.x - b.x) : Math.PI / 2;
        bx.fillStyle = '#000';
        const ex = Math.round(b.x + Math.cos(a) * 7), ey = Math.round(b.y - 4 + Math.sin(a) * 5);
        bx.fillRect(ex - 4, ey - 4, 8, 8);
        bx.fillStyle = '#fff';
        bx.fillRect(ex - 2, ey - 2, 2, 2);
      }
    }
    // player shots
    for (const s of this.pb) {
      const x = Math.round(s.x), y = Math.round(s.y);
      switch (s.kind) {
        case 'twin': bx.fillStyle = '#36f0ff'; bx.fillRect(x, y - 2, 1, 4); bx.fillStyle = '#fff'; bx.fillRect(x, y - 2, 1, 1); break;
        case 'rapid': bx.fillStyle = '#ffe44d'; bx.fillRect(x, y - 1, 1, 3); break;
        case 'spread': bx.fillStyle = '#a6ff4d'; bx.fillRect(x - 1, y - 1, 2, 3); bx.fillStyle = '#fff'; bx.fillRect(x, y - 1, 1, 1); break;
        case 'pierce': bx.fillStyle = '#ff4df0'; bx.fillRect(x - 1, y - 5, 3, 10); bx.fillStyle = '#fff'; bx.fillRect(x, y - 5, 1, 10); break;
      }
    }
    // ships
    for (const p of this.players) {
      if (!p.alive) continue;
      if (p.inv > 0 && Math.floor(p.inv / 4) % 2 === 0) continue;
      const sp = (p.alt2 ? SPR.ship2 : SPR.ship)[p.ship.id];
      // engine flame
      const fl = this.frame % 6 < 3;
      bx.fillStyle = fl ? '#ffe44d' : '#ff9a2e';
      const fy = Math.round(p.y + sp.h / 2);
      bx.fillRect(Math.round(p.x) - 1, fy, 2, fl ? 3 : 2);
      bx.fillStyle = '#ff3b4e';
      bx.fillRect(Math.round(p.x) - 1, fy + (fl ? 3 : 2), 2, 1);
      drawSpr(sp, p.x + Math.round(p.tilt * 0.6), p.y);
    }
    // alien shots
    for (const s of this.eb) {
      const x = Math.round(s.x), y = Math.round(s.y);
      if (s.kind === 'orb') {
        bx.fillStyle = s.t % 10 < 5 ? '#ff4df0' : '#ff3b4e';
        bx.fillRect(x - 2, y - 1, 4, 2); bx.fillRect(x - 1, y - 2, 2, 4);
        bx.fillStyle = '#fff'; bx.fillRect(x - 1, y - 1, 1, 1);
      } else {
        bx.fillStyle = '#ff3b4e'; bx.fillRect(x - 1, y - 2, 2, 4);
        bx.fillStyle = s.t % 8 < 4 ? '#ffffff' : '#ffe44d'; bx.fillRect(x - 1, y, 2, 2);
      }
    }
    // sparks
    for (const q of this.parts) {
      bx.fillStyle = q.c;
      const s = q.life > 25 ? 2 : 1;
      bx.fillRect(Math.round(q.x), Math.round(q.y), s, s);
    }
    this.drawHudPixels();

    // ---- blow up to the big screen, then words on top
    ctx.drawImage(buf, 0, 0, SW, SH);
    this.drawHudText();
  }

  drawHudPixels() {
    bx.fillStyle = 'rgba(0,0,0,0.55)';
    bx.fillRect(0, 0, W, 12);
    this.players.forEach((p, i) => {
      const x0 = i === 0 ? 18 : W - 18 - p.maxHp * 5;
      for (let k = 0; k < p.maxHp; k++) {
        const full = k < p.hp;
        bx.fillStyle = full ? (p.hp <= 2 && this.frame % 30 < 15 ? '#ff3b4e' : (i === 0 ? '#36f0ff' : '#ffe44d')) : '#2a2f45';
        bx.fillRect(x0 + k * 5, 4, 4, 5);
      }
    });
    const b = this.boss;
    if (b && (this.state === 'boss' || this.state === 'bossDead')) {
      bx.fillStyle = '#000'; bx.fillRect(79, 14, 162, 5);
      bx.fillStyle = '#5a1f2a'; bx.fillRect(80, 15, 160, 3);
      bx.fillStyle = b.p2 ? '#ff3b4e' : '#ff9a2e'; bx.fillRect(80, 15, Math.round(160 * b.hp / b.maxHp), 3);
    }
  }
  drawHudText() {
    this.players.forEach((p, i) => {
      const c = i === 0 ? '#36f0ff' : '#ffe44d';
      if (i === 0) wtext('P1', 3, 6.5, 16, c, 'left');
      else wtext('P2', W - 3, 6.5, 16, c, 'right');
      if (!p.alive) wtext(i === 0 ? 'DOWN' : 'DOWN', i === 0 ? 18 : W - 18, 6.5, 16, '#ff3b4e', i === 0 ? 'left' : 'right');
    });
    wtext(String(this.score).padStart(6, '0'), 160, 6.5, 16, '#ffffff');
    const lvl = this.level + 1 + this.loop * LEVELS.length;
    if (this.nPlayers === 1) wtext('LV ' + lvl, W - 4, 6.5, 16, '#94a3c7', 'right');
    else wtext('LV ' + lvl, 160 + 40, 6.5, 16, '#94a3c7', 'left');
    if (this.boss && (this.state === 'boss' || this.state === 'bossDead')) wtext(this.boss.def.name, 160, 23, 16, '#ffc98a');
    for (const q of this.pops) wtext(q.s, q.x, q.y, 16, q.c);
    const m = this.msg;
    if (m && !(m.blink && this.frame % 30 < 10)) {
      wtext(m.big, 160, 80, 40, m.blink ? '#ff3b4e' : '#ffffff');
      if (m.small) wtext(m.small, 160, 94, 24, '#ffe44d');
    }
  }
}
