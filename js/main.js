import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildWorld } from './build.js';
import { makeAvatar, poseAvatar } from './avatar.js';
import { findPath, nearestFree } from './nav.js';
import { floorY, seats, SPOTS, SPAWN, planters, polar, COUNTER, CEIL, Q, isFree } from './layout.js';
import { ICONS } from './icons.js';

const canvas = document.getElementById('cafe');
const bar = document.getElementById('actions');
const enter = document.getElementById('enter');

// ---------- 렌더러·장면 ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const PHONE = Math.min(window.innerWidth, window.innerHeight) < 600;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PHONE ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe3ee);
scene.fog = new THREE.Fog(0xcfe3ee, 70, 160);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc0, 0.7));
// 천창으로 들어오는 햇빛
const sun = new THREE.DirectionalLight(0xfff1dc, 1.6);
sun.position.set(-14, 40, -10);
sun.target.position.set(0, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(PHONE ? 1024 : 2048, PHONE ? 1024 : 2048);
const sc = sun.shadow.camera;
sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 10; sc.far = 80;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
// 실내 간접조명 느낌
const warm = new THREE.PointLight(0xffd59a, 30, 30, 1.6);
warm.position.set(0, 8, 0);
scene.add(warm);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

const { anim, interactive } = buildWorld(scene);
// 3인칭 카메라를 가릴 수 있는 물체(그림자를 드리우는 큰 물체들)
const occluders = [];
scene.traverse((o) => {
  if (!o.isMesh || !o.castShadow) return;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const r = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z);
  const wp = o.getWorldPosition(new THREE.Vector3());
  if (r > 0.6 && Math.hypot(wp.x, wp.z) < 27) occluders.push(o);
});
const occRay = new THREE.Raycaster();
let camPull = 99, occFrame = 0;

// ---------- 캐릭터 ----------
const HOODIES = [0x8fb7e0, 0xf2a7a0, 0xa7d3a6, 0xf4d27a, 0xb9a6e0, 0xf5f0e6];
const HAIRS = [0x3b2a22, 0x5a3b2a, 0x22201f, 0x7a5634];
const BAGS = [0x5b6b8a, 0x8a5b5b, 0x6b8a5b, 0x444444];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function loadLook() {
  try {
    const v = JSON.parse(localStorage.getItem('navs-cafe-look3d') || 'null');
    if (v && v.hoodie) return v;
  } catch (e) { /* 저장 불가 환경 */ }
  const look = { hoodie: pick(HOODIES), hair: pick(HAIRS), bag: pick(BAGS), style: Math.random() < 0.5 ? 0 : 1 };
  try { localStorage.setItem('navs-cafe-look3d', JSON.stringify(look)); } catch (e) { /* 무시 */ }
  return look;
}

function makeChar(look, x, z) {
  const av = makeAvatar(look);
  scene.add(av);
  return { av, x, z, y: floorY(x, z), face: Math.PI, state: 'idle', action: null, item: null, path: [], seat: null, task: null, phase: Math.random() * 10 };
}

const me = makeChar(loadLook(), SPAWN.x, SPAWN.z);

// 상주 캐릭터: 카운터 바리스타, 입구의 사장님 (각자 화면에서만 움직임)
const baristaPos = polar(COUNTER.r + 1.1, -54);
const barista = makeChar({ hoodie: 0x3f4a5a, hair: 0x2b211c, bag: 0x3f4a5a, style: 1, pants: 0x2f2f35 }, baristaPos.x, baristaPos.z);
barista.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false; // 백팩 없음
const apron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.02), new THREE.MeshStandardMaterial({ color: 0xe9e1d3 }));
apron.position.set(0, 0.48, 0.17);
barista.av.userData.body.add(apron);
const ownerPos = { x: 3.2, z: 22.2 };
const owner = makeChar({ hoodie: 0xd9cbb5, hair: 0x6b6b6b, bag: 0xd9cbb5, style: 0, pants: 0x55504a }, ownerPos.x, ownerPos.z);
owner.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
const npcs = [barista, owner];

// ---------- 이동 ----------
const SPEED = 2.6;

function standUp(ch) {
  if (ch.seat) {
    ch.seat.taken = false;
    ch.x = ch.seat.approach.x;
    ch.z = ch.seat.approach.z;
    ch.seat = null;
  }
  ch.state = 'idle';
}
function walkTo(ch, target, task = null) {
  standUp(ch);
  ch.action = null;
  ch.path = findPath(ch, target);
  ch.task = task;
  ch.state = ch.path.length ? 'walk' : 'idle';
  if (!ch.path.length && task) finishTask(ch);
}
function finishTask(ch) {
  const t = ch.task;
  ch.task = null;
  if (t) t();
}
function sitOn(ch, seat) {
  walkTo(ch, seat.approach, () => {
    if (seat.taken) return;
    seat.taken = true;
    ch.seat = seat;
    ch.x = seat.x;
    ch.z = seat.z;
    ch.face = seat.face;
    ch.state = 'sit';
  });
}
const faceTo = (ch, p) => { ch.face = Math.atan2(p.x - ch.x, p.z - ch.z); };

// ---------- 체험 동작 ----------
let actTimer = null;
function act(name, seconds = 0) {
  clearTimeout(actTimer);
  me.action = name;
  if (seconds) actTimer = setTimeout(() => { if (me.action === name) me.action = null; }, seconds * 1000);
}
let baristaBusy = 0;
function nearestSeat(kind, near) {
  let best = null, bd = Infinity;
  for (const s of seats) {
    if (s.kind !== kind || s.taken) continue;
    const d = Math.hypot(s.x - near.x, s.z - near.z);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

const ACTIONS = {
  light: () => walkTo(me, { x: 0.4, z: 0.9 }, () => { act('gaze'); }),
  pray: () => {
    const s = nearestSeat('kneel', me);
    if (s) sitOn(me, s);
    me.task = wrapTask(me.task, () => act('pray'));
  },
  order: () => walkTo(me, SPOTS.order, () => {
    faceTo(me, polar(COUNTER.r, -56));
    me.action = 'wait';
    baristaBusy = 2.8;
    setTimeout(() => {
      if (me.action !== 'wait') return;
      me.action = null;
      walkTo(me, SPOTS.pickup, () => { faceTo(me, polar(COUNTER.r, -40)); me.item = 'cup'; });
    }, 2800);
  }),
  sip: () => act('sip', 3),
  boat: () => {
    const s = nearestSeat('boat', me);
    if (s) sitOn(me, s);
  },
  read: () => {
    const s = nearestSeat('bench', SPOTS.read);
    if (s && Math.hypot(s.x - SPOTS.read.x, s.z - SPOTS.read.z) < 6) sitOn(me, s);
    me.task = wrapTask(me.task, () => act('read'));
  },
  water: (pot) => {
    let p = pot;
    if (!p) {
      let bd = Infinity;
      for (const q of planters) { const d = Math.hypot(q.x - me.x, q.z - me.z); if (d < bd) { bd = d; p = q; } }
    }
    const stand = nearestFree(polar(24.4, p.a));
    walkTo(me, stand, () => { faceTo(me, p); act('water', 3); });
  },
  tray: () => walkTo(me, SPOTS.tray, () => { faceTo(me, polar(25.5, 105)); me.item = null; }),
  wave: () => act('wave', 2.4),
  vhand: () => act('vhand', 2.6),
};
function wrapTask(first, then) {
  return () => { if (first) first(); then(); };
}

function availableActions() {
  const list = [];
  if (me.state === 'walk' || me.action === 'wait') return list;
  const near = (s) => Math.hypot(me.x - s.x, me.z - s.z) < s.r;
  if (near(SPOTS.light)) list.push('light');
  if (near(SPOTS.pray)) list.push('pray');
  if (near(SPOTS.order) && !me.item) list.push('order');
  if (near(SPOTS.boat)) list.push('boat');
  if (near(SPOTS.read)) list.push('read');
  if (Math.hypot(me.x, me.z) > 22.5) list.push('water');
  if (me.item === 'cup') list.push('sip');
  if (me.item === 'cup' && near(SPOTS.tray)) list.push('tray');
  list.push('wave');
  if (Math.hypot(me.x, me.z) > 22.5 || near(SPOTS.light)) list.push('vhand');
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
    const on = me.action === name || (name === 'light' && me.action === 'gaze') || (name === 'boat' && me.seat && me.seat.kind === 'boat');
    b.className = 'act' + (on ? ' on' : '');
    b.setAttribute('aria-label', name);
    b.innerHTML = ICONS[name];
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (on && name !== 'wave') { me.action = null; shown = ''; return; }
      ACTIONS[name]();
    });
    bar.appendChild(b);
  }
}

// ---------- 카메라 (끌어서 돌리기, 휠/두 손가락으로 확대) ----------
const view = { az: 0, el: 0.3, dist: 7, tx: me.x, ty: 1, tz: me.z, mode: 'third', pitch: 0, follow: true, lift: 0 };
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const pointers = new Map();
let drag = null, pinch = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, az: view.az, el: view.el, pitch: view.pitch };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: view.dist };
    drag = null;
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    view.dist = clamp(pinch.dist * (pinch.d / d), 3, 30);
  } else if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) {
      if (view.mode === 'first') {
        // 화면을 손으로 잡아 끄는 느낌: 오른쪽으로 밀면 시선은 왼쪽으로
        view.az = drag.az + dx * 0.005;
        view.pitch = clamp(drag.pitch + dy * 0.004, -0.7, 0.6);
      } else view.az = drag.az - dx * 0.006;
      if (view.mode !== 'first') view.el = clamp(drag.el + dy * 0.004, 0.05, 1.35);
      view.dragAt = performance.now();
    }
  }
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (drag && drag.moved <= 6 && performance.now() - drag.t < 600) tap(e.clientX, e.clientY);
  if (pointers.size < 2) pinch = null;
  drag = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.dist = clamp(view.dist * Math.exp(e.deltaY * 0.001), 3, 30);
}, { passive: false });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- 누르기: 전시물 → 체험, 의자 → 앉기, 바닥 → 걷기 ----------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let ripple = null;
const rippleMesh = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
rippleMesh.rotation.x = -Math.PI / 2;
rippleMesh.visible = false;
scene.add(rippleMesh);

function tap(sx, sy) {
  ndc.set((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(interactive, false);
  if (hits.length && hits[0].distance < 60) {
    const o = hits[0].object;
    const name = o.userData.action;
    if (name === 'water') return ACTIONS.water(o.userData.pot);
    if (ACTIONS[name]) return ACTIONS[name]();
  }
  const p = new THREE.Vector3();
  if (!ray.ray.intersectPlane(floorPlane, p)) return;
  let best = null, bd = 0.9;
  for (const s of seats) {
    if (s.taken && s !== me.seat) continue;
    const d = Math.hypot(s.x - p.x, s.z - p.z);
    if (d < bd) { bd = d; best = s; }
  }
  if (best) { if (best !== me.seat) sitOn(me, best); }
  else walkTo(me, { x: p.x, z: p.z });
  ripple = { x: p.x, z: p.z, t: 0 };
}

// ---------- 조이스틱 · 방향키로 걷기 ----------
const stickEl = document.getElementById('stick');
const knob = document.getElementById('knob');
const stick = { on: false, x: 0, y: 0, id: null };
const keys = new Set();
function setStick(e) {
  const r = stickEl.getBoundingClientRect();
  const R = r.width / 2;
  let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
  const d = Math.hypot(dx, dy), max = R - 10;
  if (d > max) { dx *= max / d; dy *= max / d; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  stick.x = dx / max; stick.y = dy / max;
}
stickEl.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  hideHint();
  stickEl.setPointerCapture(e.pointerId);
  stick.on = true; stick.id = e.pointerId;
  setStick(e);
});
stickEl.addEventListener('pointermove', (e) => { if (stick.on && e.pointerId === stick.id) setStick(e); });
function stickUp(e) {
  if (e.pointerId !== stick.id) return;
  stick.on = false; stick.x = stick.y = 0; stick.id = null;
  knob.style.transform = '';
}
stickEl.addEventListener('pointerup', stickUp);
stickEl.addEventListener('pointercancel', stickUp);
const KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
window.addEventListener('keydown', (e) => { if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); } });
window.addEventListener('keyup', (e) => { keys.delete(KEYMAP[e.code]); });
let stickDriving = false;
function driveStick(dt) {
  let jx = stick.x, jy = stick.y;
  if (keys.size) { jx = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0); jy = (keys.has('d') ? 1 : 0) - (keys.has('u') ? 1 : 0); }
  const mag = Math.min(1, Math.hypot(jx, jy));
  if (mag < 0.15) {
    if (stickDriving) { stickDriving = false; if (me.state === 'walk' && !me.path.length) me.state = 'idle'; }
    return;
  }
  if (!stickDriving) {
    // 조이스틱을 잡는 순간 하던 일을 멈추고 일어섬
    standUp(me); me.path = []; me.task = null; me.action = null;
    stickDriving = true;
  }
  const fx = -Math.sin(view.az), fz = -Math.cos(view.az); // 화면 안쪽
  const rx = Math.cos(view.az), rz = -Math.sin(view.az);  // 화면 오른쪽
  const mx = (fx * -jy + rx * jx) / mag, mz = (fz * -jy + rz * jx) / mag;
  const step = SPEED * (0.35 + 0.65 * mag) * dt;
  const nx = me.x + mx * step, nz = me.z + mz * step;
  if (isFree(nx, nz)) { me.x = nx; me.z = nz; }
  else if (isFree(nx, me.z)) me.x = nx;
  else if (isFree(me.x, nz)) me.z = nz;
  me.face = Math.atan2(mx, mz);
  me.state = 'walk';
}

// 처음 온 사람에게만: 조이스틱 위에서 손가락이 살짝 움직이는 안내 (글자 없음)
const hint = document.getElementById('hint');
function hideHint() {
  if (!hint || hint.hidden) return;
  hint.hidden = true;
  try { localStorage.setItem('navs-cafe-hinted', '1'); } catch (e) { /* 무시 */ }
}
function maybeHint() {
  let seen = false;
  try { seen = localStorage.getItem('navs-cafe-hinted') === '1'; } catch (e) { /* 무시 */ }
  if (seen || !hint) return;
  hint.hidden = false;
  setTimeout(hideHint, 7000);
}

// ---------- 위쪽 버튼: 장소 바로가기 + 시점 전환 ----------
const placesEl = document.getElementById('places');
const PLACES = [
  ['gaze', SPOTS.light, { x: 0, z: 0 }],
  ['pray', SPOTS.pray, Q.prayer],
  ['read', SPOTS.read, Q.word],
  ['order', SPOTS.order, Q.fellow],
  ['boat', SPOTS.boat, Q.witness],
];
for (const [icon, spot, look] of PLACES) {
  const b = document.createElement('button');
  b.className = 'place';
  b.setAttribute('aria-label', icon);
  b.innerHTML = ICONS[icon];
  b.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    walkTo(me, { x: spot.x, z: spot.z }, () => faceTo(me, look));
  });
  placesEl.appendChild(b);
}
const viewBtn = document.createElement('button');
viewBtn.className = 'place view';
function showViewIcon() {
  viewBtn.innerHTML = view.mode === 'first' ? ICONS.third : ICONS.first;
  viewBtn.setAttribute('aria-label', view.mode === 'first' ? 'third person' : 'first person');
}
viewBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  if (view.mode === 'third') { view.mode = 'first'; view.az = me.face + Math.PI; view.pitch = 0; }
  else { view.mode = 'third'; view.az = me.face + Math.PI; view.el = 0.3; view.dist = 7; }
  showViewIcon();
});
showViewIcon();
placesEl.appendChild(viewBtn);

// ---------- 루프 ----------
function stepChar(ch, dt) {
  if (ch.state === 'walk' && ch.path.length) {
    const tg = ch.path[0];
    const dx = tg.x - ch.x, dz = tg.z - ch.z;
    const d = Math.hypot(dx, dz);
    const step = SPEED * dt;
    if (d > 0.01) ch.face = Math.atan2(dx, dz);
    if (d <= step) {
      ch.x = tg.x; ch.z = tg.z;
      ch.path.shift();
      if (!ch.path.length) { ch.state = 'idle'; finishTask(ch); }
    } else {
      ch.x += (dx / d) * step;
      ch.z += (dz / d) * step;
    }
  }
  let fy = floorY(ch.x, ch.z);
  if (ch.seat) {
    if (ch.seat.kind === 'bench') fy = Math.max(fy, 0) + (Math.hypot(ch.x, ch.z) < 6 ? 0.5 : 0) + 0.28;
    if (ch.seat.kind === 'stool') fy = 0.28;
    if (ch.seat.kind === 'boat') fy = 0.2;
    if (ch.seat.kind === 'kneel') fy = 0.12;
  }
  ch.y += (fy - ch.y) * Math.min(1, dt * 10);
  ch.av.position.set(ch.x, ch.y, ch.z);
  // 부드럽게 돌기
  let da = ch.face - ch.av.rotation.y;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  ch.av.rotation.y += da * Math.min(1, dt * 10);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;

  driveStick(dt);
  stepChar(me, dt);
  poseAvatar(me.av, me, t, dt);
  // 상주 캐릭터
  baristaBusy -= dt;
  barista.action = baristaBusy > 0 ? 'read' : null; // 음료 만드는 손동작
  barista.face = baristaBusy > 0 ? Math.atan2(-barista.x, -barista.z) + 0.6 : Math.atan2(-barista.x, -barista.z);
  const nearOwner = Math.hypot(me.x - owner.x, me.z - owner.z) < 5;
  owner.action = nearOwner && Math.sin(t * 0.8) > 0.2 ? 'wave' : null;
  owner.face = nearOwner ? Math.atan2(me.x - owner.x, me.z - owner.z) : Math.PI;
  for (const n of npcs) { stepChar(n, dt); poseAvatar(n.av, n, t, dt); }
  barista.av.userData.book.visible = false;

  const camR = Math.hypot(camera.position.x, camera.position.z);
  for (const f of anim) f(t, { reading: me.action === 'read', praying: me.action === 'pray', me, camR }, dt * (window.__cafe.speed || 1));

  if (ripple) {
    ripple.t += dt;
    const a = 1 - ripple.t / 0.6;
    if (a <= 0) { ripple = null; rippleMesh.visible = false; }
    else {
      rippleMesh.visible = true;
      rippleMesh.position.set(ripple.x, floorY(ripple.x, ripple.z) + 0.02, ripple.z);
      rippleMesh.scale.setScalar(1 + ripple.t * 4);
      rippleMesh.material.opacity = a * 0.9;
    }
  }

  // 카메라 따라가기
  const k = 1 - Math.exp(-dt * 6);
  view.tx += (me.x - view.tx) * k;
  view.tz += (me.z - view.tz) * k;
  view.ty += (me.y + 1 - view.ty) * k;
  // 걷는 동안에는 시점이 천천히 캐릭터 뒤로 돌아감 (방금 화면을 끌었다면 잠시 기다림)
  const moving = me.state === 'walk';
  if (moving && view.mode === 'third' && performance.now() - (view.dragAt || 0) > 1500 && !stick.on) {
    let d = (me.face + Math.PI) - view.az;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    view.az += d * Math.min(1, dt * 1.6);
  }
  me.av.visible = view.mode !== 'first';
  // 세로 화면에서는 시선 높이를 올려 캐릭터가 아래쪽(조이스틱 위)에 오게 함
  view.lift = window.innerHeight > window.innerWidth ? 0.16 * view.dist : 0.08 * view.dist;
  if (view.mode === 'first') {
    // 1인칭: 캐릭터 눈 높이에서 바라보는 방향
    const eye = new THREE.Vector3(me.x, me.y + 1.25, me.z);
    camera.position.copy(eye);
    const fx = -Math.sin(view.az) * Math.cos(view.pitch), fz = -Math.cos(view.az) * Math.cos(view.pitch);
    camera.lookAt(eye.x + fx, eye.y + Math.sin(view.pitch), eye.z + fz);
  } else {
    const cy = Math.min(CEIL - 1.2, view.ty + Math.sin(view.el) * view.dist);
    const horiz = Math.cos(view.el) * view.dist;
    let cx = view.tx + Math.sin(view.az) * horiz, cz = view.tz + Math.cos(view.az) * horiz;
    // 카메라가 유리벽 밖으로 나가지 않게
    const cr = Math.hypot(cx, cz), maxR = 34;
    if (cr > maxR) {
      const dx = Math.sin(view.az), dz = Math.cos(view.az);
      const b = view.tx * dx + view.tz * dz, c = view.tx * view.tx + view.tz * view.tz - maxR * maxR;
      const s = -b + Math.sqrt(Math.max(0, b * b - c));
      cx = view.tx + dx * Math.max(1.2, s);
      cz = view.tz + dz * Math.max(1.2, s);
    }
    const hReal = Math.hypot(cx - view.tx, cz - view.tz);
        const camPos = new THREE.Vector3(cx, Math.min(cy, view.ty + hReal * Math.tan(view.el) + 0.3), cz);
    // 캐릭터와 카메라 사이에 기둥·조형물이 끼면 카메라를 앞으로 당김
    if (++occFrame % 3 === 0) {
      const from = new THREE.Vector3(view.tx, view.ty + 0.4, view.tz);
      const dir = camPos.clone().sub(from);
      const len = dir.length();
      occRay.set(from, dir.normalize());
      occRay.far = len;
      const hit = occRay.intersectObjects(occluders, false)[0];
      camPull = hit ? Math.max(1.2, hit.distance - 0.35) : 99;
    }
    const from = new THREE.Vector3(view.tx, view.ty + 0.4, view.tz);
    const full = camPos.distanceTo(from);
    view.pullCur = view.pullCur === undefined ? full : view.pullCur;
    const want = Math.min(full, camPull);
    view.pullCur += (want - view.pullCur) * Math.min(1, dt * (want < view.pullCur ? 12 : 3));
    const keep = Math.min(1, view.pullCur / full);
    if (keep < 0.999) {
      camPos.lerpVectors(from, camPos, keep);
    }
    camera.position.copy(camPos);
    camera.lookAt(view.tx, view.ty + 0.2 + view.lift * keep, view.tz);
  }

  refreshActions();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

enter.addEventListener('click', () => {
  enter.classList.add('gone');
  setTimeout(() => enter.remove(), 700);
  walkTo(me, { x: 0, z: 19 });
  setTimeout(maybeHint, 1200);
});
requestAnimationFrame(frame);

window.__cafe = { me, seats, walkTo, ACTIONS, view, sitOn, npcs, stick };
