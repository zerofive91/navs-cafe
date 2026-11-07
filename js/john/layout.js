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
  { u: 8, v: 179.4, h: 1.0, s: 2.6 },   // 골고다 작은 언덕 (3차, 요 19:17)
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
export const JN_ACTS = ['jn_lamp', 'jn_water', 'jn_draw', 'jn_give', 'jn_look', 'jn_wash', 'jn_put', 'jn_boat', 'jn_row', 'jn_call',
  'jn_clear', 'jn_lift', 'jn_push', 'jn_untie', 'jn_pour', 'jn_plant', // 2차 나: 장사판 치우기 · 자리 들기 · 돌 옮기기 · 베 풀기 · 향유 붓기 · 밀 심기
  'jn_towel', 'jn_feet', 'jn_sheathe', 'jn_spice', 'jn_net', 'jn_pull', 'jn_feed', // 3차: 수건과 대야 · 발 씻기기 · 검 꽂기 · 향품 놓기 · 그물 던지기 · 그물 끌어 올리기 · 어린 양 먹이기
  'jn_oil', 'jn_dry', 'jn_pick', // 증인의 작은 부탁 (js/john/errands.js): 기름 붓기 · 그물 널기 · 줍기
  'jn_board', // 소식판 보기 (오늘의 마을, js/village/daily.js)
  'jn_sweep', 'jn_kindle']; // 부탁 둘째 묶음: 쓸기 · 등잔 켜기
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
// 소식판 (오늘의 마을, 채우기 E3): 빛의 광장 사도 요한 곁. 앞면이 가운데 빛을 봄. r: 이 안에서 소식판 단추가 뜸
export const BOARD = (() => { const p = S(PU + 5.4, PV + 3.2); return { ...p, face: Math.atan2(PLAZA_LIGHT.x - p.x, PLAZA_LIGHT.z - p.z), r: 2.9 }; })();

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
// ---------- 2차 나 사건 자리 (2026-11): 성전 뜰(Z7: 성소·장사판·솔로몬 행각·양 우리) · 베데스다 못(Z8) · 베다니(Z12: 마르다와 마리아의 집·잔치 마당·나사로의 무덤) ----------
// 성전 뜰은 길 넷이 가운데서 갈라짐 (북쪽 수가 길, 서북 윗동네 길, 남쪽 실로암 길, 동쪽 베데스다 길). 모형은 길 사이 빈 쪽에만 둠
// Z7: 뜰 북쪽의 성소(들어가지 않는 큰 돌집), 북서쪽 장사판 넷(요 2:14), 동쪽 솔로몬 행각(10:23, 기둥 두 줄), 동쪽 길 너머 양 우리(10:1, 남쪽 문)
export const HOLY7 = rect(-76, -64, 36, 46, 6.5);
export const STALLS7 = [S(-69.5, 51.5), S(-66.5, 49), S(-63.8, 51.2), S(-67, 54.5)]; // 비둘기장 · 돈 바꾸는 상 둘 · 소와 양 (요 2:14)
export const STALL_KIND = ['dove', 'money', 'money', 'ox'];
export const PORTICO7 = { us: [-50.5, -48], vs: [50, 53, 56, 59, 62], h: 3.4 };
export const FOLD7 = rect(-34, -26, 60, 66, 1.1);
export const FOLD7_DOOR = [-31, -29]; // 남쪽 담의 문 (양의 문, 10:7)
// Z8 베데스다: 길 꼭짓점 남쪽의 못 둘(가운데 둑), 둘레 네 줄과 둑 위 한 줄 = 행각 다섯 (5:2)
export const POOL8 = { rim: rect(-20.3, -7.7, 97.2, 105.8), water: rect(-19.5, -8.5, 98, 105), mid: 101.5, base: groundH(-14, 101.5) };
POOL8.cols = (() => {
  const L = [], u0 = -22.3, u1 = -5.7, v0 = 95.2, v1 = 107.8;
  for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / 6) { L.push(S(u, v0)); L.push(S(u, v1)); }
  for (let v = v0 + 2.52; v < v1 - 0.1; v += 2.52) { L.push(S(u0, v)); L.push(S(u1, v)); }
  return L;
})();
POOL8.midCols = [-17.2, -14, -10.8].map((u) => S(u, POOL8.mid)); // 두 못 사이 둑 위 (걸어 들어가지 않음)
// Z12 베다니: 집(문은 남쪽 마당 쪽), 마당 잔치 식탁과 차양, 집 서쪽 벽 의자, 동쪽 작은 밭(12:24), 서북쪽 굴 무덤과 돌 (11:38)
export const HOUSE12 = rect(40, 47, 61.5, 67.5, 2.8);
export const TABLE12 = rect(40.5, 46.5, 70, 71, 0.78);
export const PLOT12 = rect(49, 53, 62.5, 66.5);
export const TOMB12 = { rock: S(27.6, 61.2), r: 3.4, mouth: S(30.6, 62.4), stone: S(31.4, 63.2), rolled: S(31.6, 59.9) };
Object.assign(SP, {
  // Z7 성전 뜰: 아버지 집 (2장)
  disciple7: S(-71.8, 50.2), prayAt7: S(-66.8, 51.6), portico7: S(-49.25, 57.5), warm7: S(-51.8, 60.2),
  // 생수와 세상의 빛 (7-8장): 행각 곁 물동이와 빛, 뜰 가운데 세워진 여인, 내가 설 자리, 무리가 나가는 길
  woman8: S(-55, 55), lightAt7: S(-57.7, 56.7), warmL: S(-52.3, 53.4), jar7: S(-52.8, 51.6),
  accOut: [S(-44, 69.5), S(-58.6, 40), S(-47, 46.5), S(-60, 41.5), S(-43, 71)],
  // 선한 목자 (10장): 양 우리 남쪽 문 앞, 우리 안 깔개, 세 곳에서 부르는 소리 (첫째·둘째 차례는 문 앞 길가, 셋째는 문과 양쪽 담 너머)
  shepherd: S(-26.6, 68.8), foldFront: S(-30, 69.8), foldSeat: S(-30, 62.6), foldDoor: S(-30, 66.6),
  voiceA: [S(-36.2, 71), S(-30, 72.6), S(-23.8, 71)], voiceC: [S(-35.5, 61.4), S(-30, 67.9), S(-24.5, 61.4)],
  // Z8 베데스다 (5장): 동쪽 행각 돗자리, 행각에 누운 병자들, 성전에서 못 쪽으로 오는 무리의 길
  sick: S(-3.9, 100.4), mat8: S(-6.8, 101.5), water8: S(-14, 101.5),
  pts: [S(-6.8, 98.1), S(-6.8, 104.9), S(-14.6, 96.2), S(-11.2, 106.8)],
  stream8: [S(-49, 62.6), S(-40, 72), S(-22, 86), S(-12.5, 93.6)],
  // Z12 베다니 (11장): 마르다, 집 서쪽 벽 의자의 마리아, 식탁의 나사로, 위문 온 사람들, 마을 어귀(남동쪽 길)의 빛, 무덤
  martha: S(49.6, 72.4), mary12: S(38.7, 64.5), maryTable: S(39.3, 70.6), lazarus: S(42.4, 71.8),
  mourn: [S(48.4, 74.4), S(51.4, 70.6), S(37.2, 68.2)], mournTomb: [S(35.2, 66.8), S(36.4, 62.6), S(34, 68.2)],
  warmMeet: S(56.9, 93.4), marthaMeet: S(55.4, 92.2), stoneAt: S(33.3, 64.5), lazarusTomb: S(31.6, 62.9), warmTomb: S(34.8, 60.6),
  // 나드 향유 (12장): 잔치 식탁(북쪽 긴 의자 가운데), 식탁 머리의 빛, 밭에 밀 심을 자리
  table12: S(43.8, 69.25), warm12t: S(47.7, 70.5), plantAt: S(51, 64.6),
});
// ---------- 3차 사건 자리 (2026-11): 다락방(Z10) · 수난과 동산(Z11: 기드론·감람나무 동산·대제사장 뜰·관정·골고다·동산 무덤) · 디베랴 바닷가 아침(Z4) ----------
// Z10 다락방: 니고데모 집 동쪽의 큰 방 (지붕 없는 돌담, 남쪽 문). 긴 식탁, 남쪽 긴 의자는 내 자리, 북쪽은 제자들. 문 밖 동쪽에 포도나무 시렁
export const UPPER10 = rect(-104, -94, 9, 19, 2.6);
export const UPPER10_DOOR = [-100.2, -97.8]; // 남쪽 담의 문 (u 사이). 도마 이야기에서 닫힘 (그림만, 20:19)
export const TABLE10 = rect(-102, -96, 12.6, 13.8, 0.78);
// Z11: 서쪽부터 대제사장 집 뜰(북쪽 대문, 숯불) · 관정 앞 돌을 깐 뜰 · 골고다 언덕 · 동산의 새 무덤 · 기드론 시내 건너 감람나무 동산
export const COURT11 = rect(-43, -31, 168, 180, 2.0);
export const COURT11_GATE = [-38.4, -35.6]; // 북쪽 담의 대문
export const HOUSE11 = rect(-42.6, -36.6, 176.4, 179.6, 3.0);
export const PAVE11 = rect(-21, -7, 172, 179.4);      // 돌을 깐 뜰 (19:13), 걸어 다님
export const HALL11 = rect(-20, -8, 179.4, 182.6, 4.4); // 관정 앞면
export const TOMB11 = { rock: S(25, 179.6), r: 3.0, mouth: S(22.44, 178.35), stone: S(21.5, 177.9), rolled: S(21.3, 180.7) };
export const KIDRON = [[31, 150], [32.4, 162], [33, 172], [33.6, 183]]; // 기드론 시내 (얕은 물, 걸어서 건넘 · 그림만)
export const CROSSES11 = [S(5.4, 179.2), S(8, 179.8), S(10.6, 179.2)];
export const OLIVES11 = [S(38.4, 159.4), S(45.6, 160), S(41.4, 156.6), S(46.2, 164.6), S(37, 164.4)];
// 디베랴 바닷가 (21장): 가버나움 동쪽 물가에 매어 둔 배, 배 왼편·오른편 물가, 숯불, 어린 양 셋
export const SHORE21 = { boat: S(41, -126.2), dir: Math.atan2(27, -24) };
export const SHORE_ZONE = { ...S(36, -121), r: 14 };
export const PASSION_ZONE = { ...S(2, 170), r: 46 };
Object.assign(SP, {
  // Z10 다락방 (13-17장, 20장)
  upDoor: S(-99, 20.6), upIn: S(-99, 17.6), up10: S(-99.6, 14.75), up10w: S(-101.4, 14.75), thomasSeat: S(-97.8, 14.75),
  dis13: [S(-101.6, 11.65), S(-99.8, 11.65), S(-98, 11.65), S(-96.4, 11.65)], peterUpper: S(-95.6, 16.9),
  basinAt: S(-102.6, 17.3), warmUp: S(-95.2, 13.2), vine10: S(-95.4, 21.4), vineLook: S(-95.4, 22.7), vineSeat: S(-92.9, 21.9), prayUp: S(-97, 16.9),
  // Z11 감람나무 동산·기드론 (18:1-11)
  otherKidron: S(28.4, 170.4), gethAt: S(42.4, 164.6), olive11: S(41.2, 162.4), peterGeth: S(43.9, 163.2),
  torchFrom: [S(57, 165.4), S(58.6, 166.2), S(56, 166.8)], torchAt: [S(45.8, 167.6), S(44.2, 168.6), S(42.4, 168.4)],
  // 대제사장 집 뜰 (18:15-27)
  courtGate: S(-37, 166.3), fire11: S(-35.6, 173.4), fireStand: S(-37.2, 172.2), peterFire: S(-34.5, 172.4),
  maid: S(-36.4, 169.7), servant18: S(-33.8, 174.8), torchCourt: [S(-40.2, 172.4), S(-39, 174.9), S(-33.2, 176.4)],
  // 관정 (18:28-19:16)
  pilate: S(-14, 178.5), praetAt: S(-14, 175.2), otherPraet: S(-11.2, 175.9), mob: [S(-17.6, 173.6), S(-10.4, 173.4), S(-14.8, 172.4)],
  // 골고다·동산 무덤 (19:17-42, 20:1-18)
  crossAt: S(8, 176.5), crossSeat: S(8, 174.9), mother19: S(6.3, 176.7), otherCross: S(9.7, 176.7),
  nico19: S(14.6, 174.2), tombFront: S(20.4, 177.1), warmGarden: S(16.8, 175.2), garden11: S(16.2, 177.4),
  magdalene: S(13.4, 172.6), maryCry: S(19.6, 178.9), warmCross: S(8, 178.4),
  // 디베랴 바닷가 (21장)
  peterMorn: S(36.3, -118.3), castL: S(37.2, -124.6), castR: S(39.4, -122.4), fire21: S(34.4, -119.7), fireSeat: S(34.4, -118.3),
  warmShore: S(36.9, -121.3), dis21: [S(32.5, -119.9), S(33.2, -121.4)], lambs: [S(28.4, -120.4), S(30.8, -118.8), S(27, -117.8)],
});
// 마을 돌 테두리(구역 빈 자리 표시)가 2차 나·3차 모형을 지나가면 그 돌은 빼고 그림 (build.js zoneStones)
export const noStone = (u, v) => [HOLY7, rect(-51.6, -46.9, 48.8, 63.2), rect(-23, -5, 94.5, 108.5), rect(38, 48, 61, 72.5), PLOT12, FOLD7,
  UPPER10, COURT11, PAVE11, HALL11, rect(3, 13, 173.5, 181)].some((r) => inRect(r, u, v, 0.8)) || Math.hypot(u - TOMB12.rock.u, v - TOMB12.rock.v) < TOMB12.r + 1.2 || Math.hypot(u - TOMB11.rock.u, v - TOMB11.rock.v) < TOMB11.r + 1.2;
// 이 둘레에는 나무를 두지 않음 (모형과 겹치지 않게)
const CLEAR = [[ZONES.cana, 16], [ZONES.upper, 15], [ZONES.siloam, 13], [GATE7.c, 10], [SP.pole, 3], [ZONES.jordan, 14],
  [ZONES.sychar, 26], [FIELD6, 0], [ZONES.galilee, 16], [S(SYN4.cu, SYN4.cv), 11], [S(HOUSE4.cu, HOUSE4.cv), 8], [SP.warm3, 6], [BOAT.dockE, 7], [BOAT.dockW, 7], [ZONES.bethsaida, 20], [SP.servPath[1], 6],
  [HOLY7, 0], [S(-58, 54), 13], [FOLD7, 0], [S(-30, 66), 9], [ZONES.bethesda, 18], [ZONES.bethany, 17], [TOMB12.rock, 9], [SP.warmMeet, 5],
  [UPPER10, 0], [SP.vine10, 4], [S(-37, 174), 11], [S(-14, 177), 10], [S(8, 177), 7], [S(21, 178), 8], [S(42, 162), 10], [SP.otherKidron, 5], [S(34, -120), 10]];

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
block(BOARD, 0.95, 2.2);
for (const sp of SIGNPOSTS) block(sp, 0.25);
for (const t of TREES) block(t, t.kind === 'palm' ? 0.35 : 0.5);
// 사건 자리의 물건 (원으로 막음)
block(SP.fig, 0.5); for (const j of JARS) block(j, 0.42, 1.0); block(SP.well, 0.85, 0.9);
block(GATE7.at(2.3, 0), 0.5); block(GATE7.at(-2.3, 0), 0.5);
for (const s of [-1, 1]) for (let a = 2.9; a <= 8.01; a += 0.5) block(GATE7.at(s * a, 0), 0.32);
block(SP.pole, 0.25); block(SP.lamp10, 0.18, 1.2); for (const p of LINE10) block(p, 0.12);
block(WELL6, 0.85, 0.9); block(SP.shade6, 0.4);
// 2차 나: 솔로몬 행각·베데스다 행각 기둥, 성전 뜰 물동이, 나사로의 무덤 바위
for (const u of PORTICO7.us) for (const v of PORTICO7.vs) block(S(u, v), 0.26);
for (const c of POOL8.cols) block(c, 0.24);
block(SP.jar7, 0.4, 0.9); block(TOMB12.rock, TOMB12.r);
// 3차: 다락방 대야·식탁 머리 등잔, 포도나무 시렁, 뜰 숯불, 십자가 셋, 동산 무덤 바위, 감람나무, 바닷가 숯불
block(SP.basinAt, 0.32, 0.9); block(SP.warmUp, 0.22, 1.2); block(SP.vine10, 0.3);
block(SP.fire11, 0.6, 0.5); for (const c of CROSSES11) block(c, 0.22); block(TOMB11.rock, TOMB11.r);
for (const o of OLIVES11) block(o, 0.4); block(SP.fire21, 0.6, 0.5);
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
  // 2차 나: 솔로몬 행각 그늘, 베데스다 돗자리, 양 우리 안 깔개, 베다니 잔치 식탁(북쪽 긴 의자 셋). 집 서쪽 벽 의자는 마리아 자리라 넣지 않음
  portico7: seat(SP.portico7, -Math.PI / 2, 'floor', W(SP.portico7.u, SP.portico7.v + 0.7)),
  mat8: seat(SP.mat8, -Math.PI / 2, 'floor', W(SP.mat8.u + 0.2, SP.mat8.v + 0.7)),
  foldSeat: seat(SP.foldSeat, 0, 'floor', W(SP.foldSeat.u, SP.foldSeat.v + 0.7)),
  feast12: [42, 43.8, 45.6].map((u) => seat(S(u, 69.25), 0, 'gbench', W(u, 68.55))),
  // 3차: 다락방 남쪽 긴 의자 둘(북쪽을 봄), 포도나무 곁 돌, 감람나무 그늘, 십자가 아래 돌, 동산 의자, 바닷가 숯불 곁
  up10: seat(SP.up10, Math.PI, 'gbench', W(SP.up10.u, SP.up10.v + 0.7)),
  up10w: seat(SP.up10w, Math.PI, 'gbench', W(SP.up10w.u, SP.up10w.v + 0.7)),
  vineSeat: seat(SP.vineSeat, Math.atan2(SP.vine10.x - SP.vineSeat.x, SP.vine10.z - SP.vineSeat.z), 'floor', W(SP.vineSeat.u + 0.7, SP.vineSeat.v)),
  olive11: seat(SP.olive11, Math.PI, 'floor', W(SP.olive11.u, SP.olive11.v + 0.7)),
  crossSeat: seat(SP.crossSeat, 0, 'floor', W(SP.crossSeat.u, SP.crossSeat.v - 0.7)),
  garden11: seat(SP.garden11, Math.atan2(TOMB11.rock.x - SP.garden11.x, TOMB11.rock.z - SP.garden11.z), 'gbench', W(SP.garden11.u - 0.7, SP.garden11.v)),
  fireSeat: seat(SP.fireSeat, Math.PI, 'floor', W(SP.fireSeat.u, SP.fireSeat.v + 0.7)),
  // 쉼 놀이(별 보기) 눕는 자리 둘: 벳새다 언덕 마루, 니고데모 집 지붕 (구절·구역은 villages/john.js rest·seatVerse)
  hillLie: seat(S(105.5, -69), Math.PI / 2, 'lie', W(104.6, -69)),
  roofLie: seat(S(-113.8, 24.7), Math.PI / 2, 'lie', W(-113, 24.7)),
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
  // 2차 나: 성소, 양 우리 담(남쪽 문만 열림), 베데스다 못(둘레 돌단까지), 베다니 집과 잔치 식탁
  if (inRect(HOLY7, u, v, BODY) || inRect(POOL8.rim, u, v, 0.05) || inRect(HOUSE12, u, v, BODY) || inRect(TABLE12, u, v, BODY * 0.8)) return true;
  const F = FOLD7, fd = FOLD7_DOOR;
  if (wallU(u, v, F.u0, F.v0, F.v1) || wallU(u, v, F.u1, F.v0, F.v1) || wallV(u, v, F.v0, F.u0, F.u1)) return true;
  if (wallV(u, v, F.v1, F.u0, fd[0]) || wallV(u, v, F.v1, fd[1], F.u1)) return true;
  // 3차: 다락방 담(남쪽 문만 열림)과 식탁, 대제사장 집 뜰 담(북쪽 대문만 열림)과 집, 관정 앞면
  const U = UPPER10, ud = UPPER10_DOOR;
  if (wallU(u, v, U.u0, U.v0, U.v1) || wallU(u, v, U.u1, U.v0, U.v1) || wallV(u, v, U.v0, U.u0, U.u1)) return true;
  if (wallV(u, v, U.v1, U.u0, ud[0]) || wallV(u, v, U.v1, ud[1], U.u1)) return true;
  if (inRect(TABLE10, u, v, BODY * 0.8)) return true;
  const Ct = COURT11, cg = COURT11_GATE;
  if (wallU(u, v, Ct.u0, Ct.v0, Ct.v1) || wallU(u, v, Ct.u1, Ct.v0, Ct.v1) || wallV(u, v, Ct.v1, Ct.u0, Ct.u1)) return true;
  if (wallV(u, v, Ct.v0, Ct.u0, cg[0]) || wallV(u, v, Ct.v0, cg[1], Ct.u1)) return true;
  if (inRect(HOUSE11, u, v, BODY) || inRect(HALL11, u, v, BODY)) return true;
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
