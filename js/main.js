import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildWorld } from './build.js';
import { makeAvatar, poseAvatar } from './avatar.js';
import { findPath, nearestFree } from './nav.js';
import { floorY, seats, SPOTS, SPAWN, planters, polar, COUNTER, CEIL, Q, isFree, R_HALL, R_WALK, onWater, inPool, R_PARK } from './layout.js';
import { ICONS } from './icons.js';
import { loadProps, upgradeCup, fxSprite } from './props.js';
import { initSigns } from './signs.js';
import { initMusic } from './music.js';
import { showVerse } from './verses.js';
import { initPark } from './park.js';

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
scene.fog = new THREE.Fog(0xcfe3ee, 90, 200);
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

// 작은 효과음 (Kenney Interface Sounds, CC0) — 아주 작게
let actx = null;
const sfxBuf = {};
function sfx(name, vol = 0.25, rate = 1) {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const play = (b) => { const s = actx.createBufferSource(); const g = actx.createGain(); g.gain.value = vol; s.buffer = b; s.playbackRate.value = rate; s.connect(g).connect(actx.destination); s.start(); };
    if (sfxBuf[name] instanceof AudioBuffer) return play(sfxBuf[name]);
    if (!sfxBuf[name]) sfxBuf[name] = fetch('assets/sfx/' + name + '.mp3').then((r) => r.arrayBuffer()).then((a) => actx.decodeAudioData(a)).then((b) => { sfxBuf[name] = b; return b; }).catch(() => {});
    sfxBuf[name].then?.((b) => b && play(b));
  } catch (e) { /* 소리 없이 계속 */ }
}

const { anim, interactive, deco } = buildWorld(scene);
// 3인칭 카메라를 가릴 수 있는 물체(그림자를 드리우는 큰 물체들)
const occluders = [];
scene.traverse((o) => {
  if (!o.isMesh || !o.castShadow) return;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const r = o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z);
  if (r > 0.3 && r < 20) occluders.push(o);
});
const occRay = new THREE.Raycaster();
let occFrame = 0;
const fading = new Map(); // mesh -> { want }
function fadeOccluders(P, cam) {
  const hitNow = new Set();
  for (const dy of [-0.55, 0, 0.6]) {
    const from = new THREE.Vector3(P.x, P.y + dy, P.z);
    const dir = cam.clone().sub(from);
    const len = dir.length();
    occRay.set(from, dir.normalize());
    occRay.far = len - 0.2;
    for (const h of occRay.intersectObjects(occluders, false)) hitNow.add(h.object);
  }
  for (const o of hitNow) {
    if (!o.userData.fadeMat) {
      o.userData.baseMat = o.material;
      o.userData.fadeMat = o.material.clone();
      o.userData.fadeMat.transparent = true;
      o.userData.baseOpacity = o.material.opacity;
    }
    fading.set(o, 0.18);
  }
  for (const [o] of fading) if (!hitNow.has(o)) fading.set(o, 1);
}
function stepFades(dt) {
  for (const [o, want] of fading) {
    const m = o.userData.fadeMat;
    if (o.material !== m) { o.material = m; m.opacity = o.userData.baseOpacity; }
    m.opacity += (want * o.userData.baseOpacity - m.opacity) * Math.min(1, dt * 8);
    m.depthWrite = m.opacity > 0.9;
    if (want === 1 && m.opacity > 0.98 * o.userData.baseOpacity) { o.material = o.userData.baseMat; fading.delete(o); }
  }
}

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
// 바깥 정원에서는 달림
const runBoost = (ch) => (inPool(ch.x, ch.z) ? 0.55 : Math.hypot(ch.x, ch.z) > R_HALL + 1.2 ? 2.1 : 1);

function standUp(ch) {
  if (ch.seat) {
    ch.seat.taken = false;
    if (ch.state === 'sit' && ch.action && ch.action !== 'sip') ch.action = null;
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
    // 기도 구역에서는 방석에, 다른 곳에서는 그 자리에 무릎 꿇고 기도
    const s = Math.hypot(me.x - SPOTS.pray.x, me.z - SPOTS.pray.z) < SPOTS.pray.r ? nearestSeat('kneel', me) : null;
    if (s) { sitOn(me, s); me.task = wrapTask(me.task, () => act('pray')); }
    else { sitHere('kneel'); act('pray'); }
  },
  // 주문: 카운터 앞에서 메뉴(음료·빵)를 고르면 직원이 준비해 픽업대에서 받음
  order: () => walkTo(me, SPOTS.order, () => { faceTo(me, polar(COUNTER.r, -56)); me.action = 'menu'; }),
  sip: () => act('sip', 3),
  eat: () => {
    if (!me.food || me.action === 'eat') return;
    act('eat', 1.6);
    setTimeout(() => { if (!me.food) return; me.bites = (me.bites || 0) + 1; sfx('cup', 0.1); if (me.bites >= 3) { me.food = null; me.bites = 0; } }, 900);
  },
  boat: () => {
    const s = nearestSeat('boat', me);
    if (s) sitOn(me, s);
  },
  read: () => {
    // 말씀 구역에서는 벤치에 앉아서, 다른 곳에서는 그 자리에서 성경을 펼침
    if (Math.hypot(me.x - SPOTS.read.x, me.z - SPOTS.read.z) < SPOTS.read.r) {
      const s = nearestSeat('bench', SPOTS.read);
      if (s && Math.hypot(s.x - SPOTS.read.x, s.z - SPOTS.read.z) < 6) { sitOn(me, s); me.task = wrapTask(me.task, () => act('read')); return; }
    }
    act('read');
  },
  jump: () => {
    if (me.seat) standUp(me);
    // 공중에서 두 번 더 눌러 3단 점프까지
    if ((me.jumps || 0) >= 3) return;
    me.vy = [4.2, 4.0, 4.6][me.jumps || 0];
    me.jumps = (me.jumps || 0) + 1;
    me.jump = me.jumps;
  },
  sit: () => {
    // 가까운 빈 자리가 있으면 거기에, 없으면 바닥에 앉음
    const s = nearestFreeSeat(me, 3);
    if (s) sitOn(me, s);
    else sitHere('floor');
  },
  stand: () => { standUp(me); me.action = null; },
  share: () => {
    // 전도: 가까운 사람에게 걸어가 빛을 건넴 → 상대가 받고 반갑게 인사
    const n = nearestPerson(6);
    if (!n) return;
    const p = nearestFree({ x: n.x + (me.x - n.x) * 0.3, z: n.z + (me.z - n.z) * 0.3 }) || n;
    const dd = Math.hypot(me.x - n.x, me.z - n.z);
    const give = () => { faceTo(me, n); act('share', 2.4); n.face = Math.atan2(me.x - n.x, me.z - n.z); sendLight(me, n); };
    if (dd > 1.8) walkTo(me, p, give); else { standUp(me); give(); }
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
  tray: () => walkTo(me, SPOTS.tray, () => { faceTo(me, polar(25.5, 105)); me.item = null; me.food = null; }),
  wave: () => act('wave', 2.4),
  vhand: () => act('vhand', 2.6),
  calm: () => signs.calm(),
  loaves: () => signs.feed(),
  fish: () => signs.fish(),
  putdown: () => putDown(),
};
// ---------- 들고 있는 컵·빵 내려놓기 / 다시 집기 ----------
// 앞쪽 바닥 위로 광선을 내려 탁자·카운터 윗면을 찾고, 없으면 발밑 바닥에 둠
const placed = [];
const downRay = new THREE.Raycaster();
function putDown() {
  const u = me.av.userData;
  let kind, src;
  if (me.food) { kind = 'food'; src = u.foods[me.food]; }
  else if (me.item === 'cup') { kind = 'drink'; src = u.drinks[me.drink || 'coffee']; }
  if (!kind) return;
  const fx = Math.sin(me.face), fz = Math.cos(me.face);
  const base = floorY(me.x, me.z);
  let spot = null;
  // 손이 닿는 범위에서 가장 높은 윗면(의자보다 탁자)을 고름
  for (const r of [0.35, 0.55, 0.8, 1.05]) {
    const x = me.x + fx * r, z = me.z + fz * r;
    downRay.set(new THREE.Vector3(x, base + 1.4, z), new THREE.Vector3(0, -1, 0));
    downRay.far = 1.3;
    const hit = downRay.intersectObjects(scene.children, true).find((h) => {
      let o = h.object;
      while (o) { if (o === me.av || o.userData.placed) return false; o = o.parent; }
      return h.object.isMesh && h.face && h.face.normal.y > 0.5 && h.object.material && !h.object.material.transparent;
    });
    if (hit && hit.point.y > base + 0.35 && hit.point.y < base + 1.3 && (!spot || hit.point.y > spot.y + 0.05)) spot = hit.point;
  }
  if (!spot) spot = new THREE.Vector3(me.x + fx * 0.45, base + 0.01, me.z + fz * 0.45);
  const g = new THREE.Group();
  g.userData.placed = true;
  const model = src ? src.clone() : new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  if (src) {
    model.position.set(0, 0, 0);
    model.visible = true;
    model.traverse((o) => { o.visible = true; });
    if (kind === 'food') model.scale.multiplyScalar(Math.max(0.4, 1 - (me.bites || 0) * 0.25));
  }
  g.add(model);
  // 바닥이 놓일 자리에 맞도록 모델 아래쪽을 윗면에 붙임
  g.position.copy(spot);
  scene.add(g);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  model.position.y += spot.y - box.min.y + 0.003;
  g.rotation.y = me.face;
  // 집기 쉽도록 보이지 않는 넉넉한 터치 영역
  const hitBox = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitBox.position.y = 0.08;
  g.add(hitBox);
  const rec = { g, hitBox, kind, what: kind === 'food' ? me.food : me.drink, bites: me.bites || 0 };
  hitBox.userData.onTap = () => pickUp(rec);
  interactive.push(hitBox);
  placed.push(rec);
  if (placed.length > 12) removePlaced(placed[0]);
  if (kind === 'food') { me.food = null; me.bites = 0; } else { me.item = null; me.drink = null; }
  if (me.action === 'sip' || me.action === 'eat') me.action = null;
  sfx('cup', 0.15);
}
function removePlaced(rec) {
  scene.remove(rec.g);
  const i = interactive.indexOf(rec.hitBox); if (i >= 0) interactive.splice(i, 1);
  const j = placed.indexOf(rec); if (j >= 0) placed.splice(j, 1);
}
function pickUp(rec) {
  const take = () => {
    if (rec.kind === 'food') { if (me.food) return; me.food = rec.what; me.bites = rec.bites; }
    else { if (me.item) return; me.item = 'cup'; me.drink = rec.what; }
    removePlaced(rec);
    sfx('cup', 0.15);
  };
  const p = rec.g.position;
  if (Math.hypot(me.x - p.x, me.z - p.z) < 1.4) { faceTo(me, p); take(); }
  else { const s = nearestFree({ x: p.x + (me.x - p.x) * 0.15, z: p.z + (me.z - p.z) * 0.15 }) || p; walkTo(me, s, () => { faceTo(me, p); take(); }); }
}
// 메뉴: 음료 두 가지, 빵 세 가지
const DRINKS = ['coffee', 'tea'];
const FOODS = ['croissant', 'donut', 'muffin'];
for (const k of [...DRINKS, ...FOODS]) ACTIONS[k] = () => placeOrder(k);
function placeOrder(kind) {
  faceTo(me, polar(COUNTER.r, -56));
  me.action = 'wait';
  baristaBusy = 2.8;
  setTimeout(() => {
    if (me.action !== 'wait') return;
    me.action = null;
    walkTo(me, SPOTS.pickup, () => {
      faceTo(me, polar(COUNTER.r, -40));
      if (DRINKS.includes(kind)) { me.item = 'cup'; me.drink = kind; }
      else { me.food = kind; me.bites = 0; }
      sfx('cup', 0.15);
    });
  }, 2800);
}
function nearestFreeSeat(near, maxD) {
  let best = null, bd = maxD;
  for (const s of seats) {
    if (s.taken) continue;
    const d = Math.hypot(s.approach.x - near.x, s.approach.z - near.z);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
function sitHere(kind) {
  standUp(me);
  me.path = [];
  me.task = null;
  me.seat = { kind, x: me.x, z: me.z, face: me.face, approach: { x: me.x, z: me.z }, taken: true, free: true };
  me.state = 'sit';
}
function nearestPerson(maxD) {
  let best = null, bd = maxD;
  for (const n of npcs) {
    const d = Math.hypot(n.x - me.x, n.z - me.z);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}
// 전도할 때 건네는 작은 빛
const gifts = [];
const giftGeo = new THREE.SphereGeometry(0.09, 12, 10);
function sendLight(from, to) {
  const m = new THREE.Mesh(giftGeo, new THREE.MeshBasicMaterial({ color: 0xffd98a }));
  m.add(fxSprite('light_01', 0xffd98a, 0.9));
  scene.add(m);
  gifts.push({ m, from: { x: from.x, y: from.y + 0.75, z: from.z }, to, t: -0.6 });
}
// 빛이 닿을 때 반짝이는 별
const bursts = [];
function burst(x, y, z) {
  const sp = fxSprite('star_06', 0xfff0c0, 0.2);
  sp.position.set(x, y, z);
  scene.add(sp);
  bursts.push({ sp, t: 0 });
}
function stepBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.t += dt / 0.9;
    b.sp.scale.setScalar(0.2 + b.t * 1.4);
    b.sp.material.opacity = 1 - b.t;
    b.sp.material.rotation = b.t * 1.5;
    if (b.t >= 1) { scene.remove(b.sp); b.sp.material.dispose(); bursts.splice(i, 1); }
  }
}
// 물 위를 걸을 때 발밑에 퍼지는 물결
const wakeGeo = new THREE.RingGeometry(0.16, 0.22, 32);
const wakes = [];
let wakeT = 0;
function stepWakes(dt) {
  const w = onWater(me.x, me.z);
  wakeT -= dt;
  if (w && (me.state === 'walk' || me.jumps || signs.sinking()) && wakeT <= 0 && (me.hop || 0) < 0.05) {
    wakeT = 0.32;
    const m = new THREE.Mesh(wakeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(me.x, w.y + 0.015, me.z);
    scene.add(m);
    wakes.push({ m, t: 0 });
  }
  for (let i = wakes.length - 1; i >= 0; i--) {
    const k = wakes[i];
    k.t += dt / 1.6;
    k.m.scale.setScalar(1 + k.t * 7);
    k.m.material.opacity = 0.7 * (1 - k.t);
    if (k.t >= 1) { scene.remove(k.m); k.m.material.dispose(); wakes.splice(i, 1); }
  }
}
function stepGifts(dt) {
  for (let i = gifts.length - 1; i >= 0; i--) {
    const g = gifts[i];
    g.t += dt / 1.3;
    const u = Math.max(0, Math.min(1, g.t));
    const tx = g.to.x, ty = g.to.y + 0.9, tz = g.to.z;
    g.m.position.set(g.from.x + (tx - g.from.x) * u, g.from.y + (ty - g.from.y) * u + Math.sin(u * Math.PI) * 0.7, g.from.z + (tz - g.from.z) * u);
    g.m.visible = g.t > 0;
    if (g.t >= 1) {
      scene.remove(g.m);
      gifts.splice(i, 1);
      g.to.action = 'vhand';
      g.to.glow = 2.5;
      burst(tx, ty, tz);
      sfx('share', 0.2);
      setTimeout(() => { if (g.to.action === 'vhand') g.to.action = null; }, 2400);
    }
  }
}

function wrapTask(first, then) {
  return () => { if (first) first(); then(); };
}

function availableActions() {
  const list = [];
  if (me.action === 'wait') return list;
  if (me.action === 'menu') {
    if (Math.hypot(me.x - SPOTS.order.x, me.z - SPOTS.order.z) < SPOTS.order.r) return [...(me.item ? [] : DRINKS), ...(me.food ? [] : FOODS)];
    me.action = null;
  }
  if (signs.canCalm()) list.push('calm'); // 풍랑 속: 손을 들어 잠잠케
  if (me.state === 'walk') return ['jump']; // 걷는 중에는 점프만
  const near = (s) => Math.hypot(me.x - s.x, me.z - s.z) < s.r;
  // 그 장소에서만 할 수 있는 일
  if (near(SPOTS.light)) list.push('light');
  if (near(SPOTS.order) && (!me.item || !me.food)) list.push('order');
  if (near(SPOTS.boat)) list.push('boat');
  if (Math.hypot(me.x, me.z) > 22.5 && Math.hypot(me.x, me.z) < R_HALL) list.push('water');
  if (me.item === 'cup') list.push('sip');
  if (me.food) list.push('eat');
  if (signs.nearBread()) list.push('loaves');
  if (signs.canFish()) list.push('fish');
  list.push(...park.available());
  if ((me.item === 'cup' || me.food) && !near(SPOTS.tray)) list.push('putdown');
  if ((me.item === 'cup' || me.food) && near(SPOTS.tray)) list.push('tray');
  // 어디서나 할 수 있는 일
  list.push(me.state === 'sit' ? 'stand' : 'sit');
  if (me.state !== 'sit') list.push('jump');
  list.push('pray', 'read');
  if (nearestPerson(6)) list.push('share');
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
    const on = me.action === name || (name === 'light' && me.action === 'gaze') || (name === 'boat' && me.seat && me.seat.kind === 'boat');
    if (name === 'jump' || name === 'sit' || name === 'stand' || name === 'share') { /* 누를 때마다 실행 */ }
    b.className = 'act' + (on ? ' on' : '');
    b.setAttribute('aria-label', name);
    b.innerHTML = ICONS[name];
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      sfx(name === 'sip' || name === 'order' || name === 'eat' ? 'cup' : 'tap', 0.15);
      if (on && name !== 'wave' && name !== 'share') { me.action = null; if (me.seat && me.seat.free) standUp(me); shown = ''; return; }
      ACTIONS[name]();
    });
    bar.appendChild(b);
  }
}

// ---------- 카메라 (끌어서 돌리기, 휠/두 손가락으로 확대) ----------
const view = { az: 0, el: 0.55, dist: 7.5, tx: me.x, ty: 0.62, tz: me.z, mode: 'third', pitch: 0, follow: true };
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
    view.dist = clamp(pinch.dist * (pinch.d / d), 4.5, 16);
  } else if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) {
      if (view.mode === 'first') {
        // 화면을 손으로 잡아 끄는 느낌: 오른쪽으로 밀면 시선은 왼쪽으로
        view.az = drag.az - dx * 0.005;
        view.pitch = clamp(drag.pitch + dy * 0.004, -0.7, 0.6);
      } else view.az = drag.az + dx * 0.006;
      if (view.mode !== 'first') view.el = clamp(drag.el - dy * 0.004, 0.08, 1.1);
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
  view.dist = clamp(view.dist * Math.exp(e.deltaY * 0.001), 4.5, 16);
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
    if (o.userData.onTap) { sfx('orb', 0.2); return o.userData.onTap(); }
    if (o.userData.seat) {
      const l = o.userData.seat;
      const st = seats.find((q) => q.kind === 'lounge' && Math.abs(q.x - l.chair.x) < 0.01 && Math.abs(q.z - l.chair.z) < 0.01);
      if (st && !st.taken && st !== me.seat) { sfx('tap', 0.15); sitOn(me, st); }
      return;
    }
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
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { ACTIONS.jump(); e.preventDefault(); return; }
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
});
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
  me.running = runBoost(me) > 1 && mag > 0.6;
  const step = SPEED * (0.35 + 0.65 * mag) * (me.running ? runBoost(me) : 1) * dt;
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
  ['garden', { x: 0, z: R_PARK - 2 }, { x: 0, z: 80 }],
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
  else { view.mode = 'third'; view.az = me.face + Math.PI; view.el = 0.55; view.dist = 7.5; }
  showViewIcon();
});
showViewIcon();
placesEl.appendChild(viewBtn);
// 음악 켜기/끄기
const musicBtn = document.createElement('button');
musicBtn.className = 'place view music';
placesEl.appendChild(musicBtn);
const music = initMusic(musicBtn, ICONS);

// ---------- 루프 ----------
function stepChar(ch, dt) {
  if (ch.state === 'walk' && ch.path.length) {
    const tg = ch.path[0];
    const dx = tg.x - ch.x, dz = tg.z - ch.z;
    const d = Math.hypot(dx, dz);
    ch.running = runBoost(ch) > 1;
    const step = SPEED * runBoost(ch) * dt;
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
    if (ch.seat.kind === 'bench') fy = Math.max(fy, 0) + 0.28; // 바닥 높이(가운데 단 포함) + 앉은 높이
    if (ch.seat.kind === 'stool') fy = 0.28;
    if (ch.seat.kind === 'boat') fy = 0.2;
    if (ch.seat.kind === 'kneel') fy = ch.seat.free ? floorY(ch.x, ch.z) - 0.02 : 0.12;
    if (ch.seat.kind === 'floor') fy = floorY(ch.x, ch.z) - 0.2;
    if (ch.seat.kind === 'lounge') fy = floorY(ch.x, ch.z) + 0.22;
    if (ch.seat.kind === 'gbench') fy = floorY(ch.x, ch.z) + 0.25;
    if (ch.seat.top != null) fy = ch.seat.top - 0.14; // 모델에서 잰 앉는 면 높이
  }
  ch.y += (fy - ch.y) * Math.min(1, dt * 10);
  // 점프: 위로 튀어 올랐다가 중력으로 내려옴 (공중에서 다시 누르면 한 번 더)
  let hop = ch.hop || 0;
  if (ch.jumps) {
    hop += ch.vy * dt;
    ch.vy -= 13 * dt;
    if (hop <= 0) { hop = 0; ch.vy = 0; ch.jumps = 0; ch.jump = 0; if (ch === me) sfx('land', 0.15); }
  }
  ch.hop = hop;
  ch.av.position.set(ch.x, ch.y + hop + (ch.sinkY || 0) + (ch.swimY || 0), ch.z);
  // 부드럽게 돌기
  let da = ch.face - ch.av.rotation.y;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  ch.av.rotation.y += da * Math.min(1, dt * 10);
}

// 동작을 시작하거나 자리에 앉으면 잠시 뒤 그 동작에 어울리는 말씀이 은은하게 떠오름
const ACTION_VERSE = { gaze: 'light', pray: 'pray', read: 'read', water: 'water_plant', share: 'share', sip: 'drink', eat: 'eat' };
const SEAT_VERSE = { lounge: 'rest', bench: 'rest', gbench: 'garden', boat: 'boat', floor: 'still', log: 'campfire', vine: 'vine', picnic: 'bbq' };
let prevAct = null, prevSeat = null;
function verseHooks() {
  if (me.action !== prevAct) {
    prevAct = me.action;
    const k = ACTION_VERSE[me.action];
    if (k) showVerse(k, { delay: me.action === 'pray' || me.action === 'read' || me.action === 'gaze' ? 2.5 : 1.2 });
  }
  const sk = me.state === 'sit' && me.seat ? me.seat.kind : null;
  if (sk !== prevSeat) {
    prevSeat = sk;
    if (SEAT_VERSE[sk] && !me.action) showVerse(SEAT_VERSE[sk], { delay: 2.2 });
  }
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
  if (barista.action !== 'vhand') barista.action = baristaBusy > 0 ? 'read' : null; // 음료 만드는 손동작
  barista.face = baristaBusy > 0 ? Math.atan2(-barista.x, -barista.z) + 0.6 : Math.atan2(-barista.x, -barista.z);
  const nearOwner = Math.hypot(me.x - owner.x, me.z - owner.z) < 5;
  if (owner.action !== 'vhand') owner.action = nearOwner && Math.sin(t * 0.8) > 0.2 ? 'wave' : null;
  owner.face = nearOwner ? Math.atan2(me.x - owner.x, me.z - owner.z) : Math.PI;
  for (const n of npcs) { stepChar(n, dt); poseAvatar(n.av, n, t, dt); }
  stepGifts(dt);
  barista.av.userData.book.visible = false;

  const camR = Math.hypot(camera.position.x, camera.position.z);
  for (const f of anim) f(t, { reading: me.action === 'read', praying: me.action === 'pray' && Math.hypot(me.x - SPOTS.pray.x, me.z - SPOTS.pray.z) < SPOTS.pray.r + 2, me, camR, storm: signs.storm.level }, dt * (window.__cafe.speed || 1));

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

  // 카메라 따라가기: 기준점은 캐릭터 몸 가운데(점프는 따라가지 않아 화면이 흔들리지 않음)
  const k = 1 - Math.exp(-dt * 8);
  view.tx += (me.x - view.tx) * k;
  view.tz += (me.z - view.tz) * k;
  view.ty += (me.y + 0.62 - view.ty) * k;
  // 걷는 동안에는 시점이 천천히 캐릭터 뒤로 돌아감 (방금 화면을 끌었다면 잠시 기다림)
  const moving = me.state === 'walk';
  // 조이스틱으로 방향을 틀어도 화면이 진행 방향 쪽으로 따라 돎 (카메라 쪽으로 걸어올 때는 돌리지 않음)
  if (moving && performance.now() - (view.dragAt || 0) > 1200) {
    let d = (me.face + Math.PI) - view.az;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 2.4) view.az += d * Math.min(1, dt * (stickDriving ? 1.4 : 1.8));
  }
  me.av.visible = view.mode !== 'first';
  if (view.mode === 'first') {
    // 1인칭: 캐릭터 눈 높이에서 바라보는 방향
    const eye = new THREE.Vector3(me.x, me.y + 1.25, me.z);
    camera.position.copy(eye);
    const fx = -Math.sin(view.az) * Math.cos(view.pitch), fz = -Math.cos(view.az) * Math.cos(view.pitch);
    camera.lookAt(eye.x + fx, eye.y + Math.sin(view.pitch), eye.z + fz);
  } else {
    // 3인칭: 캐릭터(약 1.3m)가 머리부터 발끝까지 화면 가운데 약간 아래에 오도록
    // 카메라는 캐릭터를 중심으로 공전하고, 절대 일정 거리(4.5m)보다 가까이 오지 않음.
    // 사이에 기둥·조형물이 끼면 카메라를 당기지 않고 그 물체를 반투명하게 만듦.
    const P = new THREE.Vector3(view.tx, view.ty, view.tz);
    const el = clamp(view.el, 0.08, 1.1);
    let dist = Math.max(4.5, view.dist);
    const up = Math.sin(el) * dist;
    if (P.y + up > CEIL - 0.8) dist = (CEIL - 0.8 - P.y) / Math.sin(el); // 천장 아래로
    dist = Math.max(4.5, dist);
    const horiz = Math.cos(el) * dist;
    const camPos = new THREE.Vector3(P.x + Math.sin(view.az) * horiz, Math.min(CEIL - 0.8, P.y + Math.sin(el) * dist), P.z + Math.cos(view.az) * horiz);
    camera.position.copy(camPos);
    camera.lookAt(P);
    // 화면에서 캐릭터 중심이 세로 -0.22(가운데보다 약간 아래)에 오도록 위로 살짝 기울임
    camera.rotateX(Math.atan(0.22 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    if (++occFrame % 3 === 0) fadeOccluders(P, camPos);
  }
  if (window.__cafe.camOverride) { const o = window.__cafe.camOverride; camera.position.set(...o.pos); camera.lookAt(...o.look); } // 시험용 시점
  stepFades(dt);
  stepBursts(dt);
  stepWakes(dt);
  signs.step(dt * (window.__cafe.speed || 1));
  park.step(dt * (window.__cafe.speed || 1), t);
  // 그림자 범위가 캐릭터를 따라감 (넓은 정원에서도 그림자)
  {
    const sx = Math.round(me.x / 4) * 4, sz = Math.round(me.z / 4) * 4;
    sun.position.set(sx - 14, 40, sz - 10);
    sun.target.position.set(sx, 0, sz);
  }

  verseHooks();
  refreshActions();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

enter.addEventListener('click', () => {
  enter.classList.add('gone');
  setTimeout(() => enter.remove(), 700);
  music.resume();
  walkTo(me, { x: 0, z: 19 });
  setTimeout(maybeHint, 1200);
});
const signs = initSigns({ scene, me, npcs, interactive, act, sfx, fxSprite, burst, sun, walkTo, faceTo });
const park = initPark({ scene, me, interactive, act, sfx, fxSprite, burst, walkTo, faceTo, standUp });
Object.assign(ACTIONS, park.actions);
requestAnimationFrame(frame);
// 첫 화면이 뜬 뒤 소품 모델을 천천히 불러와 바꿔 끼움
setTimeout(() => {
  loadProps({ scene, deco, interactive, anim, renderer });
  upgradeCup(me.av);
  for (const n of npcs) if (n.av) upgradeCup(n.av);
}, 300);

window.__cafe = { me, seats, walkTo, ACTIONS, view, sitOn, npcs, stick, signs, placed, park, renderer };
