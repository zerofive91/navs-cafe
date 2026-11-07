import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildWorld } from './build.js';
import { makeAvatar, poseAvatar } from './avatar.js';
import { findPath, nearestFree } from './nav.js';
import { C, TRAY, R_RIM_IN, floorY, seats, SPOTS, SPAWN, planters, polar, COUNTER, CEIL, Q, isFree, R_HALL, R_WALK, onWater, inPool, R_PARK, nearTree } from './layout.js';
import { ICONS, ICON_LABELS } from './icons.js';
import { loadProps, upgradeCup, fxSprite } from './props.js';
import { initSigns } from './signs.js';
import { initMusic } from './music.js';
import { showVerse, showNext, nextVerse, onVerseShown } from './verses.js';
import { initPark } from './park.js';
import { initMap } from './map.js';
import { initScrolls } from './scrolls.js';
import { initTogether, inviteCodeFromUrl, RANDOM_CAP, INVITE_CAP } from './together.js';
import { makeWheelProxy } from './wheelproxy.js';
import { initLeisure } from './leisure.js';
import { initStillness } from './stillness.js';
import { recordMet } from './met.js';
import { loadProfile, saveProfile, onProfileSave } from './profile.js';
import { initAccount } from './account.js';
import { initCharacter, HOODIES, HAIRS, BAGS } from './character.js';
import { initTutorial, nameTag } from './tutorial.js';
import { initTraining } from './training.js';
import { initDungeon } from './dungeon.js';
import { initWarfare } from './warfare.js';
import { initGuides } from './guides.js';
import { initGarden } from './garden.js';
import { initWayguide } from './wayguide.js';
import { on } from './bus.js';
import { initQuests } from './quests.js';
import { initShop } from './shop.js';
import { initGear } from './gear.js';
import { initStory } from './story.js';
import { initPets } from './pets.js';
import { TIER } from './dungeon.js';
import { COURSE_META } from './courses.js';
import { initQuestLog, walkToward } from './questlog.js';
import { talkOffer, pressTalk } from './talkgate.js';
import { escDialog } from './dialog.js';
import { initRegion } from './region.js';
import { VILLAGES, village, visitedTowns, lastTown } from './villages/registry.js';
import { initCartGuide } from './cartguide.js';

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

const hemi = new THREE.HemisphereLight(0xffffff, 0xd9cfc0, 0.7);
scene.add(hemi);
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
let region = null; // 마을 사이 다니기 (region.js). 맨 아래에서 만듦
let cartGuide = null; // 수레 안내인 (cartguide.js)
let tut = null, character = null, training = null, dungeon = null, warfare = null, guides = null, garden = null, wayguide = null, quests = null, shop = null, gear = null, story = null, pets = null, questLog = null, stillness = null; // 안내와 캐릭터 창은 맨 아래에서 만듦
const profile = loadProfile(); // 닉네임·걸음·받은 것·안내 기록 (이 기기 안에만)
if (profile.name) myLook.name = profile.name;
const me = makeChar(myLook, SPAWN.x, SPAWN.z);
// 캐릭터 만들기에서 옷·머리를 바꾸면 그 자리에서 새 모습으로 갈아 끼움
function rebuildMe() {
  const old = me.av;
  const av = makeAvatar(myLook);
  av.position.copy(old.position); av.rotation.copy(old.rotation);
  scene.remove(old); scene.add(av);
  me.av = av;
  upgradeCup(av);
}

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
// 정원지기 아담: 카페 문 밖에서 정원 안내를 해 줌
const adamPos = { x: 2.4, z: R_HALL + 5 };
const adam = makeChar({ hoodie: 0x8aa860, hair: 0x5a3b2a, bag: 0x8aa860, style: 0, pants: 0x6b5a40 }, adamPos.x, adamPos.z);
adam.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
owner.tag = nameTag('바나바'); owner.av.add(owner.tag);
adam.tag = nameTag('아담'); adam.av.add(adam.tag);
const npcs = [barista, owner, adam];

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
  talk: () => pressTalk(me), // 곁의 사람에게 말 걸기 (talkgate.js)
  light: () => walkTo(me, { x: 0.4, z: 0.9 }, () => { act('gaze'); }),
  pray: () => {
    // 기도 구역에서는 방석에, 다른 곳에서는 그 자리에 무릎 꿇고 기도
    const s = Math.hypot(me.x - SPOTS.pray.x, me.z - SPOTS.pray.z) < SPOTS.pray.r ? nearestSeat('kneel', me) : null;
    if (s) { sitOn(me, s); me.task = wrapTask(me.task, () => act('pray')); }
    else { sitHere('kneel'); act('pray'); }
  },
  // 주문: 카운터 앞에서 메뉴(음료·빵)를 고르면 직원이 준비해 픽업대에서 받음
  order: () => walkTo(me, SPOTS.order, () => { faceTo(me, polar(COUNTER.r, -56)); me.action = 'menu'; }),
  // 세 모금 마시면 컵이 비어 손에서 사라짐
  sip: () => {
    if (me.item !== 'cup' || me.action === 'sip') return;
    act('sip', 2.2);
    setTimeout(() => {
      if (me.item !== 'cup') return;
      me.sips = (me.sips || 0) + 1; sfx('cup', 0.1);
      if (me.sips >= 3) { me.item = null; me.drink = null; me.sips = 0; if (me.action === 'sip') me.action = null; }
    }, 1400);
  },
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
  recline: () => { // 가까이 선베드·리클라이너·빈백·침낭이 있으면 거기에 바로 눕고, 의자·통나무 곁이면 거기에 앉고, 아니면 그 자리에 누움
    if (me.state === 'sit' && me.seat) { // 앉은 채로 눕기: 바닥이면 그 자리에, 의자·벤치면 일어나 곁에 누움
      if (!me.seat.free) standUp(me);
      return sitHere('lie');
    }
    const s = nearSeat(true) || nearSeat(false, 1.6);
    if (s) return sitOn(me, s);
    sitHere('lie');
  },
  sit: () => {
    // 가까운 빈 자리가 있으면 거기에, 없으면 바닥에 앉음
    const s = nearSeat(false);
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
  const rec = { g, hitBox, kind, what: kind === 'food' ? me.food : me.drink, bites: me.bites || 0, sips: me.sips || 0 };
  hitBox.userData.onTap = () => pickUp(rec);
  interactive.push(hitBox);
  placed.push(rec);
  if (placed.length > 12) removePlaced(placed[0]);
  if (kind === 'food') { me.food = null; me.bites = 0; } else { me.item = null; me.drink = null; me.sips = 0; }
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
    else { if (me.item) return; me.item = 'cup'; me.drink = rec.what; me.sips = rec.sips || 0; }
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
      if (DRINKS.includes(kind)) { me.item = 'cup'; me.drink = kind; me.sips = 0; }
      else { me.food = kind; me.bites = 0; }
      sfx('cup', 0.15);
    });
  }, 2800);
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
    if (n.inTown === false) continue; // 다른 마을에 간 사람 (자리가 멈춰 있음)
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

// 그 자리에서만 할 수 있는 체험 단추는 반짝여서 알려 줌
let placeActs = new Set();
// 가까운 빈 자리: 앉을 자리, 누울 수 있는 자리
const LIEABLE = new Set(['recline', 'beanbag', 'lie', 'sunbed', 'hammock']);
function nearSeat(lie, maxD = 3.2) {
  let best = null, bd = maxD;
  for (const s of seats) {
    if (s.taken || (lie && !LIEABLE.has(s.kind))) continue;
    const d = Math.min(Math.hypot(s.approach.x - me.x, s.approach.z - me.z), Math.hypot(s.x - me.x, s.z - me.z));
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
function availableActions() {
  const list = [];
  const P = (placeActs = new Set());
  const place = (...names) => { for (const n of names) { list.push(n); P.add(n); } };
  if (me.action === 'wait') return list;
  if (me.climb) return me.climb.phase === 'hang' ? ['down', 'jump'] : ['down'];
  const walkToggle = outdoors(me) && !inPool(me.x, me.z) && !me.slow ? [me.walkMode ? 'run' : 'walk'] : [];
  if (me.action === 'menu') {
    if (Math.hypot(me.x - SPOTS.order.x, me.z - SPOTS.order.z) < SPOTS.order.r) { place(...(me.item ? [] : DRINKS), ...(me.food ? [] : FOODS)); return list; }
    me.action = null;
  }
  // 부탁·훈련의 그 자리 단추가 먼저 (E가 이것부터 누름)
  if (me.state !== 'walk') { for (const v of region?.available() || []) place(v[1]); for (const v of shop?.available() || []) place(v[1]); for (const v of pets?.available() || []) place(v[1]); for (const v of quests?.available() || []) place(v[1]); for (const v of training?.available() || []) place(v[1]); }
  for (const v of dungeon?.available() || []) place(v[1]); // 길 끝: 입구로 돌아가기
  if (signs.canCalm()) place('calm'); // 풍랑 속: 손을 들어 잠잠케
  if (talkOffer(me)) place('talk'); // 곁에 말 걸 사람이 있으면 (누르거나 E)
  if (me.state === 'walk') { if (me.slow) place(...park.available()); else list.push('jump'); list.push(...walkToggle); return list; } // 걷는 중에는 점프(와 걷기·달리기)만
  const near = (s) => Math.hypot(me.x - s.x, me.z - s.z) < s.r;
  // 그 장소에서만 할 수 있는 일
  if (near(SPOTS.light)) place('light');
  if (near(SPOTS.order) && (!me.item || !me.food)) place('order');
  // 증거의 물가: 한 번에 하나만 (베드로 부탁 중이면 그물, 배에 앉으면 낚시, 아니면 배 타기)
  const inBoat = me.state === 'sit' && me.seat && me.seat.kind === 'boat';
  const netting = list.includes('q_net');
  if (near(SPOTS.boat) && !inBoat && !netting) place('boat');
  if (Math.hypot(me.x, me.z) > R_RIM_IN - 1 && Math.hypot(me.x, me.z) < R_HALL) place('water');
  if (me.item === 'cup') list.push('sip');
  if (me.food) list.push('eat');
  if (signs.nearBread()) place('loaves');
  if ((inBoat || signs.atShore()) && !netting && signs.canFish()) place('fish');
  place(...park.available());
  if (outdoors(me) && nearTree(me.x, me.z, 1.8, 3.6)) list.push('climb');
  for (const v of leisure.available()) { if (Array.isArray(v)) place(v[1]); else list.push(v); } // 연·꽃·물수제비·별·씨앗
  list.push(...walkToggle);
  if ((me.item === 'cup' || me.food) && !near(SPOTS.tray)) list.push('putdown');
  if ((me.item === 'cup' || me.food) && near(SPOTS.tray)) place('tray');
  list.push(...(stillness?.available() || [])); // 쉬는 자리에 3초쯤 앉아 있으면 머무르기 (반짝이지 않게)
  // 어디서나 할 수 있는 일 (가까이 의자·벤치·통나무·선베드가 있으면 앉기·눕기도 반짝임)
  if (me.state === 'sit') list.push('stand');
  else if (nearSeat(false)) place('sit'); else list.push('sit');
  // 앉아 있다가도 바로 눕기 (이미 누워 있으면 빼고)
  const lyingNow = me.state === 'sit' && me.seat && (me.seat.kind === 'lie' || LIEABLE.has(me.seat.kind));
  if (!lyingNow && !inPool(me.x, me.z) && !me.slow) { if (me.state !== 'sit' && nearSeat(true)) place('recline'); else list.push('recline'); }
  if (me.state !== 'sit' && !me.slow) list.push('jump');
  const gw = [...(garden?.wants() || []), ...(region?.wants() || [])]; // 정원 빛나는 자리(빌립보 감옥·실로)·요한 마을 기도 단계에서는 기도·찬양이 반짝임
  for (const n of ['pray', 'read', 'praise']) { list.push(n); if (gw.includes(n)) P.add(n); }
  if (nearestPerson(6)) list.push('share');
  list.push('wave');
  return list;
}
const isOn = (name) => me.action === name || (name === 'stay' && !!stillness?.running()) || (name === 'light' && me.action === 'gaze') || (name === 'boat' && me.seat && me.seat.kind === 'boat') || (me.hold && me.hold === name);
const TOGGLES = new Set(['kite', 'flower', 'stars', 'stay']); // 다시 누르면 그 단추가 직접 끔
let shown = '';
function pressAction(name, on) {
  if (region?.locked()) return; // 마을을 옮기는 동안은 쉼
  tut?.mark(name, placeActs.has(name));
  training?.onPress(name);
  dungeon?.onPress(name);
  warfare?.onPress(name);
  sfx(name === 'sip' || name === 'order' || name === 'eat' ? 'cup' : 'tap', 0.15);
  if (VERSE_OF[name]) showNext(VERSE_OF[name], on ? 0.2 : 1.2);
  if (on && VERSE_OF[name]) return; // 이미 하는 중이면 다음 구절만
  if (on && TOGGLES.has(name)) { ACTIONS[name](); shown = ''; return; }
  if (on && name !== 'wave' && name !== 'share') { me.action = null; if (me.seat && me.seat.free) standUp(me); shown = ''; return; }
  ACTIONS[name]();
}
// 단추 목록에 지금 있는 동작만 키보드로도 누를 수 있음
function pressIfAvailable(...names) {
  const list = availableActions();
  const name = names.find((n) => list.includes(n));
  if (!name) return false;
  pressAction(name, isOn(name));
  return true;
}
function refreshActions() {
  const list = availableActions();
  const key = list.join(',') + '|' + me.action + '|' + (me.hold || '') + '|' + [...placeActs].join(',') + '|' + (stillness?.running() ? 's' : '');
  if (key === shown) return;
  shown = key;
  bar.innerHTML = '';
  for (const name of list) {
    const b = document.createElement('button');
    const on = isOn(name);
    if (name === 'jump' || name === 'sit' || name === 'stand' || name === 'share') { /* 누를 때마다 실행 */ }
    b.className = 'act' + (on ? ' on' : '') + (placeActs.has(name) && !on ? ' place' : '');
    b.setAttribute('aria-label', ICON_LABELS[name] || name);
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
// 내 카드 속 내 모습: 캐릭터 앞에서 한 장 찍어 canvas에 옮기고, 곧바로 원래 화면을 다시 그림
function portrait(cv) {
  const W = renderer.domElement.width, H = renderer.domElement.height;
  const pc = new THREE.PerspectiveCamera(30, W / H, 0.1, 80);
  const p = me.av.position, f = me.face;
  pc.position.set(p.x + Math.sin(f) * 3.6, p.y + 1.25, p.z + Math.cos(f) * 3.6);
  pc.lookAt(p.x, p.y + 0.74, p.z);
  renderer.render(scene, pc);
  const g = cv.getContext('2d'), ca = cv.width / cv.height;
  let sh = H * 0.8, sw = sh * ca; if (sw > W) { sw = W; sh = sw / ca; }
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(renderer.domElement, (W - sw) / 2, (H - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
  renderer.render(scene, camera);
}
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
// 휴대폰이 세로로 잠겨 있어도(카카오톡 안 브라우저 등) 화면 전체를 눕혀 가로로 볼 수 있음
// dir 1: 왼쪽으로 눕힘(화면 위쪽이 휴대폰 오른쪽 가장자리), -1: 오른쪽으로 눕힘
const rot = { on: false, dir: 1 };
const vw = () => (rot.on ? window.innerHeight : window.innerWidth);
const vh = () => (rot.on ? window.innerWidth : window.innerHeight);
// 화면 좌표 → 눕힌 화면 안의 좌표
const pt = (e) => (!rot.on ? { x: e.clientX, y: e.clientY }
  : rot.dir > 0 ? { x: e.clientY, y: window.innerWidth - e.clientX }
  : { x: window.innerHeight - e.clientY, y: e.clientX });
// 화면에 보이는 상자의 위·아래(눕힌 화면 기준)
function localBox(el) {
  const r = el.getBoundingClientRect();
  if (!rot.on) return { top: r.top, bottom: r.bottom, height: r.height };
  return rot.dir > 0 ? { top: innerWidth - r.right, bottom: innerWidth - r.left, height: r.width } : { top: r.left, bottom: r.right, height: r.width };
}
function setRotated(v, dir = rot.dir) {
  rot.on = v; rot.dir = dir;
  document.documentElement.classList.toggle('rot', v);
  document.documentElement.classList.toggle('rot-r', v && dir < 0);
  resize();
}
function resize() {
  // 진짜로 가로가 되었으면 눕히기는 풀기
  if (rot.on && window.innerWidth > window.innerHeight) { rot.on = false; document.documentElement.classList.remove('rot', 'rot-r'); }
  const w = vw(), h = vh();
  // 가로 화면 배치(진짜 가로이든 눕힌 화면이든 같은 모양): css의 html.land
  document.documentElement.classList.toggle('land', w > h && h <= 500);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50;
  camera.updateProjectionMatrix();
}
// 눕힌 화면에서는 브라우저가 손가락 방향을 돌려 주지 않아 창이 스크롤되지 않음 → 끄는 방향을 바꿔 직접 내림 (2026-11-03)
{
  let sc = null;
  const scroller = (el) => {
    for (; el && el !== document.body; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
    }
    return null;
  };
  document.addEventListener('touchstart', (e) => {
    sc = null;
    if (!rot.on || e.touches.length !== 1) return;
    const el = scroller(e.target);
    if (el) { const q = pt(e.touches[0]); sc = { el, y: q.y, top: el.scrollTop, moved: 0, v: 0, ly: q.y, lt: performance.now() }; }
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!sc || e.touches.length !== 1) return;
    const q = pt(e.touches[0]);
    sc.moved = Math.max(sc.moved, Math.abs(q.y - sc.y));
    sc.el.scrollTop = sc.top - (q.y - sc.y);
    const now = performance.now();
    sc.v = (q.y - sc.ly) / Math.max(1, now - sc.lt); sc.ly = q.y; sc.lt = now;
    e.preventDefault();
  }, { capture: true, passive: false });
  document.addEventListener('touchend', () => {
    if (!sc) return;
    const { el, moved } = sc;
    let v = sc.v * 16; // 손을 뗀 뒤 조금 더 미끄러짐
    if (moved > 8) {
      const glide = () => { if (Math.abs(v) < 0.5) return; el.scrollTop -= v; v *= 0.92; requestAnimationFrame(glide); };
      requestAnimationFrame(glide);
      // 끌어서 내린 것은 누른 것으로 치지 않음
      const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      document.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 400);
    }
    sc = null;
  }, { capture: true, passive: true });
}
// 휴대폰을 눕히면 저절로 가로 화면으로 (2026-11-03). 화면 회전이 잠겨 있어도 기울기로 알아챔.
// 브라우저가 스스로 돌려 주면(잠금 꺼짐) 그대로 두고, 돌려 주지 않을 때만 눕힘. 단추로 바꾼 것은 다음에 기울기가 바뀔 때까지 그대로
{
  let seen = null, applied = null, timer = null;
  const settle = () => {
    timer = null;
    if (seen === applied) return;
    applied = seen;
    if (seen === 'up') { if (rot.on) setRotated(false); }
    else if (window.innerWidth < window.innerHeight) setRotated(true, seen === 'left' ? 1 : -1);
  };
  window.addEventListener('deviceorientation', (e) => {
    if (e.beta == null || e.gamma == null) return;
    const b = (e.beta * Math.PI) / 180, g = (e.gamma * Math.PI) / 180;
    // 휴대폰 기준 중력 방향 (x: 오른쪽, y: 위쪽)
    const gx = Math.sin(g) * Math.cos(b), gy = -Math.sin(b);
    let st = null;
    if (Math.abs(gx) > 0.6 && Math.abs(gx) > Math.abs(gy) + 0.25) st = gx < 0 ? 'left' : 'right'; // 왼쪽 가장자리가 아래 → 왼쪽으로 눕힘
    else if (Math.abs(gy) > 0.6 && Math.abs(gy) > Math.abs(gx) + 0.25) st = 'up';
    if (!st) return; // 바닥에 놓았거나 어중간하면 그대로
    if (applied === null) applied = st === 'up' ? 'up' : null; // 처음에 세워 들고 있으면 그대로 시작
    if (st !== seen) { seen = st; clearTimeout(timer); timer = setTimeout(settle, 800); }
  });
  // 아이폰은 기울기를 쓰려면 한 번 허락을 받아야 함: 처음 누를 때(입장 단추) 물어봄
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.addEventListener('click', () => { DeviceOrientationEvent.requestPermission().catch(() => {}); }, { capture: true, once: true });
  }
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
  // 마우스(2026-11-03): 왼쪽 단추는 고르기·말 걸기, 오른쪽 단추는 그곳으로 걷기. 끌면 둘 다 시점 돌리기. 터치는 둘 다
  const how = e.pointerType === 'mouse' ? (e.button === 2 ? 'move' : 'pick') : 'any';
  if (pointers.size === 1) drag = { x: q.x, y: q.y, t: performance.now(), moved: 0, az: view.az, el: view.el, pitch: view.pitch, how };
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
    let dx = q.x - drag.x, dy = q.y - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.how !== 'any') dy = -dy; // 마우스로 끌면 위아래만 손가락과 반대로 (사용자 요청 2026-11-03)
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
  if (drag && drag.moved <= 6 && performance.now() - drag.t < 600) { const q = pt(e); tap(q.x, q.y, drag.how); }
  if (pointers.size < 2) pinch = null;
  drag = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // 오른쪽 단추는 걷기
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

// 사람(NPC)을 누르면: 곁이면 바로 말 걸기, 멀면 그 사람 앞까지 걸어가서 말 걸기
function tapPerson(maxD) {
  let hit = null, hd = maxD;
  for (const n of npcs) {
    if (!n.av.visible) continue;
    const h = ray.intersectObject(n.av, true)[0];
    if (h && h.distance < hd) { hd = h.distance; hit = n; }
  }
  if (!hit) return false;
  sfx('tap', 0.15);
  if (pressTalk(me, hit)) return true;
  const d = Math.hypot(me.x - hit.x, me.z - hit.z);
  const k = Math.max(0, (d - 1.6) / d);
  walkTo(me, { x: me.x + (hit.x - me.x) * k, z: me.z + (hit.z - me.z) * k }, () => {
    faceTo(me, hit);
    // 도착한 뒤 그 사람이 말 걸기를 내밀 때까지 잠깐 기다림 (모듈은 매 프레임 확인)
    let n = 0; const tryTalk = () => { if (!pressTalk(me, hit) && ++n < 8) setTimeout(tryTalk, 120); }; tryTalk();
  });
  return true;
}
// how: 'pick' 마우스 왼쪽(고르기·말 걸기·앉기만), 'move' 마우스 오른쪽(누른 곳으로 걷기만), 'any' 터치(둘 다)
function tap(sx, sy, how = 'any') {
  if (region?.locked()) return;
  ndc.set((sx / vw()) * 2 - 1, -(sy / vh()) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = how === 'move' ? [] : ray.intersectObjects(interactive, false);
  if (how !== 'move' && tapPerson(hits.length ? hits[0].distance : 60)) return;
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
  let best = null, bd = how === 'move' ? 0 : 0.9;
  for (const s of seats) {
    if (s.taken && s !== me.seat) continue;
    const d = Math.hypot(s.x - p.x, s.z - p.z);
    if (d < bd) { bd = d; best = s; }
  }
  if (best) { if (best !== me.seat) sitOn(me, best); }
  else if (how === 'pick') return;
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
const NOT_E = new Set(['stay', 'walk', 'run', 'sit', 'stand', 'recline', 'jump', 'pray', 'read', 'praise', 'share', 'wave', 'sip', 'eat', 'putdown']);
const lying = () => me.seat && (me.seat.kind === 'lie' || LIEABLE.has(me.seat.kind));
const goPlace = (name) => { const p = PLACES.find((q) => q[0] === name); if (p) walkTo(me, { x: p[1].x, z: p[1].z }, () => faceTo(me, p[2])); };
const toggle = (name) => (me.action === name ? (me.seat ? ACTIONS.stand() : (me.action = null)) : pressIfAvailable(name));
const HOTKEYS = {
  KeyM: () => (map.el.hidden ? map.open() : map.shut()),
  Escape: () => { if (!map.el.hidden) map.shut(); else escDialog(); }, // 지도가 없으면 가장 나중에 연 말풍선을 닫음 (dialog.js)
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
  KeyN: () => pressIfAvailable('stars'),
  KeyH: () => pressIfAvailable('stay'), // 머무르기 (쉬는 자리에 앉아서)
  KeyP: () => leisure.togglePhoto(),
  KeyI: () => character?.openCard(),
};
// 컴퓨터 단축키 안내: ? 또는 F1, 위쪽 키보드 단추 (터치 화면에서는 단추 숨김)
const KEY_HELP = [
  ['마우스', [['오른쪽 클릭', '그곳으로 걷기'], ['왼쪽 클릭', '사람에게 말 걸기 · 물건 고르기 · 앉기'], ['끌기 / 휠', '시점 돌리기 / 가까이 · 멀리']]],
  ['움직이기', [['↑ ↓ / W S', '앞으로 · 뒤로'], ['← → / A D', '몸 돌리기'], ['Space', '점프 (공중에서 또 누르면 2·3단)'], ['Shift', '걷기 ↔ 달리기 (정원·숲)'], ['M', '지도 (누른 곳으로 걸어감)'], ['Esc', '지도·안내 닫기']]],
  ['수레바퀴', [['Z', '말씀 읽기'], ['X', '기도'], ['C', '교제 (카운터에서 주문)'], ['V', '증거 (곁의 사람에게 빛 건네기)'], ['B', '찬양']]],
  ['쉬기', [['J', '앉기 · 일어서기'], ['K', '눕기 (앉은 채로도)'], ['N', '누운 채로 별 보기'], ['H', '앉아서 머무르기 (숨 고르기 · 말씀)'], ['L', '먹기 · 마시기'], ['P', '사진 찍기 (Space 찰칵)']]],
  ['체험', [['E', '그 자리 체험 (반짝이는 단추)'], ['Enter', '다음 말씀'], ['I', '나의 캐릭터 · 안내 다시 보기'], ['? / F1', '이 안내']]],
];
const keyHelp = document.createElement('div');
keyHelp.id = 'keyhelp'; keyHelp.hidden = true;
keyHelp.innerHTML = '<div class="pad"><h3>컴퓨터 단축키</h3>' + KEY_HELP.map(([t, rows]) => `<section><h4>${t}</h4>${rows.map(([k, d]) => `<p><kbd>${k}</kbd><span>${d}</span></p>`).join('')}</section>`).join('') + '<button class="close" aria-label="close">×</button></div>';
document.body.appendChild(keyHelp);
const toggleKeyHelp = (v = keyHelp.hidden) => { keyHelp.hidden = !v; };
keyHelp.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === keyHelp || e.target.classList.contains('close')) toggleKeyHelp(false); });
HOTKEYS.Slash = () => toggleKeyHelp();
HOTKEYS.F1 = () => toggleKeyHelp();
{ const esc = HOTKEYS.Escape; HOTKEYS.Escape = () => { if (document.getElementById('meCard')) character?.closeCard(); else if (!keyHelp.hidden) toggleKeyHelp(false); else if (leisure.photoOn()) leisure.togglePhoto(); else if (stillness?.active()) stillness.actions.stay(); else esc(); }; }
let keyTipShown = false;
try { keyTipShown = localStorage.getItem('navs-cafe-keytip') === '1'; } catch (e) { /* 저장 안 됨 */ }
window.addEventListener('keydown', (e) => {
  if (!keyTipShown) { keyTipShown = true; try { localStorage.setItem('navs-cafe-keytip', '1'); } catch (er) { /* 저장 안 됨 */ } setTimeout(() => toast('? 키를 누르면 단축키 안내가 열려요', 4), 300); }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return; // 이름을 쓰는 동안에는 단축키 쉼
  if (character?.isOpen()) return;
  if (e.target?.closest?.('#stillPick') && /^(Enter|NumpadEnter|Space)$/.test(e.code)) return; // 1분·2분 단추에 포커스: 단추가 눌리게 (다음 말씀·점프로 가로채지 않음)
  if (region?.locked()) { e.preventDefault(); return; } // 마을을 옮기는 동안은 단축키 쉼
  if (!e.repeat && tut) { tut.mark(e.code); if (tut.onKey(e.code)) { e.preventDefault(); return; } }
  if (/^(Enter|NumpadEnter)$/.test(e.code) && e.target?.closest?.('[data-dlg] button')) return; // 말풍선 단추에 포커스: Enter로 그 단추를 누름 (다음 말씀으로 가로채지 않음)
  if (HOTKEYS[e.code]) { if (!e.repeat) HOTKEYS[e.code](); e.preventDefault(); return; }
  if (e.code === 'Space') { if (leisure.photoOn()) leisure.snap(); else { ACTIONS.jump(); tut?.mark('jump'); } e.preventDefault(); return; }
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
});
window.addEventListener('keyup', (e) => { keys.delete(KEYMAP[e.code]); });
let stickDriving = false;
// 방향키는 캐릭터가 바라보는 쪽 기준: ↑ 앞으로, ↓ 뒤로, ←→ 몸을 돌림 (카메라는 천천히 등 뒤로 따라옴)
const TURN = 2.6; // 초당 돌아가는 각도(라디안)
function driveStick(dt) {
  if (region?.locked()) { stickDriving = false; return; } // 마을을 옮기는 동안은 걷지 않음
  const kb = keys.size > 0;
  const turn = kb ? (keys.has('l') ? 1 : 0) - (keys.has('r') ? 1 : 0) : 0;
  const fwd = kb ? (keys.has('u') ? 1 : 0) - (keys.has('d') ? 1 : 0) : 0;
  const jx = stick.x, jy = stick.y;
  const mag = kb ? Math.abs(fwd) : Math.min(1, Math.hypot(jx, jy));
  if (mag < 0.15 && !turn) {
    if (stickDriving) { stickDriving = false; if (me.state === 'walk' && !me.path.length) me.state = 'idle'; }
    return;
  }
  if (!stickDriving) {
    // 조이스틱을 잡는 순간 하던 일을 멈추고 일어섬 (나무에 있으면 뛰어내림)
    if (me.climb) dropFromTree();
    standUp(me); me.path = []; me.task = null; me.action = null;
    stickDriving = true; endShot();
  }
  let mx, mz;
  if (kb) {
    me.face += turn * TURN * dt;
    // 카메라를 캐릭터 등 뒤로 (화면을 끌어 돌린 직후에는 잠시 그대로 둠)
    if (!view.dragAt || performance.now() - view.dragAt > 1500) {
      const want = me.face + Math.PI;
      let d = ((want - view.az) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      view.az += d * Math.min(1, dt * (fwd ? 2.2 : 3.2));
    }
    if (!fwd) { if (me.state === 'walk') me.state = 'idle'; return; }
    mx = Math.sin(me.face) * fwd; mz = Math.cos(me.face) * fwd;
  } else {
    const fx = -Math.sin(view.az), fz = -Math.cos(view.az); // 화면 안쪽
    const rx = Math.cos(view.az), rz = -Math.sin(view.az);  // 화면 오른쪽
    mx = (fx * -jy + rx * jx) / mag; mz = (fz * -jy + rz * jx) / mag;
  }
  const back = kb && fwd < 0;
  me.running = !back && !me.slow && runBoost(me) > 1 && mag > 0.6; // 무거운 짐을 지면 뛸 수 없음
  const step = SPEED * (0.35 + 0.65 * mag) * (back ? 0.55 : 1) * (me.running ? runBoost(me) : 1) * (me.slow || 1) * dt;
  const nx = me.x + mx * step, nz = me.z + mz * step;
  const hop = me.hop || 0; // 점프 중이면 낮은 물건은 넘어감
  const base = floorY(me.x, me.z);
  // 가파른 턱(성벽·계단 옆면)은 발이 그보다 높이 떠 있을 때만 올라섬
  // 카페 기단(잔디보다 0.5m 높음)은 입구로 걸어 올라설 수 있게 조금 더 높이 디딤
  const rise = (x, z) => (Math.abs(Math.hypot(x, z) - R_HALL - 0.6) < 0.8 ? 0.6 : 0.45);
  const ok = (x, z) => isFree(x, z, hop, base) && floorY(x, z) - base <= rise(x, z) + hop;
  if (ok(nx, nz)) { me.x = nx; me.z = nz; }
  else if (ok(nx, me.z)) me.x = nx;
  else if (ok(me.x, nz)) me.z = nz;
  stepHeight(me, base);
  if (!kb) me.face = Math.atan2(mx, mz);
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
// 카페 바로가기 다섯 개는 늘 접어 두고 '카페' 단추 하나만 (누르면 펼침, 하나 고르면 다시 접힘)
const cafeFold = document.createElement('button');
cafeFold.className = 'place fold';
cafeFold.setAttribute('aria-label', 'cafe menu');
cafeFold.innerHTML = ICONS.cafe;
cafeFold.addEventListener('pointerdown', (e) => { e.stopPropagation(); placesEl.classList.toggle('open'); });
placesEl.appendChild(cafeFold);
function foldCafeMenu(out) {
  if (placesEl.classList.contains('out') === out) return;
  placesEl.classList.toggle('out', out);
  placesEl.classList.remove('open');
}
for (const [icon, spot, look] of PLACES) {
  const b = document.createElement('button');
  b.className = 'place' + (icon === 'garden' ? ' gardenBtn' : ' cafe');
  b.setAttribute('aria-label', icon);
  b.innerHTML = ICONS[icon];
  b.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    placesEl.classList.remove('open');
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
const keysBtn = document.createElement('button');
keysBtn.className = 'place view keys';
keysBtn.setAttribute('aria-label', 'keyboard shortcuts');
keysBtn.innerHTML = ICONS.keys;
keysBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); toggleKeyHelp(); });
placesEl.appendChild(keysBtn);
const photoBtn = document.createElement('button');
photoBtn.className = 'place view photo';
photoBtn.setAttribute('aria-label', 'photo');
photoBtn.innerHTML = ICONS.photo;
photoBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); leisure.togglePhoto(); });
placesEl.appendChild(photoBtn);
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
    const step = SPEED * (ch.running ? runBoost(ch) : 1) * (ch.slow || 1) * (ch.boost || 1) * dt; // boost: 복음의 신 (gear.js)
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
    if (ch.seat.kind === 'sunbed') fy = floorY(ch.x, ch.z) + 0.2;
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
  const lean = (ch.state === 'sit' && ch.seat && (ch.seat.lean || LEAN[ch.seat.kind])) || 0;
  ch.lean = (ch.lean || 0) + (lean - (ch.lean || 0)) * Math.min(1, dt * 2.5);
  if (ch.lean > 0.002) {
    const hy = ch.seat && ch.seat.kind === 'lie' ? 0.12 : 0.3;
    ch.av.rotation.order = 'YXZ';
    ch.av.rotation.x = -ch.lean;
    ch.av.position.y += hy * (1 - Math.cos(ch.lean));
    ch.av.position.x += Math.sin(ch.face) * hy * Math.sin(ch.lean);
    ch.av.position.z += Math.cos(ch.face) * hy * Math.sin(ch.lean);
  } else if (ch.av.rotation.x) ch.av.rotation.x = 0;
  if (ch.av.rotation.z && !(ch.seat && ch.seat.sway)) ch.av.rotation.z = 0;
  if (ch.state === 'sit' && ch.seat && ch.seat.sway) ch.seat.sway(ch); // 그네·해먹과 함께 흔들림
  // 부드럽게 돌기
  let da = ch.face - ch.av.rotation.y;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  ch.av.rotation.y += da * Math.min(1, dt * 10);
}

// 동작을 시작하거나 자리에 앉으면 잠시 뒤 그 동작에 어울리는 말씀이 은은하게 떠오름
const ACTION_VERSE = { gaze: 'light', water: 'water_plant', share: 'share', sip: 'drink', eat: 'eat' };
const VERSE_OF = { read: 'read', pray: 'pray', praise: 'praise' }; // 누를 때마다 말씀 한 구절
const LEAN = { sunbed: 0.87, recline: 0.62, beanbag: 0.5, lie: 1.45 };
const SEAT_VERSE = { sunbed: 'recline', recline: 'recline', beanbag: 'beanbag', lie: 'recline3', lounge: 'rest', bench: 'rest', gbench: 'garden', boat: 'boat', floor: 'still', log: 'campfire', vine: 'vine', picnic: 'bbq' };
// 쉼: 앉거나 누워 가만히 있으면 카메라가 천천히 물러나 둘레를 돌고, 화면 가장자리가 따뜻하게 물듦
const restGlow = document.createElement('div');
restGlow.id = 'restGlow';
document.body.appendChild(restGlow);
let restT = 0, restK = 0;
// 넓은 정원: 멀리(안개 속) 있는 놀이·장식은 그리지 않음. 가운데에 붙은 큰 것(바닥·건물·길)은 그대로
let cullT = 0;
const CULL_D = 60;
const cullBox = new THREE.Box3(), cullV = new THREE.Vector3();
// 정원에 나가면 카페 안 가구·소품은 감추고 수레바퀴 하나로 (들어오면 다시 그대로)
const wheelProxy = makeWheelProxy();
scene.add(wheelProxy);
let collapsed = false;
function farCull(dt) {
  if ((cullT -= dt) > 0) return;
  cullT = 0.4;
  const cx = camera.position.x, cz = camera.position.z;
  const mr = Math.hypot(me.x, me.z), camR = Math.hypot(cx, cz);
  collapsed = collapsed ? mr > R_HALL + 1.5 || camR > R_HALL + 30 : mr > R_HALL + 3.5 && camR > R_HALL + 1;
  wheelProxy.visible = collapsed;
  foldCafeMenu(mr > R_HALL + 1.5);
  for (const o of scene.children) {
    if (o.userData.noCull || o.isLight || o.isInstancedMesh) continue;
    const x = o.position.x, z = o.position.z;
    let far;
    if (x * x + z * z < (R_HALL + 3) * (R_HALL + 3)) {
      // 카페 안의 작은 가구·소품은 정원 멀리서는 그리지 않음 (건물·바닥·기둥처럼 큰 것은 그대로)
      if (o === me.av || o.userData.small === false) continue;
      if (o.userData.body && !npcs.some((n) => n.av === o)) continue; // 함께 있는 사람은 그대로
      if (o.userData.small == null) {
        const b = cullBox.setFromObject(o);
        if (b.isEmpty()) continue;
        const sz = b.getSize(cullV);
        o.userData.small = Math.max(sz.x, sz.y, sz.z) < 4 && (x || z) !== 0;
        if (!o.userData.small) continue;
      }
      far = collapsed;
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

// 화면이 버벅이면 스스로 가볍게: 3초 평균이 30fps 아래면 한 단계씩
// 1) 그림자를 두 장면에 한 번만 새로 그림 2) 화소 수 줄임 3) 그림자 지도 작게
const quality = { acc: 0, n: 0, level: 0, prev: 0, frame: 0 };
function adaptQuality(now) {
  const d = quality.prev ? now - quality.prev : 0; quality.prev = now;
  if (quality.level >= 2) { renderer.shadowMap.needsUpdate = (++quality.frame % 2) === 0; }
  if (d <= 0 || d > 250 || document.hidden) return; // 탭을 다녀온 틈은 세지 않음
  quality.acc += d; quality.n++;
  if (quality.acc < 3000) return;
  const avg = quality.acc / quality.n;
  quality.acc = 0; quality.n = 0;
  if (avg < 33 || quality.level >= 3) return;
  quality.level++;
  if (quality.level === 1) { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1)); resize(); }
  if (quality.level === 2) renderer.shadowMap.autoUpdate = false;
  if (quality.level === 3) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } renderer.setPixelRatio(0.8); resize(); }
  window.__cafe.quality = quality.level;
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
  if (owner.state !== 'walk') owner.face = nearOwner ? Math.atan2(me.x - owner.x, me.z - owner.z) : Math.PI;
  tut.step(dt);
  training.step(dt, t);
  dungeon.step(dt, t);
  warfare.step(dt, t);
  guides.step(dt);
  garden.step(dt);
  wayguide.step(dt);
  quests.step(dt, t);
  shop.step(dt, t);
  gear.step(dt);
  story.step(dt, t);
  pets.step(dt);
  questLog?.step(dt);
  region.step(dt);
  cartGuide?.step(dt);
  for (const n of npcs) { stepChar(n, dt); poseAvatar(n.av, n, t, dt); }
  training.pin();
  warfare.pin();
  guides.pin();
  cartGuide?.pin();
  garden.pin();
  wayguide.pin();
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
    const minD = view.close || 4.5; // 캐릭터 만들기에서는 더 가까이
    let az = view.az, el = clamp(view.el, 0.08, 1.1), dist = Math.max(minD, view.dist);
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
    dist = Math.max(minD, dist);
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
    camera.rotateX(Math.atan((view.aimY ?? 0.22) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    if (++occFrame % 3 === 0) { fadeOccluders(P, camPos); deco.forestFade?.(P, camPos); }
  }
  if (window.__cafe.camOverride) { const o = window.__cafe.camOverride; camera.position.set(...o.pos); camera.lookAt(...o.look); } // 시험용 시점
  stepFades(dt);
  stepBursts(dt);
  stepWakes(dt);
  signs.step(dt * (window.__cafe.speed || 1));
  park.step(dt * (window.__cafe.speed || 1), t);
  leisure.step(dt, t);
  stillness?.step();
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
  adaptQuality(now);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- 들어가기: 혼자 / 함께(랜덤 10명, 넘으면 다음 카페) / 초대 링크 ----------
const together = initTogether({ scene, me, look: myLook, makeChar, poseAvatar, upgradeCup });
const toastEl = document.getElementById('toast');
let toastT = null;
// 알림은 한 번에 하나씩 (2026-11-03): 앞 알림을 덮어쓰지 않고 차례로 보여 줌. 밀려 있으면 앞 알림을 조금 일찍 넘김
const toastQ = [];
let toastAt = 0;
function showToast(msg, sec) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastAt = performance.now();
  clearTimeout(toastT);
  toastT = setTimeout(nextToast, sec * 1000);
  placeOverlays();
}
function nextToast() {
  const n = toastQ.shift();
  if (n) showToast(n[0], toastQ.length ? Math.min(n[1], 4) : n[1]);
  else { toastEl.hidden = true; placeOverlays(); }
}
const doorToasts = []; // 들어가기 전(첫 화면)에 생긴 알림은 들어간 뒤에 보여 줌
function toast(msg, sec = 3) {
  if (document.body.classList.contains('at-door') && !document.getElementById('acct')?.offsetParent && !document.getElementById('roomkey')) { if (doorToasts.length < 4) doorToasts.push([msg, sec]); return; }
  if (toastEl.hidden) return showToast(msg, sec);
  if (toastEl.textContent === msg || toastQ.some((q) => q[0] === msg)) return; // 같은 알림은 한 번만
  toastQ.push([msg, sec]);
  if (toastQ.length > 3) toastQ.shift(); // 너무 밀리면 오래된 것부터 버림
  // 지금 알림을 적어도 2초는 보여 준 뒤 다음으로
  clearTimeout(toastT);
  toastT = setTimeout(nextToast, Math.max(0, 2000 - (performance.now() - toastAt)));
}
// 말씀 카드·알림·말풍선이 서로 겹치지 않게 자리를 잡음: 알림은 위, 말씀은 알림 아래, 말풍선(아래)과 겹치면 말씀을 올리고 작게
const verseEl = document.getElementById('verse');
function placeOverlays() {
  if (!verseEl) return;
  const H = vh();
  const tb = toastEl.hidden ? 0 : localBox(toastEl).bottom;
  let floor = H;
  for (const b of document.querySelectorAll('.npcb:not([hidden])')) { const r = localBox(b); if (r.height) floor = Math.min(floor, r.top); }
  verseEl.classList.remove('tight');
  let top = Math.max(H * 0.3, tb ? tb + 10 : 0);
  if (!verseEl.hidden) {
    let h = verseEl.offsetHeight;
    if (top + h > floor - 8) { top = Math.max(tb ? tb + 6 : 60, floor - 8 - h); }
    if (top + h > floor - 8) { verseEl.classList.add('tight'); h = verseEl.offsetHeight; top = Math.max(tb ? tb + 6 : 56, Math.min(top, floor - 8 - h)); }
  }
  verseEl.style.top = Math.round(top) + 'px';
}
setInterval(placeOverlays, 250);
on('toast', ([m, sec]) => toast(m, sec)); // 다른 모듈에서 알림 (bus.js)
// 위쪽 사람 수 단추: 초대 카페에서는 누르면 초대 링크를 다시 공유
const peopleBtn = document.createElement('button');
peopleBtn.className = 'place people';
peopleBtn.hidden = true;
placesEl.insertBefore(peopleBtn, viewBtn);
const map = initMap({
  me, people: () => [...together.people.values()].filter((p) => p.net && p.inTown), walkTo, // people: 이 마을 사람만 (멀어서 안 그리는 사람도 지도에는)
  say: toast, icon: ICONS.map, placesEl, before: peopleBtn,
  // 마을 탭: 가 본 마을만. 다른 마을을 고르면 이 마을의 수레 곁으로 걸어감
  towns: () => visitedTowns(profile), toTown: () => region?.toCart(), // 등록부 (js/villages/registry.js)
});

// 모임 번호 (링크를 주고받지 않고, 같은 네 자리 번호를 넣은 사람끼리만 모임)
const ROOM_KEY = 'navs-cafe-room';
function askRoomCode() {
  return new Promise((resolve) => {
    let v = '';
    try { v = localStorage.getItem(ROOM_KEY) || ''; } catch (e) { /* 무시 */ }
    const box = document.createElement('div');
    box.id = 'roomkey';
    box.innerHTML = `<div class="pad"><div class="hint">함께할 사람과 같은 네 자리 번호를 넣어 주세요</div><div class="digits"><span></span><span></span><span></span><span></span></div>
      <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}<button class="small" data-k="new">새 번호</button><button data-k="0">0</button><button data-k="del" aria-label="지우기">⌫</button></div>
      <div class="row"><button data-k="back">돌아가기</button><button class="go" data-k="go">들어가기</button></div></div>`;
    const show = () => { box.querySelectorAll('.digits span').forEach((e, i) => { e.textContent = v[i] || ''; }); box.querySelector('.go').disabled = v.length !== 4; };
    const done = (code) => { box.remove(); window.removeEventListener('keydown', onKey, true); resolve(code); };
    const press = (k) => {
      if (k === 'del') v = v.slice(0, -1);
      else if (k === 'new') v = String(1000 + Math.floor(Math.random() * 9000));
      else if (k === 'back') return done(null);
      else if (k === 'go') { if (v.length === 4) { try { localStorage.setItem(ROOM_KEY, v); } catch (e) { /* 무시 */ } return done(v); } return; }
      else if (v.length < 4) v += k;
      show();
    };
    const onKey = (e) => { e.stopPropagation(); if (/^Digit\d$|^Numpad\d$/.test(e.code)) press(e.code.slice(-1)); else if (e.code === 'Backspace') press('del'); else if (e.code === 'Enter' || e.code === 'NumpadEnter') press('go'); else if (e.code === 'Escape') press('back'); };
    box.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (b) { e.preventDefault(); press(b.dataset.k); } });
    window.addEventListener('keydown', onKey, true);
    document.body.appendChild(box);
    show();
  });
}
function roomToast() { const s = together.st, town = s.here != null && s.here !== s.count ? ` (이 마을 ${s.here}명)` : ''; toast(`모임 번호 ${s.code} · ${s.count}/${INVITE_CAP}명${town}. 같은 번호를 넣으면 이 카페로 와요.`, 4); }
peopleBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  const s = together.st;
  const town = s.here != null && s.here !== s.count ? ` · 이 마을 ${s.here}명` : ''; // 다른 마을에 있는 사람은 화면에서 감춤 (together.js)
  if (s.mode === 'invite') roomToast();
  else toast((s.cafe > 1 ? `${s.cafe}호점 · ${s.count}/${RANDOM_CAP}명` : `${s.count}/${RANDOM_CAP}명`) + town, 2.5);
});
together.st.onChange = (s) => {
  peopleBtn.hidden = s.mode === 'solo';
  peopleBtn.innerHTML = (s.mode === 'invite' ? ICONS.invite : ICONS.people) + `<span>${s.here ?? s.count}</span>`; // 이 마을 n명
  peopleBtn.setAttribute('aria-label', s.mode === 'invite' ? '모임 번호' : '함께 있는 사람');
};

function goIn() {
  enter.classList.add('gone');
  document.body.classList.remove('at-door');
  setTimeout(() => { for (const [m, sec] of doorToasts.splice(0)) toast(m, sec); }, 2500);
  setTimeout(() => enter.remove(), 700);
  // 지난번에 다른 마을(요한복음 마을 등)에 있었으면 그 마을 도착 자리(빛의 광장)에서 시작
  if (lastTown(profile) !== 'base' && profile.name) { region.go(lastTown(profile), { fromDoor: true }); character.showChip(); setTimeout(maybeHint, 1200); return; }
  // 처음 오면 이름과 모습을 정하고, 바나바의 카페 안내를 받음
  walkTo(me, { x: 0, z: 19 }, () => {
    if (!profile.name) character.openCreator(true);
    else if (!profile.tut.cafe) setTimeout(() => tut.start('cafe'), 600);
  });
  character.showChip();
  setTimeout(maybeHint, 1200);
}
async function choose(mode, btn) {
  music.resume();
  await Promise.race([account.ready, new Promise((r) => setTimeout(r, 4000))]); // 계정이 있으면 서버 기록부터
  account.claim(); // 같은 계정으로 다른 기기에 있던 캐릭터는 멈춤
  if (mode === 'solo') { together.start('solo'); return goIn(); }
  let code = inviteCodeFromUrl(); // 예전 초대 링크(?c=)로 온 사람은 그 방으로
  if (mode === 'invite' && !code) {
    code = await askRoomCode();
    if (!code) return; // 돌아가기
  }
  for (const b of enter.querySelectorAll('.mode')) b.disabled = true;
  const r = await together.start(mode, code);
  goIn();
  if (r === 'full') toast(`이 모임 카페는 가득 찼어요(${INVITE_CAP}명). 혼자 둘러보는 중이에요.`, 5);
  else if (r !== 'ok') toast('지금은 함께하기에 연결하지 못했어요. 혼자 둘러보는 중이에요.', 5);
  else if (mode === 'random' && together.st.cafe > 1) toast(`1호점이 가득 차서 ${together.st.cafe}호점으로 왔어요.`, 4);
  else if (mode === 'invite') setTimeout(roomToast, 800);
}
// 계정으로 이어 하기: 서버 기록과 합쳐 지금 캐릭터에 바로 반영
const account = initAccount({
  toast,
  // 같은 계정으로 다른 기기에서 들어옴: 여기 캐릭터는 함께 있는 방에서 빠지고 화면을 덮음
  kicked: () => {
    together.leave?.();
    const d = document.createElement('div');
    d.id = 'away';
    d.innerHTML = '<div class="pad"><h3>다른 기기에서 들어왔어요</h3><p>같은 계정은 한 번에 한 기기에서만 할 수 있어요. 여기는 잠시 멈췄어요.</p><button class="go">여기서 이어 하기</button></div>';
    d.addEventListener('pointerdown', (e) => e.stopPropagation());
    d.querySelector('button').addEventListener('click', () => location.reload());
    document.body.appendChild(d);
  },
  apply: () => {
    Object.assign(profile, loadProfile());
    try { const l = JSON.parse(localStorage.getItem('navs-cafe-look3d') || 'null'); if (l && l.hoodie) { Object.assign(myLook, l); rebuildMe(); } } catch (e) { /* 무시 */ }
    character?.showChip();
  },
});
onProfileSave(() => account.schedule());
// 단추는 index.html에 미리 있음. 장면을 불러오기 전에 눌렀다면 지금 그 모드로 들어감
for (const b of enter.querySelectorAll('.mode')) b.addEventListener('click', () => choose(b.dataset.mode, b));
if (inviteCodeFromUrl()) inviteCodeFromUrl.arrived = true;
window.__enterReady = true;
const signs = initSigns({ scene, me, npcs, interactive, act, sfx, fxSprite, burst, sun, walkTo, faceTo, onShekel: () => shop?.shekel() });
const park = initPark({ scene, me, interactive, act, sfx, fxSprite, burst, walkTo, faceTo, standUp, shot });
Object.assign(ACTIONS, park.actions);
// rest: 마을에서는 등록부 rest[] 쉼 구역 (초보자 마을은 null = 정원 판정 그대로)
const leisure = initLeisure({ scene, me, camera, renderer, view, lights: [hemi, sun, warm], act, sfx, burst, walkTo, faceTo, standUp, nearestPerson, toast, ICONS, LIEABLE, rest: () => { const id = region?.here?.(); return id && id !== 'base' ? village(id)?.rest || [] : null; } });
signs.setShore(leisure.fishSpot);
Object.assign(ACTIONS, leisure.actions);
// 머무름 묵상 (2026-11, js/stillness.js): 쉬는 자리에서 1~2분 숨 고르기 + 말씀 한 구절
//   내 카드(#meCard)는 등록부에 없어(열려 있어도 단축키·Esc가 카드를 다뤄야 함) 여기서만 따로 봄: 카드를 열면 묵상이 조용히 끝남
stillness = initStillness({ me, profile, save: () => saveProfile(profile), busy: () => busyOf('stillness')() || !!document.getElementById('meCard'), rest: () => restK, music, sfx,
  seatVerse: (seat) => { const id = region?.here?.(); return id && id !== 'base' ? village(id)?.seatVerse?.(seat) || null : null; } });
Object.assign(ACTIONS, stillness.actions);
// 오늘 만난 말씀 (2026-11, js/met.js): 화면에 떠오른 말씀을 하루치 모아 내 카드 '오늘 말씀' 탭에
onVerseShown((key) => { if (recordMet(profile.met, key)) saveProfile(profile); });
const scrolls = initScrolls({ scene, me, sfx, fxSprite, burst, icon: ICONS.scroll });
// 마을 사이 다니기: 정원 길목의 수레 ↔ 요한복음 마을 (2026-11). 마을마다 하늘·안개, 지도, 함께 있는 사람이 바뀜
const ENV0 = { fog: null, near: 0, far: 0, hemiSky: hemi.color.clone(), hemiGround: hemi.groundColor.clone() };
function setEnv(env) {
  if (!scene.fog) return;
  if (env) {
    if (!ENV0.fog) { ENV0.fog = scene.fog.color.clone(); ENV0.near = scene.fog.near; ENV0.far = scene.fog.far; }
    scene.fog.color.set(env.sky); scene.fog.near = env.fog[0]; scene.fog.far = env.fog[1];
    hemi.color.set(env.hemiSky); hemi.groundColor.set(env.hemiGround);
  } else if (ENV0.fog) {
    scene.fog.color.copy(ENV0.fog); scene.fog.near = ENV0.near; scene.fog.far = ENV0.far; ENV0.fog = null;
    hemi.color.copy(ENV0.hemiSky); hemi.groundColor.copy(ENV0.hemiGround);
  }
}
region = initRegion({
  scene, me, profile, save: () => saveProfile(profile), toast, sfx, standUp, walkTo, interactive, occluders, setEnv,
  blocked: () => !!cartGuide?.active() || !!shop?.active(), // 수레 안내인 말풍선·수레 짐 창이 열려 있는 동안은 수레 단추가 쉼
  chooseTown: (ids) => cartGuide?.choose(ids), // 초보자 마을 수레가 갈 마을이 여럿이면 수레꾼이 고르기 말풍선을 엶 (사도행전 마을을 연 뒤)
  // 마을 사건 엔진(요한복음 마을: js/john/engine.js)이 쓰는 것: 마을을 처음 지을 때 넘겨받음 (등록부 load의 kit)
  townKit: {
    scene, me, makeChar, npcs, profile, save: () => saveProfile(profile), toast, sfx, burst, fxSprite, walkTo, standUp, shot,
    busy: () => busyOf('john')(), onChange: () => character?.showChip(), openLog: (k) => questLog?.open(k), lights: { hemi, sun },
  },
  camBehind: () => { view.az = me.face + Math.PI; view.tx = me.x; view.tz = me.z; view.ty = me.y + 0.62; view.shot = null; view.lift = 0; },
  onSwitch: (id) => {
    for (const v of VILLAGES) if (v.bodyClass) document.body.classList.toggle(v.bodyClass, v.id === id);
    placesEl.classList.remove('open');
    if (!map.el.hidden) map.shut();
    together.refresh?.();
  },
});
Object.assign(ACTIONS, region.actions);
cartGuide = initCartGuide({ me, makeChar, npcs, profile, toast, busy: () => busyOf('cart')(), region: () => region, shop: () => shop });
// 열려 있는 창 등록부 (2026-11): 말풍선·안내·훈련 등 창이 하나라도 열려 있으면 다른 말풍선은 열리지 않음
//   새 모듈이 생기면 여기 한 줄만 보태면 됨. busyOf(자기 이름, ...보지 않을 이름)은 자기 자신을 뺀 나머지를 살핌
//   story(누가) 말풍선이 열려 있으면 훈련·시험·부탁·가게도 열리지 않음 (2026-11 단위 6에서 정리, 예전엔 예외였음)
const OPEN_WINDOWS = {
  tut: () => tut?.active(), character: () => character?.isOpen(), training: () => training?.active(), dungeon: () => dungeon?.active(),
  guides: () => guides?.active(), garden: () => garden?.active(), wayguide: () => wayguide?.active(), warfare: () => warfare?.active(),
  quests: () => quests?.active(), shop: () => shop?.active(), story: () => story?.active?.(),
  cart: () => cartGuide?.active(), // 수레 안내인 말풍선
  region: () => region?.active(), // 마을을 옮기는 중
  john: () => !!region?.anyActive(), // 마을 사건 말풍선 (요한복음 마을: 시험·공부·암송·묵상 창 포함). 이름은 예전 그대로
  stillness: () => !!stillness?.active(), // 머무름 묵상 (고르는 창 포함)
};
const busyOf = (self, ...skip) => {
  const off = new Set([self, ...skip]);
  return () => { for (const k in OPEN_WINDOWS) if (!off.has(k) && OPEN_WINDOWS[k]()) return true; return false; };
};
const saveMe = () => saveProfile(profile);
tut = initTutorial({
  me, profile, save: saveMe, toast, sfx, burst, walkTo, faceTo, map, lying, outdoors: () => outdoors(me),
  barnabas: owner, adam, tutors: () => (wayguide ? wayguide.tutors() : [adam]), home: { barnabas: ownerPos },
  near: (k) => Math.hypot(me.x - SPOTS[k].x, me.z - SPOTS[k].z) < SPOTS[k].r,
  photoOn: () => leisure.photoOn(),
  onChange: () => character.showChip(),
});
character = initCharacter({
  me, look: myLook, profile, save: saveMe, rebuild: rebuildMe, view, toast, portrait,
  onCreated: () => { character.showChip(); setTimeout(() => tut.start('cafe'), 500); },
  replay: (id) => (id === 'account' ? account.open() : id.startsWith('use:') ? shop.use(id.slice(4)) : id.startsWith('gear:') ? gear.toggle(id.slice(5)) : id.startsWith('pet:') ? pets.choose(id.slice(4)) : tut.start(id)),
});
training = initTraining({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, fxSprite,
  quests: () => quests,
  goTo: (p, say) => { if (me.climb) { toast('먼저 나무에서 내려와요', 3); return; } if (walkToward(me, walkTo, p)) toast(say, 3); else toast('그곳으로 가는 길을 찾지 못했어요', 3); },
  busy: busyOf('training'),
  onChange: () => character.showChip(),
});
Object.assign(ACTIONS, training.actions);
dungeon = initDungeon({
  scene, me, profile, save: saveMe, toast, sfx, burst, fxSprite,
  busy: busyOf('dungeon'),
  resting: () => restK > 0.5, // 쉼 모드(앉아 쉬는 중)면 승리 반짝임을 절반으로
  onChange: () => character.showChip(),
  courseName: (id) => (COURSE_META[id] ? COURSE_META[id].name : id),
  gear: () => gear, shot,
});
Object.assign(ACTIONS, dungeon.actions);
guides = initGuides({
  me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, dungeon,
  goTo: (p, say) => { if (walkToward(me, walkTo, p)) toast(say, 3); else toast('그곳으로 가는 길을 찾지 못했어요', 3); },
  busy: busyOf('guides'),
  onChange: () => character.showChip(),
});
warfare = initWarfare({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, fxSprite,
  busy: busyOf('warfare'),
  courseName: (id) => (COURSE_META[id] ? COURSE_META[id].name : id), // 훈련소에 섞이는 숲길 속삭임의 길 이름
  onChange: () => character.showChip(),
});
garden = initGarden({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, walkTo,
  busy: busyOf('garden'),
  onChange: () => character.showChip(),
});
wayguide = initWayguide({
  me, makeChar, npcs, nameTag, adam, profile, sfx, walkTo,
  quests: () => quests, training: () => training, garden: () => garden, guides: () => guides, dungeon: () => dungeon,
  goTo: (p, say) => { if (me.climb) { toast('먼저 나무에서 내려와요', 3); return; } if (walkToward(me, walkTo, p)) toast(say, 3); else toast('그곳으로 가는 길을 찾지 못했어요. 지도에서 가까운 곳으로 가 보세요', 4); },
  openMap: () => map.open(),
  tutActive: () => !!tut?.active(),
  busy: busyOf('wayguide'),
});
// 지도 화면의 길잡이 단추: 어디로 갈지 모를 때 가 볼 만한 곳을 골라 줌
{
  const b = document.createElement('button'); b.className = 'guideMe'; b.textContent = '🧭 어디로 갈까요?';
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  b.addEventListener('click', (e) => { e.stopPropagation(); map.shut(); wayguide.openHere(); });
  map.el.appendChild(b);
}
gear = initGear({ me, profile, scene, toast, sfx, burst, TIER });
quests = initQuests({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, fxSprite, lying, nearestFree,
  busy: busyOf('quests'),
  onChange: () => character.showChip(),
});
Object.assign(ACTIONS, quests.actions);
shop = initShop({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, act, standUp,
  camBehind: () => { view.az = me.face + Math.PI; },
  // 안약: 할 일이 남은 사람 (마치지 않은 부탁의 사람, 마치지 않은 훈련의 사부)
  guides: () => [
    ...(quests?.Q || []).filter((q) => q.who && q.who.av && profile.quests?.[q.id] !== 'done').map((q) => q.who),
    ...Object.values(training?.T || {}).filter((d) => d.who && d.who.av && !profile.train?.[d.stat]).map((d) => d.who),
    ...(guides?.list || []).filter((g) => profile.trails?.[g.id] !== 'done' && dungeon?.open(g.id) !== false).map((g) => g.n),
  ],
  busy: busyOf('shop'),
  onChange: () => character.showChip(),
});
Object.assign(ACTIONS, shop.actions);
pets = initPets({ scene, me, profile, toast, sfx, burst, onChange: () => character.showChip() });
Object.assign(ACTIONS, pets.actions);
story = initStory({
  scene, me, makeChar, npcs, profile, save: saveMe, toast, sfx, burst, fxSprite,
  busy: busyOf('story'),
  onChange: () => character.showChip(),
});
questLog = initQuestLog({ me, quests, story, walkTo, toast, john: () => region.engineHere(), town: () => region.here() });
requestAnimationFrame(frame);
if (window.__pick) choose(window.__pick);
// 첫 화면이 뜬 뒤 소품 모델을 천천히 불러와 바꿔 끼움
setTimeout(() => {
  loadProps({ scene, deco, interactive, anim, renderer, occluders });
  upgradeCup(me.av);
  for (const n of npcs) if (n.av) upgradeCup(n.av);
}, 300);

window.__cafe = { get region() { return region; }, get cartGuide() { return cartGuide; }, get questLog() { return questLog; }, get pets() { return pets; }, get story() { return story; }, get shop() { return shop; }, get gear() { return gear; }, get warfare() { return warfare; }, get guides() { return guides; }, get garden() { return garden; }, get wayguide() { return wayguide; }, availableActions, profile, tut, character, training, dungeon, quests, camera, shot, together, me, seats, walkTo, ACTIONS, view, sitOn, npcs, stick, signs, placed, park, scrolls, renderer, map };
