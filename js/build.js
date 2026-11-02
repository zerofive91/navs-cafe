// 3D 공간 만들기: 높은 층고의 흰색 모던 카페, 수레바퀴 바닥, 전시물
import * as THREE from 'three';
import {
  GATE, WALK_MAX, R_HALL, R_RIM_IN, TREES, terrainH, PARK, POOL, FLOWER_BEDS, R_WALK, R_HUB, SPOKE, CEIL, deg, polar, Q, PRAYER_POOL_R, WITNESS_POOL_R,
  columns, COUNTER, LONG_TABLE, BIBLE, planters, TRAY, stools, BOAT,
  BRIDGE,
} from './layout.js';
import { showVerse } from './verses.js';
import { buildNavigators } from './navs.js';

const WHITE = 0xf5f3ef;
const IVORY = 0xefe9df;
const STONE = 0xdcd6cc;
const LED = 0xffc77a;

const mat = {
  white: new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.85 }),
  ivory: new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.9 }),
  stone: new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.75 }),
  sculpt: new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xdff1f5, roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  frame: new THREE.MeshStandardMaterial({ color: 0xe8e6e2, roughness: 0.5, metalness: 0.2 }),
  led: new THREE.MeshBasicMaterial({ color: LED }),
  ledSoft: new THREE.MeshBasicMaterial({ color: LED, transparent: true, opacity: 0.35, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: 0x6fbfd8, roughness: 0.06, metalness: 0.15, transparent: true, opacity: 0.72 }),
  poolFloor: new THREE.MeshStandardMaterial({ color: 0xbfe0ec, roughness: 0.9 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x8fae7a, roughness: 0.9 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x6f9460, roughness: 0.9 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x9a8370, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0xa9c98f, roughness: 1 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xfffdf6, roughness: 0.95, side: THREE.DoubleSide }),
};

function shadowy(o, cast = true, receive = true) {
  o.traverse((c) => { if (c.isMesh) { c.castShadow = cast; c.receiveShadow = receive; } });
  return o;
}

// 테라조 느낌 바닥 텍스처
function terrazzoTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#ebe7e1';
  g.fillRect(0, 0, 512, 512);
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cols = ['#d9d3ca', '#cfc8bd', '#f7f5f1', '#c9c2b8', '#e0d6c6'];
  for (let k = 0; k < 2600; k++) {
    g.fillStyle = cols[Math.floor(rnd() * cols.length)];
    g.beginPath();
    g.arc(rnd() * 512, rnd() * 512, 0.6 + rnd() * 2.4, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function ringShape(rOut, rIn, a0 = 0, a1 = Math.PI * 2) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, a0, a1, false);
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const h = new THREE.Path();
    h.absarc(0, 0, rIn, 0, Math.PI * 2, true);
    s.holes.push(h);
  } else {
    s.absarc(0, 0, rIn, a1, a0, true);
  }
  return s;
}

// 바닥에 눕힌 압출 도형 (shape의 y가 월드 -z가 되지 않도록 뒤집음)
function slab(shape, h, material, y = 0) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 });
  geo.rotateX(Math.PI / 2); // shape (x, y) → world (x, z=y), 두께는 아래로
  geo.translate(0, h + y, 0);
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  return m;
}

function ledRing(r, y, tube = 0.035) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 180), mat.led);
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}
function ledLine(x0, z0, x1, z1, y) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.06), mat.led);
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  return m;
}
// 바닥에 번지는 은은한 빛
function glowRing(r, width, y = 0.012) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r, r + width, 180), mat.ledSoft);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

export function buildWorld(scene) {
  const anim = []; // 매 프레임 움직일 것들
  const interactive = []; // 눌러서 체험할 수 있는 물체
  // 나중에 CC0 모델로 바꿔 끼울 임시 모양들
  const deco = { trees: [], machine: null, pastries: [], counterCups: [], plantLeaves: [], plantGroups: [] };

  // ---------- 바깥 ----------
  // 잔디 (수영장 자리는 뚫어 둠)
  const gShape = new THREE.Shape();
  gShape.absarc(0, 0, Math.max(300, WALK_MAX + 30), 0, Math.PI * 2, false);
  {
    const zn = PARK.pool, h = new THREE.Path();
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => zn.at(a * POOL.w / 2, b * POOL.d / 2));
    h.moveTo(c[0].x, -c[0].z); for (const q of [c[3], c[2], c[1], c[0]]) h.lineTo(q.x, -q.z);
    gShape.holes.push(h);
  }
  {
    // 생명의 다리: 하나님과 사람 사이의 깊은 낭떠러지
    const B = BRIDGE, h = new THREE.Path();
    const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => B.at(a * B.U, b * B.gap));
    const area = c.reduce((A, q, i) => { const n = c[(i + 1) % 4]; return A + (q.x * -n.z - n.x * -q.z); }, 0);
    const o = area > 0 ? [c[0], c[3], c[2], c[1]] : c;
    h.moveTo(o[0].x, -o[0].z); for (const q of o.slice(1)) h.lineTo(q.x, -q.z);
    gShape.holes.push(h);
  }
  const ground = new THREE.Mesh(new THREE.ShapeGeometry(gShape, 64), mat.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);
  let s = 5;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const treeGeo = new THREE.IcosahedronGeometry(1, 1);
  for (const { x, z, h, dark } of TREES) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, h * 0.45, 6), mat.trunk);
    const ty = terrainH(x, z);
    trunk.position.set(x, ty + h * 0.22, z);
    const crown = new THREE.Mesh(treeGeo, dark ? mat.leaf : mat.leafDark);
    crown.scale.set(h * 0.38, h * 0.48, h * 0.38);
    crown.position.set(x, ty + h * 0.62, z);
    scene.add(shadowy(trunk, true, false), shadowy(crown, true, false));
    deco.trees.push({ x, z, h, parts: [trunk, crown] });
  }
  // 입구 앞 길
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4, GATE.r - 1 - R_HALL), mat.stone);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, -0.49, (R_HALL + GATE.r - 1) / 2);
  path.receiveShadow = true;
  scene.add(path);

  // 건물을 한 바퀴 도는 정원 산책길 + 둥근 꽃밭(흙과 돌 테두리)
  const gravel = new THREE.MeshStandardMaterial({ color: 0xe9e1d2, roughness: 1 });
  const walk = new THREE.Mesh(new THREE.RingGeometry(R_WALK - 1.1, R_WALK + 1.1, 160), gravel);
  walk.rotation.x = -Math.PI / 2;
  walk.position.y = -0.485;
  walk.receiveShadow = true;
  scene.add(walk);
  const soil = new THREE.MeshStandardMaterial({ color: 0x8a6e55, roughness: 1 });
  for (const b of FLOWER_BEDS) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(b.r, b.r, 0.16, 40), soil);
    d.position.set(b.x, -0.44, b.z);
    d.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(b.r, 0.13, 6, 48), mat.stone);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(b.x, -0.38, b.z);
    scene.add(d, edge);
    // 산책길에서 꽃밭까지 짧은 오솔길
    const a = Math.atan2(b.z, b.x);
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), gravel);
    lane.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2);
    lane.position.set(Math.cos(a) * (R_WALK + 2.2), -0.486, Math.sin(a) * (R_WALK + 2.2));
    lane.receiveShadow = true;
    scene.add(lane);
  }

  // 건물 기단
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R_HALL + 0.6, R_HALL + 0.8, 0.5, 128, 1, true), mat.stone);
  base.position.y = -0.26;
  base.receiveShadow = true;
  scene.add(base);
  const baseTop = new THREE.Mesh(new THREE.RingGeometry(R_HALL - 0.05, R_HALL + 0.6, 128), mat.stone);
  baseTop.rotation.x = -Math.PI / 2;
  baseTop.position.y = -0.005;
  scene.add(baseTop);
  const step = new THREE.Mesh(new THREE.BoxGeometry(4, 0.25, 2), mat.stone);
  step.position.set(0, -0.37, R_HALL + 1.4);
  scene.add(step);

  // ---------- 바닥 ----------
  const terr = terrazzoTexture();
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: terr, roughness: 0.6 });
  // 바닥(증거 구역의 물은 바닥보다 낮으므로 구멍을 뚫음)
  const floorShape = new THREE.Shape();
  floorShape.absarc(0, 0, R_HALL, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(Q.witness.x, -Q.witness.z, WITNESS_POOL_R, 0, Math.PI * 2, true);
  floorShape.holes.push(hole);
  const floorGeo = new THREE.ShapeGeometry(floorShape, 96);
  // 텍스처 좌표를 미터 단위로
  const uv = floorGeo.attributes.uv, pos = floorGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (R_HALL * 2) + 0.5, pos.getY(i) / (R_HALL * 2) + 0.5);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 둘레 회랑(순종)
  const rim = slab(ringShape(R_HALL, R_RIM_IN), 0.25, mat.ivory);
  scene.add(rim);
  scene.add(ledRing(R_RIM_IN - 0.02, 0.05));
  scene.add(glowRing(R_RIM_IN - 0.9, 0.9));

  // 바퀴살 길 4개
  for (const a of [0, 90, 180, 270]) {
    const len = R_RIM_IN - R_HUB + 0.4;
    const box = new THREE.Mesh(new THREE.BoxGeometry(len, 0.25, SPOKE * 2), mat.ivory);
    const mid = polar(R_HUB + len / 2 - 0.2, a);
    box.position.set(mid.x, 0.125, mid.z);
    box.rotation.y = -deg(a);
    box.receiveShadow = true;
    scene.add(box);
    // 양쪽 LED 선
    for (const sgn of [-1, 1]) {
      const off = polar(SPOKE + 0.02, a + 90 * sgn);
      const p0 = polar(R_HUB + 0.2, a), p1 = polar(R_RIM_IN - 0.1, a);
      scene.add(ledLine(p0.x + off.x, p0.z + off.z, p1.x + off.x, p1.z + off.z, 0.05));
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.6, 0.8), mat.ledSoft);
      glow.rotation.x = -Math.PI / 2;
      glow.rotation.z = deg(a);
      const offg = polar(SPOKE + 0.42, a + 90 * sgn);
      glow.position.set(mid.x + offg.x, 0.012, mid.z + offg.z);
      scene.add(glow);
    }
  }

  // 가운데 단(그리스도)
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(R_HUB, R_HUB, 0.5, 96), mat.white);
  hub.position.y = 0.25;
  hub.receiveShadow = true;
  scene.add(hub);
  scene.add(ledRing(R_HUB + 0.02, 0.06));
  scene.add(glowRing(R_HUB + 0.05, 1.0));
  // 바닥의 빛 원
  const lightDisc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.85 }));
  lightDisc.rotation.x = -Math.PI / 2;
  lightDisc.position.y = 0.505;
  scene.add(lightDisc);
  // 둥근 벤치 4개(대각선)
  for (const a of [-135, -45, 45, 135]) {
    const bench = slab(ringShape(4.65, 3.95, deg(a - 18), deg(a + 18)), 0.42, mat.stone, 0.5);
    scene.add(shadowy(bench));
  }
  // 천창에서 내려오는 빛기둥
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1cc, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.FrontSide, blending: THREE.AdditiveBlending });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.6, CEIL, 48, 1, true), beamMat);
  beam.position.y = CEIL / 2 + 0.5;
  scene.add(beam);
  const beamInner = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 1.6, CEIL, 48, 1, true), beamMat.clone());
  beamInner.material.opacity = 0.05;
  beamInner.position.y = CEIL / 2 + 0.5;
  scene.add(beamInner);
  anim.push((t, ctx) => {
    // 카메라가 빛기둥 안에 들어오면 눈부시지 않게 숨김
    const inside = ctx && ctx.camR < 4.3;
    beam.visible = beamInner.visible = !inside;
    beam.material.opacity = 0.07 + 0.02 * Math.sin(t * 0.5);
    lightDisc.material.opacity = 0.75 + 0.15 * Math.sin(t * 0.5);
  });
  lightDisc.userData.action = 'light';
  interactive.push(lightDisc, hub);
  hub.userData.action = 'light';

  // ---------- 벽·천장 ----------
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R_HALL, R_HALL, CEIL, 128, 1, true), mat.glass);
  glass.position.y = CEIL / 2;
  scene.add(glass);
  // 유리 멀리언과 바닥 띠
  const mull = new THREE.BoxGeometry(0.12, CEIL, 0.18);
  for (let a = 0; a < 360; a += 7.5) {
    if (Math.abs(a - 90) < 4) continue;
    const p = polar(R_HALL, a);
    const m = new THREE.Mesh(mull, mat.frame);
    m.position.set(p.x, CEIL / 2, p.z);
    m.rotation.y = -deg(a);
    scene.add(m);
  }
  for (const y of [0.3, CEIL - 0.2]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(R_HALL, 0.1, 6, 160), mat.frame);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    scene.add(band);
  }
  // 입구 문틀
  for (const sgn of [-1, 1]) {
    const p = polar(R_HALL, 90 + sgn * 3.2);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), mat.frame);
    post.position.set(p.x, 1.6, p.z);
    scene.add(post);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 0.3), mat.frame);
  lintel.position.set(0, 3.3, R_HALL);
  scene.add(lintel);

  // 천장: 천창 구멍이 있는 흰 원판 + 바퀴살 보 8개 + 둘레 간접조명
  const ceiling = slab(ringShape(R_HALL + 0.5, 4.2), 0.4, mat.white, CEIL);
  ceiling.material = new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.95, side: THREE.DoubleSide });
  scene.add(ceiling);
  for (let a = 0; a < 360; a += 45) {
    const len = R_HALL - 4.2;
    const beamBox = new THREE.Mesh(new THREE.BoxGeometry(len, 0.7, 0.45), mat.white);
    const mid = polar(4.2 + len / 2, a);
    beamBox.position.set(mid.x, CEIL - 0.35, mid.z);
    beamBox.rotation.y = -deg(a);
    scene.add(shadowy(beamBox, true, true));
  }
  const skyRing = ledRing(4.25, CEIL - 0.05, 0.06);
  scene.add(skyRing);
  const cove = ledRing(R_RIM_IN, CEIL - 0.6, 0.05);
  scene.add(cove);

  // 기둥
  const colGeo = new THREE.CylinderGeometry(0.32, 0.32, CEIL, 24);
  for (const c of columns) {
    const m = new THREE.Mesh(colGeo, mat.white);
    m.position.set(c.x, CEIL / 2, c.z);
    scene.add(shadowy(m));
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 24), mat.led);
    up.position.set(c.x, 0.04, c.z);
    scene.add(up);
  }

  // ---------- 북서: 기도하는 손 + 고요한 물 ----------
  {
    const { x, z } = Q.prayer;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(PRAYER_POOL_R, 64), mat.water);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.03, z);
    scene.add(pool);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(PRAYER_POOL_R, 0.12, 8, 96), mat.stone);
    lip.rotation.x = Math.PI / 2;
    lip.position.set(x, 0.06, z);
    scene.add(lip);
    const l = ledRing(PRAYER_POOL_R + 0.14, 0.03, 0.03);
    l.position.x = x; l.position.z = z;
    scene.add(l);
    // 작은 섬과 손 조각
    const island = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 32), mat.stone);
    island.position.set(x, 0.2, z);
    scene.add(shadowy(island));
    const hands = makePrayingHands();
    hands.position.set(x, 0.4, z);
    hands.rotation.y = deg(45);
    scene.add(hands);
    // 누르면 손 사이 빛이 위로 솟고, 그 자리에서 기도하며 말씀이 떠오름
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 12, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe3a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.set(x, 6.4, z);
    scene.add(beam);
    let handsPulse = 0;
    anim.push((t, ctx, dt) => {
      handsPulse = Math.max(0, handsPulse - (dt || 0.016) * 0.25);
      beam.material.opacity = handsPulse * 0.5 * (0.85 + 0.15 * Math.sin(t * 5));
      beam.scale.set(1 + (1 - handsPulse) * 0.6, 0.2 + Math.min(1, (1 - handsPulse) * 4) * 0.8, 1 + (1 - handsPulse) * 0.6);
      if (hands.userData.glow) hands.userData.glow.material.opacity = 0.25 + handsPulse * 0.6;
    });
    const tapHands = () => {
      handsPulse = 1;
      showVerse('hands', { delay: 1.2, cooldown: 30 });
      if (window.__cafe) window.__cafe.ACTIONS.pray();
    };
    hands.traverse((c) => { if (c.isMesh) { c.userData.onTap = tapHands; interactive.push(c); } });
    // 물에 뜬 촛불
    const candles = [];
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2 + 0.3;
      const r = 2.2 + (k % 3) * 0.55;
      const c = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), mat.sculpt);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc66 }));
      flame.position.y = 0.1;
      c.add(body, flame);
      c.position.set(x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r);
      scene.add(c);
      candles.push({ c, a, r, flame });
    }
    anim.push((t) => {
      for (const k of candles) {
        const a = k.a + t * 0.02;
        k.c.position.x = x + Math.cos(a) * k.r;
        k.c.position.z = z + Math.sin(a) * k.r;
        k.c.position.y = 0.07 + Math.sin(t * 1.3 + k.a * 3) * 0.015;
        k.flame.scale.y = 1 + 0.25 * Math.sin(t * 9 + k.a * 5);
      }
    });
    // 무릎 꿇는 낮은 방석
    for (const a of [25, 45, 65]) {
      const p = { x: x + Math.cos(deg(a)) * 5.0, z: z + Math.sin(deg(a)) * 5.0 };
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.12, 24), mat.stone);
      pad.position.set(p.x, 0.06, p.z);
      scene.add(shadowy(pad));
    }
  }

  // ---------- 북동: 교제 (카운터, 긴 테이블) ----------
  const counterParts = [];
  {
    const a0 = deg(COUNTER.from), a1 = deg(COUNTER.to);
    const body = slab(ringShape(COUNTER.r + 0.45, COUNTER.r - 0.45, a0, a1), 1.05, mat.white);
    const top = slab(ringShape(COUNTER.r + 0.55, COUNTER.r - 0.55, a0, a1), 0.07, new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.35 }), 1.05);
    scene.add(shadowy(body), shadowy(top));
    counterParts.push(body, top);
    const led = slab(ringShape(COUNTER.r - 0.46, COUNTER.r - 0.5, a0, a1), 0.04, mat.led, 0.02);
    scene.add(led);
    // 커피머신, 진열장, 컵
    const machine = new THREE.Group();
    const mb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.5), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.6, roughness: 0.3 }));
    mb.position.y = 0.28;
    machine.add(mb);
    const mp = polar(COUNTER.r + 0.1, -60);
    machine.position.set(mp.x, 1.12, mp.z);
    machine.rotation.y = -deg(-60) + Math.PI / 2;
    scene.add(shadowy(machine));
    deco.machine = machine;
    const caseG = new THREE.Group();
    const cb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.7), mat.white);
    cb.position.y = 0.45;
    const cg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05 }));
    cg.position.y = 1.15;
    caseG.add(cb, cg);
    // 진열장 안 빵·쿠키
    for (let k = 0; k < 6; k++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: k % 2 ? 0xd9a35f : 0xc98a4f, roughness: 0.8 }));
      b.scale.y = 0.6;
      b.position.set(-0.55 + k * 0.22, 0.98, 0);
      caseG.add(b);
      deco.pastries.push(b);
    }
    const cp = polar(COUNTER.r, -34.5);
    caseG.position.set(cp.x, 0, cp.z);
    caseG.rotation.y = -deg(-34.5) + Math.PI / 2;
    scene.add(shadowy(caseG));
    for (const a of [-50, -47, -44]) {
      const p = polar(COUNTER.r - 0.15, a);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12), mat.sculpt);
      cup.position.set(p.x, 1.18, p.z);
      scene.add(cup);
      deco.counterCups.push(cup);
    }
    // 카운터 위 펜던트 조명
    for (const a of [-64, -54, -44]) {
      const p = polar(COUNTER.r, a);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, CEIL - 3.3, 4), mat.dark);
      cord.position.set(p.x, 3.3 + (CEIL - 3.3) / 2, p.z);
      const shade = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat.white);
      shade.rotation.x = Math.PI;
      shade.position.set(p.x, 3.3, p.z);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat.led);
      bulb.position.set(p.x, 3.22, p.z);
      scene.add(cord, shade, bulb);
    }
    counterParts.forEach((m) => { m.userData.action = 'order'; interactive.push(m); });

    // 긴 테이블 + 돌 공 의자
    const dir = polar(1, LONG_TABLE.rot);
    const table = new THREE.Group();
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(LONG_TABLE.len, 0.1, LONG_TABLE.w), new THREE.MeshStandardMaterial({ color: 0xe4ddd1, roughness: 0.5 }));
    top2.position.y = 0.78;
    table.add(top2);
    for (const t of [-2.2, 0, 2.2]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.73, 0.9), mat.white);
      leg.position.set(t, 0.37, 0);
      table.add(leg);
    }
    table.position.set(LONG_TABLE.x, 0, LONG_TABLE.z);
    table.rotation.y = -deg(LONG_TABLE.rot);
    scene.add(shadowy(table));
    const stoolGeo = new THREE.SphereGeometry(0.3, 20, 14);
    for (const p of stools) {
      const st = new THREE.Mesh(stoolGeo, mat.stone);
      st.scale.y = 0.85;
      st.position.set(p.x, 0.25, p.z);
      scene.add(shadowy(st));
    }
    void dir;
  }

  // ---------- 남서: 증거 (배, 물고기 모빌, 둥근 세상 화면) ----------
  let screenTex = null;
  {
    const { x, z } = Q.witness;
    // 살짝 내려간 물
    const poolFloor = new THREE.Mesh(new THREE.CircleGeometry(WITNESS_POOL_R, 64), mat.poolFloor);
    poolFloor.rotation.x = -Math.PI / 2;
    poolFloor.position.set(x, -0.25, z);
    scene.add(poolFloor);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(WITNESS_POOL_R, WITNESS_POOL_R, 0.3, 64, 1, true), mat.stone);
    wall.material = mat.stone.clone();
    wall.material.side = THREE.BackSide;
    wall.position.set(x, -0.12, z);
    scene.add(wall);
    const water = new THREE.Mesh(new THREE.CircleGeometry(WITNESS_POOL_R, 64), mat.water);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, -0.06, z);
    scene.add(water);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(WITNESS_POOL_R + 0.25, 0.25, 8, 120), mat.ivory);
    lip.rotation.x = Math.PI / 2;
    lip.scale.z = 0.4;
    lip.position.set(x, 0.05, z);
    scene.add(shadowy(lip));
    const l = ledRing(WITNESS_POOL_R + 0.52, 0.03, 0.035);
    l.position.x = x; l.position.z = z;
    scene.add(l);
    const g2 = glowRing(WITNESS_POOL_R + 0.55, 0.7);
    g2.position.x = x; g2.position.z = z;
    scene.add(g2);

    // 흰 배
    const boat = makeBoat();
    boat.position.set(BOAT.x, -0.02, BOAT.z);
    boat.rotation.y = -deg(BOAT.rot);
    scene.add(shadowy(boat));
    boat.traverse((c) => { if (c.isMesh) { c.userData.action = 'boat'; interactive.push(c); } });
    // 풍랑이 일면 크게 흔들림 (ctx.storm 0~1)
    anim.push((t, ctx) => {
      const st = (ctx && ctx.storm) || 0;
      boat.position.y = -0.02 + Math.sin(t * (0.9 + st * 1.6)) * (0.025 + st * 0.09);
      boat.rotation.z = Math.sin(t * (0.7 + st * 1.4)) * (0.015 + st * 0.11);
      boat.rotation.x = Math.sin(t * 1.3) * st * 0.06;
    });

    // 물고기 모빌(사람 낚는 어부): 얇은 종이 물고기 떼가 배 위에서 세계 화면 쪽으로 흘러감
    const fishGroup = new THREE.Group();
    const fs = new THREE.Shape();
    fs.moveTo(0.5, 0);
    fs.quadraticCurveTo(0.2, 0.2, -0.25, 0.04);
    fs.lineTo(-0.48, 0.17);
    fs.lineTo(-0.4, 0);
    fs.lineTo(-0.48, -0.17);
    fs.lineTo(-0.25, -0.04);
    fs.quadraticCurveTo(0.2, -0.2, 0.5, 0);
    const fishGeo = new THREE.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 10 });
    fishGeo.translate(0, 0, -0.01);
    const fishMat = new THREE.MeshStandardMaterial({ color: 0xfdfcf9, roughness: 0.7, side: THREE.DoubleSide });
    const fishGold = new THREE.MeshStandardMaterial({ color: 0xf3e2bf, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide });
    const sp0 = new THREE.Vector3(x + 3.5, 6.2, z - 3.5);
    const scr = polar(R_HALL - 2.6, 135);
    const sp1 = new THREE.Vector3(scr.x, 7.4, scr.z);
    const ctrl = new THREE.Vector3(x - 2.5, 9.3, z - 2.0);
    const path = new THREE.QuadraticBezierCurve3(sp0, ctrl, sp1);
    const strings = [];
    const fishes = [];
    for (let k = 0; k < 64; k++) {
      const u = k / 63;
      const c = path.getPoint(u);
      const tan = path.getTangent(u);
      const spread = 0.6 + Math.sin(u * Math.PI) * 1.6;
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const off = (rnd() - 0.5) * 2 * spread;
      const fx = c.x + side.x * off, fz = c.z + side.z * off;
      const fy = c.y + (rnd() - 0.5) * spread * 0.9;
      const f = new THREE.Mesh(fishGeo, k % 9 === 0 ? fishGold : fishMat);
      f.scale.setScalar(0.75 + rnd() * 0.35);
      f.position.set(fx, fy, fz);
      const head = Math.atan2(-tan.z, tan.x);
      f.rotation.set(0, head, (rnd() - 0.5) * 0.25);
      fishGroup.add(f);
      fishes.push({ f, base: head, y: fy, ph: rnd() * 6 });
      strings.push(fx, fy + 0.05, fz, fx, CEIL, fz);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(strings, 3));
    fishGroup.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0xd8d3ca, transparent: true, opacity: 0.35 })));
    scene.add(shadowy(fishGroup, true, false));
    // 물고기를 누르면 떼 전체가 물결치듯 한 바퀴 돎
    let swirl = 0;
    for (const q of fishes) { q.f.userData.onTap = () => { swirl = 1; }; interactive.push(q.f); }
    anim.push((t, ctx, dt) => {
      swirl = Math.max(0, swirl - (dt || 0.016) * 0.4);
      for (const q of fishes) {
        const w = swirl > 0 ? Math.sin(Math.min(1, Math.max(0, (1 - swirl) * 2.2 - q.ph / 12)) * Math.PI) : 0;
        q.f.rotation.y = q.base + Math.sin(t * 0.4 + q.ph) * 0.12 + w * Math.PI;
        q.f.position.y = q.y + Math.sin(t * 0.6 + q.ph) * 0.05 + w * 0.4;
      }
    });

    // 바깥벽 쪽 둥근 큰 화면: 세계의 풍경이 천천히 바뀜(세계비전)
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    screenTex = new THREE.CanvasTexture(cv);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    const screenR = 4.2;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(screenR, 96), new THREE.MeshBasicMaterial({ map: screenTex }));
    const sp = polar(R_HALL - 1.6, 135);
    disc.position.set(sp.x, 6.4, sp.z);
    disc.lookAt(0, 6.4, 0);
    scene.add(disc);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(screenR + 0.08, 0.1, 8, 120), mat.white);
    frame.position.copy(disc.position);
    frame.lookAt(0, 6.4, 0);
    scene.add(frame);
    const halo = new THREE.Mesh(new THREE.RingGeometry(screenR + 0.15, screenR + 0.35, 96), mat.ledSoft);
    halo.position.copy(disc.position).add(new THREE.Vector3(0, 0, 0));
    halo.lookAt(0, 6.4, 0);
    halo.translateZ(-0.05);
    scene.add(halo);
    // 화면 뒷벽
    const back = new THREE.Mesh(new THREE.CircleGeometry(screenR + 1.2, 64), mat.white);
    back.position.copy(disc.position);
    back.lookAt(0, 6.4, 0);
    back.translateZ(-0.12);
    scene.add(back);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.5), mat.white);
    stand.position.set(sp.x, 1.1, sp.z);
    scene.add(stand);
    disc.userData.action = 'boat';
    interactive.push(disc);
    let lastDraw = -1;
    anim.push((t) => {
      if (t - lastDraw < 0.08) return;
      lastDraw = t;
      drawWorldScreen(cv.getContext('2d'), t);
      screenTex.needsUpdate = true;
    });
  }

  // ---------- 남동: 말씀 (펼쳐진 큰 성경) ----------
  {
    const { x, z } = BIBLE;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(BIBLE.plinth, BIBLE.plinth + 0.15, 0.6, 64), mat.white);
    plinth.position.set(x, 0.3, z);
    scene.add(shadowy(plinth));
    const bl = ledRing(BIBLE.plinth + 0.17, 0.03, 0.03);
    bl.position.x = x;
    bl.position.z = z;
    scene.add(bl);
    const book = new THREE.Group();
    const cover = new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.7 });
    for (const sgn of [-1, 1]) {
      const half = new THREE.Group();
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 2.4), cover);
      c.position.set(sgn * 0.85, 0, 0);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 2.3), mat.paper);
      pages.position.set(sgn * 0.82, 0.13, 0);
      half.add(c, pages);
      half.rotation.z = sgn * -0.18;
      book.add(half);
    }
    // 넘어가는 한 장
    const pageGeo = new THREE.PlaneGeometry(1.6, 2.3);
    pageGeo.translate(0.8, 0, 0);
    pageGeo.rotateX(-Math.PI / 2);
    const page = new THREE.Mesh(pageGeo, mat.paper);
    page.position.y = 0.24;
    book.add(page);
    // 책갈피 끈
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.7), new THREE.MeshStandardMaterial({ color: 0xb7473e }));
    ribbon.position.set(0, 0.2, 1.4);
    ribbon.rotation.x = 0.5;
    book.add(ribbon);
    book.scale.setScalar(1.25);
    book.position.set(x, 0.9, z);
    book.rotation.y = deg(-45) + Math.PI;
    book.rotation.x = -0.25;
    scene.add(shadowy(book));
    // 누르면 책장이 빠르게 넘어가며 빛이 번지고, 다가가 읽으며 말씀이 떠오름
    const bookGlow = new THREE.PointLight(0xffe0a0, 0, 8, 1.6);
    bookGlow.position.set(x, 2.2, z);
    scene.add(bookGlow);
    const tapBook = () => {
      state.flip = 2.4;
      showVerse('bible', { delay: 0.8, cooldown: 30 });
      if (window.__cafe) window.__cafe.ACTIONS.read();
    };
    book.traverse((c) => { if (c.isMesh) { c.userData.onTap = tapBook; interactive.push(c); } });
    plinth.userData.action = 'read';
    interactive.push(plinth);
    const state = { turning: 0, flip: 0 };
    anim.push((t, ctx) => {
      // 누군가 읽고 있으면 천천히 한 장씩 넘어감
      const flipping = state.flip > 0;
      if (flipping) { state.flip -= 0.016; state.turning += 0.05; }
      else if (ctx && ctx.reading) state.turning += 0.016;
      const ph = state.turning % 1;
      page.rotation.z = ph < 0.6 ? -Math.PI * (ph / 0.6) * 0.92 - 0.18 : -Math.PI * 0.92 - 0.18;
      if (!flipping && (!ctx || !ctx.reading)) page.rotation.z = -0.18;
      bookGlow.intensity += ((flipping ? 14 : ctx && ctx.reading ? 5 : 0) - bookGlow.intensity) * 0.05;
    });
    // 곡선 벤치
    const bench = slab(ringShape(4.75, 4.05, deg(-172), deg(-98)), 0.42, mat.stone);
    bench.position.x = x;
    bench.position.z = z;
    scene.add(shadowy(bench));
    // 책 기둥 조각들
    for (const [dx, dz, h] of []) {
      const stack = new THREE.Group();
      let y = 0;
      for (let k = 0; y < h; k++) {
        const th = 0.12 + ((k * 7) % 5) * 0.03;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.9 - (k % 3) * 0.08, th, 0.65), k % 4 === 0 ? cover : mat.sculpt);
        b.position.y = y + th / 2;
        b.rotation.y = (k % 5) * 0.12;
        stack.add(b);
        y += th;
      }
      stack.position.set(x + dx, 0, z + dz);
      scene.add(shadowy(stack));
    }
  }

  // ---------- 둘레: 화분, 반납대 ----------
  const potGeo = new THREE.CylinderGeometry(0.62, 0.5, 0.8, 24);
  const plantParts = [];
  for (const p of planters) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(potGeo, mat.white);
    pot.position.y = 0.4;
    g.add(pot);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 6), mat.trunk);
    trunk.position.y = 1.5;
    g.add(trunk);
    deco.plantLeaves.push(trunk);
    for (let k = 0; k < 4; k++) {
      const leaf = new THREE.Mesh(treeGeo, k % 2 ? mat.leaf : mat.leafDark);
      leaf.scale.setScalar(0.55 - k * 0.05);
      leaf.position.set(Math.cos(k * 1.7) * 0.35, 2.2 + k * 0.18, Math.sin(k * 1.7) * 0.35);
      g.add(leaf);
      deco.plantLeaves.push(leaf);
    }
    g.position.set(p.x, 0.25, p.z);
    scene.add(shadowy(g));
    g.traverse((c) => { if (c.isMesh) { c.userData.action = 'water'; c.userData.pot = p; interactive.push(c); } });
    plantParts.push(g);
    deco.plantGroups.push({ g, p });
  }
  {
    const st = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.6), mat.white);
    b.position.y = 0.5;
    st.add(b);
    for (const y of [0.55, 0.8]) {
      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.45), mat.stone);
      tray.position.y = y;
      st.add(tray);
    }
    st.position.set(TRAY.x, 0.25, TRAY.z);
    st.rotation.y = -deg(105) + Math.PI / 2;
    scene.add(shadowy(st));
    st.traverse((c) => { if (c.isMesh) { c.userData.action = 'tray'; interactive.push(c); } });
  }

  buildNavigators(scene, anim, interactive);
  return { anim, interactive, deco };
}

// 기도: 두 개의 흰 곡면 날개가 위로 모여 맞닿는 추상 조형 (모은 두 손의 은유)
function makePrayingHands() {
  const g = new THREE.Group();
  const blade = new THREE.Shape();
  blade.moveTo(-1.25, 0);
  blade.bezierCurveTo(-1.3, 1.8, -0.55, 3.6, -0.04, 4.6);
  blade.bezierCurveTo(-0.35, 3.4, -0.7, 1.7, -0.62, 0);
  blade.closePath();
  const geo = new THREE.ExtrudeGeometry(blade, { depth: 0.22, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 4, curveSegments: 40 });
  geo.translate(0, 0, -0.11);
  geo.computeVertexNormals();
  for (const sgn of [-1, 1]) {
    const m = new THREE.Mesh(geo, mat.sculpt);
    m.scale.x = sgn;
    m.rotation.y = sgn * 0.12;
    g.add(m);
  }
  // 두 날개 사이로 새어 나오는 가는 빛
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.035, 3.6, 0.035), new THREE.MeshBasicMaterial({ color: 0xffe3a8 }));
  slit.position.y = 2.3;
  g.add(slit);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.8), new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  glow.position.y = 2.3;
  g.add(glow);
  g.userData.glow = glow;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.08, 48), mat.sculpt);
  foot.position.y = 0.04;
  g.add(foot);
  g.scale.setScalar(1.05);
  return shadowy(g);
}

// 흰 배
function makeBoat() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-1.9, 0);
  shape.quadraticCurveTo(-1.4, 0.75, 0, 0.78);
  shape.quadraticCurveTo(1.6, 0.75, 2.1, 0);
  shape.quadraticCurveTo(1.6, -0.75, 0, -0.78);
  shape.quadraticCurveTo(-1.4, -0.75, -1.9, 0);
  const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 24 });
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.translate(0, 0.55, 0);
  hullGeo.scale(1, 1, 0.82);
  const hull = new THREE.Mesh(hullGeo, mat.sculpt);
  g.add(hull);
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), new THREE.MeshStandardMaterial({ color: 0xc8ab82, roughness: 0.8 }));
  inner.geometry.rotateX(Math.PI / 2);
  inner.geometry.scale(0.84, 1, 0.6);
  inner.position.y = 0.63;
  // 뱃전(테두리)
  const rimLine = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 48), new THREE.MeshStandardMaterial({ color: 0x9b7b55, roughness: 0.6 }));
  rimLine.rotation.x = Math.PI / 2;
  rimLine.scale.set(1.95, 0.66, 1);
  rimLine.position.set(0.05, 0.64, 0);
  g.add(rimLine);
  g.add(inner);
  for (const t of [-0.8, 0.8]) {
    const seatPlank = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 1.05), new THREE.MeshStandardMaterial({ color: 0xcbb592, roughness: 0.8 }));
    seatPlank.position.set(t, 0.68, 0);
    g.add(seatPlank);
  }
  // 돛대와 돛 (부르심: 바다로 나아가는 배) - 바람을 받아 부푼 곡면 돛
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xe9e1d2, roughness: 0.5 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 5.0, 12), mastMat);
  mast.position.set(0.25, 3.1, 0);
  g.add(mast);
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide, emissive: 0xfff4e0, emissiveIntensity: 0.15 });
  const billow = (shape, depth) => {
    const geo = new THREE.ShapeGeometry(shape, 24);
    const pos = geo.attributes.position;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x);
      const v = (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y);
      pos.setZ(i, depth * Math.sin(u * Math.PI) * (1 - v * 0.6));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const main = new THREE.Shape();
  main.moveTo(0.32, 1.05); main.lineTo(0.32, 5.4); main.quadraticCurveTo(1.6, 3.0, 2.2, 1.1); main.closePath();
  const jib = new THREE.Shape();
  jib.moveTo(0.18, 5.0); jib.lineTo(0.18, 1.15); jib.quadraticCurveTo(-1.0, 1.7, -1.85, 0.95); jib.closePath();
  g.add(new THREE.Mesh(billow(main, 0.45), sailMat));
  const j = new THREE.Mesh(billow(jib, -0.35), sailMat);
  g.add(j);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.95, 8), mastMat);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(1.25, 1.05, 0);
  g.add(boom);
  // 금빛 흘수선
  const wl = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 64), new THREE.MeshStandardMaterial({ color: 0xe8c98a, metalness: 0.5, roughness: 0.35 }));
  wl.rotation.x = Math.PI / 2;
  wl.scale.set(2.02, 0.8, 1);
  wl.position.set(0.1, 0.12, 0);
  g.add(wl);
  return g;
}

// 둥근 화면의 세계 풍경 (바다 → 산 → 사막 → 밤 도시)
function drawWorldScreen(g, t) {
  const W = 512;
  const scenes = [ocean, mountain, visionEye, desert, nightCity];
  const dur = 14;
  const idx = window.__screen ?? Math.floor(t / dur) % scenes.length;
  const ph = (t % dur) / dur;
  scenes[idx](g, W, t);
  if (ph > 0.88 && window.__screen === undefined) {
    g.globalAlpha = (ph - 0.88) / 0.12;
    scenes[(idx + 1) % scenes.length](g, W, t);
    g.globalAlpha = 1;
  }
}
function ocean(g, W, t) {
  const sky = g.createLinearGradient(0, 0, 0, W);
  sky.addColorStop(0, '#6f7fd8');
  sky.addColorStop(0.3, '#9fb2e8');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, W);
  g.fillStyle = '#2f6b3a';
  g.beginPath();
  g.moveTo(0, 230);
  for (let x = 0; x <= W; x += 16) g.lineTo(x, 150 + Math.sin(x * 0.02) * 40 + Math.sin(x * 0.07) * 12);
  g.lineTo(W, 330);
  g.lineTo(0, 330);
  g.fill();
  g.fillStyle = '#c99a6a';
  g.fillRect(0, 300, W, 50);
  const sea = g.createLinearGradient(0, 330, 0, W);
  sea.addColorStop(0, '#5fb8c9');
  sea.addColorStop(1, '#2d7fa8');
  g.fillStyle = sea;
  g.fillRect(0, 335, W, W);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 6;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    const y = 340 + k * 26 + ((t * 8) % 26);
    for (let x = 0; x <= W; x += 12) g.lineTo(x, y + Math.sin(x * 0.04 + t + k) * 4);
    g.stroke();
  }
}
function mountain(g, W, t) {
  const sky = g.createLinearGradient(0, 0, 0, W);
  sky.addColorStop(0, '#f2b7a0');
  sky.addColorStop(0.5, '#f7dcc0');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, W);
  g.fillStyle = '#fff3d6';
  g.beginPath();
  g.arc(360, 190, 40, 0, Math.PI * 2);
  g.fill();
  const layers = [['#8a7fa8', 260, 60], ['#6c6a96', 300, 50], ['#4f5a7d', 350, 40]];
  for (const [c, base, amp] of layers) {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(0, W);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, base - Math.abs(Math.sin(x * 0.012 + base + t * 0.02)) * amp * 2);
    g.lineTo(W, W);
    g.fill();
  }
}
function desert(g, W, t) {
  const sky = g.createLinearGradient(0, 0, 0, W);
  sky.addColorStop(0, '#f0c27a');
  sky.addColorStop(0.6, '#f8e2b8');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, W);
  g.fillStyle = '#e6a85c';
  g.beginPath();
  g.moveTo(0, W);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, 330 + Math.sin(x * 0.01 + 1) * 40);
  g.lineTo(W, W);
  g.fill();
  g.fillStyle = '#d18f45';
  g.beginPath();
  g.moveTo(0, W);
  for (let x = 0; x <= W; x += 8) g.lineTo(x, 400 + Math.sin(x * 0.015 + 3) * 30);
  g.lineTo(W, W);
  g.fill();
  // 낙타 행렬
  g.fillStyle = '#6b4a2e';
  for (let k = 0; k < 3; k++) {
    const x = ((t * 6 + k * 40) % (W + 80)) - 40;
    g.beginPath();
    g.ellipse(x, 336, 14, 7, 0, 0, Math.PI * 2);
    g.ellipse(x - 4, 329, 6, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x + 10, 322, 3, 12);
    g.fillRect(x - 10, 340, 2, 10);
    g.fillRect(x + 8, 340, 2, 10);
  }
}
// 비전의 눈: 지구를 품은 눈 (하나님의 눈으로 세상을 봄)
function visionEye(g, W, t) {
  const bg = g.createRadialGradient(W / 2, W / 2, 20, W / 2, W / 2, W * 0.7);
  bg.addColorStop(0, '#fff6e2');
  bg.addColorStop(1, '#e9d3a8');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, W);
  const cx = W / 2, cy = W / 2;
  // 눈의 윤곽
  g.save();
  g.beginPath();
  g.moveTo(40, cy);
  g.quadraticCurveTo(cx, cy - 210, W - 40, cy);
  g.quadraticCurveTo(cx, cy + 210, 40, cy);
  g.closePath();
  g.fillStyle = '#fffdf8';
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#b8894a';
  g.stroke();
  g.clip();
  // 눈동자 = 천천히 도는 지구
  const R = 92;
  const sea = g.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, R);
  sea.addColorStop(0, '#7fc0e8');
  sea.addColorStop(1, '#2f6fa8');
  g.fillStyle = sea;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#8cc58a';
  const sh = (t * 12) % (R * 4);
  for (const [ox, oy, rx, ry] of [[-60, -30, 40, 26], [10, 20, 34, 44], [70, -40, 30, 20], [-20, 60, 26, 16], [110, 30, 28, 30]]) {
    for (const rep of [0, -R * 4]) {
      const x = cx + ((ox + sh + R * 2) % (R * 4)) - R * 2 + rep + R * 2 - R * 2;
      g.beginPath(); g.ellipse(x, cy + oy, rx, ry, 0.3, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath(); g.arc(cx - 34, cy - 38, 14, 0, Math.PI * 2); g.fill();
  g.restore();
}
function nightCity(g, W, t) {
  const sky = g.createLinearGradient(0, 0, 0, W);
  sky.addColorStop(0, '#1d2347');
  sky.addColorStop(1, '#3d3f6e');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, W);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let k = 0; k < 40; k++) g.fillRect((k * 97) % W, (k * 53) % 220, 2, 2);
  let x = 0, k = 0;
  while (x < W) {
    const w = 30 + ((k * 37) % 40), h = 120 + ((k * 71) % 160);
    g.fillStyle = '#272a4d';
    g.fillRect(x, W - h - 60, w, h + 60);
    g.fillStyle = 'rgba(255,214,140,0.85)';
    for (let yy = W - h - 50; yy < W - 70; yy += 14) {
      for (let xx = x + 5; xx < x + w - 6; xx += 10) {
        if (((xx * 13 + yy * 7 + k) % 5) < 2) g.fillRect(xx, yy, 4, 6);
      }
    }
    x += w + 4;
    k++;
  }
  // 작은 십자가 불빛
  g.fillStyle = 'rgba(255,90,90,0.9)';
  g.fillRect(140, 250, 3, 16);
  g.fillRect(135, 255, 13, 3);
  void t;
}
