// 그 시각의 빛 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   사건 구역 안에서만 하늘·안개·빛을 그 시각(표 table의 한 줄)으로 천천히 바꾸고, 나오면 마을 기본(env)으로 돌려놓고 손을 뗌 (마을 기본값은 region.js setEnv가 맡음)
//   table: { 이름: { bg, fogC, fog: [near, far], hemiSky, hemiGround, hemi, sun(배율), stars?, dim?(빛 비추기 시험: 멈출수록 등불 둘레만 남음) } }
//   overlay(선택): 사건 뒤 마을 전체에 감도는 빛 { fogC, hemiSky, hemiGround, k, on() } — 안개·반구광 색만 (요한: 부활 뒤 새벽빛)
//   hold(): true인 동안 빛을 건드리지 않음 (누워서 별 보기 leisure.js) · onStars(k): 별 밝기 0~1이 바뀔 때 (요한: 지붕 등잔)
import * as THREE from 'three';

export function initSky({ scene, lights, me, env, table, inTown, overlay = null, hold = () => false, onStars = () => {} }) {
  const base = { bg: scene.background?.isColor ? scene.background.clone() : new THREE.Color(0xcfe3ee), hemi: lights.hemi.intensity, sun: lights.sun.intensity };
  const tgt = (p) => {
    if (!p) return { bg: base.bg.getHex(), fogC: env.sky, fog: env.fog, hemiSky: env.hemiSky, hemiGround: env.hemiGround, hemi: 1, sun: 1, stars: 0 };
    return { stars: 0, ...p };
  };
  const cur = { bg: new THREE.Color(), fogC: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), near: env.fog[0], far: env.fog[1], hemi: 1, sun: 1, stars: 0, dark: 0, applied: false };
  const tmp = new THREE.Color();
  let darkK = 0; // 빛 비추기 시험의 어둠 정도
  const stars = (() => {
    const pts = [];
    for (let k = 0; k < 700; k++) { const a = Math.random() * Math.PI * 2, e = Math.asin(0.1 + Math.random() * 0.9); pts.push(Math.cos(e) * Math.cos(a) * 240, Math.sin(e) * 240, Math.cos(e) * Math.sin(a) * 240); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const m = new THREE.PointsMaterial({ color: 0xfff8e8, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const s = new THREE.Points(g, m); s.visible = false; s.renderOrder = -1; scene.add(s); return s;
  })();
  // wantOf(): 지금 원하는 시각 이름 (없으면 null). 마을 안에서 빛을 쥘 때만 부름
  function step(dt, wantOf) {
    if (!inTown()) {
      if (cur.applied) { scene.background = base.bg.clone(); lights.hemi.intensity = base.hemi; lights.sun.intensity = base.sun; stars.visible = false; cur.applied = false; }
      return;
    }
    if (hold()) return;
    const want = wantOf(), T = tgt(table[want] || null);
    if (!cur.applied) {
      if (!want && darkK < 0.01) { glow(dt); return; } // 기본 낮: 마을 기본 그대로 (region.js setEnv), overlay가 있으면 그 빛만 더함
      cur.bg.copy(scene.background?.isColor ? scene.background : base.bg); cur.fogC.copy(scene.fog.color); cur.hemiSky.copy(lights.hemi.color); cur.hemiGround.copy(lights.hemi.groundColor);
      cur.near = scene.fog.near; cur.far = scene.fog.far; cur.hemi = lights.hemi.intensity / base.hemi; cur.sun = lights.sun.intensity / base.sun; cur.applied = true; unGlow();
    }
    const k = Math.min(1, dt * (T.dim ? 2.2 : 1.1));
    cur.bg.lerp(tmp.set(T.bg), k); cur.fogC.lerp(tmp.set(T.fogC), k); cur.hemiSky.lerp(tmp.set(T.hemiSky), k); cur.hemiGround.lerp(tmp.set(T.hemiGround), k);
    cur.near += (T.fog[0] - cur.near) * k; cur.far += (T.fog[1] - cur.far) * k; cur.hemi += (T.hemi - cur.hemi) * k; cur.sun += (T.sun - cur.sun) * k; cur.stars += (T.stars - cur.stars) * k;
    // 빛 비추기: 멈출수록 등불 둘레만 남음
    const far = T.dim ? Math.max(7, cur.far * (1 - 0.72 * darkK)) : cur.far;
    if (!scene.background?.isColor) scene.background = new THREE.Color();
    scene.background.copy(cur.bg); scene.fog.color.copy(cur.fogC); scene.fog.near = Math.min(cur.near, far - 2); scene.fog.far = far;
    lights.hemi.color.copy(cur.hemiSky); lights.hemi.groundColor.copy(cur.hemiGround);
    lights.hemi.intensity = base.hemi * cur.hemi; lights.sun.intensity = base.sun * cur.sun;
    stars.visible = cur.stars > 0.02; stars.material.opacity = cur.stars; if (stars.visible) stars.position.set(me.x, 0, me.z);
    onStars(cur.stars);
    // 다 돌아왔으면 손을 뗌 (마을 기본값은 region.js가 맡음)
    if (!want && darkK < 0.01 && Math.abs(cur.hemi - 1) < 0.01 && Math.abs(cur.far - env.fog[1]) < 1 && cur.stars < 0.02) {
      scene.background.copy(base.bg); scene.fog.color.set(env.sky); scene.fog.near = env.fog[0]; scene.fog.far = env.fog[1];
      lights.hemi.color.set(env.hemiSky); lights.hemi.groundColor.set(env.hemiGround); lights.hemi.intensity = base.hemi; lights.sun.intensity = base.sun;
      stars.visible = false; onStars(0); cur.applied = false;
    }
  }

  // overlay: 마을 기본 색(env)에서 overlay 쪽으로 k만큼. 시각(table)이 걸리면 그쪽이 맡고, 풀리면 다시 천천히 스밈
  let glowK = 0;
  const envC = { fog: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color() };
  function glow(dt) {
    if (!overlay) return;
    const want = overlay.on() ? overlay.k : 0;
    if (want === 0 && glowK === 0) return;
    glowK += (want - glowK) * Math.min(1, dt * 0.8);
    if (Math.abs(want - glowK) < 0.002) glowK = want;
    scene.fog.color.copy(envC.fog.set(env.sky)).lerp(tmp.set(overlay.fogC), glowK);
    lights.hemi.color.copy(envC.sky.set(env.hemiSky)).lerp(tmp.set(overlay.hemiSky), glowK);
    lights.hemi.groundColor.copy(envC.ground.set(env.hemiGround)).lerp(tmp.set(overlay.hemiGround), glowK);
  }
  // 시각이 바뀌면(table) overlay는 그 색에서 다시 시작
  const unGlow = () => { glowK = 0; };

  return {
    step,
    darkness: (k) => { darkK = k; }, // 빛 비추기 시험 (trials.js sky.darkness)
    dim: (name) => !!table[name]?.dim, // 이 시각이 빛 비추기(어둠) 시각인가 (구역 여유를 넓게)
  };
}
