// 말 걸기 (2026-11-03, 사용자 요청): 곁에 가도 저절로 말을 걸지 않음.
// 각 모듈은 말을 걸 수 있는 사람 곁에 있을 때 매 프레임 offerTalk를 부르고,
// 플레이어가 '말 걸기' 단추(E)를 누르거나 그 사람을 누르면 그때 대화가 열림
const offers = new Map(); // key → { who: {x, z, av}, open, t }
const FRESH = 1500; // ms: 그 사이 다시 부르지 않으면 곁을 떠난 것

// opt.auto: 안내 캐릭터 (곁에 와서 멈추면 먼저 말을 걺, autoTalk)
export function offerTalk(key, who, open, opt) {
  offers.set(key, { who, open, t: performance.now(), auto: !!opt?.auto });
}
function fresh() {
  const now = performance.now();
  for (const [k, o] of offers) if (now - o.t > FRESH) offers.delete(k);
  return [...offers.values()];
}
// 가장 가까운 말 걸 사람 (없으면 null)
export function talkOffer(me) {
  let best = null, bd = Infinity;
  for (const o of fresh()) { const d = Math.hypot(me.x - o.who.x, me.z - o.who.z); if (d < bd) { bd = d; best = o; } }
  return best;
}
// 안내 캐릭터가 먼저 말 걸기 (T03 C, 2026-11-13 사용자 요청: 2026-11-03 결정을 안내 캐릭터에 한해 바꿈)
//   문 밖 안내자·숲길 안내자·수레 안내인·마을 안내자만 (offerTalk(..., { auto: true })). 부탁 인물·증인·훈련 사부·가게는 그대로 누를 때만
//   귀찮지 않게: 곁에서 걷지 않고 0.6초 머물 때만 · 같은 사람은 한 접속에 한 번 · 저절로 말 걸기 사이 30초 (시범값)
const AUTO_STAY = 600, AUTO_GAP = 30000;
const autoSaid = new Set(); // 이번 접속에서 이미 먼저 말을 건 사람 (key)
const stayAt = new Map(); // key → 곁에 멈춰 선 때
let autoLast = -Infinity;
// 다른 길로 이미 말을 나눈 사람 (예: 정원 안내를 해 준 안내자): 이번 접속에선 먼저 걸지 않고, 30초 간격도 지금부터
export function markAutoSaid(key) { autoSaid.add(key); autoLast = performance.now(); }
// 매 프레임: ok = 다른 창·안내·사진·나무 위가 아님. 말을 걸었으면 true
export function autoTalk(me, ok) {
  const now = performance.now();
  if (!ok || me.state === 'walk') { stayAt.clear(); return false; }
  fresh();
  for (const k of [...stayAt.keys()]) if (!offers.get(k)?.auto) stayAt.delete(k);
  if (now - autoLast < AUTO_GAP) return false;
  for (const [k, o] of offers) {
    if (!o.auto || autoSaid.has(k)) continue;
    if (!stayAt.has(k)) { stayAt.set(k, now); continue; }
    if (now - stayAt.get(k) < AUTO_STAY) continue;
    autoSaid.add(k); autoLast = now; stayAt.clear();
    offers.clear();
    o.open();
    return true;
  }
  return false;
}
// 말 걸기: who를 주면 그 사람에게, 아니면 가장 가까운 사람에게
export function pressTalk(me, who = null) {
  const o = who ? fresh().find((x) => x.who === who) : talkOffer(me);
  if (!o) return false;
  offers.clear();
  o.open();
  return true;
}
