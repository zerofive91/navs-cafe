// 마을 사건 말풍선·속삭임·진행 칩 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   createTalk: 증인 말풍선 (사건·시험·모드·부탁이 함께 씀). spec = { who, sub, text, quote(구절 키), note, opts[{t, ok, why}], buttons[{t, cls, keep, fn}], extra(요소), dark(시험), onPick, onClose }
//   createWhisper: 걸으며 하는 시험의 속삭임 한 줄 · createChip: 왼쪽 위 "지금 할 일" 카드 (누르면 부탁 창, 말줄임 없이 접혀 보임)
//   spec.badge: '하인' → 머리 줄에 "오늘 나는 하인" 배지 (2026-11 T02 S6, 사건 자료 role. 없으면 배지 없음)
//   spec.soft: 시험(옵션 고르기)의 "가벼운" 모양 — 어두운 보라 말풍선(dark) 대신 따뜻한 말풍선(.soft, 금빛 테두리). 기쁜 장면용. 닫으면 다시 열리는 것·말씀 카드 숨김은 dark와 같음
//   id는 마을마다 (요한: #jtalk · #jwhisper · #johnChip). 한 화면에 마을 엔진이 여럿이라 id가 겹치지 않게 마을이 정함
//   모양(css/style.css)은 class 기준: 말풍선 'npcb jn', 속삭임 .vwhisper, 칩 .vchip → 새 마을은 새 id만 주면 CSS를 베끼지 않아도 됨
import { VERSES } from '../verses.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createTalk({ id, cls }) {
  const box = document.createElement('div');
  box.className = cls; box.id = id; box.hidden = true;
  document.body.appendChild(box);
  let spec = null;
  const ui = {
    open(s) {
      // 열린 말풍선을 새 말풍선이 덮으면 앞 것의 onClose를 먼저 (onClose(true): 덮여서 닫힘. 이야기 줄은 덮인 글을 줄 앞에 되돌려 넣음, T02-R1 J-4)
      while (spec && spec !== s) { const prev = spec; spec = null; prev.onClose?.(true); } // onClose가 곧바로 연 것이 있으면 그것도
      spec = s;
      box.className = cls + (s.dark ? ' trial' : '') + (s.soft ? ' soft' : '');
      const q = s.quote && VERSES[s.quote];
      box.innerHTML = `<div class="who${s.badge ? ' hasbadge' : ''}"><b>${esc(s.who)}</b>${s.badge ? `<em class="badge">오늘 나는 ${esc(s.badge)}</em>` : ''}<span class="n">${esc(s.sub || '')}</span></div>
        <p class="say">${esc(s.text)}${q ? `<small>${esc(q[0])} (${esc(q[1])})</small>` : ''}</p>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        ${s.opts ? `<div class="opts">${s.opts.map((o, i) => `<button class="opt" data-o="${i}"><kbd>${i + 1}</kbd><span>${esc(o.t)}</span></button>`).join('')}</div><p class="why" hidden></p>` : ''}
        <div class="x"></div>
        ${s.buttons ? `<div class="row">${s.buttons.map((b, i) => `<button class="${b.cls || ''}" data-b="${i}">${esc(b.t)}</button>`).join('')}</div>` : ''}`;
      if (s.extra) box.querySelector('.x').replaceWith(s.extra); else box.querySelector('.x').remove();
      box.hidden = false;
      document.body.classList.add('talking');
      document.body.classList.toggle('trialing', !!(s.dark || s.soft));
    },
    close() {
      if (!spec) return; const s = spec; spec = null; box.hidden = true; document.body.classList.remove('talking', 'trialing');
      if ((s.dark || s.soft) && !s.done) ui.onUnanswered?.(); // 답하기 전에 닫힌 시험 (사건 진행이 정함: 증인에게 다시 말을 걸면 다시 열림)
      s.onClose?.();
    },
    isOpen: () => !!spec,
    // 대화 상대: 그 사람에게서 멀어지면 닫음 (시험·모드 창은 상대가 없어 그대로)
    anchor(n) { if (spec) spec.anchor = n; },
    leaveFar(dist, r = 6) { if (spec && spec.anchor && dist(spec.anchor) > r) ui.close(); },
    onUnanswered: null,
  };
  const pick = (i) => {
    const s = spec; if (!s || !s.opts || s.done) return;
    const o = s.opts[i]; if (!o) return;
    const b = box.querySelector(`[data-o="${i}"]`), why = box.querySelector('.why');
    if (o.ok) { s.done = true; b.classList.add('hint'); box.classList.add('ok'); why.hidden = true; }
    else { b.classList.add('no'); why.hidden = !o.why; why.textContent = o.why; if (o.why) requestAnimationFrame(() => why.scrollIntoView({ block: 'nearest' })); }
    s.onPick?.(o);
  };
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = e.target.closest('[data-o]'); if (o) return pick(+o.dataset.o);
    const b = e.target.closest('[data-b]'); if (!b || !spec) return;
    const B = spec.buttons[+b.dataset.b];
    if (!B.keep) ui.close();
    B.fn?.();
  });
  window.addEventListener('keydown', (e) => { // 보기는 숫자 키로도, Esc로 닫기
    if (spec && e.key === 'Escape') { e.stopPropagation(); ui.close(); return; }
    if (!spec || !spec.opts || e.target.closest?.('textarea,input')) return;
    const n = +e.key; if (n >= 1 && n <= spec.opts.length) { e.stopPropagation(); pick(n - 1); }
  }, true);
  return ui;
}

// 속삭임 한 줄 (걸으며 하는 시험). 같은 글이면 그대로, 빈 글이면 감춤
export function createWhisper(id, cls = 'vwhisper') {
  const wh = document.createElement('div'); wh.id = id; wh.className = cls; wh.hidden = true; document.body.appendChild(wh);
  let whText = '';
  return (t) => { if (t === whText) return; whText = t; wh.hidden = !t; if (t) { wh.textContent = t; wh.classList.remove('on'); void wh.offsetWidth; wh.classList.add('on'); } };
}

// 지금 할 일 카드 (왼쪽 위, 누르면 onPress: 부탁 창)
//   set(제목, 할 일, 어디): 제목 한 줄(작게) + 할 일(굵게, 접혀 보임) + 어디(작게). 글 하나만 주면 그대로. 글이 바뀌면 살짝 반짝
export function createChip(id, onPress, cls = 'vchip') {
  const chip = document.createElement('div'); chip.id = id; chip.className = cls; chip.hidden = true; document.body.appendChild(chip);
  chip.setAttribute('role', 'button'); chip.tabIndex = 0; chip.title = '눌러서 내용 보기';
  chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPress?.(); });
  let text = '', lastHead = '';
  const pulse = () => { chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); };
  return {
    el: chip,
    set(t, hint, where) {
      const key = t ? `${t}|${hint || ''}|${where || ''}` : '';
      if (key !== text) {
        // 반짝임은 제목·어디가 바뀔 때만 (할 일 글 속 초 세기·진행 수가 바뀔 때마다 번쩍이지 않게)
        const head = t ? `${t}|${where || ''}` : '';
        const had = !!text, blink = had && head !== lastHead; text = key; lastHead = head;
        chip.classList.toggle('card', hint != null);
        if (!t) chip.textContent = '';
        else if (hint == null) chip.textContent = t;
        else chip.innerHTML = `<small>${esc(t)}</small><b>${esc(hint)}</b>${where ? `<i>${esc(where)}</i>` : ''}`;
        if (t && blink && hint != null) pulse();
      }
      chip.hidden = !t;
    },
    hide() { chip.hidden = true; },
  };
}
