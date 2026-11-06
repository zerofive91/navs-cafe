// 요한복음 마을 3차 (2026-11): 다락방·수난·부활 사건이 쓰는 도구 (기획서 3.3 표 17~23번)
//   사람들(도마·다른 제자·막달라 마리아·제자들·문 지키는 여종·대제사장의 종·빌라도·예수의 어머니·니고데모·횃불 든 사람·무리),
//   발 씻기기(다락방), 닫히는 문(도마), 검을 칼집에 꽂기·횃불 무리·숯불(동산과 뜰), 무리·향품(관정·골고다·새 무덤),
//   굴러 놓인 무덤 돌과 개켜진 수건(마리아야), 그물과 일백 쉰 세 마리·어린 양(디베랴 바다의 아침)
//   수난 구역(동산과 숯불·다 이루었다)은 어둠·소리를 절제함: 큰 소리·흔들림 없이 횃불과 숯불 그림만
//   reset(): 그만두거나 마치면 사람 자리와 물건을 되돌리고 늦게 도는 타이머를 무효로(gen). 마친 사건의 흔적(열린 무덤, 개켜진 수건,
//   바닷가의 제자들)은 profile.john 기록을 보고 매 프레임 정함 → 새로고침·다른 기기 기록 합치기에도 같은 모습
//   일곱 "나는…" 등불이 다 켜지면 빛의 광장 가운데 빛(스프라이트)이 조금 커짐 (조명 수는 그대로)
//   engine.js가 X에 이 도구들을 더하고 매 프레임 step을 부름
import * as THREE from 'three';
import { nearestFree, findPath } from '../nav.js';
import { SP, TOMB11, LAMP_IDS, PASSION_ZONE, SHORE_ZONE } from './layout.js';

const STILLING = () => document.body.classList.contains('stilling'); // 머무름 묵상(js/stillness.js) 중

export function initPassion({ root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, runId }) {
  const done = (id) => !!profile.john?.ev?.[id]?.done;
  const sitNpc = (n, kind, face) => { n.seat = { kind }; n.state = 'sit'; n.path = []; n.fixFace = true; n.action = null; if (face != null) n.face = face; };
  const standNpc = (n) => { n.seat = null; if (n.state === 'sit') n.state = 'idle'; n.fixFace = false; };
  const putAt = (n, p, free = true) => { const q = (free && nearestFree(p)) || p; n.x = q.x; n.z = q.z; n.home = { x: q.x, z: q.z }; n.path = []; if (n.state === 'walk') n.state = 'idle'; };
  const toward = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const goNpc = (n, p) => { standNpc(n); n.state = 'idle'; n.path = findPath(n, p); if (!n.path.length) { const q = nearestFree(p) || p; n.x = q.x; n.z = q.z; } n.home = { x: p.x, z: p.z }; n.state = n.path.length ? 'walk' : 'idle'; n.action = null; };
  let gen = 0; // reset마다 늘어남: 그만두기·마침 뒤 늦게 도는 타이머를 막음
  const later = (ms, f) => { const g = gen; setTimeout(() => { if (g === gen) f(); }, ms); };
  const act = (a, ms) => { me.action = a; later(ms, () => { if (me.action === a) me.action = null; }); };

  // ---------- 사람들 ----------
  const thomas = person('thomas', '도마', { hoodie: 0x6a7a5a, hair: 0x3b2a22 }, SP.thomasSeat, SP.warmUp);
  const other = person('other', '다른 제자', { hoodie: 0xb89a6a, hair: 0x5a4030 }, SP.otherKidron, SP.gethAt);
  const mag = person('magdalene', '막달라 마리아', { hoodie: 0x8a5a6a, hair: 0x2b211c, style: 1 }, SP.magdalene, TOMB11.rock);
  const nico19 = person('nico19', '니고데모', { hoodie: 0x4a3a6a, hair: 0x8a8070 }, SP.nico19, TOMB11.rock);
  const mother = person('mother19', '예수의 어머니', { hoodie: 0x4a5a7a, hair: 0x7a7068, style: 1 }, SP.mother19, SP.warmCross);
  const pilate = person('pilate', '빌라도', { hoodie: 0x7a2a3a, hair: 0x6a6058 }, SP.pilate, SP.praetAt);
  const maid = person('maid', '문 지키는 여종', { hoodie: 0x9a8a6a, hair: 0x3b2a22, style: 1 }, SP.maid, SP.fireStand);
  const serv = person('servant18', '대제사장의 종', { hoodie: 0x5a4a3a, hair: 0x2b211c }, SP.servant18, SP.fire11);
  const dis13 = SP.dis13.map((p, i) => person('dis13_' + i, '제자', { hoodie: [0x7a6a5a, 0x5a6a7a, 0x8a7a5a, 0x6a5a6a][i], hair: [0x3b2a22, 0x2b211c, 0x5a4030, 0x4a3324][i] }, p, SP.warmUp));
  const torches = SP.torchFrom.map((p, i) => person('torch' + i, '횃불 든 사람', { hoodie: [0x4a4a4a, 0x5a4a3a, 0x3a3a4a][i], hair: 0x2b211c }, p, SP.gethAt));
  const mob = SP.mob.map((p, i) => person('mob' + i, '무리', { hoodie: [0x6a5a4a, 0x5a5a6a, 0x7a6a6a][i], hair: 0x3b2a22 }, p, SP.pilate));
  const dis21 = SP.dis21.map((p, i) => person('dis21_' + i, '제자', { hoodie: [0x8a9a6a, 0x6a7a8a][i], hair: 0x2b211c }, p, SP.fire21));
  for (const n of [...torches, ...mob, mother, nico19]) n.hide = true;
  // 횃불 (18:3 등과 홰): 손에 든 막대와 불빛 스프라이트 (빛은 더하지 않음)
  for (const n of torches) { const f = fxSprite('light_01', 0xffb050, 0.8); f.position.set(0.32, 1.55, 0.25); n.av.add(f); n.flame = f; }
  Object.assign(GREET, {
    dis13_0: '그분이 우리 발을 씻기셨어요(13:5).', dis13_1: '서로 사랑하라 하셨어요(13:34).', dis13_2: '이 방에서 오래 말씀하셨지요.', dis13_3: '내 안에 거하라 하셨어요(15:4).',
    maid: '이 뜰 대문을 지키는 사람이에요.', servant18: '그 때가 추워서 숯불을 피웠어요(18:18).',
    pilate: '나는 그에게서 아무 죄도 찾지 못하노라(18:38).', mother19: '그 제자가 저를 자기 집에 모셨어요(19:27).', nico19: '전에 밤에 그분을 찾아갔던 니고데모예요(19:39).',
    torch0: '…', torch1: '…', torch2: '…', mob0: '…', mob1: '…', mob2: '…',
    dis21_0: '밤새 아무것도 못 잡았어요(21:3).', dis21_1: '그분이 숯불에 생선과 떡을 차려 두셨어요(21:9).',
  });
  // 다락방 북쪽 긴 의자의 제자들, 남쪽 의자의 도마 (모두 식탁을 봄)
  const seatUp = () => { dis13.forEach((n) => sitNpc(n, 'gbench', 0)); };
  seatUp();

  // ---------- 다락방: 발 씻기기 (13:5) ----------
  const washed = new Set();
  const washMarks = [];
  const feetOf = () => [...dis13, thomas].filter((n) => !n.hide);
  const nextFeetN = () => { let b = null, bd = Infinity; for (const n of feetOf()) { if (washed.has(n.key)) continue; const d = dist(n); if (d < bd) { bd = d; b = n; } } return b; };
  const markFeet = (n) => { const s = fxSprite('light_01', 0xcfeaff, 0.32); s.position.set(n.x, G(n) + 0.15, n.z); root.add(s); washMarks.push(s); };
  function washFeet() {
    const n = nextFeetN(); if (!n || dist(n) > 2.0) return false;
    washed.add(n.key); markFeet(n);
    act('plant', 1200); sfx('cup', 0.18, 0.75 + washed.size * 0.04); burst(n.x, G(n) + 0.5, n.z);
    return feetOf().every((x) => washed.has(x.key));
  }
  function washPeter() { const n = N.peter; markFeet(n); act('plant', 1300); sfx('cup', 0.2, 0.9); burst(n.x, G(n) + 0.5, n.z); n.action = 'wave'; later(2600, () => { if (n.action === 'wave') n.action = null; }); }
  let doorShut = false, thomasAway = false;
  function thomasAt(away, where) {
    thomasAway = !!away;
    if (away) { standNpc(thomas); thomas.hide = true; return; }
    thomas.hide = false;
    if (where === 'door') { standNpc(thomas); thomas.state = 'idle'; putAt(thomas, SP.upIn); thomas.face = toward(thomas, SP.up10); }
  }
  function thomasSit() { thomas.hide = false; thomasAway = false; putAt(thomas, SP.thomasSeat, false); sitNpc(thomas, 'gbench', Math.PI); }

  // ---------- 동산과 숯불 (18장): 베드로의 검, 횃불 무리 ----------
  let swordOn = false, peterMoved = false, torchOn = false;
  // 베드로의 검 (18:10): 동산에서만 손에 보임
  let swordMesh = null;
  {
    const hand = N.peter?.av.userData.arms?.[1];
    if (hand) {
      const g = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.012), new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.3, metalness: 0.8 })); blade.position.set(0, -0.36, 0.12); g.add(blade);
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 })); hilt.position.set(0, -0.04, 0.12); g.add(hilt);
      g.position.set(0, -0.41, 0.06); g.rotation.x = -1.2; g.visible = false; hand.add(g); swordMesh = g;
    }
  }
  function peterAt(where) {
    const n = N.peter; if (!n) return;
    peterMoved = true; standNpc(n);
    if (where === 'geth') { swordOn = true; n.state = 'idle'; putAt(n, SP.peterGeth); n.face = toward(n, SP.torchAt[1]); n.fixFace = true; }
    else if (where === 'court') { swordOn = false; n.fixFace = false; goNpc(n, SP.peterFire); }
  }
  function sheathe() {
    swordOn = false; sfx('impact/impactWood_light_000', 0.16, 1.2); burst(N.peter.x, G(N.peter) + 1.0, N.peter.z);
    const n = N.peter; n.fixFace = false; n.face = toward(n, me);
  }
  function torchesTo(where) {
    torchOn = !!where;
    torches.forEach((n, i) => {
      if (!where) { n.hide = true; n.path = []; n.state = 'idle'; putAt(n, n.home0, false); return; }
      n.hide = false; standNpc(n);
      if (where === 'geth') { putAt(n, SP.torchFrom[i], false); goNpc(n, SP.torchAt[i]); }
      else goNpc(n, SP.torchCourt[i]);
    });
  }

  // ---------- 관정·골고다·새 무덤 (18:28-19:42) ----------
  let mobOn = false, motherOn = false, nicoOn = false, spiced = false;
  function mobSet(on) { mobOn = !!on; mob.forEach((n, i) => { putAt(n, SP.mob[i], false); n.face = toward(n, SP.pilate); n.fixFace = !!on; }); }
  function motherSet(on) { motherOn = !!on; putAt(mother, SP.mother19, false); mother.face = toward(mother, SP.warmCross); mother.fixFace = !!on; }
  function nicoSet(on) { nicoOn = !!on; standNpc(nico19); nico19.follow = false; putAt(nico19, SP.nico19, false); }
  function spice() { spiced = true; sfx('orb', 0.2, 0.85); burst(SP.tombFront.x, G(SP.tombFront) + 0.6, SP.tombFront.z); act('plant', 1200); }

  // ---------- 마리아야 (20:1-18): 돌, 개켜진 수건, 우는 마리아 ----------
  let clothSeen = false;
  const T = { shown: done('mary') ? 1 : 0 };
  function maryCry(on) { standNpc(mag); mag.state = 'idle'; putAt(mag, on ? SP.maryCry : mag.home0, false); mag.face = on ? toward(SP.maryCry, TOMB11.rock) : mag.face0; mag.fixFace = !!on; }

  // ---------- 디베랴 바다의 아침 (21장): 그물, 고기, 어린 양 ----------
  const NET = { casts: 0, full: false, fish: 0 };
  function castNet(right) {
    act('sow', 1100); sfx('cup', 0.18, 0.6);
    const n = parts.net21; if (n) { n.g.visible = true; n.g.userData.t = 0; }
    if (!right) { NET.casts++; later(900, () => toast(NET.casts >= 2 ? '밤새 던져도 빈 그물이에요 (21:3)' : '아무것도 없어요', 3)); return NET.casts >= 2; }
    NET.full = true; NET.fish = 20; burst(SP.castR.x, G(SP.castR) + 0.6, SP.castR.z);
    later(700, () => toast('고기가 많아 그물을 들 수 없어요 (21:6)', 4));
    return true;
  }
  function pullNet() {
    act('draw', 900); sfx('impact/impactSoft_heavy_000', 0.16, 0.8 + NET.fish / 400);
    NET.fish = Math.min(153, NET.fish + 34 + (NET.fish > 100 ? 15 : 0));
    burst(SP.castR.x, G(SP.castR) + 0.5, SP.castR.z);
    return NET.fish >= 153;
  }
  const lambs = (parts.lambs || []).map((o, i) => ({ o, fed: false, t: 0, p: SP.lambs[i] }));
  const nextLambL = () => { let b = null, bd = Infinity; for (const l of lambs) { if (l.fed) continue; const d = dist(l.p); if (d < bd) { bd = d; b = l; } } return b; };
  function feedLamb() {
    const l = nextLambL(); if (!l || dist(l.p) > 2.2) return false;
    l.fed = true; l.t = 0; act('plant', 1100); sfx('tap', 0.2, 1.1 + lambs.filter((x) => x.fed).length * 0.08); burst(l.p.x, G(l.p) + 0.6, l.p.z);
    return lambs.every((x) => x.fed);
  }

  // ---------- 쉼 (묵상과 기록만): 앉아서 sec초 머무르면 다음으로. 머무름 묵상을 하는 동안은 끝날 때까지 기다림 ----------
  function rested(r, dt, p, rad, sec) {
    if (me.state === 'sit' && dist(p) < rad) r.t = (r.t || 0) + dt;
    return (r.t || 0) >= sec && !STILLING();
  }

  // ---------- 되돌리기 (그만두기·마침·처음) ----------
  function reset() {
    gen++;
    washed.clear(); for (const s of washMarks.splice(0)) root.remove(s);
    doorShut = false; if (parts.basin) for (const m of parts.basin) m.visible = true;
    thomasSit(); seatUp();
    swordOn = false; torchesTo(false);
    if (peterMoved && N.peter) { const n = N.peter; n.path = []; n.state = 'idle'; n.seat = null; n.fixFace = false; n.action = null; peterMoved = false; }
    other.path = []; other.state = 'idle'; other.follow = false;
    mobSet(false); motherSet(false); nicoSet(false); spiced = false;
    clothSeen = false; maryCry(false);
    NET.casts = 0; NET.full = false; NET.fish = 0; if (parts.net21) parts.net21.g.visible = false;
    for (const l of lambs) { l.fed = false; l.t = 0; }
    for (const n of [maid, serv, pilate]) { n.path = []; n.state = 'idle'; putAt(n, n.home0, false); }
  }

  // ---------- 매 프레임 ----------
  let last = 0, haloK = 0;
  function step(town) {
    const now = performance.now(), dt = last ? Math.min(0.25, (now - last) / 1000) : 0; last = now;
    if (!town) return;
    const rid = runId();
    // 사건 때만 나오는 사람들 (마친 뒤에는 조용한 자리로)
    for (const n of [maid, serv]) n.hide = !(rid === 'arrest' || !done('arrest'));
    pilate.hide = !(rid === 'truth' || !done('truth'));
    torches.forEach((n) => { n.hide = !(rid === 'arrest' && torchOn); if (n.flame) n.flame.material.opacity = 0.75 + 0.25 * Math.sin(now / 90 + n.x); });
    for (const n of mob) n.hide = !(rid === 'truth' && mobOn);
    mother.hide = !(rid === 'truth' && motherOn);
    nico19.hide = !(rid === 'truth' && nicoOn);
    for (const n of dis21) n.hide = !(rid === 'morning' || done('morning'));
    thomas.hide = rid === 'thomas' && thomasAway;
    if (swordMesh) swordMesh.visible = swordOn && rid === 'arrest';
    // 다락방 문 (도마 이야기에서만 닫힘), 대야 (들고 있는 동안 감춤은 engine carry)
    if (parts.upDoor) parts.upDoor.visible = doorShut && rid === 'thomas';
    // 무덤 돌: 마리아야를 하는 동안과 마친 뒤에는 굴러 놓임
    const want = rid === 'mary' || (rid !== 'truth' && done('mary')) ? 1 : 0;
    T.shown += (want - T.shown) * Math.min(1, dt * 2.5);
    if (parts.tomb11Stone) {
      const a = TOMB11.stone, b = TOMB11.rolled, k = T.shown;
      parts.tomb11Stone.position.x = a.x + (b.x - a.x) * k; parts.tomb11Stone.position.z = a.z + (b.z - a.z) * k;
      parts.tomb11Disc.rotation.y = (k * Math.hypot(b.x - a.x, b.z - a.z)) / 1.02;
    }
    if (parts.cloth11) parts.cloth11.visible = rid === 'mary' ? clothSeen : done('mary');
    // 숯불 깜빡임
    for (const f of [parts.fire11, parts.fire21]) if (f) { f.flame.material.opacity = 0.7 + 0.3 * Math.sin(now / 120 + f.g.position.x); f.flame.scale.y = 0.95 + 0.12 * Math.sin(now / 170); }
    // 그물과 고기
    if (parts.net21) {
      const n = parts.net21, showFish = rid === 'morning' && NET.full;
      if (rid !== 'morning') n.g.visible = false;
      n.fish.count = showFish ? Math.max(1, Math.round((60 * NET.fish) / 153)) : 0;
      if (n.g.visible) { n.g.userData.t = (n.g.userData.t || 0) + dt; n.g.position.y = -0.42 + 0.04 + Math.sin(now / 600) * 0.02; }
    }
    // 어린 양: 먹이면 고개를 숙여 먹음
    for (const l of lambs) {
      const head = l.o.children[1];
      if (l.fed && l.t < 2.4) { l.t += dt; if (head) head.position.y = 0.62 - 0.22 * Math.sin(Math.min(1, l.t / 0.4) * Math.PI / 2) * (l.t < 2 ? 1 : (2.4 - l.t) / 0.4); }
      else if (head) head.position.y = 0.62;
    }
    // 일곱 등불이 다 켜지면 광장 가운데 빛이 조금 커짐 (스프라이트 크기만)
    const all7 = LAMP_IDS.every((l) => profile.john?.lamps?.includes(l));
    haloK += ((all7 ? 1 : 0) - haloK) * Math.min(1, dt * 0.6);
    if (parts.plazaHalo) { const s = 4.2 + 2.4 * haloK + (all7 ? Math.sin(now / 900) * 0.15 : 0); parts.plazaHalo.scale.set(s, s, 1); }
  }

  reset();
  return {
    step, reset,
    X: {
      passionZone: PASSION_ZONE, shoreZone: SHORE_ZONE, rested, later, tombMouth: TOMB11.mouth, myName: () => profile.name || '',
      // 다락방
      door: (on) => { doorShut = !!on; if (on) sfx('impact/impactWood_light_000', 0.14, 0.7); },
      basin: (on) => { if (parts.basin) for (const m of parts.basin) m.visible = !!on; },
      washed: () => washed.size, nextFeet: () => nextFeetN() || N.peter, washFeet, washPeter,
      thomasAway: thomasAt, thomasSit,
      // 동산과 숯불
      peterAt, sheathe, torches: torchesTo,
      // 다 이루었다
      mob: mobSet, mother: motherSet, nicoCome: nicoSet, spice, spiced: () => spiced,
      // 마리아야
      clothShow: () => { clothSeen = true; }, maryCry,
      // 디베랴 바다의 아침
      casts: () => NET.casts, castNet, pullNet, fishN: () => NET.fish,
      lambsLeft: () => lambs.filter((l) => !l.fed).length, nextLamb: () => (nextLambL() || lambs[0] || { p: SP.fireSeat }).p, feedLamb,
    },
  };
}
