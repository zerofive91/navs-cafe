// 나의 캐릭터: 닉네임, 성장 단계, 받은 물품, 안내(튜토리얼)를 마쳤는지
// 이 기기 안(localStorage)에 저장하고, 계정으로 들어와 있으면 서버에도 올림(account.js). 모습(옷·머리 색)은 예전처럼 navs-cafe-look3d에 따로 둠
import { fillMet } from './met.js';
import { fillTownExtras, mergeTownExtras } from './village/town-save.js'; // 마을 공용 칸 er·day·pc (부탁·오늘의 마을·조각)
const KEY = 'navs-cafe-profile';

// 성장 단계 (디모데후서 2:2의 배가 흐름). need: 그 단계에 이르는 걸음 수
export const STAGES = [
  { name: '새싹', need: 0 },
  { name: '제자', need: 100 },
  { name: '일꾼', need: 300 },
  { name: '동역자', need: 700 },
  { name: '배가자', need: 1500 },
];
export const stageOf = (steps) => STAGES.reduce((s, x) => (steps >= x.need ? x : s), STAGES[0]);

// 받을 수 있는 물품 (2단계에서 광주리 창과 능력치로 이어짐)
export const ITEMS = {
  basket: { name: '광주리', verse: ['다 배불리 먹고 남은 조각을 열 두 바구니에 차게 거두었으며', '마태복음 14:20'] },
  manna: { name: '만나', verse: ['보라 내가 너희를 위하여 하늘에서 양식을 비 같이 내리리니 백성이 나가서 일용할 것을 날마다 거둘 것이라', '출애굽기 16:4'] },
  mustard: { name: '겨자씨', verse: ['천국은 마치 사람이 자기 밭에 갖다 심은 겨자씨 한 알 같으니', '마태복음 13:31'] },
  // 훈련장 기초 과정을 마치면 사부에게서 받음
  scroll: { name: '두루마리', verse: ['오직 여호와의 율법을 즐거워하여 그 율법을 주야로 묵상하는 자로다', '시편 1:2'] },
  incense: { name: '금 대접의 향', verse: ['향이 가득한 금 대접을 가졌으니 이 향은 성도의 기도들이라', '요한계시록 5:8'] },
  bread: { name: '떡 한 덩이', verse: ['집에서 떡을 떼며 기쁨과 순전한 마음으로 음식을 먹고', '사도행전 2:46'] },
  lamp: { name: '등불', verse: ['이같이 너희 빛을 사람 앞에 비취게 하여 저희로 너희 착한 행실을 보고 하늘에 계신 너희 아버지께 영광을 돌리게 하라', '마태복음 5:16'] },
  stake: { name: '장막 말뚝', verse: ['네 장막터를 넓히며 네 처소의 휘장을 아끼지 말고 널리 펴되 너의 줄을 길게 하며 너의 말뚝을 견고히 할찌어다', '이사야 54:2'] },
  // 요한복음 마을 1차 사건에서 받음 (js/john/events.js)
  jn_scroll: { name: '요한의 두루마리', verse: ['오직 이것을 기록함은 너희로 예수께서 하나님의 아들 그리스도이심을 믿게 하려 함이요 또 너희로 믿고 그 이름을 힘입어 생명을 얻게 하려 함이니라', '요한복음 20:31'] },
  jn_fig: { name: '무화과 잎', verse: ['나다나엘이 가로되 어떻게 나를 아시나이까 예수께서 대답하여 가라사대 빌립이 너를 부르기 전에 네가 무화과나무 아래 있을 때에 보았노라', '요한복음 1:48'] },
  jn_jar: { name: '돌항아리', verse: ['예수께서 저희에게 이르시되 항아리에 물을 채우라 하신즉 아구까지 채우니', '요한복음 2:7'] },
  jn_nightlamp: { name: '밤의 등잔', verse: ['진리를 좇는 자는 빛으로 오나니 이는 그 행위가 하나님 안에서 행한 것임을 나타내려 함이라 하시니라', '요한복음 3:21'] },
  jn_siloam: { name: '실로암 물', verse: ['이르시되 실로암 못에 가서 씻으라 하시니 (실로암은 번역하면 보냄을 받았다는 뜻이라) 이에 가서 씻고 밝은 눈으로 왔더라', '요한복음 9:7'] },
  // 요한복음 마을 2차 가 (갈릴리·사마리아)
  jn_waterjar: { name: '버려 둔 물동이', verse: ['여자가 물동이를 버려두고 동네에 들어가서 사람들에게 이르되', '요한복음 4:28'] },
  jn_seal: { name: '신하의 인장', verse: ['예수께서 가라사대 가라 네 아들이 살았다 하신대 그 사람이 예수의 하신 말씀을 믿고 가더니', '요한복음 4:50'] },
  jn_loaves: { name: '보리떡 다섯 물고기 둘', verse: ['여기 한 아이가 있어 보리떡 다섯 개와 물고기 두 마리를 가졌나이다 그러나 그것이 이 많은 사람에게 얼마나 되겠삽나이까', '요한복음 6:9'] },
  jn_oar: { name: '노', verse: ['가라사대 내니 두려워 말라 하신대', '요한복음 6:20'] },
  jn_breadlamp: { name: '떡 등불', verse: ['예수께서 가라사대 내가 곧 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라', '요한복음 6:35'] },
  // 요한복음 마을 2차 나 (예루살렘·베다니)
  jn_cord: { name: '노끈', verse: ['노끈으로 채찍을 만드사 양이나 소를 다 성전에서 내어 쫓으시고 돈 바꾸는 사람들의 돈을 쏟으시며 상을 엎으시고', '요한복음 2:15'] },
  jn_mat: { name: '들고 간 자리', verse: ['그 사람이 곧 나아서 자리를 들고 걸어 가니라 이 날은 안식일이니', '요한복음 5:9'] },
  jn_lightlamp: { name: '빛 등불', verse: ['예수께서 또 일러 가라사대 나는 세상의 빛이니 나를 따르는 자는 어두움에 다니지 아니하고 생명의 빛을 얻으리라', '요한복음 8:12'] },
  jn_doorlamp: { name: '문 등불', verse: ['내가 문이니 누구든지 나로 말미암아 들어가면 구원을 얻고 또는 들어가며 나오며 꼴을 얻으리라', '요한복음 10:9'] },
  jn_shepherdlamp: { name: '목자 등불', verse: ['나는 선한 목자라 선한 목자는 양들을 위하여 목숨을 버리거니와', '요한복음 10:11'] },
  jn_lifelamp: { name: '부활 등불', verse: ['예수께서 가라사대 나는 부활이요 생명이니 나를 믿는 자는 죽어도 살겠고', '요한복음 11:25'] },
  jn_nard: { name: '나드 향유', verse: ['마리아는 지극히 비싼 향유 곧 순전한 나드 한 근을 가져다가 예수의 발에 붓고 자기 머리털로 그의 발을 씻으니 향유 냄새가 집에 가득하더라', '요한복음 12:3'] },
  // 요한복음 마을 3차 (다락방·수난·부활)
  jn_towel: { name: '수건과 대야', verse: ['내가 주와 또는 선생이 되어 너희 발을 씻겼으니 너희도 서로 발을 씻기는 것이 옳으니라', '요한복음 13:14'] },
  jn_waylamp: { name: '길 등불', verse: ['예수께서 가라사대 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라', '요한복음 14:6'] },
  jn_vinelamp: { name: '포도나무 등불', verse: ['나는 포도나무요 너희는 가지니 저가 내 안에, 내가 저 안에 있으면 이 사람은 과실을 많이 맺나니 나를 떠나서는 너희가 아무 것도 할 수 없음이라', '요한복음 15:5'] },
  jn_cloth: { name: '개켜진 수건', verse: ['또 머리를 쌌던 수건은 세마포와 함께 놓이지 않고 딴 곳에 개켜 있더라', '요한복음 20:7'] },
  jn_confess: { name: '도마의 고백', verse: ['도마가 대답하여 가로되 나의 주시며 나의 하나님이시니이다', '요한복음 20:28'] },
  jn_coals: { name: '숯불 조반', verse: ['육지에 올라보니 숯불이 있는데 그 위에 생선이 놓였고 떡도 있더라', '요한복음 21:9'] },
};
// 수레바퀴 다섯 능력치
export const STATS = [
  { id: 'word', name: '말씀', color: '#d8a93a' },
  { id: 'prayer', name: '기도', color: '#9a7ac8' },
  { id: 'fellow', name: '교제', color: '#e08a4a' },
  { id: 'witness', name: '증거', color: '#6aa85a' },
  { id: 'obey', name: '순종', color: '#5a9ad0' },
];

// ---------- 요한복음 마을 기록 (2026-11, 기획서 6장) ----------
// 사건 23개의 id와 장 순서 (큰 줄기 'open'은 이 순서에서 더 뒤의 것이 앞섬). 1차 MVP의 js/john/events.js도 이 id를 씀
export const JOHN_EVENTS = [
  'word', 'come', 'cana', 'temple', 'nico', 'well', 'official', 'bethesda', 'loaves', 'sea', 'bread', 'light',
  'siloam', 'shepherd', 'lazarus', 'nard', 'wash', 'way', 'arrest', 'truth', 'mary', 'thomas', 'morning',
];
const MODES = 'lrasmd'; // 사건에서 채운 모드: l 듣기 r 읽기 a 적용 s 공부 m 암송 d 묵상
const MARKS = ['', '증인', '졸업'];
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
// 모르는 칸 그대로 넘기기 (2026-11, PR #62 데이터 리뷰 C): 새 판 기기가 더한 칸(예: er·day·pc, acts)을 옛 판 기기가 채우기·합치기에서 지우지 않게
//   이 판이 아는 칸(known)은 빼고 나머지를 그대로 둠. 이 판이 아는 칸은 뒤에서 검사한 값으로 덮어씀
//   상한: 칸 64개, 이름 40자, 값은 칸마다 JSON 4000자 (손상된 기록이 계정 저장 크기를 넘기지 않게, PR #65 리뷰 A). 넘는 칸은 버림. __proto__는 넘기지 않음
const PASS_MAX = 64, PASS_KEY = 40, PASS_VAL = 4000;
const small = (v) => { try { const t = JSON.stringify(v); return t !== undefined && t.length <= PASS_VAL; } catch { return false; } };
export function passUnknown(o, known) {
  const out = {};
  if (!isObj(o)) return out;
  let n = 0;
  for (const k of Object.keys(o)) {
    if (known.has(k) || k === '__proto__' || k.length > PASS_KEY || o[k] === undefined || !small(o[k])) continue;
    if (n++ >= PASS_MAX) break;
    out[k] = o[k];
  }
  return out;
}
// 두 기기의 모르는 칸: 둘 다 있으면 나중 기록(b, 서버 쪽). 합친 뒤에도 64칸 상한 (다음 채우기와 같은 결과가 되게)
const mergeUnknown = (a, b, known) => passUnknown({ ...passUnknown(a, known), ...passUnknown(b, known) }, known);
const modes = (m) => [...new Set(String(m || '').split(''))].filter((c) => MODES.includes(c)).sort((a, b) => MODES.indexOf(a) - MODES.indexOf(b)).join('');
// 마친 사건 ev (요한·사도행전 공용, PR #65 리뷰 B·C): 키는 40자 안·99개까지, done은 0~4e12의 정수 (음수·이상한 값은 0 = 안 마침)
//   사건 id가 이 판 목록에 있는지는 보지 않음 (더 새 판 기기가 더한 사건을 지우지 않게)
const EV_MAX = 99, EV_KEY = 40, MAX_TS = 4e12;
const evTs = (n) => (Number.isFinite(n) && n > 0 && n <= MAX_TS ? Math.floor(n) : 0);
const fillEv = (e) => {
  const ev = {};
  let n = 0;
  if (isObj(e)) for (const [k, v] of Object.entries(e)) {
    if (!isObj(v) || k === '__proto__' || !k || k.length > EV_KEY) continue;
    if (n++ >= EV_MAX) break;
    ev[k] = { done: evTs(v.done), m: modes(v.m) };
  }
  return ev;
};
const mergeEv = (a, b) => {
  const ev = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const o = Object.hasOwn(ev, k) ? ev[k] : undefined; // toString 같은 상속 이름을 기록으로 잡지 않게
    ev[k] = o ? { done: [o.done, v.done].filter((x) => x > 0).sort((x, y) => x - y)[0] || 0, m: modes(o.m + v.m) } : { ...v };
  }
  return fillEv(ev); // 합친 뒤에도 99개 상한 (다음 채우기와 같은 결과가 되게)
};
const strList = (x) => (Array.isArray(x) ? [...new Set(x.filter((s) => typeof s === 'string' && s && s.length <= 40))].slice(0, 99) : []);
const firstTime = (...xs) => xs.filter((x) => x > 0).sort((x, y) => x - y)[0] || 0;
const JOHN_KEYS = new Set(['ev', 'open', 'lamps', 'signs', 'last', 'mark', 'seen', 'er', 'day', 'pc']);
export function fillJohn(j) {
  j = isObj(j) ? j : {};
  const ev = fillEv(j.ev);
  return {
    ...passUnknown(j, JOHN_KEYS), // 이 판이 모르는 칸 (더 새 판 기기가 더한 것)
    ev, // 마친 사건과 채운 모드 { come: { done: 1730900000000, m: 'lra' }, ... }
    open: typeof j.open === 'string' && j.open ? j.open : JOHN_EVENTS[1], // 지금 열린 큰 줄기 사건 (금빛 기둥). 처음은 '와 보라'
    lamps: Array.isArray(j.lamps) ? [...new Set(j.lamps.filter((x) => typeof x === 'string'))] : [], // 켠 "나는…" 등불
    signs: Math.max(0, j.signs | 0), // 본 표적 수 (표시용)
    last: j.last ? 1 : 0, // 마지막에 요한 마을에 있었으면 1 → 다시 들어오면 빛의 광장에서 시작
    mark: MARKS.includes(j.mark) ? j.mark : '', // '증인' | '졸업' 표지
    seen: Number.isFinite(j.seen) ? j.seen : 0, // 처음 가 본 때 (지도 "마을" 탭에 보임)
    ...fillTownExtras(j), // er 부탁 · day 오늘의 마을 · pc 두루마리 조각 (js/village/town-save.js)
  };
}
// 두 기기 기록 합치기: ev 합집합(같은 사건이면 m 글자 합침, 마친 때는 먼저 것), lamps 합집합, open은 더 뒤의 사건, signs 큰 쪽
//   last는 나중 기록(b, 서버 쪽)을 따름. mark는 더 높은 표지, seen은 먼저 것
export function mergeJohn(a, b) {
  if (!isObj(b)) return fillJohn(a); // 서버(b)에 아직 요한 마을 기록이 없으면 이 기기 것을 그대로 (last를 잃지 않게)
  if (!isObj(a)) return fillJohn(b);
  a = fillJohn(a); b = fillJohn(b);
  const ev = mergeEv(a.ev, b.ev);
  const idx = (id) => JOHN_EVENTS.indexOf(id);
  return {
    ...mergeUnknown(a, b, JOHN_KEYS), // 모르는 칸은 나중 기록(b)
    ev,
    open: idx(b.open) >= idx(a.open) ? b.open : a.open,
    lamps: [...new Set([...a.lamps, ...b.lamps])],
    signs: Math.max(a.signs, b.signs),
    last: b.last,
    mark: MARKS[Math.max(MARKS.indexOf(a.mark), MARKS.indexOf(b.mark))],
    seen: firstTime(a.seen, b.seen),
    ...mergeTownExtras(a, b), // er 합집합(done 먼저·last 늦은 날) · day 늦은 날 · pc 합집합
  };
}

// ---------- 사도행전 마을 기록 (2026-11 0-나, 기획서 acts-village-plan.md 6장) ----------
// 사건 24개의 id와 장 순서 (큰 줄기 'open'은 이 순서에서 더 뒤의 것이 앞섬). 사건은 1차부터 (js/acts/events.js가 이 id를 씀)
//   ① 기다리라 ② 오순절 ③ 날마다 모이는 집 ④ 미문 ⑤ 담대히 ⑥ 일곱 일꾼과 스데반 · ⑦ 사마리아 ⑧ 광야 길의 병거 ⑨ 다메섹 ⑩ 욥바 ⑪ 고넬료
//   ⑫ 안디옥 ⑬ 옥문과 마가의 집 ⑭ 구브로와 루스드라 ⑮ 예루살렘 회의 · ⑯ 드로아 ⑰ 빌립보 ⑱ 베뢰아 ⑲ 아덴 ⑳ 고린도 · ㉑ 에베소 ㉒ 밀레도 ㉓ 풍랑과 멜리데 ㉔ 로마
export const ACTS_EVENTS = [
  'wait', 'pentecost', 'daily', 'gate', 'bold', 'seven', 'samaria', 'chariot', 'damascus', 'joppa', 'cornelius',
  'antioch', 'prison', 'cyprus', 'council', 'troas', 'philippi', 'berea', 'athens', 'corinth', 'ephesus', 'miletus', 'storm', 'rome',
];
// 마을 기록 한 칸 (사도행전 마을의 모양, 기획서 6장): 요한과 같은 규칙을 마을 이름 없이 한 벌로
//   { ev, open, lit, grow, ships, comp, last, mark, seen, er, day, pc } + 이 판이 모르는 칸
//   ev 마친 사건과 채운 모드 · open 열린 큰 줄기 사건 · lit 켠 교회 등불(도시 id) · grow 본 자라남 수 · ships 연 배 노선 id
//   comp 데리고 다니는 동역자 id('' 없음) · last 마지막에 이 마을에 있었으면 1 · mark '증인'|'졸업' · seen 처음 가 본 때
//   요한 마을은 예전 칸 이름(lamps·signs)이 달라 fillJohn·mergeJohn을 그대로 씀 (요한 기록 회귀 위험 없게)
const TOWN_KEYS = new Set(['ev', 'open', 'lit', 'grow', 'ships', 'comp', 'last', 'mark', 'seen', 'er', 'day', 'pc']);
export function fillTown(j, order) {
  j = isObj(j) ? j : {};
  return {
    ...passUnknown(j, TOWN_KEYS),
    ev: fillEv(j.ev),
    open: typeof j.open === 'string' && order.includes(j.open) ? j.open : order[0], // 처음은 첫 사건
    lit: strList(j.lit),
    grow: Math.min(99, Math.max(0, j.grow | 0)),
    ships: strList(j.ships),
    comp: typeof j.comp === 'string' && j.comp.length <= 40 ? j.comp : '',
    last: j.last ? 1 : 0,
    mark: MARKS.includes(j.mark) ? j.mark : '',
    seen: Number.isFinite(j.seen) && j.seen > 0 ? j.seen : 0,
    ...fillTownExtras(j), // er 부탁 · day 오늘의 마을 · pc 두루마리 조각 (js/village/town-save.js)
  };
}
// 두 기기 합치기 (요한과 같은 규칙): ev 합집합(m 글자 합침, done 먼저 것) · lit·ships 합집합 · open 더 뒤 · grow 큰 쪽
//   comp·last는 나중 기록(b, 서버 쪽) · mark 높은 쪽 · seen 먼저 것 · er·day·pc는 town-save.js · 모르는 칸은 b
export function mergeTown(a, b, order) {
  if (!isObj(b)) return fillTown(a, order); // 서버에 아직 이 마을 기록이 없으면 이 기기 것을 그대로 (last를 잃지 않게)
  if (!isObj(a)) return fillTown(b, order);
  a = fillTown(a, order); b = fillTown(b, order);
  const idx = (id) => order.indexOf(id);
  return {
    ...mergeUnknown(a, b, TOWN_KEYS),
    ev: mergeEv(a.ev, b.ev),
    open: idx(b.open) >= idx(a.open) ? b.open : a.open,
    lit: strList([...a.lit, ...b.lit]),
    grow: Math.max(a.grow, b.grow),
    ships: strList([...a.ships, ...b.ships]),
    comp: b.comp,
    last: b.last,
    mark: MARKS[Math.max(MARKS.indexOf(a.mark), MARKS.indexOf(b.mark))],
    seen: firstTime(a.seen, b.seen),
    ...mergeTownExtras(a, b),
  };
}
export const fillActs = (j) => fillTown(j, ACTS_EVENTS);
export const mergeActs = (a, b) => mergeTown(a, b, ACTS_EVENTS);

// 맨 위 칸: 이 판이 아는 칸 (fill이 검사함). 나머지는 그대로 넘김 (더 새 판이 더한 마을 칸 등)
const PROFILE_KEYS = new Set(['v', 'name', 'steps', 'items', 'tut', 'stats', 'train', 'quests', 'dungeon', 'trails', 'warfare', 'garden', 'since', 'coins', 'bag',
  'gear', 'cos', 'pets', 'pet', 'story', 'sold', 'fishDay', 'walletAt', 'john', 'acts', 'met']);

function fill(p = {}) {
  if (!isObj(p)) p = {};
  return {
    ...passUnknown(p, PROFILE_KEYS), // 이 판이 모르는 칸 (옛 판 기기가 새 칸을 지우지 않게)
    v: 1,
    name: typeof p.name === 'string' ? p.name : '',
    steps: p.steps | 0,
    items: Array.isArray(p.items) ? p.items : [],
    tut: p.tut && typeof p.tut === 'object' ? p.tut : {}, // { cafe: 'done' | 'skip', garden: ... }
    stats: Object.fromEntries(STATS.map((x) => [x.id, (p.stats && p.stats[x.id]) | 0])),
    train: p.train && typeof p.train === 'object' ? p.train : {}, // { word: 'basic', ... }
    quests: p.quests && typeof p.quests === 'object' ? p.quests : {}, // 정원의 부탁 { sheep: 'done', ... }
    dungeon: p.dungeon && typeof p.dungeon === 'object' ? p.dungeon : {}, // 이긴 숲길 { exodus: 'clear', ... }
    trails: p.trails && typeof p.trails === 'object' ? p.trails : {}, // 숲길 안내자의 부탁 { pilgrim: 'on' | 'done' }
    warfare: p.warfare && typeof p.warfare === 'object' ? p.warfare : {}, // 영적 전쟁 훈련소에서 이긴 횟수 { tempt: 2, lie: 1, fear: 0, pride: 0, real: 1 }
    garden: p.garden && typeof p.garden === 'object' ? p.garden : {}, // 정원 말씀 체험을 마친 곳 { emmaus: 1, mount: 1, prison: 1, shiloh: 1 }
    since: p.since || null,
    coins: Number.isFinite(p.coins) ? Math.max(0, p.coins | 0) : null, // 지갑 (데나리온 단위). null: 아직 지갑을 받기 전
    bag: p.bag && typeof p.bag === 'object' ? p.bag : {}, // 소모품 { oil: 2, ... }
    gear: p.gear && typeof p.gear === 'object' ? { owned: p.gear.owned || [], worn: p.gear.worn || [] } : { owned: [], worn: [] }, // 전신갑주·등불 (gear.js)
    cos: p.cos && typeof p.cos === 'object' ? { owned: p.cos.owned || [], wing: p.cos.wing || '', mount: p.cos.mount || '', head: p.cos.head || '' } : { owned: [], wing: '', mount: '', head: '' }, // 꾸미기: 날개·탈것·머리 장식 (cosmetic.js)
    pets: p.pets && typeof p.pets === 'object' ? p.pets : {}, // 돌본 동물 { dog: 3, ... } (3이면 길들임)
    pet: typeof p.pet === 'string' ? p.pet : '', // 데리고 다니는 동물
    story: p.story | 0, // 성경 큰 이야기: 마친 장 수
    sold: Array.isArray(p.sold) ? p.sold : [], // 가게에 판 물품 (다른 기기 기록과 합칠 때 되살아나지 않게)
    fishDay: typeof p.fishDay === 'string' ? p.fishDay : '', // 물고기 입의 한 세겔은 하루 한 번
    walletAt: p.walletAt | 0, // 지갑·소모품이 마지막으로 바뀐 때 (두 기기 기록을 합칠 때 새것을 씀)
    john: fillJohn(p.john), // 요한복음 마을 (2026-11): { ev, open, lamps, signs, last, mark, seen, er, day, pc }
    acts: fillActs(p.acts), // 사도행전 마을 (2026-11 0-나): { ev, open, lit, grow, ships, comp, last, mark, seen, er, day, pc }
    met: fillMet(p.met), // 오늘 만난 말씀 (2026-11, met.js): { d, k: [[키, 본 때, 'm'?]], prev }
  };
}

// ---------- 화폐 (성경 시대의 돈) ----------
// 지갑은 데나리온으로 셈. 1 데나리온 = 1 드라크마(하루 품삯, 마 20:2), 1 세겔 = 4, 1 므나 = 100, 1 달란트 = 6000
export const MONEY = [
  { name: '달란트', v: 6000, ref: '마태복음 25:15' },
  { name: '므나', v: 100, ref: '누가복음 19:13' },
  { name: '세겔', v: 4, ref: '마태복음 17:27' },
  { name: '데나리온', v: 1, ref: '마태복음 20:2' },
];
export function fmtMoney(n) {
  n = Math.max(0, n | 0);
  if (!n) return '0 데나리온';
  const out = [];
  for (const m of MONEY) { const k = Math.floor(n / m.v); if (k) { out.push(`${k} ${m.name}`); n -= k * m.v; } }
  return out.join(' ');
}
// 소모품: 가게(루디아)에서 사서 쓰면 없어짐
export const GOODS = {
  oil: { name: '등잔 기름', price: 2, use: '숲길 시험에서 틀린 말씀 하나를 걷어 내요', verse: ['슬기 있는 자들은 그릇에 기름을 담아 등과 함께 가져갔더니', '마태복음 25:4'] },
  loaf: { name: '보리떡', price: 1, use: '숲길에서 넘어져도 그 자리에서 먹고 다시 일어나요', verse: ['여호와의 사자가 또 다시 와서 어루만지며 이르되 일어나서 먹으라 네가 길을 이기지 못할까 하노라 하는지라', '열왕기상 19:7'] },
  fodder: { name: '꼴 한 단', price: 1, use: '들짐승 들판의 동물을 돌볼 때 먹여요 (세 번 돌보면 길들어요)', verse: ['의인은 그 육축의 생명을 돌아보나 악인의 긍휼은 잔인이니라', '잠언 12:10'] },
  spice: { name: '향 한 줌', price: 3, use: '기도할 때 피우면 기도 +1', verse: ['나의 기도가 주의 앞에 분향함과 같이 되며', '시편 141:2'] },
  // 2026-11 둘째: 넓은 정원을 다니기 쉽게
  chariot: { name: '병거 삯', price: 3, use: '고른 곳으로 병거가 데려다줘요 (순간이동). 내 카드의 지갑 아래에서 써요', verse: ['돌아 가는데 병거를 타고 선지자 이사야의 글을 읽더라', '사도행전 8:28'] },
  donkey: { name: '나귀 빌리기', price: 2, use: '2분 동안 나귀를 타고 훨씬 빨리 다녀요', verse: ['이르시되 너희 맞은편 마을로 가라 곧 매인 나귀와 나귀 새끼가 함께 있는 것을 보리니 풀어 내게로 끌고 오너라', '마태복음 21:2'] },
  salve: { name: '안약', price: 2, use: '3분 동안 아직 마치지 않은 부탁과 훈련의 사람 머리 위에 빛기둥이 서서 멀리서도 보여요', verse: ['안약을 사서 눈에 발라 보게 하라', '요한계시록 3:18'] },
};
// 받은 물품을 가게에 팔 때 값 (광주리는 팔지 않음)
export const SELL = (id) => (id === 'basket' || id === 'jn_scroll' ? 0 : ['manna', 'mustard'].includes(id) ? 1 : ['scroll', 'incense', 'bread', 'lamp', 'stake'].includes(id) ? 5 : 3);
const touchWallet = (p) => { p.walletAt = Date.now(); };
export function earn(p, n) { if (p.coins == null) p.coins = 0; p.coins += n; touchWallet(p); saveProfile(p); }
export function spend(p, n) { if ((p.coins | 0) < n) return false; p.coins -= n; touchWallet(p); saveProfile(p); return true; }
export function addGood(p, id, n = 1) { p.bag[id] = (p.bag[id] | 0) + n; touchWallet(p); saveProfile(p); }
export function useGood(p, id) { if (!(p.bag[id] > 0)) return false; p.bag[id] -= 1; if (!p.bag[id]) delete p.bag[id]; touchWallet(p); saveProfile(p); return true; }
export function sellItem(p, id) {
  const v = SELL(id); const i = p.items.indexOf(id);
  if (!v || i < 0) return 0;
  p.items.splice(i, 1); if (!p.sold.includes(id)) p.sold.push(id); if (p.coins == null) p.coins = 0; p.coins += v; touchWallet(p); saveProfile(p);
  return v;
}
// 지갑이 생기기 전에 한 일도 셈해서 처음 한 번 채워 줌
export function openWallet(p) {
  if (p.coins != null) return 0;
  const n = 5 + Object.keys(p.train || {}).length * 5 + Object.keys(p.quests || {}).length * 3 + Object.keys(p.dungeon || {}).length * 5;
  p.coins = n; touchWallet(p); saveProfile(p);
  return n;
}

export function loadProfile() {
  try { return fill(JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { return fill(); }
}
let saveHook = null; // 계정이 있으면 저장할 때마다 서버에도 (account.js)
export const onProfileSave = (f) => { saveHook = f; };
export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 저장 안 되는 환경: 이번 방문 동안만 기억 */ }
  saveHook?.();
}
export function giveItem(p, id) {
  if (!p.items.includes(id)) p.items.push(id);
  if (p.sold?.includes(id)) { p.sold = p.sold.filter((x) => x !== id); touchWallet(p); }
  saveProfile(p);
}
export function addStat(p, id, n) {
  p.stats[id] = (p.stats[id] | 0) + n;
  saveProfile(p);
}
export function addSteps(p, n) {
  const before = stageOf(p.steps);
  p.steps += n;
  saveProfile(p);
  return stageOf(p.steps) !== before ? stageOf(p.steps) : null; // 새 단계에 이르면 그 단계
}
