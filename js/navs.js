// 네비게이토 예화에서 온 조형물들 (글자 없이 빛과 형상으로만)
//  - 말씀의 다섯 줄기: 곡면 벽 위 다섯 줄기 빛(듣기·읽기·공부·암송·묵상)이 차례로 켜짐
//  - 기도의 다섯 빛: 찬양·감사·자백·중보·간구
//  - 일꾼 배가 순환: 순종 회랑 바닥의 다섯 표식(세계 → 초신자 → 제자 → 일꾼 → 파송)
//  - 핵심가치: 가운데 위에 매달린 열 장의 빛 카드
import * as THREE from 'three';
import { Q, CEIL, WORD_HAND, CYCLE, HISTORY, deg } from './layout.js';
import { showVerse } from './verses.js';

const sculpt = new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 });

function glowMat() {
  return new THREE.MeshStandardMaterial({ color: 0xf3eee5, emissive: 0xffc77a, emissiveIntensity: 0, roughness: 0.6 });
}

export function buildNavigators(scene, anim, interactive) {
  wordHand(scene, anim, interactive);
  prayerLights(scene, anim, interactive);
  cycleMarks(scene, anim);
  coreValues(scene, anim, interactive);
  historyPanels(scene, anim);
}

// ---------- 말씀: 다섯 줄기 빛이 흐르는 곡면 벽 ----------
// 휘어진 흰 벽 위로 다섯 줄기(듣기·읽기·공부·암송·묵상)의 빛이 아래에서 위로 흐름.
// 성경을 읽는 동안 한 줄기씩 켜짐
function wordHand(scene, anim, interactive) {
  const g = new THREE.Group();
  const W = 3.2, H = 4.2, BEND = 0.7;
  const surf = (x) => -BEND * (x / (W / 2)) ** 2; // 가운데가 앞으로 나온 곡면
  const geo = new THREE.BoxGeometry(W, H, 0.16, 32, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + surf(pos.getX(i)));
  geo.computeVertexNormals();
  geo.translate(0, H / 2 + 0.12, 0);
  const wall = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: 0.85 }));
  g.add(wall);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.12, 0.9), sculpt);
  base.position.set(0, 0.06, -0.35);
  g.add(base);

  const lines = [];
  for (let k = 0; k < 5; k++) {
    const pts = [];
    for (let s = 0; s <= 24; s++) {
      const t = s / 24;
      const x = -1.15 + k * 0.42 + 0.38 * Math.sin(t * Math.PI * 1.1 + k * 0.5) - 0.2 * t;
      const y = 0.35 + t * (H - 0.6 - Math.abs(k - 2) * 0.25);
      pts.push(new THREE.Vector3(x, y, surf(x) + 0.1));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xf4efe6, emissive: 0xffc77a, emissiveIntensity: 0.08 }));
    g.add(m);
    lines.push(m);
  }
  // 바닥으로 번지는 빛
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  pool.scale.y = 0.5;
  pool.position.set(0, 0.13, 0.6);
  g.add(pool);

  g.position.set(WORD_HAND.x, 0, WORD_HAND.z);
  g.lookAt(Q.word.x - 2, 0, Q.word.z - 2); // 볼록한 앞면이 성경 받침과 벤치를 향함
  g.traverse((c) => { if (c.isMesh && c !== pool) { c.castShadow = true; c.receiveShadow = true; c.userData.action = 'read'; interactive.push(c); } });
  scene.add(g);

  let lit = 0;
  anim.push((t, ctx, dt) => {
    if (ctx && ctx.reading && ctx.me && Math.hypot(ctx.me.x - WORD_HAND.x, ctx.me.z - WORD_HAND.z) < 10) lit = Math.min(5.5, lit + dt / 2.2);
    else lit = Math.max(0, lit - dt / 4);
    lines.forEach((m, k) => {
      const on = Math.max(0, Math.min(1, lit - k));
      m.material.emissiveIntensity = 0.08 + on * (1.7 + (lit >= 5 ? 0.3 * Math.sin(t * 2 + k) : 0));
    });
    pool.material.opacity = Math.min(1, lit / 5) * 0.3;
  });
}

// ---------- 기도의 다섯 빛 ----------
function prayerLights(scene, anim, interactive) {
  const { x, z } = Q.prayer;
  const colors = [0xfff1c2, 0xffe0a8, 0xf7f3ff, 0xd8ecff, 0xffd6c9]; // 찬양·감사·자백·중보·간구
  const orbs = [];
  colors.forEach((c, k) => {
    const a = deg(-150 + k * 30); // 손 뒤쪽 반원
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.15 }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 16), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    o.add(halo);
    o.position.set(x + Math.cos(a) * 2.3, 4.6 + Math.sin(k * 1.3) * 0.3, z + Math.sin(a) * 2.3);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, CEIL - o.position.y, 4), new THREE.MeshBasicMaterial({ color: 0xcfc8bc }));
    string.position.set(o.position.x, (CEIL + o.position.y) / 2, o.position.z);
    scene.add(o, string);
    const orb = { o, halo, y: o.position.y, manual: 0, pulse: 0 };
    // 빛을 직접 눌러 켜고 끔
    o.userData.onTap = () => { orb.manual = orb.manual ? 0 : 1; orb.pulse = 1; showVerse('orbs', { delay: 1 }); };
    interactive.push(o);
    orbs.push(orb);
  });
  let lit = 0;
  anim.push((t, ctx, dt) => {
    if (ctx && ctx.praying) lit = Math.min(5.5, lit + dt / 2.5);
    else lit = Math.max(0, lit - dt / 5);
    orbs.forEach((b, k) => {
      const on = Math.max(b.manual, Math.max(0, Math.min(1, lit - k)));
      b.pulse = Math.max(0, b.pulse - dt * 1.5);
      b.o.material.opacity = 0.15 + on * 0.8;
      b.halo.material.opacity = on * (0.18 + 0.06 * Math.sin(t * 1.5 + k)) + b.pulse * 0.35;
      b.halo.scale.setScalar(1 + b.pulse * 0.8);
      b.o.position.y = b.y + Math.sin(t * 0.6 + k) * 0.08;
    });
  });
}

// ---------- 일꾼 배가 순환 (회랑 바닥 표식) ----------
function cycleMarks(scene, anim) {
  const draws = [drawGlobe, drawSeed, drawWheel, drawWorker, drawSend];
  const marks = CYCLE.map((p, k) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    g.fillStyle = '#f7f3ec';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#c49a5a';
    g.fillStyle = '#c49a5a';
    g.lineWidth = 9;
    g.lineCap = g.lineJoin = 'round';
    draws[k](g);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffc77a, emissiveMap: tex, emissiveIntensity: 0.05, roughness: 0.7 });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.75, 48), m);
    disc.rotation.x = -Math.PI / 2;
    disc.rotation.z = -deg(p.a) - Math.PI / 2; // 바깥을 등지고 읽히도록
    disc.position.set(p.x, 0.262, p.z);
    scene.add(disc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.86, 48), new THREE.MeshBasicMaterial({ color: 0xffc77a, transparent: true, opacity: 0.25 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.263, p.z);
    scene.add(ring);
    // 밟으면 솟아오르는 빛기둥
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    pillar.position.set(p.x, 3.26, p.z);
    scene.add(pillar);
    return { p, m, ring, pillar, glow: 0, flash: 0 };
  });
  const CYCLE_VERSE = ['c_globe', 'c_seed', 'c_wheel', 'c_worker', 'c_send'];
  // 표식 사이를 잇는 점선 빛(순서대로 밟으면 이어짐)
  const dots = [];
  for (let k = 0; k < 5; k++) {
    const a0 = CYCLE[k].a, a1 = CYCLE[(k + 1) % 5].a + (k === 4 ? 360 : 0);
    const span = ((a1 - a0) + 360) % 360;
    const seg = [];
    for (let s = 1; s < 14; s++) {
      const a = deg(a0 + (span * s) / 14);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), new THREE.MeshBasicMaterial({ color: 0xffc77a, transparent: true, opacity: 0.1 }));
      d.rotation.x = -Math.PI / 2;
      d.position.set(Math.cos(a) * 24.2, 0.262, Math.sin(a) * 24.2);
      scene.add(d);
      seg.push(d);
    }
    dots.push(seg);
  }
  let next = 0; // 다음에 밟을 표식
  let done = 0; // 연결된 구간 수
  let celebrate = 0;
  anim.push((t, ctx, dt) => {
    const me = ctx && ctx.me;
    marks.forEach((mk, k) => {
      const near = me && Math.hypot(me.x - mk.p.x, me.z - mk.p.z) < 1.1;
      if (near && k === next) {
        if (k > 0 || done > 0) done = Math.min(5, done + 1);
        next = (next + 1) % 5;
        mk.glow = 1;
        mk.flash = 1;
        if (done === 5) { celebrate = 8; marks.forEach((o) => { o.flash = 1.4; }); showVerse('wheel', { delay: 0.8, cooldown: 30 }); }
        else showVerse(CYCLE_VERSE[k], { delay: 0.4, cooldown: 45 });
      } else if (near && k === 0 && next !== 0) {
        // 처음부터 다시
        next = 1; done = 0; marks.forEach((o) => { o.glow = 0; }); mk.glow = 1;
      }
      const target = mk.glow;
      mk.flash = Math.max(0, mk.flash - dt * 0.45);
      mk.m.emissiveIntensity = 0.05 + target * (0.9 + 0.2 * Math.sin(t * 2 + k)) + mk.flash * 1.2;
      mk.ring.material.opacity = 0.25 + target * 0.7;
      mk.ring.scale.setScalar(1 + mk.flash * 0.6);
      mk.pillar.material.opacity = Math.min(0.55, mk.flash * 0.6) + (celebrate > 0 ? 0.18 + 0.12 * Math.sin(t * 4 + k) : 0);
      mk.pillar.scale.y = 0.3 + Math.min(1, mk.flash) * 0.7;
    });
    celebrate = Math.max(0, celebrate - dt);
    dots.forEach((seg, k) => {
      const on = k < done;
      seg.forEach((d, s) => {
        const wave = celebrate > 0 ? 0.5 + 0.5 * Math.sin(t * 6 - (k * 14 + s) * 0.35) : 0;
        d.material.opacity = on ? 0.6 + wave * 0.4 : 0.12;
        d.scale.setScalar(on ? 1.4 + wave * 0.8 : 1);
      });
    });
    if (celebrate === 0 && done === 5) { done = 0; next = 0; marks.forEach((o) => { o.glow = 0; }); }
  });
}
function drawGlobe(g) {
  g.beginPath(); g.arc(128, 128, 70, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.ellipse(128, 128, 30, 70, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(58, 128); g.lineTo(198, 128); g.stroke();
  g.beginPath(); g.moveTo(70, 92); g.lineTo(186, 92); g.moveTo(70, 164); g.lineTo(186, 164); g.stroke();
}
function person(g, x, y, s) {
  g.beginPath(); g.arc(x, y - 34 * s, 16 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(x - 26 * s, y + 40 * s); g.quadraticCurveTo(x, y - 30 * s, x + 26 * s, y + 40 * s); g.closePath(); g.fill();
}
function drawSeed(g) { // 초신자: 한 사람과 새싹
  person(g, 112, 140, 1.1);
  g.beginPath(); g.moveTo(178, 190); g.lineTo(178, 140); g.stroke();
  g.beginPath(); g.ellipse(164, 132, 14, 8, -0.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(192, 126, 14, 8, 0.6, 0, Math.PI * 2); g.fill();
}
function drawWheel(g) { // 제자: 수레바퀴
  g.beginPath(); g.arc(128, 128, 72, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(128, 128, 20, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(128, 56); g.lineTo(128, 200); g.moveTo(56, 128); g.lineTo(200, 128); g.stroke();
}
function drawWorker(g) { // 일꾼: 한 사람이 다른 사람을 세움
  person(g, 98, 138, 1.15);
  person(g, 168, 152, 0.85);
  g.beginPath(); g.moveTo(118, 118); g.quadraticCurveTo(140, 100, 156, 112); g.stroke();
}
function drawSend(g) { // 파송: 바깥으로 향하는 화살과 길
  g.beginPath(); g.moveTo(60, 190); g.quadraticCurveTo(110, 120, 190, 70); g.stroke();
  g.beginPath(); g.moveTo(150, 64); g.lineTo(196, 66); g.lineTo(188, 110); g.stroke();
  person(g, 84, 120, 0.7);
}

// ---------- 핵심가치: 천창 빛기둥을 둘러싼 열 장의 빛 유리 ----------
function roundedRect(w, h, r) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 + r, -h / 2);
  sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return sh;
}
function coreValues(scene, anim, interactive) {
  const cards = [];
  const shape = roundedRect(0.8, 1.25, 0.12);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 });
  geo.translate(0, 0, -0.015);
  const edgePts = shape.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0));
  const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePts);
  const strMat = new THREE.MeshBasicMaterial({ color: 0xd8d3ca });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.31;
    const r = 6.6;
    const y = 8.3 + Math.sin(k * 2.1) * 0.35;
    const g = new THREE.Group();
    const glass = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xffe2b0, emissiveIntensity: 0.35, roughness: 0.25, transparent: true, opacity: 0.78 }));
    const edge = new THREE.LineLoop(edgeGeo, new THREE.LineBasicMaterial({ color: 0xe0b46c }));
    edge.position.z = 0.035;
    const edge2 = edge.clone();
    edge2.position.z = -0.035;
    g.add(glass, edge, edge2);
    g.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, CEIL - y - 0.62, 4), strMat);
    line.position.set(g.position.x, (CEIL + y + 0.62) / 2, g.position.z);
    scene.add(g, line);
    const card = { g, glass: glass.material, a, k, spin: 0 };
    // 누르면 한 바퀴 돌며 밝게 빛남
    glass.userData.onTap = () => { card.spin = 1; showVerse('values', { delay: 1.2 }); };
    interactive.push(glass);
    cards.push(card);
  }
  anim.push((t, ctx, dt) => {
    for (const c of cards) {
      c.spin = Math.max(0, c.spin - dt * 0.6);
      const e = 1 - c.spin;
      c.g.rotation.y = -c.a + Math.PI / 2 + Math.sin(t * 0.2 + c.k) * 0.35 + (c.spin > 0 ? (1 - Math.pow(1 - e, 3)) * Math.PI * 2 : 0);
      c.glass.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 0.6 + c.k * 0.63) + c.spin * 1.2;
    }
  });
}

// ---------- 역사: 1960년대부터 지금까지, 한 사람에서 시작된 배가 ----------
// 글자·사진 없이 점(사람)과 선(이어줌)으로 세대가 늘어나는 모습만 그림
function drawGeneration(g, gen) {
  const W = 256, H = 448;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fffaf1');
  bg.addColorStop(1, '#f3ebdd');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(160,112,48,0.75)';
  g.fillStyle = '#a8742f';
  g.lineWidth = 3;
  // 아래에서 위로 자라는 나무 모양의 배가: 한 세대마다 각 점이 둘을 세움
  let level = [{ x: W / 2, y: H - 50 }];
  g.beginPath(); g.arc(W / 2, H - 50, 13, 0, Math.PI * 2); g.fill();
  for (let d = 1; d <= gen; d++) {
    const y = H - 50 - d * ((H - 110) / 6);
    const n = Math.min(level.length * 2, 32);
    const next = [];
    for (let i = 0; i < n; i++) next.push({ x: 24 + ((i + 0.5) * (W - 48)) / n, y });
    next.forEach((p, i) => {
      const par = level[Math.floor((i * level.length) / n)];
      g.beginPath(); g.moveTo(par.x, par.y); g.quadraticCurveTo(par.x, (par.y + p.y) / 2, p.x, p.y); g.stroke();
    });
    const r = Math.max(4.5, 10 - d);
    next.forEach((p) => { g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill(); });
    level = next;
  }
}
function historyPanels(scene, anim) {
  const frames = [];
  HISTORY.forEach((h, k) => {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 448;
    drawGeneration(cv.getContext('2d'), k + 1);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.92), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12, roughness: 0.6 }));
    panel.position.set(0, 1.55, 0.03);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.22, 2.05, 0.06), sculpt);
    back.position.y = 1.55;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), sculpt);
    leg.position.y = 0.25;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.2, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.27, 0.45);
    g.add(back, panel, leg, glow);
    g.position.set(h.x, 0.25, h.z);
    g.lookAt(0, 0.25, 0);
    g.traverse((c) => { if (c.isMesh && c !== glow) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(g);
    frames.push({ m: panel.material, glow, h, lit: 0 });
  });
  // 가까이 가면 패널이 환히 밝아지고 바닥 빛이 번짐
  anim.push((t, ctx, dt) => {
    const me = ctx && ctx.me;
    frames.forEach((f, k) => {
      const near = me && Math.hypot(me.x - f.h.x, me.z - f.h.z) < 3.2;
      f.lit += ((near ? 1 : 0) - f.lit) * Math.min(1, (dt || 0.016) * 3);
      f.m.emissiveIntensity = 0.12 + 0.05 * Math.sin(t * 0.5 + k) + f.lit * 0.75;
      f.glow.material.opacity = 0.2 + f.lit * 0.55;
      f.glow.scale.set(1 + f.lit * 0.6, 1 + f.lit * 1.4, 1);
      if (near && f.lit > 0.6) showVerse('history', { cooldown: 120 });
    });
  });
}
