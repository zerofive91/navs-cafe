// 수레바퀴 카페의 지도: 좌표, 구역, 가구, 의자, 장애물
// 좌표계: 1000 x 1000, 가운데(500,500). 각도는 도(degree), 0 = 오른쪽(동), -90 = 위(북).

export const SIZE = 1000;
export const C = { x: 500, y: 500 };
export const R_OUT = 460;   // 통유리 바깥벽
export const R_RING = 380;  // 회랑과 안쪽 구역을 나누는 낮은 화단
export const R_HUB = 110;   // 가운데 그리스도 공간

const rad = (d) => (d * Math.PI) / 180;
export const polar = (r, a) => ({ x: C.x + r * Math.cos(rad(a)), y: C.y + r * Math.sin(rad(a)) });

// 구역: hub(그리스도) · word(말씀) · prayer(기도) · fellowship(교제) · witness(증거) · rim(순종)
export function zoneAt(p) {
  const dx = p.x - C.x, dy = p.y - C.y;
  const r = Math.hypot(dx, dy);
  if (r > R_RING) return 'rim';
  if (r < R_HUB) return 'hub';
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (a > -135 && a <= -45) return 'word';
  if (a > -45 && a <= 45) return 'fellowship';
  if (a > 45 && a <= 135) return 'prayer';
  return 'witness';
}

// 장애물은 모두 원(circle)으로 표현한다. 벽·화단·카운터는 원을 촘촘히 늘어놓아 만든다.
export const obstacles = [];
const block = (x, y, r) => obstacles.push({ x, y, r });

function arcBlock(radius, from, to, r, step = 2.5) {
  for (let a = from; a <= to + 0.001; a += step) {
    const p = polar(radius, a);
    block(p.x, p.y, r);
  }
}
function lineBlock(a, r0, r1, r, step = 8) {
  for (let t = r0; t <= r1; t += step) {
    const p = polar(t, a);
    block(p.x, p.y, r);
  }
}

// 가구 목록(그리기용)
export const furniture = [];

// 낮은 화단 링: 각 구역 가운데(0, 90, 180, 270도)에 회랑으로 나가는 통로
const GAP = 10;
const ringArcs = [
  [-90 + GAP, 0 - GAP],
  [0 + GAP, 90 - GAP],
  [90 + GAP, 180 - GAP],
  [180 + GAP, 270 - GAP],
];
for (const [a0, a1] of ringArcs) {
  arcBlock(R_RING, a0, a1, 9);
  furniture.push({ type: 'hedge', from: a0, to: a1 });
}

// 바퀴살: 대각선 낮은 칸막이(가운데에 지나가는 틈)
for (const a of [-135, -45, 45, 135]) {
  lineBlock(a, 128, 210, 7);
  lineBlock(a, 270, 372, 7);
  furniture.push({ type: 'spoke', angle: a });
}

// 가운데: 나무와 둥근 벤치
block(C.x, C.y, 34);
furniture.push({ type: 'tree', x: C.x, y: C.y });

// 의자(앉을 수 있는 자리)
export const seats = [];
function seat(x, y, face, zone, approach) {
  seats.push({ x, y, face, zone, approach: approach || { x, y } });
}

// 가운데 나무 둘레 벤치 6자리 (나무를 등지고 바깥을 봄)
for (let i = 0; i < 6; i++) {
  const a = -60 + i * 60;
  const s = polar(62, a);
  const ap = polar(84, a);
  seat(s.x, s.y, a, 'hub', ap);
}
furniture.push({ type: 'ringBench' });

// 말씀(북): 책장 두 칸, 1인 안락의자 2개, 읽기 테이블
for (const [a0, a1] of [[-128, -102], [-78, -52]]) {
  arcBlock(352, a0, a1, 11);
  furniture.push({ type: 'shelf', from: a0, to: a1 });
}
for (const a of [-112, -68]) {
  const p = polar(292, a);
  block(p.x, p.y, 10);
  furniture.push({ type: 'armchair', x: p.x, y: p.y, face: a + 180 });
  const ap = polar(258, a);
  seat(p.x, p.y, a + 180, 'word', ap);
}
{
  const t = polar(225, -90);
  block(t.x, t.y, 20);
  furniture.push({ type: 'roundTable', x: t.x, y: t.y, r: 20 });
  seat(t.x - 36, t.y, 0, 'word', { x: t.x - 44, y: t.y + 24 });
  seat(t.x + 36, t.y, 180, 'word', { x: t.x + 44, y: t.y + 24 });
  furniture.push({ type: 'stool', x: t.x - 36, y: t.y });
  furniture.push({ type: 'stool', x: t.x + 36, y: t.y });
}

// 교제(동): 카운터, 주문 자리, 픽업대, 큰 공용 테이블
arcBlock(322, 14, 40, 12);
furniture.push({ type: 'counter', from: 14, to: 40 });
export const spots = {
  order: polar(288, 27),
  pickup: polar(296, 10),
  tray: polar(420, 135),
  door: polar(436, 180),
};
furniture.push({ type: 'pickup', ...polar(318, 8) });
{
  const cx = 726, cy = 455, w = 64, h = 132;
  for (let y = cy - h / 2 + 10; y <= cy + h / 2 - 10; y += 12) {
    block(cx - 16, y, 18);
    block(cx + 16, y, 18);
  }
  furniture.push({ type: 'longTable', x: cx, y: cy, w, h });
  for (const dy of [-42, 0, 42]) {
    seat(cx - 50, cy + dy, 0, 'fellowship', { x: cx - 76, y: cy + dy });
    seat(cx + 50, cy + dy, 180, 'fellowship', { x: cx + 76, y: cy + dy });
    furniture.push({ type: 'stool', x: cx - 50, y: cy + dy });
    furniture.push({ type: 'stool', x: cx + 50, y: cy + dy });
  }
}

// 기도(남): 창을 바라보는 방석 3개, 작은 등
for (const a of [68, 90, 112]) {
  const p = polar(300, a);
  const ap = polar(272, a);
  seat(p.x, p.y, a, 'prayer', ap);
  furniture.push({ type: 'cushion', x: p.x, y: p.y });
}
for (const a of [79, 101]) {
  const p = polar(340, a);
  block(p.x, p.y, 7);
  furniture.push({ type: 'lamp', x: p.x, y: p.y });
}

// 증거(서): 입구 라운지 소파 2개
for (const a of [150, 210]) {
  const p = polar(272, a);
  block(p.x, p.y, 16);
  furniture.push({ type: 'sofa', x: p.x, y: p.y, face: a + 180 });
  const ap = polar(236, a);
  seat(p.x, p.y, a + 180, 'witness', ap);
}
furniture.push({ type: 'mat', ...polar(420, 180) });

// 순종(회랑): 화분, 쟁반 반납대, 테라스 문
export const pots = [];
for (let a = 15; a < 360; a += 30) {
  if (a === 135 || a === 45) continue; // 반납대·테라스 문 자리
  const p = polar(420, a);
  block(p.x, p.y, 12);
  pots.push({ ...p, a });
  furniture.push({ type: 'pot', x: p.x, y: p.y });
}
{
  const p = polar(432, 135);
  block(p.x, p.y, 14);
  furniture.push({ type: 'trayStation', x: p.x, y: p.y });
}

export const spawn = polar(430, 180);

// 사람이 설 수 있는 곳인지
export const BODY = 11;
export function isFree(x, y) {
  const r = Math.hypot(x - C.x, y - C.y);
  if (r > R_OUT - 16) return false;
  for (const o of obstacles) {
    const d = Math.hypot(x - o.x, y - o.y);
    if (d < o.r + BODY) return false;
  }
  return true;
}
