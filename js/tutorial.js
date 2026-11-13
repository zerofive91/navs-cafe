// 처음 온 사람을 위한 안내 두 가지
//   카페: 바나바가 걷기·주문·앉기·눕기와 수레바퀴 다섯 동작(Z X C V B), 지도(M)를 알려 줌
//   정원: 정원지기 아담이 걷기·달리기, 점프, 지도로 코스 찾기, 반짝이는 체험(E), 별 보기, 사진을 알려 줌
// 한 단계씩 말풍선으로 부탁하고, 그 키나 단추를 실제로 눌러 보면 다음으로 넘어감.
// 휴대폰에서는 키 대신 같은 자리의 단추를 알려 줌. 언제든 넘기거나 끝낼 수 있고, '나' 카드에서 다시 볼 수 있음
import { offerTalk, markAutoSaid } from './talkgate.js';
import * as THREE from 'three';
import { giveItem, addSteps, ITEMS, jo } from './profile.js';
import { ICONS } from './icons.js';
import { createDialog } from './dialog.js';

const TOUCH = matchMedia('(hover: none)').matches;

// 머리 위 이름표 (말씀 안내자에게는 금빛 말풍선 표시)
export function nameTag(text) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 96;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(1.2, 0.45, 1);
  sp.position.y = 1.72;
  sp.renderOrder = 5;
  sp.userData.draw = (call) => {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, 256, 96);
    g.font = '600 30px "Noto Serif KR", serif';
    const w = Math.min(240, g.measureText(text).width + 34);
    const x = 128 - w / 2;
    g.fillStyle = 'rgba(255, 250, 238, 0.92)';
    g.beginPath(); g.roundRect(x, 50, w, 40, 20); g.fill();
    g.fillStyle = '#6b4c32'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 71);
    if (call) { // 부탁할 것이 있을 때: 금빛 동그라미에 점 세 개
      g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(128, 22, 19, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7a5418';
      for (const d of [-8, 0, 8]) { g.beginPath(); g.arc(128 + d, 22, 3, 0, Math.PI * 2); g.fill(); }
    }
    tex.needsUpdate = true;
  };
  sp.userData.draw(false);
  return sp;
}

export function initTutorial(K) {
  const { me, profile, save, toast, sfx, burst, walkTo, faceTo, barnabas, adam, tutors = () => [adam], home, near, lying, map, photoOn, outdoors, busy = () => false } = K;
  const marks = new Set();
  let run = null; // { id, npc, list, i, t, moved, done }

  // ---------- 말풍선 (dialog.js). 안내 중에는 body.talking 대신 body.tutoring ----------
  const dlg = createDialog({ id: 'tut', talking: false });
  const box = dlg.el;

  const nm = () => profile.name || '손님';
  // 단계: aim 눌러야 할 단추(aria-label, 안내 중 초록 고리로 반짝임), say 말, keys 컴퓨터 키 [키, 뜻], touch 휴대폰에서 바꿔 할 말, done 다 했는지, auto 읽고 넘기는 단계
  const CAFE = [
    { auto: true, say: () => `샬롬, ${nm()}님! 저는 이 카페를 돌보는 바나바예요. 여기서 쉬어 가는 법을 하나씩 알려 드릴게요.`, verse: '저가 이르러 하나님의 은혜를 보고 기뻐하여 모든 사람에게 굳은 마음으로 주께 붙어 있으라 권하니 (사도행전 11:23)' },
    { aim: [], say: '먼저 걸어 볼까요?', keys: [['↑ ↓', '앞으로 · 뒤로'], ['← →', '몸 돌리기'], ['오른쪽 클릭', '그곳으로 걷기']], touch: '왼쪽 아래 동그라미를 밀거나, 가고 싶은 곳을 화면에서 눌러 보세요.', done: (r) => r.moved > 4 },
    { aim: ['cafe menu', 'order'], say: '교제의 자리, 카운터로 가 봐요.', keys: [['C', '카운터로 걸어가기']], touch: '위쪽 집 모양 단추를 누르면 카페 단추들이 펼쳐져요. 컵 단추를 눌러요.', done: () => near('order') },
    { aim: ['order'], say: '여기서 마실 것이나 빵을 받을 수 있어요. 메뉴를 열고 하나 골라 보세요.', keys: [['C', '메뉴 열기'], ['마우스', '메뉴에서 고르기']], touch: '반짝이는 주문 단추를 누르고 메뉴에서 하나 골라 보세요.', done: () => me.item === 'cup' || !!me.food },
    { aim: ['sip', 'eat'], say: '받았네요! 한 모금 마시거나 한 입 먹어 봐요.', keys: [['L', '마시기 · 먹기']], touch: '오른쪽의 마시기(먹기) 단추를 눌러 보세요.', done: () => marks.has('sip') || marks.has('eat') },
    { aim: ['sit'], say: '이제 자리에 앉아 볼까요? 가까운 의자가 있으면 거기에 앉아요.', keys: [['J', '앉기 · 일어서기']], touch: '오른쪽의 앉기 단추를 눌러 보세요.', done: () => me.state === 'sit' },
    { aim: ['recline'], say: '누워서 쉴 수도 있어요. 가만히 있으면 화면 가장자리가 따뜻해져요.', keys: [['K', '눕기']], touch: '오른쪽의 눕기 단추를 눌러 보세요.', done: () => lying() },
    { aim: ['read'], say: '이 카페는 수레바퀴 모양이에요. 첫째는 말씀이에요. 성경을 펼치면 한 구절이 떠요.', keys: [['Z', '말씀 읽기'], ['Enter', '다음 구절']], touch: '오른쪽의 책 단추를 눌러 보세요. 말씀 카드를 누르면 다음 구절로 넘어가요.', done: () => marks.has('read') },
    { aim: ['pray'], say: '둘째는 기도예요. 그 자리에서 손을 모아요.', keys: [['X', '기도']], touch: '오른쪽의 기도 단추(두 손을 모은 모양)를 눌러 보세요.', done: () => marks.has('pray') },
    { aim: ['praise'], say: '찬양도 해 봐요.', keys: [['B', '찬양']], touch: '오른쪽의 찬양 단추(음표 모양)를 눌러 보세요.', done: () => marks.has('praise') },
    { aim: ['share', 'wave'], say: '증거는 예수님 이야기를 나누는 거예요. 곁에 사람이 있으면 빛을 건네요. 지금은 손 흔들기 단추로 인사해 봐요.', keys: [['V', '증거']], touch: '오른쪽의 손 흔들기 단추를 눌러 보세요.', done: () => marks.has('KeyV') || marks.has('share') || marks.has('wave') },
    { aim: ['map'], say: '전체 지도를 열어 볼까요? 지도에서 누른 곳으로 걸어가요.', keys: [['M', '지도 열기 · 닫기'], ['Esc', '닫기']], touch: '위쪽의 지도 단추를 눌러 보세요.', done: () => marks.has('mapOpen') && map.el.hidden },
    { auto: true, desk: true, say: '단축키가 생각나지 않으면 언제든 물음표를 누르세요.', keys: [['? / F1', '단축키 안내']] },
    { auto: true, end: true, say: () => `잘했어요, ${nm()}님! 받은 것을 담는 광주리를 드릴게요. 문 밖으로 나가면 정원 안내자가 마중 나와요.`, reward: ['basket', 'manna'] },
  ];
  const GARDEN = [
    // 첫 인사는 말을 건 안내자마다 다름 (아담 또는 입구마다 선 안내자: npc.intro)
    { auto: true, say: () => (run?.npc?.intro ? run.npc.intro.say(nm()) : `${nm()}님, 어서 오세요. 저는 정원지기 아담이에요. 정원과 숲을 다니는 법을 알려 드릴게요.`), verse: () => (run?.npc?.intro ? run.npc.intro.verse : '여호와 하나님이 그 사람을 이끌어 에덴 동산에 두사 그것을 다스리며 지키게 하시고 (창세기 2:15)') },
    { aim: ['walk', 'run'], say: '정원에서는 저절로 달려요. 천천히 걷고 싶으면 걷기로 바꿔요.', keys: [['Shift', '걷기 ↔ 달리기']], touch: '오른쪽의 걷기 단추를 눌러 보세요.', done: () => marks.has('walk') || marks.has('run') },
    { aim: ['jump'], say: '뛰어 볼까요? 공중에서 또 누르면 두 번, 세 번 뛰어요.', keys: [['Space', '점프']], touch: '오른쪽의 점프 단추를 눌러 보세요.', done: () => marks.has('jump') },
    { aim: ['map'], say: '지도를 열어 봐요. 가운데가 카페, 둘레가 정원이에요. 바깥 숲에는 성경 이야기 길이 있어요. 지금은 둘러보기만 해도 돼요.', keys: [['M', '지도'], ['마우스', '가고 싶은 곳 누르기']], touch: '위쪽의 지도 단추를 눌러 보세요.', done: () => marks.has('mapOpen') && map.el.hidden },
    { say: '금빛으로 반짝이는 단추는 그 자리에서만 하는 체험이에요. 꽃밭에서 꽃을 들어 봐요.', keys: [['E', '그 자리 체험']], touch: '꽃밭으로 가서 반짝이는 단추를 눌러 보세요.', done: () => marks.has('place') },
    { aim: ['recline', 'stars'], say: '풀밭에 누워 하늘을 볼까요? 누운 채로 별을 볼 수 있어요.', keys: [['K', '눕기'], ['N', '별 보기']], touch: '눕기 단추를 누른 다음, 반짝이는 별 단추를 눌러 보세요.', done: () => marks.has('stars') },
    { aim: ['photo'], say: '마음에 드는 풍경은 사진으로 남겨요.', keys: [['P', '사진 모드'], ['Space', '찰칵'], ['Esc', '나오기']], touch: '위쪽의 사진기 단추를 눌러 보세요.', done: () => marks.has('photo') && !photoOn() },
    { auto: true, end: true, say: () => `이제 마음껏 다녀 보세요, ${nm()}님. 이 겨자씨를 드릴게요. 어디로 갈지 모르겠으면 왼쪽 위 카드를 누르거나 문 앞 안내자에게 물어봐요.`, reward: ['mustard'] },
  ];

  function start(id, who) {
    if (run) stop();
    const npc = id === 'cafe' ? barnabas : who || adam;
    const list = (id === 'cafe' ? CAFE : GARDEN).filter((s) => !(TOUCH && s.desk));
    run = { id, npc, list, i: -1, t: 0, moved: 0, px: me.x, pz: me.z, wait: 0 };
    marks.clear();
    document.body.classList.add('tutoring');
    // 말을 걸러 다가옴
    if (Math.hypot(npc.x - me.x, npc.z - me.z) > 2.6) walkTo(npc, { x: me.x + (npc.x - me.x) * (1.6 / Math.hypot(npc.x - me.x, npc.z - me.z)), z: me.z + (npc.z - me.z) * (1.6 / Math.hypot(npc.x - me.x, npc.z - me.z)) });
    npc.tag.userData.draw(false);
    advance();
  }
  function show() {
    const s = run.list[run.i];
    const say = typeof s.say === 'function' ? s.say() : s.say;
    const verse = typeof s.verse === 'function' ? s.verse() : s.verse;
    const keys = [];
    // 눌러야 할 단추 모양을 말풍선에도 보여 줌 (기도·찬양처럼 비슷한 단추를 헷갈리지 않게)
    const icons = (s.aim || []).filter((n) => ICONS[n] && n !== 'cafe menu');
    if (icons.length) { const q = document.createElement('span'); q.className = 'ico'; q.innerHTML = icons.map((n) => `<i>${ICONS[n]}</i>`).join(''); keys.push(q); }
    if (!TOUCH && s.keys) for (const [k, d] of s.keys) { const p = document.createElement('span'), b = document.createElement('kbd'); b.textContent = k; p.append(b, d); keys.push(p); }
    if (TOUCH && s.touch) { const p = document.createElement('span'); p.className = 'tt'; p.textContent = s.touch; keys.push(p); }
    box.classList.remove('ok');
    dlg.open({
      who: run.id === 'cafe' ? '바나바' : run.npc.tutName || '아담',
      n: `${run.i + 1} / ${run.list.length}`,
      say, verse, keys,
      choices: [
        { label: '안내 끝내기', cls: 'end', hidden: !!s.end, on: () => stop('skip') },
        { label: '넘기기', cls: 'skip', hidden: !!s.auto, on: advance },
        { label: s.end ? '감사해요' : '다음', cls: 'next', hidden: !s.auto, main: true, on: advance },
      ],
      // 처음 안내는 Esc로 닫지 않음 (지도·사진을 Esc로 닫는 단계가 있음). 읽고 넘기는 단계에서만 '다음'에 포커스
      focus: !!s.auto,
    });
  }
  function advance() {
    if (!run) return;
    const cur = run.list[run.i];
    if (cur && cur.end) return stop('done');
    run.i++;
    run.t = 0; run.moved = 0; run.wait = 0;
    marks.clear();
    if (run.i >= run.list.length) return stop('done');
    show();
  }
  function stop(how) {
    if (!run) return;
    const r = run;
    run = null;
    dlg.close();
    aimAt(null);
    document.body.classList.remove('tutoring');
    if (how) {
      if (!profile.tut[r.id] || how === 'done') profile.tut[r.id] = how;
      if (r.id === 'garden') markAutoSaid('way:' + (r.npc.tutName || '아담')); // 안내를 해 준 안내자는 곧바로 또 길 안내를 열지 않게 (T03 C)
      if (how === 'done') {
        const last = r.list[r.list.length - 1];
        const got = (last.reward || []).filter((id) => !profile.items.includes(id));
        for (const id of got) giveItem(profile, id);
        addSteps(profile, 10);
        if (got.length) { // '광주리와 만나를 받았어요' (조사는 받침에 맞춤)
          const ns = got.map((id) => ITEMS[id].name), all = ns.map((n, i) => (i < ns.length - 1 ? n + jo(n, '과', '와') + ' ' : n)).join('');
          toast(`${all}${jo(all, '을', '를')} 받았어요. 왼쪽 위 내 이름을 누르면 볼 수 있어요`, 5);
        }
        sfx('orb', 0.25, 1.1);
        burst(me.x, me.y + 1.2, me.z);
      }
      save();
      K.onChange?.();
    }
    for (const n of tutors()) n.tag.userData.draw(!profile.tut.garden);
    // 바나바는 제자리(입구)로 돌아감
    if (r.id === 'cafe') setTimeout(() => walkTo(barnabas, home.barnabas, () => { barnabas.face = Math.PI; }), 1200);
  }

  // 지금 단계에서 눌러야 할 단추에 초록 고리 (단추 줄은 자주 다시 그려지므로 0.2초마다 다시 붙임)
  function aimAt(names) {
    for (const el of document.querySelectorAll('.tutAim')) if (!names || !names.includes(el.getAttribute('aria-label'))) el.classList.remove('tutAim');
    for (const n of names || []) for (const el of document.querySelectorAll(`#actions [aria-label="${n}"], #places [aria-label="${n}"]`)) el.classList.add('tutAim');
  }
  // 키나 단추를 눌렀을 때 main.js에서 알려 줌
  function mark(name, place) {
    marks.add(name);
    if (place) marks.add('place');
  }

  // 카페를 나서면 정원 안내자가 먼저 다가와 안내 (T03 B, 2026-11-13 사용자 요청)
  //   실내 → 실외로 나선 순간 곧바로, 처음부터 밖에 있었으면(다른 마을에서 돌아옴 등) 1.5초 뒤. 한 접속에 한 번만 (저장 안 함)
  //   "안내 끝내기"를 누르면 tut.garden = 'skip' 이라 다시 오지 않음. 그 뒤에도 말 걸기·왼쪽 카드로는 언제든 받음
  let autoGarden = false, wasOut = null, outAt = 0, outDelay = 0;
  function autoStartGarden() {
    if (run || autoGarden || !profile.name || !profile.tut.cafe || profile.tut.garden || document.body.classList.contains('at-door')) { wasOut = null; return; }
    const out = outdoors(), t = performance.now();
    if (!out) { wasOut = false; return; }
    if (wasOut !== true) { outDelay = wasOut === false ? 0 : 1500; outAt = t; wasOut = true; }
    if (t - outAt < outDelay) return;
    if (busy() || photoOn() || me.climb || me.state === 'sit' || lying()) return; // 하던 일이 끝나면 그때
    let best = null, bd = Infinity;
    for (const n of tutors()) { const d = Math.hypot(me.x - n.x, me.z - n.z); if (d < bd) { bd = d; best = n; } }
    if (!best) return;
    if (t - outAt > outDelay + 8000 && bd > 8) return; // 나선 지 오래고 멀리 가 있으면 숲 깊은 곳까지 걸어오지 않음 (가까이 오면 그때, T03 검토 B-1)
    autoGarden = true;
    start('garden', best);
  }

  let tick = 0; // 0.2초마다 확인 (실제 시간 기준)
  function step(dt) {
    autoStartGarden();
    // 아담: 정원 안내를 아직 안 받았으면 금빛 말풍선, 가까이 오면 말을 검
    // 입구마다 선 안내자도 같은 정원 안내를 해 줌 (가장 가까운 안내자가 말을 검)
    if (!run && profile.name && profile.tut.cafe && !profile.tut.garden && outdoors()) {
      const t = tutors().find((n) => Math.hypot(me.x - n.x, me.z - n.z) < 3.6);
      if (t) offerTalk('tut:' + (t.tutName || 'adam'), t, () => start('garden', t)); // 말 걸기 단추를 눌러야 시작
    }
    for (const n of [barnabas, ...tutors()]) {
      const d = Math.hypot(me.x - n.x, me.z - n.z);
      if (n.state !== 'walk' && d < 6) n.face = Math.atan2(me.x - n.x, me.z - n.z);
    }
    if (!run) return;
    if (map.el && !map.el.hidden) marks.add('mapOpen');
    if (photoOn()) marks.add('photo');
    run.moved += Math.hypot(me.x - run.px, me.z - run.pz);
    run.px = me.x; run.pz = me.z;
    run.t += dt;
    const now = performance.now();
    if (now - tick < 200) return;
    tick = now;
    const s = run.list[run.i];
    aimAt(box.classList.contains('ok') ? null : s.aim);
    if (s.auto || box.classList.contains('ok')) return;
    if (s.done && s.done(run)) {
      box.classList.add('ok');
      sfx('tap', 0.2, 1.4);
      setTimeout(advance, 900);
    }
  }
  // 읽고 넘기는 단계에서는 Enter로 다음
  function onKey(code) {
    if (!run || !dlg.isOpen()) return false;
    const s = run.list[run.i];
    if ((code === 'Enter' || code === 'NumpadEnter') && s.auto) { advance(); return true; }
    return false;
  }

  for (const n of tutors()) n.tag.userData.draw(!profile.tut.garden);
  return { start, stop, mark, step, onKey, active: () => !!run };
}
