// 증인의 작은 부탁 (2026-11, 요한복음 마을 채우기 E1 · 기획서 john-enrichment-plan.md 3.1): 마을 공용 엔진
//   사건을 마친 증인(또는 마을 사람)이 1~3단계짜리 짧은 일을 부탁함. 본문 사건의 곁일만, 새 사실·새 가르침은 만들지 않음
//   자료(ER)는 마을마다 따로(요한: js/john/errands.js). 사도행전 마을도 자료만 바꿔 이 엔진을 씀
//   단계 형식은 사건(quests.js)과 같음: { hint, go, where, until | place·at·r·act | talk·told·open, enter, leave, ring, keepSeat }
//   again: 'once' 한 번 · 'day' 하루 한 번 다시 (기기 날짜, 시험용 주소 ?day=2026-11-08)
//   보상: 처음 걸음 +5 · 능력치 +1 · 1 데나리온, 다시(하루) 걸음 +2. 기록은 store()[id] = { done, last } (js/village/town-save.js가 채우고 합침)
import { addSteps, addStat, earn, STATS } from '../profile.js';
import { VERSES } from '../verses.js';

export const FIRST = { steps: 5, stat: 1, coin: 1 };
export const AGAIN = { steps: 2 };
const pad = (n) => String(n).padStart(2, '0');
// 오늘 (기기 날짜). 주소에 ?day=YYYY-MM-DD가 있으면 그날로 (시험용, 내 컴퓨터 localhost·127.0.0.1에서만: 공개 주소에서는 가짜 날짜로 보상을 못 받게)
export function today() {
  try { const q = new URLSearchParams(location.search).get('day'); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return q; } catch (e) { /* 주소를 못 읽는 환경 */ }
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
// 날마다 바뀌는 고르기 (같은 날에는 같은 것)
export const dayPick = (list, salt = '') => list[hash(today() + salt) % list.length];

// ER: 부탁 자료 { id: { who, name, after, title, again, listen, steps(X), verse, stat, done, where, reset, begin, end, need } }
// opened(er): 부탁을 받을 수 있는가 (마을이 정함: 그 사건을 마쳤는지 등)
// giverAt(key): 부탁하는 사람(자리 { x, z }). 마을 엔진 밖의 사람(수레꾼 등)은 register(key, npc)로 알려 줌
export function initErrands({ ER, store, X, ui, me, profile, opened, giverAt, save, onChange, toast, sfx, burst, standUp, canShow, eventRunning }) {
  const ext = {}; // 마을 엔진 밖의 부탁하는 사람
  const at = (key) => ext[key] || giverAt(key);
  const ids = Object.keys(ER);
  const dist = (p) => Math.hypot(p.x - me.x, p.z - me.z);
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  const rec = (id) => store()[id];
  // 'locked' 아직 · 'new' 처음 · 'again' 다시 받을 수 있음 · 'rested' 오늘 몫은 마침 · 'over' 한 번뿐인 부탁을 마침
  function state(id) {
    const er = ER[id];
    if (!at(er.who) || !opened(er)) return 'locked';
    const r = rec(id);
    if (!r || !r.done) return 'new';
    if (er.again === 'day') return r.last === today() ? 'rested' : 'again';
    return 'over';
  }
  const startable = (id) => { const s = state(id); return s === 'new' || s === 'again'; };
  const idsOf = (key) => ids.filter((id) => ER[id].who === key);

  // ---------- 진행 ----------
  let run = null; // { id, er, steps, i, r }
  const cur = () => (run && run.i < run.steps.length ? run.steps[run.i] : null);
  const val = (v, ...a) => (typeof v === 'function' ? v(...a) : v);
  const hintOf = () => { const s = cur(); return s ? val(s.hint, run.r) : ''; };
  const goOf = (s) => (s ? val(s.go || s.at) : null);
  function begin(id) {
    if (run) quit(true);
    const er = ER[id];
    run = { id, er, steps: er.steps(X), i: 0, r: {} };
    er.begin?.(X);
    sfx('tap', 0.2, 1.25);
    startStep();
  }
  function startStep() {
    const s = cur(); if (!s) return;
    run.r = {};
    const my = run, myI = run.i;
    s.enter?.(run.r, () => { if (run === my && run.i === myI) advance(); });
  }
  function advance() {
    if (!run) return;
    cur()?.leave?.(run.r);
    run.i++;
    sfx('tap', 0.2, 1.4);
    if (run.i >= run.steps.length) complete(); else startStep();
  }
  function cleanup(er, done) {
    X.carry(null); X.rings(null); X.props?.(null, done ? 25000 : 0); // 마친 부탁의 물건(널어 둔 그물 등)은 조금 더 보이다 사라짐
    for (const k of er.follow || []) X.unfollow(k);
    er.end?.(X);
    for (const k of er.reset || []) X.resetNpc?.(k);
  }
  function quit(silent) {
    if (!run) return;
    const { er } = run; run = null;
    if (ui.isOpen()) ui.close();
    cleanup(er);
    if (!silent) toast(`"${er.title}" 부탁을 그만두었어요. ${er.name}에게 다시 말을 걸면 처음부터 할 수 있어요`, 4);
  }
  function complete() {
    const { id, er } = run; run = null;
    cleanup(er, true);
    const r = rec(id), first = !r || !r.done;
    store()[id] = { done: first ? Date.now() : r.done, last: today() };
    const R = { ...FIRST, ...(er.reward || {}) };
    let note;
    if (first) { addSteps(profile, R.steps); addStat(profile, er.stat, R.stat); earn(profile, R.coin); note = `걸음 +${R.steps}, ${statName(er.stat)} +${R.stat}, ${R.coin} 데나리온`; }
    else { addSteps(profile, AGAIN.steps); note = `다시 도와주었어요 · 걸음 +${AGAIN.steps}`; }
    save(); onChange?.();
    sfx('orb', 0.28, 1.15); burst(me.x, me.y + 1.4, me.z);
    const again = er.again === 'day' && !idsOf(er.who).some(startable) ? '내일 또 부탁해도 될까요?' : ''; // 같은 사람에게 오늘 받을 부탁이 더 남았으면 빼 (둘째 부탁이 바로 열림)
    const show = () => {
      if (!canShow()) { setTimeout(show, 800); return; }
      ui.open({
        who: er.name, sub: `${er.title} · 고마워요`, text: `${er.done} ${again}`.trim(), quote: er.verse,
        note: `${note}${er.again === 'day' ? ' · 이 부탁은 하루에 한 번 다시 할 수 있어요' : ''}`,
        buttons: [{ t: '감사해요', cls: 'next' }],
        onClose: () => X.verse([er.verse], er.title),
      });
    };
    setTimeout(show, 900);
  }

  // ---------- 부탁하는 사람과 대화 ----------
  function rewardNote(id) {
    const er = ER[id], R = { ...FIRST, ...(er.reward || {}) };
    if (state(id) === 'again') return `다시 하면 걸음 +${AGAIN.steps} · 하루에 한 번`;
    return `처음 마치면 걸음 +${R.steps}, ${statName(er.stat)} +${R.stat}, ${R.coin} 데나리온${er.again === 'day' ? ' · 하루에 한 번 다시 할 수 있어요' : ''}`;
  }
  // 부탁 대화를 엶. 이 사람에게 받을 수 있는(열린) 부탁이 없으면 false
  function talk(key) {
    const list = idsOf(key).filter((id) => state(id) !== 'locked');
    if (!list.length) return false;
    const name = ER[list[0]].name;
    if (run && run.er.who === key) {
      ui.open({ who: name, sub: `${run.er.title} · ${run.i + 1}/${run.steps.length}`, text: hintOf() || '고마워요. 하던 일을 마저 해 줘요.', buttons: [{ t: '그만두기', cls: 'later', fn: () => quit() }, { t: '알겠어요', cls: 'next' }] });
      return true;
    }
    if (run) { ui.open({ who: name, sub: '부탁', text: `지금은 ${run.er.name}의 "${run.er.title}"을(를) 하고 있군요. 그 일을 마치고 다시 와 주세요.`, buttons: [{ t: '알겠어요', cls: 'next' }] }); return true; }
    if (eventRunning()) { ui.open({ who: name, sub: '부탁', text: '지금은 이야기를 따라가는 중이군요. 그 일을 마친 뒤에 부탁할게요.', buttons: [{ t: '알겠어요', cls: 'next' }] }); return true; }
    const id = list.find(startable);
    if (id) {
      const er = ER[id];
      ui.open({
        who: name, sub: `부탁 · ${er.title}`, text: state(id) === 'again' && er.again2 ? er.again2 : er.listen, note: rewardNote(id),
        buttons: [{ t: '나중에', cls: 'later' }, { t: '해 볼게요', cls: 'next', fn: () => begin(id) }],
      });
      return true;
    }
    const rested = list.find((i) => state(i) === 'rested');
    const er = ER[rested || list[0]];
    ui.open({
      who: name, sub: `부탁 · ${er.title}`, quote: er.verse,
      text: rested ? '오늘 몫은 벌써 해 주었어요. 고마워요! 내일 다시 와 주세요.' : er.thanks || '그때 도와주어서 정말 고마웠어요.',
      note: rested ? '하루에 한 번 다시 할 수 있어요 (이 기기의 날짜로 셈)' : '',
      buttons: [{ t: '알겠어요', cls: 'next' }],
    });
    return true;
  }
  // 증인 말풍선에 넣을 단추 (받을 수 있는 부탁·하는 중·오늘 마침일 때)
  function buttons(key) {
    const list = idsOf(key).map((id) => [id, state(id)]).filter(([, s]) => s !== 'locked' && s !== 'over');
    if (!list.length) return [];
    const on = run && run.er.who === key, any = list.some(([, s]) => s === 'new' || s === 'again');
    return [{ t: on ? '🤝 부탁 (하는 중)' : any ? '🤝 부탁' : '🤝 부탁 (내일 다시)', cls: any || on ? 'er' : 'later', fn: () => talk(key) }];
  }
  const offers = (key) => !!(run && run.er.who === key) || idsOf(key).some(startable);

  // ---------- 그 자리 단추·단계 ----------
  function available() {
    const s = cur(); if (!s || !s.place) return [];
    const p = val(s.at);
    return p && dist(p) < s.r ? [['place', val(s.place, run.r)]] : [];
  }
  function act() {
    const s = cur(); if (!s || !s.place) return false;
    const p = val(s.at);
    if (!p || dist(p) > s.r) return false;
    if (me.seat && !s.keepSeat) standUp(me);
    if (s.act?.(run.r) !== false) advance();
    return true;
  }
  // 지금 단계에서 말을 걸어야 할 사람
  const talkWant = () => { const s = cur(); return s ? [].concat(s.talk || []).filter((k) => !(s.told && s.told(run.r, k))) : []; };
  function openTalk(k, n) {
    const s = cur(); if (!s || !s.open) return;
    const my = run, myI = run.i;
    s.open(run.r, () => { if (run === my && run.i === myI) advance(); }, k, n);
  }
  function step(dt) { const s = cur(); if (s && s.until && !ui.isOpen() && s.until(run.r, dt)) advance(); }

  // ---------- 보이기 ----------
  const goal = () => goOf(cur());
  const ringAt = () => { const s = cur(); return s && !s.talk && s.ring !== false ? goOf(s) : null; };
  const chip = () => (run ? `🤝 ${run.er.name}의 부탁 · ${hintOf()}` : '');
  function info() {
    if (!run) return null;
    const s = cur(), p = goOf(s) || at(run.er.who);
    return { kind: 'er', who: run.er.name, title: run.er.title, hint: hintOf(), step: run.i + 1, steps: run.steps.length, where: s?.where || '', target: { x: p.x, z: p.z }, running: true, verse: VERSES[run.er.verse] };
  }
  // 오늘 받을 수 있는 부탁 (부탁 창 목록)
  const open = () => ids.filter(startable).map((id) => { const er = ER[id], n = at(er.who); return { id, who: er.name, title: er.title, where: er.where, again: state(id) === 'again', target: { x: n.x, z: n.z } }; });
  // 머리 위 부탁 표시를 띄울 사람
  const offerKeys = () => new Set(ids.filter(startable).map((id) => ER[id].who));

  return {
    talk, buttons, offers, available, act, talkWant, openTalk, step, goal, ringAt, chip, info, open, offerKeys, state,
    register: (key, n) => { ext[key] = n; },
    running: () => !!run, runId: () => run?.id || '', quit: () => quit(), stop: () => quit(true),
    debug: {
      begin, advance, complete: () => run && complete(), today, er: (id) => ER[id],
      cur: () => { const s = cur(); if (!s) return null; const g = goOf(s); return { id: run.id, i: run.i, n: run.steps.length, hint: hintOf(), talk: talkWant(), place: s.place ? val(s.place, run.r) : null, t: g ? { x: g.x, z: g.z } : null, r: s.r || null, until: !!s.until }; },
    },
  };
}
