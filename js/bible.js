// 말씀 번역 고르기 (2026-11): 개역한글(원문) / AI 현대어
//   게임 속 말씀은 모두 개역한글(1961)로 쓰여 있음. "AI 현대어"를 고르면 화면에 나오는 글 가운데
//   개역한글 구절을 찾아 오늘의 말로 풀어 쓴 문장(js/bible-modern.js)으로 바꿔 보여 줌 (공식 번역 아님)
//   이 기기에만 저장(localStorage). 말씀 창·말풍선·알림·카드 어디든 같은 방식으로 바뀜
const KEY = 'navs-cafe-bible';
let mode = 'krv';
try { mode = localStorage.getItem(KEY) === 'modern' ? 'modern' : 'krv'; } catch (e) { /* 저장소를 못 쓰면 개역한글 */ }
let pairs = null; // [개역한글, 현대어] (긴 것부터)
const orig = new WeakMap(); // 바꾼 글자 노드의 원래 글 (개역한글로 되돌릴 때)
const shown = new WeakMap(); // 내가 바꿔 넣은 글
const listeners = new Set();

export const bibleMode = () => mode;
export const BIBLE_NAME = { krv: '개역한글', modern: 'AI 현대어' };
export function onBible(fn) { listeners.add(fn); }

function swap(t) {
  if (!pairs || t.length < 6) return t;
  let out = t;
  for (const [k, m] of pairs) if (out.includes(k)) out = out.split(k).join(m);
  return out;
}
function fix(node) {
  if (mode !== 'modern' || !pairs) return;
  if (node.nodeType === 3) {
    const t = node.nodeValue;
    if (shown.get(node) === t) return; // 내가 바꿔 넣은 글
    if (!t || t.length < 6 || !/[가-힣]/.test(t)) return;
    const s = swap(t);
    if (s !== t) { orig.set(node, t); shown.set(node, s); node.nodeValue = s; } else if (orig.has(node) && orig.get(node) !== t) orig.delete(node); // 새 글로 바뀌었으면 옛 원문은 버림
    return;
  }
  if (node.nodeType !== 1 || node.closest?.('script,style,textarea,input')) return;
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const list = []; for (let n = w.nextNode(); n; n = w.nextNode()) list.push(n);
  list.forEach(fix);
}
function restore(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) if (orig.has(n) && shown.get(n) === n.nodeValue) { n.nodeValue = orig.get(n); orig.delete(n); shown.delete(n); }
}
const obs = new MutationObserver((ms) => {
  if (mode !== 'modern') return;
  for (const m of ms) {
    if (m.type === 'characterData') fix(m.target);
    else m.addedNodes.forEach(fix);
  }
});
async function load() {
  if (pairs) return;
  const { MODERN } = await import('./bible-modern.js');
  pairs = [...MODERN].sort((a, b) => b[0].length - a[0].length);
}
export async function setBible(m) {
  mode = m === 'modern' ? 'modern' : 'krv';
  try { localStorage.setItem(KEY, mode); } catch (e) { /* 이번만 */ }
  if (mode === 'modern') { await load(); fix(document.body); } else restore(document.body);
  listeners.forEach((f) => f(mode));
}
// 처음: 몸통이 생긴 뒤 지켜보기 시작
function start() {
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  if (mode === 'modern') load().then(() => fix(document.body));
}
if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
