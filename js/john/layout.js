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
// "나는…" 등불 일곱의 자리 (LAMPS 차례대로): 떡(6:35)·빛(8:12)·문(10:7)·목자(10:11)·부활(11:25)·길(14:6)·포도나무(15:5)
export const LAMP_IDS = ['bread', 'light', 'door', 'shepherd', 'life', 'way', 'vine'];
// 사건의 그 자리 단추 이름 (region.js가 main.js ACTIONS에 미리 등록하고, 엔진이 생기면 넘김. 아이콘은 js/icons.js)
export const JN_ACTS = ['jn_lamp', 'jn_water', 'jn_draw', 'jn_give', 'jn_look', 'jn_wash', 'jn_put', 'jn_boat', 'jn_row', 'jn_call'];
// 구역 팻말 (빈 자리마다 하나)
export const SIGNPOSTS = Object.entries(ZONES).map(([id, z]) => {
  const p = id === 'light' ? W(PU + 4.5, PV + 15.5) : W(z.u - z.r * 0.55, z.v - z.r * 0.55);
  return { id, name: z.name, ch: z.ch, n: z.n, ...p };
});

// ---------- 1차 MVP 사건 자리 (2026-11): 와 보라(Z1→Z2) · 가나(Z3) · 니고데모의 밤(Z10) · 성전 문(Z7)과 실로암(Z9) ----------
// 1세기 돌집은 상자 도형. 이름 붙은 자리(SP)는 사건 진행(js/john/engine.js)과 모형(js/john/build.js)이 같이 씀
const S = (u, v) => ({ u, v, ...W(u, v) });
const rect = (u0, u1, v0, v1, h = 0) => ({ u0, u1, v0, v1, h, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, w: u1 - u0, d: v1 - v0 });
const inRect = (r, u, v, pad = 0) => u > r.u0 - pad && u < r.u1 + pad && v > r.v0 - pad && v < r.v1 + pad;

// Z2 요단 건너 베다니: 세례 요한의 물가, 작은 집과 문 앞 의자, 무화과나무
export const HOUSE2 = rect(136.3, 140.7, 48.2, 51.8, 2.5);
// Z3 가나: 잔치 집 마당(낮은 담), 집, 돌항아리 여섯, 긴 식탁, 우물
export const YARD3 = rect(-104, -86, -146, -132, 1.05);
export const YARD3_GAPS = { east: [-139, -134], south: [-93, -87] }; // 길이 지나는 담의 틈
export const HOUSE3 = rect(-103.5, -96.5, -145.5, -141.5, 3.2);
export const JARS = Array.from({ length: 6 }, (_, k) => S(-103 + k * 1.25, -140.6));
export const TABLE3 = rect(-98.5, -92.5, -136.35, -135.25, 0.78);
// Z10 윗동네: 니고데모 집 (평평한 지붕에 올라가는 바깥 계단, 지붕 위 등잔·빨랫줄)
export const HOUSE10 = rect(-117, -110, 20, 26, 2.8);
export const ROOF_Y = groundH(HOUSE10.cu, HOUSE10.cv) + HOUSE10.h;
export const STAIR10 = { u0: -110, u1: -108, vTop: 22.5, vBot: 28.5 }; // 남쪽(땅)에서 북쪽(지붕 높이 층계참)으로 오름
export const LINE10 = [S(-115.6, 20.7), S(-115.6, 25.3)]; // 빨랫줄 기둥 둘 (천은 가운데)
// Z7 성전 뜰 남쪽 문 (실로암 쪽 길이 지나감)
const C7 = ZONES.temple, GD = { u: -0.2061, v: 0.9785 }, GP = { u: 0.9785, v: 0.2061 };
const gAt = (a, b) => S(C7.u + GD.u * 9 + GP.u * a + GD.u * b, C7.v + GD.v * 9 + GP.v * a + GD.v * b); // a: 문 옆으로, b: 문 바깥쪽으로
export const GATE7 = { c: gAt(0, 0), rot: Math.atan2(GP.u, GP.v), d: GD, p: GP, at: gAt };
// Z9 실로암 못: 돌로 쌓은 못. 북쪽 바깥 계단 셋으로 올라 둘레 단에 서고, 안쪽 한 칸 내려가 물에 손이 닿음
export const POOL9 = { out: rect(-75, -65, 131.6, 141.5), steps: rect(-75, -65, 129, 131.6), inner: rect(-73, -67, 133.4, 134.6), water: rect(-73, -67, 134.6, 140), base: groundH(-70, 135) };
POOL9.top = POOL9.base + 0.9; POOL9.innerY = POOL9.base + 0.6; POOL9.waterY = POOL9.base + 0.38;

export const SP = {
  // Z1 빛의 광장
  john: S(PU + 3.5, PV + 6),           // 사도 요한 (마을 안내자)
  lampAt: S(69.5, 124.3),              // 등불을 받는 자리 (광장 북서쪽 길 끝)
  // Z2
  baptist: S(120.5, 44.5), bapStand: S(122.6, 40.4), warm: S(118.8, 35.6),
  andrew: S(124.6, 45.6), andrewPath: [S(127.5, 47.5), S(131.6, 49.2), S(133.6, 51.9)],
  bench2: S(135.1, 50.0), fig: S(139.6, 31.4), nathan: S(138.3, 33.1), med2: S(124.2, 47.6),
  // Z3
  servant: S(-100.2, -139.6), master: S(-91.5, -135.8), well: S(-89.6, -136.8),
  guests: [S(-97.2, -137.0), S(-94.4, -137.0)], feast: [S(-97.4, -134.6), S(-95.5, -134.6), S(-93.6, -134.6)],
  // Z10
  nico: S(-106.8, 29.6), nicoRoof: S(-111.6, 25.0), seat10: S(-113.2, 22.8), lamp10: S(-112.4, 23.9),
  wind: [S(-116.4, 20.9), S(-116.4, 25.1), S(-111.8, 20.95)], lie10: S(-114.0, 24.9),
  gazeAt: S(-113.6, 20.9), pole: S(-113.6, -8), walkers: [S(-121, 30.6), S(-104, 30.6)],
  // Z7 · Z9
  blindSeat: gAt(3.4, 1.3), blindMan: gAt(-3.4, 1.4), pharisee: [S(C7.u + 0.5, C7.v - 1.5), S(C7.u + 2.4, C7.v - 0.4)], outside: gAt(0.6, 14),
  wash: S(-70, 134.1), med9: S(-72.8, 130.9),
};

// ---------- 2차 가 사건 자리 (2026-11): 수가 우물(Z6) · 가나 길목과 가버나움(Z4: 회당·신하의 집·물가) · 벳새다 들녘(Z5) · 호수 배 길 ----------
// Z6 수가: 야곱의 우물, 동네 집 둘(문은 동쪽), 희어진 밭(요 4:35, 걸어 들어갈 수 있음), 우물가 그늘 의자
export const WELL6 = S(-26, -36);
export const HOUSES6 = [rect(-50, -44, -40, -35, 2.6), rect(-48, -42, -29, -24, 2.6)];
export const FIELD6 = rect(-13, -1, -50, -38);
// Z4 가버나움: 회당(지붕 없는 돌담, 남쪽 문, 안쪽 동·서 벽에 돌 의자 — 1세기 회당처럼), 왕의 신하의 집(문은 북쪽 길 쪽)
export const SYN4 = rect(-8, 2, -138, -129, 2.6);
export const SYN4_DOOR = [-4.2, -1.8]; // 남쪽 담의 문 (u 사이)
export const HOUSE4 = rect(21, 27, -107, -102, 2.8);
// 호수 배 길 (요 6:16-21): 벳새다 북쪽 물가에서 바다를 건너 가버나움 물가로. mid까지는 노를 젓고, 그 뒤는 빛을 맞아들이면 곧 닿음
export const BOAT = {
  dockE: S(82, -118.6), dockW: S(23, -131.5),
  route: [S(82.5, -124.5), S(70, -140), S(52, -152), S(36, -146), S(27.5, -136.5)], mid: 0.48,
};
export const LAKE_AT = { ...W(LAKE.u, LAKE.v), r: LAKE.ru }; // 밤바다 하늘을 바꿀 자리 (호수 가운데)
// Z5 벳새다 들녘: 무리를 앉힐 잔디 세 곳 (요 6:10 그 곳에 잔디가 많은지라), 언덕 위 따뜻한 빛 (6:3 산에 오르사)
export const GROUPS5 = [S(97, -85), S(101, -81), S(96.8, -72.4)];
Object.assign(SP, {
  // Z6
  well6: WELL6, dockE: BOAT.dockE, dockW: BOAT.dockW, med4: S(19.6, -127.6),
  woman: S(-29.2, -34.2), warm6: S(-24.2, -37.8), jar6: S(-27.4, -37.6), seat6: S(-31.5, -40.5), shade6: S(-33.8, -42.6),
  vil: [S(-42.6, -37.5), S(-40.6, -26.5), S(-37, -47.5)], come6: [S(-22.4, -33.6), S(-21.4, -36.4), S(-22.8, -39.8)],
  fieldLook: S(-15.2, -44), field: S(-7, -44),
  // Z3 → Z4 왕의 신하
  official: S(-80.5, -135.2), warm3: S(-78.4, -131.8),
  servants: [S(24, -110), S(25.4, -110.6)], servPath: [S(24, -110.5), S(12, -118), S(-26, -123.2)],
  house4: S(24, -108.4), son: S(25.6, -108.8), seat4: S(19.6, -104.5),
  // Z4 회당
  synDoor: S(-3, -127.2), warm4: S(-3, -136), peterSyn: S(-0.6, -134.4), synW: S(-7, -133.4), synE: S(1, -133.4),
  synIn: [S(-5.6, -134.8), S(-4.2, -132.6), S(-1.6, -133.2), S(-6.2, -131.6), S(-0.4, -131.6)], synOut: [S(-3, -129.2), S(-3, -124.6), S(3.5, -121.2)],
  // 물가 (밤바다)
  peterShore: S(84.8, -117.4), boatW: S(27.5, -136.5),
  // Z5
  philip: S(88.4, -82.4), andrew5: S(86.6, -80.6), boy: S(95.2, -76.4), warm5: S(101.6, -72.8), med5: S(101.8, -66.8),
});
// 이 둘레에는 나무를 두지 않음 (모형과 겹치지 않게)
const CLEAR = [[ZONES.cana, 16], [ZONES.upper, 15], [ZONES.siloam, 13], [GATE7.c, 10], [SP.pole, 3], [ZONES.jordan, 14],
  [ZONES.sychar, 26], [FIELD6, 0], [ZONES.galilee, 16], [S(SYN4.cu, SYN4.cv), 11], [S(HOUSE4.cu, HOUSE4.cv), 8], [SP.warm3, 6], [BOAT.dockE, 7], [BOAT.dockW, 7], [ZONES.bethsaida, 20], [SP.servPath[1], 6]];

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

for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i]; if (CLEAR.some(([c, r]) => (c.u0 != null ? inRect(c, t.u, t.v, 3) : Math.hypot(t.u - c.u, t.v - c.v) < r))) TREES.splice(i, 1); }

// ---------- 막힘 (원) ----------
const obstacles = [];
const block = (p, r, h = Infinity) => obstacles.push({ x: p.x, z: p.z, r, h });
block(PLAZA_LIGHT, PLAZA_LIGHT.r);
for (const l of LAMPS) block(l, 0.35, 1.1);
block(CART, 1.25, 1.3);
for (const sp of SIGNPOSTS) block(sp, 0.25);
for (const t of TREES) block(t, t.kind === 'palm' ? 0.35 : 0.5);
// 사건 자리의 물건 (원으로 막음)
block(SP.fig, 0.5); for (const j of JARS) block(j, 0.42, 1.0); block(SP.well, 0.85, 0.9);
block(GATE7.at(2.3, 0), 0.5); block(GATE7.at(-2.3, 0), 0.5);
for (const s of [-1, 1]) for (let a = 2.9; a <= 8.01; a += 0.5) block(GATE7.at(s * a, 0), 0.32);
block(SP.pole, 0.25); block(SP.lamp10, 0.18, 1.2); for (const p of LINE10) block(p, 0.12);
block(WELL6, 0.85, 0.9); block(SP.shade6, 0.4);
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
// 사건 자리의 앉을 곳: Z2 집 앞 의자, Z3 잔치 식탁, Z10 지붕 등잔 곁, Z9 못 계단
const seat = (p, face, kind, ap) => { seats.push({ x: p.x, z: p.z, face, kind, approach: ap, taken: false, region: 'john' }); return seats[seats.length - 1]; };
export const SEATS_J = {
  bench2: seat(SP.bench2, -Math.PI / 2, 'gbench', W(SP.bench2.u - 0.9, SP.bench2.v)),
  feast: SP.feast.map((p) => seat(p, Math.PI, 'gbench', W(p.u, p.v + 0.75))),
  seat10: seat(SP.seat10, Math.PI / 2, 'floor', W(SP.seat10.u - 0.7, SP.seat10.v)),
  med9: seat(SP.med9, 0, 'floor', W(SP.med9.u, SP.med9.v - 0.6)),
  // 2차 가: 우물가 그늘 의자, 신하의 집 곁 의자, 회당 안 돌 의자 둘
  seat6: seat(SP.seat6, Math.atan2(WELL6.x - SP.seat6.x, WELL6.z - SP.seat6.z), 'gbench', W(SP.seat6.u + 0.6, SP.seat6.v + 0.5)),
  seat4: seat(SP.seat4, Math.PI / 2, 'gbench', W(SP.seat4.u + 0.8, SP.seat4.v)),
  synW: seat(SP.synW, Math.PI / 2, 'gbench', W(SP.synW.u + 0.8, SP.synW.v)),
  synE: seat(SP.synE, -Math.PI / 2, 'gbench', W(SP.synE.u - 0.8, SP.synE.v)),
};

// ---------- 바닥·막힘·길값 (layout.js가 이 상자 안이면 이 함수로 넘김) ----------
const BODY = 0.35;
// 지붕·계단·못 둘레 단의 높이 (없으면 null → 땅 높이)
function structY(u, v) {
  if (inRect(HOUSE10, u, v)) return ROOF_Y;
  const st = STAIR10;
  if (u >= st.u0 && u <= st.u1 && v >= HOUSE10.v0 && v <= st.vBot) {
    if (v <= st.vTop) return ROOF_Y;
    const k = (st.vBot - v) / (st.vBot - st.vTop);
    return groundH(u, v) * (1 - k) + ROOF_Y * k;
  }
  const P = POOL9;
  if (inRect(P.steps, u, v)) return P.base + 0.3 * Math.min(3, 1 + Math.floor((v - P.steps.v0) / 0.867));
  if (inRect(P.inner, u, v)) return P.innerY;
  if (inRect(P.out, u, v)) return P.top;
  return null;
}
// 선(벽)에서 몸 반지름 안이면 막힘
const W2 = BODY + 0.12;
const wallU = (u, v, u0, v0, v1) => Math.abs(u - u0) < W2 && v > v0 - W2 && v < v1 + W2; // 남북으로 놓인 벽 (u = u0)
const wallV = (u, v, v0, u0, u1) => Math.abs(v - v0) < W2 && u > u0 - W2 && u < u1 + W2; // 동서로 놓인 벽 (v = v0)
function blockedRect(u, v) {
  // Z2 작은 집, Z3 잔치 집·식탁, 못물
  if (inRect(HOUSE2, u, v, BODY)) return true;
  if (inRect(HOUSE3, u, v, BODY)) return true;
  if (inRect(TABLE3, u, v, BODY * 0.8)) return true;
  if (inRect(POOL9.water, u, v, 0.05)) return true;
  // Z3 마당 담 (길이 지나는 동쪽·남쪽에 틈)
  const Y = YARD3, gE = YARD3_GAPS.east, gS = YARD3_GAPS.south;
  if (wallU(u, v, Y.u0, Y.v0, Y.v1) || wallV(u, v, Y.v0, Y.u0, Y.u1)) return true;
  if (wallU(u, v, Y.u1, Y.v0, gE[0]) || wallU(u, v, Y.u1, gE[1], Y.v1)) return true;
  if (wallV(u, v, Y.v1, Y.u0, gS[0]) || wallV(u, v, Y.v1, gS[1], Y.u1)) return true;
  // Z10 니고데모 집: 지붕 둘레 낮은 담 (동쪽 계단 층계참 쪽만 열림), 계단 난간
  const H = HOUSE10, st = STAIR10;
  if (wallU(u, v, H.u0, H.v0, H.v1) || wallV(u, v, H.v1, H.u0, H.u1) || wallV(u, v, H.v0, H.u0, st.u1)) return true;
  if (wallU(u, v, H.u1, st.vTop, H.v1)) return true;               // 동쪽 담 (층계참 옆은 틈)
  if (wallU(u, v, st.u1, H.v0, st.vBot - 1)) return true;           // 계단 바깥 난간
  if (wallU(u, v, st.u0, H.v1, st.vBot - 0.6)) return true;         // 집 남쪽에서 계단 옆으로 떨어지지 않게
  // Z9 실로암: 둘레 단의 동·서·남쪽 끝 (북쪽 계단으로만 오르내림)
  const P = POOL9.out;
  if (wallU(u, v, P.u0, P.v0 - 2.4, P.v1) || wallU(u, v, P.u1, P.v0 - 2.4, P.v1) || wallV(u, v, P.v1, P.u0, P.u1)) return true;
  // 2차 가: 수가 동네 집, 신하의 집, 가버나움 회당 담 (남쪽 문만 열림)
  if (HOUSES6.some((h) => inRect(h, u, v, BODY)) || inRect(HOUSE4, u, v, BODY)) return true;
  const Sy = SYN4, sd = SYN4_DOOR;
  if (wallU(u, v, Sy.u0, Sy.v0, Sy.v1) || wallU(u, v, Sy.u1, Sy.v0, Sy.v1) || wallV(u, v, Sy.v0, Sy.u0, Sy.u1)) return true;
  if (wallV(u, v, Sy.v1, Sy.u0, sd[0]) || wallV(u, v, Sy.v1, sd[1], Sy.u1)) return true;
  return false;
}
function floorY(x, z) {
  const u = x - JX, v = z - JZ;
  if (Math.hypot(u - PU, v - PV) < PLAZA.R) return PLAZA.y;
  const sy = structY(u, v);
  return sy == null ? groundH(u, v) : sy;
}
function isFree(x, z, hop = 0) {
  const u = x - JX, v = z - JZ;
  if (Math.abs(u) > EDGE_U || Math.abs(v) > EDGE_V) return false; // 마을 끝 (언덕과 숲)
  if (inLake(u, v)) return false; // 호수 (배 타기는 2차부터)
  if (blockedRect(u, v)) return false; // 집·담·식탁·못 둘레
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
