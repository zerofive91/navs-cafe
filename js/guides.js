// 숲길 안내자 (2026-11): 숲길마다 입구 곁에 성경 인물 안내자가 서서 그 길을 대략 설명하고 부탁을 줌
//   부탁: "이 길의 정거장을 모두 들러 말씀을 보기" (정거장 기록은 courses.js의 foundCourses)
//   부탁을 받은 길은 정거장에 들를 때마다 진행을 알려 주고, 다 들르면 걸음·능력치·데나리온을 받음 (profile.trails)
//   던전 길(별 표시)은 들어갈 수 있는 단계가 되어야 부탁을 줌
import { offerTalk } from './talkgate.js';
import { createDialog } from './dialog.js';
import { TRAILS, R_PARK, isFree } from './layout.js';
import { COURSE_META, COURSE_STATIONS, foundCourses } from './courses.js';
import { TIER, TIER_STAGE, stars } from './dungeon.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, earn, STATS, STAGES } from './profile.js';
import { nearestFree } from './nav.js';

// 길마다: 안내자, 옷 색, 기를 능력치, 길 설명
const G = {
  pilgrim: ['야곱', 0x9a7a54, 'obey', '저는 야곱이에요. 평생 길을 걸은 나그네였어요. 이 길은 짐을 진 사람이 하늘 나라 성까지 가는, 아주 긴 이야기예요.'],
  gospel: ['아볼로', 0x6a8ab8, 'witness', '저는 예수님 이야기를 전하는 아볼로예요. 이 길에서는 기쁜 소식을 차례로 들어요. 누구나 걸을 수 있어요.'],
  heaven: ['스데반', 0x8ab0d8, 'prayer', '저는 스데반이에요. 하늘이 열린 것을 보았어요. 이 길은 우리가 갈 하늘 나라를 그리며 걷는 길이에요.'],
  jesus: ['안드레', 0xd89a6a, 'witness', '저는 베드로의 동생 안드레예요. 형에게 예수님을 소개했어요. 이 길에서 예수님을 처음부터 끝까지 만나요.'],
  magi: ['시므온', 0xc8b878, 'witness', '저는 아기 예수님을 안아 본 시므온이에요. 이 길은 별을 따라간 박사들 이야기예요. 짧은 길이에요.'],
  exodus: ['미리암', 0xc87a8a, 'obey', '저는 모세의 누나 미리암이에요. 이 길은 이집트를 나와 약속의 땅까지 가는, 가장 긴 길이에요.'],
  armor: ['디모데', 0x7a8aa8, 'obey', '저는 바울의 제자 디모데예요. 이 길에서는 하나님의 갑옷을 한 조각씩 입어요. 곁의 훈련소에서 먼저 연습해도 좋아요.'],
  revelation: ['요한', 0x8a7ab8, 'prayer', '저는 사도 요한이에요. 섬에 갇혀 있을 때 하나님이 하늘을 보여 주셨어요. 이 길은 가장 깊은 숲길이에요.'],
  wisdom: ['아굴', 0x9aa86a, 'word', '저는 지혜로운 말을 남긴 아굴이에요. 이 길에서 개미처럼 부지런하기, 부드럽게 대답하기 같은 지혜를 배워요.'],
  fruit: ['도르가', 0xc8a0c0, 'fellow', '저는 도르가예요. 가난한 사람에게 옷을 지어 주었어요. 이 길에서 성령님이 주시는 아홉 가지 열매를 만나요.'],
  faith: ['라합', 0xb87a5a, 'word', '저는 라합이에요. 하나님을 믿고 몰래 온 두 사람을 숨겨 주었어요. 이 길에서 믿음의 사람들을 차례로 만나요.'],
  creation: ['욥', 0x8a9a7a, 'word', '저는 욥이에요. 하나님이 세상을 어떻게 지으셨는지 들었어요. 이 길은 하나님이 엿새 동안 세상을 지으신 이야기예요.'],
  deity: ['도마', 0x6a7a9a, 'word', '저는 도마예요. 다시 사신 예수님께 "나의 하나님!" 하고 말했어요. 이 길에서 예수님이 하나님이심을 만나요.'],
  humanity: ['마리아', 0x8ab0c8, 'word', '저는 예수님의 엄마 마리아예요. 이 길에서 예수님도 우리처럼 배고프고 피곤하고 우셨던 이야기를 만나요.'],
  love: ['나사로', 0xd8a870, 'fellow', '저는 나사로예요. 예수님이 저를 무척 사랑하셨어요. 이 길에서 예수님의 사랑을 따라가요.'],
  obey: ['세례 요한', 0xa88a5a, 'obey', '저는 예수님께 세례를 준 요한이에요. 이 길에서 예수님이 하나님 아버지 뜻대로 하신 이야기를 따라가요.'],
  passion: ['구레네 시몬', 0x8a6a5a, 'prayer', '저는 예수님의 십자가를 대신 졌던 시몬이에요. 이 길은 예수님이 우리를 위해 고난받으신 이야기예요. 누구나 걸을 수 있어요.'],
  bridge: ['니고데모', 0x5a6a8a, 'witness', '저는 밤에 예수님을 찾아간 니고데모예요. 이 길은 하나님께 가는 다리, 십자가 이야기예요. 정거장은 여섯 개예요.'],
};

export function initGuides(K) {
  const { me, makeChar, npcs, profile, save, toast, sfx, burst, busy, onChange, dungeon, goTo } = K;
  const rec = () => { profile.trails = profile.trails || {}; return profile.trails; };
  const total = (id) => (COURSE_STATIONS[id] || []).length;
  const seen = (id) => new Set(foundCourses()[id] || []).size;
  const isOpen = (id) => !TIER[id] || !dungeon || dungeon.open(id);
  const jo = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

  // ---------- 안내자 세우기: 길 입구(둘레길 바로 바깥) 곁 ----------
  const list = [];
  for (const [id, [name, color, stat, about]] of Object.entries(G)) {
    const tr = TRAILS[id]; if (!tr || !COURSE_META[id]) continue;
    // 둘레길 안쪽(정원 쪽)에 섬: 숲길 안은 단계가 모자라면 들어갈 수 없으므로 입구 바깥에서 안내
    const q = tr.samples[0], a = Math.atan2(q.z, q.x), r = R_PARK - 3.4;
    const side = 2.8 / r;
    let p = { x: Math.cos(a + side) * r, z: Math.sin(a + side) * r };
    if (!isFree(p.x, p.z)) p = { x: Math.cos(a - side) * r, z: Math.sin(a - side) * r };
    p = nearestFree(p) || p;
    const n = makeChar({ hoodie: color, hair: [0x3b2a22, 0x5a3b2a, 0x22201f, 0x7a5634][list.length % 4], bag: color, style: list.length % 2, pants: 0x5a5048 }, p.x, p.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { ...p }; n.face0 = Math.atan2(-p.x, -p.z); n.face = n.face0; // 정원 쪽을 봄
    npcs.push(n);
    list.push({ id, n, name, stat, about, said: false });
  }

  // ---------- 말풍선 (dialog.js) ----------
  const dlg = createDialog({ id: 'gtalk' });
  let cur = null;
  const hide = () => { dlg.close(); cur = null; };
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  const enter = (g) => { hide(); goTo?.(TRAILS[g.id].samples[Math.min(12, TRAILS[g.id].samples.length - 1)], `${COURSE_META[g.id].name}${jo(COURSE_META[g.id].name, '으로', '로')} 들어가요`); };
  function talk(g) {
    cur = g;
    const nm = COURSE_META[g.id].name, R = rec()[g.id], tt = total(g.id), sn = Math.min(seen(g.id), tt);
    // 말풍선 본문(say)은 90자·3문장 안, 부탁·덧붙일 말은 how (T02-B3)
    let say = g.about, how = '', btn = '부탁 받기';
    const quest = `이 길의 정거장 ${tt}곳을 모두 들러 볼래요? 마치면 걸음 +10, ${statName(g.stat)} +3, 2 데나리온을 받아요.`;
    if (!isOpen(g.id)) { say = `이 길은 걸음이 ${STAGES[TIER[g.id] - 1].need}이 되면(${TIER_STAGE[TIER[g.id]]}) 들어갈 수 있어요. 지금은 ${profile.steps | 0}걸음이에요.`; how = '정원 훈련장이나 부탁을 하면 걸음이 늘어요.'; btn = ''; }
    else if (R === 'done') { say = `${nm}${jo(nm, '을', '를')} 끝까지 걸었군요! 정거장 ${tt}곳을 다 들렀어요.`; how = '언제든 다시 걸으며 말씀을 또 만나요.'; btn = ''; }
    else if (R === 'on') { say = `${nm}: 정거장 ${sn} / ${tt}곳을 들렀어요.`; how = `${TIER[g.id] ? '마음의 소리가 길을 막으면 말씀으로 이겨요. 틀리면 앞 정거장으로 돌아가 다시 걸어요. ' : ''}길 끝에서 반짝이는 문 단추를 누르면 입구로 와요 (E).`; btn = ''; }
    else how = `${quest}${TIER[g.id] ? ` 이 길에는 마음의 소리가 ${TIER[g.id] + 1}곳 있어요.` : ''}`;
    dlg.open({
      who: g.name, n: `${nm} ${stars(g.id)}`.trim(), say, how,
      choices: [
        { label: '나중에', cls: 'later', on: hide },
        { label: '길 시작점으로', cls: 'go', hidden: !isOpen(g.id) || R === 'done', main: !btn, on: () => enter(g) },
        { label: btn, cls: 'next', hidden: !btn, main: !!btn, on: () => accept(g) },
      ],
      esc: hide,
    });
  }
  function accept(g) {
    if (!isOpen(g.id)) return;
    rec()[g.id] = 'on'; save(); onChange?.();
    sfx('orb', 0.22, 1.2); burst(g.n.x, g.n.y + 1.6, g.n.z);
    const tt = total(g.id), sn = Math.min(seen(g.id), tt);
    toast(`${g.name}의 부탁을 받았어요: ${COURSE_META[g.id].name} 정거장 ${tt}곳 들르기${sn ? ` (이미 ${sn}곳 들렀어요)` : ''}`, 5);
    talk(g);
    check(g.id);
  }
  // 정거장을 들를 때마다 진행, 다 들르면 보상
  const last = {};
  function check(id) {
    if (rec()[id] !== 'on') return;
    const tt = total(id), sn = Math.min(seen(id), tt);
    if (last[id] != null && sn > last[id] && sn < tt) toast(`${COURSE_META[id].name}: 정거장 ${sn} / ${tt}`, 2.5);
    last[id] = sn;
    if (sn < tt) return;
    const g = list.find((x) => x.id === id);
    rec()[id] = 'done';
    addSteps(profile, 10); addStat(profile, g.stat, 3); earn(profile, 2);
    save(); onChange?.();
    setTimeout(() => { toast(`${g.name}의 부탁을 마쳤어요! ${COURSE_META[id].name}의 정거장 ${tt}곳을 다 들렀어요 (걸음 +10, ${statName(g.stat)} +3, 2 데나리온)`, 6); sfx('orb', 0.3, 0.9); burst(me.x, me.y + 1.4, me.z); }, 2500);
  }

  // ---------- 매 프레임 ----------
  let T = 0;
  function step(dt) {
    for (const g of list) {
      const d = Math.hypot(me.x - g.n.x, me.z - g.n.z);
      g.n.av.visible = d < 90;
      if (g.n.state !== 'walk') g.n.face = d < 7 ? Math.atan2(me.x - g.n.x, me.z - g.n.z) : g.n.face0;
      // 지나가면 손 흔들어 부름 (한 번)
      if (!g.said && d < 10 && d > 4 && me.state === 'walk' && !busy()) {
        g.said = true; g.n.action = 'wave'; setTimeout(() => { if (g.n.action === 'wave') g.n.action = null; }, 2400);
      }
      if (d > 30) g.said = false;
    }
    const now = performance.now();
    if (now - T > 1000) { T = now; for (const id of Object.keys(rec())) check(id); }
    if (cur) { if (Math.hypot(me.x - cur.n.x, me.z - cur.n.z) > 4.5) hide(); return; }
    if (busy()) return;
    let near = null;
    for (const g of list) if (Math.hypot(me.x - g.n.x, me.z - g.n.z) < 3.2) near = g;
    if (near) offerTalk('guide:' + near.id, near.n, () => talk(near)); // 말 걸기 단추를 눌러야 열림
  }
  function pin() { for (const g of list) if (g.n.state !== 'walk') { g.n.x = g.n.home.x; g.n.z = g.n.home.z; } }

  return { step, pin, active: () => !!cur, list };
}
