// 정원의 수레바퀴 다섯 훈련장 (2026-11, 예전 운동장·캠핑장 자리)
//   말씀: 에스라 (스 7:10) - 다섯 기둥(듣기·읽기·공부·암송·묵상, 네비게이토 말씀의 손)을 차례로 들러 한 구절씩
//   기도: 다니엘 (단 6:10) - 찬양·감사·자백·중보·간구 다섯 제단(네비게이토 기도의 손)에서 손 모으기
//   교제: 아굴라와 브리스길라 (갈 6:2) - 짐 보따리 셋을 장막 짓는 탁자로 함께 나르기
//   증거: 빌립 (행 8:30) - 길 가는 세 사람에게 다가가 빛 건네기
//   순종: 아브라함 (창 12:4, 히 11:8) - 갈 바를 몰라도 앞서가는 등불을 따라 걷기
// 사부 곁에 가면 말을 걸고, 기초 과정을 마치면 그 능력치와 걸음이 자라고 성경 물품을 받음
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import * as THREE from 'three';
import { TRAIN, floorY } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, giveItem, earn, ITEMS, STATS } from './profile.js';
import { GEAR } from './gear.js';

const V = (k, text, ref) => { VERSES[k] = [text, ref]; return k; };
const STEP_REWARD = 20, STAT_REWARD = 10;
const STAR = { 제자: '★★', 일꾼: '★★★' }; // 새 단계에 열리는 숲길의 별

export function initTraining(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange, quests, goTo } = K;
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
    ['공부', V('t-w2', '간절한 마음으로 말씀을 받고 이것이 그러한가 하여 날마다 성경을 상고하므로', '사도행전 17:11')],
    ['외우기', V('t-w3', '내가 주께 범죄하지 아니하려 하여 주의 말씀을 내 마음에 두었나이다', '시편 119:11')],
    ['곱씹기', V('t-w4', '오직 여호와의 율법을 즐거워하여 그 율법을 주야로 묵상하는 자로다', '시편 1:2')],
  ];
  // 다섯을 다 마친 뒤 마무리 멘트에 쓰는 말씀: 말씀의 손이 행함으로 이어짐 (적용은 기둥이 아니라 맺음)
  const WORD_END = '너희는 도를 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지말라 (야고보서 1:22)';
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
    ['감사', V('t-p2', '범사에 감사하라 이는 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', '데살로니가전서 5:18')],
    ['자백', V('t-p1', '만일 우리가 우리 죄를 자백하면 저는 미쁘시고 의로우사 우리 죄를 사하시며 모든 불의에서 우리를 깨끗케 하실 것이요', '요한일서 1:9')],
    ['중보', V('t-p4', '그러므로 내가 첫째로 권하노니 모든 사람을 위하여 간구와 기도와 도고와 감사를 하되', '디모데전서 2:1')],
    ['간구', V('t-p3', '아무 것도 염려하지 말고 오직 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라', '빌립보서 4:6')],
  ];
  // 제단마다 빛 동그라미 색이 달라서, 엉뚱한 제단에서 기도하면 "○○색 빛 동그라미"라고 알려 줌. 제단 이름 밑에 작은 풀이 글
  const ALT = [[0xffd86a, '노란', '하나님을 높여요'], [0x9fd8ff, '하늘색', '고마움을 말해요'], [0xb6e59a, '연두색', '잘못을 솔직히 말해요'], [0xffa8c8, '분홍색', '친구를 위해 기도해요'], [0xd8c0ff, '보라색', '필요한 걸 구해요']];
  const note = (text, size = 0.6) => {
    const cv = document.createElement('canvas'); cv.width = 384; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = '600 28px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = Math.min(372, g.measureText(text).width + 40);
    g.fillStyle = 'rgba(255,250,238,0.88)'; g.beginPath(); g.roundRect(192 - w / 2, 8, w, 48, 24); g.fill();
    g.fillStyle = '#7a5c40'; g.fillText(text, 192, 33);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(size * 3.4, size * 0.57, 1);
    return sp;
  };
  const altars = R.altars.map((p, i) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.9), stone); b.position.y = 0.42; g.add(b);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), M(0xffb050, 0.4, { emissive: 0xff9a30, emissiveIntensity: 0.9 })); flame.position.y = 1.08; flame.visible = false; g.add(flame);
    const tag = label(PRAY[i][0]); tag.position.y = 1.9; g.add(tag);
    const sub = note(ALT[i][2]); sub.position.y = 1.52; g.add(sub);
    const ring = glowRing(1.0, ALT[i][0]); ring.position.set(p.stand.x - p.x, 0.04, p.stand.z - p.z); g.add(ring);
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
      intro: '저는 성경을 가르치는 선생님 에스라예요. 말씀은 듣고, 읽고, 공부하고, 외우고, 곱씹을 때 내 것이 돼요. 다섯 기둥을 하나씩 들러 볼래요?',
      verse: '에스라가 여호와의 율법을 연구하여 준행하며 율례와 규례를 이스라엘에게 가르치기로 결심하였었더라 (에스라 7:10)',
      total: 5,
      hint: (i) => `${WORD[i][0]} 기둥 앞, 빛나는 자리에 서 보세요.`,
      start() { pillars.forEach((p) => { p.fire.material.emissiveIntensity = 0; }); },
      check(r) { const p = pillars[r.i]; if (near(p.p.stand, 1.5)) { p.fire.material.emissiveIntensity = 1.4; showVerse(WORD[r.i][1], { cooldown: 0, title: WORD[r.i][0] }); return true; } return false; },
      glow(r, t) { pillars.forEach((p, i) => { p.ring.material.opacity = r && i === r.i ? 0.45 + Math.sin(t * 4) * 0.25 : 0; }); },
      endVerse: WORD_END,
      done: '잘했어요! 다섯 기둥을 다 들렀어요. 말씀은 날마다 먹는 밥 같아요. 이 두루마리를 선물로 줄게요.',
    },
    pray: {
      who: daniel, stat: 'prayer', item: 'incense', name: '기도 훈련장',
      intro: '저는 다니엘이에요. 하루 세 번 창을 열고 기도했어요. 다섯 돌 제단에서 한 가지씩 기도해 볼래요?',
      verse: '그 방의 예루살렘으로 향하여 열린 창에서 전에 행하던대로 하루 세번씩 무릎을 꿇고 기도하며 그 하나님께 감사하였더라 (다니엘 6:10)',
      total: 5,
      hint: (i) => `${PRAY[i][0]} 제단 앞 빛 동그라미에서 두 손 모은 단추를 꾹 눌러요 (X)`,
      start() { altars.forEach((a) => { a.flame.visible = false; }); },
      check(r, dt) {
        const a = altars[r.i];
        if (near(a.p.stand, 1.8) && me.action === 'pray') r.hold = (r.hold || 0) + dt; else r.hold = 0;
        if (r.hold > 2) { r.hold = 0; a.flame.visible = true; showVerse(PRAY[r.i][1], { cooldown: 0, title: PRAY[r.i][0] }); return true; }
        // 엉뚱한 제단에서 기도하면 어디로 가야 하는지 알려 줌
        const w = me.action === 'pray' && !near(a.p.stand, 1.8) ? altars.findIndex((x, j) => j !== r.i && near(x.p.stand, 1.8)) : -1;
        if (w >= 0) {
          r.wrong = (r.wrong || 0) + dt;
          if (r.wrong > 1.2 && !r.said) { r.said = true; toast(`그건 ${PRAY[w][0]} 제단이에요. ${PRAY[r.i][0]} 제단은 ${ALT[r.i][1]} 빛 동그라미예요`, 4); }
        } else { r.wrong = 0; r.said = false; }
        return false;
      },
      glow(r, t) { altars.forEach((a, i) => { a.ring.material.opacity = r && i === r.i ? 0.45 + Math.sin(t * 4) * 0.25 : 0; a.flame.scale.y = 1 + Math.sin(t * 9 + i) * 0.12; }); },
      done: '잘했어요! 다섯 가지 기도를 다 했어요. 기도는 하나님과 나누는 이야기예요. 이 향을 선물로 줄게요.',
    },
    fellow: {
      who: aquila, stat: 'fellow', item: 'bread', name: '교제 훈련장',
      intro: '저는 아굴라, 이쪽은 아내 브리스길라예요. 우리는 천막을 만들어요. 큰 천막 반대편 보따리 셋을 탁자로 같이 날라 줄래요?',
      verse: '너희가 짐을 서로 지라 그리하여 그리스도의 법을 성취하라 (갈라디아서 6:2)',
      total: 3,
      hint: (i, r) => (r.carry ? '천 두루마리 놓인 탁자로 가져가요' : '보따리 곁에 멈춰 서서 반짝이는 단추를 눌러요 (E)'),
      start(r) { r.carry = false; sacks.forEach((s) => { s.visible = true; }); },
      check(r) {
        if (r.carry && near(F.table, 2.4)) { r.carry = false; carried.visible = false; sfx('cup', 0.2, 0.7); burst(F.table.x, G(F.table) + 1.2, F.table.z); if (r.i === 0) showVerse(V('t-f1', '두 사람이 한 사람보다 나음은 저희가 수고함으로 좋은 상을 얻을 것임이라', '전도서 4:9'), { cooldown: 0 }); return true; }
        return false;
      },
      glow() {},
      done: '고마워요! 함께 지니 금방 끝났네요. 우리 집에서 같이 빵을 나눠 먹어요. 한 덩이 가져가요.',
    },
    witness: {
      who: philip, stat: 'witness', item: 'lamp', name: '증거 훈련장',
      intro: '저는 빌립이에요. 성령님이 \'가까이 가라\' 하셔서 달려가 말을 걸었어요. 흙길을 걷는 세 사람에게 빛을 건네 볼래요?',
      verse: '빌립이 달려가서 선지자 이사야의 글 읽는 것을 듣고 말하되 읽는 것을 깨닫느뇨 (사도행전 8:30)',
      total: 3,
      hint: () => '흙길을 걷는 사람 곁에서 두 사람 사이 빛 단추를 눌러요 (V)',
      start() { seekers.forEach((n) => { n.seek.lit = false; }); },
      check(r) { const lit = seekers.filter((n) => n.seek.lit).length; return lit > r.i; },
      glow() {},
      endVerse: '아름답도다 좋은 소식을 전하는 자들의 발이여 (로마서 10:15)',
      done: '세 사람 모두에게 빛을 건넸어요! 좋은 소식을 전하는 발은 참 아름다워요. 이 등불을 선물로 줄게요.',
    },
    obey: {
      who: abraham, stat: 'obey', item: 'stake', name: '순종 훈련장',
      intro: '저는 아브라함이에요. 어디로 갈지 몰라도 하나님 말씀대로 길을 떠났어요. 앞에 떠 있는 등불을 따라와 볼래요?',
      verse: '이에 아브람이 여호와의 말씀을 좇아 갔고 (창세기 12:4)',
      total: O.way.length - 1,
      hint: (i, r) => (r.far ? '등불 곁으로 가까이 가요' : '떠 있는 등불을 따라 걸어요'),
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
      done: '끝까지 잘 따라왔어요! 여기는 아브라함이 천막을 친 큰 나무 아래예요. 이 말뚝을 선물로 줄게요.',
    },
  };

  // ---------- 말풍선 (dialog.js, 안내와 같은 모양) ----------
  const dlg = createDialog({ id: 'talk' });
  let offer = null, run = null;
  const hide = () => { dlg.close(); offer = null; blocked = false; };
  const later = () => hide();
  const goQ = () => { const q = pickQ; hide(); if (q) goTo(q.who, `${q.name}에게 가요`); };
  const onNext = () => { if (offer && blocked) hide(); else if (offer) begin(offer); else if (run && run.finished) finish(); };
  // 훈련 안내 단추: 하는 방법·진행 보기·부탁 받기 (사부에게 말을 걸었을 때만)
  const GUIDE = [['하는 방법', 'how'], ['진행 보기', 'prog'], ['부탁 받기', 'quest']].map(([label, g]) => ({ label, on: () => { if (offer) guide(offer, g); } }));
  let row = {}, blocked = false; // blocked: 부탁 중이라 훈련을 못 시작함 (알려 주기만)
  const rowOf = (goq = false) => [
    { label: '그만두기', cls: 'end', hidden: !row.end, on: stop },
    { label: '그 사람에게 가기', cls: 'goq', hidden: !goq, on: goQ },
    { label: '나중에', cls: 'later', hidden: !row.later, on: later },
    { label: row.next, cls: 'next', hidden: !row.next, main: true, on: onNext },
  ];
  function show(who, text, verse, { n = '', next = '', later: canLater = false, end = false, how = '' } = {}) {
    row = { next, later: canLater, end };
    dlg.el.classList.remove('ok');
    dlg.open({
      who, n, say: text, verse, how,
      guide: offer && !blocked ? GUIDE : [],
      choices: rowOf(false),
      // Esc: 말을 건 때는 '나중에', 마친 인사는 '감사해요'. 훈련 중(그만두기만 있을 때)은 Esc로 그만두지 않음
      esc: offer ? later : run && run.finished ? onNext : null,
      focus: !run || !!run.finished,
    });
  }
  const whoName = (id) => (id === 'fellow' ? '아굴라' : T[id].who.tag ? { word: '에스라', pray: '다니엘', witness: '빌립', obey: '아브라함' }[id] : '');
  function offerTo(id) {
    offer = id;
    const d = T[id], again = profile.train[d.stat];
    const qr = quests?.()?.run;
    if (qr) { // 부탁을 하는 중에는 훈련을 시작하지 않고 알려 줌
      blocked = true;
      show(whoName(id), `지금 ${qr.q.name}의 부탁을 하고 있어요. 왼쪽 위 부탁 표시를 누르면 갈 곳이 나와요.`, '', { next: '알겠어요', n: d.name });
      return;
    }
    show(whoName(id), again ? `다시 왔군요, ${profile.name || '친구'}님! 한 번 더 해 볼까요? 이번에는 연습이에요.` : d.intro, again ? '' : d.verse, { next: '훈련 시작', later: true, n: d.name });
  }
  // 훈련장 안내: 하는 방법·진행 정도·이 덕목에 맞는 부탁 (2026-11)
  const HOW = {
    word: '① 기둥 앞 빛나는 자리에 서요. ② 기둥마다 말씀 한 구절이 떠요. ③ 다섯 기둥을 다 들르면 끝! 곱씹기는 말씀을 곱씹어 생각하는 거예요.',
    pray: '① 빛 동그라미에 서요. ② 두 손 모은 단추를 꾹 눌러요 (X). ③ 다섯 제단을 다 하면 끝!',
    fellow: '① 보따리 곁에 멈춰 서요. ② 반짝이는 단추를 눌러 보따리를 들어요 (E). ③ 탁자로 날라요. 세 번 하면 끝!',
    witness: '① 흙길을 걷는 사람 곁으로 가요. ② 두 사람 사이 빛 단추를 눌러요 (V). ③ 세 사람에게 건네면 끝!',
    obey: '① 앞에 떠 있는 등불 가까이 서요. ② 등불을 따라 걸어요. ③ 멀어지면 등불이 기다려 줘요. 끝까지 가면 끝!',
  };
  const GEAR_OF = { word: 'belt', obey: 'breast', witness: 'shoes' };
  let pickQ = null;
  const jo = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };
  function guide(id, kind) {
    const d = T[id], st = STATS.find((x) => x.id === d.stat), fin = !!profile.train[d.stat];
    const Qs = quests?.()?.Q || [];
    const mine = Qs.filter((q) => q.stat === d.stat);
    const qdone = (q) => profile.quests?.[q.id] === 'done';
    let text = '', how = '';
    pickQ = null;
    if (kind === 'how') {
      text = HOW[id];
      how = `마치면 ${st.name} +${STAT_REWARD}, 걸음 +${STEP_REWARD}, ${ITEMS[d.item].name}, 5 데나리온을 받아요. 다시 하면 연습이에요. 훈련 중에는 아래 말풍선에 할 일이 나와요.`;
    } else if (kind === 'prog') {
      const gid = GEAR_OF[id], gear = gid && GEAR[gid];
      text = [`${fin ? '✓' : '○'} ${d.name} ${fin ? '마침' : '아직'}`,
        ...(gear ? [`${profile.gear?.owned?.includes(gid) ? '✓' : '○'} ${gear.name} ${profile.gear?.owned?.includes(gid) ? '받음' : '(훈련을 마치면 받아요)'}`] : []),
        ...mine.map((q) => `${qdone(q) ? '✓' : '○'} ${q.name}의 부탁`)].join(' · ');
      how = `${st.name} 수레바퀴 점수 ${(profile.stats && profile.stats[d.stat]) || 0}`;
    } else {
      const run = quests?.()?.run;
      if (run) text = `지금 ${run.q.name}의 부탁을 하고 있어요. 왼쪽 위 부탁 표시를 누르면 갈 곳이 나와요.`;
      else {
        pickQ = mine.find((q) => !qdone(q)) || Qs.find((q) => !qdone(q)) || mine[0] || null;
        text = !pickQ ? '지금은 부탁할 사람이 없어요.'
          : `${pickQ.name}${jo(pickQ.name, '이', '가')} 도와 달래요. 「${pickQ.title}」이에요.${qdone(pickQ) ? ' 이미 마친 부탁이지만 한 번 더 할 수 있어요.' : ''} 아래 단추를 누르면 ${pickQ.name}에게 데려다줄게요.`;
      }
    }
    dlg.update({ say: text, how, verse: '', choices: rowOf(!!pickQ) });
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
    run = null; hide();
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
      extra = `${st.name} +${STAT_REWARD}, 걸음 +${STEP_REWARD}, ${ITEMS[d.item].name}, 5 데나리온을 받았어요`;
      if (up) setTimeout(() => { const c = up.name.charCodeAt(up.name.length - 1) - 0xac00; toast(`${profile.name}님이 ${up.name}${c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'} 자랐어요!${STAR[up.name] ? ` 이제 ${STAR[up.name]} 숲길에 들어갈 수 있어요.` : ''}`, 5); burst(me.x, me.y + 1.4, me.z); sfx('orb', 0.3, 0.9); }, 2500);
      save(); onChange?.();
    } else { addSteps(profile, 2); earn(profile, 1); save(); onChange?.(); }
    sfx('orb', 0.25, 1.1); burst(me.x, me.y + 1.2, me.z);
    show(whoName(run.id), run.practice ? '또 해냈어요! 연습이라 선물은 없지만 걸음 +2, 1 데나리온을 받아요.' : d.done, d.endVerse || '', { n: d.name, next: '감사해요', how: extra });
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
  // 안내하는 사부 표시 (2026-11): 머리 위에 멀리서도 보이는 훈련 이름 팻말, 마치면 ✓
  //   훈련장 안으로 들어오면 사부가 손을 흔들며 부름 (가까이 가면 말을 검)
  const signs = {};
  for (const [id, d] of Object.entries(T)) {
    const short = d.name.replace('장', '');
    const todo = label(short, 0.75), done = label('✓ ' + short, 0.75);
    for (const sp of [todo, done]) { sp.position.y = 2.75; sp.renderOrder = 5; d.who.av.add(sp); }
    signs[id] = { todo, done, called: false };
  }
  const CALL = { word: '말씀을 듣고 읽고 공부하고 외우고 곱씹는 다섯 기둥을 함께 돌아요', pray: '찬양·감사·자백·중보·간구, 다섯 제단에서 함께 기도해요', fellow: '서로 짐을 지는 법을 함께 배워요. 보따리 나르기를 도와줄래요?', witness: '길 가는 사람들에게 빛을 건네는 법을 알려 줄게요', obey: '갈 바를 몰라도 앞서가는 등불을 따라 걸어 봐요' };
  function callOut(t) {
    if (run || busy()) return;
    for (const [id, n] of trainers) {
      const S = signs[id], d = Math.hypot(me.x - n.x, me.z - n.z);
      const fin = !!profile.train[T[id].stat];
      const far = d > 4.5; // 곁에서는 이름표만
      S.todo.visible = far && !fin; S.done.visible = far && fin;
      S.todo.position.y = S.done.position.y = 2.75 + Math.sin(t * 2 + id.length) * 0.06;
      if (d > 16) S.called = false;
      else if (!S.called && d > 4.5 && d < 11 && me.state === 'walk') {
        S.called = true;
        n.action = 'wave'; setTimeout(() => { if (n.action === 'wave') n.action = null; }, 2400);
      }
    }
  }
  function step(dt, t) {
    callOut(t);
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
      } else if (run.id === 'obey' && run.lp) {
        const far = !near(run.lp, 4.2); // 등불이 멈춰 기다리면 "가까이 가요"로 바꿈
        if (far !== !!run.far) { run.far = far; progress(); }
      }
      return;
    }
    if (run) return;
    // 사부 곁에 가면 말을 검 (안내 중이거나 다른 창이 열려 있으면 기다림)
    const bz = quests?.()?.ignoreRun ? quests().ignoreRun(busy) : busy(); // 부탁 중이어도 사부 곁에서는 "지금 ○○의 부탁을 하고 있어요" 안내
    if (bz) { if (offer) hide(); return; }
    let nearId = null;
    for (const [id, n] of trainers) if (Math.hypot(me.x - n.x, me.z - n.z) < 3.6) nearId = id;
    if (nearId && nearId !== offer) { const id = nearId; offerTalk('train:' + id, Object.fromEntries(trainers)[id], () => offerTo(id)); } // 말 걸기 단추를 눌러야 열림
    if (!nearId && offer) hide();
  }
  // 고정된 자리 (사부·길손이 밀리지 않게): main.js가 이동을 계산한 뒤 다시 제자리에 둠
  const pinned = [ezra, daniel, aquila, priscilla, philip, abraham];
  function pin() { for (const n of pinned) { if (n.state !== 'walk') { n.x = n.home.x; n.z = n.home.z; } } }

  return { step, pin, onPress, actions, available, active: () => !!run || !!offer, T, get run() { return run; } };
}
