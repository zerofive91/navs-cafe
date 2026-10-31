// 카페와 캐릭터 그리기 (1단계: 단순한 도형으로 된 시안)
import { C, R_OUT, R_RING, R_HUB, SIZE, polar, furniture, seats } from './world.js';

const rad = (d) => (d * Math.PI) / 180;

const COL = {
  grass: '#a8cf8e',
  grassDark: '#93bf79',
  tree: '#6f9e5c',
  treeDark: '#5b8a4b',
  path: '#e8dcc6',
  glass: '#bfe3ec',
  rim: '#efe9df',
  floor: '#ecdcc4',
  floorWord: '#e7d6bd',
  floorPrayer: '#e3d7cb',
  floorFellow: '#efd9bd',
  floorWitness: '#f1e2cb',
  hub: '#f6ead2',
  hedge: '#86b36f',
  hedgeDark: '#6f9c5a',
  wood: '#b98a5e',
  woodDark: '#8f6744',
  shelfBook: ['#c96f5b', '#5f87a8', '#e0b65a', '#7aa56a', '#9a7bb0'],
  sofa: '#cf8466',
  cushion: '#93abc9',
  counter: '#6f5a4a',
  counterTop: '#d9c2a3',
  pot: '#c98f6a',
  leaf: '#78aa62',
};

// 바깥 숲과 정원(한 번만 그려 캐시)
let bgCanvas = null;
function buildBackground(scale) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(SIZE * scale);
  cv.height = Math.ceil(SIZE * scale);
  const g = cv.getContext('2d');
  g.scale(scale, scale);
  drawStatic(g);
  return cv;
}

function seeded(n) {
  let s = n;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function drawStatic(g) {
  // 잔디
  g.fillStyle = COL.grass;
  g.fillRect(-200, -200, SIZE + 400, SIZE + 400);
  const rnd = seeded(7);
  for (let k = 0; k < 220; k++) {
    g.fillStyle = COL.grassDark;
    g.globalAlpha = 0.35;
    g.beginPath();
    g.arc(rnd() * SIZE, rnd() * SIZE, 2 + rnd() * 4, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 테라스 문(45도)에서 이어지는 산책길
  const door = polar(R_OUT, 45);
  g.strokeStyle = COL.path;
  g.lineWidth = 26;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(door.x, door.y);
  g.quadraticCurveTo(940, 900, 1000, 860);
  g.stroke();
  // 입구 앞 길(180도)
  const ent = polar(R_OUT, 180);
  g.beginPath();
  g.moveTo(ent.x, ent.y);
  g.lineTo(-20, ent.y);
  g.stroke();

  // 숲: 건물 바깥 네 모서리에 나무
  const trnd = seeded(42);
  for (let k = 0; k < 60; k++) {
    const x = trnd() * SIZE, y = trnd() * SIZE;
    const r = Math.hypot(x - C.x, y - C.y);
    if (r < R_OUT + 30) continue;
    if (Math.abs(y - C.y) < 30 && x < C.x) continue; // 입구 길
    const s = 14 + trnd() * 16;
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.beginPath();
    g.ellipse(x + 4, y + 6, s, s * 0.6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COL.treeDark;
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COL.tree;
    g.beginPath();
    g.arc(x - s * 0.25, y - s * 0.25, s * 0.7, 0, Math.PI * 2);
    g.fill();
  }

  // 건물 그림자와 바깥 유리벽
  g.fillStyle = 'rgba(0,0,0,0.10)';
  g.beginPath();
  g.arc(C.x + 6, C.y + 10, R_OUT + 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = COL.rim;
  g.beginPath();
  g.arc(C.x, C.y, R_OUT, 0, Math.PI * 2);
  g.fill();

  // 안쪽 네 구역 바닥(사분면)
  const zones = [
    [-135, -45, COL.floorWord],
    [-45, 45, COL.floorFellow],
    [45, 135, COL.floorPrayer],
    [135, 225, COL.floorWitness],
  ];
  for (const [a0, a1, col] of zones) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(C.x, C.y);
    g.arc(C.x, C.y, R_RING, rad(a0), rad(a1));
    g.closePath();
    g.fill();
  }
  // 나뭇결
  g.strokeStyle = 'rgba(140,100,60,0.08)';
  g.lineWidth = 1;
  for (let r = R_HUB + 18; r < R_RING; r += 18) {
    g.beginPath();
    g.arc(C.x, C.y, r, 0, Math.PI * 2);
    g.stroke();
  }

  // 가운데: 천창 빛이 드는 원
  const grd = g.createRadialGradient(C.x, C.y, 10, C.x, C.y, R_HUB + 10);
  grd.addColorStop(0, '#fff8e6');
  grd.addColorStop(1, COL.hub);
  g.fillStyle = grd;
  g.beginPath();
  g.arc(C.x, C.y, R_HUB, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(185,138,94,0.35)';
  g.lineWidth = 3;
  g.stroke();

  // 회랑 바닥 무늬(돌판)
  g.strokeStyle = 'rgba(0,0,0,0.05)';
  g.lineWidth = 1;
  for (let a = 0; a < 360; a += 10) {
    const p0 = polar(R_RING + 10, a), p1 = polar(R_OUT, a);
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    g.lineTo(p1.x, p1.y);
    g.stroke();
  }

  // 유리벽: 입구(180)와 테라스 문(45) 자리는 비움
  g.strokeStyle = COL.glass;
  g.lineWidth = 10;
  g.lineCap = 'butt';
  const openings = [[172, 188], [37, 53]];
  let start = 0;
  const segs = [];
  for (const [o0, o1] of openings.sort((a, b) => a[0] - b[0])) {
    segs.push([start, o0]);
    start = o1;
  }
  segs.push([start, 360]);
  for (const [a0, a1] of segs) {
    g.beginPath();
    g.arc(C.x, C.y, R_OUT, rad(a0), rad(a1));
    g.stroke();
  }
  // 유리 기둥(바퀴살 방향과 맞춤)
  g.fillStyle = '#d8d0c4';
  for (let a = 0; a < 360; a += 22.5) {
    if ((a > 170 && a < 190) || (a > 35 && a < 55)) continue;
    const p = polar(R_OUT, a);
    g.beginPath();
    g.arc(p.x, p.y, 6, 0, Math.PI * 2);
    g.fill();
  }
  // 문틀
  for (const [a0, a1] of openings) {
    for (const a of [a0, a1]) {
      const p = polar(R_OUT, a);
      g.fillStyle = COL.woodDark;
      g.beginPath();
      g.arc(p.x, p.y, 7, 0, Math.PI * 2);
      g.fill();
    }
  }

  for (const f of furniture) drawFurniture(g, f);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function drawFurniture(g, f) {
  switch (f.type) {
    case 'hedge': {
      g.strokeStyle = COL.hedgeDark;
      g.lineWidth = 20;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(C.x, C.y, R_RING, rad(f.from), rad(f.to));
      g.stroke();
      g.strokeStyle = COL.hedge;
      g.lineWidth = 14;
      g.beginPath();
      g.arc(C.x, C.y, R_RING - 2, rad(f.from), rad(f.to));
      g.stroke();
      break;
    }
    case 'spoke': {
      for (const [r0, r1] of [[128, 210], [270, 372]]) {
        const p0 = polar(r0, f.angle), p1 = polar(r1, f.angle);
        g.strokeStyle = COL.woodDark;
        g.lineWidth = 12;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(p0.x, p0.y);
        g.lineTo(p1.x, p1.y);
        g.stroke();
        g.strokeStyle = COL.wood;
        g.lineWidth = 7;
        g.stroke();
      }
      break;
    }
    case 'tree': {
      g.fillStyle = 'rgba(0,0,0,0.12)';
      g.beginPath();
      g.ellipse(f.x + 4, f.y + 8, 40, 26, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c7b08f';
      g.beginPath();
      g.arc(f.x, f.y, 36, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COL.treeDark;
      g.beginPath();
      g.arc(f.x, f.y, 30, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COL.tree;
      g.beginPath();
      g.arc(f.x - 7, f.y - 8, 21, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#8cbd74';
      g.beginPath();
      g.arc(f.x - 12, f.y - 13, 9, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'ringBench': {
      g.strokeStyle = COL.wood;
      g.lineWidth = 16;
      g.beginPath();
      g.arc(C.x, C.y, 62, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.12)';
      g.lineWidth = 1;
      for (let a = 0; a < 360; a += 15) {
        const p0 = polar(54, a), p1 = polar(70, a);
        g.beginPath();
        g.moveTo(p0.x, p0.y);
        g.lineTo(p1.x, p1.y);
        g.stroke();
      }
      break;
    }
    case 'shelf': {
      g.strokeStyle = COL.woodDark;
      g.lineWidth = 22;
      g.lineCap = 'butt';
      g.beginPath();
      g.arc(C.x, C.y, 352, rad(f.from), rad(f.to));
      g.stroke();
      const rnd = seeded(Math.round(f.from * -7));
      for (let a = f.from + 1; a < f.to - 1; a += 2.2) {
        const p0 = polar(346, a), p1 = polar(358, a);
        g.strokeStyle = COL.shelfBook[Math.floor(rnd() * COL.shelfBook.length)];
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(p0.x, p0.y);
        g.lineTo(p1.x, p1.y);
        g.stroke();
      }
      break;
    }
    case 'armchair': {
      g.save();
      g.translate(f.x, f.y);
      g.rotate(rad(f.face - 90));
      g.fillStyle = '#7d9a8a';
      roundRect(g, -15, -14, 30, 28, 8);
      g.fill();
      g.fillStyle = '#93b2a1';
      roundRect(g, -11, -6, 22, 18, 5);
      g.fill();
      g.restore();
      break;
    }
    case 'roundTable': {
      g.fillStyle = 'rgba(0,0,0,0.1)';
      g.beginPath();
      g.arc(f.x + 2, f.y + 4, f.r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COL.wood;
      g.beginPath();
      g.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'stool': {
      g.fillStyle = COL.woodDark;
      g.beginPath();
      g.arc(f.x, f.y, 9, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'counter': {
      g.strokeStyle = COL.counter;
      g.lineWidth = 26;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(C.x, C.y, 322, rad(f.from), rad(f.to));
      g.stroke();
      g.strokeStyle = COL.counterTop;
      g.lineWidth = 16;
      g.stroke();
      // 커피머신
      const m = polar(330, 33);
      g.fillStyle = '#4a4a4a';
      roundRect(g, m.x - 9, m.y - 7, 18, 14, 3);
      g.fill();
      const cup = polar(322, 20);
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(cup.x, cup.y, 4, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'pickup': {
      g.fillStyle = COL.counterTop;
      roundRect(g, f.x - 12, f.y - 10, 24, 20, 4);
      g.fill();
      g.strokeStyle = COL.counter;
      g.lineWidth = 2;
      g.stroke();
      break;
    }
    case 'longTable': {
      g.fillStyle = 'rgba(0,0,0,0.1)';
      roundRect(g, f.x - f.w / 2 + 3, f.y - f.h / 2 + 5, f.w, f.h, 8);
      g.fill();
      g.fillStyle = COL.wood;
      roundRect(g, f.x - f.w / 2, f.y - f.h / 2, f.w, f.h, 8);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      g.lineWidth = 1;
      for (let y = f.y - f.h / 2 + 16; y < f.y + f.h / 2; y += 16) {
        g.beginPath();
        g.moveTo(f.x - f.w / 2 + 4, y);
        g.lineTo(f.x + f.w / 2 - 4, y);
        g.stroke();
      }
      break;
    }
    case 'cushion': {
      g.fillStyle = COL.cushion;
      roundRect(g, f.x - 13, f.y - 13, 26, 26, 9);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)';
      roundRect(g, f.x - 8, f.y - 8, 16, 16, 6);
      g.fill();
      break;
    }
    case 'lamp': {
      const grd = g.createRadialGradient(f.x, f.y, 2, f.x, f.y, 34);
      grd.addColorStop(0, 'rgba(255,214,140,0.55)');
      grd.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(f.x, f.y, 34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f3d9a4';
      g.beginPath();
      g.arc(f.x, f.y, 6, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 'sofa': {
      g.save();
      g.translate(f.x, f.y);
      g.rotate(rad(f.face - 90));
      g.fillStyle = '#b86c50';
      roundRect(g, -26, -16, 52, 30, 9);
      g.fill();
      g.fillStyle = COL.sofa;
      roundRect(g, -21, -7, 42, 18, 6);
      g.fill();
      g.restore();
      break;
    }
    case 'mat': {
      g.fillStyle = '#c9a77c';
      roundRect(g, f.x - 14, f.y - 26, 28, 52, 6);
      g.fill();
      break;
    }
    case 'pot': {
      g.fillStyle = COL.pot;
      g.beginPath();
      g.arc(f.x, f.y, 11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = COL.leaf;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        g.beginPath();
        g.arc(f.x + Math.cos(a) * 6, f.y + Math.sin(a) * 6 - 2, 6, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 'trayStation': {
      g.fillStyle = COL.woodDark;
      roundRect(g, f.x - 15, f.y - 12, 30, 24, 4);
      g.fill();
      g.fillStyle = '#e9e1d4';
      roundRect(g, f.x - 11, f.y - 8, 22, 6, 2);
      g.fill();
      roundRect(g, f.x - 11, f.y + 1, 22, 6, 2);
      g.fill();
      break;
    }
  }
}

export function drawWorld(g, scale) {
  if (!bgCanvas || bgCanvas._scale !== scale) {
    bgCanvas = buildBackground(scale);
    bgCanvas._scale = scale;
  }
  g.drawImage(bgCanvas, 0, 0, SIZE, SIZE);
}

// 천창에서 내려오는 빛(캐릭터 위에 살짝 겹침)
export function drawLight(g, t) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.6);
  const grd = g.createRadialGradient(C.x - 10, C.y - 20, 5, C.x, C.y, R_HUB + 30);
  grd.addColorStop(0, `rgba(255,246,214,${0.35 + pulse * 0.1})`);
  grd.addColorStop(1, 'rgba(255,246,214,0)');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(C.x, C.y, R_HUB + 30, 0, Math.PI * 2);
  g.fill();
}

// ---------- 캐릭터 ----------
const SKIN = '#f7d9b8';

export function drawCharacter(g, ch, t) {
  const { x, y } = ch;
  const sitting = ch.state === 'sit';
  const walking = ch.state === 'walk';
  const bob = walking ? Math.abs(Math.sin(t * 10 + ch.phase)) * -2.2 : Math.sin(t * 2 + ch.phase) * 0.6;
  const fx = Math.cos(rad(ch.face)), fy = Math.sin(rad(ch.face));
  const back = fy < -0.45; // 뒤돌아 있음(위를 봄)
  const by = y + bob + (sitting ? 3 : 0);

  // 그림자
  g.fillStyle = 'rgba(0,0,0,0.16)';
  g.beginPath();
  g.ellipse(x, y + 10, 12, 4.5, 0, 0, Math.PI * 2);
  g.fill();

  // 발(걷기)
  if (!sitting) {
    const step = walking ? Math.sin(t * 10 + ch.phase) * 3 : 0;
    g.fillStyle = '#5b5560';
    g.beginPath();
    g.ellipse(x - 4, y + 8 + step * 0.3, 3.2, 2.4, 0, 0, Math.PI * 2);
    g.ellipse(x + 4, y + 8 - step * 0.3, 3.2, 2.4, 0, 0, Math.PI * 2);
    g.fill();
  }

  // 백팩(뒤에서 보일 때 / 옆에서 살짝)
  if (back || Math.abs(fx) > 0.6) {
    g.fillStyle = ch.bag;
    const bx = back ? x : x - fx * 8;
    roundRect(g, bx - 6, by - 14, 12, 13, 4);
    g.fill();
  }

  // 후드티 몸통
  const bodyH = sitting ? 13 : 17;
  g.fillStyle = ch.hoodie;
  roundRect(g, x - 9.5, by - bodyH + 6, 19, bodyH, 7);
  g.fill();
  // 후드 끈 / 주머니
  if (!back) {
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 2, by - bodyH + 8);
    g.lineTo(x - 2, by - bodyH + 12);
    g.moveTo(x + 2, by - bodyH + 8);
    g.lineTo(x + 2, by - bodyH + 12);
    g.stroke();
  }

  // 팔/손 + 들고 있는 것
  drawHands(g, ch, x, by, t, back);

  // 머리
  const hy = by - bodyH - 6;
  g.fillStyle = ch.hoodie;
  g.beginPath();
  g.arc(x, hy + 3, 13.5, 0, Math.PI * 2); // 후드
  g.fill();
  g.fillStyle = SKIN;
  g.beginPath();
  g.arc(x, hy, 12, 0, Math.PI * 2);
  g.fill();
  // 머리카락
  g.fillStyle = ch.hair;
  g.beginPath();
  if (back) {
    g.arc(x, hy, 12.4, 0, Math.PI * 2);
  } else {
    g.arc(x, hy - 1, 12.4, Math.PI * 1.02, Math.PI * 1.98);
    g.quadraticCurveTo(x + fx * 4, hy - 4, x - 11, hy - 2);
  }
  g.fill();
  if (ch.style === 1 && !back) {
    // 앞머리 한 갈래
    g.beginPath();
    g.ellipse(x - 5 + fx * 2, hy - 6, 6, 3.5, -0.4, 0, Math.PI * 2);
    g.fill();
  }

  // 얼굴
  if (!back) {
    const ex = fx * 4;
    const closed = ch.action === 'pray' || (ch.action === 'gaze' && false);
    const look = ch.action === 'gaze' ? -2 : 0;
    g.fillStyle = '#3d3434';
    g.strokeStyle = '#3d3434';
    g.lineWidth = 1.4;
    for (const s of [-1, 1]) {
      const exx = x + ex + s * 4.2;
      const eyy = hy + 2 + look;
      if (closed || ch.blink) {
        g.beginPath();
        g.arc(exx, eyy - 0.5, 2, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
      } else {
        g.beginPath();
        g.arc(exx, eyy, 1.7, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = 'rgba(240,140,140,0.45)';
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + ex + s * 7, hy + 5.5, 2.4, 1.5, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 효과
  if (ch.action === 'gaze') {
    const a = 0.4 + 0.3 * Math.sin(t * 3);
    g.fillStyle = `rgba(255,236,170,${a})`;
    g.beginPath();
    g.arc(x, hy - 22, 6 + Math.sin(t * 3), 0, Math.PI * 2);
    g.fill();
  }
  if (ch.action === 'water') {
    for (let k = 0; k < 3; k++) {
      const p = (t * 1.6 + k / 3) % 1;
      g.fillStyle = `rgba(110,170,220,${1 - p})`;
      g.beginPath();
      g.arc(x + fx * 22 + (k - 1) * 3, by - 6 + p * 14, 1.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (ch.item === 'cup' && ch.action === 'sip') {
    // 김
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 1.2;
    const sx = x + fx * 9;
    g.beginPath();
    g.moveTo(sx, by - 14);
    g.quadraticCurveTo(sx + 3 * Math.sin(t * 4), by - 19, sx, by - 24);
    g.stroke();
  }
}

function drawHands(g, ch, x, by, t, back) {
  const fx = Math.cos(rad(ch.face));
  g.fillStyle = SKIN;
  const hand = (hx, hy) => {
    g.beginPath();
    g.arc(hx, hy, 3, 0, Math.PI * 2);
    g.fill();
  };
  if (ch.action === 'wave') {
    const w = Math.sin(t * 10) * 3;
    hand(x - 8, by - 4);
    g.strokeStyle = ch.hoodie;
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x + 8, by - 8);
    g.lineTo(x + 13 + w, by - 22);
    g.stroke();
    hand(x + 13 + w, by - 24);
    return;
  }
  if (ch.action === 'pray') {
    hand(x - 1.5, by - 8);
    hand(x + 1.5, by - 8);
    return;
  }
  if (ch.action === 'read' && !back) {
    g.fillStyle = '#7a5b8f';
    roundRect(g, x - 9, by - 8, 18, 11, 2);
    g.fill();
    g.fillStyle = '#fbf6ea';
    roundRect(g, x - 8, by - 7, 7.5, 9, 1);
    g.fill();
    roundRect(g, x + 0.5, by - 7, 7.5, 9, 1);
    g.fill();
    g.fillStyle = SKIN;
    hand(x - 10, by - 2);
    hand(x + 10, by - 2);
    return;
  }
  if (ch.action === 'water') {
    hand(x + fx * 12, by - 4);
    g.fillStyle = '#7fa7c4';
    roundRect(g, x + fx * 12 - 5, by - 9, 10, 9, 2);
    g.fill();
    g.strokeStyle = '#7fa7c4';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + fx * 12 + fx * 5, by - 6);
    g.lineTo(x + fx * 20, by - 9);
    g.stroke();
    return;
  }
  // 기본: 양옆 손
  const swing = ch.state === 'walk' ? Math.sin(t * 10 + ch.phase) * 2 : 0;
  hand(x - 10, by - 3 + swing);
  hand(x + 10, by - 3 - swing);
  if (ch.item === 'cup') {
    const cx = ch.action === 'sip' ? x + fx * 6 : x + 11;
    const cy = ch.action === 'sip' ? by - 12 : by - 7;
    g.fillStyle = '#ffffff';
    roundRect(g, cx - 3.5, cy - 4, 7, 8, 2);
    g.fill();
    g.fillStyle = '#b07a4f';
    g.fillRect(cx - 3.5, cy - 1, 7, 2.5);
  }
  if (ch.item === 'tray') {
    g.fillStyle = '#d9c2a3';
    roundRect(g, x - 11, by - 9, 22, 8, 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x - 4, by - 6, 3, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e2a65c';
    g.beginPath();
    g.arc(x + 4, by - 6, 3, 0, Math.PI * 2);
    g.fill();
  }
}

// 디버그용: 의자 위치 표시
export function drawSeatHints(g, highlight) {
  for (const s of seats) {
    if (s.taken) continue;
    if (highlight && highlight !== s) continue;
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(s.x, s.y, 7, 0, Math.PI * 2);
    g.stroke();
  }
}
