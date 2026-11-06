// 요한복음 마을 배치 (단위: 미터, 2026-11 0단계 기반)
// 초보자 마을과 같은 장면 안의 먼 자리(가운데 x = +2000m)에 둠. 카메라 먼 거리(520m) 밖이라 두 마을은 서로 보이지 않음
// 마을 좌표 u = 동(오른쪽), v = 남(아래쪽). 실제 지리를 줄여 옮김: 북 갈릴리 · 가운데 사마리아 · 남 유대 (기획서 2장)
// 이 파일은 그림 없이 땅 모양·막힘·길값만 (THREE 없음). 모형은 처음 들어갈 때 js/john/build.js가 지음
import { addRegion, seats } from '../layout.js';

export const JX = 2000, JZ = 0;           // 마을 가운데 (세계 좌표)
export const HALF_W = 150, HALF_D = 190;  // 동서 300m × 남북 380m
const EDGE_U = HALF_W - 6, EDGE_V = HALF_D - 6; // 걸어 다닐 수 있는 끝 (그 바깥은 언덕과 올리브 숲)
export const W = (u, v) => ({ x: JX + u, z: JZ + v }); // 마을 좌표 → 세계 좌표
export const L = (x, z) => ({ u: x - JX, v: z - JZ }); // 세계 좌표 → 마을 좌표

// ---------- 구역 12곳 (지금은 빈 자리: 이름 팻말과 둥근 돌 테두리만. 사건은 1차 MVP부터) ----------
// r: 빈 자리 반지름(이 안은 길처럼 걷기 쉬움)
const Z = (n, name, ch, u, v, r) => ({ n, name, ch, u, v, r, ...W(u, v) });
export const ZONES = {
  light: Z('Z1', '빛의 광장', '1:1-18', 85, 150, 14),
  jordan: Z('Z2', '요단 건너 베다니', '1:19-51', 134, 40, 11),
  cana: Z('Z3', '가나', '2:1-11 · 4:46-54', -95, -140, 13),
  galilee: Z('Z4', '디베랴 바다 · 가버나움', '6장 · 21장', 12, -118, 12),
  bethsaida: Z('Z5', '벳새다 들녘', '6:1-15', 92, -78, 15),
  sychar: Z('Z6', '수가 · 야곱의 우물', '4:1-42', -28, -38, 13),
  temple: Z('Z7', '성전 뜰', '2:13-22 · 7-10장', -62, 62, 15),
  bethesda: Z('Z8', '베데스다 못', '5:1-18', -14, 92, 10),
  siloam: Z('Z9', '실로암 못', '9장', -72, 138, 10),
  upper: Z('Z10', '윗동네 · 다락방', '3장 · 13-17장 · 20장', -112, 28, 12),
  passion: Z('Z11', '수난과 동산', '18-20장', -10, 170, 14),
  bethany: Z('Z12', '베다니', '11:1-12:11', 46, 76, 11),
};

// ---------- 물: 디베랴 바다(갈릴리 호수)와 요단강 ----------
export const LAKE = { u: 68, v: -150, ru: 52, rv: 30 }; // 타원
const inLake = (u, v, pad = 0) => ((u - LAKE.u) / (LAKE.ru + pad)) ** 2 + ((v - LAKE.v) / (LAKE.rv + pad)) ** 2 < 1;
// 요단강: 호수 남쪽 끝에서 마을 남쪽 끝까지 동쪽을 따라 흐름. 요단 건너 베다니(Z2) 앞에 얕은 여울(건너는 곳)
export const RIVER = [[98, -122], [108, -70], [112, -10], [114, 40], [117, 100], [121, 150], [123, 186]]; // 마을 남쪽 끝(사해 쪽)까지
export const RIVER_HALF = 3.2;
export const FORD = { v0: 33, v1: 47 }; // 여울: 이 사이는 물이 얕아 걸어서 건넘
function segD(u, v, a, b) {
  const du = b[0] - a[0], dv = b[1] - a[1], L2 = du * du + dv * dv;
  const k = Math.max(0, Math.min(1, ((u - a[0]) * du + (v - a[1]) * dv) / L2));
  return Math.hypot(u - a[0] - du * k, v - a[1] - dv * k);
}
const riverD = (u, v) => { let d = Infinity; for (let i = 1; i < RIVER.length; i++) d = Math.min(d, segD(u, v, RIVER[i - 1], RIVER[i])); return d; };

// ---------- 길 (흙길): 구역 사이를 잇는 길. 자동으로 걸을 때 이 길을 따라감 ----------
export const ROADS = [
  [[85, 150], [100, 100], [109, 60], [113, 40], [134, 40]],          // 빛의 광장 → 여울 → 요단 건너 베다니
  [[85, 150], [62, 112], [46, 76]],                                   // 빛의 광장 → 베다니
  [[46, 76], [12, 78], [-14, 92]],                                    // 베다니 → 베데스다 (양문 쪽)
  [[-14, 92], [-40, 72], [-62, 62]],                                  // 베데스다 → 성전 뜰
  [[-62, 62], [-90, 44], [-112, 28]],                                 // 성전 뜰 → 윗동네
  [[-62, 62], [-70, 100], [-72, 138]],                                // 성전 뜰 → 실로암
  [[-72, 138], [-44, 160], [-10, 170]],                               // 실로암 → 수난과 동산
  [[-10, 170], [40, 172], [85, 150]],                                 // 수난과 동산 → 빛의 광장
  [[-62, 62], [-55, 20], [-28, -38]],                                 // 성전 뜰 → 북쪽 길 → 수가 (사마리아로 통행, 요 4:4)
  [[-28, -38], [-60, -90], [-95, -140]],                              // 수가 → 가나
  [[-95, -140], [-40, -125], [12, -118]],                             // 가나 → 가버나움 (호숫가)
  [[-28, -38], [-6, -80], [12, -118]],                                // 수가 → 가버나움
  [[12, -118], [55, -108], [92, -78]],                                // 가버나움 → 벳새다 들녘 (호숫가 길)
  [[92, -78], [102, -30], [108, 20], [109, 60]],                      // 벳새다 → 요단 서쪽 강둑 → 여울 길
];
const ROAD_HALF = 1.6;
const roadD = (u, v) => {
  let d = Infinity;
  for (const r of ROADS) for (let i = 1; i < r.length; i++) d = Math.min(d, segD(u, v, r[i - 1], r[i]));
  return d;
};

// ---------- 땅 높낮이 ----------
// 완만하게만 (걷다가 턱에 걸리지 않게): 벳새다 언덕, 그리심 산 그림자, 예루살렘은 살짝 높은 언덕, 감람산
const HILLS = [
  { u: 104, v: -70, h: 3.2, s: 20 },   // 벳새다 들녘 언덕 (요 6:3 산에 오르사, 6:10 잔디가 많은지라)
  { u: -66, v: -58, h: 7.5, s: 17 },   // 그리심 산 (요 4:20 이 산에서)
  { u: -60, v: 85, h: 1.6, s: 55 },    // 예루살렘 언덕
  { u: 18, v: 128, h: 3.4, s: 16 },    // 감람산 (기드론 건너)
  { u: -140, v: -175, h: 6, s: 26 },   // 바깥 언덕들 (끝자락)
  { u: 150, v: -10, h: 5, s: 30 },
  { u: -150, v: 120, h: 6, s: 28 },
];
export function groundH(u, v) {
  let h = 0;
  for (const k of HILLS) { const d2 = (u - k.u) ** 2 + (v - k.v) ** 2; h += k.h * Math.exp(-d2 / (2 * k.s * k.s)); }
  // 호수와 강은 움푹
  const lk = ((u - LAKE.u) / LAKE.ru) ** 2 + ((v - LAKE.v) / LAKE.rv) ** 2;
  if (lk < 1.6) h -= 1.4 * Math.max(0, 1 - Math.max(0, lk - 0.75) / 0.85);
  const rd = riverD(u, v);
  if (rd < RIVER_HALF + 3) h -= (v > FORD.v0 && v < FORD.v1 ? 0.35 : 0.9) * (1 - Math.max(0, rd - RIVER_HALF) / 3);
  // 빛의 광장은 평평하게
  const pl = Math.hypot(u - ZONES.light.u, v - ZONES.light.v);
  if (pl < 22) { const k = Math.min(1, Math.max(0, (pl - 15) / 7)); h = h * k; }
  return h;
}
export const WATER_Y = -0.42; // 호수·강물 높이
export const PLAZA = { ...ZONES.light, R: 14, y: 0.12 }; // 빛의 광장 돌바닥 (반지름 14m, 살짝 높음)

// ---------- 빛의 광장 (Z1): 가운데 빛, 둘레에 빈 등잔 일곱과 벤치, 돌아가는 수레 ----------
const PU = PLAZA.u, PV = PLAZA.v;
const pAt = (r, deg) => ({ u: PU + r * Math.cos((deg * Math.PI) / 180), v: PV + r * Math.sin((deg * Math.PI) / 180) });
export const PLAZA_LIGHT = { ...W(PU, PV), r: 1.3 };
// 등잔 일곱 ("나는…" 등불을 켤 자리, 1차부터 켜짐). 북쪽부터 시계 방향, 남쪽(수레 쪽)은 비워 둠
export const LAMPS = [-90, -45, 0, 45, 135, 180, 225].map((a, i) => ({ i, a, ...W(pAt(8.5, a).u, pAt(8.5, a).v) }));
export const BENCHES = LAMPS.map((l) => {
  const b = pAt(10.8, l.a + 14), ap = pAt(9.8, l.a + 14);
  return { a: l.a + 14, ...W(b.u, b.v), approach: W(ap.u, ap.v) };
});
// 돌아가는 수레: 광장 남쪽 끝. 도착 자리는 수레 앞 (가운데 빛을 바라봄)
export const CART = (() => {
  const c = W(PU - 1.5, PV + 18), stand = W(PU - 1.2, PV + 15.4), arrive = W(PU + 1.5, PV + 11.5);
  return { ...c, rot: 0, stand, arrive, look: W(PU, PV) }; // 끌채는 동쪽으로 (도착해 광장을 볼 때 화면을 가리지 않게)
})();
// 구역 팻말 (빈 자리마다 하나)
export const SIGNPOSTS = Object.entries(ZONES).map(([id, z]) => {
  const p = id === 'light' ? W(PU + 4.5, PV + 15.5) : W(z.u - z.r * 0.55, z.v - z.r * 0.55);
  return { id, name: z.name, ch: z.ch, n: z.n, ...p };
});

// ---------- 나무: 올리브·무화과·종려 (씨앗 고정, 길·구역·물에서 떨어진 곳) ----------
export const TREES = [];
{
  let s = 20261106;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 2600 && TREES.length < 260; k++) {
    const u = (rnd() * 2 - 1) * (EDGE_U + 4), v = (rnd() * 2 - 1) * (EDGE_V + 4);
    if (roadD(u, v) < 5 || inLake(u, v, 6) || riverD(u, v) < RIVER_HALF + 3) continue;
    if (Object.values(ZONES).some((z) => Math.hypot(u - z.u, v - z.v) < z.r + 6)) continue;
    if (TREES.some((t) => Math.hypot(t.u - u, t.v - v) < 7)) continue;
    const edge = Math.abs(u) > EDGE_U - 18 || Math.abs(v) > EDGE_V - 18;
    if (!edge && rnd() < 0.55) continue; // 가운데는 드문드문, 끝자락은 빽빽
    const kind = rnd() < 0.7 ? 'olive' : rnd() < 0.6 ? 'fig' : 'palm';
    TREES.push({ u, v, ...W(u, v), kind, h: kind === 'palm' ? 6 + rnd() * 2 : 3.2 + rnd() * 1.6, rot: rnd() * Math.PI * 2 });
  }
}

// ---------- 막힘 (원) ----------
const obstacles = [];
const block = (p, r, h = Infinity) => obstacles.push({ x: p.x, z: p.z, r, h });
block(PLAZA_LIGHT, PLAZA_LIGHT.r);
for (const l of LAMPS) block(l, 0.35, 1.1);
block(CART, 1.25, 1.3);
for (const sp of SIGNPOSTS) block(sp, 0.25);
for (const t of TREES) block(t, t.kind === 'palm' ? 0.35 : 0.5);
const BK = 4, buckets = new Map();
const bkey = (i, j) => i * 4096 + j;
for (const o of obstacles) {
  const R = o.r + 0.35;
  for (let i = Math.floor((o.x - R) / BK); i <= Math.floor((o.x + R) / BK); i++)
    for (let j = Math.floor((o.z - R) / BK); j <= Math.floor((o.z + R) / BK); j++) {
      const k = bkey(i, j);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(o);
    }
}

// ---------- 앉을 자리 (벤치) — 카페와 같은 seats 목록에 더함 (앉기·눕기 단추가 그대로 씀) ----------
for (const b of BENCHES) {
  seats.push({ x: b.x, z: b.z, face: Math.atan2(PLAZA_LIGHT.x - b.x, PLAZA_LIGHT.z - b.z), kind: 'gbench', approach: b.approach, taken: false, region: 'john' });
  b.seat = seats[seats.length - 1];
}

// ---------- 바닥·막힘·길값 (layout.js가 이 상자 안이면 이 함수로 넘김) ----------
const BODY = 0.35;
function floorY(x, z) {
  const u = x - JX, v = z - JZ;
  if (Math.hypot(u - PU, v - PV) < PLAZA.R) return PLAZA.y;
  return groundH(u, v);
}
function isFree(x, z, hop = 0) {
  const u = x - JX, v = z - JZ;
  if (Math.abs(u) > EDGE_U || Math.abs(v) > EDGE_V) return false; // 마을 끝 (언덕과 숲)
  if (inLake(u, v)) return false; // 호수 (배 타기는 2차부터)
  if (riverD(u, v) < RIVER_HALF && !(v > FORD.v0 && v < FORD.v1)) return false; // 강 (여울로만 건넘)
  const list = buckets.get(bkey(Math.floor(x / BK), Math.floor(z / BK)));
  if (list) for (const o of list) {
    if (hop > o.h) continue;
    if (Math.hypot(x - o.x, z - o.z) < o.r + BODY) return false;
  }
  return true;
}
// 길값: 길·광장·구역 빈 자리 1, 그 밖 풀밭은 비쌈 (자동으로 걸을 때 길을 따라가게)
// 길까지 거리는 1m 칸에 한 번만 재 둠 (길찾기 격자를 처음 만들 때)
let roadMask = null;
const MW = HALF_W * 2 + 1, MD = HALF_D * 2 + 1;
function buildMask() {
  roadMask = new Uint8Array(MW * MD);
  for (const r of ROADS) for (let i = 1; i < r.length; i++) {
    const a = r[i - 1], b = r[i];
    const u0 = Math.floor(Math.min(a[0], b[0]) - ROAD_HALF - 1), u1 = Math.ceil(Math.max(a[0], b[0]) + ROAD_HALF + 1);
    const v0 = Math.floor(Math.min(a[1], b[1]) - ROAD_HALF - 1), v1 = Math.ceil(Math.max(a[1], b[1]) + ROAD_HALF + 1);
    for (let v = v0; v <= v1; v++) for (let u = u0; u <= u1; u++) {
      if (Math.abs(u) > HALF_W || Math.abs(v) > HALF_D) continue;
      if (segD(u, v, a, b) < ROAD_HALF + 0.5) roadMask[(v + HALF_D) * MW + (u + HALF_W)] = 1;
    }
  }
}
export const GRASS_COST = 3;
export function onRoad(u, v) {
  if (!roadMask) buildMask();
  const i = Math.round(u) + HALF_W, j = Math.round(v) + HALF_D;
  return i >= 0 && j >= 0 && i < MW && j < MD && roadMask[j * MW + i] === 1;
}
function pathCost(x, z) {
  const u = x - JX, v = z - JZ;
  if (onRoad(u, v) || Math.hypot(u - PU, v - PV) < PLAZA.R + 1) return 1;
  for (const k in ZONES) { const zn = ZONES[k]; if (Math.hypot(u - zn.u, v - zn.v) < zn.r) return 1; }
  return GRASS_COST;
}

// 지역 등록: 상자는 마을 끝보다 조금 넓게 (모형의 바깥 언덕까지)
export const REGION = addRegion({
  id: 'john', name: '요한복음 마을',
  x0: JX - HALF_W - 30, x1: JX + HALF_W + 30, z0: JZ - HALF_D - 30, z1: JZ + HALF_D + 30,
  // 길찾기 격자 (nav.js가 처음 들어갈 때 만듦): 걸을 수 있는 끝까지만, 0.5m 칸
  nav: { x0: JX - EDGE_U - 1, x1: JX + EDGE_U + 1, z0: JZ - EDGE_V - 1, z1: JZ + EDGE_V + 1, cell: 0.5 },
  floorY, isFree, pathCost,
  arrive: CART.arrive, look: CART.look,
  // 하늘과 안개: 마른 들판의 따뜻한 빛 (초보자 마을보다 조금 노르스름)
  env: { sky: 0xe7e2cf, fog: [55, 210], hemiSky: 0xfff6e6, hemiGround: 0xd8c8a4 },
});
