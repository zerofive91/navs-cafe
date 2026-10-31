// 귀여운 대학생 캐릭터 (2등신, 후드티 + 백팩)
import * as THREE from 'three';

const SKIN = 0xf7dcc0;

export function makeAvatar(look) {
  const m = (c, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const hoodie = m(look.hoodie);
  const skin = m(SKIN, 0.7);
  const hair = m(look.hair, 0.6);
  const pants = m(look.pants || 0x4b4f5c);
  const shoe = m(0xf2f2f2, 0.6);
  const dark = m(0x2f2a2a, 0.3);

  const root = new THREE.Group();
  const body = new THREE.Group(); // 앉을 때 내려가는 부분
  root.add(body);

  // 다리
  const legGeo = new THREE.CapsuleGeometry(0.075, 0.14, 4, 8);
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.1, 0.32, 0);
    const leg = new THREE.Mesh(legGeo, pants);
    leg.position.y = -0.14;
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), shoe);
    foot.scale.set(1, 0.6, 1.4);
    foot.position.set(0, -0.27, 0.03);
    pivot.add(leg, foot);
    body.add(pivot);
    legs.push(pivot);
  }

  // 몸통(후드티)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.2, 6, 14), hoodie);
  torso.scale.set(1, 1, 0.82);
  torso.position.y = 0.55;
  body.add(torso);
  // 주머니
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), m(shade(look.hoodie, 0.9)));
  pocket.position.set(0, 0.47, 0.17);
  body.add(pocket);
  // 백팩
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.14), m(look.bag));
  bag.position.set(0, 0.58, -0.2);
  body.add(bag);

  // 팔
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.26, 4, 8); // 두 손을 모을 수 있을 만큼 길게
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.23, 0.7, 0);
    const arm = new THREE.Mesh(armGeo, hoodie);
    arm.position.y = -0.17;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skin);
    hand.position.y = -0.35;
    pivot.add(arm, hand);
    body.add(pivot);
    arms.push(pivot);
  }

  // 머리
  const head = new THREE.Group();
  head.position.y = 0.98;
  body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), skin);
  head.add(face);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.315, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.rotation.x = -0.35;
  hairCap.position.set(0, 0.02, -0.02);
  head.add(hairCap);
  if (look.style === 1) {
    const bang = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), hair);
    bang.scale.set(1.3, 0.6, 0.6);
    bang.position.set(-0.1, 0.17, 0.22);
    bang.rotation.z = 0.4;
    head.add(bang);
  } else {
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), hair);
    tail.position.set(0, 0.02, -0.3);
    head.add(tail);
  }
  // 후드: 등 위에 얇게 접혀 내려온 천
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m(shade(look.hoodie, 0.94)));
  hood.scale.set(1.05, 0.5, 0.55);
  hood.rotation.x = -Math.PI / 2 - 0.35;
  hood.position.set(0, 0.76, -0.14);
  body.add(hood);
  // 눈·볼
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), dark);
    e.scale.set(1, 1.25, 0.5);
    e.position.set(s * 0.11, 0.0, 0.275);
    head.add(e);
    eyes.push(e);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: 0xf2a1a1, transparent: true, opacity: 0.55 }));
    cheek.position.set(s * 0.18, -0.07, 0.262);
    cheek.rotation.y = s * 0.55;
    head.add(cheek);
  }

  // 들고 다니는 물건
  const cup = new THREE.Group();
  const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.13, 12), m(0xffffff, 0.5));
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.057, 0.05, 12), m(0xb07a4f));
  cup.add(cupBody, sleeve);
  cup.visible = false;
  arms[1].add(cup);
  cup.position.set(0, -0.41, 0.04);
  // 왼손에 드는 빵 (모델은 props.js에서 채움)
  const food = new THREE.Group();
  food.visible = false;
  arms[0].add(food);
  food.position.set(0, -0.44, 0.05);

  const book = new THREE.Group();
  for (const s of [-1, 1]) {
    const pg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.2), m(0xfbf6ea));
    pg.position.x = s * 0.08;
    pg.rotation.z = s * -0.2;
    book.add(pg);
  }
  const bcover = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.015, 0.22), m(0x7a5b8f));
  bcover.position.y = -0.015;
  book.add(bcover);
  book.position.set(0, 0.6, 0.36);
  book.rotation.x = 0.9;
  book.visible = false;
  body.add(book);

  // 낚싯대 (손에서 앞쪽 위로 뻗음, 끝 위치는 낚싯줄 시작점)
  const rod = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 1.5, 6), m(0x8a6a4a, 0.6));
  pole.position.y = 0.75;
  const rodTip = new THREE.Object3D();
  rodTip.position.y = 1.5;
  rod.add(pole, rodTip);
  rod.rotation.x = 1.6; // 팔을 앞으로 든 자세에서 낚싯대가 앞쪽 위로 향함
  rod.position.set(0, -0.42, 0.02);
  rod.visible = false;
  arms[1].add(rod);
  // 라켓 세 가지 (테니스·배드민턴·탁구)
  const rackets = {};
  {
    const frame = m(0x3d6f9e, 0.4), str = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, transparent: true, opacity: 0.55, roughness: 0.6 });
    const mk = (len, rw, rh, col, solid) => {
      const g = new THREE.Group();
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, len, 6), m(0x4a3b30, 0.6));
      h.position.y = len / 2;
      const ring = solid
        ? new THREE.Mesh(new THREE.CylinderGeometry(rw, rw, 0.015, 18), m(col, 0.5))
        : new THREE.Mesh(new THREE.TorusGeometry(1, 0.012 / rw, 5, 20), m(col, 0.4));
      if (solid) { ring.rotation.z = Math.PI / 2; ring.position.y = len + rw * 0.9; }
      else {
        ring.scale.set(rw, rh, rw);
        ring.rotation.y = Math.PI / 2;
        ring.position.y = len + rh;
        const net = new THREE.Mesh(new THREE.CircleGeometry(1, 16), str);
        net.scale.set(rw, rh, 1); net.rotation.y = Math.PI / 2; net.position.y = len + rh;
        g.add(net);
      }
      g.add(h, ring);
      return g;
    };
    rackets.tennis = mk(0.2, 0.11, 0.14, 0x3d6f9e);
    rackets.badminton = mk(0.26, 0.08, 0.1, 0xd9483b);
    rackets.pingpong = mk(0.08, 0.075, 0.075, 0xc8443a, true);
    void frame;
    for (const r of Object.values(rackets)) {
      r.rotation.x = 1.4; // 팔을 앞으로 들었을 때 라켓이 위로 섬
      r.position.set(0, -0.42, 0.03);
      r.visible = false;
      arms[1].add(r);
    }
  }
  const can = new THREE.Group();
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12), m(0x8fb4cf, 0.4));
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.2, 6), m(0x8fb4cf, 0.4));
  spout.rotation.x = Math.PI / 2.6;
  spout.position.set(0, 0.04, 0.13);
  can.add(canBody, spout);
  can.visible = false;
  arms[1].add(can);
  can.position.set(0, -0.44, 0.06);

  // V-Hand 손가락 두 개
  const vfing = new THREE.Group();
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.09, 4, 6), skin);
    f.position.set(s * 0.03, -0.44, 0);
    f.rotation.z = s * 0.3;
    vfing.add(f);
  }
  vfing.visible = false;
  arms[1].add(vfing);

  const drops = [];
  for (let k = 0; k < 4; k++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0x7fb6e0 }));
    d.visible = false;
    root.add(d);
    drops.push(d);
  }

  root.traverse((c) => { if (c.isMesh) c.castShadow = true; });
  root.userData = { body, legs, arms, head, eyes, cup, food, rod, rodTip, rackets, foods: {}, drinks: {}, book, can, drops, vfing, blinkAt: 2 };
  return root;
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return c;
}

// 상태에 맞춰 자세 잡기
export function poseAvatar(av, ch, t, dt) {
  const u = av.userData;
  const walking = ch.state === 'walk';
  const sitting = ch.state === 'sit';
  const kneel = sitting && ch.seat && ch.seat.kind === 'kneel';
  const run = walking && ch.running;
  const ph = t * (run ? 14 : 9) + ch.phase;

  // 기본값
  let bodyY = walking ? Math.abs(Math.sin(ph)) * (run ? 0.1 : 0.04) : Math.sin(t * 2 + ch.phase) * 0.008;
  let legA = walking ? Math.sin(ph) * (run ? 0.95 : 0.6) : 0;
  let armL = walking ? -Math.sin(ph) * (run ? 0.9 : 0.5) : 0.05;
  let armR = walking ? Math.sin(ph) * (run ? 0.9 : 0.5) : 0.05;
  let armLz = 0.08, armRz = -0.08;
  let headX = 0, headY = 0;

  if (sitting) {
    bodyY = kneel ? -0.2 : -0.12;
    legA = kneel ? 0 : -1.4;
  }
  if (kneel) {
    u.legs.forEach((l) => { l.rotation.x = 1.5; l.position.z = -0.05; });
  } else {
    u.legs.forEach((l, i) => { l.rotation.x = i ? -legA : legA; l.position.z = 0; });
    if (sitting) u.legs.forEach((l) => { l.rotation.x = -1.4; });
  }

  switch (ch.action) {
    case 'pray':
      armL = -1.25; armR = -1.25; armLz = 0.56; armRz = -0.56; headX = 0.35; // 가슴 앞에서 두 손을 모음
      break;
    case 'read':
      armL = -1.0; armR = -1.0; armLz = -0.35; armRz = 0.35; headX = 0.4;
      break;
    case 'gaze':
      headX = -0.45; armL = 0.1; armR = 0.1;
      break;
    case 'wave':
      armR = Math.PI * 0.85 + Math.sin(t * 10) * 0.25; armRz = -0.3;
      break;
    case 'share':
      // 두 손으로 무언가를 건네는 자세
      armL = -1.25; armR = -1.25; armLz = -0.25; armRz = 0.25; headX = 0.1;
      break;
    case 'vhand':
      armR = Math.PI * 0.92; armRz = -0.15; headX = -0.08;
      break;
    case 'eat':
      armL = -2.2; armLz = 0.4; headX = -0.1;
      break;
    case 'sip':
      armR = -2.2; armRz = 0.4; headX = -0.1;
      break;
    case 'fish':
      armR = -0.9; armRz = 0.15; headX = 0.25;
      break;
    case 'water':
      armR = -1.0; armRz = 0.1; headX = 0.3;
      break;
    case 'wait':
      headX = Math.sin(t * 1.5) * 0.05;
      break;
    case 'kick':
      armL = 0.5; armR = -0.5; armLz = 0.3; armRz = -0.3;
      break;
    case 'shoot':
      armL = -2.7; armR = -2.8; armLz = 0.2; armRz = -0.2; headX = -0.25;
      break;
    case 'rally':
      armR = -0.9 + (ch.swingT > 0 ? Math.sin((1 - ch.swingT / 0.35) * Math.PI) * -1.3 : 0); armRz = -0.35; armL = -0.4;
      break;
    case 'sow':
      armR = -0.6 - Math.max(0, Math.sin(t * 4)) * 1.6; armRz = -0.4 + Math.sin(t * 4) * 0.3; armL = -0.7; armLz = 0.2;
      break;
    case 'grill':
    case 'draw':
      armL = -1.1; armR = -1.1 + (ch.action === 'draw' ? Math.sin(t * 6) * 0.5 : 0); armLz = 0.15; armRz = -0.15; headX = 0.35;
      break;
    case 'plant':
      armL = -1.3; armR = -1.3; armLz = 0.3; armRz = -0.3; headX = 0.5;
      break;
  }
  // 수영: 팔을 번갈아 크게 돌리고 발장구
  if (ch.swim) {
    const sp = t * (walking ? 5 : 2.2);
    armL = -sp % (Math.PI * 2); armR = -(sp + Math.PI) % (Math.PI * 2); armLz = 0.25; armRz = -0.25;
    if (!walking) { armL = -1.6 + Math.sin(sp) * 0.4; armR = -1.6 - Math.sin(sp) * 0.4; armLz = 0.7; armRz = -0.7; }
    headX = -0.15;
    bodyY = Math.sin(t * 2.5) * 0.03;
    u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 9 + i * Math.PI) * 0.35; });
  }
  if (ch.action === 'kick' && ch.kickT > 0) u.legs[1].rotation.x = -1.2 * Math.sin((1 - ch.kickT / 0.5) * Math.PI);
  if (ch.item === 'cup' && ch.action !== 'sip' && !walking) { armR = -0.6; }
  if (ch.item === 'cup' && walking) { armR = -0.6; }
  if (ch.food && ch.action !== 'eat') { armL = -0.6; }

  u.body.position.y = bodyY;
  u.arms[0].rotation.x = armL;
  u.arms[1].rotation.x = armR;
  u.arms[0].rotation.z = armLz;
  u.arms[1].rotation.z = armRz;
  u.head.rotation.x = headX;
  u.head.rotation.y = headY;

  u.cup.visible = ch.item === 'cup';
  // 음료 종류(커피 컵·머그)와 손에 든 빵, 한 입 먹을 때마다 작아짐
  for (const [k, o] of Object.entries(u.drinks)) o.visible = (ch.drink || 'coffee') === k;
  u.food.visible = !!ch.food;
  for (const [k, o] of Object.entries(u.foods)) o.visible = ch.food === k;
  u.food.scale.setScalar(1 - (ch.bites || 0) * 0.27);
  u.book.visible = ch.action === 'read';
  u.can.visible = ch.action === 'water';
  u.vfing.visible = ch.action === 'vhand';
  u.rod.visible = ch.action === 'fish';
  for (const [k, r] of Object.entries(u.rackets)) r.visible = ch.racket === k;
  if (ch.swingT > 0) ch.swingT -= dt;
  if (ch.kickT > 0) ch.kickT -= dt;

  // 물방울
  u.drops.forEach((d, k) => {
    d.visible = ch.action === 'water';
    if (!d.visible) return;
    const p = (t * 1.6 + k / 4) % 1;
    const fwd = new THREE.Vector3(0.28, 0, 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), av.rotation.y);
    d.position.set(fwd.x, 0.45 - p * 0.45, fwd.z);
  });

  // 눈 깜빡임 / 기도할 때 눈 감기
  u.blinkAt -= dt;
  let closed = ch.action === 'pray';
  if (u.blinkAt < 0) { closed = true; if (u.blinkAt < -0.12) u.blinkAt = 2 + Math.random() * 3; }
  u.eyes.forEach((e) => { e.scale.y = closed ? 0.2 : 1.25; });
}
