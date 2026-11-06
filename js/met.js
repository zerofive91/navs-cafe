// 오늘 만난 말씀 (2026-11): 화면에 떠오른 말씀(showVerse)을 하루 단위로 모아 둠 → 내 카드 '오늘 말씀' 탭, 머무름 묵상
//   profile.met = { d: 'YYYY-MM-DD', k: [['키', 처음 본 때(ms), 'm'(묵상함) | ''], …], prev: { d, k } | null }
//   하루 최대 40개. 날짜가 바뀌면 그날 것은 prev(하루치만)로 밀고, 그 전 것은 버림
//   어디서 만났는지는 키 앞글자(dg- 숲길, jn- 요한복음 마을 …)로 알 수 있어 따로 적지 않음
//   DOM을 쓰지 않아 node로 바로 시험할 수 있음
export const MET_MAX = 40;
const pad = (n) => String(n).padStart(2, '0');
export const dayOf = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);

// 한 날의 목록 다듬기: 같은 키는 하나로 (처음 본 때는 이른 것, 묵상 표시는 어느 한쪽에라도 있으면), 본 때 순서, 40개까지
function cleanList(list) {
  const by = new Map();
  for (const x of Array.isArray(list) ? list : []) {
    if (!Array.isArray(x) || typeof x[0] !== 'string' || !x[0]) continue;
    const ts = Number.isFinite(x[1]) ? x[1] : 0, m = String(x[2] || '').includes('m');
    const o = by.get(x[0]);
    if (!o) by.set(x[0], [x[0], ts, m ? 'm' : '']);
    else { if (ts && (!o[1] || ts < o[1])) o[1] = ts; if (m) o[2] = 'm'; }
  }
  return [...by.values()].sort((a, b) => a[1] - b[1]).slice(0, MET_MAX);
}
const fillDay = (x) => (isObj(x) && isDay(x.d) ? { d: x.d, k: cleanList(x.k) } : null);
export function fillMet(m) {
  m = isObj(m) ? m : {};
  const prev = fillDay(m.prev);
  return { d: isDay(m.d) ? m.d : '', k: isDay(m.d) ? cleanList(m.k) : [], prev: prev && prev.d !== m.d ? prev : null };
}

// 날짜가 바뀌었으면 넘김. 바뀌었으면 true
export function rollMet(met, today = dayOf()) {
  if (met.d === today) return false;
  if (met.d && met.k.length) met.prev = { d: met.d, k: met.k };
  met.d = today; met.k = [];
  return true;
}
// 만난 말씀 하나 적기. 이미 오늘 만난 것이면 처음 본 때를 그대로 둠. 바뀐 게 있으면 true
export function recordMet(met, key, ts = Date.now(), today = dayOf(ts)) {
  let changed = rollMet(met, today);
  if (!key || met.k.some((x) => x[0] === key) || met.k.length >= MET_MAX) return changed;
  met.k.push([key, ts, '']);
  return true;
}
// 머무름 묵상을 마친 말씀에 표시 (오늘 목록에 없으면 더함. 40개가 찼으면 묵상하지 않은 가장 나중 것을 비켜 냄)
export function markMet(met, key, ts = Date.now(), today = dayOf(ts)) {
  rollMet(met, today);
  const o = met.k.find((x) => x[0] === key);
  if (o) { o[2] = 'm'; return true; }
  if (met.k.length >= MET_MAX) {
    let i = met.k.length - 1; while (i >= 0 && met.k[i][2] === 'm') i--;
    if (i < 0) return false;
    met.k.splice(i, 1);
  }
  met.k.push([key, ts, 'm']);
  return true;
}

// 두 기기 기록 합치기: 날짜별로 모아 같은 날은 키 합집합(이른 때, 묵상 표시는 합침),
//   가장 늦은 날이 d·k, 그다음 날이 prev, 나머지는 버림. b(서버)에 met이 없으면 a(이 기기) 그대로
export function mergeMet(a, b) {
  if (!isObj(b)) return fillMet(a);
  if (!isObj(a)) return fillMet(b);
  a = fillMet(a); b = fillMet(b);
  const days = new Map();
  for (const x of [a, a.prev, b, b.prev]) {
    if (!x || !x.d) continue;
    days.set(x.d, [...(days.get(x.d) || []), ...x.k]);
  }
  const order = [...days.keys()].sort().reverse();
  if (!order.length) return { d: '', k: [], prev: null };
  const [d0, d1] = order;
  return { d: d0, k: cleanList(days.get(d0)), prev: d1 ? { d: d1, k: cleanList(days.get(d1)) } : null };
}

// 구(句) 나누기: 말씀을 숨 한 번에 읽을 만한 마디로 (쉼표·이음 어미에서 끊고, 너무 짧은 마디는 붙임)
const BREAK = /[,，.!?]$|(?:며|고|니|되|매|나|여|면|서|요|라|다|어|아|야|늘|니라|도다|이다|리라|지라|거늘|찌어다|지어다)$/;
export function phrases(text, min = 8, max = 22) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && next.length > max && !(BREAK.test(w) && next.length <= max + 6)) { out.push(cur); cur = w; continue; } // 마디 끝 낱말이면 조금 넘어도 붙임
    cur = next;
    if (cur.length >= min && BREAK.test(w)) { out.push(cur); cur = ''; }
  }
  if (cur) { if (out.length && cur.length <= 5) out[out.length - 1] += ' ' + cur; else out.push(cur); } // 끝에 남은 짧은 마디는 앞줄에 붙임
  return out;
}

// 어디서 만난 말씀인지 (키 앞글자로)
export function metPlace(key) {
  if (key.startsWith('dg-')) return '숲길';
  if (key.startsWith('jn-')) return '요한복음 마을';
  if (key.startsWith('gd-')) return '정원 말씀 체험';
  if (key.startsWith('st-')) return '머무름';
  if (key.startsWith('l-')) return '정원 쉼';
  return '';
}
