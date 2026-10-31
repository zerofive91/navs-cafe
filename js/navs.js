// 네비게이토 예화에서 온 조형물들 (글자 없이 빛과 형상으로만)
//  - 말씀의 다섯 줄기: 곡면 벽 위 다섯 줄기 빛(듣기·읽기·공부·암송·묵상)이 차례로 켜짐
//  - 기도의 다섯 빛: 찬양·감사·자백·중보·간구
//  - 일꾼 배가 순환: 순종 회랑 바닥의 다섯 표식(세계 → 초신자 → 제자 → 일꾼 → 파송)
//  - 핵심가치: 가운데 위에 매달린 열 장의 빛 카드
import * as THREE from 'three';
import { Q, CEIL, WORD_HAND, CYCLE, deg } from './layout.js';

const sculpt = new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 });

function glowMat() {
  return new THREE.MeshStandardMaterial({ color: 0xf3eee5, emissive: 0xffc77a, emissiveIntensity: 0, roughness: 0.6 });
}

export function buildNavigators(scene, anim, interactive) {
  wordHand(scene, anim, interactive);
  prayerLights(scene, anim);
  cycleMarks(scene, anim);
  coreValues(scene, anim);
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
    if (ctx && ctx.reading) lit = Math.min(5.5, lit + dt / 2.2);
    else lit = Math.max(0, lit - dt / 4);
    lines.forEach((m, k) => {
      const on = Math.max(0, Math.min(1, lit - k));
      m.material.emissiveIntensity = 0.08 + on * (1.7 + (lit >= 5 ? 0.3 * Math.sin(t * 2 + k) : 0));
    });
    pool.material.opacity = Math.min(1, lit / 5) * 0.3;
  });
}

// ---------- 기도의 다섯 빛 ----------
function prayerLights(scene, anim) {
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
    orbs.push({ o, halo, y: o.position.y });
  });
  let lit = 0;
  anim.push((t, ctx, dt) => {
    if (ctx && ctx.praying) lit = Math.min(5.5, lit + dt / 2.5);
    else lit = Math.max(0, lit - dt / 5);
    orbs.forEach((b, k) => {
      const on = Math.max(0, Math.min(1, lit - k));
      b.o.material.opacity = 0.15 + on * 0.8;
      b.halo.material.opacity = on * (0.18 + 0.06 * Math.sin(t * 1.5 + k));
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
    return { p, m, ring, glow: 0 };
  });
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
        if (done === 5) celebrate = 6;
      } else if (near && k === 0 && next !== 0) {
        // 처음부터 다시
        next = 1; done = 0; marks.forEach((o) => { o.glow = 0; }); mk.glow = 1;
      }
      const target = mk.glow;
      mk.m.emissiveIntensity = 0.05 + target * (0.55 + 0.1 * Math.sin(t * 2 + k));
      mk.ring.material.opacity = 0.25 + target * 0.6;
    });
    celebrate = Math.max(0, celebrate - dt);
    dots.forEach((seg, k) => {
      const on = k < done;
      seg.forEach((d, s) => {
        const wave = celebrate > 0 ? 0.5 + 0.5 * Math.sin(t * 6 - (k * 14 + s) * 0.35) : 0;
        d.material.opacity = on ? 0.55 + wave * 0.45 : 0.1;
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

// ---------- 핵심가치: 매달린 열 장의 빛 카드 ----------
function coreValues(scene, anim) {
  const cards = [];
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe9c4, emissiveIntensity: 0.35, roughness: 0.4, side: THREE.DoubleSide });
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 + 0.31;
    const r = 7.6;
    const y = 7.2 + (k % 2) * 0.6;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), cardMat.clone());
    card.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, CEIL - y - 0.65, 4), new THREE.MeshBasicMaterial({ color: 0xcfc8bc }));
    line.position.set(card.position.x, (CEIL + y + 0.65) / 2, card.position.z);
    scene.add(card, line);
    cards.push({ card, a, k });
  }
  anim.push((t) => {
    for (const c of cards) {
      c.card.rotation.y = -c.a + Math.sin(t * 0.25 + c.k) * 0.5;
      c.card.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 0.7 + c.k * 0.63);
    }
  });
}

