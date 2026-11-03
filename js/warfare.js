// 영적 전쟁 훈련소 (2026-11): 전신갑주 길 입구 곁, 바울이 가르침 (딤후 2:3)
//   믿음의 선진들과 사도들이 실제로 겪은 시험(유혹·미혹·두려움·교만)을 그대로 맞닥뜨리고,
//   그들이 붙든 말씀(또는 그 시험을 이기는 말씀)을 세 구절 가운데 골라 이기는 연습
//   네 시험돌 앞 빛나는 자리에 서면 그 갈래의 시험 셋이 차례로 옴. 바울에게 가면 네 갈래를 섞은 실전 연습(다섯)
//   연습이므로 틀려도 넘어지지 않고, 왜 맞지 않는지 알려 준 뒤 다시 고름. 막히면 기도(X)하면 맞는 말씀이 떠오름
//   처음 이긴 시험돌마다 말씀·순종이 자라고, 네 돌을 다 이기면 바울이 선한 싸움의 말씀을 들려줌
import * as THREE from 'three';
import { WARFARE, floorY } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, earn } from './profile.js';
import { setOutfit } from './avatar.js';

// 시험의 네 갈래
export const CATS = [
  { id: 'tempt', name: '유혹', color: 0xe0905a, what: '눈과 몸의 욕심을 부추기는 유혹' },
  { id: 'lie', name: '미혹', color: 0x9a86d8, what: '참말처럼 꾸민 거짓(미혹)' },
  { id: 'fear', name: '두려움', color: 0x5a92d0, what: '겁을 주어 물러서게 하는 속삭임' },
  { id: 'pride', name: '교만', color: 0xd8b04a, what: '나를 높이게 하는 교만' },
];
const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

// 시험 장면: 갈래, 사람, 성경, 그때 상황, 어둠의 속삭임, 이기는 말씀(개역한글), 틀린 보기 둘, 어떻게 이겼는지(또는 넘어진 사람에게서 배움)
const S = [
  // ----- 유혹 -----
  { id: 't1', c: 'tempt', who: '요셉', at: '창세기 39장', scene: '애굽 보디발의 집. 주인의 아내가 날마다 요셉에게 함께 눕자고 졸라요.',
    lie: '아무도 보지 않아. 주인의 아내가 원하는데 잠깐이면 어때?',
    a: ['그런즉 내가 어찌 이 큰 악을 행하여 하나님께 득죄하리이까', '창세기 39:9'], no: ['f5', 'p3'],
    win: '요셉은 사람이 아니라 하나님 앞에서 살았어요. 여인이 옷을 붙잡자 옷을 버려두고 도망했어요(창 39:12). 유혹은 버티기보다 피하는 거예요.' },
  { id: 't2', c: 'tempt', who: '다윗', at: '사무엘상 24장', scene: '다윗을 죽이려 쫓던 사울 왕이 홀로 굴에 들어왔어요. 부하들이 지금이 하나님이 주신 기회라고 해요.',
    lie: '하나님이 원수를 네 손에 넘기셨어. 지금 치면 바로 왕이 될 수 있어.',
    a: ['내가 손을 들어 여호와의 기름 부음을 받은 내 주를 치는 것은 여호와의 금하시는 것이니', '사무엘상 24:6'], no: ['l6', 'f6'],
    win: '다윗은 사울의 겉옷자락만 가만히 베고 해치지 않았어요(삼상 24:4). 지름길 대신 하나님의 때를 기다렸어요.' },
  { id: 't3', c: 'tempt', who: '아간', at: '여호수아 7장', scene: '여리고 성이 무너진 뒤, 하나님께 바친 물건 가운데 아름다운 외투와 은과 금덩이가 눈에 들어와요.',
    lie: '저 외투와 금덩이 좀 봐. 장막 땅속에 묻어 두면 아무도 몰라.',
    a: ['돈을 사랑치 말고 있는 바를 족한 줄로 알라', '히브리서 13:5'], no: ['f4', 'l6'],
    win: '아간은 "보고 탐내어 취하였나이다" 하고 무너졌어요(수 7:21). 우리는 하나님이 주신 것으로 족한 줄 알아 이겨요.' },
  { id: 't4', c: 'tempt', who: '데마', at: '디모데후서 4장', scene: '감옥에 갇힌 바울 곁에서 함께 일하던 데마. 고생이 길어지자 마음이 흔들려요.',
    lie: '바울 곁은 고생뿐이야. 세상에는 재미있는 게 훨씬 많아.',
    a: ['이 세상이나 세상에 있는 것들을 사랑치 말라 누구든지 세상을 사랑하면 아버지의 사랑이 그 속에 있지 아니하니', '요한일서 2:15'], no: ['p1', 'f5'],
    win: '데마는 이 세상을 사랑하여 바울을 버리고 떠났어요(딤후 4:10). 이 말씀을 붙들면 끝까지 주님 곁에 남을 수 있어요.' },
  { id: 't5', c: 'tempt', who: '에서', at: '창세기 25장', scene: '사냥에서 돌아와 몹시 배고픈 에서. 동생 야곱이 팥죽을 끓이고 있어요.',
    lie: '배고파 죽겠는데 장자의 명분이 무슨 소용이야. 지금은 팥죽 한 그릇이 더 중요해.',
    a: ['너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라', '마태복음 6:33'], no: ['f1', 'l4'],
    win: '에서는 한 그릇 식물에 장자의 명분을 팔았어요(히 12:16). 지금 당장보다 하나님의 나라를 먼저 구해요.' },
  { id: 't6', c: 'tempt', who: '다니엘', at: '다니엘 1장', scene: '바벨론 왕궁에 끌려간 소년 다니엘. 왕이 먹는 진미와 포도주를 날마다 내려 줘요.',
    lie: '다들 먹잖아. 여기는 바벨론이야, 너만 유난 떨 필요 없어.',
    a: ['너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라', '로마서 12:2'], no: ['f4', 'p2'],
    win: '다니엘은 뜻을 정하여 자기를 더럽히지 않았어요(단 1:8). 열흘 뒤 채식을 한 다니엘과 친구들이 더 건강해 보였어요(단 1:15).' },
  // ----- 미혹 -----
  { id: 'l1', c: 'lie', who: '하와', at: '창세기 3장', scene: '에덴동산. 뱀이 하와에게 다가와 먹지 말라 하신 나무의 열매를 가리켜요.',
    lie: '정말 먹으면 죽을까? 결코 죽지 않아. 하나님이 너를 막고 있는 거야.',
    a: ['하나님은 인생이 아니시니 식언치 않으시고 인자가 아니시니 후회가 없으시도다', '민수기 23:19'], no: ['t1', 'p3'],
    win: '하와는 뱀의 말을 듣고 넘어졌지만, 하나님의 말씀은 한 번도 거짓이 없어요. 의심이 들 때 하나님이 하신 말씀으로 돌아가요.' },
  { id: 'l2', c: 'lie', who: '베드로', at: '마태복음 16장', scene: '예수님이 예루살렘에서 고난받고 죽으실 것을 말씀하시자, 베드로가 주님을 붙들고 말려요.',
    lie: '십자가는 안 돼. 고난 없이 가는 쉬운 길이 있어.',
    a: ['아무든지 나를 따라 오려거든 자기를 부인하고 자기 십자가를 지고 나를 좇을 것이니라', '마태복음 16:24'], no: ['t3', 'f6'],
    win: '예수님은 "사단아 내 뒤로 물러 가라" 하시며 사람의 일이 아니라 하나님의 일을 생각하셨어요(마 16:23).' },
  { id: 'l3', c: 'lie', who: '갈라디아 교인들', at: '갈라디아서 1장', scene: '바울이 떠난 뒤 갈라디아 교회에 새 선생들이 와서 다른 복음을 전해요.',
    lie: '믿음만으로는 부족해. 율법을 더 지켜야 진짜 구원받아.',
    a: ['너희가 그 은혜를 인하여 믿음으로 말미암아 구원을 얻었나니 이것이 너희에게서 난 것이 아니요 하나님의 선물이라', '에베소서 2:8'], no: ['t5', 'f4'],
    win: '바울은 다른 복음 좇는 것을 이상히 여긴다고 편지했어요(갈 1:6). 구원은 내가 쌓는 것이 아니라 하나님의 선물이에요.' },
  { id: 'l4', c: 'lie', who: '베뢰아 사람들', at: '사도행전 17장', scene: '베뢰아에 바울과 실라가 와서 새로운 가르침을 전해요.',
    lie: '듣기 좋은 말이면 다 맞아. 성경을 펴서 확인할 필요 없어.',
    a: ['사랑하는 자들아 영을 다 믿지 말고 오직 영들이 하나님께 속하였나 시험하라 많은 거짓 선지자가 세상에 나왔음이니라', '요한일서 4:1'], no: ['t3', 'f2'],
    win: '베뢰아 사람들은 간절한 마음으로 말씀을 받고 이것이 그러한가 하여 날마다 성경을 상고했어요(행 17:11). 어떤 가르침이든 말씀으로 확인해요.' },
  { id: 'l5', c: 'lie', who: '아나니아', at: '사도행전 5장', scene: '밭을 판 아나니아. 값의 얼마를 감추고, 전부 드린 척하려 해요.',
    lie: '전부 드린 척하면 다들 칭찬할 거야. 조금 감춰도 아무도 몰라.',
    a: ['스스로 속이지 말라 하나님은 만홀히 여김을 받지 아니하시나니 사람이 무엇으로 심든지 그대로 거두리라', '갈라디아서 6:7'], no: ['f1', 'f4'],
    win: '베드로는 "어찌하여 사단이 네 마음에 가득하여 네가 성령을 속이고" 하고 물었어요(행 5:3). 하나님은 속일 수 없어요. 정직하게 서요.' },
  { id: 'l6', c: 'lie', who: '도마', at: '요한복음 20장', scene: '다른 제자들이 부활하신 주님을 보았다고 하는데, 그 자리에 없던 도마.',
    lie: '눈으로 보지 않았으면 믿지 마. 죽은 사람이 살아난다니 말도 안 돼.',
    a: ['너는 나를 본 고로 믿느냐 보지못하고 믿는 자들은 복되도다', '요한복음 20:29'], no: ['t2', 'p4'],
    win: '여드레 뒤 주님이 오셔서 도마에게 손을 보이셨고, 도마는 "나의 주시며 나의 하나님이시니이다" 고백했어요(요 20:28).' },
  // ----- 두려움 -----
  { id: 'f1', c: 'fear', who: '다니엘의 세 친구', at: '다니엘 3장', scene: '느부갓네살 왕이 금 신상에게 절하지 않으면 극렬히 타는 풀무에 던지겠다고 해요.',
    lie: '절하지 않으면 지금 당장 풀무불이야. 딱 한 번만 절해.',
    a: ['그리 아니하실찌라도 왕이여 우리가 왕의 신들을 섬기지도 아니하고 왕의 세우신 금 신상에게 절하지도 아니할 줄을 아옵소서', '다니엘 3:18'], no: ['t3', 'l4'],
    win: '세 친구는 풀무에 던져졌지만 넷째 사람이 함께 다녔고, 머리털도 그슬리지 않았어요(단 3:25, 27).' },
  { id: 'f2', c: 'fear', who: '엘리야', at: '열왕기상 19장', scene: '갈멜산의 큰 승리 뒤, 이세벨이 엘리야를 죽이겠다고 해요. 엘리야는 광야 로뎀나무 아래 쓰러졌어요.',
    lie: '이제 끝났어. 아무도 너를 돕지 않아. 그만 포기해.',
    a: ['일어나서 먹으라 네가 길을 이기지 못할까 하노라', '열왕기상 19:7'], no: ['t2', 'l5'],
    win: '천사가 어루만지며 떡과 물을 주었고, 엘리야는 그 힘으로 사십 주야를 걸어 하나님의 산 호렙에 이르렀어요(왕상 19:8).' },
  { id: 'f3', c: 'fear', who: '베드로와 요한', at: '사도행전 4장', scene: '공회가 두 사도를 불러 다시는 예수의 이름으로 말하지 말라고 위협해요.',
    lie: '또 예수 이야기를 하면 감옥이야. 이제 입을 다무는 게 좋아.',
    a: ['우리는 보고 들은 것을 말하지 아니할 수 없다', '사도행전 4:20'], no: ['t3', 'p2'],
    win: '사도들은 함께 모여 기도했고, 무리가 다 성령이 충만하여 담대히 하나님의 말씀을 전했어요(행 4:31).' },
  { id: 'f4', c: 'fear', who: '다윗', at: '사무엘상 17장', scene: '거인 골리앗이 사십 일 동안 이스라엘 군대를 조롱해요. 소년 다윗은 물매와 매끄러운 돌 다섯을 들었어요.',
    lie: '저 거인 좀 봐. 너는 작은 아이일 뿐이야.',
    a: ['너는 칼과 창과 단창으로 내게 오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 가노라', '사무엘상 17:45'], no: ['l5', 't6'],
    win: '다윗은 여호와의 이름으로 나아가 돌 하나로 골리앗을 이겼어요. "전쟁은 여호와께 속한 것"이에요(삼상 17:47).' },
  { id: 'f5', c: 'fear', who: '기드온', at: '사사기 6장', scene: '미디안 사람들이 곡식을 다 빼앗아 가요. 기드온은 숨어서 포도주 틀에서 밀을 타작하고 있어요.',
    lie: '네 집은 제일 약하고 너는 그중에 제일 작은 자야. 네가 뭘 하겠어?',
    a: ['여호와께서 그에게 이르시되 내가 반드시 너와 함께 하리니 네가 미디안 사람 치기를 한 사람을 치듯하리라', '사사기 6:16'], no: ['t4', 'l5'],
    win: '기드온은 삼백 명으로 미디안을 이겼어요(삿 7:7). 하나님이 함께하시면 약함은 문제가 되지 않아요.' },
  { id: 'f6', c: 'fear', who: '예레미야', at: '예레미야 1장', scene: '하나님이 어린 예레미야를 열방의 선지자로 부르셨어요.',
    lie: '너는 아이야. 말할 줄도 모르는데 어떻게 하겠어?',
    a: ['너는 그들을 인하여 두려워 말라 내가 너와 함께하여 너를 구원하리라 나 여호와의 말이니라', '예레미야 1:8'], no: ['t1', 'l4'],
    win: '하나님은 손을 내밀어 예레미야의 입에 대시고 "내가 내 말을 네 입에 두었노라" 하셨어요(렘 1:9).' },
  // ----- 교만 -----
  { id: 'p1', c: 'pride', who: '느부갓네살', at: '다니엘 4장', scene: '바벨론 왕궁 위를 거닐며 큰 도성을 내려다보는 느부갓네살 왕.',
    lie: '이 큰 바벨론은 다 네 능력과 권세로 세운 거야. 네가 최고야.',
    a: ['네게 있는 것 중에 받지 아니한 것이 무엇이뇨 네가 받았은즉 어찌하여 받지 아니한 것 같이 자랑하느뇨', '고린도전서 4:7'], no: ['f2', 'l6'],
    win: '왕은 낮아진 뒤 하늘의 왕을 찬양하며 "교만하게 행하는 자를 그가 능히 낮추심이니라" 고백했어요(단 4:37).' },
  { id: 'p2', c: 'pride', who: '웃시야', at: '역대하 26장', scene: '하나님의 도우심으로 강해진 웃시야 왕. 그 이름이 멀리까지 퍼졌어요.',
    lie: '이제 너는 강해. 제사장만 하는 분향도 네가 직접 해도 돼.',
    a: ['교만은 패망의 선봉이요 거만한 마음은 넘어짐의 앞잡이니라', '잠언 16:18'], no: ['f6', 'l6'],
    win: '웃시야는 강성해지자 교만하여 성전에서 분향하려다 문둥병이 발했어요(대하 26:16, 19). 강해질수록 더 낮아져요.' },
  { id: 'p3', c: 'pride', who: '열두 제자', at: '누가복음 22장', scene: '마지막 만찬 자리. 제자들 사이에 누가 크냐 하는 다툼이 났어요.',
    lie: '네가 제자들 중에 제일 크지. 다른 사람보다 높아져야 해.',
    a: ['너희는 그렇지 않을찌니 너희 중에 큰 자는 젊은 자와 같고 두목은 섬기는 자와 같을찌니라', '누가복음 22:26'], no: ['f2', 't3'],
    win: '예수님은 "나는 섬기는 자로 너희 중에 있노라" 하셨어요(눅 22:27). 큰 사람은 섬기는 사람이에요.' },
  { id: 'p4', c: 'pride', who: '바리새인과 세리', at: '누가복음 18장', scene: '성전에 기도하러 올라간 두 사람. 바리새인이 멀리 선 세리를 흘끗 봐요.',
    lie: '저 사람보다 네가 훨씬 낫잖아. 금식도 하고 십일조도 하잖아.',
    a: ['무릇 자기를 높이는 자는 낮아지고 자기를 낮추는 자는 높아지리라', '누가복음 18:14'], no: ['f5', 'l4'],
    win: '가슴을 치며 "하나님이여 불쌍히 여기옵소서 나는 죄인이로소이다" 한 세리가 의롭다 하심을 받았어요(눅 18:13-14).' },
  { id: 'p5', c: 'pride', who: '바울', at: '고린도후서 12장', scene: '셋째 하늘에 이끌려 가 큰 계시를 받은 바울. 그런데 몸에 가시가 있어요. 제 이야기예요.',
    lie: '너는 누구보다 특별한 것을 보았어. 마음껏 자랑해도 돼.',
    a: ['내 은혜가 네게 족하도다 이는 내 능력이 약한데서 온전하여짐이라', '고린도후서 12:9'], no: ['t1', 'f1'],
    win: '저는 오히려 제 약한 것들을 자랑하기로 했어요. 그리스도의 능력이 제게 머물게 하려고요(고후 12:9).' },
  { id: 'p6', c: 'pride', who: '베드로', at: '마태복음 26장', scene: '마지막 만찬 뒤 감람산. 예수님이 "오늘 밤에 너희가 다 나를 버리리라" 하셨어요.',
    lie: '다른 사람은 몰라도 너는 절대 넘어지지 않아. 너는 강하잖아.',
    a: ['그런즉 선 줄로 생각하는 자는 넘어질까 조심하라', '고린도전서 10:12'], no: ['f3', 't5'],
    win: '베드로는 그 밤 세 번 주님을 부인하고 밖에 나가 심히 통곡했어요(마 26:75). 그래도 주님은 그를 다시 세우셨어요(요 21:15).' },
];
const BY = Object.fromEntries(S.map((s) => [s.id, s]));

VERSES['wf-soldier'] = ['네가 그리스도 예수의 좋은 군사로 나와 함께 고난을 받을찌니', '디모데후서 2:3'];
VERSES['wf-resist'] = ['그런즉 너희는 하나님께 순복할찌어다 마귀를 대적하라 그리하면 너희를 피하리라', '야고보서 4:7'];
VERSES['wf-fight'] = ['내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니', '디모데후서 4:7'];
for (const s of S) VERSES['wf-' + s.id] = s.a;

const ROUND = 3, REAL = 5;
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [r[i], r[j]] = [r[j], r[i]]; } return r; };
const jo = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

export function initWarfare(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange } = K;
  const Z = WARFARE.zone;
  const G = (p) => floorY(p.x, p.z);
  const M = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const rec = () => { profile.warfare = profile.warfare || {}; return profile.warfare; };
  const won = (cat) => (rec()[cat] | 0) > 0;
  const label = (text, size = 0.9, dark = false) => {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = '700 32px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = Math.min(300, g.measureText(text).width + 44);
    g.fillStyle = dark ? 'rgba(48,36,62,0.9)' : 'rgba(255,250,238,0.92)'; g.beginPath(); g.roundRect(160 - w / 2, 6, w, 52, 26); g.fill();
    g.fillStyle = dark ? '#f1e4ff' : '#6b4c32'; g.fillText(text, 160, 33);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(size * 2.5, size * 0.5, 1);
    return sp;
  };
  const glowRing = (r, color) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; return m;
  };

  // ---------- 훈련소 마당: 흙바닥, 네 시험돌, 깃발 ----------
  {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 48), M(0xcdb88e, 1));
    floor.rotation.x = -Math.PI / 2; floor.scale.set(Z.w / 2 + 1, Z.d / 2 + 1, 1);
    floor.rotation.z = -Z.rot; floor.position.set(Z.x, G(Z) + 0.03, Z.z); floor.receiveShadow = true; scene.add(floor);
    // 입구 팻말
    const sign = label('영적 전쟁 훈련소', 1.1, true); const p = Z.at(0, -6.4); sign.position.set(p.x, G(p) + 3.2, p.z); scene.add(sign);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), M(0x6a5038)); post.position.set(p.x, G(p) + 1.4, p.z); post.castShadow = true; scene.add(post);
  }
  const stones = WARFARE.stones.map((p, i) => {
    const c = CATS[i];
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), M(0x8a8478, 0.95)); rock.scale.set(1, 0.85, 0.8); rock.position.y = 0.55; g.add(rock);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 6, 24), M(c.color, 0.5, { emissive: c.color, emissiveIntensity: 0.25 })); band.rotation.x = Math.PI / 2; band.position.y = 0.6; g.add(band);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), M(c.color, 0.9, { side: THREE.DoubleSide })); flag.position.set(0.35, 2.05, 0); g.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 6), M(0x6a5038)); pole.position.y = 1.15; g.add(pole);
    const todo = label(c.name, 0.75), done = label('✓ ' + c.name, 0.75);
    for (const sp of [todo, done]) { sp.position.y = 2.8; g.add(sp); }
    const ring = glowRing(1.0, c.color); ring.position.set(p.stand.x - p.x, 0.05, p.stand.z - p.z); g.add(ring);
    g.position.set(p.x, G(p), p.z); g.rotation.y = Z.rot; scene.add(g);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return { g, ring, flag, todo, done, p, c };
  });

  // ---------- 바울: 그리스도 예수의 좋은 군사 (갑주를 입음) ----------
  const paul = makeChar({ hoodie: 0x7a5a8a, hair: 0x4a3a30, bag: 0x7a5a8a, style: 0, pants: 0x5a5048 }, WARFARE.npc.x, WARFARE.npc.z);
  { const bag = paul.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false; }
  try { setOutfit(paul.av, 'armor'); } catch (e) { /* 갑주를 못 입혀도 그대로 */ }
  paul.tag = nameTag('바울'); paul.av.add(paul.tag);
  paul.home = { ...WARFARE.npc }; paul.face0 = Math.atan2(Z.x - paul.x, Z.z - paul.z); paul.face = paul.face0;
  npcs.push(paul);
  const paulSign = label('영적 전쟁 훈련', 0.75); paulSign.position.y = 2.75; paulSign.renderOrder = 5; paul.av.add(paulSign);

  // ---------- 어둠의 그림자 (시험이 오면 돌 위로 떠오름) ----------
  const shade = new THREE.Group();
  const parts = [];
  for (let q = 0; q < 5; q++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5 - q * 0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0x1c1626, transparent: true, opacity: 0.55, depthWrite: false })); shade.add(m); parts.push(m); }
  for (let q = 0; q < 3; q++) { const s = fxSprite('circle_05', 0x2a2038, 2.4); s.material.blending = THREE.NormalBlending; s.material.opacity = 0.45; s.position.y = 1 + q * 0.5; shade.add(s); parts.push(s); }
  shade.visible = false; scene.add(shade);
  let fade = -1;

  // ---------- 바울과 말하기 ----------
  const talk = document.createElement('div');
  talk.className = 'npcb'; talk.id = 'wtalk'; talk.hidden = true;
  talk.innerHTML = '<div class="who"><b>바울</b><span class="n">영적 전쟁 훈련소</span></div><p class="say"></p><div class="guide"><button data-g="how">하는 방법</button><button data-g="prog">진행 보기</button></div><div class="row"><button class="later">나중에</button><button class="next">실전 연습</button></div>';
  document.body.appendChild(talk);
  const $t = (s) => talk.querySelector(s);
  let offer = false, closedFor = false;
  talk.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  talk.addEventListener('click', (e) => {
    e.stopPropagation();
    const g = e.target.closest('[data-g]');
    if (g) return guide(g.dataset.g);
    if (e.target.classList.contains('later')) { closedFor = true; hideTalk(); }
    if (e.target.classList.contains('next')) { hideTalk(); closedFor = true; start('real'); }
  });
  const hideTalk = () => { talk.hidden = true; offer = false; if (!run) document.body.classList.remove('talking'); };
  const allWon = () => CATS.every((c) => won(c.id));
  function offerTalk() {
    offer = true;
    const first = !CATS.some((c) => won(c.id)) && !rec().met;
    rec().met = 1;
    const say = first
      ? '저는 바울이에요. 우리의 싸움은 혈과 육이 아니라 어둠의 속삭임과의 싸움이에요. 믿음의 선진들과 사도들도 유혹, 미혹, 두려움, 교만의 시험을 겪었어요. 네 시험돌 앞 빛나는 자리에 서면 그들이 겪은 시험이 다가와요. 그들처럼 말씀으로 이겨 봐요.'
      : allWon() ? `${profile.name || '친구'}님은 네 시험을 다 이겨 봤어요. 실전 연습에서는 네 갈래가 섞여서 다섯 번 와요. 어떤 속삭임인지 먼저 알아채는 게 싸움의 반이에요.`
        : `다시 왔군요! 아직 이기지 않은 시험돌: ${CATS.filter((c) => !won(c.id)).map((c) => c.name).join(', ')}. 시험돌 앞에 서거나, 섞어서 하는 실전 연습을 해 봐요.`;
    $t('.say').textContent = say;
    const v = document.createElement('small'); v.textContent = `${VERSES['wf-soldier'][0]} (${VERSES['wf-soldier'][1]})`; $t('.say').append(v);
    talk.hidden = false; document.body.classList.add('talking');
  }
  function guide(kind) {
    if (kind === 'how') {
      $t('.say').textContent = `네 시험돌(유혹·미혹·두려움·교만) 앞 빛나는 자리에 서면 성경 속 인물이 겪은 시험이 ${ROUND}번 와요. 어둠의 속삭임을 듣고, 세 말씀 가운데 그 속삭임을 이기는 말씀을 골라요 (1·2·3). 막히면 기도(X 또는 기도 단추)하면 맞는 말씀이 떠올라요. 연습이라 틀려도 넘어지지 않고 다시 고를 수 있어요. 처음 이긴 돌마다 말씀 +3, 순종 +2, 걸음 +5, 2 데나리온을 받아요.`;
    } else {
      const R = rec();
      $t('.say').textContent = CATS.map((c) => `${c.name} ${won(c.id) ? `✓ (${R[c.id]}번 이김)` : '아직'}`).join(' · ') + ` · 실전 ${R.real | 0}번 이김` + (allWon() ? '. 네 시험을 다 이겼어요!' : '.');
    }
  }

  // ---------- 시험 창 ----------
  const box = document.createElement('div');
  box.className = 'npcb trial'; box.id = 'wtrial'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="scene"></p><p class="say"></p><div class="opts"></div><p class="why" hidden></p><div class="row"><button class="later">물러나기</button><button class="next" hidden>다음 시험</button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  let run = null, opts = [];
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = e.target.closest('.opt');
    if (o) return choose(Number(o.dataset.i));
    if (e.target.classList.contains('later')) stop('물러났어요. 준비되면 다시 시험돌 앞에 서요');
    if (e.target.classList.contains('next')) next();
  });
  addEventListener('keydown', (e) => {
    if (!run || box.hidden) return;
    const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
    if (m && !run.ok) { e.stopPropagation(); e.preventDefault(); choose(Number(m[1]) - 1); }
    else if ((e.code === 'Enter' || e.code === 'Space') && run.ok) { e.stopPropagation(); e.preventDefault(); next(); }
    else if (e.code === 'KeyX') hint();
  }, true);

  function start(kind) {
    const pool = kind === 'real' ? shuffle(S).slice(0, REAL) : shuffle(S.filter((s) => s.c === kind)).slice(0, ROUND);
    const at = kind === 'real' ? WARFARE.center : stones[CATS.findIndex((c) => c.id === kind)].p;
    run = { kind, list: pool, i: 0, miss: 0, at, ok: false };
    me.path = []; me.task = null; if (me.state === 'walk') me.state = 'idle';
    if (kind === 'real') { document.body.classList.add('bigtrial'); sfx('impact/impactSoft_heavy_000', 0.3, 0.4); }
    show();
  }
  function show() {
    const s = run.list[run.i], c = CAT[s.c];
    run.ok = false;
    // 그림자: 시험돌 위(실전은 가운데)
    const p = run.at;
    shade.position.set(p.x, G(p) + (run.kind === 'real' ? 0.2 : 0.9), p.z); shade.visible = true; fade = -1;
    shade.scale.setScalar(run.kind === 'real' ? 1.5 : 1);
    parts.forEach((m) => { m.material.opacity = m.isSprite ? 0.45 : 0.55; });
    me.face = Math.atan2(p.x - me.x, p.z - me.z);
    $('.who b').textContent = `${c.name}의 시험 · ${s.who}`;
    $('.n').textContent = `${run.kind === 'real' ? '실전 연습' : c.name + ' 시험돌'} · ${run.i + 1} / ${run.list.length}`;
    $('.scene').textContent = `${s.scene} (${s.at})`;
    $('.say').textContent = `"${s.lie}"`;
    const sm = document.createElement('small'); sm.textContent = run.kind === 'real' ? '어떤 속삭임인지 알아채고, 이기는 말씀을 골라요 (1·2·3, 막히면 X 기도)' : `${s.who}${jo(s.who, '이', '가')} 붙든 말씀은? (1·2·3, 막히면 X 기도)`; $('.say').append(sm);
    opts = shuffle([s.id, ...s.no]);
    $('.opts').innerHTML = opts.map((k, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${BY[k].a[0]} <em>${BY[k].a[1]}</em></span></button>`).join('');
    $('.why').hidden = true; $('.next').hidden = true;
    box.hidden = false; box.classList.remove('ok');
    document.body.classList.add('talking', 'trialing');
    sfx('impact/impactSoft_heavy_000', 0.18, 0.55);
  }
  function choose(i) {
    if (!run || run.ok || opts[i] == null) return;
    const s = run.list[run.i], c = CAT[s.c];
    const b = $(`.opt[data-i="${i}"]`);
    if (opts[i] === s.id) {
      run.ok = true;
      box.classList.add('ok'); b?.classList.add('hint');
      $('.why').hidden = false; $('.why').textContent = `✓ ${s.win}`;
      $('.next').hidden = false; $('.next').textContent = run.i + 1 < run.list.length ? '다음 시험' : '마치기';
      fade = 0; sfx('orb', 0.3, 1.2); burst(shade.position.x, shade.position.y + 1, shade.position.z);
      return;
    }
    run.miss++;
    if (b) { b.classList.add('no'); b.disabled = true; }
    const other = CAT[BY[opts[i]].c];
    $('.why').hidden = false;
    $('.why').textContent = other.id === c.id
      ? '그 말씀도 귀하지만 이 장면에 꼭 맞는 말씀은 아니에요. 다시 골라 봐요.'
      : `그 말씀은 ${other.name}${jo(other.name, '을', '를')} 이길 때 붙드는 말씀이에요. 지금 속삭임은 ${c.what}이에요. 다시 골라 봐요.`;
    sfx('impact/impactSoft_medium_000', 0.22, 0.7);
  }
  function hint() {
    if (!run || run.ok) return;
    const i = opts.indexOf(run.list[run.i].id);
    $(`.opt[data-i="${i}"]`)?.classList.add('hint');
    toast('기도하니 마음에 떠오르는 말씀이 있어요', 3);
  }
  function next() {
    if (!run || !run.ok) return;
    run.i++;
    if (run.i < run.list.length) { show(); return; }
    finish();
  }
  function close() {
    box.hidden = true; shade.visible = false;
    document.body.classList.remove('talking', 'trialing', 'bigtrial');
  }
  function stop(say) { if (!run) return; const k = run.kind; run = null; close(); left = k; if (say) toast(say, 3); }
  let left = null; // 물러난 시험돌 (자리에서 벗어나야 다시 시작)
  function finish() {
    const R = rec(), kind = run.kind, miss = run.miss, at = run.at;
    const first = !(R[kind] | 0);
    R[kind] = (R[kind] | 0) + 1;
    run = null; close(); left = kind;
    for (let q = 0; q < 10; q++) setTimeout(() => burst(at.x + (Math.random() - 0.5) * 3, G(at) + 0.6 + Math.random() * 2, at.z + (Math.random() - 0.5) * 3), q * 90);
    sfx('orb', 0.32, 0.8);
    const clean = miss ? '' : ' 한 번도 틀리지 않았어요!';
    if (kind === 'real') {
      if (first) { addStat(profile, 'word', 5); addStat(profile, 'obey', 3); earn(profile, 4); addSteps(profile, 8); toast(`실전 연습을 이겼어요!${clean} (말씀 +5, 순종 +3, 걸음 +8, 4 데나리온)`, 6); }
      else { addSteps(profile, 3); earn(profile, 1); toast(`실전 연습을 다시 이겼어요.${clean} (걸음 +3, 1 데나리온)`, 5); }
      showVerse('wf-resist', { cooldown: 0, title: '마귀를 대적하라' });
    } else {
      const c = CAT[kind];
      if (first) { addStat(profile, 'word', 3); addStat(profile, 'obey', 2); earn(profile, 2); addSteps(profile, 5); toast(`${c.name}의 시험돌을 이겼어요!${clean} (말씀 +3, 순종 +2, 걸음 +5, 2 데나리온)`, 6); }
      else { addSteps(profile, 1); toast(`${c.name}의 시험을 다시 이겼어요.${clean} (걸음 +1)`, 4); }
      if (first && allWon()) {
        earn(profile, 5); addStat(profile, 'word', 5);
        setTimeout(() => { showVerse('wf-fight', { cooldown: 0, title: '네 시험을 다 이겼어요' }); toast('바울: 유혹·미혹·두려움·교만을 모두 말씀으로 이겼군요! 이제 실전 연습도 해 봐요 (말씀 +5, 5 데나리온)', 7); paul.action = 'wave'; setTimeout(() => { paul.action = null; }, 2400); }, 2600);
      } else showVerse('wf-resist', { cooldown: 0, title: '말씀으로 이겼어요' });
    }
    save(); onChange?.();
  }

  // ---------- 기도 단추 (main.js pressAction) ----------
  function onPress(name) { if (run && name === 'pray') hint(); }

  // ---------- 매 프레임 ----------
  let called = false;
  function step(dt, t) {
    const dz = Math.hypot(me.x - Z.x, me.z - Z.z);
    const vis = dz < 80;
    for (const s of stones) {
      s.g.visible = vis; if (!vis) continue;
      const w = won(s.c.id);
      s.todo.visible = !w; s.done.visible = w;
      s.flag.rotation.y = Math.sin(t * 2 + s.p.x) * 0.25;
      s.ring.material.opacity = run ? 0 : 0.35 + Math.sin(t * 3 + s.p.z) * 0.2;
    }
    // 그림자
    if (shade.visible) {
      if (fade >= 0) {
        fade += dt; const k = Math.max(0, 1 - fade / 1.0);
        parts.forEach((m) => { m.material.opacity = (m.isSprite ? 0.45 : 0.55) * k; });
        if (k <= 0) { shade.visible = false; fade = -1; }
      } else parts.forEach((m, q) => { if (m.isMesh) m.position.set(Math.sin(t * (1.1 + q * 0.3) + q) * 0.4, 0.8 + q * 0.3 + Math.sin(t * 2 + q) * 0.12, Math.cos(t * (0.9 + q * 0.25) + q * 2) * 0.4); else m.material.rotation = t * 0.3 * (q % 2 ? 1 : -1); });
    }
    // 바울: 가까이 오면 나를 봄, 팻말은 멀리서만
    const dp = Math.hypot(me.x - paul.x, me.z - paul.z);
    if (paul.state !== 'walk') paul.face = dp < 8 ? Math.atan2(me.x - paul.x, me.z - paul.z) : paul.face0;
    paulSign.visible = dp > 4.5;
    if (run) {
      if (Math.hypot(me.x - run.at.x, me.z - run.at.z) > (run.kind === 'real' ? 12 : 7)) stop('시험 자리에서 멀어져 물러났어요');
      return;
    }
    // 들어서면 바울이 부름
    if (dz > 26) called = false;
    else if (!called && dz < 16 && dp > 4.5 && me.state === 'walk' && !busy()) {
      called = true; paul.action = 'wave'; setTimeout(() => { if (paul.action === 'wave') paul.action = null; }, 2400);
      toast(`바울: 영적 전쟁 훈련소에 온 걸 환영해요! 믿음의 선진들이 겪은 시험을 말씀으로 이기는 연습을 해요. 제 곁으로 오세요`, 5);
    }
    if (busy()) { if (offer) hideTalk(); return; }
    // 바울 곁
    if (dp < 3.6) { if (!offer && !closedFor) offerTalk(); } else { closedFor = false; if (offer) hideTalk(); }
    // 시험돌 앞 빛나는 자리
    let at = null;
    for (const s of stones) if (Math.hypot(me.x - s.p.stand.x, me.z - s.p.stand.z) < 1.2) at = s.c.id;
    if (!at) left = null;
    else if (at !== left && !offer) start(at);
  }
  function pin() { if (paul.state !== 'walk') { paul.x = paul.home.x; paul.z = paul.home.z; } }

  return { step, pin, onPress, active: () => !!run || offer, start, S, CATS, get run() { return run; } };
}
