// 카페 문 앞 안내자 (2026-11-03): 네 문마다 안내자가 서 있음 (남쪽 문은 정원지기 아담)
//   정원 안내를 아직 안 받았으면 가장 가까운 안내자가 정원 안내(tutorial.js의 'garden')를 해 줌
//   안내를 받은 뒤에는 말을 걸면 "지금 가 보면 좋은 곳"을 골라 알려 주고, 누르면 그곳까지 걸어감
//   고르는 차례: 하던 부탁 → 마치지 않은 훈련장 → 정원 말씀 체험 → 영적 전쟁 훈련소 → 성경 인물의 부탁 → 숲길 (가까운 곳 먼저)
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import { R_HALL, polar, WARFARE } from './layout.js';
import { nearestFree } from './nav.js';
import { COURSE_META } from './courses.js';

// 문 각도(0 동, 180 서, 270 북)마다 안내자. 남쪽(90) 문은 아담
const DOOR_GUIDES = [
  {
    a: 0, name: '갈렙', color: 0xb88a4a,
    say: (nm) => `${nm}님, 반가워요! 저는 가나안 땅을 두루 다니며 정탐했던 갈렙이에요. 이 정원도 구석구석 다녀 봤어요. 정원과 숲을 다니는 법을 알려 드릴게요.`,
    verse: '우리가 두루 다니며 탐지한 땅은 심히 아름다운 땅이라 (민수기 14:7)',
  },
  {
    a: 180, name: '호밥', color: 0x8a7a5a,
    say: (nm) => `${nm}님, 어서 오세요. 저는 모세가 "우리의 눈이 되어 달라"고 부탁한 광야 길잡이 호밥이에요. 정원과 숲을 다니는 법을 알려 드릴게요.`,
    verse: '당신은 우리가 광야에서 어떻게 진 칠 것을 아나니 우리의 눈이 되리이다 (민수기 10:31)',
  },
  {
    a: 270, name: '이드로', color: 0x6a7a9a,
    say: (nm) => `${nm}님, 샬롬! 저는 모세의 장인 이드로예요. 모세에게 일을 나누어 하는 지혜를 일러 주었지요. 정원과 숲을 다니는 법을 차근차근 알려 드릴게요.`,
    verse: '이제 내 말을 들으라 내가 그대에게 방침을 가르치리니 하나님이 그대와 함께 계실찌로다 (출애굽기 18:19)',
  },
];

export function initWayguide(K) {
  const { me, makeChar, npcs, nameTag, adam, profile, sfx, busy, goTo, walkTo, openMap, tutActive } = K;
  const nm = () => profile.name || '손님';

  // ---------- 안내자 세우기: 문 밖 디딤돌 곁 ----------
  const list = [];
  for (const g of DOOR_GUIDES) {
    const r = Math.PI / 180 * g.a, c = polar(R_HALL + 5, g.a);
    let p = { x: c.x + Math.sin(r) * 2.4, z: c.z - Math.cos(r) * 2.4 };
    p = nearestFree(p) || p;
    const n = makeChar({ hoodie: g.color, hair: 0x4a3a30, bag: g.color, style: list.length % 2, pants: 0x5a5048 }, p.x, p.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(g.name); n.av.add(n.tag);
    n.tutName = g.name; n.intro = { say: g.say, verse: g.verse };
    n.home = { ...p }; n.face0 = r; n.face = r; // 정원 쪽을 봄
    n.tag.userData.draw?.(!profile.tut?.garden); // 정원 안내 전이면 금빛 말풍선
    npcs.push(n);
    list.push(n);
  }
  adam.tutName = '아담';
  adam.home = adam.home || { x: adam.x, z: adam.z };
  const tutors = [adam, ...list];

  // ---------- 지금 가 보면 좋은 곳 ----------
  const dist = (p) => Math.hypot(p.x - me.x, p.z - me.z);
  function suggest() {
    const out = [];
    const q = K.quests?.()?.info?.();
    if (q) out.push({ prio: 0, label: `하던 부탁 이어 하기 · ${q.name}`, why: q.hint, p: q.target });
    const T = K.training?.()?.T || {};
    for (const d of Object.values(T)) if (d.who && !profile.train?.[d.stat]) out.push({ prio: 1, label: d.name, why: '수레바퀴 훈련으로 능력치가 크게 자라요', p: d.who });
    for (const x of K.garden?.()?.list || []) if (!profile.garden?.[x.id]) out.push({ prio: 2, label: `${x.d.name} · ${x.d.who}`, why: '카페 가까이에서 말씀을 몸으로 겪어 봐요', p: x.n });
    if (!Object.keys(profile.warfare || {}).length) out.push({ prio: 3, label: '영적 전쟁 훈련소 · 바울', why: '시험을 말씀으로 이기는 연습을 해요', p: WARFARE.npc });
    if (!q) for (const x of K.quests?.()?.Q || []) if (x.who && x.who.av && profile.quests?.[x.id] !== 'done') out.push({ prio: 4, label: `${x.name}의 부탁 · ${x.title}`, why: '성경 인물을 도우면 성서 물품을 받아요', p: x.who });
    const dg = K.dungeon?.();
    for (const g of K.guides?.()?.list || []) if (profile.trails?.[g.id] !== 'done' && (!dg || dg.open(g.id) !== false)) out.push({ prio: 5, label: `${COURSE_META[g.id]?.name || '숲길'} · ${g.name}`, why: '숲길을 걸으며 정거장마다 말씀을 만나요', p: g.n });
    out.sort((a, b) => a.prio - b.prio || dist(a.p) - dist(b.p));
    // 같은 갈래는 둘까지만 (훈련장만 셋 나오지 않게)
    const per = {}, pick = [];
    for (const s of out) { if ((per[s.prio] = (per[s.prio] || 0) + 1) > 2) continue; pick.push(s); if (pick.length >= 3) break; }
    return pick;
  }

  // ---------- 말풍선 (dialog.js): 가 볼 만한 곳을 고르기 목록으로 ----------
  const dlg = createDialog({ id: 'wtalk' });
  let cur = null;
  const hide = () => { dlg.close(); cur = null; };
  const go = (s) => { hide(); sfx('tap', 0.2, 1.2); goTo(s.p, `${s.label}${s.label.endsWith('이어 하기') ? '' : '(으)로'} 걸어가요`); };
  function talk(n) {
    cur = n;
    const picks = suggest();
    dlg.open({
      who: n.tutName, n: '길 안내',
      say: picks.length
        ? `${nm()}님, 어디로 가 볼까요? 지금 가 보면 좋은 곳을 골라 봤어요. 누르면 그곳까지 걸어가요.`
        : `${nm()}님, 정원의 훈련과 체험, 부탁을 모두 마쳤군요! 이제 쉬다가 걷다가 마음 가는 길을 따라 말씀을 묵상해요.`,
      pick: picks.map((s) => ({ label: s.label, sub: s.why, on: () => go(s) })),
      choices: [
        { label: '나중에', cls: 'later', on: hide },
        { label: '지도 보기', cls: 'map', on: () => { hide(); openMap?.(); } },
      ],
      esc: hide,
    });
  }

  // ---------- 매 프레임 ----------
  function step() {
    for (const n of list) {
      const d = Math.hypot(me.x - n.x, me.z - n.z);
      n.av.visible = d < 90;
      if (n.state !== 'walk') n.face = d < 6 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0;
    }
    if (cur) { if (Math.hypot(me.x - cur.x, me.z - cur.z) > 4.5) hide(); return; }
    if (!profile.tut?.garden || tutActive?.() || busy()) return; // 정원 안내 전에는 tutorial.js가 말을 검
    let near = null;
    for (const n of tutors) if (Math.hypot(me.x - n.x, me.z - n.z) < 2.6) near = n;
    if (near) offerTalk('way:' + near.tutName, near, () => talk(near)); // 말 걸기 단추를 눌러야 열림
  }
  // 정원 안내 중에는 곁으로 다가와도 되고, 끝나면 제자리로 걸어 돌아감
  function pin() {
    for (const n of list) {
      if (n.state === 'walk') continue;
      const off = Math.hypot(n.x - n.home.x, n.z - n.home.z);
      if (off < 0.6) { n.x = n.home.x; n.z = n.home.z; } else if (!tutActive?.()) walkTo(n, n.home, () => { n.face = n.face0; });
    }
  }

  // 어디서든 (지도 화면의 길잡이 단추): 그 자리에서 가 볼 만한 곳을 보여 줌
  function openHere() { talk({ tutName: '길잡이', x: me.x, z: me.z }); }

  return { step, pin, openHere, tutors: () => tutors, active: () => !!cur, suggest, list };
}
