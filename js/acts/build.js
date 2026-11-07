// 사도행전 마을 모형 (2026-11 0-나 땅과 바다): 처음 마을에 들어갈 때만 불러와 지음 (등록부 js/villages/acts.js load, dynamic import)
// 땅·바다(지중해와 에게 바다 갈래)·섬 둘·길·빌립보 강, 다락방 광장(A1: 돌바닥·벤치·빈 다락방·여정 지도 탁자 자리·돌아가는 수레),
// 구역 열일곱 곳의 빈 자리(둥근 돌 테두리·이름 팻말·빈 집 두어 채), 항구 열한 곳(나무 부두와 매어 둔 배), 이정표 돌, 쉼 자리
// 조명은 더하지 않음 (폰 성능). 사건 모형은 1차부터
import * as THREE from 'three';
import {
  AX, AZ, HALF_W, HALF_D, W, SEA, AEGEAN, ISLANDS, WATER_Y, ZONES, SUBS, PORTS, ROADS, STREAM, groundH, PLAZA, CART, UPPER, PLAZA_BENCHES,
  MAP_TABLE, HOUSES, SIGNPOSTS, MILESTONES, REST_SPOTS, TREES, roadD,
} from './layout.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...o });
const mat = {
  grass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  road: M(0xdcc79e, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  water: new THREE.MeshStandardMaterial({ color: 0x3f8fb8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.86 }),
  stream: new THREE.MeshStandardMaterial({ color: 0x6aa9c2, roughness: 0.1, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  stone: M(0xd8ccb2), stoneDark: M(0xbdb29c), plaster: M(0xe6dabd), plasterDark: M(0xcdbd9c),
  marble: M(0xf0ece2, { roughness: 0.6 }), tile: M(0xb5523a), brick: M(0xb8735a), brickDark: M(0x8f5844),
  wood: M(0x8a6748), woodDark: M(0x6e4f36), door: M(0x6e4f36), trunk: M(0x7d6a55),
  olive: M(0x93a57d), cypress: M(0x4f6b44), palm: M(0x7f9a4f), sail: new THREE.MeshStandardMaterial({ color: 0xf1e7d0, roughness: 1, side: THREE.DoubleSide }),
};
const gy = (p) => groundH(p.u, p.v);
function bx(root, w, h, d, m, x, y, z, ry = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; root.add(o); return o;
}

// ---------- 땅: 동쪽(유대)은 마르고, 북쪽(소아시아)은 푸르고, 서쪽(그리스·로마)은 짙은 초록. 물가는 모래빛 ----------
function ground() {
  const SW = HALF_W * 2 + 120, SD = HALF_D * 2 + 120, step = 3;
  const geo = new THREE.PlaneGeometry(SW, SD, Math.round(SW / step), Math.round(SD / step));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const c = new THREE.Color(), dry = new THREE.Color(0xd2c690), green = new THREE.Color(0x9fba7c), deep = new THREE.Color(0x8aa96e), sand = new THREE.Color(0xe2d3a8), hill = new THREE.Color(0xb2ad86);
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i);
    const out = Math.max(0, Math.abs(u) - (HALF_W - 6), Math.abs(v) - (HALF_D - 6)); // 마을 끝 바깥은 언덕으로 솟음
    const h = groundH(u, v) + (out > 0 ? Math.min(14, out * 0.35 + out * out * 0.01) : 0);
    pos.setY(i, h);
    const east = Math.max(0, Math.min(1, (u - 40) / 120)), west = Math.max(0, Math.min(1, (-u - 40) / 110));
    c.copy(green).lerp(dry, east * 0.85).lerp(deep, west * 0.6);
    if (v > 110 && u > 20) c.lerp(dry, 0.5); // 가사 광야 길 (모래빛)
    if (h < 0.15) c.lerp(sand, Math.min(1, (0.15 - h) / 0.4)); // 물가 모래톱
    if (out > 0) c.lerp(hill, Math.min(1, out / 10));
    const n = Math.sin(u * 0.13 + v * 0.07) * 0.03 + Math.sin(u * 0.41 - v * 0.33) * 0.02;
    col[i * 3] = c.r + n; col[i * 3 + 1] = c.g + n; col[i * 3 + 2] = c.b + n;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat.grass);
  m.position.set(AX, 0, AZ); m.receiveShadow = true;
  return m;
}
// 바다: 바다 둘레를 덮는 물 판 하나 (땅이 물보다 높은 곳은 땅이 가림). 섬은 땅이 솟아 보임
function sea() {
  const u0 = Math.min(SEA.u - SEA.ru, AEGEAN.u - AEGEAN.ru) - 6, u1 = SEA.u + SEA.ru + 6;
  const v0 = AEGEAN.v - AEGEAN.rv - 6, v1 = SEA.v + SEA.rv + 6;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(u1 - u0, v1 - v0), mat.water);
  m.rotation.x = -Math.PI / 2; m.position.set(AX + (u0 + u1) / 2, WATER_Y, AZ + (v0 + v1) / 2);
  return m;
}
// 선을 따라 땅 위에 띠 (길·강)
function ribbon(pts, half, y, material) {
  const Pp = [];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 2));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) Pp.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const posA = [], idx = [];
  Pp.forEach((p, i) => {
    const q = Pp[Math.min(Pp.length - 1, i + 1)], o = Pp[Math.max(0, i - 1)];
    let du = q[0] - o[0], dv = q[1] - o[1]; const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
    for (const s of [-1, 1]) { const u = p[0] - dv * half * s, v = p[1] + du * half * s; posA.push(AX + u, groundH(u, v) + y, AZ + v); }
    if (i) { const j = i * 2; idx.push(j - 2, j - 1, j, j - 1, j + 1, j); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true;
  return m;
}
// 구역 빈 자리: 둥근 돌 테두리 (길이 지나는 곳·물 위는 뺌, 한 번에 그림)
function zoneStones(root) {
  const list = [];
  const ring = (z) => {
    const n = Math.round(z.r * 1.6);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, u = z.u + Math.cos(a) * z.r, v = z.v + Math.sin(a) * z.r;
      if (roadD(u, v) < 2.2 || groundH(u, v) < WATER_Y + 0.1) continue;
      if (HOUSES.some((h) => u > h.u0 - 0.8 && u < h.u1 + 0.8 && v > h.v0 - 0.8 && v < h.v1 + 0.8)) continue;
      list.push([u, v, a]);
    }
  };
  for (const [id, z] of Object.entries(ZONES)) if (id !== 'jerusalem') ring(z);
  for (const s of Object.values(SUBS)) ring(s);
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.32, 0), mat.stoneDark, list.length), q = new THREE.Object3D();
  list.forEach(([u, v, a], i) => { q.position.set(AX + u, groundH(u, v) + 0.1, AZ + v); q.rotation.set(a, a * 2, 0); q.scale.set(1 + (i % 3) * 0.2, 0.7, 1); q.updateMatrix(); im.setMatrixAt(i, q.matrix); });
  im.castShadow = true; im.receiveShadow = true; root.add(im);
}
function trees(root) {
  const kinds = {
    olive: { trunk: new THREE.CylinderGeometry(0.16, 0.26, 1, 6), top: new THREE.IcosahedronGeometry(1.5, 0), mt: mat.olive },
    cypress: { trunk: new THREE.CylinderGeometry(0.12, 0.18, 1, 6), top: new THREE.ConeGeometry(0.9, 1, 8), mt: mat.cypress },
    palm: { trunk: new THREE.CylinderGeometry(0.12, 0.2, 1, 6), top: new THREE.ConeGeometry(2.1, 1, 7, 1, true), mt: mat.palm },
  };
  const q = new THREE.Object3D();
  for (const [kind, K] of Object.entries(kinds)) {
    const list = TREES.filter((t) => t.kind === kind);
    if (!list.length) continue;
    const tr = new THREE.InstancedMesh(K.trunk, mat.trunk, list.length), tp = new THREE.InstancedMesh(K.top, K.mt, list.length);
    list.forEach((t, i) => {
      const y = groundH(t.u, t.v), th = kind === 'palm' ? t.h : kind === 'cypress' ? 0.9 : t.h * 0.45;
      q.position.set(t.x, y + th / 2, t.z); q.rotation.set(0, t.rot, kind === 'olive' ? 0.08 : 0); q.scale.set(1, th, 1); q.updateMatrix(); tr.setMatrixAt(i, q.matrix);
      if (kind === 'palm') { q.position.set(t.x, y + th + 0.1, t.z); q.rotation.set(Math.PI, t.rot, 0); q.scale.set(1, 1, 1); }
      else if (kind === 'cypress') { q.position.set(t.x, y + th + t.h / 2 - 0.2, t.z); q.rotation.set(0, t.rot, 0); q.scale.set(1, t.h, 1); }
      else { const s = t.h / 4; q.position.set(t.x, y + th + 1.1 * s, t.z); q.rotation.set(0, t.rot, 0); q.scale.set(s * 1.2, s * 0.7, s * 1.2); }
      q.updateMatrix(); tp.setMatrixAt(i, q.matrix);
    });
    for (const m of [tr, tp]) { m.castShadow = true; m.receiveShadow = true; root.add(m); }
  }
}
// 빈 집: 돌집(평평한 지붕) · 그리스(흰 벽, 붉은 지붕, 앞 기둥 둘) · 로마(벽돌빛, 기와 지붕) · 다락방(2층, 바깥 계단)
function house(root, H) {
  const y0 = Math.min(groundH(H.u0, H.v0), groundH(H.u1, H.v0), groundH(H.u0, H.v1), groundH(H.u1, H.v1)) - 0.1;
  const x = AX + H.cu, z = AZ + H.cv, top = y0 + H.h + 0.1;
  const wall = H.style === 'greek' ? mat.marble : H.style === 'brick' ? mat.brick : mat.plaster;
  bx(root, H.w, H.h + 0.1, H.d, wall, x, y0 + (H.h + 0.1) / 2, z);
  // 문은 구역 가운데 쪽 벽
  const zc = ZONES[H.zone], du = zc.u - H.cu, dv = zc.v - H.cv;
  const faceU = Math.abs(du) > Math.abs(dv);
  const dx = faceU ? Math.sign(du) * (H.w / 2 + 0.02) : 0, dz = faceU ? 0 : Math.sign(dv) * (H.d / 2 + 0.02);
  bx(root, faceU ? 0.06 : 1.0, 1.9, faceU ? 1.0 : 0.06, mat.door, x + dx, y0 + 0.95, z + dz);
  if (H.style === 'greek' || H.style === 'brick') {
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, Math.max(H.w, H.d) * 0.62, 1.4, 4, 1), H.style === 'greek' ? mat.tile : mat.brickDark);
    roof.rotation.y = Math.PI / 4; roof.scale.set(H.w / Math.max(H.w, H.d), 1, H.d / Math.max(H.w, H.d));
    roof.position.set(x, top + 0.7, z); roof.castShadow = true; root.add(roof);
    if (H.style === 'greek') for (const s of [-1, 1]) {
      const cx = faceU ? x + dx * 1.35 : x + s * Math.min(1.6, H.w / 3), cz = faceU ? z + s * Math.min(1.6, H.d / 3) : z + dz * 1.35;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, H.h, 10), mat.marble); c.position.set(cx, y0 + H.h / 2, cz); c.castShadow = true; root.add(c);
    }
  } else {
    bx(root, H.w + 0.2, 0.22, H.d + 0.2, mat.plasterDark, x, top, z); // 평평한 지붕 둘레 낮은 담
  }
  if (H.style === 'upper') { // 다락방: 2층 줄눈과 동쪽 바깥 계단 (오르는 일은 1차부터)
    bx(root, H.w + 0.1, 0.18, H.d + 0.1, mat.stoneDark, x, y0 + H.h * 0.5, z);
    for (let k = 0; k < 8; k++) bx(root, 1.2, 0.3, 0.6, mat.stoneDark, x + H.w / 2 + 0.6, y0 + 0.15 + k * (H.h / 8), z + H.d / 2 - 0.4 - k * 0.6);
    for (const s of [-1.6, 1.6]) bx(root, 0.9, 0.9, 0.06, mat.woodDark, x + s, y0 + H.h * 0.72, z + H.d / 2 + 0.03); // 위층 창
  }
}
// 다락방 광장: 돌바닥, 벤치 넷, 여정 지도 탁자 자리 (지도는 1차부터)
function plaza(root) {
  const y = PLAZA.y;
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA.R, PLAZA.R + 0.3, 0.3, 64), mat.stone);
  floor.position.set(PLAZA.x, y - 0.15, PLAZA.z); floor.receiveShadow = true; root.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.6, 64), M(0xd8c7a2)); ring.rotation.x = -Math.PI / 2; ring.position.set(PLAZA.x, y + 0.01, PLAZA.z); root.add(ring);
  for (const b of PLAZA_BENCHES) bench(root, b, Math.atan2(PLAZA.x - b.x, PLAZA.z - b.z), y);
  const t = new THREE.Group(); t.position.set(MAP_TABLE.x, y, MAP_TABLE.z);
  t.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.9), mat.wood), { castShadow: true }).translateY(0.82));
  for (const [a, b] of [[-0.6, -0.36], [0.6, -0.36], [-0.6, 0.36], [0.6, 0.36]]) t.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), mat.woodDark).translateX(a).translateZ(b).translateY(0.4));
  t.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.72), M(0xe9dcc0)).translateY(0.87)); // 펼친 두루마리 지도 (빈 것)
  root.add(t);
}
function bench(root, p, face, y) {
  const g = new THREE.Group(); g.position.set(p.x, y, p.z); g.rotation.y = face;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.5), mat.wood); seat.position.y = 0.45; seat.castShadow = true; g.add(seat);
  for (const s of [-0.6, 0.6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.42), mat.stoneDark); leg.position.set(s, 0.22, 0); leg.castShadow = true; g.add(leg); }
  root.add(g);
}
// 쉼 자리: 벤치는 벤치, 바닥 자리는 납작한 돌, 눕는 자리는 풀밭 그대로
function restSpots(root) {
  for (const s of Object.values(REST_SPOTS)) {
    if (s.kind === 'gbench') bench(root, s.at, s.face, gy(s.at));
    else if (s.kind === 'floor') { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.22, 9), mat.stoneDark); r.position.set(s.at.x, gy(s.at) + 0.02, s.at.z); r.receiveShadow = true; root.add(r); }
  }
}
// 항구: 땅에서 배 자리 쪽으로 나무 부두, 그 끝에 매어 둔 작은 배 (배 타기는 2차 나부터)
function boatMesh() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.55, 4.4, 10, 1, false, 0, Math.PI), mat.wood);
  hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2; hull.scale.set(1, 1, 0.6); hull.position.y = 0.35; hull.castShadow = true; g.add(hull);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 6), mat.woodDark); mast.position.set(0, 2.0, 0.2); g.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.0), mat.sail); sail.position.set(0, 2.3, 0.24); g.add(sail);
  return g;
}
function ports(root) {
  for (const p of Object.values(PORTS)) {
    const du = p.boat.u - p.at.u, dv = p.boat.v - p.at.v, len = Math.hypot(du, dv), ry = Math.atan2(du, dv);
    const pier = new THREE.Group(); pier.position.set(AX + (p.at.u + p.boat.u) / 2, WATER_Y + 0.42, AZ + (p.at.v + p.boat.v) / 2); pier.rotation.y = ry;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, len), mat.wood); deck.castShadow = true; deck.receiveShadow = true; pier.add(deck);
    for (let k = -1; k <= 1; k += 0.5) for (const s of [-0.8, 0.8]) pier.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.2, 6), mat.woodDark).translateX(s).translateZ((k * len) / 2).translateY(-0.5));
    root.add(pier);
    const b = boatMesh(); b.position.set(p.boat.x + Math.cos(ry) * 1.6, WATER_Y, p.boat.z - Math.sin(ry) * 1.6); b.rotation.y = ry; root.add(b);
  }
}

export function buildActs({ scene, occluders, makeCart, makeSignpost }) {
  const root = new THREE.Group();
  root.name = 'acts-village';
  root.userData.noCull = true; // 마을 전체를 한 덩어리로 (main.js farCull이 통째로 감추지 않게)
  root.add(ground());
  root.add(sea());
  for (const r of ROADS) root.add(ribbon(r, 1.6, 0.05, mat.road));
  root.add(ribbon(STREAM, 1.3, 0.04, mat.stream)); // 빌립보 문밖 강 (얕은 내, 걸어서 건넘)
  zoneStones(root);
  trees(root);
  plaza(root);
  for (const H of HOUSES) house(root, H);
  restSpots(root);
  ports(root);
  // 이정표 돌 (길 30~35m마다)
  {
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 0.8, 7), mat.stone, MILESTONES.length), q = new THREE.Object3D();
    MILESTONES.forEach((m, i) => { q.position.set(m.x, gy(m) + 0.35, m.z); q.rotation.set(0, i, 0); q.updateMatrix(); im.setMatrixAt(i, q.matrix); });
    im.castShadow = true; im.receiveShadow = true; root.add(im);
  }
  // 섬 둘: 작은 모래 언덕 (땅 높이는 layout과 같고, 여기선 바위 몇 개만)
  for (const I of Object.values(ISLANDS)) for (let k = 0; k < 5; k++) {
    const a = k * 1.3 + I.u, r = I.r - 2.5;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (k % 2) * 0.4, 0), mat.stoneDark);
    rock.position.set(I.x + Math.cos(a) * r, groundH(I.u + Math.cos(a) * r, I.v + Math.sin(a) * r) + 0.2, I.z + Math.sin(a) * r); rock.castShadow = true; root.add(rock);
  }
  // 돌아가는 수레
  const cart = makeCart();
  cart.position.set(CART.x, PLAZA.y - 0.1, CART.z); cart.rotation.y = CART.rot;
  root.add(cart);
  // 구역 팻말
  for (const s of SIGNPOSTS) {
    const sp = s.id === 'jerusalem' ? makeSignpost('마을 수레', '수레를 타고 다른 마을로') : makeSignpost(s.name, `사도행전 ${s.ch}`);
    const u = s.x - AX, v = s.z - AZ;
    sp.position.set(s.x, s.id === 'jerusalem' ? PLAZA.y : groundH(u, v), s.z);
    sp.rotation.y = Math.atan2(-(s.look.x - s.x), -(s.look.z - s.z)) + Math.PI;
    root.add(sp);
  }
  scene.add(root);
  return { root, cart, at: W, parts: {} };
}
