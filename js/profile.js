// 나의 캐릭터: 닉네임, 성장 단계, 받은 물품, 안내(튜토리얼)를 마쳤는지
// 이 기기 안(localStorage)에 저장하고, 계정으로 들어와 있으면 서버에도 올림(account.js). 모습(옷·머리 색)은 예전처럼 navs-cafe-look3d에 따로 둠
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
};
// 수레바퀴 다섯 능력치
export const STATS = [
  { id: 'word', name: '말씀', color: '#d8a93a' },
  { id: 'prayer', name: '기도', color: '#9a7ac8' },
  { id: 'fellow', name: '교제', color: '#e08a4a' },
  { id: 'witness', name: '증거', color: '#6aa85a' },
  { id: 'obey', name: '순종', color: '#5a9ad0' },
];

function fill(p = {}) {
  return {
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
    since: p.since || null,
    coins: Number.isFinite(p.coins) ? Math.max(0, p.coins | 0) : null, // 지갑 (데나리온 단위). null: 아직 지갑을 받기 전
    bag: p.bag && typeof p.bag === 'object' ? p.bag : {}, // 소모품 { oil: 2, ... }
    gear: p.gear && typeof p.gear === 'object' ? { owned: p.gear.owned || [], worn: p.gear.worn || [] } : { owned: [], worn: [] }, // 전신갑주·등불 (gear.js)
    pets: p.pets && typeof p.pets === 'object' ? p.pets : {}, // 돌본 동물 { dog: 3, ... } (3이면 길들임)
    pet: typeof p.pet === 'string' ? p.pet : '', // 데리고 다니는 동물
    story: p.story | 0, // 성경 큰 이야기: 마친 장 수
    sold: Array.isArray(p.sold) ? p.sold : [], // 가게에 판 물품 (다른 기기 기록과 합칠 때 되살아나지 않게)
    fishDay: typeof p.fishDay === 'string' ? p.fishDay : '', // 물고기 입의 한 세겔은 하루 한 번
    walletAt: p.walletAt | 0, // 지갑·소모품이 마지막으로 바뀐 때 (두 기기 기록을 합칠 때 새것을 씀)
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
export const SELL = (id) => (id === 'basket' ? 0 : ['manna', 'mustard'].includes(id) ? 1 : ['scroll', 'incense', 'bread', 'lamp', 'stake'].includes(id) ? 5 : 3);
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
