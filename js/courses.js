// 숲속 코스 네 갈래: 천로역정 구원 코스, 생명의 다리(복음), 천국을 사모하는 길, 예수님을 만나는 길
// 길을 따라 걸으며 정거장에 다가가면 장면과 함께 말씀이 뜨고, 길가 등불이 켜짐
import * as THREE from 'three';
import { TRAILS, R_PARK, BRIDGE } from './layout.js';
import { refreshNav } from './nav.js';
import { showVerse, VERSES } from './verses.js';
import { place } from './props.js';
import { fanfare } from './stories.js';

// 각 정거장: [이름, 말씀, 장면, 들어설 때, 이어지는 말씀들]
const COURSES = {
  pilgrim: {
    name: '천로역정', color: 0xffc070,
    st: [
      ['멸망의 도시', ['내 죄악이 내 머리에 넘쳐서 무거운 짐 같으니 감당할 수 없나이다', '시편 38:4'], 'city', 'burden'],
      ['전도자', ['좁은 문으로 들어가라 멸망으로 인도하는 문은 크고 그 길이 넓어 그리로 들어가는 자가 많고 생명으로 인도하는 문은 좁고 길이 협착하여 찾는 자가 적음이니라', '마태복음 7:13-14'], 'evangelist'],
      ['낙심의 늪', ['나를 기가 막힐 웅덩이와 수렁에서 끌어올리시고 내 발을 반석 위에 두사 내 걸음을 견고케 하셨도다', '시편 40:2'], 'slough', 'splash'],
      ['세속현자의 갈림길', ['어떤 길은 사람의 보기에 바르나 필경은 사망의 길이니라', '잠언 14:12'], 'wiseman'],
      ['좁은 문', ['구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾을 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니', '마태복음 7:7'], 'gate', 'knock'],
      ['해석자의 집', ['내 눈을 열어서 주의 법의 기이한 것을 보게 하소서', '시편 119:18'], 'house'],
      ['십자가', ['그가 찔림은 우리의 허물을 인함이요 그가 상함은 우리의 죄악을 인함이라 그가 징계를 받음으로 우리는 평화를 누리고 그가 맞음으로 우리는 나음을 입었도다', '이사야 53:5'], 'cross', 'unburden'],
      ['고난의 언덕', ['오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리의 날개 치며 올라감 같을 것이요 달음박질하여도 곤비치 아니하겠고 걸어가도 피곤치 아니하리로다', '이사야 40:31'], 'hill'],
      ['아름다운 궁전', ['주께서 내 원수의 목전에서 내게 상을 베푸시고 기름으로 내 머리에 바르셨으니 내 잔이 넘치나이다', '시편 23:5'], 'palace'],
      ['겸손의 골짜기', ['마귀의 궤계를 능히 대적하기 위하여 하나님의 전신갑주를 입으라', '에베소서 6:11'], 'armor'],
      ['사망의 음침한 골짜기', ['내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다', '시편 23:4'], 'shadow'],
      ['허영의 시장', ['이 세상도, 그 정욕도 지나가되 오직 하나님의 뜻을 행하는 이는 영원히 거하느니라', '요한일서 2:17'], 'fair'],
      ['의심의 성', ['또 약속하신 이는 미쁘시니 우리가 믿는 도리의 소망을 움직이지 말며 굳게 잡아', '히브리서 10:23'], 'castle', 'key'],
      ['기쁨의 산', ['내가 산을 향하여 눈을 들리라 나의 도움이 어디서 올꼬 나의 도움이 천지를 지으신 여호와에게서로다', '시편 121:1-2'], 'peaks'],
      ['죽음의 강', ['네가 물 가운데로 지날 때에 내가 함께 할 것이라 강을 건널 때에 물이 너를 침몰치 못할 것이며', '이사야 43:2'], 'river', 'splash'],
      ['하늘의 도성', ['내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니 이제 후로는 나를 위하여 의의 면류관이 예비되었으므로', '디모데후서 4:7-8'], 'city-gold', 'arrive'],
    ],
    after: ['우리를 구원하시되 우리의 행한바 의로운 행위로 말미암지 아니하고 오직 그의 긍휼하심을 좇아 중생의 씻음과 성령의 새롭게 하심으로 하셨나니', '디도서 3:5'],
  },
  // 세속현자가 가리킨 샛길: 내 힘(율법)으로 짐을 벗으려는 길. 갈수록 짐이 무거워지고 산이 무너질 듯 위협함
  sinai: {
    name: '시내산 샛길', color: 0xb0a090, side: true,
    st: [
      ['내 의로움', ['무릇 우리는 다 부정한 자 같아서 우리의 의는 다 더러운 옷 같으며', '이사야 64:6'], 'rags'],
      ['시내산', ['사람이 의롭게 되는 것은 율법의 행위로 말미암음이 아니요 오직 예수 그리스도를 믿음으로 말미암는 줄 알므로', '갈라디아서 2:16'], 'sinai', 'thunder',
        [['그러므로 율법의 행위로 그의 앞에 의롭다 하심을 얻을 육체가 없나니 율법으로는 죄를 깨달음이니라', '로마서 3:20']]],
    ],
  },
  gospel: {
    name: '복음을 듣는 길', color: 0xfff4d8,
    st: [
      ['아름다운 발', ['좋은 소식을 가져오며 평화를 공포하며 복된 좋은 소식을 가져오며 구원을 공포하며 시온을 향하여 이르기를 네 하나님이 통치하신다 하는 자의 산을 넘는 발이 어찌 그리 아름다운고', '이사야 52:7'], 'mount'],
      ['때가 찼다', ['때가 찼고 하나님 나라가 가까왔으니 회개하고 복음을 믿으라', '마가복음 1:15'], 'sun'],
      ['복음의 내용', ['성경대로 그리스도께서 우리 죄를 위하여 죽으시고 장사 지낸바 되었다가 성경대로 사흘 만에 다시 살아나사', '고린도전서 15:3-4'], 'calvary'],
      ['하나님의 능력', ['내가 복음을 부끄러워하지 아니하노니 이 복음은 모든 믿는 자에게 구원을 주시는 하나님의 능력이 됨이라', '로마서 1:16'], 'glory'],
      ['들음에서 난 믿음', ['그러므로 믿음은 들음에서 나며 들음은 그리스도의 말씀으로 말미암았느니라', '로마서 10:17'], 'house'],
      ['다른 이름은 없다', ['다른 이로서는 구원을 받을 수 없나니 천하 인간에 구원을 받을 만한 다른 이름을 우리에게 주신 일이 없음이니라', '사도행전 4:12'], 'signpost'],
      ['영접', ['영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니', '요한복음 1:12'], 'door'],
      ['영생', ['내 말을 듣고 또 나 보내신 이를 믿는 자는 영생을 얻었고 심판에 이르지 아니하나니 사망에서 생명으로 옮겼느니라', '요한복음 5:24'], 'dawn', 'arrive'],
    ],
  },
  heaven: {
    name: '천국을 사모하는 길', color: 0xbfe0ff,
    st: [
      ['나그네', ['이 사람들은 다 믿음을 따라 죽었으며 약속을 받지 못하였으되 그것들을 멀리서 보고 환영하며 또 땅에서는 외국인과 나그네로라 증거하였으니', '히브리서 11:13'], 'traveler'],
      ['더 나은 본향', ['저희가 이제는 더 나은 본향을 사모하니 곧 하늘에 있는 것이라 그러므로 하나님이 저희 하나님이라 일컬음 받으심을 부끄러워 아니하시고 저희를 위하여 한 성을 예비하셨느니라', '히브리서 11:16'], 'signpost'],
      ['거할 곳', ['내 아버지 집에 거할 곳이 많도다 그렇지 아니하면 너희에게 일렀으리라 내가 너희를 위하여 처소를 예비하러 가노니', '요한복음 14:2'], 'home'],
      ['눈물이 없는 곳', ['모든 눈물을 그 눈에서 씻기시매 다시 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니 처음 것들이 다 지나갔음이러라', '요한계시록 21:4'], 'tears'],
      ['하늘 시민권', ['오직 우리의 시민권은 하늘에 있는지라 거기로서 구원하는 자 곧 주 예수 그리스도를 기다리노니', '빌립보서 3:20'], 'pillar'],
      ['생명수의 강', ['또 저가 수정 같이 맑은 생명수의 강을 내게 보이니 하나님과 및 어린 양의 보좌로부터 나서 길 가운데로 흐르더라', '요한계시록 22:1'], 'lifeRiver', 'splash'],
      ['영원한 영광', ['우리의 잠시 받는 환난의 경한 것이 지극히 크고 영원한 영광의 중한 것을 우리에게 이루게 함이니', '고린도후서 4:17'], 'glory'],
      ['새 예루살렘', ['그 열두 문은 열두 진주니 문마다 한 진주요 성의 길은 맑은 유리 같은 정금이더라', '요한계시록 21:21'], 'pearl', 'arrive'],
    ],
    after: ['이것들을 증거하신 이가 가라사대 내가 진실로 속히 오리라 하시거늘 아멘 주 예수여 오시옵소서', '요한계시록 22:20'],
  },
  jesus: {
    name: '예수님을 만나는 길', color: 0xffd0b0,
    st: [
      ['나심', ['오늘날 다윗의 동네에 너희를 위하여 구주가 나셨으니 곧 그리스도 주시니라', '누가복음 2:11'], 'manger'],
      ['세례', ['하늘로서 소리가 있어 말씀하시되 이는 내 사랑하는 아들이요 내 기뻐하는 자라 하시니라', '마태복음 3:17'], 'jordan', 'dove'],
      ['산 위의 가르침', ['심령이 가난한 자는 복이 있나니 천국이 저희 것임이요', '마태복음 5:3'], 'mount'],
      ['생명의 떡', ['나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라', '요한복음 6:35'], 'loaves'],
      ['세상의 빛', ['나는 세상의 빛이니 나를 따르는 자는 어두움에 다니지 아니하고 생명의 빛을 얻으리라', '요한복음 8:12'], 'lamp'],
      ['섬기러 오심', ['인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기 목숨을 많은 사람의 대속물로 주려 함이니라', '마가복음 10:45'], 'basin'],
      ['십자가', ['예수께서 신 포도주를 받으신 후 가라사대 다 이루었다 하시고 머리를 숙이시고 영혼이 돌아가시니라', '요한복음 19:30'], 'calvary'],
      ['빈 무덤', ['여기 계시지 않고 살아나셨느니라', '누가복음 24:6'], 'tomb', 'risen'],
      ['다시 오실 주', ['너희 가운데서 하늘로 올리우신 이 예수는 하늘로 가심을 본 그대로 오시리라', '사도행전 1:11'], 'clouds', 'arrive'],
    ],
  },
  magi: {
    name: '동방박사의 길', color: 0xfff0a0,
    st: [
      ['동방에서 본 별', ['유대인의 왕으로 나신 이가 어디 계시뇨 우리가 동방에서 그의 별을 보고 그에게 경배하러 왔노라', '마태복음 2:2'], 'magi', 'star'],
      ['헤롯의 궁', ['베들레헴 에브라다야 너는 유다 족속 중에 작을지라도 이스라엘을 다스릴 자가 네게서 내게로 나올 것이라 그의 근본은 상고에, 태초에니라', '미가 5:2'], 'palace'],
      ['앞서 인도하는 별', ['동방에서 보던 그 별이 문득 앞서 인도하여 가다가 아기 있는 곳 위에 머물러 섰는지라', '마태복음 2:9'], 'dunes'],
      ['크게 기뻐하고', ['저희가 별을 보고 가장 크게 기뻐하고 기뻐하더라', '마태복음 2:10'], 'camels', 'joy'],
      ['아기 예수께 경배', ['집에 들어가 아기와 그 모친 마리아의 함께 있는 것을 보고 엎드려 아기께 경배하고 보배합을 열어 황금과 유향과 몰약을 예물로 드리니라', '마태복음 2:11'], 'bethHouse', 'arrive'],
    ],
  },
  bridge: {
    name: '생명의 다리', color: 0xfff8e0,
    st: [
      ['하나님의 사랑', ['하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라', '요한복음 3:16'], 'sun', null,
        [['내가 온 것은 양으로 생명을 얻게 하고 더 풍성히 얻게 하려는 것이니라', '요한복음 10:10']]],
      ['죄', ['모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니', '로마서 3:23'], 'broken', null,
        [['오직 너희 죄악이 너희와 너희 하나님 사이를 내었고 너희 죄가 그 얼굴을 가리워서 너희를 듣지 않으시게 함이니라', '이사야 59:2']]],
      ['죄의 결과', ['죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라', '로마서 6:23'], 'grave', null,
        [['한번 죽는 것은 사람에게 정하신 것이요 그 후에는 심판이 있으리니', '히브리서 9:27']]],
      ['사람의 노력', ['너희가 그 은혜를 인하여 믿음으로 말미암아 구원을 얻었나니 이것이 너희에게서 난 것이 아니요 하나님의 선물이라 행위에서 난 것이 아니니 이는 누구든지 자랑치 못하게 함이니라', '에베소서 2:8-9'], 'effort'],
      ['그리스도', ['우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에게 대한 자기의 사랑을 확증하셨느니라', '로마서 5:8'], 'none', 'crossfall',
        [['그리스도께서도 한번 죄를 위하여 죽으사 의인으로서 불의한 자를 대신하셨으니 이는 우리를 하나님 앞으로 인도하려 하심이라', '베드로전서 3:18'],
          ['하나님은 한 분이시요 또 하나님과 사람 사이에 중보도 한 분이시니 곧 사람이신 그리스도 예수라', '디모데전서 2:5']]],
      ['영접', ['영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니', '요한복음 1:12'], 'none', null,
        [['볼지어다 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그로 더불어 먹고 그는 나로 더불어 먹으리라', '요한계시록 3:20']]],
      ['영생의 확신', ['내 말을 듣고 또 나 보내신 이를 믿는 자는 영생을 얻었고 심판에 이르지 아니하나니 사망에서 생명으로 옮겼느니라', '요한복음 5:24'], 'dawn', 'arrive',
        [['또 증거는 이것이니 하나님이 우리에게 영생을 주신 것과 이 생명이 그의 아들 안에 있는 그것이니라 아들이 있는 자에게는 생명이 있고 하나님의 아들이 없는 자에게는 생명이 없느니라', '요한일서 5:11-12'],
          ['내가 하나님 아들의 이름을 믿는 너희에게 이것을 쓰는 것은 너희로 하여금 너희에게 영생이 있음을 알게 하려 함이라', '요한일서 5:13']]],
    ],
  },
};
const EXTRA = {
  strain: ['오호라 나는 곤고한 사람이로다 이 사망의 몸에서 누가 나를 건져내랴', '로마서 7:24'],
  free: ['그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니', '로마서 8:1'],
  fall: ['어떤 길은 사람의 보기에 바르나 필경은 사망의 길이니라', '잠언 14:12'],
  gifts: ['저희는 꿈에 헤롯에게로 돌아가지 말라 지시하심을 받아 다른 길로 고국에 돌아가니라', '마태복음 2:12'],
};
for (const [k, v] of Object.entries(EXTRA)) VERSES['course-x-' + k] = v;

// 지도에 쓰는 코스 정보와, 이 기기에서 찾은 코스(지나온 정거장)
export const COURSE_META = Object.fromEntries(Object.entries(COURSES).map(([id, c]) => [id, { name: c.name, color: c.color }]));
const FOUND_KEY = 'navs-cafe-found';
export function foundCourses() {
  try { return JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function markFound(id, i) {
  const f = foundCourses();
  const a = f[id] || (f[id] = []);
  if (a.includes(i)) return;
  a.push(i);
  try { localStorage.setItem(FOUND_KEY, JSON.stringify(f)); } catch (e) { /* 무시 */ }
}

export function addCourses(ctx) {
  const { scene, me, sfx, fxSprite, burst, steps, audio, H } = ctx;
  const shot = ctx.shot || (() => {});
  const { M, MAT, shadow, ease, G0, mergeStatic } = H;
  const hit = (name, vol = 0.3, rate = 1) => sfx('impact/' + name, vol, rate);
  const C = {
    path: M(0xcbb894, 1), dark: M(0x5b5550, 0.95), grey: M(0x8f8a84, 0.95), mud: M(0x6a5236, 0.6),
    wood: MAT.wood, woodDark: MAT.woodDark, stone: MAT.stone, white: MAT.white,
    gold: M(0xe8c060, 0.3, { metalness: 0.5, emissive: 0x6a4a10, emissiveIntensity: 0.4 }),
    pearl: M(0xf8f4ee, 0.2, { emissive: 0xfff4e0, emissiveIntensity: 0.35 }),
    water: M(0x6fb6d6, 0.15, { transparent: true, opacity: 0.85, emissive: 0x1a4a60, emissiveIntensity: 0.3 }),
    crystal: M(0xb8ecff, 0.05, { transparent: true, opacity: 0.8, emissive: 0x60c8ff, emissiveIntensity: 0.6 }),
    leaf: MAT.leaf, red: M(0xb84a3a, 0.7), warm: M(0xffe0a0, 0.5, { emissive: 0xffc060, emissiveIntensity: 1 }),
    abyss: M(0x0c0a0a, 1),
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const bx = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const glowAt = (g, color, size, x, y, z, op = 0.8) => { const s = fxSprite('light_01', color, size); s.position.set(x, y, z); s.material.opacity = op; g.add(s); return s; };
  const anims = []; // (dt, t) 장면 움직임
  const far = []; // 멀리 있으면 그리지 않는 것들 (숲속이라 나무에 가려 보이지도 않음)
  const cullable = (o, p) => { far.push({ o, x: p.x, z: p.z }); return o; };

  // 길 바닥: 둘레길 바깥부터 숲 끝까지 띠 모양
  for (const tr of Object.values(TRAILS)) {
    const S = tr.samples.filter((q) => Math.hypot(q.x, q.z) > R_PARK + 1.3);
    const pos = [], idx = [];
    S.forEach((q, i) => {
      const n = S[Math.min(i + 1, S.length - 1)], p = S[Math.max(i - 1, 0)];
      const dx = n.x - p.x, dz = n.z - p.z, l = Math.hypot(dx, dz) || 1;
      const rx = -dz / l * 1.25, rz = dx / l * 1.25;
      pos.push(q.x + rx, G0 + 0.016, q.z + rz, q.x - rx, G0 + 0.016, q.z - rz);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const strip = new THREE.Mesh(geo, C.path); strip.receiveShadow = true;
    if (geo.attributes.normal.array[1] < 0) { idx.reverse(); geo.setIndex(idx); geo.computeVertexNormals(); }
    scene.add(strip);
    // 끝 빈터
    const cl = new THREE.Mesh(new THREE.CircleGeometry(7, 40), C.path);
    cl.rotation.x = -Math.PI / 2; cl.position.set(tr.end.x, G0 + 0.015, tr.end.z); cl.receiveShadow = true;
    scene.add(cl);
  }

  // 사람 모양 (길쭉한 옷 + 머리)
  function fig(g, color, x, z, h = 1.5, extra) {
    const f = new THREE.Group(); f.position.set(x, 0, z);
    f.add(mesh(new THREE.ConeGeometry(0.34, h * 0.8, 12), M(color, 0.9), 0, h * 0.4, 0));
    f.add(mesh(new THREE.SphereGeometry(0.17, 12, 10), M(0xe8c4a0, 0.8), 0, h * 0.8 + 0.12, 0));
    if (extra) extra(f);
    g.add(f); return f;
  }
  function camel(g, x, z) {
    const c = new THREE.Group(); c.position.set(x, 0, z); const fur = M(0xc8a070, 1);
    c.add(bx(0.5, 0.5, 1.3, fur, 0, 1.1, 0)); c.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), fur, 0, 1.45, -0.1));
    const neck = bx(0.18, 0.8, 0.2, fur, 0, 1.5, 0.75); neck.rotation.x = 0.5; c.add(neck); c.add(bx(0.2, 0.2, 0.4, fur, 0, 1.85, 1.05));
    for (const [lx, lz] of [[-0.18, -0.5], [0.18, -0.5], [-0.18, 0.5], [0.18, 0.5]]) c.add(bx(0.1, 0.85, 0.1, fur, lx, 0.43, lz));
    g.add(c); return c;
  }
  // ---------- 장면들 (그룹 안: +z = 길 앞쪽, +x = 길 쪽(side 정거장) / 오른쪽(가운데 정거장)) ----------
  const scenes = {
    city(g) {
      for (const [x, z, h, r] of [[1.2, -1.6, 2.2, 0.15], [-0.3, 0.2, 1.6, -0.2], [0.9, 1.8, 2.6, 0.1]]) {
        const hs = bx(1.3, h, 1.3, C.dark, x, h / 2, z); hs.rotation.z = r * 0.3; hs.rotation.y = r; g.add(hs);
        const roof = mesh(new THREE.ConeGeometry(1.05, 0.8, 4), C.grey, x, h + 0.35, z); roof.rotation.y = Math.PI / 4 + r; g.add(roof);
      }
      const smoke = glowAt(g, 0x777777, 2.2, 0.4, 3.4, 0, 0.35);
      anims.push((dt, t) => { smoke.position.y = 3.2 + Math.sin(t * 0.7) * 0.3; });
    },
    slough(g) {
      const m = mesh(new THREE.CircleGeometry(2.6, 24), C.mud, 1.6, 0.02, 0); m.rotation.x = -Math.PI / 2; m.scale.set(1, 1.4, 1); g.add(m);
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), C.stone, 2.6 - k * 0.15, 0.05, -1.8 + k * 1.2));
      for (let k = 0; k < 5; k++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 4), C.leaf, 0.4 + Math.random(), 0.45, -2 + Math.random() * 4); r.rotation.z = (Math.random() - 0.5) * 0.4; g.add(r); }
    },
    gate(g) {
      for (const s of [-1, 1]) g.add(bx(0.3, 2.8, 0.3, C.woodDark, s * 1.55, 1.4, 0));
      g.add(bx(3.5, 0.3, 0.35, C.woodDark, 0, 2.9, 0));
      const door = new THREE.Group(); door.position.set(-1.4, 0, 0);
      door.add(bx(1.3, 2.3, 0.08, C.wood, 0.65, 1.2, 0)); door.rotation.y = -1.9; g.add(door);
      g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), C.warm, 0, 3.25, 0)); glowAt(g, 0xffd890, 1.4, 0, 3.25, 0);
    },
    house(g) {
      g.add(bx(2.6, 2.2, 2.6, C.white, 0, 1.1, 0));
      const roof = mesh(new THREE.ConeGeometry(2.2, 1.2, 4), C.red, 0, 2.8, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(bx(0.06, 0.6, 0.6, C.warm, 1.31, 1.4, 0.6)); g.add(bx(0.06, 1.3, 0.7, C.woodDark, 1.31, 0.65, -0.6));
      glowAt(g, 0xffd890, 1.6, 1.5, 1.4, 0.6, 0.6);
    },
    cross(g, st) {
      const hill = mesh(new THREE.SphereGeometry(2.2, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8aa86a, 1), -0.3, 0, 0); hill.scale.y = 0.45; g.add(hill);
      g.add(bx(0.26, 3.4, 0.26, C.woodDark, -0.3, 2.3, 0));
      g.add(bx(0.24, 0.24, 1.8, C.woodDark, -0.3, 3.2, 0));
      // 무덤: 짐이 굴러 들어가는 곳
      const rock = mesh(new THREE.SphereGeometry(1.1, 12, 8), C.grey, 0.4, 0.5, 2.6); rock.scale.set(1, 0.8, 1); g.add(rock);
      const hole = mesh(new THREE.CircleGeometry(0.42, 14), C.abyss, 1.35, 0.45, 2.6); hole.rotation.y = Math.PI / 2; g.add(hole);
      st.tomb = new THREE.Vector3(1.35, 0.4, 2.6);
      glowAt(g, 0xfff0c0, 2.4, -0.3, 3.4, 0, 0.35);
    },
    hill(g) {
      const h = mesh(new THREE.ConeGeometry(2.6, 2.2, 8), M(0x9a9080, 1), -0.6, 1.1, 0); g.add(h);
      for (let k = 0; k < 4; k++) g.add(bx(0.7, 0.18, 0.5, C.stone, 1.1 - k * 0.45, 0.1 + k * 0.4, 0));
      const arbor = new THREE.Group(); arbor.position.set(-0.6, 2.2, 0);
      for (const s of [-1, 1]) arbor.add(bx(0.08, 0.9, 0.08, C.wood, 0, 0.45, s * 0.5));
      arbor.add(bx(0.5, 0.06, 1.2, C.leaf, 0, 0.95, 0)); g.add(arbor);
    },
    fair(g) {
      const cols = [0xd9534f, 0x5b8def, 0xf0ad4e, 0x9b59b6];
      for (let k = 0; k < 3; k++) {
        const z = -2.4 + k * 2.4;
        g.add(bx(0.9, 1, 1.8, C.wood, 0.2, 0.5, z));
        for (let s = 0; s < 4; s++) g.add(bx(1.2, 0.08, 0.45, M(cols[(k + s) % 4], 0.6), 0.2, 1.9 - s * 0.01, z - 0.67 + s * 0.45));
        for (const s of [-1, 1]) g.add(bx(0.06, 1.9, 0.06, C.woodDark, 0.75, 0.95, z + s * 0.85));
        const shine = glowAt(g, cols[k], 0.5, 0.3, 1.25, z, 0.8);
        anims.push((dt, t) => { shine.material.opacity = 0.4 + Math.abs(Math.sin(t * 4 + k)) * 0.5; });
      }
    },
    castle(g, st) {
      const tw = mesh(new THREE.CylinderGeometry(1.4, 1.6, 4.2, 10), C.dark, -0.6, 2.1, 0); g.add(tw);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.add(bx(0.4, 0.45, 0.4, C.dark, -0.6 + Math.cos(a) * 1.3, 4.4, Math.sin(a) * 1.3)); }
      g.add(bx(0.1, 1.5, 0.9, M(0x2a2420), 0.82, 0.75, 0));
      // 약속이라는 열쇠 (천로역정)
      const key = new THREE.Group(); key.position.set(1.6, 1.3, 0);
      const ringK = mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), C.gold); key.add(ringK);
      key.add(bx(0.06, 0.06, 0.6, C.gold, 0, 0, 0.42)); key.add(bx(0.06, 0.16, 0.06, C.gold, 0, -0.08, 0.66));
      key.add(fxSprite('light_01', 0xffe090, 1));
      g.add(key); st.key = key;
      anims.push((dt, t) => { key.rotation.y = t * 1.2; key.position.y = 1.3 + Math.sin(t * 2) * 0.08; });
    },
    river(g) {
      const w = mesh(new THREE.PlaneGeometry(14, 2.6), C.water, 0, 0.025, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (let k = 0; k < 5; k++) g.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 8), C.stone, (k - 2) * 0.12, 0.05, -1 + k * 0.5));
      anims.push((dt, t) => { w.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.08; });
    },
    'city-gold'(g) {
      for (const s of [-1, 1]) {
        g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 5.5, 10), C.pearl, s * 2.2, 2.75, 0));
        g.add(mesh(new THREE.ConeGeometry(0.85, 1.4, 10), C.gold, s * 2.2, 6.2, 0));
        g.add(bx(4, 3.2, 0.7, C.pearl, s * 4.6, 1.6, 0.4));
      }
      const arch = mesh(new THREE.TorusGeometry(1.6, 0.25, 10, 24, Math.PI), C.gold, 0, 4, 0); g.add(arch);
      const street = mesh(new THREE.PlaneGeometry(2.4, 6), C.gold, 0, 0.03, -3.2); street.rotation.x = -Math.PI / 2; g.add(street);
      const halo = glowAt(g, 0xfff0b0, 7, 0, 3.4, 0.4, 0.6);
      anims.push((dt, t) => { halo.material.opacity = 0.5 + Math.sin(t * 1.3) * 0.15; });
    },
    sun(g) {
      const sunG = glowAt(g, 0xffe6a0, 4, -0.4, 3.6, 0, 0.9);
      g.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), C.warm, -0.4, 3.6, 0));
      flowers(g, 0, 0, 1.6, 16);
      anims.push((dt, t) => { sunG.material.opacity = 0.7 + Math.sin(t) * 0.15; });
    },
    fruit(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 2, 8), C.woodDark, -0.3, 1, 0));
      const cr = mesh(new THREE.IcosahedronGeometry(1.3, 1), C.leaf, -0.3, 2.6, 0); g.add(cr);
      for (let k = 0; k < 10; k++) { const a = k * 2.4; g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), M(k % 2 ? 0xe05a3a : 0xf0b03a, 0.5), -0.3 + Math.cos(a) * 1.15, 2.3 + (k % 3) * 0.3, Math.sin(a) * 1.15)); }
      flowers(g, 0.6, 0, 1.4, 10);
    },
    broken(g) {
      for (let k = 0; k < 6; k++) { const s = mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0), C.dark, (Math.random() - 0.3) * 2, 0.2, -1.5 + k * 0.6); s.rotation.set(Math.random(), Math.random(), 0); g.add(s); }
      g.add(bx(0.25, 1.6, 0.25, C.woodDark, -0.4, 0.8, 0));
      const sign = bx(0.06, 0.25, 1.2, C.woodDark, -0.3, 1.4, 0.3); sign.rotation.x = 0.5; g.add(sign); // 부러진 이정표
    },
    grave(g) {
      g.add(bx(0.35, 1.3, 0.9, C.grey, -0.2, 0.65, 0));
      g.add(bx(0.5, 0.25, 1.4, C.dark, -0.2, 0.12, 0));
      const mist = glowAt(g, 0x555566, 3, 0, 0.5, 0, 0.4);
      anims.push((dt, t) => { mist.material.opacity = 0.3 + Math.sin(t * 0.8) * 0.1; });
    },
    door(g) {
      for (const s of [-1, 1]) g.add(bx(0.2, 2.6, 0.2, C.wood, 0, 1.3, s * 0.75));
      g.add(bx(0.24, 0.24, 1.7, C.wood, 0, 2.6, 0));
      const light = mesh(new THREE.PlaneGeometry(1.3, 2.4), M(0xfff2d0, 0.4, { emissive: 0xffe6b0, emissiveIntensity: 1.1, side: THREE.DoubleSide }), 0, 1.25, 0); light.rotation.y = Math.PI / 2; g.add(light);
      const leaf = bx(0.08, 2.4, 1.3, C.woodDark, 0.6, 1.2, -1.2); leaf.rotation.y = 0.9; g.add(leaf);
      glowAt(g, 0xfff0c0, 3, 0.3, 1.3, 0, 0.6);
    },
    dawn(g) {
      g.add(bx(0.5, 0.08, 1.8, C.wood, -0.2, 0.45, 0)); for (const s of [-1, 1]) g.add(bx(0.4, 0.45, 0.08, C.woodDark, -0.2, 0.22, s * 0.8));
      flowers(g, 0, 0, 2.4, 22, 0xffffff);
      const sun = glowAt(g, 0xffd890, 9, -2.5, 5, 0, 0.7);
      anims.push((dt, t) => { sun.material.opacity = 0.55 + Math.sin(t * 0.6) * 0.15; });
    },
    traveler(g) {
      const staff = bx(0.07, 1.8, 0.07, C.woodDark, -0.3, 0.9, 0.3); staff.rotation.x = 0.15; g.add(staff);
      g.add(bx(0.5, 0.4, 0.5, M(0x8a6a4a), -0.4, 0.2, -0.4));
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 8), C.warm, -0.3, 1.7, 0.6)); glowAt(g, 0xffd080, 1.2, -0.3, 1.7, 0.6);
    },
    signpost(g) { place(g, 'assets/camp/signpost.glb', { x: 0, z: 0, y: 0, rot: 0, height: 2 }); glowAt(g, 0xfff0d0, 1.5, 0, 2.2, 0, 0.4); },
    home(g) {
      g.add(bx(2.4, 2, 2.4, C.white, -0.2, 1, 0));
      const roof = mesh(new THREE.ConeGeometry(2, 1.1, 4), M(0x6a8fb8, 0.7), -0.2, 2.55, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(bx(0.06, 1.4, 0.8, C.warm, 1.01, 0.7, 0)); g.add(bx(0.06, 0.5, 0.5, C.warm, 1.01, 1.4, -0.75)); g.add(bx(0.06, 0.5, 0.5, C.warm, 1.01, 1.4, 0.75));
      glowAt(g, 0xffd890, 2.2, 1.3, 1, 0, 0.6);
    },
    tears(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.6, 16), C.stone, -0.2, 0.3, 0));
      const pool = mesh(new THREE.CircleGeometry(0.7, 16), C.crystal, -0.2, 0.61, 0); pool.rotation.x = -Math.PI / 2; g.add(pool);
      const drops = [];
      for (let k = 0; k < 6; k++) { const d = glowAt(g, 0xcfeaff, 0.35, -0.2, 2, 0); drops.push(d); }
      anims.push((dt, t) => drops.forEach((d, i) => { const f = (t * 0.35 + i / 6) % 1; d.position.set(-0.2 + Math.cos(i * 2.1) * 0.4, 2.6 - f * 2, Math.sin(i * 2.1) * 0.4); d.material.opacity = Math.sin(f * Math.PI) * 0.9; }));
      flowers(g, -0.2, 0, 1.5, 12, 0xffffff);
    },
    pillar(g) {
      const p = mesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 16, 1, true), M(0xfff8e0, 0.2, { transparent: true, opacity: 0.25, emissive: 0xfff0c0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), -0.3, 7, 0);
      p.castShadow = false; g.add(p);
      g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 16), C.stone, -0.3, 0.15, 0));
      anims.push((dt, t) => { p.material.opacity = 0.18 + Math.sin(t * 1.5) * 0.07; });
    },
    lifeRiver(g) {
      const w = mesh(new THREE.PlaneGeometry(16, 2.4), C.crystal, 0, 0.03, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (const s of [-1, 1]) {
        const tg = new THREE.Group(); tg.position.set(s * 4, 0, 0); g.add(tg);
        tg.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.4, 8), C.woodDark, 0, 1.2, 0));
        tg.add(mesh(new THREE.IcosahedronGeometry(1.5, 1), M(0x4f9e58), 0, 3, 0));
        for (let k = 0; k < 12; k++) { const a = k * 0.52; tg.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), C.gold, Math.cos(a) * 1.35, 2.7 + (k % 3) * 0.3, Math.sin(a) * 1.35)); }
      }
      anims.push((dt, t) => { w.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.15; });
    },
    glory(g) { flowers(g, 0, 0, 2.6, 40, 0xffd34a); glowAt(g, 0xffe8a0, 5, 0, 1.5, 0, 0.5); },
    pearl(g) {
      const gate = mesh(new THREE.TorusGeometry(2.4, 0.55, 16, 40), C.pearl, 0, 2.4, 0); gate.userData.dyn = true; g.add(gate);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.28, 14, 10), C.pearl, Math.cos(a) * 3.4, 2.4 + Math.sin(a) * 3.4, 0)); }
      const street = mesh(new THREE.PlaneGeometry(2.4, 7), C.gold, 0, 0.03, -3.4); street.rotation.x = -Math.PI / 2; g.add(street);
      for (const s of [-1, 1]) g.add(bx(5, 3, 0.6, M(0xc8e8f0, 0.1, { transparent: true, opacity: 0.7, emissive: 0x88c8e8, emissiveIntensity: 0.4 }), s * 5.3, 1.5, 0.4));
      const halo = glowAt(g, 0xe8f6ff, 9, 0, 3, 0.6, 0.6);
      anims.push((dt, t) => { halo.material.opacity = 0.45 + Math.sin(t) * 0.15; gate.rotation.z = t * 0.05; });
    },
    manger(g) {
      for (const [x, z] of [[-1.2, -1.2], [-1.2, 1.2], [0.6, -1.2], [0.6, 1.2]]) g.add(bx(0.15, 2, 0.15, C.woodDark, x, 1, z));
      const roof = bx(2.4, 0.12, 3, C.wood, -0.3, 2.1, 0); roof.rotation.z = 0.2; g.add(roof);
      g.add(bx(0.7, 0.45, 1.1, C.wood, -0.3, 0.3, 0)); g.add(bx(0.6, 0.1, 1.0, M(0xe8c870, 0.9, { emissive: 0xffd070, emissiveIntensity: 0.5 }), -0.3, 0.55, 0));
      glowAt(g, 0xfff0c0, 1.8, -0.3, 0.7, 0, 0.8);
      const star = glowAt(g, 0xffffff, 1.6, -0.3, 6, 0, 0.95); const s2 = fxSprite('star_06', 0xfff4c0, 1.2); star.add(s2);
      anims.push((dt, t) => { star.material.opacity = 0.8 + Math.sin(t * 3) * 0.15; });
    },
    jordan(g, st) {
      const w = mesh(new THREE.PlaneGeometry(14, 2.6), C.water, 0, 0.025, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (let k = 0; k < 6; k++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 4), C.leaf, -6 + Math.random() * 3, 0.5, (Math.random() - 0.5) * 2.6); g.add(r); }
      const beam = mesh(new THREE.CylinderGeometry(0.2, 1.4, 12, 16, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), 0, 6, 0);
      beam.castShadow = false; g.add(beam);
      const dove = new THREE.Group();
      const body = mesh(new THREE.SphereGeometry(0.16, 10, 8), C.white); body.scale.set(0.8, 0.8, 1.5); dove.add(body);
      const wings = [];
      for (const s of [-1, 1]) { const w2 = mesh(new THREE.PlaneGeometry(0.5, 0.22), M(0xffffff, 0.6, { side: THREE.DoubleSide })); w2.rotation.x = -Math.PI / 2; w2.position.x = s * 0.28; dove.add(w2); wings.push(w2); }
      dove.visible = false; g.add(dove);
      st.dove = { dove, wings, beam, T: -1 };
    },
    mount(g) {
      const m = mesh(new THREE.SphereGeometry(2.6, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x86a865, 1), -1.2, 0, 0); m.scale.y = 0.5; g.add(m);
      for (let k = 0; k < 7; k++) { const a = -1 + k * 0.33; g.add(mesh(new THREE.DodecahedronGeometry(0.25, 0), C.stone, -1.2 + Math.cos(a) * 3, 0.15, Math.sin(a) * 3)); }
      flowers(g, -1.2, 0, 2, 14, 0xb48ae0);
    },
    loaves(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.4, 14), M(0xb08850, 0.9), -0.2, 0.55, 0));
      g.add(bx(0.5, 0.35, 1.4, C.woodDark, -0.2, 0.18, 0));
      for (let k = 0; k < 5; k++) { const l = mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0xd9a35a, 0.8), -0.2 + Math.cos(k * 1.26) * 0.25, 0.8, Math.sin(k * 1.26) * 0.25); l.scale.y = 0.6; g.add(l); }
      for (const s of [-1, 1]) { const f = mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0x8aa0b0, 0.5), -0.15, 0.82, s * 0.12); f.scale.set(0.6, 0.5, 2); g.add(f); }
      glowAt(g, 0xffe0a0, 1.2, -0.2, 0.9, 0, 0.5);
    },
    lamp(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.6, 8), C.woodDark, -0.2, 1.3, 0));
      g.add(mesh(new THREE.SphereGeometry(0.28, 14, 10), C.warm, -0.2, 2.75, 0));
      const l = glowAt(g, 0xffe0a0, 5, -0.2, 2.75, 0, 0.9);
      anims.push((dt, t) => { l.material.opacity = 0.75 + Math.sin(t * 2) * 0.15; });
    },
    basin(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.3, 16), M(0xc2a07a), -0.2, 0.15, 0));
      const wtr = mesh(new THREE.CircleGeometry(0.44, 16), C.water, -0.2, 0.29, 0); wtr.rotation.x = -Math.PI / 2; g.add(wtr);
      const towel = bx(0.05, 0.4, 0.6, C.white, -0.5, 0.5, 0.7); towel.rotation.z = 0.3; g.add(towel);
      g.add(bx(0.5, 0.45, 0.5, C.wood, -0.6, 0.22, -0.9));
    },
    calvary(g) {
      const hill = mesh(new THREE.SphereGeometry(3, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x9a9070, 1), -1.4, 0, 0); hill.scale.y = 0.5; g.add(hill);
      for (const [z, h] of [[-1.6, 2.6], [0, 3.4], [1.6, 2.6]]) {
        g.add(bx(0.22, h, 0.22, C.woodDark, -1.4, 1.4 + h / 2 - 0.4, z));
        g.add(bx(0.2, 0.2, h * 0.5, C.woodDark, -1.4, 1.4 + h - 1.1, z));
      }
    },
    tomb(g, st) {
      const rock = mesh(new THREE.SphereGeometry(1.9, 14, 10), C.grey, -1, 1.1, 0); rock.scale.set(1, 0.8, 1.2); g.add(rock);
      const hole = mesh(new THREE.CircleGeometry(0.65, 18), M(0xfff0c8, 0.5, { emissive: 0xfff0c0, emissiveIntensity: 1.2 }), 0.82, 0.75, 0); hole.rotation.y = Math.PI / 2; g.add(hole);
      const stoneW = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.25, 18), C.stone, 0.75, 0.8, 1.4); stoneW.rotation.z = Math.PI / 2; g.add(stoneW);
      st.light = glowAt(g, 0xfff4d0, 3, 1.2, 0.8, 0, 0.6);
    },
    // ----- 천로역정 새 장면 -----
    evangelist(g) {
      fig(g, 0x5a4a7a, 0, 0, 1.55, (f) => { const arm = bx(0.1, 0.1, 0.7, C.white, 0.18, 1.15, 0.35); arm.rotation.x = -0.5; f.add(arm); });
      const far = glowAt(g, 0xfff0b0, 2.4, -1.5, 4.5, 9, 0.85); // 저 빛을 따라가라
      anims.push((dt, t) => { far.material.opacity = 0.65 + Math.sin(t * 2) * 0.2; });
    },
    wiseman(g) {
      fig(g, 0x2a2a30, 0, 0, 1.6, (f) => { f.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 12), C.dark, 0, 1.9, 0)); f.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 14), C.dark, 0, 1.74, 0)); });
      g.add(bx(0.1, 2, 0.1, C.woodDark, 0.9, 1, -0.8));
      const arrow = bx(0.08, 0.28, 1.1, C.gold, 0.9, 1.75, -1.25); g.add(arrow); // 쉬워 보이는 샛길을 가리킴
    },
    palace(g) {
      g.add(bx(4.4, 0.35, 3.4, C.white, -0.6, 0.17, 0));
      for (const x of [-2.4, 1.2]) for (const z of [-1.4, 0, 1.4]) g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.6, 12), C.white, x, 1.65, z));
      g.add(bx(4.2, 0.3, 3.6, C.white, -0.6, 3.05, 0));
      const roof = mesh(new THREE.ConeGeometry(2.8, 1.1, 4), C.gold, -0.6, 3.75, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; g.add(roof);
      g.add(bx(1.4, 0.08, 0.8, C.wood, -0.4, 1.0, 0)); g.add(bx(0.1, 0.65, 0.1, C.woodDark, -0.4, 0.66, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.18, 10), C.gold, -0.4, 1.13, 0.1));
      glowAt(g, 0xffe0a0, 3, -0.6, 2, 0, 0.45);
    },
    armor(g) {
      g.add(bx(0.12, 1.6, 0.12, C.woodDark, 0, 0.8, 0)); g.add(bx(0.8, 0.1, 0.1, C.woodDark, 0, 1.4, 0));
      const steel = M(0xc8ccd4, 0.25, { metalness: 0.8 });
      g.add(mesh(new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel, 0, 1.68, 0));
      g.add(bx(0.62, 0.7, 0.3, steel, 0, 1.1, 0));
      const sh = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18), steel, 0.55, 0.75, 0.25); sh.rotation.z = Math.PI / 2; g.add(sh);
      const sw = bx(0.05, 1.0, 0.1, steel, -0.5, 0.75, 0.2); sw.rotation.z = 0.2; g.add(sw);
      glowAt(g, 0x332233, 4, -3, 2.2, -3, 0.5); // 골짜기에 웅크린 어둠
    },
    shadow(g, st) {
      const rock = M(0x2c2a30, 1);
      for (let k = 0; k < 14; k++) {
        const sd = k % 2 ? 1 : -1, z = -9 + (k >> 1) * 2.6, h = 2.5 + Math.random() * 2.5;
        const r = mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.6, 0), rock, sd * (2.6 + Math.random()), h / 2 - 0.3, z); r.scale.y = h / 2; g.add(r);
      }
      for (let k = 0; k < 5; k++) glowAt(g, 0x0a0a14, 5, (Math.random() - 0.5) * 6, 1.4, -6 + k * 3, 0.5).material.blending = THREE.NormalBlending;
      // 그래도 함께하시는 빛: 지팡이와 막대기 끝에 작은 등불
      const rod = glowAt(g, 0xfff4d0, 0.9, 1.6, 1.6, 0, 0.9);
      anims.push((dt, t) => { rod.material.opacity = 0.7 + Math.sin(t * 2.2) * 0.2; });
      st.dark = true;
    },
    peaks(g) {
      for (const [x, z, h] of [[-1.5, -2.5, 5], [-3, 1, 6.5], [-0.8, 3.4, 4.2]]) g.add(mesh(new THREE.ConeGeometry(h * 0.55, h, 9), M(0x7fae6a, 1), x, h / 2, z));
      for (let k = 0; k < 5; k++) g.add(mesh(new THREE.SphereGeometry(0.2, 8, 6), C.white, 0.6 + Math.random() * 1.2, 0.22, -2 + k));
      g.add(bx(0.05, 1.6, 0.05, C.wood, 0.4, 0.8, 1.4));
      glowAt(g, 0xfff0c0, 6, -6, 7, 0, 0.4); // 멀리 보이는 하늘 도성의 빛
      flowers(g, 0.4, 0, 2.2, 24);
    },
    rags(g) {
      for (const z of [-1.4, 1.4]) g.add(bx(0.1, 1.9, 0.1, C.woodDark, 0, 0.95, z));
      g.add(bx(0.03, 0.03, 2.8, C.dark, 0, 1.8, 0));
      const dirty = [0x6a5a48, 0x5a5048, 0x7a6a50];
      for (let k = 0; k < 4; k++) { const c = bx(0.04, 0.7 + Math.random() * 0.3, 0.5, M(dirty[k % 3], 1), 0, 1.4, -1.05 + k * 0.7); c.rotation.x = (Math.random() - 0.5) * 0.2; g.add(c); }
    },
    sinai(g, st) {
      const rock = M(0x4a4038, 1);
      const m = mesh(new THREE.ConeGeometry(9, 18, 10), rock, -6, 8.4, 0); m.rotation.z = 0.12; g.add(m); // 길 위로 기울어 덮칠 듯한 산
      for (let k = 0; k < 6; k++) g.add(mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.7, 0), rock, -1.5 - Math.random() * 2, 0.4, -4 + k * 1.6));
      const cloud = [];
      for (let k = 0; k < 5; k++) { const c = glowAt(g, 0x555560, 7, -6 + Math.cos(k) * 3, 15 + k * 0.5, Math.sin(k) * 3, 0.55); c.material.blending = THREE.NormalBlending; cloud.push(c); }
      st.bolt = glowAt(g, 0xe8f0ff, 10, -4, 11, 0, 0);
      st.mount = new THREE.Vector3(-6, 8, 0);
      anims.push((dt, t) => cloud.forEach((c, i) => { c.position.y = 15 + i * 0.5 + Math.sin(t * 0.4 + i) * 0.4; }));
    },
    // ----- 동방박사 -----
    magi(g) {
      [[0x6a3a8a, -0.2, -1.2], [0xa03030, 0.3, 0], [0x2e6a4a, -0.2, 1.2]].forEach(([c, x, z]) => fig(g, c, x, z, 1.6, (f) => {
        const cr = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.16, 8, 1, true), C.gold, 0, 1.78, 0); f.add(cr);
      }));
      camel(g, -1.8, 0.2);
    },
    dunes(g) {
      const sand = M(0xd8b878, 1);
      for (let k = 0; k < 8; k++) { const sd = k % 2 ? 1 : -1; const d = mesh(new THREE.SphereGeometry(1.6 + Math.random() * 1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sand, sd * (5.2 + Math.random() * 2), 0, -8 + k * 2.2); d.scale.y = 0.35; g.add(d); }
    },
    camels(g) { camel(g, 0, -1); camel(g, -0.6, 1.4); flowers(g, 0, 0, 2, 12, 0xffd34a); },
    bethHouse(g, st) {
      const wall = M(0xe8dcc0, 1);
      // 앞(-z)이 열린 집: 길에서 들어서면 바로 아기와 마리아가 보임
      g.add(bx(0.25, 2.6, 4.2, wall, -2, 1.3, 0.4)); g.add(bx(0.25, 2.6, 4.2, wall, 2, 1.3, 0.4)); g.add(bx(4.2, 2.6, 0.25, wall, 0, 1.3, 2.4));
      g.add(bx(4.6, 0.25, 4.8, C.wood, 0, 2.7, 0.4));
      g.add(bx(1.1, 0.45, 0.7, C.wood, 0, 0.3, 1.1)); g.add(bx(1.0, 0.1, 0.6, M(0xe8c870, 0.9, { emissive: 0xffd070, emissiveIntensity: 0.6 }), 0, 0.55, 1.1));
      fig(g, 0x3a6ab0, 1.1, 1.3, 1.1); // 마리아
      glowAt(g, 0xfff0c0, 2.4, 0, 0.8, 1.1, 0.9);
      st.gifts = [[0xe8c060, -0.7, 0.2], [0xb08a5a, 0, 0.1], [0x8a5a3a, 0.7, 0.2]];
      st.inside = new THREE.Vector3(0, 0, 1.1);
    },
    // ----- 생명의 다리 -----
    effort(g) {
      // 사람이 쌓은 것들: 돈, 촛불(종교), 책(도덕) — 모두 건너기에는 모자람
      g.add(bx(0.5, 0.7, 0.5, C.stone, 0, 0.35, -1.6)); for (let k = 0; k < 5; k++) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), C.gold, 0, 0.72 + k * 0.045, -1.6));
      g.add(bx(0.5, 0.7, 0.5, C.stone, 0, 0.35, 0)); g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), C.white, 0, 0.85, 0)); glowAt(g, 0xffc060, 0.5, 0, 1.08, 0, 0.9);
      g.add(bx(0.5, 0.7, 0.5, C.stone, 0, 0.35, 1.6)); g.add(bx(0.32, 0.1, 0.42, C.red, 0, 0.75, 1.6));
    },
    none() {},
    clouds(g) {
      const cm = M(0xffffff, 0.9, { emissive: 0xffffff, emissiveIntensity: 0.25 });
      for (let k = 0; k < 9; k++) g.add(mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.7, 12, 10), cm, Math.cos(k) * 2.4, 7 + Math.sin(k * 2) * 0.5, Math.sin(k) * 2.4));
      const beams = [];
      for (let k = 0; k < 3; k++) {
        const b = mesh(new THREE.CylinderGeometry(0.3, 1.6, 7, 14, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0.18, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), (k - 1) * 1.8, 3.5, (k % 2) * 0.8);
        b.castShadow = false; g.add(b); beams.push(b);
      }
      anims.push((dt, t) => beams.forEach((b, i) => { b.material.opacity = 0.12 + Math.sin(t * 0.8 + i * 2) * 0.06; }));
      flowers(g, 0, 0, 3, 18, 0xffffff);
    },
  };
  // 꽃: 한 번에 그리는 인스턴스 (그리기 횟수를 줄임)
  const flowerGeo = new THREE.SphereGeometry(0.08, 6, 4);
  const flowerMat = M(0xffffff, 0.6);
  function flowers(g, x, z, R, n, col) {
    const cols = col ? [col] : [0xf28fb0, 0xffd34a, 0xffffff, 0xb48ae0];
    const im = new THREE.InstancedMesh(flowerGeo, flowerMat, n);
    const m4 = new THREE.Matrix4(), c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, r = R * (0.4 + Math.random() * 0.6);
      m4.makeTranslation(x + Math.cos(a) * r, 0.16, z + Math.sin(a) * r);
      im.setMatrixAt(k, m4); im.setColorAt(k, c.set(cols[k % cols.length]));
    }
    g.add(im);
  }

  // 짐 (천로역정): 등에 멘 가방이 커지고 걸음이 느려짐. 내 힘으로는 벗지 못하고, 십자가 앞에서 굴러 떨어짐
  const bag = me.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1);
  const bag0 = bag ? { s: bag.scale.clone(), p: bag.position.clone() } : null;
  let burden = false, roll = null, strainT = -1;
  const setBurden = (on) => {
    burden = on;
    me.slow = on ? 0.55 : 0;
    if (!bag) return;
    if (on) { bag.scale.set(bag0.s.x * 2.2, bag0.s.y * 2.2, bag0.s.z * 2.8); bag.position.set(bag0.p.x, bag0.p.y + 0.1, bag0.p.z - 0.14); }
    else { bag.scale.copy(bag0.s); bag.position.copy(bag0.p); }
  };
  const { actions, avail, act, faceTo, go } = ctx;
  actions.shrug = () => {
    if (!burden || strainT >= 0) return;
    act('strain', 2.4); strainT = 0;
    [0, 600, 1200].forEach((d) => setTimeout(() => hit('impactSoft_heavy_000', 0.25, 0.6 + Math.random() * 0.1), d));
    setTimeout(() => showVerse('course-x-strain', { cooldown: 25, title: '내 힘으로는' }), 2600);
  };
  avail.push(() => (burden && strainT < 0 && !roll ? 'shrug' : null));

  // 화면을 어둡게(음침한 골짜기) / 번쩍(시내산 번개) 하는 막
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0.15) 20%, rgba(4,4,12,0.95) 85%);transition:opacity .4s';
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;background:#eef4ff';
  document.body.append(veil, flash);
  let flashV = 0;

  const effects = {
    burden() { if (!burden) { setBurden(true); hit('impactSoft_heavy_000', 0.35, 0.6); } },
    splash() { audio.splash(0.35); },
    knock() { [0, 350, 700].forEach((d) => setTimeout(() => hit('impactWood_light_000', 0.4, 0.8), d)); setTimeout(() => sfx('orb', 0.2), 1300); },
    unburden(st) {
      if (!burden || !bag) return;
      const w = new THREE.Vector3(); bag.getWorldPosition(w);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.6), bag.material);
      box.position.copy(w); box.castShadow = true; scene.add(box);
      bag.visible = false; setBurden(false);
      const to = st.tomb.clone(); st.g.localToWorld(to);
      shot(to, { dist: 8, el: 0.35, side: 0.7, dur: 6, mid: 0.6 });
      roll = { box, from: w.clone(), to, T: 0 };
      hit('impactSoft_heavy_000', 0.4, 0.8);
      setTimeout(() => { if (bag) bag.visible = true; }, 3500);
      setTimeout(() => showVerse('course-x-free', { cooldown: 0, title: '짐이 벗어지다' }), 11000);
    },
    key(st) { if (st.key) { burst(...st.key.getWorldPosition(new THREE.Vector3()).toArray()); hit('impactMetal_light_000', 0.3, 1.3); } },
    dove(st) { if (st.dove) st.dove.T = 0; },
    risen(st) { if (st.light) st.light.material.opacity = 1; hit('impactBell_heavy_000', 0.2, 1.2); },
    thunder(st) {
      flashV = 1; hit('impactPunch_medium_000', 0.5, 0.4); setTimeout(() => { flashV = 0.8; hit('impactSoft_heavy_000', 0.5, 0.5); }, 700);
      if (st.bolt) st.bolt.material.opacity = 1;
      const m = st.mount.clone(); st.g.localToWorld(m);
      shot(m, { dist: 20, el: -0.05, side: 0.4, dur: 6, mid: 0.6, y: 0 });
      if (burden && bag) bag.scale.multiplyScalar(1.12); // 율법 앞에서 짐은 더 무거워짐
    },
    star() { star.on = true; sfx('orb', 0.2, 1.4); },
    joy(st) { for (let i = 0; i < 8; i++) setTimeout(() => burst(st.show.x + (Math.random() - 0.5) * 3, 1 + Math.random() * 2, st.show.z + (Math.random() - 0.5) * 3), i * 150); },
    crossfall() { if (!cross.down && cross.T < 0) { cross.T = 0; shot(new THREE.Vector3(BRIDGE.x, G0, BRIDGE.z), { dist: 22, el: 0.5, side: 0.75, dur: 8, mid: 0.6 }); hit('impactWood_light_000', 0.3, 0.5); } },
    arrive(st, course) {
      fanfare(audio, [523, 659, 784, 1047], 1.2, 0.2, 0.06);
      shot(st.g.position, { dist: 14, el: 0.3, side: 0.5, dur: 8, mid: 0.7, y: 2.5 });
      for (let i = 0; i < 14; i++) setTimeout(() => burst(st.x + (Math.random() - 0.5) * 6, 0.5 + Math.random() * 3, st.z + (Math.random() - 0.5) * 6), i * 120);
      if (course.after) setTimeout(() => showVerse('course-' + course.id + '-after', { cooldown: 0, title: course.name }), 12000);
    },
  };

  // 정거장 세우기
  const live = [];
  for (const [id, course] of Object.entries(COURSES)) {
    const tr = TRAILS[id];
    course.id = id;
    if (course.after) VERSES['course-' + id + '-after'] = course.after;
    tr.stations.forEach((st, i) => {
      const [name, verse, kind, fx, more] = course.st[i];
      const key = 'course-' + id + '-' + i;
      VERSES[key] = verse;
      (more || []).forEach((v, k) => { VERSES[key + '-m' + k] = v; });
      const g = new THREE.Group();
      const base = st.side ? st.show : (i === tr.stations.length - 1 ? { x: st.x + st.dir.x * 5, z: st.z + st.dir.z * 5 } : st);
      g.position.set(base.x, G0, base.z);
      // +z = 길 앞, side 정거장은 +x가 길 쪽을 보도록
      g.rotation.y = Math.atan2(st.dir.x, st.dir.z) + (st.side < 0 ? Math.PI : 0);
      scene.add(g); cullable(g, base);
      const S = { ...st, g, name, key, fx, i, more: more || [] };
      if (scenes[kind]) scenes[kind](g, S);
      g.traverse((c) => { if (c.isMesh) { c.castShadow = !c.material.transparent; c.receiveShadow = true; } });
      mergeStatic(g);
      // 길가 등불: 지나가면 켜짐
      const lp = st.side ? { x: st.x - st.right.x * st.side * 1.8, z: st.z - st.right.z * st.side * 1.8 } : { x: st.x + st.right.x * 1.8, z: st.z + st.right.z * 1.8 };
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6), MAT.woodDark); post.position.set(lp.x, G0 + 0.65, lp.z); scene.add(post);
      const bulbM = M(0x8a8070, 0.5, { emissive: course.color, emissiveIntensity: 0 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bulbM); bulb.position.set(lp.x, G0 + 1.38, lp.z); scene.add(bulb);
      const halo = fxSprite('light_01', course.color, 0.9 + i * 0.05); halo.position.copy(bulb.position); halo.material.opacity = 0; scene.add(halo);
      cullable(post, lp); cullable(bulb, lp); cullable(halo, lp);
      S.lit = (on) => { bulbM.emissiveIntensity = on ? 1.3 : 0; halo.material.opacity = on ? 0.75 : 0; };
      S.title = `${course.name} ${i + 1}/${tr.stations.length} · ${name}`;
      S.course = course; S.near = false; S.isEnd = i === tr.stations.length - 1 && !course.side;
      live.push(S);
    });
    if (tr.from) continue; // 갈림길에는 입구 아치가 없음
    // 길 입구: 나무 아치와 코스 빛깔 등
    const p0 = tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 2.2) || tr.samples[0];
    const p1 = tr.samples[tr.samples.indexOf(p0) + 2] || p0;
    const ang = Math.atan2(p1.x - p0.x, p1.z - p0.z);
    const arch = new THREE.Group(); arch.position.set(p0.x, G0, p0.z); arch.rotation.y = ang; scene.add(arch);
    for (const s of [-1, 1]) arch.add(bx(0.2, 2.8, 0.2, C.woodDark, s * 1.45, 1.4, 0));
    arch.add(bx(3.3, 0.22, 0.26, C.woodDark, 0, 2.85, 0));
    const lamp = mesh(new THREE.SphereGeometry(0.2, 12, 10), M(0xffffff, 0.4, { emissive: course.color, emissiveIntensity: 1.2 }), 0, 2.45, 0); arch.add(lamp);
    const lg = fxSprite('light_01', course.color, 1.8); lg.position.set(0, 2.45, 0); lg.material.opacity = 0.8; arch.add(lg);
    shadow(arch);
  }
  const darkSt = live.filter((S) => S.dark);

  // ---------- 동방박사: 앞서 인도하는 별 ----------
  const MT = TRAILS.magi;
  const house = live.find((S) => S.course.id === 'magi' && S.isEnd);
  const star = { on: false, g: new THREE.Group(), idx: 0, t: 0 };
  {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), M(0xffffff, 0.2, { emissive: 0xfff4c0, emissiveIntensity: 2 }));
    star.g.add(core, fxSprite('light_01', 0xfff0b0, 4), fxSprite('star_06', 0xffffff, 2.6));
    const s0 = MT.stations[0]; star.g.position.set(s0.x, 9, s0.z); star.g.visible = false; scene.add(star.g);
    star.core = core;
  }
  const gifts = { done: -1, objs: [] };
  const housePos = () => { const p = house.inside.clone(); house.g.localToWorld(p); return p; };
  const giftSpot = () => { const p = new THREE.Vector3(0, 0, -2.1); house.g.localToWorld(p); return { x: p.x, z: p.z }; };
  actions.gift = () => go(giftSpot, () => {
    const hp = housePos();
    faceTo(me, hp); act('worship', 5); gifts.done = 0;
    shot(hp, { dist: 7, el: 0.35, side: 0.6, dur: 9, mid: 0.6, y: 0.8 });
    house.gifts.forEach(([c, x, z], k) => setTimeout(() => {
      const p = new THREE.Vector3(x, 0.2, z); house.g.localToWorld(p);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.24), M(c, 0.4, { metalness: k ? 0.1 : 0.6, emissive: c, emissiveIntensity: 0.25 }));
      b.position.copy(p); b.rotation.y = house.g.rotation.y; scene.add(b); gifts.objs.push(b);
      burst(p.x, p.y + 0.4, p.z); hit('impactBell_heavy_000', 0.12, 1.4 + k * 0.2);
    }, 1400 + k * 900));
    setTimeout(() => showVerse('course-x-gifts', { cooldown: 0, title: '다른 길로' }), 9000);
  });
  avail.push(() => (house && gifts.done < 0 && Math.hypot(me.x - house.x, me.z - house.z) < 7 ? 'gift' : null));

  // ---------- 생명의 다리: 넓은 빈터와 깊은 낭떠러지 ----------
  const B = BRIDGE;
  const bg = new THREE.Group(); bg.position.set(B.x, G0, B.z); bg.rotation.y = Math.atan2(B.a.x, B.a.z); scene.add(bg);
  const bp = (u, v, y = 0) => new THREE.Vector3(-u, y, v); // 그룹 안 좌표 (u는 -x 쪽)
  {
    const sideL = B.V - B.gap;
    const human = new THREE.Mesh(new THREE.PlaneGeometry(B.U * 2 + 2, sideL), M(0xa89c84, 1)); human.rotation.x = -Math.PI / 2; human.position.copy(bp(0, -B.gap - sideL / 2, 0.02)); human.receiveShadow = true; bg.add(human);
    const god = new THREE.Mesh(new THREE.PlaneGeometry(B.U * 2 + 2, sideL), M(0xd8e8b0, 1, { emissive: 0x302810, emissiveIntensity: 0.3 })); god.rotation.x = -Math.PI / 2; god.position.copy(bp(0, B.gap + sideL / 2, 0.02)); god.receiveShadow = true; bg.add(god);
    // 낭떠러지 벽과 바닥
    const cliff = M(0x2a2420, 1), D = 14;
    for (const sv of [-1, 1]) { const w = bx(B.U * 2, D, 0.4, cliff, 0, -D / 2 - 0.5, sv * (B.gap + 0.2)); bg.add(w); }
    for (const su of [-1, 1]) { const w = bx(0.4, D, B.gap * 2, cliff, su * (B.U + 0.2), -D / 2 - 0.5, 0); bg.add(w); }
    bg.add(bx(B.U * 2, 0.4, B.gap * 2, C.abyss, 0, -D - 0.5, 0));
    for (let k = 0; k < 6; k++) { const m = glowAt(bg, 0x3a1020, 7, (k - 2.5) * 5, -6, 0, 0.5); m.material.blending = THREE.NormalBlending; }
    // 가장자리 돌
    for (let k = 0; k < 24; k++) { const sv = k % 2 ? 1 : -1, u = -B.U + (k >> 1) * (B.U * 2 / 11) + Math.random() * 0.6; if (Math.abs(u) < 1.6 || B.tries.some((t) => Math.abs(t.u - u) < 1.2)) continue; bg.add(mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.3, 0), C.grey, -u, 0.1, sv * (B.gap + 0.4))); }
    // 하나님 쪽: 밝은 빛과 꽃
    glowAt(bg, 0xfff4d0, 14, 0, 7, B.V - 3, 0.55);
    flowers(bg, 0, B.gap + 7, 9, 90);
    // 사람의 노력으로 놓은 다리들 (끝이 모자라고 부서져 있음)
    for (const t of B.tries) {
      const p = bx(1.5, 0.22, t.len, C.wood, -t.u, -0.08, -B.gap + t.len / 2); bg.add(p);
      const tip = bx(1.2, 0.2, 0.5, C.woodDark, -t.u + 0.1, -0.15, -B.gap + t.len + 0.2); tip.rotation.x = 0.35; tip.rotation.z = 0.2; bg.add(tip);
      for (const s of [-1, 1]) bg.add(bx(0.1, 0.9, 0.1, C.woodDark, -t.u + s * 0.7, 0.45, -B.gap - 0.6));
    }
    shadow(bg); mergeStatic(bg);
  }
  // 십자가 다리: 처음엔 낭떠러지 앞에 서 있다가 '그리스도' 정거장에서 건너편으로 넘어지며 다리가 됨
  const L = B.gap * 2 + 2.4;
  const cross = { T: -1, down: false, pivot: new THREE.Group() };
  {
    const wood = M(0x9a6a3a, 0.8, { emissive: 0x4a2a08, emissiveIntensity: 0.15 });
    cross.pivot.position.copy(bp(0, -B.gap - 1.1, -0.15));
    const beam = bx(2.6, L, 0.3, wood, 0, L / 2, 0); const bar = bx(6.5, 1.3, 0.3, wood, 0, L * 0.74, 0);
    cross.pivot.add(beam, bar);
    cross.glow = glowAt(cross.pivot, 0xfff0c0, 5, 0, L * 0.74, 0.3, 0.6);
    bg.add(cross.pivot); shadow(cross.pivot);
  }
  // 문 (계 3:20): 십자가 다리 앞. '영접'으로 열면 건널 수 있음
  const door = { g: new THREE.Group(), leaf: null, T: -1 };
  {
    door.g.position.copy(bp(0, -B.gap - 2.6)); bg.add(door.g);
    for (const s of [-1, 1]) door.g.add(bx(0.2, 2.6, 0.2, C.woodDark, s * 1.15, 1.3, 0));
    door.g.add(bx(2.5, 0.22, 0.24, C.woodDark, 0, 2.65, 0));
    const hinge = new THREE.Group(); hinge.position.set(1.05, 0, 0); door.g.add(hinge);
    const leaf = bx(2.0, 2.4, 0.1, C.wood, -1.0, 1.2, 0); hinge.add(leaf); hinge.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), C.gold, -1.8, 1.2, 0.08));
    door.leaf = hinge; door.light = glowAt(door.g, 0xfff4d0, 3, 0, 1.4, 0.6, 0);
    shadow(door.g);
  }
  const doorWorld = () => { const p = bp(0, -B.gap - 4.0); return bg.localToWorld(p); };
  actions.receive = () => go(doorWorld, () => {
    faceTo(me, bg.localToWorld(bp(0, 0))); door.T = 0; B.open = true; refreshNav(B.x, B.z, 32);
    sfx('orb', 0.3, 1.1); hit('impactWood_light_000', 0.3, 1);
    shot(bg.localToWorld(bp(0, 0, 1)), { dist: 14, el: 0.4, side: 0.35, dur: 6, mid: 0.6 });
  });
  avail.push(() => (cross.down && !B.open && Math.hypot(me.x - B.x, me.z - B.z) < 30 && (() => { const l = B.local(me.x, me.z); return Math.abs(l.u) < 3 && l.v < -B.gap - 1 && l.v > -B.gap - 7; })() ? 'receive' : null));
  // 노력의 다리 끝에서 떨어짐
  let fall = null;
  const startFall = (t) => {
    fall = { T: 0, t, slow: me.slow };
    me.slow = 0.0001; me.path = []; me.state = 'idle';
    hit('impactPlank_medium_000', 0.4, 0.7); setTimeout(() => sfx('impact/impactSoft_medium_000', 0.3, 0.5), 600);
    shot(bg.localToWorld(bp(t.u, -B.gap + t.len)), { dist: 9, el: 0.75, side: 0.3, dur: 3.5, mid: 0.5 });
  };
  const knocked = { T: -1 };

  let cullT = 0, offT = 0;
  steps.push((dt, t) => {
    if ((cullT -= dt) < 0) { cullT = 0.5; for (const f of far) f.o.visible = Math.hypot(me.x - f.x, me.z - f.z) < 75; bg.visible = Math.hypot(me.x - B.x, me.z - B.z) < 90; }
    for (const f of anims) f(dt, t);
    for (const S of live) {
      const d = Math.min(Math.hypot(me.x - S.x, me.z - S.z), S.side ? Math.hypot(me.x - S.show.x, me.z - S.show.z) + 0.6 : 99);
      const inside = d < (S.isEnd ? 5 : 2.8);
      if (inside && !S.near) {
        S.lit(true);
        markFound(S.course.id, S.i);
        if (showVerse(S.key, { cooldown: 40, delay: 0.2, title: S.title }) !== false || S.fx === 'burden' || S.fx === 'unburden' || S.fx === 'crossfall' || S.fx === 'thunder' || S.fx === 'star') {
          if (S.fx && effects[S.fx]) effects[S.fx](S, S.course);
          S.more.forEach((v, k) => setTimeout(() => { if (Math.hypot(me.x - S.x, me.z - S.z) < 16) showVerse(S.key + '-m' + k, { cooldown: 40, title: S.title }); }, 11000 * (k + 1)));
          if (S.course.id === 'bridge' && S.i === 5) { knocked.T = 0; [0, 450, 900].forEach((dd) => setTimeout(() => hit('impactWood_light_000', 0.4, 0.75), 1500 + dd)); }
        }
      }
      S.near = inside;
      if (S.dove && S.dove.T >= 0) {
        const D = S.dove; D.T += dt;
        D.dove.visible = D.T < 10;
        const k = ease(D.T / 3);
        D.dove.position.set(0, 9 - k * 6.8, 0);
        D.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * 14) * (1 - k * 0.7) * (i ? 1 : -1); });
        D.beam.material.opacity = Math.min(0.3, D.T * 0.15) * (D.T < 9 ? 1 : Math.max(0, 1 - (D.T - 9)));
        if (D.T > 10) { D.T = -1; D.beam.material.opacity = 0; }
      }
      if (S.bolt && S.bolt.material.opacity > 0) S.bolt.material.opacity = Math.max(0, S.bolt.material.opacity - dt * 1.5);
    }
    // 짐이 굴러 무덤으로
    if (roll) {
      roll.T += dt;
      const k = Math.min(1, roll.T / 2.2);
      roll.box.position.lerpVectors(roll.from, roll.to, ease(k));
      roll.box.position.y = Math.max(G0 + 0.3, roll.from.y * (1 - k * 3));
      roll.box.rotation.x += dt * 6;
      if (k >= 1) { scene.remove(roll.box); roll = null; sfx('orb', 0.25, 1.2); }
    }
    if (strainT >= 0 && (strainT += dt) > 3) strainT = -1;
    // 짐의 무게: 늪과 시내산 샛길에서는 더 무겁게
    if (burden && !fall) {
      let k = 0.55;
      const sl = live.find((S) => S.course.id === 'pilgrim' && S.i === 2);
      if (sl && Math.hypot(me.x - sl.x, me.z - sl.z) < 5) k = 0.32;
      const sn = TRAILS.sinai;
      if (Math.hypot(me.x - sn.end.x, me.z - sn.end.z) < sn.len + 8 && sn.samples.some((q, i) => i > 12 && Math.abs(q.x - me.x) < 3 && Math.hypot(q.x - me.x, q.z - me.z) < 3)) {
        k = 0.38;
        if (Math.random() < dt * 0.25) { flashV = 0.6; hit('impactPunch_medium_000', 0.35, 0.4); }
      }
      me.slow = k;
    }
    // 길을 벗어나 건물 쪽으로 돌아가면 짐도 내려놓음
    // 짐은 천로역정 길(과 시내산 샛길) 위에서만 짐: 길에서 벗어나면 내려놓음
    if (burden && (offT -= dt) < 0) {
      offT = 0.5;
      const onPath = ['pilgrim', 'sinai'].some((id) => TRAILS[id].samples.some((q) => Math.abs(q.x - me.x) < 9 && Math.abs(q.z - me.z) < 9 && Math.hypot(q.x - me.x, q.z - me.z) < 9));
      if (!onPath) setBurden(false);
    }
    // 화면 막
    let dark = 0;
    for (const S of darkSt) dark = Math.max(dark, Math.min(1, (18 - Math.hypot(me.x - S.x, me.z - S.z)) / 10));
    veil.style.opacity = (Math.max(0, dark) * 0.75).toFixed(2);
    flashV = Math.max(0, flashV - dt * 3); flash.style.opacity = (flashV * flashV * 0.7).toFixed(2);
    // 별: 내 앞 길 위를 떠가다가 아기 계신 집 위에 머묾
    if (star.on) {
      star.g.visible = true;
      if ((star.t -= dt) < 0) {
        star.t = 0.25;
        let bi = star.idx, bd = Infinity;
        MT.samples.forEach((q, i) => { const dd = Math.hypot(q.x - me.x, q.z - me.z); if (dd < bd) { bd = dd; bi = i; } });
        if (bd < 25) star.idx = bi;
      }
      const ti = Math.min(MT.samples.length - 1, star.idx + 30);
      const atEnd = ti >= MT.samples.length - 6;
      const tp = atEnd ? housePos() : MT.samples[ti];
      const ty = atEnd ? 6 : 8;
      star.g.position.x += (tp.x - star.g.position.x) * Math.min(1, dt * 0.8);
      star.g.position.z += (tp.z - star.g.position.z) * Math.min(1, dt * 0.8);
      star.g.position.y += (ty + Math.sin(t * 1.3) * 0.3 - star.g.position.y) * Math.min(1, dt * 0.8);
      star.core.rotation.y += dt;
    }
    if (gifts.done >= 0 && (gifts.done += dt) > 120) { gifts.done = -1; gifts.objs.forEach((o) => scene.remove(o)); gifts.objs = []; }
    // 십자가가 넘어져 다리가 됨
    if (cross.T >= 0) {
      cross.T += dt;
      const k = Math.min(1, cross.T / 2.6);
      cross.pivot.rotation.x = (Math.PI / 2) * k * k;
      if (k >= 1) { cross.T = -1; cross.down = true; hit('impactPlank_medium_000', 0.5, 0.5); for (let i = 0; i < 10; i++) { const p = bg.localToWorld(bp((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 8, 0.3)); burst(p.x, p.y, p.z); } }
    }
    if (door.T >= 0) { door.T += dt; const k = Math.min(1, door.T / 1.6); door.leaf.rotation.y = -1.9 * ease(k); door.light.material.opacity = 0.8 * k; }
    // 노력의 다리 끝: 떨어졌다가 처음 자리로
    if (!fall && Math.abs(me.x - B.x) < 30 && Math.abs(me.z - B.z) < 30) {
      const l = B.local(me.x, me.z);
      if (Math.abs(l.v) < B.gap) for (const tt of B.tries) if (Math.abs(l.u - tt.u) < 0.8 && l.v > -B.gap + tt.len - 0.5) { startFall(tt); break; }
    }
    if (fall) {
      fall.T += dt;
      me.av.position.y -= fall.T * fall.T * 6;
      if (fall.T > 1.5) {
        const p = B.at(fall.t.u * 0.6, -B.gap - 5.5);
        me.x = p.x; me.z = p.z; me.y = G0; me.av.position.set(p.x, G0, p.z); me.path = []; me.state = 'idle';
        me.slow = fall.slow || 0; fall = null;
        showVerse('course-x-fall', { cooldown: 20, title: '사람의 다리로는' });
      }
    }
  });
}
