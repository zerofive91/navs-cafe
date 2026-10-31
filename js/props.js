// Kenney(CC0) 3D 소품 불러오기: 가구·음식·자연 모델, 하늘, 빛 효과
// 모델은 화면이 뜬 뒤 천천히 불러오고, 다 불러오면 임시 모양을 바꿔 끼움
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { C, G, gr, R_GARDEN, Q, PRAYER_POOL_R, COUNTER, LONG_TABLE, LOUNGES, FLOWER_BEDS, GARDEN_BENCHES, GARDEN_LAMPS, R_WALK, LANES, parkClear, polar, deg, floorY } from './layout.js';

const loader = new GLTFLoader();
const cache = new Map();
export function load(path) {
  if (!cache.has(path)) cache.set(path, new Promise((ok) => loader.load(path, (g) => ok(g.scene), undefined, () => ok(null))));
  return cache.get(path);
}

// 흰 카페 톤에 맞게 색을 연하게 (채도 ↓, 밝기 ↑)
const toned = new Map();
function soften(obj, sat = 0.5, light = 0.35) {
  obj.traverse((c) => {
    if (!c.isMesh) return;
    const key = c.material.uuid + sat + light;
    if (!toned.has(key)) {
      const m = c.material.clone();
      const hsl = {};
      m.color.getHSL(hsl);
      m.color.setHSL(hsl.h, hsl.s * sat, hsl.l + (1 - hsl.l) * light);
      m.roughness = 0.75;
      m.metalness = 0;
      toned.set(key, m);
    }
    c.material = toned.get(key);
  });
}

// 모델을 원하는 높이(또는 너비)로 맞춰 바닥에 세움
export async function place(scene, path, { x, z, y = null, rot = 0, height, width, tone, shadow = true, parent }) {
  const src = await load(path);
  if (!src) return null;
  const o = src.clone(true);
  const box = new THREE.Box3().setFromObject(o);
  const size = box.getSize(new THREE.Vector3());
  const s = height ? height / size.y : width / Math.max(size.x, size.z);
  o.scale.setScalar(s);
  const c = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  o.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  pivot.add(o);
  pivot.position.set(x, y === null ? floorY(x, z) : y, z);
  pivot.rotation.y = rot;
  if (tone) soften(pivot, tone[0], tone[1]);
  pivot.traverse((m) => { if (m.isMesh) { m.castShadow = shadow; m.receiveShadow = true; } });
  (parent || scene).add(pivot);
  return pivot;
}

// 같은 모델을 여러 자리에: 모델마다 한 번에 그리는 인스턴스로 묶음 (꽃·풀·숲 나무처럼 많고 움직이지 않는 것)
export function instancer(scene) {
  const jobs = new Map();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3();
  return {
    add(path, opts) { if (!jobs.has(path)) jobs.set(path, []); jobs.get(path).push(opts); },
    async flush() {
      await Promise.all([...jobs].map(async ([path, list]) => {
        const src = await load(path);
        if (!src) return;
        src.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(src);
        const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
        const base = new THREE.Matrix4().makeTranslation(-c.x, -box.min.y, -c.z);
        const place = list.map((o) => {
          const sc = o.height ? o.height / size.y : o.width / Math.max(size.x, size.z);
          q.setFromAxisAngle(up, o.rot || 0);
          return new THREE.Matrix4().compose(new THREE.Vector3(o.x, o.y === undefined || o.y === null ? floorY(o.x, o.z) : o.y, o.z), q.clone(), one.set(sc, sc, sc)).multiply(base);
        });
        src.traverse((m) => {
          if (!m.isMesh) return;
          const im = new THREE.InstancedMesh(m.geometry, m.material, list.length);
          place.forEach((P, i) => { m4.multiplyMatrices(P, m.matrixWorld); im.setMatrixAt(i, m4); });
          im.castShadow = !!list[0].shadow; im.receiveShadow = true;
          im.computeBoundingSphere();
          scene.add(im);
        });
      }));
    },
  };
}

// 의자 모델의 앉는 면 높이: 앉는 방향으로 조금 앞쪽을 위에서 아래로 재어 봄
const down = new THREE.Raycaster();
function seatTop(m, seat) {
  m.updateMatrixWorld(true);
  const top = new THREE.Box3().setFromObject(m).max.y;
  const fx = Math.sin(seat.face) * 0.12, fz = Math.cos(seat.face) * 0.12;
  down.set(new THREE.Vector3(seat.x + fx, top + 1, seat.z + fz), new THREE.Vector3(0, -1, 0));
  const hit = down.intersectObject(m, true)[0];
  return hit ? hit.point.y : null;
}

const F = 'assets/furniture/', N = 'assets/nature/', D = 'assets/food/';

export function loadProps({ scene, deco, interactive, anim, renderer, occluders = [] }) {
  // ---------- 하늘 ----------
  new THREE.TextureLoader().load('assets/sky/day.jpg', (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    if (scene.fog) scene.fog.color.set(0xd9e8f1);
  });

  // ---------- 바깥 정원: 나무·꽃·풀 ----------
  const TREES = ['tree_default', 'tree_oak', 'tree_detailed', 'tree_fat', 'tree_tall'];
  const many = instancer(scene);
  deco.trees.forEach((t, k) => {
    // 숲의 나무는 묶어서 한 번에 그림, 정원 안 나무는 카메라를 가리면 반투명해지도록 하나씩
    if (Math.hypot(t.x, t.z) > R_GARDEN + 2) { many.add(N + TREES[k % TREES.length] + '.glb', { x: t.x, z: t.z, y: -0.5, rot: k * 1.7, height: t.h * 1.15 }); return; }
    place(scene, N + TREES[k % TREES.length] + '.glb', { x: t.x, z: t.z, y: -0.5, rot: k * 1.7, height: t.h * 1.15, shadow: false })
      .then((m) => { if (!m) return; t.parts.forEach((p) => { p.visible = false; }); m.traverse((c) => { if (c.isMesh) occluders.push(c); }); }); // 카메라를 가리면 반투명
  });
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const FL = ['flower_redA', 'flower_yellowA', 'flower_purpleA', 'flower_redB', 'flower_yellowB', 'flower_purpleB', 'flower_redC', 'flower_yellowC', 'flower_purpleC'];
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const flower = (x, z, h = 0.4 + rnd() * 0.25, kind = pick(FL)) => many.add(N + kind + '.glb', { x, z, y: -0.5, rot: rnd() * 6, height: h });
  const nearEntry = (a) => LANES.some((la) => Math.abs(Math.atan2(Math.sin(a - deg(la)), Math.cos(a - deg(la)))) < (la === 90 ? 0.07 : 0.045));
  // 산책길 양옆 꽃 테두리 (색이 구간마다 바뀜)
  for (const [r, step] of [[R_WALK - 1.6, 0.034], [R_WALK + 1.6, 0.03]]) {
    for (let a = 0; a < Math.PI * 2; a += step) {
      if (nearEntry(a)) continue;
      if (FLOWER_BEDS.some((b) => Math.abs(Math.atan2(Math.sin(a - deg(b.a)), Math.cos(a - deg(b.a)))) < 0.03) && r > R_WALK) continue; // 꽃밭 오솔길
      const band = Math.floor(a / (Math.PI / 6)) % 3;
      const kinds = [FL.slice(0, 3), FL.slice(3, 6), FL.slice(6, 9)][band];
      const rr = r + (rnd() - 0.5) * 0.35;
      flower(Math.cos(a) * rr, Math.sin(a) * rr, 0.35 + rnd() * 0.2, pick(kinds));
    }
  }
  // 둥근 꽃밭: 가운데 덤불·큰 화분, 둘레에 꽃 두 겹
  FLOWER_BEDS.forEach((b, k) => {
    place(scene, N + (k % 2 ? 'pot_large' : 'plant_bushDetailed') + '.glb', { x: b.x, z: b.z, y: -0.36, rot: k, height: k % 2 ? 0.9 : 1.2 });
    for (const [rr, n] of [[0.9, 9], [1.7, 15]]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd() * 0.2;
        many.add(N + FL[(k * 3 + (rr > 1 ? 1 : 0)) % FL.length] + '.glb', { x: b.x + Math.cos(a) * rr, z: b.z + Math.sin(a) * rr, y: -0.36, rot: rnd() * 6, height: 0.45 + rnd() * 0.2 });
      }
    }
  });
  // 벤치(숲을 바라봄)와 길가 등
  for (const b of GARDEN_BENCHES) {
    place(scene, F + 'bench.glb', { x: b.x, z: b.z, y: -0.5, rot: Math.atan2(b.x, b.z), height: 0.9, tone: [0.7, 0.15] })
      .then((m) => { if (m) b.seat.top = seatTop(m, b.seat); });
    place(scene, N + 'plant_bushSmall.glb', { x: b.x + Math.cos(deg(b.a + 3)) * 0.3, z: b.z + Math.sin(deg(b.a + 3)) * 0.3, y: -0.5, rot: b.a, height: 0.6, shadow: false });
  }
  for (const l of GARDEN_LAMPS) place(scene, F + 'lampRoundFloor.glb', { x: l.x, z: l.z, y: -0.5, height: 1.6, tone: [0.4, 0.4] });
  // 정원 너머 풀밭: 꽃·풀·그루터기
  const MEADOW = [...FL, 'grass_large', 'grass_leafs', 'grass_large', 'plant_flatTall', 'rock_smallFlatB', 'stump_round', 'log'];
  for (let k = 0; k < 320; k++) {
    const a = rnd() * Math.PI * 2;
    const r = gr(37.5) + rnd() * 12 * G;
    if (nearEntry(a)) continue;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (FLOWER_BEDS.some((b) => Math.hypot(b.x - x, b.z - z) < b.r + 0.4)) continue;
    if (r > gr(40) && !parkClear(x, z, 0.5)) continue;
    const kind = pick(MEADOW);
    const h = kind.startsWith('stump') || kind === 'log' ? 0.4 : kind.startsWith('rock') ? 0.25 : kind.startsWith('plant') ? 0.8 : 0.35 + rnd() * 0.25;
    many.add(N + kind + '.glb', { x, z, y: -0.5, rot: rnd() * 6, height: h });
  }
  many.flush().then(() => deco.trees.forEach((t) => { if (Math.hypot(t.x, t.z) > R_GARDEN + 2) t.parts.forEach((p) => { p.visible = false; }); }));

  // ---------- 둘레 화분: 잎을 덤불 모델로 ----------
  deco.plantGroups.forEach(({ g, p }, k) => {
    place(scene, N + (k % 2 ? 'plant_bushDetailed' : 'plant_bushLarge') + '.glb', { x: 0, z: 0, y: 0.78, rot: k, height: 1.5, parent: g })
      .then((m) => {
        if (!m) return;
        deco.plantLeaves.forEach((l) => { if (l.parent === g) l.visible = false; });
        m.traverse((c) => { if (c.isMesh) { c.userData.action = 'water'; c.userData.pot = p; interactive.push(c); } });
      });
  });

  // ---------- 카운터: 커피머신, 진열장 빵, 컵 ----------
  const mp = polar(COUNTER.r + 0.1, -60);
  place(scene, F + 'kitchenCoffeeMachine.glb', { x: mp.x, z: mp.z, y: 1.12, rot: -deg(-60) - Math.PI / 2, height: 0.62, tone: [0.4, 0.25] })
    .then((m) => { if (m && deco.machine) deco.machine.visible = false; });
  const pastries = ['croissant', 'donut', 'muffin', 'cupcake', 'cookie', 'croissant'];
  deco.pastries.forEach((b, k) => {
    const w = new THREE.Vector3();
    b.getWorldPosition(w);
    place(scene, D + pastries[k] + '.glb', { x: w.x, z: w.z, y: 0.92, rot: k, width: 0.2 }).then((m) => { if (m) b.visible = false; });
  });
  deco.counterCups.forEach((c, k) => {
    place(scene, D + 'cup-saucer.glb', { x: c.position.x, z: c.position.z, y: 1.12, rot: k, width: 0.2 }).then((m) => { if (m) c.visible = false; });
  });

  // ---------- 긴 테이블 위: 컵과 간식 ----------
  const dir = polar(1, LONG_TABLE.rot);
  [[-2, 'mug'], [-1.2, 'croissant'], [1.1, 'donut'], [2, 'cup-saucer']].forEach(([t, n], k) => {
    const side = k % 2 ? 0.25 : -0.25;
    place(scene, D + n + '.glb', { x: LONG_TABLE.x + dir.x * t - dir.z * side, z: LONG_TABLE.z + dir.z * t + dir.x * side, y: 0.83, rot: k * 1.3, width: n.startsWith('cup') || n === 'mug' ? 0.16 : 0.2 });
  });

  // ---------- 기도: 고요한 물 위 연잎 ----------
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + 0.4, r = 2.4 + (k % 3) * 0.55;
    place(scene, N + (k % 2 ? 'lily_small' : 'lily_large') + '.glb', { x: Q.prayer.x + Math.cos(a) * r, z: Q.prayer.z + Math.sin(a) * r, y: 0.035, rot: k * 2.1, width: k % 2 ? 0.45 : 0.7, shadow: false });
  }
  void PRAYER_POOL_R;

  // ---------- 창가 라운지: 의자, 작은 탁자, 스탠드, 화분 ----------
  for (const l of LOUNGES) {
    const face = Math.atan2(-l.chair.x, -l.chair.z);
    place(scene, F + 'loungeDesignChair.glb', { x: l.chair.x, z: l.chair.z, rot: face, width: 0.95, tone: [0.35, 0.45] })
      .then((m) => { if (!m) return; l.seat.top = seatTop(m, l.seat); m.traverse((c) => { if (c.isMesh) { c.userData.seat = l; interactive.push(c); } }); });
    place(scene, F + 'sideTable.glb', { x: l.table.x, z: l.table.z, rot: face, width: 0.55, tone: [0.4, 0.4] }).then((t) => {
      if (!t) return;
      const top = new THREE.Box3().setFromObject(t).max.y;
      place(scene, F + 'lampRoundTable.glb', { x: l.table.x, z: l.table.z, y: top, rot: face, height: 0.5, tone: [0.4, 0.5] });
    });
    const pp = polar(26.6 * C, l.a - 3.2);
    place(scene, F + 'pottedPlant.glb', { x: pp.x, z: pp.z, rot: l.a, height: 1.1, tone: [0.8, 0.1] });
  }

  void anim; void renderer;
}

// 손에 드는 컵(커피 컵·머그)과 빵 모델을 채움
function fit(src, size, drop = 0) {
  const o = src.clone(true);
  const box = new THREE.Box3().setFromObject(o);
  const sz = box.getSize(new THREE.Vector3());
  const s = size / Math.max(sz.x, sz.z);
  o.scale.setScalar(s);
  const c = box.getCenter(new THREE.Vector3());
  o.position.set(-c.x * s, -box.min.y * s - drop, -c.z * s);
  return o;
}
export function upgradeCup(av) {
  const u = av.userData;
  Promise.all([load(D + 'cup-coffee.glb'), load(D + 'mug.glb')]).then(([coffee, mug]) => {
    if (!coffee) return;
    u.cup.children.forEach((ch) => { ch.visible = false; });
    u.drinks.coffee = fit(coffee, 0.16, 0.07);
    u.cup.add(u.drinks.coffee);
    if (mug) { u.drinks.tea = fit(mug, 0.17, 0.07); u.cup.add(u.drinks.tea); }
  });
  // 우물물 한 잔 (투명한 유리컵)
  {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.13, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8f4fb, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide }));
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.044, 0.09, 14), new THREE.MeshStandardMaterial({ color: 0x8cc6e6, transparent: true, opacity: 0.75, roughness: 0.1 }));
    glass.position.y = 0.065; water.position.y = 0.046;
    g.add(glass, water);
    g.position.y = -0.05;
    u.drinks.water = g;
    u.cup.add(g);
  }
  load('assets/camp/fish.glb').then((src) => {
    if (!src) return;
    const o = fit(src, 0.24, 0.04);
    o.rotation.z = Math.PI / 2;
    u.foods.fish = o;
    u.food.add(o);
  });
  for (const k of ['croissant', 'donut', 'muffin']) {
    load(D + k + '.glb').then((src) => {
      if (!src) return;
      const o = fit(src, k === 'croissant' ? 0.2 : 0.14, 0.05);
      if (k === 'donut') o.rotation.x = Math.PI / 2.4;
      u.foods[k] = o;
      u.food.add(o);
    });
  }
}

// 빛 효과 스프라이트 (전도할 때 건네는 빛, 반짝임)
const texLoader = new THREE.TextureLoader();
const fxTex = {};
export function fxSprite(name, color = 0xffd98a, size = 0.6) {
  if (!fxTex[name]) { fxTex[name] = texLoader.load('assets/fx/' + name + '.png'); fxTex[name].colorSpace = THREE.SRGBColorSpace; }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fxTex[name], color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.setScalar(size);
  return sp;
}
