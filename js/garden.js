// 카페 가까운 정원의 말씀 체험 (2026-11-03): 산책길 바로 바깥 네 곳, 성경 인물이 맞아 줌
//   엠마오로 가는 길 (동, 글로바): 함께 걷다가 식탁에 이르면 떡을 떼시던 장면 (눅 24:30-32)
//   산 위의 가르침 (마태): 언덕 앞 빛나는 자리에 서면 팔복이 차례로 (마 5:3-10)
//   빌립보 감옥 (서, 실라): 옥 안에서 기도(X)나 찬양(B)을 하면 지진이 나고 옥문이 열림 (행 16:25-31)
//   실로의 성막 (한나와 엘리): 성막 앞에서 기도하면 엘리가 축복함 (삼상 1:17, 27)
//   처음 마치면 걸음 +3, 능력치 +2, 1 데나리온 (profile.garden { emmaus: 1, ... })
import * as THREE from 'three';
import { GARDEN, floorY } from './layout.js';
import { showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import { addStat, addSteps, earn, STATS } from './profile.js';

const P = {
  emmaus: {
    name: '엠마오로 가는 길', who: '글로바', color: 0x9a7a54, stat: 'word',
    about: '저는 글로바예요. 슬퍼하며 이 길을 걷는데 낯선 분이 함께 걸으며 성경 이야기를 해 주셨어요. 같이 식탁까지 걸어 볼래요?',
    how: '"함께 걷기"를 누르고 글로바와 길을 따라 식탁 앞 빛 동그라미까지 가요.',
    verses: ['gd-emmaus-1', 'gd-emmaus-2', 'gd-emmaus-3'], title: '엠마오의 식탁',
  },
  mount: {
    name: '산 위의 가르침', who: '마태', color: 0x6a8a5a, stat: 'obey',
    about: '저는 마태예요. 세금 걷는 일을 하다 예수님을 따랐어요. 예수님이 언덕에서 \'복 있는 사람\' 여덟 가지를 가르치셨어요.',
    how: '언덕 앞 빛 동그라미에 잠시 서 있으면 팔복을 차례로 들어요. 말씀 카드를 누르면 다음 복으로 넘어가요.',
    verses: ['gd-mount-3', 'gd-mount-4', 'gd-mount-5', 'gd-mount-6', 'gd-mount-7', 'gd-mount-8', 'gd-mount-9', 'gd-mount-10'], title: '팔복',
  },
  prison: {
    name: '빌립보 감옥', who: '실라', color: 0x6a6a8a, stat: 'witness',
    about: '저는 실라예요. 바울과 함께 감옥에 갇혔어요. 발이 나무 틀에 묶였지만 밤에 기도하고 찬양했어요.',
    how: '감옥 안 빛 동그라미에서 두 손 모은 단추 (X)나 음표 단추 (B)를 눌러 봐요. 무슨 일이 생길까요?',
    verses: ['gd-prison-1', 'gd-prison-2', 'gd-prison-3'], title: '한밤의 찬송',
  },
  shiloh: {
    name: '실로의 성막', who: '한나', color: 0xb87a8a, stat: 'prayer',
    about: '저는 한나예요. 아기가 없어 마음이 아팠어요. 하나님의 천막 앞에서 소리 없이 마음을 다 쏟아 기도했어요.',
    how: '천막 앞 빛 동그라미에서 두 손 모은 단추를 눌러요 (X). 마음속 소원을 말해 봐요.',
    verses: ['gd-shiloh-1', 'gd-shiloh-2'], title: '한나의 기도',
  },
};

export function initGarden(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, busy, onChange, walkTo } = K;
  const G = (p) => floorY(p.x, p.z);
  const M = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const rec = () => { profile.garden = profile.garden || {}; return profile.garden; };
  const shadow = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  const label = (text, size = 0.9) => {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = '700 32px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = Math.min(300, g.measureText(text).width + 44);
    g.fillStyle = 'rgba(255,250,238,0.92)'; g.beginPath(); g.roundRect(160 - w / 2, 6, w, 52, 26); g.fill();
    g.fillStyle = '#6b4c32'; g.fillText(text, 160, 33);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(size * 2.5, size * 0.5, 1);
    return sp;
  };
  const ring = (p, color = 0xffe7a0, y = 0.06) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.85, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(p.x, G(p) + y, p.z); scene.add(m);
    // 멀리서도 보이는 빛기둥 (사용자: 빛나는 자리가 어딘지 구분이 안 됨)
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    glow.position.set(p.x, G(p) + 1.3, p.z); scene.add(glow); m.userData.glow = glow;
    return m;
  };
  const sign = (Z, text) => {
    const p = Z.at(-Z.w / 2 + 1.2, -Z.d / 2 + 0.6);
    const s = label(text, 0.9); s.position.set(p.x, G(p) + 2.7, p.z); scene.add(s);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.3, 8), M(0x6a5038)); post.position.set(p.x, G(p) + 1.15, p.z); post.castShadow = true; scene.add(post);
  };
  const person = (look, p, name) => {
    const n = makeChar({ hoodie: look, hair: 0x4a3a30, bag: look, style: 0, pants: 0x5a5048 }, p.x, p.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { ...p }; n.face0 = 0; n.face = 0;
    npcs.push(n); return n;
  };

  // ---------- 엠마오: 흙길, 식탁과 떡 ----------
  const E = GARDEN.emmaus;
  {
    const [a, b] = E.road, len = Math.hypot(b.x - a.x, b.z - a.z);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(1.8, len + 1.5), M(0xcbb084, 1));
    road.rotation.x = -Math.PI / 2; road.rotation.z = -E.zone.rot; road.position.set((a.x + b.x) / 2, G(E.zone) + 0.03, (a.z + b.z) / 2); road.receiveShadow = true; scene.add(road);
    const t = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.9), M(0x8a6440)); top.position.y = 0.78; t.add(top);
    for (const [x, z] of [[-0.6, -0.36], [0.6, -0.36], [-0.6, 0.36], [0.6, 0.36]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.07), M(0x6a4a30)); l.position.set(x, 0.39, z); t.add(l); }
    t.position.set(E.table.x, G(E.table), E.table.z); t.rotation.y = E.zone.rot; shadow(t); scene.add(t);
    E.bread = [];
    for (const dx of [-0.17, 0.17]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.09, 14, 1, false, 0, Math.PI), M(0xd8a85a, 0.7, { emissive: 0xffc860, emissiveIntensity: 0 })); h.position.set(dx * 0.2, 0.86, 0); h.rotation.y = dx < 0 ? Math.PI : 0; t.add(h); E.bread.push(h); }
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 10), M(0x9a7a5a)); cup.position.set(0.45, 0.9, 0.15); t.add(cup);
    E.ring = ring(E.stand);
    sign(E.zone, '엠마오로 가는 길');
  }
  // ---------- 산 위의 가르침: 풀 언덕 ----------
  const Mt = GARDEN.mount;
  {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(0x7aa05a, 1));
    hill.scale.set(3.4, 1.1, 2.6); hill.rotation.y = Mt.zone.rot; hill.position.set(Mt.top.x, G(Mt.top) - 0.05, Mt.top.z); hill.receiveShadow = true; scene.add(hill);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), M(0x9a9286, 0.95)); rock.scale.set(1.2, 0.6, 1); rock.position.set(Mt.top.x, G(Mt.top) + 1.1, Mt.top.z); rock.castShadow = true; scene.add(rock);
    Mt.ring = ring(Mt.stand);
    sign(Mt.zone, '산 위의 가르침');
  }
  // ---------- 빌립보 감옥: 돌바닥, 쇠창살 (카페 쪽은 열린 문) ----------
  const Pr = GARDEN.prison;
  {
    const Z = Pr.zone, c = Pr.cell;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 3.2), M(0x8a8478, 1)); floor.rotation.y = Z.rot; floor.position.set(c.x, G(c) + 0.04, c.z); floor.receiveShadow = true; scene.add(floor);
    Pr.bars = [];
    const mat = M(0x4a4440, 0.5, { metalness: 0.6 });
    // 국부 좌표 (u: 둘레, v: 바깥). 뒤(+v)·양옆 창살, 앞(-v) 창살은 처음에 닫힌 문
    const add = (u, v, side) => {
      const p = Z.at(u, v);
      const g = new THREE.Group(); g.position.set(p.x, G(p), p.z); g.rotation.y = Z.rot + (side ? Math.PI / 2 : 0);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), mat); bar.position.y = 1.1; bar.castShadow = true; g.add(bar);
      scene.add(g); Pr.bars.push({ g, fall: 0, dir: Math.random() < 0.5 ? -1 : 1 });
    };
    const lc = Z.local(c.x, c.z);
    for (let k = -1.6; k <= 1.61; k += 0.4) { add(lc.u + k, lc.v + 1.5, false); }
    for (let k = -1.1; k <= 1.11; k += 0.4) { add(lc.u - 1.7, lc.v + k + 0.2, true); add(lc.u + 1.7, lc.v + k + 0.2, true); }
    Pr.door = [];
    const door = new THREE.Group();
    for (let k = -0.6; k <= 0.61; k += 0.3) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), mat); b.position.set(k + 0.6, 1.0, 0); b.castShadow = true; door.add(b); }
    const hp = Z.at(lc.u + 0.4, lc.v - 1.5); door.position.set(hp.x, G(hp), hp.z); door.rotation.y = Z.rot + Math.PI / 2; scene.add(door); Pr.doorG = door;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.12), mat); const bp = Z.at(lc.u, lc.v + 1.5); beam.position.set(bp.x, G(bp) + 2.2, bp.z); beam.rotation.y = Z.rot + Math.PI / 2; scene.add(beam); Pr.bars.push({ g: beam, fall: 0, dir: 1, beam: true, y0: beam.position.y });
    // 차꼬 (실라와 바울 발 앞, 행 16:24)
    const stocks = new THREE.Group();
    for (const q of [Pr.npc, Pr.npc2]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.22), M(0x6a4a30)); s.position.set(q.x, G(q) + 0.17, q.z); s.rotation.y = Z.rot; stocks.add(s); }
    scene.add(stocks); Pr.stocks = stocks;
    // 빛나는 자리: 돌바닥(0.08m) 위로 올리고, 어두운 옥에서도 보이게 금빛 + 위로 비치는 빛기둥
    Pr.ring = ring(Pr.stand, 0xffe7a0, 0.11);
    sign(Z, '빌립보 감옥');
  }
  // ---------- 실로: 성막 장막과 엘리의 자리 ----------
  const Sh = GARDEN.shiloh;
  {
    const Z = Sh.zone, t = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.2), M(0xe8dcc0, 0.95)); base.position.y = 0.8; t.add(base);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 3.5, 3, 1), M(0x8a5a6a, 0.95)); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.9); roof.position.y = 2.0; t.add(roof);
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), M(0x5a7aa8, 0.9, { side: THREE.DoubleSide })); flap.position.set(0, 0.72, -1.11); t.add(flap);
    for (const x of [-1.5, 1.5]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), M(0xb89a5a, 0.5, { metalness: 0.3 })); p.position.set(x, 1.2, -1.15); t.add(p); }
    t.position.set(Sh.tent.x, G(Sh.tent), Sh.tent.z); t.rotation.y = Z.rot + Math.PI / 2; shadow(t); scene.add(t);
    const lamp = new THREE.PointLight(0xffd890, 0, 6); lamp.position.set(Sh.stand.x, G(Sh.stand) + 1.6, Sh.stand.z); scene.add(lamp); Sh.lamp = lamp;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), M(0x7a5a3a)); seat.position.set(Sh.eli.x, G(Sh.eli) + 0.22, Sh.eli.z); seat.castShadow = true; scene.add(seat);
    Sh.ring = ring(Sh.stand);
    sign(Z, '실로의 성막');
  }

  // ---------- 사람들 ----------
  const L = [];
  for (const [id, d] of Object.entries(P)) {
    const g = GARDEN[id];
    const n = person(d.color, g.npc, d.who);
    n.face0 = Math.atan2(g.zone.x - n.x, g.zone.z - n.z); n.face = n.face0;
    L.push({ id, d, g, n, said: false });
  }
  // 바울 (옥 안에서 실라 곁), 엘리 (성막 문설주 곁 의자, 삼상 1:9)
  const paul = person(0x7a5a8a, Pr.npc2, '바울'); paul.face0 = Math.atan2(Pr.cell.x - paul.x, Pr.cell.z - paul.z); paul.face = paul.face0;
  const eli = person(0xd8d0b8, Sh.eli, '제사장 엘리'); eli.face0 = Math.atan2(Sh.stand.x - eli.x, Sh.stand.z - eli.z); eli.face = eli.face0;
  const extras = [paul, eli];
  // 실라와 바울은 옥 안에 무릎 꿇고 기도
  const silas = L.find((x) => x.id === 'prison').n;

  // ---------- 말풍선 (dialog.js) ----------
  const dlg = createDialog({ id: 'xtalk' });
  let cur = null, mode = ''; // mode: 'talk' 소개 · 'doing' 체험 중 할 일 · 'thanks' 마친 인사
  const hide = () => { dlg.close(); cur = null; mode = ''; };
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  function talk(x) {
    cur = x; mode = 'talk';
    const done = rec()[x.id];
    // 체험 시작 단추: 엠마오는 함께 걷기, 나머지는 빛나는 자리로 걸어감
    dlg.open({
      who: x.d.who, n: x.d.name, say: x.d.about,
      how: x.d.how + (done ? ' (이미 해 봤어요. 또 해도 좋아요)' : ` 처음 마치면 걸음 +3, ${statName(x.d.stat)} +2, 1 데나리온.`),
      choices: [
        { label: '나중에', cls: 'later', on: hide },
        { label: x.id === 'emmaus' ? '함께 걷기' : '빛 동그라미로', cls: 'go', main: true, hidden: x.id === 'emmaus' && emm.on, on: () => begin(x) },
      ],
      esc: hide,
    });
  }

  // ---------- 체험 시작 ----------
  const TODO = { emmaus: '글로바와 함께 걸어요. 식탁 앞 빛 동그라미까지 가요', mount: '빛 동그라미에 잠시 서 있으면 팔복이 들려요', prison: '빛 동그라미에서 두 손 모은 단추 (X)나 음표 단추 (B)를 꾹 눌러요', shiloh: '빛 동그라미에서 두 손 모은 단추를 꾹 눌러요 (X)' };
  // 할 일은 말풍선에 계속 남김 (예전에는 4초 알림이 전부였음). [그만두기]로 끝낼 수 있음
  function doing(x) {
    cur = x; mode = 'doing';
    dlg.open({
      who: x.d.who, n: `${x.d.name} · 할 일`, say: TODO[x.id],
      choices: [{ label: '그만두기', cls: 'end', on: () => { if (x.id === 'emmaus') stopEmmaus(); hide(); } }],
      focus: false,
    });
  }
  function begin(x) {
    if (x.id === 'emmaus') return walkEmmaus(x);
    const s = x.g.stand;
    doing(x);
    walkTo?.(me, { x: s.x, z: s.z }, () => { me.face = Math.atan2(x.g.zone.x - s.x, x.g.zone.z - s.z); });
  }

  // ---------- 체험 마침 ----------
  function finish(x) {
    showVerse(x.d.verses[0], { cooldown: 0, delay: 0.6, title: x.d.title, then: x.d.verses.slice(1), stay: () => Math.hypot(me.x - x.g.zone.x, me.z - x.g.zone.z) < 14 });
    const first = !rec()[x.id];
    if (first) {
      rec()[x.id] = 1;
      addSteps(profile, 3); addStat(profile, x.d.stat, 2); earn(profile, 1);
      save(); onChange?.();
    }
    cur = x; mode = 'thanks';
    dlg.open({
      who: x.d.who, n: `${x.d.name} · 마침`, say: first ? '같이 해 줘서 고마워요!' : '또 와 줘서 고마워요!',
      how: first ? `걸음 +3, ${statName(x.d.stat)} +2, 1 데나리온을 받았어요` : '',
      choices: [{ label: '감사해요', cls: 'next', main: true, on: hide }],
      esc: hide, focus: false,
    });
  }

  // 엠마오: 글로바가 길을 따라 식탁 곁으로 걸어감
  const emm = { on: false, t: 0 };
  const emX = L.find((x) => x.id === 'emmaus');
  function walkEmmaus(x) {
    emm.on = true; emm.t = 0;
    const [a, b] = E.road, side = E.zone.at(4.4, 2.6);
    x.n.path = [a, b, side]; x.n.state = 'walk';
    doing(x);
  }
  function stopEmmaus() { emm.on = false; emX.n.path = [emX.g.npc]; emX.n.state = 'walk'; }
  function breakBread() {
    emm.on = false;
    for (const h of E.bread) h.material.emissiveIntensity = 0.9;
    E.bread[0].position.x -= 0.08; E.bread[1].position.x += 0.08;
    burst(E.table.x, G(E.table) + 1.1, E.table.z); sfx('orb', 0.28, 1.1);
    setTimeout(() => { for (const h of E.bread) h.material.emissiveIntensity = 0; E.bread[0].position.x += 0.08; E.bread[1].position.x -= 0.08; }, 30000);
    finish(emX);
  }

  // 머무름(산), 기도·찬양(감옥·실로)을 재는 시간
  const hold = { mount: 0, prison: 0, shiloh: 0 };
  const hinted = {};
  const praying = () => me.action === 'pray' || me.action === 'praise';
  const quake = { t: 0, on: false, reset: 0 };
  function openPrison() {
    quake.on = true; quake.t = 0;
    sfx('impact/impactSoft_heavy_000', 0.5, 0.55); setTimeout(() => sfx('impact/impactMetal_light_000', 0.3, 0.7), 700);
    toast('갑자기 땅이 흔들리고 감옥 문이 다 열렸어요!', 3);
    finish(L.find((x) => x.id === 'prison'));
  }
  function closePrison() {
    for (const b of Pr.bars) { b.fall = 0; if (b.beam) b.g.position.y = b.y0; else b.g.rotation.x = 0; }
    Pr.doorG.rotation.y = Pr.zone.rot + Math.PI / 2; Pr.stocks.visible = true; quake.reset = 0;
  }

  // ---------- 매 프레임 ----------
  let pinOn = true;
  let lastT = 0;
  function step(_dt) {
    const now = performance.now(), dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 0; lastT = now; // 실제 흐른 시간
    const near = Math.hypot(me.x, me.z) < 90;
    for (const x of L) {
      const d = Math.hypot(me.x - x.n.x, me.z - x.n.z);
      x.n.av.visible = d < 80;
      if (x.n.state !== 'walk') x.n.face = d < 6 ? Math.atan2(me.x - x.n.x, me.z - x.n.z) : x.n.face0;
      if (!x.said && d < 9 && d > 4 && me.state === 'walk' && !busy() && !cur) {
        x.said = true; x.n.action = 'wave'; setTimeout(() => { if (x.n.action === 'wave') x.n.action = null; }, 2400);
      }
      if (d > 26) x.said = false;
    }
    if (!near) return;
    const at = (p, r = 0.95) => Math.hypot(me.x - p.x, me.z - p.z) < r;
    const pulse = Math.sin(performance.now() / 400);
    for (const r of [E.ring, Mt.ring, Pr.ring, Sh.ring]) { r.material.opacity = 0.45 + 0.3 * pulse; r.userData.glow.material.opacity = 0.13 + 0.07 * pulse; }
    // 이미 서 있으면(또는 감옥이 열렸으면) 빛기둥은 거둠, 엠마오는 함께 걷는 동안만
    E.ring.userData.glow.visible = emm.on;
    Mt.ring.userData.glow.visible = !at(Mt.stand, 1.2);
    Pr.ring.userData.glow.visible = !quake.on && !quake.reset && !at(Pr.stand, 1.2);
    Sh.ring.userData.glow.visible = !at(Sh.stand, 1.2);
    // 실라·바울은 기도하는 자세, 엘리는 앉아 있음
    if (!quake.on && silas.state !== 'walk') silas.action = 'pray';
    if (!quake.on) paul.action = 'pray';
    eli.face = Math.hypot(me.x - eli.x, me.z - eli.z) < 5 ? Math.atan2(me.x - eli.x, me.z - eli.z) : eli.face0;

    // 엠마오
    if (emm.on) {
      emm.t += dt;
      if (at(E.stand, 1.1)) breakBread();
      else if (emm.t > 90) { stopEmmaus(); if (cur === emX) hide(); toast('글로바가 돌아갔어요. 다시 말을 걸어요', 4); }
    } else if (emX.n.state !== 'walk' && Math.hypot(emX.n.x - emX.g.npc.x, emX.n.z - emX.g.npc.z) > 1 && Math.hypot(me.x - emX.n.x, me.z - emX.n.z) > 12) { emX.n.path = [emX.g.npc]; emX.n.state = 'walk'; }
    // 산 위
    if (at(Mt.stand)) { if (!busy()) hold.mount += dt; if (hold.mount > 1.6 && hold.mount < 100) { hold.mount = 100; finish(L.find((x) => x.id === 'mount')); } } // 부탁·훈련·다른 말풍선 중에는 팔복이 시작되지 않음
    else if (Math.hypot(me.x - Mt.stand.x, me.z - Mt.stand.z) > 6) hold.mount = 0;
    // 감옥
    if (!quake.on && quake.reset === 0) {
      if (at(Pr.stand, 1.0)) {
        if (praying()) { hold.prison += dt; if (hold.prison > 1.6) { hold.prison = 0; openPrison(); } }
        else if (!hinted.prison) { hinted.prison = 1; toast('실라: 두 손 모은 단추 (X)나 음표 단추 (B)를 눌러요', 3); }
      } else { hold.prison = 0; hinted.prison = 0; } // 자리에 올 때마다 작은 안내
    }
    if (quake.on) {
      quake.t += dt;
      const s = quake.t < 2.2 ? (2.2 - quake.t) * 0.04 : 0;
      for (const b of Pr.bars) {
        if (quake.t > 0.8 && b.fall < 1) b.fall = Math.min(1, b.fall + dt * 1.6);
        if (b.beam) b.g.position.y = b.y0 - b.fall * 2.1 + (Math.random() - 0.5) * s;
        else b.g.rotation.x = b.dir * b.fall * 1.45 + (Math.random() - 0.5) * s;
      }
      Pr.doorG.rotation.y = Pr.zone.rot + Math.PI / 2 + Math.min(1, quake.t * 0.8) * 1.6;
      if (quake.t > 1.2) Pr.stocks.visible = false;
      if (quake.t > 1.4) { silas.action = null; paul.action = null; }
      if (quake.t > 3) { quake.on = false; quake.reset = 1; }
    } else if (quake.reset && Math.hypot(me.x - Pr.cell.x, me.z - Pr.cell.z) > 22) closePrison();
    // 실로
    if (at(Sh.stand, 1.0)) {
      if (praying()) {
        hold.shiloh += dt; Sh.lamp.intensity = Math.min(1.2, hold.shiloh * 0.6);
        if (hold.shiloh > 1.8 && hold.shiloh < 100) {
          hold.shiloh = 100; eli.action = 'wave'; setTimeout(() => { if (eli.action === 'wave') eli.action = null; }, 2400);
          burst(Sh.stand.x, G(Sh.stand) + 1.4, Sh.stand.z); sfx('orb', 0.25, 1.3);
          finish(L.find((x) => x.id === 'shiloh'));
        }
      } else if (!hinted.shiloh) { hinted.shiloh = 1; toast('한나: 두 손 모은 단추를 눌러요 (X)', 3); }
    } else if (Math.hypot(me.x - Sh.stand.x, me.z - Sh.stand.z) > 5) { hold.shiloh = 0; hinted.shiloh = 0; Sh.lamp.intensity = Math.max(0, Sh.lamp.intensity - dt); }

    // 말풍선
    if (cur) {
      const d = Math.hypot(me.x - cur.n.x, me.z - cur.n.z);
      if ((mode === 'talk' && d > 4.5) || (mode === 'thanks' && d > 16) || (mode === 'doing' && d > 90)) hide(); // 체험 중 할 일은 [그만두기]나 마침까지 남음
      return;
    }
    if (busy()) return;
    let nx = null;
    if ([E.stand, Mt.stand, Pr.stand, Sh.stand].some((q) => at(q, 1.3))) return; // 빛나는 자리에서 체험 중엔 말을 걸지 않음
    for (const x of L) if (Math.hypot(me.x - x.n.x, me.z - x.n.z) < 2.8 && !(x.id === 'emmaus' && emm.on)) nx = x;
    if (nx) offerTalk('garden:' + nx.id, nx.n, () => talk(nx)); // 말 걸기 단추를 눌러야 열림
  }
  function pin() {
    if (!pinOn) return;
    for (const n of [...L.map((x) => x.n), ...extras]) if (n.state !== 'walk' && !(n === emX.n)) { n.x = n.home.x; n.z = n.home.z; }
  }

  // 빛나는 자리에 서 있으면 반짝일 단추 (main.js availableActions)
  function wants() {
    const at = (p) => Math.hypot(me.x - p.x, me.z - p.z) < 1.3;
    if (!quake.on && !quake.reset && at(Pr.stand)) return ['pray', 'praise'];
    if (at(Sh.stand)) return ['pray'];
    return [];
  }
  return { step, pin, wants, active: () => !!cur, list: L, places: P };
}
