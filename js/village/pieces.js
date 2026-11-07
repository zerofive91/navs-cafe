// 두루마리 조각 (2026-11, 요한복음 마을 채우기 E5 · 기획서 john-enrichment-plan.md J3): 마을 공용 모듈
//   마을 곳곳(주로 구역 사이 길가)에 장마다 조각 하나. 가까이 가서 주우면 그 장 제목과 핵심 구절(말씀 카드)
//   25m 안에 들면 반짝이고, 다 모으면 "한눈에" 카드와 작은 보상. 안약(shop.js)을 쓰면 3분 동안 가장 가까운 조각 셋 위에 빛기둥
//   자료(DATA)는 마을마다 따로 (요한: js/john/pieces.js, 사도행전은 같은 모양으로 js/acts/pieces.js). 마을은 id(이름)로 구분
//   저장: store() = profile.<마을>.pc (장 번호 배열, 정수 1~99, 합집합으로 합침: js/village/town-save.js)
//
//   DATA = { id, title, chip, total, spots: [{ n, title, verse(말씀 키), at: {x,z} }], overview(마지막 카드 말씀 키), line(한 줄 안내),
//            doneText(다 모은 카드 글), reward: { steps, stat, statN, goods: { id: n }, coin } }
import * as THREE from 'three';
import { floorY } from '../layout.js';
import { nearestFree } from '../nav.js';
import { showVerse } from '../verses.js';
import { addSteps, addStat, addGood, earn, STATS } from '../profile.js';

export const PICK_R = 1.6;   // 줍는 거리
export const SPARKLE_R = 25; // 이 안에 들면 반짝임
export const EACH = { steps: 1 }; // 조각 하나마다
export const DONE = 99; // pc에 이 숫자가 있으면 다 모은 보상을 이미 받음 (town-save.js fillPc의 1~99 범위 안이라 합집합으로 두 기기에 퍼짐)
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function initPieces({ DATA, root, store, profile, me, here, busy, ui, toast, sfx, burst, fxSprite, save, onChange, salve }) {
  const total = DATA.total || DATA.spots.length;
  const nums = new Set(DATA.spots.map((s) => s.n));
  // 저장 칸(pc)에는 장 번호 외에 보상 받음 표시(DONE=99)가 같이 들어 있음. 칩·목록·남은 수는 자리 번호만 셈 (손상된 기록의 엉뚱한 번호는 무시)
  const have = () => new Set(store().filter((n) => nums.has(n)));
  const rewarded = () => store().includes(DONE);
  const inTown = () => here() === DATA.id;

  // ---------- 조각 모형 (정원 두루마리와 같은 모양) ----------
  const paper = new THREE.MeshStandardMaterial({ color: 0xf6e7c4, roughness: 0.7, emissive: 0xffd58a, emissiveIntensity: 0.35 });
  const rod = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: 0.6 });
  const tie = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 });
  const group = new THREE.Group(); group.name = 'pieces-' + DATA.id; root.add(group);
  const items = DATA.spots.map((s) => {
    const p = nearestFree(s.at) || s.at;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 14), paper);
    body.rotation.z = Math.PI / 2;
    for (const k of [-1, 1]) { const end = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 8), rod); end.rotation.z = Math.PI / 2; end.position.x = k * 0.27; g.add(end); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.103, 0.016, 6, 16), tie); band.rotation.y = Math.PI / 2;
    const glow = fxSprite('light_01', 0xffe2a0, 1.3);
    g.add(body, band, glow);
    g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    const y = floorY(p.x, p.z) + 0.62;
    g.position.set(p.x, y, p.z);
    group.add(g);
    return { s, n: s.n, p, g, glow, y, got: false };
  });

  // ---------- 안약 빛기둥: 아직 못 찾은 가장 가까운 조각 셋 ----------
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 12, 1, true);
  const beams = [0, 1, 2].map(() => { const m = new THREE.Mesh(beamGeo, beamMat); m.visible = false; m.renderOrder = 4; group.add(m); return m; });

  // ---------- 모은 수 칩과 목록 창 ----------
  const chip = document.createElement('button');
  chip.className = 'pieceChip'; chip.dataset.village = DATA.id; chip.hidden = true;
  chip.setAttribute('aria-label', DATA.title);
  document.body.appendChild(chip);
  const box = document.createElement('div');
  box.className = 'pieceBox'; box.dataset.village = DATA.id; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', DATA.title);
  document.body.appendChild(box);
  let shown = -1;
  function paintChip() {
    const n = have().size;
    if (n === shown) return; shown = n;
    chip.innerHTML = `<span aria-hidden="true">📜</span><span>${n}/${total}</span>`;
    chip.classList.toggle('done', n >= total);
  }
  function render() {
    const got = have(), n = got.size, all = n >= total;
    box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button><h3>${esc(all ? DATA.allTitle || DATA.title : DATA.title)}</h3>
      <p class="sub">${all ? esc(DATA.line_all || `${total}개를 다 모았어요`) : `${n} / ${total} · ${esc(DATA.line || '')}`}</p>
      <div class="list">${DATA.spots.map((s) => (got.has(s.n)
        ? `<button class="got" data-n="${s.n}"><b>${s.n}</b>${esc(s.title)}</button>`
        : `<button class="no" disabled aria-label="${s.n}장 아직 못 찾았어요"><b>${s.n}</b>？</button>`)).join('')}</div>
      ${all ? `<p class="done">${esc(DATA.doneText || '')}</p>` : ''}</div>`;
  }
  function openBox() { if (!inTown() || busy() || ui?.isOpen()) return; render(); box.hidden = false; }
  function closeBox() { box.hidden = true; }
  chip.addEventListener('pointerdown', (e) => e.stopPropagation());
  chip.addEventListener('click', (e) => { e.stopPropagation(); if (box.hidden) openBox(); else closeBox(); });
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target === box || e.target.classList.contains('close')) { closeBox(); return; }
    const b = e.target.closest('[data-n]'); if (!b) return;
    const s = DATA.spots.find((x) => x.n === +b.dataset.n); if (!s || !have().has(s.n)) return;
    closeBox();
    showVerse(s.verse, { cooldown: 0, title: cardTitle(s, have().size) });
  });
  addEventListener('keydown', (e) => { if (!box.hidden && e.key === 'Escape') { e.stopPropagation(); closeBox(); } }, true);

  const cardTitle = (s, n) => `두루마리 조각 ${n} / ${total} · ${DATA.unit ? `제 ${s.n}${DATA.unit}` : s.n} ${s.title}`;

  // ---------- 줍기 ----------
  function pick(it) {
    const list = store();
    if (list.includes(it.n)) return;
    list.push(it.n); list.sort((a, b) => a - b);
    it.got = true; it.g.visible = false;
    addSteps(profile, EACH.steps); // saveProfile까지
    save?.(); onChange?.(); paintChip();
    burst(it.p.x, it.y, it.p.z); sfx('share', 0.3);
    const n = have().size;
    showVerse(it.s.verse, { cooldown: 0, title: cardTitle(it.s, n) });
    if (n >= total && !rewarded()) finish();
  }
  // 다 모음: 한눈에 카드와 작은 보상 (마지막 조각을 줍는 기기에서 한 번)
  function finish() {
    const R = DATA.reward || {};
    const list = store(); if (!list.includes(DONE)) { list.push(DONE); list.sort((a, b) => a - b); } // 표시를 먼저 남겨 두 번 받지 않게
    if (R.steps) addSteps(profile, R.steps);
    if (R.stat) addStat(profile, R.stat, R.statN || 1);
    for (const [id, k] of Object.entries(R.goods || {})) addGood(profile, id, k);
    if (R.coin) earn(profile, R.coin);
    save?.(); onChange?.();
    sfx('orb', 0.28, 1.15);
    const parts = [R.steps && `걸음 +${R.steps}`, R.stat && `${STATS.find((x) => x.id === R.stat)?.name || ''} +${R.statN || 1}`, ...Object.entries(R.goods || {}).map(([id, k]) => `${DATA.goodsName?.[id] || id} ${k}개`), R.coin && `${R.coin} 데나리온`].filter(Boolean);
    let tries = 0;
    const show = () => {
      if (!inTown()) return; // 마을을 떠났으면 카드는 건너뜀 (보상은 이미 받음, 칩에서 목록을 다시 볼 수 있음)
      if ((busy() || ui.isOpen()) && tries++ < 60) { setTimeout(show, 800); return; }
      ui.open({
        who: DATA.allTitle || DATA.title, sub: `조각 ${total}개를 다 모았어요`, text: DATA.doneText || '', quote: DATA.overview,
        note: `${parts.join(', ')} · 위쪽 📜 표시를 누르면 목록을 다시 볼 수 있어요`,
        buttons: [{ t: '감사해요', cls: 'next' }],
      });
    };
    setTimeout(show, 6500); // 조각의 말씀 카드를 읽는 동안 기다림
  }

  // ---------- 매 프레임 ----------
  let t = 0, syncT = 0, wasIn = false;
  function step(dt) {
    const on = inTown();
    if (on !== wasIn) { wasIn = on; chip.hidden = !on; if (!on) closeBox(); }
    if (!on) return;
    t += dt;
    if ((syncT -= dt) <= 0) { // 다른 기기에서 합쳐진 기록 반영 (0.5초마다)
      syncT = 0.5; const got = have();
      for (const it of items) { it.got = got.has(it.n); it.g.visible = !it.got; }
      paintChip();
      if (got.size >= total && !rewarded()) finish(); // 두 기기에서 나눠 모은 기록이 합쳐져 21개가 된 경우에도 보상·카드 (표시를 바로 남기므로 한 번만)
    }
    const free = box.hidden && !busy() && !ui.isOpen();
    for (const it of items) {
      if (it.got) continue;
      const d = Math.hypot(me.x - it.p.x, me.z - it.p.z);
      it.g.position.y = it.y + Math.sin(t * 2 + it.n) * 0.07;
      it.g.rotation.y = t * 0.8 + it.n;
      const near = d < SPARKLE_R;
      it.glow.visible = near;
      if (near) it.glow.material.opacity = 0.45 + Math.sin(t * 3 + it.n) * 0.25;
      if (free && d < PICK_R) { pick(it); break; }
    }
    // 안약
    if (salve?.()) {
      const left = items.filter((it) => !it.got).sort((a, b) => Math.hypot(a.p.x - me.x, a.p.z - me.z) - Math.hypot(b.p.x - me.x, b.p.z - me.z)).slice(0, beams.length);
      beams.forEach((b, i) => { const it = left[i]; b.visible = !!it; if (it) b.position.set(it.p.x, it.y + 6.5, it.p.z); });
      beamMat.opacity = 0.25 + Math.sin(t * 3) * 0.1;
    } else for (const b of beams) b.visible = false;
  }

  paintChip();
  return {
    step, open: openBox, close: closeBox,
    left: () => Math.max(0, total - have().size), count: () => have().size, total,
    debug: { items, beams, pick: (n) => { const it = items.find((x) => x.n === n); if (it) pick(it); return !!it; }, spots: () => items.map((it) => ({ n: it.n, x: it.p.x, z: it.p.z, got: it.got })), chip, box },
  };
}
