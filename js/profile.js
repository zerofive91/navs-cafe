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
};

function fill(p = {}) {
  return {
    v: 1,
    name: typeof p.name === 'string' ? p.name : '',
    steps: p.steps | 0,
    items: Array.isArray(p.items) ? p.items : [],
    tut: p.tut && typeof p.tut === 'object' ? p.tut : {}, // { cafe: 'done' | 'skip', garden: ... }
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
export function addSteps(p, n) {
  const before = stageOf(p.steps);
  p.steps += n;
  saveProfile(p);
  return stageOf(p.steps) !== before ? stageOf(p.steps) : null; // 새 단계에 이르면 그 단계
}
