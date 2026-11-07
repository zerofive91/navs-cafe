// 요한복음 마을 사건 진행 (2026-11 1차 MVP, 기획서 3·4·6장)
//   증인에게 말 걸기 → 듣기 → 단계(적용, quests.js 형식) → 말씀 카드(읽기) → 처음 마치면 보상과 profile.john.ev 기록
//   다 마친 사건은 언제든 "깊이 보기"(공부·암송·묵상)와 다시 하기. 큰 줄기는 장 순서로 열림(반선형), 다음 사건 자리에 금빛 기둥
//   그 시각의 빛(열 시쯤·밤·잔치 날)은 그 구역 안에서만 하늘·안개·빛을 바꾸고 나오면 돌아옴
//   region.js가 마을을 처음 지을 때 불러옴 (dynamic import). main.js에는 region을 거쳐 이어짐(available·actions·step·active)
//   2026-11 사도행전 0-가: 마을과 상관없는 부품(사건 진행·말풍선·머리 표시·금빛 기둥·그 시각의 빛·사람 세우기·들고 다니기)은 js/village/로 옮김.
//   여기에는 요한 마을의 사람·사건 도구·시각 표·글·졸업 카드만 남음 (같은 동작)
import * as THREE from 'three';
import { JOHN_EVENTS } from '../profile.js';
import { showVerse } from '../verses.js';
import { findPath, nearestFree } from '../nav.js';
import { floorY } from '../layout.js';
import { JX, JZ, ZONES, SP, PLAZA_LIGHT, JARS, ROOF_Y, HOUSE10, REGION, LAKE_AT, JN_ACTS, LAMP_IDS, LAMPS } from './layout.js';
import { initGalilee } from './galilee.js'; // 2차 가 (갈릴리·사마리아) 사건 도구
import { initJerusalem } from './jerusalem.js'; // 2차 나 (예루살렘·베다니) 사건 도구
import { initPassion, callName } from './passion.js'; // 3차 (다락방·수난·부활) 사건 도구, 이름 부르기
import { initErrands, dayPick } from '../village/errands.js'; // 증인의 작은 부탁 (마을 공용 엔진, 채우기 E1)
import { ER } from './errands.js'; // 요한 마을 부탁 자료
import { createTalk, createWhisper, createChip } from '../village/talk.js'; // 말풍선·속삭임·진행 칩 (마을 공용)
import { initPeople } from '../village/people.js'; // 사람 세우기·움직이기 (마을 공용)
import { initBeacon } from '../village/beacon.js'; // 금빛 기둥·자리 고리 (마을 공용)
import { initSky } from '../village/sky.js'; // 그 시각의 빛 (마을 공용)
import { initCarry, initProps } from '../village/things.js'; // 들고 다니기·놓는 물건 (마을 공용)
import { initFlow, townTools } from '../village/flow.js'; // 사건 진행·마침·졸업·말 걸기 (마을 공용)
// events·trials·modes는 region.js가 불러와 넘김 (불러오기에 실패해 다시 시도할 때 주소 끝을 바꿀 수 있게)

const NOBLUR = 'navs-cafe-noblur';
const END_SEEN = 'navs-cafe-john-end'; // 지금 있는 사건을 다 마친 뒤 사도 요한의 "이야기는 이어져요"를 들었는지 (이 기기에만, 금빛 기둥 표시용). 값은 그때의 사건 수 → 사건이 늘면 다시 안내
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 이번만 */ } };


// ---------- 그 시각의 빛 (구역 안에서만) ----------
// day는 마을 기본(REGION.env). bg: 하늘 바탕색, hemi·sun: 빛 세기 배율
const SKY = {
  day: null,
  ten: { bg: 0xeec594, fogC: 0xe6c08e, fog: [50, 190], hemiSky: 0xffe0b4, hemiGround: 0xc49c6a, hemi: 0.92, sun: 0.85 },     // 1:39 "열 시쯤" (해가 기운 따뜻한 빛)
  feast: { bg: 0xd9ecf4, fogC: 0xf1e8cf, fog: [60, 230], hemiSky: 0xfff6e4, hemiGround: 0xe2cfa4, hemi: 1.08, sun: 1.05 },  // 2:1 사흘 되던 날 잔치
  night: { bg: 0x0d1430, fogC: 0x111a36, fog: [24, 120], hemiSky: 0x6878a8, hemiGround: 0x2a2834, hemi: 0.4, sun: 0.1, stars: 1 }, // 3:2 밤에
  dark: { bg: 0x161a2a, fogC: 0x141828, fog: [3, 34], hemiSky: 0x40486a, hemiGround: 0x2a2620, hemi: 0.34, sun: 0.12, dim: 1 },  // 1:5 어두움 (빛 비추기 시험: 멈출수록 등불 둘레만 남음)
  // 2차 가
  noon: { bg: 0xf3f0e2, fogC: 0xf2ecd8, fog: [70, 240], hemiSky: 0xffffff, hemiGround: 0xe8d8b0, hemi: 1.16, sun: 1.25 },        // 4:6 "제 육시쯤" (해가 높은 때, 시각은 본문 표현 그대로)
  seventh: { bg: 0xf0d8ac, fogC: 0xead09e, fog: [55, 200], hemiSky: 0xffe8c4, hemiGround: 0xcfa878, hemi: 0.98, sun: 0.92 },  // 4:52 "제 칠시"
  storm: { bg: 0x0f1626, fogC: 0x18223a, fog: [16, 90], hemiSky: 0x5a6888, hemiGround: 0x22262e, hemi: 0.36, sun: 0.08 },     // 6:17-18 이미 어두웠고 큰 바람
  // 2차 나
  morn: { bg: 0xf4dcc4, fogC: 0xf0d8c0, fog: [50, 200], hemiSky: 0xfff0e0, hemiGround: 0xd8c0a0, hemi: 0.95, sun: 0.8 },        // 8:2 아침에
  winter: { bg: 0xd6dde4, fogC: 0xd4dae0, fog: [45, 190], hemiSky: 0xeef2f6, hemiGround: 0xb8b4aa, hemi: 0.9, sun: 0.7 },     // 10:22 수전절, 때는 겨울이라
  // 3차 (수난 구역은 어둠을 절제: 밤이어도 길이 보이게)
  eve: { bg: 0xe8b890, fogC: 0xe0ae86, fog: [45, 180], hemiSky: 0xffd8b0, hemiGround: 0xb88a68, hemi: 0.8, sun: 0.6 },         // 13:4 저녁 잡수시던 자리
  kidron: { bg: 0x1a2240, fogC: 0x1c2440, fog: [26, 120], hemiSky: 0x7080b0, hemiGround: 0x30303a, hemi: 0.48, sun: 0.12, stars: 1 }, // 18:3 등과 홰 (밤)
  dawn: { bg: 0xb8b4c8, fogC: 0xc4bccc, fog: [40, 170], hemiSky: 0xdcd4e8, hemiGround: 0xa89a90, hemi: 0.7, sun: 0.4 },        // 18:28 새벽이라
  darkdawn: { bg: 0x3a4060, fogC: 0x4a4e68, fog: [30, 140], hemiSky: 0x9098c0, hemiGround: 0x4a4440, hemi: 0.55, sun: 0.2, stars: 0.5 }, // 20:1 아직 어두울 때에
  evening: { bg: 0xd8a888, fogC: 0xc89c80, fog: [40, 170], hemiSky: 0xf0c8a8, hemiGround: 0xa07c60, hemi: 0.72, sun: 0.5 },    // 20:19 저녁 때에
  daybreak: { bg: 0xf4d0b0, fogC: 0xf0ccb0, fog: [50, 200], hemiSky: 0xffe2c8, hemiGround: 0xc8a888, hemi: 0.88, sun: 0.7 },  // 21:4 날이 새어갈 때에
};
// 마리아야(20장)를 마친 뒤 마을 전체에 감도는 새벽빛: 안개와 하늘빛(반구광) 색만 조금 (조명 수·세기는 그대로, 하늘 그림은 건드리지 않음)
const RISEN = { fogC: 0xefdccc, hemiSky: 0xfff0e2, hemiGround: 0xdcc4a4, k: 0.45 };

export function initJohn(K, built, { EV, ORDER, initTrials, initModes }) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, walkTo, standUp, shot, busy, onChange, here, openLog, lights } = K;
  const parts = built.parts;
  const J = () => profile.john;
  const inTown = () => here() === 'john';
  const dist = (a, b = me) => Math.hypot(a.x - b.x, a.z - b.z);
  const G = (p) => floorY(p.x, p.z);

  // ---------- 사람들 (세우기·움직이기는 js/village/people.js) ----------
  const M = (c, r = 0.85, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const people = initPeople({ me, makeChar, npcs });
  const { N, person } = people;
  let flow = null; // 사건 진행 (아래 initFlow). 사건 도구가 지금 사건을 물을 때 (매 프레임·단계에서만 부름)
  const runNow = () => flow?.run || null;
  person('john', '사도 요한', { hoodie: 0xc9a86a, hair: 0x6a4a30 }, SP.john, PLAZA_LIGHT);
  person('baptist', '세례 요한', { hoodie: 0x8a6a42, hair: 0x2b211c }, SP.baptist, SP.warm);
  person('andrew', '안드레', { hoodie: 0x6a8aa8, hair: 0x4a3324 }, SP.andrew, SP.baptist);
  person('nathan', '나다나엘', { hoodie: 0x8a9a6a, hair: 0x2b211c }, SP.nathan, SP.fig);
  person('servant', '하인', { hoodie: 0xe8dcc0, hair: 0x3b2a22 }, SP.servant, JARS[2]);
  person('master', '연회장', { hoodie: 0x9a4a5a, hair: 0x9a9088 }, SP.master, SP.feast[1]);
  SP.guests.forEach((p, i) => person('guest' + i, i ? '신랑' : '손님', { hoodie: i ? 0xf0e6d0 : 0xb88a5a, hair: 0x2b211c, style: i ? 0 : 1 }, p, SP.feast[1]));
  person('nico', '니고데모', { hoodie: 0x4a3a6a, hair: 0x8a8070 }, SP.nico, SP.seat10);
  person('blind', '눈 뜬 사람', { hoodie: 0xa89070, hair: 0x2b211c }, SP.blindMan, SP.blindSeat);
  SP.pharisee.forEach((p, i) => person('ph' + i, '바리새인', { hoodie: i ? 0x3a4a6a : 0x5a3a2a, hair: 0x5a5048 }, p, SP.blindSeat));
  // 등불 든 사람들 (밤 시험), 수군거리는 무리 (실로암) — 시험 동안만 보임
  const walkers = SP.walkers.map((p, i) => person('walker' + i, '지나가는 사람', { hoodie: i ? 0x5a5a6a : 0x6a5040 }, p, SP.walkers[1 - i]));
  walkers.forEach((n) => { const g = fxSprite('light_01', 0xffc870, 0.8); g.position.set(0.25, 1.1, 0.3); n.av.add(g); n.hide = true; });
  const crowd = [[-3.2, 2.2], [3.4, 1.6], [0.4, 3.6]].map(([dx, dz], i) => person('crowd' + i, '무리', { hoodie: [0x7a6a5a, 0x6a6a7a, 0x8a6a6a][i] }, { x: SP.pharisee[0].x + dx, z: SP.pharisee[0].z + dz }, SP.pharisee[0]));
  crowd.forEach((n) => { n.hide = true; });
  N.nathan.action = 'read'; // 무화과나무 아래에서 율법을 묵상하던 나다나엘
  const GREET = {
    baptist: '나는 광야에 외치는 자의 소리예요. 저 강가의 따뜻한 빛을 보세요.', andrew: '저는 시몬 베드로의 형제 안드레예요. 그날 그분과 함께 머물렀지요.',
    nathan: '무화과나무 그늘은 말씀을 묵상하기 좋은 자리예요.', master: '잔치를 맡은 사람이에요. 오늘 잔치가 무사히 끝나야 할 텐데요.',
    guest0: '혼인 잔치에 와 주어 반가워요!', guest1: '신랑이에요. 함께 기뻐해 줘서 고마워요.',
    ph0: '안식일을 지키지 않는 사람은 하나님께로서 온 자가 아니라고 해요(9:16).', ph1: '우리는 모세의 제자요(9:28).',
  };
  // 2차 가: 사마리아 여인·수가 사람·왕의 신하·빌립·안드레·아이·베드로·무리와 배·안개 도구 (js/john/galilee.js)
  const noBlur = () => lsGet(NOBLUR) === '1';
  const g2 = initGalilee({ root: built.root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, noBlur });
  // 2차 나: 제자·성전 뜰의 여인·목자·베데스다의 병자들·마르다·마리아·나사로와 장사판·무덤 돌·향기 도구 (js/john/jerusalem.js). runId는 매 프레임에만 부름
  const g3 = initJerusalem({ root: built.root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId: () => (runNow() ? runNow().ev.id : '') });
  // 3차: 도마·다른 제자·막달라 마리아·여종·빌라도·니고데모·횃불 무리와 대야·문·검·무덤 돌·그물·어린 양 (js/john/passion.js)
  const g4 = initPassion({ root: built.root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId: () => (runNow() ? runNow().ev.id : '') });

  // ---------- 금빛 기둥 (다음 사건·지금 단계 자리), 빛나는 자리 고리 (js/village/beacon.js) ----------
  const beacon = initBeacon({ scene, fxSprite, G });
  // 실로암 성 밖의 따뜻한 빛 (요 9:35, 그분이 그 사람을 만나심)
  const warm2 = parts.warm.clone(); warm2.visible = false; scene.add(warm2);

  // ---------- 말풍선 (사건·시험·모드가 함께 씀), 속삭임, 진행 표시 (js/village/talk.js) ----------
  const ui = createTalk({ id: 'jtalk', cls: 'npcb jn' });
  const whisper = createWhisper('jwhisper'); // 속삭임 한 줄 (걸으며 하는 시험)
  const chip = createChip('johnChip', () => openLog?.('j')); // 진행 표시 (왼쪽 위, 누르면 부탁 창)
  // 흐림 없이 하기 (실로암)
  const blurBtn = document.createElement('button'); blurBtn.id = 'jnBlurBtn'; blurBtn.hidden = true; document.body.appendChild(blurBtn);
  const blurLabel = () => { blurBtn.textContent = noBlur() ? '흐린 화면으로 하기' : '흐림 없이 하기'; };
  blurBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  blurBtn.addEventListener('click', (e) => { e.stopPropagation(); lsSet(NOBLUR, noBlur() ? '0' : '1'); document.body.classList.toggle('jn-noblur', noBlur()); blurLabel(); });

  // ---------- 들고 다니는 것 (등불·물동이·잔), 하인 앞치마 ----------
  // 들고 다니는 등불의 빛: 마을 모형(root) 안에 미리 두어 이 마을에서만 조명 수에 들고, 세기만 0↔5로 바꿈
  const lampLight = new THREE.PointLight(0xffc878, 0, 11, 1.4);
  built.root.add(lampLight);
  const handPos = new THREE.Vector3();
  const carryMesh = (kind) => {
    const g = new THREE.Group();
    if (kind === 'lamp') {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), M(0xb9805a)); b.scale.set(1.3, 0.55, 1); g.add(b);
      const f = fxSprite('light_01', 0xffc860, 0.55); f.position.set(0.12, 0.12, 0); g.add(f);
      g.userData.lamp = true; // 빛은 lampLight (아래)
    } else if (kind === 'jar') {
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.26, 12), M(0xb9805a)); j.position.y = -0.06; g.add(j);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), M(0x6fb2c8, 0.1)); w.rotation.x = -Math.PI / 2; w.position.y = 0.07; g.add(w);
    } else if (kind === 'scroll') { // 말씀 카드 (왕의 신하, 4:50)
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 10), M(0xf2e2b8)); r.rotation.z = Math.PI / 2; g.add(r);
      for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), M(0x8a6748)); k.rotation.z = Math.PI / 2; k.position.x = s * 0.15; g.add(k); }
    } else if (kind === 'basket') { // 아이의 보리떡 다섯 물고기 둘 (6:9)
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.14, 12, 1, true), M(0xb08a50)); b.position.y = -0.04; g.add(b);
      for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M(0xd8a85a)); l.scale.y = 0.6; l.position.set(Math.cos(k * 1.26) * 0.08, 0.04, Math.sin(k * 1.26) * 0.08); g.add(l); }
    } else if (kind === 'stone') { // 손에 쥐여 준 돌 (8:7)
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), M(0x9a9288, 1, { flatShading: true })); st.scale.set(1.2, 0.85, 1); g.add(st);
    } else if (kind === 'mat') { // 들고 가는 자리 (5:8)
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.62, 12), M(0xb09060, 1)); r.rotation.z = Math.PI / 2; r.position.y = 0.04; g.add(r);
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.012, 5, 14), M(0x7a5a3a)); b.rotation.y = Math.PI / 2; b.position.set(s * 0.18, 0.04, 0); g.add(b); }
    } else if (kind === 'nard') { // 나드 향유 (12:3)
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), M(0xf2ece0, 0.35)); b.scale.y = 1.25; g.add(b);
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.034, 0.1, 10), M(0xf2ece0, 0.35)); n.position.y = 0.12; g.add(n);
    } else if (kind === 'basin') { // 수건과 대야 (13:4-5)
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.13, 0.09, 16, 1, true), M(0xb9805a)); b.material.side = THREE.DoubleSide; g.add(b);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), M(0x8fc4d8, 0.1)); w.rotation.x = -Math.PI / 2; w.position.y = 0.02; g.add(w);
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.02), M(0xf4ecd8, 1)); t.position.set(0.2, -0.08, 0); g.add(t);
      g.position.set(0, -0.45, 0.16);
      return g;
    } else if (kind === 'oil') { // 등잔 기름병 (부탁: 켜진 등잔에 기름 채우기)
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), M(0xa8744a)); b.scale.y = 1.15; g.add(b);
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.09, 10), M(0xa8744a)); n.position.y = 0.11; g.add(n);
    } else if (kind === 'spice') { // 몰약과 침향 섞은 것 (19:39)
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), M(0x8a6a48)); g.add(b);
      for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 10), M(0xe8dcc0, 0.5)); j.position.set(s * 0.07, 0.12, 0); g.add(j); }
    } else {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.13, 12), M(0xb9805a)); g.add(c);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), new THREE.MeshStandardMaterial({ color: 0x8fc4d8, roughness: 0.1 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.06; g.add(w);
      g.userData.wine = w;
    }
    g.position.set(0, -0.41, 0.06);
    return g;
  };
  const hands = initCarry({ me, make: carryMesh }); // 손에 쥐기·앞치마 (js/village/things.js)
  const carry = (kind) => hands.hold(kind);
  const apronMesh = () => {
    const apron = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.02), M(0xf4ecd8, 1)); a.position.set(0, 0.32, 0.215); apron.add(a);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 20), M(0xd8c8a8)); tie.rotation.x = Math.PI / 2; tie.position.y = 0.47; apron.add(tie);
    return apron;
  };
  const setApron = (on) => hands.wear(on ? apronMesh() : null);

  // ---------- 가나: 돌항아리 물 ----------
  const jars = parts.jars;
  const jarsReset = () => { for (const j of jars) { j.level = 0; j.target = 0; j.water.visible = false; j.wm.color.set(0x6fb2c8); } for (const c of parts.cups) c.visible = false; };
  const jarsFull = () => jars.filter((j) => j.target >= 1).length;
  const nextJarIdx = () => { let b = -1, bd = Infinity; jars.forEach((j, i) => { if (j.target >= 1) return; const d = dist(JARS[i]); if (d < bd) { bd = d; b = i; } }); return b; };
  const nextJar = () => { const i = nextJarIdx(); return i < 0 ? JARS[0] : JARS[i]; };
  const nearJar = () => { let b = JARS[0], bd = Infinity; for (const p of JARS) { const d = dist(p); if (d < bd) { bd = d; b = p; } } return b; };
  function fillJar() {
    const i = nextJarIdx(); if (i < 0) return;
    const j = jars[i]; j.target = 1; j.water.visible = true;
    sfx('cup', 0.22, 0.7); burst(JARS[i].x, G(JARS[i]) + 1.1, JARS[i].z);
  }
  function wine() {
    for (const j of jars) j.wine = 0.001;
    for (const c of parts.cups) c.visible = true;
    sfx('orb', 0.3, 1.0); burst(me.x, me.y + 1.6, me.z);
  }
  function cheer() {
    for (const k of ['guest0', 'guest1', 'master', 'servant']) { const n = N[k]; n.action = 'wave'; setTimeout(() => { if (n.action === 'wave') n.action = null; }, 3200); }
  }
  // 내려놓기: 손에서 어두운 것이 떨어져 사라짐
  function dropFx() {
    const s = fxSprite('circle_05', 0x403050, 0.8); s.position.set(me.x, me.y + 1.0, me.z); scene.add(s);
    const t0 = performance.now();
    const tick = () => { const k = (performance.now() - t0) / 1400; if (k >= 1) { scene.remove(s); return; } s.position.y = me.y + 1.0 - k * 1.1; s.material.opacity = 1 - k; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // ---------- 니고데모: 바람에 날리는 천, 지붕 위 등잔 ----------
  let windK = -1;
  const windDir = (k) => { const s = SP.wind[k], c = { x: (SP.wind[0].x + SP.wind[1].x) / 2 + 0.8, z: (SP.wind[0].z + SP.wind[1].z) / 2 }; return Math.atan2(s.x - c.x, s.z - c.z); };
  const onRoof = () => { const H = HOUSE10, lu = me.x - JX, lv = me.z - JZ; return lu > H.u0 && lu < H.u1 && lv > H.v0 && lv < H.v1 && me.y > ROOF_Y - 0.6; };

  // ---------- 실로암: 흐린 화면, 물소리 ----------
  let blind = 0; // 0 맑음 → 1 흐림 (천천히)
  let blindTarget = 0;
  function blur(on) {
    blindTarget = on ? 1 : 0;
    blurBtn.hidden = !on; blurLabel();
    document.body.classList.toggle('jn-noblur', noBlur());
  }
  let actx = null, noise = null, waterAt = null;
  function water(p) {
    waterAt = p;
    if (!p) { if (noise) noise.g.gain.value = 0; return; }
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      if (!noise) {
        const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
        let lastV = 0; for (let i = 0; i < len; i++) { lastV = (lastV + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = lastV * 3.5; } // 갈색 잡음 (졸졸 물소리)
        const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
        const g = actx.createGain(); g.gain.value = 0;
        src.connect(f).connect(g).connect(actx.destination); src.start();
        noise = { src, g, f };
      }
    } catch (e) { noise = null; }
  }
  // 기도하면 바닥에 희미한 빛 길 (20초)
  const dots = [];
  function lightPath(to) {
    for (const d of dots.splice(0)) scene.remove(d);
    const path = findPath(me, nearestFree(to) || to);
    if (!path.length) return;
    let prev = { x: me.x, z: me.z }, acc = 0;
    for (const p of path) {
      const L = Math.hypot(p.x - prev.x, p.z - prev.z);
      for (let s = 0; s < L; s += 0.5) { acc += 0.5; if (acc < 1.6) continue; acc = 0; const k = s / L, x = prev.x + (p.x - prev.x) * k, z = prev.z + (p.z - prev.z) * k; const d = fxSprite('light_01', 0xfff0b0, 0.5); d.position.set(x, floorY(x, z) + 0.15, z); scene.add(d); dots.push(d); }
      prev = p;
    }
    sfx('orb', 0.18, 1.4);
    setTimeout(() => { for (const d of dots.splice(0)) scene.remove(d); }, 20000);
  }
  function splash() { sfx('cup', 0.25, 0.6); burst(SP.wash.x, G(SP.wash) + 0.4, SP.wash.z); setTimeout(() => sfx('orb', 0.25, 1.3), 500); }

  // ---------- 하늘·안개·빛 (그 시각, js/village/sky.js) ----------
  const env = REGION.env;
  const sky = initSky({
    scene, lights, me, env, table: SKY, inTown,
    overlay: { ...RISEN, on: () => !!J().ev.mary?.done }, // 부활 뒤 새벽빛 (마리아야를 마친 뒤)
    hold: () => me.action === 'stars', // 누워서 별 보기(leisure.js)가 빛을 쥐고 있는 동안
    onStars: (k) => { parts.roofLight.intensity = k * 2.4; }, // 니고데모 지붕 등잔
  });

  // ---------- 사건 단계 도구 (공용 도구는 js/village/flow.js townTools) ----------
  const T = townTools({ me, toast, standUp, shot, people, beacon, run: runNow });
  const X = {
    me, P: SP, parts, center: PLAZA_LIGHT, toast, sfx, burst,
    near: T.near, sitting: T.sitting, praying: T.praying, verse: T.verse, sky: T.sky,
    lake: LAKE_AT,
    carry, carrying: () => hands.kind() === 'jar',
    say: T.say,
    walkNpc: T.walkNpc, follow: T.follow, unfollow: T.unfollow, dn: T.dn, npcAt: T.npcAt,
    trial: null,
    apron: setApron, jarsReset, jarsFull, nextJar, nearJar, fillJar, wine, cheer, dropFx,
    wind: (k) => { windK = k; },
    rings: T.rings,
    walkers: (on) => { walkers.forEach((n, i) => { n.hide = !on; n.walkI = i; n.path = []; }); },
    crowd: (on) => { crowd.forEach((n) => { n.hide = !on; n.face = Math.atan2(me.x - n.x, me.z - n.z); }); },
    onRoof,
    gaze: (p) => { if (me.seat) standUp(me); me.face = Math.atan2(p.x - me.x, p.z - me.z); me.action = 'gaze'; parts.poleGlow.material.opacity = 0.9; shot?.(p, { dist: 9, el: 0.25, side: 0.4, dur: 6, mid: 0.35, y: 3 }); setTimeout(() => { if (me.action === 'gaze') me.action = null; }, 6000); },
    blur, water, lightPath, splash,
    warmAt: (p) => { const o = parts.warm.children[0].position; warm2.position.set(p.x + 1.4 - o.x, G(p) + 1.5 - o.y, p.z + 0.6 - o.z); warm2.visible = true; },
  };

  Object.assign(X, g2.X, g3.X, g4.X);
  X.ui = ui; // 사건 자리의 짧은 대화 (아이·종·동네 사람)
  // 멀리 바라보기 (희어진 밭 등): gaze와 같되 놋뱀 빛은 건드리지 않음
  X.look = T.look;
  const trials = initTrials({
    ui, me, toast, sfx, burst, whisper, showVerse, lightPath, push: g2.X.push, fog: g2.X.fog,
    marks: g3.X.voiceMarks, go: (p) => walkTo(me, nearestFree(p) || p), // 목소리 가리기 (선한 목자)
    praying: () => me.action === 'pray',
    sky: { darkness: sky.darkness },
  });
  X.trial = trials;
  const modes = initModes({ ui, me, toast, sfx, burst, showVerse, walkTo, nearestFree });

  // ---------- 증인의 작은 부탁 (채우기 E1): 엔진은 js/village/errands.js, 자료는 js/john/errands.js ----------
  // 부탁 물건 (널어 둔 그물·수레 쐐기): 마을 모형(root) 안에 둠 (놓기는 js/village/things.js)
  const propMesh = (kind) => {
    const g = new THREE.Group();
    if (kind === 'net') {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1, 4, 3), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1, wireframe: true }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.05; g.add(m);
      for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), M(0x7a5a3a)); st.position.set(s * 0.85, 0.3, 0); g.add(st); }
    } else { // wedge: 수레 쐐기
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 3), M(0x8a6748, 1, { flatShading: true })); m.rotation.z = Math.PI / 2; m.position.y = 0.1; g.add(m);
    }
    return g;
  };
  Object.assign(X, {
    ...initProps({ root: built.root, G, make: propMesh }), // prop·propAt·props
    resetNpc: T.resetNpc,
    litLamps: () => LAMP_IDS.map((id, i) => (J().lamps.includes(id) ? LAMPS[i] : null)).filter(Boolean),
    dayPick,
  });
  const er = initErrands({
    ER, store: () => J().er, X, ui, me, profile, save, onChange, toast, sfx, burst, standUp,
    opened: (e) => !!J().ev[e.after]?.done && (!e.need || e.need(J())),
    giverAt: (k) => N[k],
    canShow: () => !busy() && !ui.isOpen() && inTown(),
    eventRunning: () => !!runNow(),
  });

  // ---------- 사건 진행·마침·졸업·말 걸기 (js/village/flow.js). 여기에는 요한 마을의 글과 자리만 ----------
  const signsN = () => ORDER.filter((id) => EV[id].sign && flow.isDone(EV[id])).length;
  flow = initFlow({
    me, profile, save, onChange, toast, sfx, burst, busy, standUp, inTown,
    ui, chip, whisper, sky, beacon, people, X, EV, ORDER, openOrder: JOHN_EVENTS, store: J, trials, modes, er, ER, SP, ZONES,
    name: '요한복음 마을', book: '요한복음', talkKey: 'jn:', endKey: END_SEEN, acts: JN_ACTS,
    greet: GREET, errandTitle: '증인의 작은 부탁', quietAgain: '다시 걸어 주었군요. 그 밤과 그 아침을 다시 기억했어요',
    seatOf: (e) => (e.med.at === 'feast' ? SP.feast[1] : SP[e.med.at]),
    resetKeys: { come: ['andrew', 'nathan'], nico: ['nico'], cana: [], siloam: [] },
    // 사도 요한: 와 보라의 증인이자 마을 안내자. 마을 기록장(요한의 두루마리)과 다음 이야기
    guide: {
      key: 'john', ev: 'come', who: '사도 요한', zone: 'light', bookSub: '마을 기록장 · 요한의 두루마리',
      waitToast: '사도 요한이 빛의 광장에서 기다려요. 이야기는 이어져요 (금빛 기둥)',
      end: () => ({
        sub: J().mark === '졸업' ? '요한복음 마을 졸업' : '이야기는 이어져요', quote: 'jn-21-25',
        text: `${ORDER.length} 이야기를 다 따라왔군요! 빛이 어둠에 비치고, 물이 포도주가 되고, 우물가의 여인이 동네로 달려갔어요. 떡 다섯 개가 무리를 먹이고, 소경이 눈을 뜨고, 나사로가 무덤에서 나왔어요. 다락방에서 그분이 발을 씻기셨고, 숯불 곁의 밤과 "다 이루었다" 하신 십자가를 지나, 동산에서 "마리아야" 이름을 부르셨어요. 닫힌 문 안에 평강을 주셨고, 바닷가 숯불 곁에서 "너는 나를 따르라" 하셨어요. 표적 ${signsN()}개를 보았고, "나는…" 등불 ${J().lamps.length}개가 켜졌어요. 이 외에도 많아서 낱낱이 기록하면 이 세상이라도 그 책을 두기에 부족하대요. 이제 당신의 이야기로 이어져요.`,
      }),
      // 요한복음 마을 졸업 (21장 카드): 내 닉네임과 "너는 나를 따르라". 카드를 넘기면 21:22·21:25가 오늘 만난 말씀에 남음
      graduation: () => {
        const c = callName(profile.name), j = J();
        return {
          who: '사도 요한', sub: '요한복음 마을 졸업', quote: 'jn-21-22',
          text: `${c ? c.voc : '친구여'}, 요한복음 마을의 이야기를 처음부터 끝까지 다 따라왔어요! 그분이 베드로에게 마지막으로 하신 말씀은 "너는 나를 따르라"였어요. 이제 그 말씀을 들고 초보자 마을, 당신의 자리로 돌아가요.`,
          note: `졸업 표지를 받았어요 · 표적 ${signsN()}개 · "나는…" 등불 ${j.lamps.length}개 · 이야기 ${ORDER.length}개`,
          buttons: [{ t: '"나를 따르라"', cls: 'next', fn: () => X.verse(['jn-21-22', 'jn-21-25'], '요한복음 마을 졸업') }],
        };
      },
    },
    hooks: {
      // 사건을 그만두거나 마칠 때: 시험 도구·든 것·사람 정리 (시험 끝내기·덧고리·따라오기는 flow가)
      cleanup: () => { X.wind(-1); X.walkers(false); X.crowd(false); carry(null); parts.lampStand.visible = true; g2.reset(); },
      reset: () => {
        N.nathan.action = 'read';
        g4.reset(); // 3차 사람 자리·물건 (베드로를 먼저 세운 뒤 제자리로: placeShared)
        flow.placeShared();
        g3.reset(); // 2차 나 사람 자리·물건 (마친 사건의 흔적은 기록대로)
      },
      quit: (e, done) => { if (e.id === 'cana' && !done) jarsReset(); },
      // 처음 마침: 표적 수, "나는…" 등잔 (일곱 등불이 다 켜지면 마침 카드를 닫을 때 1:5·8:12)
      first: (e, j) => {
        j.signs = Math.max(j.signs | 0, signsN());
        let all7 = false;
        const lit = [].concat(e.lamp || []).filter((l) => !j.lamps.includes(l)); // 선한 목자는 문과 목자 둘
        if (lit.length) { j.lamps.push(...lit); setTimeout(() => toast(`빛의 광장 등잔 ${lit.length > 1 ? `${lit.length}개` : '하나'}에 불이 켜졌어요 (${e.lampName || lit.join('·')})`, 5), 5200); all7 = LAMP_IDS.every((l) => j.lamps.includes(l)); }
        return all7 ? () => X.verse(['jn-1-5', 'jn-8-12'], '일곱 등불이 다 켜졌어요') : null; // 광장 가운데 빛이 커짐 (passion.js)
      },
      // 마을을 떠날 때 (수레): 손에 든 것·앞치마를 감춤. 돌아오면 다시 보임
      away: (gone) => { hands.show(!gone); },
      // 매 프레임 (사람 움직이기 앞): 실로암 흐림, 들고 다니는 등불 빛, 물소리
      pre: (dt, town) => {
        // 흐림 (실로암): 천천히 흐려지고 맑아짐
        blind += ((town ? blindTarget : 0) - blind) * Math.min(1, dt * (blindTarget ? 0.8 : 0.5));
        const b = blind < 0.01 ? 0 : blind;
        document.body.style.setProperty('--jblind', b.toFixed(3));
        document.body.classList.toggle('jn-blind', b > 0);
        blurBtn.hidden = !(town && (blindTarget || g2.fx())); // 실로암 흐림, 밤바다 물결·안개
        if (!blurBtn.hidden && !blurBtn.textContent) blurLabel();
        const held = hands.held();
        lampLight.intensity = town && held && hands.kind() === 'lamp' ? 5 : 0;
        if (lampLight.intensity) { me.av.updateWorldMatrix(true, true); held.getWorldPosition(handPos); lampLight.position.set(handPos.x, handPos.y + 0.3, handPos.z); }
        if (noise) { const d = waterAt && town ? dist(waterAt) : 999; noise.g.gain.value = waterAt && town ? Math.max(0.02, Math.min(0.5, 6 / (d + 4))) : 0; }
      },
      // 매 프레임 (사람 움직이기 뒤): 등불 든 사람들, 사건 도구 모듈, 지붕의 천, 돌항아리
      frame: (dt, town, now) => {
        // 밤길을 오가는 등불 든 사람들
        walkers.forEach((n, i) => {
          if (n.hide || n.state === 'walk') return;
          const to = SP.walkers[(n.walkI = (n.walkI | 0) + 1) % 2]; n.path = [{ x: to.x + i * 0.8, z: to.z + i * 0.6 }]; n.state = 'walk';
        });
        g2.step(town); g3.step(town); g4.step(town);
        if (!town) return;
        hands.reattach();
        // 니고데모 지붕의 천: 바람이 불면 그쪽으로 날림
        {
          const g = parts.cloth, t = now / 1000;
          const want = windK >= 0 ? windDir(windK) : 0, lift = windK >= 0 ? 1.1 : 0.15;
          g.rotation.y += (want - g.rotation.y) * Math.min(1, dt * 2);
          g.rotation.x = -(lift * (0.55 + Math.sin(t * 5.3) * 0.18));
          const pos = parts.clothMesh.geometry.attributes.position, b0 = parts.clothBase;
          for (let i = 0; i < pos.count; i++) { const x = b0[i * 3], y = b0[i * 3 + 1]; pos.setZ(i, Math.sin(t * 6 + x * 3 + y * 2) * 0.06 * (0.5 - y) * (windK >= 0 ? 2 : 0.6)); }
          pos.needsUpdate = true;
        }
        // 돌항아리 물이 차오름, 포도주로
        for (const j of jars) {
          if (j.target > j.level) { j.level = Math.min(j.target, j.level + dt * 1.4); j.water.position.y = 0.04 + j.level * 0.86; }
          if (j.wine && j.wine < 1) { j.wine = Math.min(1, j.wine + dt * 0.6); j.wm.color.setRGB(0.44 + (0.48 - 0.44) * j.wine, 0.7 - 0.6 * j.wine, 0.78 - 0.6 * j.wine); }
        }
      },
    },
  });
  return flow;
}
