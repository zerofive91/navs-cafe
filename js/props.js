// Kenney(CC0) 3D 소품 불러오기: 가구·음식·자연 모델, 하늘, 빛 효과
// 모델은 화면이 뜬 뒤 천천히 불러오고, 다 불러오면 임시 모양을 바꿔 끼움
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { Q, PRAYER_POOL_R, COUNTER, LONG_TABLE, LOUNGES, polar, deg, floorY } from './layout.js';

const loader = new GLTFLoader();
const cache = new Map();
function load(path) {
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
async function place(scene, path, { x, z, y = null, rot = 0, height, width, tone, shadow = true, parent }) {
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

const F = 'assets/furniture/', N = 'assets/nature/', D = 'assets/food/';

export function loadProps({ scene, deco, interactive, anim, renderer }) {
  // ---------- 하늘 ----------
  new THREE.TextureLoader().load('assets/sky/day.jpg', (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t;
    if (scene.fog) scene.fog.color.set(0xd9e8f1);
  });

  // ---------- 바깥 정원: 나무·꽃·풀 ----------
  const TREES = ['tree_default', 'tree_oak', 'tree_detailed', 'tree_fat', 'tree_tall'];
  deco.trees.forEach((t, k) => {
    place(scene, N + TREES[k % TREES.length] + '.glb', { x: t.x, z: t.z, y: -0.5, rot: k * 1.7, height: t.h * 1.15, shadow: false })
      .then((m) => { if (m) t.parts.forEach((p) => { p.visible = false; }); });
  });
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const FLOWERS = ['flower_redA', 'flower_yellowA', 'flower_purpleA', 'flower_redB', 'flower_yellowB', 'grass_large', 'grass_leafs', 'grass_large', 'plant_bushLarge', 'rock_smallFlatB'];
  for (let k = 0; k < 90; k++) {
    const a = rnd() * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.12) continue; // 입구 길
    const r = 29.6 + rnd() * 6;
    const kind = FLOWERS[Math.floor(rnd() * FLOWERS.length)];
    const h = kind.startsWith('plant') ? 0.9 : kind.startsWith('rock') ? 0.25 : 0.35 + rnd() * 0.25;
    place(scene, N + kind + '.glb', { x: Math.cos(a) * r, z: Math.sin(a) * r, y: -0.5, rot: rnd() * 6, height: h, shadow: false });
  }

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
  [[-2, 'mug'], [-1.2, 'croissant'], [0.1, 'cup-coffee'], [1.1, 'donut'], [2, 'cup-saucer']].forEach(([t, n], k) => {
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
      .then((m) => { if (m) m.traverse((c) => { if (c.isMesh) { c.userData.seat = l; interactive.push(c); } }); });
    place(scene, F + 'sideTable.glb', { x: l.table.x, z: l.table.z, rot: face, width: 0.55, tone: [0.4, 0.4] }).then((t) => {
      if (!t) return;
      const top = new THREE.Box3().setFromObject(t).max.y;
      place(scene, F + 'lampRoundTable.glb', { x: l.table.x, z: l.table.z, y: top, rot: face, height: 0.5, tone: [0.4, 0.5] });
    });
    const pp = polar(26.6, l.a - 3.2);
    place(scene, F + 'pottedPlant.glb', { x: pp.x, z: pp.z, rot: l.a, height: 1.1, tone: [0.8, 0.1] });
  }

  void anim; void renderer;
}

// 손에 드는 컵을 커피 컵 모델로 바꿈
export function upgradeCup(av) {
  load(D + 'cup-coffee.glb').then((src) => {
    if (!src) return;
    const cup = av.userData.cup;
    const o = src.clone(true);
    const box = new THREE.Box3().setFromObject(o);
    const size = box.getSize(new THREE.Vector3());
    const s = 0.16 / Math.max(size.x, size.z);
    o.scale.setScalar(s);
    const c = box.getCenter(new THREE.Vector3());
    o.position.set(-c.x * s, -box.min.y * s - 0.07, -c.z * s);
    cup.children.forEach((ch) => { ch.visible = false; });
    cup.add(o);
  });
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
