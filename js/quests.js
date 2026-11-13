// 정원의 부탁 (2026-11): 성경 인물이 정원 곳곳에서 부탁을 하고, 말씀 한 구절을 건넴
//   그 말씀대로 간단히 해 보면 풀리고, 인물에게서 성경 물품과 능력치·걸음을 받음
//   목자(잃은 양) · 사마리아 여인(우물) · 여호수아(여리고) · 다윗(매끄러운 돌) · 룻과 나오미(이삭)
//   엘리야(로뎀나무) · 노아(비둘기) / 카페 안: 베드로(증거의 물)
//   2026-11 더함: 삭개오 · 사마리아인 · 안드레(오병이어) · 요나(요나의 바다) · 솔로몬(푸른 초장) · 이삭(겨자씨) · 요한(포도나무 그늘)
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import * as THREE from 'three';
import { PARK, floorY, isFree, polar, Q as WHEEL, WITNESS_POOL_R, SYCAMORE } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { on } from './bus.js';
import { addStat, addSteps, giveItem, earn, spend, useGood, ITEMS, STATS } from './profile.js';

const STEP_REWARD = 20, STAT_REWARD = 10;
const V = (k, text, ref) => { VERSES[k] = [text, ref]; return k; };

Object.assign(ITEMS, {
  gourd: { name: '박넝쿨 잎', verse: ['주께서는 은혜로우시며 자비로우시며 노하기를 더디하시며 인애가 크시사 뜻을 돌이켜 재앙을 내리지 아니하시는 하나님이신 줄을 내가 알았음이니이다', '요나 4:2'] },
  lily: { name: '들의 백합화', verse: ['그러나 내가 너희에게 말하노니 솔로몬의 모든 영광으로도 입은 것이 이 꽃 하나만 같지 못하였느니라', '마태복음 6:29'] },
  mustard: { name: '겨자씨 한 알', verse: ['이는 모든 씨보다 작은 것이로되 자란 후에는 나물보다 커서 나무가 되매 공중의 새들이 와서 그 가지에 깃들이느니라', '마태복음 13:32'] },
  grapes: { name: '포도송이', verse: ['너희가 과실을 많이 맺으면 내 아버지께서 영광을 받으실 것이요 너희가 내 제자가 되리라', '요한복음 15:8'] },
  staff: { name: '목자의 지팡이', verse: ['주의 지팡이와 막대기가 나를 안위하시나이다', '시편 23:4'] },
  water: { name: '생수', verse: ['나를 믿는 자는 성경에 이름과 같이 그 배에서 생수의 강이 흘러나리라', '요한복음 7:38'] },
  horn: { name: '양각 나팔', verse: ['백성이 나팔 소리를 듣는 동시에 크게 소리질러 외치니 성벽이 무너져 내린지라', '여호수아 6:20'] },
  sling: { name: '물매와 돌', verse: ['전쟁은 여호와께 속한 것인즉 그가 너희를 우리 손에 붙이시리라', '사무엘상 17:47'] },
  barley: { name: '보리 한 자루', verse: ['룻이 밭에서 저녁까지 줍고 그 주운 것을 떠니 보리가 한 에바쯤 되는지라', '룻기 2:17'] },
  mantle: { name: '엘리야의 겉옷', verse: ['엘리야의 몸에서 떨어진 겉옷을 주워가지고 돌아와서 요단 언덕에 서서', '열왕기하 2:13'] },
  ear: { name: '듣는 귀', // 예전 사무엘 부탁의 물품 (받은 사람 기록 보존용)
    verse: ['사무엘이 가로되 말씀하옵소서 주의 종이 듣겠나이다', '사무엘상 3:10'] },
  net: { name: '가득 찬 그물', verse: ['가득히 찬 큰 고기가 일백 쉰 세 마리라 이같이 많으나 그물이 찢어지지 아니하였더라', '요한복음 21:11'] },
  purse: { name: '나눔의 돈주머니', verse: ['주여 보시옵소서 내 소유의 절반을 가난한 자들에게 주겠사오며', '누가복음 19:8'] },
  wine: { name: '기름과 포도주', verse: ['가까이 가서 기름과 포도주를 그 상처에 붓고 싸매고 자기 짐승에 태워 주막으로 데리고 가서 돌보아 주고', '누가복음 10:34'] },
  twelve: { name: '남은 조각 열두 바구니', verse: ['저희가 배부른 후에 예수께서 제자들에게 이르시되 남은 조각을 거두고 버리는 것이 없게 하라 하시므로', '요한복음 6:12'] },
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
  // ---------- 10. 삭개오: 뽕나무에 올라가 (눅 19:4) ----------
  const zacc = npc('삭개오', { hoodie: 0x9a6a3a, hair: 0x3b2a22 }, P.zacc.at(-4, -3.5), P.zacc);
  zacc.av.scale.setScalar(0.85); // 키가 작은 삭개오
  // ---------- 11. 선한 사마리아인: 강도 만난 나그네 (눅 10:30-35) ----------
  const samaritan = npc('사마리아인', { hoodie: 0x5a7a8a, hair: 0x2b211c }, P.road.at(-8.5, -3), P.road);
  const wounded = npc('다친 나그네', { hoodie: 0xa89880, hair: 0x4a3a2a }, P.road.at(1.5, 0.5), P.road);
  wounded.mark.visible = false;
  const lieDown = () => { wounded.state = 'sit'; wounded.seat = { kind: 'floor', free: true }; wounded.action = null; };
  lieDown();
  // ---------- 12. 안드레와 아이: 보리떡 다섯과 물고기 둘 (요 6:9) ----------
  const andrew = npc('안드레', { hoodie: 0x6a8a5a, hair: 0x4a3a2a }, P.bethsaida.at(-10.5, -4), P.bethsaida);
  const boy = npc('아이', { hoodie: 0xd8b060, hair: 0x3b2a22 }, P.bethsaida.at(-8.4, -4.6), P.bethsaida);
  boy.mark.visible = false; boy.av.scale.setScalar(0.72);
  const crowd = [];
  for (let k = 0; k < 5; k++) {
    const p = freeAt(P.bethsaida.at(-4 + k * 3.6, k % 2 ? 3.5 : 0.5));
    const blanket = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.03, 18), M([0xd8c8a0, 0xc8a878, 0xb8c8a0, 0xd8b8a8, 0xc0b8d0][k], 0.95));
    put(blanket, p, 0.02);
    for (let j = 0; j < 2; j++) { const a = j * 3.1 + k; const f = makeChar({ hoodie: [0x8a7a6a, 0x9a6a5a, 0x6a7a8a][j], hair: 0x3b2a22, bag: 0x8a7a6a, style: j % 2, pants: 0x5a5048 }, p.x + Math.cos(a) * 0.75, p.z + Math.sin(a) * 0.75); f.state = 'sit'; f.seat = { kind: 'floor', free: true }; f.face = Math.atan2(-Math.cos(a), -Math.sin(a)); f.home = { x: f.x, z: f.z }; f.face0 = f.face; npcs.push(f); }
    const glow = fxSprite('light_01', 0xfff0c0, 1.2); glow.position.set(p.x, G(p) + 0.6, p.z); glow.visible = false; scene.add(glow);
    crowd.push({ s: glow, glow, p, got: false });
  }

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

  // ---------- 빈 구역에도 사람을 (2026-11): 요나의 바다 · 푸른 초장 · 겨자씨 · 포도나무 그늘 ----------
  const jonah = npc('요나', { hoodie: 0x5a6a8a, hair: 0x3b2a22 }, P.jonah.at(-6, 4.5), P.jonah);
  const shore = freeAt(P.jonah.at(-4.5, 0));
  const nineveh = freeAt(P.jonah.at(-8.5, -6.5));
  {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), M(0x8a6a4a)); post.position.y = 0.75; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.06), M(0xe8d8b0)); board.position.y = 1.35; g.add(board);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c2 = cv.getContext('2d');
    c2.fillStyle = '#e8d8b0'; c2.fillRect(0, 0, 256, 96); c2.fillStyle = '#5a3e28'; c2.font = '700 44px "Noto Serif KR", serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText('니느웨 →', 128, 50);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    for (const z of [0.035, -0.035]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.38), new THREE.MeshBasicMaterial({ map: tx })); f.position.set(0, 1.35, z); if (z < 0) f.rotation.y = Math.PI; g.add(f); }
    g.rotation.y = Math.atan2(-nineveh.x, -nineveh.z);
    put(g, nineveh);
  }
  const solomon = npc('솔로몬', { hoodie: 0x8a5ab0, hair: 0x2b211c }, P.meadow.at(-9, -5), P.meadow);
  const lilies = [];
  {
    const petal = new THREE.ConeGeometry(0.07, 0.2, 5, 1, true), white = M(0xfffaf0, 0.5, { emissive: 0x403c30, emissiveIntensity: 0.3, side: THREE.DoubleSide }), stem = M(0x5a9a4a, 0.9);
    for (let k = 0; k < 5; k++) {
      const p = freeAt(P.meadow.at(-6 + k * 3.2, k % 2 ? 4 : -2.5));
      const g = new THREE.Group();
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42), stem); st.position.y = 0.21; g.add(st);
      for (let j = 0; j < 5; j++) { const e = new THREE.Mesh(petal, white); e.position.set(Math.sin(j * 1.26) * 0.05, 0.47, Math.cos(j * 1.26) * 0.05); e.rotation.set(Math.cos(j * 1.26) * 0.5 + Math.PI, 0, -Math.sin(j * 1.26) * 0.5); g.add(e); }
      put(g, p);
      const glow = fxSprite('light_01', 0xfff0c0, 0.7); glow.position.y = 0.5; glow.visible = false; g.add(glow);
      lilies.push({ g, glow, p, got: false, keep: true }); // 들여다보기만 하고 꺾지 않음
    }
  }
  const isaac = npc('이삭', { hoodie: 0x9a8a5a, hair: 0x5a4030 }, P.mustard.at(-5, -4), P.mustard);
  const johnA = npc('요한', { hoodie: 0x7a9ab8, hair: 0x4a3a2a }, P.vine.at(-5.5, -3), P.vine);
  const vineSit = freeAt(P.vine.at(0, -3));

  // ---------- 부탁 정의 ----------
  const near = (p, d) => dist(p) < d;
  const Q = [
    {
      id: 'sheep', who: shepherd, name: '목자', title: '잃은 양 한 마리', stat: 'witness', item: 'staff',
      ask: '저는 양치기예요. 양 한 마리가 길을 잃었어요! 방울 소리나 하얀 양을 찾아 가까이 가 줄래요?',
      verse: V('q-sheep', '너희 중에 어느 사람이 양 일백 마리가 있는데 그 중에 하나를 잃으면 아흔 아홉 마리를 들에 두고 그 잃은 것을 찾도록 찾아 다니지 아니하느냐', '누가복음 15:4'),
      steps: [{ hint: '길 잃은 양 곁에 가면 따라와요. 우리로 데려와요', ev: 'sheepHome', go: () => P.fold, where: '양 우리 둘레 (방울 소리나 하얀 양을 찾아요)' }],
      done: '찾았어요, 고마워요! 길 잃은 한 사람이 돌아와도 하나님은 아주 기뻐하신대요. 이 지팡이를 선물로 줄게요.',
    },
    {
      id: 'well', who: woman, name: '사마리아 여인', title: '야곱의 우물가에서', stat: 'prayer', item: 'water', back: false,
      ask: '저는 사마리아 여인이에요. 예전에 여기서 예수님이 \'목마르지 않는 물\' 이야기를 해 주셨어요. 물 한 그릇 떠 줄래요?',
      verse: V('q-well', '내가 주는 물을 먹는 자는 영원히 목마르지 아니하리니 나의 주는 물은 그 속에서 영생하도록 솟아나는 샘물이 되리라', '요한복음 4:14'),
      steps: [
        { hint: '우물 곁 반짝이는 단추를 눌러 물을 떠요 (E)', until: () => me.item === 'cup' && me.drink === 'water', go: () => P.well, where: '야곱의 우물' },
        { hint: '여인 곁에서 반짝이는 단추를 눌러요 (E)', place: 'q_give', at: () => woman, r: 2.6, act: () => { me.item = null; me.drink = null; sfx('cup', 0.2); burst(woman.x, woman.y + 1.3, woman.z); } },
      ],
      done: '고마워요! 이 물도 시원하지만, 예수님이 주시는 생수는 다시 목마르지 않대요. 이 생수를 선물로 줄게요.',
    },
    {
      id: 'jericho', who: joshua, name: '여호수아', title: '여리고를 일곱 바퀴', stat: 'obey', item: 'horn',
      ask: '저는 여호수아예요. 이 성은 문이 꽁꽁 닫혀 있어요. 하나님 말씀대로 일곱 바퀴 돌고 나팔을 불어 볼래요?',
      verse: V('q-jericho', '제 칠일에는 성을 일곱번 돌며 제사장들은 나팔을 불 것이며', '여호수아 6:4'),
      steps: [{ hint: '성을 한 바퀴씩 돌아요. 등불 일곱이 켜지면 나팔 단추를 눌러요 (E)', ev: 'jerichoFall', go: () => P.jericho, where: '여리고 성' }],
      done: '해냈어요! 말씀대로 했더니 성벽이 무너졌어요. 이 양각 나팔을 선물로 줄게요.',
    },
    {
      id: 'david', who: david, name: '다윗', title: '매끄러운 돌 다섯', stat: 'word', item: 'sling',
      ask: '저는 양치기 소년 다윗이에요. 거인 골리앗이 무서워 다들 떨지만, 저는 하나님을 믿어요. 같이 시냇가에서 돌 다섯을 주워 볼래요?',
      verse: V('q-david', '시내에서 매끄러운 돌 다섯을 골라서 자기 목자의 제구 곧 주머니에 넣고 손에 물매를 가지고 블레셋 사람에게로 나아가니라', '사무엘상 17:40'),
      steps: [
        { hint: (r) => `반짝이는 돌 곁에서 반짝이는 단추를 눌러요 (E) ${r.n || 0}/5`, collect: brook, place: 'q_pick' },
        { hint: '골리앗 앞에서 반짝이는 단추를 눌러 물매를 던져요 (E). 단추가 안 보이면 골리앗이 다시 일어날 때까지 조금 기다려요', ev: 'goliathFall', go: () => P.david, where: '골리앗 앞' },
      ],
      done: '해냈어요! 하나님이 이기게 해 주셨어요. 이 물매를 선물로 줄게요.',
    },
    {
      id: 'ruth', who: ruth, name: '룻', title: '보아스의 밭에서', stat: 'fellow', item: 'barley',
      ask: '저는 룻이에요. 시어머니 나오미와 저는 먹을 게 없어요. 보아스 아저씨 밭에 떨어진 보리 이삭을 같이 주워 줄래요?',
      verse: V('q-ruth', '나로 밭에 가게 하소서 내가 뉘게 은혜를 입으면 그를 따라서 이삭을 줍겠나이다', '룻기 2:2'),
      steps: [{ hint: (r) => `밭가의 반짝이는 보리 이삭 곁에서 반짝이는 단추를 눌러요 (E) ${r.n || 0}/6`, collect: ears, place: 'q_pick' }],
      done: '와, 이렇게나 많이 주웠어요! 시어머니와 나눠 먹을게요. 보리 한 자루를 선물로 줄게요.',
    },
    {
      id: 'elijah', who: elijah, name: '엘리야', title: '로뎀나무 아래', stat: 'prayer', item: 'mantle',
      ask: '저는 엘리야예요. 너무 지쳐서 이 나무 아래 쓰러졌을 때, 하나님은 저를 재우고 먹이셨어요. 같이 그늘에 누워 볼래요?',
      verse: V('q-elijah', '로뎀나무 아래 누워 자더니 천사가 어루만지며 이르되 일어나서 먹으라 하는지라', '열왕기상 19:5'),
      steps: [
        { hint: '나무 그늘에서 누운 사람 단추를 눌러요 (K)', go: () => restSpot, where: '로뎀나무 그늘', until: (r, dt) => { if (lying() && near(broomAt, 4.5)) r.rest = (r.rest || 0) + dt; else r.rest = 0; if (r.rest > 4) { meal.visible = true; sfx('orb', 0.2, 1.3); return true; } return false; } },
        { hint: '반짝이는 단추를 눌러 먹어요 (E)', place: 'q_eat', at: () => meal.position, r: 2.4, act: () => { sfx('cup', 0.2); } },
        { hint: '반짝이는 단추를 눌러 한 번 더 먹어요 (E). 갈 길이 멀거든요!', place: 'q_eat', at: () => meal.position, r: 2.4, act: () => { sfx('cup', 0.2); meal.visible = false; showVerse(V('q-elijah2', '여호와의 사자가 또 다시 와서 어루만지며 이르되 일어나서 먹으라 네가 길을 이기지 못할까 하노라 하는지라', '열왕기상 19:7'), { cooldown: 0 }); } },
      ],
      done: '이제 힘이 나죠? 그 힘으로 아주 먼 길을 걸었어요. 이 겉옷을 선물로 줄게요.',
    },
    {
      id: 'noah', who: noah, name: '노아', title: '비둘기를 내어 놓으매', stat: 'obey', item: 'olive',
      ask: '저는 노아예요. 큰 홍수 물이 줄었는지 궁금해요. 큰 배 앞에서 비둘기를 날려 볼래요?',
      verse: V('q-noah', '또 칠일을 기다려 다시 비둘기를 방주에서 내어놓으매', '창세기 8:10'),
      steps: [
        { hint: '배 앞 반짝이는 단추를 눌러 비둘기를 날려요 (E)', place: 'q_dove', at: () => doveSpot, r: 3, act: () => { flight = { T: 0, leaf: false }; } },
        { hint: '비둘기가 돌아오고 있어요…', until: landed, go: () => doveSpot, where: '큰 배(방주) 앞' },
        { hint: (r) => `이레(7일)를 기다려요… ${Math.max(0, 7 - Math.floor(r.wait || 0))}`, until: (r, dt) => (r.wait = (r.wait || 0) + dt) > 7, go: () => doveSpot, where: '큰 배(방주) 앞' },
        { hint: '배 앞 반짝이는 단추를 눌러 비둘기를 한 번 더 날려요 (E)', place: 'q_dove', at: () => doveSpot, r: 3, act: () => { flight = { T: 0, leaf: true }; } },
        { hint: '저녁때가 되었어요…', until: landed, go: () => doveSpot, where: '큰 배(방주) 앞' },
      ],
      done: '감람 새 잎사귀예요! 기다리니 물이 줄었어요. 이 잎사귀를 선물로 줄게요.',
    },
    {
      id: 'zacc', who: zacc, name: '삭개오', title: '뽕나무에 올라가', stat: 'obey', item: 'purse',
      ask: '저는 삭개오예요. 예수님이 이 길로 지나가신대요. 키가 작아서 안 보이니 저 큰 뽕나무에 같이 올라가 볼래요?',
      verse: V('q-zacc', '앞으로 달려가 보기 위하여 뽕나무에 올라가니 이는 예수께서 그리로 지나가시게 됨이러라', '누가복음 19:4'),
      steps: [
        { hint: '큰 뽕나무 곁에서 나무 그림 단추를 눌러 올라가요', go: () => SYCAMORE, where: '길가의 큰 뽕나무', until: () => !!me.climb && Math.hypot(me.x - SYCAMORE.x, me.z - SYCAMORE.z) < 2.5 && me.climb.phase === 'hang' },
        { hint: '내려와서 삭개오 곁 반짝이는 단추를 눌러 1 데나리온을 나눠요 (E)', need: () => ((profile.coins | 0) < 1 ? '1 데나리온이 있어야 해요 · 부탁을 그만두고 훈련장에서 받은 뒤 다시 와요' : ''), place: 'q_give', at: () => zacc, r: 2.6,
          act: () => { if (!spend(profile, 1)) { toast('1 데나리온이 모자라요. 부탁을 그만두고 훈련장에서 받은 뒤 다시 와요', 4); return false; } sfx('share', 0.2); showVerse(V('q-zacc2', '삭개오가 서서 주께 여짜오되 주여 보시옵소서 내 소유의 절반을 가난한 자들에게 주겠사오며 만일 뉘 것을 토색한 일이 있으면 사배나 갚겠나이다', '누가복음 19:8'), { cooldown: 0 }); } },
      ],
      done: '고마워요! 나누니까 마음이 이렇게 가벼워요. 예수님이 우리 집에 오셨어요. 이 돈주머니를 선물로 줄게요.',
    },
    {
      id: 'samaritan', who: samaritan, name: '사마리아인', title: '강도 만난 이웃', stat: 'fellow', item: 'wine', back: false,
      ask: '저는 사마리아인이에요. 다친 사람을 같이 돌봐 줄래요? 상처에 바를 등잔 기름은 금화가 떠 있는 루디아 가게에서 사요.',
      verse: V('q-sam', '어떤 사마리아인은 여행하는 중 거기 이르러 그를 보고 불쌍히 여겨', '누가복음 10:33'),
      steps: [
        { hint: '다친 사람 곁 반짝이는 단추를 눌러요 (E)', need: () => ((profile.bag?.oil | 0) > 0 ? '' : '등잔 기름이 필요해요 · 금화가 떠 있는 루디아 가게에서 사요 (2 데나리온)'),
          go: () => ((profile.bag?.oil | 0) > 0 ? wounded : P.market), where: () => ((profile.bag?.oil | 0) > 0 ? '다친 나그네' : '가게 · 루디아 (금화가 떠 있어요)'),
          place: 'q_give', at: () => wounded, r: 2.4,
          act: () => { if (!useGood(profile, 'oil')) { toast('기름이 없어요. 금화가 떠 있는 루디아 가게에서 사 오세요 (2 데나리온)', 4.5); return false; } sfx('cup', 0.2, 1.1); burst(wounded.x, G(wounded) + 0.8, wounded.z); wounded.seat = null; wounded.state = 'idle'; } },
        { hint: '다친 사람과 함께 루디아의 가게까지 걸어가요', go: () => P.market, where: '가게 · 루디아 (지도에서 \'가게 · 루디아\')', until: () => {
          const d = Math.hypot(me.x - wounded.x, me.z - wounded.z);
          if (d > 2.2 && wounded.state !== 'walk') { const a = Math.atan2(wounded.x - me.x, wounded.z - me.z); const p = nearestFree({ x: me.x + Math.sin(a) * 1.4, z: me.z + Math.cos(a) * 1.4 }); if (p) { wounded.path = [p]; wounded.state = 'walk'; } }
          wounded.home = { x: wounded.x, z: wounded.z };
          return Math.hypot(wounded.x - P.market.x, wounded.z - P.market.z) < 8;
        } },
      ],
      done: '잘 데려왔어요! 어려운 사람을 돕는 사람이 진짜 이웃이래요. 이 기름과 포도주를 선물로 줄게요.',
      reset: () => { const h = P.road.at(1.5, 0.5); wounded.x = h.x; wounded.z = h.z; wounded.home = { ...h }; wounded.path = []; lieDown(); },
    },
    {
      id: 'loaves', who: andrew, name: '안드레', title: '보리떡 다섯과 물고기 둘', stat: 'witness', item: 'twelve',
      ask: '저는 안드레예요. 사람이 아주 많은데 먹을 게 없어요. 작은 아이가 가진 도시락을 같이 보러 갈래요?',
      verse: V('q-loaves', '여기 한 아이가 있어 보리떡 다섯 개와 물고기 두 마리를 가졌나이다 그러나 그것이 이 많은 사람에게 얼마나 되겠삽나이까', '요한복음 6:9'),
      steps: [
        { hint: '아이 곁 반짝이는 단추를 눌러요 (E)', place: 'q_pick', at: () => boy, r: 2.4, act: () => { sfx('cup', 0.2); showVerse(V('q-loaves2', '예수께서 떡을 가져 축사하신 후에 앉은 자들에게 나눠 주시고 고기도 그렇게 저희의 원대로 주시다', '요한복음 6:11'), { cooldown: 0, title: '축사: 감사 기도' }); } },
        { hint: (r) => `빛나는 돗자리 곁에서 반짝이는 단추를 눌러요 (E) ${r.n || 0}/5`, collect: crowd, place: 'q_give' },
      ],
      done: '모두 배불리 먹고도 열두 바구니가 남았어요! 작은 도시락도 주께서 넉넉히 쓰셨어요. 이 바구니를 선물로 줄게요.',
    },
  ];
  Q.push(
    {
      id: 'peter', who: peter, name: '베드로', title: '배 오른편에 그물을', stat: 'witness', item: 'net', back: false,
      ask: '저는 어부 베드로예요. 밤새 한 마리도 못 잡았는데, 예수님이 \'오른쪽에 던져라\' 하셨어요. 같이 던져 볼래요?',
      verse: V('q-peter', '가라사대 그물을 배 오른편에 던지라 그리하면 얻으리라 하신대 이에 던졌더니 고기가 많아 그물을 들 수 없더라', '요한복음 21:6'),
      steps: [
        { hint: '물가에서 반짝이는 단추를 눌러 그물을 던져요 (E). 노란 \'오른편\' 동그라미에서요', place: 'q_net', at: () => (dist(netL) < dist(netR) ? netL : netR), r: 2.2,
          act: () => {
            if (dist(netL) < dist(netR)) { sfx('impact/impactSoft_medium_000', 0.2, 0.7); showVerse(V('q-peter0', '나가서 배에 올랐으나 이 밤에 아무 것도 잡지 못하였더니', '요한복음 21:3'), { cooldown: 0, title: '빈 그물' }); toast('빈 그물이에요. 노란 \'오른편\' 동그라미로 가 봐요', 4); return false; }
            sfx('orb', 0.3, 1.1); fishBurst(netR); return true;
          } },
      ],
      done: '153마리나 잡았어요! 말씀대로 했더니 그물이 터질 것 같아요. 이 그물을 선물로 줄게요.',
    },
  );
  const onSeat = (kind) => !!me.seat && me.seat.kind === kind;
  Q.push(
    {
      id: 'jonah', who: jonah, name: '요나', title: '일어나 니느웨로', stat: 'obey', item: 'gourd', back: false,
      ask: '저는 요나예요. 도망가다 큰 물고기 배 속에 들어갔다가 말씀대로 하기로 했어요. 물가에서 같이 기도하고, 니느웨 팻말 앞에서 손을 흔들어 줄래요?',
      verse: V('q-jonah', '일어나 저 큰 성읍 니느웨로 가서 내가 네게 명한 바를 그들에게 선포하라 하신지라', '요나 3:2'),
      steps: [
        { hint: '모래밭에서 두 손 모은 단추를 꾹 눌러요 (X)', go: () => shore, where: '요나의 바다 물가', until: (r, dt) => { if (me.action === 'pray' && near(shore, 6)) r.t = (r.t || 0) + dt; else r.t = 0; return r.t > 3; } },
        { hint: '\'니느웨\' 팻말 앞에서 손 흔드는 단추를 눌러요', go: () => nineveh, where: '니느웨 팻말', until: () => near(nineveh, 3.2) && (me.action === 'wave' || me.action === 'share') },
      ],
      done: '잘했어요! 니느웨 사람들이 하나님께 돌아왔대요. 이 박넝쿨 잎을 선물로 줄게요.',
    },
    {
      id: 'solomon', who: solomon, name: '솔로몬', title: '들의 백합화를 보라', stat: 'prayer', item: 'lily',
      ask: '저는 솔로몬 왕이에요. 저는 멋진 옷이 많았지만, 예수님은 들꽃 하나가 더 예쁘다고 하셨어요. 풀밭에 핀 흰 백합 다섯 송이를 같이 볼래요?',
      verse: V('q-solomon', '또 너희가 어찌 의복을 위하여 염려하느냐 들의 백합화가 어떻게 자라는가 생각하여 보라 수고도 아니하고 길쌈도 아니하느니라', '마태복음 6:28'),
      steps: [{ hint: (r) => `흰 백합 곁에서 반짝이는 단추를 눌러요 (E) ${r.n || 0}/5`, collect: lilies, place: 'q_pick' }],
      done: '꽃은 옷을 만들지 않아도 이렇게 예뻐요. 하나님은 우리도 더 잘 돌봐 주세요. 이 백합을 선물로 줄게요.',
    },
    {
      id: 'isaac', who: isaac, name: '이삭', title: '겨자씨 한 알', stat: 'fellow', item: 'mustard',
      ask: '저는 농사를 지은 아브라함의 아들 이삭이에요. 작은 겨자씨를 흙더미에 심어 볼래요? 새들이 쉴 만큼 큰 나무가 된대요.',
      verse: V('q-isaac', '또 비유를 베풀어 가라사대 천국은 마치 사람이 자기 밭에 갖다 심은 겨자씨 한 알 같으니', '마태복음 13:31'),
      steps: [
        { hint: '흙더미의 반짝이는 씨앗을 눌러요', ev: 'mustardPlant', go: () => P.mustard, where: '겨자씨 흙더미' },
        { hint: '씨가 자라 새들이 쉬러 오는 것을 지켜봐요…', ev: 'mustardGrown', go: () => P.mustard, where: '겨자씨 흙더미' },
      ],
      done: '가장 작은 씨가 새들이 쉬는 나무가 되었어요! 작은 사랑도 그렇게 자라요. 이 겨자씨를 선물로 줄게요.',
    },
    {
      id: 'vine', who: johnA, name: '요한', title: '내 안에 거하라', stat: 'word', item: 'grapes',
      ask: '저는 예수님의 제자 요한이에요. 예수님은 \'나는 포도나무, 너희는 가지\'라고 하셨어요. 포도나무 그늘 의자에 잠깐 앉아 볼래요?',
      verse: V('q-vine', '나는 포도나무요 너희는 가지니 저가 내 안에, 내가 저 안에 있으면 이 사람은 과실을 많이 맺나니 나를 떠나서는 너희가 아무 것도 할 수 없음이라', '요한복음 15:5'),
      steps: [
        { hint: (r) => `포도나무 그늘 의자를 눌러 앉아요. 5초만 기다려요 ${Math.min(5, Math.floor(r.t || 0))}/5`, go: () => vineSit, where: '포도나무 그늘', until: (r, dt) => { if (onSeat('vine')) r.t = (r.t || 0) + dt; else r.t = 0; return r.t > 5; } },
        { hint: '이제 맺힌 포도송이를 눌러 봐요.', ev: 'vineFruit', go: () => vineSit, where: '포도나무 그늘' },
      ],
      done: '앉아 있었을 뿐인데 열매가 맺혔어요! 말씀 안에 머무는 것이 열매의 비결이에요. 이 포도송이를 선물로 줄게요.',
    },
  );
  const BY = Object.fromEntries(Q.map((q) => [q.id, q]));
  const doneCount = () => Q.filter((q) => profile.quests[q.id] === 'done').length;

  // ---------- 말풍선(dialog.js)과 진행 표시 ----------
  const dlg = createDialog({ id: 'quest' });
  const chip = document.createElement('div'); chip.id = 'questChip'; chip.hidden = true; document.body.appendChild(chip);
  let run = null, shown = null, thanks = null;
  const hide = () => { dlg.close(); shown = null; };
  // 아래 단추: 감사해요(고마움 인사를 닫음) / 도와줄게요(부탁 시작) / 알겠어요(닫기)
  const onNext = () => { if (thanks) { thanks = null; hide(); } else if (shown && !run) begin(shown); else hide(); };
  const onEnd = () => { if (run) { run = null; updateChip(); } hide(); };
  function show(q, text, verse, { next = '', later = false, end = false, n = q.title, how = '' } = {}) {
    shown = q;
    dlg.open({
      who: q.name, n, say: text, verse, how,
      choices: [
        { label: '그만두기', cls: 'end', hidden: !end, on: onEnd },
        { label: '나중에', cls: 'later', hidden: !later, on: hide },
        { label: next, cls: 'next', hidden: !next, main: true, on: onNext },
      ],
      esc: () => (thanks ? onNext() : hide()),
    });
  }
  const hintOf = (r) => { const s = r.q.steps[r.i]; const need = s.need?.(r); if (need) return need; return typeof s.hint === 'function' ? s.hint(r) : s.hint; };
  const whereOf = (s) => (typeof s.where === 'function' ? s.where() : s.where) || '';
  function updateChip() {
    if (!run) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.textContent = run.i >= run.q.steps.length ? `${run.q.name}에게 돌아가요` : `${run.q.name} · ${hintOf(run)}`;
  }
  function begin(q) {
    run = { q, i: 0, n: 0, flags: {} };
    q.reset?.(); // 다시 할 때 처음 자리로 (다친 나그네)
    hide();
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
    if (profile.quests[q.id] === 'done') { addSteps(profile, 2); earn(profile, 1); save(); onChange?.(); show(q, '또 해냈어요! 도와줘서 고마워요.', '', { next: '감사해요', how: '연습이라 선물은 없지만 걸음 +2, 1 데나리온을 받았어요' }); return; }
    profile.quests[q.id] = 'done';
    addStat(profile, q.stat, STAT_REWARD); giveItem(profile, q.item); earn(profile, 3);
    const up = addSteps(profile, STEP_REWARD);
    save(); onChange?.();
    const st = STATS.find((x) => x.id === q.stat);
    show(q, q.done, '', { next: '감사해요', how: `${st.name} +${STAT_REWARD}, 걸음 +${STEP_REWARD}, ${ITEMS[q.item].name}, 3 데나리온을 받았어요` });
    if (up) setTimeout(() => toast(`${profile.name || '나'}님이 ${up.name}${josa(up.name)} 자랐어요!`, 5), 2500);
  }
  const josa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  for (const ev of ['sheepHome', 'jerichoFall', 'goliathFall', 'mustardPlant', 'mustardGrown', 'vineFruit']) on(ev, () => { if (run && run.q.steps[run.i] && run.q.steps[run.i].ev === ev) advance(); });

  // ---------- 그 자리 단추 ----------
  const curStep = () => (run && run.i < run.q.steps.length ? run.q.steps[run.i] : null);
  const nearestItem = (list) => { let b = null, bd = 2.2; for (const c of list) if (!c.got) { const d = dist(c.p); if (d < bd) { bd = d; b = c; } } return b; };
  const doPlace = () => {
    const s = curStep(); if (!s) return;
    if (s.collect) {
      const c = nearestItem(s.collect); if (!c) return;
      c.got = true; if (!c.keep) (c.g || c.s).visible = false; run.n++; sfx('impact/impactSoft_medium_000', 0.2, 1.3); burst(c.p.x, G(c.p) + 0.4, c.p.z);
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
  const people = Q.map((q) => q.who).concat([naomi, boy]);
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
    for (const c of crowd) c.glow.visible = !!(s && s.collect === crowd && !c.got);
    for (const c of lilies) c.glow.visible = !!(s && s.collect === lilies && !c.got);
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
    if (run && s && s.need) updateChip(); // 기름·돈이 있어야 하는 단계는 있고 없고에 따라 칩 글이 바뀜
    // 인물 곁에 가면 말을 검
    if (busy()) { if (shown && !thanks) hide(); return; }
    let nearQ = null;
    for (const q of Q) if (Math.hypot(me.x - q.who.x, me.z - q.who.z) < 3.4) nearQ = q;
    if (run && nearQ === run.q && run.i >= run.q.steps.length) { offerTalk('quest:' + nearQ.id, nearQ.who, () => complete()); return; } // 말 걸기 단추를 눌러야 열림
    if (thanks) { if (Math.hypot(me.x - thanks.who.x, me.z - thanks.who.z) > 9) { thanks = null; hide(); } return; }
    if (nearQ && nearQ !== shown) offerTalk('quest:' + nearQ.id, nearQ.who, () => {
      const q = nearQ, isRun = run && run.q === q;
      if (isRun) show(q, hintOf(run), '', { end: true, next: '알겠어요' });
      else if (run) show(q, `지금은 ${run.q.name}의 부탁을 하고 있어요. 왼쪽 위 부탁 표시를 누르면 갈 곳이 나와요.`, '', { next: '알겠어요' });
      else if (profile.quests[q.id] === 'done') show(q, `다시 와 주었군요, ${profile.name || '친구'}님! 한 번 더 도와줄래요? 이번에는 마음으로 하는 연습이에요.`, '', { next: '도와줄게요', later: true });
      else show(q, q.ask, q.verse, { next: '도와줄게요', later: true });
    });
    if (!nearQ && shown) hide();
  }

  // 왼쪽 부탁 창: 지금 부탁의 내용과 해야 할 자리
  function info() {
    if (!run) return null;
    const q = run.q, back = run.i >= q.steps.length, s = back ? null : q.steps[run.i];
    let target = null, where = '';
    if (back) { target = q.who; where = `${q.name}에게`; }
    else if (s.collect) {
      let b = null, bd = 1e9; for (const c of s.collect) if (!c.got) { const d = dist(c.p); if (d < bd) { bd = d; b = c; } }
      target = b && b.p; where = '반짝이는 자리';
    } else if (s.go) { target = s.go(); where = whereOf(s); }
    else if (s.at) { target = s.at(); where = whereOf(s); }
    if (!target) { target = q.who; where = `${q.name}에게`; }
    return { q, name: q.name, title: q.title, ask: q.ask, verse: VERSES[q.verse], hint: back ? `${q.name}에게 돌아가 마친 일을 알려요.` : hintOf(run), step: Math.min(run.i + 1, q.steps.length), steps: q.steps.length, back, target: { x: target.x, z: target.z }, where };
  }
  const quit = () => { if (run) { run = null; updateChip(); } };
  let quiet = false; // 훈련 사부 곁에서 "지금 ○○의 부탁을 하고 있어요" 안내를 띄울 때만 잠깐 run을 빼고 busy를 봄
  const ignoreRun = (fn) => { quiet = true; try { return fn(); } finally { quiet = false; } };
  const active = () => !!shown || (!!run && !quiet && !(run.q.id === 'samaritan' && run.i === 0 && dist(P.market) < 10.5));

  const talking = () => !!shown; // 부탁 말풍선이 열린 때만 (지금 할 일 카드는 부탁 중에도 보임, T03 A)
  return { info, quit, step, actions, available, active, talking, ignoreRun, Q, BY, doneCount, get run() { return run; }, spots: { brook, ears, doveSpot, meal, restSpot, broomAt, netL, netR } };
}
