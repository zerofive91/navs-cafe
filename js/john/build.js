// 요한복음 마을 모형 (2026-11 0단계): 처음 마을에 들어갈 때만 불러와 지음 (region.js의 dynamic import)
// 지금은 땅·길·호수와 요단강·올리브 숲, 빛의 광장(Z1: 가운데 빛, 빈 등잔 일곱, 벤치, 돌아가는 수레)과
// 나머지 구역 열한 곳의 빈 자리(둥근 돌 테두리와 이름 팻말)만. 사건 모형은 1차 MVP부터
import * as THREE from 'three';
import {
  JX, JZ, HALF_W, HALF_D, W, ZONES, LAKE, RIVER, RIVER_HALF, FORD, ROADS, groundH, WATER_Y, PLAZA, PLAZA_LIGHT, LAMPS, BENCHES, CART, SIGNPOSTS, TREES,
} from './layout.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...o });
const mat = {
  grass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  road: M(0xd8c39a, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  water: new THREE.MeshStandardMaterial({ color: 0x5fa6bf, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.82 }),
  stone: M(0xd8ccb2),
  stoneDark: M(0xbdb29c),
  clay: M(0xb9805a),
  wood: M(0x8a6748),
  trunk: M(0x7d6a55),
  olive: M(0x93a57d),
  fig: M(0x6f8f55),
  palm: M(0x7f9a4f),
};

function ground() {
  const SW = HALF_W * 2 + 120, SD = HALF_D * 2 + 120, step = 4;
  const geo = new THREE.PlaneGeometry(SW, SD, Math.round(SW / step), Math.round(SD / step));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const c = new THREE.Color(), dry = new THREE.Color(0xc2c58e), green = new THREE.Color(0x9fba7c), sand = new THREE.Color(0xd9cba3), hill = new THREE.Color(0xb2ad86);
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i);
    // 마을 끝 바깥은 언덕으로 솟아 둘러쌈 (걸어 나갈 수 없는 곳)
    const out = Math.max(0, Math.abs(u) - (HALF_W - 6), Math.abs(v) - (HALF_D - 6));
    const h = groundH(u, v) + (out > 0 ? Math.min(14, out * 0.35 + (out * out) * 0.01) : 0);
    pos.setY(i, h);
    // 북쪽(갈릴리)은 푸르고 남쪽(유대)은 마름. 물가는 모래빛
    const north = Math.max(0, Math.min(1, (-v + 40) / 220));
    c.copy(dry).lerp(green, north * 0.8);
    const lk = ((u - LAKE.u) / (LAKE.ru + 6)) ** 2 + ((v - LAKE.v) / (LAKE.rv + 6)) ** 2;
    if (lk < 1.25) c.lerp(sand, 0.6);
    if (out > 0) c.lerp(hill, Math.min(1, out / 10));
    const n = Math.sin(u * 0.13 + v * 0.07) * 0.03 + Math.sin(u * 0.41 - v * 0.33) * 0.02;
    col[i * 3] = c.r + n; col[i * 3 + 1] = c.g + n; col[i * 3 + 2] = c.b + n;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat.grass);
  m.position.set(JX, 0, JZ);
  m.receiveShadow = true;
  return m;
}
// 선을 따라 땅 위에 띠 (길·강)
function ribbon(pts, half, y, material, follow = true) {
  const P = [];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 2));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) P.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const posA = [], idx = [];
  P.forEach((p, i) => {
    const q = P[Math.min(P.length - 1, i + 1)], o = P[Math.max(0, i - 1)];
    let du = q[0] - o[0], dv = q[1] - o[1]; const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
    for (const s of [-1, 1]) {
      const u = p[0] - dv * half * s, v = p[1] + du * half * s;
      posA.push(JX + u, follow ? groundH(u, v) + y : y, JZ + v);
    }
    if (i) { const j = i * 2; idx.push(j - 2, j - 1, j, j - 1, j + 1, j); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return m;
}

// 이름 팻말이 있는 빈 자리: 둥근 돌 테두리 (돌은 한 번에 그림)
function zoneStones(root) {
  const list = [];
  for (const [id, z] of Object.entries(ZONES)) {
    if (id === 'light') continue;
    const n = Math.round(z.r * 1.6);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, u = z.u + Math.cos(a) * z.r, v = z.v + Math.sin(a) * z.r;
      if (Math.hypot(u - RIVER[3][0], v - RIVER[3][1]) < 8 && id === 'jordan') continue;
      list.push([u, v, a]);
    }
  }
  const geo = new THREE.DodecahedronGeometry(0.32, 0);
  const im = new THREE.InstancedMesh(geo, mat.stoneDark, list.length);
  const q = new THREE.Object3D();
  list.forEach(([u, v, a], i) => {
    q.position.set(JX + u, groundH(u, v) + 0.1, JZ + v); q.rotation.set(a, a * 2, 0); q.scale.set(1 + (i % 3) * 0.2, 0.7, 1); q.updateMatrix();
    im.setMatrixAt(i, q.matrix);
  });
  im.castShadow = true; im.receiveShadow = true;
  root.add(im);
}

function trees(root) {
  const kinds = {
    olive: { trunk: new THREE.CylinderGeometry(0.16, 0.26, 1, 6), top: new THREE.IcosahedronGeometry(1.5, 0), mt: mat.olive, sy: 0.7 },
    fig: { trunk: new THREE.CylinderGeometry(0.18, 0.28, 1, 6), top: new THREE.IcosahedronGeometry(1.8, 0), mt: mat.fig, sy: 0.75 },
    palm: { trunk: new THREE.CylinderGeometry(0.12, 0.2, 1, 6), top: new THREE.ConeGeometry(2.1, 1, 7, 1, true), mt: mat.palm, sy: 1 },
  };
  const q = new THREE.Object3D();
  for (const [kind, K] of Object.entries(kinds)) {
    const list = TREES.filter((t) => t.kind === kind);
    if (!list.length) continue;
    const tr = new THREE.InstancedMesh(K.trunk, mat.trunk, list.length), tp = new THREE.InstancedMesh(K.top, K.mt, list.length);
    list.forEach((t, i) => {
      const y = groundH(t.u, t.v), th = kind === 'palm' ? t.h : t.h * 0.45;
      q.position.set(t.x, y + th / 2, t.z); q.rotation.set(0, t.rot, kind === 'olive' ? 0.08 : 0); q.scale.set(1, th, 1); q.updateMatrix(); tr.setMatrixAt(i, q.matrix);
      if (kind === 'palm') { q.position.set(t.x, y + th + 0.1, t.z); q.rotation.set(Math.PI, t.rot, 0); q.scale.set(1, 1, 1); }
      else { const s = t.h / 4; q.position.set(t.x, y + th + 1.1 * s, t.z); q.rotation.set(0, t.rot, 0); q.scale.set(s * 1.2, s * K.sy, s * 1.2); }
      q.updateMatrix(); tp.setMatrixAt(i, q.matrix);
    });
    for (const m of [tr, tp]) { m.castShadow = true; m.receiveShadow = true; root.add(m); }
  }
}

// 빛의 광장: 돌바닥, 가운데 빛, 빈 등잔 일곱, 벤치
function plaza(root) {
  const y = PLAZA.y;
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA.R, PLAZA.R + 0.3, 0.3, 64), mat.stone);
  floor.position.set(PLAZA.x, y - 0.15, PLAZA.z); floor.receiveShadow = true; root.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.6, 64), new THREE.MeshStandardMaterial({ color: 0xd8c7a2, roughness: 0.9 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(PLAZA.x, y + 0.01, PLAZA.z); root.add(ring);
  // 가운데 빛 (요 1:4-5 "그 안에 생명이 있었으니 이 생명은 사람들의 빛이라"): 낮은 돌단 위 따뜻한 빛
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.5, 32), mat.stone);
  base.position.set(PLAZA_LIGHT.x, y + 0.25, PLAZA_LIGHT.z); base.castShadow = true; base.receiveShadow = true; root.add(base);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff1c8 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16), glowMat);
  orb.position.set(PLAZA_LIGHT.x, y + 1.6, PLAZA_LIGHT.z); root.add(orb);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe2a0, transparent: true, depthWrite: false, opacity: 0.85 }));
  halo.scale.set(4.2, 4.2, 1); halo.position.copy(orb.position); root.add(halo);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 12, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(PLAZA_LIGHT.x, y + 6.5, PLAZA_LIGHT.z); root.add(beam);
  const lamp = new THREE.PointLight(0xffd9a0, 6, 16, 1.6); lamp.position.set(PLAZA_LIGHT.x, y + 2, PLAZA_LIGHT.z); root.add(lamp);
  // 빈 등잔 일곱 (일곱 "나는…" 등불을 켤 자리)
  for (const l of LAMPS) {
    const g = new THREE.Group(); g.position.set(l.x, y, l.z);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.0, 12), mat.stone); ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat.clay); bowl.scale.set(1.3, 0.55, 1); bowl.position.y = 1.08; bowl.castShadow = true; g.add(bowl);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), mat.clay); spout.rotation.z = Math.PI / 2; spout.position.set(0.3, 1.1, 0); g.add(spout);
    g.rotation.y = -((l.a * Math.PI) / 180);
    root.add(g);
  }
  // 벤치 (앉기: 등잔 곁)
  for (const b of BENCHES) {
    const g = new THREE.Group(); g.position.set(b.x, y, b.z);
    g.rotation.y = Math.atan2(PLAZA_LIGHT.x - b.x, PLAZA_LIGHT.z - b.z);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.5), mat.wood); seat.position.y = 0.45; seat.castShadow = true; g.add(seat);
    for (const s of [-0.6, 0.6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.42), mat.stoneDark); leg.position.set(s, 0.22, 0); leg.castShadow = true; g.add(leg); }
    root.add(g);
  }
}
function glowTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,0.55)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildJohn({ scene, makeCart, makeSignpost }) {
  const root = new THREE.Group();
  root.name = 'john-village';
  root.userData.noCull = true; // 마을 전체를 한 덩어리로 (main.js farCull이 통째로 감추지 않게)
  root.add(ground());
  for (const r of ROADS) root.add(ribbon(r, 1.6, 0.05, mat.road));
  // 디베랴 바다 (갈릴리 호수)
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat.water);
  lake.rotation.x = -Math.PI / 2; lake.scale.set(LAKE.ru + 1, LAKE.rv + 1, 1);
  lake.position.set(JX + LAKE.u, WATER_Y, JZ + LAKE.v); root.add(lake);
  // 요단강과 여울 돌
  root.add(ribbon(RIVER, RIVER_HALF + 0.6, WATER_Y, mat.water, false));
  {
    const ford = RIVER.findIndex((p) => p[1] > FORD.v0) - 1, a = RIVER[ford], b = RIVER[ford + 1], at = [];
    for (let v = FORD.v0 + 1.5; v < FORD.v1 - 1; v += 1.6) for (const du of [-2.4, -0.8, 0.8, 2.4]) {
      const k = (v - a[1]) / (b[1] - a[1]); at.push([a[0] + (b[0] - a[0]) * k + du + Math.sin(v * 3 + du) * 0.3, v]);
    }
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.6, 0.25, 8), mat.stoneDark, at.length), q = new THREE.Object3D();
    at.forEach(([u, v], i) => { q.position.set(JX + u, WATER_Y + 0.06, JZ + v); q.updateMatrix(); im.setMatrixAt(i, q.matrix); });
    im.receiveShadow = true; root.add(im);
  }
  zoneStones(root);
  trees(root);
  plaza(root);
  // 돌아가는 수레와 이정표
  const cart = makeCart();
  cart.position.set(CART.x, PLAZA.y - 0.1, CART.z); cart.rotation.y = CART.rot;
  root.add(cart);
  // 구역 팻말 (빈 자리마다)
  for (const s of SIGNPOSTS) {
    const sp = s.id === 'light' ? makeSignpost('초보자 마을', '수레를 타고 돌아가요') : makeSignpost(s.name, `요한복음 ${s.ch}`);
    const u = s.x - JX, v = s.z - JZ;
    sp.position.set(s.x, s.id === 'light' ? PLAZA.y : groundH(u, v), s.z);
    const z = ZONES[s.id];
    sp.rotation.y = s.id === 'light' ? Math.atan2(PLAZA_LIGHT.x - s.x, PLAZA_LIGHT.z - s.z) : Math.atan2(-(z.x - s.x), -(z.z - s.z)) + Math.PI;
    root.add(sp);
  }
  scene.add(root);
  return { root, cart, at: W };
}
