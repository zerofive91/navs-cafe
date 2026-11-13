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
    if (j && j.daily) { // 오늘의 마을 (js/village/daily.js): 하루 몫 셋
      const d = j.daily;
      h += `<section class="st jn dl"><h3>📅 오늘의 마을 · ${esc(d.day)}${d.full ? ' ✦ 오늘의 표지' : ''}</h3>
        <ul class="dlist">${d.tasks.map((t) => `<li class="${t.off ? 'off' : t.done ? 'done' : ''}"><b>${t.off ? '–' : t.done ? '✓' : '○'} ${t.icon} ${esc(t.title)}</b> <span>${t.off ? '건너뜀 · 오늘은 받을 부탁이 없어요' : `${esc(t.text)}${!t.done && t.where ? ` · ${esc(t.where)}` : ''}`}</span>${!t.done && !t.off && t.target ? ` <button class="go sm" data-go="d:${t.k}">가기</button>` : ''}</li>`).join('')}</ul>
        <p class="where">${d.locked ? '이 기기의 날짜가 마지막으로 한 날보다 앞서 있어서 오늘 몫은 쉬어요' : `${d.run ? `${d.run}일 이어서 했어요` : '오늘 하루를 시작해요'}${d.best > 1 ? ` · 가장 길게 ${d.best}일` : ''} · 셋을 다 하면 1 데나리온·걸음 +10, 7일 이어 하면 등잔 기름 하나`}</p></section>`;
    }
    if (q) {
      h += `<section><h3>📜 ${esc(q.name)}의 부탁 · ${esc(q.title)}</h3>
        <p class="now">${q.back ? `<b>지금 할 일: ${esc(q.name)}에게 돌아가요</b>` : `<b>지금 할 일 ${q.step} / ${q.steps}</b>${esc(q.hint)}`}</p>
        ${q.where ? `<p class="where">어디서: ${esc(q.where)}</p>` : ''}
        <details><summary>부탁 내용</summary><p class="ask">${esc(q.ask)}</p>${verse(q.verse)}</details>
        <div class="row"><button class="quit">그만두기</button><button class="go" data-go="q">그곳으로 가기</button></div></section>`;
    }
    if (s) {
      h += `<section class="st"><h3>✦ 큰 이야기 ${s.k} / ${s.total} · ${esc(s.title)}</h3>
        ${s.do ? `<p class="now"><b>지금 할 일</b>${esc(s.where)}에 가서 ${esc(s.do)}</p>` : ''}
        <p class="where">어디서: ${esc(s.where)} (금빛 기둥)</p>${verse(s.verse)}
        <div class="row"><button class="go" data-go="s">그곳으로 가기</button></div></section>`;
    }
    if (!q && !s && !j) { close(); return; }
    if (h !== last) { const open = box.querySelector('details')?.open; box.innerHTML = h; last = h; if (open) box.querySelector('details').open = true; }
  }
  function open(focus) { render(); if (!last) return; if (!box.hidden && box.dataset.focus === focus) { close(); return; } box.hidden = false; box.dataset.focus = focus; }
  function close() { box.hidden = true; last = ''; }

  function go(kind) {
    const it = kind.startsWith('d:') ? john()?.daily?.task(kind.slice(2)) : kind === 'q' ? quests.info() : kind === 'j' ? john()?.info() : story.info();
    if (!it || !it.target) return;
    if (me.climb) { toast('나무에서 먼저 내려와요 (내려가기 단추)', 3); return; }
    if (!walkToward(me, walkTo, it.target)) { toast('길을 못 찾았어요. 지도 단추를 눌러 가까운 곳을 골라요', 4); return; }
    close();
    toast(`그곳으로 걸어가요 · ${kind === 'q' ? it.where || it.name + '에게' : kind === 'j' || kind.startsWith('d:') ? it.where || it.title : `큰 이야기 ${it.k}장 금빛 기둥`}`, 3);
  }

  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('x')) close();
    else if (b.classList.contains('go')) go(b.dataset.go);
    else if (b.classList.contains('quit') && !b.dataset.sure) { // 한 번 더 눌러야 그만둠
      b.dataset.sure = '1'; b.textContent = '정말 그만둘까요?';
      setTimeout(() => { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = '그만두기'; } }, 4000);
    }
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
