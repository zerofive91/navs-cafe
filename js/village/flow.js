// 마을 사건 진행 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   증인에게 말 걸기 → 듣기 → 단계(적용, quests.js 형식) → 말씀 카드(읽기) → 처음 마치면 보상과 기록(store().ev)
//   다 마친 사건은 언제든 "깊이 보기"(공부·암송·묵상)와 다시 하기. 큰 줄기는 순서대로 열림(반선형), 다음 사건 자리에 금빛 기둥
//   마을 안내자(요한 마을: 사도 요한)는 첫 사건의 증인이자 마을 기록장. 사건을 다 마치면 졸업 표지(store().mark = '졸업')와 졸업 카드
//   마을마다 다른 것(사람·사건 도구·시각 표·글·졸업 카드)은 cfg로 받음. 사건 자료 모양은 js/john/events.js 머리 주석
//
// initFlow(cfg) → 마을 엔진 (region.js·main.js·questlog.js가 쓰는 모양: step·available·actions·wants·info·quit·errands·active·run·N·EV·ui·X·modes·trials·debug)
//   cfg 필드
//     me, profile, save, onChange, toast, sfx, burst, busy, standUp   마을 공용 도구 (main.js townKit)
//     inTown()            지금 이 마을에 있나
//     ui, chip, whisper   js/village/talk.js (createTalk·createChip·createWhisper)
//     sky, beacon, people js/village/sky.js·beacon.js·people.js
//     X                   사건 단계 도구 (steps(X)). townTools()로 공용 도구를 만들고 마을 도구를 더함
//     EV, ORDER           사건 자료와 순서 · openOrder: store().open을 비교할 순서 (등록부 events와 같은 목록)
//     store()             마을 저장 칸 (profile.john 등: { ev, open, mark, … })
//     trials, modes       시험·모드 (공부·암송·묵상) · er: js/village/errands.js (없으면 빈 부탁) · ER: 부탁 자료 (머리 위 표시)
//     SP, ZONES           자리 이름 → 자리 (shared 증인의 stand), 구역 (이름·반지름)
//     name, book          '요한복음 마을', '요한복음' (진행 칩·말풍선 머리)
//     guide               마을 안내자 { key, ev(그가 증인인 사건 id), who, zone, bookSub, waitToast, end() → { sub, quote, text }, graduation() → 졸업 카드 spec,
//                           intro?: [{ sub, text }] 처음 온 사람에게 하는 마을 안내 장면들 (건너뛰기 가능, 끝나면 첫 사건 이야기로) }
//     introKey            마을 안내(처음 온 사람에게 안내자가 세 장면)를 이 기기에서 봤는지 (localStorage 키). guide.intro가 있을 때만
//     greet               사건 증인이 아닌 사람의 인사 { key: 글 }
//     talkKey             말 걸기 단추 이름 앞머리 ('jn:') · endKey: "이야기는 이어져요"를 들었는지 (이 기기, localStorage 키)
//     acts                그 자리 단추 이름 (등록부 acts) · seatOf(e): 묵상 자리 · resetKeys: 사건 id → 제자리로 돌릴 사람 (e.reset이 없을 때)
//     errandTitle         부탁 목록 이름 ('증인의 작은 부탁') · quietAgain: 조용한 사건(quiet)을 다시 마쳤을 때 글
//     hooks               { away(떠남?), pre(dt, town, now), frame(dt, town, now), cleanup(e), reset(e) (없으면 placeShared), quit(e, 마쳤나),
//                           first(e, j) → 마침 카드를 닫을 때 부를 함수 | null, done(e, first) 사건을 마칠 때마다 (처음·다시, 기록·저장 뒤) }
//                         first는 (e, j, notice)로 불림: notice(글, 초)는 사건 마침 카드가 닫힌 뒤에 알림으로 (마침 카드보다 먼저 뜨지 않게)
//                         훅 하나에 함수 하나 또는 함수 목록. 공용 장치(오늘의 마을·조각 등)는 systems 목록이나 엔진.use(장치)로 같은 이름의 훅을 꽂음
//     systems             [{ away, pre, frame, cleanup, reset, quit, first, done }] (모두 선택). 마을 훅 다음에 차례로 불림
//   2026-11 T02 J1 (모두 선택, 없어도 예전처럼 동작)
//     walkTo              main.js walkTo (되짚기·다음 이야기 카드의 [그곳으로 가기]·[걸어가기]). 없으면 그 단추를 두지 않음
//     ride(zoneId)        다음 이야기 카드의 [병거 타기]: 그 구역으로 병거 (요한: shop.rideTo('j:' + zone)). 없으면 병거 단추 없음
//     toldAgain           여럿에게 전하는 단계에서 이미 전한 사람에게 다시 말을 걸 때 글 (기본 '벌써 전해 주었어요. 고마워요! 이제 다른 사람에게 가요.')
//     id                  sessionStorage 키 이름 (navs-cafe-<id>-recap · navs-cafe-<id>-run). 없으면 endKey의 마을 이름 (navs-cafe-john-end → john)
//   사건 자료(EV)에 더할 수 있는 것 (J2): role '하인' (오늘 나는 ○○ 배지), recap (되짚기 한 줄), bridge (다음 이야기 카드의 이유 한 줄)
//   X 도구 더함: X.tell(글) 해설 말풍선 · X.role(글) 오늘 나는 ○○을 사건 도중에 바꿈 (그 사건이 끝날 때까지) · X.story 이야기 줄 (townTools)
import { offerTalk } from '../talkgate.js';
import { walkToward } from '../questlog.js';
import { VERSES, showVerse } from '../verses.js';
import { addSteps, addStat, earn, giveItem, STATS, ITEMS } from '../profile.js';
import { nearestFree } from '../nav.js';
import { initMarks } from './marks.js';

const MODE_NAME = { l: '듣기', r: '읽기', a: '적용', s: '공부', m: '암송', d: '묵상' };
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 이번만 */ } };
const ssGet = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
const ssSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* 이번만 */ } };
const ssDel = (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* 이번만 */ } };
// 받침 따라 조사 ("아버지 집"이에요 · "가나의 혼인잔치"예요)
const batchim = (w) => { const c = String(w).trim().slice(-1).charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 ? c % 28 : 0; };
const ieyo = (w) => (batchim(w) ? '이에요' : '예요');
const eul = (w) => (batchim(w) ? '을' : '를');
const euro = (w) => { const b = batchim(w); return b && b !== 8 ? '으로' : '로'; };
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 부탁이 없는 마을 (부탁 자료를 아직 안 넣은 마을)
const NO_ERRANDS = {
  running: () => false, stop() {}, quit() {}, buttons: () => [], open: () => [], available: () => [], act() {}, chip: () => '', info: () => null,
  step() {}, offerKeys: () => new Set(), goal: () => null, ringAt: () => null, talkWant: () => [], offers: () => false, openTalk() {}, talk() {},
  register() {}, state: () => 'locked',
};

// 빠진 설정 알리기 (새 마을을 짤 때: 빠지면 사건을 마치거나 깊이 보기를 열 때에야 죽으므로 지을 때 한 번 경고)
const NEED = ['me', 'profile', 'save', 'toast', 'sfx', 'burst', 'busy', 'standUp', 'inTown', 'ui', 'chip', 'whisper', 'sky', 'beacon', 'people', 'X',
  'EV', 'ORDER', 'openOrder', 'store', 'trials', 'modes', 'SP', 'ZONES', 'name', 'book', 'guide', 'talkKey', 'endKey', 'seatOf'];
const NEED_GUIDE = ['key', 'ev', 'who', 'zone', 'bookSub', 'waitToast', 'end', 'graduation'];
function checkCfg(cfg) {
  const miss = NEED.filter((k) => cfg[k] == null);
  if (cfg.guide) miss.push(...NEED_GUIDE.filter((k) => cfg.guide[k] == null).map((k) => 'guide.' + k));
  if (cfg.guide?.intro && !cfg.introKey) miss.push('introKey (guide.intro가 있으면 봤는지 저장할 키가 필요해요)');
  if (cfg.EV && cfg.ORDER) miss.push(...cfg.ORDER.filter((id) => !cfg.EV[id]).map((id) => `EV.${id}`));
  if (miss.length) console.warn(`마을 사건 엔진(${cfg.name || '?'}) 설정이 빠졌어요: ${miss.join(', ')}`);
  return miss;
}

// 사건 단계가 쓰는 공용 도구 (X에 펼쳐 넣음). run(): 지금 사건 진행 (flow.run)
//   이야기 줄 (2026-11 T02 S3 "한 창"): say(누가, 글)·tell(글)·verse(구절, 제목)가 한 줄에 들어가 하나씩 보임
//     say·tell은 아래 말풍선(ui)에 [다음 ▸] 하나 (저절로 닫히지 않음, 아이가 읽고 누름). 닫히면 다음 항목
//     verse는 말풍선이 닫혀 있을 때 말씀 카드로 (카드는 막지 않으므로 다음 항목이 바로 이어짐)
//     다른 창(시험·부탁·마침 카드)이 열려 있거나 마을 밖이면 0.4초마다 다시 시도. story.clear(): 줄 비우기 (사건을 그만둘 때), story.pending(): 남은 것이 있나
//   ui가 없으면(옛 마을) say·tell은 예전처럼 알림, verse는 바로. 사건 밖(부탁 단계 등)의 say·tell도 예전처럼 알림
export function townTools({ me, toast, standUp, shot, people, beacon, run, ui = null, inTown = () => true, busy = () => false }) {
  const dist = (a, b = me) => Math.hypot(a.x - b.x, a.z - b.z);
  const showV = (keys, title = '') => { keys = [].concat(keys); showVerse(keys[0], { cooldown: 0, delay: 0.5, title, then: keys.slice(1), stay: () => true }); };
  const Q = [];
  let qT = 0, showing = false, vAt = 0, vUp = 0, vPrev = '';
  // 앞의 말씀 카드가 떠올랐나 (글이 바뀌고 .on). 떠오른 뒤 0.4초가 지나야 다음 말풍선·마침 카드 (최대 2.5초 기다림)
  const verseWait = () => {
    if (!vAt) return false;
    const now = performance.now(), v = document.getElementById('verse');
    const up = v && !v.hidden && v.classList.contains('on') && (v.querySelector('p')?.textContent || '') !== vPrev; // 현대어/개역 어느 쪽이든
    if (up && !vUp) vUp = now;
    if ((vUp && now - vUp >= 400) || now - vAt >= 2500) { vAt = 0; vUp = 0; return false; }
    return true;
  };
  const later = () => { clearTimeout(qT); qT = setTimeout(pump, 400); };
  function pump() {
    qT = 0;
    if (showing) { if (ui.isOpen()) { if (Q.length) later(); return; } showing = false; } // 말풍선이 다른 창에 덮였다가 닫힘
    if (!Q.length) return;
    if (verseWait()) { clearTimeout(qT); qT = setTimeout(pump, 150); return; }
    if (ui.isOpen() || busy() || !inTown()) { later(); return; }
    const it = Q.shift();
    // 말씀 카드는 0.5초 뒤에 떠오름: 다음 말풍선은 카드가 먼저 뜬 뒤에 (말풍선이 열린 동안 카드가 새로 뜨지 않게, 최대 2.5초 기다림)
    if (it.v) { showV(it.v, it.title); vPrev = document.querySelector('#verse p')?.textContent || ''; vAt = performance.now(); vUp = 0; if (Q.length) { clearTimeout(qT); qT = setTimeout(pump, 600); } return; }
    showing = true;
    const r = run();
    ui.open({
      who: it.who, sub: r?.ev.title || '', text: it.text,
      buttons: [{ t: '다음 ▸', cls: 'next' }],
      onClose: () => { showing = false; if (Q.length) later(); },
    });
  }
  const push = (it) => { Q.push(it); if (!qT && !showing) pump(); else if (!qT) later(); };
  const story = {
    clear() { Q.length = 0; clearTimeout(qT); qT = 0; vAt = 0; vUp = 0; },
    pending: () => Q.length > 0 || (showing && !!ui?.isOpen()) || verseWait(), // 마지막 말씀 카드가 뜰 때까지도
  };
  const line = (who, text, sec) => {
    if (!ui || !run()) { toast(who ? `${who}: ${text}` : text, sec); return; }
    push({ who: who || '이야기', text });
  };
  return {
    near: (p, r) => dist(p) < r,
    sitting: (p, r) => me.state === 'sit' && dist(p) < r,
    praying: () => me.action === 'pray',
    verse: (keys, title = '') => { if (!ui) return showV(keys, title); push({ v: keys, title }); },
    sky: (p, zone, pad) => { const r = run(); if (!r) return; r.sky = p ? { p, zone: zone || r.ev.zone, pad } : null; }, // zone: 구역 id 또는 {x, z, r}
    say: (who, text, sec = 4) => line(who, text, sec),
    tell: (text, sec = 5) => line('', text, sec), // 해설 (예전 X.toast 사건 글이 옮겨 옴, J2)
    story,
    ...people.X,
    rings: beacon.rings,
    // 멀리 바라보기 (희어진 밭 등)
    look: (p) => { if (me.seat) standUp(me); me.face = Math.atan2(p.x - me.x, p.z - me.z); me.action = 'gaze'; shot?.(p, { dist: 8, el: 0.3, side: 0.4, dur: 6, mid: 0.4, y: 1.4 }); setTimeout(() => { if (me.action === 'gaze') me.action = null; }, 6000); },
  };
}

export function initFlow(cfg) {
  const {
    me, profile, save, onChange, toast, sfx, burst, busy, standUp, inTown,
    ui, chip, whisper, sky, beacon, people, X, EV, ORDER, openOrder, store, trials, modes, ER = {}, SP, ZONES,
    name, book, guide, greet = {}, talkKey, endKey, introKey, acts = [], seatOf, resetKeys = {}, errandTitle = '작은 부탁',
    quietAgain = '다시 걸어 주었군요. 그 이야기를 다시 기억했어요', hooks = {}, systems = [],
    walkTo = null, ride = null, toldAgain = '벌써 전해 주었어요. 고마워요! 이제 다른 사람에게 가요.',
  } = cfg;
  const townId = cfg.id || String(endKey || '').replace(/^navs-cafe-/, '').split('-')[0] || 'town';
  const RUN_KEY = `navs-cafe-${townId}-run`, RECAP_KEY = `navs-cafe-${townId}-recap`; // 이 탭에서만 (sessionStorage)
  const story = X.story || null; // 이야기 줄 (townTools): 사건을 그만두면 비우고, 마침 카드는 줄이 다 보인 뒤에
  checkCfg(cfg);
  const er = cfg.er || NO_ERRANDS;
  // 훅 부르기: 마을 훅(함수 또는 목록) → 꽂힌 장치 차례로. 돌려준 값 목록
  const plugged = [...systems];
  const fire = (name, ...a) => {
    const out = [];
    for (const f of [].concat(hooks[name] || [])) if (typeof f === 'function') out.push(f(...a));
    for (const sy of plugged) if (typeof sy[name] === 'function') out.push(sy[name](...a));
    return out;
  };
  const N = people.N;
  const dist = (a, b = me) => Math.hypot(a.x - b.x, a.z - b.z);

  // ---------- 기록 ----------
  const rec = (id) => store().ev[id];
  const isDone = (e) => !!rec(e.id)?.done;
  const isOpen = (e) => isDone(e) || !e.after || isDone(EV[e.after]); // 이미 마친 사건은 사이에 새 사건이 끼어도 열린 채로
  const modesOf = (id) => rec(id)?.m || '';
  const endSeen = () => lsGet(endKey) === String(ORDER.length);
  const allDone = () => ORDER.every((id) => isDone(EV[id]));
  const nextEv = () => ORDER.map((id) => EV[id]).find((e) => isOpen(e) && !isDone(e)) || null;
  function addMode(id, letters) {
    const j = store(); const r = j.ev[id] || (j.ev[id] = { done: 0, m: '' });
    const before = r.m;
    r.m = [...new Set((r.m + letters).split(''))].filter((c) => 'lrasmd'.includes(c)).sort((a, b) => 'lrasmd'.indexOf(a) - 'lrasmd'.indexOf(b)).join('');
    return r.m !== before;
  }
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  const gold = (id) => modesOf(id).length >= 6;
  // 다음 사건을 열린 사건(store().open)으로 (순서상 더 뒤일 때만)
  const openNext = (e, j) => {
    const nx = ORDER[ORDER.indexOf(e.id) + 1];
    if (nx && openOrder.indexOf(nx) > openOrder.indexOf(j.open)) j.open = nx;
  };

  // ---------- 사건 진행 ----------
  let run = null; // { ev, steps, i, r, sky }
  // 알림 순서 (2026-11 흐름 고침): 사건을 마치고 "마침 카드"가 열려 닫힐 때까지 시스템 알림(등잔·오늘의 마을 등)은 미뤘다가 카드 뒤에 차례로
  //   마침 카드 → (닫으면) 알림들 → 마을 졸업/기다림 안내
  let holding = false;
  const held = [];
  const notice = (msg, sec = 4) => { if (holding) held.push([msg, sec]); else toast(msg, sec); };
  const flushNotices = () => { for (const [m, s] of held.splice(0)) toast(m, s); };
  ui.onUnanswered = () => { if (run) run.r.closed = true; }; // 답하기 전에 닫힌 시험: 증인에게 다시 말을 걸면 다시 열림
  const curStep = () => (run && run.i < run.steps.length ? run.steps[run.i] : null);
  const hintOf = () => { const s = curStep(); if (!s) return ''; return typeof s.hint === 'function' ? s.hint(run.r) : s.hint; };
  const goOf = (s) => { const g = s && (s.go || s.at); return typeof g === 'function' ? g() : g; };
  function begin(e) {
    if (run) quit(true);
    if (er.running()) { er.stop(); toast('하던 부탁은 그만두었어요. 이야기를 마친 뒤 다시 받을 수 있어요', 4); }
    trials.reset(); modes.cancel();
    run = { ev: e, steps: e.steps(X), i: 0, r: {}, sky: null, role: '' };
    addMode(e.id, 'l'); save(); // 듣기는 증인의 말을 들었을 때
    e.begin?.(X);
    sfx('tap', 0.2, 1.2);
    startStep();
  }
  function startStep() {
    const s = curStep(); if (!s) return;
    run.r = {};
    ssSet(RUN_KEY, JSON.stringify({ id: run.ev.id, i: run.i, t: Date.now() })); // 새로고침하면 "하던 중" 카드 (처음부터 다시)
    const myRun = run, myI = run.i;
    s.enter?.(run.r, () => { if (run === myRun && run.i === myI) advance(); });
    updateChip();
  }
  function advance() {
    const s = curStep();
    s?.leave?.(run.r);
    run.i++;
    sfx('tap', 0.2, 1.4);
    if (run.i >= run.steps.length) complete();
    else startStep();
  }
  function cleanup(e) {
    trials.end(); beacon.rings(null);
    fire('cleanup', e);
    for (const k of Object.keys(N)) { const n = N[k]; if (n.follow) n.follow = false; }
    e.end?.(X);
  }
  function resetNpcs(e) {
    const keys = e.reset || resetKeys[e.id] || [];
    for (const k of keys) people.home(N[k]);
    if (!hooks.reset) placeShared(); // 마을 reset 훅이 있으면 그 안에서 placeShared를 부를 때를 정함
    fire('reset', e);
  }
  // 두 사건이 함께 쓰는 증인(요한 마을 베드로)은 지금 따라갈 사건의 자리(e.stand)에 섬
  const evsOf = (k) => ORDER.map((id) => EV[id]).filter((e) => e.npc === k);
  const relEv = (k) => { const l = evsOf(k); return l.find((e) => isOpen(e) && !isDone(e)) || [...l].reverse().find(isDone) || l[0]; };
  function placeShared() {
    for (const k of new Set(ORDER.map((id) => EV[id].npc))) {
      const e = relEv(k), n = N[k]; if (!e || !e.stand || evsOf(k).length < 2 || (run && run.ev.npc === k)) continue;
      const q = nearestFree(SP[e.stand]) || SP[e.stand];
      if (Math.hypot(n.home0.x - q.x, n.home0.z - q.z) >= 0.5) { n.home0 = { x: q.x, z: q.z }; n.face0 = n.face; }
      // 자리가 같아도 다른 곳(호수 가운데 등)에 남아 있으면 제자리로
      if (n.state !== 'walk' && !n.seat && Math.hypot(n.x - q.x, n.z - q.z) > 0.5) { n.path = []; n.state = 'idle'; n.x = q.x; n.z = q.z; n.home = { ...n.home0 }; }
    }
  }
  function quit(silent) {
    if (!run) return;
    const e = run.ev; run = null;
    ssDel(RUN_KEY);
    story?.clear(); // 남은 이야기 줄은 버림 (말풍선을 닫아도 다음 것이 열리지 않게 먼저)
    if (ui.isOpen()) ui.close(); // 사건 자리의 짧은 대화 창이 떠 있었으면 함께 닫음
    cleanup(e); resetNpcs(e);
    fire('quit', e, isDone(e));
    updateChip();
    if (!silent) toast(`"${e.title}"을(를) 그만두었어요. ${e.who}에게 다시 말을 걸면 처음부터 할 수 있어요`, 4);
  }
  function complete() {
    const e = run.ev, role = roleOf(); run = null;
    ssDel(RUN_KEY);
    cleanup(e);
    const first = !isDone(e);
    addMode(e.id, 'lra');
    const j = store();
    if (first) j.ev[e.id].done = Date.now();
    const R = e.reward;
    let msg, got = ''; // msg: 마침 글(칭찬 → 배운 것 → 다음 길), got: 받은 것 (카드 아래 작은 글)
    let after = null; // 마침 카드를 닫을 때 마을이 더 할 일 (요한: 일곱 등불)
    holding = true; // 아래 훅이 부르는 알림은 마침 카드가 닫힌 뒤로
    if (first && e.quiet) { // 조용한 사건 (요한 수난 구역): 보상 없이 기록만
      openNext(e, j);
      msg = e.done; got = '기록에 남았어요';
    } else if (first) {
      grew(addSteps(profile, R.steps)); addStat(profile, e.stat, R.stat); earn(profile, R.coin);
      for (const it of R.items) giveItem(profile, it);
      openNext(e, j);
      const fs = fire('first', e, j, notice).filter((f) => typeof f === 'function');
      if (fs.length) after = () => fs.forEach((f) => f());
      msg = e.done;
      got = `받은 것: 걸음 +${R.steps}, ${statName(e.stat)} +${R.stat}, ${R.coin} 데나리온, ${R.items.map((x) => ITEMS[x]?.name || x).join('·')}`;
    } else if (e.quiet) msg = quietAgain;
    else { grew(addSteps(profile, 2)); msg = `다시 걸어 주었군요. 말씀은 할 때마다 새로워요`; got = '걸음 +2'; }
    const grad = first && allDone() && j.mark !== '졸업'; // ORDER를 다 마침 → 마을 졸업 표지
    if (grad) j.mark = '졸업';
    save(); onChange?.();
    fire('done', e, first); // 처음이든 다시든 사건을 마침 (오늘의 마을 등)
    sfx('orb', 0.3, 1.05); burst(me.x, me.y + 1.4, me.z);
    resetNpcs(e);
    updateChip();
    const showDone = () => {
      // 다른 창이 닫힐 때까지 (마을을 떠났으면 돌아올 때). 마지막 단계의 말·말씀(이야기 줄)이 다 보인 뒤에
      if (busy() || ui.isOpen() || !inTown() || story?.pending()) { setTimeout(showDone, 800); return; }
      ui.open({
        who: e.who, sub: `${e.title} · 마침`, text: msg, badge: role, note: [got, '깊이 보기(공부·암송·묵상)는 언제든 이 증인에게 다시 말을 걸면 해요.'].filter(Boolean).join(' · '),
        buttons: [{ t: '감사해요', cls: 'next' }],
        onClose: () => {
          holding = false;
          after?.();
          setTimeout(flushNotices, 600); // 말씀 카드(일곱 등불)가 뜨면 그 뒤로 알림이 차례로
          if (grad) setTimeout(graduate, 800);
          else if (first && allDone()) setTimeout(() => toast(guide.waitToast, 6), 800);
          else if (first) setTimeout(() => bridgeCard(), 600 + 1200); // 알림들(600ms) 뒤 1.2초에 다음 이야기 카드 (처음 마칠 때만)
        },
      });
    };
    setTimeout(showDone, 2200);
  }

  // 걸음 단계가 올랐을 때 (마침 카드 뒤 알림으로)
  function grew(up) { if (up) notice(`${profile.name || '나'}님이 ${up.name}${euro(up.name)} 자랐어요!`, 5); }
  // 오늘 나는 ○○ (사건 자료 role, 도중에 X.role로 바뀜)
  function roleOf(e = run?.ev) { return (run && run.ev === e && run.role) || e?.role || ''; }
  const refreshBadge = () => { const b = document.querySelector('.npcb:not([hidden]) .who .badge'); if (b && run) b.textContent = `오늘 나는 ${roleOf()}`; };
  X.role = (t) => { if (!run) return; run.role = t || ''; updateChip(); refreshBadge(); };
  const zoneName = (e) => ZONES[e.start || e.zone]?.name || '';
  const whoAt = (e) => { const z = zoneName(e); return z && !e.who.startsWith(z) ? `${z}의 ${e.who}` : e.who; }; // "성전 뜰의 여인"은 "성전 뜰의 성전 뜰의 여인"이 되지 않게
  const zoneHere = () => { let best = null, bd = Infinity; for (const [id, z] of Object.entries(ZONES)) { const d = Math.hypot(me.x - z.x, me.z - z.z) - (z.r || 0); if (d < bd) { bd = d; best = id; } } return best; };
  // 증인 자리까지 걸어감 (길을 못 찾으면 알림)
  const walkToNpc = (k) => { const n = N[k]; if (!walkTo || !n) return; if (!walkToward(me, walkTo, n)) toast('그곳으로 가는 길을 찾지 못했어요. 금빛 기둥을 따라가요', 4); };

  // ---------- 사건 사이 다리 (S5): 처음 마친 뒤 "다음 이야기" 카드 ----------
  function bridgeCard(t0 = performance.now()) {
    const nx = nextEv();
    if (!nx || run || allDone() || performance.now() - t0 > 30000) return;
    if (busy() || ui.isOpen() || !inTown() || story?.pending()) { setTimeout(() => bridgeCard(t0), 800); return; }
    const zid = nx.start || nx.zone, n = N[nx.npc];
    const far = !!n && zid !== zoneHere() && dist(n) > 60;
    const fare = profile.bag?.chariot | 0;
    const text = `${nx.bridge ? nx.bridge + ' ' : ''}다음은 "${nx.title}"${ieyo(nx.title)}. ${whoAt(nx)}에게 가요.`;
    ui.open({
      who: '이야기', sub: '다음 이야기', text,
      buttons: [
        { t: '나중에', cls: 'later' },
        ...(far && ride && fare > 0 ? [{ t: `병거 타기 (삯 ${fare})`, cls: 'ride', fn: () => ride(zid) }] : []),
        ...(walkTo ? [{ t: '걸어가기', cls: 'next', fn: () => walkToNpc(nx.npc) }] : [{ t: '알겠어요', cls: 'next' }]),
      ],
    });
  }

  // ---------- 돌아왔을 때 (S4): 하던 중 카드 · 되짚기 카드 ----------
  let arriveT = 0;
  function onArrive() {
    clearTimeout(arriveT);
    const t0 = performance.now();
    const tryIt = () => {
      arriveT = 0;
      if (!inTown() || performance.now() - t0 > 21500) return; // 1.5초 뒤부터 20초까지
      if (busy() || ui.isOpen() || story?.pending()) { arriveT = setTimeout(tryIt, 800); return; }
      arriveCard();
    };
    arriveT = setTimeout(tryIt, 1500);
  }
  function arriveCard() {
    if (run) return; // 수레로 나갔다 와도 사건은 그대로 이어짐
    let saved = null; try { saved = JSON.parse(ssGet(RUN_KEY) || 'null'); } catch (err) { saved = null; }
    const e = saved && EV[saved.id];
    if (e && !isDone(e) && isOpen(e)) {
      ui.open({
        who: e.who, sub: e.title,
        text: `아까 "${e.title}"${eul(e.title)} 하던 중이었어요. 처음부터 다시 같이 해 볼까요? 금방 따라잡아요.`,
        buttons: [{ t: '나중에', cls: 'later', fn: () => { ssDel(RUN_KEY); setTimeout(recapCard, 400); } }, { t: '처음부터 다시', cls: 'next', fn: () => begin(e) }],
      });
      return;
    }
    if (saved) ssDel(RUN_KEY);
    recapCard();
  }
  function recapCard() {
    if (run || ssGet(RECAP_KEY) === '1' || allDone() || store().mark === '졸업') return;
    const done = ORDER.map((id) => EV[id]).filter(isDone);
    const nx = nextEv();
    if (!done.length || !nx) return; // 처음 온 사람은 마을 안내(세 장면)가 있음
    if (busy() || ui.isOpen()) { setTimeout(recapCard, 800); return; }
    const last = done.reduce((a, b) => (+rec(b.id).done > +rec(a.id).done ? b : a));
    const say = (rc) => `지난번엔 "${last.title}"까지 걸었어요 (${done.length}/${ORDER.length}). ${rc ? rc + ' ' : ''}다음은 "${nx.title}"${ieyo(nx.title)}. ${whoAt(nx)}에게 가 봐요.`;
    let text = say(last.recap);
    if (text.length > 90) text = say('');
    ssSet(RECAP_KEY, '1');
    ui.open({
      who: guide.who, sub: '지난 이야기', text,
      buttons: [{ t: '알겠어요', cls: 'later' }, ...(walkTo ? [{ t: '그곳으로 가기', cls: 'next', fn: () => walkToNpc(nx.npc) }] : [])],
    });
  }

  // 마을 졸업 카드 (마을이 guide.graduation()으로 글을 줌)
  function graduate() {
    if (busy() || ui.isOpen() || !inTown()) { setTimeout(graduate, 800); return; }
    ui.open(guide.graduation());
    sfx('orb', 0.3, 0.9); burst(me.x, me.y + 1.6, me.z);
  }

  // ---------- 증인과 대화 ----------
  function rewardNote(e) {
    const R = e.reward;
    if (e.quiet) return '이 이야기는 시험도 보상도 없어요. 곁에서 보고 머물며 기록만 남겨요.';
    return `처음 마치면 걸음 +${R.steps}, ${statName(e.stat)} +${R.stat}, ${R.coin} 데나리온${e.sign ? '(표적)' : ''}, ${R.items.map((x) => ITEMS[x]?.name || x).join('·')}${e.lamp ? ` · 💡 ${e.lampName || ''}` : ''}.`;
  }
  function modeMarks(id) { const m = modesOf(id); return 'lrasmd'.split('').map((c) => (m.includes(c) ? `✓${MODE_NAME[c]}` : `·${MODE_NAME[c]}`)).join(' '); }
  function speak(text) {
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast('이 기기에서는 읽어 주기를 할 수 없어요', 3); }
  }
  // 마친 증인에게 다시 (S8): 단추 셋(+부탁) → [더 깊이 보기 ▸] 안에 본문·공부·암송·묵상과 같은 증인의 다른 이야기
  function deep(e) {
    ui.open({
      who: e.who, sub: `${e.title} · 깊이 보기`, text: '다시 와 주었군요! 이 이야기를 더 볼까요?', note: modeMarks(e.id),
      buttons: [
        { t: '나중에', cls: 'later' },
        { t: '다시 하기', fn: () => begin(e) },
        ...er.buttons(e.npc), // 작은 부탁 (그 사건을 마친 뒤)
        { t: '더 깊이 보기 ▸', cls: 'next', fn: () => deepMenu(e) },
      ],
    });
    ui.anchor(N[e.npc]);
  }
  function deepMenu(e) {
    const m = modesOf(e.id);
    const fin = (letter, label) => () => {
      const fresh = addMode(e.id, letter);
      if (fresh && e.quiet) toast(`${label}을(를) 채웠어요${gold(e.id) ? ` · "${e.title}"의 여섯 손가락을 다 채웠어요! 표시가 금빛이 돼요` : ''}`, 5);
      else if (fresh) { addSteps(profile, 2); toast(`${label}을(를) 채웠어요 (걸음 +2)${gold(e.id) ? ` · "${e.title}"의 여섯 손가락을 다 채웠어요! 표시가 금빛이 돼요` : ''}`, 5); }
      save(); onChange?.();
    };
    const seat = seatOf(e);
    const others = evsOf(e.npc).filter((o) => o !== e && isDone(o)); // 같은 증인의 다른 이야기
    ui.open({
      who: e.who, sub: `${e.title} · 깊이 보기`, text: '어떤 것을 해 볼까요?', note: modeMarks(e.id),
      buttons: [
        { t: '돌아가기', cls: 'later', fn: () => deep(e) },
        ...others.map((o) => ({ t: `"${o.title}" 이야기`, fn: () => deep(o) })),
        { t: '본문 읽기', fn: () => { X.verse(e.read, e.title); } },
        { t: `${m.includes('s') ? '✓ ' : ''}공부`, fn: () => modes.study(e, fin('s', '공부')) },
        { t: `${m.includes('m') ? '✓ ' : ''}암송`, fn: () => modes.memo(e, fin('m', '암송')) },
        { t: `${m.includes('d') ? '✓ ' : ''}묵상`, cls: 'next', fn: () => modes.meditate(e, seat, fin('d', '묵상')) },
      ],
    });
    ui.anchor(N[e.npc]);
  }
  function talkWitness(e) {
    const n = N[e.npc];
    if (run && run.ev === e) {
      if (run.r.closed && curStep()?.enter) { startStep(); return; } // 닫힌 시험 창 다시 열기
      ui.open({ who: e.who, sub: `${e.title} · ${run.i + 1}/${run.steps.length}`, text: hintOf(), badge: roleOf(), buttons: [{ t: '그만두기', cls: 'later', fn: () => quit() }, { t: '알겠어요', cls: 'next' }] });
      return;
    }
    if (run) { ui.open({ who: e.who, sub: e.title, text: `지금은 "${run.ev.title}"을(를) 따라가고 있군요. 그 일을 마치고 다시 와 주세요.`, buttons: [{ t: '알겠어요', cls: 'next' }] }); return; }
    if (!isOpen(e)) {
      const nx = nextEv(); // 어디로 가야 하는지 알려 줌 (금빛 기둥이 그 자리를 비춰요)
      const where = nx ? ` 지금은 ${ZONES[nx.start || nx.zone].name}의 ${nx.who}에게 가 봐요. 금빛 기둥이 길을 알려 줘요.` : '';
      ui.open({ who: e.who, sub: e.title, text: `반가워요! 이 이야기는 "${EV[e.after].title}"을(를) 마친 뒤에 들려줄게요.${where}`, buttons: [{ t: '알겠어요', cls: 'next' }] });
      return;
    }
    if (isDone(e)) return deep(e);
    ui.open({
      who: e.who, sub: `${book} ${e.ch} · ${e.title}`, text: e.listen, note: rewardNote(e), badge: e.role || '',
      buttons: [{ t: '🔈 읽어 주기', cls: 'speak', keep: true, fn: () => speak(e.listen) }, { t: '나중에', cls: 'later' }, { t: '따라 해 보기', cls: 'next', fn: () => begin(e) }],
    });
    n.face = Math.atan2(me.x - n.x, me.z - n.z);
  }
  // 마을 안내자: 첫 사건의 증인이자 마을 기록장과 다음 이야기
  // 처음 온 사람에게 마을 안내 (안내자가 장면 몇 개로, 건너뛰기 가능). 끝나거나 건너뛰면 이 기기에서는 다시 하지 않음 (안내자에게 "마을 안내 다시 듣기")
  const introSeen = () => !guide.intro || (introKey && lsGet(introKey) === '1');
  function intro(i = 0, replay = false) {
    const sc = guide.intro, e = EV[guide.ev];
    const finish = () => { lsSet(introKey, '1'); if (!replay) talkWitness(e); };
    if (!sc || i >= sc.length) return finish();
    const last = i === sc.length - 1;
    ui.open({
      who: guide.who, sub: `마을 안내 ${i + 1}/${sc.length}${sc[i].sub ? ` · ${sc[i].sub}` : ''}`, text: sc[i].text,
      buttons: [{ t: replay ? '그만 볼래요' : '건너뛰기', cls: 'later', fn: () => { lsSet(introKey, '1'); if (!replay) talkWitness(e); } }, { t: last ? (replay ? '고마워요' : '이야기 들으러 가요') : '다음 ▸', cls: 'next', fn: () => (last ? finish() : intro(i + 1, replay)) }],
    });
    ui.anchor(N[guide.key]);
  }
  // 안내자 말풍선 (S8): [더 보기 ▸] · [알겠어요] 둘. 깊이 보기·안내 다시 듣기·기록장·부탁은 [더 보기 ▸] 안에
  const markOf = (id) => (isDone(EV[id]) ? (gold(id) ? '★' : '✓') : isOpen(EV[id]) ? '…' : '·');
  const bookNote = () => `마을 기록장: 마친 이야기 ${ORDER.filter((id) => isDone(EV[id])).length}/${ORDER.length} · 금빛 ★ ${ORDER.filter((id) => isDone(EV[id]) && gold(id)).length}`;
  const guideOpen = (s) => { ui.open(s); ui.anchor(N[guide.key]); };
  function talkGuide() {
    const e = EV[guide.ev];
    if (!isDone(e) && !(run && run.ev === e) && !introSeen()) return intro(0);
    if (!isDone(e) || (run && run.ev === e)) return talkWitness(e);
    if (allDone()) {
      // 다른 기기 기록을 합쳐 다 마치게 된 경우: 여기서 졸업 표지를 세우고 졸업 카드부터
      if (store().mark !== '졸업') { store().mark = '졸업'; save(); onChange?.(); graduate(); return; }
      lsSet(endKey, String(ORDER.length));
      const c = guide.end();
      guideOpen({
        who: guide.who, sub: c.sub, quote: c.quote, text: c.text, note: bookNote(),
        buttons: [{ t: '더 보기 ▸', fn: guideMenu }, { t: '감사해요', cls: 'next' }],
      });
      return;
    }
    const nx = nextEv();
    guideOpen({
      who: guide.who, sub: guide.bookSub,
      text: nx ? `다음 이야기는 "${nx.title}"${ieyo(nx.title)}. ${whoAt(nx)}에게 가 보세요. 금빛 기둥이 그 자리를 비춰요.` : '지금 따라갈 이야기가 없어요. 쉬어 가요.',
      note: bookNote(),
      buttons: [{ t: '더 보기 ▸', fn: guideMenu }, { t: '알겠어요', cls: 'next' }],
    });
  }
  function guideMenu() {
    const e = EV[guide.ev];
    guideOpen({
      who: guide.who, sub: guide.bookSub, text: '무엇을 해 볼까요?', note: bookNote(),
      buttons: [
        { t: '돌아가기', cls: 'later', fn: talkGuide },
        { t: `${e.title} 깊이 보기`, fn: () => deep(e) },
        ...(guide.intro ? [{ t: '마을 안내 다시 듣기', fn: () => intro(0, true) }] : []),
        { t: '마을 기록장 펼치기', fn: openBook },
        ...er.buttons(guide.key),
      ],
    });
  }
  // 마을 기록장 펼침: 사건 하나에 한 줄 (제목 + ✓ 마침 · ★ 금빛 · … 지금 할 수 있음 · · 아직), 폰에서는 상자 안에서 스크롤
  function openBook() {
    const ol = document.createElement('ol'); ol.className = 'book';
    ol.innerHTML = ORDER.map((id) => { const k = markOf(id); return `<li class="${{ '★': 'gold', '✓': 'done', '…': 'open', '·': 'lock' }[k]}"><span>${esc(EV[id].title)}</span><b>${k}</b></li>`; }).join('');
    guideOpen({
      who: guide.who, sub: '마을 기록장', text: bookNote().replace('마을 기록장: ', ''), note: '✓ 마친 이야기 · ★ 여섯 가지를 다 채운 이야기 · … 지금 할 수 있는 이야기',
      extra: ol,
      buttons: [{ t: '돌아가기', cls: 'later', fn: guideMenu }, { t: '닫기', cls: 'next' }],
    });
  }

  // ---------- 그 자리 단추 ----------
  const available = () => {
    if (!inTown() || ui.isOpen()) return [];
    if (!run && er.running()) return er.available(); // 부탁의 그 자리 단추
    const s = curStep(); if (!s || !s.place) return [];
    const p = typeof s.at === 'function' ? s.at() : s.at;
    return p && dist(p) < s.r ? [['place', s.place]] : [];
  };
  const doPlace = () => {
    if (!run && er.running()) { er.act(); updateChip(); return; }
    const s = curStep(); if (!s || !s.place) return;
    const p = typeof s.at === 'function' ? s.at() : s.at;
    if (!p || dist(p) > s.r) return;
    if (me.seat && !s.keepSeat) standUp(me); // 배 위(밤바다)에서는 앉은 채로
    const res = s.act?.(run.r);
    if (res !== false) advance(); else updateChip();
  };
  const actions = Object.fromEntries(acts.map((k) => [k, doPlace]));
  const wants = () => { const s = curStep(); return s && /X 기도|기도 X|\(X/.test(hintOf()) ? ['pray'] : []; };

  // ---------- 그 시각의 빛: 사건 구역 안에서만 ----------
  function skyWant() {
    if (!inTown()) return null;
    const inZone = (zid, pad = 26) => { const z = typeof zid === 'string' ? ZONES[zid] : zid; return z && Math.hypot(me.x - z.x, me.z - z.z) < z.r + pad; };
    if (run && run.sky && inZone(run.sky.zone, run.sky.pad ?? (sky.dim(run.sky.p) ? 40 : 26))) return run.sky.p;
    for (const id of ORDER) {
      const e = EV[id]; if (!e.time) continue;
      if ((run && run.ev === e) || (!run && isOpen(e) && !isDone(e))) if (inZone(e.zone)) return e.time;
    }
    return null;
  }

  // ---------- 진행 표시 ----------
  function updateChip() {
    // 제목 · 할 일 · 어디 (카드 모양: 말줄임 없이 접혀 보임). 글 하나만 주면 그대로
    let t = '', h, w;
    if (inTown()) {
      if (run) { const s = curStep(), rl = roleOf(); t = `${run.ev.title} · ${run.i + 1}/${run.steps.length}${rl ? ` · 나는 ${rl}` : ''}`; h = hintOf(); w = s?.where ? `어디: ${s.where}` : ''; }
      else if (er.running()) t = er.chip();
      else if (modes.active()) t = modes.progress();
      else {
        const nx = nextEv(), ne = er.open().length;
        if (nx) { t = `${name} · 다음 이야기`; h = `${nx.title}: ${nx.who}에게 말을 걸어요`; w = `어디: ${ZONES[nx.start || nx.zone].name} (금빛 기둥을 따라가요)`; }
        else if (allDone() && !endSeen()) { t = `${name} · 이야기는 이어져요`; h = `${guide.who}에게 말을 걸어요`; w = '어디: 금빛 기둥을 따라가요'; }
        else if (ne) t = `${name} · 오늘 받을 수 있는 부탁 ${ne}개 (🤝)`;
      }
    }
    chip.set(t, h, w);
  }
  function info() {
    if (!inTown()) return null;
    if (run) {
      const s = curStep(), p = goOf(s) || N[run.ev.npc];
      return { title: run.ev.title, ch: run.ev.ch, hint: hintOf(), step: run.i + 1, steps: run.steps.length, where: s?.where || '', target: { x: p.x, z: p.z }, running: true, verse: VERSES[run.ev.read[0]] };
    }
    if (er.running()) return er.info();
    const errands = er.open(); // 오늘 받을 수 있는 부탁 (부탁 창 목록)
    if (modes.active()) { const p = modes.target(); return { title: '묵상', hint: modes.progress(), where: '', target: { x: p.x, z: p.z }, running: false, errands }; }
    const nx = nextEv();
    if (nx) { const n = N[nx.npc]; return { title: nx.title, ch: nx.ch, hint: `${nx.who}에게 말을 걸면 시작해요`, where: `${ZONES[nx.start || nx.zone].name} · ${nx.who}`, target: { x: n.x, z: n.z }, running: false, verse: VERSES[nx.read[0]], errands }; }
    const g = N[guide.key];
    if (allDone() && !endSeen()) return { title: '이야기는 이어져요', hint: `${guide.who}에게 말을 걸어요`, where: `${ZONES[guide.zone].name} · ${guide.who}`, target: { x: g.x, z: g.z }, running: false, errands };
    if (errands.length) { const f = errands[0]; return { list: true, title: errandTitle, hint: `오늘 받을 수 있는 부탁이 ${errands.length}개 있어요. 머리 위 🤝 표시가 있는 사람에게 말을 걸어요`, where: `${f.where} · ${f.who}`, target: f.target, running: false, errands }; }
    return null;
  }

  // ---------- 머리 위 표시 ----------
  const marks = initMarks({ N, witnesses: ORDER.map((id) => EV[id].npc), askers: Object.values(ER).map((e) => e.who) });
  const witnessMark = (k) => {
    const e = relEv(k), id = e.id;
    return { on: isOpen(e) && !(run && run.ev.npc === k), kind: !isDone(e) ? 'scroll' : gold(id) ? 'gold' : 'star', id };
  };

  // ---------- 매 프레임 ----------
  let lastT = 0, chipT = 0, wasTown = inTown();
  function step() {
    const now = performance.now(), dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 0; lastT = now; // 실제 흐른 시간 (헤드리스에서도 같게)
    const town = inTown();
    sky.step(dt, skyWant);
    // 마을을 떠날 때 (수레): 사건은 그대로 두고 창·속삭임을 닫음. 손에 든 것 등은 마을이 hooks.away로 감춤. 돌아오면 다시 보임
    if (town !== wasTown) {
      wasTown = town;
      if (!town) { ui.close(); whisper(''); sky.darkness(0); } else onArrive(); // 돌아오면 하던 중·되짚기 카드
      trials.away(!town);
      fire('away', !town);
    }
    fire('pre', dt, town, now);
    people.step(town);
    fire('frame', dt, town, now);
    if (!town) { chip.hide(); beacon.hide(); return; }
    trials.step(); modes.step();
    if (!run) er.step(dt);
    // 머리 위 표시 · 부탁 표시: 오늘 받을 수 있는 부탁이 있는 사람 (사건·부탁을 하는 동안은 감춤)
    marks.step(now, witnessMark, run || er.running() ? null : er.offerKeys());
    // 금빛 기둥: 진행 중이면 지금 할 자리, 아니면 다음 사건의 증인
    let bp = null;
    if (run) bp = goOf(curStep());
    else if (er.running()) bp = er.goal();
    else if (modes.active()) bp = modes.target();
    else { const nx = nextEv(); if (nx) bp = N[nx.npc]; else if (allDone() && !endSeen()) bp = N[guide.key]; }
    beacon.show(bp, !!bp && ((!run && !er.running()) || dist(bp) > 4));
    // 빛나는 자리 고리 (그 자리 단추·서기·앉기 단계)
    const s = curStep(), rp = run ? s && !s.talk && s.ring !== false && goOf(s) : er.ringAt();
    beacon.put(rp);
    beacon.step(now);
    // 단계 진행
    if (run && s && s.until && !ui.isOpen()) { if (s.until(run.r, dt)) advance(); }
    if ((chipT += dt) > 0.3) { chipT = 0; updateChip(); }
    // 말풍선: 대화 상대에게서 멀어지면 닫음 (시험·모드 창은 그대로)
    ui.leaveFar(dist);
    // 말 걸기 (가까이 가도 저절로 열지 않음: 단추나 그 사람을 눌러야)
    if (ui.isOpen() || busy()) return;
    // 가까이 있는 사람 중 지금 단계의 대화 상대 → 사건 증인·안내자 → 나머지 순으로 (무리가 아이보다 가까워도 아이에게)
    const st = curStep(), want = st ? [].concat(st.talk || []) : [], ew = run ? [] : er.talkWant(); // ew: 부탁 단계에서 말을 걸 사람
    const rank = (n) => ((want.includes(n.key) && !(st.told && st.told(run.r, n.key))) || ew.includes(n.key) ? 0 : evsOf(n.key).length || n.key === guide.key || er.offers(n.key) ? 1 : 2);
    let best = null, bd = 2.9, br = 3;
    for (const n of Object.values(N)) { if (n.hide || !n.av.visible) continue; const d = dist(n); if (d >= 2.9) continue; const rk = rank(n); if (rk < br || (rk === br && d < bd)) { br = rk; bd = d; best = n; } }
    if (!best) return;
    const k = best.key;
    const ev = evsOf(k).length ? (run && run.ev.npc === k ? run.ev : relEv(k)) : null;
    if (st && [].concat(st.talk || []).includes(k) && !(st.told && st.told(run.r, k))) offerTalk(talkKey + k, best, () => { const myRun = run, myI = run.i; st.open(run.r, () => { if (run === myRun && run.i === myI) advance(); }, k, best); });
    else if (st && want.length > 1 && want.includes(k)) offerTalk(talkKey + k, best, () => { // 여럿에게 전하는 단계: 이미 전한 사람 (S4)
      best.face = Math.atan2(me.x - best.x, me.z - best.z);
      ui.open({ who: best.name, sub: run.ev.title, text: toldAgain, buttons: [{ t: '알겠어요', cls: 'next' }] }); ui.anchor(best);
    });
    else if (ew.includes(k)) offerTalk(talkKey + k, best, () => { best.face = Math.atan2(me.x - best.x, me.z - best.z); er.openTalk(k, best); ui.anchor(best); });
    else if (k === guide.key) offerTalk(talkKey + k, best, () => { talkGuide(); ui.anchor(best); });
    else if (ev) offerTalk(talkKey + k, best, () => { talkWitness(ev); ui.anchor(best); });
    else if (er.offers(k)) offerTalk(talkKey + k, best, () => { best.face = Math.atan2(me.x - best.x, me.z - best.z); er.talk(k); ui.anchor(best); }); // 사건 증인이 아닌 부탁하는 사람
    else if (greet[k]) offerTalk(talkKey + k, best, () => { best.face = Math.atan2(me.x - best.x, me.z - best.z); toast(`${best.name}: ${greet[k]}${er.buttons(k).length ? ' (오늘 부탁은 다 해 주었어요. 내일 또 와요)' : ''}`, 4); });
  }

  placeShared();
  updateChip();
  if (wasTown) onArrive(); // 마을 안에서 엔진을 지음 (새로고침·첫 도착)
  return {
    step, available, actions, wants, info, quit: () => (run ? quit() : er.quit()),
    errands: er, // 작은 부탁 (마을 밖 사람은 errands.register(key, npc) 뒤 errands.talk(key)). 부탁 자료가 없는 마을은 빈 부탁 (null 아님)
    // 공용 장치 꽂기 (엔진을 지은 뒤): sys = { away, pre, frame, cleanup, reset, quit, first, done } 가운데 쓰는 것만. 돌려준 함수를 부르면 뺌
    use(sys) { plugged.push(sys); return () => { const i = plugged.indexOf(sys); if (i >= 0) plugged.splice(i, 1); }; },
    active: () => ui.isOpen(),
    notice, // 알림을 사건 마침 카드 뒤로 미룸 (카드가 없으면 바로). 오늘의 마을 등 공용 장치가 씀
    get holding() { return holding; }, // 마침 카드를 기다리는 중 (main.js toast가 시스템 알림을 미룸)
    inTown,
    get run() { return run; }, N, EV, ui, X, modes, trials,
    debug: { begin: (id) => begin(EV[id]), advance, complete: () => run && complete() },
    // 마을 엔진(사건 도구)이 쓰는 것
    isDone, isOpen, allDone, placeShared, graduate,
  };
}
