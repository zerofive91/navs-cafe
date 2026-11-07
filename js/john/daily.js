// 요한복음 마을 오늘의 마을 자료·이음 (2026-11, 채우기 E3): 엔진은 마을 공용 js/village/daily.js, 여기는 요한 마을이 추천할 일과 "했다"는 신호만
//   사도행전 마을은 같은 모양으로 js/acts/daily.js를 두고 등록부 항목의 load에서 같은 방식으로 이으면 됨
//   엔진(js/john/engine.js)은 건드리지 않음: kit.onChange를 감싸 사건·부탁을 마친 때를 알고, 엔진 객체를 한 겹 감싸 step·단추·부탁 창 정보를 더함
//   a 이야기: 사건 하나를 마침(처음이든 다시든, 수난 구역 두 사건은 제외) · b 부탁: 오늘 마친 부탁이 있음(profile.john.er[*].last) · c 머무름: 마을 안에서 머무름 묵상을 끝까지 함(profile.met의 묵상 표시가 늚)
import { initDaily } from '../village/daily.js';
import { dayPick, today } from '../village/errands.js';
import { ZONES, SEATS_J, BENCHES, BOARD } from './layout.js';

// 쉼 자리 (머무르기 추천). 수난 구역(Z11) 자리는 뺌 — 부탁·오늘의 일을 두지 않는 구역 (기획서 6장 결정 4)
const REST = [
  ['빛의 광장 벤치', BENCHES[0]], ['요단 건너 베다니 의자', SEATS_J.bench2], ['윗동네 니고데모의 지붕', SEATS_J.seat10], ['실로암 못가', SEATS_J.med9],
  ['수가 우물가 그늘', SEATS_J.seat6], ['가버나움 신하의 집 곁', SEATS_J.seat4], ['가버나움 회당', SEATS_J.synW], ['성전 뜰 솔로몬 행각', SEATS_J.portico7],
  ['베데스다 못가', SEATS_J.mat8], ['성전 뜰 양 우리 안', SEATS_J.foldSeat], ['베다니 잔치 식탁', SEATS_J.feast12[1]], ['다락방 긴 의자', SEATS_J.up10],
  ['다락방 포도나무 곁', SEATS_J.vineSeat], ['바닷가 숯불 곁', SEATS_J.fireSeat],
].filter(([, s]) => s).map(([name, s]) => ({ name, x: s.x, z: s.z }));
export const REST_SPOTS = REST;

const metMarks = (m) => (m && Array.isArray(m.k) ? m.k.filter((x) => x && x[2] === 'm').length : 0);

// kit(마을 엔진에 넘길 것, here 포함)을 받아 { kit, attach(engine, built, events) } 를 돌려줌
//   kit.onChange가 엔진보다 먼저 감싸져야 하므로 먼저 부르고, 엔진을 만든 뒤 attach로 엔진을 감쌈 (오류가 나도 마을 오가기·사건은 그대로)
export function linkDaily(kit) {
  let eng = null, daily = null, EV = null, lastRun = '';
  const J = () => kit.profile.john;
  let met0 = null; // 머무름 묵상 표시 수 기준 { d, n }

  function sync(fromChange) {
    if (!daily || !eng) return;
    // a: 사건을 마침. onChange가 사건 마침(complete)에서 불렸고 직전 프레임까지 그 사건이 진행 중이었음
    if (fromChange && !eng.run && lastRun && EV[lastRun] && !EV[lastRun].quiet) daily.mark('a');
    // b: 오늘 마친 부탁이 있음
    const t = today();
    if (Object.values(J().er || {}).some((r) => r && r.last === t)) daily.mark('b');
  }
  const link = {
    // 오늘의 마을 쪽 예외가 사건 마침 카드·NPC 복귀를 끊지 않게 감쌈
    kit: { ...kit, onChange: () => { kit.onChange?.(); try { sync(true); } catch (e) { console.warn('오늘의 마을 기록 중 오류', e); } } },
    attach(engine, built, events) {
      eng = engine; EV = events.EV;
      const { ORDER } = events, N = engine.N, er = engine.errands;
      const done = (e) => !!J().ev[e.id]?.done;
      const open = (e) => done(e) || !e.after || done(EV[e.after]);
      const zoneOf = (e) => ZONES[e.start || e.zone]?.name || '';
      const T = {
        name: '요한복음 마을',
        board: { x: BOARD.x, z: BOARD.z, r: BOARD.r, set: (got, full, skip) => built.parts.board?.set(got, full, skip) },
        tasks() {
          const evs = ORDER.map((id) => EV[id]);
          // a: 다음 이야기(마친 것이 아직 남았으면). 그것이 수난 구역이거나 다 마쳤으면 마친 이야기 가운데 날마다 하나
          const nx = evs.find((e) => open(e) && !done(e));
          const ea = nx && !nx.quiet ? nx : dayPick(evs.filter((e) => done(e) && !e.quiet), 'a');
          const a = ea
            ? { k: 'a', text: nx === ea ? `"${ea.title}" (${ea.ch}) · ${ea.who}에게 말을 걸어 시작해요` : `"${ea.title}" (${ea.ch}) 이야기를 다시 걸어요 · ${ea.who}에게 "다시 하기"`, where: zoneOf(ea), target: N[ea.npc] ? { x: N[ea.npc].x, z: N[ea.npc].z } : null }
            : { k: 'a', text: '', off: true };
          // b: 받을 수 있는 부탁 가운데 날마다 하나. 하나도 없고 오늘 마친 것도 없으면 오늘은 건너뜀
          const list = er.open(), doneToday = Object.values(J().er || {}).some((r) => r && r.last === today());
          const eb = list.length ? dayPick(list, 'b') : null;
          const b = eb ? { k: 'b', text: `${eb.who}의 부탁 "${eb.title}"`, where: eb.where, target: eb.target } : doneToday ? { k: 'b', text: '오늘 부탁을 도왔어요' } : { k: 'b', text: '', off: true };
          // c: 쉼 자리 하나. 이야기를 몇 개 못 마친 사람에게는 먼 자리 대신 광장 벤치 (가까운 곳)
          const few = evs.filter((e) => done(e)).length < 5;
          const sp = few ? { ...dayPick(BENCHES, 'c'), name: '빛의 광장 벤치' } : dayPick(REST, 'c');
          const c = { k: 'c', text: `${sp.name}에 앉아 "머무르기" 1분`, where: '앉으면 머무르기 단추가 떠요', target: { x: sp.x, z: sp.z } };
          return [a, b, c];
        },
      };
      daily = initDaily({
        T, getDay: () => J().day, setDay: (v) => { J().day = v; },
        profile: kit.profile, save: kit.save, onChange: kit.onChange, toast: engine.notice || kit.toast, sfx: kit.sfx, burst: kit.burst, me: kit.me,
        ui: engine.ui, inTown: () => kit.here() === 'john', openLog: kit.openLog,
      });
      // 엔진을 한 겹 감쌈 (읽기는 engine 그대로 물려받고, 아래만 덮음)
      const w = Object.create(engine);
      let sT = 0;
      w.step = (dt) => {
        engine.step(dt);
        lastRun = engine.run ? engine.run.ev.id : '';
        if (kit.here() !== 'john') { met0 = null; return; }
        daily.step(dt);
        // c: 머무름 묵상을 끝까지 함 (표시 수가 늘거나, 날이 바뀌어 새로 생긴 목록에 표시가 있음)
        const cur = { d: kit.profile.met?.d || '', n: metMarks(kit.profile.met) };
        if (met0 && ((cur.d === met0.d && cur.n > met0.n) || (cur.d !== met0.d && cur.n > 0))) daily.mark('c');
        met0 = cur;
        if ((sT += dt) > 2) { sT = 0; sync(false); } // b는 가끔 확인 (다른 기기에서 합쳐진 오늘 기록 포함)
      };
      w.available = () => { const a = engine.available(); return daily.available() ? [...a, ['place', 'jn_board']] : a; };
      w.actions = { ...engine.actions, jn_board: () => daily.open() };
      w.info = () => {
        if (kit.here() !== 'john') return null;
        const i = engine.info(), d = daily.info();
        if (i) return { ...i, daily: d };
        const nx = daily.nextTask();
        return { list: true, title: '오늘의 마을', hint: nx ? `${nx.title}: ${nx.text}` : d.full ? '오늘의 마을을 다 했어요. 내일 또 와요' : '소식판에서 오늘의 일을 볼 수 있어요', where: nx?.where || '빛의 광장 · 소식판', target: nx?.target || { x: BOARD.x, z: BOARD.z }, running: false, daily: d };
      };
      w.daily = daily;
      return w;
    },
  };
  return link;
}
