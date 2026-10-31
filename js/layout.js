// 수레바퀴 카페 배치 (단위: 미터)
// x = 동(오른쪽), z = 남(아래쪽). 위에서 보면 수레바퀴 그림과 같은 방향:
//   위(북) 기도 · 아래(남) 말씀 · 왼쪽(서) 증거 · 오른쪽(동) 교제 · 가운데 그리스도 · 둘레 순종
// 네 칸(사분면)도 그림을 따름: 북서 기도하는 손, 북동 교제, 남서 배(증거), 남동 성경(말씀)

export const R_HALL = 28;     // 통유리 바깥벽
export const R_RIM_IN = 23.5; // 둘레 회랑 안쪽 경계
export const R_HUB = 5;       // 가운데 단
export const SPOKE = 2;       // 바퀴살 길 절반 폭
export const CEIL = 11;       // 층고

export const deg = (d) => (d * Math.PI) / 180;
// 각도 기준: 0 = 동, 90 = 남, -90 = 북, 180 = 서
export const polar = (r, a) => ({ x: r * Math.cos(deg(a)), z: r * Math.sin(deg(a)) });

export const Q = {
  prayer: { x: -10, z: -10 },  // 북서: 기도하는 손 + 고요한 물
  fellow: { x: 9.5, z: -9.5 }, // 북동: 카페 카운터 + 긴 테이블
  witness: { x: -10, z: 10 },  // 남서: 배 + 물고기 모빌 + 둥근 세상 화면
  word: { x: 10, z: 10 },      // 남동: 펼쳐진 큰 성경
};
export const PRAYER_POOL_R = 4.2;
export const WITNESS_POOL_R = 5.2;

// 바닥 높이: 가운데 단과 바퀴살·둘레 길은 살짝 올라와 있음
export function floorY(x, z) {
  const r = Math.hypot(x, z);
  if (r < R_HUB) return 0.5;
  if (r >= R_RIM_IN) return 0.25;
  if (Math.abs(x) < SPOKE || Math.abs(z) < SPOKE) return 0.25;
  return 0;
}

// 장애물(원)
export const obstacles = [];
const block = (x, z, r) => obstacles.push({ x, z, r });

// 기둥: 바퀴살 사이 대각선 방향
export const columns = [];
for (let a = 15; a < 360; a += 30) {
  const p = polar(21.3, a);
  columns.push(p);
  block(p.x, p.z, 0.45);
}

// 교제: 곡선 카운터(가운데를 중심으로 반지름 19)
export const COUNTER = { r: 19.2, from: -70, to: -38 };
for (let a = COUNTER.from; a <= COUNTER.to; a += 2) {
  const p = polar(COUNTER.r, a);
  block(p.x, p.z, 0.6);
}
export const LONG_TABLE = { x: 7.4, z: -7.4, len: 6, w: 1.3, rot: -45 };
{
  const dir = polar(1, LONG_TABLE.rot);
  for (let t = -LONG_TABLE.len / 2 + 0.5; t <= LONG_TABLE.len / 2 - 0.5; t += 0.8) {
    block(LONG_TABLE.x + dir.x * t, LONG_TABLE.z + dir.z * t, 0.75);
  }
}

// 말씀: 큰 성경 받침
export const BIBLE = { x: Q.word.x, z: Q.word.z, plinth: 2.6 };
block(BIBLE.x, BIBLE.z, BIBLE.plinth);
// 말씀의 손 조형(성경을 쥔 손)
export const WORD_HAND = { x: Q.word.x + 3.1, z: Q.word.z + 2.7 };
block(WORD_HAND.x, WORD_HAND.z, 1.7);
// 순종 회랑의 일꾼 배가 순환 바닥 표식(세계 → 초신자 → 제자 → 일꾼 → 파송)
// 순종 회랑 바깥쪽 역사 빛 패널 (1960년대 → 지금, 배가의 성장)
export const HISTORY = [186, 197, 220, 231, 251, 262].map((a) => ({ ...polar(26.9, a), a }));
for (const h of HISTORY) block(h.x, h.z, 0.75);
export const CYCLE = [135, 207, 279, 351, 63].map((a) => ({ ...polar(24.2, a), a }));

// 순종: 둘레 화분, 쟁반 반납대
export const planters = [];
for (let a = 0; a < 360; a += 30) {
  if (a === 90) continue; // 입구
  const p = polar(25.5, a);
  planters.push({ ...p, a });
  block(p.x, p.z, 0.7);
}
export const TRAY = polar(25.5, 105);
block(TRAY.x, TRAY.z, 0.5);

// 입구(남쪽)
export const DOOR = polar(R_HALL, 90);
export const SPAWN = polar(26.2, 90);

// 앉을 수 있는 자리
export const seats = [];
function seat(x, z, faceTo, kind, approach) {
  const face = Math.atan2(faceTo.x - x, faceTo.z - z);
  seats.push({ x, z, face, kind, approach: approach || { x, z }, taken: false });
}

// 그리스도: 빛 둘레의 둥근 벤치 4곳(대각선)
for (const a of [-135, -45, 45, 135]) {
  const p = polar(4.3, a);
  const ap = polar(3.3, a);
  seat(p.x, p.z, { x: 0, z: 0 }, 'bench', ap);
}
// 기도: 물가 무릎 꿇는 자리 3곳
for (const a of [25, 45, 65]) {
  const p = { x: Q.prayer.x + Math.cos(deg(a)) * 5.0, z: Q.prayer.z + Math.sin(deg(a)) * 5.0 };
  seat(p.x, p.z, Q.prayer, 'kneel');
}
// 교제: 긴 테이블 양쪽 돌 의자
export const stools = [];
{
  const dir = polar(1, LONG_TABLE.rot);
  const side = { x: -dir.z, z: dir.x };
  for (const t of [-2, 0, 2]) {
    for (const s of [-1, 1]) {
      const p = { x: LONG_TABLE.x + dir.x * t + side.x * s * 1.05, z: LONG_TABLE.z + dir.z * t + side.z * s * 1.05 };
      const ap = { x: p.x + side.x * s * 0.8, z: p.z + side.z * s * 0.8 };
      stools.push(p);
      seat(p.x, p.z, { x: LONG_TABLE.x + dir.x * t, z: LONG_TABLE.z + dir.z * t }, 'stool', ap);
    }
  }
}
// 증거: 물 위 배에 두 자리
export const BOAT = { x: Q.witness.x + 0.5, z: Q.witness.z - 0.5, rot: 30 };
{
  const dir = polar(1, BOAT.rot);
  for (const t of [-0.8, 0.8]) {
    const p = { x: BOAT.x + dir.x * t, z: BOAT.z + dir.z * t };
    const edge = { x: Q.witness.x + Math.cos(deg(-45)) * (WITNESS_POOL_R + 0.6), z: Q.witness.z + Math.sin(deg(-45)) * (WITNESS_POOL_R + 0.6) };
    seat(p.x, p.z, { x: p.x - dir.z, z: p.z + dir.x }, 'boat', edge);
  }
}
// 말씀: 성경을 둘러싼 곡선 벤치 3곳
for (const a of [-160, -135, -110]) {
  const p = { x: BIBLE.x + Math.cos(deg(a)) * 4.4, z: BIBLE.z + Math.sin(deg(a)) * 4.4 };
  seat(p.x, p.z, BIBLE, 'bench');
}

// 체험 지점: 가까이 가면 동작 버튼이 뜸
export const SPOTS = {
  light: { x: 0, z: 0.6, r: 4.5 },
  pray: { x: Q.prayer.x + 3.6, z: Q.prayer.z + 3.6, r: 6.5 },
  order: { ...polar(17.4, -56), r: 6 },
  pickup: polar(17.4, -40),
  boat: { x: Q.witness.x + 4.2, z: Q.witness.z - 4.2, r: 7 },
  read: { x: BIBLE.x - 3.3, z: BIBLE.z - 3.3, r: 6.5 },
  water: { r: 2.6 },
  tray: { ...polar(24.6, 105), r: 2.6 },
};

// 사람이 설 수 있는 곳인지
export const BODY = 0.35;
export function isFree(x, z) {
  const r = Math.hypot(x, z);
  if (r > R_HALL - 0.7) return false;
  if (Math.hypot(x - Q.prayer.x, z - Q.prayer.z) < PRAYER_POOL_R + BODY) return false;
  if (Math.hypot(x - Q.witness.x, z - Q.witness.z) < WITNESS_POOL_R + BODY) return false;
  for (const o of obstacles) {
    if (Math.hypot(x - o.x, z - o.z) < o.r + BODY) return false;
  }
  return true;
}
