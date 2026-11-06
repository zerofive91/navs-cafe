// 마을 사이 다니기 (2026-11 요한복음 마을 0단계)
//   초보자 마을(카페·정원·숲길) 정원 바깥 둘레길의 "마을 길목"에 이정표와 수레가 있음. 수레에 오르면(E 또는 반짝이는 단추)
//   화면이 흐려졌다 밝아지며 요한복음 마을 빛의 광장(Z1)에 도착. 광장 남쪽 끝의 수레로 돌아옴
//   입장 조건: 정원 안내(아담)를 마친 사람 (기획서 9장 결정 3). 걸음·단계 잠금 없음
//   마을 모형은 처음 들어갈 때만 불러와 지음 (dynamic import) → 첫 접속은 지금과 같음
import * as THREE from 'three';
import { VILLAGE_GATE, floorY, REGIONS, regionIdAt } from './layout.js';
import { ensureNav, nearestFree } from './nav.js';
import { REGION as JOHN, CART as JOHN_CART } from './john/layout.js';
import { VERSES, showVerse } from './verses.js';

export const TOWNS = [
  { id: 'base', name: '초보자 마을' },
  { id: 'john', name: '요한복음 마을' },
];
const state = { id: 'base' };
export const currentRegion = () => state.id;

// ---------- 수레와 이정표 (두 마을이 같은 모양을 씀) ----------
const wood = new THREE.MeshStandardMaterial({ color: 0x9a7350, roughness: 0.9 });
const woodDark = new THREE.MeshStandardMaterial({ color: 0x6e4f36, roughness: 0.9 });
const cloth = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 1, side: THREE.DoubleSide });
const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
export function makeCart() {
  const g = new THREE.Group();
  g.add(box(2.2, 0.12, 1.3, wood, 0, 0.62, 0));           // 바닥
  for (const s of [-1, 1]) g.add(box(2.2, 0.36, 0.08, wood, 0, 0.84, s * 0.62)); // 옆판
  g.add(box(0.08, 0.36, 1.3, wood, -1.06, 0.84, 0));
  g.add(box(0.5, 0.1, 1.1, woodDark, 0.4, 0.95, 0));       // 앉는 판
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 20), woodDark);
    w.position.set(-0.1, 0.48, s * 0.74); w.castShadow = true; g.add(w);
    for (let k = 0; k < 4; k++) { const sp = box(0.05, 0.9, 0.04, woodDark, -0.1, 0.48, s * 0.74); sp.rotation.z = (k * Math.PI) / 4; g.add(sp); }
    const arm = box(1.7, 0.07, 0.07, wood, 1.9, 0.6, s * 0.4); arm.rotation.z = 0.18; g.add(arm); // 끌채
  }
  // 차양 (천)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.9, 12, 1, true, 0, Math.PI), cloth);
  roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.set(-0.15, 1.15, 0); roof.scale.set(1, 1, 0.85); g.add(roof);
  return g;
}
function plankTex(title, sub) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160;
  const g = cv.getContext('2d');
  g.fillStyle = '#b38a5e'; g.fillRect(0, 0, 512, 160);
  g.strokeStyle = 'rgba(80,50,30,0.25)'; g.lineWidth = 2;
  for (let y = 14; y < 160; y += 22) { g.beginPath(); g.moveTo(0, y + Math.sin(y) * 3); g.lineTo(512, y); g.stroke(); }
  g.fillStyle = '#3e2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 54px "Noto Serif KR", serif'; g.fillText(title, 256, sub ? 64 : 80);
  if (sub) { g.font = '500 30px "Noto Serif KR", serif'; g.fillText(sub, 256, 122); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function makeSignpost(title, sub, h = 2.1) {
  const g = new THREE.Group();
  g.add(box(0.14, h, 0.14, woodDark, 0, h / 2, 0));
  const face = new THREE.MeshStandardMaterial({ map: plankTex(title, sub), roughness: 0.9 });
  const p = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.06), [wood, wood, wood, wood, face, face]);
  p.position.set(0, h - 0.35, 0.08); p.castShadow = true; g.add(p);
  return g;
}

export function initRegion(K) {
  const { scene, me, profile, save, toast, sfx, standUp, camBehind, setEnv, onSwitch, interactive, occluders, walkTo } = K;
  const john = () => profile.john;

  // ---------- 초보자 마을 길목: 이정표 "요한복음 마을" + 수레 ----------
  const G = VILLAGE_GATE;
  const sign = makeSignpost('요한복음 마을', '수레를 타고 가요');
  sign.position.set(G.sign.x, floorY(G.sign.x, G.sign.z), G.sign.z);
  sign.rotation.y = Math.atan2(-G.n.x, -G.n.z); // 둘레길(정원 안쪽)을 바라봄
  scene.add(sign);
  const cart = makeCart();
  cart.position.set(G.cart.x, floorY(G.cart.x, G.cart.z), G.cart.z);
  cart.rotation.y = G.rot - Math.PI / 2;
  scene.add(cart);
  // 수레를 누르면 곁으로 걸어가 오름
  const tapCart = (c, stand) => {
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.y = 0.9; c.add(hit);
    hit.userData.onTap = () => walkTo(me, stand, () => board());
    interactive.push(hit);
  };
  tapCart(cart, G.stand);

  // ---------- 흐려졌다 밝아지는 막 (불러오는 동안 말씀 한 구절: 요 14:6) ----------
  const veil = document.createElement('div');
  veil.id = 'regionVeil';
  const [vt, vr] = VERSES['jn-14-6'] || ['', ''];
  veil.innerHTML = `<div class="pad"><p>${vt}</p><cite>${vr}</cite><small></small></div>`;
  veil.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); });
  document.body.appendChild(veil);

  let busy = false, johnBuilt = null;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nearCart = () => {
    const c = state.id === 'john' ? JOHN_CART : G.cart;
    return Math.hypot(me.x - c.x, me.z - c.z) < 3.4;
  };
  const canEnter = () => !!profile.tut?.garden; // 정원 안내를 마쳤거나 '안내 끝내기'로 넘긴 사람

  function board() {
    if (busy) return;
    if (state.id === 'base') {
      if (!canEnter()) { toast('정원지기 아담에게 정원 안내를 받으면 수레를 탈 수 있어요', 4); sfx?.('impact/impactSoft_medium_000', 0.2, 0.8); return; }
      go('john');
    } else go('base');
  }
  let johnRoot = null, tries = 0;
  async function buildJohn() {
    if (!johnBuilt) {
      // 브라우저는 한 번 실패한 모듈 주소를 기억해 같은 주소로는 다시 받지 않음 → 다시 시도할 때는 주소 끝을 바꿈
      const url = tries++ ? `./john/build.js?retry=${tries}` : './john/build.js';
      johnBuilt = import(url).then((m) => { const r = m.buildJohn({ scene, occluders, makeCart, makeSignpost }); tapCart(r.cart, JOHN_CART.stand); johnRoot = r.root; return r; });
      johnBuilt.catch(() => { johnBuilt = null; }); // 불러오기에 실패하면 다음에 수레를 탈 때 다시 시도
    }
    return johnBuilt;
  }
  // 마을 모형은 그 마을에 있을 때만 그림 (빛의 광장 등불이 초보자 마을 조명 수를 늘리지 않게)
  const showTown = (id) => { if (johnRoot) johnRoot.visible = id === 'john'; };
  async function go(to, { fromDoor = false } = {}) {
    if (busy || (to === state.id && !fromDoor)) return false;
    busy = true;
    let done = false, first = false;
    try {
      if (me.climb) me.climb = null;
      if (me.seat) standUp(me);
      me.path = []; me.task = null; me.action = null; me.state = 'idle'; me.jumps = 0; me.vy = 0; me.hop = 0;
      const T0 = performance.now();
      veil.querySelector('small').textContent = to === 'john' ? '요한복음 마을로 가는 중' : '초보자 마을로 돌아가는 중';
      veil.classList.add('on');
      if (!fromDoor) sfx?.('impact/impactSoft_medium_000', 0.2, 0.9);
      await wait(650); // 다 흐려질 때까지
      if (to === 'john') { await buildJohn(); ensureNav('john'); }
      const R = REGIONS.find((g) => g.id === to);
      let at, look;
      if (to === 'john') { at = R.arrive; look = R.look; }
      else { at = G.stand; look = { x: 0, z: 0 }; }
      const p = nearestFree(at) || at;
      me.x = p.x; me.z = p.z; me.y = floorY(p.x, p.z);
      me.face = Math.atan2(look.x - p.x, look.z - p.z);
      state.id = to;
      showTown(to);
      camBehind?.();
      setEnv?.(to === 'base' ? null : R.env);
      const J = john();
      J.last = to === 'john' ? 1 : 0;
      first = to === 'john' && !J.seen;
      if (first) J.seen = Date.now();
      save();
      onSwitch?.(to);
      done = true;
      await wait(Math.max(0, 1500 - (performance.now() - T0))); // 1.5초쯤 (짧게 머무는 말씀)
    } catch (e) {
      console.warn('마을을 옮기지 못했어요', e);
      if (!done) toast('마을을 불러오지 못했어요. 잠시 뒤에 다시 타 주세요', 4);
    } finally {
      veil.classList.remove('on'); // 무슨 일이 있어도 막과 잠금은 풂
      busy = false;
    }
    if (!done) return false;
    setTimeout(() => {
      if (to === 'john') {
        toast(first ? '요한복음 마을에 왔어요. 마을은 지금 짓는 중이에요. 둘러보며 쉬어 가세요' : '요한복음 마을에 왔어요', first ? 5 : 3);
        if (first) showVerse('jn-20-31', { cooldown: 0, delay: 1.2, title: '요한복음 마을' });
      } else toast('초보자 마을로 돌아왔어요', 3);
    }, 500);
    return true;
  }

  return {
    go, board, here: currentRegion,
    active: () => busy,
    locked: () => busy,
    available: () => (!busy && nearCart() && me.state !== 'walk' ? [['place', 'jcart']] : []),
    actions: { jcart: board },
    // 지도에서 다른 마을을 고르면: 이 마을의 수레 곁으로 걸어감
    toCart() {
      const at = state.id === 'john' ? JOHN_CART.stand : G.stand;
      walkTo(me, at, () => toast('수레에 오르면(E 또는 반짝이는 단추) 다른 마을로 가요', 4));
    },
    // 혹시 다른 마을 자리에 있으면(병거·시험 등) 상태를 맞춤
    step() { if (!busy) { const r = regionIdAt(me.x, me.z); if (r !== 'none' && r !== state.id) { state.id = r; showTown(r); setEnv?.(r === 'base' ? null : REGIONS.find((g) => g.id === r)?.env); onSwitch?.(r); } } },
    john: JOHN,
  };
}
