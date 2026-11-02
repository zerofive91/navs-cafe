// 숲길 안내자 (2026-11): 숲길마다 입구 곁에 성경 인물 안내자가 서서 그 길을 대략 설명하고 부탁을 줌
//   부탁: "이 길의 정거장을 모두 들러 말씀을 보기" (정거장 기록은 courses.js의 foundCourses)
//   부탁을 받은 길은 정거장에 들를 때마다 진행을 알려 주고, 다 들르면 걸음·능력치·데나리온을 받음 (profile.trails)
//   던전 길(별 표시)은 들어갈 수 있는 단계가 되어야 부탁을 줌
import { TRAILS, R_PARK, isFree } from './layout.js';
import { COURSE_META, COURSE_STATIONS, foundCourses } from './courses.js';
import { TIER, TIER_STAGE, stars } from './dungeon.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, earn, STATS } from './profile.js';
import { nearestFree } from './nav.js';

// 길마다: 안내자, 옷 색, 기를 능력치, 길 설명
const G = {
  pilgrim: ['야곱', 0x9a7a54, 'obey', '저는 "나그네 길의 세월"을 산 야곱이에요(창 47:9). 이 길은 무거운 짐을 진 순례자가 멸망의 도시를 떠나 좁은 문, 십자가, 허영의 시장, 의심의 성을 지나 하늘의 도성에 이르는 천로역정이에요. 가장 길고 굽이진 길이에요.'],
  gospel: ['아볼로', 0x6a8ab8, 'witness', '저는 성경으로써 예수는 그리스도라고 증거한 아볼로예요(행 18:28). 이 길에서는 복음을 차례로 들어요. 때가 찼다는 소식, 복음의 내용과 능력, 들음에서 나는 믿음, 영접과 영생까지 한 걸음씩 가요. 누구나 걸을 수 있는 열린 길이에요.'],
  heaven: ['스데반', 0x8ab0d8, 'prayer', '저는 하늘이 열리고 인자가 하나님 우편에 서신 것을 본 스데반이에요(행 7:56). 이 길은 이 땅의 나그네로서 더 나은 본향, 눈물이 없는 곳, 생명수의 강과 새 예루살렘을 바라보며 걷는 길이에요.'],
  jesus: ['안드레', 0xd89a6a, 'witness', '저는 형 시몬에게 "우리가 메시야를 만났다" 하고 전한 안드레예요(요 1:41). 이 길에서는 예수님의 나심과 세례, 산 위의 가르침, 생명의 떡과 세상의 빛, 십자가와 빈 무덤, 다시 오실 주님을 차례로 만나요.'],
  magi: ['시므온', 0xc8b878, 'witness', '저는 성전에서 아기 예수를 안고 주의 구원을 보았다고 찬송한 시므온이에요(눅 2:30). 이 길은 동방박사들이 별을 따라 헤롯의 궁을 지나 아기 예수께 경배하러 간 길이에요. 짧은 길이에요.'],
  exodus: ['미리암', 0xc87a8a, 'obey', '저는 홍해를 건넌 뒤 소고를 잡고 찬양한 미리암이에요(출 15:20). 이 길은 불타는 떨기나무에서 시작해 열 가지 재앙, 유월절, 홍해, 광야의 만나와 반석의 물, 시내산과 성막을 지나 요단을 건너 젖과 꿀이 흐르는 땅에 이르는 가장 긴 여정이에요.'],
  armor: ['디모데', 0x7a8aa8, 'obey', '저는 바울에게서 "그리스도 예수의 좋은 군사"로 부름받은 디모데예요(딤후 2:3). 이 길에서는 정거장마다 하나님의 전신갑주를 한 조각씩 입고 영적 싸움을 훈련해요. 길 곁 영적 전쟁 훈련소에서 먼저 연습해도 좋아요.'],
  revelation: ['요한', 0x8a7ab8, 'prayer', '저는 밧모섬에서 계시를 본 사도 요한이에요(계 1:9). 이 길은 일곱 교회, 하늘 보좌, 죽임 당하신 어린 양, 일곱 인과 일곱 나팔, 어린 양의 피로 이긴 사람들을 지나 새 하늘과 새 땅에 이르러요. 가장 깊은 숲길이에요.'],
  wisdom: ['아굴', 0x9aa86a, 'word', '저는 잠언 30장을 쓴 아굴이에요. 이 길은 잠언과 전도서의 지혜를 따라 걸어요. 지혜의 근본, 마음을 지키는 법, 개미에게 배우기, 유순한 대답, 모든 일에 때가 있음을 지나 사람의 본분에 이르러요.'],
  fruit: ['도르가', 0xc8a0c0, 'fellow', '저는 선행과 구제를 많이 한 다비다, 도르가예요(행 9:36). 이 길은 포도나무에서 시작해 사랑, 희락, 화평, 오래 참음, 자비, 양선, 충성, 온유, 절제, 성령의 아홉 열매를 하나씩 만나요.'],
  faith: ['라합', 0xb87a5a, 'word', '저는 믿음으로 정탐꾼을 영접한 라합이에요(히 11:31). 이 길은 히브리서 11장 믿음의 사람들, 아벨, 에녹, 노아, 아브라함과 사라, 요셉, 모세를 차례로 만나고 마지막에 예수를 바라보자는 말씀에 이르러요.'],
  creation: ['욥', 0x8a9a7a, 'word', '저는 하나님께 "내가 땅의 기초를 놓을 때에 네가 어디 있었느냐" 하는 물음을 들은 욥이에요(욥 38:4). 이 길은 빛, 하늘과 바다, 해와 달, 생물과 사람을 지으신 엿새와 일곱째 날의 안식을 따라 걸어요.'],
  deity: ['도마', 0x6a7a9a, 'word', '저는 부활하신 주님께 "나의 주시며 나의 하나님이시니이다" 고백한 도마예요(요 20:28). 이 길은 태초의 말씀, 만물을 지으신 분, 바람과 바다도 순종하는 분, 죄를 사하는 권세, 변화산의 영광을 따라 예수님의 하나님 되심을 만나요.'],
  humanity: ['마리아', 0x8ab0c8, 'word', '저는 예수님을 낳아 기른 어머니 마리아예요(눅 2:7). 이 길은 말씀이 육신이 되어 자라시고, 나사렛의 목수로 일하시고, 주리고 곤하고 눈물을 흘리셨던 예수님의 사람 되심을 따라가요. 길게 서쪽으로 휘어 나가요.'],
  love: ['나사로', 0xd8a870, 'fellow', '저는 예수님이 무덤 앞에서 우시자 사람들이 "보라 그를 어떻게 사랑하였는가" 했던 나사로예요(요 11:36). 이 길은 어린아이들을 품으시고, 손을 내밀어 만지시고, 삭개오를 부르시고, 끝까지 사랑하신 예수님의 사랑을 따라가요.'],
  obey: ['세례 요한', 0xa88a5a, 'obey', '저는 "우리가 이와 같이 하여 모든 의를 이루는 것이 합당하니라" 하신 예수님께 세례를 베푼 요한이에요(마 3:15). 이 길은 하늘에서 내려오시고, 부모에게 순종하시고, 아버지의 뜻을 양식 삼으신 예수님을 겟세마네와 십자가까지 따라가요.'],
  passion: ['구레네 시몬', 0x8a6a5a, 'prayer', '저는 예수님의 십자가를 대신 진 구레네 사람 시몬이에요(막 15:21). 이 길은 붙잡히신 때부터 베드로의 부인, 심문, 채찍과 조롱, 골고다의 십자가, "다 이루었다"까지 열두 정거장이에요. 누구나 걸을 수 있는 열린 길이에요.'],
  bridge: ['니고데모', 0x5a6a8a, 'witness', '저는 밤에 예수님을 찾아가 거듭남을 들은 니고데모예요(요 3:3). 이 길은 죄 때문에 생긴 하나님과 사람 사이의 낭떠러지에 그리스도의 십자가가 다리가 되어 주는 생명의 다리예요. 구원의 확신까지 여섯 정거장이고, 친구에게 복음을 전할 때 쓰는 그림이에요.'],
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

  // ---------- 말풍선 ----------
  const box = document.createElement('div');
  box.className = 'npcb'; box.id = 'gtalk'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="say"></p><div class="row"><button class="later">나중에</button><button class="go" hidden>길 시작점으로</button><button class="next">부탁 받기</button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  let cur = null, closedFor = null;
  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (!cur) return;
    const c = e.target.classList;
    if (c.contains('later')) { closedFor = cur; hide(); }
    else if (c.contains('next')) accept(cur);
    else if (c.contains('go')) { const g = cur; closedFor = g; hide(); goTo?.(TRAILS[g.id].samples[Math.min(12, TRAILS[g.id].samples.length - 1)], `${COURSE_META[g.id].name}${jo(COURSE_META[g.id].name, '으로', '로')} 들어가요`); }
  });
  const hide = () => { box.hidden = true; cur = null; document.body.classList.remove('talking'); };
  const statName = (s) => STATS.find((x) => x.id === s)?.name || '';
  function talk(g) {
    cur = g;
    const nm = COURSE_META[g.id].name, R = rec()[g.id], tt = total(g.id), sn = Math.min(seen(g.id), tt);
    $('.who b').textContent = g.name;
    $('.n').textContent = `${nm} ${stars(g.id)}`.trim();
    let say = g.about, btn = '부탁 받기';
    const quest = `부탁: 이 길의 정거장 ${tt}곳을 모두 들러 말씀을 보고 오세요. 마치면 걸음 +10, ${statName(g.stat)} +3, 2 데나리온.`;
    if (!isOpen(g.id)) { say += ` 이 길은 ${TIER_STAGE[TIER[g.id]]}부터 들어갈 수 있어요. 정원 훈련장과 부탁으로 자란 뒤에 다시 와요.`; btn = ''; }
    else if (R === 'done') { say = `${nm}${jo(nm, '을', '를')} 끝까지 걸었군요! 정거장 ${tt}곳을 다 들렀어요. 언제든 다시 걸으며 말씀을 묵상해요.`; btn = ''; }
    else if (R === 'on') { say = `${nm}: 정거장 ${sn} / ${tt}곳을 들렀어요.${TIER[g.id] ? ' 길을 막는 어둠의 속삭임은 말씀으로 이겨요.' : ''} 길 끝까지 가면 E로 입구에 돌아올 수 있어요.`; btn = ''; }
    else say += ` ${quest}${TIER[g.id] ? ` 길 ${TIER[g.id] + 1}곳에서 어둠의 속삭임이 길을 막아요.` : ''}`;
    $('.say').textContent = say;
    $('.next').hidden = !btn; $('.next').textContent = btn;
    $('.go').hidden = !isOpen(g.id) || R === 'done';
    box.hidden = false; document.body.classList.add('talking');
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
        if (!rec()[g.id]) toast(`${g.name}: ${COURSE_META[g.id].name} 입구예요. 길을 알려 줄게요, 제 곁으로 오세요`, 4);
      }
      if (d > 30) g.said = false;
    }
    const now = performance.now();
    if (now - T > 1000) { T = now; for (const id of Object.keys(rec())) check(id); }
    if (cur) { if (Math.hypot(me.x - cur.n.x, me.z - cur.n.z) > 4.5) hide(); return; }
    if (busy()) return;
    let near = null;
    for (const g of list) if (Math.hypot(me.x - g.n.x, me.z - g.n.z) < 3.2) near = g;
    if (near && near !== closedFor) talk(near);
    if (!near) closedFor = null;
  }
  function pin() { for (const g of list) if (g.n.state !== 'walk') { g.n.x = g.n.home.x; g.n.z = g.n.home.z; } }

  return { step, pin, active: () => !!cur, list };
}
