// 요한복음 마을 사건 데이터 (2026-11 1차 MVP, 기획서 3.4·7장)
//   와 보라(1장) · 가나의 혼인잔치(2장) · 니고데모, 밤에(3장) · 실로암(9장)
//   2차 가 (갈릴리·사마리아): 야곱의 우물(4장) · 말씀을 믿고 가다(4장, 표적 ②) · 오병이어(6장, ④) · 밤바다(6장, ⑤) · 생명의 떡(6장, 💡 떡 등불)
//   두 사건이 한 증인을 쓰면(베드로) stand에 그 사건 때 설 자리(SP 이름)를 적음. reset: 그만두거나 마치면 제자리로 돌릴 사람
//   필수: 듣기(l, 증인의 말) · 읽기(r, 말씀 카드) · 적용(a, 말씀대로 해 보는 단계)
//   선택(깊이 보기): 공부(s) · 암송(m) · 묵상(d). 여섯을 다 채우면 그 사건 표시가 금빛
//   steps(X)는 quests.js 단계 형식 그대로 {hint, go, where, until | place·at·r·act | talk·open}. X는 engine.js가 넘기는 도구
//   (X.P 자리, X.near·X.sitting·X.praying, X.verse, X.sky, X.carry, X.trial, X.walkNpc·X.follow, X.blur, X.water …)
//   말씀 키(jn-)는 js/verses.js, 현대어 짝은 js/bible-modern.js. 예수님은 사람 모습으로 두지 않고 따뜻한 빛으로만 (기획서 0장)

// 여는 차례 (2차 가에서 4·6장을 채움. 성전·베데스다·빛 등 남은 사이 사건은 2차 나에서)
export const ORDER = ['come', 'cana', 'nico', 'well', 'official', 'loaves', 'sea', 'bread', 'siloam'];

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
    done: '그 시에 그분이 "네 아들이 살았다" 하셨어요. 저와 온 집이 다 믿었지요. 이 인장을 가져가요. 다음은 디베랴 바다 건너편, 벳새다 들녘이에요.',
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

  // ---------- (2차 가) ④ 오병이어 (6:1-15, Z5 벳새다 들녘): 빌립의 셈, 아이의 도시락, 잔디에 앉은 무리, 남은 조각 열둘 ----------
  loaves: {
    id: 'loaves', ch: '6:1-15', zone: 'bethsaida', title: '오병이어', sign: 1, who: '빌립', npc: 'philip',
    stat: 'fellow', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_loaves'] }, after: 'official', reset: ['andrew5', 'boy'],
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
    done: '"주여 영생의 말씀이 계시매 우리가 뉘게로 가오리이까" 그날 저는 그렇게 대답했어요. 이 떡 등불이 빛의 광장 등잔 하나를 밝혀요. 이야기는 성전 문 곁, 날 때부터 소경이었던 사람에게서 이어져요.',
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

  // ---------- ④ 실로암 (9장, Z7 → Z9): 감각으로 체험하는 표적 ----------
  siloam: {
    id: 'siloam', ch: '9:1-38', zone: 'siloam', start: 'temple', title: '실로암', sign: 1, who: '눈 뜬 사람', npc: 'blind',
    stat: 'witness', reward: { steps: 12, stat: 3, coin: 3, items: ['jn_siloam'] }, after: 'bread',
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
