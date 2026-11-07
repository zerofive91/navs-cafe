// 오늘의 마을 (2026-11, 요한복음 마을 채우기 E3 · 기획서 john-enrichment-plan.md J2): 마을 공용 엔진
//   날짜로 고르는 하루 몫 셋 — a 이야기 걷기 · b 부탁 돕기 · c 쉼 자리에서 1분 머무르기. 셋을 다 하면 "오늘의 표지"와 작은 보상(1 데나리온, 걸음 +10),
//   7일 이어 하면 등잔 기름 하나. 광장 소식판(모형은 마을 쪽)과 부탁 창(questlog.js)에 보임
//   마을이 넘기는 것(T): 어떤 일을 추천할지(tasks)와 소식판 자리. 마을 엔진 안을 몰라도 되게 "했다"는 신호만 mark(k)로 받음
//   기록은 profile.<마을>.day = { d, got, s, best } (js/village/town-save.js가 채우고 합침. 연속은 s부터 셈)
//   날짜는 기기 시계. 시험용 주소 ?day=YYYY-MM-DD가 먹음 (js/village/errands.js today). 저장된 날보다 이른 날짜면 그날 몫은 쉼(되감아 두 번 받지 못하게)
import { addSteps, earn, addGood } from '../profile.js';
import { today } from './errands.js';
import { fillDay, markDay, rollDay, streakRun, DAILY } from './town-save.js';

export const REWARD = { coin: 1, steps: 10, weekEvery: 7, weekGood: 'oil' };
export const TITLE = { a: '이야기 걷기', b: '부탁 돕기', c: '머무르기' };
export const ICON = { a: '📖', b: '🤝', c: '🕊' };
const MD = (d) => { const [, m, x] = d.split('-').map(Number); return `${m}월 ${x}일`; };

// T: { name, board: { x, z, r }, tasks(): [{ k, text, where, target, off?, done? }] } — tasks는 매번 새로 셈(마을 상태에 따라 추천이 달라짐)
// getDay()/setDay(v): 마을 기록의 day 칸. 나머지는 마을 엔진이 쓰는 것과 같음
export function initDaily({ T, getDay, setDay, profile, save, onChange, toast, sfx, burst, me, ui, inTown, openLog }) {
  // ---------- 지금 상태 ----------
  function view() {
    const t = today(), raw = fillDay(getDay());
    const locked = !!raw.d && t < raw.d; // 시계가 저장된 날보다 앞서 있지 않음
    const cur = locked ? raw : rollDay(raw, t);
    const got = cur.d === t || locked ? cur.got : '';
    const tasks = T.tasks().map((k) => ({ ...k, title: TITLE[k.k], icon: ICON[k.k], done: got.includes(k.k) || !!k.off }));
    const run = streakRun(cur, locked ? raw.d : t);
    return {
      day: t, label: MD(t), tasks, got, locked, run, best: cur.best,
      full: DAILY.split('').every((c) => got.includes(c)),
      toWeek: REWARD.weekEvery - (run % REWARD.weekEvery), // 다음 등잔 기름까지 할 날 수 (오늘이 아직이면 오늘 포함, 다 했으면 오늘 뒤로)
    };
  }

  // ---------- 기록 ----------
  // k: 'a'|'b'|'c'. 새로 적었으면 true. 하루 몫을 처음 다 하면 보상을 한 번 줌 (이미 다 한 날 또 불러도 없음)
  function mark(k) {
    if (!DAILY.includes(k)) return false;
    const t = today(), raw = fillDay(getDay());
    if (raw.d && t < raw.d) return false;
    const rolled = rollDay(raw, t);
    if (rolled.got.includes(k)) return false;
    const skip = T.tasks().filter((x) => x.off).map((x) => x.k).join(''); // 오늘은 할 수 없는 일(받을 부탁이 없음 등)은 건너뛴 것으로
    const r = markDay(raw, k + skip, t);
    setDay(r.day);
    save();
    if (r.full) reward(r.run);
    else onChange?.();
    return true;
  }
  function reward(run) {
    earn(profile, REWARD.coin); addSteps(profile, REWARD.steps);
    const week = run > 0 && run % REWARD.weekEvery === 0;
    if (week) addGood(profile, REWARD.weekGood);
    onChange?.();
    board();
    // 다른 창(방금 마친 일의 "고마워요" 창)이 열리는 동안 겹치지 않게 알림 한 줄로 (창은 안 엶)
    setTimeout(() => {
      sfx?.('orb', 0.3, 1.2); burst?.(me.x, me.y + 1.5, me.z);
      toast(`✦ 오늘의 마을을 다 했어요! 오늘의 표지 · ${REWARD.coin} 데나리온, 걸음 +${REWARD.steps}${run > 1 ? ` · ${run}일 이어서` : ''}${week ? ` · 등잔 기름 하나 (${REWARD.weekEvery}일 이어 했어요)` : ''}`, 7);
    }, 3200);
  }

  // ---------- 소식판 ----------
  let lastBoard = '';
  const boardShape = () => { const v = view(); return `${v.got}|${v.full}`; };
  function board() { const v = view(); T.board.set?.(v.got, v.full); lastBoard = boardShape(); }
  const near = () => Math.hypot(me.x - T.board.x, me.z - T.board.z) < T.board.r;
  const dist = (p) => Math.hypot(p.x - me.x, p.z - me.z);

  function open() {
    if (!inTown() || ui.isOpen()) return false;
    const v = view();
    const ul = document.createElement('ul');
    ul.className = 'board';
    for (const t of v.tasks) {
      const li = document.createElement('li');
      li.className = t.off ? 'off' : t.done ? 'done' : '';
      const b = document.createElement('b'); b.textContent = `${t.done ? '✓' : '○'} ${t.icon} ${t.title}`;
      const sm = document.createElement('span'); sm.textContent = t.off ? '오늘은 받을 부탁이 없어요 (건너뛰어요)' : t.done ? `${t.text}` : `${t.text}${t.where ? ` · ${t.where}` : ''}`;
      li.append(b, sm); ul.append(li);
    }
    const lines = v.locked
      ? '이 기기의 날짜가 마지막으로 한 날보다 앞서 있어서 오늘 몫은 쉬어요. 날짜가 지나면 다시 열려요.'
      : v.full ? '오늘의 마을을 다 했어요. 오늘의 표지가 달렸어요. 내일 또 와요!'
        : '오늘은 이런 일들이 소식판에 붙었어요. 추천과 다르게 해도 같은 일이면 인정돼요.';
    const note = `${v.run ? `${v.run}일 이어서 했어요` : '오늘 하루를 시작해요'}${v.best > 1 ? ` · 가장 길게 ${v.best}일` : ''} · 셋을 다 하면 ${REWARD.coin} 데나리온, 걸음 +${REWARD.steps} · ${REWARD.weekEvery}일 이어 하면 등잔 기름 하나 (다음까지 ${v.toWeek}일)`;
    ui.open({
      who: '소식판', sub: `${T.name} · 오늘의 마을 · ${v.label}`, text: lines, note, extra: ul,
      buttons: [{ t: '부탁 창에서 보기', cls: 'later', fn: () => openLog?.('j') }, { t: '알겠어요', cls: 'next' }],
    });
    sfx?.('tap', 0.18, 1.3);
    return true;
  }

  // ---------- 부탁 창·진행 표시 ----------
  function info() {
    const v = view();
    return {
      day: v.label, full: v.full, locked: v.locked, run: v.run, best: v.best, toWeek: v.toWeek,
      tasks: v.tasks.map(({ k, title, icon, text, where, target, done, off }) => ({ k, title, icon, text, where, target, done, off })),
    };
  }
  // 아직 안 한 일 가운데 가장 가까운 것 (부탁 창이 비었을 때 "그곳으로 가기" 대상)
  const nextTask = () => { const v = view(); return v.tasks.filter((t) => !t.done && t.target).sort((a, b) => dist(a.target) - dist(b.target))[0] || null; };
  const task = (k) => view().tasks.find((t) => t.k === k) || null;

  let T0 = 0;
  function step(dt) {
    if (!inTown()) return;
    if ((T0 += dt) < 0.5) return;
    T0 = 0;
    if (boardShape() !== lastBoard) board();
  }

  return {
    view, info, mark, open, board, step, nextTask, task,
    available: () => inTown() && !ui.isOpen() && near(),
    near,
    debug: { today, reward },
  };
}
