// 처음 마을 "지금 할 일" 카드 (2026-11 T02 B1): 왼쪽 위 #baseChip (요한 마을 #johnChip과 같은 .vchip 모양)
//   지금 할 일은 위에서부터 첫 번째: 카페 안내 → 정원 안내 → 하던 부탁 → 가 볼 만한 곳(wayguide.suggest) → 오늘도 반가워요
//   하던 부탁이 있으면 📜 #questChip은 숨기고 이 카드 하나만 (quests.js는 그대로, 여기서 감춤)
//   누르면: 부탁 → 부탁 창, 카페 안내 → 바나바가 다가와 안내 시작, 정원 안내 → 가장 가까운 문 밖 안내자에게 걸어감, 그 밖 → 길 안내 고르기 창
//   숨김: 요한 마을 등 다른 마을, 입장 화면, 안내 말풍선(tut.active), 다른 창이 열려 있을 때(busy)
//   T03 A (2026-11-13): 부탁을 하는 동안에도 보임(부탁 말풍선이 열린 때만 숨김). 부탁·가 볼 만한 곳은 누르면 바로 그곳으로 걸어가고,
//   오른쪽 '≡' 단추로 자세히(부탁 창·길 안내 고르기)
import { createChip } from './village/talk.js';
import { walkToward } from './questlog.js';

export function initBaseGuide(K) {
  const { me, profile, tut, wayguide, region, quests, questLog, walkTo, toast, busy, outdoors = () => true } = K;
  // '에스라로', '바울로', '마태로' (받침이 있으면 으로, ㄹ 받침은 로)
  const ro = (w) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  let cur = null;
  let way = null, wayAt = 0; // 가 볼 만한 곳: 바뀐 뒤 10초는 같은 글로 둠 (걸을 때 카드가 깜빡이지 않게)

  function now() {
    if (!profile.name) return null; // 만들기 창이 있음
    if (!profile.tut?.cafe) return { k: 'cafe', t: '카페 안내', h: '바나바에게 말을 걸어요', w: '어디: 카페 입구, 머리 위 ••• 표시' };
    if (!profile.tut?.garden) return outdoors() // 안에 있으면 문 밖으로 나가면 안내자가 마중 나옴 (tutorial.js, T03 B)
      ? { k: 'garden', t: '정원 안내', h: '문 밖 안내자에게 가요', w: '어디: 가까운 문 밖, 머리 위 ••• 표시' }
      : { k: 'garden', t: '정원 안내', h: '문 밖으로 나가 봐요', w: '어디: 문 밖, 안내자가 마중 나와요' };
    const q = quests()?.info?.();
    if (q) return { k: 'quest', t: `부탁 · ${q.name}`, h: q.hint, w: q.where ? `어디: ${q.where}` : '', q };
    const s = wayguide.suggest()[0];
    if (s) {
      const t = performance.now();
      if (!way || (way.label !== s.label && t - wayAt >= 10000)) { way = s; wayAt = t; }
      return { k: 'way', t: '가 볼 만한 곳', h: way.label, w: way.why, p: way.p };
    }
    way = null;
    return { k: 'rest', t: '오늘도 반가워요', h: '쉬다가 걷다가 말씀을 묵상해요', w: '' };
  }

  // 그 자리까지 걸어감 (나무 위·길 못 찾음은 알림만)
  function goTo(p, say) {
    if (!p) return false;
    if (me.climb) { toast('먼저 나무에서 내려와요', 3); return false; }
    if (Math.hypot(p.x - me.x, p.z - me.z) < 1.5) { toast('이미 그곳이에요', 2.5); return true; }
    if (walkToward(me, walkTo, p)) { toast(say, 3); return true; }
    toast('그곳으로 가는 길을 찾지 못했어요. 지도에서 가까운 곳으로 가 보세요', 4);
    return false;
  }
  function press() {
    const c = now();
    if (!c) return;
    if (c.k === 'quest') { // 부탁: 바로 그 자리로 (마쳤으면 부탁한 사람에게)
      const q = c.q;
      if (!q.target) { questLog()?.open('q'); return; }
      const at = q.back || !q.where ? '' : q.where.split(' (')[0]; // 알림은 짧게: 괄호 속 도움말은 뺌
      goTo(q.target, at ? `${at}${ro(at)} 걸어가요` : `${q.name}에게 걸어가요`);
      return;
    }
    if (c.k === 'cafe') { tut.start('cafe'); return; } // 바나바에게는 말 걸기 단추가 없음: 바나바가 다가와 안내를 시작
    if (c.k === 'garden') {
      let best = null, bd = 1e9;
      for (const n of wayguide.tutors()) { const d = Math.hypot(n.x - me.x, n.z - me.z); if (d < bd) { bd = d; best = n; } }
      if (best) goTo(best, `${best.tutName}에게 걸어가요`);
      return;
    }
    if (c.k === 'way' && c.p) { // 카드에 적힌 그곳의 사람에게 바로 ('말씀 훈련장 · 에스라' → 에스라, '목자의 부탁 · 잃은 양' → 목자)
      const who = /^(.+)의 부탁 · /.exec(c.h)?.[1] || c.h.split(' · ').pop();
      goTo(c.p, `${who}에게 걸어가요`);
      return;
    }
    wayguide.openHere();
  }
  // 자세히: 부탁 → 부탁 창(그만두기 포함), 가 볼 만한 곳·쉬기 → 길 안내 고르기
  function more() {
    const c = now();
    if (!c) return;
    if (c.k === 'quest') questLog()?.open('q');
    else if (c.k === 'way' || c.k === 'rest') wayguide.openHere();
  }
  const chip = createChip('baseChip', press);
  chip.el.title = '누르면 그곳으로 걸어가요';
  const moreBtn = document.createElement('button');
  moreBtn.type = 'button'; moreBtn.className = 'more'; moreBtn.setAttribute('aria-label', '자세히 보기'); moreBtn.textContent = '≡';
  moreBtn.addEventListener('pointerdown', (e) => e.stopPropagation()); // 카드 누름(바로 걸어가기)으로 번지지 않게
  moreBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }); // Esc·방향키는 그대로
  moreBtn.addEventListener('click', (e) => { e.stopPropagation(); more(); });

  // 왼쪽 위 칩이 겹치지 않게: 카드 아래로 큰 이야기 칩·두루마리 칩을 내림 (카드보다 위에 있는 칩은 그대로)
  const below = ['storyChip', 'scrollChip'];
  function stack() {
    const on = !chip.el.hidden;
    const base = on ? chip.el.getBoundingClientRect() : null;
    let y = base ? base.bottom + 6 : 0;
    for (const id of below) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.style.top = '';
      if (!on || el.hidden || !el.getClientRects().length) continue;
      const r = el.getBoundingClientRect();
      if (r.top >= base.top && r.top < y) { el.style.top = `${y}px`; y += r.height + 6; } else if (r.top >= base.top) y = Math.max(y, r.bottom + 6);
    }
  }

  let T = 0;
  function step() {
    const home = region()?.here?.() === 'base';
    // 처음 마을에서는 📜 부탁 칩 대신 이 카드
    const qc = document.getElementById('questChip');
    if (qc && home && !qc.hidden) qc.hidden = true;
    const t = performance.now(); // 0.5초마다 (실제 시간: 프레임이 느려도 같게)
    if (t - T < 500) return;
    T = t;
    const show = home && !document.body.classList.contains('at-door') && !tut.active() && !busy();
    if (show && quests()?.talking?.()) cur = null; // 부탁 말풍선이 열린 동안만 숨김 (부탁 진행 중에는 보임)
    else cur = show ? now() : null;
    if (cur) {
      chip.set(cur.t, cur.h, cur.w);
      const go = cur.k === 'quest' || cur.k === 'way', hasMore = go || cur.k === 'rest';
      chip.el.classList.toggle('go', go);
      chip.el.classList.toggle('more', hasMore);
      if (hasMore && moreBtn.parentNode !== chip.el) chip.el.appendChild(moreBtn); // 글이 바뀌면 카드 속이 다시 그려지므로 다시 붙임
      if (!hasMore) moreBtn.remove();
    } else chip.hide();
    stack();
  }

  return { step, now, el: chip.el };
}
