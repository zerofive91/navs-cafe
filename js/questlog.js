// 부탁 창 (2026-11): 왼쪽 진행 표시(📜 부탁, ✦ 큰 이야기)를 누르면 지금 하는 일의 내용과 할 자리를 보여 줌
//   "그곳으로 가기"를 누르면 그 자리까지 걸어감
import { nearestFree, findPath } from './nav.js';
import { village } from './villages/registry.js';

// 그 자리 가까이 빈 곳까지 걸어감 (길을 못 찾으면 false)
export function walkToward(me, walkTo, t) {
  const q = nearestFree({ x: t.x, z: t.z });
  const path = q ? findPath(me, q) : [];
  if (!q || (!path.length && Math.hypot(q.x - me.x, q.z - me.z) > 1.5)) return false;
  walkTo(me, q, null, path);
  return true;
}

export function initQuestLog({ me, quests, story, walkTo, toast, john = () => null, town = () => 'base' }) {
  const box = document.createElement('div');
  box.id = 'questLog'; box.hidden = true;
  document.body.appendChild(box);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const verse = (v) => (v ? `<blockquote>${esc(v[0])} <cite>${esc(v[1])}</cite></blockquote>` : '');

  let last = '';
  function render() {
    // 다른 마을(요한복음 마을 등)에 있으면 그 마을 이야기만 (초보자 마을 부탁·큰 이야기는 그 마을에서). john(): 지금 마을의 사건 엔진
    const inTown = town() !== 'base';
    const q = inTown ? null : quests.info(), s = inTown ? null : story.info(), j = inTown ? john()?.info() : null;
    let h = '<button class="x" aria-label="닫기">×</button>';
    if (j && j.kind === 'er') { // 증인의 작은 부탁 (js/village/errands.js)
      h += `<section class="st jn er"><h3>🤝 ${esc(j.who)}의 부탁 · ${esc(j.title)}</h3>
        <p class="now"><b>지금 할 일 ${j.step} / ${j.steps}</b>${esc(j.hint)}</p>
        ${j.where ? `<p class="where">어디서: ${esc(j.where)} (금빛 기둥)</p>` : ''}${verse(j.verse)}
        <div class="row"><button class="quit" data-q="j">그만두기</button><button class="go" data-go="j">그곳으로 가기</button></div></section>`;
    } else if (j) {
      h += `<section class="st jn"><h3>✦ ${esc(village(town())?.name || '')} · ${esc(j.title)}${j.ch ? ` (${esc(j.ch)})` : ''}</h3>
        <p class="now"><b>${j.running ? `지금 할 일 ${j.step} / ${j.steps}` : j.list ? '작은 부탁' : '다음 이야기'}</b>${esc(j.hint)}</p>
        ${j.where ? `<p class="where">어디서: ${esc(j.where)} (금빛 기둥)</p>` : ''}${verse(j.verse)}
        <div class="row">${j.running ? '<button class="quit" data-q="j">그만두기</button>' : ''}<button class="go" data-go="j">그곳으로 가기</button></div>
        ${j.errands?.length ? `<details class="erl"><summary>🤝 오늘 받을 수 있는 부탁 ${j.errands.length}</summary><ul>${j.errands.map((e) => `<li><b>${esc(e.who)}</b> · ${esc(e.title)} <span>${esc(e.where)}${e.again ? ' · 다시' : ''}</span></li>`).join('')}</ul></details>` : ''}</section>`;
    }
    if (q) {
      h += `<section><h3>📜 ${esc(q.name)}의 부탁 · ${esc(q.title)}</h3>
        <p class="now"><b>지금 할 일 ${q.back ? '(마지막)' : `${q.step} / ${q.steps}`}</b>${esc(q.hint)}</p>
        ${q.where ? `<p class="where">어디서: ${esc(q.where)}</p>` : ''}
        <details><summary>부탁 내용</summary><p class="ask">${esc(q.ask)}</p>${verse(q.verse)}</details>
        <div class="row"><button class="quit">그만두기</button><button class="go" data-go="q">그곳으로 가기</button></div></section>`;
    }
    if (s) {
      h += `<section class="st"><h3>✦ 큰 이야기 ${s.k} / ${s.total} · ${esc(s.title)}</h3>
        <p class="where">어디서: ${esc(s.where)} (금빛 기둥)</p>${verse(s.verse)}
        <div class="row"><button class="go" data-go="s">그곳으로 가기</button></div></section>`;
    }
    if (!q && !s && !j) { close(); return; }
    if (h !== last) { const open = box.querySelector('details')?.open; box.innerHTML = h; last = h; if (open) box.querySelector('details').open = true; }
  }
  function open(focus) { render(); if (!last) return; if (!box.hidden && box.dataset.focus === focus) { close(); return; } box.hidden = false; box.dataset.focus = focus; }
  function close() { box.hidden = true; last = ''; }

  function go(kind) {
    const it = kind === 'q' ? quests.info() : kind === 'j' ? john()?.info() : story.info();
    if (!it) return;
    if (me.climb) { toast('먼저 나무에서 내려와요', 3); return; }
    if (!walkToward(me, walkTo, it.target)) { toast('그곳으로 가는 길을 찾지 못했어요. 지도에서 가까운 곳으로 가 보세요', 4); return; }
    close();
    toast(`그곳으로 걸어가요 · ${kind === 'q' ? it.where || it.name + '에게' : kind === 'j' ? it.where || it.title : `큰 이야기 ${it.k}장 금빛 기둥`}`, 3);
  }

  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('x')) close();
    else if (b.classList.contains('go')) go(b.dataset.go);
    else if (b.classList.contains('quit') && b.dataset.q === 'j') { john()?.quit(); render(); }
    else if (b.classList.contains('quit')) { quests.quit(); toast('부탁을 그만두었어요. 다시 그 사람에게 가면 처음부터 할 수 있어요', 4); render(); }
  });
  box.addEventListener('click', (e) => e.stopPropagation());
  for (const [id, f] of [['questChip', 'q'], ['storyChip', 's']]) {
    const chip = document.getElementById(id);
    if (!chip) continue;
    chip.setAttribute('role', 'button'); chip.tabIndex = 0;
    chip.title = '눌러서 내용 보기';
    chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (!box.hidden && box.dataset.focus === f) close(); else open(f); });
    chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
  }
  let T = 0;
  function step(dt) { if (box.hidden || (T += dt) < 0.5) return; T = 0; render(); }
  return { step, open, close, isOpen: () => !box.hidden };
}
