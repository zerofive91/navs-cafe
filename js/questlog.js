// 부탁 창 (2026-11): 왼쪽 진행 표시(📜 부탁, ✦ 큰 이야기)를 누르면 지금 하는 일의 내용과 할 자리를 보여 줌
//   "그곳으로 가기"를 누르면 그 자리까지 걸어감
import { nearestFree, findPath } from './nav.js';

export function initQuestLog({ me, quests, story, walkTo, toast }) {
  const box = document.createElement('div');
  box.id = 'questLog'; box.hidden = true;
  document.body.appendChild(box);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const verse = (v) => (v ? `<blockquote>${esc(v[0])} <cite>${esc(v[1])}</cite></blockquote>` : '');

  let last = '';
  function render() {
    const q = quests.info(), s = story.info();
    let h = '<button class="x" aria-label="닫기">×</button>';
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
    if (!q && !s) { close(); return; }
    if (h !== last) { const open = box.querySelector('details')?.open; box.innerHTML = h; last = h; if (open) box.querySelector('details').open = true; }
  }
  function open(focus) { render(); if (!quests.info() && !story.info()) return; box.hidden = false; box.dataset.focus = focus; }
  function close() { box.hidden = true; last = ''; }

  function go(kind) {
    const it = kind === 'q' ? quests.info() : story.info();
    if (!it) return;
    if (me.climb) { toast('먼저 나무에서 내려와요', 3); return; }
    const t = it.target;
    const q = nearestFree(t);
    const path = q ? findPath(me, q) : [];
    if (!q || (!path.length && Math.hypot(q.x - me.x, q.z - me.z) > 1.5)) { toast('그곳으로 가는 길을 찾지 못했어요. 지도에서 가까운 곳으로 가 보세요', 4); return; }
    walkTo(me, q, null, path);
    close();
    toast(`그곳으로 걸어가요 · ${kind === 'q' ? it.where || it.name + '에게' : `큰 이야기 ${it.k}장 금빛 기둥`}`, 3);
  }

  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('x')) close();
    else if (b.classList.contains('go')) go(b.dataset.go);
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
