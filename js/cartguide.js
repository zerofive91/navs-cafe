// 수레 안내인 (2026-11): 두 마을의 수레 곁에 한 사람씩 서서 수레와 마을을 알려 줌
//   초보자 마을 길목(정원 둘레길 246°) 수레꾼 에바브라 · 요한복음 마을 광장 남쪽 수레꾼 두기고 (둘 다 먼 길에 소식을 전하던 사람)
//   수레를 타는 일은 그대로 region.js의 board()가 함 (E나 반짝이는 단추로 바로 타도 됨). 안내인은 말로 안내하고 같은 board()를 부름
//   말풍선은 dialog.js. 곁에 가면 '말 걸기' 단추가 뜨고(talkgate), 말풍선이 열려 있는 동안은 수레 단추가 쉼 (region.js blocked)
//   안내인 이름·모습·서는 자리는 마을 등록부(js/villages/<id>.js guide), 말 문구는 여기 마을 id별 (talkBase·talkJohn, 다른 마을은 talkTown)
//   초보자 마을 수레가 갈 마을이 여럿이면 말풍선에 마을마다 '…로 가요' 단추 (chooseTown)
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import { nameTag } from './tutorial.js';
import { VILLAGES, village, destinations } from './villages/registry.js';

// 마친 사건 수 (요한복음 마을: 사건 'word'는 '와 보라'에 합쳐져 있어 22개). 등록부 progress
const JOHN = village('john');
export const eventsDone = (j) => JOHN.progress({ john: j }).done;
export const EVENTS_TOTAL = JOHN.events.length;

export function initCartGuide(K) {
  const { me, makeChar, npcs, profile, busy, region } = K;
  const canEnter = () => JOHN.entry(profile) === true; // region.js와 같은 조건 (등록부 entry): 정원 안내를 마쳤거나 '안내 끝내기'로 넘긴 사람

  const put = (name, look, p, look0) => {
    const n = makeChar({ hair: 0x3b2a22, style: 0, pants: 0x5a5048, ...look, bag: look.hoodie }, p.x, p.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { x: n.x, z: n.z }; n.face0 = Math.atan2(look0.x - n.x, look0.z - n.z); n.face = n.face0;
    n.name = name;
    npcs.push(n);
    return n;
  };
  // 열린 마을마다 수레 곁에 한 사람: 수레에 오르는 자리(stand)를 바라봄 (초보자 마을은 이정표와 수레 사이, 요한복음 마을은 수레 곁 서쪽)
  const list = VILLAGES.filter((v) => v.status === 'open' && v.guide && v.cart).map((v) => ({ id: v.id, name: v.guide.name, n: v.name, n0: put(v.guide.name, v.guide.look, v.guide.at(), v.cart.stand) }));
  const byId = (id) => list.find((g) => g.id === id);
  const base = byId('base'), john = byId('john');

  const dlg = createDialog({ id: 'ctalk' });
  let cur = null;
  const hide = () => { dlg.close(); cur = null; };
  const done = () => eventsDone(profile.john);
  const board = (to) => { hide(); region().board(to); };

  function talkBase(info = false) {
    const outs = destinations('base');
    if (outs.length !== 1 || outs[0].id !== 'john') return talkPick(info);
    const g = base, j = profile.john, ok = canEnter();
    const seen = !!j?.seen;
    let say;
    if (info) {
      say = `요한복음 마을은 요한복음 본문을 한 장면씩 직접 걸어 보는 마을이에요. 사건이 ${EVENTS_TOTAL}개 있고, 장 순서대로 하나씩 열려요. 사건마다 보고, 하고, 말씀을 마음에 새겨요. ${ok ? '가 보고 싶을 때 언제든 이 수레를 타요.' : '정원 안내를 마친 사람부터 들어갈 수 있어요.'}`;
      if (seen) say += ` 지금까지 ${done()}/${EVENTS_TOTAL}을 걸었어요.`;
    } else if (!ok) say = '어서 와요. 이 수레는 요한복음 마을로 가요. 그런데 먼저 정원에서 정원지기 아담의 안내를 마치고 오세요. 길을 알고 가야 마을이 더 잘 보여요.';
    else if (!seen) say = '어서 와요. 저는 마을과 마을 사이를 수레로 오가며 소식을 전하는 에바브라예요. 이 수레는 요한복음 마을로 가요.';
    else if (j.mark === '졸업') say = '졸업 표지를 받고 오셨군요! 마을은 언제든 다시 걸어도 좋아요. 수레는 늘 여기 있어요.';
    else say = done() ? `다시 오셨네요. 마을에서 ${done()}/${EVENTS_TOTAL}개 사건을 걸었어요. 이어서 가 볼까요?` : '마을에 다녀오셨네요. 아직 걸은 사건은 없어요. 다시 가 볼까요?';
    cur = g;
    dlg.open({
      who: g.name, n: g.n, say,
      guide: [info ? { label: '돌아가기', on: () => talkBase(false) } : { label: '마을은 어떤 곳이에요?', on: () => talkBase(true) }],
      choices: [
        { label: '다음에요', cls: 'later', on: hide },
        { label: '요한복음 마을로 가요', cls: 'go', hidden: !ok, main: ok, on: () => board() },
      ],
      esc: hide,
    });
  }
  function talkJohn(info = false) {
    const g = john, j = profile.john, d = done();
    let say;
    if (info) say = '초보자 마을은 카페와 정원, 사방으로 뻗은 숲길이 있는 마을이에요. 걷던 숲길이나 정원 훈련장이 있으면 수레를 타고 돌아가 다시 걸어요. 이 마을의 기록은 그대로 남아요.';
    else if (j?.mark === '졸업') say = `${EVENTS_TOTAL}개 사건을 모두 걸었군요. 졸업 표지를 받은 사람이에요! 수레는 언제든 초보자 마을로 모셔 가요.`;
    else if (!d) say = `어서 와요. 저는 이 수레로 편지와 소식을 나르는 두기고예요. 아직 걸은 사건이 없어요(0/${EVENTS_TOTAL}). 광장의 사도 요한을 먼저 만나 보세요. 금빛 기둥이 선 곳이 다음 사건 자리예요.`;
    else say = `마친 사건은 ${d}/${EVENTS_TOTAL}이에요. 금빛 기둥이 선 곳이 다음 사건 자리예요. 쉬다 가도 좋고, 돌아가려면 말해 줘요.`;
    cur = g;
    dlg.open({
      who: g.name, n: g.n, say,
      guide: [info ? { label: '돌아가기', on: () => talkJohn(false) } : { label: '초보자 마을은 어떤 곳이에요?', on: () => talkJohn(true) }],
      choices: [
        { label: '다음에요', cls: 'later', on: hide },
        { label: '초보자 마을로 돌아가요', cls: 'go', main: true, on: () => board() },
      ],
      esc: hide,
    });
  }
  // 초보자 마을 수레가 갈 마을이 여럿일 때 (사도행전 마을을 연 뒤): 마을마다 '…로 가요' 단추
  function talkPick(info = false) {
    const g = base, outs = destinations('base');
    const say = info
      ? outs.map((v) => `${v.name}${v.progress ? `(${v.progress(profile).done}/${v.progress(profile).total})` : ''}`).join(', ') + '로 수레가 다녀요. 마을마다 그 권의 이야기를 직접 걸어 봐요.'
      : '어서 와요. 저는 마을과 마을 사이를 수레로 오가며 소식을 전하는 에바브라예요. 어느 마을로 갈까요? 마을 이름을 눌러요.';
    cur = g;
    dlg.open({
      who: g.name, n: g.n, say,
      guide: [info ? { label: '돌아가기', on: () => talkPick(false) } : { label: '마을들은 어떤 곳이에요?', on: () => talkPick(true) }],
      choices: [
        { label: '다음에요', cls: 'later', on: hide },
        ...outs.map((v, i) => ({ label: v.short || v.name, cls: 'go', main: i === 0, on: () => board(v.id) })), // 폰 세로 한 줄에 맞게 짧은 이름
      ],
      esc: hide,
    });
  }
  // 그 밖의 마을 (사도행전 마을 등): 돌아가는 수레만
  function talkTown(g) {
    const V = village(g.id), P = V.progress?.(profile);
    cur = g;
    dlg.open({
      who: g.name, n: g.n,
      say: P ? `마친 사건은 ${P.done}/${P.total}이에요. 쉬다 가도 좋고, 돌아가려면 말해 줘요.` : '쉬다 가도 좋고, 돌아가려면 말해 줘요.',
      choices: [
        { label: '다음에요', cls: 'later', on: hide },
        { label: '초보자 마을로 돌아가요', cls: 'go', main: true, on: () => board('base') },
      ],
      esc: hide,
    });
  }
  const talk = (g) => { if (busy()) return; g.id === 'base' ? talkBase() : g.id === 'john' ? talkJohn() : talkTown(g); }; // 말 걸기 단추를 누른 때 다른 창이 열려 있으면 열지 않음

  function step() {
    for (const g of list) {
      const n = g.n0, d = Math.hypot(me.x - n.x, me.z - n.z);
      n.av.visible = d < 90; // 다른 마을에서는 멀어서 안 보임
      if (n.state !== 'walk') n.face = d < 7 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0;
    }
    if (cur) { if (Math.hypot(me.x - cur.n0.x, me.z - cur.n0.z) > 4.5) hide(); return; }
    if (busy()) return;
    for (const g of list) if (Math.hypot(me.x - g.n0.x, me.z - g.n0.z) < 3.2) offerTalk('cart:' + g.id, g.n0, () => talk(g));
  }
  function pin() { for (const g of list) if (g.n0.state !== 'walk') { g.n0.x = g.n0.home.x; g.n0.z = g.n0.home.z; } }
  // 수레에 올랐는데 갈 마을이 여럿이면 (region.js chooseTown): 초보자 마을 수레꾼이 고르기 말풍선을 엶
  const choose = () => { if (!busy() && base) talkPick(false); };
  return { step, pin, active: () => !!cur, list, choose };
}
