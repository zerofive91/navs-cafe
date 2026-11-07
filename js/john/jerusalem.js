// 요한복음 마을 2차 나 (2026-11): 예루살렘·베다니 사건이 쓰는 도구 (기획서 3.3 표 4·8·12·14·15·16번)
//   사람들(제자·성전 뜰의 여인과 고소하는 무리·목자·베데스다의 병자들과 유대인 무리·마르다·마리아·나사로·위문 온 사람들),
//   장사판 치우기(아버지 집), 돗자리 들기와 거슬러 오는 무리(베데스다), 하나씩 나가는 무리(세상의 빛),
//   세 곳에서 부르는 소리 표시(선한 목자, 시험 C), 무덤 돌·베 풀기(나사로), 향기와 한 알의 밀(나드 향유), 양 우리의 양
//   reset(): 사건을 그만두거나 마치면 사람 자리와 물건을 되돌림. 마친 사건의 흔적(치운 뜰, 열린 무덤, 살아난 나사로, 자란 밀)은
//   profile.john 기록을 보고 그대로 둠 → 새로고침·다른 기기 기록 합치기에도 같은 모습. engine.js가 X에 이 도구들을 더하고 매 프레임 step을 부름
import * as THREE from 'three';
import { isFree } from '../layout.js';
import { nearestFree, findPath } from '../nav.js';
import { JX, JZ, SP, FOLD7, TOMB12 } from './layout.js';

export function initJerusalem({ root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId }) {
  const done = (id) => !!profile.john?.ev?.[id]?.done;
  const sitNpc = (n, kind, face) => { n.seat = { kind }; n.state = 'sit'; n.path = []; n.fixFace = true; n.action = null; if (face != null) n.face = face; };
  const standNpc = (n) => { n.seat = null; if (n.state === 'sit') n.state = 'idle'; n.fixFace = false; };
  const putAt = (n, p, free = true) => { const q = (free && nearestFree(p)) || p; n.x = q.x; n.z = q.z; n.home = { x: q.x, z: q.z }; n.path = []; if (n.state === 'walk') n.state = 'idle'; };
  const toward = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);

  // ---------- 사람들 ----------
  person('disciple7', '제자', { hoodie: 0x8a7a5a, hair: 0x3b2a22 }, SP.disciple7, SP.prayAt7);
  person('woman8', '성전 뜰의 여인', { hoodie: 0x8a6a7a, hair: 0x2b211c, style: 1 }, SP.woman8, SP.warmL);
  // 여인을 둘러싼 무리 (8:3): 내 자리 쪽은 비워 둠. 어른부터 하나씩 나감 (8:9)
  const a0 = Math.atan2(SP.lightAt7.z - SP.woman8.z, SP.lightAt7.x - SP.woman8.x);
  const ACC_HOME = [0, 1, 2, 3, 4].map((i) => { const a = a0 + ((i + 1) * Math.PI) / 3; return { x: SP.woman8.x + Math.cos(a) * 2.8, z: SP.woman8.z + Math.sin(a) * 2.8 }; });
  const ACC_LOOK = [{ hoodie: 0x4a4a6a, hair: 0x8a8070 }, { hoodie: 0x5a4a3a, hair: 0x5a5048 }, { hoodie: 0x3a4a5a, hair: 0x2b211c }, { hoodie: 0x6a5a4a, hair: 0x9a9088 }, { hoodie: 0x4a3a3a, hair: 0x3b2a22 }];
  const accusers = ACC_HOME.map((p, i) => person('acc' + i, i < 2 ? '서기관' : '바리새인', ACC_LOOK[i], p, SP.woman8));
  const LEAVE = [3, 0, 1, 4, 2]; // 머리가 센 사람부터
  person('shepherd', '목자', { hoodie: 0x7a6a4a, hair: 0x5a4030 }, SP.shepherd, SP.foldFront);
  person('sick', '병 나은 사람', { hoodie: 0xa89a7a, hair: 0x4a3a30 }, SP.sick, SP.mat8);
  const patients = SP.pts.map((p, i) => person('pt' + i, '병자', { hoodie: [0x9a8a6a, 0x7a7a6a, 0x8a7a7a, 0x6a6a5a][i], hair: 0x3b2a22 }, p, SP.water8));
  const jews = [0, 1, 2, 3, 4, 5].map((i) => person('jew' + i, '유대인', { hoodie: [0x4a4a5a, 0x6a5a4a, 0x5a4a5a, 0x4a5a5a, 0x6a4a4a, 0x5a5a4a][i], hair: 0x5a5048 }, SP.stream8[0], SP.stream8[1]));
  person('martha', '마르다', { hoodie: 0x9a7a5a, hair: 0x3b2a22, style: 1 }, SP.martha, SP.table12);
  person('mary12', '마리아', { hoodie: 0x7a8aa8, hair: 0x2b211c, style: 1 }, SP.mary12, SP.table12);
  person('lazarus', '나사로', { hoodie: 0xe8dcc0, hair: 0x4a3a30 }, SP.lazarus, SP.table12);
  const mourners = SP.mourn.map((p, i) => person('mourn' + i, '위문 온 사람', { hoodie: [0x5a5a6a, 0x6a5a5a, 0x5a6a5a][i], hair: 0x2b211c, style: i === 1 ? 1 : 0 }, p, SP.martha));
  for (const n of [...accusers, ...jews]) n.hide = true;
  jews.forEach((n) => { n.slow = 0.68; });
  accusers.forEach((n) => { n.slow = 0.8; });
  // 수족을 동인 베 (11:44): 나사로 몸을 덮는 흰 천, 풀면 사라짐
  const wrap = new THREE.Group();
  {
    const cloth = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 1 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 1.25, 12), cloth); b.position.y = 0.66; wrap.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), cloth); h.position.y = 1.43; h.scale.set(1, 1.12, 1); wrap.add(h);
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.24 - k * 0.008, 0.012, 4, 18), new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 1 })); r.rotation.x = Math.PI / 2 + (k % 2 ? 0.25 : -0.25); r.position.y = 0.25 + k * 0.24; wrap.add(r); }
    wrap.visible = false; N.lazarus.av.add(wrap);
  }
  Object.assign(GREET, {
    pt0: '물이 동할 때 넣어 줄 사람이 없어요(5:7).', pt1: '이 못에는 행각이 다섯이에요(5:2).', pt2: '오래 누워 있었어요. 저 사람은 서른여덟 해였대요(5:5).', pt3: '오늘은 안식일이에요(5:9).',
    jew0: '안식일인데 자리를 들고 가는 것이 옳지 아니하니라(5:10).', jew1: '누가 너더러 자리를 들고 가라 했느냐(5:12)?',
    lazarus: '저는 죽었다가 다시 살았어요. 그분이 "나사로야 나오라" 부르셨지요(11:43).',
    mourn0: '나사로의 일로 위로하러 왔어요(11:19).', mourn1: '마르다와 마리아가 많이 울었어요.', mourn2: '베다니는 예루살렘에서 오 리쯤 돼요(11:18).',
    acc0: '…', acc1: '…', acc2: '…', acc3: '…', acc4: '…',
  });

  // ---------- 양 우리의 양 (어슬렁) ----------
  const sheep = (parts.sheep || []).map((o, i) => ({ o, tgt: null, wait: 1 + i * 0.7 }));
  const F = FOLD7, inFold = () => ({ x: JX + F.u0 + 0.9 + Math.random() * (F.w - 1.8), z: JZ + F.v0 + 0.9 + Math.random() * (F.d - 2.2) }); // 세계 좌표

  // ---------- 성전 뜰 장사판 (아버지 집, 2:14-16) ----------
  const stalls = (parts.stalls || []).map((s) => ({ ...s, cleared: false }));
  const flyers = []; // 날아가는 비둘기 (그림만)
  function clearStall() {
    let b = null, bd = 2.6;
    for (const s of stalls) { if (s.cleared) continue; const d = dist(s.p); if (d < bd) { bd = d; b = s; } }
    if (!b) return false;
    b.cleared = true; b.g.visible = false;
    sfx('impact/impactWood_light_000', 0.22, 0.9); burst(b.p.x, G(b.p) + 1, b.p.z);
    if (b.k === 'dove') for (let k = 0; k < 5; k++) { const s = fxSprite('circle_05', 0xffffff, 0.35); s.position.set(b.p.x, G(b.p) + 1.1, b.p.z); root.add(s); flyers.push({ s, t: 0, a: k * 1.26, v: 1.4 + k * 0.2 }); }
    return stalls.every((s) => s.cleared);
  }
  const nearStall = () => { let b = null, bd = Infinity; for (const s of stalls) { if (s.cleared) continue; const d = dist(s.p); if (d < bd) { bd = d; b = s; } } return b ? b.p : SP.prayAt7; };

  // ---------- 베데스다: 돗자리, 성전 쪽에서 못으로 오는 무리 (5:10) ----------
  let matUp = false;
  let streamOn = false;
  const spawnJ = (n, i, late) => {
    const s = SP.stream8[0];
    n.x = s.x + Math.sin(i * 2.1) * 0.6; n.z = s.z + Math.cos(i * 1.3) * 0.6; n.home = { x: n.x, z: n.z };
    n.path = SP.stream8.slice(1).map((p, k) => ({ x: p.x + Math.sin(i * 1.7 + k) * 0.7, z: p.z + Math.cos(i * 1.1 + k) * 0.5 }));
    n.state = 'walk'; n.wait = late;
  };
  function stream(on) {
    streamOn = on;
    jews.forEach((n, i) => { n.hide = !on; n.hold = false; if (on) spawnJ(n, i, i * 2.4); else { n.path = []; n.state = 'idle'; n.wait = 0; putAt(n, n.home0, false); } });
  }
  function pushMe(dx, dz) {
    if (me.seat) return;
    const nx = me.x + dx, nz = me.z + dz;
    if (isFree(nx, nz)) { me.x = nx; me.z = nz; } else if (isFree(nx, me.z)) me.x = nx; else if (isFree(me.x, nz)) me.z = nz;
  }

  // ---------- 세상의 빛: 둘러선 무리, 하나씩 나감 (8:3-9) ----------
  let accT = -1; // 나가기 시작한 때 (performance.now), -1이면 아직
  function accusersOn(on) {
    accT = -1;
    accusers.forEach((n, i) => { n.hide = !on; n.left = false; n.path = []; n.state = 'idle'; putAt(n, ACC_HOME[i], false); n.face = toward(n, SP.woman8); n.fixFace = on; });
  }
  const accLeave = () => { if (accT < 0) accT = performance.now(); };
  const accGone = () => accusers.every((n) => n.hide);

  // ---------- 나사로: 무덤 돌, 나옴, 베 풀기 (11:38-44) ----------
  const T = { k: 0, shown: 0 };
  const L = { out: false, wrapped: true };
  let lzFree = false; // 부탁(나사로와 함께 걷기) 동안만: 나사로를 식탁 자리에 다시 앉히지 않음
  function pushStone() {
    if (T.k >= 4) return true;
    T.k++;
    sfx('impact/impactSoft_heavy_000', 0.22, 0.7 + T.k * 0.05); burst(TOMB12.stone.x, G(TOMB12.stone) + 0.6, TOMB12.stone.z);
    me.action = 'strain'; setTimeout(() => { if (me.action === 'strain') me.action = null; }, 700);
    return T.k >= 4;
  }
  let lgen = 0; // reset마다 늘어남: 그만두기·마침 뒤에 늦게 도는 타이머가 나사로를 다시 세우지 않게
  const lazarusLater = (ms) => { const g = lgen; setTimeout(() => { if (g === lgen) lazarusOut(); }, ms); };
  function lazarusOut() {
    if (L.out) return;
    L.out = true; L.wrapped = true;
    const n = N.lazarus; standNpc(n); n.hide = false; putAt(n, SP.lazarusTomb, false); n.face = toward(n, SP.stoneAt);
    burst(n.x, G(n) + 1.4, n.z); sfx('orb', 0.3, 0.95);
  }
  function untie() {
    L.wrapped = false;
    const n = N.lazarus; burst(n.x, G(n) + 1.2, n.z); sfx('orb', 0.26, 1.2);
    n.action = 'wave'; setTimeout(() => { if (n.action === 'wave') n.action = null; }, 3000);
  }
  function mournersTo(where) {
    mourners.forEach((n, i) => { standNpc(n); const p = where === 'tomb' ? SP.mournTomb[i] : n.home0; n.path = findPath(n, p); n.home = { x: p.x, z: p.z }; n.state = n.path.length ? 'walk' : 'idle'; });
  }

  // ---------- 나드 향유: 집에 가득한 향기 (12:3, 그림만), 한 알의 밀 (12:24) ----------
  let fragOn = false, fragK = 0;
  const frag = [];
  const C = SP.table12;
  for (let k = 0; k < 26; k++) {
    const s = fxSprite('light_01', k % 3 ? 0xf0d8ff : 0xffe6b0, 0.45 + (k % 4) * 0.1);
    const a = k * 2.39, r = 1 + (k % 7) * 0.9;
    s.userData = { x: C.x + Math.cos(a) * r, z: C.z + Math.sin(a) * r * 0.8, ph: k * 0.7 };
    s.visible = false; root.add(s); frag.push(s);
  }
  let planted = false, growT = 0;
  function plant() {
    planted = true; growT = 0;
    me.action = 'plant'; setTimeout(() => { if (me.action === 'plant') me.action = null; }, 1600);
    sfx('tap', 0.2, 0.9); burst(SP.plantAt.x, G(SP.plantAt) + 0.4, SP.plantAt.z);
  }

  // ---------- 선한 목자: 세 곳의 부르는 소리 자리 (시험 C, trials.js voices) ----------
  const numTex = (t) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = 'rgba(40,30,50,0.78)'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffd86a'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#ffe9b0'; g.font = '700 36px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 32, 34);
    const x = new THREE.CanvasTexture(cv); x.colorSpace = THREE.SRGBColorSpace; return x;
  };
  const vmarks = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 32), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; g.add(m);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: numTex(String(i + 1)), transparent: true, depthWrite: false })); s.scale.setScalar(0.7); s.position.y = 2.1; g.add(s);
    g.userData = { m, s }; g.visible = false; root.add(g); return g;
  });
  function voiceMarks(pts, dim) {
    vmarks.forEach((g, i) => {
      if (!pts || !pts[i]) { g.visible = false; return; }
      g.position.set(pts[i].x, G(pts[i]) + 0.06, pts[i].z); g.visible = true;
      g.userData.dim = !!(dim && dim[i]);
      g.userData.m.material.color.set(g.userData.dim ? 0x8a8090 : 0xffe2a0);
    });
  }

  // ---------- 되돌리기 (그만두기·마침·처음) ----------
  function reset() {
    lgen++; lzFree = false;
    stream(false); accusersOn(false);
    for (const s of stalls) s.cleared = false;
    matUp = false; T.k = 0; L.out = false; L.wrapped = true; fragOn = false; planted = false; growT = 0;
    voiceMarks(null);
    for (const f of flyers.splice(0)) root.remove(f.s);
    // 베다니 사람들: 나사로를 마친 뒤에는 나사로가 잔치 식탁에, 마리아는 식탁 곁에 (12:2). 아직이면 마리아는 집에 앉아 있음 (11:20)
    const lz = N.lazarus, my = N.mary12, mt = N.martha;
    lz.path = []; putAt(lz, SP.lazarus, false); lz.home0 = { ...lz.home }; sitNpc(lz, 'gbench', Math.PI);
    my.path = []; my.follow = false;
    if (done('lazarus')) { standNpc(my); my.state = 'idle'; putAt(my, SP.maryTable); my.face0 = toward(my, SP.table12); }
    else { putAt(my, SP.mary12, false); sitNpc(my, 'gbench', -Math.PI / 2); my.face0 = -Math.PI / 2; }
    my.home0 = { ...my.home };
    mt.follow = false; standNpc(mt); mt.state = 'idle'; putAt(mt, mt.home0, false);
    mourners.forEach((n) => { standNpc(n); n.state = 'idle'; putAt(n, n.home0, false); n.action = null; });
    patients.forEach((n) => { putAt(n, n.home0, false); sitNpc(n, 'lie', toward(n, SP.water8) + Math.PI); });
    N.sick.path = []; putAt(N.sick, N.sick.home0, false);
    N.woman8.path = []; putAt(N.woman8, N.woman8.home0, false);
    N.shepherd.path = []; putAt(N.shepherd, N.shepherd.home0, false);
  }

  // ---------- 매 프레임 ----------
  let last = 0;
  function step(town) {
    const now = performance.now(), dt = last ? Math.min(0.25, (now - last) / 1000) : 0; last = now;
    if (!town) return;
    const rid = runId();
    // 마친 사건의 흔적은 기록대로 (다시 하는 동안에는 그 사건의 진행대로)
    const showStalls = rid === 'temple' || !done('temple');
    for (const s of stalls) s.g.visible = showStalls && !(rid === 'temple' && s.cleared);
    if (parts.mat8) parts.mat8.visible = !(rid === 'bethesda' && matUp);
    const lzRun = rid === 'lazarus';
    N.lazarus.hide = lzRun ? !L.out : !done('lazarus');
    wrap.visible = L.out && L.wrapped;
    if (!L.out && !lzFree && !N.lazarus.seat) sitNpc(N.lazarus, 'gbench', Math.PI);
    const showMourn = lzRun || !done('lazarus');
    for (const n of mourners) n.hide = !showMourn;
    // 무덤 돌: 밀 때마다 4분의 1씩 굴러 비켜남. 나사로를 마친 뒤에는 열린 채로
    const want = lzRun ? T.k / 4 : done('lazarus') ? 1 : 0;
    T.shown += (want - T.shown) * Math.min(1, dt * 2.5);
    if (parts.tombStone) {
      const a = TOMB12.stone, b = TOMB12.rolled, k = T.shown;
      parts.tombStone.position.x = a.x + (b.x - a.x) * k; parts.tombStone.position.z = a.z + (b.z - a.z) * k;
      parts.tombDisc.rotation.y = (k * Math.hypot(b.x - a.x, b.z - a.z)) / 1.08;
    }
    // 밀: 심으면 3초쯤 자람. 나드 향유를 마친 뒤에는 자란 채로
    if (parts.wheat) {
      const grown = rid !== 'nard' && done('nard');
      if (planted) growT = Math.min(1, growT + dt / 3);
      const k = planted ? growT : grown ? 1 : 0;
      parts.wheat.visible = k > 0.01; parts.wheat.scale.set(0.3 + 0.7 * k, Math.max(0.02, k), 0.3 + 0.7 * k);
    }
    // 향기: 부으면 마당에 퍼짐. 마친 뒤에는 엷게 남음
    const fw = fragOn ? 1 : rid !== 'nard' && done('nard') ? 0.45 : 0;
    fragK += (fw - fragK) * Math.min(1, dt * 0.8);
    for (const s of frag) {
      s.visible = fragK > 0.02 && dist(s.userData) < 60;
      if (!s.visible) continue;
      const u = s.userData, t = now / 1000 + u.ph;
      s.position.set(u.x + Math.sin(t * 0.4) * 0.6, G(u) + 0.6 + ((t * 0.18) % 1) * 2.2, u.z + Math.cos(t * 0.33) * 0.6);
      s.material.opacity = fragK * 0.6 * (0.5 + 0.5 * Math.sin(t * 1.3));
    }
    // 날아가는 비둘기
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i]; f.t += dt;
      f.s.position.x += Math.cos(f.a) * f.v * dt; f.s.position.z += Math.sin(f.a) * f.v * dt; f.s.position.y += 2.2 * dt;
      f.s.material.opacity = Math.max(0, 1 - f.t / 2.2);
      if (f.t > 2.2) { root.remove(f.s); flyers.splice(i, 1); }
    }
    // 양
    for (const s of sheep) {
      const p = s.o.position;
      if (!s.tgt) { s.wait -= dt; if (s.wait < 0) s.tgt = inFold(); continue; }
      const dx = s.tgt.x - p.x, dz = s.tgt.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { s.tgt = null; s.wait = 2 + Math.random() * 5; continue; }
      p.x += (dx / d) * 0.45 * dt; p.z += (dz / d) * 0.45 * dt; p.y = G(p);
      s.o.rotation.y = Math.atan2(dx, dz);
    }
    // 거슬러 오는 무리: 못가에 닿으면 성전 쪽에서 다시. 부딪히면 무리가 가는 쪽으로 밀림
    if (streamOn) jews.forEach((n, i) => {
      if (n.wait > 0) { n.wait -= dt; if (n.state === 'walk') { n.state = 'idle'; n.hold = true; } return; }
      if (n.hold) { n.hold = false; n.state = 'walk'; }
      if (n.state !== 'walk') spawnJ(n, i, 0.5);
      if (dist(n) < 1.0 && n.path.length) { const t = n.path[0], dx = t.x - n.x, dz = t.z - n.z, l = Math.hypot(dx, dz) || 1; pushMe((dx / l) * 1.5 * dt, (dz / l) * 1.5 * dt); }
    });
    // 하나씩 나가는 무리 (어른부터, 1.6초 간격). 다 나가면 감춤
    if (accT >= 0) LEAVE.forEach((i, k) => {
      const n = accusers[i];
      if (n.hide) return;
      if (!n.left && now - accT > 900 + k * 1600) { n.left = true; n.leftT = now; n.fixFace = false; n.path = findPath(n, SP.accOut[i]); if (!n.path.length) n.path = [SP.accOut[i]]; n.home = { ...SP.accOut[i] }; n.state = 'walk'; }
      else if (n.left && (n.state !== 'walk' || now - n.leftT > 5000)) n.hide = true; // 뜰 끝에 닿거나 5초 걸어 나가면 감춤
    });
    // 부르는 소리 자리: 숨 쉬듯
    const pulse = 0.5 + 0.5 * Math.sin(now / 380);
    for (const g of vmarks) if (g.visible) { g.userData.m.material.opacity = g.userData.dim ? 0.25 : 0.4 + 0.35 * pulse; g.userData.s.position.y = 2.1 + Math.sin(now / 500) * 0.06; }
  }

  reset();
  return {
    step, reset,
    X: {
      clearStall, nearStall, stallsLeft: () => stalls.filter((s) => !s.cleared).length,
      liftMat: () => { matUp = true; }, stream,
      accusers: accusersOn, accLeave, accGone,
      voiceMarks,
      pushStone, stoneK: () => T.k, lazarusOut, lazarusLater, untie, mournersTo,
      fragrance: (on) => { fragOn = on; }, plant,
      // 앉아 있던 사람을 일으켜 걷게 함 (마리아 11:29)
      npcGo: (k, p) => { const n = N[k]; standNpc(n); n.state = 'idle'; n.path = findPath(n, p); if (!n.path.length) { const q = nearestFree(p) || p; n.x = q.x; n.z = q.z; } n.home = { x: p.x, z: p.z }; n.state = n.path.length ? 'walk' : 'idle'; },
      rise: (k) => { const n = N[k]; standNpc(n); n.state = 'idle'; },
      lazarusFree: (on) => { lzFree = !!on; }, // 부탁 동안 나사로가 식탁 자리를 떠나 걸을 수 있게
    },
  };
}
