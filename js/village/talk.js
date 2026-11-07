// 마을 사건 말풍선·속삭임·진행 칩 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   createTalk: 증인 말풍선 (사건·시험·모드·부탁이 함께 씀). spec = { who, sub, text, quote(구절 키), note, opts[{t, ok, why}], buttons[{t, cls, keep, fn}], extra(요소), dark(시험), onPick, onClose }
//   createWhisper: 걸으며 하는 시험의 속삭임 한 줄 · createChip: 왼쪽 위 진행 표시 (누르면 부탁 창)
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
      spec = s;
      box.className = cls + (s.dark ? ' trial' : '');
      const q = s.quote && VERSES[s.quote];
      box.innerHTML = `<div class="who"><b>${esc(s.who)}</b><span class="n">${esc(s.sub || '')}</span></div>
        <p class="say">${esc(s.text)}${q ? `<small>${esc(q[0])} (${esc(q[1])})</small>` : ''}</p>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        ${s.opts ? `<div class="opts">${s.opts.map((o, i) => `<button class="opt" data-o="${i}"><kbd>${i + 1}</kbd><span>${esc(o.t)}</span></button>`).join('')}</div><p class="why" hidden></p>` : ''}
        <div class="x"></div>
        ${s.buttons ? `<div class="row">${s.buttons.map((b, i) => `<button class="${b.cls || ''}" data-b="${i}">${esc(b.t)}</button>`).join('')}</div>` : ''}`;
      if (s.extra) box.querySelector('.x').replaceWith(s.extra); else box.querySelector('.x').remove();
      box.hidden = false;
      document.body.classList.add('talking');
      document.body.classList.toggle('trialing', !!s.dark);
    },
    close() {
      if (!spec) return; const s = spec; spec = null; box.hidden = true; document.body.classList.remove('talking', 'trialing');
      if (s.dark && !s.done) ui.onUnanswered?.(); // 답하기 전에 닫힌 시험 (사건 진행이 정함: 증인에게 다시 말을 걸면 다시 열림)
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

// 진행 표시 (왼쪽 위, 누르면 onPress: 부탁 창)
export function createChip(id, onPress, cls = 'vchip') {
  const chip = document.createElement('div'); chip.id = id; chip.className = cls; chip.hidden = true; document.body.appendChild(chip);
  chip.setAttribute('role', 'button'); chip.tabIndex = 0; chip.title = '눌러서 내용 보기';
  chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); onPress?.(); });
  let text = '';
  return {
    el: chip,
    set(t) { if (t !== text) { text = t; chip.textContent = t; } chip.hidden = !t; },
    hide() { chip.hidden = true; },
  };
}
