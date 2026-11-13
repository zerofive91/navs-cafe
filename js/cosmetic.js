// 꾸미기 (2026-11): 날개·탈것·머리 장식. 능력이 없는 겉모습뿐이고, 루디아의 가게에서 돈으로 사서 내 카드에서 갖추고 벗음
//   한 칸에 하나씩: 날개 하나, 탈것 하나, 머리 장식 하나. 다른 사람 화면에도 보임 (together.js의 c·rd)
//   탈것은 바깥(카페 건물 밖)에서 서 있거나 걸을 때만 타고, 앉거나 무언가를 하면 내림. 빌린 나귀(shop.js)를 쓰는 동안은 그 나귀를 탐
import * as THREE from 'three';
import { R_HALL } from './layout.js';
import { jo, saveProfile, spend, stageOf, STAGES } from './profile.js';

export const COS_KINDS = [['wing', '날개'], ['mount', '탈것'], ['head', '머리 장식']];
// need: 이 단계(STAGES의 이름)부터 살 수 있음
export const COS = {
  dove: { kind: 'wing', name: '비둘기 날개', price: 12, verse: ['나의 말이 만일 내가 비둘기 같이 날개가 있으면 날아가서 편히 쉬리로다', '시편 55:6'] },
  eagle: { kind: 'wing', name: '독수리 날개', price: 25, verse: ['오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리의 날개치며 올라감 같을 것이요', '이사야 40:31'] },
  dawn: { kind: 'wing', name: '새벽 날개', price: 30, verse: ['내가 새벽 날개를 치며 바다 끝에 가서 거할찌라도 곧 거기서도 주의 손이 나를 인도하시며', '시편 139:9-10'] },
  cherub: { kind: 'wing', name: '그룹의 금 날개', price: 60, need: '제자', verse: ['그룹들은 날개를 높이 펴서 그 날개로 속죄소를 덮으며', '출애굽기 25:20'] },
  seraph: { kind: 'wing', name: '스랍의 여섯 날개', price: 120, need: '일꾼', verse: ['스랍들은 모셔 섰는데 각기 여섯 날개가 있어 그 둘로는 자기 얼굴을 가리웠고 그 둘로는 자기 발을 가리웠고 그 둘로는 날며', '이사야 6:2'] },
  donkey: { kind: 'mount', name: '어린 나귀', price: 15, verse: ['그는 공의로우며 구원을 베풀며 겸손하여서 나귀를 타나니 나귀의 작은 것 곧 나귀 새끼니라', '스가랴 9:9'] },
  camel: { kind: 'mount', name: '낙타', price: 30, verse: ['리브가가 일어나 비자들과 함께 약대를 타고 그 사람을 따라가니', '창세기 24:61'] },
  horse: { kind: 'mount', name: '백마', price: 60, need: '제자', verse: ['하늘에 있는 군대들이 희고 깨끗한 세마포를 입고 백마를 타고 그를 따르더라', '요한계시록 19:14'] },
  fire: { kind: 'mount', name: '불말과 불병거', price: 150, need: '일꾼', verse: ['불말과 불병거가 산에 가득하여 엘리사를 둘렀더라', '열왕기하 6:17'] },
  lily: { kind: 'head', name: '백합 화관', price: 6, verse: ['들의 백합화가 어떻게 자라는가 생각하여 보라 수고도 아니하고 길쌈도 아니하느니라', '마태복음 6:28'] },
  olive: { kind: 'head', name: '감람 잎 관', price: 8, verse: ['저녁때에 비둘기가 그에게로 돌아왔는데 그 입에 감람 새 잎사귀가 있는지라', '창세기 8:11'] },
  star: { kind: 'head', name: '빛나는 별', price: 40, need: '제자', verse: ['많은 사람을 옳은 데로 돌아오게 한 자는 별과 같이 영영토록 빛나리라', '다니엘 12:3'] },
};
export const cosLocked = (p, id) => { const n = COS[id].need; return n && STAGES.indexOf(stageOf(p.steps)) < STAGES.findIndex((s) => s.name === n) ? n : null; };

// ---------- 모양 ----------
const mats = {};
const M = (c, o = {}) => { const k = c + JSON.stringify(o); return (mats[k] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o })); };
const glowM = (c, op = 0.35) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
const sph = (r, mat, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat); o.scale.set(sx, sy, sz); return o; };
const cyl = (r1, r2, h, mat, n = 8) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, n), mat);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// 깃털 부채 하나: 어깨 쪽 축에서 바깥으로 펼쳐짐 (side -1 왼쪽, 1 오른쪽)
function feathers({ n, span, from, to, cols, tip, w = 0.07, emi }) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0 : i / (n - 1), a = from + (to - from) * k;
    const L = span * (1 - k * 0.38);
    const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
    const f = sph(1, M(col, emi ? { emissive: col, emissiveIntensity: emi, roughness: 0.4 } : { roughness: 0.7 }), L / 2, w * (1 - k * 0.3), 0.022);
    f.position.set(Math.cos(a) * L / 2, Math.sin(a) * L / 2, -i * 0.004);
    f.rotation.z = a;
    g.add(f);
    if (tip) { const t = sph(1, M(tip), L * 0.14, w * 0.75, 0.024); t.position.set(Math.cos(a) * L * 0.9, Math.sin(a) * L * 0.9, 0.002); t.rotation.z = a; g.add(t); }
  }
  return g;
}
const WINGS = {
  dove: () => [feathers({ n: 5, span: 0.5, from: 0.75, to: -0.7, cols: [0xffffff, 0xf6f4ee] })],
  eagle: () => [feathers({ n: 6, span: 0.72, from: 0.6, to: -0.75, cols: [0x5a3a22, 0x6b4a2e, 0x7a5636], tip: 0xf1ead8, w: 0.075 })],
  dawn: () => [feathers({ n: 6, span: 0.6, from: 0.8, to: -0.6, cols: [0xffc8a0, 0xffb0b8, 0xf6a0c8, 0xd8a8f0], emi: 0.35 })],
  cherub: () => [feathers({ n: 6, span: 0.78, from: 1.25, to: 0.1, cols: [0xf0c860, 0xe8b850], emi: 0.3, w: 0.08 })],
  seraph: () => [
    feathers({ n: 4, span: 0.6, from: 1.35, to: 0.75, cols: [0xfffaf0], emi: 0.6 }),
    feathers({ n: 5, span: 0.7, from: 0.45, to: -0.35, cols: [0xfffaf0, 0xfff2d8], emi: 0.6 }),
    feathers({ n: 4, span: 0.5, from: -0.8, to: -1.35, cols: [0xfff2d8], emi: 0.6 }),
  ],
};
function makeWings(id) {
  const rig = new THREE.Group();
  rig.position.set(0, 0.7, -0.27);
  const sides = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.x = s * 0.06;
    const fan = new THREE.Group();
    WINGS[id]().forEach((f) => fan.add(f));
    fan.scale.x = s;
    piv.add(fan);
    rig.add(piv);
    sides.push(piv);
  }
  rig.userData.sides = sides;
  return rig;
}

// 머리 장식: 머리 위 (head 그룹 기준)
function makeHead(id) {
  const g = new THREE.Group();
  if (id === 'lily') {
    g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.022, 6, 24), M(0x6aa04a)), 0, 0, 0)).rotation.x = Math.PI / 2;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2, fl = new THREE.Group();
      for (let p = 0; p < 4; p++) { const pe = sph(0.035, M(k % 2 ? 0xfff8f0 : 0xffe6f0), 1, 0.5, 1.6); pe.rotation.y = (p / 4) * Math.PI * 2; pe.position.set(Math.sin(pe.rotation.y) * 0.03, 0, Math.cos(pe.rotation.y) * 0.03); fl.add(pe); }
      fl.add(sph(0.016, M(0xf2c84a)));
      fl.position.set(Math.cos(a) * 0.24, 0.02, Math.sin(a) * 0.24);
      g.add(fl);
    }
    g.position.set(0, 0.22, -0.02); g.rotation.x = -0.25;
  } else if (id === 'olive') {
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 1.7 + Math.PI * 0.65, lf = sph(0.06, M(k % 2 ? 0x7f9a52 : 0x6a8746), 1, 0.35, 0.45);
      lf.position.set(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25);
      lf.rotation.y = -a; lf.rotation.z = 0.5;
      g.add(lf);
    }
    g.position.set(0, 0.2, -0.02); g.rotation.x = -0.25;
  } else if (id === 'star') {
    const shape = new THREE.Shape();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.05 : 0.12, a = (k / 10) * Math.PI * 2 + Math.PI / 2; k ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const st = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }), M(0xffe08a, { emissive: 0xffc840, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.3 }));
    st.position.z = -0.017;
    const glow = sph(0.15, glowM(0xfff0b0, 0.12)); glow.castShadow = false;
    g.add(st, glow);
    g.position.set(0, 0.55, 0);
    g.userData.spin = st;
  }
  return g;
}

// 탈것: 몸은 +z(앞)을 봄. seat: 탄 사람의 몸을 올리는 높이, stand: 서서 탐(병거)
function legs4(g, { mat, hoof, len, y, x, zf, zb, r = 0.05 }) {
  const L = [];
  for (const [lx, lz] of [[-x, zf], [x, zf], [-x, zb], [x, zb]]) {
    const p = new THREE.Group(); p.position.set(lx, y, lz);
    p.add(at(cyl(r, r * 0.85, len, mat), 0, -len / 2, 0));
    p.add(at(cyl(r * 1.05, r * 1.15, 0.06, M(hoof)), 0, -len, 0));
    g.add(p); L.push(p);
  }
  return L;
}
function beast(kind) {
  const g = new THREE.Group();
  const C = {
    donkey: { col: 0x8f8a84, belly: 0xd8d2c8, mane: 0x4a4440, len: 0.42, h: 0.62, r: 0.2, body: 0.42, neck: [0, 0.82, 0.32], head: [0, 0.98, 0.52], ears: true, blanket: 0xb04a3a },
    camel: { col: 0xc9a46a, belly: 0xd8b880, mane: 0xa8824a, len: 0.72, h: 0.95, r: 0.24, body: 0.5, neck: [0, 1.12, 0.45], head: [0, 1.32, 0.72], hump: true, blanket: 0x3a6aa8 },
    horse: { col: 0xf6f3ec, belly: 0xffffff, mane: 0xe6dcc0, len: 0.58, h: 0.8, r: 0.21, body: 0.55, neck: [0, 1.05, 0.4], head: [0, 1.22, 0.62], blanket: 0x4a6ab0 },
    fire: { col: 0xff7a2a, belly: 0xffb050, mane: 0xffe070, len: 0.58, h: 0.8, r: 0.21, body: 0.55, neck: [0, 1.05, 0.4], head: [0, 1.22, 0.62], emi: 0.8 },
  }[kind];
  const m = (c) => M(c, C.emi ? { emissive: c, emissiveIntensity: C.emi, roughness: 0.5 } : { roughness: 0.75 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(C.r, C.body, 6, 12), m(C.col));
  body.rotation.x = Math.PI / 2; body.position.y = C.h; g.add(body);
  g.add(at(sph(C.r * 0.9, m(C.belly), 1, 0.6, 1.8), 0, C.h - C.r * 0.45, 0));
  const legs = legs4(g, { mat: m(C.col), hoof: C.emi ? 0xffe070 : 0x3a3230, len: C.len, y: C.h - 0.05, x: C.r * 0.6, zf: C.body * 0.45, zb: -C.body * 0.45 });
  // 목·머리
  const nk = cyl(C.r * 0.42, C.r * 0.55, 0.42, m(C.col), 10);
  const [nx, ny, nz] = C.neck; nk.position.set(nx, ny, nz); nk.rotation.x = kind === 'camel' ? 0.9 : 0.6; g.add(nk);
  const head = new THREE.Group(); head.position.set(...C.head); g.add(head);
  head.add(at(sph(C.r * 0.55, m(C.col), 0.9, 0.85, 1.6), 0, 0, 0.02));
  head.add(at(sph(C.r * 0.42, m(C.belly), 0.9, 0.8, 1), 0, -0.04, C.r * 0.6));
  for (const s of [-1, 1]) head.add(at(sph(0.022, M(0x2a2420)), s * C.r * 0.42, 0.04, C.r * 0.3));
  if (C.ears) for (const s of [-1, 1]) { const e = at(sph(0.04, m(C.col), 0.6, 2.6, 0.5), s * 0.07, 0.17, -0.06); e.rotation.z = -s * 0.35; head.add(e); }
  else for (const s of [-1, 1]) { const e = at(sph(0.03, m(C.col), 0.6, 1.6, 0.5), s * 0.06, 0.12, -0.06); head.add(e); }
  // 갈기·꼬리
  if (kind !== 'camel') for (let k = 0; k < 5; k++) g.add(at(sph(0.05, m(C.mane), 0.6, 1, 1.4), 0, ny + 0.06 + k * 0.035, nz - 0.1 + k * 0.05));
  const tail = new THREE.Group(); tail.position.set(0, C.h + 0.05, -C.body / 2 - C.r * 0.8); g.add(tail);
  tail.add(at(cyl(0.02, 0.012, 0.3, m(C.col)), 0, -0.14, 0));
  tail.add(at(sph(0.05, m(C.mane), 0.8, 1.6, 0.8), 0, -0.3, 0));
  tail.rotation.x = -0.35;
  if (C.hump) g.add(at(sph(0.2, m(C.col), 1, 1, 1.3), 0, C.h + C.r * 0.9, -0.24));
  if (C.blanket) {
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(C.r * 2.2, 0.03, 0.34), M(C.blanket)), 0, C.h + C.r * 0.93, 0));
    for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.34), M(C.blanket)), s * C.r * 1.08, C.h + C.r * 0.55, 0));
  }
  // 불말: 갈기와 꼬리에 일렁이는 불꽃
  const flames = [];
  if (C.emi) {
    for (let k = 0; k < 9; k++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 6), glowM(k % 2 ? 0xffd040 : 0xff6020, 0.7));
      f.position.set((Math.random() - 0.5) * 0.08, ny + 0.12 + k * 0.03, nz - 0.18 + k * 0.05); f.castShadow = false;
      g.add(f); flames.push(f);
    }
    const aura = sph(0.42, glowM(0xff8030, 0.1), 0.8, 0.9, 1.5); aura.position.y = C.h; aura.castShadow = false; g.add(aura);
  }
  return { g, legs, head, tail, flames, seat: C.h + C.r * 0.95 };
}
function makeMount(id) {
  const root = new THREE.Group();
  const anim = { legs: [], wheels: [], flames: [], heads: [], tails: [] };
  let seat, stand = false;
  if (id === 'fire') {
    // 병거: 사람은 서서 타고, 불말 두 마리가 앞에서 끔
    stand = true;
    const gold = M(0xffb040, { emissive: 0xff7a20, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.35 });
    root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.5), gold), 0, 0.32, 0));
    root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.05), gold), 0, 0.5, 0.25));
    for (const s of [-1, 1]) {
      root.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.5), gold), s * 0.31, 0.45, 0));
      const w = new THREE.Group(); w.position.set(s * 0.38, 0.3, -0.04);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 6, 18), gold); ring.rotation.y = Math.PI / 2; w.add(ring);
      for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.54, 0.02), gold); sp.rotation.x = (k / 3) * Math.PI; w.add(sp); }
      root.add(w); anim.wheels.push(w);
    }
    const pole = at(cyl(0.02, 0.02, 0.9, gold), 0, 0.45, 0.65); pole.rotation.x = Math.PI / 2; root.add(pole);
    for (const s of [-1, 1]) {
      const b = beast('fire'); b.g.scale.setScalar(0.85); b.g.position.set(s * 0.3, 0, 1.25);
      root.add(b.g); anim.legs.push(...b.legs); anim.flames.push(...b.flames); anim.heads.push(b.head); anim.tails.push(b.tail);
    }
    seat = 0.3;
  } else {
    const b = beast(id);
    root.add(b.g); anim.legs.push(...b.legs); anim.heads.push(b.head); anim.tails.push(b.tail);
    seat = b.seat - 0.3; // 탄 사람의 엉덩이(다리 축 0.32)가 안장 위에 오도록
    if (id === 'camel') b.g.position.z = 0.08;
  }
  root.traverse((c) => { if (c.isMesh && c.castShadow !== false && !(c.material && c.material.blending === THREE.AdditiveBlending)) c.castShadow = true; });
  root.userData = { anim, seat, stand };
  return root;
}

// ---------- 캐릭터에 입히기 ----------
// c: { wing, mount, head } (없으면 빈 값). 같은 모양이면 그대로 둠
export function setCosmetic(av, c = {}) {
  const u = av.userData;
  if (!u.body) return;
  const key = [c.wing || '', c.mount || '', c.head || ''].join('.');
  if (u.cosKey === key) return;
  u.cosKey = key;
  for (const o of u.cos || []) o.parent && o.parent.remove(o);
  u.cos = [];
  u.cosWing = c.wing && WINGS[c.wing] ? makeWings(c.wing) : null;
  u.cosMount = c.mount && COS[c.mount] ? makeMount(c.mount) : null;
  u.cosHead = c.head && COS[c.head] ? makeHead(c.head) : null;
  if (u.cosWing) { u.body.add(u.cosWing); u.cos.push(u.cosWing); u.cosWing.traverse((o) => { if (o.isMesh && o.material.blending !== THREE.AdditiveBlending) o.castShadow = true; }); }
  if (u.cosMount) { av.add(u.cosMount); u.cos.push(u.cosMount); u.cosMount.visible = false; }
  if (u.cosHead) { u.head.add(u.cosHead); u.cos.push(u.cosHead); }
  u.cosPose = u.cos.length ? cosPose : null;
  if (!u.cos.length) u.legs.forEach((l) => { l.rotation.z = 0; });
}

// poseAvatar 끝에서 부름: 날갯짓, 탈것 걸음, 탄 자세
function cosPose(av, ch, t, dt) {
  const u = av.userData;
  const walking = ch.state === 'walk', run = walking && ch.running;
  if (u.cosWing) {
    const f = run ? 9 : walking ? 5 : 1.6, amp = run ? 0.42 : walking ? 0.2 : 0.07;
    const s = Math.sin(t * f + (ch.phase || 0));
    u.cosWing.userData.sides.forEach((p, i) => { const k = i ? -1 : 1; p.rotation.y = k * (0.45 + s * amp); p.rotation.z = -k * s * amp * 0.4; });
  }
  if (u.cosHead) {
    u.cosHead.visible = u.outfit !== 'glory' && !(u.pieces || []).includes('helmet'); // 투구·면류관과 겹치지 않게
    if (u.cosHead.userData.spin) { u.cosHead.userData.spin.rotation.y = t * 1.2; u.cosHead.position.y = 0.55 + Math.sin(t * 2) * 0.025; }
  }
  const M = u.cosMount;
  const ride = !!M && !!(ch.ride || u.previewRide) && ch.state !== 'sit';
  if (M) M.visible = ride;
  u.legs.forEach((l) => { l.rotation.z = 0; });
  if (!ride) return;
  const { anim, seat, stand } = M.userData;
  const ph = t * (run ? 13 : 8) + (ch.phase || 0);
  const g = walking ? Math.sin(ph) * (run ? 0.75 : 0.45) : 0;
  anim.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? g : -g); });
  anim.heads.forEach((h) => { h.rotation.x = walking ? Math.sin(ph * 2) * 0.08 : Math.sin(t * 1.3) * 0.05; });
  anim.tails.forEach((h) => { h.rotation.z = Math.sin(t * 3) * 0.3; });
  anim.wheels.forEach((w) => { w.rotation.x += (walking ? (run ? 9 : 4.5) : 0) * dt; });
  anim.flames.forEach((f, i) => { const k = 0.7 + Math.sin(t * 14 + i * 1.7) * 0.3; f.scale.set(k, 0.6 + k * 0.7, k); });
  const bob = walking ? Math.abs(Math.sin(ph)) * (run ? 0.06 : 0.03) : 0;
  M.position.y = stand ? 0 : -bob * 0.5;
  // 탄 사람: 몸을 안장 높이로, 다리는 벌려 걸치고(병거는 서서), 손은 고삐를 쥠
  u.body.position.y = seat + (stand ? Math.sin(t * 2) * 0.006 : bob * 0.5 + Math.sin(t * 2) * 0.004);
  if (!stand) u.legs.forEach((l, i) => { l.rotation.x = -0.75; l.rotation.z = i ? -0.55 : 0.55; });
  else u.legs.forEach((l) => { l.rotation.x = 0; });
  if (!ch.action) { u.arms[0].rotation.x = -0.75; u.arms[1].rotation.x = -0.75; u.arms[0].rotation.z = 0.25; u.arms[1].rotation.z = -0.25; }
}

// ---------- 나의 꾸미기 ----------
export let cosApi = null; // 내 카드(character.js)와 가게(shop.js)에서 씀
export function initCosmetic({ me, profile, toast, sfx, burst }) {
  const fix = () => {
    const c = profile.cos && typeof profile.cos === 'object' ? profile.cos : {};
    profile.cos = { owned: (c.owned || []).filter((id) => COS[id]), wing: c.wing || '', mount: c.mount || '', head: c.head || '' };
    return profile.cos;
  };
  fix();
  const owned = (id) => profile.cos.owned.includes(id);
  const worn = (id) => owned(id) && profile.cos[COS[id].kind] === id;
  let shown = '';
  function apply() {
    const c = profile.cos;
    const rent = performance.now() < (me.donkeyUntil || 0) && !c.mount; // 빌린 나귀를 타는 동안 (탈것이 없을 때)
    const want = { wing: owned(c.wing) ? c.wing : '', mount: owned(c.mount) ? c.mount : rent ? 'donkey' : '', head: owned(c.head) ? c.head : '' };
    const key = [want.wing, want.mount, want.head].join('.');
    if (key !== shown) { shown = key; setCosmetic(me.av, want); }
    me.av.userData.cosCode = key === '..' ? '' : key;
  }
  function step() {
    if (profile.cos !== fix.last) { fix(); fix.last = profile.cos; } // 다른 기기 기록과 합쳐져 바뀐 경우
    apply();
    const u = me.av.userData;
    me.ride = !!u.cosMount && Math.hypot(me.x, me.z) > R_HALL + 1.2 && !me.swim && !me.climb && !u.courseOutfit && me.state !== 'sit' && !me.action;
  }
  function toggle(id) {
    const g = COS[id];
    if (!g) return '';
    if (!owned(id)) return `${g.name}: 루디아의 가게에서 ${g.price} 데나리온${g.need ? ` (${g.need} 단계부터)` : ''}`;
    profile.cos[g.kind] = worn(id) ? '' : id;
    saveProfile(profile); apply();
    if (worn(id)) { sfx?.('orb', 0.18, 1.2); burst?.(me.x, me.y + 1, me.z); }
    return worn(id) ? `${g.name}${jo(g.name, '을', '를')} 갖추었어요 (${g.verse[1]})${g.kind === 'mount' ? '. 카페 밖에서 서 있거나 걸을 때 타요' : ''}` : `${g.name}${jo(g.name, '을', '를')} 벗었어요`;
  }
  function buy(id) {
    const g = COS[id];
    if (!g || owned(id)) return '';
    const lock = cosLocked(profile, id);
    if (lock) return `${g.name}${jo(g.name, '은', '는')} ${lock} 단계부터 살 수 있어요`;
    if (!spend(profile, g.price)) return '돈이 모자라요.';
    profile.cos.owned.push(id);
    profile.cos[g.kind] = id;
    saveProfile(profile); apply();
    burst?.(me.x, me.y + 1.2, me.z);
    return `${g.name}${jo(g.name, '을', '를')} 사서 갖추었어요. 내 카드의 꾸미기에서 벗거나 바꿀 수 있어요`;
  }
  // 내 카드 속 모습: 탈것이 있으면 카페 안에서도 탄 모습으로 찍어 보여 줌
  //   앞에서만 찍으면 탈것 머리에 가리고 날개가 안 보이므로, 찍는 동안만 비스듬히 돌리고 키만큼 내려 화면에 다 들어오게 함
  let keep = null;
  const preview = (on) => {
    const u = me.av.userData, av = me.av;
    if (on && !keep) {
      u.previewRide = true;
      keep = { ry: av.rotation.y, s: av.scale.x };
      if (u.cosMount || u.cosWing) av.rotation.y += u.cosMount ? 0.95 : 0.6;
      if (u.cosMount) av.scale.setScalar(Math.min(1, 1.45 / (u.cosMount.userData.seat + 1.3)));
    } else if (!on && keep) {
      u.previewRide = false;
      av.rotation.y = keep.ry; av.scale.setScalar(keep.s); keep = null;
    }
  };
  apply();
  cosApi = { owned, worn, toggle, buy, step, preview, apply };
  return cosApi;
}
