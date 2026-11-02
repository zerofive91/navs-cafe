// 숲속 새 코스 여섯 갈래 (2026-11, 정거장 말씀은 개역한글 1961)
//   천지창조의 길: 엿새 동안의 창조와 일곱째 날의 안식
//   예수님의 신성 · 인성 · 사랑 · 순종 · 고난의 길
// 정거장 모양: [이름, 말씀, 장면, 들어설 때, 이어지는 말씀들]  (courses.js와 같음)
import * as THREE from 'three';

export const CHRIST_COURSES = {
  creation: {
    name: '천지창조의 길', color: 0x9fd8f0,
    st: [
      ['태초에', ['태초에 하나님이 천지를 창조하시니라', '창세기 1:1'], 'c_void', null,
        [['땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 신은 수면에 운행하시니라', '창세기 1:2']]],
      ['첫째 날 · 빛', ['하나님이 가라사대 빛이 있으라 하시매 빛이 있었고', '창세기 1:3'], 'c_light', 'lightburst'],
      ['둘째 날 · 하늘', ['하나님이 궁창을 하늘이라 칭하시니라 저녁이 되며 아침이 되니 이는 둘째 날이니라', '창세기 1:8'], 'c_sky'],
      ['셋째 날 · 땅과 바다', ['하나님이 뭍을 땅이라 칭하시고 모인 물을 바다라 칭하시니라 하나님의 보시기에 좋았더라', '창세기 1:10'], 'c_land', null,
        [['하나님이 가라사대 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 과목을 내라 하시매 그대로 되어', '창세기 1:11']]],
      ['넷째 날 · 해와 달과 별', ['하나님이 두 큰 광명을 만드사 큰 광명으로 낮을 주관하게 하시고 작은 광명으로 밤을 주관하게 하시며 또 별들을 만드시고', '창세기 1:16'], 'c_lights', null,
        [['주의 손가락으로 만드신 주의 하늘과 주의 베풀어 두신 달과 별들을 내가 보오니 사람이 무엇이관대 주께서 저를 생각하시며 인자가 무엇이관대 주께서 저를 권고하시나이까', '시편 8:3-4']]],
      ['다섯째 날 · 물고기와 새', ['하나님이 큰 물고기와 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님의 보시기에 좋았더라', '창세기 1:21'], 'c_life'],
      ['여섯째 날 · 사람', ['하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고', '창세기 1:27'], 'c_man'],
      ['심히 좋았더라', ['하나님이 그 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되며 아침이 되니 이는 여섯째 날이니라', '창세기 1:31'], 'c_good', 'joy',
        [['여호와여 주의 하신 일이 어찌 그리 많은지요 주께서 지혜로 저희를 다 지으셨으니 주의 부요가 땅에 가득하니이다', '시편 104:24']]],
      ['일곱째 날 · 안식', ['하나님이 일곱째 날을 복 주사 거룩하게 하셨으니 이는 하나님이 그 창조하시며 만드시던 모든 일을 마치시고 이 날에 안식하셨음이더라', '창세기 2:3'], 'c_rest', 'arrive',
        [['믿음으로 모든 세계가 하나님의 말씀으로 지어진 줄을 우리가 아나니 보이는 것은 나타난 것으로 말미암아 된것이 아니니라', '히브리서 11:3']]],
    ],
    after: ['하늘이 하나님의 영광을 선포하고 궁창이 그 손으로 하신 일을 나타내는도다', '시편 19:1'],
  },
  deity: {
    name: '예수님의 신성의 길', color: 0xf6e08a,
    st: [
      ['태초의 말씀', ['태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라', '요한복음 1:1'], 'c_word'],
      ['만물을 지으신 분', ['만물이 그에게 창조되되 하늘과 땅에서 보이는 것들과 보이지 않는 것들과 혹은 보좌들이나 주관들이나 정사들이나 권세들이나 만물이 다 그로 말미암고 그를 위하여 창조되었고', '골로새서 1:16'], 'c_cosmos'],
      ['아브라함 전부터', ['예수께서 가라사대 진실로 진실로 너희에게 이르노니 아브라함이 나기 전부터 내가 있느니라 하시니', '요한복음 8:58'], 'c_iam'],
      ['아버지와 하나', ['나와 아버지는 하나이니라 하신대', '요한복음 10:30'], 'c_one', null,
        [['예수께서 가라사대 빌립아 내가 이렇게 오래 너희와 함께 있으되 네가 나를 알지 못하느냐 나를 본 자는 아버지를 보았거늘 어찌하여 아버지를 보이라 하느냐', '요한복음 14:9']]],
      ['바람과 바다도 순종하고', ['예수께서 깨어 바람을 꾸짖으시며 바다더러 이르시되 잠잠하라 고요하라 하시니 바람이 그치고 아주 잔잔하여지더라', '마가복음 4:39'], 'c_storm', null,
        [['그 사람들이 기이히 여겨 가로되 이 어떠한 사람이기에 바람과 바다도 순종하는고 하더라', '마태복음 8:27']]],
      ['죄를 사하는 권세', ['그러나 인자가 땅에서 죄를 사하는 권세가 있는 줄을 너희로 알게 하려하노라 하시고 중풍병자에게 말씀하시되', '마가복음 2:10'], 'c_mat'],
      ['변화산', ['저희 앞에서 변형되사 그 얼굴이 해 같이 빛나며 옷이 빛과 같이 희어졌더라', '마태복음 17:2'], 'c_transfig', 'lightburst',
        [['말할 때에 홀연히 빛난 구름이 저희를 덮으며 구름 속에서 소리가 나서 가로되 이는 내 사랑하는 아들이요 내 기뻐하는 자니 너희는 저의 말을 들으라 하는지라', '마태복음 17:5']]],
      ['도마의 고백', ['도마가 대답하여 가로되 나의 주시며 나의 하나님이시니이다', '요한복음 20:28'], 'c_thomas'],
      ['영광의 광채', ['이는 하나님의 영광의 광채시요 그 본체의 형상이시라 그의 능력의 말씀으로 만물을 붙드시며 죄를 정결케 하는 일을 하시고 높은 곳에 계신 위엄의 우편에 앉으셨느니라', '히브리서 1:3'], 'c_throne', 'arrive'],
    ],
    after: ['그 안에는 신성의 모든 충만이 육체로 거하시고', '골로새서 2:9'],
  },
  humanity: {
    name: '예수님의 인성의 길', color: 0xe8b890,
    st: [
      ['말씀이 육신이 되어', ['말씀이 육신이 되어 우리 가운데 거하시매 우리가 그 영광을 보니 아버지의 독생자의 영광이요 은혜와 진리가 충만하더라', '요한복음 1:14'], 'c_descend'],
      ['여자에게서 나심', ['때가 차매 하나님이 그 아들을 보내사 여자에게서 나게 하시고 율법 아래 나게 하신 것은', '갈라디아서 4:4'], 'manger', null,
        [['맏아들을 낳아 강보로 싸서 구유에 뉘었으니 이는 사관에 있을 곳이 없음이러라', '누가복음 2:7']]],
      ['자라 가시며', ['예수는 그 지혜와 그 키가 자라가며 하나님과 사람에게 더 사랑스러워 가시더라', '누가복음 2:52'], 'c_grow'],
      ['나사렛의 목수', ['이 사람이 마리아의 아들 목수가 아니냐 야고보와 요셉과 유다와 시몬의 형제가 아니냐 그 누이들이 우리와 함께 여기 있지 아니하냐 하고 예수를 배척한지라', '마가복음 6:3'], 'c_carpenter'],
      ['주리심', ['사십 일을 밤낮으로 금식하신 후에 주리신지라', '마태복음 4:2'], 'c_desert'],
      ['우물가에서 곤하여', ['거기 또 야곱의 우물이 있더라 예수께서 행로에 곤하여 우물 곁에 그대로 앉으시니 때가 제 육시쯤 되었더라', '요한복음 4:6'], 'c_well'],
      ['배에서 주무심', ['예수께서는 고물에서 베개를 베시고 주무시더니 제자들이 깨우며 가로되 선생님이여 우리의 죽게 된것을 돌아보지 아니하시나이까 하니', '마가복음 4:38'], 'c_sleep'],
      ['눈물을 흘리시더라', ['예수께서 눈물을 흘리시더라', '요한복음 11:35'], 'c_tears'],
      ['우리와 같이 시험 받으신', ['우리에게 있는 대제사장은 우리 연약함을 체휼하지 아니하는 자가 아니요 모든 일에 우리와 한결 같이 시험을 받은 자로되 죄는 없으시니라', '히브리서 4:15'], 'c_priest', 'arrive'],
    ],
    after: ['하나님은 한 분이시요 또 하나님과 사람 사이에 중보도 한 분이시니 곧 사람이신 그리스도 예수라', '디모데전서 2:5'],
  },
  love: {
    name: '예수님의 사랑의 길', color: 0xf4a0b0,
    st: [
      ['이처럼 사랑하사', ['하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라', '요한복음 3:16'], 'c_heart'],
      ['어린 아이들을', ['예수께서 보시고 분히 여겨 이르시되 어린 아이들의 내게 오는 것을 용납하고 금하지 말라 하나님의 나라가 이런 자의 것이니라', '마가복음 10:14'], 'c_children'],
      ['손을 내밀어 대시며', ['예수께서 민망히 여기사 손을 내밀어 저에게 대시며 가라사대 내가 원하노니 깨끗함을 받으라 하신대', '마가복음 1:41'], 'c_touch'],
      ['목자 없는 양', ['무리를 보시고 민망히 여기시니 이는 저희가 목자 없는 양과 같이 고생하며 유리함이라', '마태복음 9:36'], 'c_flock'],
      ['삭개오야', ['인자의 온 것은 잃어버린 자를 찾아 구원하려 함이니라', '누가복음 19:10'], 'c_sycamore'],
      ['정죄하지 아니하노니', ['대답하되 주여 없나이다 예수께서 가라사대 나도 너를 정죄하지 아니하노니 가서 다시는 죄를 범치 말라 하시니라', '요한복음 8:11'], 'c_stones'],
      ['끝까지 사랑하시니라', ['유월절 전에 예수께서 자기가 세상을 떠나 아버지께로 돌아가실 때가 이른줄 아시고 세상에 있는 자기 사람들을 사랑하시되 끝까지 사랑하시니라', '요한복음 13:1'], 'c_basin', null,
        [['내가 주와 또는 선생이 되어 너희 발을 씻겼으니 너희도 서로 발을 씻기는 것이 옳으니라', '요한복음 13:14']]],
      ['친구를 위하여', ['사람이 친구를 위하여 자기 목숨을 버리면 이에서 더 큰 사랑이 없나니', '요한복음 15:13'], 'c_friends', null,
        [['우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에게 대한 자기의 사랑을 확증하셨느니라', '로마서 5:8']]],
      ['끊을 수 없는 사랑', ['내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나 높음이나 깊음이나 다른 아무 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라', '로마서 8:38-39'], 'c_bond', 'arrive'],
    ],
    after: ['새 계명을 너희에게 주노니 서로 사랑하라 내가 너희를 사랑한것 같이 너희도 서로 사랑하라', '요한복음 13:34'],
  },
  obey: {
    name: '예수님의 순종의 길', color: 0xb8c8f0,
    st: [
      ['하늘에서 내려오심', ['내가 하늘로서 내려 온 것은 내 뜻을 행하려 함이 아니요', '요한복음 6:38'], 'c_stairs'],
      ['순종하여 받드시더라', ['예수께서 한가지로 내려가사 나사렛에 이르러 순종하여 받드시더라 그 모친은 이 모든 말을 마음에 두니라', '누가복음 2:51'], 'c_home'],
      ['모든 의를 이루심', ['예수께서 대답하여 가라사대 이제 허락하라 우리가 이와 같이 하여 모든 의를 이루는 것이 합당하니라 하신대 이에 요한이 허락하는지라', '마태복음 3:15'], 'jordan', 'dove'],
      ['나의 양식', ['예수께서 이르시되 나의 양식은 나를 보내신 이의 뜻을 행하며 그의 일을 온전히 이루는 이것이니라', '요한복음 4:34'], 'c_bread'],
      ['아버지의 하시는 일을 보고', ['그러므로 예수께서 저희에게 이르시되 내가 진실로 진실로 너희에게 이르노니 아들이 아버지의 하시는 일을 보지 않고는 아무 것도 스스로 할 수 없나니 아버지께서 행하시는 그것을 아들도 그와 같이 행하느니라', '요한복음 5:19'], 'c_steps'],
      ['겟세마네의 기도', ['가라사대 아버지여 만일 아버지의 뜻이어든 이 잔을 내게서 옮기시옵소서 그러나 내 원대로 마옵시고 아버지의 원대로 되기를 원하나이다 하시니', '누가복음 22:42'], 'c_olive'],
      ['죽기까지 복종하심', ['사람의 모양으로 나타나셨으매 자기를 낮추시고 죽기까지 복종하셨으니 곧 십자가에 죽으심이라', '빌립보서 2:8'], 'calvary'],
      ['순종함을 배워서', ['그가 아들이시라도 받으신 고난으로 순종함을 배워서 온전하게 되었은즉 자기를 순종하는 모든 자에게 영원한 구원의 근원이 되시고', '히브리서 5:8-9'], 'c_fountain'],
      ['지극히 높여', ['이러므로 하나님이 그를 지극히 높여 모든 이름 위에 뛰어난 이름을 주사 하늘에 있는 자들과 땅에 있는 자들과 땅 아래 있는 자들로 모든 무릎을 예수의 이름에 꿇게 하시고', '빌립보서 2:9-10'], 'c_exalt', 'arrive'],
    ],
    after: ['한 사람의 순종치 아니함으로 많은 사람이 죄인 된것 같이 한 사람의 순종하심으로 많은 사람이 의인이 되리라', '로마서 5:19'],
  },
  passion: {
    name: '예수님의 고난의 길', color: 0xc89090,
    st: [
      ['호산나', ['앞에서 가고 뒤에서 따르는 무리가 소리질러 가로되 호산나 다윗의 자손이여 찬송하리로다 주의 이름으로 오시는이여 가장 높은 곳에서 호산나 하더라', '마태복음 21:9'], 'c_palms', 'joy'],
      ['마지막 만찬', ['또 떡을 가져 사례하시고 떼어 저희에게 주시며 가라사대 이것은 너희를 위하여 주는 내 몸이라 너희가 이를 행하여 나를 기념하라 하시고', '누가복음 22:19'], 'c_supper'],
      ['심히 고민하여', ['이에 말씀하시되 내 마음이 심히 고민하여 죽게 되었으니 너희는 여기 머물러 나와 함께 깨어 있으라 하시고', '마태복음 26:38'], 'c_olive'],
      ['입맞춤으로', ['예수께 입을 맞추려고 가까이 하는지라 예수께서 이르시되 유다야 네가 입맞춤으로 인자를 파느냐 하시니', '누가복음 22:48'], 'c_torches'],
      ['닭 울기 전에', ['주께서 돌이켜 베드로를 보시니 베드로가 주의 말씀 곧 오늘 닭 울기 전에 네가 세번 나를 부인하리라 하심이 생각나서 밖에 나가서 심히 통곡하니라', '누가복음 22:61-62'], 'c_rooster'],
      ['가시 면류관', ['군병들이 가시로 면류관을 엮어 그의 머리에 씌우고 자색 옷을 입히고', '요한복음 19:2'], 'c_thorns', null,
        [['그가 찔림은 우리의 허물을 인함이요 그가 상함은 우리의 죄악을 인함이라 그가 징계를 받음으로 우리가 평화를 누리고 그가 채찍에 맞음으로 우리가 나음을 입었도다', '이사야 53:5']]],
      ['십자가를 지시고', ['저희가 예수를 맡으매 예수께서 자기의 십자가를 지시고 해골(히브리 말로 골고다)이라 하는 곳에 나오시니', '요한복음 19:17'], 'c_carry'],
      ['저희를 사하여 주옵소서', ['이에 예수께서 가라사대 아버지여 저희를 사하여 주옵소서 자기의 하는 것을 알지 못함이니이다 하시더라', '누가복음 23:34'], 'calvary', 'darkness',
        [['제 육시로부터 온 땅에 어두움이 임하여 제 구시까지 계속하더니', '마태복음 27:45'],
          ['예수께서 큰 소리로 불러 가라사대 아버지여 내 영혼을 아버지 손에 부탁하나이다 하고 이 말씀을 하신 후 운명하시다', '누가복음 23:46']]],
      ['살아나셨느니라', ['그가 여기 계시지 않고 그의 말씀하시던대로 살아나셨느니라 와서 그의 누우셨던 곳을 보라', '마태복음 28:6'], 'tomb', 'risen'],
    ],
    after: ['친히 나무에 달려 그 몸으로 우리 죄를 담당하셨으니 이는 우리로 죄에 대하여 죽고 의에 대하여 살게 하려 하심이라 저가 채찍에 맞음으로 너희는 나음을 얻었나니', '베드로전서 2:24'],
  },
};

// ---------- 장면 (그룹 안: +z = 길 앞쪽, +x = 길 쪽) ----------
export function christScenes(K) {
  const { M, C, mesh, bx, glowAt, fig, flowers, anims } = K;
  const glow = (c, i = 1) => M(c, 0.4, { emissive: c, emissiveIntensity: i });
  const sea = () => M(0x4f98c8, 0.15, { transparent: true, opacity: 0.8, emissive: 0x123a5a, emissiveIntensity: 0.3 });
  const pond = (g, w, d, x = -0.5, z = 0, mat = sea()) => { const p = mesh(new THREE.PlaneGeometry(w, d), mat, x, 0.03, z); p.rotation.x = -Math.PI / 2; g.add(p); return p; };
  const tree = (g, x, z, s = 1, col = 0x5f9a4a) => { g.add(mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 1.4 * s, 6), C.woodDark, x, 0.7 * s, z)); g.add(mesh(new THREE.IcosahedronGeometry(0.9 * s, 0), M(col, 1), x, 1.8 * s, z)); };
  const olive = (g, x, z) => tree(g, x, z, 0.9, 0x7f9a6a);
  const crossAt = (g, x, z, h = 3, rotZ = 0, mat = C.woodDark) => { const c = new THREE.Group(); c.add(bx(0.2, h, 0.2, mat, 0, h / 2, 0)); c.add(bx(0.18, 0.18, h * 0.5, mat, 0, h * 0.72, 0)); c.position.set(x, 0, z); c.rotation.z = rotZ; g.add(c); return c; };
  const spin = (o, sp) => anims.push((dt) => { o.rotation.y += dt * sp; });
  const bob = (o, a = 0.15, sp = 1.5) => { const y0 = o.position.y; anims.push((dt, t) => { o.position.y = y0 + Math.sin(t * sp + o.position.x) * a; }); };
  return {
    // ----- 천지창조 -----
    c_void(g) {
      const d = mesh(new THREE.CircleGeometry(2.6, 30), M(0x10141c, 1), -0.6, 0.03, 0); d.rotation.x = -Math.PI / 2; g.add(d);
      const w = pond(g, 4.2, 4.2, -0.6, 0, M(0x1a2a3a, 0.1, { transparent: true, opacity: 0.85 })); w.position.y = 0.05;
      const mist = glowAt(g, 0xc8d8ff, 3, -0.6, 0.8, 0, 0.35); // 수면 위에 운행하시는 하나님의 신
      anims.push((dt, t) => { mist.position.x = -0.6 + Math.sin(t * 0.5) * 1.2; mist.position.z = Math.cos(t * 0.4) * 1.2; mist.material.opacity = 0.25 + Math.sin(t) * 0.1; });
    },
    c_light(g) {
      const sun = mesh(new THREE.SphereGeometry(0.7, 20, 14), glow(0xfff6d8, 1.6), -0.6, 2.4, 0); g.add(sun);
      glowAt(g, 0xfff0c0, 5, -0.6, 2.4, 0, 0.9);
      for (let k = 0; k < 8; k++) { const r = bx(0.08, 0.08, 2.4, glow(0xfff2c0, 1.2), -0.6, 2.4, 0); r.rotation.set(k * 0.4, k * 0.8, 0); g.add(r); spin(r, 0.3); }
    },
    c_sky(g) {
      pond(g, 4, 3, -0.6, 0);
      const cm = M(0xffffff, 0.9, { emissive: 0xffffff, emissiveIntensity: 0.2 });
      for (let k = 0; k < 6; k++) { const c = mesh(new THREE.SphereGeometry(0.5 + (k % 3) * 0.2, 10, 8), cm, -1.6 + k * 0.45, 3.4 + (k % 2) * 0.3, Math.sin(k * 2) * 0.8); g.add(c); bob(c, 0.1, 0.7); }
      g.add(mesh(new THREE.TorusGeometry(1.6, 0.04, 6, 40, Math.PI), glow(0xbfe4ff, 0.6), -0.6, 1.6, 0)); // 궁창
    },
    c_land(g) {
      pond(g, 2.2, 4, 0.5, 0);
      const hill = mesh(new THREE.SphereGeometry(1.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x7aa85a, 1), -1.4, 0, 0); hill.scale.y = 0.5; g.add(hill);
      tree(g, -1.6, -0.9, 0.8, 0x6aa84a); tree(g, -1.2, 1, 0.7, 0x8ac060);
      flowers(g, -1.2, 0, 1.6, 14);
    },
    c_lights(g) {
      const sun = mesh(new THREE.SphereGeometry(0.6, 16, 12), glow(0xffc850, 1.4), -1.4, 3, -1); g.add(sun); glowAt(g, 0xffd070, 3, -1.4, 3, -1, 0.8);
      const moon = mesh(new THREE.SphereGeometry(0.35, 14, 10), glow(0xe8eef8, 0.7), -0.6, 2.6, 1.2); g.add(moon);
      for (let k = 0; k < 10; k++) { const s = glowAt(g, 0xffffff, 0.5, -2 + Math.random() * 3, 2 + Math.random() * 2.5, -1.8 + Math.random() * 3.6, 0.9); anims.push((dt, t) => { s.material.opacity = 0.5 + Math.sin(t * 3 + k) * 0.4; }); }
    },
    c_life(g) {
      pond(g, 3.6, 3, -0.6, 0);
      for (let k = 0; k < 4; k++) {
        const f = new THREE.Group(); const b = mesh(new THREE.SphereGeometry(0.16, 10, 8), M([0xf08a40, 0x6ac0e0, 0xf0d040, 0xe06a8a][k], 0.5)); b.scale.set(1, 0.6, 1.8); f.add(b);
        const tail = mesh(new THREE.ConeGeometry(0.12, 0.2, 4), b.material, 0, 0, -0.32); tail.rotation.x = -Math.PI / 2; f.add(tail); g.add(f);
        anims.push((dt, t) => { const a = t * 0.6 + k * 1.6; f.position.set(-0.6 + Math.cos(a) * 1.1, 0.12 + Math.abs(Math.sin(t * 2 + k)) * 0.15, Math.sin(a) * 1.0); f.rotation.y = -a; });
      }
      for (let k = 0; k < 3; k++) {
        const bird = new THREE.Group(); const wl = [];
        for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(0.45, 0.16), M(0xffffff, 0.7, { side: THREE.DoubleSide })); w.rotation.x = -Math.PI / 2; w.position.x = s * 0.24; bird.add(w); wl.push([w, s]); }
        g.add(bird);
        anims.push((dt, t) => { const a = -t * 0.5 + k * 2.1; bird.position.set(-0.6 + Math.cos(a) * 2, 3 + Math.sin(t + k) * 0.3, Math.sin(a) * 2); bird.rotation.y = -a + Math.PI; wl.forEach(([w, s]) => { w.rotation.z = s * Math.sin(t * 9 + k) * 0.6; }); });
      }
    },
    c_man(g) {
      flowers(g, -0.8, 0, 2.2, 20); tree(g, -2, -1.2, 0.9, 0x6aa84a); tree(g, -2.1, 1.3, 0.8, 0x8ac060);
      fig(g, 0xd8c8a8, -0.6, -0.45, 1.6); fig(g, 0xe8d0b8, -0.6, 0.45, 1.5);
      glowAt(g, 0xfff4d0, 2.2, -0.6, 2.6, 0, 0.4);
    },
    c_good(g) {
      const cols = [0xe85a5a, 0xf0a040, 0xf0e050, 0x6ac46a, 0x5aa0e0, 0x8a6ad8];
      cols.forEach((c, i) => g.add(mesh(new THREE.TorusGeometry(2.4 - i * 0.14, 0.07, 6, 40, Math.PI), glow(c, 0.5), -0.8, 0, 0))); // 무지개 빛 아치
      flowers(g, -0.8, 0, 2.2, 26);
      for (let k = 0; k < 3; k++) g.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), M(0xffffff, 0.9), -1.4 + k * 0.5, 0.3, -1 + k)); // 양
    },
    c_rest(g) {
      g.add(bx(0.6, 0.12, 2.6, C.wood, -0.6, 0.45, 0)); for (const z of [-1.1, 1.1]) g.add(bx(0.5, 0.45, 0.1, C.woodDark, -0.6, 0.22, z));
      flowers(g, -0.6, 0, 2.6, 22, 0xffffff);
      const seven = mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 7), glow(0xfff0b0, 1.2), -1.4, 2.4, 0); seven.rotation.y = Math.PI / 2; g.add(seven); spin(seven, 0.3);
      glowAt(g, 0xfff4d0, 4, -1.2, 2.4, 0, 0.5);
    },
    // ----- 신성 -----
    c_word(g) {
      g.add(bx(0.8, 0.9, 0.8, C.stone, -0.6, 0.45, 0));
      for (const s of [-1, 1]) { const p = bx(0.9, 0.06, 0.7, M(0xfaf4e4, 0.8), -0.6, 1.0, s * 0.36); p.rotation.x = s * -0.12; g.add(p); }
      const l = glowAt(g, 0xfff2c0, 2.6, -0.6, 1.6, 0, 0.7); anims.push((dt, t) => { l.material.opacity = 0.55 + Math.sin(t * 1.5) * 0.15; });
    },
    c_cosmos(g) {
      const core = mesh(new THREE.SphereGeometry(0.4, 16, 12), glow(0xfff0c0, 1.5), -0.8, 2, 0); g.add(core);
      [[0.9, 0x6ab0e0, 0.18], [1.5, 0x8ac06a, 0.24], [2.1, 0xe0a060, 0.2]].forEach(([r, c, s], i) => {
        const ring = new THREE.Group(); ring.position.set(-0.8, 2, 0); ring.rotation.x = 0.4 + i * 0.3; g.add(ring);
        ring.add(mesh(new THREE.TorusGeometry(r, 0.015, 4, 48), glow(0xffffff, 0.4)));
        const p = mesh(new THREE.SphereGeometry(s, 12, 8), M(c, 0.6), r, 0, 0); ring.add(p);
        anims.push((dt) => { ring.rotation.z += dt * (0.6 - i * 0.15); });
      });
    },
    c_iam(g) {
      const pil = mesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 16, 1, true), M(0xfff4d0, 0.3, { transparent: true, opacity: 0.35, emissive: 0xfff0c0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), -0.8, 2.5, 0);
      pil.castShadow = false; g.add(pil); glowAt(g, 0xfff0c0, 3, -0.8, 1.2, 0, 0.6);
      fig(g, 0x8a7a5a, 1.0, 1.2, 1.5); // 아브라함
      g.add(mesh(new THREE.ConeGeometry(0.9, 1.1, 4), M(0xc8a878, 1), 1.2, 0.55, -1.4)); // 장막
    },
    c_one(g) {
      for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.8, 0.09, 10, 36), glow(0xf6e08a, 0.8), -0.8, 2, s * 0.45); r.rotation.y = s * 0.5; g.add(r); spin(r, s * 0.4); }
      glowAt(g, 0xfff4d0, 2.4, -0.8, 2, 0, 0.6);
    },
    c_storm(g) {
      pond(g, 4.4, 4, -0.8, 0);
      const boat = new THREE.Group(); boat.position.set(-0.8, 0.15, 0);
      boat.add(bx(0.9, 0.35, 2.4, C.wood)); boat.add(bx(0.06, 1.8, 0.06, C.woodDark, 0, 1, 0));
      g.add(boat);
      const fg = new THREE.Group(); fg.position.set(-0.8, 0.3, 0.7); g.add(fg); fig(fg, 0xf4f0e6, 0, 0, 1.5);
      anims.push((dt, t) => { boat.rotation.z = Math.sin(t * 0.8) * 0.04; });
    },
    c_mat(g) {
      g.add(bx(0.8, 0.12, 1.8, M(0xc8b08a, 1), -0.8, 0.06, 0.4));
      fig(g, 0x9a8a70, -0.8, -0.6, 1.5); fig(g, 0xf4f0e6, 0.4, 0.4, 1.6);
      glowAt(g, 0xfff0c0, 1.6, -0.8, 1.4, -0.6, 0.5);
    },
    c_transfig(g) {
      const m = mesh(new THREE.ConeGeometry(2.4, 2.2, 10), M(0x9aaa80, 1), -1.4, 1.1, 0); g.add(m);
      const f = new THREE.Group(); f.position.set(-1.4, 2.2, 0); g.add(f); fig(f, 0xffffff, 0, 0, 1.4);
      glowAt(g, 0xffffff, 3.4, -1.4, 3, 0, 0.8);
      const cl = mesh(new THREE.SphereGeometry(1.2, 12, 8), M(0xffffff, 0.9, { transparent: true, opacity: 0.4, emissive: 0xffffff, emissiveIntensity: 0.5, depthWrite: false }), -1.4, 4.4, 0); cl.scale.y = 0.4; g.add(cl); bob(cl, 0.2, 0.6);
    },
    c_thomas(g) {
      fig(g, 0xf4f0e6, -0.9, 0, 1.6);
      const k = new THREE.Group(); k.position.set(0.3, -0.35, 0); g.add(k); fig(k, 0x7a6a8a, 0, 0, 1.3); // 무릎 꿇은 도마
      glowAt(g, 0xfff0c0, 1.2, -0.7, 1.1, 0.2, 0.7);
    },
    c_throne(g) {
      for (let k = 0; k < 3; k++) g.add(bx(2.2 - k * 0.5, 0.25, 2.2 - k * 0.5, C.white, -1, 0.12 + k * 0.25, 0));
      g.add(bx(0.8, 1.4, 0.9, C.gold, -1.2, 1.4, 0)); g.add(bx(0.2, 1.6, 0.9, C.gold, -1.6, 1.6, 0));
      glowAt(g, 0xfff4c0, 4.5, -1.2, 2.2, 0, 0.85);
    },
    // ----- 인성 -----
    c_descend(g) {
      const beam = mesh(new THREE.CylinderGeometry(0.15, 0.9, 6, 14, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0.25, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), -0.7, 3, 0);
      beam.castShadow = false; g.add(beam);
      const orb = glowAt(g, 0xfff0c0, 1.2, -0.7, 5, 0, 0.9);
      anims.push((dt, t) => { orb.position.y = 0.6 + ((t * 0.6) % 5); orb.material.opacity = 0.9 - ((t * 0.6) % 5) * 0.05; });
      fig(g, 0xd8c0a0, -0.7, 0, 0.9); // 작은 아기 모습
    },
    c_grow(g) {
      [0.7, 1.0, 1.3, 1.6].forEach((h, i) => fig(g, 0xc8a878, -1.6 + i * 0.6, -0.6 + i * 0.4, h));
      g.add(bx(0.1, 2.2, 0.3, C.wood, -0.4, 1.1, 1.4));
      for (let k = 0; k < 5; k++) g.add(bx(0.12, 0.03, 0.34, C.woodDark, -0.4, 0.4 + k * 0.35, 1.4));
    },
    c_carpenter(g) {
      g.add(bx(0.8, 0.8, 2, C.wood, -0.8, 0.4, 0));
      for (let k = 0; k < 4; k++) { const p = bx(0.24, 0.08, 1.6, C.wood, -1.8, 0.05 + k * 0.08, -0.4 + (k % 2) * 0.1); g.add(p); }
      const hammer = new THREE.Group(); hammer.add(bx(0.05, 0.05, 0.36, C.woodDark, 0, 0, 0)); hammer.add(bx(0.08, 0.1, 0.14, C.grey, 0, 0, 0.18)); hammer.position.set(-0.8, 0.84, 0.4); g.add(hammer);
      fig(g, 0xb89a70, 0.2, -0.6, 1.6);
    },
    c_desert(g) {
      const sand = M(0xd8bc84, 1);
      const d = mesh(new THREE.CircleGeometry(2.6, 24), sand, -0.8, 0.03, 0); d.rotation.x = -Math.PI / 2; g.add(d);
      for (let k = 0; k < 7; k++) { const r = mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.15, 0), C.grey, -1.6 + Math.random() * 1.8, 0.12, -1.6 + Math.random() * 3.2); g.add(r); }
      const k2 = new THREE.Group(); k2.position.set(-0.8, -0.3, 0); g.add(k2); fig(k2, 0xc8b090, 0, 0, 1.4);
    },
    c_well(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.8, 16, 1, true), C.stone, -0.9, 0.4, 0));
      const w = mesh(new THREE.CircleGeometry(0.7, 16), sea(), -0.9, 0.5, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      const s = new THREE.Group(); s.position.set(-0.2, -0.35, 0.9); g.add(s); fig(s, 0xf4f0e6, 0, 0, 1.5);
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.4, 10), M(0xb87a4a, 0.9), -1.6, 0.2, 0.8)); // 물동이
      glowAt(g, 0xffe0a0, 3, -0.9, 4, -1, 0.6); // 정오의 해
    },
    c_sleep(g) {
      pond(g, 4, 3.6, -0.8, 0);
      g.add(bx(1, 0.4, 2.6, C.wood, -0.8, 0.2, 0));
      g.add(bx(0.4, 0.14, 0.3, M(0xe8e0d0, 1), -0.8, 0.5, -0.9)); // 베개
      const f = new THREE.Group(); f.position.set(-0.8, 0.45, -0.5); f.rotation.x = Math.PI / 2; g.add(f); fig(f, 0xf4f0e6, 0, 0, 1.4);
    },
    c_tears(g) {
      const rock = mesh(new THREE.SphereGeometry(1.5, 12, 8), C.grey, -1.6, 0.8, 0); rock.scale.set(1, 0.8, 1.1); g.add(rock);
      { const st = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16), C.stone, -0.5, 0.6, 1.1); st.rotation.x = Math.PI / 2; g.add(st); } // 굴려 놓은 돌
      fig(g, 0xf4f0e6, 0.4, 0, 1.6); fig(g, 0x8a6a8a, 0.8, 1.0, 1.45); fig(g, 0x6a8aa0, 0.8, -1.0, 1.45);
      for (let k = 0; k < 2; k++) { const d = glowAt(g, 0xbfe4ff, 0.25, 0.55, 1.3, -0.08 + k * 0.16, 0.9); anims.push((dt, t) => { d.position.y = 1.35 - ((t * 0.4 + k * 0.5) % 1) * 0.6; }); }
    },
    c_priest(g) {
      g.add(bx(1, 0.9, 1, C.gold, -1, 0.45, 0)); // 향단
      const smoke = glowAt(g, 0xffffff, 1.4, -1, 1.4, 0, 0.4); anims.push((dt, t) => { smoke.position.y = 1.2 + Math.sin(t) * 0.2; });
      fig(g, 0xf0ecd8, 0.1, 0, 1.6, (f) => { f.add(bx(0.4, 0.3, 0.06, C.gold, 0, 1.0, 0.25)); }); // 흉패
    },
    // ----- 사랑 -----
    c_heart(g) {
      const h = new THREE.Group(); h.position.set(-0.8, 2, 0); g.add(h);
      const m = glow(0xf06a80, 0.8);
      for (const s of [-1, 1]) h.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), m, 0, 0.2, s * 0.35));
      const c = mesh(new THREE.ConeGeometry(0.72, 1.1, 16), m, 0, -0.45, 0); c.rotation.x = Math.PI; h.add(c);
      spin(h, 0.5); bob(h, 0.15, 1.2); glowAt(g, 0xffb0c0, 3, -0.8, 2, 0, 0.5);
    },
    c_children(g) {
      fig(g, 0xf4f0e6, -1.2, 0, 1.6);
      [[-0.2, -0.9, 0xf0a0a0], [0.1, 0, 0x90c0f0], [-0.2, 0.9, 0xf0d070], [-0.9, 1.1, 0xa0e0a0]].forEach(([x, z, c]) => fig(g, c, x, z, 0.9));
      flowers(g, -0.6, 0, 2, 14);
    },
    c_touch(g) {
      fig(g, 0xf4f0e6, -1.1, -0.35, 1.6, (f) => { const a = bx(0.08, 0.08, 0.6, C.white, 0.15, 1.0, 0.35); a.rotation.y = -0.6; f.add(a); });
      const k = new THREE.Group(); k.position.set(-0.6, -0.3, 0.6); g.add(k); fig(k, 0x9a9a8a, 0, 0, 1.3);
      glowAt(g, 0xfff0c0, 1, -0.75, 1.1, 0.35, 0.8);
    },
    c_flock(g) {
      fig(g, 0xf4f0e6, -1.6, 0, 1.6, (f) => { f.add(bx(0.05, 1.7, 0.05, C.woodDark, 0.3, 0.85, 0)); });
      for (let k = 0; k < 7; k++) { const s = mesh(new THREE.SphereGeometry(0.28, 10, 8), M(0xf4f0e8, 1), -1.2 + Math.random() * 2, 0.3, -1.6 + Math.random() * 3.2); s.scale.set(1, 0.85, 1.3); g.add(s); }
    },
    c_sycamore(g) {
      tree(g, -1.2, 0, 1.6, 0x6a9a4a);
      const z = new THREE.Group(); z.position.set(-1.0, 1.9, 0.5); g.add(z); fig(z, 0x8a7ab0, 0, 0, 1.0); // 나무 위의 삭개오
      fig(g, 0xf4f0e6, 0.2, 0.6, 1.6);
    },
    c_stones(g) {
      for (let k = 0; k < 6; k++) g.add(mesh(new THREE.DodecahedronGeometry(0.16, 0), C.grey, -1.6 + Math.random() * 1.6, 0.12, -1.2 + Math.random() * 2.4));
      fig(g, 0xf4f0e6, -0.4, -0.5, 1.6);
      const w = new THREE.Group(); w.position.set(-1.2, -0.25, 0.5); g.add(w); fig(w, 0xc06a6a, 0, 0, 1.4);
      for (let k = 0; k < 6; k++) { const l = bx(0.5, 0.02, 0.04, C.woodDark, -0.2 + (k % 3) * 0.2, 0.03, 0.4 + Math.floor(k / 3) * 0.2); l.rotation.y = k; g.add(l); } // 땅에 쓰신 글
    },
    c_basin(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.3, 18), C.stone, -0.6, 0.15, 0));
      const w = mesh(new THREE.CircleGeometry(0.5, 16), sea(), -0.6, 0.31, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      g.add(bx(0.06, 0.04, 0.9, M(0xffffff, 0.9), -0.2, 0.4, 0.2));
      const k = new THREE.Group(); k.position.set(-0.6, -0.4, -0.8); g.add(k); fig(k, 0xf4f0e6, 0, 0, 1.4);
      fig(g, 0x7a8aa0, -1.3, 0.6, 1.5);
      g.add(bx(0.7, 0.5, 3, C.wood, -2.2, 0.25, 0)); // 만찬상
    },
    c_friends(g) {
      crossAt(g, -1.2, 0, 3.2);
      [-1, 1].forEach((s) => fig(g, s > 0 ? 0x8aa0c8 : 0xc8a08a, 0, s * 0.8, 1.5));
      glowAt(g, 0xffd0d8, 2.6, -1.2, 2.6, 0, 0.5);
    },
    c_bond(g) {
      const ring = new THREE.Group(); ring.position.set(-0.8, 0, 0); g.add(ring);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const f = new THREE.Group(); f.position.set(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6); ring.add(f); fig(f, [0xf0a0a0, 0x90c0f0, 0xf0d070, 0xa0e0a0][k % 4], 0, 0, 1.3); }
      const heart = mesh(new THREE.SphereGeometry(0.5, 14, 10), glow(0xf06a80, 1), -0.8, 1.8, 0); g.add(heart); bob(heart);
      glowAt(g, 0xffc0cc, 4, -0.8, 1.8, 0, 0.6);
    },
    // ----- 순종 -----
    c_stairs(g) {
      for (let k = 0; k < 8; k++) g.add(bx(1, 0.12, 0.6, glow(0xe8eefc, 0.3 + k * 0.08), -1 - k * 0.15, 0.3 + k * 0.5, -1.6 + k * 0.4));
      glowAt(g, 0xfff4d0, 3, -2.1, 4.2, 1.2, 0.7);
    },
    c_home(g) {
      g.add(bx(2, 1.6, 2, M(0xd8c4a0, 1), -1.4, 0.8, 0)); g.add(bx(2.2, 0.15, 2.2, C.wood, -1.4, 1.65, 0));
      g.add(bx(0.06, 0.9, 0.6, C.woodDark, -0.38, 0.45, 0));
      fig(g, 0x7a90b8, 0, -0.5, 1.5); fig(g, 0xc8a878, 0, 0.4, 1.2);
    },
    c_bread(g) {
      g.add(bx(1, 0.7, 1.8, C.wood, -0.8, 0.35, 0));
      for (let k = 0; k < 3; k++) { const b = mesh(new THREE.SphereGeometry(0.2, 10, 8), M(0xd8a060, 0.8), -0.8, 0.8, -0.5 + k * 0.5); b.scale.set(1, 0.6, 1.4); g.add(b); }
      glowAt(g, 0xfff0c0, 1.6, -0.8, 1.4, 0, 0.5);
    },
    c_steps(g) {
      for (let k = 0; k < 6; k++) { const s = mesh(new THREE.CircleGeometry(0.16, 10), glow(0xfff0c0, 0.8), -0.6 + (k % 2) * 0.3, 0.04, -1.8 + k * 0.6); s.rotation.x = -Math.PI / 2; g.add(s); }
      fig(g, 0xf4f0e6, -0.4, 1.8, 1.6); glowAt(g, 0xfff4d0, 2, -0.4, 2.6, 1.8, 0.5);
    },
    c_olive(g) {
      olive(g, -1.8, -1.2); olive(g, -2, 1); olive(g, -0.4, -1.8);
      const r = mesh(new THREE.DodecahedronGeometry(0.6, 0), C.grey, -0.9, 0.35, 0); r.scale.y = 0.6; g.add(r);
      const k = new THREE.Group(); k.position.set(-0.3, -0.35, 0); k.rotation.y = -Math.PI / 2; g.add(k); fig(k, 0xf4f0e6, 0, 0, 1.4);
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.2, 10), C.gold, -0.9, 0.75, 0)); // 잔
      glowAt(g, 0xc8d8ff, 2, -0.9, 3, 0, 0.4);
    },
    c_fountain(g) {
      g.add(mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.4, 20), C.stone, -1, 0.2, 0));
      const w = mesh(new THREE.CircleGeometry(1.1, 20), sea(), -1, 0.41, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 10), C.stone, -1, 1, 0));
      const jet = glowAt(g, 0xbfe4ff, 1.4, -1, 1.7, 0, 0.8); bob(jet, 0.1, 3);
    },
    c_exalt(g) {
      for (let k = 0; k < 4; k++) g.add(bx(2.6 - k * 0.5, 0.25, 2.6 - k * 0.5, C.white, -1.2, 0.12 + k * 0.25, 0));
      const crown = new THREE.Group(); crown.position.set(-1.2, 2.4, 0); g.add(crown);
      crown.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16, 1, true), C.gold));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; crown.add(mesh(new THREE.ConeGeometry(0.09, 0.3, 6), C.gold, Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.5)); }
      spin(crown, 0.5); bob(crown, 0.12, 1); glowAt(g, 0xfff0c0, 4, -1.2, 2.4, 0, 0.8);
      for (let k = 0; k < 4; k++) { const f = new THREE.Group(); f.position.set(0.2, -0.3, -1.5 + k); g.add(f); fig(f, [0xc8a08a, 0x8aa0c8, 0xa0c08a, 0xc0a0c8][k], 0, 0, 1.3); } // 무릎 꿇은 사람들
    },
    // ----- 고난 -----
    c_palms(g) {
      for (let k = 0; k < 6; k++) { const l = bx(0.3, 0.03, 1.4, C.leaf, -0.4 + (k % 2) * 0.3, 0.04, -2 + k * 0.8); l.rotation.y = (k % 2 ? 0.4 : -0.4); g.add(l); }
      const donkey = new THREE.Group(); donkey.position.set(-1.2, 0, 0); g.add(donkey);
      donkey.add(bx(0.4, 0.45, 0.9, M(0x8a7a6a, 1), 0, 0.75, 0)); donkey.add(bx(0.22, 0.3, 0.4, M(0x8a7a6a, 1), 0, 1.05, 0.55));
      for (const [x, z] of [[-0.14, -0.3], [0.14, -0.3], [-0.14, 0.3], [0.14, 0.3]]) donkey.add(bx(0.08, 0.55, 0.08, M(0x6a5a4a, 1), x, 0.27, z));
      fig(g, 0x8ab06a, -2.1, -0.8, 1.5); fig(g, 0xb08a6a, -2.1, 0.8, 1.5);
    },
    c_supper(g) {
      g.add(bx(0.9, 0.7, 3.4, C.wood, -0.9, 0.35, 0));
      for (let k = 0; k < 3; k++) g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0xd8a060, 0.8), -0.9, 0.78, -1 + k));
      g.add(mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.24, 10), C.gold, -0.9, 0.82, 0.5));
      for (let k = 0; k < 4; k++) fig(g, [0x8aa0c8, 0xc8a08a, 0xa0c08a, 0xc0a0c8][k], -1.8, -1.2 + k * 0.8, 1.4);
      glowAt(g, 0xffd090, 1.4, -0.9, 1.4, 0.5, 0.6);
    },
    c_torches(g) {
      fig(g, 0xf4f0e6, -0.3, -0.4, 1.6); fig(g, 0x8a6a3a, -0.3, 0.3, 1.55); // 유다
      for (let k = 0; k < 3; k++) { const x = -1.6, z = -1.2 + k * 1.2; fig(g, 0x5a5a5a, x, z, 1.5); g.add(bx(0.05, 0.6, 0.05, C.woodDark, x + 0.3, 1.3, z)); const f = glowAt(g, 0xff9a40, 0.7, x + 0.3, 1.7, z, 0.9); anims.push((dt, t) => { f.material.opacity = 0.7 + Math.sin(t * 11 + k) * 0.2; }); }
    },
    c_rooster(g) {
      const fire = glowAt(g, 0xff9a40, 1.2, -1, 0.4, 0, 0.9); anims.push((dt, t) => { fire.material.opacity = 0.7 + Math.sin(t * 9) * 0.2; });
      for (let k = 0; k < 4; k++) { const l = bx(0.1, 0.1, 0.7, C.woodDark, -1, 0.06, 0); l.rotation.y = k * 0.8; g.add(l); }
      const r = new THREE.Group(); r.position.set(-1.9, 1.1, 1.2); g.add(r);
      r.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), M(0xc85a3a, 0.8))); r.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M(0xc85a3a, 0.8), 0, 0.18, 0.12)); r.add(bx(0.04, 0.1, 0.06, M(0xe03030, 0.8), 0, 0.3, 0.12));
      g.add(bx(0.1, 1, 0.1, C.woodDark, -1.9, 0.5, 1.2));
      const p = new THREE.Group(); p.position.set(-0.2, -0.3, -0.6); g.add(p); fig(p, 0x6a7a9a, 0, 0, 1.4); // 통곡하는 베드로
    },
    c_thorns(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.35, 0.4, 1, 12), C.stone, -0.8, 0.5, 0));
      const crown = mesh(new THREE.TorusGeometry(0.32, 0.06, 6, 20), M(0x6a5030, 1), -0.8, 1.05, 0); crown.rotation.x = Math.PI / 2; g.add(crown);
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; const s = mesh(new THREE.ConeGeometry(0.025, 0.16, 4), M(0x5a4020, 1), -0.8 + Math.cos(a) * 0.32, 1.08, Math.sin(a) * 0.32); s.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); g.add(s); }
      g.add(bx(0.06, 0.02, 0.9, M(0x7a3a8a, 0.8), -0.8, 1.01, 0.6)); // 자색 옷 자락
    },
    c_carry(g) {
      crossAt(g, -0.6, 0, 3, 0.9);
      const f = new THREE.Group(); f.position.set(-0.2, 0, -0.4); f.rotation.x = 0.25; g.add(f); fig(f, 0xd8d0c0, 0, 0, 1.5);
      for (let k = 0; k < 6; k++) g.add(mesh(new THREE.DodecahedronGeometry(0.14, 0), C.grey, -1.6 + Math.random() * 2, 0.1, -2 + Math.random() * 4));
    },
  };
}

// ---------- 들어설 때 효과 ----------
export function christEffects(K) {
  const { hit, sfx, shot } = K;
  // 어두움이 임하여 (마 27:45): 화면이 잠시 어두워졌다가 밝아짐
  const dark = document.createElement('div');
  dark.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;background:#05040a;transition:opacity 1.6s';
  document.body.appendChild(dark);
  return {
    lightburst(st) { K.flash(1); sfx('orb', 0.3, 1.3); shot(st.g.position, { dist: 12, el: 0.25, side: 0.5, dur: 5, mid: 0.6, y: 2.4 }); },
    darkness() {
      dark.style.opacity = '0.78'; hit('impactSoft_heavy_000', 0.4, 0.4);
      setTimeout(() => { dark.style.opacity = '0'; }, 5000);
    },
  };
}
