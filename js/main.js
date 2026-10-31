import { SIZE, C, polar, zoneAt, seats, spots, pots, spawn } from './world.js';
import { findPath, nearestFree } from './path.js';
import { drawWorld, drawLight, drawCharacter } from './render.js';
import { ICONS } from './icons.js';

const canvas = document.getElementById('cafe');
const g = canvas.getContext('2d');
const bar = document.getElementById('actions');
const enter = document.getElementById('enter');

// ---------- 내 캐릭터 ----------
const HOODIES = ['#8fb7e0', '#f2a7a0', '#a7d3a6', '#f4d27a', '#b9a6e0', '#f5f0e6'];
const HAIRS = ['#3b2a22', '#5a3b2a', '#22201f', '#7a5634'];
const BAGS = ['#5b6b8a', '#8a5b5b', '#6b8a5b', '#444'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loadLook() {
  try {
    const saved = JSON.parse(localStorage.getItem('navs-cafe-look') || 'null');
    if (saved && saved.hoodie) return saved;
  } catch (e) { /* 저장소를 못 쓰는 환경 */ }
  const look = { hoodie: pick(HOODIES), hair: pick(HAIRS), bag: pick(BAGS), style: Math.random() < 0.5 ? 0 : 1 };
  try { localStorage.setItem('navs-cafe-look', JSON.stringify(look)); } catch (e) { /* 무시 */ }
  return look;
}

const me = {
  ...loadLook(),
  x: spawn.x,
  y: spawn.y,
  face: 0,
  state: 'idle', // idle | walk | sit
  action: null,  // gaze | read | pray | wave | water | sip
  item: null,    // cup
  path: [],
  seat: null,
  phase: Math.random() * 10,
  blink: false,
  task: null,    // 이동이 끝난 뒤 이어서 할 일
};

const SPEED = 130;

// ---------- 이동 ----------
function standUp() {
  if (me.seat) {
    me.seat.taken = false;
    const ap = me.seat.approach;
    me.x = ap.x;
    me.y = ap.y;
    me.seat = null;
  }
  me.state = 'idle';
}

function walkTo(target, task = null) {
  standUp();
  me.action = null;
  me.path = findPath(me, target);
  me.task = task;
  me.state = me.path.length ? 'walk' : 'idle';
  if (!me.path.length && task) runTask();
}

function runTask() {
  const t = me.task;
  me.task = null;
  if (t) t();
  refreshActions();
}

function sitOn(seat) {
  walkTo(seat.approach, () => {
    if (seat.taken) return;
    seat.taken = true;
    me.seat = seat;
    me.x = seat.x;
    me.y = seat.y;
    me.face = seat.face;
    me.state = 'sit';
  });
}

function faceToward(p) {
  me.face = (Math.atan2(p.y - me.y, p.x - me.x) * 180) / Math.PI;
}

// ---------- 활동 (글자 없이 동작만) ----------
let actionTimer = null;
function doAction(name, seconds = 0) {
  clearTimeout(actionTimer);
  me.action = name;
  if (seconds) actionTimer = setTimeout(() => { if (me.action === name) { me.action = null; refreshActions(); } }, seconds * 1000);
  refreshActions();
}

const ACTIONS = {
  gaze: () => { faceToward({ x: C.x, y: C.y - 400 }); doAction('gaze'); },
  read: () => doAction('read'),
  pray: () => doAction('pray'),
  wave: () => doAction('wave', 2.4),
  welcome: () => walkTo(spots.door, () => { me.face = 180; doAction('wave', 3); }),
  order: () => walkTo(spots.order, () => {
    faceToward(polar(330, 27));
    me.state = 'idle';
    me.action = 'wait';
    refreshActions();
    setTimeout(() => {
      if (me.action !== 'wait') return;
      me.action = null;
      walkTo(spots.pickup, () => { faceToward(polar(330, 8)); me.item = 'cup'; });
    }, 2600);
  }),
  sip: () => doAction('sip', 3),
  water: () => {
    let best = pots[0], bd = Infinity;
    for (const p of pots) {
      const d = Math.hypot(p.x - me.x, p.y - me.y);
      if (d < bd) { bd = d; best = p; }
    }
    const stand = nearestFree(polar(420, best.a - 6));
    walkTo(stand, () => { faceToward(best); doAction('water', 3); });
  },
  tray: () => walkTo(nearestFree(polar(400, 135)), () => { faceToward(polar(432, 135)); me.item = null; }),
};

function availableActions() {
  const zone = zoneAt(me);
  const list = [];
  if (me.state === 'walk' || me.action === 'wait') return list;
  if (zone === 'hub') list.push('gaze');
  if (zone === 'word') list.push('read');
  if (zone === 'prayer') list.push('pray');
  if (zone === 'fellowship' && !me.item) list.push('order');
  if (zone === 'witness') list.push('welcome');
  if (zone === 'rim') list.push('water');
  if (me.item === 'cup') list.push('sip');
  if (me.item === 'cup' && (zone === 'rim' || zone === 'witness')) list.push('tray');
  list.push('wave');
  return list;
}

let shown = '';
function refreshActions() {
  const list = availableActions();
  const key = list.join(',') + '|' + me.action;
  if (key === shown) return;
  shown = key;
  bar.innerHTML = '';
  for (const name of list) {
    const b = document.createElement('button');
    b.className = 'act' + (me.action === name ? ' on' : '');
    b.setAttribute('aria-label', name);
    b.innerHTML = ICONS[name];
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (me.action === name && name !== 'wave') { me.action = null; refreshActions(); return; }
      ACTIONS[name]();
    });
    bar.appendChild(b);
  }
}

// ---------- 화면·카메라 ----------
let vw = 0, vh = 0, dpr = 1, scale = 1;
const cam = { x: spawn.x, y: spawn.y };

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  const m = Math.min(vw, vh);
  scale = m >= 820 ? m / 1000 : m / 560; // 큰 화면은 카페 전체, 휴대폰은 가까이
}
window.addEventListener('resize', resize);
resize();

function updateCamera(dt) {
  const halfW = vw / scale / 2, halfH = vh / scale / 2;
  const clamp = (v, half) => (half * 2 >= SIZE ? SIZE / 2 : Math.max(half - 20, Math.min(SIZE - half + 20, v)));
  const tx = clamp(me.x, halfW), ty = clamp(me.y, halfH);
  const k = 1 - Math.exp(-dt * 4);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
}

function screenToWorld(sx, sy) {
  return { x: (sx - vw / 2) / scale + cam.x, y: (sy - vh / 2) / scale + cam.y };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = screenToWorld(e.clientX, e.clientY);
  // 의자를 눌렀으면 앉기
  let best = null, bd = 26;
  for (const s of seats) {
    if (s.taken && s !== me.seat) continue;
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < bd) { bd = d; best = s; }
  }
  if (best) {
    if (best === me.seat) return;
    sitOn(best);
  } else {
    walkTo(p);
  }
  ripple = { x: p.x, y: p.y, t: 0 };
  refreshActions();
});

let ripple = null;

// ---------- 루프 ----------
let last = performance.now();
let blinkAt = 2;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  // 걷기
  if (me.state === 'walk' && me.path.length) {
    const target = me.path[0];
    const dx = target.x - me.x, dy = target.y - me.y;
    const d = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (d > 0.5) me.face = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (d <= step) {
      me.x = target.x;
      me.y = target.y;
      me.path.shift();
      if (!me.path.length) {
        me.state = 'idle';
        runTask();
      }
    } else {
      me.x += (dx / d) * step;
      me.y += (dy / d) * step;
    }
  }
  // 깜빡임
  blinkAt -= dt;
  if (blinkAt < 0) { me.blink = true; if (blinkAt < -0.12) { me.blink = false; blinkAt = 2 + Math.random() * 3; } }

  refreshActions();
  updateCamera(dt);

  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#a8cf8e';
  g.fillRect(0, 0, vw, vh);
  g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (vw / 2 - cam.x * scale), dpr * (vh / 2 - cam.y * scale));
  drawWorld(g, scale * dpr);

  if (ripple) {
    ripple.t += dt;
    const a = 1 - ripple.t / 0.5;
    if (a <= 0) ripple = null;
    else {
      g.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(ripple.x, ripple.y, 6 + ripple.t * 30, 0, Math.PI * 2);
      g.stroke();
    }
  }

  drawCharacter(g, me, t);
  if (me.action === 'wait') {
    for (let k = 0; k < 3; k++) {
      const a = 0.3 + 0.7 * Math.max(0, Math.sin(t * 5 - k * 0.8));
      g.fillStyle = `rgba(90,70,60,${a})`;
      g.beginPath();
      g.arc(me.x - 7 + k * 7, me.y - 52, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  }
  drawLight(g, t);

  requestAnimationFrame(frame);
}

enter.addEventListener('click', () => {
  enter.classList.add('gone');
  setTimeout(() => enter.remove(), 600);
  // 들어오면 문에서 라운지 쪽으로 몇 걸음
  walkTo(polar(330, 180));
});

refreshActions();
requestAnimationFrame(frame);

// 개발 확인용(콘솔에서 상태 보기)
window.__cafe = { me, seats, walkTo, ACTIONS, zoneAt };
