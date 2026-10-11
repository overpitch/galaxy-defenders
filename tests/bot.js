'use strict';
// Test: robot pilots play the whole game as fast as possible.
// In the browser console: load this file, then botRun() or botAll().

/** A simple pilot: line up under an alien, dodge bullets that are about to hit, always shoot. skill 0..1 */
function botInput(g, p, skill = 0.8) {
  if (!p.alive) return EMPTY;
  let tx = p.x;
  const b = g.boss;
  if (b && g.state === 'boss') tx = b.x + Math.sin(g.frame / 50) * 20 + (p.i ? 14 : -14);
  else if (g.enemies.length) {
    let best = null, bd = 1e9;
    for (const e of g.enemies) {
      const d = Math.abs(e.x - p.x) + (e.state === 'dive' ? -40 : 0) - e.y * 0.3;
      if (d < bd) { bd = d; best = e; }
    }
    if (best) tx = best.x + (p.i ? 3 : -3);
  }
  let ax = clamp((tx - p.x) / 6, -1, 1), ay = (160 - p.y) / 10;
  // dodge
  if (Math.random() < skill) {
    let threat = 0;
    for (const s of g.eb) {
      const dy = p.y - s.y;
      if (dy > -4 && dy < 40 && Math.abs(s.x + s.vx * dy / Math.max(0.5, s.vy) - p.x) < 9) threat += (s.x < p.x ? 1 : -1) || 1;
    }
    for (const e of g.enemies) if (e.state === 'dive' && p.y - e.y < 40 && p.y - e.y > -6 && Math.abs(e.x - p.x) < 14) threat += e.x < p.x ? 1 : -1;
    for (const bm of g.beams) if (Math.abs(bm.x - p.x) < bm.w + 8) threat += bm.x < p.x ? 2 : -2;
    if (threat) ax = Math.sign(threat);
    if (p.x < 14 && ax < 0 || p.x > W - 14 && ax > 0) ax = -ax;
  }
  return { ax, ay, fire: true };
}

function botRun(ships = ['falcon', 'titan'], skill = 0.8, startLevel = 0, maxFrames = 60 * 60 * 25) {
  const g = new Game(ships.map(s => ({ dev: null, ship: s })), startLevel, 0);
  const log = [];
  let lastLevel = -1, lastState = '', levelStart = 0, f = 0, hits = 0;
  try {
    while (!g.over && f < maxFrames) {
      g.update(g.players.map(p => botInput(g, p, skill)));
      f++;
      if (g.state !== lastState) {
        if (g.state === 'boss') log.push(`  L${g.level + 1} waves done at ${((f - levelStart) / 60).toFixed(0)}s, hp ${g.players.map(p => p.hp).join('/')}`);
        if (g.state === 'levelClear') log.push(`  L${g.level + 1} boss beaten at ${((f - levelStart) / 60).toFixed(0)}s`);
        lastState = g.state;
      }
      if (g.level !== lastLevel) { lastLevel = g.level; levelStart = f; }
      for (const p of g.players) if (![p.x, p.y, p.hp].every(Number.isFinite)) throw new Error('bad numbers');
      if (g.boss && !Number.isFinite(g.boss.x + g.boss.y + g.boss.hp)) throw new Error('bad boss numbers');
    }
  } catch (e) { log.push('CRASH: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  const acc = g.players.map(p => p.ship.id + ' ' + Math.round(100 * p.hits / Math.max(1, p.shots)) + '% kills' + p.kills).join(', ');
  return `${ships.join('+')} skill ${skill}: ${g.over || 'TIMEOUT'} on L${g.level + 1} ${g.state} after ${(f / 60).toFixed(0)}s, score ${g.score} | ${acc} | hurt ${JSON.stringify(g.hurtLog)}\n` + log.join('\n');
}

function botAll(skill = 0.8, startLevel = 0) {
  const runs = [['falcon'], ['hornet'], ['titan'], ['comet'], ['falcon', 'titan'], ['hornet', 'comet'], ['falcon', 'falcon']];
  return runs.map(r => botRun(r, skill, startLevel)).join('\n');
}
