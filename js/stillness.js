// 머무름 묵상 (2026-11): 쉬는 자리(벤치·의자·빈백·풀밭 등)에 앉아 3초쯤 지나면 작은 '머무르기' 단추가 뜸
//   누르면 1분 / 2분을 고르고, 화면 아래쪽에 숨 고르기 원(들숨 4초 · 멈춤 2초 · 날숨 6초)이 커졌다 작아지며
//   말씀 한 구절이 구(句) 단위로 한 줄씩 천천히 떠오름 (지금 고른 번역). 일어서면 바로 조용히 끝남 (실패 없음)
//   끝까지 머무르면 알림 없이 '오늘 만난 말씀'에 묵상 표시(m)만 남김. 쉼 모드(앉아 가만히)에서는 원이 더 느리고 흐림
//   요한복음 마을 묵상 자리처럼 어디든 "앉아 있음"(me.state·me.seat)만 보므로 마을 코드를 건드리지 않음
import { VERSES, hushVerses } from './verses.js';
import { bibleText, bibleReady } from './bible.js';
import { phrases, markMet, rollMet } from './met.js';

// 쉼 주제 구절 묶음: 오늘 만난 말씀이 없거나 모두 묵상했으면 여기서 (verses.js '머무름 묵상' 구간 + 이미 있던 쉼 구절)
export const REST_KEYS = ['st-ps23', 'still', 'dg-js2', 'st-mt11-29', 'recline2', 'st-ps131-2', 'beanbag', 'recline', 'st-ex33-14', 'st-ps116-7', 'st-is26-3', 'st-ps62-5', 'st-jn14-27'];
const NO_SEAT = new Set(['boat', 'jboat', 'kneel']); // 배 위는 노 젓기·낚시 자리, 무릎 꿇기는 기도 자리라 빼 둠
const BUSY_ACT = new Set(['pray', 'read', 'praise']); // 기도·읽기·찬양 중에는 그 말씀 흐름이 먼저
const BREATH = [4, 2, 6]; // 들숨·멈춤·날숨 (초)
const CYCLE = BREATH[0] + BREATH[1] + BREATH[2];
const CUES = ['들이쉬어요', '잠시 멈춰요', '내쉬어요'];
const FIRST = 5000, MIN_GAP = 5000; // 첫 구는 숨 한 번 고른 뒤, 구 사이는 적어도 5초
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function initStillness({ me, profile, save, busy, rest = () => 0, music, sfx }) {
  let seat = null, sitAt = 0; // 지금 앉은 자리와 앉은 때
  let S = null; // 진행 중인 묵상
  const canSit = () => me.state === 'sit' && !!me.seat && !NO_SEAT.has(me.seat.kind) && !me.climb && !BUSY_ACT.has(me.action);

  // ---------- 1분 / 2분 고르기 ----------
  const pick = document.createElement('div');
  pick.id = 'stillPick'; pick.hidden = true;
  pick.setAttribute('role', 'dialog'); pick.setAttribute('aria-label', '머무르기');
  pick.innerHTML = `<p class="t">잠시 머물러요</p><p class="s">숨을 고르며 말씀 한 구절과 함께 · 일어서면 언제든 끝나요</p>
    <div class="row"><button data-sec="60">1분</button><button data-sec="120">2분</button><button class="x" data-sec="0">그만</button></div>`;
  pick.addEventListener('pointerdown', (e) => e.stopPropagation());
  pick.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-sec]'); if (!b) return;
    const sec = +b.dataset.sec;
    closePick();
    if (sec) start(sec);
  });
  document.body.appendChild(pick);
  function openPick() { pick.hidden = false; setTimeout(() => pick.querySelector('button')?.focus({ preventScroll: true }), 30); }
  function closePick() { pick.hidden = true; }

  // ---------- 묵상 화면 ----------
  const el = document.createElement('div');
  el.id = 'still'; el.hidden = true;
  // 화면 읽기: 숨 안내(2~6초마다 바뀜)와 원은 읽지 않고, 말씀 줄과 출처만 읽음
  el.innerHTML = `<div class="breath" aria-hidden="true"><i></i></div><p class="cue" aria-hidden="true"></p><div class="lines" aria-live="polite"></div><cite aria-live="polite"></cite>`;
  document.body.appendChild(el);
  const ring = el.querySelector('.breath i'), cueEl = el.querySelector('.cue'), linesEl = el.querySelector('.lines'), citeEl = el.querySelector('cite');

  // 오늘 만난 말씀 가운데 아직 묵상하지 않은 것 → 없으면 쉼 묶음 (오늘 묵상한 것은 빼고). 시간 안에 다 떠오를 길이만
  function choose(sec) {
    const maxN = Math.floor((sec * 1000 - FIRST - 4000) / MIN_GAP);
    const fits = (k) => VERSES[k] && phrases(VERSES[k][0]).length <= maxN;
    rollMet(profile.met);
    const done = new Set(profile.met.k.filter((x) => x[2] === 'm').map((x) => x[0]));
    const met = profile.met.k.map((x) => x[0]).filter((k) => !done.has(k) && fits(k));
    const pool = met.length ? met : REST_KEYS.filter((k) => !done.has(k) && fits(k));
    const list = pool.length ? pool : REST_KEYS.filter(fits);
    return list[Math.floor(Math.random() * list.length)];
  }

  async function start(sec) {
    if (S || !canSit()) return;
    const key = choose(sec);
    if (!key) return;
    const at = me.seat;
    await bibleReady(); // 현대어 짝을 불러온 뒤 구로 나눔
    if (S || !canSit() || me.seat !== at) return;
    const [text, ref] = VERSES[key];
    const lines = phrases(bibleText(text));
    const now = performance.now();
    S = { key, sec, seat: at, t0: now, last: now, ph: 0, lines, shown: 0, gap: Math.max(MIN_GAP, Math.min(CYCLE * 1000, (sec * 1000 - FIRST - CYCLE * 1000) / lines.length)), cue: -1, cited: false };
    S.nextAt = now + FIRST;
    linesEl.innerHTML = ''; citeEl.textContent = ref; citeEl.classList.remove('on'); cueEl.textContent = '';
    el.classList.remove('bye'); el.hidden = false;
    requestAnimationFrame(() => el.classList.add('on'));
    hushVerses(true); document.body.classList.add('stilling'); music?.duck(true);
  }
  // done: 끝까지 머무름 → 묵상 표시. 아니면 조용히 닫기만
  function end(done) {
    if (!S) return;
    const s = S; S = null;
    hushVerses(false); document.body.classList.remove('stilling'); music?.duck(false);
    el.classList.remove('on'); el.classList.add('bye');
    setTimeout(() => { if (!S) { el.hidden = true; linesEl.innerHTML = ''; } }, done ? 2400 : 900);
    if (done) { markMet(profile.met, s.key); save(); }
  }

  function run(now) {
    const dtm = Math.min(250, now - S.last); S.last = now;
    const k = Math.max(0, Math.min(1, rest())); // 쉼 모드 깊이 0..1
    S.ph = (S.ph + dtm / (CYCLE * 1000 * (1 + 0.3 * k))) % 1; // 쉼 모드에서는 숨이 더 느림
    const u = S.ph * CYCLE;
    let s, c;
    if (u < BREATH[0]) { s = ease(u / BREATH[0]); c = 0; } else if (u < BREATH[0] + BREATH[1]) { s = 1; c = 1; } else { s = 1 - ease((u - BREATH[0] - BREATH[1]) / BREATH[2]); c = 2; }
    ring.style.transform = `scale(${(0.5 + 0.5 * s).toFixed(3)})`;
    ring.style.opacity = ((0.6 + 0.35 * s) * (1 - 0.3 * k)).toFixed(3); // 쉼 모드에서는 흐리게
    if (c !== S.cue) { S.cue = c; cueEl.textContent = CUES[c]; }
    if (S.shown < S.lines.length && now >= S.nextAt) {
      const p = document.createElement('p'); p.textContent = S.lines[S.shown++];
      linesEl.appendChild(p);
      const all = linesEl.children; // 가장 최근 세 줄만, 앞줄은 흐리게
      for (let i = 0; i < all.length; i++) { all[i].classList.toggle('gone', i < all.length - 3); all[i].classList.toggle('old', i < all.length - 1); }
      requestAnimationFrame(() => p.classList.add('in'));
      S.nextAt = now + S.gap;
    }
    if (!S.cited && S.shown === S.lines.length && now >= S.nextAt - S.gap + 3000) { S.cited = true; citeEl.classList.add('on'); }
    if (now - S.t0 >= S.sec * 1000) end(true);
  }

  return {
    actions: { stay: () => { if (S) end(false); else if (!pick.hidden) closePick(); else { sfx?.('orb', 0.06, 0.8); openPick(); } } },
    available: () => (S || !pick.hidden || (seat && performance.now() - sitAt > 3000 && !busy()) ? ['stay'] : []),
    step() {
      const now = performance.now();
      if (canSit()) { if (me.seat !== seat) { seat = me.seat; sitAt = now; } } else seat = null;
      if (!pick.hidden && (!seat || busy())) closePick();
      if (S && (!canSit() || me.seat !== S.seat || busy())) end(false); // 일어서거나 다른 창이 열리면 조용히 끝
      else if (S) run(now);
    },
    active: () => !!S || !pick.hidden,
    running: () => !!S,
    end: () => end(false),
  };
}
