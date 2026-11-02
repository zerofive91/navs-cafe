// 정원의 부탁 (2026-11): 성경 인물이 정원 곳곳에서 부탁을 하고, 말씀 한 구절을 건넴
//   그 말씀대로 간단히 해 보면 풀리고, 인물에게서 성경 물품과 능력치·걸음을 받음
//   목자(잃은 양) · 사마리아 여인(우물) · 여호수아(여리고) · 다윗(매끄러운 돌) · 룻과 나오미(이삭)
//   엘리야(로뎀나무) · 노아(비둘기) / 카페 안: 베드로(증거의 물)
import * as THREE from 'three';
import { PARK, floorY, isFree, polar, Q as WHEEL, WITNESS_POOL_R } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { on } from './bus.js';
import { addStat, addSteps, giveItem, earn, ITEMS, STATS } from './profile.js';

const STEP_REWARD = 20, STAT_REWARD = 10;
const V = (k, text, ref) => { VERSES[k] = [text, ref]; return k; };

Object.assign(ITEMS, {
  staff: { name: '목자의 지팡이', verse: ['주의 지팡이와 막대기가 나를 안위하시나이다', '시편 23:4'] },
  water: { name: '생수', verse: ['나를 믿는 자는 성경에 이름과 같이 그 배에서 생수의 강이 흘러나리라', '요한복음 7:38'] },
  horn: { name: '양각 나팔', verse: ['백성이 나팔 소리를 듣는 동시에 크게 소리질러 외치니 성벽이 무너져 내린지라', '여호수아 6:20'] },
  sling: { name: '물매와 돌', verse: ['전쟁은 여호와께 속한 것인즉 그가 너희를 우리 손에 붙이시리라', '사무엘상 17:47'] },
  barley: { name: '보리 한 에바', verse: ['룻이 밭에서 저녁까지 줍고 그 주운 것을 떠니 보리가 한 에바쯤 되는지라', '룻기 2:17'] },
  mantle: { name: '엘리야의 겉옷', verse: ['엘리야의 몸에서 떨어진 겉옷을 주워가지고 돌아와서 요단 언덕에 서서', '열왕기하 2:13'] },
  ear: { name: '듣는 귀', // 예전 사무엘 부탁의 물품 (받은 사람 기록 보존용)
    verse: ['사무엘이 가로되 말씀하옵소서 주의 종이 듣겠나이다', '사무엘상 3:10'] },
  net: { name: '가득 찬 그물', verse: ['가득히 찬 큰 고기가 일백 쉰 세 마리라 이같이 많으나 그물이 찢어지지 아니하였더라', '요한복음 21:11'] },
  olive: { name: '감람 새 잎사귀', verse: ['저녁때에 비둘기가 그에게로 돌아왔는데 그 입에 감람 새 잎사귀가 있는지라', '창세기 8:11'] },
});

export function initQuests(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange, lying, nearestFree } = K;
  profile.quests = profile.quests || {};
  const M = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const G = (p) => floorY(p.x, p.z);
  const dist = (p) => Math.hypot(me.x - p.x, me.z - p.z);
  const freeAt = (p) => (isFree(p.x, p.z) ? p : nearestFree(p) || p);
  const put = (o, p, y = 0) => { o.position.set(p.x, G(p) + y, p.z); scene.add(o); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  // 머리 위 표시: 부탁이 있으면 두루마리, 마치면 별
  const markTex = (kind) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    if (kind === 'scroll') {
      g.fillStyle = '#f6e7c0'; g.strokeStyle = '#8f6744'; g.lineWidth = 3;
      g.beginPath(); g.roundRect(16, 14, 32, 36, 4); g.fill(); g.stroke();
      for (const y of [14, 50]) { g.beginPath(); g.ellipse(32, y, 20, 5, 0, 0, Math.PI * 2); g.fillStyle = '#e8c878'; g.fill(); g.stroke(); }
      g.strokeStyle = '#b09060'; g.lineWidth = 2; for (const y of [26, 32, 38]) { g.beginPath(); g.moveTo(22, y); g.lineTo(42, y); g.stroke(); }
    } else {
      g.fillStyle = '#ffd56a'; g.strokeStyle = '#b08020'; g.lineWidth = 2.5; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(32 + Math.cos(a) * r, 33 + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const TEX = { scroll: markTex('scroll'), star: markTex('star') };
  const npc = (name, look, p, faceTo) => {
    const q = freeAt(p);
    const n = makeChar({ bag: look.hoodie, style: 0, pants: 0x5a5048, ...look }, q.x, q.z);
    n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.scroll, transparent: true, depthWrite: false }));
    n.mark.scale.setScalar(0.5); n.mark.position.y = 2.75; n.av.add(n.mark);
    n.home = { x: q.x, z: q.z }; n.face0 = Math.atan2(faceTo.x - q.x, faceTo.z - q.z); n.face = n.face0;
    npcs.push(n);
    return n;
  };
  const toCafe = (p) => ({ x: p.x * 0.7, z: p.z * 0.7 });
  const P = PARK;

  // ---------- 1. 목자: 잃은 양 한 마리 (눅 15:4) ----------
  const shepherd = npc('목자', { hoodie: 0xb8a078, hair: 0x5a3b2a }, P.fold.at(-5.8, -5.5), P.fold);
  // ---------- 2. 사마리아 여인: 야곱의 우물가에서 (요 4:14) ----------
  const woman = npc('사마리아 여인', { hoodie: 0xd88a6a, hair: 0x2b211c, style: 1 }, P.well.at(3.2, -2.4), P.well);
  // ---------- 3. 여호수아: 여리고를 일곱 바퀴 (수 6:4) ----------
  const joshua = npc('여호수아', { hoodie: 0x8a7a5a, hair: 0x3b2a22 }, P.jericho.at(-7.5, -6.5), P.jericho);
  // ---------- 4. 다윗: 매끄러운 돌 다섯 (삼상 17:40) ----------
  const david = npc('다윗', { hoodie: 0xc8a050, hair: 0x7a4a2a }, P.david.at(-7.2, -5), P.david);
  const brook = [];
  {
    const a = freeAt(P.david.at(-9.5, -1)), b = freeAt(P.david.at(-9.5, 6));
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, len + 2), M(0x7cc0dc, 0.2, { transparent: true, opacity: 0.85, emissive: 0x1a4a60, emissiveIntensity: 0.25 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(b.x - a.x, b.z - a.z);
    m.position.set((a.x + b.x) / 2, G(a) + 0.03, (a.z + b.z) / 2); m.receiveShadow = true; scene.add(m);
    const stoneGeo = new THREE.DodecahedronGeometry(0.14, 1), stoneM = M(0xd8d0c4, 0.4);
    for (let k = 0; k < 5; k++) {
      const f = 0.1 + k * 0.2, side = k % 2 ? 1.1 : -1.1;
      const n = { x: -(b.z - a.z) / len, z: (b.x - a.x) / len };
      const p = freeAt({ x: a.x + (b.x - a.x) * f + n.x * side, z: a.z + (b.z - a.z) * f + n.z * side });
      const s = new THREE.Mesh(stoneGeo, stoneM); s.scale.set(1.2, 0.7, 1); put(s, p, 0.06);
      const glow = fxSprite('light_01', 0xfff0c0, 0.7); glow.position.y = 0.25; glow.visible = false; s.add(glow);
      brook.push({ s, glow, p, got: false });
    }
  }
  // ---------- 5. 룻과 나오미: 보아스의 밭에서 (룻 2:2) ----------
  const ruth = npc('룻', { hoodie: 0xc8b070, hair: 0x5a3b2a, style: 1 }, P.sower.at(-8, -5), P.sower);
  const naomi = npc('나오미', { hoodie: 0x7a6a8a, hair: 0xb8b0a8, style: 1 }, P.sower.at(-9.6, -5.4), P.sower);
  naomi.mark.visible = false;
  const ears = [];
  {
    const earGeo = new THREE.ConeGeometry(0.06, 0.34, 6), earM = M(0xe0b860, 0.7), stemM = M(0xb89850, 0.9);
    for (let k = 0; k < 6; k++) {
      const p = freeAt(P.sower.at(-5 + (k % 3) * 5, (k < 3 ? -4.6 : 4.6)));
      const g = new THREE.Group();
      for (let j = 0; j < 3; j++) { const e = new THREE.Mesh(earGeo, earM); e.position.set((j - 1) * 0.08, 0.32, 0); e.rotation.z = (j - 1) * 0.3; g.add(e); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3), stemM); st.position.set((j - 1) * 0.05, 0.15, 0); g.add(st); }
      g.rotation.z = 1.3; put(g, p, 0.05);
      const glow = fxSprite('light_01', 0xfff0c0, 0.7); glow.position.y = 0.3; glow.visible = false; g.add(glow);
      ears.push({ g, glow, p, got: false });
    }
  }
  // ---------- 6. 엘리야: 로뎀나무 아래 (왕상 19:5) ----------
  const broomAt = freeAt(polar(P.vine.r, 207));
  {
    const g = new THREE.Group();
    const wood = M(0x8a6a4a);
    for (const [x, z, r] of [[0, 0, 0.16], [0.5, 0.3, 0.1], [-0.4, 0.4, 0.1]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, 1.8, 7), wood); t.position.set(x, 0.9, z); t.rotation.z = x * 0.4; g.add(t); }
    for (let k = 0; k < 9; k++) { const a = k * 0.7; const c = new THREE.Mesh(new THREE.SphereGeometry(0.7 + (k % 3) * 0.2, 9, 7), M(0x8aa868, 1)); c.position.set(Math.cos(a) * 1.3, 2 + (k % 2) * 0.4, Math.sin(a) * 1.3); c.scale.y = 0.6; g.add(c); }
    put(g, broomAt);
  }
  const restSpot = freeAt({ x: broomAt.x + 1.6, z: broomAt.z });
  const elijah = npc('엘리야', { hoodie: 0x6a5a48, hair: 0x5a5048 }, { x: broomAt.x - 2.2, z: broomAt.z + 1.4 }, broomAt);
  const meal = new THREE.Group();
  { const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 14), M(0xd8a868)); cake.position.y = 0.04; meal.add(cake); const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.3, 10), M(0x9a6a48)); jar.position.set(0.32, 0.15, 0); meal.add(jar); const glow = fxSprite('light_01', 0xfff4d0, 1); glow.position.y = 0.3; meal.add(glow); }
  meal.visible = false; put(meal, freeAt({ x: restSpot.x + 0.9, z: restSpot.z + 0.6 }));
  // ---------- 7. 노아: 비둘기를 내어 놓으매 (창 8:8-11) ----------
  const noah = npc('노아', { hoodie: 0x8a7458, hair: 0xd8d0c0 }, P.ark.at(-4, -10), P.ark);
  const dove = new THREE.Group();
  { const w = M(0xfaf8f2, 0.6); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), w); b.scale.set(0.8, 0.8, 1.4); dove.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), w); h.position.set(0, 0.08, 0.2); dove.add(h); for (const s of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.16), w); wing.position.set(s * 0.22, 0.04, 0); wing.userData.s = s; dove.add(wing); } const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M(0x6a9a4a)); leaf.scale.set(0.5, 0.3, 1.6); leaf.position.set(0, 0.04, 0.32); leaf.visible = false; dove.add(leaf); dove.userData.leaf = leaf; }
  dove.visible = false; scene.add(dove);
  const doveSpot = freeAt(P.ark.at(0, -9));
  let flight = null; // { T, leaf }
  const landed = () => { if (flight && flight.back) { flight = null; return true; } return false; };

  const toHub = (c, d) => { const l = Math.hypot(c.x, c.z) || 1; return { x: c.x - (c.x / l) * d, z: c.z - (c.z / l) * d }; };
  // ---------- 카페 안 8. 베드로: 배 오른편에 그물을 (요 21:6) ----------
  const WI = WHEEL.witness;
  const peter = npc('베드로', { hoodie: 0x5a7a9a, hair: 0x4a3a2a }, toHub(WI, WITNESS_POOL_R + 1.3), WI);
  const ring = (color, label) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.05; g.add(m);
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 48; const c2 = cv.getContext('2d');
    c2.fillStyle = 'rgba(255,250,238,0.9)'; c2.beginPath(); c2.roundRect(14, 4, 100, 40, 20); c2.fill();
    c2.fillStyle = '#4a6a8a'; c2.font = '700 24px "Noto Serif KR", serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(label, 64, 25);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); sp.scale.set(1.1, 0.42, 1); sp.position.y = 1.5; g.add(sp);
    g.visible = false; scene.add(g); return g;
  };
  // 물가 양쪽 (카페 가운데에서 볼 때 왼편·오른편)
  const side = (s) => { const l = Math.hypot(WI.x, WI.z); const tx = -WI.z / l, tz = WI.x / l; return freeAt({ x: WI.x + tx * s * (WITNESS_POOL_R + 0.7) - (WI.x / l) * 1.2, z: WI.z + tz * s * (WITNESS_POOL_R + 0.7) - (WI.z / l) * 1.2 }); };
  const netL = side(1), netR = side(-1);
  const ringL = ring(0xa0b8d0, '왼편'), ringR = ring(0xffd56a, '오른편');
  ringL.position.set(netL.x, G(netL), netL.z); ringR.position.set(netR.x, G(netR), netR.z);
  const fishBurst = (p) => { for (let k = 0; k < 14; k++) setTimeout(() => burst(p.x + (Math.random() - 0.5) * 2.4, G(p) + 0.3 + Math.random() * 0.8, p.z + (Math.random() - 0.5) * 2.4), k * 90); };

  // ---------- 부탁 정의 ----------
  const near = (p, d) => dist(p) < d;
  const Q = [
    {
      id: 'sheep', who: shepherd, name: '목자', title: '잃은 양 한 마리', stat: 'witness', item: 'staff',
      ask: '양 한 마리가 우리 밖으로 나가 길을 잃었어요. 아흔아홉 마리를 두고라도 찾아야 해요. 방울 소리가 들리는 쪽으로 가 보세요. 가까이 가면 따라올 거예요.',
      verse: V('q-sheep', '너희 중에 어느 사람이 양 일백 마리가 있는데 그 중에 하나를 잃으면 아흔 아홉 마리를 들에 두고 그 잃은 것을 찾도록 찾아 다니지 아니하느냐', '누가복음 15:4'),
      steps: [{ hint: '정원에서 잃은 양을 찾아 우리로 데려와요. 방울 소리를 따라가요.', ev: 'sheepHome' }],
      done: '찾았군요! 하늘에서는 회개할 것 없는 아흔아홉보다 죄인 하나가 회개하는 것을 더 기뻐한대요. 이 지팡이를 가져가요.',
    },
    {
      id: 'well', who: woman, name: '사마리아 여인', title: '야곱의 우물가에서', stat: 'prayer', item: 'water', back: false,
      ask: '한낮이라 목이 말라요. 우물에서 물 한 그릇 길어 주실래요? 예전에 이 우물가에서 어떤 분이 저에게 물을 청하시며 영원히 목마르지 않는 물 이야기를 해 주셨어요.',
      verse: V('q-well', '내가 주는 물을 먹는 자는 영원히 목마르지 아니하리니 나의 주는 물은 그 속에서 영생하도록 솟아나는 샘물이 되리라', '요한복음 4:14'),
      steps: [
        { hint: '우물에서 물을 길어요 (우물 곁 반짝이는 단추).', until: () => me.item === 'cup' && me.drink === 'water' },
        { hint: '여인에게 물을 건네요 (E 또는 반짝이는 단추).', place: 'q_give', at: () => woman, r: 2.6, act: () => { me.item = null; me.drink = null; sfx('cup', 0.2); burst(woman.x, woman.y + 1.3, woman.z); } },
      ],
      done: '고마워요. 이 물도 시원하지만, 그분이 주시는 생수는 다시 목마르지 않는대요. 이 생수를 가져가 기도할 때마다 마셔요.',
    },
    {
      id: 'jericho', who: joshua, name: '여호수아', title: '여리고를 일곱 바퀴', stat: 'obey', item: 'horn',
      ask: '여리고 성은 굳게 닫혀 있어요. 칼로 치라는 말씀이 아니라, 성을 일곱 바퀴 돌고 나팔을 불라 하셨어요. 이상해 보여도 말씀대로 해 볼래요?',
      verse: V('q-jericho', '제 칠일에는 성을 일곱번 돌며 제사장들은 나팔을 불 것이며', '여호수아 6:4'),
      steps: [{ hint: '성 둘레를 일곱 바퀴 돌아요. 일곱 등불이 켜지면 나팔(반짝이는 단추)을 불어요.', ev: 'jerichoFall' }],
      done: '말씀대로 했더니 성벽이 무너졌어요! 이 양각 나팔을 가져가요.',
    },
    {
      id: 'david', who: david, name: '다윗', title: '매끄러운 돌 다섯', stat: 'word', item: 'sling',
      ask: '저 거인 골리앗 앞에서 다들 떨고 있어요. 저는 갑옷 대신 시냇가의 돌 다섯을 골랐어요. 여호와의 이름으로 나아가면 돼요. 시냇가에서 돌 다섯을 골라 볼래요?',
      verse: V('q-david', '시내에서 매끄러운 돌 다섯을 골라서 자기 목자의 제구 곧 주머니에 넣고 손에 물매를 가지고 블레셋 사람에게로 나아가니라', '사무엘상 17:40'),
      steps: [
        { hint: (r) => `시냇가에서 매끄러운 돌을 주워요 (E) ${r.n || 0}/5`, collect: brook, place: 'q_pick' },
        { hint: '이제 골리앗 앞에서 물매를 던져요 (반짝이는 단추).', ev: 'goliathFall' },
      ],
      done: '보세요, 전쟁은 여호와께 속했어요! 이 물매를 가져가요.',
    },
    {
      id: 'ruth', who: ruth, name: '룻', title: '보아스의 밭에서', stat: 'fellow', item: 'barley',
      ask: '어머님 나오미와 저는 먹을 것이 없어요. 밭에 가서 떨어진 이삭을 주우려 해요. 함께 주워 줄래요?',
      verse: V('q-ruth', '나로 밭에 가게 하소서 내가 뉘게 은혜를 입으면 그를 따라서 이삭을 줍겠나이다', '룻기 2:2'),
      steps: [{ hint: (r) => `밭가에 떨어진 이삭을 주워요 (E) ${r.n || 0}/6`, collect: ears, place: 'q_pick' }],
      done: '이렇게나 많이! 보리가 한 에바쯤 되겠어요. 어머님과 함께 나눠요. 한 에바 가져가요.',
    },
    {
      id: 'elijah', who: elijah, name: '엘리야', title: '로뎀나무 아래', stat: 'prayer', item: 'mantle',
      ask: '너무 지쳐서 더는 못 가겠어요. 그때 하나님은 꾸짖지 않으시고 먼저 재우시고 먹이셨어요. 지쳤을 때는 쉬는 것도 순종이에요. 로뎀나무 그늘에 누워 쉬어 볼래요?',
      verse: V('q-elijah', '로뎀나무 아래 누워 자더니 천사가 어루만지며 이르되 일어나서 먹으라 하는지라', '열왕기상 19:5'),
      steps: [
        { hint: '로뎀나무 그늘에 누워 쉬어요 (K 또는 눕기).', until: (r, dt) => { if (lying() && near(broomAt, 4.5)) r.rest = (r.rest || 0) + dt; else r.rest = 0; if (r.rest > 4) { meal.visible = true; sfx('orb', 0.2, 1.3); return true; } return false; } },
        { hint: '일어나서 먹어요 (E 또는 반짝이는 단추).', place: 'q_eat', at: () => meal.position, r: 2.4, act: () => { sfx('cup', 0.2); } },
        { hint: '한 번 더 먹어요. 길을 이기지 못할까 하노라 (왕상 19:7)', place: 'q_eat', at: () => meal.position, r: 2.4, act: () => { sfx('cup', 0.2); meal.visible = false; showVerse(V('q-elijah2', '여호와의 사자가 또 다시 와서 어루만지며 이르되 일어나서 먹으라 네가 길을 이기지 못할까 하노라 하는지라', '열왕기상 19:7'), { cooldown: 0 }); } },
      ],
      done: '이제 힘이 나죠? 그 힘으로 사십 주야를 걸어갔어요. 이 겉옷을 가져가요.',
    },
    {
      id: 'noah', who: noah, name: '노아', title: '비둘기를 내어 놓으매', stat: 'obey', item: 'olive',
      ask: '물이 줄었는지 알고 싶어요. 방주 앞에서 비둘기를 날려 보내 볼래요? 돌아오면 칠 일을 기다렸다가 다시 보내요.',
      verse: V('q-noah', '또 칠일을 기다려 다시 비둘기를 방주에서 내어놓으매', '창세기 8:10'),
      steps: [
        { hint: '방주 앞에서 비둘기를 날려 보내요 (E 또는 반짝이는 단추).', place: 'q_dove', at: () => doveSpot, r: 3, act: () => { flight = { T: 0, leaf: false }; } },
        { hint: '비둘기가 돌아오고 있어요...', until: landed },
        { hint: (r) => `칠 일을 기다려요... ${Math.max(0, 7 - Math.floor(r.wait || 0))}`, until: (r, dt) => (r.wait = (r.wait || 0) + dt) > 7 },
        { hint: '다시 비둘기를 날려 보내요 (E 또는 반짝이는 단추).', place: 'q_dove', at: () => doveSpot, r: 3, act: () => { flight = { T: 0, leaf: true }; } },
        { hint: '저녁때가 되었어요...', until: landed },
      ],
      done: '감람 새 잎사귀예요! 땅에 물이 줄었군요. 기다리는 것도 믿음이에요. 이 잎사귀를 가져가요.',
    },
  ];
  Q.push(
    {
      id: 'peter', who: peter, name: '베드로', title: '배 오른편에 그물을', stat: 'witness', item: 'net', back: false,
      ask: '밤새 그물을 던졌는데 한 마리도 못 잡았어요. 그런데 물가에 계신 그분이 "그물을 배 오른편에 던지라" 하셨어요. 어부인 제가 보기엔 이상하지만... 같이 던져 볼래요?',
      verse: V('q-peter', '가라사대 그물을 배 오른편에 던지라 그리하면 얻으리라 하신대 이에 던졌더니 고기가 많아 그물을 들 수 없더라', '요한복음 21:6'),
      steps: [
        { hint: '물가에서 그물을 던져요. 왼편도 오른편도 있어요 (E 또는 반짝이는 단추).', place: 'q_net', at: () => (dist(netL) < dist(netR) ? netL : netR), r: 2.2,
          act: () => {
            if (dist(netL) < dist(netR)) { sfx('impact/impactSoft_medium_000', 0.2, 0.7); showVerse(V('q-peter0', '나가서 배에 올랐으나 이 밤에 아무 것도 잡지 못하였더니', '요한복음 21:3'), { cooldown: 0, title: '빈 그물' }); return false; }
            sfx('orb', 0.3, 1.1); fishBurst(netR); return true;
          } },
      ],
      done: '그물이 터질 것 같아요! 말씀대로 했더니 일백 쉰 세 마리나! 이 그물을 가져가요. 이제 사람을 낚는 어부가 되어요.',
    },
  );
  const BY = Object.fromEntries(Q.map((q) => [q.id, q]));
  const doneCount = () => Q.filter((q) => profile.quests[q.id] === 'done').length;

  // ---------- 말풍선과 진행 표시 ----------
  const box = document.createElement('div');
  box.className = 'npcb'; box.id = 'quest'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="say"></p><div class="row"><button class="end">그만두기</button><button class="later">나중에</button><button class="next"></button></div>';
  document.body.appendChild(box);
  const chip = document.createElement('div'); chip.id = 'questChip'; chip.hidden = true; document.body.appendChild(chip);
  const $ = (s) => box.querySelector(s);
  let run = null, shown = null, closedFor = null, thanks = null;
  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const c = e.target.classList;
    if (c.contains('next')) { if (thanks) { thanks = null; closedFor = shown; hide(); } else if (shown && !run) begin(shown); else hide(); }
    else if (c.contains('later')) { closedFor = shown; hide(); }
    else if (c.contains('end')) { if (run) { run = null; updateChip(); } closedFor = shown; hide(); }
  });
  const hide = () => { box.hidden = true; shown = null; document.body.classList.remove('talking'); };
  function show(q, text, verse, { next = '', later = false, end = false, n = q.title } = {}) {
    shown = q;
    $('.who b').textContent = q.name; $('.who .n').textContent = n;
    $('.say').textContent = text;
    if (verse) { const v = document.createElement('small'); v.textContent = `${VERSES[verse][0]} (${VERSES[verse][1]})`; $('.say').append(v); }
    $('.next').hidden = !next; $('.next').textContent = next;
    $('.later').hidden = !later; $('.end').hidden = !end;
    box.hidden = false;
    document.body.classList.add('talking');
  }
  const hintOf = (r) => { const s = r.q.steps[r.i]; return typeof s.hint === 'function' ? s.hint(r) : s.hint; };
  function updateChip() {
    if (!run) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.textContent = run.i >= run.q.steps.length ? `${run.q.name}에게 돌아가요` : `${run.q.name} · ${hintOf(run)}`;
  }
  function begin(q) {
    run = { q, i: 0, n: 0, flags: {} };
    hide(); closedFor = q;
    startStep();
    sfx('tap', 0.2, 1.2);
  }
  function startStep() {
    const s = run.q.steps[run.i];
    run.flags = {}; run.n = 0;
    if (s && s.collect) s.collect.forEach((c) => { c.got = false; c.g ? (c.g.visible = true) : (c.s.visible = true); });
    updateChip();
  }
  function advance() {
    run.i++;
    sfx('tap', 0.2, 1.4);
    if (run.i < run.q.steps.length) startStep();
    else if (run.q.back === false) complete();
    else { updateChip(); toast(`${run.q.name}에게 돌아가요`, 3); }
  }
  function complete() {
    const q = run.q; run = null; updateChip();
    sfx('orb', 0.25, 1.1); burst(me.x, me.y + 1.2, me.z);
    thanks = q;
    if (profile.quests[q.id] === 'done') { addSteps(profile, 2); earn(profile, 1); save(); onChange?.(); show(q, `${q.done.split('.')[0]}. 또 도와줘서 고마워요! (걸음 +2, 1 데나리온)`, '', { next: '감사해요' }); return; }
    profile.quests[q.id] = 'done';
    addStat(profile, q.stat, STAT_REWARD); giveItem(profile, q.item); earn(profile, 3);
    const up = addSteps(profile, STEP_REWARD);
    save(); onChange?.();
    const st = STATS.find((x) => x.id === q.stat);
    show(q, `${q.done} (${st.name} +${STAT_REWARD}, 걸음 +${STEP_REWARD}, ${ITEMS[q.item].name}, 3 데나리온)`, '', { next: '감사해요' });
    if (up) setTimeout(() => toast(`${profile.name || '나'}님이 ${up.name}${josa(up.name)} 자랐어요!`, 5), 2500);
  }
  const josa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  for (const ev of ['sheepHome', 'jerichoFall', 'goliathFall']) on(ev, () => { if (run && run.q.steps[run.i] && run.q.steps[run.i].ev === ev) advance(); });

  // ---------- 그 자리 단추 ----------
  const curStep = () => (run && run.i < run.q.steps.length ? run.q.steps[run.i] : null);
  const nearestItem = (list) => { let b = null, bd = 2.2; for (const c of list) if (!c.got) { const d = dist(c.p); if (d < bd) { bd = d; b = c; } } return b; };
  const doPlace = () => {
    const s = curStep(); if (!s) return;
    if (s.collect) {
      const c = nearestItem(s.collect); if (!c) return;
      c.got = true; (c.g || c.s).visible = false; run.n++; sfx('impact/impactSoft_medium_000', 0.2, 1.3); burst(c.p.x, G(c.p) + 0.4, c.p.z);
      if (run.n >= s.collect.length) advance(); else updateChip();
      return;
    }
    if (s.place && dist(s.at()) < s.r) { if (s.act() !== false) advance(); }
  };
  const actions = { q_give: doPlace, q_pick: doPlace, q_eat: doPlace, q_dove: doPlace };
  const available = () => {
    const s = curStep(); if (!s || !s.place) return [];
    if (s.collect) return nearestItem(s.collect) ? [['place', s.place]] : [];
    if (s.place === 'q_dove' && flight) return [];
    return dist(s.at()) < s.r ? [['place', s.place]] : [];
  };

  // ---------- 매 프레임 ----------
  const people = Q.map((q) => q.who).concat([naomi]);
  const actions2 = { q_net: doPlace }; Object.assign(actions, actions2);
  function step(dt, t) {
    for (const n of people) {
      const d = Math.hypot(me.x - n.x, me.z - n.z);
      if (n.state !== 'walk') { n.face = d < 7 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0; n.x = n.home.x; n.z = n.home.z; }
    }
    for (const q of Q) {
      const m = q.who.mark, done = profile.quests[q.id] === 'done';
      m.visible = !(run && run.q === q);
      m.material.map = done ? TEX.star : TEX.scroll;
      m.position.y = 2.75 + Math.sin(t * 2 + q.id.length) * 0.06;
    }
    // 반짝이는 줍기 자리
    const s = curStep();
    for (const c of brook) c.glow.visible = !!(s && s.collect === brook && !c.got);
    for (const c of ears) c.glow.visible = !!(s && s.collect === ears && !c.got);
    ringL.visible = ringR.visible = !!(run && run.q.id === 'peter');
    // 비둘기: 방주에서 날아갔다가 돌아옴
    if (flight) {
      const F = flight; F.T += dt;
      const dur = 8, k = Math.min(1, F.T / dur);
      const away = Math.sin(k * Math.PI); // 0 → 1 → 0
      const dir = { x: P.ark.n.x, z: P.ark.n.z };
      dove.visible = true;
      dove.position.set(doveSpot.x + dir.x * away * 40, G(doveSpot) + 1.6 + away * 14, doveSpot.z + dir.z * away * 40);
      dove.rotation.y = Math.atan2(dir.x, dir.z) + (k > 0.5 ? Math.PI : 0);
      dove.children.forEach((c) => { if (c.userData.s) c.rotation.z = Math.sin(t * 18) * 0.7 * c.userData.s; });
      dove.userData.leaf.visible = F.leaf && k > 0.5;
      if (k >= 1 && !F.back) {
        F.back = true; dove.visible = false; burst(doveSpot.x, G(doveSpot) + 1.6, doveSpot.z);
        if (F.leaf) showVerse(V('q-noah2', '저녁때에 비둘기가 그에게로 돌아왔는데 그 입에 감람 새 잎사귀가 있는지라 이에 노아가 땅에 물이 감한줄 알았으며', '창세기 8:11'), { cooldown: 0 });
        else showVerse(V('q-noah1', '온 지면에 물이 있으므로 비둘기가 접족할 곳을 찾지 못하고 방주로 돌아와 그에게로 오는지라', '창세기 8:9'), { cooldown: 0 });
      }
    }
    if (run && s && s.until) {
      if (s.until(run, dt)) advance();
      else if (s.hint instanceof Function) updateChip();
    }
    // 인물 곁에 가면 말을 검
    if (busy()) { if (shown && !thanks) hide(); return; }
    let nearQ = null;
    for (const q of Q) if (Math.hypot(me.x - q.who.x, me.z - q.who.z) < 3.4) nearQ = q;
    if (run && nearQ === run.q && run.i >= run.q.steps.length) { complete(); return; }
    if (thanks) { if (Math.hypot(me.x - thanks.who.x, me.z - thanks.who.z) > 9) { thanks = null; hide(); } return; }
    if (nearQ && nearQ !== shown && nearQ !== closedFor) {
      const q = nearQ, isRun = run && run.q === q;
      if (isRun) show(q, hintOf(run), '', { end: true, next: '알겠어요' });
      else if (run) show(q, `지금은 ${run.q.name}의 부탁을 하고 있군요. 그 일을 마치고 다시 와 주세요.`, '', { next: '알겠어요' });
      else if (profile.quests[q.id] === 'done') show(q, `다시 와 주었군요, ${profile.name || '친구'}님! 한 번 더 도와줄래요? 이번에는 마음으로 하는 연습이에요.`, '', { next: '도와줄게요', later: true });
      else show(q, q.ask, q.verse, { next: '도와줄게요', later: true });
    }
    if (!nearQ) { closedFor = null; if (shown) hide(); }
  }

  return { step, actions, available, active: () => !!shown, Q, BY, doneCount, get run() { return run; }, spots: { brook, ears, doveSpot, meal, restSpot, broomAt, netL, netR } };
}
