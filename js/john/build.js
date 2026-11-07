// 요한복음 마을 모형 (2026-11 0단계): 처음 마을에 들어갈 때만 불러와 지음 (region.js의 dynamic import)
// 지금은 땅·길·호수와 요단강·올리브 숲, 빛의 광장(Z1: 가운데 빛, 빈 등잔 일곱, 벤치, 돌아가는 수레)과
// 나머지 구역 열한 곳의 빈 자리(둥근 돌 테두리와 이름 팻말)만. 사건 모형은 1차 MVP부터
import * as THREE from 'three';
import {
  JX, JZ, HALF_W, HALF_D, W, ZONES, LAKE, RIVER, RIVER_HALF, FORD, ROADS, groundH, WATER_Y, PLAZA, PLAZA_LIGHT, LAMPS, BENCHES, CART, SIGNPOSTS, TREES, BOARD,
  SP, HOUSE2, YARD3, YARD3_GAPS, HOUSE3, JARS, TABLE3, HOUSE10, ROOF_Y, STAIR10, LINE10, GATE7, POOL9,
  WELL6, HOUSES6, FIELD6, SYN4, SYN4_DOOR, HOUSE4, BOAT,
  HOLY7, STALLS7, STALL_KIND, PORTICO7, FOLD7, FOLD7_DOOR, POOL8, HOUSE12, TABLE12, PLOT12, TOMB12, noStone,
  UPPER10, UPPER10_DOOR, TABLE10, COURT11, COURT11_GATE, HOUSE11, PAVE11, HALL11, TOMB11, KIDRON, CROSSES11, OLIVES11, SHORE21,
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
  plaster: M(0xe3d6b8), plasterDark: M(0xcdbd9c), door: M(0x6e4f36), jar: M(0xcfc6b4, { roughness: 0.8 }),
  wine: new THREE.MeshStandardMaterial({ color: 0x7a1c2c, roughness: 0.2 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 1, side: THREE.DoubleSide }),
  bronze: M(0xb8864a, { roughness: 0.4, metalness: 0.6, emissive: 0x6a3a10, emissiveIntensity: 0.4 }),
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
      if (noStone(u, v)) continue; // 2차 나 모형(행각·못·집·무덤) 자리
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
  root.userData.plazaHalo = halo; // 일곱 등불이 다 켜지면 조금 커짐 (3차, js/john/passion.js)
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 12, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(PLAZA_LIGHT.x, y + 6.5, PLAZA_LIGHT.z); root.add(beam);
  const lamp = new THREE.PointLight(0xffd9a0, 6, 16, 1.6); lamp.position.set(PLAZA_LIGHT.x, y + 2, PLAZA_LIGHT.z); root.add(lamp);
  // 빈 등잔 일곱 (일곱 "나는…" 등불을 켤 자리). 불꽃은 그림(스프라이트)만: 등불을 받으면 보임 (조명 수는 그대로)
  const flames = [];
  for (const l of LAMPS) {
    const g = new THREE.Group(); g.position.set(l.x, y, l.z);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.0, 12), mat.stone); ped.position.y = 0.5; ped.castShadow = true; g.add(ped);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat.clay); bowl.scale.set(1.3, 0.55, 1); bowl.position.y = 1.08; bowl.castShadow = true; g.add(bowl);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), mat.clay); spout.rotation.z = Math.PI / 2; spout.position.set(0.3, 1.1, 0); g.add(spout);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc860, transparent: true, depthWrite: false })); fl.scale.set(0.9, 1.2, 1); fl.position.set(0.36, 1.32, 0); fl.visible = false; g.add(fl);
    flames.push(fl);
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
  return flames;
}
// 소식판 (채우기 E3 · 오늘의 마을): 사도 요한 곁 나무 판. 판 위 세 칸(이야기·부탁·머무름)에 한 일이 불로 켜지고, 셋을 다 하면 위에 작은 표지(깃발)가 달림
//   set(got, full): got는 오늘 한 일 글자('a'·'b'·'c'), full은 셋 다 했는지. 모양만 바꾸고 판정은 js/village/daily.js
function noticeBoard(root) {
  const g = new THREE.Group();
  g.position.set(BOARD.x, PLAZA.y, BOARD.z); g.rotation.y = BOARD.face;
  for (const sx of [-0.85, 0.85]) bx(g, 0.12, 2.0, 0.12, mat.wood, sx, 1.0, -0.05);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 300;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.15, 0.08), [mat.wood, mat.wood, mat.wood, mat.wood, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), mat.wood]);
  face.position.set(0, 1.35, 0); face.castShadow = true; g.add(face);
  const roof = bx(g, 2.35, 0.08, 0.7, mat.clay, 0, 2.05, 0.1); roof.rotation.x = 0.12;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.03), new THREE.MeshStandardMaterial({ color: 0xe8b84a, roughness: 0.7, emissive: 0x6a4a10, emissiveIntensity: 0.5 }));
  flag.position.set(0.35, 2.42, 0.1); flag.visible = false; g.add(flag);
  const pole = bx(g, 0.04, 0.5, 0.04, mat.wood, 0.12, 2.3, 0.1); pole.visible = false;
  const names = ['이야기', '부탁', '머무르기'];
  const draw = (got, full, skip = '') => {
    const c = cv.getContext('2d');
    c.fillStyle = '#e9d9b4'; c.fillRect(0, 0, 512, 300);
    c.strokeStyle = '#a9895a'; c.lineWidth = 8; c.strokeRect(6, 6, 500, 288);
    c.fillStyle = '#6a4a2a'; c.textAlign = 'center'; c.font = '700 40px "Noto Serif KR", serif'; c.fillText('오늘의 마을', 256, 62);
    for (let i = 0; i < 3; i++) {
      const x = 96 + i * 160, off = skip.includes('abc'[i]), done = !off && got.includes('abc'[i]);
      c.beginPath(); c.arc(x, 158, 46, 0, Math.PI * 2);
      c.fillStyle = done ? '#ffd57a' : '#f4ecd6'; c.fill(); c.lineWidth = 5; c.strokeStyle = done ? '#c88a22' : '#b9a67e'; c.stroke();
      c.fillStyle = done ? '#8a5a10' : '#b9a67e'; c.font = '700 54px system-ui, sans-serif'; c.fillText(off ? '–' : done ? '✓' : '·', x, 176);
      c.fillStyle = '#6a4a2a'; c.font = '600 28px "Noto Serif KR", serif'; c.fillText(names[i], x, 252);
      if (off) { c.font = '500 20px "Noto Serif KR", serif'; c.fillText('건너뜀', x, 282); }
    }
    tex.needsUpdate = true;
  };
  draw('', false, '');
  root.add(g);
  return { set(got, full, skip) { draw(got || '', !!full, skip || ''); flag.visible = pole.visible = !!full; } };
}

function glowTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,240,200,0.55)'); gr.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- 1차 MVP 사건 모형 (2026-11): Z1 등불 자리 · Z2 집과 무화과나무 · Z3 잔치 집 · Z10 니고데모 집 · Z7 성전 문 · Z9 실로암 ----------
const gy = (p) => groundH(p.u, p.v);
function bx(root, w, h, d, m, x, y, z, ry = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; root.add(o); return o;
}
// 평평한 지붕 돌집 (문은 face 쪽: 'w' | 'e' | 's' | 'n')
function stoneHouse(root, R, face = 'w', y0 = null) {
  const c = W(R.cu, R.cv), g = y0 ?? groundH(R.cu, R.cv);
  bx(root, R.w, R.h + 0.6, R.d, mat.plaster, c.x, g - 0.6 + (R.h + 0.6) / 2, c.z);
  bx(root, R.w + 0.3, 0.16, R.d + 0.3, mat.plasterDark, c.x, g + R.h + 0.02, c.z); // 지붕 가장자리
  const dw = 1.0, dh = 1.7;
  const dp = { w: [c.x - R.w / 2 - 0.02, c.z, Math.PI / 2], e: [c.x + R.w / 2 + 0.02, c.z, Math.PI / 2], s: [c.x, c.z + R.d / 2 + 0.02, 0], n: [c.x, c.z - R.d / 2 - 0.02, 0] }[face];
  bx(root, dw, dh, 0.06, mat.door, dp[0], g + dh / 2, dp[1], dp[2]);
  // 작은 창 둘
  for (const s of [-1, 1]) {
    const off = s * Math.min(R.w, R.d) * 0.3;
    if (face === 'w' || face === 'e') bx(root, 0.06, 0.4, 0.5, mat.door, dp[0], g + 1.7, dp[1] + off, 0);
    else bx(root, 0.5, 0.4, 0.06, mat.door, dp[0] + off, g + 1.7, dp[1], 0);
  }
}
function treeBig(root, p, h = 3.4, r = 2.4, color = mat.fig) {
  const y = gy(p);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, h, 7), mat.trunk); t.position.set(p.x, y + h / 2, p.z); t.castShadow = true; root.add(t);
  for (const [dx, dz, s] of [[0, 0, 1], [0.9, 0.4, 0.75], [-0.8, -0.5, 0.7], [0.2, -0.9, 0.65]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), color); c.position.set(p.x + dx, y + h + 0.3 * s, p.z + dz); c.scale.y = 0.62; c.castShadow = true; root.add(c);
  }
}
function oilLamp(root, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat.clay); bowl.scale.set(1.3, 0.5, 1); g.add(bowl);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), mat.clay); spout.rotation.z = Math.PI / 2; spout.position.set(0.2, 0.02, 0); g.add(spout);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc860, transparent: true, depthWrite: false })); fl.scale.set(0.5, 0.7, 1); fl.position.set(0.26, 0.14, 0); g.add(fl);
  g.userData.flame = fl;
  root.add(g); return g;
}
function mvp(root) {
  const parts = {};
  // Z1: 광장 끝 등불 자리 (작은 돌 받침 위 등잔)
  {
    const p = SP.lampAt, y = gy(p);
    bx(root, 0.5, 0.9, 0.5, mat.stone, p.x - 0.9, y + 0.45, p.z);
    parts.lampStand = oilLamp(root, p.x - 0.9, y + 0.98, p.z);
  }
  // Z2: 작은 집 (문은 강 쪽 서쪽), 문 앞 의자, 무화과나무, 따뜻한 빛 (처음엔 감춤)
  {
    stoneHouse(root, HOUSE2, 'w');
    const b = SP.bench2, y = gy(b);
    bx(root, 0.5, 0.12, 1.5, mat.wood, b.x, y + 0.45, b.z);
    for (const s of [-0.6, 0.6]) bx(root, 0.42, 0.45, 0.14, mat.stoneDark, b.x, y + 0.22, b.z + s);
    treeBig(root, SP.fig, 2.6, 2.3, mat.fig);
    const w = SP.warm, wy = gy(w);
    const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffe0a0, transparent: true, depthWrite: false, opacity: 0.9 }));
    orb.scale.set(2.6, 2.6, 1); orb.position.set(w.x, Math.max(wy, WATER_Y) + 1.5, w.z);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), new THREE.MeshBasicMaterial({ color: 0xfff6dc })); core.position.copy(orb.position);
    const g = new THREE.Group(); g.add(orb, core); g.visible = false; root.add(g);
    parts.warm = g;
  }
  // Z3 가나: 마당 담(동·남쪽 틈), 잔치 집, 돌항아리 여섯(물 높이), 식탁과 의자, 우물
  {
    const Y = YARD3, g0 = groundH(Y.cu, Y.cv), H = Y.h;
    const wallSeg = (u0, v0, u1, v1) => {
      const a = W(u0, v0), b = W(u1, v1), len = Math.hypot(b.x - a.x, b.z - a.z);
      bx(root, len + 0.4, H, 0.4, mat.stoneDark, (a.x + b.x) / 2, g0 + H / 2 - 0.1, (a.z + b.z) / 2, -Math.atan2(b.z - a.z, b.x - a.x));
    };
    const gE = YARD3_GAPS.east, gS = YARD3_GAPS.south;
    wallSeg(Y.u0, Y.v0, Y.u1, Y.v0); wallSeg(Y.u0, Y.v0, Y.u0, Y.v1);
    wallSeg(Y.u1, Y.v0, Y.u1, gE[0]); wallSeg(Y.u1, gE[1], Y.u1, Y.v1);
    wallSeg(Y.u0, Y.v1, gS[0], Y.v1); wallSeg(gS[1], Y.v1, Y.u1, Y.v1);
    stoneHouse(root, HOUSE3, 's');
    // 차양 (잔치 식탁 위 천)
    const T = TABLE3, tc = W(T.cu, T.cv), ty = groundH(T.cu, T.cv);
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.6), mat.cloth); aw.rotation.x = -Math.PI / 2 + 0.08; aw.position.set(tc.x, ty + 2.7, tc.z - 0.4); aw.receiveShadow = true; root.add(aw);
    for (const [dx, dz] of [[-3.9, -2.6], [3.9, -2.6], [-3.9, 1.9], [3.9, 1.9]]) bx(root, 0.1, 2.7, 0.1, mat.wood, tc.x + dx, ty + 1.35, tc.z + dz);
    bx(root, T.w, 0.08, T.d, mat.wood, tc.x, ty + T.h, tc.z);
    for (const dx of [-T.w / 2 + 0.3, T.w / 2 - 0.3]) bx(root, 0.12, T.h, T.d - 0.2, mat.door, tc.x + dx, ty + T.h / 2, tc.z);
    for (const dz of [1.2, -1.2]) bx(root, T.w, 0.1, 0.42, mat.wood, tc.x, ty + 0.42, tc.z + dz); // 긴 의자 둘
    // 식탁 위 떡과 잔
    parts.cups = [];
    for (let k = 0; k < 6; k++) {
      const x = tc.x - 2.4 + k * 0.95;
      const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 10), M(0xd8a85a)); loaf.position.set(x, ty + T.h + 0.08, tc.z - 0.15); root.add(loaf);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.14, 10), mat.clay); cup.position.set(x + 0.3, ty + T.h + 0.11, tc.z + 0.22); root.add(cup);
      const wine = new THREE.Mesh(new THREE.CircleGeometry(0.052, 10), mat.wine); wine.rotation.x = -Math.PI / 2; wine.position.set(x + 0.3, ty + T.h + 0.175, tc.z + 0.22); wine.visible = false; root.add(wine);
      parts.cups.push(wine);
    }
    // 돌항아리 여섯 (요 2:6 두 세 통 드는) — 물은 안쪽 원판이 아귀까지 차오름
    parts.jars = JARS.map((j) => {
      const y = gy(j), g = new THREE.Group(); g.position.set(j.x, y, j.z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.95, 16, 1, true), mat.jar); body.position.y = 0.475; body.castShadow = true; g.add(body);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 18), mat.jar); lip.rotation.x = Math.PI / 2; lip.position.y = 0.95; g.add(lip);
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.27, 16), mat.stoneDark); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.03; g.add(bottom);
      const wm = new THREE.MeshStandardMaterial({ color: 0x6fb2c8, roughness: 0.1, transparent: true, opacity: 0.9 });
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.31, 16), wm); water.rotation.x = -Math.PI / 2; water.position.y = 0.04; water.visible = false; g.add(water);
      root.add(g);
      return { g, water, wm, level: 0 };
    });
    // 우물 (돌 테두리, 물, 두레박 기둥)
    const w = SP.well, wy = gy(w);
    const ringM = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.75, 20, 1, true), mat.stoneDark); ringM.position.set(w.x, wy + 0.37, w.z); ringM.castShadow = true; root.add(ringM);
    const lipW = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 6, 20), mat.stone); lipW.rotation.x = Math.PI / 2; lipW.position.set(w.x, wy + 0.75, w.z); root.add(lipW);
    const ww = new THREE.Mesh(new THREE.CircleGeometry(0.72, 18), mat.water); ww.rotation.x = -Math.PI / 2; ww.position.set(w.x, wy + 0.45, w.z); root.add(ww);
    for (const s of [-1, 1]) bx(root, 0.1, 1.7, 0.1, mat.wood, w.x + s * 0.85, wy + 0.85, w.z);
    bx(root, 1.9, 0.08, 0.08, mat.wood, w.x, wy + 1.7, w.z);
  }
  // Z10 니고데모 집: 지붕 위 낮은 담·층계참, 바깥 계단, 빨랫줄과 천, 등잔 / 멀리 장대 위 놋뱀
  {
    const H = HOUSE10, st = STAIR10, g = ROOF_Y - H.h;
    stoneHouse(root, H, 'w', g);
    const c = W(H.cu, H.cv);
    // 지붕 담 (동쪽은 층계참 옆이 열림)
    const pm = mat.plasterDark, ph = 0.45;
    bx(root, H.w, ph, 0.2, pm, c.x, ROOF_Y + ph / 2, JZ + H.v0);
    bx(root, H.w, ph, 0.2, pm, c.x, ROOF_Y + ph / 2, JZ + H.v1);
    bx(root, 0.2, ph, H.d, pm, JX + H.u0, ROOF_Y + ph / 2, c.z);
    bx(root, 0.2, ph, H.v1 - st.vTop, pm, JX + H.u1, ROOF_Y + ph / 2, JZ + (st.vTop + H.v1) / 2);
    // 층계참과 계단 (돌 칸)
    const lw = st.u1 - st.u0, lx = JX + (st.u0 + st.u1) / 2;
    bx(root, lw, ROOF_Y - g + 0.1, st.vTop - H.v0, mat.plaster, lx, (ROOF_Y + g) / 2 - 0.05, JZ + (H.v0 + st.vTop) / 2);
    const n = 9;
    for (let k = 0; k < n; k++) {
      const v0 = st.vTop + ((st.vBot - st.vTop) * k) / n, v1 = st.vTop + ((st.vBot - st.vTop) * (k + 1)) / n;
      const top = ROOF_Y - ((ROOF_Y - groundH(lx - JX, (v0 + v1) / 2)) * (k + 0.5)) / n;
      const gb = groundH(lx - JX, (v0 + v1) / 2) - 0.3;
      bx(root, lw, top - gb, v1 - v0 + 0.02, mat.plaster, lx, (top + gb) / 2, JZ + (v0 + v1) / 2);
    }
    bx(root, 0.12, 0.9, st.vTop - H.v0, mat.wood, JX + st.u1, ROOF_Y + 0.45, JZ + (H.v0 + st.vTop) / 2); // 층계참 난간
    // 빨랫줄 기둥 둘, 줄, 바람에 날리는 천
    const [a, b] = LINE10;
    for (const q of LINE10) bx(root, 0.08, 1.9, 0.08, mat.wood, q.x, ROOF_Y + 0.95, q.z);
    bx(root, 0.03, 0.03, Math.hypot(b.x - a.x, b.z - a.z), mat.wood, a.x, ROOF_Y + 1.85, (a.z + b.z) / 2);
    const clothG = new THREE.Group(); clothG.position.set(a.x, ROOF_Y + 1.85, (a.z + b.z) / 2);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0, 8, 4), mat.cloth); cloth.position.y = -0.5; cloth.castShadow = true; clothG.add(cloth);
    root.add(clothG);
    parts.cloth = clothG; parts.clothMesh = cloth; parts.clothBase = Float32Array.from(cloth.geometry.attributes.position.array);
    // 지붕 등잔 (불빛)
    const l = SP.lamp10;
    bx(root, 0.3, 0.35, 0.3, mat.stone, l.x, ROOF_Y + 0.17, l.z);
    parts.roofLamp = oilLamp(root, l.x, ROOF_Y + 0.42, l.z);
    const pl = new THREE.PointLight(0xffc878, 0, 9, 1.6); pl.position.set(l.x, ROOF_Y + 0.9, l.z); root.add(pl); parts.roofLight = pl;
    // 앉을 깔개
    const mat10 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), M(0x9a5a4a)); mat10.position.set(SP.seat10.x, ROOF_Y + 0.02, SP.seat10.z); root.add(mat10);
    // 장대 위 놋뱀 (요 3:14, 민 21:9) — 멀리 언덕 위
    const p = SP.pole, py = gy(p);
    bx(root, 0.16, 7, 0.16, mat.wood, p.x, py + 3.5, p.z);
    bx(root, 1.4, 0.12, 0.12, mat.wood, p.x, py + 6.4, p.z);
    const snake = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.06, 64, 8, 2, 5), mat.bronze); snake.position.set(p.x, py + 6.2, p.z); snake.scale.set(1, 2.2, 1); root.add(snake);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd890, transparent: true, depthWrite: false, opacity: 0.0 }));
    halo.scale.set(5, 5, 1); halo.position.set(p.x, py + 6.3, p.z); root.add(halo); parts.poleGlow = halo;
  }
  // Z7 성전 남쪽 문: 기둥 둘, 들보, 양옆 담
  {
    const G = GATE7, y = gy(G.c);
    for (const s of [-1, 1]) { const q = G.at(s * 2.3, 0); bx(root, 0.9, 4.2, 0.9, mat.stone, q.x, y + 2.1, q.z, G.rot); }
    bx(root, 5.6, 0.6, 1.0, mat.stoneDark, G.c.x, y + 4.4, G.c.z, G.rot - Math.PI / 2);
    for (const s of [-1, 1]) { const q = G.at(s * 5.45, 0); bx(root, 5.3, 2.6, 0.6, mat.stoneDark, q.x, y + 1.3, q.z, G.rot - Math.PI / 2); }
  }
  // Z9 실로암 못: 둘레 단, 북쪽 계단 셋, 안쪽 한 칸, 물
  {
    const P = POOL9, O = P.out, c = W(O.cu, O.cv), b = P.base;
    // 둘레 단 (가운데 물자리는 비워 둠: 네 조각)
    const Wt = P.water, piece = (u0, u1, v0, v1, top) => { const q = W((u0 + u1) / 2, (v0 + v1) / 2); bx(root, u1 - u0, top - (b - 0.4), v1 - v0, mat.stone, q.x, (top + b - 0.4) / 2, q.z); };
    piece(O.u0, Wt.u0, O.v0, O.v1, P.top); piece(Wt.u1, O.u1, O.v0, O.v1, P.top);
    piece(Wt.u0, Wt.u1, Wt.v1, O.v1, P.top); piece(Wt.u0, Wt.u1, O.v0, P.inner.v0, P.top);
    piece(Wt.u0, Wt.u1, P.inner.v0, P.inner.v1, P.innerY);
    // 바깥 계단 셋
    for (let k = 0; k < 3; k++) { const v0 = P.steps.v0 + k * 0.867; piece(P.steps.u0, P.steps.u1, v0, v0 + 0.867, b + 0.3 * (k + 1)); }
    // 물 (바닥이 비치는 푸른 물)
    const wq = W(Wt.cu, Wt.cv);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(Wt.w, 0.1, Wt.d), mat.stoneDark); floor.position.set(wq.x, b - 0.4, wq.z); root.add(floor);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(Wt.w, Wt.d), mat.water); water.rotation.x = -Math.PI / 2; water.position.set(wq.x, P.waterY, wq.z); root.add(water);
    parts.pool = water;
    void c;
  }
  return parts;
}

// ---------- 2차 가 사건 모형 (2026-11): Z6 수가 우물·동네·희어진 밭 · Z4 가버나움 회당·신하의 집·물가 · 호수의 배 ----------
// 고기잡이배: 길이 약 7m (1세기 갈릴리 배), 노 넷. 배를 움직이는 것은 engine(js/john/galilee.js)
function fishingBoat() {
  const g = new THREE.Group(), hull = M(0x7a5a3c), dark = M(0x5a4030);
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.5, 0.18, 5.2), hull, 0, 0.12, 0);                               // 바닥
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.62, 5.4), hull, s * 0.78, 0.4, 0, 0, 0, s * 0.18); // 옆판
  for (const s of [-1, 1]) { const b = add(new THREE.ConeGeometry(0.8, 1.3, 4, 1), hull, 0, 0.36, s * 3.2, s * Math.PI / 2, Math.PI / 4, 0); b.scale.set(1, 1, 0.55); } // 이물·고물
  for (const z of [-1.2, 0.6]) add(new THREE.BoxGeometry(1.6, 0.08, 0.36), dark, 0, 0.5, z);   // 가로 앉는 판
  const oars = [];
  for (const s of [-1, 1]) for (const z of [-0.6, 1.0]) { const o = add(new THREE.BoxGeometry(0.07, 0.07, 3.0), dark, s * 1.5, 0.5, z, 0, s * 1.3, 0); oars.push(o); }
  g.userData.oars = oars;
  return g;
}
function stage2a(root, parts) {
  // Z6 야곱의 우물 (요 4:6, 4:11 "이 우물은 깊은데"): 넓은 돌 테두리와 나무 틀
  {
    const w = WELL6, y = gy(w);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.8, 22, 1, true), mat.stone); ring.position.set(w.x, y + 0.4, w.z); ring.castShadow = true; root.add(ring);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.12, 6, 22), mat.stoneDark); lip.rotation.x = Math.PI / 2; lip.position.set(w.x, y + 0.8, w.z); root.add(lip);
    const deep = new THREE.Mesh(new THREE.CircleGeometry(0.76, 18), M(0x2a3a44)); deep.rotation.x = -Math.PI / 2; deep.position.set(w.x, y + 0.3, w.z); root.add(deep);
    for (const s of [-1, 1]) bx(root, 0.12, 1.9, 0.12, mat.wood, w.x + s * 0.95, y + 0.95, w.z);
    bx(root, 2.1, 0.1, 0.1, mat.wood, w.x, y + 1.9, w.z);
    // 동네 집 둘 (문은 동쪽, 우물 쪽)
    for (const h of HOUSES6) stoneHouse(root, h, 'e');
    // 우물가 그늘: 올리브나무와 의자
    treeBig(root, SP.shade6, 2.8, 2.2, mat.olive);
    const b = SP.seat6, by = gy(b), face = Math.atan2(WELL6.x - b.x, WELL6.z - b.z);
    const bench = bx(root, 1.4, 0.12, 0.45, mat.wood, b.x, by + 0.45, b.z, face); void bench;
    for (const s of [-0.55, 0.55]) bx(root, 0.14, 0.45, 0.4, mat.stoneDark, b.x + Math.cos(face) * s, by + 0.22, b.z - Math.sin(face) * s, face);
    // 여인이 버려두고 간 물동이 (요 4:28) — 내려놓으면 보임
    const jar = new THREE.Group(); jar.position.set(SP.jar6.x, gy(SP.jar6), SP.jar6.z);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), mat.clay); body.scale.set(1, 1.15, 1); body.position.y = 0.28; jar.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.16, 12), mat.clay); neck.position.y = 0.58; jar.add(neck);
    jar.visible = false; root.add(jar); parts.jar6 = jar;
    // 희어진 밭 (요 4:35): 엷은 금빛 이삭 (가늘고 낮은 원뿔을 한 번에)
    const F = FIELD6, list = [];
    for (let v = F.v0 + 0.3; v < F.v1; v += 0.55) for (let u = F.u0 + 0.3; u < F.u1; u += 0.55) list.push([u + Math.sin(v * 7.1 + u) * 0.14, v + Math.cos(u * 5.3) * 0.14]);
    const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 0.85, 4), M(0xefe4bc, { roughness: 1 }), list.length), q = new THREE.Object3D();
    list.forEach(([u, v], i) => { q.position.set(JX + u, groundH(u, v) + 0.42, JZ + v); q.rotation.set(Math.sin(u * 3) * 0.12, u * 2, Math.cos(v * 3) * 0.12); q.scale.setScalar(0.85 + ((i * 37) % 10) / 30); q.updateMatrix(); im.setMatrixAt(i, q.matrix); });
    im.receiveShadow = true; root.add(im); parts.field6 = im;
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.d), M(0xcdb98a)); soil.rotation.x = -Math.PI / 2; soil.position.set(JX + F.cu, groundH(F.cu, F.cv) + 0.04, JZ + F.cv); root.add(soil);
  }
  // Z4 가버나움 회당: 검은 현무암 돌담(지붕 없이), 남쪽 문, 안쪽 돌 의자, 기둥 넷
  {
    const R = SYN4, y = groundH(R.cu, R.cv), h = R.h, t = 0.4, m = M(0x8a8478);
    const seg = (u0, v0, u1, v1) => { const a = W(u0, v0), b = W(u1, v1), len = Math.hypot(b.x - a.x, b.z - a.z); bx(root, len + t, h, t, m, (a.x + b.x) / 2, y + h / 2 - 0.1, (a.z + b.z) / 2, -Math.atan2(b.z - a.z, b.x - a.x)); };
    seg(R.u0, R.v0, R.u1, R.v0); seg(R.u0, R.v0, R.u0, R.v1); seg(R.u1, R.v0, R.u1, R.v1);
    seg(R.u0, R.v1, SYN4_DOOR[0], R.v1); seg(SYN4_DOOR[1], R.v1, R.u1, R.v1);
    const c = W(R.cu, R.cv);
    const fl = new THREE.Mesh(new THREE.BoxGeometry(R.w, 0.06, R.d), mat.stone); fl.position.set(c.x, y + 0.02, c.z); fl.receiveShadow = true; root.add(fl);
    bx(root, SYN4_DOOR[1] - SYN4_DOOR[0] + 0.8, 0.4, 0.6, mat.stoneDark, JX + (SYN4_DOOR[0] + SYN4_DOOR[1]) / 2, y + h + 0.1, JZ + R.v1); // 문 위 들보
    for (const s of [-1, 1]) bx(root, 0.4, 0.42, R.d - 2.2, mat.stoneDark, JX + (s < 0 ? R.u0 + 0.5 : R.u1 - 0.5), y + 0.21, c.z); // 동·서 벽 돌 의자
    for (const [du, dv] of [[-2.6, -1.6], [2.6, -1.6], [-2.6, 2.2], [2.6, 2.2]]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, h + 0.3, 10), mat.stone); col.position.set(c.x + du, y + (h + 0.3) / 2, c.z + dv); col.castShadow = true; root.add(col); }
    // 두루마리 읽는 단 (북쪽 벽 곁)
    bx(root, 1.2, 0.8, 0.6, mat.wood, c.x, y + 0.4, JZ + R.v0 + 0.7);
  }
  // 왕의 신하의 집 (문은 북쪽 길 쪽), 곁 의자
  {
    stoneHouse(root, HOUSE4, 'n');
    const b = SP.seat4, by = gy(b);
    bx(root, 0.45, 0.12, 1.4, mat.wood, b.x, by + 0.45, b.z);
    for (const s of [-0.55, 0.55]) bx(root, 0.4, 0.45, 0.14, mat.stoneDark, b.x, by + 0.22, b.z + s);
  }
  // 물가 둘 (벳새다 북쪽 · 가버나움): 나무 선창. 움직이는 배 하나와 가버나움에 매어 둔 배 하나 (기획서 2장 "배 두 척")
  {
    const pier = (from, to) => {
      const a = from, b = to, len = Math.hypot(b.x - a.x, b.z - a.z), ry = Math.atan2(b.x - a.x, b.z - a.z);
      const y = Math.max(gy(a), WATER_Y) + 0.12;
      const deck = bx(root, 1.4, 0.1, len, mat.wood, (a.x + b.x) / 2, y, (a.z + b.z) / 2, ry); void deck;
      for (let k = 0.15; k <= 1; k += 0.28) for (const s of [-0.6, 0.6]) bx(root, 0.12, 1.2, 0.12, mat.door, a.x + (b.x - a.x) * k + Math.cos(ry) * s, WATER_Y - 0.3, a.z + (b.z - a.z) * k - Math.sin(ry) * s);
    };
    const r = BOAT.route;
    pier(BOAT.dockE, { x: (BOAT.dockE.x + r[0].x) / 2, z: (BOAT.dockE.z + r[0].z) / 2 });
    pier(BOAT.dockW, { x: (BOAT.dockW.x + r[r.length - 1].x) / 2 - 1.2, z: (BOAT.dockW.z + r[r.length - 1].z) / 2 - 1.6 });
    const boat = fishingBoat(); boat.position.set(r[0].x, WATER_Y + 0.05, r[0].z); boat.rotation.y = Math.atan2(r[1].x - r[0].x, r[1].z - r[0].z); root.add(boat); parts.boat = boat;
    const moored = fishingBoat(); const e = r[r.length - 1]; moored.position.set(e.x - 3.2, WATER_Y + 0.05, e.z - 3.4); moored.rotation.y = 2.3; root.add(moored);
  }
}

// ---------- 2차 나 사건 모형 (2026-11): Z7 성소·뜰 돌바닥·장사판·솔로몬 행각·양 우리 · Z8 베데스다 못과 행각 다섯 · Z12 베다니 집·잔치 마당·밭·굴 무덤 ----------
// 움직이는 것(장사판 parts.stalls, 돗자리 parts.mat8, 무덤 돌 parts.tombStone, 밀 parts.wheat, 양 parts.sheep)은 js/john/jerusalem.js가 맡음
const gold = M(0xd8b04a, { roughness: 0.45, metalness: 0.5 });
const colGeo = new THREE.CylinderGeometry(0.24, 0.27, 1, 10);
function column(root, x, y, z, h) {
  const c = new THREE.Mesh(colGeo, mat.stone); c.scale.y = h; c.position.set(x, y + h / 2, z); c.castShadow = true; c.receiveShadow = true; root.add(c);
  bx(root, 0.62, 0.2, 0.62, mat.stoneDark, x, y + 0.1, z); bx(root, 0.66, 0.22, 0.66, mat.stoneDark, x, y + h - 0.11, z);
}
function sheepMesh(wool = 0xf4efe4) {
  const g = new THREE.Group(), w = M(wool, { roughness: 1 }), d = M(0x3a3430, { roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), w); body.scale.set(0.95, 0.8, 1.35); body.position.y = 0.5; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), d); head.scale.set(0.85, 1, 1.2); head.position.set(0, 0.62, 0.44); g.add(head);
  for (const [x, z] of [[-0.13, 0.2], [0.13, 0.2], [-0.13, -0.2], [0.13, -0.2]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 5), d); l.position.set(x, 0.17, z); g.add(l); }
  return g;
}
function stage2b(root, parts) {
  const C7 = ZONES.temple;
  // Z7 성전 뜰 돌바닥 (땅을 따라 얇게, 길 띠보다 아래)
  {
    const geo = new THREE.RingGeometry(0.01, 14, 48, 14); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, groundH(C7.u + pos.getX(i), C7.v + pos.getZ(i)) + 0.03);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M(0xe2d6ba, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    m.position.set(JX + C7.u, 0, JZ + C7.v); m.receiveShadow = true; root.add(m);
  }
  // 성소: 기단 위 큰 돌집과 윗단, 금빛 띠, 남쪽(뜰 쪽) 큰 문과 기둥 넷
  {
    const H = HOLY7, c = W(H.cu, H.cv), g = groundH(H.cu, H.cv);
    bx(root, H.w + 1.4, 1.0, H.d + 1.4, mat.stoneDark, c.x, g + 0.1, c.z);
    bx(root, H.w, H.h, H.d, mat.stone, c.x, g + 0.6 + H.h / 2, c.z);
    bx(root, H.w + 0.2, 0.28, H.d + 0.2, gold, c.x, g + 0.6 + H.h, c.z);
    bx(root, H.w * 0.62, 2.4, H.d * 0.8, mat.stone, c.x, g + 0.6 + H.h + 1.3, c.z);
    bx(root, H.w * 0.62 + 0.2, 0.22, H.d * 0.8 + 0.2, gold, c.x, g + 0.6 + H.h + 2.55, c.z);
    const fz = JZ + H.v1 + 0.04;
    bx(root, 2.6, 4.4, 0.1, mat.door, c.x, g + 0.6 + 2.2, fz);
    bx(root, 3.2, 0.3, 0.16, gold, c.x, g + 0.6 + 4.55, fz);
    for (const dx of [-4.4, -2.6, 2.6, 4.4]) column(root, c.x + dx, g + 0.6, fz + 0.12, H.h - 0.2);
  }
  // 장사판 넷 (요 2:14): 비둘기장, 돈 바꾸는 상 둘, 소와 양의 울
  parts.stalls = STALLS7.map((p, i) => {
    const k = STALL_KIND[i], y = gy(p), g = new THREE.Group(); g.position.set(p.x, y, p.z); g.rotation.y = 0.35 + i * 0.8;
    const add = (o, x, yy, z) => { o.position.set(x, yy, z); o.castShadow = true; g.add(o); return o; };
    const table = () => {
      add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.72), mat.wood), 0, 0.74, 0);
      for (const [x, z] of [[-0.66, -0.28], [0.66, -0.28], [-0.66, 0.28], [0.66, 0.28]]) add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.07), mat.door), x, 0.36, z);
    };
    if (k === 'money') {
      table();
      for (let j = 0; j < 5; j++) { const n = 2 + (j % 3); for (let q = 0; q < n; q++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 10), gold), -0.5 + j * 0.25, 0.79 + q * 0.02, -0.08 + (j % 2) * 0.16); }
      add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.24), mat.clay), 0.5, 0.88, 0.12); // 돈 궤
      add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mat.wood), 0, 0.21, 0.75); // 앉는 통
    } else if (k === 'dove') {
      table();
      const white = M(0xfafaf4);
      for (const [x, yy] of [[-0.4, 0.98], [0.35, 0.98], [0, 1.4]]) {
        const cage = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), new THREE.MeshStandardMaterial({ color: 0xb08a58, wireframe: true })), x, yy, 0);
        void cage; add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), white), x - 0.06, yy - 0.1, 0.02); add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), white), x + 0.1, yy - 0.12, -0.05);
      }
    } else {
      // 낮은 울 (말뚝과 가로대), 소 한 마리와 양 한 마리
      for (const [x, z] of [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]]) add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), mat.wood), x, 0.4, z);
      for (const z of [-0.8, 0.8]) add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.05), mat.wood), 0, 0.6, z);
      for (const x of [-1, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.6), mat.wood), x, 0.6, 0);
      const ox = M(0x8a5a3a);
      add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.0), ox), -0.35, 0.62, 0);
      add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.34), ox), -0.35, 0.78, 0.6);
      for (const [x, z] of [[-0.52, 0.36], [-0.18, 0.36], [-0.52, -0.36], [-0.18, -0.36]]) add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.09), ox), x, 0.2, z);
      const sh = sheepMesh(); sh.position.set(0.5, 0, 0.1); sh.rotation.y = 2.4; g.add(sh);
    }
    root.add(g);
    return { g, k, p };
  });
  // 솔로몬 행각 (요 10:23): 기둥 두 줄과 지붕
  {
    const P = PORTICO7;
    for (const u of P.us) for (const v of P.vs) { const q = W(u, v); column(root, q.x, groundH(u, v), q.z, P.h); }
    const u0 = Math.min(...P.us) - 0.7, u1 = Math.max(...P.us) + 0.7, v0 = P.vs[0] - 0.9, v1 = P.vs[P.vs.length - 1] + 0.9;
    const c = W((u0 + u1) / 2, (v0 + v1) / 2), y = Math.max(...P.us.flatMap((u) => P.vs.map((v) => groundH(u, v))));
    bx(root, u1 - u0, 0.36, v1 - v0, mat.stone, c.x, y + P.h + 0.18, c.z);
    bx(root, u1 - u0 + 0.2, 0.14, v1 - v0 + 0.2, mat.stoneDark, c.x, y + P.h + 0.42, c.z);
  }
  // 뜰 물동이 (초막절, 요 7:37)
  {
    const p = SP.jar7, y = gy(p);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.9, 16), mat.jar); b.position.set(p.x, y + 0.45, p.z); b.castShadow = true; root.add(b);
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), mat.water); w.rotation.x = -Math.PI / 2; w.position.set(p.x, y + 0.86, p.z); root.add(w);
  }
  // 양 우리 (요 10:1-9): 돌담, 남쪽 문(양의 문) 기둥, 짚 바닥, 양 여섯
  {
    const F = FOLD7, g0 = groundH(F.cu, F.cv), h = F.h;
    const seg = (u0, v0, u1, v1) => { const a = W(u0, v0), b = W(u1, v1), len = Math.hypot(b.x - a.x, b.z - a.z); bx(root, len + 0.36, h, 0.36, mat.stoneDark, (a.x + b.x) / 2, g0 + h / 2 - 0.1, (a.z + b.z) / 2, -Math.atan2(b.z - a.z, b.x - a.x)); };
    seg(F.u0, F.v0, F.u1, F.v0); seg(F.u0, F.v0, F.u0, F.v1); seg(F.u1, F.v0, F.u1, F.v1);
    seg(F.u0, F.v1, FOLD7_DOOR[0], F.v1); seg(FOLD7_DOOR[1], F.v1, F.u1, F.v1);
    for (const u of FOLD7_DOOR) { const q = W(u, F.v1); bx(root, 0.3, 1.9, 0.3, mat.wood, q.x, g0 + 0.95, q.z); }
    const q = W((FOLD7_DOOR[0] + FOLD7_DOOR[1]) / 2, F.v1); bx(root, 2.5, 0.14, 0.2, mat.wood, q.x, g0 + 1.9, q.z);
    const c = W(F.cu, F.cv);
    const straw = new THREE.Mesh(new THREE.PlaneGeometry(F.w - 0.4, F.d - 0.4), M(0xd6c48c, { roughness: 1 })); straw.rotation.x = -Math.PI / 2; straw.position.set(c.x, g0 + 0.04, c.z); straw.receiveShadow = true; root.add(straw);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.9), M(0x8a6a4a)); rug.position.set(SP.foldSeat.x, gy(SP.foldSeat) + 0.05, SP.foldSeat.z); root.add(rug);
    parts.sheep = [];
    for (let k = 0; k < 6; k++) {
      const s = sheepMesh(k === 4 ? 0xe8ddc8 : 0xf4efe4);
      const u = F.u0 + 1 + ((k * 2.7) % (F.w - 2)), v = F.v0 + 1 + ((k * 1.9) % (F.d - 3));
      const p = W(u, v); s.position.set(p.x, groundH(u, v), p.z); s.rotation.y = k * 1.3;
      root.add(s); parts.sheep.push(s);
    }
  }
  // Z8 베데스다: 못 둘레 돌단, 두 못 사이 둑, 물, 행각 다섯(둘레 넷 + 둑 위 하나)의 기둥과 지붕, 돗자리
  {
    const P = POOL8, b = P.base, R = P.rim, Wt = P.water;
    const slab = (u0, u1, v0, v1, top, m = mat.stone) => { const q = W((u0 + u1) / 2, (v0 + v1) / 2); bx(root, u1 - u0, top - (b - 1.0), v1 - v0, m, q.x, (top + b - 1.0) / 2, q.z); };
    slab(R.u0, R.u1, R.v0, Wt.v0, b + 0.35); slab(R.u0, R.u1, Wt.v1, R.v1, b + 0.35);
    slab(R.u0, Wt.u0, Wt.v0, Wt.v1, b + 0.35); slab(Wt.u1, R.u1, Wt.v0, Wt.v1, b + 0.35);
    slab(Wt.u0, Wt.u1, P.mid - 0.45, P.mid + 0.45, b + 0.22, mat.stoneDark);
    const fl = W(Wt.cu, Wt.cv); bx(root, Wt.w, 0.1, Wt.d, mat.stoneDark, fl.x, b - 1.0, fl.z);
    for (const [v0, v1] of [[Wt.v0, P.mid - 0.45], [P.mid + 0.45, Wt.v1]]) {
      const q = W(Wt.cu, (v0 + v1) / 2), w = new THREE.Mesh(new THREE.PlaneGeometry(Wt.w, v1 - v0), mat.water);
      w.rotation.x = -Math.PI / 2; w.position.set(q.x, b - 0.28, q.z); root.add(w);
    }
    const top = b + 3.5;
    for (const c of P.cols) { const y = groundH(c.u, c.v); column(root, c.x, y, c.z, top - y); }
    for (const c of P.midCols) column(root, c.x, b + 0.22, c.z, top - b - 0.22);
    const u0 = -22.3, u1 = -5.7, v0 = 95.2, v1 = 107.8, roof = (a0, a1, c0, c1) => { const q = W((a0 + a1) / 2, (c0 + c1) / 2); bx(root, a1 - a0, 0.3, c1 - c0, mat.stone, q.x, top + 0.15, q.z); };
    roof(u0 - 0.6, u1 + 0.6, v0 - 0.7, v0 + 1.9); roof(u0 - 0.6, u1 + 0.6, v1 - 1.9, v1 + 0.7);
    roof(u0 - 0.6, u0 + 1.9, v0 + 1.9, v1 - 1.9); roof(u1 - 1.9, u1 + 0.6, v0 + 1.9, v1 - 1.9);
    roof(Wt.u0, Wt.u1, P.mid - 0.7, P.mid + 0.7);
    // 병자들의 깔개 (요 5:3), 내 돗자리
    for (const p of SP.pts) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 1.7), M(0xa08a64)); m.position.set(p.x, gy(p) + 0.03, p.z); m.rotation.y = Math.atan2(SP.water8.x - p.x, SP.water8.z - p.z) + Math.PI / 2; root.add(m); }
    const mat8 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.75), M(0xb09060)); mat8.position.set(SP.mat8.x, gy(SP.mat8) + 0.04, SP.mat8.z); mat8.rotation.y = Math.PI / 2; root.add(mat8);
    parts.mat8 = mat8;
  }
  // Z12 베다니: 마르다와 마리아의 집, 마당 잔치 식탁(차양, 긴 의자 둘), 집 서쪽 벽 의자, 밭과 밀, 굴 무덤과 돌
  {
    stoneHouse(root, HOUSE12, 's');
    const T = TABLE12, tc = W(T.cu, T.cv), ty = groundH(T.cu, T.cv);
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.4), mat.cloth); aw.rotation.x = -Math.PI / 2 + 0.06; aw.position.set(tc.x, ty + 2.6, tc.z); aw.receiveShadow = true; root.add(aw);
    for (const [dx, dz] of [[-3.7, -2.1], [3.7, -2.1], [-3.7, 2.1], [3.7, 2.1]]) bx(root, 0.1, 2.6, 0.1, mat.wood, tc.x + dx, ty + 1.3, tc.z + dz);
    bx(root, T.w, 0.08, T.d, mat.wood, tc.x, ty + T.h, tc.z);
    for (const dx of [-T.w / 2 + 0.3, T.w / 2 - 0.3]) bx(root, 0.12, T.h, T.d - 0.2, mat.door, tc.x + dx, ty + T.h / 2, tc.z);
    for (const dz of [-1.25, 1.25]) bx(root, T.w, 0.1, 0.42, mat.wood, tc.x, ty + 0.42, tc.z + dz);
    for (let k = 0; k < 5; k++) {
      const x = tc.x - 2.2 + k * 1.1;
      const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 10), M(0xd8a85a)); loaf.position.set(x, ty + T.h + 0.08, tc.z - 0.15); root.add(loaf);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.14, 10), mat.clay); cup.position.set(x + 0.3, ty + T.h + 0.11, tc.z + 0.2); root.add(cup);
    }
    const mb = SP.mary12, my = gy(mb);
    bx(root, 0.45, 0.12, 1.4, mat.wood, mb.x, my + 0.45, mb.z);
    for (const s of [-0.55, 0.55]) bx(root, 0.4, 0.45, 0.14, mat.stoneDark, mb.x, my + 0.22, mb.z + s);
    // 밭 (요 12:24 한 알의 밀): 흙과, 심으면 자라는 밀 (처음엔 감춤)
    const Pl = PLOT12, pc = W(Pl.cu, Pl.cv);
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(Pl.w, Pl.d), M(0x9a7a52, { roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.set(pc.x, groundH(Pl.cu, Pl.cv) + 0.04, pc.z); soil.receiveShadow = true; root.add(soil);
    const wheat = new THREE.Group(), stalk = M(0xc8b060), head = M(0xe2c36a);
    for (let k = 0; k < 14; k++) {
      const a = k * 2.4, r = 0.12 + (k % 5) * 0.09, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.75 + (k % 4) * 0.12;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, h, 4), stalk); s.position.set(x, h / 2, z); s.rotation.set(Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12); wheat.add(s);
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 5), head); e.position.set(x * 1.1, h + 0.06, z * 1.1); wheat.add(e);
    }
    wheat.position.set(SP.plantAt.x, gy(SP.plantAt) + 0.02, SP.plantAt.z); wheat.visible = false; root.add(wheat); parts.wheat = wheat;
    // 굴 무덤: 바위 언덕, 어두운 굴 어귀, 막아 둔 둥근 돌 (요 11:38)
    const tb = TOMB12, rp = tb.rock, ry = gy(rp);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(tb.r * 1.08, 1), M(0xbcae92, { flatShading: true })); rock.scale.set(1, 0.72, 1); rock.position.set(rp.x, ry + 0.6, rp.z); rock.castShadow = true; rock.receiveShadow = true; root.add(rock);
    const dir = { x: tb.mouth.x - rp.x, z: tb.mouth.z - rp.z }, ya = Math.atan2(dir.x, dir.z);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), new THREE.MeshBasicMaterial({ color: 0x1a1612 })); mouth.position.set(tb.mouth.x, gy(tb.mouth) + 0.95, tb.mouth.z); mouth.rotation.y = ya; root.add(mouth);
    const stone = new THREE.Group(), disc = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.34, 20), M(0xa89a80, { flatShading: true }));
    disc.rotation.x = Math.PI / 2; disc.castShadow = true; stone.add(disc);
    stone.position.set(tb.stone.x, gy(tb.stone) + 1.08, tb.stone.z); stone.rotation.y = ya; root.add(stone);
    parts.tombStone = stone; parts.tombDisc = disc;
  }
}

// ---------- 3차 사건 모형 (2026-11): Z10 다락방·포도나무 · Z11 기드론·감람나무 동산·대제사장 뜰·관정·골고다·동산 무덤 · Z4 바닷가 아침 ----------
// 조명은 하나도 더하지 않음 (숯불·등잔·따뜻한 빛은 스프라이트). 움직이는 것(닫히는 문, 대야, 무덤 돌, 개켜진 수건, 그물과 고기, 어린 양)은 js/john/passion.js
const WALLS3 = []; // 다락방·대제사장의 집 뜰 담: 안에 들어가 걷는 곳이라 카메라를 가리면 흐리게 (main.js 가림 물체)
function wallLine(root, a, b, h, y0, m = mat.stoneDark, t = 0.36) {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const o = bx(root, len + t, h, t, m, (a.x + b.x) / 2, y0 + h / 2 - 0.1, (a.z + b.z) / 2, -Math.atan2(b.z - a.z, b.x - a.x));
  WALLS3.push(o); return o;
}
function flameSprite(root, x, y, z, s = 0.6, color = 0xffb860) {
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false }));
  f.scale.set(s, s * 1.3, 1); f.position.set(x, y, z); root.add(f); return f;
}
function firePit(root, p) {
  const y = gy(p), g = new THREE.Group(); g.position.set(p.x, y, p.z); root.add(g);
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mat.stoneDark); st.position.set(Math.cos(a) * 0.48, 0.09, Math.sin(a) * 0.48); st.castShadow = true; g.add(st); }
  const coal = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.1, 14), new THREE.MeshStandardMaterial({ color: 0x3a2018, emissive: 0xc04010, emissiveIntensity: 0.6, roughness: 1 }));
  coal.position.y = 0.06; g.add(coal);
  const f = flameSprite(g, 0, 0.42, 0, 0.75, 0xff9a48);
  return { g, flame: f };
}
function stage3(root, parts) {
  WALLS3.length = 0; // 불러오기를 다시 해 마을을 새로 지어도 가림 물체가 겹쳐 들어가지 않게
  // Z10 다락방: 돌담(지붕 없음, 위에 들보 넷), 남쪽 문과 닫히는 문짝, 긴 식탁·긴 의자 둘·떡과 잔, 대야와 물항아리, 식탁 머리 등잔
  {
    const U = UPPER10, g0 = groundH(U.cu, U.cv), h = U.h, d = UPPER10_DOOR, P = (u, v) => W(u, v);
    wallLine(root, P(U.u0, U.v0), P(U.u1, U.v0), h, g0, mat.plaster, 0.4); wallLine(root, P(U.u0, U.v0), P(U.u0, U.v1), h, g0, mat.plaster, 0.4);
    wallLine(root, P(U.u1, U.v0), P(U.u1, U.v1), h, g0, mat.plaster, 0.4);
    wallLine(root, P(U.u0, U.v1), P(d[0], U.v1), h, g0, mat.plaster, 0.4); wallLine(root, P(d[1], U.v1), P(U.u1, U.v1), h, g0, mat.plaster, 0.4);
    for (const u of d) { const q = P(u, U.v1); bx(root, 0.3, h + 0.3, 0.46, mat.plasterDark, q.x, g0 + (h + 0.3) / 2 - 0.1, q.z); }
    { const q = P((d[0] + d[1]) / 2, U.v1); bx(root, d[1] - d[0] + 0.6, 0.3, 0.46, mat.plasterDark, q.x, g0 + h + 0.1, q.z); }
    for (let k = 0; k < 4; k++) { const q = P(U.u0 + 1.4 + k * 2.4, U.cv); bx(root, 0.22, 0.2, U.d + 0.4, mat.wood, q.x, g0 + h + 0.3, q.z); } // 들보 (안이 보이게 지붕은 덮지 않음)
    const door = new THREE.Group(); { const q = P((d[0] + d[1]) / 2, U.v1); door.position.set(q.x, g0, q.z); }
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(d[1] - d[0], 2.1, 0.1), mat.door); leaf.position.y = 1.05; leaf.castShadow = true; door.add(leaf);
    for (const yy of [0.5, 1.6]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(d[1] - d[0] - 0.1, 0.1, 0.14), mat.wood); bar.position.set(0, yy, -0.04); door.add(bar); }
    door.visible = false; root.add(door); parts.upDoor = door;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(U.w - 0.4, U.d - 0.4), M(0xcdb998, { roughness: 1 })); floor.rotation.x = -Math.PI / 2; { const q = P(U.cu, U.cv); floor.position.set(q.x, g0 + 0.03, q.z); } floor.receiveShadow = true; root.add(floor);
    const T = TABLE10, tc = W(T.cu, T.cv), ty = groundH(T.cu, T.cv);
    bx(root, T.w, 0.08, T.d, mat.wood, tc.x, ty + T.h, tc.z);
    for (const dx of [-T.w / 2 + 0.3, T.w / 2 - 0.3]) bx(root, 0.12, T.h, T.d - 0.2, mat.door, tc.x + dx, ty + T.h / 2, tc.z);
    for (const dz of [-0.95, 0.95]) bx(root, T.w, 0.1, 0.42, mat.wood, tc.x, ty + 0.42, tc.z + dz);
    for (let k = 0; k < 6; k++) {
      const x = tc.x - 2.5 + k * 1.0;
      const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 10), M(0xd8a85a)); loaf.position.set(x, ty + T.h + 0.08, tc.z - 0.15); root.add(loaf);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.14, 10), mat.clay); cup.position.set(x + 0.3, ty + T.h + 0.11, tc.z + 0.22); root.add(cup);
    }
    const b = SP.basinAt, by = gy(b);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 0.16, 16), mat.clay); basin.position.set(b.x, by + 0.08, b.z); basin.castShadow = true; root.add(basin);
    const bw = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), mat.water); bw.rotation.x = -Math.PI / 2; bw.position.set(b.x, by + 0.15, b.z); root.add(bw);
    const towel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), M(0xf2ece0, { roughness: 1 })); towel.position.set(b.x + 0.55, by + 0.03, b.z - 0.2); root.add(towel);
    parts.basin = [basin, bw, towel];
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.62, 14), mat.jar); jar.position.set(b.x - 0.2, by + 0.31, b.z + 0.62); jar.castShadow = true; root.add(jar);
    const l = SP.warmUp, ly = gy(l);
    bx(root, 0.32, 0.9, 0.32, mat.stone, l.x, ly + 0.45, l.z);
    parts.upLamp = oilLamp(root, l.x, ly + 0.98, l.z);
    // 문 밖 포도나무 시렁 (요 15:1-5): 기둥 둘, 가로대, 덩굴 잎과 송이
    const vp = SP.vine10, vy = gy(vp);
    for (const s of [-0.9, 0.9]) bx(root, 0.1, 2.1, 0.1, mat.wood, vp.x + s, vy + 1.05, vp.z);
    bx(root, 2.0, 0.08, 0.08, mat.wood, vp.x, vy + 2.08, vp.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.1, 6), mat.trunk); trunk.position.set(vp.x - 0.2, vy + 1.05, vp.z + 0.05); trunk.rotation.z = 0.12; root.add(trunk);
    const leafM = M(0x6f9a4a), grape = M(0x5a3060, { roughness: 0.5 });
    for (let k = 0; k < 9; k++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), leafM); lf.position.set(vp.x - 1 + k * 0.25, vy + 2.0 + Math.sin(k * 1.7) * 0.18, vp.z + Math.cos(k * 2.1) * 0.15); lf.scale.y = 0.6; lf.castShadow = true; root.add(lf); }
    for (const dx of [-0.55, 0.15, 0.65]) for (let k = 0; k < 6; k++) { const gr = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), grape); gr.position.set(vp.x + dx + (k % 2) * 0.07, vy + 1.75 - Math.floor(k / 2) * 0.08, vp.z + 0.1); root.add(gr); }
    const vs = SP.vineSeat; bx(root, 0.6, 0.36, 0.5, mat.stone, vs.x, gy(vs) + 0.12, vs.z);
  }
  // Z11 기드론 시내 (얕은 물, 걸어서 건넘) 와 감람나무 동산 (18:1): 감람나무 다섯, 그늘 돌
  {
    root.add(ribbon(KIDRON, 0.9, 0.06, mat.water));
    const st = [];
    for (let i = 1; i < KIDRON.length; i++) { const a = KIDRON[i - 1], b = KIDRON[i]; for (let k = 0; k < 4; k++) { const t = (k + 0.5) / 4; st.push([a[0] + (b[0] - a[0]) * t + Math.sin(i * 3 + k) * 1.2, a[1] + (b[1] - a[1]) * t]); } }
    const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.28, 0), mat.stoneDark, st.length), q = new THREE.Object3D();
    st.forEach(([u, v], i) => { q.position.set(JX + u, groundH(u, v) + 0.08, JZ + v); q.rotation.set(i, i * 2, 0); q.scale.set(1.2, 0.6, 1); q.updateMatrix(); im.setMatrixAt(i, q.matrix); });
    im.receiveShadow = true; root.add(im);
    for (const o of OLIVES11) treeBig(root, o, 2.3 + (o.u % 3) * 0.3, 2.0, mat.olive);
    const s = SP.olive11; bx(root, 0.7, 0.34, 0.5, mat.stone, s.x, gy(s) + 0.1, s.z);
  }
  // 대제사장 집 뜰 (18:15-18): 담과 북쪽 대문, 집, 숯불
  {
    const C = COURT11, g0 = groundH(C.cu, C.cv), h = C.h, gt = COURT11_GATE, P = (u, v) => W(u, v);
    wallLine(root, P(C.u0, C.v0), P(gt[0], C.v0), h, g0); wallLine(root, P(gt[1], C.v0), P(C.u1, C.v0), h, g0);
    wallLine(root, P(C.u0, C.v0), P(C.u0, C.v1), h, g0); wallLine(root, P(C.u1, C.v0), P(C.u1, C.v1), h, g0); wallLine(root, P(C.u0, C.v1), P(C.u1, C.v1), h, g0);
    for (const u of gt) { const q = P(u, C.v0); bx(root, 0.42, h + 0.7, 0.5, mat.stone, q.x, g0 + (h + 0.7) / 2 - 0.1, q.z); }
    { const q = P((gt[0] + gt[1]) / 2, C.v0); bx(root, gt[1] - gt[0] + 0.8, 0.3, 0.5, mat.stone, q.x, g0 + h + 0.55, q.z); }
    stoneHouse(root, HOUSE11, 'n');
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(C.w - 0.5, C.d - 0.5), M(0xd2c4a6, { roughness: 1 })); fl.rotation.x = -Math.PI / 2; { const q = P(C.cu, C.cv); fl.position.set(q.x, g0 + 0.03, q.z); } fl.receiveShadow = true; root.add(fl);
    parts.fire11 = firePit(root, SP.fire11);
  }
  // 관정 앞 돌을 깐 뜰 (19:13) 과 관정 앞면 (기둥 넷, 큰 문)
  {
    const Pv = PAVE11, c = W(Pv.cu, Pv.cv);
    const pv = new THREE.Mesh(new THREE.PlaneGeometry(Pv.w, Pv.d, 1, 1), M(0xe0d4b8, { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); pv.rotation.x = -Math.PI / 2; pv.position.set(c.x, groundH(Pv.cu, Pv.cv) + 0.04, c.z); pv.receiveShadow = true; root.add(pv);
    const H = HALL11, hc = W(H.cu, H.cv), hg = groundH(H.cu, H.cv);
    bx(root, H.w, H.h, H.d, mat.stone, hc.x, hg + H.h / 2, hc.z);
    bx(root, H.w + 0.4, 0.3, H.d + 0.4, mat.stoneDark, hc.x, hg + H.h + 0.1, hc.z);
    const fz = JZ + H.v0 - 0.04;
    bx(root, 2.2, 3.0, 0.1, mat.door, hc.x, hg + 1.5, fz);
    for (const dx of [-4.2, -2.4, 2.4, 4.2]) column(root, hc.x + dx, hg, fz - 0.5, H.h - 0.1);
    bx(root, H.w, 0.24, 1.3, mat.stoneDark, hc.x, hg + 0.12, fz - 0.6); // 낮은 단
  }
  // 골고다 (19:17-18): 작은 언덕 위 빈 십자가 셋 (예수님은 사람 모습 없이 따뜻한 빛으로만), 아래 돌
  {
    CROSSES11.forEach((p, i) => {
      const y = gy(p), H = i === 1 ? 3.4 : 2.8;
      bx(root, 0.2, H, 0.2, mat.wood, p.x, y + H / 2 - 0.2, p.z);
      bx(root, 1.5, 0.18, 0.18, mat.wood, p.x, y + H * 0.72, p.z);
    });
    const s = SP.crossSeat; bx(root, 0.7, 0.32, 0.5, mat.stone, s.x, gy(s) + 0.1, s.z);
  }
  // 동산의 새 무덤 (19:41, 20:1-18): 바위, 굴 어귀, 굴러 놓인 돌, 안에 개켜진 수건 (처음엔 감춤), 동산 의자와 풀꽃
  {
    const tb = TOMB11, rp = tb.rock, ry = gy(rp);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(tb.r * 1.08, 1), M(0xc4b698, { flatShading: true })); rock.scale.set(1, 0.74, 1); rock.position.set(rp.x, ry + 0.6, rp.z); rock.castShadow = true; rock.receiveShadow = true; root.add(rock);
    const ya = Math.atan2(tb.mouth.x - rp.x, tb.mouth.z - rp.z);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), new THREE.MeshBasicMaterial({ color: 0x1a1612 })); mouth.position.set(tb.mouth.x, gy(tb.mouth) + 0.9, tb.mouth.z); mouth.rotation.y = ya; root.add(mouth);
    const stone = new THREE.Group(), disc = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.32, 20), M(0xb0a284, { flatShading: true }));
    disc.rotation.x = Math.PI / 2; disc.castShadow = true; stone.add(disc);
    stone.position.set(tb.stone.x, gy(tb.stone) + 1.02, tb.stone.z); stone.rotation.y = ya; root.add(stone);
    parts.tomb11Stone = stone; parts.tomb11Disc = disc;
    // 개켜진 수건과 놓인 세마포 (20:6-7): 굴 어귀 바로 안쪽, 들여다보면 보임
    const ins = new THREE.Group(); { const q = { x: tb.mouth.x + (rp.x - tb.mouth.x) * 0.25, z: tb.mouth.z + (rp.z - tb.mouth.z) * 0.25 }; ins.position.set(q.x, gy(tb.mouth) + 0.42, q.z); ins.rotation.y = ya; }
    const linen = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 1.3), M(0xf4f0e6, { roughness: 1 })); linen.position.set(0, 0, -0.35); ins.add(linen);
    const folded = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.24), M(0xfaf6ec, { roughness: 1 })); folded.position.set(0.32, 0.03, 0.25); ins.add(folded);
    ins.visible = false; root.add(ins); parts.cloth11 = ins;
    const bs = SP.garden11, byy = gy(bs);
    const bench = new THREE.Group(); bench.position.set(bs.x, byy, bs.z); bench.rotation.y = Math.atan2(rp.x - bs.x, rp.z - bs.z) + Math.PI / 2;
    { const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.42), mat.wood); seat.position.y = 0.45; seat.castShadow = true; bench.add(seat); for (const s of [-0.55, 0.55]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.38), mat.stoneDark); leg.position.set(s, 0.22, 0); bench.add(leg); } }
    root.add(bench);
    const fl = [M(0xf4f0f8), M(0xf0c8d8), M(0xf8e08a)];
    for (let k = 0; k < 40; k++) { const a = k * 2.39, r = 2 + (k % 9) * 0.7, u = 18.5 + Math.cos(a) * r, v = 176.5 + Math.sin(a) * r * 0.6; if (Math.hypot(u - rp.u, v - rp.v) < tb.r + 0.6) continue; const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), fl[k % 3]); f.position.set(JX + u, groundH(u, v) + 0.12, JZ + v); root.add(f); }
    treeBig(root, S3(13.6, 178.6), 2.2, 1.7, mat.olive); treeBig(root, S3(27.4, 175), 2.0, 1.6, mat.fig);
  }
  // 디베랴 바닷가 (21장): 매어 둔 배, 물 위 그물과 고기 (던지면 보임), 숯불 위 생선과 떡, 어린 양 셋
  {
    const sb = SHORE21, boat = fishingBoat(); boat.position.set(sb.boat.x, WATER_Y + 0.05, sb.boat.z); boat.rotation.y = sb.dir; root.add(boat);
    parts.boat21 = boat;
    const net = new THREE.Group(); { const f = { x: Math.sin(sb.dir), z: Math.cos(sb.dir) }, r = { x: -f.z, z: f.x }; net.position.set(sb.boat.x + r.x * 1.8 + f.x * 0.8, WATER_Y + 0.04, sb.boat.z + r.z * 1.8 + f.z * 0.8); } // 배 오른편 물 위
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(1.4, 18), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, wireframe: true })); mesh.rotation.x = -Math.PI / 2; net.add(mesh);
    const fishM = M(0xb8c4c8, { roughness: 0.4, metalness: 0.3 }), fish = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), fishM, 60), q = new THREE.Object3D();
    for (let k = 0; k < 60; k++) { const a = k * 2.39, r = Math.sqrt(k / 60) * 1.2; q.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); q.rotation.y = a; q.scale.set(1, 0.5, 2.2); q.updateMatrix(); fish.setMatrixAt(k, q.matrix); }
    fish.count = 0; net.add(fish);
    net.visible = false; root.add(net); parts.net21 = { g: net, fish };
    const f = firePit(root, SP.fire21); parts.fire21 = f;
    for (let k = 0; k < 3; k++) { const fsh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 5), M(0xc8a070)); fsh.scale.set(1, 0.5, 2.4); fsh.position.set(-0.18 + k * 0.18, 0.16, 0); f.g.add(fsh); }
    const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.07, 10), M(0xd8a85a)); loaf.position.set(0.62, 0.05, 0.1); f.g.add(loaf);
    parts.lambs = SP.lambs.map((p, i) => { const s = sheepMesh(i === 1 ? 0xf0e8da : 0xf8f4ec); s.scale.setScalar(0.72); s.position.set(p.x, gy(p), p.z); s.rotation.y = i * 2.1; root.add(s); return s; });
  }
}
const S3 = (u, v) => ({ u, v, ...W(u, v) });

export function buildJohn({ scene, occluders, makeCart, makeSignpost }) {
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
  const flames = plaza(root);
  const board = noticeBoard(root);
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
  const parts = mvp(root);
  parts.plazaFlames = flames; parts.plazaHalo = root.userData.plazaHalo; parts.board = board;
  stage2a(root, parts);
  stage2b(root, parts);
  stage3(root, parts);
  occluders?.push(...WALLS3);
  scene.add(root);
  return { root, cart, at: W, parts };
}
