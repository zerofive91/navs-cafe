// 요한복음 마을 2차 가 (2026-11): 갈릴리·사마리아 사건이 쓰는 도구 (기획서 3.3 표 6·7·9·10·11번)
//   사람들(사마리아 여인·수가 사람·왕의 신하와 종·빌립·안드레·아이·베드로·무리), 따뜻한 빛 여럿(예수님은 빛으로만),
//   배와 노 젓기(밤바다), 떠나가는 무리(거슬러 걷기), 잔디에 앉는 무리와 남은 조각 열둘(오병이어), 물결 안개(흐림 걷어내기),
//   빛의 광장 "나는…" 등잔 불꽃(그림만, 조명 수는 그대로)
//   engine.js가 X에 이 도구들을 더하고 매 프레임 step을 부름. 사건 데이터는 events.js
import * as THREE from 'three';
import { isFree } from '../layout.js';
import { nearestFree, findPath } from '../nav.js';
import { fmtMoney } from '../profile.js';
import { SP, BOAT, GROUPS5, WATER_Y, LAMP_IDS, LAKE_AT } from './layout.js';

export function initGalilee({ root, me, parts, N, person, GREET, toast, sfx, burst, fxSprite, dist, G, profile, noBlur }) {
  // ---------- 사람들 ----------
  person('woman', '사마리아 여인', { hoodie: 0xa86a5a, hair: 0x3b2a22, style: 1 }, SP.woman, SP.warm6);
  SP.vil.forEach((p, i) => person('vil' + i, '수가 사람', { hoodie: [0x8a7a5a, 0x6a7a8a, 0x9a6a4a][i], hair: 0x2b211c, style: i === 1 ? 1 : 0 }, p, SP.woman));
  person('official', '왕의 신하', { hoodie: 0x6a4a8a, hair: 0x4a3a30 }, SP.official, SP.warm3);
  person('son', '신하의 아들', { hoodie: 0xd8c8a0, hair: 0x3b2a22 }, SP.son, SP.seat4);
  N.son.av.scale.setScalar(0.82);
  const servants = SP.servants.map((p, i) => person('serv' + i, '신하의 종', { hoodie: i ? 0xb8a888 : 0xa89878, hair: 0x2b211c }, p, SP.servPath[1]));
  servants.forEach((n) => { n.hide = true; n.slow = 0.75; });
  person('peter', '베드로', { hoodie: 0x5a7a9a, hair: 0x5a4030 }, SP.peterShore, SP.warm4);
  person('philip', '빌립', { hoodie: 0x7a9a6a, hair: 0x3b2a22 }, SP.philip, SP.warm5);
  person('andrew5', '안드레', { hoodie: 0x6a8aa8, hair: 0x4a3324 }, SP.andrew5, SP.boy);
  person('boy', '아이', { hoodie: 0xc8a060, hair: 0x2b211c }, SP.boy, SP.andrew5);
  N.boy.av.scale.setScalar(0.72);
  Object.assign(GREET, {
    vil0: '야곱의 우물 물은 깊고 시원해요. 한낮엔 아무도 길으러 오지 않지요.',
    vil1: '그리심 산이 보이지요? 우리 조상들은 이 산에서 예배했어요.',
    vil2: '밭이 누렇게 익어 가요. 추수까지는 넉 달은 더 걸릴 거래요.',
    son: '어제 칠 시에 열이 떨어졌어요! 이제 다 나았어요.',
    serv0: '주인님이 기다리세요.', serv1: '어서 집으로 가요.',
    andrew5: '저는 시몬 베드로의 형제 안드레예요. 저 아이 곁에 있어요.', boy: '엄마가 싸 준 보리떡이에요.',
  });
  // 오병이어 무리 (잔디 세 곳에 셋씩)와 회당에서 떠나가는 무리 — 사건 동안만 보임
  const OFF = [[-1.1, 0.5], [1.0, 0.6], [0, -1.0]];
  const groups = GROUPS5.map((g, gi) => ({
    g, seated: false, fed: false,
    npcs: OFF.map(([dx, dz], j) => person(`grp${gi}${j}`, '무리', { hoodie: [0x8a6a5a, 0x6a7a6a, 0x9a8a6a, 0x7a6a8a][(gi + j) % 4], hair: 0x2b211c, style: (gi + j) % 2 }, { x: g.x + dx, z: g.z + dz }, SP.warm5)),
  }));
  for (const gr of groups) for (const n of gr.npcs) n.hide = true;
  const flowNpcs = SP.synIn.map((p, i) => person('flow' + i, '무리', { hoodie: [0x7a6a5a, 0x6a6a7a, 0x8a6a6a, 0x6a7a5a, 0x7a5a6a][i] }, p, SP.synOut[0]));
  flowNpcs.forEach((n) => { n.hide = true; n.slow = 0.62; });

  // ---------- 따뜻한 빛 (그분이 계신 자리): 사건마다 하나씩, 그림(스프라이트)만 ----------
  const warms = {};
  function warm(key, p, h = 1.5) {
    let w = warms[key];
    if (!p) { if (w) w.visible = false; return; }
    if (!w) { w = warms[key] = parts.warm.clone(); root.add(w); }
    const o = parts.warm.children[0].position;
    w.position.set(p.x - o.x, (p.y ?? G(p)) + h - o.y, p.z - o.z);
    w.visible = true;
  }

  // ---------- 배 (밤바다, 요 6:16-21) ----------
  const boat = parts.boat, R = BOAT.route;
  const segL = []; let total = 0;
  for (let i = 1; i < R.length; i++) { const L = Math.hypot(R[i].x - R[i - 1].x, R[i].z - R[i - 1].z); segL.push(L); total += L; }
  const along = (t) => {
    let d = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < segL.length; i++) {
      if (d <= segL[i] || i === segL.length - 1) { const a = R[i], b = R[i + 1], k = Math.min(1, d / segL[i]); return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, a: Math.atan2(b.x - a.x, b.z - a.z) }; }
      d -= segL[i];
    }
    return { x: R[0].x, z: R[0].z, a: 0 };
  };
  const SEAT_TOP = WATER_Y + 0.73; // 배 앉는 판 높이 + 앉은 자세 (main.js stepChar: seat.top - 0.14)
  const B = { on: false, t: 0, idle: 0, glide: false, landed: false, warned: false, light: -1, seat: null, parkedW: false, peterSeat: { kind: 'jboat', top: SEAT_TOP, approach: SP.peterShore } };
  const ROW = BOAT.mid / 10; // 노 한 번 (십여 리쯤을 열 번으로)
  const local = (p, lz, lx = 0) => ({ x: p.x + Math.sin(p.a) * lz + Math.cos(p.a) * lx, z: p.z + Math.cos(p.a) * lz - Math.sin(p.a) * lx });
  function board() {
    const p = along(0);
    B.on = true; B.t = 0; B.idle = 0; B.glide = false; B.landed = false; B.warned = false; B.light = -1;
    B.seat = { x: p.x, z: p.z, face: p.a, kind: 'jboat', top: SEAT_TOP, approach: { x: BOAT.dockE.x, z: BOAT.dockE.z }, taken: true };
    me.path = []; me.task = null; me.action = null; me.seat = B.seat; me.state = 'sit';
    const pn = N.peter; pn.path = []; pn.state = 'sit'; pn.seat = B.peterSeat; pn.fixFace = true;
    sfx('impact/impactWood_light_000', 0.2, 0.9);
  }
  function row() {
    if (!B.on || B.glide) return false;
    B.t = Math.min(BOAT.mid, B.t + ROW); B.idle = 0;
    sfx('cup', 0.14, 0.55 + Math.random() * 0.1);
    for (const o of boat.userData.oars) o.userData.k = 1;
    return B.t >= BOAT.mid - 1e-6;
  }
  const rows = () => Math.min(10, Math.floor((B.t + 1e-6) / ROW));
  function glide() { B.glide = true; }
  function offBoat(to) {
    if (me.seat === B.seat) { me.seat = null; me.state = 'idle'; }
    const q = nearestFree(to) || to; me.x = q.x; me.z = q.z; me.y = G(q);
    const pn = N.peter; pn.seat = null; pn.state = 'idle'; pn.fixFace = false; pn.path = [];
    if (pn.home0) { pn.x = pn.home0.x; pn.z = pn.home0.z; pn.home = { ...pn.home0 }; } // 호수 가운데 남지 않게 (land()는 아래서 다시 옮김)
    B.on = false; B.glide = false;
  }
  function land() {
    offBoat(BOAT.dockW); B.parkedW = true; // 배는 가버나움 물가에 매어 두고, 멀어지면 벳새다 쪽으로 돌려놓음

    const pn = N.peter, q = nearestFree(BOAT.dockW) || BOAT.dockW; pn.x = q.x + 1.2; pn.z = q.z + 0.6;
    pn.path = findPath(pn, SP.peterSyn); pn.home = { x: SP.peterSyn.x, z: SP.peterSyn.z }; pn.state = pn.path.length ? 'walk' : 'idle';
  }
  function resetBoat() {
    if (B.on) offBoat(B.t < 0.5 ? BOAT.dockE : BOAT.dockW);
    B.t = 0; B.landed = false; B.light = -1; warm('sea', null);
    if (B.parkedW) return;
    const p = along(0); boat.position.set(p.x, WATER_Y + 0.05, p.z); boat.rotation.set(0, p.a, 0);
  }
  // 빛이 물 위로 다가옴 (0 멀리 → 1 배 곁)
  const lightFar = { x: LAKE_AT.x - 6, z: LAKE_AT.z - 30 };
  function seaLight(k) { B.light = k; }

  // ---------- 떠나가는 무리 (회당, 요 6:66) ----------
  let flowOn = false;
  const spawn = (n, i, late = 0) => {
    const s = SP.synIn[i % SP.synIn.length];
    n.x = s.x + Math.sin(i * 2.3) * 0.4; n.z = s.z + Math.cos(i * 1.7) * 0.4; n.home = { x: n.x, z: n.z };
    n.path = SP.synOut.map((p, k) => ({ x: p.x + (k ? Math.sin(i * 1.3 + k) * 0.7 : 0), z: p.z }));
    n.state = 'walk'; n.wait = late;
  };
  function flow(on) {
    flowOn = on;
    flowNpcs.forEach((n, i) => { n.hide = !on; if (on) spawn(n, i, i * 0.7); else { n.path = []; n.state = 'idle'; n.x = n.home0.x; n.z = n.home0.z; n.home = { ...n.home0 }; } });
  }
  function pushMe(dx, dz) {
    if (me.seat) return;
    const nx = me.x + dx, nz = me.z + dz;
    if (isFree(nx, nz)) { me.x = nx; me.z = nz; } else if (isFree(nx, me.z)) me.x = nx; else if (isFree(me.x, nz)) me.z = nz;
  }

  // ---------- 잔디에 앉는 무리, 나눠 줌, 남은 조각 (오병이어, 요 6:10-13) ----------
  function groupsOn(on) {
    for (const gr of groups) {
      gr.seated = false; gr.fed = false;
      for (const n of gr.npcs) { n.hide = !on; n.seat = null; n.state = 'idle'; n.fixFace = false; n.action = null; }
    }
  }
  function seatGroup(gr) {
    gr.seated = true;
    for (const n of gr.npcs) { n.seat = { kind: 'floor' }; n.state = 'sit'; n.fixFace = true; n.face = Math.atan2(SP.warm5.x - n.x, SP.warm5.z - n.z); }
    sfx('tap', 0.18, 1.1); burst(gr.g.x, G(gr.g) + 1, gr.g.z);
  }
  function feedGroup(gr) {
    gr.fed = true;
    for (const n of gr.npcs) { n.action = 'eat'; setTimeout(() => { if (n.action === 'eat') n.action = null; }, 2600); }
    sfx('cup', 0.2, 1.1); burst(gr.g.x, G(gr.g) + 1.1, gr.g.z);
  }
  const nearestGroup = (pred) => { let b = null, bd = Infinity; for (const gr of groups) { if (!pred(gr)) continue; const d = dist(gr.g); if (d < bd) { bd = d; b = gr; } } return b; };
  const crumbMat = new THREE.MeshStandardMaterial({ color: 0xd8a85a, roughness: 0.9 });
  const crumbs = [];
  function crumbsOn(on) {
    for (const c of crumbs.splice(0)) root.remove(c.g);
    if (!on) return;
    groups.forEach((gr, gi) => {
      for (let k = 0; k < 4; k++) {
        const a = gi * 1.7 + k * (Math.PI / 2) + 0.4, rr = 2.1 + (k % 2) * 0.9;
        const p = nearestFree({ x: gr.g.x + Math.cos(a) * rr, z: gr.g.z + Math.sin(a) * rr }) || gr.g;
        const g = new THREE.Group(); g.position.set(p.x, G(p) + 0.06, p.z);
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), crumbMat); m.scale.set(1.3, 0.6, 1); g.add(m);
        const s = fxSprite('light_01', 0xfff0b0, 0.7); s.position.y = 0.25; g.add(s);
        root.add(g); crumbs.push({ g, p, got: false });
      }
    });
  }
  const crumbsLeft = () => crumbs.filter((c) => !c.got).length;
  const nearestCrumb = () => { let b = null, bd = Infinity; for (const c of crumbs) { if (c.got) continue; const d = dist(c.p); if (d < bd) { bd = d; b = c; } } return b ? b.p : SP.warm5; };

  // ---------- 물결 안개 (흐림 걷어내기) ----------
  const fogEl = document.createElement('div'); fogEl.id = 'jfog'; fogEl.hidden = true; document.body.appendChild(fogEl);
  let fogK = 0;
  function fog(k) { fogK = k; fogEl.hidden = !(k > 0.01); document.body.style.setProperty('--jfog', k.toFixed(3)); document.body.classList.toggle('jn-noblur', noBlur()); }

  // ---------- 매 프레임 ----------
  let last = 0;
  function step(town) {
    const now = performance.now(), dt = last ? Math.min(0.25, (now - last) / 1000) : 0; last = now;
    fogEl.hidden = !(town && fogK > 0.01);
    // 광장 등잔: 켠 "나는…" 등불만 불꽃 (사건을 마치면 profile.john.lamps에 더해짐)
    const lit = profile.john.lamps;
    parts.plazaFlames.forEach((f, i) => { f.visible = lit.includes(LAMP_IDS[i]); if (f.visible) f.scale.y = 1.2 + Math.sin(now / 130 + i) * 0.08; });
    if (!town) return;
    // 배
    if (!B.on && B.parkedW && dist(BOAT.dockE) > 70 && dist(BOAT.dockW) > 45) { B.parkedW = false; resetBoat(); }
    if (B.on) {
      if (B.glide) { B.t = Math.min(1, B.t + dt * 0.14); if (B.t >= 1) B.landed = true; }
      else if (B.t > 0 && (B.idle += dt) > 1.4) B.t = Math.max(0, B.t - ROW * 0.22 * dt); // 큰 바람: 젓지 않으면 조금씩 밀려남 (6:18)
      const p = along(B.t), calm = B.glide || B.landed;
      boat.position.set(p.x, WATER_Y + 0.05 + (calm || noBlur() ? 0 : Math.sin(now / 420) * 0.06), p.z);
      boat.rotation.set(calm || noBlur() ? 0 : Math.sin(now / 610) * 0.03, p.a, calm || noBlur() ? 0 : Math.sin(now / 520) * 0.07);
      for (const o of boat.userData.oars) { o.userData.k = Math.max(0, (o.userData.k || 0) - dt * 1.6); o.rotation.x = Math.sin((1 - o.userData.k) * Math.PI) * 0.5 * (o.userData.k > 0 ? 1 : 0); }
      const ms = local(p, -1.2), ps = local(p, 0.6);
      if (me.seat !== B.seat) { // 일어서면(조이스틱·일어서기) 다시 배에 앉힘
        me.path = []; me.task = null; me.seat = B.seat; me.state = 'sit';
        if (!B.warned) { B.warned = true; toast('바다 한가운데예요. 배에 앉아 노를 저어요', 3); }
      }
      B.seat.x = ms.x; B.seat.z = ms.z; B.seat.face = p.a; B.seat.approach = { x: (B.t < 0.5 ? BOAT.dockE : BOAT.dockW).x, z: (B.t < 0.5 ? BOAT.dockE : BOAT.dockW).z };
      me.x = ms.x; me.z = ms.z; me.face = p.a;
      const pn = N.peter; pn.home = { x: ps.x, z: ps.z }; pn.x = ps.x; pn.z = ps.z; pn.face = p.a; pn.state = 'sit'; pn.seat = B.peterSeat;
      // 물 위로 다가오는 빛
      if (B.light >= 0) {
        const ahead = local(p, 4.5, 1.5), k = B.light;
        warm('sea', { x: lightFar.x + (ahead.x - lightFar.x) * k, z: lightFar.z + (ahead.z - lightFar.z) * k, y: WATER_Y + 0.2 });
      }
    }
    // 떠나가는 무리: 문밖으로 나가면 회당 안에서 다시. 부딪히면 무리 쪽으로 밀림
    if (flowOn) flowNpcs.forEach((n, i) => {
      if (n.wait > 0) { n.wait -= dt; if (n.state === 'walk') { n.state = 'idle'; n.hold = true; } return; }
      if (n.hold) { n.hold = false; n.state = 'walk'; }
      if (n.state !== 'walk') spawn(n, i, 0.3);
      const d = dist(n);
      if (d < 1.0 && n.path.length) { const t = n.path[0], dx = t.x - n.x, dz = t.z - n.z, L = Math.hypot(dx, dz) || 1; pushMe((dx / L) * 1.5 * dt, (dz / L) * 1.5 * dt); }
    });
    // 남은 조각: 곁을 지나면 거둠
    for (const c of crumbs) {
      if (c.got) continue;
      c.g.rotation.y += dt;
      if (dist(c.p) < 1.4) { c.got = true; c.g.visible = false; sfx('tap', 0.18, 1.2 + (12 - crumbsLeft()) * 0.04); burst(c.p.x, G(c.p) + 0.6, c.p.z); }
    }
  }

  function reset() {
    resetBoat(); flow(false); groupsOn(false); crumbsOn(false); fog(0);
    for (const k of Object.keys(warms)) warm(k, null);
    servants.forEach((n) => { n.hide = true; n.path = []; n.state = 'idle'; n.x = n.home0.x; n.z = n.home0.z; n.home = { ...n.home0 }; });
  }
  resetBoat();

  return {
    step, reset, fx: () => fogK > 0.01 || (B.on && !B.glide),
    X: {
      warm, board, row, rows, glide, landed: () => B.landed, inBoat: () => B.on, boatAt: () => along(B.t), seaLight,
      flow, push: pushMe, groupsOn, seatGroup, feedGroup, nearestGroup, groupsAll: (pred) => groups.every(pred), groups,
      crumbsOn, crumbsLeft, nearestCrumb, fog,
      servantsStop: () => servants.forEach((n) => { n.path = []; n.state = 'idle'; n.home = { x: n.x, z: n.z }; }),
      land,
      servants: (on) => { servants.forEach((n, i) => { n.hide = !on; if (on) { n.path = SP.servPath.map((p) => ({ x: p.x + i * 0.9, z: p.z + i * 0.5 })); n.state = 'walk'; n.home = { ...n.path[n.path.length - 1] }; } }); },
      wallet: () => fmtMoney(profile.coins || 0),
    },
  };
}
