// 성경 이야기 체험: 여리고 성(히 11:30), 다윗과 골리앗(삼상 17:45), 요나와 큰 물고기(욘 2)
import * as THREE from 'three';
import { PARK, JERICHO, GOLIATH, JONAH_POND, obstacles } from './layout.js';
import { showVerse, VERSES } from './verses.js';
import { makeAvatar } from './avatar.js';

Object.assign(VERSES, {
  jericho: ['믿음으로 칠 일 동안 여리고를 두루 다니매 성이 무너졌으며', '히브리서 11:30'],
  david: ['너는 칼과 창과 단창으로 내게 오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 가노라', '사무엘상 17:45'],
  david2: ['또 여호와의 구원하심이 칼과 창에 있지 아니함을 이 무리로 알게 하리라 전쟁은 여호와께 속한 것인즉', '사무엘상 17:47'],
  jonahIn: ['가로되 내가 받는 고난을 인하여 여호와께 불러 아뢰었삽더니 주께서 내게 대답하셨고 내가 스올의 뱃속에서 부르짖었삽더니 주께서 나의 음성을 들으셨나이다', '요나 2:2'],
  jonahOut: ['나는 감사하는 목소리로 주께 제사를 드리며 나의 서원을 주께 갚겠나이다 구원은 여호와께로서 말미암나이다', '요나 2:9'],
});

// 짧은 나팔 소리: 톱니파 세 음을 겹쳐 부드럽게 거름
export function fanfare(audio, notes = [392, 494, 587], len = 0.9, gap = 0.22, vol = 0.08) {
  const c = audio.get(); if (!c) return;
  const t0 = c.currentTime;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
  f.connect(c.destination);
  notes.forEach((hz, i) => {
    const s = t0 + i * gap;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz;
    const g = c.createGain();
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + 0.05);
    g.gain.setValueAtTime(vol, s + len - (notes.length - 1 - i) * gap * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, s + len + 0.6);
    o.connect(g).connect(f); o.start(s); o.stop(s + len + 0.7);
  });
}

export function addStories(ctx) {
  const { scene, me, act, sfx, fxSprite, burst, faceTo, actions, avail, steps, go, tapTo, audio, H } = ctx;
  const shot = ctx.shot || (() => {});
  const { M, MAT, shadow, zoneGroup, at, box, flat, ease, G0 } = H;
  const dist = (p) => Math.hypot(me.x - p.x, me.z - p.z);
  const hit = (name, vol = 0.3, rate = 1) => sfx('impact/' + name, vol, rate);
  const sandM = M(0xd8c39a, 1), brickM = M(0xc9a87a, 0.95), brickD = M(0xa98a60, 0.95);

  // ---------- 여리고 성: 성 둘레를 일곱 바퀴 돌면 나팔, 성벽이 무너짐 ----------
  {
    const zn = PARK.jericho;
    const g = zoneGroup(scene, zn);
    // 성을 도는 길
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.3, 5.6, 48), sandM);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.013; ring.receiveShadow = true;
    g.add(ring);
    // 성벽: 20토막 + 망대 4개, 한 토막엔 라합의 붉은 줄 (수 2:18)
    const walls = [];
    const N = 20, R = JERICHO.R;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      const seg = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.8, (2 * Math.PI * R) / N + 0.05), k % 2 ? brickM : brickD);
      w.position.y = 0.9;
      seg.add(w);
      for (let c = -1; c <= 1; c += 2) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.3), brickM); m.position.set(0, 1.92, c * 0.3); seg.add(m); }
      if (k === 7) {
        const cord = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.3, 0.05), M(0xc0262b, 0.6));
        cord.position.set(0.29, 1.15, 0); seg.add(cord);
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.3), M(0x3b2a1a)); win.position.set(0.29, 1.5, 0); seg.add(win);
      }
      // 그룹 안: x = 바깥(v), z = 둘레(u)
      seg.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      seg.rotation.y = -a;
      g.add(shadow(seg));
      walls.push({ seg, a, keep: k === 7 });
    }
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 2.6, 10), brickM);
      t.position.set(Math.cos(a) * R, 1.3, Math.sin(a) * R);
      g.add(shadow(t));
      walls.push({ seg: t, a, tower: true });
    }
    // 성 안의 집들
    for (const [u, v, h] of [[-1, -0.6, 1.2], [0.9, 0.4, 1.6], [-0.2, 1.3, 1.0]]) {
      const hs = box(1.1, h, 1.1, sandM); at(hs, u, h / 2, v); g.add(shadow(hs));
    }
    // 바퀴 수를 보여 주는 일곱 등불 (성 위에 둥글게 떠 있음)
    const lamps = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), M(0x8a7a60, 0.5, { emissive: 0xffc860, emissiveIntensity: 0 }));
      l.position.set(Math.cos(a) * 1.3, 3.1, Math.sin(a) * 1.3);
      const glow = fxSprite('light_01', 0xffd98a, 0.9); glow.material.opacity = 0; l.add(glow);
      g.add(l); lamps.push({ l, glow });
    }
    const blocks = obstacles.filter((o) => o.tag === 'jericho');
    const saved = blocks.map((o) => o.r);
    let acc = 0, lastA = null, laps = 0, fallT = -1;
    const C = JERICHO;
    const lit = (n) => lamps.forEach((L, i) => { L.l.material.emissiveIntensity = i < n ? 1.2 : 0; L.glow.material.opacity = i < n ? 0.8 : 0; });
    actions.trumpet = () => {
      faceTo(me, C); act('praise', 3); shot(C, { dist: 16, el: 0.5, side: 0.25, dur: 10, mid: 0.8, y: 1 });
      fanfare(audio, [392, 523, 659, 784], 1.1, 0.25, 0.09);
      setTimeout(() => { fallT = 0; }, 1300);
    };
    avail.push(() => (laps >= 7 && fallT < 0 && dist(C) < 7.5 ? 'trumpet' : null));
    steps.push((dt, t) => {
      lamps.forEach((L, i) => { if (i < laps) L.glow.material.opacity = 0.65 + Math.sin(t * 3 + i) * 0.2; });
      if (fallT >= 0) {
        fallT += dt;
        const k = ease(fallT / 1.4);
        for (const w of walls) {
          if (w.keep) continue;
          if (w.tower) { w.seg.scale.y = Math.max(0.15, 1 - k * 0.85); w.seg.position.y = 1.3 * w.seg.scale.y; continue; }
          w.seg.rotation.z = -k * 1.45 * (0.85 + ((w.a * 7) % 0.3)); // 바깥으로 쓰러짐
        }
        if (fallT < 1.6 && Math.random() < dt * 14) { hit('impactPlank_medium_000', 0.25, 0.5 + Math.random() * 0.4); }
        if (fallT > 0.2 && fallT - dt <= 0.2) for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2; burst(C.x + Math.cos(a) * C.R, 0.3 + Math.random(), C.z + Math.sin(a) * C.R); }
        if (fallT > 1.4 && fallT - dt <= 1.4) { blocks.forEach((o) => { o.r = -9; }); showVerse('jericho', { cooldown: 0, delay: 0.6 }); }
        // 2분 뒤 다시 세워짐
        if (fallT > 120) {
          fallT = -1; laps = 0; acc = 0; lit(0);
          for (const w of walls) { w.seg.rotation.z = 0; if (w.tower) { w.seg.scale.y = 1; w.seg.position.y = 1.3; } }
          blocks.forEach((o, i) => { o.r = saved[i]; });
          if (dist(C) < C.R + 0.8) { const a = Math.atan2(me.z - C.z, me.x - C.x); me.x = C.x + Math.cos(a) * 4.8; me.z = C.z + Math.sin(a) * 4.8; }
        }
        return;
      }
      const d = dist(C);
      if (d > 3.6 && d < 7.5) {
        const a = Math.atan2(me.z - C.z, me.x - C.x);
        if (lastA !== null) { let da = a - lastA; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2; acc += da; }
        lastA = a;
        const n = Math.min(7, Math.floor(Math.abs(acc) / (Math.PI * 2)));
        if (n > laps) { laps = n; lit(n); sfx('orb', 0.15 + n * 0.02, 0.8 + n * 0.06); if (n === 7) fanfare(audio, [392, 523], 0.6, 0.2, 0.05); }
      } else {
        lastA = null;
        if (d > 16 && laps < 7) { acc = 0; laps = 0; lit(0); }
      }
    });
  }

  // ---------- 다윗과 골리앗: 시냇가 매끄러운 돌 다섯, 물맷돌 ----------
  {
    const zn = PARK.david;
    const g = zoneGroup(scene, zn);
    // 시내 (삼상 17:40)
    const brook = flat(9, 1.3, M(0x7fb6c9, 0.25, { transparent: true, opacity: 0.85 }), 0.02);
    at(brook, -1, 0.02, -3.8); g.add(brook);
    for (let k = 0; k < 9; k++) {
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + Math.random() * 0.05, 0), MAT.stone);
      at(st, -5 + k * 1.05, 0.05, -3.8 + (Math.random() - 0.5) * 0.9); st.scale.y = 0.6; g.add(st);
    }
    // 블레셋 진영의 막대 깃발
    for (const u of [4.8, 2.2]) {
      const pole = box(0.08, 2.4, 0.08, MAT.woodDark); at(pole, u, 1.2, 3.8); g.add(pole);
      const fl = box(0.7, 0.45, 0.03, M(0x6b3b3b)); at(fl, u + 0.38, 2.15, 3.8); g.add(fl);
    }
    // 골리앗: 커다란 사람 + 투구·갑옷·창
    const giant = new THREE.Group();
    const gp = GOLIATH;
    giant.position.set(gp.x, G0, gp.z);
    scene.add(giant);
    const pivot = new THREE.Group(); giant.add(pivot);
    let fallen = -1;
    const H_GIANT = 4.4;
    {
      // 이 공간 사람들과 같은 모양의 거인 (투구·놋 갑옷·창·방패)
      const av = makeAvatar({ hoodie: 0x8a6a3a, hair: 0x2a1c14, bag: 0x5a4a32, style: 0, pants: 0x4a3a2a });
      const u = av.userData;
      const bagM = u.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1);
      if (bagM) bagM.visible = false;
      av.scale.setScalar(H_GIANT / 1.3);
      const brass = M(0xb08d3c, 0.35, { metalness: 0.6 });
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), brass);
      helm.position.y = 0.04; u.head.add(helm);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.42), M(0x8a2a2a)); crest.position.y = 0.38; u.head.add(crest);
      const plate = new THREE.Mesh(new THREE.CapsuleGeometry(0.215, 0.12, 6, 14), brass); plate.position.y = 0.6; plate.scale.set(1, 1, 0.95); u.body.add(plate);
      const spear = new THREE.Group(); spear.position.set(0.34, 0.55, 0.12); u.body.add(spear);
      spear.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 6), MAT.woodDark));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 6), brass); tip.position.y = 0.92; spear.add(tip);
      const shieldM = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 18), brass);
      shieldM.rotation.z = Math.PI / 2; shieldM.position.set(-0.3, 0.55, 0.06); u.body.add(shieldM);
      pivot.add(shadow(av));
    }
    // 다윗 자리에서 골리앗을 바라봄
    const spot = () => zn.at(-3.2, -1.6);
    giant.rotation.y = Math.atan2(spot().x - gp.x, spot().z - gp.z);
    const stone = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), MAT.stone);
    stone.visible = false; scene.add(stone);
    let shotT = -1;
    const from = new THREE.Vector3(), to = new THREE.Vector3();
    actions.sling = () => go(spot, () => {
      faceTo(me, gp); shot(gp, { dist: 13, el: 0.22, side: 0.32, dur: 9, mid: 0.55, y: 1.8 }); act('plant', 1.0); // 시냇가에서 돌을 고름
      hit('impactGeneric_light_001', 0.2);
      setTimeout(() => {
        faceTo(me, gp); act('shoot', 1.6); sfx('spin', 0.25, 1.4);
        shotT = 0;
      }, 1100);
    }, 2.5);
    avail.push(() => (dist(zn) < 7.5 && fallen < 0 && shotT < 0 ? 'sling' : null));
    tapTo([giant], spot, () => { if (fallen < 0 && shotT < 0) actions.sling(); }, 2.5);
    steps.push((dt) => {
      if (shotT >= 0) {
        shotT += dt;
        const k = Math.min(1, (shotT - 0.35) / 0.55);
        if (k < 0) return;
        if (!stone.visible) { stone.visible = true; from.set(me.x, (me.y || G0) + 1.5, me.z); to.set(gp.x, G0 + H_GIANT * 0.8, gp.z); }
        stone.position.lerpVectors(from, to, k); stone.position.y += Math.sin(k * Math.PI) * 1.2;
        if (k >= 1) {
          stone.visible = false; shotT = -1; fallen = 0;
          hit('impactPunch_medium_000', 0.5, 0.8);
          burst(to.x, to.y, to.z);
        }
      }
      if (fallen >= 0) {
        fallen += dt;
        const k = ease((fallen - 0.4) / 1.1);
        pivot.rotation.x = k * (Math.PI / 2 - 0.08); // 얼굴을 땅에 대고 엎드러짐 (삼상 17:49)
        if (fallen > 1.5 && fallen - dt <= 1.5) { hit('impactPlank_medium_000', 0.5, 0.45); hit('impactSoft_heavy_000', 0.5, 0.6); for (let i = 0; i < 6; i++) burst(gp.x + (Math.random() - 0.5) * 2, 0.2, gp.z + (Math.random() - 0.5) * 2); }
        if (fallen > 2 && fallen - dt <= 2) { showVerse('david', { cooldown: 0, delay: 0.3, then: ['david2'] }); }
        // 1분 뒤 다시 일어남
        if (fallen > 60) { const r = ease((fallen - 60) / 2); pivot.rotation.x = (1 - r) * (Math.PI / 2 - 0.08); }
        if (fallen > 62) fallen = -1;
      }
    });
  }

  // ---------- 요나와 큰 물고기: 삼켜졌다가 사흘 뒤 뭍에 토해짐 ----------
  {
    const zn = PARK.jonah;
    const g = zoneGroup(scene, zn);
    const P = JONAH_POND;
    // 못: 물빛 원판 + 둘레 돌
    const water = new THREE.Mesh(new THREE.CircleGeometry(P.r, 40), M(0x3f7f99, 0.15, { transparent: true, opacity: 0.92 }));
    water.rotation.x = -Math.PI / 2; water.position.set(P.x, G0 + 0.03, P.z); scene.add(water);
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.12, 0), MAT.stone);
      st.position.set(P.x + Math.cos(a) * P.r, G0 + 0.08, P.z + Math.sin(a) * P.r); st.scale.y = 0.55;
      scene.add(shadow(st));
    }
    // 작은 배 (다시스로 가던 배)
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 2.0, 10, 1, false, 0, Math.PI), MAT.wood);
    hull.rotation.set(0, 0, -Math.PI / 2);
    hull.scale.set(1, 1, 0.8); hull.position.y = 0.32; boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), MAT.woodDark); mast.position.y = 1.2; boat.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), M(0xf2ead8, 0.8, { side: THREE.DoubleSide })); sail.position.set(0, 1.35, 0.02); sail.rotation.y = Math.PI / 2; boat.add(sail);
    boat.position.set(P.x + 1.6, G0, P.z - 1.2); scene.add(shadow(boat));
    // 큰 물고기: 몸통·꼬리·지느러미·벌어지는 아래턱
    const fish = new THREE.Group();
    const skin = M(0x4a6d86, 0.6), belly = M(0xc9d6dc, 0.7);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin); body.scale.set(1.05, 0.95, 2.4); fish.add(body);
    const under = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), belly); under.scale.set(1.0, 0.9, 2.3); under.position.y = -0.02; fish.add(under);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.25, 1.6); fish.add(jaw);
    const jm = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), belly); jm.scale.set(1, 0.5, 1.2); jm.position.z = 0.3; jaw.add(jm);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.62, 18), M(0x2a1418, 0.9)); mouth.position.set(0, -0.05, 2.3); fish.add(mouth);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.3, 4), skin); tail.rotation.x = -Math.PI / 2; tail.scale.set(1.5, 1, 0.25); tail.position.z = -2.8; fish.add(tail);
    for (const s of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 4), skin); fin.rotation.z = s * 1.9; fin.position.set(s * 0.95, -0.3, 0.4); fish.add(fin);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0x111111, 0.3)); eye.position.set(s * 0.72, 0.25, 1.55); fish.add(eye);
    }
    fish.position.set(P.x, G0 - 2.6, P.z); fish.visible = false;
    scene.add(fish);
    // 뱃속 어둠 (사흘 밤낮)
    const dark = document.createElement('div');
    dark.id = 'belly';
    dark.innerHTML = '<i></i><i></i><i></i>';
    const verseEl = document.getElementById('verse');
    if (verseEl) document.body.insertBefore(dark, verseEl); else document.body.appendChild(dark);
    const spot = () => zn.at(-4.6, -0.6);
    const shore = () => zn.at(-4.4, -3.6);
    let T = -1, hum = null;
    const mouthAt = () => { const f = new THREE.Vector3(0, 0, 2.3).applyMatrix4(fish.matrixWorld); return { x: f.x, z: f.z }; };
    actions.jonah = () => go(spot, () => { faceTo(me, P); act(null); T = 0; audio.splash(0.3); shot(P, { dist: 13, el: 0.4, side: 0.3, dur: 17, mid: 0.6 }); });
    avail.push(() => (dist(spot()) < 3.4 && T < 0 ? 'jonah' : null));
    tapTo([boat, water], spot, () => { if (T < 0) actions.jonah(); }, 3);
    steps.push((dt, t) => {
      if (T < 0) { water.material.opacity = 0.9 + Math.sin(t) * 0.02; return; }
      T += dt;
      const toMe = Math.atan2(me.x - P.x, me.z - P.z);
      // 0-1.6: 물고기가 솟아오름, 입을 벌림
      if (T < 4.5) {
        fish.visible = true;
        const k = ease(T / 1.6);
        fish.position.set(P.x + Math.sin(toMe) * 1.2, G0 - 2.6 + k * 2.9, P.z + Math.cos(toMe) * 1.2);
        fish.rotation.set(-0.35 * k, toMe, 0);
        jaw.rotation.x = ease((T - 0.8) / 0.6) * 0.7;
        if (T > 0.1 && T - dt <= 0.1) { audio.splash(0.4); burst(P.x, 0.2, P.z); }
      }
      // 1.7-2.3: 삼킴
      if (T > 1.7 && T - dt <= 1.7) { audio.splash(0.5); hit('impactSoft_heavy_000', 0.4, 0.6); }
      if (T > 1.7 && T < 2.4) { const m = mouthAt(); me.x += (m.x - me.x) * Math.min(1, dt * 6); me.z += (m.z - me.z) * Math.min(1, dt * 6); }
      if (T > 2.2 && T - dt <= 2.2) {
        me.hidden = true; jaw.rotation.x = 0;
        dark.classList.add('on');
        hum = hum || audio.loop('lowpass', 160, 0.5); if (hum) hum.set(0.25);
        showVerse('jonahIn', { cooldown: 0, delay: 1.5, title: '사흘 밤낮' });
      }
      if (T > 2.2 && T < 11) {
        me.path = []; const m = mouthAt(); me.x = m.x; me.z = m.z; // 뱃속에 머묾
        fish.position.y = G0 - 2.6 + 2.9 * (1 - ease((T - 2.4) / 2));
        const days = Math.min(3, Math.floor((T - 3.5) / 2.2) + 1);
        dark.querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i < days));
      }
      // 11-13: 다시 솟아 뭍에 토해냄
      if (T > 11 && T < 14) {
        const s = shore();
        const ang = Math.atan2(s.x - P.x, s.z - P.z);
        const k = ease((T - 11) / 1.2);
        fish.position.set(P.x + Math.sin(ang) * 1.4, G0 - 2.6 + k * 3.0, P.z + Math.cos(ang) * 1.4);
        fish.rotation.set(-0.45 * k, ang, 0);
        jaw.rotation.x = ease((T - 11.8) / 0.4) * 0.8;
      }
      if (T > 12.3 && T - dt <= 12.3) {
        const s = shore();
        me.x = s.x; me.z = s.z; me.path = []; me.hidden = false; me.hop = 1.2; me.vy = 3; me.jumps = 1;
        dark.classList.remove('on'); dark.querySelectorAll('i').forEach((el) => el.classList.remove('on'));
        if (hum) hum.set(0);
        audio.splash(0.5); burst(s.x, 0.5, s.z); hit('impactSoft_medium_000', 0.4);
      }
      if (T > 14 && T < 16) { fish.position.y -= dt * 2; jaw.rotation.x *= 0.9; }
      if (T > 15 && T - dt <= 15) showVerse('jonahOut', { cooldown: 0, title: '구원은 여호와께로서' });
      if (T > 16) { fish.visible = false; T = -1; }
    });
  }
}
