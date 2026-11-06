// 말풍선 공통 모듈 (2026-11): 사람과 나누는 대화 창(.npcb) 하나를 만들고 열고 닫음
//   예전에는 훈련·부탁·정원·숲길 안내·길잡이·누가·바울·처음 안내가 각자 같은 상자를 만들었음. 이제 여기 한 곳에서
//   - 모양: 이름(who)·작은 글(n)·말(say)·말씀 한 줄(verse)·덧붙임(how)·키 안내(keys)·안내 단추(guide)·고르기 목록(pick)·아래 단추(choices)
//   - 단추는 모두 <button>. 누르면 그 항목의 on()이 불림 (끌어서 내려 보기가 되도록 고르기는 click에서)
//   - 접근성: role="dialog", aria-labelledby(이름), aria-describedby(말). 열릴 때 포커스를 첫 선택지로, 닫히면 원래 자리로
//   - Esc: 열린 말풍선 가운데 가장 나중에 연 것의 esc()를 부름 (esc를 주지 않은 말풍선은 Esc로 닫히지 않음)
//   자료만으로 대화를 정의할 수 있게 선택지는 [{ label, on, cls, main }] 배열
//     cls: 단추 모양(.next 진한 단추, .later, .end, .skip, .goq 등 기존 css), main: 열릴 때 포커스를 받을 단추
import { VERSES } from './verses.js';

const opened = []; // 열린 말풍선 (연 차례대로)

// 가장 나중에 연 말풍선을 Esc로 닫음. 닫았으면 true (main.js 단축키 Esc가 지도 다음에 부름)
export function escDialog() {
  for (let i = opened.length - 1; i >= 0; i--) {
    const d = opened[i];
    if (d.esc) { d.esc(); return true; }
  }
  return false;
}

// id: 상자 id (css·시험용), cls: 덧붙일 클래스, talking: 열린 동안 body.talking (처음 안내는 따로 body.tutoring을 씀)
export function createDialog({ id, cls = '', talking = true } = {}) {
  const el = document.createElement('div');
  el.className = cls ? `npcb ${cls}` : 'npcb';
  el.id = id; el.hidden = true; el.tabIndex = -1;
  el.dataset.dlg = '';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', `${id}-who`);
  el.setAttribute('aria-describedby', `${id}-say`);
  el.innerHTML = `<div class="who"><b id="${id}-who"></b><span class="n"></span></div><p class="say" id="${id}-say"></p><p class="how" hidden></p><div class="keys"></div><div class="guide" hidden></div><div class="pick"></div><div class="row"></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const parts = { who: $('.who b'), n: $('.who .n'), say: $('.say'), how: $('.how'), keys: $('.keys'), guide: $('.guide'), pick: $('.pick'), row: $('.row') };

  let spec = {}, on = [], back = null;
  const self = { el, $, open, update, close, isOpen: () => !el.hidden, get esc() { return spec.esc; } };

  el.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button[data-k]');
    if (b && el.contains(b)) on[+b.dataset.k]?.(e);
  });

  const button = (slot, c, cls) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.k = on.push(c.on) - 1;
    b.dataset.slot = slot;
    if (cls) b.className = cls;
    if (c.sub != null) { const t = document.createElement('b'), s = document.createElement('small'); t.textContent = c.label; s.textContent = c.sub; b.append(t, s); } else b.textContent = c.label;
    return b;
  };
  const fill = (box, nodes) => { box.replaceChildren(...[].concat(nodes ?? []).map((x) => (typeof x === 'string' ? document.createTextNode(x) : x))); };

  function render() {
    const s = spec;
    const was = el.contains(document.activeElement) ? document.activeElement.dataset?.slot || '' : null;
    on = [];
    parts.who.textContent = s.who ?? '';
    parts.n.textContent = s.n ?? '';
    parts.say.textContent = s.say ?? '';
    if (s.verse) { // 구절 키(VERSES)나 "본문 (장절)" 글
      const v = document.createElement('small');
      v.textContent = VERSES[s.verse] ? `${VERSES[s.verse][0]} (${VERSES[s.verse][1]})` : s.verse;
      parts.say.append(v);
    }
    parts.how.hidden = !s.how; parts.how.textContent = s.how || '';
    fill(parts.keys, s.keys);
    const guide = (s.guide || []).filter((c) => !c.hidden);
    parts.guide.hidden = !guide.length;
    parts.guide.replaceChildren(...guide.map((c, i) => button('g' + i, c, c.cls)));
    parts.pick.replaceChildren(...(s.pick || []).map((c, i) => button('p' + i, c, c.cls)));
    const row = (s.choices || []).filter((c) => !c.hidden);
    parts.row.replaceChildren(...row.map((c, i) => button('r' + (c.cls || i), c, c.cls))); // 같은 모양 단추는 다시 그려도 포커스가 그 자리에
    el.dataset.at = s.at || '';
    if (!el.dataset.at) delete el.dataset.at;
    return { was, row };
  }
  // 포커스 받을 단추: 고르기 목록의 첫 항목 → main 표시 단추 → 아래 단추의 첫째
  function target(row) {
    const p = parts.pick.querySelector('button');
    if (p) return p;
    const m = row.findIndex((c) => c.main);
    return parts.row.querySelectorAll('button')[m >= 0 ? m : 0] || null;
  }
  const focus = (x) => { try { x?.focus({ preventScroll: true }); } catch (e) { /* 포커스를 못 옮겨도 그대로 */ } };

  // spec: { who, n, say, verse, how, keys, guide:[{label,on}], pick:[{label,sub,on}], choices:[{label,on,cls,main,hidden}],
  //         esc: Esc로 닫을 때 할 일(없으면 Esc로 닫히지 않음), focus: false면 포커스를 옮기지 않음, at: 'top'|'bottom' 자리 }
  //   이미 열려 있으면 내용만 바꿈 (포커스가 창 안에 있었으면 같은 자리의 단추로, 없으면 창으로)
  function open(s = {}) {
    spec = s;
    const fresh = el.hidden;
    const { was, row } = render();
    if (fresh) {
      back = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
      el.hidden = false;
      opened.push(self);
      if (talking) document.body.classList.add('talking');
      if (s.focus !== false) focus(target(row));
    } else if (was != null) focus(el.querySelector(`[data-slot="${was}"]`) || el);
    return self;
  }
  // 열린 채로 일부만 바꿈 (예: 안내 단추를 눌러 말만 바꿀 때)
  function update(p = {}) { if (!el.hidden) open({ ...spec, ...p }); return self; }
  function close() {
    if (el.hidden) return;
    const inside = el.contains(document.activeElement);
    el.hidden = true;
    const i = opened.indexOf(self); if (i >= 0) opened.splice(i, 1);
    if (talking) document.body.classList.remove('talking');
    if (inside) { if (back && back.isConnected && back.offsetParent !== null) focus(back); else document.activeElement?.blur?.(); }
    back = null;
  }
  return self;
}
