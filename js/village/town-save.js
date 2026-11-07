// 마을 공용 저장 칸 (2026-11, 요한복음 마을 채우기 E1): 부탁(er) · 오늘의 마을(day) · 두루마리 조각(pc)
//   요한 마을은 profile.john에, 뒤에 사도행전 마을은 profile.acts에 같은 모양으로 둠. fillJohn·mergeJohn(profile.js)이 이 함수를 부름
//   그림·장면 모듈을 부르지 않는 가벼운 파일 (profile.js·account.js가 불러도 순환 import가 생기지 않게)
//
//   er:  { 'cana-wash': { done: 1730900000000, last: '2026-11-07' } }  부탁: done 처음 마친 때, last 마지막으로 마친 날(기기 날짜)
//   day: { d: '2026-11-07', got: 'abc', run: 3, best: 5 }               오늘의 마을(E3): 그날 · 그날 한 일 글자 · 이어 한 날 · 가장 길게 이은 날
//   pc:  [1, 2, 4, 9]                                                   주운 두루마리 조각(E5): 장 번호
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (s) => (typeof s === 'string' && DAY.test(s) ? s : '');
const int0 = (n) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
const letters = (s) => [...new Set(String(s || '').toLowerCase().split(''))].filter((c) => c >= 'a' && c <= 'z').sort().join('');
const first = (...xs) => xs.filter((x) => x > 0).sort((a, b) => a - b)[0] || 0;
const later = (a, b) => (a > b ? a : b); // 'YYYY-MM-DD'는 글자 순서가 곧 날짜 순서

export function fillEr(er) {
  const out = {};
  if (isObj(er)) for (const [k, v] of Object.entries(er)) if (isObj(v)) out[k] = { done: int0(v.done), last: day(v.last) };
  return out;
}
export function fillDay(d) {
  if (!isObj(d)) return { d: '', got: '', run: 0, best: 0 };
  const run = int0(d.run);
  return { d: day(d.d), got: letters(d.got), run, best: Math.max(run, int0(d.best)) };
}
export function fillPc(pc) {
  return Array.isArray(pc) ? [...new Set(pc.filter((n) => Number.isInteger(n) && n >= 1 && n <= 99))].sort((a, b) => a - b) : [];
}
// 마을 기록에 세 칸을 채움 (없으면 빈 칸)
export const fillTownExtras = (j) => ({ er: fillEr(j?.er), day: fillDay(j?.day), pc: fillPc(j?.pc) });

// 두 기기 기록 합치기
//   er: 합집합. 같은 부탁이면 done은 먼저 것, last는 늦은 날
//   day: 늦은 날(d) 쪽을 씀. 같은 날이면 got 글자를 합치고 run은 큰 쪽. best는 언제나 큰 쪽(run보다 작지 않게)
//   pc: 합집합
export function mergeEr(a, b) {
  a = fillEr(a); b = fillEr(b);
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) { const o = out[k]; out[k] = o ? { done: first(o.done, v.done), last: later(o.last, v.last) } : { ...v }; }
  return out;
}
export function mergeDay(a, b) {
  a = fillDay(a); b = fillDay(b);
  let d, got, run;
  if (a.d === b.d) { d = a.d; got = letters(a.got + b.got); run = Math.max(a.run, b.run); }
  else { const n = a.d > b.d ? a : b; ({ d, got, run } = n); }
  return { d, got, run, best: Math.max(a.best, b.best, run) };
}
export const mergePc = (a, b) => fillPc([...fillPc(a), ...fillPc(b)]);
export const mergeTownExtras = (a, b) => ({ er: mergeEr(a?.er, b?.er), day: mergeDay(a?.day, b?.day), pc: mergePc(a?.pc, b?.pc) });
