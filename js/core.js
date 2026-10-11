'use strict';
// =====================================================================
//  GALAXY DEFENDERS — core: screen, sound, controls, helpers
// =====================================================================

const W = 320, H = 180;          // the game world is drawn in chunky pixels at this size...
const PX = 4;                    // ...then blown up 4x
const SW = W * PX, SH = H * PX;  // 1280 x 720
const FONT = '"Press Start 2P", "Courier New", monospace';
const IS_XBOX = /xbox/i.test(navigator.userAgent);

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const buf = document.createElement('canvas');
buf.width = W; buf.height = H;
const bx = buf.getContext('2d');

try { navigator.gamepadInputEmulation = 'gamepad'; } catch (e) {}

function resize() {
  cv.width = SW; cv.height = SH;
  const s = Math.min(innerWidth / SW, innerHeight / SH);
  cv.style.width = Math.floor(SW * s) + 'px';
  cv.style.height = Math.floor(SH * s) + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------- math helpers
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

// ---------------------------------------------------------------- sound
let actx = null, master = null, muted = false;
function initAudio() {
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain();
      master.gain.value = 0.9;
      const comp = actx.createDynamicsCompressor();
      master.connect(comp).connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) {}
}
function tone(freq, dur, type = 'square', slide = 0, vol = 0.06, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, vol = 0.1, freq = 1200, delay = 0) {
  if (!actx || muted) return;
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = actx.currentTime + delay;
  const s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t0); s.stop(t0 + dur + 0.02);
}
// Too many of the same sound at once just makes noise, so each one has a short cooldown.
const sfxLast = {};
function limited(name, ms, fn) {
  return (...a) => {
    const now = performance.now();
    if (sfxLast[name] && now - sfxLast[name] < ms) return;
    sfxLast[name] = now; fn(...a);
  };
}
const sfx = {
  shoot:   limited('shoot', 45, () => tone(1200, 0.06, 'square', 500, 0.025)),
  laser:   limited('laser', 60, () => tone(1800, 0.12, 'sawtooth', 300, 0.03)),
  hit:     limited('hit', 40, () => noise(0.05, 0.06, 4000)),
  pop:     limited('pop', 30, () => { noise(0.18, 0.12, 1500); tone(300, 0.12, 'square', 60, 0.04); }),
  ebullet: limited('ebullet', 90, () => tone(300, 0.08, 'triangle', 150, 0.03)),
  hurt:    () => { noise(0.3, 0.25, 900); tone(200, 0.3, 'sawtooth', 50, 0.08); },
  dead:    () => { noise(0.9, 0.35, 700); tone(160, 0.9, 'sawtooth', 30, 0.1); },
  dive:    limited('dive', 300, () => tone(900, 0.5, 'sine', 200, 0.04)),
  boom:    limited('boom', 80, () => { noise(0.5, 0.3, 600); tone(90, 0.4, 'sawtooth', 30, 0.08); }),
  bigboom: () => { noise(1.6, 0.45, 500); tone(70, 1.5, 'sawtooth', 20, 0.14); },
  warn:    () => [0, 0.3, 0.6].forEach(d => tone(440, 0.22, 'square', 330, 0.06, d)),
  charge:  () => tone(100, 0.9, 'sawtooth', 800, 0.04),
  beam:    () => noise(0.8, 0.12, 2500),
  heal:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'triangle', 0, 0.05, i * 0.06)),
  clear:   () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0, 0.05, i * 0.09)),
  win:     () => [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.22, 'square', 0, 0.06, i * 0.15)),
  over:    () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0, 0.08, i * 0.3)),
  select:  () => tone(660, 0.05, 'square', 0, 0.04),
  join:    () => [523, 784].forEach((f, i) => tone(f, 0.1, 'square', 0, 0.05, i * 0.07)),
  ready:   () => [659, 988].forEach((f, i) => tone(f, 0.1, 'square', 0, 0.05, i * 0.07)),
  back:    () => tone(330, 0.1, 'square', 220, 0.04),
  pause:   () => tone(880, 0.1, 'square', 0, 0.05),
  march:   n => tone([98, 87, 78, 73][n % 4], 0.11, 'square', 0, 0.06),
};

// ---------------------------------------------------------------- controls
// Devices: each controller ('pad0'...) plus two keyboard players ('kb1', 'kb2').
const keys = {}, tapped = {};
addEventListener('keydown', e => {
  keys[e.code] = true; tapped[e.code] = true;
  initAudio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Slash', 'Quote'].includes(e.code)) e.preventDefault();
  if (e.code === 'F11') { e.preventDefault(); toggleFullscreen(); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('pointerdown', () => initAudio());
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function toggleFullscreen() {
  try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {}
}

const KEYBOARDS = {
  kb1: { left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
         fire: ['Space', 'KeyJ'], back: ['KeyK'], start: ['Escape', 'KeyP'] },
  kb2: { left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
         fire: ['Slash', 'Period', 'Numpad0', 'ShiftRight'], back: ['Comma', 'Numpad1'], start: ['NumpadEnter', 'Backspace'] },
};

/** Connected real controllers. Odd devices (headsets, remotes) are skipped when a real controller is there. */
function padList() {
  const ps = (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter(p => p && p.connected);
  const real = ps.filter(p => p.mapping === 'standard');
  return real.length ? real : ps;
}
// A stick or button only counts after it's been seen centered/released once (so a stuck one can't drive the game).
const settled = new Map();
function readPad(p) {
  let s = settled.get(p.index);
  if (!s) { s = { axes: [], buttons: [] }; settled.set(p.index, s); }
  const b = n => {
    const btn = p.buttons[n];
    const down = !!(btn && (btn.pressed || btn.value > 0.5));
    if (!down) s.buttons[n] = true;
    return down && !!s.buttons[n];
  };
  const axis = i => { const v = p.axes[i] || 0; if (Math.abs(v) < 0.3) s.axes[i] = true; return s.axes[i] ? v : 0; };
  const dz = v => Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82;
  let ax = dz(axis(0)), ay = dz(axis(1));
  const dl = b(14), dr = b(15), du = b(12), dd = b(13);
  if (dl) ax = -1; if (dr) ax = 1; if (du) ay = -1; if (dd) ay = 1;
  const o = {
    ax, ay,
    left: ax < -0.4, right: ax > 0.4, up: ay < -0.5, down: ay > 0.5,
    fire: b(0) || b(2) || b(5) || b(7),       // A, X, right bumper, right trigger
    back: b(1),                               // B
    start: b(9), view: b(8),
  };
  if (o.fire || o.back || o.start) initAudio();
  return o;
}

const FIELDS = ['left', 'right', 'up', 'down', 'fire', 'back', 'start'];
const EMPTY = { ax: 0, ay: 0, left: false, right: false, up: false, down: false, fire: false, back: false, start: false };
for (const f of FIELDS) EMPTY[f + 'P'] = false;
let prevDev = {};
let devices = {};   // id -> state, with xxxP = pressed this frame

function pollDevices() {
  const k = c => !!(keys[c] || tapped[c]);
  const now = {};
  for (const id in KEYBOARDS) {
    const set = KEYBOARDS[id], o = {};
    for (const f in set) o[f] = set[f].some(k);
    o.ax = (o.right ? 1 : 0) - (o.left ? 1 : 0);
    o.ay = (o.down ? 1 : 0) - (o.up ? 1 : 0);
    now[id] = o;
  }
  for (const p of padList()) now['pad' + p.index] = readPad(p);
  for (const id in now) {
    const cur = now[id], prev = prevDev[id] || EMPTY;
    for (const f of FIELDS) cur[f + 'P'] = cur[f] && !prev[f];
  }
  prevDev = now;
  devices = now;
  for (const c in tapped) delete tapped[c];
  return now;
}
function dev(id) { return devices[id] || EMPTY; }
/** Menu input from every device at once. */
function anyDev() {
  const o = {};
  for (const f of FIELDS) { o[f] = false; o[f + 'P'] = false; }
  for (const id in devices) for (const f in o) o[f] = o[f] || devices[id][f];
  o.confirmP = o.fireP || o.startP || !!tapped_enter;
  return o;
}
let tapped_enter = false, prevEnter = false;
function beginFrameInput() { tapped_enter = !!keys.Enter && !prevEnter; prevEnter = !!keys.Enter; }

function rumble(devId, ms = 150, strength = 0.6) {
  if (!devId || !devId.startsWith('pad')) return;
  const idx = +devId.slice(3);
  const g = padList().find(p => p.index === idx);
  if (!g || !g.vibrationActuator) return;
  try { g.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 }); } catch (e) {}
}

// ---------------------------------------------------------------- text (drawn on the big screen, in screen pixels)
function text(s, x, y, size, color, align = 'center', shadow = '#000') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + size / 8 * 2, y + size / 8 * 2); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
/** Text placed at game-pixel coordinates. */
function wtext(s, x, y, size, color, align = 'center', shadow = '#000') { text(s, x * PX, y * PX, size, color, align, shadow); }

// ---------------------------------------------------------------- Xbox
addEventListener('wheel', e => e.preventDefault(), { passive: false });
if (IS_XBOX) {
  // Edge on Xbox maps B to browser Back. Keep an extra history entry so Back stays in the game.
  let guarded = false;
  const guard = () => { if (guarded) return; try { history.pushState({ galaxy: true }, ''); guarded = true; } catch (e) {} };
  for (const type of ['pointerdown', 'keydown']) addEventListener(type, guard);
  addEventListener('popstate', () => { guarded = false; guard(); });
}
