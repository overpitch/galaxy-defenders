'use strict';
// =====================================================================
//  GALAXY DEFENDERS — screens: title, ship select, playing, pause, game over / victory
// =====================================================================

bx.imageSmoothingEnabled = false;

let screen = 'title';
let game = null;
let frame = 0;
let slots = [];            // ship select: [{ dev, ship (index), ready }]
let countdown = 0;
let menuSel = 0;
let pausedBy = null;
let lastSetup = null;      // for Continue: { players, level, loop }

let best = 0;
try { best = +localStorage.getItem('galaxyDefendersBest') || 0; } catch (e) {}
function saveBest(s) {
  if (s <= best) return false;
  best = s;
  try { localStorage.setItem('galaxyDefendersBest', String(s)); } catch (e) {}
  return true;
}

// background stars for the menus
const menuStars = [];
for (let i = 0; i < 90; i++) menuStars.push({ x: rand(0, W), y: rand(0, H), z: pick([1, 1, 2, 3]) });
function drawMenuBack(sky = '#070b22') {
  bx.fillStyle = sky; bx.fillRect(0, 0, W, H);
  for (const s of menuStars) {
    s.y += s.z * 0.2; if (s.y > H) { s.y = 0; s.x = rand(0, W); }
    bx.fillStyle = s.z === 3 ? '#fff' : s.z === 2 ? '#8fa0d0' : '#4a5480';
    bx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
  }
}
function bigSpr(s, x, y, scale) {
  bx.drawImage(s.img, Math.round(x - s.w * scale / 2), Math.round(y - s.h * scale / 2), s.w * scale, s.h * scale);
}
function blit() { ctx.drawImage(buf, 0, 0, SW, SH); }
function blink(rate = 40) { return frame % rate < rate * 0.65; }

// ---------------------------------------------------------------- title
function titleScreen(m) {
  drawMenuBack();
  bx.drawImage(PLANETS[0], 250 - PLANETS[0].width / 2, 120 - PLANETS[0].height / 2);
  // a row of marching aliens
  const types = ['squid', 'bug', 'crab', 'armor', 'diver', 'bug', 'squid'];
  const off = Math.sin(frame / 60) * 20;
  types.forEach((t, i) => drawSpr(SPR.alien[t][Math.floor(frame / 30) % 2], 160 - 66 + i * 22 + off, 88));
  // two heroes
  bigSpr(SPR.ship.falcon, 120 + Math.sin(frame / 40) * 6, 140, 2);
  bigSpr(SPR.ship2.comet, 200 + Math.sin(frame / 40 + 2) * 6, 140, 2);
  blit();
  text('GALAXY', SW / 2 + 0, 120, 72, '#ffe44d', 'center', '#b0381a');
  text('DEFENDERS', SW / 2, 210, 72, '#36f0ff', 'center', '#1d2f8a');
  if (blink()) text('PRESS A TO PLAY', SW / 2, 470, 32, '#ffffff');
  text('1 OR 2 PLAYERS', SW / 2, 520, 16, '#94a3c7');
  if (best) text('BEST ' + String(best).padStart(6, '0'), SW / 2, 30, 16, '#ff8fa3');
  text('MOVE: STICK OR D-PAD   SHOOT: HOLD A   PAUSE: MENU', SW / 2, 650, 16, '#8fa0d0');
  text('KEYBOARD  P1: WASD + SPACE   P2: ARROWS + /', SW / 2, 685, 16, '#5b6b8f');
  if (m.confirmP) { sfx.join(); goSelect(); }
}

// ---------------------------------------------------------------- ship select
function goSelect() {
  screen = 'select'; slots = []; countdown = 0;
  // whoever pressed to get here joins right away
  for (const id in devices) if (devices[id].fireP || devices[id].startP) { slots.push({ dev: id, ship: 0, ready: false }); break; }
  if (!slots.length) slots.push({ dev: 'kb1', ship: 0, ready: false });
}
function selectScreen() {
  // joining
  for (const id in devices) {
    const d = devices[id];
    if (slots.some(s => s.dev === id)) continue;
    if ((d.fireP || d.startP) && slots.length < 2) {
      slots.push({ dev: id, ship: slots.length ? 1 : 0, ready: false });
      sfx.join(); countdown = 0;
    }
  }
  for (const s of [...slots]) {
    const d = dev(s.dev);
    if (!s.ready) {
      if (d.leftP) { s.ship = (s.ship + SHIPS.length - 1) % SHIPS.length; sfx.select(); }
      if (d.rightP) { s.ship = (s.ship + 1) % SHIPS.length; sfx.select(); }
      if (d.fireP || d.startP) { s.ready = true; sfx.ready(); }
      if (d.backP) {
        slots.splice(slots.indexOf(s), 1); sfx.back();
        if (!slots.length) { screen = 'title'; return; }
      }
    } else if (d.backP) { s.ready = false; countdown = 0; sfx.back(); }
  }
  const allReady = slots.length && slots.every(s => s.ready);
  if (allReady) {
    countdown++;
    if (countdown % 60 === 1) sfx.select();
    if (countdown >= 120) { startGame(slots.map(s => ({ dev: s.dev, ship: SHIPS[s.ship].id })), 0, 0); return; }
  } else countdown = 0;

  // ---- draw
  drawMenuBack();
  const xs = [80, 240];
  for (let i = 0; i < 2; i++) {
    const s = slots[i], cx = xs[i];
    bx.fillStyle = 'rgba(20,30,70,0.6)'; bx.fillRect(cx - 70, 30, 140, 128);
    bx.fillStyle = i === 0 ? '#36f0ff' : '#ffe44d';
    bx.fillRect(cx - 70, 30, 140, 1); bx.fillRect(cx - 70, 157, 140, 1);
    if (!s) continue;
    const ship = SHIPS[s.ship];
    const sameAsOther = i === 1 && slots[0] && slots[0].ship === s.ship;
    const sp = (sameAsOther ? SPR.ship2 : SPR.ship)[ship.id];
    bigSpr(sp, cx, 72 + (s.ready ? 0 : Math.sin(frame / 15) * 2), 3);
    // speed / power / armor
    ship.bars.forEach((v, k) => {
      for (let j = 0; j < 5; j++) {
        bx.fillStyle = j < v ? ['#36f0ff', '#ff4df0', '#a6ff4d'][k] : '#2a2f45';
        bx.fillRect(cx - 4 + j * 8, 119 + k * 9, 6, 5);
      }
    });
  }
  blit();
  text('CHOOSE YOUR STARFIGHTER', SW / 2, 50, 24, '#ffffff');
  for (let i = 0; i < 2; i++) {
    const s = slots[i], cx = xs[i] * PX, c = i === 0 ? '#36f0ff' : '#ffe44d';
    text('PLAYER ' + (i + 1), cx, 145, 16, c);
    if (!s) {
      if (blink()) text('PRESS A', cx, 360, 24, '#ffffff');
      text('TO JOIN', cx, 400, 24, '#ffffff');
      continue;
    }
    const ship = SHIPS[s.ship];
    if (!s.ready) { text('<', cx - 200, 290, 32, '#ffffff'); text('>', cx + 200, 290, 32, '#ffffff'); }
    text(ship.name, cx, 390, 32, '#ffffff');
    text(ship.desc, cx, 430, 16, '#ffc98a');
    ['SPEED', 'POWER', 'ARMOR'].forEach((l, k) => text(l, cx - 30, 486 + k * 36, 16, '#c8d0e0', 'right'));
    if (s.ready) text('READY!', cx, 610, 24, blink(20) ? '#a6ff4d' : '#ffffff');
    else text('A = READY   B = BACK', cx, 610, 16, '#8fa0d0');
  }
  if (allReady) text('LAUNCH IN ' + (2 - Math.floor(countdown / 60)), SW / 2, 680, 24, '#ffe44d');
  else if (slots.length < 2) text('PLAYER 2: PRESS A ON ANOTHER CONTROLLER', SW / 2, 680, 16, '#94a3c7');
}

// ---------------------------------------------------------------- playing
function startGame(players, level, loop, score = 0) {
  lastSetup = { players, level, loop };
  game = new Game(players, level, loop);
  game.score = score;
  screen = 'play';
}
function playScreen() {
  const inputs = game.players.map(p => dev(p.dev));
  for (const p of game.players) if (dev(p.dev).startP) { pause(p.dev); return; }
  game.update(inputs);
  game.draw();
  if (game.over && game.overT > (game.over === 'victory' ? 30 : 110)) endGame();
}
function pause(by) { screen = 'pause'; menuSel = 0; pausedBy = by; sfx.pause(); }
function pauseScreen(m) {
  game.draw();
  ctx.fillStyle = 'rgba(0,0,10,0.6)'; ctx.fillRect(0, 0, SW, SH);
  text('PAUSED', SW / 2, 230, 48, '#ffffff');
  const opts = ['RESUME', 'QUIT TO TITLE'];
  if (m.upP || m.downP) { menuSel = 1 - menuSel; sfx.select(); }
  opts.forEach((o, i) => text((i === menuSel ? '> ' : '  ') + o + (i === menuSel ? ' <' : '  '), SW / 2, 360 + i * 60, 24, i === menuSel ? '#ffe44d' : '#94a3c7'));
  if (m.startP || m.backP) { screen = 'play'; return; }
  if (m.fireP || tapped_enter) {
    if (menuSel === 0) screen = 'play';
    else { screen = 'title'; game = null; }
  }
}

// ---------------------------------------------------------------- game over / victory
let endInfo = null;
function endGame() {
  const newBest = saveBest(game.score);
  endInfo = { kind: game.over, score: game.score, newBest, level: game.level, loop: game.loop };
  if (game.over === 'victory') sfx.win(); else sfx.over();
  screen = 'end'; menuSel = 0;
}
function endScreen(m) {
  const win = endInfo.kind === 'victory';
  drawMenuBack(win ? '#0a1a10' : '#14040a');
  if (win) {
    SHIPS.forEach((s, i) => bigSpr(SPR.ship[s.id], 70 + i * 60, 128 + Math.sin(frame / 20 + i) * 3, 2));
  }
  blit();
  if (win) {
    text('YOU SAVED', SW / 2, 110, 56, '#a6ff4d', 'center', '#1d5a2a');
    text('THE GALAXY!', SW / 2, 190, 56, '#ffe44d', 'center', '#8a4a00');
  } else {
    text('GAME OVER', SW / 2, 130, 64, '#ff3b4e', 'center', '#3a0010');
    text(endInfo.kind === 'landed' ? 'THE ALIENS LANDED!' : 'ALL SHIPS DESTROYED!', SW / 2, 210, 24, '#ffc98a');
  }
  text('TEAM SCORE ' + String(endInfo.score).padStart(6, '0'), SW / 2, 290, 24, '#ffffff');
  if (endInfo.newBest) { if (blink(20)) text('NEW BEST!', SW / 2, 330, 24, '#ff8fa3'); }
  else text('BEST ' + String(best).padStart(6, '0'), SW / 2, 330, 16, '#94a3c7');
  const opts = win ? ['KEEP GOING (HARDER!)', 'TITLE SCREEN'] : ['TRY THIS LEVEL AGAIN', 'TITLE SCREEN'];
  if (m.upP || m.downP) { menuSel = 1 - menuSel; sfx.select(); }
  opts.forEach((o, i) => text((i === menuSel ? '> ' : '  ') + o + (i === menuSel ? ' <' : '  '), SW / 2, 470 + i * 60, 24, i === menuSel ? '#ffe44d' : '#94a3c7'));
  if (m.confirmP && frame - endFrame > 40) {
    sfx.ready();
    if (menuSel === 1) { screen = 'title'; game = null; return; }
    const ps = lastSetup.players;
    if (win) startGame(ps, 0, endInfo.loop + 1, endInfo.score);
    else startGame(ps, endInfo.level, endInfo.loop, 0);
  }
}
let endFrame = 0;

// ---------------------------------------------------------------- main loop (always 60 steps a second)
let last = performance.now(), acc = 0;
const STEP = 1000 / 60;
function step() {
  beginFrameInput();
  pollDevices();
  const m = anyDev();
  frame++;
  const was = screen;
  switch (screen) {
    case 'title': titleScreen(m); break;
    case 'select': selectScreen(); break;
    case 'play': playScreen(); break;
    case 'pause': pauseScreen(m); break;
    case 'end': endScreen(m); break;
  }
  if (screen === 'end' && was !== 'end') endFrame = frame;
}
function loop(now) {
  acc += Math.min(100, now - last);
  last = now;
  let n = 0;
  while (acc >= STEP && n < 4) { step(); acc -= STEP; n++; }
  if (n === 4) acc = 0;
  requestAnimationFrame(loop);
}
// wait for the pixel font so the first screen doesn't flash the wrong letters
(document.fonts && document.fonts.load ? document.fonts.load('16px "Press Start 2P"').catch(() => {}) : Promise.resolve())
  .then(() => requestAnimationFrame(loop));
