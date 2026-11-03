// 나의 캐릭터 만들기(닉네임·옷·머리) 창과 '나' 카드
// 만드는 동안 카메라가 캐릭터 앞으로 와서 바뀐 모습이 바로 보임
import { stageOf, STAGES, ITEMS, STATS, GOODS, fmtMoney } from './profile.js';
import { GEAR } from './gear.js';
import { bibleMode, setBible, BIBLE_NAME } from './bible.js';
import { PETS } from './pets.js';

export const HOODIES = [0x8fb7e0, 0xf2a7a0, 0xa7d3a6, 0xf4d27a, 0xb9a6e0, 0xf5f0e6, 0x6f8fb0, 0xd98f6a];
export const HAIRS = [0x3b2a22, 0x5a3b2a, 0x22201f, 0x7a5634, 0xa8784a];
export const BAGS = [0x5b6b8a, 0x8a5b5b, 0x6b8a5b, 0x444444, 0xc8a070];
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initCharacter({ me, look, profile, save, rebuild, view, toast, onCreated, replay }) {
  // ---------- 만들기 ----------
  function openCreator(first = false) {
    if (document.getElementById('creator')) return;
    const keep = { az: view.az, el: view.el, dist: view.dist };
    // 카메라를 캐릭터 앞 가까이로. 휴대폰은 창이 아래 절반을 덮으므로 캐릭터를 화면 위쪽에
    const narrow = () => matchMedia('(max-width: 760px), (max-height: 500px)').matches;
    const front = () => { view.az = me.face; view.el = 0.18; view.dist = 2.8; view.close = 2.8; view.aimY = narrow() ? -0.36 : 0.05; };
    front();
    const box = document.createElement('div');
    box.id = 'creator';
    const sw = (k, list) => `<div class="sw" data-k="${k}">${list.map((c) => `<button data-v="${c}" style="--c:${hex(c)}" aria-label="${k}"></button>`).join('')}</div>`;
    box.innerHTML = `<div class="pad">
      <h3>${first ? '반가워요! 나를 소개해 주세요' : '나의 모습'}</h3>
      <label class="nm"><span>이름</span><input maxlength="8" autocomplete="off" spellcheck="false" placeholder="닉네임 (8자까지)"></label>
      <p class="lb">옷</p>${sw('hoodie', HOODIES)}
      <p class="lb">머리 색</p>${sw('hair', HAIRS)}
      <p class="lb">머리 모양</p><div class="sw st" data-k="style"><button data-v="0">묶은 머리</button><button data-v="1">앞머리</button></div>
      <p class="lb">가방</p>${sw('bag', BAGS)}
      <button class="go">${first ? '이 모습으로 들어가기' : '다 됐어요'}</button>
    </div>`;
    const input = box.querySelector('input');
    const go = box.querySelector('.go');
    input.value = profile.name;
    const mark = () => {
      for (const row of box.querySelectorAll('.sw')) for (const b of row.children) b.classList.toggle('on', String(look[row.dataset.k]) === b.dataset.v);
      go.disabled = !input.value.trim();
    };
    input.addEventListener('input', mark);
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !go.disabled) done(); });
    input.addEventListener('keyup', (e) => e.stopPropagation());
    box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('.sw button');
      if (!b) return;
      e.preventDefault();
      look[b.parentElement.dataset.k] = Number(b.dataset.v);
      rebuild(); front(); mark();
    });
    go.addEventListener('click', () => done());
    function done() {
      const name = input.value.trim().slice(0, 8);
      if (!name) return;
      const isNew = !profile.name;
      profile.name = name; look.name = name;
      if (!profile.since) profile.since = new Date().toISOString().slice(0, 10);
      save();
      try { localStorage.setItem('navs-cafe-look3d', JSON.stringify(look)); } catch (e) { /* 무시 */ }
      box.remove();
      Object.assign(view, keep);
      view.close = 0; view.aimY = undefined;
      view.az = me.face + Math.PI;
      if (isNew) onCreated?.(); else toast(`${name}님의 모습을 바꿨어요`, 2);
    }
    document.body.appendChild(box);
    mark();
    if (!first || !matchMedia('(hover: none)').matches) setTimeout(() => input.focus(), 50); // 휴대폰은 자판이 화면을 가리지 않게 누를 때만
  }

  // ---------- '나' 카드: 이름·칭호·걸음·받은 것, 모습 바꾸기, 안내 다시 보기 ----------
  const chip = document.createElement('button');
  chip.id = 'meChip';
  chip.hidden = true;
  chip.setAttribute('aria-label', '나의 캐릭터');
  document.body.appendChild(chip);
  function showChip() {
    if (!profile.name) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.innerHTML = `<b>${esc(profile.name)}</b><small>${stageOf(profile.steps).name}</small>`;
  }
  chip.addEventListener('pointerdown', (e) => { e.stopPropagation(); openCard(); });

  function openCard() {
    if (document.getElementById('meCard')) return closeCard();
    const st = stageOf(profile.steps);
    const ix = STAGES.indexOf(st), next = STAGES[ix + 1];
    const k = next ? (profile.steps - st.need) / (next.need - st.need) : 1;
    const card = document.createElement('div');
    card.id = 'meCard';
    card.innerHTML = `<div class="pad">
      <button class="close" aria-label="닫기">×</button>
      <h3>${esc(profile.name)}</h3>
      <p class="stage">${st.name}${next ? ` <span>· 다음 단계 ${next.name}</span>` : ''}</p>
      <div class="bar"><i style="width:${Math.round(k * 100)}%"></i></div>
      <p class="steps">걸음 ${profile.steps}${next ? ` / ${next.need}` : ''}${profile.quests && Object.keys(profile.quests).length ? ` · 부탁 ${Object.keys(profile.quests).length}` : ''}${profile.dungeon && Object.keys(profile.dungeon).length ? ` · 이긴 숲길 ${Object.keys(profile.dungeon).length}` : ''}</p>
      <p class="lb">수레바퀴</p>
      <div class="stats">${STATS.map((x) => { const v = (profile.stats && profile.stats[x.id]) || 0; return `<div><span>${x.name}</span><div class="sb"><i style="width:${Math.min(100, v)}%;background:${x.color}"></i></div><b>${v}</b>${profile.train && profile.train[x.id] ? '<em>훈련 마침</em>' : ''}</div>`; }).join('')}</div>
      <p class="lb">장비 <span class="hint">하나님의 전신갑주 (엡 6:13)</span></p>
      <div class="items gear">${Object.entries(GEAR).map(([id, g]) => { const own = profile.gear?.owned?.includes(id), on = own && profile.gear.worn.includes(id); return `<button data-gear="${id}" class="${on ? 'on' : own ? '' : 'locked'}" title="${own ? g.why + ' 받음 · ' + g.does : g.how + ' 받아요'}">${g.name}${on ? ' ✓' : own ? '' : ' 🔒'}</button>`; }).join('')}</div>
      ${Object.keys(profile.pets || {}).length ? `<p class="lb">돌본 동물</p><div class="items pets">${Object.entries(PETS).filter(([id]) => profile.pets[id]).map(([id, pt]) => { const tame = profile.pets[id] >= 3, on = profile.pet === id; return `<button data-pet="${id}" class="${on ? 'on' : tame ? '' : 'locked'}">${pt.name}${tame ? (on ? ' · 함께' : ' · 데리고 다니기') : ` ${profile.pets[id]}/3`}</button>`; }).join('')}</div>` : ''}
      <p class="lb">지갑</p>
      <p class="purse">${fmtMoney(profile.coins)}${Object.keys(profile.bag || {}).length ? '' : ' <span>· 정원 동쪽 루디아의 가게에서 쓸 수 있어요</span>'}</p>
      ${Object.keys(profile.bag || {}).length ? `<div class="items goods">${Object.entries(profile.bag).map(([id, n]) => `<button data-use="${id}">${GOODS[id] ? GOODS[id].name : id} ${n}${{ spice: ' · 피우기', chariot: ' · 타기', donkey: ' · 타기', salve: ' · 바르기' }[id] || ''}</button>`).join('')}</div>` : ''}
      <p class="lb">받은 것</p>
      <div class="items">${profile.items.length ? profile.items.map((id) => `<button data-item="${id}">${ITEMS[id] ? ITEMS[id].name : id}</button>`).join('') : '<span class="none">아직 없어요</span>'}</div>
      <p class="lb">말씀 번역 <span class="hint">이 기기에서 보는 말씀</span></p>
      <div class="items bible">${Object.entries(BIBLE_NAME).map(([id, n]) => `<button data-bible="${id}" class="${bibleMode() === id ? 'on' : ''}">${n}${bibleMode() === id ? ' ✓' : ''}</button>`).join('')}<span class="none">AI 현대어는 개역한글을 오늘의 말로 풀어 쓴 것이에요 (공식 번역 아님)</span></div>
      <div class="row"><button data-do="look">모습 바꾸기</button><button data-do="cafe">카페 안내 다시</button><button data-do="garden">정원 안내 다시</button><button data-do="account">계정 · 다른 기기에서 이어 하기</button></div>
    </div>`;
    card.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === card || e.target.classList.contains('close')) return closeCard();
      const pb = e.target.closest('[data-pet]');
      if (pb) { if ((profile.pets[pb.dataset.pet] | 0) >= 3) { replay('pet:' + pb.dataset.pet); closeCard(); openCard(); } else toast('들짐승 들판에서 꼴로 세 번 돌보면 길들어요', 3.5); return; }
      const bb = e.target.closest('[data-bible]');
      if (bb) { setBible(bb.dataset.bible).then(() => { closeCard(); openCard(); toast(bb.dataset.bible === 'modern' ? '이제 말씀을 AI 현대어로 보여 드려요. 원문은 개역한글이에요' : '이제 말씀을 개역한글로 보여 드려요', 4); }); return; }
      const gb = e.target.closest('[data-gear]');
      if (gb) { closeCard(); openDress(gb.dataset.gear); return; }
      const g = e.target.closest('[data-use]');
      if (g) { closeCard(); replay('use:' + g.dataset.use); return; }
      const it = e.target.closest('[data-item]');
      if (it && ITEMS[it.dataset.item]) { const [t, r] = ITEMS[it.dataset.item].verse; toast(`${t} (${r})`, 6); return; }
      const d = e.target.closest('[data-do]');
      if (!d) return;
      closeCard();
      if (d.dataset.do === 'look') openCreator(false);
      else replay(d.dataset.do);
    });
    document.body.appendChild(card);
  }
  function closeCard() { document.getElementById('meCard')?.remove(); }

  // ---------- 장비 갖추기 (2026-11): 카드가 화면을 덮어 내 모습이 안 보이던 것을 고침 ----------
  //   모습 바꾸기처럼 카메라가 캐릭터 앞으로 오고, 아래 작은 창에서 장비를 갖추고 벗으면 바로 보임
  function openDress(first) {
    if (document.getElementById('dress')) return;
    const keep = { az: view.az, el: view.el, dist: view.dist };
    const narrow = () => matchMedia('(max-width: 760px), (max-height: 500px)').matches;
    const front = () => { view.az = me.face; view.el = 0.25; view.dist = 4.6; view.close = 4.6; view.aimY = narrow() ? -0.55 : 0.05; };
    front();
    const box = document.createElement('div');
    box.id = 'dress'; box.className = 'dressbox';
    const draw = () => {
      box.innerHTML = `<div class="pad">
        <h3>장비 갖추기</h3>
        <p class="sub">하나님의 전신갑주를 입으라 (엡 6:13). 눌러서 갖추고, 다시 누르면 벗어요</p>
        <div class="items gear">${Object.entries(GEAR).map(([id, g]) => { const own = profile.gear?.owned?.includes(id), on = own && profile.gear.worn.includes(id); return `<button data-gear="${id}" class="${on ? 'on' : own ? '' : 'locked'}">${g.name}${on ? ' ✓' : own ? '' : ' 🔒'}</button>`; }).join('')}</div>
        <p class="does"></p>
        <button class="go">다 됐어요</button>
      </div>`;
    };
    const tell = (id) => { const g = GEAR[id], own = profile.gear?.owned?.includes(id); const el = box.querySelector('.does'); if (el) el.textContent = own ? `${g.name}: ${g.does}` : `${g.name}: ${g.how} 받아요`; };
    const pick = (id) => {
      if (profile.gear?.owned?.includes(id)) replay('gear:' + id);
      draw(); tell(id); front();
      if (me.av.userData.courseOutfit) box.querySelector('.does').textContent += ' · 지금은 길에서 잠시 입은 갑주라, 정원으로 나가면 내 장비가 보여요';
    };
    box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('[data-gear]');
      if (b) { e.preventDefault(); pick(b.dataset.gear); return; }
      if (e.target.classList.contains('go')) done();
    });
    function done() {
      box.remove();
      Object.assign(view, keep);
      view.close = 0; view.aimY = undefined;
    }
    draw();
    document.body.appendChild(box);
    if (first) pick(first);
  }

  return { openCreator, openCard, closeCard, openDress, showChip, isOpen: () => !!document.getElementById('creator') || !!document.getElementById('dress') };
}
