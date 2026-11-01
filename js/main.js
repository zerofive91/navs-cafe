import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildWorld } from './build.js';
import { makeAvatar, poseAvatar } from './avatar.js';
import { findPath, nearestFree } from './nav.js';
import { C, TRAY, R_RIM_IN, floorY, seats, SPOTS, SPAWN, planters, polar, COUNTER, CEIL, Q, isFree, R_HALL, R_WALK, onWater, inPool, R_PARK, nearTree } from './layout.js';
import { ICONS } from './icons.js';
import { loadProps, upgradeCup, fxSprite } from './props.js';
import { initSigns } from './signs.js';
import { initMusic } from './music.js';
import { showVerse, showNext, nextVerse } from './verses.js';
import { initPark } from './park.js';
import { initMap } from './map.js';
import { initScrolls } from './scrolls.js';
import { initTogether, inviteCodeFromUrl, newInviteCode, inviteLink, RANDOM_CAP, INVITE_CAP } from './together.js';

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
scene.fog = new THREE.Fog(0xcfe3ee, 45, 180);
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

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 520);

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

const myLook = loadLook();
const me = makeChar(myLook, SPAWN.x, SPAWN.z);

// 상주 캐릭터: 카운터 바리스타, 입구의 사장님 (각자 화면에서만 움직임)
const baristaPos = polar(COUNTER.r + 1.1, -54);
const barista = makeChar({ hoodie: 0x3f4a5a, hair: 0x2b211c, bag: 0x3f4a5a, style: 1, pants: 0x2f2f35 }, baristaPos.x, baristaPos.z);
barista.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false; // 백팩 없음
const apron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.02), new THREE.MeshStandardMaterial({ color: 0xe9e1d3 }));
apron.position.set(0, 0.48, 0.17);
barista.av.userData.body.add(apron);
const ownerPos = { x: 3.2, z: 22.2 * C };
const owner = makeChar({ hoodie: 0xd9cbb5, hair: 0x6b6b6b, bag: 0xd9cbb5, style: 0, pants: 0x55504a }, ownerPos.x, ownerPos.z);
owner.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
const npcs = [barista, owner];

// ---------- 이동 ----------
const SPEED = 2.6;
// 바깥 정원에서는 달림
const outdoors = (ch) => Math.hypot(ch.x, ch.z) > R_HALL + 1.2;
const runBoost = (ch) => (inPool(ch.x, ch.z) ? 0.55 : outdoors(ch) && !ch.walkMode ? 2.1 : 1);

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
function walkTo(ch, target, task = null, path = null) {
  standUp(ch);
  ch.action = null;
  ch.path = path || findPath(ch, target);
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
    if (me.slow) { sfx('impact/impactSoft_heavy_000', 0.2, 0.6); return; } // 짐이 무거워 뛰어오를 수 없음
    if (me.climb) { const h = me.climb.y; dropFromTree(); me.hop = h; me.vy = 4.2; me.jumps = 1; return; }
    if (me.seat) standUp(me);
    // 공중에서 두 번 더 눌러 3단 점프까지
    if ((me.jumps || 0) >= 3) return;
    me.vy = [4.2, 4.0, 4.6][me.jumps || 0];
    me.jumps = (me.jumps || 0) + 1;
    me.jump = me.jumps;
  },
  recline: () => { // 그 자리에 누워 쉬기
    const s = nearestFreeSeat(me, 3);
    if (s && (s.kind === 'recline' || s.kind === 'beanbag')) return sitOn(me, s);
    sitHere('lie');
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
    const stand = nearestFree(polar(24.4 * C, p.a));
    walkTo(me, stand, () => { faceTo(me, p); act('water', 3); });
  },
  tray: () => walkTo(me, SPOTS.tray, () => { faceTo(me, TRAY); me.item = null; me.food = null; }),
  wave: () => act('wave', 2.4),
  praise: () => { if (me.seat && me.seat.kind !== 'kneel') standUp(me); act('praise'); },
  vhand: () => act('vhand', 2.6),
  climb: () => {
    const t = nearTree(me.x, me.z, 1.8, 3.6);
    if (!t) return;
    standUp(me); me.path = []; me.task = null;
    const a = Math.atan2(me.z - t.z, me.x - t.x);
    me.climb = { t, y: 0, phase: 'up', from: { x: me.x, z: me.z }, x: t.x + Math.cos(a) * 0.38, z: t.z + Math.sin(a) * 0.38, top: Math.max(0.6, t.h * 1.15 * 0.3 - 1.35) }; // 손이 가장 낮은 가지에 닿는 높이
    me.face = Math.atan2(t.x - me.x, t.z - me.z);
    me.jumps = 0; me.vy = 0;
  },
  down: () => dropFromTree(),
  walk: () => { me.walkMode = true; shown = ''; },
  run: () => { me.walkMode = false; shown = ''; },
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
  for (const n of [...npcs, ...together.people.values()]) {
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

// 나무에서 손을 놓으면 그 높이에서 떨어짐(점프 낙하와 같음)
function dropFromTree() {
  if (!me.climb) return;
  // 내려오면 오르기 전에 서 있던 길 쪽으로 (숲의 나무는 길 밖에 있어 줄기 옆에 내리면 갇힘)
  const from = me.climb.from;
  if (from && !isFree(me.x, me.z)) { me.x = from.x; me.z = from.z; }
  me.climb = null;
  me.action = null;
  me.jumps = 1; me.vy = 0.5;
}
function wrapTask(first, then) {
  return () => { if (first) first(); then(); };
}

function availableActions() {
  const list = [];
  if (me.action === 'wait') return list;
  if (me.climb) return me.climb.phase === 'hang' ? ['down', 'jump'] : ['down'];
  const walkToggle = outdoors(me) && !inPool(me.x, me.z) && !me.slow ? [me.walkMode ? 'run' : 'walk'] : [];
  if (me.action === 'menu') {
    if (Math.hypot(me.x - SPOTS.order.x, me.z - SPOTS.order.z) < SPOTS.order.r) return [...(me.item ? [] : DRINKS), ...(me.food ? [] : FOODS)];
    me.action = null;
  }
  if (signs.canCalm()) list.push('calm'); // 풍랑 속: 손을 들어 잠잠케
  if (me.state === 'walk') return [...(me.slow ? park.available() : ['jump']), ...walkToggle]; // 걷는 중에는 점프(와 걷기·달리기)만
  const near = (s) => Math.hypot(me.x - s.x, me.z - s.z) < s.r;
  // 그 장소에서만 할 수 있는 일
  if (near(SPOTS.light)) list.push('light');
  if (near(SPOTS.order) && (!me.item || !me.food)) list.push('order');
  if (near(SPOTS.boat)) list.push('boat');
  if (Math.hypot(me.x, me.z) > R_RIM_IN - 1 && Math.hypot(me.x, me.z) < R_HALL) list.push('water');
  if (me.item === 'cup') list.push('sip');
  if (me.food) list.push('eat');
  if (signs.nearBread()) list.push('loaves');
  if (signs.canFish()) list.push('fish');
  list.push(...park.available());
  if (outdoors(me) && nearTree(me.x, me.z, 1.8, 3.6)) list.push('climb');
  list.push(...walkToggle);
  if ((me.item === 'cup' || me.food) && !near(SPOTS.tray)) list.push('putdown');
  if ((me.item === 'cup' || me.food) && near(SPOTS.tray)) list.push('tray');
  // 어디서나 할 수 있는 일
  list.push(me.state === 'sit' ? 'stand' : 'sit');
  if (me.state !== 'sit' && !inPool(me.x, me.z) && !me.slow) list.push('recline');
  if (me.state !== 'sit' && !me.slow) list.push('jump');
  list.push('pray', 'read', 'praise');
  if (nearestPerson(6)) list.push('share');
  list.push('wave');
  return list;
}
let shown = '';
function pressAction(name, on) {
  sfx(name === 'sip' || name === 'order' || name === 'eat' ? 'cup' : 'tap', 0.15);
  if (VERSE_OF[name]) showNext(VERSE_OF[name], on ? 0.2 : 1.2);
  if (on && VERSE_OF[name]) return; // 이미 하는 중이면 다음 구절만
  if (on && name !== 'wave' && name !== 'share') { me.action = null; if (me.seat && me.seat.free) standUp(me); shown = ''; return; }
  ACTIONS[name]();
}
// 단추 목록에 지금 있는 동작만 키보드로도 누를 수 있음
function pressIfAvailable(...names) {
  const list = availableActions();
  const name = names.find((n) => list.includes(n));
  if (!name) return false;
  const on = me.action === name || (name === 'light' && me.action === 'gaze') || (name === 'boat' && me.seat && me.seat.kind === 'boat');
  pressAction(name, on);
  return true;
}
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
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); pressAction(name, on); });
    bar.appendChild(b);
  }
}

// ---------- 카메라 (끌어서 돌리기, 휠/두 손가락으로 확대) ----------
const view = { az: 0, el: 0.55, dist: 7.5, tx: me.x, ty: 0.62, tz: me.z, mode: 'third', pitch: 0, follow: true, shot: null, w: 0 };
// 체험 시점: 체험을 시작하면 캐릭터와 대상이 함께 잘 보이는 자리로 카메라가 천천히 옮겨 감.
// 정해진 시간이 지나거나, 조이스틱을 움직이거나, 화면을 끌면 원래 시점으로 부드럽게 돌아옴.
//   target: 바라볼 대상, side: 캐릭터 뒤에서 옆으로 비켜선 각도, mid: 시선 중심(0 캐릭터 ~ 1 대상), y: 시선 높이
function shot(target, { dist = 10, el = 0.35, side = 0.55, dur = 7, mid = 0.5, y = 1.2 } = {}) {
  if (view.mode === 'first') return;
  const t = typeof target === 'function' ? target() : target;
  const az = Math.atan2(t.x - me.x, t.z - me.z) + Math.PI + side;
  view.shot = { az, el, dist, mid, y, target: t, until: performance.now() + dur * 1000 };
}
function endShot() {
  if (!view.shot) return;
  view.az = view.shot.az; // 돌아올 때 옆으로 휙 돌지 않도록 방향은 그대로 둠
  view.shot = null;
}
// 휴대폰이 세로로 잠겨 있어도(카카오톡 안 브라우저 등) 버튼으로 화면 전체를 눕혀 가로로 볼 수 있음
const rot = { on: false };
const vw = () => (rot.on ? window.innerHeight : window.innerWidth);
const vh = () => (rot.on ? window.innerWidth : window.innerHeight);
// 화면 좌표 → 눕힌 화면 안의 좌표
const pt = (e) => (rot.on ? { x: e.clientY, y: window.innerWidth - e.clientX } : { x: e.clientX, y: e.clientY });
function setRotated(v) {
  rot.on = v;
  document.documentElement.classList.toggle('rot', v);
  resize();
}
function resize() {
  // 진짜로 가로가 되었으면 눕히기는 풀기
  if (rot.on && window.innerWidth > window.innerHeight) { rot.on = false; document.documentElement.classList.remove('rot'); }
  const w = vw(), h = vh();
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));
if (screen.orientation) screen.orientation.addEventListener?.('change', () => setTimeout(resize, 250));
resize();

const pointers = new Map();
let drag = null, pinch = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const q = pt(e);
  pointers.set(e.pointerId, q);
  if (pointers.size === 1) drag = { x: q.x, y: q.y, t: performance.now(), moved: 0, az: view.az, el: view.el, pitch: view.pitch };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: view.dist };
    drag = null;
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const q = pt(e);
  pointers.set(e.pointerId, q);
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    view.dist = clamp(pinch.dist * (pinch.d / d), 4.5, 16);
  } else if (drag) {
    const dx = q.x - drag.x, dy = q.y - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) {
      if (view.mode === 'first') {
        // 화면을 손으로 잡아 끄는 느낌: 오른쪽으로 밀면 시선은 왼쪽으로
        view.az = drag.az - dx * 0.005;
        view.pitch = clamp(drag.pitch + dy * 0.004, -0.7, 0.6);
      } else view.az = drag.az + dx * 0.006;
      if (view.mode !== 'first') view.el = clamp(drag.el - dy * 0.004, 0.08, 1.1);
      view.dragAt = performance.now(); endShot();
    }
  }
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (drag && drag.moved <= 6 && performance.now() - drag.t < 600) { const q = pt(e); tap(q.x, q.y); }
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
  ndc.set((sx / vw()) * 2 - 1, -(sy / vh()) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(interactive, false);
  if (hits.length && hits[0].distance < 60) {
    const o = hits[0].object;
    if (o.userData.onTap) { sfx('orb', 0.2); return o.userData.onTap(); }
    if (o.userData.rest) {
      const st = o.userData.rest.seat;
      if (st && !st.taken && st !== me.seat) { sfx('tap', 0.15); sitOn(me, st); }
      return;
    }
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
  const c = pt({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }), q = pt(e);
  let dx = q.x - c.x, dy = q.y - c.y;
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
// 컴퓨터 단축키: 방향키·WASD 걷기, 스페이스 점프, M 지도, Shift 걷기/달리기, E 그 자리 체험(나무 오르기·주문·낚시 등), Enter 다음 말씀
// Z 말씀, X 기도, C 교제, V 증거, B 찬양 (수레바퀴 순서) / J 앉기, K 눕기, L 먹고 마시기
const NOT_E = new Set(['walk', 'run', 'sit', 'stand', 'recline', 'jump', 'pray', 'read', 'praise', 'share', 'wave', 'sip', 'eat', 'putdown']);
const lying = () => me.seat && (me.seat.kind === 'lie' || me.seat.kind === 'recline' || me.seat.kind === 'beanbag');
const goPlace = (name) => { const p = PLACES.find((q) => q[0] === name); if (p) walkTo(me, { x: p[1].x, z: p[1].z }, () => faceTo(me, p[2])); };
const toggle = (name) => (me.action === name ? (me.seat ? ACTIONS.stand() : (me.action = null)) : pressIfAvailable(name));
const HOTKEYS = {
  KeyM: () => (map.el.hidden ? map.open() : map.shut()),
  Escape: () => { if (!map.el.hidden) map.shut(); },
  ShiftLeft: () => pressIfAvailable('walk', 'run'),
  ShiftRight: () => pressIfAvailable('walk', 'run'),
  KeyZ: () => toggle('read'),
  KeyX: () => (me.action === 'pray' ? ACTIONS.stand() : pressIfAvailable('pray')),
  // 교제: 카운터 앞이면 주문, 아니면 교제의 자리(카페 카운터)로 걸어감
  KeyC: () => pressIfAvailable('order') || goPlace('order'),
  // 증거: 가까이 사람이 있으면 빛을 건넴, 없으면 전도를 격려하는 말씀 한 구절
  KeyV: () => pressIfAvailable('share') || showNext('witness', 0.2),
  KeyB: () => toggle('praise'),
  KeyJ: () => pressIfAvailable('sit', 'stand'),
  KeyK: () => (lying() ? pressIfAvailable('stand') : pressIfAvailable('recline')),
  KeyL: () => pressIfAvailable('eat', 'sip'),
  KeyE: () => { if (me.action !== 'menu') pressIfAvailable(...availableActions().filter((n) => !NOT_E.has(n))); },
  Enter: () => nextVerse(),
  NumpadEnter: () => nextVerse(),
};
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (HOTKEYS[e.code]) { if (!e.repeat) HOTKEYS[e.code](); e.preventDefault(); return; }
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
    // 조이스틱을 잡는 순간 하던 일을 멈추고 일어섬 (나무에 있으면 뛰어내림)
    if (me.climb) dropFromTree();
    standUp(me); me.path = []; me.task = null; me.action = null;
    stickDriving = true; endShot();
  }
  const fx = -Math.sin(view.az), fz = -Math.cos(view.az); // 화면 안쪽
  const rx = Math.cos(view.az), rz = -Math.sin(view.az);  // 화면 오른쪽
  const mx = (fx * -jy + rx * jx) / mag, mz = (fz * -jy + rz * jx) / mag;
  me.running = !me.slow && runBoost(me) > 1 && mag > 0.6; // 무거운 짐을 지면 뛸 수 없음
  const step = SPEED * (0.35 + 0.65 * mag) * (me.running ? runBoost(me) : 1) * (me.slow || 1) * dt;
  const nx = me.x + mx * step, nz = me.z + mz * step;
  const hop = me.hop || 0; // 점프 중이면 낮은 물건은 넘어감
  const base = floorY(me.x, me.z);
  // 가파른 턱(성벽·계단 옆면)은 발이 그보다 높이 떠 있을 때만 올라섬
  const ok = (x, z) => isFree(x, z, hop, base) && floorY(x, z) - base <= 0.45 + hop;
  if (ok(nx, nz)) { me.x = nx; me.z = nz; }
  else if (ok(nx, me.z)) me.x = nx;
  else if (ok(me.x, nz)) me.z = nz;
  stepHeight(me, base);
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
// 화면 눕히기 단추 (세로 화면일 때만 보임)
const rotBtn = document.createElement('button');
rotBtn.id = 'rotBtn';
rotBtn.setAttribute('aria-label', 'rotate');
rotBtn.innerHTML = ICONS.rotate;
rotBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); setRotated(!rot.on); });
document.body.appendChild(rotBtn);
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
// 턱을 오르내릴 때: 단 위로 올라서면 점프 높이를 바닥으로 옮기고, 턱에서 내려서면 떨어짐
function stepHeight(ch, before) {
  const now = floorY(ch.x, ch.z), d = now - before;
  if (Math.abs(d) < 0.25) return;
  ch.y = now;
  if (d > 0) ch.hop = Math.max(0, (ch.hop || 0) - d);
  else { ch.hop = (ch.hop || 0) - d; if (!ch.jumps) { ch.jumps = 1; ch.vy = 0; } }
}
function stepChar(ch, dt) {
  if (ch.climb) {
    // 나무 타기: 줄기를 붙잡고 올라가 가지에 매달림
    const c = ch.climb;
    if (c.phase === 'up') { c.y = Math.min(c.top, c.y + dt * 0.8); if (c.y >= c.top) { c.phase = 'hang'; sfx('impact/impactWood_light_000', 0.12); } }
    ch.x = c.x; ch.z = c.z; ch.state = 'idle';
    ch.action = c.phase === 'up' ? 'climb' : 'hang';
    ch.y = floorY(ch.x, ch.z); ch.hop = c.y;
    ch.av.position.set(ch.x, ch.y + c.y, ch.z);
    let da = ch.face - ch.av.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
    ch.av.rotation.y += da * Math.min(1, dt * 10);
    return;
  }
  if (ch.state === 'walk' && ch.path.length) {
    const tg = ch.path[0];
    const dx = tg.x - ch.x, dz = tg.z - ch.z;
    const d = Math.hypot(dx, dz);
    ch.running = !ch.slow && runBoost(ch) > 1;
    const step = SPEED * (ch.running ? runBoost(ch) : 1) * (ch.slow || 1) * dt;
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
    if (ch.seat.kind === 'recline') fy = floorY(ch.x, ch.z) + 0.3;
    if (ch.seat.kind === 'beanbag') fy = floorY(ch.x, ch.z) + 0.06;
    if (ch.seat.kind === 'lie') fy = floorY(ch.x, ch.z) - 0.02;
    if (ch.seat.top != null) fy = ch.seat.top - 0.14; // 모델에서 잰 앉는 면 높이
  }
  ch.y += (fy - ch.y) * Math.min(1, dt * 10);
  // 점프: 위로 튀어 올랐다가 중력으로 내려옴 (공중에서 다시 누르면 한 번 더)
  let hop = ch.hop || 0;
  if (ch.jumps) {
    hop += ch.vy * dt;
    ch.vy -= 13 * dt;
    if (hop <= 0) {
      hop = 0; ch.vy = 0; ch.jumps = 0; ch.jump = 0;
      if (ch === me) sfx('land', 0.15);
      // 물건 위에 내려앉으면 바로 옆 빈 곳으로 미끄러져 내려옴
      if (!isFree(ch.x, ch.z)) { const p = nearestFree({ x: ch.x, z: ch.z }); if (p) { ch.x = p.x; ch.z = p.z; } }
    }
  }
  ch.hop = hop;
  ch.av.position.set(ch.x, ch.y + hop + (ch.sinkY || 0) + (ch.swimY || 0), ch.z);
  // 기대거나 눕기: 엉덩이를 축으로 몸을 뒤로 젖힘
  const lean = (ch.state === 'sit' && ch.seat && LEAN[ch.seat.kind]) || 0;
  ch.lean = (ch.lean || 0) + (lean - (ch.lean || 0)) * Math.min(1, dt * 2.5);
  if (ch.lean > 0.002) {
    const hy = ch.seat && ch.seat.kind === 'lie' ? 0.12 : 0.3;
    ch.av.rotation.order = 'YXZ';
    ch.av.rotation.x = -ch.lean;
    ch.av.position.y += hy * (1 - Math.cos(ch.lean));
    ch.av.position.x += Math.sin(ch.face) * hy * Math.sin(ch.lean);
    ch.av.position.z += Math.cos(ch.face) * hy * Math.sin(ch.lean);
  } else if (ch.av.rotation.x) ch.av.rotation.x = 0;
  // 부드럽게 돌기
  let da = ch.face - ch.av.rotation.y;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  ch.av.rotation.y += da * Math.min(1, dt * 10);
}

// 동작을 시작하거나 자리에 앉으면 잠시 뒤 그 동작에 어울리는 말씀이 은은하게 떠오름
const ACTION_VERSE = { gaze: 'light', water: 'water_plant', share: 'share', sip: 'drink', eat: 'eat' };
const VERSE_OF = { read: 'read', pray: 'pray', praise: 'praise' }; // 누를 때마다 말씀 한 구절
const LEAN = { recline: 0.62, beanbag: 0.5, lie: 1.45 };
const SEAT_VERSE = { recline: 'recline', beanbag: 'beanbag', lie: 'recline3', lounge: 'rest', bench: 'rest', gbench: 'garden', boat: 'boat', floor: 'still', log: 'campfire', vine: 'vine', picnic: 'bbq' };
// 쉼: 앉거나 누워 가만히 있으면 카메라가 천천히 물러나 둘레를 돌고, 화면 가장자리가 따뜻하게 물듦
const restGlow = document.createElement('div');
restGlow.id = 'restGlow';
document.body.appendChild(restGlow);
let restT = 0, restK = 0;
// 넓은 정원: 멀리(안개 속) 있는 놀이·장식은 그리지 않음. 가운데에 붙은 큰 것(바닥·건물·길)은 그대로
let cullT = 0;
const CULL_D = 60;
const cullBox = new THREE.Box3(), cullV = new THREE.Vector3();
function farCull(dt) {
  if ((cullT -= dt) > 0) return;
  cullT = 0.4;
  const cx = camera.position.x, cz = camera.position.z;
  for (const o of scene.children) {
    if (o.userData.noCull || o.isLight || o.isInstancedMesh) continue;
    const x = o.position.x, z = o.position.z;
    let far;
    if (x * x + z * z < (R_HALL + 3) * (R_HALL + 3)) {
      // 카페 안의 작은 가구·소품은 정원 멀리서는 그리지 않음 (건물·바닥·기둥처럼 큰 것은 그대로)
      if (o === me.av || o.userData.small === false) continue;
      if (o.userData.small == null) {
        const b = cullBox.setFromObject(o);
        if (b.isEmpty()) continue;
        const sz = b.getSize(cullV);
        o.userData.small = Math.max(sz.x, sz.y, sz.z) < 4 && (x || z) !== 0;
        if (!o.userData.small) continue;
      }
      far = Math.hypot(cx, cz) > R_HALL + 35;
    } else far = Math.hypot(x - cx, z - cz) > CULL_D;
    if (far && o.visible) { o.visible = false; o.userData.culled = true; }
    else if (!far && o.userData.culled) { o.visible = true; o.userData.culled = false; }
  }
}
function restMode(dt) {
  const still = me.state === 'sit' && !stick.on && !view.shot && view.mode === 'third';
  restT = still ? restT + dt : 0;
  restK += ((restT > 3 ? 1 : 0) - restK) * Math.min(1, dt * 0.4);
  restGlow.style.opacity = (restK * 0.55).toFixed(3);
  if (restK > 0.01) {
    view.az += dt * 0.025 * restK; // 아주 천천히 둘레를 돎
    const lie = me.seat && me.seat.kind === 'lie';
    view.dist += ((lie ? 7 : 8.5) - view.dist) * Math.min(1, dt * 0.25 * restK);
    view.el += ((lie ? 0.75 : 0.32) - view.el) * Math.min(1, dt * 0.25 * restK);
  }
}
let prevAct = null, prevSeat = null;
function verseHooks() {
  if (me.action !== prevAct) {
    prevAct = me.action;
    const k = ACTION_VERSE[me.action];
    if (k && !(me.action === 'gaze' && Math.hypot(me.x, me.z) > 8)) showVerse(k, { delay: me.action === 'pray' || me.action === 'read' || me.action === 'gaze' ? 2.5 : 1.2 });
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
  together.step(dt, t);
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
  view.ty += (me.y + 0.62 + (me.climb ? me.climb.y : 0) - view.ty) * k;
  // 걷는 동안에는 시점이 천천히 캐릭터 뒤로 돌아감 (방금 화면을 끌었다면 잠시 기다림)
  const moving = me.state === 'walk';
  // 조이스틱으로 방향을 틀어도 화면이 진행 방향 쪽으로 따라 돎 (카메라 쪽으로 걸어올 때는 돌리지 않음)
  if (moving && performance.now() - (view.dragAt || 0) > 1200) {
    let d = (me.face + Math.PI) - view.az;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 2.4) view.az += d * Math.min(1, dt * (stickDriving ? 1.4 : 1.8));
  }
  me.av.visible = view.mode !== 'first' && !me.hidden;
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
    if (view.shot && performance.now() > view.shot.until) endShot();
    const sh = view.shot;
    const nowMs = performance.now(), rdt = Math.min(0.5, (nowMs - (view.lastT || nowMs)) / 1000); view.lastT = nowMs; // 실제 지난 시간
    view.w += ((sh ? 1 : 0) - view.w) * Math.min(1, rdt * 1.8);
    const w = view.w * view.w * (3 - 2 * view.w);
    const P = new THREE.Vector3(view.tx, view.ty, view.tz);
    let az = view.az, el = clamp(view.el, 0.08, 1.1), dist = Math.max(4.5, view.dist);
    if (w > 0.001) {
      const s = sh || view.lastShot;
      view.lastShot = s;
      const fx = me.x + (s.target.x - me.x) * s.mid, fz = me.z + (s.target.z - me.z) * s.mid;
      P.set(P.x + (fx - P.x) * w, P.y + (me.y + s.y - P.y) * w, P.z + (fz - P.z) * w);
      const da = Math.atan2(Math.sin(s.az - az), Math.cos(s.az - az));
      az += da * w; el += (s.el - el) * w; dist += (s.dist - dist) * w;
    }
    const up = Math.sin(el) * dist;
    if (!outdoors(me) && P.y + up > CEIL - 0.8) dist = (CEIL - 0.8 - P.y) / Math.sin(el); // 천장 아래로
    dist = Math.max(4.5, dist);
    const horiz = Math.cos(el) * dist;
    const camPos = new THREE.Vector3(P.x + Math.sin(az) * horiz, Math.min(outdoors(me) ? 60 : CEIL - 0.8, P.y + Math.sin(el) * dist), P.z + Math.cos(az) * horiz);
    // 언덕·성벽이 카메라와 캐릭터 사이를 가리면 카메라를 그만큼 위로 들어 올림 (땅 속으로 들어가지 않게)
    if (outdoors(me)) {
      let need = 0;
      for (let k = 0.2; k <= 1.001; k += 0.2) {
        const qx = P.x + (camPos.x - P.x) * k, qz = P.z + (camPos.z - P.z) * k;
        const ground = floorY(qx, qz) + 0.9, lineY = P.y + (camPos.y - P.y) * k;
        if (ground > lineY) need = Math.max(need, (ground - P.y) / k - (camPos.y - P.y));
      }
      view.lift = (view.lift || 0) + (need - (view.lift || 0)) * Math.min(1, rdt * (need > (view.lift || 0) ? 8 : 1.5));
      camPos.y += view.lift;
    } else view.lift = 0;
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
  scrolls.step(dt * (window.__cafe.speed || 1), t);
  // 그림자 범위가 캐릭터를 따라감 (넓은 정원에서도 그림자)
  {
    const sx = Math.round(me.x / 4) * 4, sz = Math.round(me.z / 4) * 4;
    sun.position.set(sx - 14, 40, sz - 10);
    sun.target.position.set(sx, 0, sz);
  }

  verseHooks();
  restMode(dt);
  farCull(dt);
  // 카페 안은 조금 더 차분하고 따뜻하게 (테마파크와 구분)
  { const inside = !outdoors(me); renderer.toneMappingExposure += ((inside ? 0.84 : 0.92) - renderer.toneMappingExposure) * Math.min(1, dt * 1.5); }
  refreshActions();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- 들어가기: 혼자 / 함께(랜덤 10명, 넘으면 다음 카페) / 초대 링크 ----------
const together = initTogether({ scene, me, look: myLook, makeChar, poseAvatar, upgradeCup });
const toastEl = document.getElementById('toast');
let toastT = null;
function toast(msg, sec = 3) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { toastEl.hidden = true; }, sec * 1000);
}
// 위쪽 사람 수 단추: 초대 카페에서는 누르면 초대 링크를 다시 공유
const peopleBtn = document.createElement('button');
peopleBtn.className = 'place people';
peopleBtn.hidden = true;
placesEl.insertBefore(peopleBtn, viewBtn);
const map = initMap({ me, people: () => together.people.values(), walkTo, say: toast, icon: ICONS.map, placesEl, before: peopleBtn });

async function shareInvite() {
  const url = inviteLink(together.st.code);
  try {
    if (navigator.share && PHONE) { await navigator.share({ title: 'Wheel Life Cafe', url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('초대 링크를 복사했어요. 함께할 사람에게 보내 주세요.'); }
  catch (e) { window.prompt('초대 링크', url); }
}
peopleBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  const s = together.st;
  if (s.mode === 'invite') shareInvite();
  else toast(s.cafe > 1 ? `${s.cafe}호점 · ${s.count}/${RANDOM_CAP}명` : `${s.count}/${RANDOM_CAP}명`, 2);
});
together.st.onChange = (s) => {
  peopleBtn.hidden = s.mode === 'solo';
  peopleBtn.innerHTML = (s.mode === 'invite' ? ICONS.invite : ICONS.people) + `<span>${s.count}</span>`;
  peopleBtn.setAttribute('aria-label', s.mode === 'invite' ? '초대 링크 공유' : '함께 있는 사람');
};

function goIn() {
  enter.classList.add('gone');
  setTimeout(() => enter.remove(), 700);
  walkTo(me, { x: 0, z: 19 });
  setTimeout(maybeHint, 1200);
}
async function choose(mode, btn) {
  music.resume();
  if (mode === 'solo') { together.start('solo'); return goIn(); }
  for (const b of enter.querySelectorAll('.mode')) b.disabled = true;
  let code = inviteCodeFromUrl();
  if (mode === 'invite' && !code) {
    code = newInviteCode();
    history.replaceState(null, '', '?c=' + code);
  }
  const r = await together.start(mode, code);
  goIn();
  if (r === 'full') toast(`이 초대 카페는 가득 찼어요(${INVITE_CAP}명). 혼자 둘러보는 중이에요.`, 5);
  else if (r !== 'ok') toast('지금은 함께하기에 연결하지 못했어요. 혼자 둘러보는 중이에요.', 5);
  else if (mode === 'random' && together.st.cafe > 1) toast(`1호점이 가득 차서 ${together.st.cafe}호점으로 왔어요.`, 4);
  else if (mode === 'invite' && !inviteCodeFromUrl.arrived) setTimeout(shareInvite, 600);
}
// 단추는 index.html에 미리 있음. 장면을 불러오기 전에 눌렀다면 지금 그 모드로 들어감
for (const b of enter.querySelectorAll('.mode')) b.addEventListener('click', () => choose(b.dataset.mode, b));
if (inviteCodeFromUrl()) inviteCodeFromUrl.arrived = true;
window.__enterReady = true;
const signs = initSigns({ scene, me, npcs, interactive, act, sfx, fxSprite, burst, sun, walkTo, faceTo });
const park = initPark({ scene, me, interactive, act, sfx, fxSprite, burst, walkTo, faceTo, standUp, shot });
Object.assign(ACTIONS, park.actions);
const scrolls = initScrolls({ scene, me, sfx, fxSprite, burst, icon: ICONS.scroll });
requestAnimationFrame(frame);
if (window.__pick) choose(window.__pick);
// 첫 화면이 뜬 뒤 소품 모델을 천천히 불러와 바꿔 끼움
setTimeout(() => {
  loadProps({ scene, deco, interactive, anim, renderer, occluders });
  upgradeCup(me.av);
  for (const n of npcs) if (n.av) upgradeCup(n.av);
}, 300);

window.__cafe = { camera, shot, together, me, seats, walkTo, ACTIONS, view, sitOn, npcs, stick, signs, placed, park, scrolls, renderer, map };
