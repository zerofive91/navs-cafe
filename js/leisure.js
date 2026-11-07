// 정원에서 쉬며 할 수 있는 일 (2026-11): 연 날리기, 꽃 따서 건네기, 물수제비, 누워서 별 보기,
// 씨 심기(다음에 와도 자라 있음), 사진 찍기
import * as THREE from 'three';
import { VERSES, showVerse } from './verses.js';
import { R_HALL, R_GARDEN, R_WALK, FLOWER_BEDS, PARK, JONAH_SEA, floorY, parkClear } from './layout.js';

VERSES['l-flower'] = ['또 너희가 어찌 의복을 위하여 염려하느냐 들의 백합화가 어떻게 자라는가 생각하여 보라 수고도 아니하고 길쌈도 아니하느니라 그러나 내가 너희에게 말하노니 솔로몬의 모든 영광으로도 입은 것이 이 꽃 하나만 같지 못하였느니라', '마태복음 6:28-29'];
VERSES['l-give'] = ['내 계명은 곧 내가 너희를 사랑한 것 같이 너희도 서로 사랑하라 하는 이것이니라', '요한복음 15:12'];
VERSES['l-stars'] = ['그를 이끌고 밖으로 나가 가라사대 하늘을 우러러 뭇별을 셀 수 있나 보라 또 그에게 이르시되 네 자손이 이와 같으리라', '창세기 15:5'];
VERSES['l-stars2'] = ['저가 별의 수효를 계수하시고 저희를 다 이름대로 부르시는도다', '시편 147:4'];
VERSES['l-seed'] = ['나는 심었고 아볼로는 물을 주었으되 오직 하나님은 자라나게 하셨나니', '고린도전서 3:6'];
VERSES['l-grown'] = ['우리가 선을 행하되 낙심하지 말찌니 피곤하지 아니하면 때가 이르매 거두리라', '갈라디아서 6:9'];
VERSES['l-skip'] = ['천하에 범사가 기한이 있고 모든 목적이 이룰 때가 있나니', '전도서 3:1'];

const M = (c, r = 0.85, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// rest: () => null(초보자 마을: 정원 판정 그대로) | 쉼 구역 목록(마을 등록부 rest[], 마을 안에서는 이 구역에서만 물수제비·낚시·별 보기)
//   구역 { kind: 'shore'|'hill'|'roof', at: {x,z}, r, test?(x,z) → 구역 안인가, water?: {x,z,y?} (shore: 물 쪽), inWater?(x,z,pad) (shore: 물 안인가) }
export function initLeisure({ scene, me, camera, renderer, view, lights, act, sfx, burst, walkTo, faceTo, standUp, nearestPerson, toast, ICONS, LIEABLE, rest = () => null }) {
  const actions = {}, avail = [], steps = [];
  const r0 = () => Math.hypot(me.x, me.z);
  const inGarden = () => r0() > R_HALL + 1.5 && r0() < R_GARDEN + 1;
  const lying = () => me.state === 'sit' && me.seat && (me.seat.kind === 'lie' || LIEABLE.has(me.seat.kind));
  const say = (k, o = {}) => showVerse(k, { delay: 1.2, cooldown: 120, ...o });
  // 마을 쉼 구역 판정: 정원 판정(inGarden)은 그대로 두고, 마을에서는 등록부 rest[] 구역만 더함
  const inZone = (z) => (z.test ? z.test(me.x, me.z) : Math.hypot(me.x - z.at.x, me.z - z.at.z) < z.r);
  const restHere = (kinds) => (rest() || []).find((z) => kinds.includes(z.kind) && inZone(z)) || null;
  const shoreZone = () => {
    const z = restHere(['shore']);
    return z && z.inWater && z.inWater(me.x, me.z, 3.2) && !z.inWater(me.x, me.z, 0.2) ? z : null;
  };

  // ---------- 꽃 따서 건네기 ----------
  const nearBed = () => FLOWER_BEDS.some((b) => Math.hypot(me.x - b.x, me.z - b.z) < b.r + 1.4) || PARK.meadow.inside(me.x, me.z);
  const laid = [];
  const flowerMesh = () => {
    const g = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 5), M(0x5f9a4a)); st.position.y = 0.12; g.add(st);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M(0xf28fb0, 0.6)); b.position.y = 0.25; g.add(b);
    return g;
  };
  actions.flower = () => {
    if (me.hold === 'flower') { // 내려놓기: 땅에 두면 한동안 남음
      me.hold = null;
      const f = flowerMesh(); f.rotation.z = Math.PI / 2 - 0.2; f.position.set(me.x + Math.sin(me.face) * 0.5, floorY(me.x, me.z) + 0.03, me.z + Math.cos(me.face) * 0.5); f.rotation.y = me.face;
      scene.add(f); laid.push({ f, t: 180 });
      return;
    }
    standUp(me); act('plant', 1.1);
    setTimeout(() => { me.hold = 'flower'; me.action = null; sfx('orb', 0.12, 1.7); say('l-flower', { delay: 0.8 }); }, 900);
  };
  avail.push(() => (me.hold === 'flower' ? 'flower' : inGarden() && nearBed() && !me.food && me.hold !== 'kite' ? ['place', 'flower'] : null));
  const flying = [];
  actions.giveflower = () => {
    const n = nearestPerson(6); if (!n || me.hold !== 'flower') return;
    const give = () => {
      faceTo(me, n); act('share', 1.6); me.hold = null;
      const f = flowerMesh(); scene.add(f);
      flying.push({ f, from: new THREE.Vector3(me.x, me.y + 0.7, me.z), to: n, t: 0 });
      n.face = Math.atan2(me.x - n.x, me.z - n.z);
      say('l-give', { delay: 1.8, cooldown: 60 });
    };
    if (Math.hypot(me.x - n.x, me.z - n.z) > 1.8) walkTo(me, { x: n.x + (me.x - n.x) * 0.3, z: n.z + (me.z - n.z) * 0.3 }, give); else give();
  };
  avail.push(() => (me.hold === 'flower' && nearestPerson(6) ? ['place', 'giveflower'] : null));
  steps.push((dt) => {
    for (let i = flying.length - 1; i >= 0; i--) {
      const q = flying[i]; q.t += dt / 0.9;
      const k = Math.min(1, q.t), to = new THREE.Vector3(q.to.x, (q.to.y || 0) + 0.8, q.to.z);
      q.f.position.lerpVectors(q.from, to, k); q.f.position.y += Math.sin(k * Math.PI) * 0.6; q.f.rotation.y += dt * 6;
      if (k >= 1) {
        scene.remove(q.f); flying.splice(i, 1); burst(to.x, to.y + 0.2, to.z);
        sfx('orb', 0.15, 1.5);
        if (q.to.av && !q.to.peer) { q.to.hold = 'flower'; q.to.action = 'wave'; setTimeout(() => { if (q.to.action === 'wave') q.to.action = null; }, 2400); setTimeout(() => { q.to.hold = null; }, 40000); }
      }
    }
    for (let i = laid.length - 1; i >= 0; i--) if ((laid[i].t -= dt) < 0) { scene.remove(laid[i].f); laid.splice(i, 1); }
  });

  // ---------- 물수제비 (요나의 바다 물가) ----------
  const Z = PARK.jonah;
  const onShore = () => inGarden() && JONAH_SEA.inside(me.x, me.z, 3.2) && !JONAH_SEA.inside(me.x, me.z, 0.2);
  const stones = [], rings = [];
  const ringGeo = new THREE.RingGeometry(0.18, 0.26, 28);
  let skipY = -0.47; // 던진 곳 물 높이 (정원 -0.47, 마을은 구역 값)
  const waterY = () => skipY;
  actions.skip = () => {
    if (me.skipping > 0) return;
    const sz = shoreZone();
    standUp(me); me.path = [];
    let aim;
    if (sz && !onShore()) { // 마을 물가: 물 쪽으로 6m
      const w = sz.water, d = Math.hypot(w.x - me.x, w.z - me.z) || 1;
      aim = { x: me.x + ((w.x - me.x) / d) * 6, z: me.z + ((w.z - me.z) / d) * 6 };
      skipY = sz.waterY ?? -0.47;
    } else {
      const L = Z.local(me.x, me.z);
      aim = Z.at(L.u + 6, L.v * 0.85);
      skipY = -0.47;
    }
    faceTo(me, aim); act('skip', 1.1); me.skipT = 0.5; me.skipping = 1.4;
    setTimeout(() => {
      const dir = new THREE.Vector3(aim.x - me.x, 0, aim.z - me.z).normalize();
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0x8f8a84)); s.scale.y = 0.45; scene.add(s);
      const n = 2 + Math.floor(Math.random() * 6); // 몇 번 튈지
      const hops = []; let d = 1.6;
      for (let k = 0; k < n; k++) { hops.push(d); d *= 0.72; }
      stones.push({ s, p: new THREE.Vector3(me.x + dir.x * 0.4, me.y + 0.55, me.z + dir.z * 0.4), dir, hops, k: 0, t: 0, n });
    }, 330);
    say('l-skip', { delay: 3, cooldown: 300 });
  };
  avail.push(() => ((onShore() || shoreZone()) && me.state !== 'walk' ? ['place', 'skip'] : null));
  steps.push((dt) => {
    if (me.skipping > 0) me.skipping -= dt;
    for (let i = stones.length - 1; i >= 0; i--) {
      const S = stones[i];
      const len = S.hops[S.k] || 0.5, dur = 0.12 + len * 0.09;
      S.t += dt / dur;
      const k = Math.min(1, S.t);
      const start = S.k === 0 ? S.p : S.last;
      const y0 = S.k === 0 ? S.p.y : waterY();
      const x = start.x + S.dir.x * len * k, z = start.z + S.dir.z * len * k;
      S.s.position.set(x, y0 + (waterY() - y0) * k + Math.sin(k * Math.PI) * len * 0.12, z);
      S.s.rotation.y += dt * 20;
      if (k >= 1) {
        S.last = new THREE.Vector3(x, waterY(), z);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(x, waterY() + 0.06, z); scene.add(ring); rings.push({ ring, t: 0 });
        sfx('impact/impactGeneric_light_001', 0.08, 1.6 + S.k * 0.1);
        S.k++; S.t = 0;
        if (S.k >= S.hops.length) {
          scene.remove(S.s); stones.splice(i, 1);
          if (S.n >= 6) { burst(x, waterY() + 0.5, z); sfx('orb', 0.15, 1.6); }
        }
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const R = rings[i]; R.t += dt / 1.4;
      R.ring.scale.setScalar(1 + R.t * 6); R.ring.material.opacity = 0.8 * (1 - R.t);
      if (R.t >= 1) { scene.remove(R.ring); R.ring.material.dispose(); rings.splice(i, 1); }
    }
  });

  // ---------- 누워서 별 보기 ----------
  const night = { on: false, k: 0, base: null };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0c1430, side: THREE.BackSide, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  dome.renderOrder = -2; dome.visible = false; scene.add(dome);
  const starPts = [];
  for (let k = 0; k < 900; k++) {
    const a = Math.random() * Math.PI * 2, e = Math.asin(0.08 + Math.random() * 0.92);
    starPts.push(Math.cos(e) * Math.cos(a) * 280, Math.sin(e) * 280, Math.cos(e) * Math.sin(a) * 280);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0xfff8e8, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(sg, starsMat); stars.visible = false; stars.renderOrder = -1; scene.add(stars);
  const nightFog = new THREE.Color(0x182240), tmpC = new THREE.Color();
  let prevView = null;
  actions.stars = () => {
    if (night.on) return stopStars();
    night.on = true; me.action = 'stars';
    prevView = { mode: view.mode, az: view.az, pitch: view.pitch };
    view.mode = 'first'; view.az = me.face + Math.PI; view.pitch = 1.05;
    sfx('orb', 0.12, 0.7);
    say('l-stars', { delay: 4, cooldown: 0, then: ['l-stars2'] });
  };
  function stopStars() {
    night.on = false;
    if (me.action === 'stars') me.action = null;
    if (prevView) { view.mode = prevView.mode; view.az = prevView.az; view.pitch = 0; prevView = null; }
  }
  avail.push(() => (night.on ? 'stars' : lying() && (rest() ? restHere(['hill', 'roof']) : r0() > R_HALL + 1.5) ? ['place', 'stars'] : null));
  steps.push((dt) => {
    if (night.on && (!lying() || me.state !== 'sit')) stopStars();
    night.k += ((night.on ? 1 : 0) - night.k) * Math.min(1, dt * (night.on ? 0.45 : 1.2));
    const k = night.k < 0.002 ? 0 : night.k;
    dome.visible = stars.visible = k > 0;
    if (!night.base) night.base = { fog: scene.fog.color.clone(), lights: lights.map((l) => l.intensity) };
    if (k > 0 || night.applied) {
      dome.position.copy(camera.position); stars.position.copy(camera.position);
      dome.material.opacity = Math.min(0.97, k * 1.05); starsMat.opacity = ease((k - 0.3) / 0.7);
      starsMat.size = 2.2 + Math.sin(performance.now() / 700) * 0.25;
      scene.fog.color.copy(tmpC.copy(night.base.fog).lerp(nightFog, k));
      lights.forEach((l, i) => { l.intensity = night.base.lights[i] * (1 - 0.72 * k); });
      night.applied = k > 0;
    }
  });

  // ---------- 씨 심기: 심은 자리와 때를 기억해 다음에 와도 자라 있음 ----------
  const KEY = 'navs-cafe-seeds';
  let plants = [];
  try { plants = JSON.parse(localStorage.getItem(KEY) || '[]').filter((p) => p && typeof p.x === 'number'); } catch (e) { plants = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(plants.map(({ x, z, t, c }) => ({ x, z, t, c })))); } catch (e) { /* 저장 안 됨 */ } };
  const PCOL = [0xf28fb0, 0xffd34a, 0xb48ae0, 0xffffff, 0xf4a060];
  const stemM = M(0x5f9a4a), leafM = M(0x7fb35a), moundM = M(0x7a5a3a, 1), trunkM = M(0x8a6a4a);
  const bloomM = PCOL.map((c) => M(c, 0.6));
  const pg = { mound: new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), stem: new THREE.CylinderGeometry(0.02, 0.025, 1, 6), leaf: new THREE.SphereGeometry(0.09, 8, 6), bloom: new THREE.SphereGeometry(0.08, 8, 6), crown: new THREE.IcosahedronGeometry(0.7, 0) };
  function buildPlant(p) {
    const g = new THREE.Group(); g.position.set(p.x, floorY(p.x, p.z), p.z); scene.add(g);
    const mound = new THREE.Mesh(pg.mound, moundM); mound.scale.y = 0.35; g.add(mound);
    const stem = new THREE.Mesh(pg.stem, stemM); g.add(stem);
    const leaves = [-1, 1].map((s) => { const l = new THREE.Mesh(pg.leaf, leafM); l.scale.set(1.4, 0.4, 0.8); g.add(l); l.userData.s = s; return l; });
    const blooms = [0, 1, 2].map(() => { const b = new THREE.Mesh(pg.bloom, bloomM[p.c % bloomM.length]); g.add(b); return b; });
    const crown = new THREE.Mesh(pg.crown, M(0x6aa05a, 1)); g.add(crown);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    p.g = g; p.parts = { stem, leaves, blooms, crown, mound }; p.stage = -1;
    grow(p);
  }
  // 자람: 1분 싹 → 10분 잎 → 1시간 꽃 → 하루 작은 나무
  function grow(p) {
    const age = (Date.now() - p.t) / 1000;
    const k = Math.min(1, Math.log10(1 + age) / Math.log10(1 + 86400)); // 0..1 (하루)
    const { stem, leaves, blooms, crown } = p.parts;
    const h = 0.05 + k * 1.6;
    stem.visible = age > 20; stem.scale.set(1 + k * 2.5, h, 1 + k * 2.5); stem.position.y = h / 2;
    leaves.forEach((l, i) => { l.visible = age > 60; l.position.set(l.userData.s * (0.08 + k * 0.1), h * (0.45 + i * 0.15), 0); l.rotation.z = l.userData.s * 0.5; l.scale.set(1.4 + k, 0.4, 0.8 + k * 0.5); });
    blooms.forEach((b, i) => { b.visible = age > 3600 && age < 86400 * 1.2 || (age >= 86400 && i === 0); const a = i * 2.1; b.position.set(Math.cos(a) * 0.1 * (i ? 1 : 0), h + 0.05 + (i ? -0.12 : 0), Math.sin(a) * 0.1 * (i ? 1 : 0)); });
    crown.visible = age >= 86400; crown.position.y = h + 0.4; crown.scale.setScalar(0.6 + Math.min(1, (age - 86400) / (86400 * 6)) * 0.8);
    if (crown.visible) blooms.forEach((b, i) => { b.visible = true; const a = i * 2.1; b.position.set(Math.cos(a) * 0.55, h + 0.5 + (i % 2) * 0.25, Math.sin(a) * 0.55); });
    const stage = age >= 86400 ? 4 : age > 3600 ? 3 : age > 600 ? 2 : age > 60 ? 1 : 0;
    if (p.stage >= 0 && stage > p.stage && stage >= 3 && Math.hypot(me.x - p.x, me.z - p.z) < 10) { burst(p.x, floorY(p.x, p.z) + h + 0.3, p.z); say('l-grown', { cooldown: 600 }); }
    p.stage = stage;
  }
  plants.forEach(buildPlant);
  const canPlant = () => {
    const r = r0();
    if (!inGarden() || r < R_WALK + 1.5 || r > R_GARDEN - 2 || me.state === 'walk' || me.hold === 'kite') return false;
    const x = me.x + Math.sin(me.face) * 0.6, z = me.z + Math.cos(me.face) * 0.6;
    return parkClear(x, z, 0.4) && !plants.some((p) => Math.hypot(p.x - x, p.z - z) < 1.3);
  };
  actions.seed = () => {
    if (!canPlant()) return;
    standUp(me); act('plant', 1.6);
    const x = me.x + Math.sin(me.face) * 0.6, z = me.z + Math.cos(me.face) * 0.6;
    setTimeout(() => {
      const p = { x, z, t: Date.now(), c: Math.floor(Math.random() * PCOL.length) };
      plants.push(p);
      while (plants.length > 24) { const o = plants.shift(); if (o.g) scene.remove(o.g); } // 가장 오래된 것부터 정리
      buildPlant(p); save(); sfx('impact/impactSoft_medium_000', 0.15, 1.4); burst(x, floorY(x, z) + 0.2, z);
      say('l-seed', { delay: 1, cooldown: 300 });
    }, 1000);
  };
  avail.push(() => (canPlant() ? 'seed' : null));
  let growT = 0;
  steps.push((dt) => { if ((growT -= dt) < 0) { growT = 5; plants.forEach(grow); } });

  // ---------- 사진 찍기: 단추와 안내를 감추고 지금 화면을 그림 파일로 ----------
  const photo = document.createElement('div');
  photo.id = 'photo'; photo.hidden = true;
  photo.innerHTML = `<button class="shutter" aria-label="take photo"></button><button class="close" aria-label="close">×</button><div class="flash"></div>`;
  document.body.appendChild(photo);
  const setPhoto = (on) => { photo.hidden = !on; document.body.classList.toggle('photo-mode', on); };
  photo.querySelector('.close').addEventListener('pointerdown', (e) => { e.stopPropagation(); setPhoto(false); });
  photo.querySelector('.shutter').addEventListener('pointerdown', (e) => { e.stopPropagation(); snap(); });
  function snap() {
    const fl = photo.querySelector('.flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    sfx('share', 0.2, 1.3);
    renderer.render(scene, camera);
    const name = 'wheel-life-cafe-' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '.png';
    renderer.domElement.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], name, { type: 'image/png' });
      if (matchMedia('(hover: none)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch (err) { /* 취소하면 내려받기로 */ }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      if (toast) toast('사진을 저장했어요', 2);
    }, 'image/png');
  }

  return {
    actions,
    available: () => avail.flatMap((f) => { const v = f(); return v == null ? [] : [v]; }),
    step(dt, t) { for (const f of steps) f(dt, t); },
    // 마을 물가에서 낚시할 물 쪽 점 (signs.js가 씀). 물 높이는 구역 값
    fishSpot: () => { const z = shoreZone(); return z && z.fish !== false ? { x: z.water.x, z: z.water.z, y: z.waterY ?? -0.42 } : null; },
    togglePhoto: () => setPhoto(photo.hidden),
    photoOn: () => !photo.hidden,
    snap,
  };
}
