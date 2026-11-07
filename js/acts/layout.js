// 사도행전 마을 배치 (단위: 미터, 2026-11 0-나 땅과 바다, 기획서 acts-village-plan.md 2장)
// 초보자 마을·요한복음 마을과 같은 장면 안의 먼 자리(가운데 x = +3200m). 요한 마을 동쪽 끝(2180)과 800m 넘게 떨어져 서로 보이지 않음
// 마을 좌표 u = 동(오른쪽), v = 남(아래쪽). 가운데가 바다(지중해), 동쪽이 예루살렘, 서쪽 끝이 로마. 북쪽 땅을 따라 걷는 길, 항구 사이는 배
// 이 파일은 그림 없이 땅 모양·막힘·길값·자리만 (THREE 없음). 모형은 처음 들어갈 때 js/acts/build.js가 지음
// 지금(0-나)은 구역 17곳의 빈 자리(돌 테두리·이름 팻말·빈 집 몇 채)와 항구·쉼 자리만. 사건은 1차부터, 배 타기는 2차 나(노선은 자료만)
import { addRegion, seats } from '../layout.js';

export const AX = 3200, AZ = 0;           // 마을 가운데 (세계 좌표)
export const HALF_W = 180, HALF_D = 150;  // 동서 360m × 남북 300m
const EDGE_U = HALF_W - 6, EDGE_V = HALF_D - 6; // 걸어 다닐 수 있는 끝 (그 바깥은 언덕)
export const W = (u, v) => ({ x: AX + u, z: AZ + v }); // 마을 좌표 → 세계 좌표
export const L = (x, z) => ({ u: x - AX, v: z - AZ }); // 세계 좌표 → 마을 좌표
const S = (u, v) => ({ u, v, ...W(u, v) });

// ---------- 바다: 큰 타원(지중해) + 북서쪽 갈래(에게 바다: 드로아와 마게도냐 사이) ----------
export const SEA = { u: -10, v: 40, ru: 122, rv: 64 };
export const AEGEAN = { u: -95, v: -40, ru: 22, rv: 42 };
const SEAS = [SEA, AEGEAN];
const ell = (E, u, v, pad = 0) => ((u - E.u) / (E.ru + pad)) ** 2 + ((v - E.v) / (E.rv + pad)) ** 2;
// 섬 둘 (바다 안의 땅): 구브로(13:4), 멜리데(28:1)
export const ISLANDS = { cyprus: { ...S(50, 46), r: 13 }, melita: { ...S(-60, 76), r: 11 } };
const islandAt = (u, v, pad = 0) => Object.values(ISLANDS).find((I) => Math.hypot(u - I.u, v - I.v) < I.r + pad) || null;
// 바닷물 안인가 (섬은 뺌). pad > 0이면 물가 둘레까지 넓혀 봄
export const inSea = (u, v, pad = 0) => SEAS.some((E) => ell(E, u, v, pad) < 1) && !islandAt(u, v, -pad);
export const WATER_Y = -0.42; // 바닷물 높이

// ---------- 구역 17곳 (빈 자리: 둥근 돌 테두리와 이름 팻말. 사건은 1차부터) ----------
// r: 빈 자리 반지름(이 안은 길처럼 걷기 쉬움). sub: 같은 구역의 곁 자리(항구·길목) — 작은 돌 테두리와 팻말
const Z = (n, name, ch, u, v, r, o = {}) => ({ n, name, ch, u, v, r, ...W(u, v), ...o });
export const ZONES = {
  jerusalem: Z('A1', '예루살렘 · 다락방 광장', '1-7장 · 12장 · 15장', 140, 92, 18),
  olivet: Z('A2', '감람산', '1:9-12', 160, 128, 9),
  gaza: Z('A3', '가사 광야 길', '8:26-40', 80, 130, 11),
  samaria: Z('A4', '사마리아 성', '8:4-25', 150, 12, 12),
  joppa: Z('A5', '욥바 · 가이사랴 해안', '9:36-11:18 · 21:8', 124, 50, 10),
  damascus: Z('A6', '다메섹', '9:1-25', 158, -108, 12),
  antioch: Z('A7', '안디옥 · 실루기아 항', '11:19-30 · 13:1-3', 92, -80, 13),
  cyprus: Z('A8', '구브로 섬', '13:4-12', ISLANDS.cyprus.u, ISLANDS.cyprus.v, 8, { island: true }),
  lystra: Z('A9', '루스드라', '14:6-22 · 16:1-3', 22, -112, 11),
  troas: Z('A10', '드로아 항', '16:8-11 · 20:5-12', -64, -76, 11),
  philippi: Z('A11', '빌립보 강가', '16:12-40', -145, -110, 13),
  berea: Z('A12', '데살로니가 · 베뢰아', '17:1-15', -158, -55, 12),
  athens: Z('A13', '아덴', '17:16-34', -158, 5, 12),
  ephesus: Z('A14', '에베소 · 밀레도', '18:19-20:38', -38, -48, 13),
  corinth: Z('A15', '고린도 · 겐그레아 항', '18:1-18', -154, 50, 12),
  melita: Z('A16', '멜리데 섬', '27:39-28:10', ISLANDS.melita.u, ISLANDS.melita.v, 7, { island: true }),
  rome: Z('A17', '로마', '28:11-31', -150, 126, 13),
};
// 곁 자리 (팻말 이름, 구역 id): 가이사랴(A5), 밀레도(A14), 보디올 항과 압비오 저자(A17)
export const SUBS = {
  caesarea: { zone: 'joppa', name: '가이사랴', ch: '10장 · 21:8', ...S(112, 6), r: 8 },
  miletus: { zone: 'ephesus', name: '밀레도', ch: '20:15-38', ...S(18, -34), r: 7 },
  puteoli: { zone: 'rome', name: '보디올 항', ch: '28:13-14', ...S(-99, 105), r: 7 },
  appius: { zone: 'rome', name: '압비오 저자 · 삼관', ch: '28:15', ...S(-124, 120), r: 5 },
};

// ---------- 항구 (배를 대는 곳): 땅 쪽 서는 자리(at)와 배가 뜨는 자리(boat) ----------
// 타원 물가의 한 점(각도 t, 도)에서 바깥쪽 2.5m가 서는 자리, 안쪽 4.5m가 배 자리. 섬은 섬 가장자리에서 바다 쪽으로
function coastPort(E, tDeg) {
  const t = (tDeg * Math.PI) / 180, c = { u: E.u + E.ru * Math.cos(t), v: E.v + E.rv * Math.sin(t) };
  let nu = Math.cos(t) / E.ru, nv = Math.sin(t) / E.rv; const l = Math.hypot(nu, nv); nu /= l; nv /= l; // 바깥쪽(땅 쪽)
  return { at: S(c.u + nu * 2.5, c.v + nv * 2.5), boat: S(c.u - nu * 4.5, c.v - nv * 4.5), rot: Math.atan2(-nu, -nv) };
}
function islandPort(I, tDeg) {
  const t = (tDeg * Math.PI) / 180, du = Math.cos(t), dv = Math.sin(t);
  return { at: S(I.u + du * (I.r - 2), I.v + dv * (I.r - 2)), boat: S(I.u + du * (I.r + 4.5), I.v + dv * (I.r + 4.5)), rot: Math.atan2(du, dv) };
}
const P = (id, name, zone, p) => ({ id, name, zone, ...p });
export const PORTS = {
  joppa: P('joppa', '욥바 항', 'joppa', coastPort(SEA, 10)),
  caesarea: P('caesarea', '가이사랴 항', 'joppa', coastPort(SEA, -28)),
  seleucia: P('seleucia', '실루기아 항', 'antioch', coastPort(SEA, -52)),
  cyprus: P('cyprus', '살라미 항', 'cyprus', islandPort(ISLANDS.cyprus, -20)),
  troas: P('troas', '드로아 항', 'troas', coastPort(AEGEAN, -40)),
  neapolis: P('neapolis', '네압볼리 항', 'philippi', coastPort(AEGEAN, -140)),
  ephesus: P('ephesus', '에베소 항', 'ephesus', coastPort(SEA, -100)),
  miletus: P('miletus', '밀레도 항', 'ephesus', coastPort(SEA, -78)),
  cenchreae: P('cenchreae', '겐그레아 항', 'corinth', coastPort(SEA, 170)),
  melita: P('melita', '멜리데 바닷가', 'melita', islandPort(ISLANDS.melita, -120)),
  puteoli: P('puteoli', '보디올 항', 'rome', coastPort(SEA, 130)),
};

// ---------- 배 노선 일곱 (기획서 2.1, 마을 안 이동 transit). 지금은 자료만: 배를 타는 일은 2차 나 (js/village/transit.js) ----------
//   route: 배가 지나는 바다 위 점 (첫 점 = 떠나는 항구 배 자리, 끝 점 = 닿는 항구 배 자리). kind 'road'는 배 대신 해안 길(10:23-24 본문은 걸어감)
//   opens: 이 사건을 마치면 열림 (사건은 1차부터). open(profile): 연 노선인가 (profile.acts.ships)
const R = (id, name, from, to, opens, ref, mid, kind = 'ship') => ({
  id, name, kind, from, to, opens, ref,
  route: kind === 'road' ? mid.map(([u, v]) => S(u, v)) : [PORTS[from].boat, ...mid.map(([u, v]) => S(u, v)), PORTS[to].boat],
  open: (profile) => !!profile?.acts?.ships?.includes(id),
});
export const TRANSIT = [
  R('cyprus', '실루기아 → 구브로', 'seleucia', 'cyprus', 'cyprus', '사도행전 13:4', [[62, 8]]),
  R('macedonia', '드로아 → 네압볼리', 'troas', 'neapolis', 'troas', '사도행전 16:11', [[-95, -62]]),
  R('ephesus', '겐그레아 → 에베소', 'cenchreae', 'ephesus', 'corinth', '사도행전 18:18-19', [[-100, 30], [-60, 0]]),
  R('caesarea', '밀레도 → 가이사랴', 'miletus', 'caesarea', 'miletus', '사도행전 21:1-8', [[45, -8], [80, 4]]),
  R('storm', '가이사랴 → 풍랑 → 멜리데', 'caesarea', 'melita', 'storm', '사도행전 27장', [[70, 18], [25, 18], [-10, 30], [-30, 55], [-50, 56]]),
  R('rome', '멜리데 → 보디올', 'melita', 'puteoli', 'storm', '사도행전 28:11-13', [[-80, 70]]),
  R('coast', '욥바 ↔ 가이사랴 해안 길', 'joppa', 'caesarea', 'joppa', '사도행전 10:23-24', [[124, 50], [116, 28], [112, 6]], 'road'),
];

// ---------- 길 (흙길): 구역 사이를 잇는 길. 북쪽 땅을 따라 예루살렘에서 로마까지 걸어서도 감 (섬만 배로) ----------
const port = (id) => [PORTS[id].at.u, PORTS[id].at.v];
export const ROADS = [
  [[160, 128], [150, 108], [140, 92]],                     // 감람산 → 예루살렘 (1:12 안식일에 가기 알맞은 길)
  [[140, 92], [118, 114], [80, 130], [45, 133]],           // 예루살렘 → 가사 광야 길 → 물 있는 곳 (8:26, 8:36)
  [[140, 92], [131, 70], [124, 50]],                       // 예루살렘 → 욥바
  [[124, 50], [116, 28], [112, 6]],                        // 욥바 → 가이사랴 (해안 길)
  [[140, 92], [152, 55], [150, 12]],                       // 예루살렘 → 사마리아
  [[150, 12], [160, -40], [158, -108]],                    // 사마리아 → 다메섹
  [[112, 6], [104, -35], [92, -80]],                       // 가이사랴 → 안디옥
  [[158, -108], [126, -100], [92, -80]],                   // 다메섹 → 안디옥
  [[92, -80], [78, -40], port('seleucia')],                // 안디옥 → 실루기아 항
  [[92, -80], [56, -104], [22, -112]],                     // 안디옥 → 루스드라
  [[22, -112], [-6, -82], [-38, -48]],                     // 루스드라 → 에베소
  [[-38, -48], [-12, -42], [18, -34], port('miletus')],    // 에베소 → 밀레도 → 밀레도 항
  [[-38, -48], port('ephesus')],                           // 에베소 항
  [[-38, -48], [-52, -64], [-64, -76]],                    // 에베소 → 드로아
  [[22, -112], [-28, -104], [-64, -76]],                   // 루스드라 → 드로아
  [[-64, -76], port('troas')],                             // 드로아 항
  [[-64, -76], [-88, -102], [-120, -114], [-145, -110]],   // 드로아 → (에게 바다 북쪽 둘레) → 빌립보
  [[-145, -110], port('neapolis')],                        // 빌립보 → 네압볼리 항
  [[-145, -110], [-162, -82], [-158, -55]],                // 빌립보 → 데살로니가 · 베뢰아
  [[-158, -55], [-163, -25], [-158, 5]],                   // 베뢰아 → 아덴
  [[-158, 5], [-162, 30], [-154, 50]],                     // 아덴 → 고린도
  [[-154, 50], port('cenchreae')],                         // 고린도 → 겐그레아 항
  [[-154, 50], [-162, 92], [-150, 126]],                   // 고린도 → 로마
  [port('puteoli'), [-99, 105], [-124, 120], [-150, 126]], // 보디올 항 → 압비오 저자 · 삼관 → 로마 (28:13-15)
  [[124, 50], port('joppa')],                              // 욥바 항
  [[112, 6], port('caesarea')],                            // 가이사랴 항
];
const ROAD_HALF = 1.6;
function segD(u, v, a, b) {
  const du = b[0] - a[0], dv = b[1] - a[1], L2 = du * du + dv * dv || 1;
  const k = Math.max(0, Math.min(1, ((u - a[0]) * du + (v - a[1]) * dv) / L2));
  return Math.hypot(u - a[0] - du * k, v - a[1] - dv * k);
}
export const roadD = (u, v) => {
  let d = Infinity;
  for (const r of ROADS) for (let i = 1; i < r.length; i++) d = Math.min(d, segD(u, v, r[i - 1], r[i]));
  return d;
};
// 빌립보 문밖 강 (16:13 "문밖 강가"): 얕은 내, 걸어서 건넘 (그림만)
export const STREAM = [[-174, -128], [-160, -122], [-148, -126], [-134, -124], [-120, -132], [-108, -144]];

// ---------- 땅 높낮이 (완만하게만) ----------
const HILLS = [
  { u: 164, v: 132, h: 3.2, s: 9 },     // 감람산 (1:12)
  { u: 140, v: 92, h: 1.4, s: 40 },     // 예루살렘 언덕
  { u: 150, v: 12, h: 2.0, s: 22 },     // 사마리아 언덕
  { u: 22, v: -122, h: 2.6, s: 16 },    // 루스드라 성 밖 언덕
  { u: -166, v: -3, h: 2.8, s: 7 },     // 아레오바고 언덕 (17:19)
  { u: -150, v: 136, h: 1.2, s: 18 },   // 로마 언덕
  { u: 170, v: -140, h: 6, s: 26 }, { u: -172, v: -140, h: 6, s: 24 }, { u: 172, v: 30, h: 5, s: 22 }, // 바깥 언덕들 (끝자락)
  { u: 60, v: -140, h: 4, s: 24 }, { u: 20, v: 145, h: 3, s: 30 },
];
// 바다 쪽 물가 거리 (0 = 물가, > 0 = 물 안). 타원 정규 거리를 미터쯤으로
function seaDepth(u, v) {
  let d = -Infinity;
  for (const E of SEAS) d = Math.max(d, (1 - Math.sqrt(ell(E, u, v))) * Math.min(E.ru, E.rv));
  for (const I of Object.values(ISLANDS)) d = Math.min(d, Math.hypot(u - I.u, v - I.v) - I.r); // 섬 안은 - (땅)
  return d;
}
export function groundH(u, v) {
  let h = 0;
  for (const k of HILLS) { const d2 = (u - k.u) ** 2 + (v - k.v) ** 2; if (d2 < 9 * k.s * k.s) h += k.h * Math.exp(-d2 / (2 * k.s * k.s)); }
  const d = seaDepth(u, v); // 물가에서 물 쪽으로 + (섬은 섬 안이 -)
  if (d > -6) {
    const k = Math.max(0, Math.min(1, (d + 6) / 6)); // 물가 6m 바깥부터 낮아짐 (모래톱)
    h = h * (1 - k) + 0.05 * (1 - k);
    if (d > 0) h -= Math.min(2.6, 0.35 + d * 0.22); // 물 안은 더 깊게
    else h -= 0.2 * k;
  }
  // 예루살렘 광장은 평평하게
  const pl = Math.hypot(u - ZONES.jerusalem.u, v - ZONES.jerusalem.v);
  if (pl < 22) { const k = Math.min(1, Math.max(0, (pl - 15) / 7)); h = h * k + groundAt0 * (1 - k); }
  return h;
}
const groundAt0 = 1.4; // 광장 바닥 둘레 높이 (예루살렘 언덕 꼭대기와 같게)
export const PLAZA = { ...ZONES.jerusalem, R: 14, y: groundAt0 + 0.12 }; // 다락방 광장 돌바닥 (반지름 14m, 살짝 높음)

// ---------- 다락방 광장 (A1): 도착 자리·수레·벤치 넷·다락방(빈 2층 돌집) ----------
const PU = PLAZA.u, PV = PLAZA.v;
export const CART = (() => {
  const c = W(PU - 1.5, PV + 18), stand = W(PU - 1.2, PV + 15.4), arrive = W(PU + 1.5, PV + 11.5);
  return { ...c, rot: 0, stand, arrive, look: W(PU, PV) }; // 요한 마을 광장 수레와 같은 놓임
})();
export const UPPER = { u0: PU - 5, u1: PU + 5, v0: PV - 13.5, v1: PV - 7, h: 6.4 }; // 다락방 (1:13 "올라가")은 광장 북쪽, 지금은 빈 집
const pAt = (r, deg) => S(PU + r * Math.cos((deg * Math.PI) / 180), PV + r * Math.sin((deg * Math.PI) / 180));
export const PLAZA_BENCHES = [200, 340, 30, 150].map((a) => ({ a, ...pAt(10.6, a), approach: pAt(9.7, a) }));
export const LUKE_AT = S(PU + 3.6, PV + 5.5); // 안내자 누가가 설 자리 (1차부터), 여정 지도 탁자는 곁
export const MAP_TABLE = S(PU + 5.6, PV + 3.6);

// ---------- 빈 집 (구역마다 두어 채, 1세기 평평한 지붕 돌집 · 그리스 도시는 붉은 지붕 · 로마는 벽돌빛) ----------
//   [구역 id, 각도(도), 구역 중심에서 거리(r 배수), 너비, 깊이, 높이]. 길과 겹치는 것은 아래에서 뺌
const STYLE = { athens: 'greek', corinth: 'greek', ephesus: 'greek', berea: 'greek', philippi: 'greek', troas: 'greek', rome: 'brick' };
const HOUSE_AT = [
  ['jerusalem', 210, 1.25, 7, 6, 3.2], ['jerusalem', 330, 1.25, 6, 5, 3.0], ['jerusalem', 20, 1.3, 6, 6, 3.0],
  ['samaria', 210, 1.4, 6, 5, 2.8], ['samaria', 20, 1.35, 6, 5, 2.8],
  ['joppa', 300, 1.6, 5, 5, 2.8], ['joppa', 30, 1.7, 5, 5, 3.4],
  ['damascus', 200, 1.35, 7, 5, 3.0], ['damascus', 330, 1.4, 6, 5, 3.0],
  ['antioch', 20, 1.4, 8, 6, 3.2], ['antioch', 250, 1.4, 6, 5, 3.0],
  ['lystra', 330, 1.4, 6, 5, 2.8], ['lystra', 200, 1.45, 5, 5, 2.6],
  ['troas', 200, 1.4, 6, 5, 3.0], ['philippi', 340, 1.4, 6, 6, 3.0], ['philippi', 200, 1.4, 6, 5, 2.8],
  ['berea', 0, 1.4, 6, 5, 3.0], ['berea', 200, 1.4, 6, 5, 3.0],
  ['athens', 330, 1.45, 7, 6, 3.4], ['athens', 150, 1.4, 6, 5, 3.0],
  ['ephesus', 240, 1.4, 7, 6, 3.4], ['ephesus', 100, 1.45, 6, 5, 3.0],
  ['corinth', 330, 1.4, 7, 6, 3.2], ['corinth', 200, 1.45, 6, 5, 3.0],
  ['rome', 330, 1.4, 7, 6, 3.6], ['rome', 30, 1.4, 6, 5, 3.4], ['rome', 200, 1.45, 6, 5, 3.2],
];
export const HOUSES = [];
for (const [id, deg, k, w, d, h] of HOUSE_AT) {
  const z = ZONES[id], a = (deg * Math.PI) / 180, cu = z.u + Math.cos(a) * z.r * k, cv = z.v + Math.sin(a) * z.r * k;
  const H = { zone: id, style: STYLE[id] || 'stone', u0: cu - w / 2, u1: cu + w / 2, v0: cv - d / 2, v1: cv + d / 2, cu, cv, w, d, h, ...W(cu, cv) };
  const near = Math.max(w, d) / 2 + ROAD_HALF + 2.4;
  if (roadD(cu, cv) < near || inSea(cu, cv, 8) || Math.abs(cu) > EDGE_U - 6 || Math.abs(cv) > EDGE_V - 6) continue;
  HOUSES.push(H);
}
HOUSES.push({ zone: 'jerusalem', style: 'upper', ...UPPER, cu: (UPPER.u0 + UPPER.u1) / 2, cv: (UPPER.v0 + UPPER.v1) / 2, w: UPPER.u1 - UPPER.u0, d: UPPER.v1 - UPPER.v0, ...W((UPPER.u0 + UPPER.u1) / 2, (UPPER.v0 + UPPER.v1) / 2) });
const inRect = (r, u, v, pad = 0) => u > r.u0 - pad && u < r.u1 + pad && v > r.v0 - pad && v < r.v1 + pad;

// ---------- 구역 팻말 (빈 자리마다 하나, 곁 자리마다 하나) ----------
export const SIGNPOSTS = [
  ...Object.entries(ZONES).map(([id, z]) => {
    const p = id === 'jerusalem' ? W(PU + 4.5, PV + 15.5) : W(z.u - z.r * 0.55, z.v - z.r * 0.55);
    return { id, name: z.name, ch: z.ch, n: z.n, ...p, look: id === 'jerusalem' ? W(PU, PV) : W(z.u, z.v) };
  }),
  ...Object.entries(SUBS).map(([id, s]) => ({ id, name: s.name, ch: s.ch, ...W(s.u - s.r * 0.6, s.v - s.r * 0.6), look: W(s.u, s.v) })),
];
// 이정표 돌 (길 30~35m마다, 빈 길이 길게 이어지지 않게: 기획서 7장. 사건 뒤에는 그 곁에 집 교회·주민이 섬)
export const MILESTONES = [];
{
  const ZR = [...Object.values(ZONES), ...Object.values(SUBS)];
  for (const r of ROADS) {
    let acc = 0;
    for (let i = 1; i < r.length; i++) {
      const [a, b] = [r[i - 1], r[i]], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 0; s < len; s += 1) {
        acc += 1;
        if (acc < 32) continue;
        const u = a[0] + ((b[0] - a[0]) * s) / len, v = a[1] + ((b[1] - a[1]) * s) / len;
        if (ZR.some((z) => Math.hypot(u - z.u, v - z.v) < z.r + 6)) continue;
        const nu = -(b[1] - a[1]) / len, nv = (b[0] - a[0]) / len; // 길 옆 (오른쪽)
        const p = { u: u + nu * (ROAD_HALF + 0.9), v: v + nv * (ROAD_HALF + 0.9) };
        if (inSea(p.u, p.v, 2) || MILESTONES.some((m) => Math.hypot(m.u - p.u, m.v - p.v) < 20)) continue;
        MILESTONES.push(S(p.u, p.v)); acc = 0;
      }
    }
  }
}

// ---------- 쉼 자리 (퀘스트 없이도 앉는 곳, 기획서 2장 표 "쉼 자리") ----------
//   kind: 'gbench' 벤치, 'floor' 바닥(돌), 'lie' 눕기(언덕에서 하늘 보기). 섬 둘의 쉼 자리는 배가 다니면 (2차 나)
const zp = (id, deg, k) => { const z = ZONES[id] || SUBS[id], a = (deg * Math.PI) / 180; return S(z.u + Math.cos(a) * z.r * k, z.v + Math.sin(a) * z.r * k); };
export const REST_SPOTS = {
  olivet: { kind: 'lie', at: S(163, 131), face: Math.PI, name: '감람산 언덕' },          // 1:11 하늘을 쳐다보며
  gaza: { kind: 'floor', at: S(48, 136.5), face: 0, name: '물 있는 곳 바위 그늘' },       // 8:36
  samaria: { kind: 'gbench', at: zp('samaria', 120, 0.75), name: '성문 곁 의자' },
  joppa: { kind: 'floor', at: zp('joppa', 160, 0.75), name: '욥바 바닷가' },
  damascus: { kind: 'gbench', at: zp('damascus', 60, 0.6), name: '직가 거리 의자' },      // 9:11
  antioch: { kind: 'gbench', at: zp('antioch', 120, 0.6), name: '교회 마당' },
  lystra: { kind: 'floor', at: S(22, -121), face: 0, name: '성 밖 언덕' },
  troas: { kind: 'floor', at: zp('troas', 150, 0.7), name: '드로아 바닷가' },
  philippi: { kind: 'floor', at: S(-146, -121.5), face: Math.PI, name: '문밖 강가' },     // 16:13 거기 앉아서
  berea: { kind: 'gbench', at: zp('berea', 60, 0.55), name: '회당 돌 의자' },
  athens: { kind: 'lie', at: S(-165, -3), face: 0, name: '아레오바고 언덕' },             // 17:19
  ephesus: { kind: 'gbench', at: zp('ephesus', 30, 0.6), name: '두란노 서원 그늘' },     // 19:9
  miletus: { kind: 'floor', at: zp('miletus', 60, 0.5), name: '밀레도 바닷가' },          // 20:36
  corinth: { kind: 'gbench', at: zp('corinth', 60, 0.6), name: '일터 그늘' },
  rome: { kind: 'gbench', at: zp('rome', 120, 0.55), name: '셋집 마당' },                // 28:30
};
// 앉는 쪽: 따로 정하지 않았으면 구역 가운데를 봄
for (const [id, s] of Object.entries(REST_SPOTS)) {
  if (s.face != null) continue;
  const z = ZONES[id] || SUBS[id];
  s.face = Math.atan2(z.x - s.at.x, z.z - s.at.z);
}

// ---------- 나무: 올리브·측백(그리스·로마)·종려 (씨앗 고정, 길·구역·물에서 떨어진 곳) ----------
const CLEAR = [...Object.values(ZONES), ...Object.values(SUBS)].map((z) => [z, z.r + 6]);
for (const p of Object.values(PORTS)) CLEAR.push([p.at, 6]);
for (const s of Object.values(REST_SPOTS)) CLEAR.push([s.at, 4]);
export const TREES = [];
{
  let s = 20261107;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 3200 && TREES.length < 300; k++) {
    const u = (rnd() * 2 - 1) * (EDGE_U + 4), v = (rnd() * 2 - 1) * (EDGE_V + 4);
    if (roadD(u, v) < 5 || inSea(u, v, 5) || Math.hypot(u - PU, v - PV) < 26) continue;
    if (islandAt(u, v, 0) && Math.hypot(u - islandAt(u, v, 0).u, v - islandAt(u, v, 0).v) > islandAt(u, v, 0).r - 4) continue;
    if (CLEAR.some(([c, r]) => Math.hypot(u - c.u, v - c.v) < r)) continue;
    if (HOUSES.some((h) => inRect(h, u, v, 3))) continue;
    if (TREES.some((t) => Math.hypot(t.u - u, t.v - v) < 7)) continue;
    const edge = Math.abs(u) > EDGE_U - 18 || Math.abs(v) > EDGE_V - 18;
    if (!edge && rnd() < 0.5) continue; // 가운데는 드문드문, 끝자락은 빽빽
    const west = u < -60; // 그리스·로마 쪽은 측백이 섞임
    const kind = west && rnd() < 0.45 ? 'cypress' : u > 90 && rnd() < 0.3 ? 'palm' : 'olive';
    TREES.push({ u, v, ...W(u, v), kind, h: kind === 'palm' ? 6 + rnd() * 2 : kind === 'cypress' ? 5 + rnd() * 2.5 : 3.2 + rnd() * 1.6, rot: rnd() * Math.PI * 2 });
  }
}

// ---------- 막힘 (원) ----------
const obstacles = [];
const block = (p, r, h = Infinity) => obstacles.push({ x: p.x, z: p.z, r, h });
block(CART, 1.25, 1.3);
for (const sp of SIGNPOSTS) block(sp, 0.25);
for (const m of MILESTONES) block(m, 0.3, 0.7);
for (const t of TREES) block(t, t.kind === 'olive' ? 0.5 : 0.35);
block(MAP_TABLE, 0.7, 0.9);
const BK = 4, buckets = new Map();
const bkey = (i, j) => i * 4096 + j;
for (const o of obstacles) {
  const R0 = o.r + 0.35;
  for (let i = Math.floor((o.x - R0) / BK); i <= Math.floor((o.x + R0) / BK); i++)
    for (let j = Math.floor((o.z - R0) / BK); j <= Math.floor((o.z + R0) / BK); j++) {
      const k = bkey(i, j);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(o);
    }
}

// ---------- 앉을 자리 — 카페와 같은 seats 목록에 더함 (앉기·눕기 단추가 그대로 씀) ----------
const seat = (p, face, kind, ap) => { seats.push({ x: p.x, z: p.z, face, kind, approach: ap, taken: false, region: 'acts' }); return seats[seats.length - 1]; };
const back = (p, face, d = 0.75) => ({ x: p.x - Math.sin(face) * -d, z: p.z - Math.cos(face) * -d }); // 앉는 쪽 앞 (다가가는 자리)
export const SEATS_A = {
  plaza: PLAZA_BENCHES.map((b) => seat(b, Math.atan2(PLAZA.x - b.x, PLAZA.z - b.z), 'gbench', b.approach)),
  ...Object.fromEntries(Object.entries(REST_SPOTS).map(([id, s]) => [id, seat(s.at, s.face, s.kind, back(s.at, s.face))])),
};

// ---------- 바닥·막힘·길값 (layout.js가 이 상자 안이면 이 함수로 넘김) ----------
const BODY = 0.35;
function floorY(x, z) {
  const u = x - AX, v = z - AZ;
  if (Math.hypot(u - PU, v - PV) < PLAZA.R) return PLAZA.y;
  return groundH(u, v);
}
function isFree(x, z, hop = 0) {
  const u = x - AX, v = z - AZ;
  if (Math.abs(u) > EDGE_U || Math.abs(v) > EDGE_V) return false; // 마을 끝 (언덕)
  if (inSea(u, v, -0.4)) return false; // 바다 (배 타기는 2차 나부터). 물가 0.4m 안까지는 걸음
  for (const h of HOUSES) if (inRect(h, u, v, BODY)) return false; // 빈 집 (들어가지 않음, 사건 때 문을 냄)
  const list = buckets.get(bkey(Math.floor(x / BK), Math.floor(z / BK)));
  if (list) for (const o of list) {
    if (hop > o.h) continue;
    if (Math.hypot(x - o.x, z - o.z) < o.r + BODY) return false;
  }
  return true;
}
// 길값: 길·광장·구역 빈 자리 1, 그 밖 들판은 비쌈 (자동으로 걸을 때 길을 따라가게). 길까지 거리는 1m 칸에 한 번만 재 둠
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
const EASY = [...Object.values(ZONES), ...Object.values(SUBS)];
function pathCost(x, z) {
  const u = x - AX, v = z - AZ;
  if (onRoad(u, v) || Math.hypot(u - PU, v - PV) < PLAZA.R + 1) return 1;
  for (const zn of EASY) if (Math.hypot(u - zn.u, v - zn.v) < zn.r) return 1;
  return GRASS_COST;
}

// 지역 등록: 상자는 마을 끝보다 조금 넓게 (모형의 바깥 언덕까지)
export const REGION = addRegion({
  id: 'acts', name: '사도행전 마을',
  x0: AX - HALF_W - 30, x1: AX + HALF_W + 30, z0: AZ - HALF_D - 30, z1: AZ + HALF_D + 30,
  // 길찾기 격자 (nav.js가 처음 들어갈 때 만듦): 걸을 수 있는 끝까지만, 0.5m 칸
  nav: { x0: AX - EDGE_U - 1, x1: AX + EDGE_U + 1, z0: AZ - EDGE_V - 1, z1: AZ + EDGE_V + 1, cell: 0.5 },
  floorY, isFree, pathCost,
  arrive: CART.arrive, look: CART.look,
  // 하늘과 안개: 지중해의 푸른 낮 (요한 마을보다 맑고 푸르스름)
  env: { sky: 0xdde8ee, fog: [60, 230], hemiSky: 0xf2f7ff, hemiGround: 0xd8cfae },
});
// 그 자리 단추 이름 (region.js가 main.js ACTIONS에 미리 등록하고, 엔진이 생기면 넘김). 사건은 1차부터라 지금은 없음
export const AC_ACTS = [];
