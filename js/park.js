// 말씀 테마파크: 정원 바깥의 체험 구역과 액티비티 시설
// 각 시설은 가까이 가면 동작 버튼이 뜨고, 체험이 끝나면 어울리는 말씀이 떠오름
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import { gr, PARK, POOL, GATE, R_PARK, R_WALK, R_GARDEN, LANES, polar, deg, inPool, poolDepth, parkClear, isFree } from './layout.js';
import { place } from './props.js';
import { showVerse, showNext } from './verses.js';
import { addStories } from './stories.js';
import { addCourses } from './courses.js';

const G0 = -0.5; // 잔디 높이
const loader = new GLTFLoader();
const bufs = new Map();
// 애니메이션 모델은 인스턴스마다 새로 읽음 (뼈대가 있는 모델은 clone으로 복사가 안 됨)
function loadFresh(path) {
  if (!bufs.has(path)) bufs.set(path, fetch(path).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  const base = path.slice(0, path.lastIndexOf('/') + 1);
  return bufs.get(path).then((b) => (b ? new Promise((ok) => loader.parse(b, base, ok, () => ok(null))) : null));
}

const M = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const MAT = {
  line: M(0xffffff, 0.6),
  wood: M(0xa77b55),
  woodDark: M(0x7a5a3e),
  white: M(0xf6f2ea, 0.6),
  stone: M(0xd9d2c4, 0.95),
  net: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.8, side: THREE.DoubleSide, depthWrite: false }),
  leaf: M(0x5f9e5a),
  leafDark: M(0x3f7a48),
  gravel: M(0xe9e1d2, 1),
};
function shadow(o, cast = true) { o.traverse((c) => { if (c.isMesh) { c.castShadow = cast; c.receiveShadow = true; } }); return o; }
// 구역 모양 그룹: 그룹 안에서 x = 바깥 방향(v), z = 둘레 방향(u)
function zoneGroup(scene, zn) {
  const g = new THREE.Group();
  g.position.set(zn.x, G0, zn.z);
  g.rotation.y = zn.rot;
  scene.add(g);
  return g;
}
const at = (o, u, y, v) => { o.position.set(v, y, u); return o; };
function flat(w, d, mat, y = 0.012) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(d, w), mat); // 그룹 안: 가로(x)=v, 세로(z)=u
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(d, h, w), mat); // w = u 방향, d = v 방향
function lineRect(g, w, d, t = 0.08, y = 0.02) {
  for (const s of [-1, 1]) {
    const a = box(w, 0.005, t, MAT.line); at(a, 0, y, s * d / 2); g.add(a);
    const b = box(t, 0.005, d, MAT.line); at(b, s * w / 2, y, 0); g.add(b);
  }
}
function ringLine(g, r, u, v, y = 0.02, from = 0, len = Math.PI * 2) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.04, r + 0.04, 40, 1, from, len), MAT.line);
  m.rotation.x = -Math.PI / 2;
  at(m, u, y, v);
  g.add(m);
  return m;
}
// 움직이지 않는 조각들(울타리·기둥·잎 등)을 재질별로 한 덩어리로 합쳐 그리기 횟수를 줄임
// 그룹의 바로 아래 메시 중 보이고, 누를 수 없고, 움직이지 않는 것(userData.dyn 아님)만
export function mergeStatic(g) {
  const by = new Map();
  for (const c of g.children) {
    if (!c.isMesh || c.isInstancedMesh || !c.visible || c.userData.onTap || c.userData.dyn || c.material.transparent) continue;
    const key = c.material.uuid + (c.geometry.index ? 'i' : 'n') + Object.keys(c.geometry.attributes).sort().join();
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(c);
  }
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const geos = list.map((c) => { c.updateMatrix(); return c.geometry.clone().applyMatrix4(c.matrix); });
    const merged = mergeGeometries(geos);
    geos.forEach((q) => q.dispose());
    if (!merged) continue;
    const m = new THREE.Mesh(merged, list[0].material);
    m.castShadow = list.some((c) => c.castShadow); m.receiveShadow = true;
    for (const c of list) g.remove(c);
    g.add(m);
  }
  return g;
}
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// ---------- 소리: 정원의 자연 소리(새·바람), 모닥불, 비, 물소리 (모두 합성) ----------
function makeAudio() {
  let ctx = null, master = null, noiseBuf = null, allowed = false;
  // 브라우저는 사용자가 화면을 누른 뒤에야 소리를 허락함
  const allow = () => { allowed = true; };
  window.addEventListener('pointerdown', allow, { once: true, capture: true });
  window.addEventListener('keydown', allow, { once: true, capture: true });
  const get = () => {
    if (!allowed) return null;
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let b = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = b * 3.5; } // 갈색 잡음
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  // 계속 흐르는 소리(바람·불·비)는 잡음에 필터를 걸고 크기만 조절
  function loop(type, freq, q = 0.7) {
    const c = get(); if (!c) return null;
    const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(master); src.start();
    return { g, f, set(v) { g.gain.setTargetAtTime(v, c.currentTime, 0.4); } };
  }
  function chirp(pan = 0, vol = 0.05) {
    const c = get(); if (!c) return;
    const t0 = c.currentTime;
    const base = 2600 + Math.random() * 2200;
    const n = 2 + Math.floor(Math.random() * 4);
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) { p.pan.value = pan; p.connect(master); }
    for (let k = 0; k < n; k++) {
      const o = c.createOscillator(); const g = c.createGain();
      const s = t0 + k * (0.09 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base, s);
      o.frequency.exponentialRampToValueAtTime(base * (0.6 + Math.random() * 0.9), s + 0.07);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.08);
      o.connect(g).connect(p || master); o.start(s); o.stop(s + 0.1);
    }
  }
  function crack(vol) {
    const c = get(); if (!c) return;
    const src = c.createBufferSource(); src.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
    const g = c.createGain(); const t0 = c.currentTime;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03 + Math.random() * 0.04);
    src.connect(f).connect(g).connect(master); src.start(t0, Math.random() * 1.5, 0.1);
  }
  function splash(vol = 0.25) {
    const c = get(); if (!c) return;
    const src = c.createBufferSource(); src.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    const g = c.createGain(); const t0 = c.currentTime;
    f.frequency.setValueAtTime(1600, t0); f.frequency.exponentialRampToValueAtTime(400, t0 + 0.4);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    src.connect(f).connect(g).connect(master); src.start(t0, Math.random(), 0.6);
  }
  return { get, loop, chirp, crack, splash };
}

export function initPark({ scene, me, interactive, act, sfx, fxSprite, burst, walkTo, faceTo, standUp, shot = () => {} }) {
  const P = PARK;
  const camShot = shot; // 체험 시점 (농구의 shot 변수와 헷갈리지 않게)
  const audio = makeAudio();
  const mixers = [];
  const steps = []; // (dt, t) 매 프레임
  const actions = {};
  const avail = []; // () => 동작 이름 또는 null
  const near = (zn, pad = 1.5) => zn.inside(me.x, me.z, pad);
  const dist = (p) => Math.hypot(me.x - p.x, me.z - p.z);
  const hit = (name, vol = 0.3, rate = 1) => sfx('impact/' + name, vol, rate);
  // 오브젝트를 누르면: 가까우면 바로, 멀면 걸어가서 실행
  function tapTo(objs, spot, fn, reach = 2.2) {
    for (const o of objs) o.traverse((c) => { if (c.isMesh) { c.userData.onTap = () => go(spot, fn, reach); interactive.push(c); } });
  }
  function go(spot, fn, reach = 2.2) {
    const p = typeof spot === 'function' ? spot() : spot;
    if (dist(p) < reach) { standUp(me); fn(); }
    else walkTo(me, p, fn);
  }

  // ---------- 길: 바깥 둘레길, 오솔길, 입구 길 ----------
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R_PARK - 1.5, R_PARK + 1.5, 200), MAT.gravel);
    ring.rotation.x = -Math.PI / 2; ring.position.y = G0 + 0.014; ring.receiveShadow = true;
    scene.add(ring);
    for (const a of LANES) {
      if (a === 90) continue;
      const len = R_PARK - R_WALK - 2.4, mid = (R_PARK + R_WALK) / 2;
      const lane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, len), MAT.gravel);
      lane.rotation.set(-Math.PI / 2, 0, -deg(a) + Math.PI / 2);
      const p = polar(mid, a);
      lane.position.set(p.x, G0 + 0.013, p.z);
      lane.receiveShadow = true;
      scene.add(lane);
    }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(4, R_GARDEN - (GATE.r - 1)), MAT.stone);
    road.rotation.x = -Math.PI / 2; road.position.set(0, G0 + 0.012, (R_GARDEN + GATE.r - 1) / 2); road.receiveShadow = true;
    scene.add(road);
  }

  // ---------- 테마파크 입구 (CC0 놀이공원 문) ----------
  place(scene, 'assets/park/park-entrance.glb', { x: 0, z: gr(51), y: G0, rot: 0, width: 10 });
  {
    let lastZ = me.z;
    steps.push(() => { if (Math.abs(me.x) < 2 && lastZ < gr(51) && me.z >= gr(51)) showVerse('joy', { delay: 0.4, cooldown: 120 }); lastZ = me.z; });
  }

  // ---------- 간식 가게 (안쪽 동쪽) ----------
  {
    const zn = P.market;
    const face = Math.atan2(-zn.n.x, -zn.n.z); // 건물 쪽을 바라봄
    const stalls = [['stall-food', -4], ['stall-drinks', 0], ['stall-information', 4]];
    for (const [n, u] of stalls) {
      const p = zn.at(u, 1.8);
      place(scene, 'assets/park/' + n + '.glb', { x: p.x, z: p.z, y: G0, rot: face, width: 2.8 }).then((m) => {
        if (!m || n === 'stall-information') return;
        const front = zn.at(u, -0.2);
        tapTo([m], front, () => {
          faceTo(me, p);
          if (n === 'stall-food') { me.food = ['croissant', 'donut', 'muffin'][Math.floor(Math.random() * 3)]; me.bites = 0; }
          else { me.item = 'cup'; me.drink = Math.random() < 0.5 ? 'coffee' : 'tea'; me.sips = 0; }
          sfx('cup', 0.15);
          showVerse(n, { delay: 0.8, cooldown: 30 });
        });
      });
    }
    // 가게 앞에 서면 가게마다 말씀 한 구절
    const fronts = stalls.map(([n, u]) => ({ n, p: zn.at(u, -0.6), near: false }));
    steps.push(() => {
      if (Math.abs(me.x - zn.x) > 12 || Math.abs(me.z - zn.z) > 12) return;
      for (const f of fronts) {
        const inside = Math.hypot(me.x - f.p.x, me.z - f.p.z) < 2.6;
        if (inside && !f.near) showVerse(f.n, { delay: 0.6, cooldown: 90 });
        f.near = inside;
      }
    });
    for (const u of [-4.5, 0, 4.5]) { const p = zn.at(u, -2.3); place(scene, 'assets/park/bench.glb', { x: p.x, z: p.z, y: G0, rot: face + Math.PI, width: 1.6 }); }
    const tp = zn.at(6, 0.5); place(scene, 'assets/park/trash.glb', { x: tp.x, z: tp.z, y: G0, rot: face, height: 0.7 });
  }

  // ---------- 우물 (요 4:14) ----------
  {
    const zn = P.well;
    const g = zoneGroup(scene, zn);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.8, 20, 1, true), MAT.stone);
    wall.material = wall.material.clone(); wall.material.side = THREE.DoubleSide;
    wall.position.y = 0.4;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.09, 6, 24), MAT.stone);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.8;
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.92, 20), M(0x2f5a73, 0.2));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.3;
    g.add(wall, rim, water);
    for (const s of [-1, 1]) { const post = box(0.12, 2.2, 0.12, MAT.wood); at(post, s * 1.05, 1.1, 0); g.add(post); }
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.6, 0.8, 4, 1), MAT.woodDark);
    roof.rotation.y = Math.PI / 4; roof.position.y = 2.55; roof.scale.set(1, 1, 0.7);
    g.add(roof);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), MAT.woodDark);
    axle.rotation.x = Math.PI / 2; axle.position.y = 1.9;
    g.add(axle);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), M(0xcdb68e));
    g.add(rope);
    const bucket = new THREE.Group();
    g.add(bucket);
    place(scene, 'assets/camp/bucket.glb', { x: 0, z: 0, y: 0, height: 0.32, parent: bucket });
    let drawT = -1;
    const setBucket = (depth) => {
      bucket.position.y = 1.85 - 0.25 - depth;
      rope.scale.y = depth + 0.2;
      rope.position.y = 1.9 - (depth + 0.2) / 2;
    };
    setBucket(0.1);
    shadow(g);
    const spot = () => zn.at(0, -1.6);
    actions.draw = () => go(spot, () => {
      faceTo(me, zn); act('draw', 3.4); drawT = 0; camShot(zn, { dist: 7, el: 0.3, side: 0.7, dur: 5, mid: 0.4 });
    });
    avail.push(() => (dist(zn) < 3.2 && drawT < 0 && !me.item ? 'draw' : null));
    tapTo([wall, roof], spot, () => actions.draw());
    steps.push((dt) => {
      if (drawT < 0) return;
      drawT += dt;
      const d = drawT < 1.5 ? ease(drawT / 1.5) * 1.35 : drawT < 3.2 ? 1.35 * (1 - ease((drawT - 1.6) / 1.5)) : 0.1;
      setBucket(Math.max(0.1, d));
      if (drawT > 1.45 && drawT - dt <= 1.45) audio.splash(0.12);
      if (drawT > 3.3) { drawT = -1; me.item = 'cup'; me.drink = 'water'; sfx('cup', 0.15); showVerse('drink', { delay: 0.5, cooldown: 40 }); }
    });
  }

  // ---------- 포도나무 그늘 (요 15:5) ----------
  {
    const zn = P.vine;
    const g = zoneGroup(scene, zn);
    for (const u of [-3, 3]) for (const v of [-1.8, 1.8]) { const post = box(0.16, 2.5, 0.16, MAT.white); at(post, u, 1.25, v); g.add(post); }
    for (const v of [-1.8, 1.8]) { const beam = box(6.6, 0.14, 0.16, MAT.white); at(beam, 0, 2.5, v); g.add(beam); }
    for (let u = -3; u <= 3; u += 0.75) { const slat = box(0.08, 0.1, 4.2, MAT.white); at(slat, u, 2.58, 0); g.add(slat); }
    // 잎 덩굴과 포도송이
    const leafGeo = new THREE.IcosahedronGeometry(0.45, 0);
    const grapeMat = M(0x6b3f86, 0.35, { emissive: 0x2a0f3a, emissiveIntensity: 0.0 });
    const grapes = [];
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 26; k++) {
      const l = new THREE.Mesh(leafGeo, k % 2 ? MAT.leaf : MAT.leafDark);
      l.scale.set(1 + rnd(), 0.5, 1 + rnd() * 0.6);
      at(l, -3.2 + rnd() * 6.4, 2.72 + rnd() * 0.15, -2 + rnd() * 4);
      g.add(l);
    }
    for (const u of [-3, 3]) for (const v of [-1.8, 1.8]) for (let k = 0; k < 4; k++) {
      const l = new THREE.Mesh(leafGeo, MAT.leaf); l.scale.setScalar(0.5); at(l, u + (rnd() - 0.5) * 0.3, 0.5 + k * 0.55, v + (rnd() - 0.5) * 0.3); g.add(l);
    }
    // 포도알 14개를 한 송이 모양으로 합침
    const bunchGeo = mergeGeometries(Array.from({ length: 14 }, (_, j) => {
      const row = Math.floor(j / 4), a = j * 2.4;
      return new THREE.SphereGeometry(0.045, 6, 5).translate(Math.cos(a) * (0.09 - row * 0.02), -row * 0.07, Math.sin(a) * (0.09 - row * 0.02));
    }));
    for (let k = 0; k < 12; k++) {
      const c = new THREE.Group();
      c.add(new THREE.Mesh(bunchGeo, grapeMat));
      at(c, -2.6 + (k % 6) * 1.05 + rnd() * 0.2, 2.35, k < 6 ? -1.1 : 1.1);
      g.add(c);
      grapes.push(c);
    }
    shadow(g); mergeStatic(g);
    let glow = 0;
    tapTo(grapes, () => zn.at(0, 0), () => { glow = 3; sfx('orb', 0.2); showVerse('vine', { cooldown: 20 }); }, 3.5);
    steps.push((dt, t) => {
      glow = Math.max(0, glow - dt);
      grapeMat.emissiveIntensity = glow > 0 ? 0.6 + Math.sin(t * 6) * 0.3 : 0;
      for (const [k, c] of grapes.entries()) c.rotation.z = Math.sin(t * 1.2 + k) * 0.04;
    });
    // 그늘 아래 벤치 (앉으면 말씀)
    for (const u of [-1.2, 1.2]) {
      const bench = new THREE.Group();
      const seatB = box(1.6, 0.08, 0.45, MAT.wood); seatB.position.y = 0.45; bench.add(seatB);
      const back = box(1.6, 0.4, 0.06, MAT.wood); back.position.set(0.24, 0.72, 0); bench.add(back);
      for (const s2 of [-0.7, 0.7]) { const leg = box(0.08, 0.45, 0.4, MAT.woodDark); leg.position.set(0, 0.22, s2); bench.add(leg); }
      at(bench, u, 0, 0.9);
      g.add(shadow(bench));
    }
  }

  // ---------- 겨자씨 (마 13:31-32) ----------
  {
    const zn = P.mustard;
    const g = zoneGroup(scene, zn);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a6e55, 1));
    mound.scale.y = 0.25;
    g.add(mound);
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M(0xe0b94a, 0.4, { emissive: 0xffc860, emissiveIntensity: 0.8 }));
    seed.position.y = 0.36;
    g.add(seed);
    const seedGlow = fxSprite('light_01', 0xffe2a0, 0.9);
    seedGlow.position.y = 0.4;
    g.add(seedGlow);
    // 자라날 나무: 줄기·가지·잎 덩어리
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 3.2, 8), MAT.woodDark);
    trunk.position.y = 1.6;
    tree.add(trunk);
    const perches = [];
    const crownGeo = new THREE.IcosahedronGeometry(1, 1);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 2.2, 6), MAT.woodDark);
      br.position.set(Math.cos(a) * 0.7, 3.4, Math.sin(a) * 0.7);
      br.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8);
      tree.add(br);
      const cr = new THREE.Mesh(crownGeo, k % 2 ? MAT.leaf : MAT.leafDark);
      cr.position.set(Math.cos(a) * 1.7, 4.6 + (k % 3) * 0.3, Math.sin(a) * 1.7);
      cr.scale.set(1.5, 1.1, 1.5);
      tree.add(cr);
      perches.push(new THREE.Vector3(Math.cos(a) * 1.3, 4.25, Math.sin(a) * 1.3));
    }
    const top = new THREE.Mesh(crownGeo, MAT.leaf);
    top.position.y = 5.6; top.scale.set(2, 1.4, 2);
    tree.add(top);
    tree.scale.setScalar(0.001);
    tree.visible = false;
    g.add(shadow(tree));
    // 새 네 마리
    const birds = [];
    for (let k = 0; k < 4; k++) { const b = makeBird(k); b.visible = false; g.add(b); birds.push(b); }
    let growT = -1;
    const spot = () => zn.at(0, -1.7);
    actions.plant = () => go(spot, () => { faceTo(me, zn); act('plant', 1.6); growT = 0; sfx('orb', 0.2); camShot(zn, { dist: 12, el: 0.25, side: 0.6, dur: 16, mid: 0.7, y: 2.6 }); });
    avail.push(() => (dist(zn) < 3.5 && growT < 0 ? 'plant' : null));
    tapTo([mound, seed], spot, () => { if (growT < 0) actions.plant(); });
    steps.push((dt, t) => {
      seedGlow.material.opacity = growT < 0 ? 0.6 + Math.sin(t * 2) * 0.3 : 0;
      seed.visible = growT < 0;
      if (growT < 0) return;
      growT += dt;
      const k = ease((growT - 1.2) / 9);
      tree.visible = growT > 1.2;
      tree.scale.setScalar(Math.max(0.001, k));
      tree.rotation.y = growT * 0.03;
      if (growT > 1.2 && Math.floor(growT * 3) !== Math.floor((growT - dt) * 3) && growT < 10) sfx('impact/impactWood_light_000', 0.05, 0.6 + k);
      // 다 자라면 새가 날아와 가지에 깃들임
      birds.forEach((b, i) => {
        const tb = growT - 10.5 - i * 0.8;
        b.visible = tb > 0 && growT < 175;
        if (!b.visible) return;
        const perch = perches[i * 1 + 1].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), tree.rotation.y);
        const from = new THREE.Vector3(Math.cos(i * 1.7) * 18, 12, Math.sin(i * 1.7) * 18);
        const f = ease(tb / 3.5);
        b.position.lerpVectors(from, perch, f);
        b.position.y += Math.sin(f * Math.PI) * 2;
        b.rotation.y = Math.atan2(perch.x - from.x, perch.z - from.z);
        b.userData.flap = f < 1 ? 1 : 0.1;
        flapBird(b, t);
        if (f < 1 && Math.random() < dt * 1.5) audio.chirp((Math.random() - 0.5), 0.04);
      });
      if (growT > 13 && growT - dt <= 13) showVerse('mustard');
      // 3분 뒤 다시 씨앗으로
      if (growT > 180) { growT = -1; tree.visible = false; birds.forEach((b) => { b.visible = false; }); }
      else if (growT > 175) tree.scale.setScalar(Math.max(0.001, 1 - ease((growT - 175) / 5)));
    });
  }

  // ---------- 씨 뿌리는 비유의 밭 (마 13:3-23) ----------
  {
    const zn = P.sower;
    const g = zoneGroup(scene, zn);
    const furM = M(0x4d3828, 1);
    const STRIPS = [
      { v: -2.6, mat: M(0xcfc3ad, 1), kind: 'path' },
      { v: -0.9, mat: M(0x9c8770, 1), kind: 'rock' },
      { v: 0.8, mat: M(0x8a6e55, 1), kind: 'thorn' },
      { v: 2.6, mat: M(0x5e4532, 1), kind: 'good' },
    ];
    let s = 9;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const thorns = [];
    for (const st of STRIPS) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 11), st.mat);
      f.position.set(st.v, 0.04, 0);
      f.receiveShadow = true;
      g.add(f);
      if (st.kind === 'rock') for (let k = 0; k < 16; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rnd() * 0.15, 0), MAT.stone); at(r, -5.2 + rnd() * 10.4, 0.12, st.v + (rnd() - 0.5) * 1.2); g.add(r); }
      if (st.kind === 'thorn') for (let k = 0; k < 10; k++) {
        const th = new THREE.Group();
        for (let j = 0; j < 5; j++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 4), M(0x4c5a33)); sp.rotation.set((rnd() - 0.5) * 1.6, 0, (rnd() - 0.5) * 1.6); sp.position.y = 0.2; th.add(sp); }
        at(th, -5 + k * 1.1 + rnd() * 0.3, 0.1, st.v + (rnd() - 0.5) * 0.9);
        g.add(th); thorns.push(th);
      }
      if (st.kind === 'good') for (let k = -5; k <= 5; k += 0.5) { const fur = box(0.08, 0.04, 1.3, furM); at(fur, k, 0.11, st.v); g.add(fur); }
    }
    // 새싹·이삭 (미리 만들어 두고 숨김)
    const sproutGeo = new THREE.ConeGeometry(0.035, 0.3, 4);
    const headGeo = new THREE.CapsuleGeometry(0.035, 0.12, 2, 5);
    const sprouts = [];
    const green = M(0x6aa84f), brown = M(0x8a7350), gold = M(0xd9b44a, 0.6);
    for (const st of STRIPS) {
      if (st.kind === 'path') continue;
      const n = st.kind === 'good' ? 54 : 14;
      for (let k = 0; k < n; k++) {
        const sp = new THREE.Group();
        const stem = new THREE.Mesh(sproutGeo, green);
        stem.position.y = 0.15;
        sp.add(stem);
        let head = null;
        if (st.kind === 'good') { head = new THREE.Mesh(headGeo, gold); head.position.y = 0.36; head.visible = false; sp.add(head); }
        // 좋은 땅은 세 구간: 삼십 배·육십 배·백 배 (점점 빽빽)
        let u;
        if (st.kind === 'good') { const zoneK = k < 9 ? 0 : k < 27 ? 1 : 2; u = -5.2 + zoneK * 3.6 + rnd() * 3.4; }
        else u = -5.2 + rnd() * 10.4;
        at(sp, u, 0.1, st.v + (rnd() - 0.5) * 1.1);
        sp.visible = false;
        g.add(sp);
        sprouts.push({ sp, stem, head, kind: st.kind, delay: rnd() * 1.5 });
      }
    }
    // 뿌린 씨(작은 점)와 씨를 먹는 새
    const seeds = [];
    const seedGeo = new THREE.SphereGeometry(0.03, 4, 3);
    const seedMat = M(0xe9d38f);
    for (let k = 0; k < 40; k++) { const sd = new THREE.Mesh(seedGeo, seedMat); sd.visible = false; g.add(sd); seeds.push({ sd }); }
    seeds.forEach((sd, k) => { sd.to = new THREE.Vector3(STRIPS[k % 4].v + (rnd() - 0.5) * 1.1, 0.13, -5 + rnd() * 10); sd.kind = STRIPS[k % 4].kind; sd.delay = rnd() * 2.2; });
    const birds = [];
    for (let k = 0; k < 3; k++) { const b = makeBird(k + 4); b.visible = false; g.add(b); birds.push(b); }
    shadow(g, false);
    let T = -1;
    const spot = () => zn.at(-6.6, -3.6);
    mergeStatic(g);
    actions.sow = () => go(spot, () => { faceTo(me, zn.at(0, 0)); act('sow', 3); T = 0; camShot(zn.at(0, 0), { dist: 13, el: 0.55, side: 0.5, dur: 14, mid: 0.6 }); });
    avail.push(() => (near(zn, 2) && T < 0 ? 'sow' : null));
    steps.push((dt, t) => {
      if (T < 0) return;
      T += dt;
      const hand = g.worldToLocal(new THREE.Vector3(me.x, me.y + 1.0, me.z));
      for (const sd of seeds) {
        const k = (T - sd.delay) / 0.9;
        sd.sd.visible = k > 0 && !(sd.kind === 'path' && T > 7.5);
        if (k <= 0) continue;
        const f = Math.min(1, k);
        sd.sd.position.lerpVectors(hand, sd.to, f);
        sd.sd.position.y += Math.sin(f * Math.PI) * 1.2;
        if (sd.kind !== 'path' && T > 4.5) sd.sd.visible = false; // 땅에 묻힘
      }
      // 길가: 새들이 와서 먹어 버림 (마 13:4)
      birds.forEach((b, i) => {
        const tb = T - 3.6 - i * 0.4;
        b.visible = tb > 0 && tb < 6.5;
        if (!b.visible) return;
        const land = new THREE.Vector3(STRIPS[0].v + (i - 1) * 0.3, 0.15, -2 + i * 2);
        const sky = new THREE.Vector3(-8, 7, -8 + i * 5), away = new THREE.Vector3(10, 8, 6 - i * 4);
        if (tb < 2) b.position.lerpVectors(sky, land, ease(tb / 2));
        else if (tb < 4) { b.position.copy(land); b.position.y += Math.abs(Math.sin(tb * 10)) * 0.03; }
        else b.position.lerpVectors(land, away, ease((tb - 4) / 2.5));
        const dir = tb < 2 ? land.clone().sub(sky) : away.clone().sub(land);
        b.rotation.y = Math.atan2(dir.x, dir.z);
        b.userData.flap = tb < 2 || tb > 4 ? 1 : 0.05;
        flapBird(b, t);
        if (tb > 2 && tb < 2.05) audio.chirp(0, 0.05);
      });
      for (const o of sprouts) {
        const tt = T - 4.5 - o.delay;
        o.sp.visible = tt > 0 && T < 44;
        if (!o.sp.visible) continue;
        if (o.kind === 'rock') {
          // 돌밭: 곧 싹이 나나 해가 돋은 후 말라 버림 (마 13:5-6)
          const up = ease(tt / 1.5), wither = ease((tt - 2.5) / 2.5);
          o.sp.scale.set(1, Math.max(0.05, up * (1 - wither * 0.7)), 1);
          o.stem.material = wither > 0.3 ? brown : green;
          o.sp.rotation.z = wither * 0.9;
        } else if (o.kind === 'thorn') {
          // 가시떨기: 가시가 자라 기운을 막음 (마 13:7)
          o.sp.scale.set(1, Math.min(0.55, ease(tt / 2)), 1);
          o.stem.material = tt > 4 ? brown : green;
        } else {
          // 좋은 땅: 자라서 이삭이 맺힘 (마 13:8)
          const k = ease(tt / 7);
          o.sp.scale.set(1, 0.1 + k * 2.4, 1);
          o.head.visible = k > 0.75;
          o.stem.material = k > 0.95 ? gold : green;
          o.sp.rotation.z = Math.sin(t * 1.4 + o.delay * 5) * 0.06;
        }
      }
      for (const th of thorns) th.scale.setScalar(1 + ease((T - 6) / 3) * 0.6 - ease((T - 42) / 2) * 0.6);
      if (T > 13 && T - dt <= 13) showVerse('sower');
      if (T > 45) { T = -1; for (const o of sprouts) o.sp.visible = false; for (const sd of seeds) sd.sd.visible = false; }
    });
  }

  // ---------- 양 우리와 잃은 양 (눅 15:4-6) ----------
  {
    const zn = P.fold;
    const g = zoneGroup(scene, zn);
    const posts = 28;
    for (let k = 0; k < posts; k++) {
      const a = (k / posts) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.35) continue;
      const post = box(0.1, 0.9, 0.1, MAT.wood);
      at(post, Math.sin(a) * 4.2, 0.45, Math.cos(a) * 4.2);
      g.add(post);
      const a2 = ((k + 1) / posts) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a2 - Math.PI), Math.cos(a2 - Math.PI))) < 0.35) continue;
      for (const y of [0.4, 0.75]) {
        const rail = box(0.95, 0.06, 0.05, MAT.wood);
        at(rail, Math.sin((a + a2) / 2) * 4.15, y, Math.cos((a + a2) / 2) * 4.15);
        rail.rotation.y = (a + a2) / 2 + Math.PI / 2 - Math.PI / 2;
        rail.rotation.y = -(a + a2) / 2;
        g.add(rail);
      }
    }
    mergeStatic(shadow(g));
    // 우리 안 양들
    const flock = [];
    for (let k = 0; k < 8; k++) {
      const sh = makeSheep();
      const a = k * 0.8, r = 1 + (k % 3);
      sh.position.set(zn.x + Math.cos(a) * r, G0, zn.z + Math.sin(a) * r);
      scene.add(sh);
      flock.push({ o: sh, tgt: null, wait: Math.random() * 3 });
    }
    // 잃은 양 한 마리: 정원 어딘가 덤불 옆, 가까이 가면 따라옴
    const lost = { o: makeSheep(), state: 'lost', t: 0 };
    scene.add(lost.o);
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), MAT.leafDark);
    bush.scale.set(1.2, 0.75, 1);
    scene.add(shadow(bush));
    function hideSheep() {
      // 테마파크 빈 곳 중 우리에서 먼 곳
      for (let k = 0; k < 200; k++) {
        const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 31;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (!parkClear(x, z, 2) || !isFree(x, z) || Math.hypot(x - zn.x, z - zn.z) < 25) continue;
        lost.o.position.set(x, G0, z);
        bush.position.set(x + 0.9, G0 + 0.3, z + 0.4);
        bush.visible = true;
        lost.state = 'lost';
        return;
      }
    }
    hideSheep();
    // 양을 누르면 양·목자 말씀 한 구절, 우리 곁에 가면 한 구절
    const tapSheep = (o) => o.traverse((c) => { if (c.isMesh) { c.userData.onTap = () => { sfx('impact/impactBell_heavy_000', 0.12, 2.6); showNext('shepherd', 0.2); }; interactive.push(c); } });
    flock.forEach((f) => tapSheep(f.o));
    tapSheep(lost.o);
    let bellT = 0, nearFold = false, foldT = -99;
    steps.push((dt, t) => {
      const inFold = dist(zn) < 7.5;
      if (inFold && !nearFold && t - foldT > 45) { foldT = t; showNext('shepherd', 1); }
      nearFold = inFold;
      for (const f of flock) wander(f, zn, 3.3, dt, t);
      const L = lost.o.position;
      if (lost.state === 'lost') {
        // 방울 소리: 가까울수록 크게
        const d = dist({ x: L.x, z: L.z });
        bellT -= dt;
        if (d < 16 && bellT < 0) { hit('impactBell_heavy_000', 0.18 * (1 - d / 16), 2.8); bellT = 2.2; }
        lost.o.rotation.y = Math.sin(t * 0.7) * 0.6;
        legWalk(lost.o, t, 0);
        if (d < 1.8) { lost.state = 'follow'; sfx('orb', 0.2); }
      } else if (lost.state === 'follow') {
        // 목자를 졸졸 따라옴
        const bx = me.x - Math.sin(me.face) * 1.1, bz = me.z - Math.cos(me.face) * 1.1;
        const dx = bx - L.x, dz = bz - L.z, d = Math.hypot(dx, dz);
        const sp = Math.min(d * 3, 7) * dt;
        if (d > 0.05) { L.x += (dx / d) * sp; L.z += (dz / d) * sp; lost.o.rotation.y = Math.atan2(dx, dz); }
        L.y = G0;
        legWalk(lost.o, t, d > 0.2 ? 1 : 0);
        bush.visible = false;
        if (Math.hypot(L.x - zn.x, L.z - zn.z) < 3.6) {
          lost.state = 'home'; lost.t = 0;
          burst(L.x, L.y + 0.8, L.z); sfx('share', 0.3);
          showVerse('sheep', { delay: 0.6, cooldown: 30 });
          flock.push({ o: lost.o, tgt: null, wait: 2 });
        }
      } else if (lost.state === 'home') {
        lost.t += dt;
        // 1분 뒤에 다른 양 한 마리가 또 길을 잃음
        if (lost.t > 60 && Math.hypot(me.x - zn.x, me.z - zn.z) > 14) {
          const i = flock.findIndex((f) => f.o === lost.o);
          if (i >= 0) flock.splice(i, 1);
          hideSheep();
        }
      }
    });
  }

  // ---------- 수영장 (요 9:7 실로암) ----------
  {
    const zn = P.pool;
    const g = zoneGroup(scene, zn);
    // 둘레 바닥(가운데가 뚫린 판)
    const deck = new THREE.Shape();
    deck.moveTo(-5.2, -8); deck.lineTo(5.2, -8); deck.lineTo(5.2, 8); deck.lineTo(-5.2, 8); deck.lineTo(-5.2, -8);
    const hole = new THREE.Path();
    hole.moveTo(-POOL.d / 2, -POOL.w / 2); hole.lineTo(-POOL.d / 2, POOL.w / 2); hole.lineTo(POOL.d / 2, POOL.w / 2); hole.lineTo(POOL.d / 2, -POOL.w / 2); hole.lineTo(-POOL.d / 2, -POOL.w / 2);
    deck.holes.push(hole);
    const deckM = new THREE.Mesh(new THREE.ShapeGeometry(deck), M(0xf1ece2, 0.7));
    deckM.rotation.x = -Math.PI / 2; deckM.position.y = 0.02; deckM.receiveShadow = true;
    g.add(deckM);
    const tile = M(0x9fd3e6, 0.4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(POOL.d, POOL.w), tile);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -POOL.depth; g.add(floor);
    for (const s of [-1, 1]) {
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(POOL.d, POOL.depth + 0.02), tile); w1.position.set(0, -POOL.depth / 2, s * POOL.w / 2); w1.rotation.y = s > 0 ? Math.PI : 0; g.add(w1);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(POOL.w, POOL.depth + 0.02), tile); w2.position.set(s * POOL.d / 2, -POOL.depth / 2, 0); w2.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(w2);
    }
    // 물결 무늬 물
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cx = cv.getContext('2d');
    cx.fillStyle = '#5fb6d6'; cx.fillRect(0, 0, 128, 128);
    cx.strokeStyle = 'rgba(255,255,255,0.35)'; cx.lineWidth = 2;
    for (let k = 0; k < 18; k++) { cx.beginPath(); const x = Math.random() * 128, y = Math.random() * 128; cx.ellipse(x, y, 10 + Math.random() * 14, 4 + Math.random() * 5, Math.random(), 0, Math.PI * 2); cx.stroke(); }
    const wt = new THREE.CanvasTexture(cv); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 6); wt.colorSpace = THREE.SRGBColorSpace;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(POOL.d, POOL.w), new THREE.MeshStandardMaterial({ map: wt, transparent: true, opacity: 0.72, roughness: 0.1, metalness: 0.1 }));
    water.rotation.x = -Math.PI / 2; water.position.y = POOL.water - G0;
    g.add(water);
    // 선베드 두 개, 파라솔
    for (const u of [-3, 3]) {
      const lb = new THREE.Group();
      // 긴 쪽은 바깥(v) 방향, 등받이는 바깥 끝에서 비스듬히 (layout SUNBEDS 자리와 맞춤)
      const bed = box(0.7, 0.08, 1.8, M(0xffffff, 0.6)); bed.position.y = 0.3; lb.add(bed);
      const back = box(0.7, 0.08, 0.7, M(0xffffff, 0.6)); back.position.set(0.72, 0.52, 0); back.rotation.z = 0.7; lb.add(back);
      for (const x of [-0.8, 0.8]) for (const z of [-0.3, 0.3]) { const leg = box(0.05, 0.28, 0.05, MAT.white); leg.position.set(x, 0.13, z); lb.add(leg); }
      at(lb, u, 0, 4.2);
      g.add(shadow(lb));
    }
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 8), M(0xe9b7a0, 0.7)); at(um, 0, 2.3, 4.3); g.add(um);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), MAT.white); at(pole, 0, 1.15, 4.3); g.add(pole);
    shadow(g);
    // 물결 고리
    const ripples = [];
    for (let k = 0; k < 6; k++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      r.rotation.x = -Math.PI / 2; r.visible = false; scene.add(r); ripples.push({ r, t: 1 });
    }
    let rk = 0;
    const ripple = (x, z) => { const o = ripples[rk++ % ripples.length]; o.t = 0; o.r.position.set(x, POOL.water + 0.01, z); o.r.visible = true; };
    let wasIn = false, strokeT = 0;
    steps.push((dt, t) => {
      wt.offset.set(t * 0.02, t * 0.035);
      const d = poolDepth(me.x, me.z);
      const inside = d > 0.25;
      me.swim = inside && me.state !== 'sit';
      me.swimY = inside ? -Math.min(0.32, d * 0.45) + Math.sin(t * 2.5) * 0.02 : 0;
      if (inside && !wasIn) { audio.splash(0.3); ripple(me.x, me.z); showVerse('pool', { delay: 1.5, cooldown: 120 }); }
      if (!inside && wasIn) audio.splash(0.12);
      wasIn = inside;
      if (inside) {
        strokeT -= dt;
        if (strokeT < 0) { strokeT = me.state === 'walk' ? 0.55 : 1.6; ripple(me.x, me.z); if (me.state === 'walk') audio.splash(0.07); }
      }
      for (const o of ripples) {
        if (o.t >= 1) continue;
        o.t += dt / 1.2;
        o.r.scale.setScalar(1 + o.t * 4);
        o.r.material.opacity = (1 - o.t) * 0.6;
        if (o.t >= 1) o.r.visible = false;
      }
    });
  }

  // ---------- 캠핑장: 텐트와 모닥불 (요 21:9) ----------
  const fireAt = P.camp.at(0, -1.2);
  {
    const zn = P.camp;
    const face = Math.atan2(-zn.n.x, -zn.n.z);
    [-3, 0, 3].forEach((u, k) => {
      const p = zn.at(u, 2.8);
      place(scene, 'assets/camp/' + (k === 1 ? 'tent' : 'tent-canvas') + '.glb', { x: p.x, z: p.z, y: G0, rot: face + (u * 0.08), width: 2.4 });
    });
    const bp = zn.at(-4.6, 1); place(scene, 'assets/camp/bedroll.glb', { x: bp.x, z: bp.z, y: G0, rot: face + 0.4, width: 1.6 });
    const cp = zn.at(4.8, 0.8); place(scene, 'assets/camp/chest.glb', { x: cp.x, z: cp.z, y: G0, rot: face, width: 0.8 });
    place(scene, 'assets/camp/campfire-pit.glb', { x: fireAt.x, z: fireAt.z, y: G0, width: 1.3 });
    // 불꽃 (원뿔 세 겹이 일렁임) + 따뜻한 빛 + 불티
    const fire = new THREE.Group();
    fire.position.set(fireAt.x, G0 + 0.12, fireAt.z);
    const flames = [0xffb347, 0xff7a2f, 0xffe08a].map((c, k) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.28 - k * 0.07, 0.9 - k * 0.2, 7), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      f.position.y = 0.4 - k * 0.08;
      fire.add(f);
      return f;
    });
    const fl = new THREE.PointLight(0xff9a4a, 6, 9, 1.6);
    fl.position.y = 0.8;
    fire.add(fl);
    scene.add(fire);
    const sparks = [];
    for (let k = 0; k < 8; k++) { const sp = fxSprite('star_06', 0xffb060, 0.12); sp.position.copy(fire.position); scene.add(sp); sparks.push({ sp, t: Math.random() }); }
    // 통나무 의자 세 개 (모닥불을 둘러쌈)
    for (const a of [-50, 0, 50]) {
      const ang = deg(a) + Math.atan2(-zn.n.z, -zn.n.x);
      const lx = fireAt.x + Math.cos(ang) * 1.7, lz = fireAt.z + Math.sin(ang) * 1.7;
      const seatObj = { x: lx, z: lz, kind: 'log' };
      place(scene, 'assets/camp/tree-log.glb', { x: lx, z: lz, y: G0, rot: Math.atan2(fireAt.x - lx, fireAt.z - lz), height: 0.36 });
      void seatObj;
    }
    let crackT = 0;
    const fireLoop = { v: null };
    steps.push((dt, t) => {
      flames.forEach((f, k) => { f.scale.set(1 + Math.sin(t * 9 + k) * 0.1, 1 + Math.sin(t * 13 + k * 2) * 0.18, 1 + Math.cos(t * 8 + k) * 0.1); f.rotation.y = t * (k + 1) * 0.6; });
      fl.intensity = 5 + Math.sin(t * 17) * 0.8 + Math.sin(t * 7) * 0.6;
      for (const s of sparks) {
        s.t += dt * 0.5;
        if (s.t > 1) { s.t = 0; s.sp.position.set(fire.position.x + (Math.random() - 0.5) * 0.3, fire.position.y + 0.3, fire.position.z + (Math.random() - 0.5) * 0.3); }
        s.sp.position.y += dt * 1.1; s.sp.position.x += Math.sin(t * 3 + s.t * 9) * dt * 0.2;
        s.sp.material.opacity = 1 - s.t;
      }
      // 타닥타닥 소리와 불 소리
      const d = dist(fireAt);
      const v = Math.max(0, 1 - d / 12);
      if (!fireLoop.v && v > 0) fireLoop.v = audio.loop('lowpass', 500);
      if (fireLoop.v) fireLoop.v.set(v * 0.25);
      crackT -= dt;
      if (v > 0 && crackT < 0) { audio.crack(0.25 * v); crackT = 0.05 + Math.random() * 0.35; }
      // 불가에 앉으면 말씀
      if (me.state === 'sit' && d < 2.6) showVerse('campfire', { delay: 2.2, cooldown: 120 });
    });
  }

  // ---------- 바비큐: 화로에 생선 굽기 (요 21:12-13) ----------
  {
    const zn = P.bbq;
    const g = zoneGroup(scene, zn);
    // 화로
    const grill = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.35, 16, 1, true), M(0x2b2b2b, 0.5, { side: THREE.DoubleSide }));
    bowl.position.y = 0.8;
    const coal = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14), M(0x7a2a10, 0.8, { emissive: 0xff5a1a, emissiveIntensity: 0.6 }));
    coal.rotation.x = -Math.PI / 2; coal.position.y = 0.85;
    const grate = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.015, 4, 20), M(0x9a9a9a, 0.4, { metalness: 0.6 }));
    grate.rotation.x = Math.PI / 2; grate.position.y = 0.98;
    grill.add(bowl, coal, grate);
    for (let k = -4; k <= 4; k++) { const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.95 * Math.sqrt(1 - (k / 4.6) ** 2), 4), grate.material); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.98, k * 0.1); grill.add(bar); }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5), M(0x2b2b2b)); leg.position.set(Math.cos(a) * 0.35, 0.4, Math.sin(a) * 0.35); leg.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); grill.add(leg); }
    at(grill, -2, 0, 0.5);
    g.add(shadow(grill));
    const fishOn = new THREE.Group(); fishOn.visible = false; fishOn.position.set(0, 1.02, 0); grill.add(fishOn);
    place(scene, 'assets/camp/fish.glb', { x: 0, z: 0, y: 0, width: 0.4, parent: fishOn, shadow: false });
    // 피크닉 탁자 두 개
    for (const u of [1.5, 3.4]) {
      const tb = new THREE.Group();
      const top = box(0.85, 0.06, 1.7, MAT.wood); top.position.y = 0.75; tb.add(top);
      for (const s of [-1, 1]) {
        const bench = box(0.3, 0.05, 1.7, MAT.wood); bench.position.set(0, 0.45, s * 0.65); tb.add(bench);
        for (const e of [-0.7, 0.7]) {
          const leg = box(0.06, 0.75, 0.06, MAT.woodDark); leg.position.set(e, 0.37, s * 0.3); tb.add(leg);
          const bl = box(0.06, 0.45, 0.06, MAT.woodDark); bl.position.set(e, 0.22, s * 0.65); tb.add(bl);
        }
      }
      tb.rotation.y = 0;
      at(tb, u, 0, 1.2);
      tb.rotation.y = Math.PI / 2;
      g.add(shadow(tb));
    }
    const smoke = [];
    for (let k = 0; k < 10; k++) { const sp = fxSprite('circle_05', 0xd8d4cc, 0.5); sp.material.blending = THREE.NormalBlending; sp.material.opacity = 0; scene.add(sp); smoke.push({ sp, t: k / 10 }); }
    const gp = () => { const w = new THREE.Vector3(); grill.getWorldPosition(w); return w; };
    let T = -1, sizzle = null;
    const spot = () => P.bbq.at(-2, -0.7);
    actions.grill = () => go(spot, () => { faceTo(me, gp()); act('grill', 4); T = 0; fishOn.visible = true; camShot(gp(), { dist: 6, el: 0.45, side: 0.8, dur: 6 }); sizzle = sizzle || audio.loop('highpass', 3000); });
    avail.push(() => (dist(gp()) < 2.6 && T < 0 && !me.food ? 'grill' : null));
    tapTo([grill], spot, () => { if (T < 0 && !me.food) actions.grill(); });
    steps.push((dt, t) => {
      coal.material.emissiveIntensity = 0.5 + Math.sin(t * 5) * 0.15 + (T >= 0 ? 0.4 : 0);
      const w = gp();
      for (const s of smoke) {
        s.t += dt * 0.35;
        if (s.t > 1) s.t -= 1;
        s.sp.position.set(w.x + Math.sin(s.t * 7) * 0.15, w.y + 1.0 + s.t * 2.2, w.z + Math.cos(s.t * 5) * 0.15);
        s.sp.scale.setScalar(0.3 + s.t * 1.2);
        s.sp.material.opacity = (T >= 0 ? 0.45 : 0.12) * (1 - s.t);
      }
      if (sizzle) sizzle.set(T >= 0 ? 0.12 : 0);
      if (T < 0) return;
      T += dt;
      fishOn.rotation.y = T > 2 ? Math.PI : 0;
      if (T > 2 && T - dt <= 2) hit('impactPlate_light_000', 0.15, 1.3);
      if (T > 4) { T = -1; fishOn.visible = false; me.food = 'fish'; me.bites = 0; sfx('cup', 0.15); showVerse('bbq', { delay: 0.6, cooldown: 60 }); }
    });
  }

  // ---------- 노아의 방주와 무지개 (창 9:13), 짝지어 들어가는 동물들 ----------
  {
    const zn = P.ark;
    const g = zoneGroup(scene, zn);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
    const c2 = cv.getContext('2d');
    for (let y = 0; y < 256; y += 16) { c2.fillStyle = y % 32 ? '#9a6b45' : '#8d6140'; c2.fillRect(0, y, 64, 16); c2.fillStyle = 'rgba(40,25,10,0.35)'; c2.fillRect(0, y + 15, 64, 1); }
    const plank = new THREE.CanvasTexture(cv); plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.colorSpace = THREE.SRGBColorSpace;
    const woodM = new THREE.MeshStandardMaterial({ map: plank, roughness: 0.9 });
    // 옆모습: 바닥이 둥글게 올라가는 커다란 배
    const prof = new THREE.Shape();
    prof.moveTo(-8.5, 3.4); prof.lineTo(8.5, 3.4); prof.quadraticCurveTo(8, 0.9, 5.5, 0.5); prof.lineTo(-5.5, 0.5); prof.quadraticCurveTo(-8, 0.9, -8.5, 3.4);
    const hullGeo = new THREE.ExtrudeGeometry(prof, { depth: 5, bevelEnabled: false });
    hullGeo.translate(0, 0, -2.5);
    const uvs = hullGeo.attributes.uv, pos = hullGeo.attributes.position;
    for (let i = 0; i < uvs.count; i++) uvs.setXY(i, (pos.getX(i) + pos.getZ(i)) / 4, pos.getY(i) / 4);
    const hull = new THREE.Mesh(hullGeo, woodM);
    hull.rotation.y = Math.PI / 2; // 길이 방향을 둘레(u) 방향으로
    at(hull, 0, 0, 1);
    g.add(hull);
    const house = box(10, 2, 3.6, woodM); at(house, 0, 4.4, 1); g.add(house);
    const tri = new THREE.Shape(); tri.moveTo(-2.2, 0); tri.lineTo(2.2, 0); tri.lineTo(0, 1.3); tri.lineTo(-2.2, 0);
    const roofGeo = new THREE.ExtrudeGeometry(tri, { depth: 10.6, bevelEnabled: false }); roofGeo.translate(0, 0, -5.3);
    const roof = new THREE.Mesh(roofGeo, M(0x6e4b33)); at(roof, 0, 5.4, 1);
    g.add(roof);
    for (let u = -4; u <= 4; u += 2) { const win = box(0.6, 0.45, 0.05, M(0x3a2a1c)); at(win, u, 4.6, -0.82); g.add(win); }
    // 경사로(문)
    const door = box(1.6, 1.8, 0.1, M(0x5a3d29)); at(door, 0, 2.2, -1.55); g.add(door);
    const ramp = box(1.6, 0.12, 4.25, woodM); at(ramp, 0, 0.65, -3.6); ramp.rotation.z = 0.31; g.add(ramp);
    for (const u of [-6, -3, 3, 6]) { const st = box(0.5, 0.6, 3.5, MAT.stone); at(st, u, 0.3, 1); g.add(st); }
    shadow(g);
    // 비와 무지개
    const rainN = 600;
    const rainGeo = new THREE.BufferGeometry();
    const rp = new Float32Array(rainN * 6);
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xbfd6e6, transparent: true, opacity: 0.6 }));
    rain.visible = false; rain.frustumCulled = false;
    scene.add(rain);
    const drops = [];
    for (let k = 0; k < rainN; k++) drops.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 14, z: (Math.random() - 0.5) * 30 });
    const bow = new THREE.Group();
    const COLORS = [0xff4b4b, 0xff9d3b, 0xffe14b, 0x5fd16b, 0x4bb6ff, 0x5a5ae6, 0xa06be0];
    COLORS.forEach((c, k) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(16 - k * 0.55, 0.28, 6, 60, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      bow.add(arc);
    });
    bow.position.set(zn.x + zn.n.x * 6, G0 - 2, zn.z + zn.n.z * 6);
    bow.rotation.y = zn.rot + Math.PI / 2;
    bow.visible = false;
    scene.add(bow);
    let T = -1, rainLoop = null;
    const spot = () => zn.at(0, -6.5);
    actions.rainbow = () => go(spot, () => { faceTo(me, zn); act('gaze', 4); T = 0; camShot(zn, { dist: 26, el: 0.28, side: 0.45, dur: 16, mid: 0.4, y: 4 }); rainLoop = rainLoop || audio.loop('bandpass', 2500, 0.4); });
    avail.push(() => (near(zn, 4) && T < 0 ? 'rainbow' : null));
    tapTo([hull, house], spot, () => { if (T < 0) actions.rainbow(); }, 6);
    steps.push((dt) => {
      if (T < 0) return;
      T += dt;
      const raining = T < 4.5;
      rain.visible = raining;
      if (rainLoop) rainLoop.set(raining ? 0.35 * Math.min(1, T * 2) : 0);
      if (raining) {
        for (let k = 0; k < rainN; k++) {
          const d = drops[k];
          d.y -= dt * 16;
          if (d.y < 0) d.y += 14;
          const x = zn.x + d.x, z = zn.z + d.z, y = G0 + d.y;
          rp.set([x, y, z, x, y + 0.45, z], k * 6);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      bow.visible = T > 4;
      const op = ease((T - 4) / 3) * (1 - ease((T - 34) / 4)) * 0.55;
      bow.children.forEach((a) => { a.material.opacity = op; });
      if (T > 6 && T - dt <= 6) showVerse('ark');
      if (T > 38) { T = -1; bow.visible = false; }
    });
    // 짝지어 줄 선 동물들: 천천히 걸어 경사로로 올라가 배 안으로
    const KINDS = ['elephant', 'giraffe', 'lion', 'cow', 'pig', 'bunny', 'penguin', 'panda', 'deer', 'monkey'];
    const parade = [];
    KINDS.forEach((k, i) => {
      for (const side of [-0.45, 0.45]) {
        loadFresh('assets/pets/animal-' + k + '.glb').then((gl) => {
          if (!gl) return;
          const o = gl.scene;
          const bb = new THREE.Box3().setFromObject(o);
          const h = k === 'giraffe' ? 1.3 : k === 'elephant' ? 1.0 : k === 'bunny' || k === 'penguin' ? 0.45 : 0.7;
          o.scale.setScalar(h / (bb.max.y - bb.min.y));
          const holder = new THREE.Group(); holder.add(o); shadow(holder);
          scene.add(holder);
          const mixer = new THREE.AnimationMixer(o);
          const clip = gl.animations.find((a) => a.name === 'walk');
          if (clip) mixer.clipAction(clip).play();
          mixers.push(mixer);
          parade.push({ holder, s: i * 2.2, side });
        });
      }
    });
    // 줄: 방주 앞에서 둘레 방향으로 늘어섰다가 경사로를 오름
    const LEN = KINDS.length * 2.2;
    steps.push((dt) => {
      for (const a of parade) {
        a.s -= dt * 0.45;
        if (a.s < -4.6) a.s += LEN + 4.6;
        let p, y = 0, face;
        if (a.s >= 0) { // 땅 위 두 줄로 서서 방주 쪽으로
          p = zn.at(a.s * 0.85, -6.2 + a.side);
          face = Math.atan2(-zn.t.x, -zn.t.z);
        } else { // 경사로를 올라 문으로
          const k = -a.s / 4.6;
          const v = -6.2 + k * 4.6;
          p = zn.at(a.side, v);
          y = Math.max(0, (v + 5.6) / 4) * 1.3;
          face = Math.atan2(zn.n.x, zn.n.z);
        }
        a.holder.position.set(p.x, G0 + y, p.z);
        a.holder.rotation.y = face;
        a.holder.visible = a.s > -4.3;
      }
    });
  }

  // ---------- 푸른 초장: 노니는 동물들 (창 1:31) ----------
  {
    const zn = P.meadow;
    const herd = [];
    const list = ['cow', 'cow', 'deer', 'deer', 'bunny', 'bunny', 'bunny', 'dog', 'fox', 'cat', 'chick', 'parrot'];
    list.forEach((k, i) => {
      loadFresh('assets/pets/animal-' + k + '.glb').then((gl) => {
        if (!gl) return;
        const o = gl.scene;
        const bb = new THREE.Box3().setFromObject(o);
        const h = k === 'cow' ? 0.85 : k === 'deer' ? 0.9 : k === 'dog' || k === 'fox' ? 0.55 : 0.4;
        o.scale.setScalar(h / (bb.max.y - bb.min.y));
        const holder = new THREE.Group(); holder.add(o); shadow(holder);
        const p = zn.at((Math.random() - 0.5) * zn.w * 0.8, (Math.random() - 0.5) * zn.d * 0.8);
        holder.position.set(p.x, G0, p.z);
        scene.add(holder);
        const mixer = new THREE.AnimationMixer(o);
        const A = Object.fromEntries(gl.animations.map((a) => [a.name, mixer.clipAction(a)]));
        mixers.push(mixer);
        const ent = { o: holder, A, cur: null, tgt: null, wait: Math.random() * 4, speed: k === 'bunny' ? 1.1 : 0.6 };
        const playA = (n, once) => {
          const a = A[n] || A.idle; if (!a || ent.cur === a) return;
          if (ent.cur) ent.cur.fadeOut(0.25);
          a.reset().fadeIn(0.25).play();
          if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; }
          ent.cur = a;
        };
        ent.play = playA;
        playA('idle');
        holder.traverse((c) => { if (c.isMesh) { c.userData.onTap = () => { playA('gesture-positive', true); ent.wait = 2.5; ent.tgt = null; ent.cheer = 2.5; sfx('orb', 0.15); showVerse('creation', { cooldown: 30 }); }; interactive.push(c); } });
        herd.push(ent);
        void i;
      });
    });
    steps.push((dt) => {
      for (const e of herd) {
        if (e.cheer > 0) { e.cheer -= dt; continue; }
        if (!e.tgt) {
          e.wait -= dt;
          if (e.wait < 0) {
            const l = zn.at((Math.random() - 0.5) * zn.w * 0.85, (Math.random() - 0.5) * zn.d * 0.85);
            e.tgt = l; e.play('walk');
          } else if (e.cur !== e.A.eat && Math.random() < dt * 0.2) e.play('eat');
          continue;
        }
        const dx = e.tgt.x - e.o.position.x, dz = e.tgt.z - e.o.position.z, d = Math.hypot(dx, dz);
        if (d < 0.1) { e.tgt = null; e.wait = 2 + Math.random() * 5; e.play('idle'); continue; }
        e.o.position.x += (dx / d) * e.speed * dt; e.o.position.z += (dz / d) * e.speed * dt;
        let da = Math.atan2(dx, dz) - e.o.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
        e.o.rotation.y += da * Math.min(1, dt * 4);
      }
    });
  }

  // ---------- 공놀이 공통: 공 ----------
  function makeBall(r, colorA, colorB) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32;
    const c = cv.getContext('2d');
    c.fillStyle = colorA; c.fillRect(0, 0, 64, 32);
    c.fillStyle = colorB;
    for (let k = 0; k < 6; k++) { c.beginPath(); c.arc((k * 13 + (k % 2) * 6) % 64, k % 2 ? 9 : 23, 4.5, 0, Math.PI * 2); c.fill(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 }));
    m.castShadow = true;
    scene.add(m);
    return { m, r, p: new THREE.Vector3(), v: new THREE.Vector3() };
  }
  function stepBall(b, dt, onBounce) {
    b.v.y -= 9.8 * dt;
    b.p.addScaledVector(b.v, dt);
    const floor = G0 + b.r;
    if (b.p.y < floor) {
      b.p.y = floor;
      if (Math.abs(b.v.y) > 0.8) { onBounce && onBounce(Math.abs(b.v.y)); b.v.y = -b.v.y * 0.55; }
      else b.v.y = 0;
      b.v.x *= 0.9; b.v.z *= 0.9;
    }
    if (b.p.y <= floor + 0.001) { const f = Math.max(0, 1 - dt * 1.2); b.v.x *= f; b.v.z *= f; }
    b.m.position.copy(b.p);
    const sp = Math.hypot(b.v.x, b.v.z);
    if (sp > 0.01) { b.m.rotateOnWorldAxis(new THREE.Vector3(b.v.z, 0, -b.v.x).normalize(), (sp * dt) / b.r); }
  }

  // ---------- 축구장 (고전 9:24) ----------
  {
    const zn = P.soccer;
    const g = zoneGroup(scene, zn);
    g.add(flat(zn.w + 1.6, zn.d + 1.6, M(0x79b85e, 0.95), 0.01));
    for (let k = -5; k < 6; k++) { const st = flat(2, zn.d, M(k % 2 ? 0x84c269 : 0x76b45b, 0.95), 0.011); st.position.z = k * 2; g.add(st); }
    lineRect(g, zn.w, zn.d);
    const mid = box(0.08, 0.005, zn.d, MAT.line); at(mid, 0, 0.02, 0); g.add(mid);
    ringLine(g, 1.8, 0, 0);
    for (const s of [-1, 1]) {
      // 골대: 기둥 둘, 가로대, 그물
      const gl = new THREE.Group();
      for (const v of [-1.3, 1.3]) { const p = box(0.08, 1.2, 0.08, MAT.white); at(p, 0, 0.6, v); gl.add(p); }
      const bar = box(0.08, 0.08, 2.68, MAT.white); at(bar, 0, 1.2, 0); gl.add(bar);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), MAT.net); at(back, s * 0.9, 0.6, 0); gl.add(back);
      const topN = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), MAT.net); topN.rotation.set(-Math.PI / 2, 0, 0); at(topN, s * 0.45, 1.2, 0); gl.add(topN);
      for (const v of [-1.3, 1.3]) { const sideN = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), MAT.net); sideN.rotation.y = Math.PI / 2; at(sideN, s * 0.45, 0.6, v); gl.add(sideN); }
      at(gl, s * zn.w / 2, 0, 0);
      g.add(gl);
      const box1 = new THREE.Group(); lineRect(box1, 3, 5); at(box1, s * (zn.w / 2 - 1.5), 0, 0); g.add(box1);
    }
    shadow(g);
    const ball = makeBall(0.13, '#ffffff', '#222222');
    const home = () => { const p = zn.at(0, 0); ball.p.set(p.x, G0 + 0.13, p.z); ball.v.set(0, 0, 0); };
    home();
    let goalT = -1;
    const ballNear = () => Math.hypot(me.x - ball.p.x, me.z - ball.p.z);
    actions.kick = () => {
      const l = zn.local(ball.p.x, ball.p.z);
      const s = l.u >= 0 ? 1 : -1; // 가까운 골대 쪽으로
      const tgt = zn.at(s * zn.w / 2 + s * 0.5, (Math.random() - 0.5) * 2);
      const dx = tgt.x - ball.p.x, dz = tgt.z - ball.p.z, d = Math.hypot(dx, dz);
      const behind = { x: ball.p.x - (dx / d) * 0.55, z: ball.p.z - (dz / d) * 0.55 };
      go(behind, () => {
        faceTo(me, ball.p); act('kick', 0.7); me.kickT = 0.5; camShot(tgt, { dist: 12, el: 0.4, side: 0.35, dur: 4.5, mid: 0.5 });
        setTimeout(() => {
          if (Math.hypot(me.x - ball.p.x, me.z - ball.p.z) > 1.4) return;
          const pw = Math.min(13, 6 + d * 0.35);
          ball.v.set((dx / d) * pw, 2.2 + Math.random() * 2.2, (dz / d) * pw);
          hit('impactPunch_medium_000', 0.35, 1.1);
        }, 230);
      }, 0.9);
    };
    avail.push(() => (near(zn, 1) && ballNear() < 4 && goalT < 0 ? 'kick' : null));
    tapTo([ball.m], () => ({ x: ball.p.x, z: ball.p.z }), () => actions.kick(), 1.2);
    steps.push((dt) => {
      // 걸어가며 부딪히면 드리블
      if (me.state === 'walk' && ballNear() < 0.45 && ball.p.y < G0 + 0.3) {
        const sp = (me.running ? 6 : 3.2);
        ball.v.x = Math.sin(me.face) * sp; ball.v.z = Math.cos(me.face) * sp;
        if (Math.random() < 0.3) hit('impactSoft_medium_000', 0.1, 1.3);
      }
      stepBall(ball, dt, (vy) => hit('impactSoft_medium_000', Math.min(0.25, vy * 0.05), 1.2));
      const l = zn.local(ball.p.x, ball.p.z);
      // 골!
      if (goalT < 0 && Math.abs(l.u) > zn.w / 2 && Math.abs(l.v) < 1.25 && ball.p.y < G0 + 1.2) {
        goalT = 0;
        const s = Math.sign(l.u);
        const bp = zn.at(s * (zn.w / 2 + 0.6), l.v);
        ball.v.multiplyScalar(0.1); ball.p.x = bp.x; ball.p.z = bp.z;
        hit('impactSoft_heavy_000', 0.3, 0.9);
        burst(bp.x, G0 + 1, bp.z); sfx('share', 0.3);
        showVerse('race', { delay: 0.8, cooldown: 60 });
      }
      if (goalT >= 0) { goalT += dt; if (goalT > 3) { goalT = -1; home(); } }
      // 경기장 밖으로 나가면 튕겨 돌아옴
      const lim = { u: zn.w / 2 + 0.8, v: zn.d / 2 + 0.8 };
      if (goalT < 0 && (Math.abs(l.u) > lim.u || Math.abs(l.v) > lim.v)) {
        const nu = Math.abs(l.u) > lim.u, nv = Math.abs(l.v) > lim.v;
        const vu = ball.v.x * zn.t.x + ball.v.z * zn.t.z, vv = ball.v.x * zn.n.x + ball.v.z * zn.n.z;
        const nu2 = nu && Math.sign(vu) === Math.sign(l.u) ? -vu * 0.5 : vu, nv2 = nv && Math.sign(vv) === Math.sign(l.v) ? -vv * 0.5 : vv;
        ball.v.x = zn.t.x * nu2 + zn.n.x * nv2; ball.v.z = zn.t.z * nu2 + zn.n.z * nv2;
      }
    });
  }

  // ---------- 농구장 (빌 3:14 푯대를 향하여) ----------
  {
    const zn = P.basket;
    const g = zoneGroup(scene, zn);
    g.add(flat(zn.w, zn.d, M(0xc98a5a, 0.8)));
    lineRect(g, zn.w - 0.4, zn.d - 0.4);
    const key = flat(3.6, 3.2, M(0xb06c45, 0.8), 0.016); key.position.z = 4; g.add(key);
    ringLine(g, 4.2, 5.6, 0, 0.02, 0, Math.PI);
    // 골대: 기둥, 백보드, 림, 그물
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.9, 8), M(0x555b63, 0.5)); at(pole, 6, 1.45, 0); g.add(pole);
    const arm = box(0.6, 0.08, 0.08, M(0x555b63, 0.5)); at(arm, 5.7, 2.7, 0); g.add(arm);
    const board = box(0.06, 0.95, 1.5, MAT.white); at(board, 5.42, 2.75, 0); g.add(board);
    const sq = box(0.07, 0.4, 0.55, M(0xd9483b, 0.6)); at(sq, 5.4, 2.55, 0); g.add(sq);
    const RIM_Y = 2.3, RIM_U = 5.05, RIM_R = 0.24;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.018, 6, 20), M(0xe0612f, 0.4)); rim.rotation.x = Math.PI / 2; at(rim, RIM_U, RIM_Y, 0); g.add(rim);
    const net = new THREE.Mesh(new THREE.CylinderGeometry(RIM_R, RIM_R * 0.6, 0.35, 12, 1, true), MAT.net); at(net, RIM_U, RIM_Y - 0.18, 0); g.add(net);
    shadow(g);
    const rimW = zn.at(RIM_U, 0); const rimP = new THREE.Vector3(rimW.x, G0 + RIM_Y, rimW.z);
    const boardU = 5.38;
    const ball = makeBall(0.12, '#d9792f', '#3a2010');
    const rest = zn.at(2.5, 1.5); ball.p.set(rest.x, G0 + 0.12, rest.z);
    let shot = null, swish = 0;
    actions.shoot = () => {
      // 림에서 3~5m 떨어진 곳으로 가서 던짐
      const l = zn.local(me.x, me.z);
      let ang = Math.atan2(l.v, l.u - RIM_U);
      if (Math.abs(ang) < Math.PI / 2) ang = Math.PI - 0.3 * Math.sign(ang || 1);
      const r = 3 + Math.random() * 2;
      const sp = zn.at(RIM_U + Math.cos(ang) * r, Math.sin(ang) * r);
      go(sp, () => {
        faceTo(me, rimP); act('shoot', 1.1); camShot(rimP, { dist: 8, el: 0.2, side: 1.0, dur: 4, mid: 0.5, y: 1.8 });
        ball.v.set(0, 0, 0);
        shot = { t: 0, launched: false, scored: false };
      }, 0.6);
    };
    avail.push(() => (near(zn, 1) && !shot ? 'shoot' : null));
    tapTo([ball.m, board, rim], () => zn.at(1.5, 0), () => actions.shoot(), 5);
    const tmp = new THREE.Vector3();
    steps.push((dt) => {
      if (shot) {
        shot.t += dt;
        if (!shot.launched) {
          // 손 위에 공
          ball.p.set(me.x + Math.sin(me.face) * 0.15, me.y + 1.45 + Math.min(1, shot.t * 2) * 0.15, me.z + Math.cos(me.face) * 0.15);
          ball.m.position.copy(ball.p);
          if (shot.t > 0.45) {
            shot.launched = true;
            const make = Math.random() < 0.6;
            const tgt = rimP.clone();
            if (!make) { tgt.x += (Math.random() - 0.5) * 0.5; tgt.z += (Math.random() - 0.5) * 0.5; tgt.y += 0.05; }
            const T = 0.9 + ball.p.distanceTo(tgt) * 0.08;
            ball.v.set((tgt.x - ball.p.x) / T, (tgt.y - ball.p.y + 0.5 * 9.8 * T * T) / T, (tgt.z - ball.p.z) / T);
            sfx('tap', 0.08);
          }
          return;
        }
        if (shot.t > 6) shot = null;
      }
      const prevY = ball.p.y;
      stepBall(ball, dt, (vy) => hit('impactSoft_heavy_000', Math.min(0.3, vy * 0.06), 1.5));
      // 림과 부딪힘
      tmp.set(ball.p.x - rimP.x, 0, ball.p.z - rimP.z);
      const hd = tmp.length();
      const near2 = tmp.clone().setLength(RIM_R);
      const cp = new THREE.Vector3(rimP.x + near2.x, rimP.y, rimP.z + near2.z);
      const dd = ball.p.distanceTo(cp);
      if (dd < ball.r + 0.02 && hd > 0.02) {
        const n = ball.p.clone().sub(cp).normalize();
        const vn = ball.v.dot(n);
        if (vn < 0) { ball.v.addScaledVector(n, -vn * 1.6); hit('impactMetal_light_000', 0.25, 1.2); }
        ball.p.copy(cp).addScaledVector(n, ball.r + 0.021);
      }
      // 백보드
      const l = zn.local(ball.p.x, ball.p.z);
      if (l.u > boardU - ball.r && l.u < boardU + 0.1 && Math.abs(l.v) < 0.75 && ball.p.y > G0 + 2.27 && ball.p.y < G0 + 3.22) {
        const vu = ball.v.x * zn.t.x + ball.v.z * zn.t.z;
        if (vu > 0) { ball.v.x -= zn.t.x * vu * 1.7; ball.v.z -= zn.t.z * vu * 1.7; hit('impactPlank_medium_000', 0.2, 1.2); }
      }
      // 림 안으로 위에서 아래로 통과 = 골
      if (shot && !shot.scored && prevY > rimP.y && ball.p.y <= rimP.y && hd < RIM_R - 0.03) {
        shot.scored = true; swish = 0.6;
        ball.v.x *= 0.3; ball.v.z *= 0.3;
        hit('impactSoft_medium_000', 0.2, 1.8);
        burst(rimP.x, rimP.y, rimP.z); sfx('share', 0.25);
        showVerse('goal', { delay: 0.8, cooldown: 60 });
      }
      if (swish > 0) { swish -= dt; net.scale.set(1 - swish * 0.3, 1 + swish * 0.6, 1 - swish * 0.3); }
      // 코트 밖으로 굴러가면 천천히 돌아옴
      if (Math.abs(l.u) > zn.w / 2 + 1 || Math.abs(l.v) > zn.d / 2 + 1) { const p = zn.at(2.5, 1.5); ball.p.set(p.x, G0 + 0.12, p.z); ball.v.set(0, 0, 0); }
    });
  }

  // ---------- 라켓 운동: 테니스·배드민턴·탁구 (전 4:9-10, 잠 27:17) ----------
  // 맞은편에 친구가 서 있고, 동작을 누르면 공을 주고받음
  function racketCourt(zn, kind, opt) {
    const g = zoneGroup(scene, zn);
    if (opt.court) opt.court(g);
    shadow(g);
    // 상대 (미니 캐릭터)
    const partner = { o: null, mixer: null, A: {}, racket: null };
    const pp = zn.at(opt.far, 0);
    loadFresh('assets/mini/' + opt.char + '.glb').then((gl) => {
      if (!gl) return;
      const o = gl.scene;
      const bb = new THREE.Box3().setFromObject(o);
      o.scale.setScalar(1.25 / (bb.max.y - bb.min.y));
      const holder = new THREE.Group(); holder.add(o); shadow(holder);
      holder.position.set(pp.x, opt.y || G0, pp.z);
      holder.rotation.y = Math.atan2(-zn.t.x, -zn.t.z);
      scene.add(holder);
      partner.o = holder;
      const mixer = new THREE.AnimationMixer(o);
      mixers.push(mixer);
      for (const a of gl.animations) partner.A[a.name] = mixer.clipAction(a);
      partner.A.idle && partner.A.idle.play();
      // 오른손에 라켓
      const hand = o.getObjectByName('arm-right');
      if (hand) {
        const r = me.av.userData.rackets[kind].clone();
        r.visible = true;
        r.scale.setScalar(1 / o.scale.x);
        r.position.set(0, -0.35 / o.scale.x, 0.04 / o.scale.x);
        r.rotation.set(1.4, 0, 0);
        hand.add(r);
      }
    });
    const swingP = () => {
      const a = partner.A['attack-melee-right'];
      if (!a) return;
      a.reset(); a.setLoop(THREE.LoopOnce, 1); a.play();
      setTimeout(() => a.fadeOut(0.2), 500);
    };
    const ball = new THREE.Mesh(new THREE.SphereGeometry(opt.r, 10, 8), M(opt.color, 0.5));
    if (kind === 'badminton') { ball.geometry = new THREE.ConeGeometry(0.05, 0.1, 8, 1, true); ball.material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }); }
    ball.castShadow = true; ball.visible = false; scene.add(ball);
    let R = null;
    const meSpot = () => zn.at(-opt.far, (Math.random() - 0.5) * 0.4);
    actions[opt.action] = () => go(meSpot, () => {
      faceTo(me, zn.at(opt.far, 0)); act('rally'); me.racket = kind; camShot(zn.at(opt.far, 0), { dist: Math.abs(opt.far) * 1.3 + 4, el: 0.35, side: 1.45, dur: 12, mid: 0.5 });
      R = { k: 0, n: 3 + Math.floor(Math.random() * 6), t: 0, from: 0, dur: opt.dur };
      hit(opt.snd[0], opt.snd[1], opt.snd[2]); me.swingT = 0.35;
    }, 0.8);
    avail.push(() => (near(zn, 1.5) && !R ? opt.action : null));
    const handPos = (who) => {
      if (who === 0) return new THREE.Vector3(me.x + Math.sin(me.face) * 0.25, me.y + opt.hitY, me.z + Math.cos(me.face) * 0.25);
      const p = partner.o ? partner.o.position : new THREE.Vector3(pp.x, G0, pp.z);
      return new THREE.Vector3(p.x - zn.t.x * 0.25, (opt.y || G0) + opt.hitY, p.z - zn.t.z * 0.25);
    };
    steps.push((dt) => {
      if (!R) { if (me.racket === kind && me.action !== 'rally') me.racket = null; return; }
      if (me.action !== 'rally') { R = null; ball.visible = false; me.racket = null; return; }
      R.t += dt;
      const a = handPos(R.from), b = handPos(1 - R.from);
      const f = Math.min(1, R.t / R.dur);
      const last = R.k >= R.n;
      // 마지막 공은 네트에 걸리거나 밖으로
      const end = last ? a.clone().lerp(b, 0.5).setY(G0 + opt.netY * 0.6) : b;
      const fx = kind === 'badminton' ? 1 - (1 - f) * (1 - f) : f;
      ball.position.lerpVectors(a, end, fx);
      let arc = Math.sin(f * Math.PI) * opt.arc;
      if (kind === 'pingpong' && !last) {
        // 상대 쪽 탁자에 한 번 튀김
        const tb = G0 + 0.76 + opt.r;
        const k = f < 0.7 ? f / 0.7 : (f - 0.7) / 0.3;
        const y0 = f < 0.7 ? a.y : tb, y1 = f < 0.7 ? tb : b.y;
        ball.position.y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * (f < 0.7 ? 0.25 : 0.15);
        arc = 0;
        if (f >= 0.7 && R.t - dt < R.dur * 0.7) hit('impactGeneric_light_000', 0.15, 2.2);
      }
      if (kind === 'tennis' && !last && f > 0.72 && R.t - dt <= R.dur * 0.72) hit('impactSoft_medium_000', 0.08, 1.6);
      ball.position.y += arc;
      if (kind === 'badminton') ball.lookAt(ball.position.clone().add(new THREE.Vector3().subVectors(b, a)));
      ball.visible = true;
      if (f >= 1) {
        if (last) {
          R = null; ball.visible = false;
          me.action = null; me.racket = null;
          showVerse(opt.verse, { delay: 0.5, cooldown: 60 });
          const e = partner.A['emote-yes']; if (e) { e.reset(); e.setLoop(THREE.LoopOnce, 1); e.play(); setTimeout(() => e.fadeOut(0.3), 1500); }
          return;
        }
        R.from = 1 - R.from; R.t = 0; R.k++;
        R.dur = opt.dur * (0.85 + Math.random() * 0.3);
        if (R.from === 1) swingP(); else me.swingT = 0.35;
        hit(opt.snd[0], opt.snd[1], opt.snd[2] * (0.92 + Math.random() * 0.16));
      }
    });
  }
  racketCourt(P.tennis, 'tennis', {
    action: 'tennis', char: 'character-female-b', far: 7, dur: 1.15, arc: 1.4, hitY: 1.0, netY: 0.9, r: 0.06, color: 0xd7e84a, verse: 'two',
    snd: ['impactGeneric_light_001', 0.3, 0.8],
    court(g) {
      const zn = P.tennis;
      g.add(flat(zn.w + 2, zn.d + 1.6, M(0x5f8f6a, 0.9)));
      g.add(flat(zn.w, zn.d - 1, M(0x4f7fa8, 0.9), 0.014));
      lineRect(g, zn.w, zn.d - 1);
      lineRect(g, zn.w, zn.d - 3);
      const c = box(zn.w * 0.6, 0.005, 0.06, MAT.line); at(c, 0, 0.02, 0); g.add(c);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(zn.d - 0.6, 0.85), MAT.net); at(net, 0, 0.45, 0); g.add(net);
      const tape = box(0.04, 0.05, zn.d - 0.6, MAT.white); at(tape, 0, 0.88, 0); g.add(tape);
      for (const s of [-1, 1]) { const p = box(0.08, 1, 0.08, M(0x3d4a40)); at(p, 0, 0.5, s * (zn.d / 2 - 0.3)); g.add(p); }
    },
  });
  racketCourt(P.badminton, 'badminton', {
    action: 'badminton', char: 'character-male-c', far: 3.6, dur: 1.4, arc: 1.9, hitY: 1.35, netY: 1.4, r: 0.05, color: 0xffffff, verse: 'two',
    snd: ['impactSoft_medium_000', 0.15, 2.2],
    court(g) {
      const zn = P.badminton;
      g.add(flat(zn.w + 1, zn.d + 1, M(0x3f8a5c, 0.9)));
      lineRect(g, zn.w, zn.d);
      const c = box(zn.w, 0.005, 0.05, MAT.line); at(c, 0, 0.02, 0); g.add(c);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(zn.d, 0.6), MAT.net); at(net, 0, 1.25, 0); g.add(net);
      const tape = box(0.03, 0.04, zn.d, MAT.white); at(tape, 0, 1.55, 0); g.add(tape);
      for (const s of [-1, 1]) { const p = box(0.05, 1.55, 0.05, MAT.white); at(p, 0, 0.78, s * zn.d / 2); g.add(p); }
    },
  });
  racketCourt(P.pingpong, 'pingpong', {
    action: 'pingpong', char: 'character-female-d', far: 1.85, dur: 0.75, arc: 0, hitY: 0.95, netY: 0.92, r: 0.025, color: 0xffffff, verse: 'iron',
    snd: ['impactGeneric_light_001', 0.18, 1.9],
    court(g) {
      // 정자 아래 탁구대 (길이는 둘레 방향)
      g.add(flat(6.5, 5, M(0xe6dccb, 0.9)));
      const top = box(2.7, 0.04, 1.5, M(0x2f6f5c, 0.5)); at(top, 0, 0.76, 0); g.add(top);
      const ln = box(2.7, 0.005, 0.02, MAT.line); at(ln, 0, 0.785, 0); g.add(ln);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.15), MAT.net); at(net, 0, 0.85, 0); g.add(net);
      for (const u of [-1.1, 1.1]) for (const v of [-0.6, 0.6]) { const l = box(0.05, 0.74, 0.05, M(0x333333)); at(l, u, 0.37, v); g.add(l); }
      for (const u of [-2.6, 2.6]) for (const v of [-2.1, 2.1]) { const p = box(0.12, 2.6, 0.12, MAT.white); at(p, u, 1.3, v); g.add(p); }
      const roof = box(6, 0.12, 5, M(0xf2eadb, 0.7)); at(roof, 0, 2.65, 0); g.add(roof);
    },
  });
  // 탁구대·코트 위치를 장애물과 맞춤: 탁구대는 둘레 방향 → 층(layout)과 다르게 막힘이 필요 없음

  // ---------- 캠핑장·바비큐 친구들 ----------
  function sitter(path, p, faceP, anim = 'sit') {
    loadFresh(path).then((gl) => {
      if (!gl) return;
      const o = gl.scene;
      const bb = new THREE.Box3().setFromObject(o);
      o.scale.setScalar(1.25 / (bb.max.y - bb.min.y));
      const holder = new THREE.Group(); holder.add(o); shadow(holder);
      holder.position.set(p.x, p.y ?? G0, p.z);
      holder.rotation.y = Math.atan2(faceP.x - p.x, faceP.z - p.z);
      scene.add(holder);
      const mixer = new THREE.AnimationMixer(o); mixers.push(mixer);
      const a = gl.animations.find((c) => c.name === anim) || gl.animations.find((c) => c.name === 'idle');
      if (a) mixer.clipAction(a).play();
    });
  }
  {
    const zn = P.camp;
    const ang = deg(180 + 50) + Math.atan2(-zn.n.z, -zn.n.x);
    sitter('assets/mini/character-male-a.glb', { x: fireAt.x + Math.cos(ang) * 1.7, z: fireAt.z + Math.sin(ang) * 1.7, y: G0 + 0.05 }, fireAt);
    sitter('assets/mini/character-male-e.glb', P.soccer.at(zn.w / 2 + 0.3, 0), P.soccer.at(0, 0), 'idle');
    sitter('assets/mini/character-female-f.glb', P.bbq.at(-2, 1.4), P.bbq.at(-2, 0.5), 'idle');
  }

  // ---------- 정원의 자연 소리 ----------
  let wind = null, birdT = 1, stepAcc = 0, lastX = me.x, lastZ = me.z, stepK = 0;
  steps.push((dt) => {
    const r = Math.hypot(me.x, me.z);
    const out = r > 28.6 ? 1 : 0;
    if (!audio.get()) return;
    if (!wind) wind = audio.loop('lowpass', 380);
    wind.set(out * 0.06 + 0.005);
    birdT -= dt;
    if (birdT < 0) {
      birdT = 1.5 + Math.random() * (out ? 3 : 9);
      audio.chirp((Math.random() - 0.5) * 1.6, out ? 0.03 + Math.random() * 0.03 : 0.008);
    }
    // 발소리: 밖은 풀, 안은 돌바닥
    const moved = Math.hypot(me.x - lastX, me.z - lastZ);
    lastX = me.x; lastZ = me.z;
    if (me.state === 'walk' && !me.swim && !me.jumps && moved < 1) {
      stepAcc += moved;
      const stride = me.running ? 1.1 : 0.7;
      if (stepAcc > stride) {
        stepAcc = 0;
        const k = stepK++ % 4;
        if (out && !(Math.abs(me.x) < 2 && me.z > 28) && !(Math.abs(r - R_PARK) < 1.5) && !(Math.abs(r - R_WALK) < 1.1)) sfx('impact/footstep_grass_00' + k, 0.07, 0.95 + Math.random() * 0.1);
        else sfx('impact/footstep_concrete_00' + k, out ? 0.05 : 0.035, 1.1 + Math.random() * 0.1);
      }
    }
  });

  // 성경 이야기 체험과 숲속 코스
  const ctx = { shot: camShot, scene, me, act, sfx, fxSprite, burst, faceTo, standUp, walkTo, actions, avail, steps, mixers, go, tapTo, audio, loadFresh,
    H: { M, MAT, shadow, zoneGroup, at, box, flat, ease, G0, mergeStatic } };
  addStories(ctx);
  addCourses(ctx);

  return {
    actions,
    available: () => avail.map((f) => f()).filter(Boolean),
    step(dt, t) {
      for (const m of mixers) m.update(dt);
      for (const f of steps) f(dt, t);
    },
  };
}

// ---------- 작은 새와 양 (원시 도형) ----------
function makeBird(k) {
  const g = new THREE.Group();
  const col = [0x6f8fb3, 0xc9784a, 0x8a8f5a, 0xb35d5d, 0x5d7fb3, 0x9b7a55, 0x777777][k % 7];
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(col, 0.7));
  body.scale.set(0.8, 0.8, 1.3);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M(col, 0.7)); head.position.set(0, 0.07, 0.1);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 4), M(0xe0b04a)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.06, 0.17);
  g.add(body, head, beak);
  const wings = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), M(col, 0.7, { side: THREE.DoubleSide }));
    w.geometry.translate(s * 0.1, 0, 0);
    w.rotation.x = -Math.PI / 2;
    const piv = new THREE.Group(); piv.add(w); piv.position.set(s * 0.05, 0.03, 0);
    g.add(piv); wings.push(piv);
  }
  g.userData.wings = wings;
  return g;
}
function flapBird(b, t) {
  const f = b.userData.flap ?? 1;
  b.userData.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.2 + Math.sin(t * 22) * 0.8 * f); });
}
const wool = M(0xf7f4ee, 1), faceM = M(0x3a3430, 0.8);
const eyeM = M(0xffffff);
function makeSheep() {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.2, 1);
  for (const [x, y, z, s] of [[0, 0.42, 0, 1.25], [0, 0.45, 0.17, 1], [0, 0.45, -0.17, 1], [0.1, 0.5, 0, 0.9], [-0.1, 0.5, 0, 0.9], [0, 0.58, 0, 0.8]]) {
    const w = new THREE.Mesh(geo, wool); w.position.set(x, y, z); w.scale.setScalar(s); g.add(w);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), faceM); head.scale.set(0.85, 1, 1.15); head.position.set(0, 0.55, 0.36); g.add(head);
  const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), wool); tuft.position.set(0, 0.66, 0.34); g.add(tuft);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), faceM); ear.scale.set(1.4, 0.5, 0.7); ear.position.set(s * 0.12, 0.58, 0.32); g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), eyeM); eye.position.set(s * 0.05, 0.58, 0.45); g.add(eye);
  }
  const legs = [];
  for (const [x, z] of [[-0.1, 0.15], [0.1, 0.15], [-0.1, -0.15], [0.1, -0.15]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 5), faceM); l.geometry.translate(0, -0.15, 0); l.position.set(x, 0.3, z); g.add(l); legs.push(l); l.userData.dyn = true;
  }
  g.userData.legs = legs;
  g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  return mergeStatic(g);
}
function legWalk(o, t, moving) {
  o.userData.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * 10 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.5 : 0; });
}
// 우리 안에서 어슬렁
function wander(f, zn, R, dt, t) {
  const p = f.o.position;
  if (!f.tgt) {
    f.wait -= dt;
    legWalk(f.o, t, 0);
    if (f.wait < 0) { const a = Math.random() * Math.PI * 2, r = Math.random() * R * 0.8; f.tgt = { x: zn.x + Math.cos(a) * r, z: zn.z + Math.sin(a) * r }; }
    return;
  }
  const dx = f.tgt.x - p.x, dz = f.tgt.z - p.z, d = Math.hypot(dx, dz);
  if (d < 0.1) { f.tgt = null; f.wait = 2 + Math.random() * 6; return; }
  p.x += (dx / d) * 0.5 * dt; p.z += (dz / d) * 0.5 * dt;
  f.o.rotation.y = Math.atan2(dx, dz);
  legWalk(f.o, t, 1);
}
