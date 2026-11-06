// 요한복음 마을 사건 데이터 (2026-11 1차 MVP, 기획서 3.4·7장)
//   와 보라(1장) · 가나의 혼인잔치(2장) · 니고데모, 밤에(3장) · 실로암(9장)
//   2차 가 (갈릴리·사마리아): 야곱의 우물(4장) · 말씀을 믿고 가다(4장, 표적 ②) · 오병이어(6장, ④) · 밤바다(6장, ⑤) · 생명의 떡(6장, 💡 떡 등불)
//   2차 나 (예루살렘·베다니): 아버지 집(2장) · 베데스다(5장, ③) · 세상의 빛(7-8장, 💡 빛 등불) · 선한 목자(10장, 💡 문·목자 등불) · 나사로야 나오라(11장, ⑦ 💡 부활 등불) · 나드 향유(12장)
//   3차 (다락방·수난·부활): 발 씻기심(13장) · 길·포도나무(14-17장, 💡 길·포도나무 등불) · 동산과 숯불(18장) · 진리 · 다 이루었다(18-19장) · 마리아야(20장) · 닫힌 문 · 도마(20장) · 디베랴 바다의 아침(21장)
//     quiet: 수난 두 사건은 시험·보상 없이 기록만. 장소 도구는 js/john/passion.js
//   lamp는 등불 하나(문자열) 또는 여럿(배열). 장소 도구(장사판·돌·무리 등)는 js/john/jerusalem.js
//   두 사건이 한 증인을 쓰면(베드로) stand에 그 사건 때 설 자리(SP 이름)를 적음. reset: 그만두거나 마치면 제자리로 돌릴 사람
//   필수: 듣기(l, 증인의 말) · 읽기(r, 말씀 카드) · 적용(a, 말씀대로 해 보는 단계)
//   선택(깊이 보기): 공부(s) · 암송(m) · 묵상(d). 여섯을 다 채우면 그 사건 표시가 금빛
//   steps(X)는 quests.js 단계 형식 그대로 {hint, go, where, until | place·at·r·act | talk·open}. X는 engine.js가 넘기는 도구
//   (X.P 자리, X.near·X.sitting·X.praying, X.verse, X.sky, X.carry, X.trial, X.walkNpc·X.follow, X.blur, X.water …)
//   말씀 키(jn-)는 js/verses.js, 현대어 짝은 js/bible-modern.js. 예수님은 사람 모습으로 두지 않고 따뜻한 빛으로만 (기획서 0장)

// 여는 차례 (큰 줄기는 장 순서. 2차 가에서 4·6장, 2차 나에서 2·5·7-8·10-12장, 3차에서 13-21장을 채움. 마친 사건은 언제든 다시)
export const ORDER = ['come', 'cana', 'temple', 'nico', 'well', 'official', 'bethesda', 'loaves', 'sea', 'bread', 'light', 'siloam', 'shepherd', 'lazarus', 'nard',
  'wash', 'way', 'arrest', 'truth', 'mary', 'thomas', 'morning'];

export const EV = {
  // ---------- ① 와 보라 (1:1-51, Z1 → Z2): 마을 안내를 겸함 ----------
  come: {
    id: 'come', ch: '1:1-51', zone: 'jordan', start: 'light', title: '와 보라', sign: 0, who: '사도 요한', npc: 'john',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_scroll', 'jn_fig'] }, after: '',
    listen: '저는 그날 세례 요한 곁에 있다가 그분을 따라간 둘 가운데 하나예요(1:40). 때가 열 시쯤이었지요. 처음부터 따라가 봐요. 먼저 광장 북서쪽 길 끝에서 등불을 받아, 어둠 속을 걸어 가운데 빛까지 와요.',
    read: ['jn-1-1', 'jn-1-4', 'jn-1-5', 'jn-1-14', 'jn-1-29', 'jn-1-39', 'jn-1-41', 'jn-1-46', 'jn-1-47', 'jn-1-48', 'jn-1-49'],
    study: { q: '두 제자가 그분과 함께 머문 때는 몇 시쯤이었나요?', a: ['열 시쯤', '여섯 시쯤', '밤'], ok: 0, v: 'jn-1-39' },
    memo: { v: 'jn-1-12', parts: 4 },
    med: { q: '"무엇을 구하느냐" 하고 물으셨어요. 내가 찾는 것은 무엇인가요?', at: 'med2', sec: 20, v: 'jn-1-38', where: '요단 강가' },
    done: '그날 나다나엘도 그분을 만났어요. 누군가에게 "와 보라" 하는 것이 증거의 첫걸음이에요. 이 두루마리는 마을 기록장이에요. 다음 이야기는 갈릴리 가나의 잔치예요.',
    steps: (X) => [
      { hint: '광장 북서쪽 길 끝 등불 자리에서 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.lampAt, where: '빛의 광장 북서쪽 길 끝', place: 'jn_lamp', at: () => X.P.lampAt, r: 2.4,
        act: () => { X.carry('lamp'); X.parts.lampStand.visible = false; X.sfx('orb', 0.2, 0.9); } },
      { hint: '어둠이 좁혀 와요. 멈추지 말고 가운데 빛까지 걸어가요 (막히면 X 기도)', go: X.center, where: '광장 가운데 빛',
        enter: (r, next) => { X.sky('dark', 'light'); X.trial.light({ to: X.center, r: 3.4, lines: ['어두워서 아무것도 안 보여. 그냥 멈춰 있어.', '빛은 너무 멀어.', '여기서 쉬어. 걸어 봤자야.'], then: next }); },
        leave: () => { X.sky(null); X.carry(null); X.parts.lampStand.visible = true; X.burst(X.center.x, 1.8, X.center.z); X.verse(['jn-1-1', 'jn-1-4', 'jn-1-5', 'jn-1-14'], '빛이 어두움에 비취되'); X.toast('광장이 밝아졌어요. 이제 요단 강 건너 베다니로 가요 (금빛 기둥, 여울로 강을 건너요)', 5); } },
      { hint: '요단 강 건너 베다니, 세례 요한 곁 빛나는 자리에 서요', go: X.P.bapStand, where: '요단 건너 베다니 (여울로 건너요)',
        until: (r, dt) => { r.t = X.near(X.P.bapStand, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => { X.parts.warm.visible = true; X.say('세례 요한', '보라 세상 죄를 지고 가는 하나님의 어린 양이로다!'); X.verse(['jn-1-29'], '이튿날'); } },
      { hint: '안드레를 따라 걸어요. 작은 집 앞 의자에 앉아요 (J 또는 앉기)', go: X.P.bench2, where: '요단 건너 베다니 작은 집',
        enter: () => { X.say('안드레', '그분이 머무시는 곳에 가 봐요. 저를 따라와요'); X.walkNpc('andrew', X.P.andrewPath); },
        until: (r, dt) => { r.t = X.sitting(X.P.bench2, 1.8) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => { X.sky('ten', 'jordan'); X.verse(['jn-1-38', 'jn-1-39', 'jn-1-41'], '열 시쯤'); X.toast('열 시쯤이 되었어요. 무화과나무 아래 나다나엘에게 가 봐요', 4); } },
      { hint: '빌립이 되어 무화과나무 아래 나다나엘에게 말을 걸어요', go: X.P.nathan, where: '무화과나무 아래', talk: 'nathan',
        open: (r, next) => X.trial.answer({
          who: '나다나엘', lie: '"나사렛에서 무슨 선한 것이 날 수 있느냐?" 나다나엘이 고개를 저어요. 마음 한쪽에서 속삭임이 들려요. "그냥 두고 가."',
          q: '빌립이 되어 대답해 보세요',
          opts: [
            { t: '"와 보라"', ok: true },
            { t: '"맞아, 그냥 가자"', why: '편견이 길을 막으면 만나야 할 분을 못 만나요. 빌립은 다투지 않고 와서 보자고 했어요 (1:46)' },
            { t: '"나도 잘 몰라"', why: '다 몰라도 괜찮아요. 내가 만난 그분께 함께 가 보자고 초대하면 돼요' },
          ],
          win: 'jn-1-46', then: next,
        }) },
      { hint: '나다나엘과 함께 강가의 따뜻한 빛으로 가요', go: X.P.warm, where: '요단 강가 따뜻한 빛',
        enter: () => X.follow('nathan'),
        until: () => X.near(X.P.warm, 4) && X.dn('nathan', X.P.warm) < 4.5,
        leave: () => { X.unfollow('nathan'); X.verse(['jn-1-47', 'jn-1-48', 'jn-1-49'], '무화과나무 아래 있을 때에'); } },
    ],
  },

  // ---------- ② 가나의 혼인잔치 (2:1-11, Z3): 첫 표적, 순종의 기쁨 ----------
  cana: {
    id: 'cana', ch: '2:1-11', zone: 'cana', title: '가나의 혼인잔치', sign: 1, who: '하인', npc: 'servant',
    stat: 'obey', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_jar'] }, after: 'come', time: 'feast',
    listen: '잔치 사흘째, 포도주가 떨어졌어요. 그분의 어머니가 우리에게 "무슨 말씀을 하시든지 그대로 하라" 하셨어요. 그분은 저 돌항아리 여섯에 물을 채우라 하셨지요. 오늘은 당신도 앞치마를 두른 하인이에요. 함께 해 볼래요?',
    read: ['jn-2-1', 'jn-2-5', 'jn-2-7', 'jn-2-8', 'jn-2-9', 'jn-2-10', 'jn-2-11'],
    study: { q: '돌항아리는 몇 개였나요?', a: ['여섯', '일곱', '열둘'], ok: 0, v: 'jn-2-6' },
    memo: { v: 'jn-2-5', parts: 4 },
    med: { q: '오늘 내가 "그대로" 해 볼 말씀은 무엇인가요?', at: 'feast', sec: 20, v: 'jn-2-5', where: '잔치 식탁' },
    done: '말씀대로 했을 뿐인데 물이 좋은 포도주가 되었어요. 이 돌항아리를 가져가요. 다음은 유월절의 예루살렘, 성전 뜰이에요.',
    begin: (X) => { X.apron(true); X.jarsReset(); },
    end: (X) => { X.apron(false); },
    steps: (X) => {
      const fill = (goal) => ({
        hint: (r) => `우물에서 물을 길어(E) 돌항아리에 부어요 · 항아리 ${X.jarsFull()}/6`, where: '가나 잔치 집 마당',
        go: () => (X.carrying() ? X.nextJar() : X.P.well),
        place: 'jn_water', at: () => (X.carrying() ? X.nextJar() : X.P.well), r: 1.9,
        act: () => {
          if (!X.carrying()) { X.carry('jar'); X.sfx('cup', 0.2, 0.8); return false; }
          X.fillJar(); X.carry(null);
          return X.jarsFull() >= goal;
        },
      });
      return [
        fill(3),
        { hint: '속삭임이 들려요. 무엇을 내려놓을까요?', go: () => X.P.servant, where: '가나 잔치 집 마당',
          enter: (r, next) => X.trial.drop({
            who: '어둠의 속삭임', lie: '"물로 뭘 하겠어? 잔치는 이미 망했어. 그냥 가만있어."',
            q: '손에 든 것과 마음에 든 것, 무엇을 내려놓을까요?',
            opts: [
              { t: '속삭임을 내려놓고, 물동이를 들고 계속 채워요', ok: true },
              { t: '빈 물동이를 내려놓고 쉬어요', why: '이해가 안 되어도 말씀대로 하는 것이 순종이에요. "무슨 말씀을 하시든지 그대로 하라" (2:5)' },
            ],
            drop: () => X.dropFx(), win: 'jn-2-5', then: next,
          }) },
        fill(6),
        { hint: '항아리에서 한 잔 떠요 (E)', go: () => X.nearJar(), where: '돌항아리', place: 'jn_draw', at: () => X.nearJar(), r: 1.8,
          act: () => { X.carry('cup'); X.verse(['jn-2-7'], '아구까지'); X.sfx('cup', 0.2, 1.1); } },
        { hint: '떠 온 잔을 연회장에게 갖다 주어요 (E)', go: () => X.npcAt('master'), where: '식탁 머리의 연회장', place: 'jn_give', at: () => X.npcAt('master'), r: 2.4,
          act: () => { X.carry(null); X.wine(); X.cheer(); X.verse(['jn-2-8', 'jn-2-9', 'jn-2-10'], '좋은 포도주'); } },
        { hint: '잔치 식탁에 앉아요 (J 또는 앉기)', go: X.P.feast[1], where: '잔치 식탁',
          until: (r, dt) => { r.t = X.P.feast.some((p) => X.sitting(p, 1.3)) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
          leave: () => X.verse(['jn-2-11'], '처음 표적') },
      ];
    },
  },

  // ---------- (2차 나) 아버지 집 (2:13-22, Z7 성전 뜰): 장사판을 치우고 기도 자리 만들기 ----------
  temple: {
    id: 'temple', ch: '2:13-22', zone: 'temple', title: '아버지 집', sign: 0, who: '제자', npc: 'disciple7',
    stat: 'prayer', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_cord'] }, after: 'cana', reset: ['disciple7'],
    listen: '유대인의 유월절이 가까워 그분과 함께 예루살렘에 올라왔어요(2:13). 그런데 성전 뜰에 소와 양과 비둘기 파는 사람들, 돈 바꾸는 사람들이 앉아 있었어요(2:14). 아버지의 집이어야 할 곳이었지요. 함께 그 뜰로 가 봐요.',
    read: ['jn-2-13', 'jn-2-14', 'jn-2-15', 'jn-2-16', 'jn-2-17', 'jn-2-18', 'jn-2-19', 'jn-2-21', 'jn-2-22'],
    study: { q: '그분은 무엇으로 채찍을 만드셨나요?', a: ['노끈', '가죽 끈', '종려 가지'], ok: 0, v: 'jn-2-15' },
    memo: { v: 'jn-2-16', parts: 4 },
    med: { q: '내 마음에서 치워야 할 장사판은 무엇인가요? 그 자리를 기도로 채워요.', at: 'prayAt7', sec: 20, v: 'jn-2-17', where: '치운 성전 뜰' },
    done: '그날은 몰랐지만, 그분이 죽은 자 가운데서 살아나신 뒤에 우리는 "이 성전을 헐라" 하신 말씀을 기억하고 믿었어요(2:22). 이 노끈을 가져가요. 아버지의 집을 깨끗하게 하신 그날을 기억하게 해 줄 거예요. 다음은 예루살렘 윗동네, 밤에 찾아온 니고데모예요.',
    steps: (X) => [
      { hint: '성전 뜰 북서쪽, 장사판 곁 빛나는 자리에 서요', go: X.P.prayAt7, where: '성전 뜰 북서쪽 (성소 앞)',
        until: (r, dt) => { r.t = X.near(X.P.prayAt7, 1.4) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-2-13', 'jn-2-14'], '성전 안에서') },
      { hint: '속삭임이 들려요. 어떤 말씀을 붙들까요?', go: X.P.prayAt7, where: '성전 뜰 북서쪽',
        enter: (r, next) => X.trial.pick({
          who: '어둠의 속삭임', lie: '"다들 이렇게 해. 제사를 드리려면 소와 양과 비둘기가 있어야 하잖아. 괜히 나서지 마."',
          q: '아버지의 집 앞에서 붙들 말씀을 골라요',
          opts: [
            { v: 'jn-2-20', why: '사람이 들인 햇수와 수고만 세면, 그분이 하시려는 일을 보지 못해요' },
            { v: 'jn-2-16', ok: true },
            { v: 'jn-2-18', why: '"표적부터 보이라"는 말은 마음을 바꾸지 않고 따지기만 해요' },
          ],
          then: next,
        }) },
      { hint: () => `어지러운 장사판을 치워요 (E) · ${4 - X.stallsLeft()}/4`, go: () => X.nearStall(), where: '성전 뜰 북서쪽 장사판', place: 'jn_clear', at: () => X.nearStall(), r: 2.4,
        enter: () => X.verse(['jn-2-15'], '노끈으로 채찍을'),
        act: () => X.clearStall() },
      { hint: '치운 자리에서 무릎 꿇고 기도해요 (X 기도)', go: X.P.prayAt7, where: '치운 성전 뜰',
        until: (r, dt) => { r.t = X.praying() && X.near(X.P.prayAt7, 2.6) ? (r.t || 0) + dt : 0; return r.t > 1.6; },
        leave: () => X.verse(['jn-2-16', 'jn-2-17'], '주의 전을 사모하는 열심') },
      { hint: '곁의 제자에게 말을 걸어요', go: () => X.npcAt('disciple7'), where: '성전 뜰 북서쪽', talk: 'disciple7',
        open: (r, next) => X.ui.open({
          who: '제자', sub: '아버지 집', text: '유대인들이 "무슨 표적을 우리에게 보이겠느뇨" 물었을 때, 그분은 이렇게 대답하셨어요. 그때 우리는 무슨 뜻인지 몰랐어요.', quote: 'jn-2-19',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '그 말씀을 기억할게요', cls: 'next', fn: next }],
        }),
        leave: () => X.verse(['jn-2-21', 'jn-2-22'], '성전된 자기 육체') },
    ],
  },

  // ---------- ③ 니고데모, 밤에 (3:1-21, Z10): 밤 연출과 머묾 ----------
  nico: {
    id: 'nico', ch: '3:1-21', zone: 'upper', title: '니고데모, 밤에', sign: 0, who: '니고데모', npc: 'nico',
    stat: 'word', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_nightlamp'] }, after: 'temple', time: 'night',
    listen: '저는 이스라엘의 선생인데 밤에 그분을 찾아왔어요(3:2). 낮에 오기는 사람 눈이 무서웠거든요. 계단으로 지붕에 올라와요. 그날 밤 들은 말씀을 들려줄게요.',
    read: ['jn-3-2', 'jn-3-3', 'jn-3-8', 'jn-3-14', 'jn-3-15', 'jn-3-16', 'jn-3-21'],
    study: { q: '니고데모는 언제 그분을 찾아왔나요?', a: ['밤', '새벽', '한낮'], ok: 0, v: 'jn-3-2' },
    memo: { v: 'jn-3-16', parts: 4 },
    med: { q: '거듭났다는 것은 내게 무엇인가요?', at: 'lie10', lie: true, sec: 20, v: 'jn-3-3', where: '니고데모 집 지붕' },
    done: '저는 그 밤의 말씀을 오래 품었어요. 언젠가 다시 그분 곁에 설 거예요. 이 등잔을 가져가요. 다음은 사마리아 수가, 야곱의 우물이에요.',
    begin: (X) => X.walkNpc('nico', [X.P.nicoRoof], true),
    steps: (X) => [
      { hint: '계단으로 지붕에 올라 등잔 곁에 앉아요 (J 또는 앉기)', go: X.P.seat10, where: '니고데모 집 지붕 (동쪽 바깥 계단)',
        until: (r, dt) => { r.t = X.sitting(X.P.seat10, 1.5) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-3-3'], '밤에') },
      { hint: '바람이 불어요. 빨랫줄 천이 날리는 쪽 빛나는 자리에 3초 서 있어요', go: X.P.seat10, where: '니고데모 집 지붕',
        enter: (r) => { r.k = Math.floor(Math.random() * 3); X.wind(r.k); X.rings(X.P.wind); },
        until: (r, dt) => {
          const i = X.P.wind.findIndex((p) => X.near(p, 0.95));
          if (i === r.k) r.t = (r.t || 0) + dt; else r.t = 0;
          if (i >= 0 && i !== r.k && r.warn !== i) { r.warn = i; X.toast('여기는 바람이 불어오는 쪽이 아니에요. 천이 날리는 쪽을 봐요', 3); }
          return r.t > 3;
        },
        leave: () => { X.rings(null); X.wind(-1); X.verse(['jn-3-8'], '바람이 임의로 불매'); } },
      { hint: (r) => `지붕에 앉아 머물러요. 일어나지 않고 20초 (기도 X도 좋아요) ${X.trial.progress()}`, go: X.P.seat10, where: '니고데모 집 지붕',
        enter: (r, next) => { X.walkers(true); X.trial.stay({ sec: 20, label: '머물기', ok: () => X.onRoof() && (me(X).state === 'sit' || X.praying()), lines: ['누가 보면 어쩌려고.', '이만 내려가.', '선생이 밤에 몰래 여기서 뭘 해?', '내일 온 동네에 소문 날 거야.'], then: next }); },
        leave: () => { X.walkers(false); X.verse(['jn-3-21'], '빛으로 오나니'); } },
      { hint: '지붕 북쪽 끝에서 멀리 장대 위 빛을 바라봐요 (E 또는 반짝이는 단추)', go: X.P.gazeAt, where: '니고데모 집 지붕 북쪽 끝', place: 'jn_look', at: () => X.P.gazeAt, r: 1.6,
        act: () => { X.gaze(X.P.pole); X.verse(['jn-3-14', 'jn-3-15', 'jn-3-16'], '들려야 하리니'); } },
    ],
  },

  // ---------- (2차 가) 야곱의 우물 (4:1-42, Z6 수가): 한낮의 대화, 버려둔 물동이, "와 보라" ----------
  well: {
    id: 'well', ch: '4:1-42', zone: 'sychar', title: '야곱의 우물', sign: 0, who: '사마리아 여인', npc: 'woman',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_waterjar'] }, after: 'nico', time: 'noon', reset: ['vil0', 'vil1', 'vil2'],
    listen: '제 육시쯤, 해가 높을 때였어요. 사람들 눈을 피해 아무도 없을 때 물을 길으러 왔지요. 그런데 우물 곁에 유대 사람 한 분이 앉아 계셨어요(4:6). 오늘은 당신이 물동이를 들고 우물에 가 봐요.',
    read: ['jn-4-6', 'jn-4-7', 'jn-4-9', 'jn-4-10', 'jn-4-13', 'jn-4-14', 'jn-4-17', 'jn-4-24', 'jn-4-25', 'jn-4-26', 'jn-4-28', 'jn-4-29', 'jn-4-35', 'jn-4-39', 'jn-4-42'],
    study: { q: '그분이 우물 곁에 앉으신 때는 몇 시쯤이었나요?', a: ['제 육시쯤', '제 십시쯤', '밤'], ok: 0, v: 'jn-4-6' },
    memo: { v: 'jn-4-14', parts: 4 },
    med: { q: '내 마음이 목마른 것은 무엇인가요? 그분이 주시는 물을 구해요.', at: 'seat6', sec: 20, v: 'jn-4-14', where: '우물가 그늘 의자' },
    done: '저는 물동이를 버려두고 동네로 달려갔어요. 부끄러워 숨던 제가 "와 보라" 하고 외쳤지요. 이 물동이를 가져가요. 다음은 다시 갈릴리 가나, 아들이 아픈 왕의 신하예요.',
    end: (X) => { X.parts.jar6.visible = false; },
    steps: (X) => {
      const told = new Set();
      const LINES = {
        vil0: '한낮에 무슨 일이에요? 당신은 사람들 눈을 피해 다니던 사람 아니에요?',
        vil1: '유대 사람이 사마리아 사람과 말을 했다고요? 그럴 리가요(4:9).',
        vil2: '그리스도라고요? 메시야가 오시면 모든 것을 알려 주신다던데(4:25)…',
      };
      const untold = () => ['vil0', 'vil1', 'vil2'].filter((k) => !told.has(k)).map((k) => X.npcAt(k)).sort((a, b) => Math.hypot(a.x - X.me.x, a.z - X.me.z) - Math.hypot(b.x - X.me.x, b.z - X.me.z))[0];
      return [
        { hint: '우물에서 물을 길어요 (E 또는 반짝이는 단추)', go: X.P.well6, where: '수가 야곱의 우물', place: 'jn_water', at: () => X.P.well6, r: 2.2,
          act: () => { X.carry('jar'); X.warm('well', X.P.warm6); X.sfx('cup', 0.2, 0.8); X.verse(['jn-4-6', 'jn-4-7'], '물을 좀 달라'); } },
        { hint: '우물 곁 따뜻한 빛에 물을 드려요 (E)', go: X.P.warm6, where: '야곱의 우물 곁', place: 'jn_give', at: () => X.P.warm6, r: 2.2,
          act: () => { X.sfx('cup', 0.2, 1.1); X.burst(X.P.warm6.x, 1.6, X.P.warm6.z); X.verse(['jn-4-9', 'jn-4-10', 'jn-4-13', 'jn-4-14'], '생수'); } },
        { hint: '그분이 물으셔요. 마음으로 대답해요', go: X.P.warm6, where: '야곱의 우물 곁',
          enter: (r, next) => X.trial.answer({
            who: '어둠의 속삭임', lie: '"가서 네 남편을 불러 오라"(4:16) 하셨어요. 마음속에서 속삭임이 들려요. "네 지난 일을 알면 아무도 너를 안 받아. 둘러대."',
            q: '뭐라고 대답할까요?',
            opts: [
              { t: '"남편은 지금 일하러 나갔어요"', why: '둘러대면 숨을 수는 있어도 생수는 받지 못해요. 그분은 이미 다 아시고도 나를 찾아오셨어요 (4:18)' },
              { t: '"나는 남편이 없나이다"', ok: true },
              { t: '"그보다, 예배는 어느 산에서 드려야 하나요?"', why: '부끄러운 이야기를 피해 말을 돌리기 쉬워요(4:20). 그분은 정죄하려고가 아니라 생수를 주려고 물으셨어요' },
            ],
            win: 'jn-4-17', then: next,
          }),
          leave: () => X.verse(['jn-4-24', 'jn-4-25', 'jn-4-26'], '내가 그로라') },
        { hint: '물동이를 우물가에 내려놓아요 (E)', go: X.P.jar6, where: '야곱의 우물가', place: 'jn_put', at: () => X.P.jar6, r: 2.2,
          act: () => { X.carry(null); X.parts.jar6.visible = true; X.dropFx(); X.verse(['jn-4-28'], '물동이를 버려두고'); X.toast('이제 동네 사람들에게 "와 보라" 하고 전해요 (우물 서쪽 집들, 세 사람)', 5); } },
        { hint: () => `동네 사람들에게 "와 보라" 하고 전해요 · ${told.size}/3`, go: () => untold() || X.P.well6, where: '수가 동네 (우물 서쪽 집들)', talk: ['vil0', 'vil1', 'vil2'], told: (r, k) => told.has(k),
          open: (r, next, k, n) => X.ui.open({
            who: '수가 사람', sub: '야곱의 우물 · 와 보라', text: LINES[k], quote: 'jn-4-29',
            buttons: [{ t: '나중에', cls: 'later' }, { t: '와 보라!', cls: 'next', fn: () => {
              told.add(k); X.sfx('orb', 0.2, 1.1 + told.size * 0.08); X.burst(n.x, 1.6, n.z);
              X.walkNpc(k, [X.P.come6[['vil0', 'vil1', 'vil2'].indexOf(k)]], true);
              if (told.size >= 3) next(); else X.toast(`"${['', '한 사람이', '두 사람이'][told.size]} 우물로 가요" · ${told.size}/3`, 3);
            } }],
          }),
          leave: () => X.verse(['jn-4-29'], '와 보라') },
        { hint: '동네 사람들과 함께 밭 가에서 눈을 들어 밭을 봐요 (E)', go: X.P.fieldLook, where: '우물 동쪽 희어진 밭', place: 'jn_look', at: () => X.P.fieldLook, r: 1.9,
          act: () => { X.look(X.P.field); X.verse(['jn-4-35', 'jn-4-39', 'jn-4-42'], '희어져 추수하게'); } },
      ];
    },
  },

  // ---------- (2차 가) ② 말씀을 믿고 가다 (4:46-54, Z3 → Z4): 왕의 신하, 되돌아서지 않고 걷기 ----------
  official: {
    id: 'official', ch: '4:46-54', zone: 'cana', title: '말씀을 믿고 가다', sign: 1, who: '왕의 신하', npc: 'official',
    stat: 'obey', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_seal'] }, after: 'well', time: 'seventh', reset: ['official'],
    listen: '저는 가버나움에 사는 왕의 신하예요. 아들이 병들어 거의 죽게 되었어요(4:47). 그분이 가나에 오셨다는 말을 듣고 찾아왔지요. 함께 그분께 가 봐요. 잔치 집 마당 동쪽 밖, 따뜻한 빛 곁이에요.',
    read: ['jn-4-46', 'jn-4-47', 'jn-4-48', 'jn-4-49', 'jn-4-50', 'jn-4-51', 'jn-4-52', 'jn-4-53', 'jn-4-54'],
    study: { q: '아이의 열기가 떨어진 때는 언제였나요?', a: ['어제 제 칠시', '오늘 새벽', '제 육시쯤'], ok: 0, v: 'jn-4-52' },
    memo: { v: 'jn-4-50', parts: 4 },
    med: { q: '보지 않고도 믿고 걸어갈 말씀 하나는 무엇인가요?', at: 'seat4', sec: 20, v: 'jn-4-50', where: '가버나움 신하의 집 곁 의자' },
    done: '그 시에 그분이 "네 아들이 살았다" 하셨어요. 저와 온 집이 다 믿었지요. 이 인장을 가져가요. 다음은 예루살렘 양문 곁, 베데스다 못이에요.',
    begin: (X) => X.warm('cana', X.P.warm3),
    steps: (X) => [
      { hint: '잔치 집 마당 동쪽 밖, 따뜻한 빛 곁에 서요', go: X.P.warm3, where: '가나 잔치 집 마당 동쪽 밖',
        until: (r, dt) => { r.t = X.near(X.P.warm3, 1.7) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => { X.verse(['jn-4-46', 'jn-4-47', 'jn-4-48', 'jn-4-49', 'jn-4-50'], '가라 네 아들이 살았다'); X.carry('scroll'); X.toast('말씀을 받았어요. 이제 가버나움 집까지 걸어가요 (동쪽 호숫가 길, 금빛 기둥)', 5); } },
      { hint: '말씀을 믿고 가버나움으로 걸어가요. 되돌아서지 말고', go: () => X.npcAt('serv0'), where: '가나에서 가버나움 가는 길 (동쪽)',
        enter: (r, next) => { X.servants(true); X.trial.onward({ to: () => X.npcAt('serv0'), r: 3.2, back: 8, turn: '그 사람은 말씀을 믿고 갔어요(4:50). 다시 가버나움 쪽으로 가요', lines: ['돌아가서 함께 가 달라고 해!', '말 한마디로 어떻게 낫겠어?', '적어도 그분을 모시고 가야지.', '이러다 늦으면 어떡해?'], then: next }); },
        leave: () => { X.servantsStop(); X.verse(['jn-4-51'], '아이가 살았다'); } },
      { hint: '마중 나온 종에게 말을 걸어요', go: () => X.npcAt('serv0'), where: '가버나움 가는 길', talk: ['serv0', 'serv1'],
        open: (r, next) => X.ui.open({
          who: '신하의 종', sub: '말씀을 믿고 가다', text: '주인님! 아이가 살았어요!',
          buttons: [{ t: '언제부터 나았나요?', cls: 'next', fn: () => X.ui.open({
            who: '신하의 종', sub: '말씀을 믿고 가다', text: '어제 제 칠시에 열기가 떨어졌어요.', note: '그분이 "네 아들이 살았다" 하신 바로 그때예요.',
            buttons: [{ t: '그 말씀대로 되었어요', cls: 'next', fn: next }],
          }) }],
        }),
        leave: () => X.verse(['jn-4-52', 'jn-4-53'], '그 때인줄 알고') },
      { hint: '가버나움 집으로 가요. 아들이 기다려요', go: X.P.house4, where: '가버나움 왕의 신하의 집 (길 남쪽)',
        until: () => X.near(X.P.house4, 2.2),
        leave: () => { X.carry(null); X.say('신하의 아들', '아버지! 이제 다 나았어요!'); X.verse(['jn-4-54'], '두 번째 표적'); } },
    ],
  },

  // ---------- (2차 나) ③ 베데스다 (5:1-24, Z8): 돗자리에서 핑계를 듣고, 자리를 들고, 막아서는 무리를 거슬러 성전으로 ----------
  bethesda: {
    id: 'bethesda', ch: '5:1-24', zone: 'bethesda', title: '베데스다', sign: 1, who: '병 나은 사람', npc: 'sick',
    stat: 'obey', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_mat'] }, after: 'official', reset: ['sick'],
    listen: '저는 서른여덟 해 동안 이 못가 행각에 누워 있었어요(5:5). 물이 동할 때 저를 못에 넣어 줄 사람이 없어서, 가는 동안에 늘 다른 사람이 먼저 내려갔지요(5:7). 그날을 제 자리에서 겪어 볼래요? 동쪽 행각 돗자리에 앉아요.',
    read: ['jn-5-2', 'jn-5-5', 'jn-5-6', 'jn-5-7', 'jn-5-8', 'jn-5-9', 'jn-5-10', 'jn-5-14', 'jn-5-24'],
    study: { q: '그 병자는 몇 년 된 병자였나요?', a: ['삼십 팔년', '열두 해', '나흘'], ok: 0, v: 'jn-5-5' },
    memo: { v: 'jn-5-8', parts: 3 },
    med: { q: '"네가 낫고자 하느냐" 물으신다면, 핑계 대신 무엇이라 대답할까요?', at: 'mat8', sec: 20, v: 'jn-5-6', where: '베데스다 동쪽 행각 돗자리' },
    done: '그분이 "일어나 네 자리를 들고 걸어가라" 하셨을 때, 저는 곧 나아서 자리를 들고 걸었어요(5:9). 제가 들고 걸었던 이 자리를 가져가요. 다음은 디베랴 바다 건너편, 벳새다 들녘이에요.',
    end: (X) => X.stream(false),
    steps: (X) => [
      { hint: '동쪽 행각 돗자리에 앉아요 (J 또는 앉기)', go: X.P.mat8, where: '베데스다 못 동쪽 행각',
        until: (r, dt) => { r.t = X.sitting(X.P.mat8, 1.4) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-5-2', 'jn-5-5', 'jn-5-6'], '네가 낫고자 하느냐') },
      { hint: '그분이 물으셔요. 대답해요 (창을 닫았으면 병 나은 사람에게 말을 걸어요)', go: X.P.mat8, ring: false, where: '베데스다 동쪽 행각', keepSeat: true,
        enter: (r, next) => X.ui.open({
          who: '베데스다 못가', sub: '베데스다 · 네가 낫고자 하느냐', text: '그분이 내 곁에서 물으셨어요. 뭐라고 대답할까요?', quote: 'jn-5-6',
          buttons: [
            { t: '"물이 동할 때 넣어 줄 사람이 없어요"', fn: () => { r.ans = 1; X.toast('그 사람도 핑계부터 말했어요(5:7). 그래도 그분은 말씀하셨어요', 4); next(); } },
            { t: '"네, 낫고 싶어요"', cls: 'next', fn: () => { r.ans = 1; next(); } },
          ],
          onClose: () => { if (!r.ans) r.closed = true; },
        }),
        leave: () => X.verse(['jn-5-7', 'jn-5-8'], '일어나 네 자리를 들고') },
      { hint: '일어나 자리를 들어요 (E 또는 반짝이는 단추)', go: X.P.mat8, where: '베데스다 동쪽 행각', place: 'jn_lift', at: () => X.P.mat8, r: 1.9,
        act: () => { X.liftMat(); X.carry('mat'); X.sfx('tap', 0.2, 1.1); X.verse(['jn-5-9'], '곧 나아서'); X.toast('자리를 들고 성전으로 걸어가요 (서쪽 길, 금빛 기둥)', 5); } },
      { hint: '자리를 들고 성전으로 가요. 무리가 막아서도 멈추지 말고 (멈추면 밀려나요)', go: X.P.warm7, where: '베데스다에서 성전 뜰 가는 길 (서쪽)',
        enter: (r, next) => { X.stream(true); X.warm('b8', X.P.warm7); X.trial.against({ to: X.P.warm7, r: 2.2, away: X.P.mat8, far: 90, lines: ['안식일인데 네가 자리를 들고 가는 것이 옳지 아니하니라.', '누가 너더러 자리를 들고 가라 했어?', '규칙부터 지켜. 내려놓고 가.', '그 사람이 누군지도 모르잖아(5:13).'], then: next }); },
        leave: () => { X.stream(false); X.verse(['jn-5-10'], '안식일인데'); } },
      { hint: '성전 뜰 따뜻한 빛 곁에 자리를 내려놓아요 (E)', go: X.P.warm7, where: '성전 뜰 동쪽 솔로몬 행각 곁', place: 'jn_put', at: () => X.P.warm7, r: 2.4,
        act: () => { X.carry(null); X.dropFx(); X.burst(X.P.warm7.x, 1.6, X.P.warm7.z); X.verse(['jn-5-14', 'jn-5-24'], '사망에서 생명으로'); } },
    ],
  },

  // ---------- (2차 가) ④ 오병이어 (6:1-15, Z5 벳새다 들녘): 빌립의 셈, 아이의 도시락, 잔디에 앉은 무리, 남은 조각 열둘 ----------
  loaves: {
    id: 'loaves', ch: '6:1-15', zone: 'bethsaida', title: '오병이어', sign: 1, who: '빌립', npc: 'philip',
    stat: 'fellow', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_loaves'] }, after: 'bethesda', reset: ['andrew5', 'boy'],
    listen: '큰 무리가 따라왔어요(6:2). 그분이 저에게 물으셨지요. "우리가 어디서 떡을 사서 이 사람들로 먹게 하겠느냐"(6:5). 저는 곧바로 셈부터 했어요. 당신도 지갑을 열어 셈해 볼래요?',
    read: ['jn-6-5', 'jn-6-6', 'jn-6-7', 'jn-6-9', 'jn-6-10', 'jn-6-11', 'jn-6-12', 'jn-6-13', 'jn-6-14'],
    study: { q: '빌립은 몇 데나리온의 떡으로도 부족하다고 했나요?', a: ['이백 데나리온', '삼백 데나리온', '오십 데나리온'], ok: 0, v: 'jn-6-7' },
    memo: { v: 'jn-6-11', parts: 4 },
    med: { q: '내 손에 있는 작은 것 하나를 그분께 드린다면 무엇일까요?', at: 'med5', lie: true, sec: 20, v: 'jn-6-9', where: '벳새다 언덕 잔디' },
    done: '보리떡 다섯 개로 오천 명이 배불렀고, 남은 조각이 열두 바구니에 찼어요. 이 보리떡을 기억해요. 그날 저물매 제자들은 바다로 내려갔어요. 북쪽 물가의 베드로에게 가 봐요.',
    begin: (X) => { X.groupsOn(true); X.warm('hill', X.P.warm5); },
    steps: (X) => [
      { hint: '빌립의 셈을 들어요. 어떤 말씀을 붙들까요?', go: X.P.philip, where: '벳새다 들녘',
        enter: (r, next) => X.trial.pick({
          who: '어둠의 속삭임', lie: `"이걸로 저 많은 사람을? 계산해 봐." 이백 데나리온은 일꾼의 이백 날 품삯이에요. 지금 내 지갑에는 ${X.wallet()}이 있어요.`,
          q: '셈이 막힐 때 붙들 말씀을 골라요',
          opts: [
            { v: 'jn-6-7', why: '빌립의 셈이에요. 셈은 맞아도 그분이 하실 일을 빼고 센 거예요' },
            { v: 'jn-6-6', ok: true },
            { v: 'jn-6-9', why: '안드레는 작은 것이라도 가져왔어요. 그래도 "얼마나 되겠삽나이까" 하고 망설였지요. 그분은 이미 어떻게 하실지 아셨어요 (6:6)' },
          ],
          then: next,
        }) },
      { hint: '안드레 곁의 아이에게 말을 걸어요', go: () => X.npcAt('boy'), where: '벳새다 들녘', talk: 'boy',
        open: (r, next) => X.ui.open({
          who: '아이', sub: '오병이어', text: '저한테 보리떡 다섯 개랑 물고기 두 마리가 있어요. 이거라도 드릴까요?', quote: 'jn-6-9',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '고마워, 그분께 가져갈게', cls: 'next', fn: () => { X.carry('basket'); X.sfx('tap', 0.2, 1.2); next(); } }],
        }) },
      { hint: '언덕 위 따뜻한 빛에 바구니를 드려요 (E)', go: X.P.warm5, where: '벳새다 언덕 위', place: 'jn_give', at: () => X.P.warm5, r: 2.4,
        act: () => { X.carry(null); X.burst(X.P.warm5.x, 4.4, X.P.warm5.z); X.verse(['jn-6-10'], '앉게 하라'); } },
      { hint: () => `무리를 잔디에 앉혀요 (E) · ${X.groups.filter((g) => g.seated).length}/3`, go: () => (X.nearestGroup((g) => !g.seated) || { g: X.P.warm5 }).g, where: '벳새다 들녘 잔디', place: 'jn_call',
        at: () => (X.nearestGroup((g) => !g.seated) || { g: X.P.warm5 }).g, r: 2.8,
        act: () => { const g = X.nearestGroup((x) => !x.seated); if (g) X.seatGroup(g); const all = X.groupsAll((x) => x.seated); if (all) X.toast('사람들이 앉으니 수효가 오천쯤 되었어요 (6:10)', 4); return all; } },
      { hint: '빛 곁에서 축사하신 떡을 받아요 (E)', go: X.P.warm5, where: '벳새다 언덕 위', place: 'jn_draw', at: () => X.P.warm5, r: 2.4,
        act: () => { X.carry('basket'); X.sfx('orb', 0.22, 1.2); X.verse(['jn-6-11'], '축사하신 후에'); } },
      { hint: () => `앉은 무리에게 떡을 나눠 주어요 · ${X.groups.filter((g) => g.fed).length}/3`, go: () => (X.nearestGroup((g) => !g.fed) || { g: X.P.warm5 }).g, where: '벳새다 들녘 잔디',
        until: () => { const g = X.nearestGroup((x) => !x.fed); if (g && X.near(g.g, 2.8)) X.feedGroup(g); return X.groupsAll((x) => x.fed); },
        leave: () => X.carry(null) },
      { hint: () => `남은 조각을 거두어요 · ${12 - X.crumbsLeft()}/12`, go: () => X.nearestCrumb(), where: '벳새다 들녘 잔디',
        enter: () => { X.crumbsOn(true); X.verse(['jn-6-12'], '남은 조각을 거두고'); },
        until: () => X.crumbsLeft() === 0,
        leave: () => X.verse(['jn-6-13', 'jn-6-14'], '열 두 바구니') },
    ],
  },

  // ---------- (2차 가) ⑤ 밤바다 (6:16-21, Z5 북쪽 물가 → Z4): 노 젓기, 물결 안개 걷어내기, 빛을 배로 맞아들이기 ----------
  sea: {
    id: 'sea', ch: '6:16-21', zone: 'galilee', start: 'bethsaida', stand: 'peterShore', reset: ['peter'], title: '밤바다', sign: 1, who: '베드로', npc: 'peter',
    stat: 'prayer', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_oar'] }, after: 'loaves',
    listen: '저물매 우리는 바다로 내려가 배를 타고 가버나움으로 건너갔어요(6:16-17). 이미 어두웠고, 그분은 아직 오지 않으셨지요. 저와 함께 노를 저어 봐요. 물결과 흔들림이 어지러우면 "흐림 없이 하기"를 눌러요.',
    read: ['jn-6-16', 'jn-6-17', 'jn-6-18', 'jn-6-19', 'jn-6-20', 'jn-6-21'],
    study: { q: '제자들은 노를 저어 얼마쯤 갔을 때 그분을 보았나요?', a: ['십여리쯤', '백 리쯤', '한 리쯤'], ok: 0, v: 'jn-6-19' },
    memo: { v: 'jn-6-20', parts: 3 },
    med: { q: '요즘 내 마음에 부는 큰 바람은 무엇인가요? "내니 두려워 말라"를 들어요.', at: 'med4', lie: true, sec: 20, v: 'jn-6-20', where: '가버나움 물가 모래밭' },
    done: '빛을 배로 맞아들이니 배는 곧 가려던 땅에 닿았어요(6:21). 이 노를 가져가요. 이튿날 무리가 그분을 찾아 가버나움으로 몰려왔어요. 회당에서 다시 만나요.',
    steps: (X) => [
      { hint: '벳새다 북쪽 물가의 배에 올라요 (E 또는 반짝이는 단추)', go: X.P.dockE, where: '벳새다 들녘 북쪽 물가 (선창)', place: 'jn_boat', at: () => X.P.dockE, r: 2.8,
        act: () => { X.board(); X.sky('storm', X.lake, 40); X.verse(['jn-6-16', 'jn-6-17'], '이미 어두웠고'); } },
      { hint: () => `큰 바람이 불어요. 노를 저어요 (E를 거듭 눌러요) · ${X.rows()}/10`, go: () => X.boatAt(), ring: false, where: '디베랴 바다 위', place: 'jn_row', at: () => X.me, r: 99, keepSeat: true,
        enter: () => setTimeout(() => X.toast('큰 바람이 불어 파도가 일어나요 (6:18). 젓지 않으면 배가 밀려나요', 4), 3500),
        act: () => X.row() },
      { hint: '물결과 어둠이 마음을 덮어요. 말씀으로 걷어 내요', go: () => X.boatAt(), ring: false, where: '디베랴 바다 한가운데',
        enter: (r, next) => { X.seaLight(0); X.trial.clear({
          who: '어둠의 속삭임', onLayer: (k) => X.seaLight(k / 3), then: next,
          layers: [
            { lie: '"물결이 너무 높아. 이러다 배가 뒤집힐 거야."', opts: [{ t: '노를 놓고 배 바닥에 웅크려요', why: '두려움은 노를 놓게 해요. 환난 속에서도 담대하라 하신 말씀을 붙들어요' }, { v: 'jn-16-33', ok: true }] },
            { lie: '"그분은 오지 않으셨어(6:17). 이 어두운 바다에 너희만 남았어."', opts: [{ v: 'jn-14-18', ok: true }, { t: '"그래, 우리끼리 어떻게든 해 보자"', why: '우리 힘만 바라보면 바다가 더 커 보여요. 그분은 고아처럼 버려두지 않고 오신다고 하셨어요' }] },
            { lie: '물 위로 빛이 다가와요(6:19). "저게 뭐야! 무서워, 피해!"', opts: [{ t: '배를 돌려 달아나요', why: '다가오는 빛을 피하면 맞아들일 수 없어요. 그분이 "내니" 하셨어요' }, { v: 'jn-6-20', ok: true }] },
          ],
        }); },
        leave: () => X.verse(['jn-6-19', 'jn-6-20'], '내니 두려워 말라') },
      { hint: '다가온 빛을 배로 맞아들여요 (E)', go: () => X.boatAt(), ring: false, where: '디베랴 바다 위', place: 'jn_boat', at: () => X.me, r: 99, keepSeat: true,
        act: () => { X.glide(); X.seaLight(1); X.sfx('orb', 0.3, 1.1); X.burst(X.me.x, X.me.y + 1.6, X.me.z); X.toast('이에 기뻐서 배로 영접하니… (6:21)', 4); } },
      { hint: '배가 가버나움 물가로 가요…', go: () => X.boatAt(), ring: false, where: '디베랴 바다 위',
        until: () => X.landed(),
        leave: () => { X.land(); X.sky(null); X.verse(['jn-6-21'], '가려던 땅에'); } },
    ],
  },

  // ---------- (2차 가) 💡 생명의 떡 · 너희도 가려느냐 (6:22-71, Z4 가버나움 회당): 거슬러 걷기와 대답, 떡 등불 ----------
  bread: {
    id: 'bread', ch: '6:22-71', zone: 'galilee', stand: 'peterSyn', title: '생명의 떡', sign: 0, lamp: 'bread', lampName: '떡 등불', who: '베드로', npc: 'peter',
    stat: 'word', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_breadlamp'] }, after: 'sea',
    listen: '이튿날 무리가 그분을 찾아 가버나움으로 왔어요(6:24). 떡을 먹고 배불렀기 때문이었지요(6:26). 그날 회당에서 그분은 "내가 곧 생명의 떡이니" 하셨어요. 그런데 그 말씀이 어렵다며 많은 사람이 떠나갔어요. 회당 문 앞으로 와요.',
    read: ['jn-6-26', 'jn-6-27', 'jn-6-35', 'jn-6-60', 'jn-6-66', 'jn-6-67', 'jn-6-68', 'jn-6-69'],
    study: { q: '베드로는 그분께 무엇이 계신다고 고백했나요?', a: ['영생의 말씀', '많은 떡', '큰 무리'], ok: 0, v: 'jn-6-68' },
    memo: { v: 'jn-6-35', parts: 4 },
    med: { q: '오늘 나를 배부르게 하는 것은 썩는 양식인가요, 영생하도록 있는 양식인가요?', at: 'synW', sec: 20, v: 'jn-6-27', where: '회당 안 돌 의자' },
    done: '"주여 영생의 말씀이 계시매 우리가 뉘게로 가오리이까" 그날 저는 그렇게 대답했어요. 이 떡 등불이 빛의 광장 등잔 하나를 밝혀요. 다음은 초막절 명절의 성전 뜰, 세상의 빛 이야기예요.',
    begin: (X) => X.warm('syn', X.P.warm4),
    steps: (X) => [
      { hint: '회당 문 앞 빛나는 자리에 서서 말씀을 들어요', go: X.P.synDoor, where: '가버나움 회당 남쪽 문 앞',
        until: (r, dt) => { r.t = X.near(X.P.synDoor, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-6-26', 'jn-6-27', 'jn-6-35'], '생명의 떡') },
      { hint: '무리가 떠나가요. 거슬러 회당 안 빛까지 걸어가요 (멈추면 밀려나요)', go: X.P.warm4, where: '가버나움 회당 안',
        enter: (r, next) => { X.flow(true); X.toast('"이 말씀은 어렵도다" 많은 사람이 수군거리며 물러가요 (6:60)', 4); X.trial.against({ to: X.P.warm4, r: 1.9, away: X.P.synOut[1], lines: ['다들 떠나잖아. 너도 가자.', '이 말씀은 어려워. 누가 들을 수 있겠어?', '떡이나 더 주면 몰라도.'], then: next }); },
        leave: () => { X.flow(false); X.verse(['jn-6-60', 'jn-6-66'], '물러가고'); } },
      { hint: '빛 곁의 베드로에게 말을 걸어요', go: () => X.npcAt('peter'), where: '가버나움 회당 안', talk: 'peter',
        open: (r, next) => X.trial.answer({
          who: '어둠의 속삭임', lie: '그분이 열두 제자에게 물으셨어요. "너희도 가려느냐"(6:67). 곁에서 속삭임이 들려요. "다들 떠나잖아. 너도 가자."',
          q: '베드로와 함께 대답해 보세요',
          opts: [
            { t: '"저도 이 말씀은 어려워요. 잠깐 쉬었다 올게요"', why: '어렵다고 떠난 사람이 많았어요(6:60). 다 알지 못해도 그분 곁에 남으면 그 말씀이 영이요 생명이 돼요 (6:63)' },
            { t: '"다들 가니 저도 따라가야겠어요"', why: '무리를 따라 물러가면 생명의 떡을 두고 떠나게 돼요 (6:66)' },
            { t: '"주여 영생의 말씀이 계시매 우리가 뉘게로 가오리이까"', ok: true },
          ],
          win: 'jn-6-68', then: next,
        }),
        leave: () => X.verse(['jn-6-67', 'jn-6-69'], '너희도 가려느냐') },
      { hint: '빛 곁에서 떡 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.warm4, where: '가버나움 회당 안 따뜻한 빛', place: 'jn_lamp', at: () => X.P.warm4, r: 2.2,
        act: () => { X.carry('lamp'); X.sfx('orb', 0.3, 1.2); X.burst(X.P.warm4.x, 1.6, X.P.warm4.z); } },
    ],
  },

  // ---------- (2차 나) 💡 세상의 빛 (7:37-8:12, Z7 성전 뜰): 생수 말씀, 손의 돌을 내려놓기, 하나씩 나가는 무리, 빛 등불 ----------
  light: {
    id: 'light', ch: '7:37-8:12', zone: 'temple', title: '세상의 빛', sign: 0, lamp: 'light', lampName: '빛 등불', who: '성전 뜰의 여인', npc: 'woman8',
    stat: 'obey', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_lightlamp'] }, after: 'bread', reset: ['woman8'],
    listen: '명절 끝날 큰날, 그분이 이 뜰에서 "누구든지 목마르거든 내게로 와서 마시라" 외치셨어요(7:37). 이튿날 아침, 사람들이 저를 끌고 와 뜰 가운데 세웠지요(8:3). 그날 그 자리에 함께 서 볼래요? 먼저 동쪽 행각 곁 빛으로 와요.',
    read: ['jn-7-37', 'jn-7-38', 'jn-8-2', 'jn-8-3', 'jn-8-7', 'jn-8-9', 'jn-8-10', 'jn-8-11', 'jn-8-12'],
    study: { q: '무리는 누구부터 하나씩 나갔나요?', a: ['어른', '젊은이', '서기관'], ok: 0, v: 'jn-8-9' },
    memo: { v: 'jn-8-12', parts: 4 },
    med: { q: '내가 손에 쥐고 있는 정죄의 돌은 무엇인가요? 그분 앞에 내려놓아요.', at: 'portico7', sec: 20, v: 'jn-8-11', where: '솔로몬 행각 기둥 그늘' },
    done: '그분은 "나도 너를 정죄하지 아니하노니 가서 다시는 죄를 범치 말라" 하셨어요(8:11). 그 말씀이 제게는 빛이었어요. 이 빛 등불이 빛의 광장 등잔 하나를 밝혀요. 다음은 성전 문 곁, 날 때부터 소경이었던 사람의 이야기예요.',
    end: (X) => X.accusers(false),
    steps: (X) => [
      { hint: '동쪽 행각 곁 빛 곁의 물동이에서 물을 떠 마셔요 (E)', go: X.P.warmL, where: '성전 뜰 동쪽 솔로몬 행각 곁', place: 'jn_draw', at: () => X.P.warmL, r: 2.4,
        enter: () => { X.sky('feast', 'temple'); X.warm('L', X.P.warmL); },
        act: () => { X.sfx('cup', 0.22, 0.9); X.burst(X.P.warmL.x, 1.4, X.P.warmL.z); X.verse(['jn-7-37', 'jn-7-38'], '생수의 강'); } },
      { hint: '이튿날 아침, 뜰 가운데 무리 곁 빛나는 자리에 서요', go: X.P.lightAt7, where: '성전 뜰 가운데 (동쪽)',
        enter: () => { X.sky('morn', 'temple'); X.accusers(true); X.toast('서기관들과 바리새인들이 한 여자를 끌고 와 가운데 세웠어요 (8:3)', 4); },
        until: (r, dt) => { r.t = X.near(X.P.lightAt7, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => { X.carry('stone'); X.verse(['jn-8-2', 'jn-8-3', 'jn-8-5'], '돌로 치라'); } },
      { hint: '누군가 내 손에 돌을 쥐여 줘요. 무엇을 내려놓을까요?', go: X.P.lightAt7, where: '성전 뜰 가운데',
        enter: (r, next) => X.trial.drop({
          who: '어둠의 속삭임', lie: '"저 여자는 돌 맞아 마땅해. 모세의 율법에도 그렇게 쓰여 있잖아(8:5). 너도 들어."',
          q: '손에 든 돌을 어떻게 할까요?',
          opts: [
            { t: '돌을 꼭 쥐고, 다른 사람이 먼저 던지기를 기다려요', why: '"너희 중에 죄 없는 자가 먼저 돌로 치라" 하셨어요 (8:7). 그 자리에 죄 없는 사람은 없었어요' },
            { t: '손의 돌을 내려놓아요', ok: true },
            { t: '돌을 들고 "율법대로 해야 해요" 하고 외쳐요', why: '정죄하는 말은 나도 그분 앞에 서야 할 사람이라는 것을 잊게 해요. 그분은 "나도 너를 정죄하지 아니하노니" 하셨어요 (8:11)' },
          ],
          drop: () => { X.dropFx(); X.carry(null); }, win: 'jn-8-7', then: next,
        }) },
      { hint: '무리가 하나씩 나가요. 그 자리에 가만히 있어요', go: X.P.lightAt7, ring: false, where: '성전 뜰 가운데',
        enter: () => X.accLeave(),
        until: () => X.accGone(),
        leave: () => X.verse(['jn-8-9', 'jn-8-10', 'jn-8-11'], '하나씩 하나씩') },
      { hint: '행각 곁 빛에서 빛 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.warmL, where: '성전 뜰 동쪽 솔로몬 행각 곁', place: 'jn_lamp', at: () => X.P.warmL, r: 2.4,
        act: () => { X.carry('lamp'); X.sky(null); X.sfx('orb', 0.3, 1.2); X.burst(X.P.warmL.x, 1.6, X.P.warmL.z); X.verse(['jn-8-12'], '나는 세상의 빛이니'); } },
    ],
  },

  // ---------- ④ 실로암 (9장, Z7 → Z9): 감각으로 체험하는 표적 ----------
  siloam: {
    id: 'siloam', ch: '9:1-38', zone: 'siloam', start: 'temple', title: '실로암', sign: 1, who: '눈 뜬 사람', npc: 'blind',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_siloam'] }, after: 'light',
    listen: '저는 날 때부터 앞을 못 봤어요. 제자들은 누구 죄 때문이냐고 물었지요(9:2). 그날을 제 눈으로 겪어 볼래요? 성전 문 곁 빛나는 자리에 앉으면 화면이 흐려져요. 어지러우면 "흐림 없이 하기"를 눌러요.',
    read: ['jn-9-2', 'jn-9-3', 'jn-9-7', 'jn-9-24', 'jn-9-25', 'jn-9-35', 'jn-9-36', 'jn-9-37', 'jn-9-38'],
    study: { q: '그 사람은 어디서 씻었나요?', a: ['실로암', '베데스다', '요단'], ok: 0, v: 'jn-9-7' },
    memo: { v: 'jn-9-25', parts: 4 },
    med: { q: '주님이 내 눈을 열어 주신 일 하나를 떠올려요.', at: 'med9', sec: 20, v: 'jn-9-25', where: '실로암 못 계단' },
    done: '한 가지 아는 것은, 제가 소경으로 있다가 지금 본다는 거예요. 이 실로암 물을 가져가요. 다음은 성전 동쪽 길가 양 우리의 목자예요.',
    end: (X) => { X.blur(false); X.water(null); },
    steps: (X) => [
      { hint: '성전 문 곁 빛나는 자리에 앉아요 (J 또는 앉기)', go: X.P.blindSeat, where: '성전 뜰 남쪽 문',
        until: (r, dt) => { r.t = X.sitting(X.P.blindSeat, 1.5) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => { X.verse(['jn-9-2', 'jn-9-3'], '날 때부터'); X.blur(true); } },
      { hint: '흐린 눈으로 실로암 못까지 걸어가요. 물소리가 커지는 쪽으로 (막히면 X 기도)', go: X.P.wash, where: '실로암 못 (성전 문에서 남쪽 길)',
        enter: () => { X.verse(['jn-9-7'], '실로암 못에 가서 씻으라'); X.water(X.P.wash); },
        until: (r) => { if (X.praying() && !r.lit) { r.lit = true; X.lightPath(X.P.wash); } return X.near(X.P.wash, 2.2); } },
      { hint: '못 계단에서 씻어요 (E 또는 반짝이는 단추)', go: X.P.wash, where: '실로암 못 안쪽 계단', place: 'jn_wash', at: () => X.P.wash, r: 2.2,
        act: () => { X.blur(false); X.water(null); X.splash(); X.toast('눈이 밝아졌어요! 색이 돌아와요', 4); } },
      { hint: '성전 뜰로 돌아가 바리새인에게 말해요', go: () => X.npcAt('ph0'), where: '성전 뜰', talk: 'ph0',
        open: (r, next) => X.trial.answer({
          who: '바리새인', lie: '"너는 영광을 하나님께 돌리라. 우리는 저 사람이 죄인인 줄 아노라." 둘레의 무리가 수군거려요.',
          q: '뭐라고 대답할까요?',
          opts: [
            { t: '그가 죄인인지 내가 알지 못하나 한 가지 아는 것은 내가 소경으로 있다가 지금 보는 그것이니이다', ok: true },
            { t: '"저도 잘 모르겠어요"', why: '다 알지 못해도 괜찮아요. 내가 겪은 한 가지는 분명히 말할 수 있어요 (9:25)' },
            { t: '"그런 사람 몰라요"', why: '출교가 두려워 모른다고 하면, 내 눈을 뜨게 하신 분을 숨기게 돼요 (9:22)' },
          ],
          win: 'jn-9-25', then: next,
        }) },
      { hint: (r) => `무리가 수군거려요. 그 자리에 가만히 머물러요 ${X.trial.progress()}`, go: () => X.npcAt('ph0'), where: '성전 뜰',
        enter: (r, next) => { X.crowd(true); X.trial.stay({ sec: 10, label: '머물기', ok: () => X.near(X.npcAt('ph0'), 6) && me(X).state !== 'walk', lines: ['출교당할 거야.', '이제 회당에 못 들어와.', '그냥 모른다고 해.'], then: next }); },
        leave: () => { X.crowd(false); X.toast('그들이 그 사람을 쫓아냈어요 (9:34). 성 밖의 빛나는 자리로 가요', 5); } },
      { hint: '성 밖, 쫓겨난 자리의 빛으로 가요', go: X.P.outside, where: '성전 남쪽 문 밖 길',
        until: () => X.near(X.P.outside, 1.4),
        leave: () => { X.warmAt(X.P.outside); X.verse(['jn-9-35', 'jn-9-36', 'jn-9-37', 'jn-9-38'], '네가 인자를 믿느냐'); } },
      { hint: '무릎 꿇고 경배해요 (X 기도)', go: X.P.outside, where: '성전 남쪽 문 밖 길',
        until: (r, dt) => { r.t = X.praying() && X.near(X.P.outside, 2.4) ? (r.t || 0) + dt : 0; return r.t > 1.6; } },
    ],
  },
  // ---------- (2차 나) 💡 선한 목자의 음성 (10:1-30, Z7 동쪽 양 우리): 세 소리 가운데 목자의 음성만 따라 양의 문으로, 문·목자 등불 ----------
  shepherd: {
    id: 'shepherd', ch: '10:1-30', zone: 'temple', title: '선한 목자', sign: 0, lamp: ['door', 'shepherd'], lampName: '문 등불·목자 등불', who: '목자', npc: 'shepherd',
    stat: 'prayer', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_doorlamp', 'jn_shepherdlamp'] }, after: 'siloam', reset: ['shepherd'],
    begin: (X) => X.sky('winter', 'temple'), // 수전절, 겨울 (10:22). 사건을 할 때만 (성전 뜰의 다른 사건 하늘을 바꾸지 않게)
    listen: '저는 성전 동쪽 길가의 이 양 우리를 지키는 목자예요. 양은 목자의 음성을 알아서 따라가고, 타인의 음성은 따르지 않아요(10:4-5). 오늘은 당신이 양이 되어 들어 봐요. 여러 곳에서 부르는 소리가 들리면, 말씀과 맞는 음성만 따라가요.',
    read: ['jn-10-1', 'jn-10-2', 'jn-10-3', 'jn-10-4', 'jn-10-5', 'jn-10-7', 'jn-10-9', 'jn-10-10', 'jn-10-11', 'jn-10-14', 'jn-10-27', 'jn-10-28'],
    study: { q: '양들은 무엇을 알기에 목자를 따라가나요?', a: ['그의 음성', '그의 옷', '그의 지팡이'], ok: 0, v: 'jn-10-4' },
    memo: { v: 'jn-10-27', parts: 4 },
    med: { q: '요즘 나를 부르는 여러 소리 가운데, 목자의 음성은 어떤 말씀인가요?', at: 'foldSeat', sec: 20, v: 'jn-10-27', where: '양 우리 안 깔개' },
    done: '양은 목자의 음성을 알아요. 오늘 들은 그 음성을 날마다 따라가요(10:27). 문 등불과 목자 등불이 빛의 광장 등잔 둘을 밝혀요. 다음은 베다니, 마르다와 마리아의 집이에요.',
    steps: (X) => [
      { hint: '양 우리 남쪽 문 앞 빛나는 자리에 서요', go: X.P.foldFront, where: '성전 동쪽 길가 양 우리',
        until: (r, dt) => { r.t = X.near(X.P.foldFront, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-10-3'], '양은 그의 음성을 듣나니') }, // 한 구절만: 바로 뒤 목소리 패널이 카드를 가리지 않게 (10:1-2는 본문 읽기에)
      { hint: () => `세 곳에서 부르는 소리가 들려요. 말씀과 맞는 목자의 음성이 나는 번호 자리로 가요 ${X.trial.progress()}`, go: X.P.foldFront, ring: false, where: '양 우리 문 앞',
        enter: (r, next) => X.trial.voices({
          who: '세 곳에서 부르는 소리', then: next,
          rounds: [
            { spots: X.P.voiceA, lines: [
              { t: '"담을 넘어 와. 문으로 돌아가면 늦어."', why: '문으로 들어가지 않고 다른 데로 넘어가는 자는 절도며 강도라고 하셨어요 (10:1)' },
              { v: 'jn-10-27', ok: true },
              { t: '"이리가 와! 각자 알아서 달아나."', why: '삯군은 이리가 오면 양을 버리고 달아나요. 목자는 양을 버리지 않아요 (10:12)' },
            ] },
            { spots: X.P.voiceA, lines: [
              { v: 'jn-10-11', ok: true },
              { t: '"네 것은 네가 챙겨. 아무도 너를 지켜 주지 않아."', why: '도적은 도적질하고 죽이고 멸망시키려고 와요. 그분은 생명을 더 풍성히 주려고 오셨어요 (10:10)' },
              { t: '"삯을 받는 만큼만 지켜 줄게."', why: '삯군은 양을 돌아보지 않아요 (10:13). 선한 목자는 양을 위하여 목숨을 버려요 (10:11)' },
            ] },
            { spots: X.P.voiceC, lines: [
              { t: '"우리 안은 답답해. 저쪽 담 너머가 더 넓어."', why: '담을 넘어 다른 데로 가는 길은 양의 길이 아니에요 (10:1)' },
              { v: 'jn-10-9', ok: true },
              { t: '"문은 아무 데나 있어. 넘어가도 돼."', why: '그분은 "내가 문이니" 하셨어요. 그분으로 말미암아 들어가면 구원을 얻어요 (10:9)' },
            ] },
          ],
        }),
        leave: () => X.verse(['jn-10-4', 'jn-10-5', 'jn-10-7'], '나는 양의 문이라') },
      { hint: '양의 문으로 들어가 우리 안 깔개에 앉아 쉬어요 (J 또는 앉기)', go: X.P.foldSeat, where: '양 우리 안',
        enter: () => X.warm('fold', X.P.foldDoor),
        until: (r, dt) => { r.t = X.sitting(X.P.foldSeat, 1.6) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-10-9', 'jn-10-10', 'jn-10-11', 'jn-10-14', 'jn-10-27', 'jn-10-28'], '나는 선한 목자라') },
      { hint: '문 곁 빛에서 문 등불과 목자 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.foldDoor, where: '양 우리 남쪽 문', place: 'jn_lamp', at: () => X.P.foldDoor, r: 2.2,
        act: () => { X.carry('lamp'); X.sfx('orb', 0.3, 1.2); X.burst(X.P.foldDoor.x, 1.6, X.P.foldDoor.z); X.toast('문 등불과 목자 등불을 받았어요 (10:7, 10:11)', 4); } },
    ],
  },

  // ---------- (2차 나) ⑦ 💡 나사로야 나오라 (11:1-45, Z12 베다니): 마을 어귀에서 맞고, 무덤까지, 돌 옮기기, 베 풀기, 부활 등불 ----------
  lazarus: {
    id: 'lazarus', ch: '11:1-45', zone: 'bethany', title: '나사로야 나오라', sign: 1, lamp: 'life', lampName: '부활 등불', who: '마르다', npc: 'martha',
    stat: 'prayer', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_lifelamp'] }, after: 'shepherd', reset: ['martha', 'mary12'],
    listen: '제 오라비 나사로가 병들어 그분께 사람을 보냈어요(11:3). 그런데 그분은 계시던 곳에 이틀을 더 머무셨고(11:6), 나사로는 죽어 무덤에 묻혔어요. 나흘이 지나서야 그분이 오신다는 말을 들었지요. 저와 함께 마을 어귀로 나가 맞아요.',
    read: ['jn-11-1', 'jn-11-5', 'jn-11-6', 'jn-11-17', 'jn-11-20', 'jn-11-21', 'jn-11-25', 'jn-11-26', 'jn-11-27', 'jn-11-32', 'jn-11-35', 'jn-11-39', 'jn-11-40', 'jn-11-41', 'jn-11-43', 'jn-11-44'],
    study: { q: '나사로가 무덤에 있은 지 며칠이었나요?', a: ['나흘', '사흘', '이틀'], ok: 0, v: 'jn-11-17' },
    memo: { v: 'jn-11-25', parts: 4 },
    med: { q: '"이미 늦었다" 싶은 일 앞에서, "이것을 네가 믿느냐" 하시는 물음을 들어요.', at: 'table12', sec: 20, v: 'jn-11-26', where: '베다니 마당 잔치 식탁' },
    done: '그분은 "나는 부활이요 생명이니" 하셨어요. 나흘 된 무덤 앞에서도 그 말씀은 늦지 않았어요. 이 부활 등불이 빛의 광장 등잔 하나를 밝혀요. 다음 이야기는 유월절 엿새 전, 우리 집 잔치예요. 마리아에게 가 봐요.',
    end: (X) => { X.warm('meet', null); X.warm('tomb', null); },
    steps: (X) => [
      { hint: '마르다와 함께 마을 어귀(남동쪽 길)의 따뜻한 빛으로 나가 맞아요', go: X.P.warmMeet, where: '베다니 마을 어귀 (광장 쪽 길)',
        enter: () => { X.warm('meet', X.P.warmMeet); X.npcGo('martha', X.P.marthaMeet); },
        until: () => X.near(X.P.warmMeet, 2.4),
        leave: () => X.verse(['jn-11-17', 'jn-11-20', 'jn-11-21'], '이미 나흘이라') },
      { hint: '마르다에게 말을 걸어요', go: () => X.npcAt('martha'), where: '베다니 마을 어귀', talk: 'martha',
        open: (r, next) => X.ui.open({
          who: '마르다', sub: '나사로야 나오라', text: '그분이 "네 오라비가 다시 살리라" 하셨어요(11:23). 그리고 물으셨어요. "이것을 네가 믿느냐"', quote: 'jn-11-25',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '"주여 그러하외다"', cls: 'next', fn: next }],
        }),
        leave: () => X.verse(['jn-11-25', 'jn-11-26', 'jn-11-27'], '나는 부활이요 생명이니') },
      { hint: '마리아에게 가서 "선생님이 부르신다" 전해요 (11:28)', go: () => X.npcAt('mary12'), where: '베다니 마르다와 마리아의 집 서쪽', talk: 'mary12',
        open: (r, next) => X.ui.open({
          who: '마리아', sub: '나사로야 나오라', text: '선생님이 오셔서 저를 부르신다고요?', quote: 'jn-11-28',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '함께 가요', cls: 'next', fn: () => { X.rise('mary12'); X.follow('mary12'); next(); } }],
        }) },
      { hint: '마리아와 함께 마을 어귀의 빛으로 가요', go: X.P.warmMeet, where: '베다니 마을 어귀',
        until: () => X.near(X.P.warmMeet, 3.2) && X.dn('mary12', X.P.warmMeet) < 4.5,
        leave: () => X.verse(['jn-11-29', 'jn-11-32', 'jn-11-35'], '예수께서 눈물을 흘리시더라') },
      { hint: '"주여 와서 보옵소서"(11:34) 무덤으로 걸어가요. 되돌아서지 말고', go: X.P.stoneAt, where: '베다니 서북쪽 굴 무덤',
        enter: (r, next) => {
          X.follow('martha'); X.follow('mary12'); X.mournersTo('tomb'); X.warm('meet', null); X.warm('tomb', X.P.warmTomb);
          X.trial.onward({ to: X.P.stoneAt, r: 2.2, back: 7, turn: '"내 말이 네가 믿으면 하나님의 영광을 보리라"(11:40). 다시 무덤 쪽으로 가요', lines: ['이미 늦었어.', '나흘이나 됐잖아(11:39).', '벌써 냄새가 나.', '그분이 조금만 일찍 오셨더라면…(11:21)'], then: next });
        },
        leave: () => { X.unfollow('martha'); X.unfollow('mary12'); X.verse(['jn-11-39', 'jn-11-40'], '돌을 옮겨 놓으라'); } },
      { hint: () => `무덤 어귀의 돌을 옮겨 놓아요 (E를 거듭 눌러요) · ${X.stoneK()}/4`, go: X.P.stoneAt, where: '베다니 굴 무덤 어귀', place: 'jn_push', at: () => X.P.stoneAt, r: 2.3,
        act: () => { const open = X.pushStone(); if (open) { X.verse(['jn-11-41', 'jn-11-43'], '나사로야 나오라'); X.lazarusLater(2600); } return open; } },
      { hint: '나사로의 수족을 동인 베를 풀어 주어요 (E)', go: X.P.lazarusTomb, where: '베다니 굴 무덤 앞', place: 'jn_untie', at: () => X.P.lazarusTomb, r: 2.4,
        enter: () => X.lazarusLater(2600),
        act: () => { X.lazarusOut(); X.untie(); X.verse(['jn-11-44'], '풀어 놓아 다니게 하라'); } },
      { hint: '무덤 곁 빛에서 부활 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.warmTomb, where: '베다니 굴 무덤 곁', place: 'jn_lamp', at: () => X.P.warmTomb, r: 2.2,
        act: () => { X.carry('lamp'); X.sfx('orb', 0.3, 1.2); X.burst(X.P.warmTomb.x, 1.6, X.P.warmTomb.z); X.toast('"나는 부활이요 생명이니" (11:25)', 4); } },
    ],
  },

  // ---------- (2차 나) 나드 향유 · 한 알의 밀 (12:1-26, Z12 베다니 마당): 향유를 붓고, 허비라는 속삭임을 이기고, 밀 한 알을 심기 ----------
  nard: {
    id: 'nard', ch: '12:1-26', zone: 'bethany', title: '나드 향유', sign: 0, who: '마리아', npc: 'mary12',
    stat: 'fellow', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_nard'] }, after: 'lazarus', reset: ['mary12', 'martha'],
    listen: '유월절 엿새 전, 그분이 다시 베다니에 오셨어요(12:1). 우리 집 마당에서 잔치를 했지요. 마르다는 일을 보고, 살아난 나사로는 함께 식탁에 앉았어요(12:2). 저는 아껴 둔 나드 한 근을 가져왔어요. 함께 해 볼래요? 먼저 식탁에 앉아요.',
    read: ['jn-12-1', 'jn-12-2', 'jn-12-3', 'jn-12-5', 'jn-12-7', 'jn-12-8', 'jn-12-24', 'jn-12-26'],
    study: { q: '마리아가 부은 향유는 무엇이었나요?', a: ['순전한 나드 한 근', '감람 기름 한 병', '몰약과 침향'], ok: 0, v: 'jn-12-3' },
    memo: { v: 'jn-12-24', parts: 4 },
    med: { q: '내가 아끼지 않고 그분께 드리고 싶은 것은 무엇인가요?', at: 'table12', sec: 20, v: 'jn-12-3', where: '베다니 마당 잔치 식탁' },
    done: '향유 냄새가 집에 가득했어요(12:3). 그분은 저를 가만 두라 하셨지요. 남은 나드 향유를 가져가요. 한 알의 밀이 땅에 떨어져 죽으면 많은 열매를 맺어요. 남은 이야기는 예루살렘 다락방에서 이어질 거예요.',
    end: (X) => X.fragrance(false),
    steps: (X) => [
      { hint: '마당 잔치 식탁에 앉아요 (J 또는 앉기)', go: X.P.table12, where: '베다니 마당 잔치 식탁',
        until: (r, dt) => { r.t = X.sitting(X.P.table12, 2.4) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-12-1', 'jn-12-2'], '거기서 잔치할쌔') },
      { hint: '식탁 곁의 마리아에게 말을 걸어 향유를 받아요', go: () => X.npcAt('mary12'), where: '베다니 잔치 식탁 서쪽', talk: 'mary12',
        open: (r, next) => X.ui.open({
          who: '마리아', sub: '나드 향유', text: '이것은 지극히 비싼 순전한 나드 한 근이에요. 그분의 발에 부어 드리고 싶어요. 함께 가요.',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '향유를 받아요', cls: 'next', fn: () => { X.carry('nard'); X.sfx('tap', 0.2, 1.2); next(); } }],
        }) },
      { hint: '식탁 머리 따뜻한 빛 곁에 향유를 부어요 (E)', go: X.P.warm12t, where: '베다니 잔치 식탁 동쪽 끝', place: 'jn_pour', at: () => X.P.warm12t, r: 2.2,
        enter: () => X.warm('t12', X.P.warm12t),
        act: () => { X.carry(null); X.fragrance(true); X.sfx('orb', 0.26, 0.9); X.burst(X.P.warm12t.x, 1.2, X.P.warm12t.z); X.verse(['jn-12-3'], '향유 냄새가 집에 가득하더라'); } },
      { hint: '곁에서 투덜거리는 소리가 들려요. 어떤 말씀을 붙들까요?', go: X.P.warm12t, where: '베다니 잔치 식탁',
        enter: (r, next) => X.trial.pick({
          who: '어둠의 속삭임', lie: `"이 향유를 팔면 삼백 데나리온이야. 허비야." 지금 내 지갑에는 ${X.wallet()}이 있어요.`,
          q: '드린 것을 셈으로 재는 소리 앞에서 붙들 말씀을 골라요',
          opts: [
            { v: 'jn-12-5', why: '가룟 유다의 말이에요. 가난한 자들을 생각해서가 아니었어요 (12:6). 사랑을 값으로만 재면 드린 것이 허비로 보여요' },
            { v: 'jn-6-7', why: '빌립의 셈이에요. 셈은 맞아도, 그분께 드리는 마음은 셈으로 다 잴 수 없어요' },
            { v: 'jn-12-7', ok: true },
          ],
          win: 'jn-12-8', then: next,
        }) },
      { hint: '마당 동쪽 밭에 밀 한 알을 심어요 (E)', go: X.P.plantAt, where: '베다니 집 동쪽 밭', place: 'jn_plant', at: () => X.P.plantAt, r: 2.2,
        act: () => { X.plant(); X.verse(['jn-12-24', 'jn-12-26'], '한 알의 밀') } },
    ],
  },
  // ===================== 3차: 다락방·수난·부활 (13-21장, Z10 다락방 · Z11 수난과 동산 · Z4 디베랴 바닷가) =====================
  //   장소 도구(대야·닫히는 문·검·횃불·무리·향품·무덤 돌·그물·어린 양)는 js/john/passion.js
  //   quiet: 수난 구역의 두 사건(동산과 숯불, 진리 · 다 이루었다)은 시험·보상 없이 머물러 묵상하고 기록만 (기획서 9장 결정 4)
  //   쉼 단계(X.rested)는 앉아서 몇 초 머물면 다음으로. 앉아 있으면 머무름 묵상(js/stillness.js)이 열리고, 하는 동안은 끝날 때까지 기다림

  // ---------- (3차) 발 씻기심 (13:1-35, Z10 다락방): 수건과 대야를 들고, 교만을 내려놓고, 제자들의 발을 씻기기 ----------
  wash: {
    id: 'wash', ch: '13:1-35', zone: 'upper', title: '발 씻기심', sign: 0, who: '시몬 베드로', npc: 'peter', stand: 'peterUpper', time: 'eve',
    stat: 'fellow', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_towel'] }, after: 'nard',
    listen: '유월절 전, 저녁 잡수시던 자리에서 그분이 일어나셨어요(13:4). 수건을 허리에 두르시고 대야에 물을 담아 우리 발을 씻기기 시작하셨지요. 저는 "내 발을 절대로 씻기지 못하시리이다" 했어요(13:8). 이번엔 당신이 수건과 대야를 들고 해 봐요.',
    read: ['jn-13-1', 'jn-13-4', 'jn-13-5', 'jn-13-6', 'jn-13-7', 'jn-13-8', 'jn-13-9', 'jn-13-14', 'jn-13-15', 'jn-13-34', 'jn-13-35'],
    study: { q: '그분은 제자들의 발을 씻기기 전에 무엇을 허리에 두르셨나요?', a: ['수건', '띠', '겉옷'], ok: 0, v: 'jn-13-4' },
    memo: { v: 'jn-13-34', parts: 4 },
    med: { q: '오늘 내가 낮아져 발을 씻겨 줄 한 사람은 누구인가요?', at: 'up10', sec: 20, v: 'jn-13-14', where: '다락방 식탁' },
    done: '주와 선생이신 분이 먼저 우리 발을 씻기셨어요. 너희도 서로 발을 씻기라 하셨지요(13:14). 이 수건과 대야를 가져가요. 그날 밤 그분은 이 방에서 오래 말씀하셨어요. 도마에게 가 봐요.',
    steps: (X) => [
      { hint: '다락방 문 앞 빛나는 자리에 서요', go: X.P.upDoor, where: '윗동네 다락방 남쪽 문',
        until: (r, dt) => { r.t = X.near(X.P.upDoor, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-13-1', 'jn-13-4'], '끝까지 사랑하시니라') },
      { hint: '방 안 대야 곁에서 수건과 대야를 들어요 (E 또는 반짝이는 단추)', go: X.P.basinAt, where: '다락방 서쪽 벽 곁', place: 'jn_towel', at: () => X.P.basinAt, r: 2.2,
        act: () => { X.basin(false); X.carry('basin'); X.sfx('cup', 0.18, 0.8); X.verse(['jn-13-5'], '대야에 물을 담아') } },
      { hint: '마음속에서 속삭임이 들려요. 무엇을 내려놓을까요?', go: X.P.basinAt, ring: false, where: '다락방',
        enter: (r, next) => X.trial.drop({
          who: '어둠의 속삭임', lie: '"네가 왜 남의 발을 씻겨? 그건 종이 하는 일이야. 너는 그럴 사람이 아니잖아."',
          q: '손에 든 대야는 그대로 두고, 마음의 교만을 내려놓아요',
          opts: [
            { t: '"맞아, 나는 그럴 사람이 아니야" 하고 대야를 내려놓아요', why: '주와 선생이신 분이 먼저 우리 발을 씻기셨어요. 너희도 서로 발을 씻기라 하셨지요 (13:14)' },
            { t: '교만을 내려놓고 무릎을 꿇어요', ok: true },
            { t: '"나보다 낮은 사람 발만 씻겨 줄게"', why: '그분은 끝까지 사랑하셨어요 (13:1). 내가 사랑을 고르면 섬김도 고르게 돼요' },
          ],
          drop: () => X.dropFx(), win: 'jn-13-15', then: next,
        }) },
      { hint: () => `제자들 곁에서 한 사람씩 발을 씻겨요 (E) · ${X.washed()}/5`, go: () => X.nextFeet(), where: '다락방 식탁 둘레', place: 'jn_feet', at: () => X.nextFeet(), r: 2.0,
        act: () => X.washFeet() },
      { hint: '베드로에게 말을 걸어요', go: () => X.npcAt('peter'), where: '다락방 동쪽', talk: 'peter',
        open: (r, next) => X.ui.open({
          who: '시몬 베드로', sub: '발 씻기심', text: '주여, 주께서 내 발을 씻기시나이까? 제 발은 절대로 씻기지 못하십니다!', quote: 'jn-13-6',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '"내가 너를 씻기지 아니하면…"', cls: 'next', fn: next }],
        }),
        leave: () => X.verse(['jn-13-7', 'jn-13-8', 'jn-13-9'], '손과 머리도') },
      { hint: '베드로의 발을 씻겨요 (E)', go: () => X.npcAt('peter'), where: '다락방 동쪽', place: 'jn_feet', at: () => X.npcAt('peter'), r: 2.2,
        act: () => { X.washPeter(); X.carry(null); X.basin(true); X.verse(['jn-13-14', 'jn-13-15', 'jn-13-34', 'jn-13-35'], '서로 사랑하라'); } },
    ],
  },

  // ---------- (3차) 💡 길·포도나무 (13:30-17:26, Z10 다락방): 시험 없이 앉아서 말씀을 차례로 듣고, 머물고, 기도. 길·포도나무 등불 ----------
  way: {
    id: 'way', ch: '14:1-17:26', zone: 'upper', title: '길·포도나무', sign: 0, lamp: ['way', 'vine'], lampName: '길 등불·포도나무 등불', who: '도마', npc: 'thomas', time: 'night',
    stat: 'prayer', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_waylamp', 'jn_vinelamp'] }, after: 'wash',
    listen: '그날 밤 유다가 나간 뒤(13:30), 그분은 이 방에서 오래 말씀하셨어요. 저는 "어디로 가시는지 알지 못하거늘 그 길을 어찌 알겠삽나이까" 하고 여쭈었지요(14:5). 오늘은 시험이 없어요. 식탁에 앉아 말씀을 차례로 듣고, 포도나무 곁에 머물러요.',
    read: ['jn-13-30', 'jn-14-1', 'jn-14-2', 'jn-14-3', 'jn-14-5', 'jn-14-6', 'jn-14-27', 'jn-15-4', 'jn-15-5', 'jn-15-12', 'jn-16-33', 'jn-17-17', 'jn-17-21'],
    study: { q: '"내가 곧 길이요" 하시기 전에 도마는 무엇을 여쭈었나요?', a: ['그 길을 어찌 알겠느냐고', '언제 다시 오시느냐고', '누가 크냐고'], ok: 0, v: 'jn-14-5' },
    memo: { v: 'jn-14-6', parts: 4 },
    med: { q: '"내 안에 거하라" 하셨어요. 오늘 그분 안에 머문다는 것은 무엇일까요?', at: 'vineSeat', sec: 20, v: 'jn-15-4', where: '다락방 포도나무 곁' },
    done: '길을 몰라 여쭈었는데, 그분은 "내가 곧 길이요" 하셨어요. 그리고 포도나무에 붙어 있으라 하셨지요. 길 등불과 포도나무 등불이 빛의 광장 등잔 둘을 밝혀요. 이제 기드론 시내 건너편, 동산으로 가요.',
    steps: (X) => [
      { hint: '다락방 식탁에 앉아요 (J 또는 앉기)', go: X.P.up10, where: '다락방 식탁',
        until: (r, dt) => { r.t = X.sitting(X.P.up10, 2.0) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-13-30', 'jn-14-1', 'jn-14-2', 'jn-14-3'], '근심하지 말라') },
      { hint: '식탁 건너편 도마에게 말을 걸어요', go: () => X.npcAt('thomas'), where: '다락방 식탁', talk: 'thomas',
        open: (r, next) => X.ui.open({
          who: '도마', sub: '길·포도나무', text: '그분이 가시는 곳을 우리가 안다고 하셨는데… 저는 정말 몰랐어요. 그래서 여쭈었지요.', quote: 'jn-14-5',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '그분의 대답을 들어요', cls: 'next', fn: next }],
        }),
        leave: () => X.verse(['jn-14-6', 'jn-14-27'], '내가 곧 길이요') },
      { hint: '방 북쪽 포도나무 시렁을 바라봐요 (E)', go: X.P.vineLook, where: '다락방 북동쪽 포도나무', place: 'jn_look', at: () => X.P.vineLook, r: 2.4,
        act: () => { X.look(X.P.vine10); X.verse(['jn-15-4', 'jn-15-5'], '나는 포도나무요'); } },
      { hint: '포도나무 곁 돌에 앉아 머물러요 (J 앉기). 머무름 묵상이 열리면 해도 좋아요', go: X.P.vineSeat, where: '다락방 북동쪽 포도나무 곁',
        until: (r, dt) => X.rested(r, dt, X.P.vineSeat, 1.6, 8),
        leave: () => X.verse(['jn-15-12', 'jn-16-33'], '내 안에 거하라') },
      { hint: '방 가운데 서서 그분의 기도를 따라 기도해요 (X 기도)', go: X.P.prayUp, where: '다락방 가운데',
        until: (r, dt) => { r.t = X.praying() && X.near(X.P.prayUp, 2.4) ? (r.t || 0) + dt : 0; return r.t > 1.6; },
        leave: () => X.verse(['jn-17-17', 'jn-17-21'], '아버지의 말씀은 진리니이다') },
      { hint: '방 동쪽 빛에서 길 등불과 포도나무 등불을 받아요 (E 또는 반짝이는 단추)', go: X.P.warmUp, where: '다락방 동쪽 등잔 곁', place: 'jn_lamp', at: () => X.P.warmUp, r: 2.2,
        enter: () => X.warm('up', X.P.warmUp),
        act: () => { X.carry('lamp'); X.sfx('orb', 0.3, 1.2); X.burst(X.P.warmUp.x, 1.6, X.P.warmUp.z); X.toast('길 등불과 포도나무 등불을 받았어요 (14:6, 15:5)', 4); } },
    ],
  },

  // ---------- (3차) 동산과 숯불 (18:1-27, Z11): 곁에서 보는 사람. 시험·보상 없이 기록만. 여종의 물음엔 어느 대답이든 받음 → 디베랴 바다의 아침에서 회복 ----------
  arrest: {
    id: 'arrest', ch: '18:1-27', zone: 'passion', title: '동산과 숯불', sign: 0, quiet: true, who: '다른 제자', npc: 'other', stand: 'otherKidron',
    stat: 'prayer', reward: { steps: 0, stat: 0, coin: 0, items: [] }, after: 'way', reset: ['other'],
    begin: (X) => X.sky('kidron', X.passionZone, 6),
    listen: '저는 대제사장과 아는 사람이라, 그 밤 그분을 따라 대제사장의 집 뜰에까지 들어갔어요(18:15). 오늘은 곁에서 보는 사람이 되어 함께 가요. 시험도 보상도 없어요. 보고, 머물고, 기록만 남겨요. 먼저 기드론 시내 건너 동산으로 가요.',
    read: ['jn-18-1', 'jn-18-3', 'jn-18-4', 'jn-18-5', 'jn-18-6', 'jn-18-10', 'jn-18-11', 'jn-18-15', 'jn-18-17', 'jn-18-18', 'jn-18-25', 'jn-18-26', 'jn-18-27'],
    study: { q: '그분이 "내로라" 하셨을 때 잡으러 온 무리는 어떻게 되었나요?', a: ['물러가서 땅에 엎드러졌다', '곧 그분을 잡았다', '흩어져 달아났다'], ok: 0, v: 'jn-18-6' },
    memo: { v: 'jn-18-11', parts: 4 },
    med: { q: '두려울 때 "나는 아니라" 하고 싶었던 자리를 떠올려요. 그 자리에도 그분이 "내로라" 하고 서 계세요.', at: 'olive11', sec: 20, v: 'jn-18-5', where: '기드론 건너 동산 감람나무 아래' },
    done: '그 밤 베드로는 세 번 "나는 아니라" 했어요. 그래도 이야기는 여기서 끝나지 않아요. 숯불 곁의 그 대답은, 디베랴 바닷가 숯불 곁에서 그분이 다시 물으실 때 이어져요(21:9, 21:15). 이 이야기는 시험도 보상도 없이 기록에만 남아요.',
    steps: (X) => [
      { hint: '기드론 시내 건너 동산 어귀 빛나는 자리로 가요', go: X.P.gethAt, where: '기드론 시내 건너편 동산',
        enter: () => X.peterAt('geth'),
        until: (r, dt) => { r.t = X.near(X.P.gethAt, 1.6) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-18-1'], '거기 동산이 있는데') },
      { hint: '감람나무 아래 앉아 잠시 머물러요 (J 앉기)', go: X.P.olive11, where: '동산 감람나무 아래',
        until: (r, dt) => X.rested(r, dt, X.P.olive11, 1.6, 8),
        leave: () => { X.torches('geth'); X.verse(['jn-18-3', 'jn-18-4', 'jn-18-5', 'jn-18-6'], '내로라'); } },
      { hint: '베드로가 검을 빼어 들었어요(18:10). 베드로 곁에서 "검을 집에 꽂으라" 하신 말씀대로 해요 (E)', go: () => X.npcAt('peter'), where: '동산 어귀', place: 'jn_sheathe', at: () => X.npcAt('peter'), r: 2.4,
        act: () => { X.sheathe(); X.verse(['jn-18-10', 'jn-18-11'], '검을 집에 꽂으라'); } },
      { hint: '그분을 데려간 무리를 따라 대제사장의 집 뜰 대문으로 가요', go: X.P.courtGate, where: '대제사장의 집 뜰 북쪽 대문',
        enter: () => { X.torches('court'); X.peterAt('court'); X.walkNpc('other', [X.P.courtGate], true); },
        until: () => X.near(X.P.courtGate, 1.8),
        leave: () => X.verse(['jn-18-15'], '대제사장의 집 뜰에') },
      { hint: '뜰 안 숯불 곁에 서서 불을 쬐어요', go: X.P.fireStand, where: '대제사장의 집 뜰 숯불 곁',
        until: (r, dt) => { r.t = X.near(X.P.fireStand, 1.4) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-18-18'], '그 때가 추운고로') },
      { hint: '문 지키는 여종이 당신을 봐요. 여종에게 말을 걸어요', go: () => X.npcAt('maid'), where: '대제사장의 집 뜰', talk: 'maid',
        open: (r, next) => {
          const reply = (t) => () => { X.toast(t, 6); next(); };
          X.ui.open({
            who: '문 지키는 여종', sub: '동산과 숯불', text: '너도 이 사람의 제자 중 하나가 아니냐?', quote: 'jn-18-17',
            note: '어떻게 대답해도 괜찮아요. 이 밤의 이야기는 디베랴 바다의 아침에서 이어져요.',
            buttons: [
              { t: '"네, 저도 그분을 따라요"', cls: 'next', fn: reply('그렇게 말할 수 있었다면 감사한 일이에요. 그 밤 베드로는 그러지 못했어요 (18:17)') },
              { t: '(아무 말도 못 해요)', fn: reply('말이 나오지 않을 때도 있어요. 그분은 그 침묵도 아세요') },
              { t: '"나는 아니라"', fn: reply('베드로도 그렇게 말했어요 (18:17). 그분은 그 대답으로 끝내지 않으셨어요') },
            ],
          });
        } },
      { hint: '숯불 곁에 머물러 베드로를 지켜봐요. 말씀 카드를 끝까지 읽어요', go: X.P.fireStand, ring: false, where: '대제사장의 집 뜰 숯불 곁',
        enter: () => X.verse(['jn-18-25', 'jn-18-26', 'jn-18-27'], '곧 닭이 울더라'),
        until: (r, dt) => { if (X.near(X.P.fireStand, 4)) r.t = (r.t || 0) + dt; return r.t > 9; },
        leave: () => X.toast('베드로의 이야기는 디베랴 바다의 아침에서 이어져요 (21장)', 5) },
    ],
  },

  // ---------- (3차) 진리 · 다 이루었다 (18:28-19:42, Z11): 관정 → 무리 사이에서 기도 → 십자가 아래 머물기 → 니고데모와 향품. 시험·보상 없이 기록만 ----------
  truth: {
    id: 'truth', ch: '18:28-19:42', zone: 'passion', title: '진리 · 다 이루었다', sign: 0, quiet: true, who: '다른 제자', npc: 'other', stand: 'otherPraet',
    stat: 'prayer', reward: { steps: 0, stat: 0, coin: 0, items: [] }, after: 'arrest', reset: ['other'],
    begin: (X) => X.sky('dawn', X.passionZone, 6),
    listen: '새벽에 사람들이 그분을 관정으로 끌고 갔어요(18:28). 저는 그 뒤로 십자가 곁까지 따라갔지요(19:26). 오늘도 곁에서 보는 사람이 되어 함께 가요. 시험도 보상도 없어요. 소리치는 무리 사이에서는 소리치지 말고 기도해요.',
    read: ['jn-18-28', 'jn-18-37', 'jn-18-38', 'jn-19-15', 'jn-19-17', 'jn-19-25', 'jn-19-26', 'jn-19-27', 'jn-19-28', 'jn-19-30', 'jn-19-39', 'jn-19-40', 'jn-19-41'],
    study: { q: '니고데모가 가져온 몰약과 침향 섞은 것은 얼마쯤이었나요?', a: ['백 근쯤', '한 근', '삼백 데나리온어치'], ok: 0, v: 'jn-19-39' },
    memo: { v: 'jn-19-30', parts: 3 },
    med: { q: '"다 이루었다" 하신 말씀 앞에서, 내가 아직 붙들고 있는 것은 무엇인가요?', at: 'crossSeat', sec: 20, v: 'jn-19-30', where: '골고다 십자가 아래' },
    done: '그분은 "다 이루었다" 하셨어요(19:30). 밤에 찾아왔던 니고데모가 이제는 드러내 놓고 장사를 도왔지요. 이 이야기는 시험도 보상도 없이 기록에만 남아요. 이제 안식 후 첫날, 막달라 마리아에게 가 봐요.',
    steps: (X) => [
      { hint: '관정(총독 관저) 앞 돌 깐 뜰의 빛나는 자리에 서요', go: X.P.praetAt, where: '관정 앞 돌 깐 뜰',
        until: (r, dt) => { r.t = X.near(X.P.praetAt, 1.4) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-18-28'], '새벽이라') },
      { hint: '관정 앞의 빌라도에게 말을 걸어요', go: () => X.npcAt('pilate'), where: '관정 앞', talk: 'pilate',
        open: (r, next) => X.ui.open({
          who: '빌라도', sub: '진리 · 다 이루었다', text: '그는 진리에 대하여 증거하러 왔다고 하더군. 진리가 무엇이냐?', quote: 'jn-18-37',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '말없이 그분의 말씀을 떠올려요', cls: 'next', fn: next }],
        }),
        leave: () => X.verse(['jn-18-37', 'jn-18-38'], '진리가 무엇이냐') },
      { hint: '무리가 소리쳐요(19:15). 따라 소리치지 말고 그 자리에서 기도해요 (X 기도)', go: X.P.praetAt, where: '관정 앞',
        enter: () => { X.mob(true); X.verse(['jn-19-15'], '없이 하소서'); },
        until: (r, dt) => { r.t = X.praying() && X.near(X.P.praetAt, 4) ? (r.t || 0) + dt : 0; return r.t > 3; },
        leave: () => X.mob(false) },
      { hint: '골고다로 가요. 세 십자가 아래 빛나는 자리에 서요', go: X.P.crossAt, where: '골고다 (관정 동쪽 작은 언덕)',
        enter: () => { X.mother(true); X.walkNpc('other', [X.P.otherCross], true); X.verse(['jn-19-17'], '골고다'); },
        until: (r, dt) => { r.t = X.near(X.P.crossAt, 1.3) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-19-25', 'jn-19-26', 'jn-19-27'], '보라 네 어머니라') },
      { hint: '십자가 아래 돌에 앉아 머물러요 (J 앉기). 서두르지 않아도 돼요', go: X.P.crossSeat, where: '골고다 십자가 아래',
        until: (r, dt) => X.rested(r, dt, X.P.crossSeat, 1.6, 10),
        leave: () => X.verse(['jn-19-28', 'jn-19-30'], '다 이루었다') },
      { hint: '니고데모가 왔어요. 니고데모에게 말을 걸어요', go: () => X.npcAt('nico19'), where: '골고다 동쪽 길', talk: 'nico19',
        enter: () => X.nicoCome(true),
        open: (r, next) => X.ui.open({
          who: '니고데모', sub: '진리 · 다 이루었다', text: '전에 밤에 그분을 찾아갔던 니고데모예요(3:2). 몰약과 침향 섞은 것을 백 근쯤 가져왔어요. 함께 동산의 새 무덤으로 가요.', quote: 'jn-19-39',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '향품을 함께 들어요', cls: 'next', fn: () => { X.carry('spice'); X.follow('nico19'); next(); } }],
        }) },
      { hint: '동산 안 새 무덤 앞에 향품을 놓아요 (E)', go: X.P.tombFront, where: '동산 안 새 무덤 앞', place: 'jn_spice', at: () => X.P.tombFront, r: 2.2,
        act: () => { X.carry(null); X.spice(); X.unfollow('nico19'); X.verse(['jn-19-39', 'jn-19-40', 'jn-19-41'], '새 무덤'); } },
    ],
  },

  // ---------- (3차) 마리아야 (20:1-18, Z11 동산 무덤): 새벽 달리기 → 개켜진 수건 → 우는 마리아 곁 → 이름을 부르심 (내 닉네임과 10:3) ----------
  mary: {
    id: 'mary', ch: '20:1-18', zone: 'passion', title: '마리아야', sign: 0, who: '막달라 마리아', npc: 'magdalene',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_cloth'] }, after: 'truth', reset: ['magdalene', 'other'],
    begin: (X) => X.sky('darkdawn', X.passionZone, 6),
    listen: '안식 후 첫날 이른 아침 아직 어두울 때에, 저는 무덤에 왔다가 돌이 옮겨진 것을 보았어요(20:1). 베드로와 그 다른 제자에게 달려가 알렸더니, 둘이 같이 달음질했지요(20:4). 당신도 무덤까지 달려가 봐요.',
    read: ['jn-20-1', 'jn-20-2', 'jn-20-3', 'jn-20-4', 'jn-20-6', 'jn-20-7', 'jn-20-8', 'jn-20-11', 'jn-20-14', 'jn-20-15', 'jn-20-16', 'jn-20-17', 'jn-20-18', 'jn-10-3'],
    study: { q: '머리를 쌌던 수건은 어떻게 놓여 있었나요?', a: ['딴 곳에 개켜 있었다', '세마포와 함께 흩어져 있었다', '없어졌다'], ok: 0, v: 'jn-20-7' },
    memo: { v: 'jn-20-16', parts: 3 },
    med: { q: '그분이 내 이름을 부르신다면, 그 부름에 무엇이라 대답하고 싶나요?', at: 'garden11', sec: 20, v: 'jn-10-3', where: '동산 무덤 곁 의자' },
    done: '그분은 제 이름을 부르셨어요. 그 목자는 자기 양의 이름을 각각 불러요(10:3). "내가 주를 보았다"(20:18), 이 말을 전하러 가요. 이 개켜진 수건을 가져가요. 다음은 그날 저녁, 다락방의 도마예요.',
    steps: (X) => [
      { hint: '동산 안 새 무덤까지 달려가요 (20:4)', go: X.P.tombFront, where: '동산 안 새 무덤',
        enter: () => { X.walkNpc('other', [X.P.garden11], true); X.verse(['jn-20-1', 'jn-20-2'], '아직 어두울 때에'); },
        until: () => X.near(X.P.tombFront, 1.6),
        leave: () => X.verse(['jn-20-3', 'jn-20-4'], '둘이 같이 달음질하더니') },
      { hint: '몸을 굽혀 무덤 안을 들여다봐요 (E)', go: X.P.tombFront, where: '새 무덤 어귀', place: 'jn_look', at: () => X.P.tombFront, r: 2.2,
        act: () => { X.clothShow(); X.look(X.tombMouth); X.verse(['jn-20-6', 'jn-20-7', 'jn-20-8'], '딴 곳에 개켜 있더라'); } },
      { hint: '무덤 밖에서 울고 있는 마리아 곁에 가만히 서요', go: X.P.maryCry, where: '새 무덤 동쪽',
        enter: () => X.maryCry(true),
        until: (r, dt) => { r.t = X.near(X.P.maryCry, 2.2) ? (r.t || 0) + dt : 0; return r.t > 2; },
        leave: () => X.verse(['jn-20-11'], '울면서') },
      { hint: '뒤로 돌이켜, 동산의 따뜻한 빛을 바라봐요 (E)', go: X.P.warmGarden, where: '동산 서쪽 길', place: 'jn_look', at: () => X.P.warmGarden, r: 2.6,
        enter: () => X.warm('garden', X.P.warmGarden),
        act: () => { X.look(X.P.warmGarden); X.verse(['jn-20-14', 'jn-20-15'], '누구를 찾느냐'); } },
      { hint: '마리아에게 말을 걸어요', go: () => X.npcAt('magdalene'), where: '새 무덤 동쪽', talk: 'magdalene',
        open: (r, next) => X.ui.open({
          who: '막달라 마리아', sub: '마리아야', text: '동산지기인 줄 알았어요. 그런데 그분이 "마리아야" 하고 부르셨어요! 저는 돌이켜 "랍오니여" 했지요(20:16).', quote: 'jn-20-16',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '그 부름을 들어요', cls: 'next', fn: () => nameCard(X, next) }],
        }),
        leave: () => { X.sky(null); X.verse(['jn-20-16', 'jn-20-17', 'jn-20-18'], '마리아야'); } },
    ],
  },

  // ---------- (3차) 닫힌 문 · 도마 (20:19-31, Z10 다락방): 닫힌 방의 평강 → 여드레 뒤 의심의 안개를 말씀으로 걷어 내기 → 고백 ----------
  thomas: {
    id: 'thomas', ch: '20:19-31', zone: 'upper', title: '닫힌 문 · 도마', sign: 0, who: '도마', npc: 'thomas', time: 'evening',
    stat: 'word', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_confess'] }, after: 'mary', reset: ['thomas'],
    listen: '그 첫날 저녁, 제자들이 문들을 닫고 모여 있을 때 그분이 오셨대요(20:19). 저는 그 자리에 없었어요(20:24). 그래서 "보지 않고는 믿지 아니하겠노라" 했지요. 오늘은 제 자리에 앉아 그날 저녁을 지켜봐 줘요. 저는 잠시 나가 있을게요.',
    read: ['jn-20-19', 'jn-20-20', 'jn-20-21', 'jn-20-22', 'jn-20-24', 'jn-20-25', 'jn-20-26', 'jn-20-27', 'jn-20-28', 'jn-20-29', 'jn-20-30', 'jn-20-31'],
    study: { q: '도마가 다시 제자들과 함께 있을 때 그분이 오신 것은 언제였나요?', a: ['여드레를 지나서', '사흘 뒤', '이튿날 아침'], ok: 0, v: 'jn-20-26' },
    memo: { v: 'jn-20-29', parts: 4 },
    med: { q: '보지 못하고 믿는 나에게 "복되도다" 하세요. 오늘 믿음으로 고백할 한 마디는 무엇인가요?', at: 'up10w', sec: 20, v: 'jn-20-29', where: '다락방 식탁' },
    done: '저는 "나의 주시며 나의 하나님이시니이다" 고백했어요. 그분은 보지 못하고 믿는 자들이 복되다 하셨어요. 그게 바로 당신이에요(20:29). 이 고백을 가져가요. 마지막 이야기는 디베랴 바다의 아침이에요. 바닷가의 베드로에게 가 봐요.',
    end: (X) => { X.door(false); X.thomasSit(); },
    steps: (X) => [
      { hint: '다락방 식탁에 앉아요 (J 또는 앉기). 문들이 닫혀요', go: X.P.up10, where: '다락방 식탁',
        enter: () => { X.thomasAway(true); X.door(true); },
        until: (r, dt) => { r.t = X.sitting(X.P.up10, 2.0) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => { X.warm('up', X.P.warmUp); X.verse(['jn-20-19', 'jn-20-20', 'jn-20-21', 'jn-20-22'], '너희에게 평강이 있을찌어다'); } },
      { hint: '도마가 돌아왔어요. 문 곁의 도마에게 말을 걸어요', go: () => X.npcAt('thomas'), where: '다락방 남쪽 문 안', talk: 'thomas',
        enter: () => { X.warm('up', null); X.thomasAway(false, 'door'); },
        open: (r, next) => X.ui.open({
          who: '도마', sub: '닫힌 문 · 도마', text: '"우리가 주를 보았노라" 다들 그러는데… 저는 그 손의 못자국을 보고 손가락을 넣어 보지 않고는 믿지 않겠어요.', quote: 'jn-20-25',
          buttons: [{ t: '나중에', cls: 'later' }, { t: '"여드레 뒤에 함께 있어 봐요"', cls: 'next', fn: next }],
        }),
        leave: () => { X.thomasSit(); X.verse(['jn-20-24', 'jn-20-25', 'jn-20-26'], '여드레를 지나서'); } },
      { hint: '의심의 안개가 방을 덮어요. 말씀으로 한 겹씩 걷어 내요', go: X.P.up10, ring: false, where: '다락방',
        enter: (r, next) => X.trial.clear({
          who: '의심의 속삭임', then: next,
          layers: [
            { lie: '"보지 않고는 못 믿어. 눈에 보이는 것만 확실해."', opts: [{ v: 'jn-20-27', ok: true }, { v: 'jn-18-38', why: '빌라도는 "진리가 무엇이냐" 묻고는 대답을 듣지 않고 나갔어요. 그분은 "네 손을 내밀어 보라" 하며 먼저 다가오세요 (20:27)' }] },
            { lie: '"다들 떠나는데 너 혼자 믿어서 뭐 해."', opts: [{ v: 'jn-6-66', why: '떠나간 제자들의 이야기예요. 그분은 문이 닫힌 방에도 오셔서 가운데 서셨어요 (20:26)' }, { v: 'jn-20-26', ok: true }] },
            { lie: '"이미 늦었어. 너는 그날 그 자리에 없었잖아."', opts: [{ v: 'jn-11-39', why: '"나흘이 되었으니" 하던 무덤 앞에서도 그분께는 늦지 않았어요. 그날 없던 사람에게도 복이 있다 하셨어요 (20:29)' }, { v: 'jn-20-29', ok: true }] },
          ],
          win: 'jn-20-28',
        }) },
      { hint: '방 가운데에서 도마와 함께 무릎 꿇고 고백해요 (X 기도)', go: X.P.prayUp, where: '다락방 가운데',
        until: (r, dt) => { r.t = X.praying() && X.near(X.P.prayUp, 2.4) ? (r.t || 0) + dt : 0; return r.t > 1.6; },
        leave: () => { X.door(false); X.verse(['jn-20-28', 'jn-20-29', 'jn-20-30', 'jn-20-31'], '나의 주시며 나의 하나님'); } },
    ],
  },

  // ---------- (3차) 디베랴 바다의 아침 (21:1-25, Z4 바닷가): 빈 그물 → 오른편 → 153 → 숯불 조반 → 세 번의 물음 → 비교의 속삭임 → 어린 양 먹이기. 21:25로 마을이 닫힘 ----------
  morning: {
    id: 'morning', ch: '21:1-25', zone: 'galilee', title: '디베랴 바다의 아침', sign: 0, who: '시몬 베드로', npc: 'peter', stand: 'peterMorn',
    stat: 'obey', reward: { steps: 15, stat: 3, coin: 3, items: ['jn_coals'] }, after: 'thomas',
    begin: (X) => X.sky('night', X.shoreZone, 8),
    listen: '그 후에 저는 "나는 물고기 잡으러 가노라" 했어요(21:3). 그 밤에 아무것도 잡지 못했지요. 숯불 곁에서 세 번 "나는 아니라" 했던 저를, 그분은 바닷가 숯불 곁으로 다시 부르셨어요. 함께 그물을 던져 봐요. 먼저 배 왼편 물가로요.',
    read: ['jn-21-1', 'jn-21-3', 'jn-21-4', 'jn-21-5', 'jn-21-6', 'jn-21-7', 'jn-21-9', 'jn-21-11', 'jn-21-12', 'jn-21-13', 'jn-21-15', 'jn-21-16', 'jn-21-17', 'jn-21-19', 'jn-21-21', 'jn-21-22', 'jn-21-24', 'jn-21-25'],
    study: { q: '그물에 든 큰 고기는 몇 마리였나요?', a: ['일백 쉰 세 마리', '일백 마리', '열 두 마리'], ok: 0, v: 'jn-21-11' },
    memo: { v: 'jn-21-22', parts: 4 },
    med: { q: '"네가 나를 사랑하느냐" 물으시는 그분께 오늘 어떻게 대답하나요? 내가 먹일 어린 양은 누구인가요?', at: 'fireSeat', sec: 20, v: 'jn-21-15', where: '디베랴 바닷가 숯불 곁' },
    done: '세 번 "나는 아니라" 했던 저에게, 그분은 세 번 물으시고 세 번 맡기셨어요. 그리고 "너는 나를 따르라" 하셨지요(21:22). 이 숯불 조반을 가져가요.',
    steps: (X) => [
      { hint: () => `배 왼편 물가에서 그물을 던져요 (E) · ${X.casts()}/2`, go: X.P.castL, where: '디베랴 바닷가 배 곁', place: 'jn_net', at: () => X.P.castL, r: 2.2,
        enter: () => X.verse(['jn-21-1', 'jn-21-3'], '이 밤에 아무 것도'),
        act: () => X.castNet(false) },
      { hint: '날이 새어 가요. 바닷가의 빛에서 들린 말씀대로, 배 오른편 물가에서 그물을 던져요 (E)', go: X.P.castR, where: '디베랴 바닷가 배 오른편', place: 'jn_net', at: () => X.P.castR, r: 2.2,
        enter: () => { X.sky('daybreak', X.shoreZone, 8); X.warm('shore', X.P.warmShore); X.verse(['jn-21-4', 'jn-21-5', 'jn-21-6'], '배 오른편에 그물을 던지라'); },
        act: () => X.castNet(true) },
      { hint: () => `그물을 뭍으로 끌어 올려요 (E를 거듭) · ${X.fishN()}/153`, go: X.P.castR, where: '디베랴 바닷가 배 오른편', place: 'jn_pull', at: () => X.P.castR, r: 2.4,
        enter: () => X.verse(['jn-21-7'], '주시라'),
        act: () => { const full = X.pullNet(); if (full) X.verse(['jn-21-11'], '일백 쉰 세 마리'); return full; } },
      { hint: '숯불 곁에 앉아요 (J 앉기). 숯불 위에 생선과 떡이 있어요', go: X.P.fireSeat, where: '디베랴 바닷가 숯불',
        until: (r, dt) => { r.t = X.sitting(X.P.fireSeat, 1.8) ? (r.t || 0) + dt : 0; return r.t > 1.2; },
        leave: () => X.verse(['jn-21-9', 'jn-21-12', 'jn-21-13'], '와서 조반을 먹으라') },
      { hint: '조반을 먹은 뒤, 베드로에게 말을 걸어요', go: () => X.npcAt('peter'), where: '디베랴 바닷가 숯불 곁', talk: 'peter',
        open: (r, next) => loveAsk(X, next) },
      { hint: '곁에서 속삭임이 들려요. 어떤 말씀을 붙들까요?', go: X.P.fireSeat, ring: false, where: '디베랴 바닷가',
        enter: (r, next) => X.trial.pick({
          who: '비교의 속삭임', lie: '사랑하시는 그 제자가 뒤따라와요(21:20). "저 사람은 어떻게 되나요? 왜 나만 이런 길을 가요?"',
          q: '남과 견주는 소리 앞에서 붙들 말씀을 골라요',
          opts: [
            { v: 'jn-21-21', why: '베드로가 바로 이렇게 여쭈었어요. 그분의 대답은 "네게 무슨 상관이냐"였지요 (21:22)' },
            { v: 'jn-20-25', why: '"보지 않고는 믿지 아니하겠노라"는 내 조건을 앞세운 말이에요. 그분은 "너는 나를 따르라" 하세요 (21:22)' },
            { v: 'jn-21-22', ok: true },
          ],
          win: 'jn-21-19', then: next,
        }) },
      { hint: () => `"내 양을 먹이라" 바닷가의 어린 양을 먹여요 (E) · 남은 ${X.lambsLeft()}`, go: () => X.nextLamb(), where: '디베랴 바닷가 풀밭', place: 'jn_feed', at: () => X.nextLamb(), r: 2.2,
        act: () => X.feedLamb() },
      { hint: '바닷가의 따뜻한 빛 곁에 서요', go: X.P.warmShore, where: '디베랴 바닷가',
        until: (r, dt) => { r.t = X.near(X.P.warmShore, 1.6) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-21-24', 'jn-21-25'], '이 세상이라도') },
    ],
  },
};
const me = (X) => X.me;

// ---------- (3차) 이름 부르기·사랑의 물음 ----------
// 받침이 있으면 "아", 없으면 "야" (한글 끝 글자만 봄. 한글이 아니면 이름 그대로). 이름이 없으면 null
const hasBatchim = (name) => { const c = name.charCodeAt(name.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 > 0 : null; };
export function callName(name) {
  name = String(name || '').trim(); if (!name) return null;
  const b = hasBatchim(name);
  return { voc: b == null ? name : name + (b ? '아' : '야'), obj: name + (b == null ? '을(를)' : b ? '을' : '를') };
}
// 마리아야 (20:16) 다음 카드: 내 닉네임과 10:3 "자기 양의 이름을 각각 불러" (기획서 9장 결정 9)
function nameCard(X, next) {
  const c = callName(X.myName());
  X.ui.open({
    who: '이름을 부르시는 목자', sub: '마리아야',
    text: c ? `"${c.voc}" 그분은 마리아의 이름을 부르셨듯이, 오늘 ${c.obj} 이름으로 부르세요.` : '그분은 마리아의 이름을 부르셨듯이, 오늘 당신의 이름도 부르세요.',
    quote: 'jn-10-3',
    buttons: [{ t: '"랍오니여" (선생님)', cls: 'next', fn: next }],
  });
}
// 나를 사랑하느냐 (21:15-17): 세 번 묻고 세 번 맡기심. 머뭇거리는 대답도 받으시고 똑같이 맡기심
function loveAsk(X, next) {
  const Q = [
    { v: 'jn-21-15', t: '조반을 먹은 뒤 그분이 저에게 물으셨어요. "요한의 아들 시몬아 네가 이 사람들보다 나를 더 사랑하느냐" 오늘은 당신에게도 물으세요.', give: '"내 어린 양을 먹이라" (21:15)' },
    { v: 'jn-21-16', t: '두 번째로 물으세요. "네가 나를 사랑하느냐"', give: '"내 양을 치라" (21:16)' },
    { v: 'jn-21-17', t: '세 번째로 물으세요. 저는 근심했어요. 숯불 곁에서 세 번 "나는 아니라" 했던 그 밤처럼, 세 번이에요.', give: '"내 양을 먹이라" (21:17)' },
  ];
  const ask = (i) => {
    const q = Q[i];
    const go = (shy) => () => {
      X.toast(shy ? `그분은 그 대답도 받으시고, 똑같이 맡기세요. ${q.give}` : q.give, 5);
      if (i < 2) X.later(900, () => ask(i + 1)); else next();
    };
    X.ui.open({
      who: '시몬 베드로', sub: `나를 사랑하느냐 · ${i + 1}/3`, text: q.t, quote: q.v,
      buttons: [
        { t: i < 2 ? '"주여 그러하외다, 주께서 아시나이다"' : '"주여 모든 것을 아시오매, 주께서 아시나이다"', cls: 'next', fn: go(false) },
        { t: '"…아직 자신이 없어요"', fn: go(true) },
      ],
    });
  };
  ask(0);
}
