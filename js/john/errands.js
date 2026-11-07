// 요한복음 마을 증인의 작은 부탁 자료 (2026-11, 채우기 E1 · 기획서 john-enrichment-plan.md 3.1)
//   엔진은 마을 공용 js/village/errands.js. 여기는 자료만 (사도행전 마을은 같은 모양으로 js/acts/errands.js)
//   원칙: 본문 사건의 곁일만. 새 사실·새 가르침을 만들지 않고, 끝에 그 장 구절. 수난 구역(Z11)에는 부탁이 없음 (기획서 6장 결정 4)
//   who: 부탁하는 사람(engine.js N의 키, 엔진 밖 사람은 register로) · after: 마쳐야 하는 사건 · need(j): 그 밖의 조건
//   again: 'once' | 'day' · stat: 처음 마칠 때 오르는 능력치 · verse: 마칠 때 말씀 카드 (jn- 키, js/verses.js)
//   steps(X): 사건과 같은 단계 형식 (js/village/errands.js 머리말). X는 engine.js 도구 + 부탁 도구(X.prop·X.props·X.resetNpc·X.litLamps·X.dayPick)
//   reset: 마치거나 그만두면 제자리로 돌릴 사람 · follow: 따라오게 한 사람 (끝나면 멈춤)
import { W, CART, JARS } from './layout.js';

// 부탁 자리 (마을 좌표 u 동쪽, v 남쪽 → 세계 좌표)
const NET21 = [W(40.6, -119.4), W(42.2, -116.8), W(38.6, -115.6)];   // 디베랴 바닷가 그물 말리는 자리
const EDGE6 = [W(-15.2, -47.5), W(-15.2, -44), W(-15.2, -40.5)];    // 수가 희어진 밭 서쪽 가 (동네에서 오는 길이 보이는 자리)
const WALK4 = [W(17.5, -110.8), W(30.5, -110.8)];                    // 가버나움 신하의 집 앞 길
const SEAT2 = W(136.6, 33.8);                                         // 무화과나무 그늘 (나다나엘 곁)
const WEDGE1 = [W(98.4, 145.2), W(72.2, 155.4)];                     // 빛의 광장 둘레 (수레 쐐기)
const WHEEL1 = { x: CART.x + 1.6, z: CART.z + 0.4 };                  // 수레 바퀴 곁
// ---- E2 (나머지 부탁) 자리 ----
const CRUMB5 = [W(89.5, -84), W(99, -90), W(90, -72)];                // 벳새다 잔디 구석 (남은 조각)
const LEAD7 = [W(-20, 78), W(-10, 80)];                                // 성전 동쪽 길 양 우리에서 풀밭 쪽으로 (목자가 앞서 감)
const SWEEP7 = [W(-69.5, 53.5), W(-65, 52.5), W(-67.5, 48)];          // 성전 뜰 장사판이 있던 자리 둘레
const SIT8 = W(-3.2, 97.6);                                            // 베데스다 동쪽 행각, 누운 사람 곁
const TEMPLE_GO = W(-56, 60);                                          // 성전 뜰
const POOL9_GO = W(-72.8, 130.9);                                      // 실로암 못 계단
const MARY12 = [W(37.8, 66.5), W(43.5, 59), W(48.5, 59.5)];           // 베다니 집 둘레 (서쪽·북쪽·동북쪽)
const TOMBRD12 = W(33.5, 64.5);                                        // 무덤 쪽 길 입구
const GATE12 = W(55.4, 92.2);                                          // 마을 어귀 (남동쪽 길)
const TABLE12_FROM = W(43.5, 68.2), TABLE12_AT = [W(47.6, 70.4), W(39.4, 70.6)]; // 베다니 마당 식탁 (집 문 곁에서 받아 두 끝에 놓음)
const TABLE10_FROM = W(-99, 17.6), TABLE10_AT = [W(-101.4, 14.75), W(-97.8, 14.75)]; // 다락방 긴 식탁 (문 안쪽에서 받아 남쪽 두 자리에 놓음)

const nearest = (X, list, skip) => list.map((p, i) => [p, i]).filter(([, i]) => !skip.has(i)).sort((a, b) => Math.hypot(a[0].x - X.me.x, a[0].z - X.me.z) - Math.hypot(b[0].x - X.me.x, b[0].z - X.me.z))[0];


// 상 차리기 (떡 → 물잔): 받는 자리(from)에서 받아 상 위 두 자리(at)에 차례로 놓음
function tableSteps(X, from, at, where) {
  const ITEMS = [['basket', '떡'], ['cup', '물잔']];
  return ITEMS.flatMap(([kind, nm], i) => [
    { hint: `${nm}을(를) 받아요 (E)`, go: from, where, place: 'jn_pick', at: () => from, r: 2.2,
      act: () => { X.carry(kind); X.sfx('cup', 0.2, 0.9 + i * 0.2); } },
    { hint: `${nm}을(를) 상에 놓아요 (E)`, go: at[i], where, place: 'jn_put', at: () => at[i], r: 2.2,
      enter: () => X.rings([at[i]]),
      act: () => { X.carry(null); X.sfx('tap', 0.2, 1.0 + i * 0.15); X.burst(at[i].x, X.me.y + 1.0, at[i].z); } },
  ]);
}
// 함께 걷기: 그 사람을 따라오게 하고 도착한 자리에서 마침 (두 사람이 모두 닿아야 함)
function walkWith(X, k, to, hint, where, leaveLine) {
  return { hint, go: to, where,
    enter: () => X.follow(k),
    until: () => X.near(to, 2.6) && X.dn(k, to) < 4.5,
    leave: () => { X.unfollow(k); if (leaveLine) X.say(X.npcAt(k).name, leaveLine, 3); } };
}
// 그 사람에게 말을 걸어 알리기 (한 줄 대화)
const tellStep = (X, k, who, sub, text, btn, hint, where, quote) => ({
  hint, go: () => X.npcAt(k), where, talk: k,
  open: (r, next) => X.ui.open({ who, sub, text, quote, buttons: [{ t: '나중에', cls: 'later' }, { t: btn, cls: 'next', fn: next }] }),
});

export const ER = {
  // ---------- Z1 빛의 광장 · 사도 요한: 켜진 등잔에 기름 채우기 (1:5) ----------
  'john-oil': {
    who: 'john', name: '사도 요한', after: 'come', need: (j) => j.lamps.length > 0, title: '켜진 등잔에 기름 채우기', again: 'day', where: '빛의 광장',
    stat: 'obey', verse: 'jn-1-5',
    listen: '광장 둘레 등잔에 하나둘 불이 켜졌어요. 밤에도 꺼지지 않게 기름을 채워 두고 싶어요. 북서쪽 길 끝 등불 자리에서 기름병을 받아, 켜진 등잔에 기름을 부어 줄래요?',
    done: '등잔마다 불이 환해요. "빛이 어두움에 비취되"(1:5), 광장이 밝아요.',
    steps: (X) => {
      const filled = new Set();
      const lit = () => X.litLamps();
      const goal = () => Math.min(3, lit().length);
      const next = () => nearest(X, lit(), filled);
      return [
        { hint: '광장 북서쪽 길 끝 등불 자리에서 기름병을 받아요 (E)', go: X.P.lampAt, where: '빛의 광장 북서쪽 길 끝', place: 'jn_oil', at: () => X.P.lampAt, r: 2.4,
          act: () => { X.carry('oil'); X.sfx('cup', 0.2, 0.8); } },
        { hint: () => `켜진 등잔에 기름을 부어요 (E) · ${filled.size}/${goal()}`, go: () => next()?.[0] || X.center, where: '빛의 광장 둘레 등잔', place: 'jn_oil', at: () => next()?.[0], r: 2.2,
          enter: () => X.rings(lit().filter((p, i) => !filled.has(i))),
          act: () => {
            const n = next(); if (!n) return true;
            filled.add(n[1]); X.sfx('cup', 0.2, 1.0 + filled.size * 0.08); X.burst(n[0].x, 1.8, n[0].z);
            X.rings(lit().filter((p, i) => !filled.has(i)));
            return filled.size >= goal();
          } },
      ];
    },
  },

  // ---------- Z1 · 수레꾼 두기고: 수레 쐐기 주워 오기 (21:25) ----------
  //   두기고는 cartguide.js 사람이라 엔진이 모름 → cartguide 말풍선에서 errands.register('tychicus', n)·talk('tychicus')를 부르면 열림 (E6에서 잇기)
  'cart-wedge': {
    who: 'tychicus', name: '수레꾼 두기고', after: 'come', title: '수레 쐐기 주워 오기', again: 'once', where: '빛의 광장 남쪽 수레',
    stat: 'fellow', verse: 'jn-21-25',
    listen: '수레 바퀴를 받치던 쐐기 둘이 광장 둘레로 굴러가 버렸어요. 편지와 소식을 나르는 수레가 기울어 서 있으면 안 되지요. 주워다 바퀴 곁에 받쳐 줄래요?',
    done: '바퀴가 단단히 섰어요. 이 수레로 오늘도 편지와 소식을 나를게요. 이 마을에서 들은 일만 해도 다 적자면 끝이 없을 거예요.',
    thanks: '그날 받쳐 준 쐐기가 아직도 단단해요. 고마워요.',
    begin: (X) => { X.props(null); WEDGE1.forEach((p) => X.prop('wedge', p)); },
    steps: (X) => {
      const got = new Set();
      const next = () => nearest(X, WEDGE1, got);
      return [
        { hint: () => `광장 둘레에 굴러간 쐐기를 주워요 (E) · ${got.size}/2`, go: () => next()?.[0], where: '빛의 광장 둘레', place: 'jn_pick', at: () => next()?.[0], r: 2.0,
          enter: () => X.rings(WEDGE1.filter((p, i) => !got.has(i))),
          act: () => {
            const n = next(); if (!n) return true;
            got.add(n[1]); X.propAt(n[0], false); X.sfx('tap', 0.2, 1.2); X.burst(n[0].x, 0.6, n[0].z);
            X.rings(WEDGE1.filter((p, i) => !got.has(i)));
            return got.size >= 2;
          } },
        { hint: '수레 바퀴 곁에 쐐기를 받쳐요 (E)', go: WHEEL1, where: '빛의 광장 남쪽 수레', place: 'jn_put', at: () => WHEEL1, r: 2.2,
          act: () => { X.prop('wedge', WHEEL1); X.sfx('impact/impactWood_light_000', 0.2, 1.0); } },
      ];
    },
  },

  // ---------- Z2 요단 건너 베다니 · 나다나엘: 무화과나무 그늘에서 함께 읽기 (1:47) ----------
  'nathan-read': {
    who: 'nathan', name: '나다나엘', after: 'come', title: '무화과나무 그늘에서 함께 묵상하기', again: 'day', where: '요단 건너 베다니 · 무화과나무 아래',
    stat: 'word', verse: 'jn-1-47',
    listen: '빌립이 저를 부르기 전에, 저는 이 무화과나무 아래 있었어요(1:48). 오늘도 이 그늘에 조용히 앉아 말씀을 묵상하려 해요. 곁에 앉아 함께 묵상할래요?',
    done: '그분은 무화과나무 아래 있던 저를 보셨어요(1:48). 이 그늘에 가만히 앉아 있는 시간이 좋아요. 함께해 주어 고마워요.',
    steps: (X) => [
      { hint: '무화과나무 그늘, 나다나엘 곁에 앉아요 (J 앉기)', go: SEAT2, where: '요단 건너 베다니 · 무화과나무 아래',
        until: (r, dt) => { r.t = X.sitting(SEAT2, 1.8) ? (r.t || 0) + dt : 0; return r.t > 1; },
        leave: () => X.verse(['jn-1-48'], '무화과나무 아래 있을 때에') },
      { hint: (r) => `나다나엘과 함께 조용히 묵상해요. 앉은 채로 · ${Math.max(0, Math.ceil(12 - (r.t || 0)))}초`, go: SEAT2, where: '무화과나무 아래',
        until: (r, dt) => X.rested(r, dt, SEAT2, 2.4, 12) },
    ],
  },

  // ---------- Z3 가나 · 하인: 돌항아리 셋 씻어 두기 (2:6) ----------
  'cana-wash': {
    who: 'servant', name: '하인', after: 'cana', title: '돌항아리 씻어 두기', again: 'day', where: '가나 잔치 집 마당',
    stat: 'obey', verse: 'jn-2-6',
    listen: '잔치가 한창이에요. 결례에 쓰는 돌항아리를 깨끗이 씻어 두어야 해요. 우물에서 물을 길어 항아리 셋을 씻어 줄래요? 나머지 셋은 제가 맡을게요.',
    done: '항아리마다 깨끗해졌어요. 이 항아리에 물을 아구까지 채우던 그날이 생각나요(2:7). 고마워요.',
    begin: (X) => X.apron(true),
    end: (X) => X.apron(false),
    steps: (X) => {
      const washed = new Set();
      const jar = () => nearest(X, JARS, washed);
      return [
        { hint: () => (X.carrying() ? `물동이를 들고 돌항아리를 씻어요 (E) · ${washed.size}/3` : `우물에서 물을 길어요 (E) · 씻은 항아리 ${washed.size}/3`), where: '가나 잔치 집 마당',
          go: () => (X.carrying() ? jar()[0] : X.P.well), place: () => (X.carrying() ? 'jn_wash' : 'jn_water'), at: () => (X.carrying() ? jar()[0] : X.P.well), r: 1.9,
          act: () => {
            if (!X.carrying()) { X.carry('jar'); X.sfx('cup', 0.2, 0.8); return false; }
            const j = jar(); washed.add(j[1]); X.carry(null);
            X.sfx('cup', 0.25, 0.6); X.burst(j[0].x, X.me.y + 1.0, j[0].z);
            return washed.size >= 3;
          } },
      ];
    },
  },

  // ---------- Z3 가나 · 연회장: 손님과 신랑에게 잔 돌리기 (2:10) ----------
  'cana-cups': {
    who: 'master', name: '연회장', after: 'cana', title: '손님과 신랑에게 잔 돌리기', again: 'day', where: '가나 잔치 식탁',
    stat: 'fellow', verse: 'jn-2-10',
    listen: '잔치가 한창이에요. 돌항아리의 좋은 포도주를 손님과 신랑에게 한 잔씩 돌려 줄래요? 다 돌리면 저에게 알려 주어요.',
    done: '손님들 얼굴이 환해요. 그날 저는 좋은 포도주를 지금까지 두었다고 신랑에게 말했지요(2:10). 고마워요.',
    begin: (X) => X.apron(true),
    end: (X) => X.apron(false),
    steps: (X) => {
      const serve = (k, name, line) => [
        { hint: `돌항아리에서 한 잔 떠요 (E) · ${name}에게 줄 잔`, go: () => X.nearJar(), where: '가나 잔치 집 돌항아리', place: 'jn_draw', at: () => X.nearJar(), r: 1.8,
          act: () => { X.carry('cup'); X.sfx('cup', 0.2, 1.1); } },
        { hint: `${name}에게 잔을 건네요 (E)`, go: () => X.npcAt(k), where: '가나 잔치 식탁', place: 'jn_give', at: () => X.npcAt(k), r: 2.4,
          act: () => { X.carry(null); const n = X.npcAt(k); X.burst(n.x, 1.6, n.z); X.sfx('orb', 0.2, 1.2); X.say(name, line, 3); } },
      ];
      return [
        ...serve('guest0', '손님', '이렇게 좋은 포도주가 아직 있었네요!'),
        ...serve('guest1', '신랑', '함께 기뻐해 주어 고마워요!'),
        { hint: '연회장에게 다 돌렸다고 알려요', go: () => X.npcAt('master'), where: '식탁 머리의 연회장', talk: 'master',
          open: (r, next) => X.ui.open({ who: '연회장', sub: '손님과 신랑에게 잔 돌리기', text: '벌써 다 돌렸어요? 잔치가 끝까지 기쁘겠어요.', buttons: [{ t: '다 돌렸어요', cls: 'next', fn: next }] }) },
      ];
    },
  },

  // ---------- Z4 디베랴 바닷가 · 베드로: 그물 펴 널기 (21:11) ----------
  'peter-net': {
    who: 'peter', name: '시몬 베드로', after: 'morning', title: '바닷가에 그물 펴 널기', again: 'day', where: '디베랴 바닷가',
    stat: 'obey', verse: 'jn-21-11',
    listen: '그날 그물을 뭍으로 끌어 올리니 큰 고기가 일백 쉰 세 마리였어요. 그렇게 많아도 그물이 찢어지지 않았지요. 다음 고기잡이를 위해 그물을 바닷가에 펴 널어 말리려 해요. 도와줄래요?',
    done: '그물이 잘 마르겠어요. 숯불 곁에서 "와서 조반을 먹으라" 하시던 그 아침이 생각나요(21:12). 고마워요.',
    steps: (X) => {
      const spread = new Set();
      const next = () => nearest(X, NET21, spread);
      return [
        { hint: () => `그물을 바닷가 말리는 자리에 펴 널어요 (E) · ${spread.size}/3`, go: () => next()?.[0], where: '디베랴 바닷가 숯불 동쪽', place: 'jn_dry', at: () => next()?.[0], r: 2.2,
          enter: () => X.rings(NET21),
          act: () => {
            const n = next(); if (!n) return true;
            spread.add(n[1]); X.prop('net', n[0]); X.sfx('tap', 0.2, 1.0 + spread.size * 0.1); X.burst(n[0].x, 0.5, n[0].z);
            X.rings(NET21.filter((p, i) => !spread.has(i)));
            return spread.size >= 3;
          } },
        { hint: '베드로에게 다 널었다고 알려요', go: () => X.npcAt('peter'), where: '디베랴 바닷가', talk: 'peter',
          open: (r, next) => X.ui.open({ who: '시몬 베드로', sub: '바닷가에 그물 펴 널기', text: '햇볕에 잘 마르겠어요. 함께 하니 금방이네요.', buttons: [{ t: '다 널었어요', cls: 'next', fn: next }] }) },
      ];
    },
  },

  // ---------- Z3 → Z4 · 왕의 신하: 아들과 집 앞 길 걷기 (4:53) ----------
  'official-home': {
    who: 'official', name: '왕의 신하', after: 'official', title: '아들과 집 앞 길 걷기', again: 'once', where: '가나 → 가버나움 신하의 집',
    stat: 'fellow', verse: 'jn-4-53', reset: ['official', 'son'], follow: ['son'],
    listen: '그 시에 아들이 살았어요. 집에 가서 아이와 함께 집 앞 길을 걷고 싶어요. 며칠 전만 해도 거의 죽게 되었던 아이니까요. 제가 먼저 집으로 갈 테니 가버나움으로 와 줄래요?',
    done: '그날 저와 온 집이 다 믿었어요(4:53). 아이와 함께 걸으니 그 시가 다시 떠올라요. 고마워요.',
    thanks: '그날 아들과 함께 걸어 주어 고마웠어요. 아이는 이제 날마다 그 길을 뛰어다녀요.',
    steps: (X) => {
      let k = 0;
      return [
        { hint: '가버나움 왕의 신하의 집으로 가요 (동쪽 호숫가 길, 금빛 기둥)', go: X.P.house4, where: '가버나움 왕의 신하의 집 (길 남쪽)',
          enter: () => X.walkNpc('official', [W(22.2, -109.6)], true),
          until: () => X.near(X.P.house4, 2.4) },
        { hint: '신하의 아들에게 말을 걸어요', go: () => X.npcAt('son'), where: '가버나움 왕의 신하의 집', talk: 'son',
          open: (r, next) => X.ui.open({ who: '신하의 아들', sub: '아들과 집 앞 길 걷기', text: '아버지가 그러는데, 그날 이야기를 당신도 안대요! 집 앞 길을 같이 걸어요.', buttons: [{ t: '같이 걸어요', cls: 'next', fn: next }] }) },
        { hint: () => `아들과 함께 집 앞 길을 걸어요 · ${k}/2`, go: () => WALK4[Math.min(k, 1)], where: '가버나움 신하의 집 앞 길',
          enter: () => { k = 0; X.follow('son'); },
          until: () => { const p = WALK4[k]; if (p && X.near(p, 1.6) && X.dn('son', p) < 4.5) { k++; X.sfx('tap', 0.2, 1.2 + k * 0.1); } return k >= 2; } },
        { hint: '아들과 함께 집 앞으로 돌아와요', go: X.P.house4, where: '가버나움 왕의 신하의 집',
          until: () => X.near(X.P.house4, 2.2) && X.dn('son', X.P.house4) < 4.5,
          leave: () => { X.unfollow('son'); X.say('신하의 아들', '함께 걸어 주어 고마워요!', 3); } },
      ];
    },
  },

  // ---------- Z6 수가 · 사마리아 여인: 동네 사람 하나 더 우물로 (4:39) ----------
  'well-bring': {
    who: 'woman', name: '사마리아 여인', after: 'well', title: '이웃 하나 더 우물로', again: 'day', where: '수가 · 야곱의 우물', reset: ['vil0', 'vil1'],
    stat: 'witness', verse: 'jn-4-39',
    listen: '그날 동네 사람들이 우물로 나왔어요. 그래도 아직 그분 이야기를 다 못 들은 이웃이 있어요. 한 사람 더 "와 보라" 하고 우물로 데려와 줄래요?',
    done: '제 말을 듣고 그 동네의 많은 사람이 믿었어요(4:39). 오늘도 한 사람이 우물로 왔네요. 고마워요.',
    steps: (X) => {
      const k = X.dayPick(['vil0', 'vil1'], 'well'), i = k === 'vil0' ? 0 : 1;
      const LINES = { vil0: '그 여자가 또 우물로 오라고요? 그날 일은 들었지만, 나는 아직 가 보지 못했어요.', vil1: '내가 행한 모든 것을 말한 사람이라고요(4:29)? 정말 그리스도가 아닐까요?' };
      return [
        { hint: '수가 동네 사람에게 "와 보라" 하고 전해요 (우물 서쪽 집들)', go: () => X.npcAt(k), where: '수가 동네 (우물 서쪽 집들)', talk: k,
          open: (r, next) => X.ui.open({
            who: '수가 사람', sub: '이웃 하나 더 우물로', text: LINES[k], quote: 'jn-4-29',
            buttons: [{ t: '나중에', cls: 'later' }, { t: '와 보라!', cls: 'next', fn: () => { const n = X.npcAt(k); X.burst(n.x, 1.6, n.z); X.sfx('orb', 0.2, 1.15); X.walkNpc(k, [X.P.come6[i]], true); next(); } }],
          }) },
        { hint: '사마리아 여인에게 알려요', go: () => X.npcAt('woman'), where: '야곱의 우물', talk: 'woman',
          open: (r, next) => X.ui.open({ who: '사마리아 여인', sub: '이웃 하나 더 우물로', text: '이웃이 우물로 왔군요! 그날도 이렇게 한 사람씩 왔어요.', buttons: [{ t: '함께 왔어요', cls: 'next', fn: next }] }) },
      ];
    },
  },

  // ---------- Z6 수가 · 수가 사람: 밭 가에서 눈을 들어 보기 (4:35-36). 희어진 밭은 비유라 낱알을 거두지 않음 ----------
  'sychar-look': {
    who: 'vil2', name: '수가 사람', after: 'well', title: '밭 가에서 눈을 들어 보기', again: 'day', where: '수가 · 우물 동쪽 밭 가',
    stat: 'witness', verse: 'jn-4-36',
    listen: '그날 그분이 제자들에게 "눈을 들어 밭을 보라 희어져 추수하게 되었도다" 하셨다지요(4:35). 그때 저희 동네 사람들이 우물 쪽으로 나오고 있었어요(4:30). 우물 동쪽 밭 가 세 곳에 서서, 동네에서 오는 길을 함께 바라봐 줄래요?',
    done: '그날 저희도 저 길로 그분께 나아갔어요. 밭 가에 서니 그분이 하신 말씀이 떠올라요(4:35). 함께 바라봐 주어 고마워요.',
    steps: (X) => {
      const seen = new Set();
      const next = () => nearest(X, EDGE6, seen);
      return [
        { hint: () => `밭 가에 서서 동네에서 오는 길을 바라봐요 (E) · ${seen.size}/3`, go: () => next()?.[0], where: '우물 동쪽 밭 가', place: 'jn_look', at: () => next()?.[0], r: 1.9,
          enter: () => X.rings(EDGE6),
          act: () => {
            const n = next(); if (!n) return true;
            seen.add(n[1]); X.look(X.P.well6); X.sfx('tap', 0.2, 1.0 + seen.size * 0.1);
            X.rings(EDGE6.filter((p, i) => !seen.has(i)));
            return seen.size >= 3;
          } },
        { hint: '수가 사람에게 말을 걸어요', go: () => X.npcAt('vil2'), where: '수가 동네 남쪽 집', talk: 'vil2',
          open: (r, next) => X.ui.open({ who: '수가 사람', sub: '밭 가에서 눈을 들어 보기', text: '저 길로 사람들이 하나둘 우물로 갔어요. 그날이 눈에 선해요.', buttons: [{ t: '함께 보았어요', cls: 'next', fn: next }] }) },
      ];
    },
  },

  // ======================= E2: 나머지 부탁 15개 (2026-11, 채우기 E2) =======================

  // ---------- Z2 요단 건너 베다니 · 안드레: 갈릴리의 시몬에게 소식 전하기 (1:41) ----------
  'andrew-tell': {
    who: 'andrew', name: '안드레', after: 'come', title: '시몬에게 소식 전하기', again: 'once', where: '요단 건너 베다니 → 갈릴리 바닷가',
    stat: 'witness', verse: 'jn-1-41',
    listen: '그날 저는 먼저 형제 시몬을 찾아 "우리가 메시야를 만났다" 하고 말했어요(1:41). 시몬은 지금 갈릴리 바닷가 쪽에 있을 거예요. 그 소식을 시몬에게 다시 전해 주고 올래요? 길이 꽤 멀어요.',
    done: '시몬에게 소식이 닿았어요. 그날 저는 시몬을 예수님께 데리고 갔지요(1:42). 먼 길을 걸어 주어 고마워요.',
    thanks: '그날 시몬에게 전해 준 소식을 잊지 않을게요. 고마워요.',
    steps: (X) => [
      tellStep(X, 'peter', '시몬 베드로', '시몬에게 소식 전하기', '안드레가 보낸 소식이군요. "우리가 메시야를 만났다"고요? 그날 안드레가 저를 예수님께 데리고 갔지요(1:42).', '소식을 전했어요', '갈릴리 바닷가의 시몬 베드로에게 소식을 전해요', '갈릴리 바닷가 · 시몬 베드로', 'jn-1-41'),
      tellStep(X, 'andrew', '안드레', '시몬에게 소식 전하기', '벌써 다녀왔어요? 시몬이 소식을 들었군요!', '전했어요', '안드레에게 돌아가 알려요', '요단 건너 베다니 · 안드레', null),
    ],
  },

  // ---------- Z5 벳새다 · 아이: 남은 조각 다시 거두기 (6:12) ----------
  'boy-gather': {
    who: 'boy', name: '아이', after: 'loaves', title: '남은 조각 다시 거두기', again: 'day', where: '벳새다 들녘 잔디',
    stat: 'obey', verse: 'jn-6-12',
    listen: '그날 제자들이 남은 조각을 거두었는데, 저는 아직도 마음이 쓰여요. 잔디 구석에 떨어진 것이 없는지 같이 살펴 줄래요? "버리는 것이 없게 하라" 하셨잖아요(6:12).',
    done: '하나도 버리지 않았어요. 그날 남은 조각이 열두 바구니에 찼지요(6:13). 고마워요.',
    steps: (X) => {
      const got = new Set();
      const next = () => nearest(X, CRUMB5, got);
      return [
        { hint: () => `잔디 구석에 떨어진 조각을 주워요 (E) · ${got.size}/3`, go: () => next()?.[0], where: '벳새다 들녘 잔디', place: 'jn_pick', at: () => next()?.[0], r: 2.0,
          enter: () => X.rings(CRUMB5),
          act: () => {
            const n = next(); if (!n) return true;
            got.add(n[1]); X.carry('basket'); X.sfx('tap', 0.2, 1.0 + got.size * 0.1); X.burst(n[0].x, X.me.y + 0.8, n[0].z);
            X.rings(CRUMB5.filter((p, i) => !got.has(i)));
            return got.size >= 3;
          } },
        tellStep(X, 'boy', '아이', '남은 조각 다시 거두기', '고마워요! 남은 조각이 하나도 버려지지 않았어요.', '다 주웠어요', '아이에게 다 주웠다고 알려요', '벳새다 들녘', null),
      ];
    },
  },

  // ---------- Z5 벳새다 · 빌립: 잔디에 무리 앉히기 (6:10) ----------
  'philip-seat': {
    who: 'philip', name: '빌립', after: 'loaves', title: '잔디에 무리 앉히기', again: 'day', where: '벳새다 들녘 잔디',
    stat: 'fellow', verse: 'jn-6-10',
    listen: '그날 "사람들로 앉게 하라" 하셨고, 그 곳에는 잔디가 많았어요(6:10). 오늘도 풀밭에 서성이는 사람들이 있어요. 한 무리씩 잔디에 앉도록 도와줄래요?',
    done: '모두 잔디에 앉았어요. 그날 앉은 사람이 오천쯤 되었지요(6:10). 고마워요.',
    begin: (X) => X.groupsOn(true),
    end: (X) => X.groupsOn(false),
    steps: (X) => [
      { hint: () => `서 있는 사람들을 잔디에 앉혀요 (E) · ${X.groups.filter((g) => g.seated).length}/3`, go: () => (X.nearestGroup((g) => !g.seated) || { g: X.P.warm5 }).g, where: '벳새다 들녘 잔디', place: 'jn_call',
        at: () => (X.nearestGroup((g) => !g.seated) || { g: X.P.warm5 }).g, r: 2.8,
        act: () => { const g = X.nearestGroup((x) => !x.seated); if (g) X.seatGroup(g); return X.groupsAll((x) => x.seated); } },
    ],
  },

  // ---------- Z7 성전 동쪽 길 양 우리 · 목자: 앞서 가는 목자를 따라 풀밭 길 걷기 (10:4) ----------
  'shepherd-lead': {
    who: 'shepherd', name: '목자', after: 'shepherd', title: '목자를 따라 풀밭 길 걷기', again: 'day', where: '성전 동쪽 길 · 양 우리',
    stat: 'word', verse: 'jn-10-4', reset: ['shepherd'],
    listen: '풀밭으로 가는 길을 살피러 나가려 해요. 양들은 제 음성을 알고 따라오지요(10:4). 제가 앞서 걸을 테니 뒤에서 함께 걸어 줄래요?',
    done: '풀밭 길이 좋아요. 양들은 앞서 가는 목자의 음성을 알고 따라와요(10:4). 같이 걸어 주어 고마워요.',
    steps: (X) => {
      const lead = (i) => ({
        hint: i ? '목자를 따라 풀밭 길 끝까지 걸어요' : '앞서 걷는 목자를 따라 풀밭 길로 가요', go: LEAD7[i], where: '양 우리 동쪽 풀밭 길',
        enter: () => X.walkNpc('shepherd', [LEAD7[i]], true),
        until: () => X.near(LEAD7[i], 2.8) && X.dn('shepherd', LEAD7[i]) < 3.2,
      });
      return [
        lead(0), lead(1),
        tellStep(X, 'shepherd', '목자', '목자를 따라 풀밭 길 걷기', '여기까지 따라와 주었군요. 앞서 가면 따라오는 것은 양만이 아니네요.', '잘 따라왔어요', '목자에게 말을 걸어요', '양 우리 동쪽 풀밭 길', null),
      ];
    },
  },

  // ---------- Z7 성전 뜰 · 제자: 기도 자리 둘레 쓸기 (2:16) ----------
  'temple-sweep': {
    who: 'disciple7', name: '제자', after: 'temple', title: '기도 자리 둘레 쓸기', again: 'day', where: '성전 뜰 · 장사판이 있던 자리',
    stat: 'prayer', verse: 'jn-2-16',
    listen: '이 자리는 그날 장사판을 치운 곳이에요. "내 아버지의 집으로 장사하는 집을 만들지 말라" 하셨지요(2:16). 기도하는 자리 둘레에 남은 것을 쓸어 줄래요?',
    done: '기도하는 자리가 깨끗해졌어요. 이곳은 아버지의 집이니까요(2:16). 고마워요.',
    steps: (X) => {
      const swept = new Set();
      const next = () => nearest(X, SWEEP7, swept);
      return [
        { hint: () => `기도 자리 둘레를 쓸어요 (E) · ${swept.size}/3`, go: () => next()?.[0], where: '성전 뜰 · 장사판이 있던 자리', place: 'jn_sweep', at: () => next()?.[0], r: 2.0,
          enter: () => X.rings(SWEEP7),
          act: () => {
            const n = next(); if (!n) return true;
            swept.add(n[1]); X.sfx('tap', 0.2, 0.8 + swept.size * 0.1); X.burst(n[0].x, X.me.y + 0.6, n[0].z);
            X.rings(SWEEP7.filter((p, i) => !swept.has(i)));
            return swept.size >= 3;
          } },
      ];
    },
  },

  // ---------- Z8 베데스다 · 병 나은 사람: 행각에 누운 사람 곁에 앉아 있기 (5:3, 5:5) ----------
  'sick-sit': {
    who: 'sick', name: '병 나은 사람', after: 'bethesda', title: '누운 사람 곁에 앉아 있기', again: 'day', where: '베데스다 못 · 동쪽 행각',
    stat: 'fellow', verse: 'jn-5-6',
    listen: '행각에는 아직 누워 있는 사람들이 있어요(5:3). 저도 삼십팔 년을 그렇게 누워 있었지요(5:5). 무엇을 해 주지 않아도 좋아요. 한 사람 곁에 잠시 앉아 있어 줄래요?',
    done: '곁에 앉아 있어 주어 고마워요. 그날 그분은 누운 저를 보셨어요(5:6).',
    steps: (X) => [
      { hint: '동쪽 행각, 누운 사람 곁에 앉아요 (J 앉기)', go: SIT8, where: '베데스다 못 · 동쪽 행각',
        until: (r, dt) => { r.t = X.sitting(SIT8, 1.8) ? (r.t || 0) + dt : 0; return r.t > 1; } },
      { hint: (r) => `누운 사람 곁에 조용히 앉아 있어요. 앉은 채로 · ${Math.max(0, Math.ceil(12 - (r.t || 0)))}초`, go: SIT8, where: '베데스다 못 · 동쪽 행각',
        until: (r, dt) => X.rested(r, dt, SIT8, 2.4, 12) },
    ],
  },

  // ---------- Z8 → Z7 · 병 나은 사람: 성전까지 함께 걸어가기 (5:14) ----------
  'sick-walk': {
    who: 'sick', name: '병 나은 사람', after: 'bethesda', title: '성전까지 함께 걷기', again: 'once', where: '베데스다 못 → 성전 뜰',
    stat: 'fellow', verse: 'jn-5-14', reset: ['sick'], follow: ['sick'],
    listen: '나은 뒤 저는 성전에서 그분을 만났어요(5:14). 이제 성전까지 두 발로 걸어가 보고 싶어요. 함께 걸어 줄래요?',
    done: '두 발로 성전까지 왔어요. 나은 뒤 성전에서 그분을 만났지요(5:14). 함께 걸어 주어 고마워요.',
    thanks: '그날 성전까지 함께 걸어 주어 고마웠어요.',
    steps: (X) => [walkWith(X, 'sick', TEMPLE_GO, '병 나은 사람과 함께 성전 뜰까지 걸어요', '베데스다 못 → 성전 뜰', '성전까지 오니 좋아요!')],
  },

  // ---------- Z9 실로암 · 눈 뜬 사람: 성전 문에서 못까지 함께 걷기 (9:7) ----------
  'siloam-walk': {
    who: 'blind', name: '눈 뜬 사람', after: 'siloam', title: '실로암 못까지 함께 걷기', again: 'once', where: '성전 남쪽 문 → 실로암 못',
    stat: 'witness', verse: 'jn-9-25', reset: ['blind'], follow: ['blind'],
    listen: '그날 저는 앞이 안 보이는 채로 못까지 걸어가 씻었고, 밝은 눈으로 돌아왔어요(9:7). 이제 같은 길을 눈으로 보며 걸어 보고 싶어요. 함께 걸어 줄래요?',
    done: '이 길을 눈으로 보며 걸으니 제가 아는 한 가지가 더 분명해요. 소경으로 있다가 지금 본다는 것이요(9:25). 고마워요.',
    thanks: '그 길을 함께 걸어 주어 고마웠어요.',
    steps: (X) => [walkWith(X, 'blind', POOL9_GO, '눈 뜬 사람과 함께 실로암 못까지 걸어요', '성전 남쪽 문 → 실로암 못', '이 길이 이렇게 환했군요!')],
  },

  // ---------- Z9 → Z7 · 눈 뜬 사람: 못에서 물 한 동이 길어다 주기 (9:7) ----------
  'siloam-water': {
    who: 'blind', name: '눈 뜬 사람', after: 'siloam', title: '못물 한 동이 길어다 주기', again: 'day', where: '실로암 못 → 성전 남쪽 문',
    stat: 'obey', verse: 'jn-9-7',
    listen: '실로암은 "보냄을 받았다"는 뜻이래요(9:7). 못에서 물 한 동이를 길어다 주겠어요? 그 물에 씻고 밝은 눈으로 돌아온 날을 기억하고 싶어요.',
    done: '맑은 물이네요. 그 물에 씻고 밝은 눈으로 돌아온 날이 떠올라요(9:7). 고마워요.',
    steps: (X) => [
      { hint: '실로암 못에서 물을 길어요 (E)', go: X.P.wash, where: '실로암 못 계단', place: 'jn_water', at: () => X.P.wash, r: 2.2,
        act: () => { X.carry('jar'); X.sfx('cup', 0.2, 0.8); X.splash(); } },
      tellStep(X, 'blind', '눈 뜬 사람', '못물 한 동이 길어다 주기', '벌써 길어 왔어요? 못물이 시원하네요.', '물을 가져왔어요', '길어 온 물을 눈 뜬 사람에게 가져가요', '성전 남쪽 문', null),
    ],
  },

  // ---------- Z10 윗동네 · 니고데모: 밤 지붕 등잔 켜 두기 (3:21) ----------
  'nico-lamp': {
    who: 'nico', name: '니고데모', after: 'nico', title: '지붕 등잔 켜 두기', again: 'day', where: '니고데모 집 지붕',
    stat: 'word', verse: 'jn-3-21',
    listen: '그날 밤 저는 지붕 위에서 말씀을 들었어요. "진리를 좇는 자는 빛으로 오나니"(3:21). 오늘 밤에도 지붕 위 등잔을 켜 두고 싶어요. 동쪽 바깥 계단으로 올라가 켜 주겠어요?',
    done: '지붕 위가 환해졌어요. 빛으로 오는 이에게는 이 불빛이 반갑겠지요(3:21). 고마워요.',
    steps: (X) => [
      { hint: '동쪽 바깥 계단으로 지붕에 올라 등잔을 켜요 (E)', go: X.P.lamp10, where: '니고데모 집 지붕 · 등잔 곁', place: 'jn_kindle', at: () => X.P.lamp10, r: 2.6,
        act: () => { X.sfx('orb', 0.2, 1.3); X.burst(X.P.lamp10.x, X.me.y + 1.0, X.P.lamp10.z); } },
    ],
  },

  // ---------- Z10 다락방 · 도마: 모일 자리에 떡과 물잔 차려 두기 (20:26) ----------
  'thomas-table': {
    who: 'thomas', name: '도마', after: 'thomas', title: '다락방 상 차려 두기', again: 'day', where: '다락방',
    stat: 'fellow', verse: 'jn-20-29',
    listen: '여드레 후에 제자들이 다시 집 안에 모였고 도마도 함께 있었어요(20:26). 오늘도 모일 사람들을 위해 다락방 상에 떡과 물잔을 놓아 주겠어요?',
    done: '상이 차려졌어요. 모이는 사람들에게 반가운 자리가 되겠어요. 보지 못하고 믿는 자들은 복되다고 하셨지요(20:29). 고마워요.',
    steps: (X) => tableSteps(X, TABLE10_FROM, TABLE10_AT, '다락방'),
  },

  // ---------- Z12 베다니 · 마르다: 마당 식탁 차리기 (12:2) ----------
  'martha-serve': {
    who: 'martha', name: '마르다', after: 'nard', title: '마당 식탁 차리기', again: 'day', where: '베다니 집 마당 식탁',
    stat: 'fellow', verse: 'jn-12-2',
    listen: '거기서 그분을 위해 잔치할 때 저는 일을 보았어요(12:2). 오늘도 마당 식탁 준비를 도와줄래요? 집 문 곁에서 떡과 물잔을 받아 식탁 양쪽 끝에 놓아 주세요.',
    done: '식탁이 다 차려졌어요. 그날도 이렇게 상을 차렸지요(12:2). 고마워요.',
    steps: (X) => tableSteps(X, TABLE12_FROM, TABLE12_AT, '베다니 집 마당'),
  },

  // ---------- Z12 베다니 · 마리아: 향유 냄새를 떠올리며 집 둘레 걷기 (12:3) ----------
  'mary-nard': {
    who: 'mary12', name: '마리아', after: 'nard', title: '집 둘레를 천천히 걷기', again: 'day', where: '베다니 집 둘레',
    stat: 'prayer', verse: 'jn-12-3',
    listen: '향유 냄새가 집에 가득했던 날이 자꾸 떠올라요(12:3). 집 둘레를 천천히 한 바퀴 걸으며 그 향기를 함께 떠올려 줄래요?',
    done: '집 둘레가 조용히 향기로워요. 그날 향유 냄새가 집에 가득했지요(12:3). 함께 걸어 주어 고마워요.',
    begin: (X) => X.fragrance(true),
    end: (X) => X.fragrance(false),
    steps: (X) => {
      const seen = new Set();
      return [
        { hint: () => `집 둘레를 천천히 걸어요. 빛나는 자리를 차례로 지나요 · ${seen.size}/3`, go: () => nearest(X, MARY12, seen)?.[0], where: '베다니 집 둘레',
          enter: () => X.rings(MARY12),
          until: () => {
            MARY12.forEach((p, i) => { if (!seen.has(i) && X.near(p, 1.8)) { seen.add(i); X.sfx('tap', 0.16, 0.9 + seen.size * 0.1); X.rings(MARY12.filter((q, j) => !seen.has(j))); } });
            return seen.size >= 3;
          } },
        tellStep(X, 'mary12', '마리아', '집 둘레를 천천히 걷기', '한 바퀴 돌았군요. 향기가 남아 있지요?', '한 바퀴 돌았어요', '마리아에게 돌아가 알려요', '베다니 집', null),
      ];
    },
  },

  // ---------- Z12 베다니 · 나사로: 무덤 길에서 마을 어귀까지 함께 걷기 (11:44) ----------
  'lazarus-walk': {
    who: 'lazarus', name: '나사로', after: 'lazarus', title: '마을 어귀까지 함께 걷기', again: 'once', where: '베다니 무덤 길 → 마을 어귀',
    stat: 'witness', verse: 'jn-11-44', reset: ['lazarus'], follow: ['lazarus'],
    listen: '그분이 "풀어 놓아 다니게 하라" 하셨지요(11:44). 이제 두 발로 마을 어귀까지 걸어 보고 싶어요. 무덤 쪽 길 입구에서 만나 함께 걸어 줄래요?',
    done: '두 발로 마을 어귀까지 왔어요. "풀어 놓아 다니게 하라" 하신 말씀이 떠올라요(11:44). 함께 걸어 주어 고마워요.',
    thanks: '그날 마을 어귀까지 함께 걸어 주어 고마웠어요.',
    begin: (X) => X.lazarusFree(true),
    end: (X) => X.lazarusFree(false),
    steps: (X) => [
      { hint: '무덤 쪽 길 입구에서 나사로를 만나요', go: TOMBRD12, where: '베다니 무덤 쪽 길 입구',
        enter: () => X.npcGo('lazarus', TOMBRD12),
        until: () => X.near(TOMBRD12, 2.6) && X.dn('lazarus', TOMBRD12) < 3.2 },
      walkWith(X, 'lazarus', GATE12, '나사로와 함께 마을 어귀까지 걸어요', '베다니 무덤 길 → 마을 어귀', '두 발로 걸으니 좋아요!'),
    ],
  },

  // ---------- Z4 디베랴 바닷가 · 베드로: 어린 양 셋 다시 먹이기 (21:15) ----------
  'peter-lambs': {
    who: 'peter', name: '시몬 베드로', after: 'morning', title: '어린 양 셋 먹이기', again: 'day', where: '디베랴 바닷가 풀밭',
    stat: 'obey', verse: 'jn-21-15',
    listen: '그분이 세 번 물으시고 세 번 맡기셨지요. "내 어린 양을 먹이라"(21:15). 바닷가 풀밭의 어린 양 셋에게 먹이를 한 번 더 주겠어요?',
    done: '어린 양들이 배불렀어요. 그날의 말씀이 다시 떠올라요. "내 양을 치라"(21:16). 고마워요.',
    begin: (X) => X.lambsReset(),
    end: (X) => X.lambsReset(),
    steps: (X) => [
      { hint: () => `바닷가의 어린 양을 먹여요 (E) · 남은 ${X.lambsLeft()}`, go: () => X.nextLamb(), where: '디베랴 바닷가 풀밭', place: 'jn_feed', at: () => X.nextLamb(), r: 2.2,
        act: () => X.feedLamb() },
      tellStep(X, 'peter', '시몬 베드로', '어린 양 셋 먹이기', '어린 양들이 잘 먹었네요. 그날 숯불 곁에서 들은 말씀이 생각나요.', '다 먹였어요', '베드로에게 알려요', '디베랴 바닷가', null),
    ],
  },
};
