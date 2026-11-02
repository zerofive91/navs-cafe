// 나의 캐릭터: 닉네임, 성장 단계, 받은 물품, 안내(튜토리얼)를 마쳤는지
// 처음에는 이 기기 안(localStorage)에만 저장. 모습(옷·머리 색)은 예전처럼 navs-cafe-look3d에 따로 둠
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
    since: p.since || null,
  };
}

export function loadProfile() {
  try { return fill(JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { return fill(); }
}
export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* 저장 안 되는 환경: 이번 방문 동안만 기억 */ }
}
export function giveItem(p, id) {
  if (!p.items.includes(id)) p.items.push(id);
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
