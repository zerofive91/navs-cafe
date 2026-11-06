// 요한복음 마을 사건 데이터 (2026-11 1차 MVP, 기획서 3.4·7장)
//   와 보라(1장) · 가나의 혼인잔치(2장) · 니고데모, 밤에(3장) · 실로암(9장)
//   필수: 듣기(l, 증인의 말) · 읽기(r, 말씀 카드) · 적용(a, 말씀대로 해 보는 단계)
//   선택(깊이 보기): 공부(s) · 암송(m) · 묵상(d). 여섯을 다 채우면 그 사건 표시가 금빛
//   steps(X)는 quests.js 단계 형식 그대로 {hint, go, where, until | place·at·r·act | talk·open}. X는 engine.js가 넘기는 도구
//   (X.P 자리, X.near·X.sitting·X.praying, X.verse, X.sky, X.carry, X.trial, X.walkNpc·X.follow, X.blur, X.water …)
//   말씀 키(jn-)는 js/verses.js, 현대어 짝은 js/bible-modern.js. 예수님은 사람 모습으로 두지 않고 따뜻한 빛으로만 (기획서 0장)

// 1차에서 여는 차례 (사이 사건 4~12번은 2차에서 채움)
export const ORDER = ['come', 'cana', 'nico', 'siloam'];

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
    done: '말씀대로 했을 뿐인데 물이 좋은 포도주가 되었어요. 이 돌항아리를 가져가요. 다음은 예루살렘 윗동네, 밤에 찾아온 니고데모예요.',
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

  // ---------- ③ 니고데모, 밤에 (3:1-21, Z10): 밤 연출과 머묾 ----------
  nico: {
    id: 'nico', ch: '3:1-21', zone: 'upper', title: '니고데모, 밤에', sign: 0, who: '니고데모', npc: 'nico',
    stat: 'word', reward: { steps: 12, stat: 3, coin: 2, items: ['jn_nightlamp'] }, after: 'cana', time: 'night',
    listen: '저는 이스라엘의 선생인데 밤에 그분을 찾아왔어요(3:2). 낮에 오기는 사람 눈이 무서웠거든요. 계단으로 지붕에 올라와요. 그날 밤 들은 말씀을 들려줄게요.',
    read: ['jn-3-2', 'jn-3-3', 'jn-3-8', 'jn-3-14', 'jn-3-15', 'jn-3-16', 'jn-3-21'],
    study: { q: '니고데모는 언제 그분을 찾아왔나요?', a: ['밤', '새벽', '한낮'], ok: 0, v: 'jn-3-2' },
    memo: { v: 'jn-3-16', parts: 4 },
    med: { q: '거듭났다는 것은 내게 무엇인가요?', at: 'lie10', lie: true, sec: 20, v: 'jn-3-3', where: '니고데모 집 지붕' },
    done: '저는 그 밤의 말씀을 오래 품었어요. 언젠가 다시 그분 곁에 설 거예요. 이 등잔을 가져가요. 다음은 성전 문 곁, 날 때부터 소경이었던 사람의 이야기예요.',
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

  // ---------- ④ 실로암 (9장, Z7 → Z9): 감각으로 체험하는 표적 ----------
  siloam: {
    id: 'siloam', ch: '9:1-38', zone: 'siloam', start: 'temple', title: '실로암', sign: 1, who: '눈 뜬 사람', npc: 'blind',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_siloam'] }, after: 'nico',
    listen: '저는 날 때부터 앞을 못 봤어요. 제자들은 누구 죄 때문이냐고 물었지요(9:2). 그날을 제 눈으로 겪어 볼래요? 성전 문 곁 빛나는 자리에 앉으면 화면이 흐려져요. 어지러우면 "흐림 없이 하기"를 눌러요.',
    read: ['jn-9-2', 'jn-9-3', 'jn-9-7', 'jn-9-24', 'jn-9-25', 'jn-9-35', 'jn-9-36', 'jn-9-37', 'jn-9-38'],
    study: { q: '그 사람은 어디서 씻었나요?', a: ['실로암', '베데스다', '요단'], ok: 0, v: 'jn-9-7' },
    memo: { v: 'jn-9-25', parts: 4 },
    med: { q: '주님이 내 눈을 열어 주신 일 하나를 떠올려요.', at: 'med9', sec: 20, v: 'jn-9-25', where: '실로암 못 계단' },
    done: '한 가지 아는 것은, 제가 소경으로 있다가 지금 본다는 거예요. 이 실로암 물을 가져가요.',
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
};
const me = (X) => X.me;
