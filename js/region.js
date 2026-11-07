// 마을 사이 다니기 (2026-11 요한복음 마을 0단계 → 2026-11 마을 등록부)
//   마을마다 수레가 있음 (초보자 마을은 정원 바깥 둘레길의 "마을 길목", 요한복음 마을은 빛의 광장 남쪽 끝). 수레에 오르면(E 또는 반짝이는 단추)
//   화면이 흐려졌다 밝아지며 다른 마을 도착 자리에 섬. 어느 마을이 있고 어디에 무엇이 있는지는 등록부(js/villages/registry.js)가 정함
//   입장 조건은 마을 항목의 enter (요한복음 마을: 정원 안내를 마친 사람, 기획서 9장 결정 3). 걸음·단계 잠금 없음
//   마을 모형은 처음 들어갈 때만 불러와 지음 (마을 항목의 load, dynamic import) → 첫 접속은 지금과 같음
import * as THREE from 'three';
import { floorY, regionIdAt } from './layout.js';
import { ensureNav, nearestFree } from './nav.js';
import { VILLAGES, village, destinations, markTown } from './villages/registry.js';
import { VERSES, showVerse } from './verses.js';

export const TOWNS = VILLAGES.filter((v) => v.status === 'open').map((v) => ({ id: v.id, name: v.name }));
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
  const { scene, me, profile, save, toast, sfx, standUp, camBehind, setEnv, onSwitch, interactive, occluders, walkTo, townKit, blocked, chooseTown } = K;
  const built = new Map(); // 마을 id → Promise<{ root, cart, engine }> (처음 들어갈 때 지음)
  const engines = new Map(); // 마을 id → 사건 엔진
  const roots = new Map(); // 마을 id → 모형 root (그 마을에 있을 때만 보임)
  const tries = new Map();

  // ---------- 초보자 마을 길목: 이정표 + 수레 (갈 마을이 하나면 그 이름, 여럿이면 "마을 수레") ----------
  const B = village('base').cart;
  const outs = destinations('base');
  const sign = makeSignpost(outs.length === 1 ? outs[0].name : '마을 수레', '수레를 타고 가요');
  sign.position.set(B.sign.x, floorY(B.sign.x, B.sign.z), B.sign.z);
  sign.rotation.y = B.signRot; // 둘레길(정원 안쪽)을 바라봄
  scene.add(sign);
  const cart = makeCart();
  cart.position.set(B.x, floorY(B.x, B.z), B.z);
  cart.rotation.y = B.rot;
  scene.add(cart);
  // 수레를 누르면 곁으로 걸어가 오름
  const tapCart = (c, stand) => {
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.y = 0.9; c.add(hit);
    hit.userData.onTap = () => walkTo(me, stand, () => board());
    interactive.push(hit);
  };
  tapCart(cart, B.stand);

  // ---------- 흐려졌다 밝아지는 막 (불러오는 동안 말씀 한 구절: 요 14:6) ----------
  const veil = document.createElement('div');
  veil.id = 'regionVeil';
  const [vt, vr] = VERSES['jn-14-6'] || ['', ''];
  veil.innerHTML = `<div class="pad"><p>${vt}</p><cite>${vr}</cite><small></small></div>`;
  veil.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); });
  document.body.appendChild(veil);

  let busy = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const here = () => village(state.id) || village('base');
  const nearCart = () => { const c = here().cart; return !!c && Math.hypot(me.x - c.x, me.z - c.z) < 3.4; };

  // 수레에 오름: 갈 마을이 하나면 바로, 여럿이면 고르기 (안내인 말풍선). to를 주면 그 마을로
  function board(to) {
    if (busy) return;
    const list = destinations(state.id);
    let V = to ? village(to) : list.length === 1 ? list[0] : null;
    if (!V) { if (chooseTown) chooseTown(list.map((v) => v.id)); else toast('어느 마을로 갈지 수레꾼에게 물어봐요', 3); return; }
    const ok = V.status === 'open' ? V.entry(profile) : V.entry?.(profile) || '아직 갈 수 없는 마을이에요';
    if (ok !== true) { toast(ok, 4); sfx?.('impact/impactSoft_medium_000', 0.2, 0.8); return; }
    go(V.id);
  }
  async function buildTown(V) {
    if (!V.load) return null;
    if (!built.has(V.id)) {
      // 브라우저는 한 번 실패한 모듈 주소를 기억해 같은 주소로는 다시 받지 않음 → 다시 시도할 때는 주소 끝을 바꿈
      const n = tries.get(V.id) || 0; tries.set(V.id, n + 1);
      const q = n ? `?retry=${n}` : '';
      const p = V.load({ q, scene, occluders, makeCart, makeSignpost, kit: townKit, here: currentRegion }).then((r) => {
        tapCart(r.cart, V.cart.stand); roots.set(V.id, r.root);
        if (r.engine) engines.set(V.id, r.engine);
        return r;
      });
      built.set(V.id, p);
      p.catch(() => { built.delete(V.id); }); // 불러오기에 실패하면 다음에 수레를 탈 때 다시 시도
    }
    return built.get(V.id);
  }
  // 마을 모형은 그 마을에 있을 때만 그림 (빛의 광장 등불이 초보자 마을 조명 수를 늘리지 않게)
  const showTown = (id) => { for (const [k, r] of roots) r.visible = k === id; };
  const envOf = (id) => village(id)?.region?.env || null;
  async function go(to, { fromDoor = false } = {}) {
    const V = village(to);
    if (busy || !V || V.status !== 'open' || (to === state.id && !fromDoor)) return false;
    busy = true;
    let done = false, first = false;
    try {
      if (me.climb) me.climb = null;
      for (const e of engines.values()) if (e?.X?.inBoat?.()) e.quit(); // 밤바다 배 위에서 떠나면 사건을 그만두고 배에서 내림 (자리 jboat가 따라가지 않게)
      if (me.seat) standUp(me);
      me.path = []; me.task = null; me.action = null; me.state = 'idle'; me.jumps = 0; me.vy = 0; me.hop = 0;
      const T0 = performance.now();
      veil.querySelector('small').textContent = V.travel?.going || `${V.name}(으)로 가는 중`;
      veil.classList.add('on');
      if (!fromDoor) sfx?.('impact/impactSoft_medium_000', 0.2, 0.9);
      await wait(650); // 다 흐려질 때까지
      if (V.region) { await buildTown(V); ensureNav(to); }
      const at = V.region ? V.region.arrive : V.cart.arrive, look = V.region ? V.region.look : V.cart.look;
      const p = nearestFree(at) || at;
      me.x = p.x; me.z = p.z; me.y = floorY(p.x, p.z);
      me.face = Math.atan2(look.x - p.x, look.z - p.z);
      state.id = to;
      showTown(to);
      camBehind?.();
      setEnv?.(envOf(to));
      first = markTown(profile, to); // 이 마을만 last 1, 처음 가 본 마을이면 seen
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
      const T = V.travel || {};
      toast(first && T.first ? T.first : T.arrive || `${V.name}에 왔어요`, first ? 5 : 3);
      if (first && T.firstVerse) showVerse(T.firstVerse, { cooldown: 0, delay: 1.2, title: V.name });
    }, 500);
    return true;
  }

  // 사건 쪽 그 자리 단추: 이름은 미리 등록해 두고 그 마을 엔진이 생기면 넘김
  const actions = { jcart: () => board() };
  for (const V of VILLAGES) for (const k of V.acts || []) actions[k] = () => engines.get(V.id)?.actions[k]?.();
  const engineHere = () => engines.get(state.id) || null;
  return {
    go, board, here: currentRegion,
    active: () => busy,
    locked: () => busy,
    available: () => (busy || blocked?.() ? [] : [...(nearCart() && me.state !== 'walk' ? [['place', 'jcart']] : []), ...[...engines.values()].flatMap((e) => e?.available() || [])]),
    actions,
    get engine() { return engines.get('john') || null; }, // 요한복음 마을 엔진 (main.js·시험 스크립트가 씀)
    engineOf: (id) => engines.get(id) || null,
    engineHere,
    anyActive: () => [...engines.values()].some((e) => e?.active()),
    destinations: () => destinations(state.id).map((v) => v.id),
    wants: () => engineHere()?.wants() || [],
    // 지도에서 다른 마을을 고르면: 이 마을의 수레 곁으로 걸어감
    toCart() {
      const c = here().cart;
      walkTo(me, c.stand, () => toast('수레에 오르면(E 또는 반짝이는 단추) 다른 마을로 가요', 4));
    },
    // 혹시 다른 마을 자리에 있으면(병거·시험 등) 상태를 맞춤
    step(dt) { for (const e of engines.values()) e?.step(dt); if (!busy) { const r = regionIdAt(me.x, me.z); if (r !== 'none' && r !== state.id) { state.id = r; showTown(r); setEnv?.(envOf(r)); onSwitch?.(r); } } },
    john: village('john').region,
  };
}
