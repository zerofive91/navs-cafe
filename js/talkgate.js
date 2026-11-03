// 말 걸기 (2026-11-03, 사용자 요청): 곁에 가도 저절로 말을 걸지 않음.
// 각 모듈은 말을 걸 수 있는 사람 곁에 있을 때 매 프레임 offerTalk를 부르고,
// 플레이어가 '말 걸기' 단추(E)를 누르거나 그 사람을 누르면 그때 대화가 열림
const offers = new Map(); // key → { who: {x, z, av}, open, t }
const FRESH = 1500; // ms: 그 사이 다시 부르지 않으면 곁을 떠난 것

export function offerTalk(key, who, open) {
  offers.set(key, { who, open, t: performance.now() });
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
// 말 걸기: who를 주면 그 사람에게, 아니면 가장 가까운 사람에게
export function pressTalk(me, who = null) {
  const o = who ? fresh().find((x) => x.who === who) : talkOffer(me);
  if (!o) return false;
  offers.clear();
  o.open();
  return true;
}
