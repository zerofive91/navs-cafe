// 요한복음 마을 사건 진행 (2026-11 1차 MVP, 기획서 3·4·6장)
//   증인에게 말 걸기 → 듣기 → 단계(적용, quests.js 형식) → 말씀 카드(읽기) → 처음 마치면 보상과 profile.john.ev 기록
//   다 마친 사건은 언제든 "깊이 보기"(공부·암송·묵상)와 다시 하기. 큰 줄기는 장 순서로 열림(반선형), 다음 사건 자리에 금빛 기둥
//   그 시각의 빛(열 시쯤·밤·잔치 날)은 그 구역 안에서만 하늘·안개·빛을 바꾸고 나오면 돌아옴
//   region.js가 마을을 처음 지을 때 불러옴 (dynamic import). main.js에는 region을 거쳐 이어짐(available·actions·step·active)
import * as THREE from 'three';
import { offerTalk } from '../talkgate.js';
import { VERSES, showVerse } from '../verses.js';
import { nameTag } from '../tutorial.js';
import { addSteps, addStat, earn, giveItem, STATS, ITEMS, JOHN_EVENTS } from '../profile.js';
import { findPath, nearestFree } from '../nav.js';
import { floorY } from '../layout.js';
import { JX, JZ, ZONES, SP, PLAZA_LIGHT, JARS, ROOF_Y, HOUSE10, REGION, LAKE_AT, JN_ACTS, LAMP_IDS } from './layout.js';
import { initGalilee } from './galilee.js'; // 2차 가 (갈릴리·사마리아) 사건 도구
import { initJerusalem } from './jerusalem.js'; // 2차 나 (예루살렘·베다니) 사건 도구
import { initPassion, callName } from './passion.js'; // 3차 (다락방·수난·부활) 사건 도구, 이름 부르기
// events·trials·modes는 region.js가 불러와 넘김 (불러오기에 실패해 다시 시도할 때 주소 끝을 바꿀 수 있게)

const MODE_NAME = { l: '듣기', r: '읽기', a: '적용', s: '공부', m: '암송', d: '묵상' };
const NOBLUR = 'navs-cafe-noblur';
const END_SEEN = 'navs-cafe-john-end'; // 지금 있는 사건을 다 마친 뒤 사도 요한의 "이야기는 이어져요"를 들었는지 (이 기기에만, 금빛 기둥 표시용). 값은 그때의 사건 수 → 사건이 늘면 다시 안내
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 이번만 */ } };

// ---------- 그 시각의 빛 (구역 안에서만) ----------
// day는 마을 기본(REGION.env). bg: 하늘 바탕색, hemi·sun: 빛 세기 배율
const SKY = {
  day: null,
  ten: { bg: 0xeec594, fogC: 0xe6c08e, fog: [50, 190], hemiSky: 0xffe0b4, hemiGround: 0xc49c6a, hemi: 0.92, sun: 0.85 },     // 1:39 "열 시쯤" (해가 기운 따뜻한 빛)
  feast: { bg: 0xd9ecf4, fogC: 0xf1e8cf, fog: [60, 230], hemiSky: 0xfff6e4, hemiGround: 0xe2cfa4, hemi: 1.08, sun: 1.05 },  // 2:1 사흘 되던 날 잔치
  night: { bg: 0x0d1430, fogC: 0x111a36, fog: [24, 120], hemiSky: 0x6878a8, hemiGround: 0x2a2834, hemi: 0.4, sun: 0.1, stars: 1 }, // 3:2 밤에
  dark: { bg: 0x161a2a, fogC: 0x141828, fog: [3, 34], hemiSky: 0x40486a, hemiGround: 0x2a2620, hemi: 0.34, sun: 0.12 },  // 1:5 어두움 (빛 비추기 시험)
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

  // ---------- 사람들 ----------
  const M = (c, r = 0.85, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const N = {};
  const person = (key, name, look, p, faceTo) => {
    const q = nearestFree(p) || p;
    const n = makeChar({ hair: 0x3b2a22, style: 0, pants: 0x5a5048, ...look, bag: look.hoodie }, q.x, q.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { x: q.x, z: q.z }; n.home0 = { ...n.home };
    n.face0 = faceTo ? Math.atan2(faceTo.x - q.x, faceTo.z - q.z) : 0; n.face = n.face0;
    n.key = key; n.name = name;
    npcs.push(n); N[key] = n;
    return n;
  };
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
  const g3 = initJerusalem({ root: built.root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId: () => (run ? run.ev.id : '') });
  // 3차: 도마·다른 제자·막달라 마리아·여종·빌라도·니고데모·횃불 무리와 대야·문·검·무덤 돌·그물·어린 양 (js/john/passion.js)
  const g4 = initPassion({ root: built.root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId: () => (run ? run.ev.id : '') });

  // ---------- 머리 위 표시: 할 사건 두루마리, 마침 별, 여섯 모드를 다 채우면 금빛 별 ----------
  const markTex = (kind) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    if (kind === 'scroll') {
      g.fillStyle = '#f6e7c0'; g.strokeStyle = '#8f6744'; g.lineWidth = 3;
      g.beginPath(); g.roundRect(16, 14, 32, 36, 4); g.fill(); g.stroke();
      for (const y of [14, 50]) { g.beginPath(); g.ellipse(32, y, 20, 5, 0, 0, Math.PI * 2); g.fillStyle = '#e8c878'; g.fill(); g.stroke(); }
    } else {
      g.fillStyle = kind === 'gold' ? '#ffcf3a' : '#fff4d0'; g.strokeStyle = kind === 'gold' ? '#b07a10' : '#b0a070'; g.lineWidth = 2.5; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(32 + Math.cos(a) * r, 33 + Math.sin(a) * r); }
      g.closePath(); g.fill(); g.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const TEX = { scroll: markTex('scroll'), star: markTex('star'), gold: markTex('gold') };
  for (const id of ORDER) {
    const n = N[EV[id].npc];
    if (n.mark) continue; // 두 사건의 증인 (베드로: 밤바다·생명의 떡)
    n.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.scroll, transparent: true, depthWrite: false }));
    n.mark.scale.setScalar(0.5); n.mark.position.y = 2.75; n.av.add(n.mark);
  }

  // ---------- 금빛 기둥 (다음 사건·지금 단계 자리), 빛나는 자리 고리 ----------
  const beam = new THREE.Group();
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.y = 15; beam.add(m); const s = fxSprite('star_06', 0xfff0c0, 2.4); s.position.y = 3; beam.add(s); beam.userData.star = s; }
  beam.visible = false; scene.add(beam);
  const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xffe7a0, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const makeRing = () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.85, 36), ringMat()); m.rotation.x = -Math.PI / 2;
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    glow.position.y = 1.3; m.add(glow); glow.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); return m;
  };
  const ring = makeRing();
  const extraRings = [makeRing(), makeRing(), makeRing()];
  const putRing = (m, p) => { m.position.set(p.x, G(p) + 0.06, p.z); m.visible = true; };
  // 실로암 성 밖의 따뜻한 빛 (요 9:35, 그분이 그 사람을 만나심)
  const warm2 = parts.warm.clone(); warm2.visible = false; scene.add(warm2);

  // ---------- 말풍선 (사건·시험·모드가 함께 씀) ----------
  const box = document.createElement('div');
  box.className = 'npcb jn'; box.id = 'jtalk'; box.hidden = true;
  document.body.appendChild(box);
  let spec = null;
  const ui = {
    open(s) {
      spec = s;
      box.className = 'npcb jn' + (s.dark ? ' trial' : '');
      const q = s.quote && VERSES[s.quote];
      box.innerHTML = `<div class="who"><b>${esc(s.who)}</b><span class="n">${esc(s.sub || '')}</span></div>
        <p class="say">${esc(s.text)}${q ? `<small>${esc(q[0])} (${esc(q[1])})</small>` : ''}</p>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        ${s.opts ? `<div class="opts">${s.opts.map((o, i) => `<button class="opt" data-o="${i}"><kbd>${i + 1}</kbd><span>${esc(o.t)}</span></button>`).join('')}</div><p class="why" hidden></p>` : ''}
        <div class="x"></div>
        ${s.buttons ? `<div class="row">${s.buttons.map((b, i) => `<button class="${b.cls || ''}" data-b="${i}">${esc(b.t)}</button>`).join('')}</div>` : ''}`;
      if (s.extra) box.querySelector('.x').replaceWith(s.extra); else box.querySelector('.x').remove();
      box.hidden = false;
      document.body.classList.add('talking');
      document.body.classList.toggle('trialing', !!s.dark);
    },
    close() {
      if (!spec) return; const s = spec; spec = null; box.hidden = true; document.body.classList.remove('talking', 'trialing');
      if (s.dark && !s.done && run) run.r.closed = true; // 답하기 전에 닫힌 시험: 증인에게 다시 말을 걸면 다시 열림
      s.onClose?.();
    },
    isOpen: () => !!spec,
  };
  const pick = (i) => {
    const s = spec; if (!s || !s.opts || s.done) return;
    const o = s.opts[i]; if (!o) return;
    const b = box.querySelector(`[data-o="${i}"]`), why = box.querySelector('.why');
    if (o.ok) { s.done = true; b.classList.add('hint'); box.classList.add('ok'); why.hidden = true; }
    else { b.classList.add('no'); why.hidden = !o.why; why.textContent = o.why; if (o.why) requestAnimationFrame(() => why.scrollIntoView({ block: 'nearest' })); }
    s.onPick?.(o);
  };
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = e.target.closest('[data-o]'); if (o) return pick(+o.dataset.o);
    const b = e.target.closest('[data-b]'); if (!b || !spec) return;
    const B = spec.buttons[+b.dataset.b];
    if (!B.keep) ui.close();
    B.fn?.();
  });
  window.addEventListener('keydown', (e) => { // 보기는 숫자 키로도, Esc로 닫기
    if (spec && e.key === 'Escape') { e.stopPropagation(); ui.close(); return; }
    if (!spec || !spec.opts || e.target.closest?.('textarea,input')) return;
    const n = +e.key; if (n >= 1 && n <= spec.opts.length) { e.stopPropagation(); pick(n - 1); }
  }, true);

  // 속삭임 한 줄 (걸으며 하는 시험)
  const wh = document.createElement('div'); wh.id = 'jwhisper'; wh.hidden = true; document.body.appendChild(wh);
  let whText = '';
  const whisper = (t) => { if (t === whText) return; whText = t; wh.hidden = !t; if (t) { wh.textContent = t; wh.classList.remove('on'); void wh.offsetWidth; wh.classList.add('on'); } };

  // 진행 표시 (왼쪽 위, 누르면 부탁 창)
  const chip = document.createElement('div'); chip.id = 'johnChip'; chip.hidden = true; document.body.appendChild(chip);
  chip.setAttribute('role', 'button'); chip.tabIndex = 0; chip.title = '눌러서 내용 보기';
  chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); openLog?.('j'); });
  // 흐림 없이 하기 (실로암)
  const blurBtn = document.createElement('button'); blurBtn.id = 'jnBlurBtn'; blurBtn.hidden = true; document.body.appendChild(blurBtn);
  const blurLabel = () => { blurBtn.textContent = noBlur() ? '흐린 화면으로 하기' : '흐림 없이 하기'; };
  blurBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  blurBtn.addEventListener('click', (e) => { e.stopPropagation(); lsSet(NOBLUR, noBlur() ? '0' : '1'); document.body.classList.toggle('jn-noblur', noBlur()); blurLabel(); });

  // ---------- 들고 다니는 것 (등불·물동이·잔), 하인 앞치마 ----------
  let carried = null, carryKind = null;
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
  const attach = (o) => { const hand = me.av.userData.arms?.[1]; if (hand && o.parent !== hand) hand.add(o); };
  function carry(kind) {
    if (carried) { carried.parent?.remove(carried); carried = null; }
    carryKind = kind || null;
    if (kind) { carried = carryMesh(kind); attach(carried); }
  }
  let apron = null;
  function setApron(on) {
    if (apron) { apron.parent?.remove(apron); apron = null; }
    if (!on) return;
    apron = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.02), M(0xf4ecd8, 1)); a.position.set(0, 0.32, 0.215); apron.add(a);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 6, 20), M(0xd8c8a8)); tie.rotation.x = Math.PI / 2; tie.position.y = 0.47; apron.add(tie);
    me.av.userData.body.add(apron);
  }
  // 캐릭터를 새로 만들면(옷 바꾸기) 다시 쥐어 줌
  const reattach = () => {
    if (carried && !isUnder(carried, me.av)) attach(carried);
    if (apron && !isUnder(apron, me.av)) me.av.userData.body.add(apron);
  };
  const isUnder = (o, root) => { for (let p = o.parent; p; p = p.parent) if (p === root) return true; return false; };

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

  // ---------- 하늘·안개·빛 (그 시각) ----------
  const env = REGION.env;
  const base = { bg: scene.background?.isColor ? scene.background.clone() : new THREE.Color(0xcfe3ee), hemi: lights.hemi.intensity, sun: lights.sun.intensity };
  const tgt = (p) => {
    if (!p) return { bg: base.bg.getHex(), fogC: env.sky, fog: env.fog, hemiSky: env.hemiSky, hemiGround: env.hemiGround, hemi: 1, sun: 1, stars: 0 };
    return { stars: 0, ...p };
  };
  const cur = { bg: new THREE.Color(), fogC: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), near: env.fog[0], far: env.fog[1], hemi: 1, sun: 1, stars: 0, dark: 0, applied: false };
  const tmp = new THREE.Color();
  let darkK = 0; // 빛 비추기 시험의 어둠 정도
  const stars = (() => {
    const pts = [];
    for (let k = 0; k < 700; k++) { const a = Math.random() * Math.PI * 2, e = Math.asin(0.1 + Math.random() * 0.9); pts.push(Math.cos(e) * Math.cos(a) * 240, Math.sin(e) * 240, Math.cos(e) * Math.sin(a) * 240); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const m = new THREE.PointsMaterial({ color: 0xfff8e8, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const s = new THREE.Points(g, m); s.visible = false; s.renderOrder = -1; scene.add(s); return s;
  })();
  function skyWant() {
    if (!inTown()) return null;
    const inZone = (zid, pad = 26) => { const z = typeof zid === 'string' ? ZONES[zid] : zid; return z && Math.hypot(me.x - z.x, me.z - z.z) < z.r + pad; };
    if (run && run.sky && inZone(run.sky.zone, run.sky.pad ?? (run.sky.p === 'dark' ? 40 : 26))) return run.sky.p;
    for (const id of ORDER) {
      const e = EV[id]; if (!e.time) continue;
      if ((run && run.ev === e) || (!run && isOpen(e) && !isDone(e))) if (inZone(e.zone)) return e.time;
    }
    return null;
  }
  function stepSky(dt) {
    if (!inTown()) {
      if (cur.applied) { scene.background = base.bg.clone(); lights.hemi.intensity = base.hemi; lights.sun.intensity = base.sun; stars.visible = false; cur.applied = false; }
      return;
    }
    if (me.action === 'stars') return; // 누워서 별 보기(leisure.js)가 빛을 쥐고 있는 동안
    const want = skyWant(), T = tgt(SKY[want] || null);
    if (!cur.applied) {
      if (!want && darkK < 0.01) { risen(dt); return; } // 기본 낮: 마을 기본 그대로 (region.js setEnv), 부활 뒤에는 새벽빛만 더함
      cur.bg.copy(scene.background?.isColor ? scene.background : base.bg); cur.fogC.copy(scene.fog.color); cur.hemiSky.copy(lights.hemi.color); cur.hemiGround.copy(lights.hemi.groundColor);
      cur.near = scene.fog.near; cur.far = scene.fog.far; cur.hemi = lights.hemi.intensity / base.hemi; cur.sun = lights.sun.intensity / base.sun; cur.applied = true; unRisen();
    }
    const k = Math.min(1, dt * (want === 'dark' ? 2.2 : 1.1));
    cur.bg.lerp(tmp.set(T.bg), k); cur.fogC.lerp(tmp.set(T.fogC), k); cur.hemiSky.lerp(tmp.set(T.hemiSky), k); cur.hemiGround.lerp(tmp.set(T.hemiGround), k);
    cur.near += (T.fog[0] - cur.near) * k; cur.far += (T.fog[1] - cur.far) * k; cur.hemi += (T.hemi - cur.hemi) * k; cur.sun += (T.sun - cur.sun) * k; cur.stars += (T.stars - cur.stars) * k;
    // 빛 비추기: 멈출수록 등불 둘레만 남음
    const far = want === 'dark' ? Math.max(7, cur.far * (1 - 0.72 * darkK)) : cur.far;
    if (!scene.background?.isColor) scene.background = new THREE.Color();
    scene.background.copy(cur.bg); scene.fog.color.copy(cur.fogC); scene.fog.near = Math.min(cur.near, far - 2); scene.fog.far = far;
    lights.hemi.color.copy(cur.hemiSky); lights.hemi.groundColor.copy(cur.hemiGround);
    lights.hemi.intensity = base.hemi * cur.hemi; lights.sun.intensity = base.sun * cur.sun;
    stars.visible = cur.stars > 0.02; stars.material.opacity = cur.stars; if (stars.visible) stars.position.set(me.x, 0, me.z);
    parts.roofLight.intensity = cur.stars * 2.4;
    // 다 돌아왔으면 손을 뗌 (마을 기본값은 region.js가 맡음)
    if (!want && darkK < 0.01 && Math.abs(cur.hemi - 1) < 0.01 && Math.abs(cur.far - env.fog[1]) < 1 && cur.stars < 0.02) {
      scene.background.copy(base.bg); scene.fog.color.set(env.sky); scene.fog.near = env.fog[0]; scene.fog.far = env.fog[1];
      lights.hemi.color.set(env.hemiSky); lights.hemi.groundColor.set(env.hemiGround); lights.hemi.intensity = base.hemi; lights.sun.intensity = base.sun;
      stars.visible = false; parts.roofLight.intensity = 0; cur.applied = false;
    }
  }

  // 부활 뒤 새벽빛: 마을 기본 색(env)에서 RISEN 쪽으로 k만큼. 하늘 시각(SKY)이 걸리면 그쪽이 맡고, 풀리면 다시 천천히 스밈
  let risenK = 0;
  const envC = { fog: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
  function risen(dt) {
    const want = isDone(EV.mary) ? RISEN.k : 0;
    if (want === 0 && risenK === 0) return;
    risenK += (want - risenK) * Math.min(1, dt * 0.8);
    if (Math.abs(want - risenK) < 0.002) risenK = want;
    scene.fog.color.copy(envC.fog.set(env.sky)).lerp(tmp.set(RISEN.fogC), risenK);
    lights.hemi.color.copy(envC.sky.set(env.hemiSky)).lerp(tmp.set(RISEN.hemiSky), risenK);
    lights.hemi.groundColor.copy(envC.ground.set(env.hemiGround)).lerp(tmp.set(RISEN.hemiGround), risenK);
  }
  // 시각이 바뀌면(SKY) 새벽빛은 그 색에서 다시 시작
  const unRisen = () => { risenK = 0; };

  // ---------- 기록 ----------
  const rec = (id) => J().ev[id];
  const isDone = (e) => !!rec(e.id)?.done;
  const isOpen = (e) => isDone(e) || !e.after || isDone(EV[e.after]); // 이미 마친 사건은 사이에 새 사건이 끼어도 열린 채로
  const modesOf = (id) => rec(id)?.m || '';
  const endSeen = () => lsGet(END_SEEN) === String(ORDER.length);
  const allDone = () => ORDER.every((id) => isDone(EV[id]));
  const nextEv = () => ORDER.map((id) => EV[id]).find((e) => isOpen(e) && !isDone(e)) || null;
  function addMode(id, letters) {
    const j = J(); const r = j.ev[id] || (j.ev[id] = { done: 0, m: '' });
    const before = r.m;
    r.m = [...new Set((r.m + letters).split(''))].filter((c) => 'lrasmd'.includes(c)).sort((a, b) => 'lrasmd'.indexOf(a) - 'lrasmd'.indexOf(b)).join('');
    return r.m !== before;
  }
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  const gold = (id) => modesOf(id).length >= 6;

  // ---------- 사건 진행 ----------
  let run = null; // { ev, steps, i, r, sky, cleanup }
  const X = {
    me, P: SP, parts, center: PLAZA_LIGHT, toast, sfx, burst,
    near: (p, r) => dist(p) < r,
    sitting: (p, r) => me.state === 'sit' && dist(p) < r,
    praying: () => me.action === 'pray',
    verse: (keys, title = '') => { keys = [].concat(keys); markRead(keys); showVerse(keys[0], { cooldown: 0, delay: 0.5, title, then: keys.slice(1), stay: () => true }); },
    sky: (p, zone, pad) => { if (!run) return; run.sky = p ? { p, zone: zone || run.ev.zone, pad } : null; }, // zone: 구역 id 또는 {x, z, r}
    lake: LAKE_AT,
    carry, carrying: () => carryKind === 'jar',
    say: (who, text, sec = 4) => toast(`${who}: ${text}`, sec),
    walkNpc: (k, pts, viaPath) => {
      const n = N[k]; if (!n) return;
      const last = pts[pts.length - 1];
      n.path = viaPath ? findPath(n, last) : pts.map((p) => ({ x: p.x, z: p.z }));
      if (!n.path.length) { const q = nearestFree(last) || last; n.x = q.x; n.z = q.z; }
      n.home = { x: last.x, z: last.z }; n.state = n.path.length ? 'walk' : 'idle'; n.action = null;
    },
    follow: (k) => { N[k].follow = true; N[k].action = null; },
    unfollow: (k) => { N[k].follow = false; N[k].home = { x: N[k].x, z: N[k].z }; },
    dn: (k, p) => dist(p, N[k]),
    npcAt: (k) => N[k],
    trial: null,
    apron: setApron, jarsReset, jarsFull, nextJar, nearJar, fillJar, wine, cheer, dropFx,
    wind: (k) => { windK = k; },
    rings: (pts) => { extraRings.forEach((m, i) => { if (pts && pts[i]) putRing(m, pts[i]); else m.visible = false; }); },
    walkers: (on) => { walkers.forEach((n, i) => { n.hide = !on; n.walkI = i; n.path = []; }); },
    crowd: (on) => { crowd.forEach((n) => { n.hide = !on; n.face = Math.atan2(me.x - n.x, me.z - n.z); }); },
    onRoof,
    gaze: (p) => { if (me.seat) standUp(me); me.face = Math.atan2(p.x - me.x, p.z - me.z); me.action = 'gaze'; parts.poleGlow.material.opacity = 0.9; shot?.(p, { dist: 9, el: 0.25, side: 0.4, dur: 6, mid: 0.35, y: 3 }); setTimeout(() => { if (me.action === 'gaze') me.action = null; }, 6000); },
    blur, water, lightPath, splash,
    warmAt: (p) => { const o = parts.warm.children[0].position; warm2.position.set(p.x + 1.4 - o.x, G(p) + 1.5 - o.y, p.z + 0.6 - o.z); warm2.visible = true; },
  };
  const readSeen = new Set();
  function markRead(keys) { for (const k of keys) readSeen.add(k); }

  Object.assign(X, g2.X, g3.X, g4.X);
  X.ui = ui; // 사건 자리의 짧은 대화 (아이·종·동네 사람)
  // 멀리 바라보기 (희어진 밭 등): gaze와 같되 놋뱀 빛은 건드리지 않음
  X.look = (p) => { if (me.seat) standUp(me); me.face = Math.atan2(p.x - me.x, p.z - me.z); me.action = 'gaze'; shot?.(p, { dist: 8, el: 0.3, side: 0.4, dur: 6, mid: 0.4, y: 1.4 }); setTimeout(() => { if (me.action === 'gaze') me.action = null; }, 6000); };
  const trials = initTrials({
    ui, me, toast, sfx, burst, whisper, showVerse, lightPath, push: g2.X.push, fog: g2.X.fog,
    marks: g3.X.voiceMarks, go: (p) => walkTo(me, nearestFree(p) || p), // 목소리 가리기 (선한 목자)
    praying: () => me.action === 'pray',
    sky: { darkness: (k) => { darkK = k; } },
  });
  X.trial = trials;
  const modes = initModes({ ui, me, toast, sfx, burst, showVerse, walkTo, nearestFree });

  const curStep = () => (run && run.i < run.steps.length ? run.steps[run.i] : null);
  const hintOf = () => { const s = curStep(); if (!s) return ''; return typeof s.hint === 'function' ? s.hint(run.r) : s.hint; };
  const goOf = (s) => { const g = s && (s.go || s.at); return typeof g === 'function' ? g() : g; };
  function begin(e) {
    if (run) quit(true);
    trials.reset(); modes.cancel(); readSeen.clear();
    run = { ev: e, steps: e.steps(X), i: 0, r: {}, sky: null };
    addMode(e.id, 'l'); save(); // 듣기는 증인의 말을 들었을 때
    e.begin?.(X);
    sfx('tap', 0.2, 1.2);
    startStep();
  }
  function startStep() {
    const s = curStep(); if (!s) return;
    run.r = {};
    const myRun = run, myI = run.i;
    s.enter?.(run.r, () => { if (run === myRun && run.i === myI) advance(); });
    updateChip();
  }
  function advance() {
    const s = curStep();
    s?.leave?.(run.r);
    run.i++;
    sfx('tap', 0.2, 1.4);
    if (run.i >= run.steps.length) complete();
    else startStep();
  }
  function cleanup(e) {
    trials.end(); X.rings(null); X.wind(-1); X.walkers(false); X.crowd(false); carry(null); parts.lampStand.visible = true; g2.reset();
    for (const k of Object.keys(N)) { const n = N[k]; if (n.follow) n.follow = false; }
    e.end?.(X);
  }
  function resetNpcs(e) {
    const keys = e.reset || { come: ['andrew', 'nathan'], nico: ['nico'], cana: [], siloam: [] }[e.id] || [];
    for (const k of keys) { const n = N[k]; n.path = []; n.state = 'idle'; n.x = n.home0.x; n.z = n.home0.z; n.home = { ...n.home0 }; n.face = n.face0; }
    N.nathan.action = 'read';
    g4.reset(); // 3차 사람 자리·물건 (베드로를 먼저 세운 뒤 제자리로: placeShared)
    placeShared();
    g3.reset(); // 2차 나 사람 자리·물건 (마친 사건의 흔적은 기록대로)
  }
  // 두 사건이 함께 쓰는 증인(베드로)은 지금 따라갈 사건의 자리(e.stand)에 섬
  const evsOf = (k) => ORDER.map((id) => EV[id]).filter((e) => e.npc === k);
  const relEv = (k) => { const l = evsOf(k); return l.find((e) => isOpen(e) && !isDone(e)) || [...l].reverse().find(isDone) || l[0]; };
  function placeShared() {
    for (const k of new Set(ORDER.map((id) => EV[id].npc))) {
      const e = relEv(k), n = N[k]; if (!e || !e.stand || evsOf(k).length < 2 || (run && run.ev.npc === k)) continue;
      const q = nearestFree(SP[e.stand]) || SP[e.stand];
      if (Math.hypot(n.home0.x - q.x, n.home0.z - q.z) >= 0.5) { n.home0 = { x: q.x, z: q.z }; n.face0 = n.face; }
      // 자리가 같아도 다른 곳(호수 가운데 등)에 남아 있으면 제자리로
      if (n.state !== 'walk' && !n.seat && Math.hypot(n.x - q.x, n.z - q.z) > 0.5) { n.path = []; n.state = 'idle'; n.x = q.x; n.z = q.z; n.home = { ...n.home0 }; }
    }
  }
  function quit(silent) {
    if (!run) return;
    const e = run.ev; run = null;
    if (ui.isOpen()) ui.close(); // 사건 자리의 짧은 대화 창이 떠 있었으면 함께 닫음
    cleanup(e); resetNpcs(e);
    if (e.id === 'cana' && !isDone(e)) jarsReset();
    updateChip();
    if (!silent) toast(`"${e.title}"을(를) 그만두었어요. ${e.who}에게 다시 말을 걸면 처음부터 할 수 있어요`, 4);
  }
  function complete() {
    const e = run.ev; run = null;
    cleanup(e);
    const first = !isDone(e);
    addMode(e.id, 'lra');
    const j = J();
    if (first) j.ev[e.id].done = Date.now();
    const R = e.reward;
    let msg;
    let all7 = false;
    if (first && e.quiet) { // 수난 구역: 보상 없이 기록만 (기획서 9장 결정 4)
      const nx = ORDER[ORDER.indexOf(e.id) + 1];
      if (nx && JOHN_EVENTS.indexOf(nx) > JOHN_EVENTS.indexOf(j.open)) j.open = nx;
      msg = `${e.done} (기록에 남았어요)`;
    } else if (first) {
      addSteps(profile, R.steps); addStat(profile, e.stat, R.stat); earn(profile, R.coin);
      for (const it of R.items) giveItem(profile, it);
      const nx = ORDER[ORDER.indexOf(e.id) + 1];
      if (nx && JOHN_EVENTS.indexOf(nx) > JOHN_EVENTS.indexOf(j.open)) j.open = nx;
      j.signs = Math.max(j.signs | 0, ORDER.filter((id) => EV[id].sign && isDone(EV[id])).length);
      const lit = [].concat(e.lamp || []).filter((l) => !j.lamps.includes(l)); // 선한 목자는 문과 목자 둘
      if (lit.length) { j.lamps.push(...lit); setTimeout(() => toast(`빛의 광장 등잔 ${lit.length > 1 ? `${lit.length}개` : '하나'}에 불이 켜졌어요 (${e.lampName || lit.join('·')})`, 5), 5200); all7 = LAMP_IDS.every((l) => j.lamps.includes(l)); }
      msg = `${e.done} (걸음 +${R.steps}, ${statName(e.stat)} +${R.stat}, ${R.coin} 데나리온, ${R.items.map((x) => ITEMS[x]?.name || x).join('·')})`;
    } else if (e.quiet) msg = '다시 걸어 주었군요. 그 밤과 그 아침을 다시 기억했어요';
    else { addSteps(profile, 2); msg = `다시 걸어 주었군요. 말씀은 할 때마다 새로워요 (걸음 +2)`; }
    const grad = first && allDone() && j.mark !== '졸업'; // ORDER 22개를 다 마침 → 마을 졸업 표지 (기획서의 23사건 중 1번은 '와 보라'에 합쳐짐)
    if (grad) j.mark = '졸업';
    save(); onChange?.();
    sfx('orb', 0.3, 1.05); burst(me.x, me.y + 1.4, me.z);
    resetNpcs(e);
    updateChip();
    const showDone = () => {
      if (busy() || ui.isOpen() || !inTown()) { setTimeout(showDone, 800); return; } // 다른 창이 닫힐 때까지 (마을을 떠났으면 돌아올 때)
      ui.open({
        who: e.who, sub: `${e.title} · 마침`, text: msg, note: '깊이 보기(공부·암송·묵상)는 언제든 이 증인에게 다시 말을 걸면 해요.',
        buttons: [{ t: '감사해요', cls: 'next' }],
        onClose: () => {
          if (all7) X.verse(['jn-1-5', 'jn-8-12'], '일곱 등불이 다 켜졌어요'); // 광장 가운데 빛이 커짐 (passion.js)
          if (grad) setTimeout(graduate, 800);
          else if (first && allDone()) setTimeout(() => toast('사도 요한이 빛의 광장에서 기다려요. 이야기는 이어져요 (금빛 기둥)', 6), 800);
        },
      });
    };
    setTimeout(showDone, 2200);
  }

  // 요한복음 마을 졸업 (21장 카드): 내 닉네임과 "너는 나를 따르라". 카드를 넘기면 21:22·21:25가 오늘 만난 말씀에 남음
  function graduate() {
    if (busy() || ui.isOpen() || !inTown()) { setTimeout(graduate, 800); return; }
    const c = callName(profile.name), j = J();
    ui.open({
      who: '사도 요한', sub: '요한복음 마을 졸업', quote: 'jn-21-22',
      text: `${c ? c.voc : '친구여'}, 요한복음 마을의 이야기를 처음부터 끝까지 다 따라왔어요! 그분이 베드로에게 마지막으로 하신 말씀은 "너는 나를 따르라"였어요. 이제 그 말씀을 들고 초보자 마을, 당신의 자리로 돌아가요.`,
      note: `졸업 표지를 받았어요 · 표적 ${ORDER.filter((id) => EV[id].sign && isDone(EV[id])).length}개 · "나는…" 등불 ${j.lamps.length}개 · 이야기 ${ORDER.length}개`,
      buttons: [{ t: '"나를 따르라"', cls: 'next', fn: () => X.verse(['jn-21-22', 'jn-21-25'], '요한복음 마을 졸업') }],
    });
    sfx('orb', 0.3, 0.9); burst(me.x, me.y + 1.6, me.z);
  }

  // ---------- 증인과 대화 ----------
  function rewardNote(e) {
    const R = e.reward;
    if (e.quiet) return '이 이야기는 시험도 보상도 없어요. 곁에서 보고 머물며 기록만 남겨요.';
    return `처음 마치면 걸음 +${R.steps}, ${statName(e.stat)} +${R.stat}, ${R.coin} 데나리온${e.sign ? '(표적)' : ''}, ${R.items.map((x) => ITEMS[x]?.name || x).join('·')}${e.lamp ? ` · 💡 ${e.lampName || ''}` : ''}.`;
  }
  function marks(id) { const m = modesOf(id); return 'lrasmd'.split('').map((c) => (m.includes(c) ? `✓${MODE_NAME[c]}` : `·${MODE_NAME[c]}`)).join(' '); }
  function speak(text) {
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast('이 기기에서는 읽어 주기를 할 수 없어요', 3); }
  }
  function deep(e) {
    const m = modesOf(e.id);
    const fin = (letter, name) => () => {
      const fresh = addMode(e.id, letter);
      if (fresh && e.quiet) toast(`${name}을(를) 채웠어요${gold(e.id) ? ` · "${e.title}"의 여섯 손가락을 다 채웠어요! 표시가 금빛이 돼요` : ''}`, 5);
      else if (fresh) { addSteps(profile, 2); toast(`${name}을(를) 채웠어요 (걸음 +2)${gold(e.id) ? ` · "${e.title}"의 여섯 손가락을 다 채웠어요! 표시가 금빛이 돼요` : ''}`, 5); }
      save(); onChange?.();
    };
    const seat = e.med.at === 'feast' ? SP.feast[1] : SP[e.med.at];
    const others = evsOf(e.npc).filter((o) => o !== e && isDone(o)); // 같은 증인의 다른 이야기
    ui.open({
      who: e.who, sub: `${e.title} · 깊이 보기`, text: `다시 와 주었군요! 이 이야기를 더 깊이 볼까요? ${marks(e.id)}`,
      buttons: [
        { t: '나중에', cls: 'later' },
        ...others.map((o) => ({ t: `"${o.title}" 깊이 보기`, fn: () => deep(o) })),
        { t: '본문 읽기', fn: () => { X.verse(e.read, e.title); } },
        { t: '다시 하기', fn: () => begin(e) },
        { t: `${m.includes('s') ? '✓ ' : ''}공부`, fn: () => modes.study(e, fin('s', '공부')) },
        { t: `${m.includes('m') ? '✓ ' : ''}암송`, fn: () => modes.memo(e, fin('m', '암송')) },
        { t: `${m.includes('d') ? '✓ ' : ''}묵상`, cls: 'next', fn: () => modes.meditate(e, seat, fin('d', '묵상')) },
      ],
    });
  }
  function talkWitness(e) {
    const n = N[e.npc];
    if (run && run.ev === e) {
      if (run.r.closed && curStep()?.enter) { startStep(); return; } // 닫힌 시험 창 다시 열기
      ui.open({ who: e.who, sub: `${e.title} · ${run.i + 1}/${run.steps.length}`, text: hintOf(), buttons: [{ t: '그만두기', cls: 'later', fn: () => quit() }, { t: '알겠어요', cls: 'next' }] });
      return;
    }
    if (run) { ui.open({ who: e.who, sub: e.title, text: `지금은 "${run.ev.title}"을(를) 따라가고 있군요. 그 일을 마치고 다시 와 주세요.`, buttons: [{ t: '알겠어요', cls: 'next' }] }); return; }
    if (!isOpen(e)) {
      ui.open({ who: e.who, sub: e.title, text: `반가워요. 이 이야기는 "${EV[e.after].title}"을(를) 마친 뒤에 들려줄게요. 그동안 이곳에서 쉬어 가요.`, buttons: [{ t: '알겠어요', cls: 'next' }] });
      return;
    }
    if (isDone(e)) return deep(e);
    ui.open({
      who: e.who, sub: `요한복음 ${e.ch} · ${e.title}`, text: e.listen, note: rewardNote(e),
      buttons: [{ t: '🔈 읽어 주기', cls: 'speak', keep: true, fn: () => speak(e.listen) }, { t: '나중에', cls: 'later' }, { t: '따라 해 보기', cls: 'next', fn: () => begin(e) }],
    });
    n.face = Math.atan2(me.x - n.x, me.z - n.z);
  }
  // 사도 요한: 와 보라의 증인이자 마을 안내자. 마을 기록장(요한의 두루마리)과 다음 이야기
  function talkJohn() {
    const e = EV.come;
    if (!isDone(e) || (run && run.ev === e)) return talkWitness(e);
    const book = ORDER.map((id) => `${EV[id].title} ${isDone(EV[id]) ? (gold(id) ? '★' : '✓') : isOpen(EV[id]) ? '…' : '·'}`).join(' · ');
    if (allDone()) {
      // 다른 기기 기록을 합쳐(mergeJohn) 다 마치게 된 경우: 여기서 졸업 표지를 세우고 졸업 카드부터
      if (J().mark !== '졸업') { J().mark = '졸업'; save(); onChange?.(); graduate(); return; }
      lsSet(END_SEEN, String(ORDER.length));
      const lamps = J().lamps.length, signs = ORDER.filter((id) => EV[id].sign && isDone(EV[id])).length;
      ui.open({
        who: '사도 요한', sub: J().mark === '졸업' ? '요한복음 마을 졸업' : '이야기는 이어져요', quote: 'jn-21-25',
        text: `${ORDER.length} 이야기를 다 따라왔군요! 빛이 어둠에 비치고, 물이 포도주가 되고, 우물가의 여인이 동네로 달려갔어요. 떡 다섯 개가 무리를 먹이고, 소경이 눈을 뜨고, 나사로가 무덤에서 나왔어요. 다락방에서 그분이 발을 씻기셨고, 숯불 곁의 밤과 "다 이루었다" 하신 십자가를 지나, 동산에서 "마리아야" 이름을 부르셨어요. 닫힌 문 안에 평강을 주셨고, 바닷가 숯불 곁에서 "너는 나를 따르라" 하셨어요. 표적 ${signs}개를 보았고, "나는…" 등불 ${lamps}개가 켜졌어요. 이 외에도 많아서 낱낱이 기록하면 이 세상이라도 그 책을 두기에 부족하대요. 이제 당신의 이야기로 이어져요.`,
        note: `마을 기록장: ${book}`,
        buttons: [{ t: '와 보라 깊이 보기', fn: () => deep(e) }, { t: '감사해요', cls: 'next' }],
      });
      return;
    }
    const nx = nextEv();
    ui.open({
      who: '사도 요한', sub: '마을 기록장 · 요한의 두루마리',
      text: nx ? `다음 이야기는 "${nx.title}"예요. ${ZONES[nx.start || nx.zone].name}의 ${nx.who}에게 가 보세요. 금빛 기둥이 그 자리를 비춰요.` : '지금 따라갈 이야기가 없어요. 쉬어 가요.',
      note: `마을 기록장: ${book}`,
      buttons: [{ t: '와 보라 깊이 보기', fn: () => deep(e) }, { t: '알겠어요', cls: 'next' }],
    });
  }

  // ---------- 그 자리 단추 ----------
  const available = () => {
    if (!inTown() || ui.isOpen()) return [];
    const s = curStep(); if (!s || !s.place) return [];
    const p = typeof s.at === 'function' ? s.at() : s.at;
    return p && dist(p) < s.r ? [['place', s.place]] : [];
  };
  const doPlace = () => {
    const s = curStep(); if (!s || !s.place) return;
    const p = typeof s.at === 'function' ? s.at() : s.at;
    if (!p || dist(p) > s.r) return;
    if (me.seat && !s.keepSeat) standUp(me); // 배 위(밤바다)에서는 앉은 채로
    const res = s.act?.(run.r);
    if (res !== false) advance(); else updateChip();
  };
  const actions = Object.fromEntries(JN_ACTS.map((k) => [k, doPlace]));
  const wants = () => { const s = curStep(); return s && /X 기도|기도 X|\(X/.test(hintOf()) ? ['pray'] : []; };

  // ---------- 진행 표시 ----------
  let chipText = '';
  function updateChip() {
    let t = '';
    if (inTown()) {
      if (run) t = `${run.ev.title} · ${hintOf()}`;
      else if (modes.active()) t = modes.progress();
      else { const nx = nextEv(); if (nx) t = `요한복음 마을 · 다음: ${nx.title} (${nx.who}, 금빛 기둥)`; else if (allDone() && !endSeen()) t = '요한복음 마을 · 사도 요한에게 (금빛 기둥)'; }
    }
    if (t !== chipText) { chipText = t; chip.textContent = t; }
    chip.hidden = !t;
  }
  function info() {
    if (!inTown()) return null;
    if (run) {
      const s = curStep(), p = goOf(s) || N[run.ev.npc];
      return { title: run.ev.title, ch: run.ev.ch, hint: hintOf(), step: run.i + 1, steps: run.steps.length, where: s?.where || '', target: { x: p.x, z: p.z }, running: true, verse: VERSES[run.ev.read[0]] };
    }
    if (modes.active()) { const p = modes.target(); return { title: '묵상', hint: modes.progress(), where: '', target: { x: p.x, z: p.z }, running: false }; }
    const nx = nextEv();
    if (nx) { const n = N[nx.npc]; return { title: nx.title, ch: nx.ch, hint: `${nx.who}에게 말을 걸면 시작해요`, where: `${ZONES[nx.start || nx.zone].name} · ${nx.who}`, target: { x: n.x, z: n.z }, running: false, verse: VERSES[nx.read[0]] }; }
    if (allDone() && !endSeen()) return { title: '이야기는 이어져요', hint: '사도 요한에게 말을 걸어요', where: '빛의 광장 · 사도 요한', target: { x: N.john.x, z: N.john.z }, running: false };
    return null;
  }

  // ---------- 매 프레임 ----------
  let lastT = 0, chipT = 0, wasTown = inTown();
  function step() {
    const now = performance.now(), dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 0; lastT = now; // 실제 흐른 시간 (헤드리스에서도 같게)
    const town = inTown();
    stepSky(dt);
    // 흐림 (실로암): 천천히 흐려지고 맑아짐
    blind += ((town ? blindTarget : 0) - blind) * Math.min(1, dt * (blindTarget ? 0.8 : 0.5));
    const b = blind < 0.01 ? 0 : blind;
    document.body.style.setProperty('--jblind', b.toFixed(3));
    document.body.classList.toggle('jn-blind', b > 0);
    blurBtn.hidden = !(town && (blindTarget || g2.fx())); // 실로암 흐림, 밤바다 물결·안개
    if (!blurBtn.hidden && !blurBtn.textContent) blurLabel();
    // 마을을 떠날 때 (수레): 사건은 그대로 두고 창·속삭임을 닫고 손에 든 것·앞치마를 감춤. 돌아오면 다시 보임
    if (town !== wasTown) {
      wasTown = town;
      if (!town) { ui.close(); whisper(''); darkK = 0; }
      trials.away(!town);
      if (carried) carried.visible = town;
      if (apron) apron.visible = town;
    }
    lampLight.intensity = town && carried && carryKind === 'lamp' ? 5 : 0;
    if (lampLight.intensity) { me.av.updateWorldMatrix(true, true); carried.getWorldPosition(handPos); lampLight.position.set(handPos.x, handPos.y + 0.3, handPos.z); }
    if (noise) { const d = waterAt && town ? dist(waterAt) : 999; noise.g.gain.value = waterAt && town ? Math.max(0.02, Math.min(0.5, 6 / (d + 4))) : 0; }
    for (const n of Object.values(N)) {
      const d = dist(n);
      n.av.visible = town && d < 90 && !n.hide;
      if (!town) continue;
      // 따라오는 사람 (나다나엘)
      if (n.follow) {
        if (d > 2.4 && n.state !== 'walk') { const a = Math.atan2(n.x - me.x, n.z - me.z); const p = nearestFree({ x: me.x + Math.sin(a) * 1.4, z: me.z + Math.cos(a) * 1.4 }); if (p) { n.path = [p]; n.state = 'walk'; } }
        n.home = { x: n.x, z: n.z };
      }
      if (n.state !== 'walk') { n.x = n.home.x; n.z = n.home.z; if (n.action !== 'wave' && !n.fixFace) n.face = d < 6 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0; }
    }
    // 밤길을 오가는 등불 든 사람들
    walkers.forEach((n, i) => {
      if (n.hide || n.state === 'walk') return;
      const to = SP.walkers[(n.walkI = (n.walkI | 0) + 1) % 2]; n.path = [{ x: to.x + i * 0.8, z: to.z + i * 0.6 }]; n.state = 'walk';
    });
    g2.step(town); g3.step(town); g4.step(town);
    if (!town) { chip.hidden = true; beam.visible = false; ring.visible = false; return; }
    reattach();
    trials.step(); modes.step();
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
    // 머리 위 표시
    for (const k of markKeys) {
      const e = relEv(k), n = N[k], id = e.id;
      n.mark.visible = isOpen(e) && !(run && run.ev.npc === k);
      n.mark.material.map = !isDone(e) ? TEX.scroll : gold(id) ? TEX.gold : TEX.star;
      n.mark.position.y = 2.75 + Math.sin(now / 500 + id.length) * 0.06;
    }
    // 금빛 기둥: 진행 중이면 지금 할 자리, 아니면 다음 사건의 증인
    let bp = null;
    if (run) bp = goOf(curStep());
    else if (modes.active()) bp = modes.target();
    else { const nx = nextEv(); if (nx) bp = N[nx.npc]; else if (allDone() && !endSeen()) bp = N.john; }
    beam.visible = !!bp && (!run || dist(bp) > 4);
    if (bp) beam.position.set(bp.x, G(bp), bp.z);
    beam.userData.star.material.rotation = now / 2500;
    beam.children[0].material.opacity = 0.18 + Math.sin(now / 500) * 0.06;
    // 빛나는 자리 고리 (그 자리 단추·서기·앉기 단계)
    const s = curStep(), rp = s && !s.talk && goOf(s);
    if (rp && s.ring !== false) putRing(ring, rp); else ring.visible = false;
    const pulse = Math.sin(now / 400);
    for (const m of [ring, ...extraRings]) if (m.visible) { m.material.opacity = 0.45 + 0.3 * pulse; m.children[0].material.opacity = 0.13 + 0.07 * pulse; }
    // 단계 진행
    if (run && s && s.until && !ui.isOpen()) { if (s.until(run.r, dt)) advance(); }
    if ((chipT += dt) > 0.3) { chipT = 0; updateChip(); }
    // 말풍선: 대화 상대에게서 멀어지면 닫음 (시험·모드 창은 그대로)
    if (spec && spec.anchor && dist(spec.anchor) > 6) ui.close();
    // 말 걸기 (가까이 가도 저절로 열지 않음: 단추나 그 사람을 눌러야)
    if (ui.isOpen() || busy()) return;
    // 가까이 있는 사람 중 지금 단계의 대화 상대 → 사건 증인·요한 → 나머지 순으로 (무리가 아이보다 가까워도 아이에게)
    const st = curStep(), want = st ? [].concat(st.talk || []) : [];
    const rank = (n) => (want.includes(n.key) && !(st.told && st.told(run.r, n.key)) ? 0 : evsOf(n.key).length || n.key === 'john' ? 1 : 2);
    let best = null, bd = 2.9, br = 3;
    for (const n of Object.values(N)) { if (n.hide || !n.av.visible) continue; const d = dist(n); if (d >= 2.9) continue; const rk = rank(n); if (rk < br || (rk === br && d < bd)) { br = rk; bd = d; best = n; } }
    if (!best) return;
    const k = best.key;
    const ev = evsOf(k).length ? (run && run.ev.npc === k ? run.ev : relEv(k)) : null;
    if (st && [].concat(st.talk || []).includes(k) && !(st.told && st.told(run.r, k))) offerTalk('jn:' + k, best, () => { const myRun = run, myI = run.i; st.open(run.r, () => { if (run === myRun && run.i === myI) advance(); }, k, best); });
    else if (k === 'john') offerTalk('jn:john', best, () => { talkJohn(); spec && (spec.anchor = best); });
    else if (ev) offerTalk('jn:' + k, best, () => { talkWitness(ev); spec && (spec.anchor = best); });
    else if (GREET[k]) offerTalk('jn:' + k, best, () => { best.face = Math.atan2(me.x - best.x, me.z - best.z); toast(`${best.name}: ${GREET[k]}`, 4); });
  }

  const markKeys = [...new Set(ORDER.map((id) => EV[id].npc))];
  placeShared();
  updateChip();
  return {
    step, available, actions, wants, info, quit: () => quit(),
    active: () => ui.isOpen(),
    get run() { return run; }, N, EV, ui, X, modes, trials,
    debug: { begin: (id) => begin(EV[id]), advance, complete: () => run && complete() },
  };
}
