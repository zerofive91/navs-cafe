// 정원의 수레바퀴 다섯 훈련장 (2026-11, 예전 운동장·캠핑장 자리)
//   말씀: 에스라 (스 7:10) - 다섯 기둥(듣기·읽기·연구·묵상·적용)을 차례로 들러 한 구절씩
//   기도: 다니엘 (단 6:10) - 찬양·자백·감사·간구 네 제단에서 손 모으기
//   교제: 아굴라와 브리스길라 (갈 6:2) - 짐 보따리 셋을 장막 짓는 탁자로 함께 나르기
//   증거: 빌립 (행 8:30) - 길 가는 세 사람에게 다가가 빛 건네기
//   순종: 아브라함 (창 12:4, 히 11:8) - 갈 바를 몰라도 앞서가는 등불을 따라 걷기
// 사부 곁에 가면 말을 걸고, 기초 과정을 마치면 그 능력치와 걸음이 자라고 성경 물품을 받음
import * as THREE from 'three';
import { TRAIN, floorY } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, giveItem, earn, ITEMS, STATS } from './profile.js';

const V = (k, text, ref) => { VERSES[k] = [text, ref]; return k; };
const STEP_REWARD = 20, STAT_REWARD = 10;

export function initTraining(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange } = K;
  const M = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const stone = M(0xe8e0d0, 0.9), wood = M(0x8a6a4a), cloth = M(0xe6d6b0, 1);
  const G = (p) => floorY(p.x, p.z);
  const put = (o, p, y = 0) => { o.position.set(p.x, G(p) + y, p.z); scene.add(o); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  const label = (text, size = 0.9) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = '700 34px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,250,238,0.9)'; g.beginPath(); g.roundRect(48, 6, 160, 52, 26); g.fill();
    g.fillStyle = '#6b4c32'; g.fillText(text, 128, 33);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(size * 2, size * 0.5, 1);
    return sp;
  };
  const npc = (name, look, p, faceTo) => {
    const n = makeChar({ bag: look.hoodie, style: 0, pants: 0x5a5048, ...look }, p.x, p.z);
    n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false; // 가방 없음
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { x: p.x, z: p.z }; n.face = Math.atan2(faceTo.x - p.x, faceTo.z - p.z); n.face0 = n.face;
    npcs.push(n);
    return n;
  };
  const toCafe = (p) => ({ x: p.x * 0.8, z: p.z * 0.8 });
  const glowRing = (r, color) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; return m;
  };

  // ---------- 말씀 훈련장: 다섯 기둥 ----------
  const W = TRAIN.word;
  const WORD = [
    ['듣기', V('t-w0', '그러므로 믿음은 들음에서 나며 들음은 그리스도의 말씀으로 말미암았느니라', '로마서 10:17')],
    ['읽기', V('t-w1', '이 예언의 말씀을 읽는 자와 듣는 자들과 그 가운데 기록한 것을 지키는 자들이 복이 있나니', '요한계시록 1:3')],
    ['연구', V('t-w2', '간절한 마음으로 말씀을 받고 이것이 그러한가 하여 날마다 성경을 상고하므로', '사도행전 17:11')],
    ['묵상', V('t-w3', '오직 여호와의 율법을 즐거워하여 그 율법을 주야로 묵상하는 자로다', '시편 1:2')],
    ['적용', V('t-w4', '너희는 도를 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지말라', '야고보서 1:22')],
  ];
  const pillars = W.pillars.map((p, i) => {
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 2.2, 14), stone); col.position.y = 1.1; g.add(col);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.9), stone); cap.position.y = 2.28; g.add(cap);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M(0xffd98a, 0.4, { emissive: 0xffc860, emissiveIntensity: 0 })); fire.position.y = 2.55; g.add(fire);
    const tag = label(WORD[i][0]); tag.position.y = 3.1; g.add(tag);
    const ring = glowRing(1.2, 0xffe2a0); ring.position.set(p.stand.x - p.x, 0.04, p.stand.z - p.z); g.add(ring);
    put(g, p);
    return { g, fire, ring, p };
  });
  const lectern = new THREE.Group();
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.4), wood); b.position.y = 0.5; lectern.add(b); const top = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.55), wood); top.position.y = 1.04; top.rotation.x = -0.3; lectern.add(top); const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10), cloth); sc.rotation.z = Math.PI / 2; sc.position.set(0, 1.12, 0); lectern.add(sc); }
  put(lectern, W.zone.at(1.3, -4.2)); lectern.rotation.y = W.zone.rot;
  const ezra = npc('에스라', { hoodie: 0x7a8fb8, hair: 0x6b6b6b }, W.npc, toCafe(W.npc));

  // ---------- 기도 훈련장: 네 제단과 열린 창 ----------
  const R = TRAIN.pray;
  const PRAY = [
    ['찬양', V('t-p0', '여호와는 광대하시니 크게 찬양할 것이라 그의 광대하심을 측량치 못하리로다', '시편 145:3')],
    ['자백', V('t-p1', '만일 우리가 우리 죄를 자백하면 저는 미쁘시고 의로우사 우리 죄를 사하시며 모든 불의에서 우리를 깨끗케 하실 것이요', '요한일서 1:9')],
    ['감사', V('t-p2', '범사에 감사하라 이는 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', '데살로니가전서 5:18')],
    ['간구', V('t-p3', '아무 것도 염려하지 말고 오직 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라', '빌립보서 4:6')],
  ];
  const altars = R.altars.map((p, i) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.9), stone); b.position.y = 0.42; g.add(b);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), M(0xffb050, 0.4, { emissive: 0xff9a30, emissiveIntensity: 0.9 })); flame.position.y = 1.08; flame.visible = false; g.add(flame);
    const tag = label(PRAY[i][0]); tag.position.y = 1.9; g.add(tag);
    const ring = glowRing(1.0, 0xd8c0ff); ring.position.set(p.stand.x - p.x, 0.04, p.stand.z - p.z); g.add(ring);
    put(g, p);
    return { g, flame, ring, p };
  });
  { // 예루살렘으로 향하여 열린 창 (단 6:10)
    const g = new THREE.Group();
    for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), wood); post.position.set(s * 1.1, 1.3, 0); g.add(post); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.24), wood); top.position.y = 2.6; g.add(top);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.3), wood); sill.position.y = 1.0; g.add(sill);
    for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.06), M(0x6a8aa8)); sh.position.set(s * 1.6, 1.8, 0.3); sh.rotation.y = s * 0.9; g.add(sh); }
    put(g, R.zone.at(0, 5.6)); g.rotation.y = R.zone.rot + Math.PI / 2;
  }
  const daniel = npc('다니엘', { hoodie: 0x8a6ab0, hair: 0x2b211c }, R.npc, R.zone.at(0, 0));

  // ---------- 교제 훈련장: 장막 짓는 집 ----------
  const F = TRAIN.fellow;
  { // 장막 틀과 탁자
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.4), wood); top.position.y = 0.8; g.add(top);
    for (const a of [-1, 1]) for (const b of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), wood); l.position.set(a * 1.05, 0.4, b * 0.55); g.add(l); }
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 12), cloth); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.0, 0); g.add(roll);
    put(g, F.table); g.rotation.y = F.zone.rot + Math.PI / 2;
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.8, 4, 1, true), M(0xd9c49a, 1, { side: THREE.DoubleSide })); tent.position.y = 1.4; tent.rotation.y = Math.PI / 4;
    const tg = new THREE.Group(); tg.add(tent); put(tg, F.zone.at(6.5, 4.4));
  }
  const sackGeo = new THREE.SphereGeometry(0.32, 12, 10), sackMat = M(0xc8a878, 1);
  const sacks = [0, 1, 2].map((k) => { const s = new THREE.Mesh(sackGeo, sackMat); s.scale.set(1, 0.8, 1); const g = new THREE.Group(); g.add(s); put(g, F.zone.at(-6.5 + (k - 1) * 0.75, 1.2 + (k % 2) * 0.5), 0.26); return g; });
  const carried = new THREE.Mesh(sackGeo, sackMat); carried.scale.set(1, 0.8, 1); carried.visible = false; scene.add(carried);
  const aquila = npc('아굴라', { hoodie: 0x9a7a54, hair: 0x3b2a22 }, F.npc, F.table);
  const priscilla = npc('브리스길라', { hoodie: 0xc87a6a, hair: 0x5a3b2a, style: 1 }, F.npc2, F.table);

  // ---------- 증거 훈련장: 길 가는 사람들 ----------
  const X = TRAIN.witness;
  { // 흙길
    const a = X.road[0], b = X.road[1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, len + 3), M(0xd8c49a, 1));
    m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(b.x - a.x, b.z - a.z);
    m.position.set((a.x + b.x) / 2, G(a) + 0.02, (a.z + b.z) / 2); m.receiveShadow = true; scene.add(m);
  }
  const philip = npc('빌립', { hoodie: 0x6a9a5a, hair: 0x3b2a22 }, X.npc, X.road[0]);
  const SEEK = [0x8fb7e0, 0xf4d27a, 0xb9a6e0];
  const seekers = SEEK.map((c, k) => {
    const f = 0.15 + k * 0.35, a = X.road[0], b = X.road[1];
    const p = { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
    const n = makeChar({ hoodie: c, hair: [0x22201f, 0x7a5634, 0x5a3b2a][k], bag: 0x5b6b8a, style: k % 2 }, p.x, p.z);
    npcs.push(n);
    n.seek = { f, dir: k % 2 ? 1 : -1, lit: false, glow: null };
    return n;
  });

  // ---------- 순종 훈련장: 장막, 등불, 마므레 상수리나무 ----------
  const O = TRAIN.obey;
  { const t = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 6, 1, true), M(0xcdb48a, 1, { side: THREE.DoubleSide })); t.position.y = 1.1; const g = new THREE.Group(); g.add(t); put(g, O.tent); }
  {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 10), wood); trunk.position.y = 1.5; g.add(trunk);
    for (const [x, y, z, r] of [[0, 3.6, 0, 1.9], [1, 3.2, 0.4, 1.3], [-1, 3.3, -0.3, 1.4]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), M(0x5f8f4a)); c.position.set(x, y, z); g.add(c); }
    const alt = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), stone); alt.position.set(-1.6, 0.25, -1); g.add(alt);
    put(g, O.oak);
  }
  const lantern = new THREE.Group();
  { const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), M(0xfff0c0, 0.3, { emissive: 0xffd070, emissiveIntensity: 1.2 })); lantern.add(core); lantern.add(fxSprite('light_01', 0xffd98a, 1.4)); }
  lantern.visible = false; scene.add(lantern);
  const pathDots = O.way.slice(1).map((p) => { const d = glowRing(0.35, 0xffe2a0); d.position.set(p.x, G(p) + 0.04, p.z); d.visible = false; scene.add(d); return d; });
  const abraham = npc('아브라함', { hoodie: 0xcdb48a, hair: 0xd8d0c0 }, O.npc, O.way[0]);

  // ---------- 훈련 정의 ----------
  const near = (p, d) => Math.hypot(me.x - p.x, me.z - p.z) < d;
  const T = {
    word: {
      who: ezra, stat: 'word', item: 'scroll', name: '말씀 훈련장',
      intro: '저는 학사 에스라예요. 말씀은 듣고, 읽고, 연구하고, 묵상하고, 행할 때 내 것이 돼요. 다섯 기둥을 차례로 들러 볼까요?',
      verse: '에스라가 여호와의 율법을 연구하여 준행하며 율례와 규례를 이스라엘에게 가르치기로 결심하였었더라 (에스라 7:10)',
      total: 5,
      hint: (i) => `${WORD[i][0]} 기둥 앞, 빛나는 자리에 서 보세요.`,
      start() { pillars.forEach((p) => { p.fire.material.emissiveIntensity = 0; }); },
      check(r) { const p = pillars[r.i]; if (near(p.p.stand, 1.5)) { p.fire.material.emissiveIntensity = 1.4; showVerse(WORD[r.i][1], { cooldown: 0, title: WORD[r.i][0] }); return true; } return false; },
      glow(r, t) { pillars.forEach((p, i) => { p.ring.material.opacity = r && i === r.i ? 0.45 + Math.sin(t * 4) * 0.25 : 0; }); },
      done: '잘했어요. 말씀은 날마다 이렇게 먹는 양식이에요. 이 두루마리를 가져가요.',
    },
    pray: {
      who: daniel, stat: 'prayer', item: 'incense', name: '기도 훈련장',
      intro: '저는 다니엘이에요. 저는 하루 세 번 창을 열고 무릎을 꿇었어요. 네 제단에서 차례로 기도해 볼까요? 찬양, 자백, 감사, 간구예요.',
      verse: '그 방의 예루살렘으로 향하여 열린 창에서 전에 행하던대로 하루 세번씩 무릎을 꿇고 기도하며 그 하나님께 감사하였더라 (다니엘 6:10)',
      total: 4,
      hint: (i) => `${PRAY[i][0]}의 제단 앞에서 기도하세요 (X 또는 기도 단추).`,
      start() { altars.forEach((a) => { a.flame.visible = false; }); },
      check(r, dt) {
        const a = altars[r.i];
        if (near(a.p.stand, 1.8) && me.action === 'pray') r.hold = (r.hold || 0) + dt; else r.hold = 0;
        if (r.hold > 2) { r.hold = 0; a.flame.visible = true; showVerse(PRAY[r.i][1], { cooldown: 0, title: PRAY[r.i][0] }); return true; }
        return false;
      },
      glow(r, t) { altars.forEach((a, i) => { a.ring.material.opacity = r && i === r.i ? 0.45 + Math.sin(t * 4) * 0.25 : 0; a.flame.scale.y = 1 + Math.sin(t * 9 + i) * 0.12; }); },
      done: '기도는 하나님과 나누는 숨이에요. 이 향을 가져가요. 성도의 기도는 금 대접에 담긴 향이래요.',
    },
    fellow: {
      who: aquila, stat: 'fellow', item: 'bread', name: '교제 훈련장',
      intro: '저는 아굴라, 이쪽은 아내 브리스길라예요. 우리는 장막을 지어요. 저쪽에 무거운 보따리가 셋 있는데 같이 날라 줄래요? 짐은 서로 지는 거래요.',
      verse: '너희가 짐을 서로 지라 그리하여 그리스도의 법을 성취하라 (갈라디아서 6:2)',
      total: 3,
      hint: (i, r) => (r.carry ? '보따리를 장막 짓는 탁자로 가져가세요.' : '보따리 곁에서 E(또는 반짝이는 단추)로 들어요.'),
      start(r) { r.carry = false; sacks.forEach((s) => { s.visible = true; }); },
      check(r) {
        if (r.carry && near(F.table, 2.4)) { r.carry = false; carried.visible = false; sfx('cup', 0.2, 0.7); burst(F.table.x, G(F.table) + 1.2, F.table.z); if (r.i === 0) showVerse(V('t-f1', '두 사람이 한 사람보다 나음은 저희가 수고함으로 좋은 상을 얻을 것임이라', '전도서 4:9'), { cooldown: 0 }); return true; }
        return false;
      },
      glow() {},
      done: '고마워요! 함께 지니 금방 끝났네요. 우리 집에서 떡을 떼요. 한 덩이 가져가요.',
    },
    witness: {
      who: philip, stat: 'witness', item: 'lamp', name: '증거 훈련장',
      intro: '저는 빌립이에요. 성령께서 "가까이 나아가라" 하셔서 달려가 물었지요. "읽는 것을 깨닫느뇨?" 이 길을 걷는 세 사람에게 다가가 빛을 건네 볼래요?',
      verse: '빌립이 달려가서 선지자 이사야의 글 읽는 것을 듣고 말하되 읽는 것을 깨닫느뇨 (사도행전 8:30)',
      total: 3,
      hint: () => '길 가는 사람 곁으로 가서 V(또는 빛 단추)로 빛을 건네요.',
      start() { seekers.forEach((n) => { n.seek.lit = false; }); },
      check(r) { const lit = seekers.filter((n) => n.seek.lit).length; return lit > r.i; },
      glow() {},
      done: '아름답도다 좋은 소식을 전하는 자들의 발이여 (로마서 10:15). 이 등불을 가져가서 빛을 비추어요.',
    },
    obey: {
      who: abraham, stat: 'obey', item: 'stake', name: '순종 훈련장',
      intro: '저는 아브라함이에요. 하나님이 "내가 지시할 땅으로 가라" 하실 때 갈 바를 알지 못하고 나갔어요. 앞서가는 등불을 따라가 볼래요? 멀어지면 등불이 기다려 줘요.',
      verse: '이에 아브람이 여호와의 말씀을 좇아 갔고 (창세기 12:4)',
      total: O.way.length - 1,
      hint: () => '등불을 따라 걸어요. 길이 굽어도 등불만 보고 가요.',
      start(r) { r.lp = { ...O.way[0] }; lantern.visible = true; pathDots.forEach((d) => { d.visible = false; }); },
      check(r, dt) {
        const tg = O.way[r.i + 1], L = r.lp;
        const close = near(L, 4.2);
        if (close) { const dx = tg.x - L.x, dz = tg.z - L.z, d = Math.hypot(dx, dz), s = Math.min(d, 2.0 * dt); L.x += (dx / (d || 1)) * s; L.z += (dz / (d || 1)) * s; }
        if (Math.hypot(tg.x - L.x, tg.z - L.z) < 0.05) { pathDots[r.i].visible = true; if (r.i === 4) showVerse(V('t-o1', '너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라', '잠언 3:6'), { cooldown: 0 }); return true; }
        return false;
      },
      glow(r, t) { if (r && r.lp) { lantern.position.set(r.lp.x, G(r.lp) + 1.5 + Math.sin(t * 2.4) * 0.12, r.lp.z); lantern.scale.setScalar(near(r.lp, 4.2) ? 1 : 1 + Math.sin(t * 6) * 0.15); } },
      end() { lantern.visible = false; },
      done: '네가 끝까지 따라왔구나. 여기가 마므레 상수리나무예요. 이 말뚝을 가져가 네 장막터를 넓혀요.',
    },
  };

  // ---------- 말풍선 (안내와 같은 모양) ----------
  const box = document.createElement('div');
  box.className = 'npcb'; box.id = 'talk'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="say"></p><div class="keys"></div><div class="row"><button class="end">그만두기</button><button class="later">나중에</button><button class="next">훈련 시작</button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  let offer = null, run = null, closedFor = null;
  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const c = e.target.classList;
    if (c.contains('next')) { if (offer) begin(offer); else if (run && run.finished) finish(); }
    else if (c.contains('later')) { closedFor = offer; hide(); }
    else if (c.contains('end')) stop();
  });
  const hide = () => { box.hidden = true; offer = null; document.body.classList.remove('talking'); };
  function show(who, text, verse, { n = '', keys = '', next = '', later = false, end = false } = {}) {
    $('.who b').textContent = who; $('.who .n').textContent = n;
    $('.say').textContent = text;
    if (verse) { const v = document.createElement('small'); v.textContent = verse; $('.say').append(v); }
    $('.keys').textContent = keys;
    $('.next').hidden = !next; $('.next').textContent = next;
    $('.later').hidden = !later; $('.end').hidden = !end;
    box.hidden = false; box.classList.remove('ok');
    document.body.classList.add('talking');
  }
  const whoName = (id) => (id === 'fellow' ? '아굴라' : T[id].who.tag ? { word: '에스라', pray: '다니엘', witness: '빌립', obey: '아브라함' }[id] : '');
  function offerTo(id) {
    offer = id;
    const d = T[id], again = profile.train[d.stat];
    show(whoName(id), again ? `다시 왔군요, ${profile.name || '친구'}님! 한 번 더 해 볼까요? 이번에는 연습이에요.` : d.intro, again ? '' : d.verse, { next: '훈련 시작', later: true, n: d.name });
  }
  function begin(id) {
    offer = null;
    run = { id, i: 0, t: 0, practice: !!profile.train[T[id].stat] };
    T[id].start(run);
    progress();
  }
  function progress() {
    const d = T[run.id];
    show(whoName(run.id), d.hint(run.i, run), '', { n: `${d.name} · ${Math.min(run.i + 1, d.total)} / ${d.total}`, end: true });
  }
  function stop() {
    if (!run) return hide();
    const d = T[run.id];
    d.end?.(run); d.glow(null, 0);
    if (run.id === 'fellow') carried.visible = false;
    closedFor = run.id; run = null; hide();
  }
  function complete() {
    const d = T[run.id];
    run.finished = true;
    d.end?.(run);
    let extra = '';
    if (!run.practice) {
      profile.train[d.stat] = 'basic';
      addStat(profile, d.stat, STAT_REWARD);
      giveItem(profile, d.item); earn(profile, 5);
      const up = addSteps(profile, STEP_REWARD);
      const st = STATS.find((x) => x.id === d.stat);
      extra = ` (${st.name} +${STAT_REWARD}, 걸음 +${STEP_REWARD}, ${ITEMS[d.item].name}, 5 데나리온)`;
      if (up) setTimeout(() => { toast(`${profile.name}님이 ${up.name}${/[가-힣]/.test(up.name.slice(-1)) && (up.name.charCodeAt(up.name.length - 1) - 0xac00) % 28 && (up.name.charCodeAt(up.name.length - 1) - 0xac00) % 28 !== 8 ? '으로' : '로'} 자랐어요! 내게 들은 바를 충성된 사람들에게 부탁하라 저희가 또 다른 사람들을 가르칠수 있으리라 (디모데후서 2:2)`, 7); burst(me.x, me.y + 1.4, me.z); sfx('orb', 0.3, 0.9); }, 2500);
      save(); onChange?.();
    } else { addSteps(profile, 2); earn(profile, 1); save(); onChange?.(); }
    sfx('orb', 0.25, 1.1); burst(me.x, me.y + 1.2, me.z);
    show(whoName(run.id), d.done + extra, '', { n: d.name, next: '감사해요' });
  }
  function finish() { const d = T[run.id]; d.glow(null, 0); run = null; hide(); }

  // ---------- E로 보따리 들기 ----------
  const actions = {
    bundle: () => { if (!run || run.id !== 'fellow' || run.carry) return; const s = sacks.find((q) => q.visible); if (!s) return; s.visible = false; run.carry = true; carried.visible = true; sfx('impact/impactSoft_medium_000', 0.2, 0.8); progress(); },
  };
  const available = () => (run && run.id === 'fellow' && !run.carry && near(F.pile, 2.4) && sacks.some((s) => s.visible) ? [['place', 'bundle']] : []);

  // 빛을 건넬 때(main.js pressAction에서 알려 줌): 가까운 길손이 빛을 받음
  function onPress(name) {
    if (name !== 'share') return;
    let best = null, bd = 6.5;
    for (const n of seekers) { const d = Math.hypot(n.x - me.x, n.z - me.z); if (!n.seek.lit && d < bd) { bd = d; best = n; } }
    if (!best) return;
    setTimeout(() => { best.seek.lit = true; best.action = 'wave'; setTimeout(() => { best.action = null; }, 2400); burst(best.x, best.y + 1.3, best.z); if (!best.seek.glow) { best.seek.glow = fxSprite('light_01', 0xffe2a0, 0.8); best.seek.glow.position.y = 1.5; best.av.add(best.seek.glow); } }, 1400);
  }

  // ---------- 매 프레임 ----------
  const trainers = Object.entries(T).map(([id, d]) => [id, d.who]);
  function step(dt, t) {
    // 사부: 가까이 오면 나를 봄
    for (const [, n] of trainers) { const d = Math.hypot(me.x - n.x, me.z - n.z); if (n.state !== 'walk') n.face = d < 7 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0; }
    priscilla.face = Math.hypot(me.x - priscilla.x, me.z - priscilla.z) < 7 ? Math.atan2(me.x - priscilla.x, me.z - priscilla.z) : priscilla.face;
    // 길손: 길을 천천히 오가다가, 내가 곁에 오면 멈춤
    const a = X.road[0], b = X.road[1];
    for (const n of seekers) {
      const s = n.seek, d = Math.hypot(me.x - n.x, me.z - n.z);
      if (d > 3) { s.f += s.dir * dt * 0.035; if (s.f > 1 || s.f < 0) { s.dir *= -1; s.f = Math.max(0, Math.min(1, s.f)); } }
      const nx = a.x + (b.x - a.x) * s.f, nz = a.z + (b.z - a.z) * s.f;
      const moving = Math.hypot(nx - n.x, nz - n.z) > 0.001;
      if (moving) n.face = Math.atan2(nx - n.x, nz - n.z); else if (d < 4) n.face = Math.atan2(me.x - n.x, me.z - n.z);
      n.x = nx; n.z = nz; n.state = moving ? 'walk' : 'idle'; n.path = [];
    }
    // 들고 가는 보따리
    if (carried.visible) carried.position.set(me.x, me.y + 1.65, me.z);
    for (const d of Object.values(T)) if (!run || T[run.id] !== d) d.glow(null, t);
    if (run && !run.finished) {
      const d = T[run.id];
      d.glow(run, t);
      if (d.check(run, dt)) {
        run.i++;
        sfx('tap', 0.2, 1.3);
        if (run.i >= d.total) complete(); else progress();
      }
      return;
    }
    if (run) return;
    // 사부 곁에 가면 말을 검 (안내 중이거나 다른 창이 열려 있으면 기다림)
    if (busy()) { if (offer) hide(); return; }
    let nearId = null;
    for (const [id, n] of trainers) if (Math.hypot(me.x - n.x, me.z - n.z) < 3.6) nearId = id;
    if (nearId && nearId !== offer && nearId !== closedFor) offerTo(nearId);
    if (!nearId) { closedFor = null; if (offer) hide(); }
  }
  // 고정된 자리 (사부·길손이 밀리지 않게): main.js가 이동을 계산한 뒤 다시 제자리에 둠
  const pinned = [ezra, daniel, aquila, priscilla, philip, abraham];
  function pin() { for (const n of pinned) { if (n.state !== 'walk') { n.x = n.home.x; n.z = n.home.z; } } }

  return { step, pin, onPress, actions, available, active: () => !!run || !!offer, T, get run() { return run; } };
}
