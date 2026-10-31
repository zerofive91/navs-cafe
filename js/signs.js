// 예수님의 표적을 몸으로 겪는 곳 (체험이 끝나면 말씀 한 구절이 은은하게 떠오름)
//  1. 물 위를 걸으심 (마 14)  : 물 한가운데 오래 멈춰 서면 천천히 가라앉고, 빛의 손이 붙잡아 올림
//  2. 풍랑을 잔잔케 하심 (막 4): 배에 앉아 있으면 하늘이 어두워지고 물결이 일어남. 손을 들면 고요해짐
//  3. 오병이어 (요 6)          : 긴 테이블의 작은 바구니를 누르면 모두에게 떡이 가고 열두 바구니가 남음
// 구절은 저작권이 끝난 개역한글판을 씀
import * as THREE from 'three';
import { onWater, LONG_TABLE, polar } from './layout.js';

const VERSES = {
  water: ['안심하라 내니 두려워 말라', '마태복음 14:27'],
  storm: ['잠잠하라 고요하라 하시니 바람이 그치고 아주 잔잔하여지더라', '마가복음 4:39'],
  bread: ['나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요', '요한복음 6:35'],
};

const verseEl = document.getElementById('verse');
let verseTimer = 0;
export function showVerse(key) {
  const [text, ref] = VERSES[key];
  verseEl.querySelector('p').textContent = text;
  verseEl.querySelector('cite').textContent = ref;
  verseEl.hidden = false;
  requestAnimationFrame(() => verseEl.classList.add('on'));
  clearTimeout(verseTimer);
  verseTimer = setTimeout(() => {
    verseEl.classList.remove('on');
    verseTimer = setTimeout(() => { verseEl.hidden = true; }, 1600);
  }, 7000);
}

const ease = (u) => u * u * (3 - 2 * u);

export function initSigns({ scene, me, npcs, interactive, act, sfx, fxSprite, burst, sun, walkTo, faceTo }) {
  const now = () => performance.now() / 1000;

  // ---------- 1. 물 위를 걸으심 ----------
  const water = { still: 0, phase: null, t: 0, cool: 0, hand: null };
  function stepWater(dt) {
    const w = onWater(me.x, me.z);
    const resting = w && me.state === 'idle' && !me.seat && !me.jumps;
    water.cool -= dt;
    if (!water.phase) {
      water.still = resting ? water.still + dt : 0;
      me.sinkY = (me.sinkY || 0) * Math.max(0, 1 - dt * 4);
      if (water.still > 3.5 && water.cool <= 0) { water.phase = 'sink'; water.t = 0; }
      return;
    }
    if (!resting && water.phase === 'sink') { water.phase = null; water.still = 0; water.cool = 4; return; } // 다시 걸으면 멈춤
    water.t += dt;
    if (water.phase === 'sink') {
      me.sinkY = -0.6 * ease(Math.min(1, water.t / 2.4));
      if (water.t > 2.6) {
        water.phase = 'lift'; water.t = 0;
        water.hand = fxSprite('light_01', 0xfff0c8, 1.6);
        water.hand.position.set(me.x, me.y + 3, me.z);
        scene.add(water.hand);
        sfx('orb', 0.22);
      }
    } else if (water.phase === 'lift') {
      const u = Math.min(1, water.t / 1.8);
      water.hand.position.set(me.x, me.y + 3 - 2.2 * ease(Math.min(1, u * 1.6)) + 0.9 * Math.max(0, u - 0.6), me.z);
      water.hand.material.opacity = u < 0.8 ? 1 : (1 - u) * 5;
      me.sinkY = -0.6 * (1 - ease(Math.max(0, (u - 0.35) / 0.65)));
      if (u >= 1) {
        scene.remove(water.hand); water.hand.material.dispose(); water.hand = null;
        water.phase = null; water.still = 0; water.cool = 25; me.sinkY = 0;
        burst(me.x, me.y + 1, me.z);
        showVerse('water');
      }
    }
  }

  // ---------- 2. 풍랑을 잔잔케 하심 ----------
  const storm = { level: 0, want: 0, sat: 0, cool: 0, calming: false, base: null };
  function stepStorm(dt) {
    const inBoat = me.seat && me.seat.kind === 'boat' && me.state === 'sit';
    storm.cool -= dt;
    storm.sat = inBoat ? storm.sat + dt : 0;
    if (inBoat && storm.sat > 5 && storm.cool <= 0 && !storm.calming && storm.want === 0) { storm.want = 1; sfx('spin', 0.12); }
    if (!inBoat && storm.want) { storm.want = 0; storm.calming = false; storm.cool = 5; } // 배에서 내리면 그냥 걷힘
    const rate = storm.calming ? 0.45 : 0.35;
    storm.level += Math.sign(storm.want - storm.level) * Math.min(Math.abs(storm.want - storm.level), dt * rate);
    if (storm.calming && storm.level <= 0.001) { storm.calming = false; storm.cool = 40; showVerse('storm'); }
    // 하늘·빛·안개 (평소 값은 풍랑이 없을 때마다 새로 기억)
    if (!scene.fog) return;
    if (storm.level < 0.001) {
      storm.base = { fog: scene.fog.color.clone(), near: scene.fog.near, far: scene.fog.far, sun: sun.intensity };
      scene.backgroundIntensity = 1;
      return;
    }
    const s = storm.level, B = storm.base;
    scene.fog.color.copy(B.fog).lerp(new THREE.Color(0x6f7a86), s * 0.8);
    scene.fog.near = B.near * (1 - 0.75 * s);
    scene.fog.far = B.far * (1 - 0.6 * s);
    sun.intensity = B.sun * (1 - 0.7 * s);
    scene.backgroundIntensity = 1 - 0.65 * s;
  }
  function calm() {
    if (storm.level < 0.3 || storm.calming) return;
    storm.want = 0; storm.calming = true;
    act('wave', 2.4);
    sfx('share', 0.2);
    burst(me.x, me.y + 2.2, me.z);
  }

  // ---------- 3. 오병이어 ----------
  const dir = polar(1, LONG_TABLE.rot);
  const bx = LONG_TABLE.x - dir.z * 0.15, bz = LONG_TABLE.z + dir.x * 0.15;
  const wicker = new THREE.MeshStandardMaterial({ color: 0xb98a5a, roughness: 0.9 });
  const loafMat = new THREE.MeshStandardMaterial({ color: 0xe0b57a, roughness: 0.7 });
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xc9d3da, roughness: 0.5, metalness: 0.1 });
  function makeBasket(scale = 1, full = true) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.16, 18, 1, true), wicker);
    body.material.side = THREE.DoubleSide;
    body.position.y = 0.08;
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.17, 18), wicker);
    bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.005;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 24), wicker);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.16;
    g.add(body, bottom, rim);
    if (full) {
      for (let i = 0; i < 5; i++) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), loafMat);
        const a = (i / 5) * Math.PI * 2;
        l.scale.set(1.2, 0.7, 0.9);
        l.position.set(Math.cos(a) * 0.1, 0.17 + (i === 0 ? 0.04 : 0), Math.sin(a) * 0.1);
        g.add(l);
      }
      for (const s of [-1, 1]) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), fishMat);
        f.scale.set(2.2, 0.5, 0.8);
        f.position.set(0.02 * s, 0.22, 0.05 * s);
        f.rotation.y = s * 0.5;
        g.add(f);
      }
    }
    g.scale.setScalar(scale);
    return g;
  }
  const basket = makeBasket(1.1);
  basket.position.set(bx, 0.8, bz);
  scene.add(basket);
  basket.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.userData.onTap = () => feed(); interactive.push(c); } });

  const flying = [];
  const leftovers = [];
  let breadCool = 0;
  function feed() {
    if (breadCool > 0) return;
    if (Math.hypot(me.x - bx, me.z - bz) > 3.2) {
      return walkTo(me, { x: bx - dir.z * 1.6, z: bz + dir.x * 1.6 }, () => { faceTo(me, { x: bx, z: bz }); feed(); });
    }
    breadCool = 16;
    faceTo(me, { x: bx, z: bz });
    act('share', 2.4);
    sfx('share', 0.2);
    const people = [me, ...npcs];
    people.forEach((p, k) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), loafMat);
      m.scale.set(1.2, 0.7, 0.9);
      m.add(fxSprite('light_01', 0xffe2a8, 0.6));
      scene.add(m);
      flying.push({ m, to: p, t: -0.25 * k });
    });
    // 남은 열두 바구니: 테이블 둘레 바닥에 하나씩 나타남
    for (let i = 0; i < 12; i++) {
      const side = i < 6 ? 1 : -1;
      const t = -2.5 + (i % 6) * 1.0;
      const b = makeBasket(0.9);
      b.position.set(LONG_TABLE.x + dir.x * t - dir.z * 1.25 * side, 0.01, LONG_TABLE.z + dir.z * t + dir.x * 1.25 * side);
      b.scale.setScalar(0.001);
      const glow = fxSprite('light_01', 0xffe9b8, 0.9);
      glow.position.y = 0.25;
      b.add(glow);
      scene.add(b);
      leftovers.push({ b, glow, t: -1.6 - i * 0.18 });
    }
  }
  function stepBread(dt) {
    breadCool -= dt;
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.t += dt / 1.2;
      const u = Math.max(0, Math.min(1, f.t));
      const p = f.to;
      f.m.visible = f.t > 0;
      f.m.position.set(bx + (p.x - bx) * u, 1.0 + ((p.y || 0) + 1.0 - 1.0) * u + Math.sin(u * Math.PI) * 0.8, bz + (p.z - bz) * u);
      if (f.t >= 1) {
        scene.remove(f.m);
        flying.splice(i, 1);
        if (p !== me) { p.glow = 2; } else sfx('cup', 0.15);
      }
    }
    for (let i = leftovers.length - 1; i >= 0; i--) {
      const l = leftovers[i];
      l.t += dt;
      if (l.t < 0) continue;
      const grow = Math.min(1, l.t / 0.6);
      const fade = l.t > 9 ? Math.max(0, 1 - (l.t - 9) / 1.5) : 1;
      l.b.scale.setScalar(0.9 * ease(grow) * (fade > 0 ? 1 : 0.001));
      l.glow.material.opacity = (l.t < 2 ? 1 : Math.max(0.25, 1 - (l.t - 2) / 3)) * fade;
      if (l.t > 0 && l.t < dt * 1.5 && i === leftovers.length - 1) showVerse('bread');
      if (fade <= 0) { scene.remove(l.b); leftovers.splice(i, 1); }
    }
  }

  return {
    step(dt) { stepWater(dt); stepStorm(dt); stepBread(dt); },
    storm,
    feed,
    calm,
    nearBread: () => Math.hypot(me.x - bx, me.z - bz) < 3.2,
    canCalm: () => storm.level > 0.3 && !storm.calming,
    sinking: () => water.phase !== null,
  };
}
