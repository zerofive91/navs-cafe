// 마을 공용 저장 칸 (2026-11, 요한복음 마을 채우기 E1): 부탁(er) · 오늘의 마을(day) · 두루마리 조각(pc)
//   요한 마을은 profile.john에, 뒤에 사도행전 마을은 profile.acts에 같은 모양으로 둠. fillJohn·mergeJohn(profile.js)이 이 함수를 부름
//   그림·장면 모듈을 부르지 않는 가벼운 파일 (profile.js·account.js가 불러도 순환 import가 생기지 않게)
//
//   er:  { 'cana-wash': { done: 1730900000000, last: '2026-11-07' } }  부탁: done 처음 마친 때, last 마지막으로 마친 날(기기 날짜)
//   day: { d: '2026-11-07', got: 'abc', s: '2026-11-05', best: 5 }     오늘의 마을(E3): 그날 · 그날 한 일 글자 · 이어 한 첫날 · 가장 길게 이은 날 수
//        (하루 몫 a·b·c 셋을 다 한 날이 "한 날". s부터 이어 한 마지막 날까지가 연속. 연속 일수는 저장하지 않고 s와 날짜로 셈 → 두 기기를 합칠 때 구간을 이을 수 있음)
//   pc:  [1, 2, 4, 9]                                                   주운 두루마리 조각(E5): 장 번호
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (s) => (typeof s === 'string' && DAY.test(s) ? s : '');
const int0 = (n) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
const letters = (s) => [...new Set(String(s || '').toLowerCase().split(''))].filter((c) => c >= 'a' && c <= 'z').sort().join('');
const first = (...xs) => xs.filter((x) => x > 0).sort((a, b) => a - b)[0] || 0;
const later = (a, b) => (a > b ? a : b); // 'YYYY-MM-DD'는 글자 순서가 곧 날짜 순서
// 상한: 손상되거나 지어낸 기록이 계정 저장 크기(서버 200KB)를 넘겨 저장이 조용히 실패하지 않게
export const ER_MAX_KEYS = 200, ER_MAX_KEY = 40;
const MAX_TS = 4e12; // 시각(ms) 상한 (서기 2096년쯤). 넘으면 0
const ts = (n) => (Number.isFinite(n) && n > 0 && n <= MAX_TS ? Math.floor(n) : 0);
const small = (n) => Math.min(9999, int0(n)); // 이어 한 날 수

export function fillEr(er) {
  const out = {};
  if (!isObj(er)) return out;
  let n = 0;
  for (const [k, v] of Object.entries(er)) {
    if (n >= ER_MAX_KEYS) break;
    if (!isObj(v) || !k || k.length > ER_MAX_KEY || k === '__proto__') continue;
    out[k] = { done: ts(v.done), last: day(v.last) }; n++;
  }
  return out;
}
// ---------- 오늘의 마을 날짜 셈 (연속 구간 [s, 끝날]) ----------
//   끝날 = 그날 일을 다 했으면 d, 아직이면 어제(s가 있을 때만). 곧 s ≤ 어제 < d 이거나 s ≤ d(다 한 날)
export const DAILY = 'abc'; // 하루 몫 셋: a 이야기 · b 부탁 · c 머무름
const isFull = (got) => [...DAILY].every((c) => got.includes(c));
const toUtc = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const addDays = (s, n) => { const t = new Date(toUtc(s) + n * 864e5); return `${String(t.getUTCFullYear()).padStart(4, '0')}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
const span = (a, b) => Math.round((toUtc(b) - toUtc(a)) / 864e5); // b - a (일)
function pad(n) { return String(n).padStart(2, '0'); }
export const localToday = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
// 이어 한 마지막 날 ('' = 이어 한 날이 없음)
export const streakEnd = (x) => (!x || !x.d ? '' : isFull(x.got) ? x.d : x.s ? addDays(x.d, -1) : '');
// 이어 한 날 수 (끝날이 오늘이나 어제일 때만. 그보다 오래되면 끊김 = 0)
export function streakRun(x, today) {
  const e = streakEnd(x);
  return e && (e === today || e === addDays(today, -1)) ? Math.min(9999, span(x.s, e) + 1) : 0;
}
export function fillDay(x) {
  if (!isObj(x)) return { d: '', got: '', s: '', best: 0 };
  const d = day(x.d);
  if (!d) return { d: '', got: '', s: '', best: small(x.best) };
  const got = letters(x.got).split('').filter((c) => DAILY.includes(c)).join('');
  let s = day(x.s);
  // 연속 시작일은 그날(다 한 날) 또는 어제(아직이면) 이전이어야 함. 맞지 않으면 버림 (다 한 날이면 그날부터)
  if (s && s > (isFull(got) ? d : addDays(d, -1))) s = '';
  if (!s && isFull(got)) s = d;
  const out = { d, got, s, best: small(x.best) };
  out.best = Math.max(out.best, s ? Math.min(9999, span(s, streakEnd(out)) + 1) : 0);
  return out;
}
// 다른 날로 넘김: 어제까지 이어 했으면 s를 이어 가고, 아니면 끊음 (그날 한 일 글자는 비움)
export function rollDay(x, today) {
  x = fillDay(x);
  if (x.d === today) return x;
  const e = streakEnd(x);
  return { d: today, got: '', s: e && e === addDays(today, -1) ? x.s : '', best: x.best };
}
// 일을 한 것으로 적음 (keys: 'a'·'b'·'c' 글자들). full: 이 호출로 하루 몫을 처음 다 함, run: 지금 연속 일수
export function markDay(x, keys, today) {
  const cur = rollDay(x, today), was = isFull(cur.got);
  const day2 = fillDay({ ...cur, got: letters(cur.got + keys) });
  return { day: day2, full: !was && isFull(day2.got), run: streakRun(day2, today) };
}
export const dayFull = (x) => !!x && isFull(x.got);
export function fillPc(pc) {
  return Array.isArray(pc) ? [...new Set(pc.filter((n) => Number.isInteger(n) && n >= 1 && n <= 99))].sort((a, b) => a - b) : [];
}
// 마을 기록에 세 칸을 채움 (없으면 빈 칸)
export const fillTownExtras = (j) => ({ er: fillEr(j?.er), day: fillDay(j?.day), pc: fillPc(j?.pc) });

// 두 기기 기록 합치기
//   er: 합집합. 같은 부탁이면 done은 먼저 것, last는 늦은 날
//   day: 늦은 날(d) 쪽을 씀. 같은 날이면 got 글자를 합치고, 연속은 구간(s~끝날)을 이어 붙임 (아래 mergeDay)
//   pc: 합집합
export function mergeEr(a, b) {
  a = fillEr(a); b = fillEr(b);
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) { const o = out[k]; out[k] = o ? { done: first(o.done, v.done), last: later(o.last, v.last) } : { ...v }; }
  return fillEr(out); // 합친 뒤에도 개수 상한
}
// 오늘의 마을 합치기: 날짜는 늦은 쪽(d), 같은 날이면 got 글자를 합침. 연속은 두 기기의 구간 [s, 끝날]이 겹치거나 맞닿으면 이어 붙임
//   (맞닿지 않으면 끝날이 늦은 쪽). 오늘+1일보다 뒤 날짜 기록은 시계가 틀린 것으로 보고 무시. best는 언제나 큰 쪽
export function mergeDay(a, b, today = localToday()) {
  a = fillDay(a); b = fillDay(b);
  const lim = addDays(today, 1), best = Math.max(a.best, b.best);
  const xs = [a, b].filter((x) => x.d && x.d <= lim);
  if (!xs.length) return { d: '', got: '', s: '', best };
  const d = xs.reduce((m, x) => (x.d > m ? x.d : m), '');
  const got = letters(xs.filter((x) => x.d === d).map((x) => x.got).join(''));
  // 구간을 시작일 순으로 이어 붙이고, 끝날이 가장 늦은 묶음을 씀
  const ivs = xs.filter((x) => x.s).map((x) => ({ s: x.s, e: streakEnd(x) })).sort((p, q) => (p.s < q.s ? -1 : p.s > q.s ? 1 : 0));
  let iv = null;
  for (const v of ivs) {
    if (iv && v.s <= addDays(iv.e, 1)) iv = { s: iv.s, e: later(iv.e, v.e) };
    else if (!iv || v.e > iv.e) iv = { ...v };
  }
  // 그날(또는 어제)까지 이어진 구간만 살림. 그날 일을 다 했는데 구간이 없으면 fillDay가 그날부터 시작
  const s = iv && iv.e >= addDays(d, -1) ? iv.s : '';
  return fillDay({ d, got, s, best });
}
export const mergePc = (a, b) => fillPc([...fillPc(a), ...fillPc(b)]);
export const mergeTownExtras = (a, b) => ({ er: mergeEr(a?.er, b?.er), day: mergeDay(a?.day, b?.day), pc: mergePc(a?.pc, b?.pc) });
