// 수레바퀴 카페 배치 (단위: 미터)
// x = 동(오른쪽), z = 남(아래쪽). 위에서 보면 수레바퀴 그림과 같은 방향:
//   위(북) 기도 · 아래(남) 말씀 · 왼쪽(서) 증거 · 오른쪽(동) 교제 · 가운데 그리스도 · 둘레 순종
// 네 칸(사분면)도 그림을 따름: 북서 기도하는 손, 북동 교제, 남서 배(증거), 남동 성경(말씀)

// 넓히기 배율: 카페는 길이 1.1배(면적 약 1.2배), 정원 띠는 1.7배(면적 약 2.3배). 가구·시설 크기는 그대로
export const C = 1.25;
const c = (r) => r * C;
export const R_HALL = c(28);     // 통유리 바깥벽
export const R_RIM_IN = c(23.5); // 둘레 회랑 안쪽 경계
export const R_HUB = 5;       // 가운데 단
export const SPOKE = 2;       // 바퀴살 길 절반 폭
export const CEIL = 11;       // 층고
// 정원 반지름 바꾸기: 예전 반지름(유리벽 28m 기준) → 넓힌 반지름
export const G = 2.4;   // 정원(카페 둘레 ~ 숲 입구) 넓히는 배율
const GF = 1.7;         // 숲 속은 덜 넓힘
export const gr = (r) => (r <= 77 ? R_HALL + (r - 28) * G : R_HALL + 49 * G + (r - 77) * GF);
export const R_GARDEN = gr(74);  // 걸어 다닐 수 있는 바깥 정원(말씀 테마파크) 끝
export const R_WALK = gr(34);    // 건물을 한 바퀴 도는 정원 산책길(가운데)
export const R_PARK = gr(56);    // 테마파크를 한 바퀴 도는 바깥 둘레길

export const deg = (d) => (d * Math.PI) / 180;
// 각도 기준: 0 = 동, 90 = 남, -90 = 북, 180 = 서
export const polar = (r, a) => ({ x: r * Math.cos(deg(a)), z: r * Math.sin(deg(a)) });

export const Q = {
  prayer: { x: c(-10), z: c(-10) },  // 북서: 기도하는 손 + 고요한 물
  fellow: { x: c(9.5), z: c(-9.5) }, // 북동: 카페 카운터 + 긴 테이블
  witness: { x: c(-10), z: c(10) },  // 남서: 배 + 물고기 모빌 + 둥근 세상 화면
  word: { x: c(10), z: c(10) },      // 남동: 펼쳐진 큰 성경
};
export const PRAYER_POOL_R = 4.2;
export const WITNESS_POOL_R = 5.2;

// 바닥 높이: 가운데 단과 바퀴살·둘레 길은 살짝 올라와 있음
export function floorY(x, z) {
  const r = Math.hypot(x, z);
  if (r >= R_HALL) {
    if (r < R_HALL + 0.6) return 0; // 기단 위
    const d = poolDepth(x, z);
    return d ? -0.5 - d : -0.5; // 잔디, 수영장 안은 물속 바닥
  }
  const w = onWater(x, z);
  if (w) return w.y; // 물 위를 걸음
  if (r < R_HUB) return 0.5;
  if (r >= R_RIM_IN) return 0.25;
  if (Math.abs(x) < SPOKE || Math.abs(z) < SPOKE) return 0.25;
  return 0;
}

// 걸을 수 있는 물: 기도의 고요한 물, 증거의 물
export function onWater(x, z) {
  if (Math.hypot(x - Q.prayer.x, z - Q.prayer.z) < PRAYER_POOL_R) return { y: 0.03 };
  if (Math.hypot(x - Q.witness.x, z - Q.witness.z) < WITNESS_POOL_R) return { y: -0.06 };
  return null;
}

// 장애물(원)
export const obstacles = [];
// h: 높이(점프해서 이보다 높이 뜨면 넘어갈 수 있음). 실내 물건은 넘을 수 없음
const block = (x, z, r, h = Infinity) => obstacles.push({ x, z, r, h });

// 기둥: 바퀴살 사이 대각선 방향
export const columns = [];
for (let a = 15; a < 360; a += 30) {
  const p = polar(c(21.3), a);
  columns.push(p);
  block(p.x, p.z, 0.45);
}

// 교제: 곡선 카운터(가운데를 중심으로 반지름 19)
export const COUNTER = { r: c(19.2), from: -70, to: -38 };
for (let a = COUNTER.from; a <= COUNTER.to; a += 2) {
  const p = polar(COUNTER.r, a);
  block(p.x, p.z, 0.6);
}
export const LONG_TABLE = { x: c(7.4), z: c(-7.4), len: 6, w: 1.3, rot: -45 };
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
export const HISTORY = [186, 197, 220, 231, 251, 262].map((a) => ({ ...polar(c(26.9), a), a }));
for (const h of HISTORY) block(h.x, h.z, 0.75);
export const CYCLE = [285, 335, 25, 75, 135].map((a) => ({ ...polar(c(24.2), a), a }));

// 순종: 둘레 화분, 쟁반 반납대
export const planters = [];
for (let a = 0; a < 360; a += 30) {
  if (a === 90) continue; // 입구
  const p = polar(c(25.5), a);
  planters.push({ ...p, a });
  block(p.x, p.z, 0.7);
}
export const TRAY = polar(c(25.5), 105);
block(TRAY.x, TRAY.z, 0.5);

// 입구(남쪽)
export const DOOR = polar(R_HALL, 90);
export const SPAWN = polar(c(26.2), 90);

// 순종 회랑 창가의 라운지 의자 (CC0 가구)
export const LOUNGES = [-15, 45, 165].map((a) => ({ a, chair: polar(c(26.3), a), table: polar(c(26.4), a + 3.4), approach: polar(c(25.0), a) }));
for (const l of LOUNGES) { block(l.chair.x, l.chair.z, 0.5); block(l.table.x, l.table.z, 0.35); }
// 쉼의 자리: 창밖 정원을 바라보는 리클라이너, 푹 꺼지는 빈백
export const RESTS = [
  ...[306, 314, 322].map((a) => ({ a, kind: 'recline', ...polar(c(26.5), a), approach: polar(c(25.0), a) })),
  ...[8, 18, 140, 158].map((a) => ({ a, kind: 'beanbag', ...polar(c(26.3), a), approach: polar(c(24.9), a) })),
];
for (const r of RESTS) block(r.x, r.z, r.kind === 'recline' ? 0.55 : 0.5);

// ---------- 바깥 정원 ----------
// ---------- 말씀 테마파크 ----------
// 각 구역은 (반지름 r, 각도 a)에 놓이고, 구역 안 좌표 u는 둘레 방향, v는 바깥 방향(미터)
function zone(name, r, a, w, d) {
  const c = polar(r, a);
  const t = { x: -Math.sin(deg(a)), z: Math.cos(deg(a)) }; // 둘레 방향
  const n = { x: Math.cos(deg(a)), z: Math.sin(deg(a)) };  // 바깥 방향
  return {
    name, r, a, w, d, x: c.x, z: c.z, t, n,
    rot: Math.atan2(t.x, t.z), // 모델의 +z를 둘레 방향으로
    at(u, v = 0) { return { x: c.x + t.x * u + n.x * v, z: c.z + t.z * u + n.z * v }; },
    local(x, z) { const dx = x - c.x, dz = z - c.z; return { u: dx * t.x + dz * t.z, v: dx * n.x + dz * n.z }; },
    inside(x, z, pad = 0) { const l = this.local(x, z); return Math.abs(l.u) < w / 2 + pad && Math.abs(l.v) < d / 2 + pad; },
  };
}
export const PARK = {
  // 안쪽 띠 (산책길과 둘레길 사이)
  market: zone('market', gr(46), 0, 12, 6),     // 간식·음료 가게
  sower: zone('sower', gr(46), 60, 12, 7),      // 씨 뿌리는 비유의 밭
  mustard: zone('mustard', gr(46), 120, 8, 8),  // 겨자씨
  vine: zone('vine', gr(46), 180, 8, 5),        // 포도나무 그늘
  fold: zone('fold', gr(46), 240, 9, 9),        // 양 우리 (잃은 양)
  well: zone('well', gr(46), 300, 6, 6),        // 우물 (요 4:14)
  // 바깥 띠 (둘레길 바깥)
  pool: zone('pool', gr(65), 120, 14, 7),
  camp: zone('camp', gr(65), 150, 13, 10),
  bbq: zone('bbq', gr(65), 173, 9, 7),
  ark: zone('ark', gr(65), 205, 30, 15),   // 방주 + 짝지어 줄 선 동물들
  soccer: zone('soccer', gr(65), 245, 22, 13),
  basket: zone('basket', gr(65), 280, 12, 10),
  tennis: zone('tennis', gr(65), 310, 17, 9),
  badminton: zone('badminton', gr(65), 337, 11, 6),
  pingpong: zone('pingpong', gr(65), 0, 7, 6),
  meadow: zone('meadow', gr(63), 40, 22, 14),   // 푸른 초장: 동물들이 노님
  // 안쪽 띠 빈자리: 성경 이야기 체험
  jericho: zone('jericho', gr(46), 76, 12, 12), // 여리고 성 (수 6, 히 11:30)
  david: zone('david', gr(46), 104, 12, 11),    // 다윗과 골리앗 (삼상 17)
  jonah: zone('jonah', gr(46), 164, 12, 11),    // 요나와 큰 물고기 (욘 1-2)
};
// 성경 이야기 구역의 막힌 곳: 여리고 성벽(무너지면 풀림), 골리앗, 요나의 못
export const JERICHO = { ...PARK.jericho.at(0, 0), R: 3.4 };
for (let k = 0; k < 20; k++) {
  const a = (k / 20) * Math.PI * 2;
  obstacles.push({ x: JERICHO.x + Math.cos(a) * JERICHO.R, z: JERICHO.z + Math.sin(a) * JERICHO.R, r: 0.6, h: 1.9, tag: 'jericho' });
}
export const GOLIATH = PARK.david.at(3.6, 1.2);
block(GOLIATH.x, GOLIATH.z, 0.9);
export const JONAH_POND = { ...PARK.jonah.at(1.6, 0.4), r: 3.6 };
block(JONAH_POND.x, JONAH_POND.z, JONAH_POND.r - 0.2);
// 수영장 물: 가장자리 1m는 완만한 경사, 가운데 깊이 0.75m
export const POOL = { w: 12, d: 5.4, depth: 0.75, water: -0.5 - 0.2 };
export function poolDepth(x, z) {
  const l = PARK.pool.local(x, z);
  const eu = POOL.w / 2 - Math.abs(l.u), ev = POOL.d / 2 - Math.abs(l.v);
  if (eu <= 0 || ev <= 0) return 0;
  return POOL.depth * Math.min(1, Math.min(eu, ev) / 1.2);
}
export const inPool = (x, z) => poolDepth(x, z) > 0.25;
// 좁은 문 (마 7:13): 입구 길 위, 산책길과 둘레길 사이
export const GATE = { r: gr(44), w: 1.0 };
// 둘레길과 이어지는 오솔길 각도
export const LANES = [30, 90, 150, 210, 270, 330];
const inAnyZone = (x, z, pad) => Object.values(PARK).some((zn) => zn.inside(x, z, pad));
const onPaths = (x, z) => {
  const r = Math.hypot(x, z);
  if (Math.abs(r - R_PARK) < 3 || Math.abs(r - R_WALK) < 3) return true;
  const a = (Math.atan2(z, x) * 180) / Math.PI;
  for (const la of LANES) {
    let d = Math.abs(((a - la + 540) % 360) - 180);
    if (r > R_WALK && r < R_PARK + 1 && d * (Math.PI / 180) * r < 2.6) return true;
  }
  if (Math.abs(x) < 4 && z > 0) return true; // 입구 길
  return false;
};
export function parkClear(x, z, pad = 1.5) { return !inAnyZone(x, z, pad) && !onPaths(x, z) && !nearTrail(x, z, 3); }

// ---------- 숲속 코스: 둘레길에서 숲으로 들어가는 오솔길 ----------
// 점은 (반지름, 각도). 정거장은 길을 따라 간 비율(f)과 놓일 쪽(side: 1 오른쪽, -1 왼쪽)
const TRAIL_DEF = {
  // 천로역정: 멀고 구불구불한 길 (짐을 지고 출발). 3번째 정거장(세속현자)에서 시내산 샛길이 갈라짐
  pilgrim: { pts: [[56, 265], [64, 265], [72, 262], [80, 256], [88, 251], [96, 253], [102, 260], [106, 269], [111, 277], [117, 281], [123, 276], [127, 267], [131, 257], [136, 249], [142, 246], [148, 252], [151, 261], [153, 270]],
    st: [[0.025, 1], [0.065, -1], [0.11, 0], [0.155, 1], [0.215, 0], [0.27, 1], [0.33, 1], [0.39, -1], [0.45, 1], [0.51, -1], [0.58, 0], [0.65, 1], [0.72, -1], [0.8, 1], [0.89, 0], [1, 0]] },
  sinai: { from: ['pilgrim', 0.155], pts: [[86, 247], [87, 241], [90, 236]], st: [[0.45, 1], [1, 0]] },
  gospel: { pts: [[56, 16], [66, 16], [76, 20], [85, 14], [93, 18], [101, 22], [109, 18]],
    st: [[0.07, 1], [0.18, -1], [0.3, 1], [0.42, -1], [0.52, 1], [0.63, 0], [0.8, -1], [1, 0]] },
  heaven: { pts: [[56, 227], [66, 227], [76, 224], [86, 230], [95, 226], [104, 222], [113, 227]],
    st: [[0.08, 1], [0.2, -1], [0.33, 1], [0.46, -1], [0.58, 1], [0.7, 0], [0.84, -1], [1, 0]] },
  jesus: { pts: [[56, 68], [66, 68], [76, 72], [85, 66], [93, 70], [101, 75], [110, 70]],
    st: [[0.07, 1], [0.18, 0], [0.3, -1], [0.41, 1], [0.52, -1], [0.62, 1], [0.73, -1], [0.85, 1], [1, 0]] },
  // 동방박사: 별을 따라 아기 예수께
  magi: { pts: [[56, 100], [66, 100], [76, 103], [86, 98], [95, 102], [104, 106], [112, 102]],
    st: [[0.08, 1], [0.24, -1], [0.45, 0], [0.66, 1], [1, 0]] },
  // 생명의 다리: 곧은 길 끝의 넓은 빈터를 가로지르는 낭떠러지 (정거장 위치는 아래 BRIDGE 기준으로 다시 잡음)
  bridge: { pts: [[56, 295], [66, 295], [76, 296], [88, 296], [100, 296], [108, 296], [113, 296]],
    st: [[-27, 1], [-20, -1], [-15, 1], [-12, -1, 7.5], [-9.5, 0], [-6.4, 0], [13, 0]], byV: true },
};
// 생명의 다리 빈터 (가로 u, 길 방향 v). 가운데 |v| < CH.v 는 낭떠러지
const BR_C = polar(gr(104), 296), BR_A = { x: Math.cos(deg(296)), z: Math.sin(deg(296)) };
export const BRIDGE = {
  x: BR_C.x, z: BR_C.z, a: BR_A, b: { x: -BR_A.z, z: BR_A.x }, // b: 길 오른쪽
  U: 15, V: 17, gap: 4,              // 빈터 반폭·반길이, 낭떠러지 반폭
  tries: [{ u: -12, len: 3.4 }, { u: -7.5, len: 2.6 }, { u: 8, len: 3.8 }], // 사람의 노력으로 놓은 다리 (모자람)
  cross: { u: 0, w: 1.25 }, open: false,
  local(x, z) { const dx = x - this.x, dz = z - this.z; return { u: dx * this.b.x + dz * this.b.z, v: dx * this.a.x + dz * this.a.z }; },
  at(u, v) { return { x: this.x + this.b.x * u + this.a.x * v, z: this.z + this.b.z * u + this.a.z * v }; },
};
// 낭떠러지에서: 1 = 디딜 수 있음, 0 = 막힘, -1 = 낭떠러지 밖
function bridgeFree(x, z) {
  const B = BRIDGE;
  if (Math.abs(x - B.x) > 30 || Math.abs(z - B.z) > 30) return -1;
  const { u, v } = B.local(x, z);
  if (Math.abs(u) > B.U || Math.abs(v) > B.V) return -1;
  if (Math.abs(v) >= B.gap) return 1;
  if (B.open && Math.abs(u - B.cross.u) < B.cross.w) return 1;
  for (const t of B.tries) if (Math.abs(u - t.u) < 0.75 && v < -B.gap + t.len) return 1;
  return 0;
}
function catmull(pts, step = 0.5, head) {
  const P = pts.map(([r, a]) => polar(gr(r), a));
  if (head) P.unshift(head);
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const n = Math.ceil(Math.hypot(p2.x - p1.x, p2.z - p1.z) / step);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) });
    }
  }
  out.push(P[P.length - 1]);
  let L = 0;
  out.forEach((q, i) => { if (i) L += Math.hypot(q.x - out[i - 1].x, q.z - out[i - 1].z); q.s = L; });
  return out;
}
export const TRAIL_W = 1.3; // 걸을 수 있는 반폭
export const TRAILS = {};
for (const [id, d] of Object.entries(TRAIL_DEF)) {
  const S = catmull(d.pts, 0.5, d.from && TRAILS[d.from[0]].sample(d.from[1]));
  const L = S[S.length - 1].s;
  const sample = (f) => {
    const s = f * L;
    let i = S.findIndex((q) => q.s >= s); if (i < 1) i = 1;
    const a = S[i - 1], b = S[i], k = (s - a.s) / Math.max(1e-6, b.s - a.s);
    const dx = b.x - a.x, dz = b.z - a.z, dl = Math.hypot(dx, dz) || 1;
    return { x: a.x + dx * k, z: a.z + dz * k, dir: { x: dx / dl, z: dz / dl } };
  };
  const stations = d.st.map(([f0, side, off0]) => {
    // byV: 생명의 다리 빈터 가운데에서 잰 거리(m)로 자리를 잡음
    const f = d.byV ? (Math.hypot(BRIDGE.x - S[0].x, BRIDGE.z - S[0].z) + f0) / L : f0;
    const p = sample(f);
    const right = { x: -p.dir.z, z: p.dir.x };
    const off = side ? off0 || 3.2 : 0;
    return { f, side, x: p.x, z: p.z, dir: p.dir, right, show: { x: p.x + right.x * off * side, z: p.z + right.z * off * side } };
  });
  TRAILS[id] = { id, samples: S, len: L, sample, stations, end: stations[stations.length - 1], from: d.from };
}
const trailSamples = Object.values(TRAILS).flatMap((t) => t.samples);
export function nearTrail(x, z, d) {
  for (const q of trailSamples) if (Math.abs(q.x - x) < d && Math.abs(q.z - z) < d && Math.hypot(q.x - x, q.z - z) < d) return true;
  for (const t of Object.values(TRAILS)) if (Math.hypot(t.end.x - x, t.end.z - z) < 9 + d - 3) return true;
  return false;
}
// 정원 밖에서 걸을 수 있는 곳: 오솔길, 정거장 둘레, 길 끝 빈터
const TM = { half: Math.ceil(Math.max(...Object.values(TRAILS).map((t) => Math.hypot(t.end.x, t.end.z))) + 12), cell: 0.5 };
TM.n = Math.ceil((TM.half * 2) / TM.cell);
const trailMask = new Uint8Array(TM.n * TM.n);
{
  const mark = (x, z, r) => {
    const i0 = Math.floor((x - r + TM.half) / TM.cell), i1 = Math.floor((x + r + TM.half) / TM.cell);
    const j0 = Math.floor((z - r + TM.half) / TM.cell), j1 = Math.floor((z + r + TM.half) / TM.cell);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const cx = -TM.half + (i + 0.5) * TM.cell, cz = -TM.half + (j + 0.5) * TM.cell;
      if (i >= 0 && j >= 0 && i < TM.n && j < TM.n && Math.hypot(cx - x, cz - z) < r) trailMask[j * TM.n + i] = 1;
    }
  };
  for (const t of Object.values(TRAILS)) {
    for (const q of t.samples) mark(q.x, q.z, TRAIL_W);
    for (const s of t.stations) if (s.side) mark(s.x + s.right.x * s.side * 1.4, s.z + s.right.z * s.side * 1.4, 2);
    mark(t.end.x, t.end.z, 7);
  }
}
function onTrail(x, z) {
  const i = Math.floor((x + TM.half) / TM.cell), j = Math.floor((z + TM.half) / TM.cell);
  return i >= 0 && j >= 0 && i < TM.n && j < TM.n && trailMask[j * TM.n + i] === 1;
}
for (const t of Object.values(TRAILS)) {
  for (const st of t.stations) if (st.side) block(st.show.x, st.show.z, 0.8, 1.4);
  const e = t.end; block(e.x + e.dir.x * 5, e.z + e.dir.z * 5, 1.4);
}
export const WALK_MAX = Math.max(...Object.values(TRAILS).map((t) => Math.hypot(t.end.x, t.end.z) + 8));

// 숲 나무: 테마파크 바깥의 숲과, 정원 안 구역 사이에 드문드문 (정원 안쪽에 있는 나무는 피해 다님)
export const TREES = [];
{
  let s = 5;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 400; k++) {
    const a = rnd() * Math.PI * 2;
    const r = gr(77) + Math.pow(rnd(), 1.4) * 82 * GF;
    const h = 5 + rnd() * 7;
    if (Math.abs(a - Math.PI / 2) < 0.06) continue; // 입구 앞 길
    if (nearTrail(Math.cos(a) * r, Math.sin(a) * r, 4)) continue; // 숲속 코스
    { const l = BRIDGE.local(Math.cos(a) * r, Math.sin(a) * r); if (Math.abs(l.u) < BRIDGE.U + 4 && Math.abs(l.v) < BRIDGE.V + 3) continue; }
    TREES.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h, dark: rnd() < 0.5 });
  }
  const nForest = TREES.length;
  for (let k = 0; k < 600 && TREES.length < nForest + 45; k++) {
    const a = rnd() * Math.PI * 2;
    const r = gr(39) + rnd() * 34 * G;
    const h = 4 + rnd() * 5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!parkClear(x, z, 4.5) || Math.hypot(x, z) > R_GARDEN - 1) continue;
    TREES.push({ x, z, h, dark: rnd() < 0.5 });
  }
}
// 둥근 꽃밭 6곳, 산책길 바깥쪽 벤치 6개, 길가 등
export const FLOWER_BEDS = [-150, -90, -30, 30, 150, 210].map((a) => ({ a, ...polar(gr(39.5), a), r: 2.3 }));
export const GARDEN_BENCHES = [0, 60, 120, 180, 240, 300].map((a) => ({ a, ...polar(gr(36.2), a), approach: polar(gr(35.1), a) }));
export const GARDEN_LAMPS = [];
for (let a = 15; a < 360; a += 30) GARDEN_LAMPS.push(polar(gr(32.5), a));
for (const t of TREES) if (Math.hypot(t.x, t.z) < R_GARDEN + 1) block(t.x, t.z, 0.6);
for (const b of FLOWER_BEDS) block(b.x, b.z, b.r, 0.35);
for (const b of GARDEN_BENCHES) block(b.x, b.z, 0.55, 0.95);
for (const l of GARDEN_LAMPS) block(l.x, l.z, 0.15, 1.7);
// 테마파크 시설물 (사람이 지나갈 수 없는 것만)
{
  const P = PARK;
  const b = (zn, u, v, r, h = Infinity) => { const p = zn.at(u, v); block(p.x, p.z, r, h); };
  // 좁은 문 양옆 생울타리
  for (const dx of [-1, 1]) for (let k = 0; k < 6; k++) block(dx * (GATE.w / 2 + 0.45 + k * 0.6), GATE.r, 0.4, 1.2);
  for (let u = -5; u <= 5; u += 2.5) b(P.market, u, 1.8, 1.3, 2.6);
  b(P.mustard, 0, 0, 0.7);
  for (const u of [-3, 3]) for (const v of [-1.8, 1.8]) b(P.vine, u, v, 0.2);
  // 양 우리 울타리(둥근 울, 산책길 쪽으로 문)
  for (let k = 0; k < 28; k++) {
    const ang = (k / 28) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(ang - Math.PI), Math.cos(ang - Math.PI))) < 0.35) continue; // 안쪽(건물 쪽) 문
    b(P.fold, Math.sin(ang) * 4.2, Math.cos(ang) * 4.2, 0.3, 0.95);
  }
  b(P.well, 0, 0, 1.1, 0.9);
  // 수영장 둘레는 걸을 수 있음, 선베드 두 개
  for (const u of [-3, 0, 3]) b(P.camp, u, 2.8, 1.2, 1.5); // 텐트
  b(P.camp, 0, -1.2, 0.7, 0.6); // 모닥불
  b(P.bbq, -2, 0.5, 0.6, 1.05); for (const u of [1.5, 3.4]) b(P.bbq, u, 1.2, 0.8, 0.8); // 화로, 피크닉 탁자
  for (let u = -7; u <= 7; u += 1.4) b(P.ark, u, 1, 2.1 - Math.abs(u) * 0.12); // 방주
  for (const v of [-2.4, -3.6, -4.8]) b(P.ark, 0, v, 0.75, 1.3); // 경사로
  for (const u of [-11, 11]) for (const v of [-1.3, 1.3]) b(P.soccer, u, v, 0.15, 1.25); // 골대 기둥
  b(P.basket, 5.8, 0, 0.3);
  for (const v of [-4.8, 4.8]) b(P.tennis, 0, v, 0.12, 1.05);
  for (const v of [-3.2, 3.2]) b(P.badminton, 0, v, 0.1, 1.6);
  for (const u of [-0.9, 0, 0.9]) b(P.pingpong, 0, u * 0.6, 0.55, 0.8);
}

// 앉을 수 있는 자리
export const seats = [];
function seat(x, z, faceTo, kind, approach) {
  const face = Math.atan2(faceTo.x - x, faceTo.z - z);
  seats.push({ x, z, face, kind, approach: approach || { x, z }, taken: false });
}

for (const l of LOUNGES) { seat(l.chair.x, l.chair.z, { x: 0, z: 0 }, 'lounge', l.approach); l.seat = seats[seats.length - 1]; }
for (const r of RESTS) { seat(r.x, r.z, polar(R_HALL + 20, r.a), r.kind, r.approach); r.seat = seats[seats.length - 1]; }
// 정원 벤치: 숲(바깥)을 바라봄
for (const b of GARDEN_BENCHES) { seat(b.x, b.z, polar(R_GARDEN, b.a), 'gbench', b.approach); b.seat = seats[seats.length - 1]; }

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
block(Q.prayer.x, Q.prayer.z, 1.5); // 기도하는 손이 선 작은 섬
{
  const dir = polar(1, BOAT.rot);
  for (const t of [-1.5, -0.75, 0, 0.75, 1.5]) block(BOAT.x + dir.x * t, BOAT.z + dir.z * t, 0.55); // 배는 피해 감
  for (const t of [-0.8, 0.8]) {
    const p = { x: BOAT.x + dir.x * t, z: BOAT.z + dir.z * t };
    const edge = { x: Q.witness.x + Math.cos(deg(-45)) * (WITNESS_POOL_R + 0.6), z: Q.witness.z + Math.sin(deg(-45)) * (WITNESS_POOL_R + 0.6) };
    seat(p.x, p.z, { x: p.x - dir.z, z: p.z + dir.x }, 'boat', edge);
  }
}
// 테마파크: 모닥불 둘레 통나무, 포도나무 그늘 벤치, 피크닉 탁자 의자
export const CAMP_FIRE = PARK.camp.at(0, -1.2);
for (const a of [-50, 0, 50]) {
  const ang = deg(a) + Math.atan2(-PARK.camp.n.z, -PARK.camp.n.x);
  const p = { x: CAMP_FIRE.x + Math.cos(ang) * 1.7, z: CAMP_FIRE.z + Math.sin(ang) * 1.7 };
  seat(p.x, p.z, CAMP_FIRE, 'log', { x: CAMP_FIRE.x + Math.cos(ang) * 2.4, z: CAMP_FIRE.z + Math.sin(ang) * 2.4 });
  seats[seats.length - 1].top = -0.5 + 0.34;
}
for (const u of [-1.2, 1.2]) {
  const p = PARK.vine.at(u, 0.9);
  seat(p.x, p.z, PARK.vine.at(u, -3), 'vine', PARK.vine.at(u, 0.2));
  seats[seats.length - 1].top = -0.5 + 0.49;
}
for (const u of [1.5, 3.4]) for (const sd of [-1, 1]) {
  const p = PARK.bbq.at(u, 1.2 + sd * 0.65);
  seat(p.x, p.z, PARK.bbq.at(u, 1.2), 'picnic', PARK.bbq.at(u, 1.2 + sd * 1.25));
  seats[seats.length - 1].top = -0.5 + 0.475;
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
  order: { ...polar(c(17.4), -56), r: 6 },
  pickup: polar(c(17.4), -40),
  boat: { x: Q.witness.x + 4.2, z: Q.witness.z - 4.2, r: 7 },
  read: { x: BIBLE.x - 3.3, z: BIBLE.z - 3.3, r: 6.5 },
  water: { r: 2.6 },
  tray: { ...polar(c(24.6), 105), r: 2.6 },
};

// 사람이 설 수 있는 곳인지
export const BODY = 0.35;
export function isFree(x, z, hop = 0) {
  const r = Math.hypot(x, z);
  if (r > R_GARDEN) {
    const bf = bridgeFree(x, z);
    if (bf === 0 || (bf < 0 && !onTrail(x, z))) return false;
  }
  if (r > R_HALL - 0.7 && r < R_HALL + 1.1) {
    // 유리벽은 입구로만 드나듦
    if (!(z > 0 && Math.abs(x) < 1.15)) return false;
  }
  // 장애물은 4m 칸으로 나눠 가까운 것만 검사 (넓은 정원에서도 빠르게)
  if (!buckets) buildBuckets();
  const list = buckets.get(bkey(Math.floor(x / BK), Math.floor(z / BK)));
  if (list) for (const o of list) {
    if (hop > o.h) continue; // 그 위로 뛰어 넘는 중
    if (Math.hypot(x - o.x, z - o.z) < o.r + BODY) return false;
  }
  return true;
}
// 이 자리에서 가장 가까운 나무 (매달리기·오르기)
export function nearTree(x, z, maxD = 1.5) {
  let best = null, bd = maxD;
  for (const t of TREES) {
    const d = Math.hypot(t.x - x, t.z - z);
    if (d < bd && Math.hypot(t.x, t.z) < R_GARDEN + 1) { bd = d; best = t; }
  }
  return best;
}
const BK = 4;
let buckets = null;
const bkey = (i, j) => i * 1000 + j;
function buildBuckets() {
  buckets = new Map();
  for (const o of obstacles) {
    const R = o.r + BODY;
    for (let i = Math.floor((o.x - R) / BK); i <= Math.floor((o.x + R) / BK); i++)
      for (let j = Math.floor((o.z - R) / BK); j <= Math.floor((o.z + R) / BK); j++) {
        const k = bkey(i, j);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(o);
      }
  }
}
