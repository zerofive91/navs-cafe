// 숲속 새 코스 여섯 갈래 (정거장 말씀은 개역한글 1961)
//   출애굽: 떨기나무 → 재앙·유월절 → 홍해가 갈라짐 → 광야 40년(만나·반석의 물·시내산·성막·놋뱀) → 요단 → 여리고 → 가나안
//   전신갑주 훈련: 한 조각씩 입고 훈련 (불화살 막기·말씀의 검·복음의 신으로 달리기)
//   요한계시록, 지혜의 길(잠언·전도서), 성령의 열매(따서 모으기), 믿음의 길(히브리서 11장)
// 정거장 모양: [이름, 말씀, 장면, 들어설 때, 이어지는 말씀들]  (courses.js와 같음)
import * as THREE from 'three';

export const NEW_COURSES = {
  exodus: {
    name: '출애굽의 길', color: 0xf0c890,
    st: [
      ['불타는 떨기나무', ['하나님이 가라사대 이리로 가까이 하지 말라 너의 선 곳은 거룩한 땅이니 네 발에서 신을 벗으라', '출애굽기 3:5'], 'bush', null,
        [['하나님이 모세에게 이르시되 나는 스스로 있는 자니라', '출애굽기 3:14']]],
      ['바로 앞에서', ['이스라엘 하나님 여호와의 말씀에 내 백성을 보내라 그들이 광야에서 내 앞에 절기를 지킬 것이니라 하셨나이다', '출애굽기 5:1'], 'pharaoh'],
      ['열 가지 재앙', ['내가 내 손을 애굽 위에 펴서 이스라엘 자손을 그 땅에서 인도하여 낼 때에야 애굽 사람이 나를 여호와인줄 알리라', '출애굽기 7:5'], 'plagues', 'hail'],
      ['유월절 어린 양', ['내가 피를 볼 때에 너희를 넘어가리니 재앙이 너희에게 내려 멸하지 아니하리라', '출애굽기 12:13'], 'passover'],
      ['홍해', ['너희는 두려워 말고 가만히 서서 여호와께서 오늘날 너희를 위하여 행하시는 구원을 보라', '출애굽기 14:13'], 'redsea', null,
        [['여호와께서 너희를 위하여 싸우시리니 너희는 가만히 있을지니라', '출애굽기 14:14'],
          ['이스라엘 자손이 바다 가운데 육지로 행하고 물은 그들의 좌우에 벽이 되니', '출애굽기 14:22']]],
      ['미리암의 노래', ['여호와는 나의 힘이요 노래시며 나의 구원이시로다', '출애굽기 15:2'], 'timbrel', 'joy'],
      ['마라의 쓴 물', ['여호와께서 그에게 한 나무를 지시하시니 그가 물에 던지매 물이 달아졌더라', '출애굽기 15:25'], 'marah', 'sweet',
        [['나는 너희를 치료하는 여호와임이니라', '출애굽기 15:26']]],
      ['하늘에서 내린 만나', ['보라 내가 너희를 위하여 하늘에서 양식을 비 같이 내리리니 백성이 나가서 일용할 것을 날마다 거둘 것이라', '출애굽기 16:4'], 'manna'],
      ['반석에서 나온 물', ['너는 반석을 치라 그것에서 물이 나리니 백성이 마시리라', '출애굽기 17:6'], 'rockWater'],
      ['시내산', ['나는 너를 애굽 땅, 종 되었던 집에서 인도하여 낸 너의 하나님 여호와로라 너는 나 외에는 다른 신들을 네게 있게 말찌니라', '출애굽기 20:2-3'], 'tablets', 'thunder2',
        [['이스라엘아 들으라 우리 하나님 여호와는 오직 하나인 여호와시니 너는 마음을 다하고 성품을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라', '신명기 6:4-5']]],
      ['금송아지', ['누구든지 여호와의 편에 있는 자는 내게로 나아오라', '출애굽기 32:26'], 'calf'],
      ['성막', ['내가 그들 중에 거할 성소를 그들을 시켜 나를 위하여 짓되', '출애굽기 25:8'], 'tabernacle', null,
        [['그 후에 구름이 회막에 덮이고 여호와의 영광이 성막에 충만하매', '출애굽기 40:34']]],
      ['구름 기둥 불 기둥', ['여호와께서 그들 앞에 행하사 낮에는 구름 기둥으로 그들의 길을 인도하시고 밤에는 불 기둥으로 그들에게 비취사 주야로 진행하게 하시니', '출애굽기 13:21'], 'pillars'],
      ['놋뱀', ['불뱀을 만들어 장대 위에 달라 물린 자마다 그것을 보면 살리라', '민수기 21:8'], 'serpent', 'lookup',
        [['모세가 놋뱀을 만들어 장대 위에 다니 뱀에게 물린 자마다 놋뱀을 쳐다본즉 살더라', '민수기 21:9']]],
      ['광야 사십 년', ['네 하나님 여호와께서 이 사십년 동안에 너로 광야의 길을 걷게 하신 것을 기억하라', '신명기 8:2'], 'tents', null,
        [['사람이 떡으로만 사는 것이 아니요 여호와의 입에서 나오는 모든 말씀으로 사는 줄을 너로 알게하려 하심이니라', '신명기 8:3'],
          ['이 사십년 동안에 네 의복이 해어지지 아니하였고 네 발이 부릍지 아니하였느니라', '신명기 8:4']]],
      ['요단 강', ['여호와의 언약궤를 멘 제사장들은 요단 가운데 마른 땅에 굳게 섰고 온 이스라엘 백성은 마른 땅으로 행하여 요단을 건너니라', '여호수아 3:17'], 'jordanDry', null,
        [['마음을 강하게 하고 담대히 하라 두려워 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라', '여호수아 1:9']]],
      ['여리고', ['백성이 나팔 소리를 듣는 동시에 크게 소리질러 외치니 성벽이 무너져 내린지라', '여호수아 6:20'], 'jerichoWall', 'walls'],
      ['젖과 꿀이 흐르는 땅', ['여호와께서 우리를 기뻐하시면 우리를 그 땅으로 인도하여 들이시고 그 땅을 우리에게 주시리라 이는 과연 젖과 꿀이 흐르는 땅이니라', '민수기 14:8'], 'canaan', 'arrive',
        [['여호와께서 이스라엘 족속에게 말씀하신 선한 일이 하나도 남음이 없이 다 응하였더라', '여호수아 21:45']]],
    ],
    after: ['오직 나와 내 집은 여호와를 섬기겠노라', '여호수아 24:15'],
  },
  armor: {
    name: '전신갑주 훈련', color: 0xc8d4e8,
    st: [
      ['훈련소', ['종말로 너희가 주 안에서와 그 힘의 능력으로 강건하여지고', '에베소서 6:10'], 'camp2', 'enlist',
        [['우리의 씨름은 혈과 육에 대한 것이 아니요 정사와 권세와 이 어두움의 세상 주관자들과 하늘에 있는 악의 영들에게 대함이라', '에베소서 6:12']]],
      ['진리의 허리띠', ['그런즉 서서 진리로 너희 허리 띠를 띠고', '에베소서 6:14'], 'rack:belt', null, [['아버지의 말씀은 진리니이다', '요한복음 17:17']]],
      ['의의 흉배', ['의의 흉배를 붙이고', '에베소서 6:14'], 'rack:breast'],
      ['평안의 복음의 신', ['평안의 복음의 예비한 것으로 신을 신고', '에베소서 6:15'], 'rack:shoes'],
      ['믿음의 방패', ['모든 것 위에 믿음의 방패를 가지고 이로써 능히 악한 자의 모든 화전을 소멸하고', '에베소서 6:16'], 'rack:shield'],
      ['구원의 투구', ['구원의 투구와 성령의 검 곧 하나님의 말씀을 가지라', '에베소서 6:17'], 'rack:helmet', null,
        [['모든 이론을 파하며 하나님 아는 것을 대적하여 높아진 것을 다 파하고 모든 생각을 사로잡아 그리스도에게 복종케 하니', '고린도후서 10:5']]],
      ['성령의 검', ['구원의 투구와 성령의 검 곧 하나님의 말씀을 가지라', '에베소서 6:17'], 'rack:sword'],
      ['깨어 기도하라', ['모든 기도와 간구로 하되 무시로 성령 안에서 기도하고 이를 위하여 깨어 구하기를 항상 힘쓰며 여러 성도를 위하여 구하고', '에베소서 6:18'], 'watch', null,
        [['근신하라 깨어라 너희 대적 마귀가 우는 사자 같이 두루 다니며 삼킬 자를 찾나니 너희는 믿음을 굳게 하여 저를 대적하라', '베드로전서 5:8-9']]],
      ['마귀를 대적하라', ['그런즉 너희는 하나님께 순복할찌어다 마귀를 대적하라 그리하면 너희를 피하리라', '야고보서 4:7'], 'stand', 'arrive',
        [['그러나 이 모든 일에 우리를 사랑하시는 이로 말미암아 우리가 넉넉히 이기느니라', '로마서 8:37']]],
    ],
    after: ['세상을 이긴 이김은 이것이니 우리의 믿음이니라', '요한일서 5:4'],
  },
  revelation: {
    name: '요한계시록의 길', color: 0xd8c8ff,
    st: [
      ['밧모 섬', ['나 요한은 너희 형제요 예수의 환난과 나라와 참음에 동참하는 자라 하나님의 말씀과 예수의 증거를 인하여 밧모라 하는 섬에 있었더니', '요한계시록 1:9'], 'patmos'],
      ['처음과 나중', ['두려워 말라 나는 처음이요 나중이니 곧 산 자라 내가 전에 죽었었노라 볼찌어다 이제 세세토록 살아 있어 사망과 음부의 열쇠를 가졌노니', '요한계시록 1:17-18'], 'lampstands'],
      ['일곱 교회', ['그러나 너를 책망할 것이 있나니 너의 처음 사랑을 버렸느니라', '요한계시록 2:4'], 'churches', null,
        [['네가 죽도록 충성하라 그리하면 내가 생명의 면류관을 네게 주리라', '요한계시록 2:10'],
          ['볼찌어다 내가 문밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그로 더불어 먹고 그는 나로 더불어 먹으리라', '요한계시록 3:20']]],
      ['하늘 보좌', ['거룩하다 거룩하다 거룩하다 주 하나님 곧 전능하신이여 전에도 계셨고 이제도 계시고 장차 오실 자라', '요한계시록 4:8'], 'throne', null,
        [['우리 주 하나님이여 영광과 존귀와 능력을 받으시는 것이 합당하오니 주께서 만물을 지으신지라', '요한계시록 4:11']]],
      ['죽임 당하신 어린 양', ['죽임을 당하신 어린 양이 능력과 부와 지혜와 힘과 존귀와 영광과 찬송을 받으시기에 합당하도다', '요한계시록 5:12'], 'lamb', null,
        [['일찍 죽임을 당하사 각 족속과 방언과 백성과 나라 가운데서 사람들을 피로 사서 하나님께 드리시고', '요한계시록 5:9']]],
      ['일곱 인', ['내가 보매 어린 양이 일곱 인 중에 하나를 떼시는 그 때에', '요한계시록 6:1'], 'seals', 'seals'],
      ['흰 옷 입은 큰 무리', ['각 나라와 족속과 백성과 방언에서 아무라도 능히 셀 수 없는 큰 무리가 흰 옷을 입고 손에 종려 가지를 들고 보좌 앞과 어린 양 앞에 서서', '요한계시록 7:9'], 'crowd', null,
        [['큰 소리로 외쳐 가로되 구원하심이 보좌에 앉으신 우리 하나님과 어린 양에게 있도다 하니', '요한계시록 7:10']]],
      ['일곱 나팔', ['내가 보매 하나님 앞에 시위한 일곱 천사가 있어 일곱 나팔을 받았더라', '요한계시록 8:2'], 'trumpets', 'trumpets',
        [['세상 나라가 우리 주와 그 그리스도의 나라가 되어 그가 세세토록 왕노릇 하시리로다', '요한계시록 11:15']]],
      ['어린 양의 피로 이김', ['또 여러 형제가 어린 양의 피와 자기의 증거하는 말을 인하여 저를 이기었으니', '요한계시록 12:11'], 'dragon'],
      ['할렐루야', ['할렐루야 주 우리 하나님 곧 전능하신 이가 통치하시도다', '요한계시록 19:6'], 'hallelujah', 'joy',
        [['그 옷과 그 다리에 이름 쓴 것이 있으니 만왕의 왕이요 만주의 주라 하였더라', '요한계시록 19:16']]],
      ['생명책', ['책들이 펴 있고 또 다른 책이 펴졌으니 곧 생명책이라', '요한계시록 20:12'], 'books'],
      ['새 하늘과 새 땅', ['또 내가 새 하늘과 새 땅을 보니 처음 하늘과 처음 땅이 없어졌고 바다도 다시 있지 않더라', '요한계시록 21:1'], 'newJerusalem', 'arrive',
        [['보라 하나님의 장막이 사람들과 함께 있으매 하나님이 저희와 함께 거하시리니 저희는 하나님의 백성이 되고 하나님은 친히 저희와 함께 계셔서', '요한계시록 21:3'],
          ['보라 내가 만물을 새롭게 하노라', '요한계시록 21:5'],
          ['또 저가 수정 같이 맑은 생명수의 강을 내게 보이니 하나님과 및 어린 양의 보좌로부터 나서 길 가운데로 흐르더라', '요한계시록 22:1-2'],
          ['나는 알파와 오메가요 처음과 나중이요 시작과 끝이라', '요한계시록 22:13']]],
    ],
    after: ['성령과 신부가 말씀하시기를 오라 하시는도다 듣는 자도 오라 할 것이요 목마른 자도 올 것이요 또 원하는 자는 값 없이 생명수를 받으라 하시더라', '요한계시록 22:17'],
  },
  wisdom: {
    name: '지혜의 길', color: 0xe8d8a0,
    st: [
      ['지혜의 근본', ['여호와를 경외하는 것이 지식의 근본이어늘 미련한 자는 지혜와 훈계를 멸시하느니라', '잠언 1:7'], 'scroll', null,
        [['여호와를 경외하는 것이 지혜의 근본이요 거룩하신 자를 아는 것이 명철이니라', '잠언 9:10']]],
      ['마음을 지키라', ['무릇 지킬만한 것보다 더욱 네 마음을 지키라 생명의 근원이 이에서 남이니라', '잠언 4:23'], 'spring'],
      ['범사에 인정하라', ['너는 마음을 다하여 여호와를 의뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라', '잠언 3:5-6'], 'signpost', null,
        [['사람이 마음으로 자기의 길을 계획할지라도 그 걸음을 인도하는 자는 여호와시니라', '잠언 16:9']]],
      ['개미에게 배우라', ['게으른 자여 개미에게로 가서 그 하는 것을 보고 지혜를 얻으라', '잠언 6:6'], 'ants'],
      ['유순한 대답', ['유순한 대답은 분노를 쉬게 하여도 과격한 말은 노를 격동하느니라', '잠언 15:1'], 'talk', null,
        [['철이 철을 날카롭게 하는 것 같이 사람이 그 친구의 얼굴을 빛나게 하느니라', '잠언 27:17']]],
      ['헛되고 헛되니', ['전도자가 가로되 헛되고 헛되며 헛되고 헛되니 모든 것이 헛되도다', '전도서 1:2'], 'vanity'],
      ['때가 있나니', ['천하에 범사가 기한이 있고 모든 목적이 이룰 때가 있나니', '전도서 3:1'], 'seasons', null,
        [['하나님이 모든 것을 지으시되 때를 따라 아름답게 하셨고 또 사람에게 영원을 사모하는 마음을 주셨느니라', '전도서 3:11']]],
      ['둘이 하나보다 나음', ['두 사람이 한 사람보다 나음은 저희가 수고함으로 좋은 상을 얻을 것임이라 혹시 저희가 넘어지면 하나가 그 동무를 붙들어 일으키려니와', '전도서 4:9-10'], 'two'],
      ['사람의 본분', ['일의 결국을 다 들었으니 하나님을 경외하고 그 명령을 지킬찌어다 이것이 사람의 본분이니라', '전도서 12:13'], 'porch', 'arrive',
        [['너는 청년의 때 곧 곤고한 날이 이르기 전, 나는 아무 낙이 없다고 할 해가 가깝기 전에 너의 창조자를 기억하라', '전도서 12:1']]],
    ],
  },
  fruit: {
    name: '성령의 열매', color: 0xb8e0a0,
    st: [
      ['참포도나무', ['나는 포도나무요 너희는 가지니 저가 내 안에, 내가 저 안에 있으면 이 사람은 과실을 많이 맺나니 나를 떠나서는 너희가 아무 것도 할 수 없음이라', '요한복음 15:5'], 'vine2', null,
        [['오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니 이같은 것을 금지할 법이 없느니라', '갈라디아서 5:22-23']]],
      ['사랑', ['하나님은 사랑이시라 사랑 안에 거하는 자는 하나님 안에 거하고 하나님도 그 안에 거하시느니라', '요한일서 4:16'], 'tree:0', null, [['사랑은 오래 참고 사랑은 온유하며 투기하는 자가 되지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며', '고린도전서 13:4']]],
      ['희락', ['하나님의 나라는 먹는 것과 마시는 것이 아니요 오직 성령 안에서 의와 평강과 희락이라', '로마서 14:17'], 'tree:1', null, [['내가 이것을 너희에게 이름은 내 기쁨이 너희 안에 있어 너희 기쁨을 충만하게 하려함이니라', '요한복음 15:11']]],
      ['화평', ['화평케 하는 자는 복이 있나니 저희가 하나님의 아들이라 일컬음을 받을 것임이요', '마태복음 5:9'], 'tree:2', null, [['그는 우리의 화평이신지라 둘로 하나를 만드사 중간에 막힌 담을 허시고', '에베소서 2:14']]],
      ['오래 참음', ['모든 겸손과 온유로 하고 오래 참음으로 사랑 가운데서 서로 용납하고', '에베소서 4:2'], 'tree:3', null, [['그 영광의 힘을 좇아 모든 능력으로 능하게 하시며 기쁨으로 모든 견딤과 오래 참음에 이르게 하시고', '골로새서 1:11']]],
      ['자비', ['너희 아버지의 자비하심 같이 너희도 자비하라', '누가복음 6:36'], 'tree:4', null, [['찬송하리로다 그는 우리 주 예수 그리스도의 하나님이시요 자비의 아버지시요 모든 위로의 하나님이시며', '고린도후서 1:3']]],
      ['양선', ['빛의 열매는 모든 착함과 의로움과 진실함에 있느니라', '에베소서 5:9'], 'tree:5', null, [['그러므로 우리는 기회 있는대로 모든 이에게 착한 일을 하되 더욱 믿음의 가정들에게 할찌니라', '갈라디아서 6:10']]],
      ['충성', ['그리고 맡은 자들에게 구할 것은 충성이니라', '고린도전서 4:2'], 'tree:6', null, [['그 주인이 이르되 잘 하였도다 착하고 충성된 종아 네가 작은 일에 충성하였으매 내가 많은 것으로 네게 맡기리니 네 주인의 즐거움에 참예할찌어다 하고', '마태복음 25:21']]],
      ['온유', ['온유한 자는 복이 있나니 저희가 땅을 기업으로 받을 것임이요', '마태복음 5:5'], 'tree:7', null, [['나는 마음이 온유하고 겸손하니 나의 멍에를 메고 내게 배우라 그러면 너희 마음이 쉼을 얻으리니', '마태복음 11:29']]],
      ['절제', ['이기기를 다투는 자마다 모든 일에 절제하나니 저희는 썩을 면류관을 얻고자 하되 우리는 썩지 아니할 것을 얻고자 하노라', '고린도전서 9:25'], 'tree:8', 'arrive',
        [['만일 우리가 성령으로 살면 또한 성령으로 행할찌니', '갈라디아서 5:25']]],
    ],
    after: ['너희가 과실을 많이 맺으면 내 아버지께서 영광을 받으실 것이요 너희가 내 제자가 되리라', '요한복음 15:8'],
  },
  faith: {
    name: '믿음의 길', color: 0xffe0b8,
    st: [
      ['믿음이란', ['믿음은 바라는 것들의 실상이요 보지 못하는 것들의 증거니', '히브리서 11:1'], 'mist', null,
        [['믿음이 없이는 기쁘시게 못하나니 하나님께 나아가는 자는 반드시 그가 계신 것과 또한 그가 자기를 찾는 자들에게 상 주시는 이심을 믿어야 할찌니라', '히브리서 11:6']]],
      ['아벨', ['믿음으로 아벨은 가인보다 더 나은 제사를 하나님께 드림으로 의로운 자라 하시는 증거를 얻었으니', '히브리서 11:4'], 'altar'],
      ['에녹', ['믿음으로 에녹은 죽음을 보지 않고 옮기웠으니', '히브리서 11:5'], 'enoch'],
      ['노아', ['믿음으로 노아는 아직 보지 못하는 일에 경고하심을 받아 경외함으로 방주를 예비하여 그 집을 구원하였으니', '히브리서 11:7'], 'ark2'],
      ['아브라함', ['믿음으로 아브라함은 부르심을 받았을 때에 순종하여 장래 기업으로 받을 땅에 나갈쌔 갈 바를 알지 못하고 나갔으며', '히브리서 11:8'], 'tent'],
      ['사라', ['믿음으로 사라 자신도 나이 늙어 단산하였으나 잉태하는 힘을 얻었으니 이는 약속하신 이를 미쁘신줄 앎이라', '히브리서 11:11'], 'stars', null,
        [['믿음에 견고하여져서 하나님께 영광을 돌리며 약속하신 그것을 또한 능히 이루실 줄을 확신하였으니', '로마서 4:20-21']]],
      ['이삭을 드림', ['아브라함은 시험을 받을 때에 믿음으로 이삭을 드렸으니 저는 약속을 받은 자로되 그 독생자를 드렸느니라', '히브리서 11:17'], 'moriah'],
      ['요셉', ['믿음으로 요셉은 임종시에 이스라엘 자손들의 떠날 것을 말하고 또 자기 해골을 위하여 명하였으며', '히브리서 11:22'], 'pyramid'],
      ['모세', ['믿음으로 모세는 장성하여 바로의 공주의 아들이라 칭함을 거절하고 도리어 하나님의 백성과 함께 고난 받기를 잠시 죄악의 낙을 누리는 것보다 더 좋아하고', '히브리서 11:24-25'], 'reedBasket'],
      ['홍해를 건넘', ['믿음으로 저희가 홍해를 육지 같이 건넜으나', '히브리서 11:29'], 'waves'],
      ['여리고', ['믿음으로 칠일 동안 여리고를 두루 다니매 성이 무너졌으며', '히브리서 11:30'], 'ruins'],
      ['라합', ['믿음으로 기생 라합은 정탐군을 평안히 영접하였으므로 순종치 아니한 자와 함께 멸망치 아니하였도다', '히브리서 11:31'], 'scarlet'],
      ['예수를 바라보자', ['이러므로 우리에게 구름 같이 둘러싼 허다한 증인들이 있으니 모든 무거운 것과 얽매이기 쉬운 죄를 벗어 버리고 인내로써 우리 앞에 당한 경주를 경주하며 믿음의 주요 또 온전케 하시는 이인 예수를 바라보자', '히브리서 12:1-2'], 'witnesses', 'arrive',
        [['저희가 믿음으로 나라들을 이기기도 하며 의를 행하기도 하며 약속을 받기도 하며 사자들의 입을 막기도 하며', '히브리서 11:33']]],
    ],
  },
};
// 체험할 때 뜨는 말씀
export const NEW_EXTRA = {
  manna: ['너를 낮추시며 너로 주리게 하시며 또 너도 알지 못하며 네 열조도 알지 못하던 만나를 네게 먹이신 것은 사람이 떡으로만 사는 것이 아니요 여호와의 입에서 나오는 모든 말씀으로 사는 줄을 너로 알게하려 하심이니라', '신명기 8:3'],
  rock: ['이스라엘이 여호와께서 애굽 사람들에게 베푸신 큰 일을 보았으므로 백성이 여호와를 경외하며 여호와와 그 종 모세를 믿었더라', '출애굽기 14:31'],
  armorAll: ['그러므로 하나님의 전신갑주를 취하라 이는 악한 날에 너희가 능히 대적하고 모든 일을 행한 후에 서기 위함이라', '에베소서 6:13'],
  feet: ['기록된바 아름답도다 좋은 소식을 전하는 자들의 발이여 함과 같으니라', '로마서 10:15'],
  shield: ['대저 하나님께로서 난 자마다 세상을 이기느니라 세상을 이긴 이김은 이것이니 우리의 믿음이니라', '요한일서 5:4'],
  sword0: ['기록되었으되 사람이 떡으로만 살것이 아니요 하나님의 입으로 나오는 모든 말씀으로 살 것이라 하였느니라', '마태복음 4:4'],
  sword1: ['또 기록되었으되 주 너의 하나님을 시험치 말라 하였느니라', '마태복음 4:7'],
  sword2: ['사단아 물러가라 기록되었으되 주 너의 하나님께 경배하고 다만 그를 섬기라 하였느니라', '마태복음 4:10'],
  soldier: ['네가 그리스도 예수의 좋은 군사로 나와 함께 고난을 받을찌니', '디모데후서 2:3'],
  fruits: ['너희가 과실을 많이 맺으면 내 아버지께서 영광을 받으실 것이요 너희가 내 제자가 되리라', '요한복음 15:8'],
};
// 아홉 열매의 빛깔
const FRUIT_COL = [0xe8475a, 0xffc93c, 0x7fd0e8, 0x8a6ad8, 0xff9a6a, 0x6ac46a, 0xf0e070, 0xf4b6d0, 0x5aa0e0];
const GEAR_OF = { belt: '진리의 허리띠', breast: '의의 흉배', shoes: '평안의 복음의 신', shield: '믿음의 방패', helmet: '구원의 투구', sword: '성령의 검' };

// ---------- 장면 (그룹 안: +z = 길 앞쪽, +x = 길 쪽(옆 정거장) / 오른쪽(가운데 정거장)) ----------
export function journeyScenes(K) {
  const { M, C, mesh, bx, glowAt, fig, flowers, camel, anims } = K;
  const sand = M(0xd8bc84, 1), rock = M(0x8a7a68, 1), bronze = M(0xb08040, 0.35, { metalness: 0.6 });
  const fire = (g, x, y, z, s = 1) => { const f = glowAt(g, 0xff9a40, 1.6 * s, x, y, z, 0.9); const f2 = glowAt(g, 0xffe080, 0.9 * s, x, y + 0.2 * s, z, 0.9); anims.push((dt, t) => { f.material.opacity = 0.7 + Math.sin(t * 9 + x) * 0.2; f2.scale.setScalar(0.9 * s * (1 + Math.sin(t * 13) * 0.12)); }); return f; };
  const water = () => M(0x5fa8d0, 0.12, { transparent: true, opacity: 0.78, emissive: 0x1a4a70, emissiveIntensity: 0.35 });
  const wall = (g, w, h, d, x, z, mat = M(0xc8b090, 1)) => g.add(bx(w, h, d, mat, x, h / 2, z));
  const palm = (g, x, z) => { g.add(mesh(new THREE.CylinderGeometry(0.1, 0.16, 3, 6), C.woodDark, x, 1.5, z)); for (let k = 0; k < 6; k++) { const l = bx(0.15, 0.04, 1.4, C.leaf, x + Math.sin(k) * 0.6, 3, z + Math.cos(k) * 0.6); l.rotation.y = k; l.rotation.x = 0.4; g.add(l); } };
  const S = {
    // ----- 출애굽 -----
    bush(g) {
      g.add(mesh(new THREE.IcosahedronGeometry(0.9, 0), M(0x5a7a3a, 1), -0.8, 0.7, 0));
      fire(g, -0.8, 1.1, 0, 1.4); fire(g, -0.5, 1.5, 0.3, 0.8); fire(g, -1.1, 1.4, -0.3, 0.9);
      g.add(bx(0.3, 0.06, 0.5, C.woodDark, 0.6, 0.04, 0.4)); // 벗어 놓은 신
      g.add(bx(0.3, 0.06, 0.5, C.woodDark, 0.6, 0.04, -0.1));
    },
    pharaoh(g) {
      const py = mesh(new THREE.ConeGeometry(4, 4.5, 4), sand, -4, 2.25, 0); py.rotation.y = Math.PI / 4; g.add(py);
      g.add(bx(1.2, 0.9, 1, C.gold, -0.8, 0.45, 0));
      fig(g, 0xf0e0b0, -0.8, 0, 1.5, (f) => { f.position.y = 0.9; f.add(mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.35, 8), M(0x2a4aa0, 0.6), 0, 1.75, 0)); });
      fig(g, 0x8a6a4a, 0.6, 0.9, 1.6, (f) => f.add(bx(0.05, 1.7, 0.05, C.woodDark, 0.3, 0.85, 0))); // 지팡이를 든 모세
    },
    plagues(g, st) {
      const frogM = M(0x4a8a3a, 0.8);
      for (let k = 0; k < 10; k++) g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), frogM, -2 + Math.random() * 2.6, 0.1, -3 + Math.random() * 6));
      const hail = [];
      for (let k = 0; k < 14; k++) { const h = mesh(new THREE.SphereGeometry(0.08, 6, 4), C.white, 0, 6, 0); h.visible = false; g.add(h); hail.push({ h, x: -3 + Math.random() * 3, z: -3 + Math.random() * 6, v: Math.random() }); }
      st.hail = { hail, T: -1 };
      anims.push((dt) => { const H = st.hail; if (H.T < 0) return; H.T += dt; for (const q of hail) { const y = 6 - ((H.T * 6 + q.v * 6) % 6); q.h.visible = H.T < 8; q.h.position.set(q.x, y, q.z); } if (H.T > 8) H.T = -1; });
      st.dark = true; // 흑암 재앙: 다가가면 어두워짐
    },
    passover(g) {
      g.add(bx(2.4, 2.2, 2.2, M(0xd8c8a8, 1), -1.4, 1.1, 0));
      g.add(bx(0.06, 1.5, 0.8, C.woodDark, -0.18, 0.75, 0));
      for (const z of [-0.48, 0.48]) g.add(bx(0.1, 1.7, 0.12, M(0x9a1a1a, 0.6), -0.16, 0.85, z)); // 문설주의 피
      g.add(bx(0.1, 0.12, 1.1, M(0x9a1a1a, 0.6), -0.16, 1.68, 0)); // 인방
      const lamb = new THREE.Group(); lamb.position.set(0.6, 0, -1.2); g.add(lamb);
      lamb.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), C.white, 0, 0.45, 0)); lamb.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), M(0x3a3430), 0, 0.55, 0.3));
      glowAt(g, 0xffe0b0, 1.6, -0.1, 1.3, 0, 0.5);
    },
    redsea(g, st) {
      // 길 위를 덮은 바다: 다가가면 좌우로 갈라져 물 벽이 됨 (courses 단계에서 거리로 움직임)
      const wm = water();
      const mid = bx(3.4, 0.4, 22, wm, 0, 0.05, 0); mid.castShadow = false; g.add(mid);
      const sides = [];
      for (const sd of [-1, 1]) { const w = bx(12, 1, 22, wm, sd * 7.7, 0.25, 0); w.castShadow = false; g.add(w); sides.push(w); }
      const foam = [];
      for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const f = glowAt(g, 0xffffff, 1.2, sd * 1.8, 0.4, -10 + k * 4, 0.0); foam.push(f); }
      st.sea = { mid, sides, foam, k: 0, want: 0 };
      anims.push((dt, t) => {
        const s = st.sea; s.k += (s.want - s.k) * Math.min(1, dt * 0.8);
        s.mid.scale.y = Math.max(0.01, 1 - s.k * 1.2); s.mid.position.y = 0.05 - s.k * 0.4; s.mid.visible = s.k < 0.9;
        for (const w of s.sides) { w.scale.y = 1 + s.k * 5.5 + Math.sin(t * 1.5 + w.position.x) * 0.1 * s.k; w.position.y = 0.25 + w.scale.y * 0.5 - 0.5; }
        for (const f of s.foam) { f.material.opacity = s.k * (0.4 + Math.sin(t * 3 + f.position.z) * 0.2); f.position.y = 0.6 + s.k * 5.2; }
      });
    },
    timbrel(g) {
      for (let k = 0; k < 4; k++) fig(g, [0x8a3a6a, 0xd8a050, 0x6a8ad8, 0xe86a6a][k], -1.6 + (k % 2) * 0.8, -1.5 + k, 1.45, (f) => { const tb = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14), C.gold, 0.3, 1.5, 0); tb.rotation.z = Math.PI / 2; f.add(tb); anims.push((dt, t) => { f.position.y = Math.abs(Math.sin(t * 4 + k)) * 0.18; }); });
      flowers(g, -1, 0, 2, 12);
    },
    marah(g, st) {
      const pool = mesh(new THREE.CircleGeometry(1.6, 20), M(0x7a6a40, 0.3, { emissive: 0x2a2000, emissiveIntensity: 0.3 }), -1.4, 0.03, 0); pool.rotation.x = -Math.PI / 2; g.add(pool);
      const log = bx(0.18, 0.18, 1.4, C.wood, -1.4, 0.1, 0.4); log.rotation.y = 0.7; g.add(log);
      st.pool = pool;
    },
    manna(g, st) {
      const flakeM = M(0xfffaf0, 0.6, { emissive: 0xfff4e0, emissiveIntensity: 0.4 });
      st.flakes = [];
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4, r = 1 + (k % 3) * 0.9;
        const f = mesh(new THREE.SphereGeometry(0.09, 8, 6), flakeM, -1 + Math.cos(a) * r, 0.08, Math.sin(a) * r); f.scale.y = 0.5; f.userData.dyn = true; g.add(f); st.flakes.push(f);
      }
      const fall = [];
      for (let k = 0; k < 10; k++) { const s = glowAt(g, 0xffffff, 0.25, 0, 5, 0, 0.8); fall.push({ s, x: -3 + Math.random() * 4, z: -3 + Math.random() * 6, o: Math.random() }); }
      anims.push((dt, t) => fall.forEach((q) => { const f = (t * 0.15 + q.o) % 1; q.s.position.set(q.x, 6 - f * 6, q.z); q.s.material.opacity = Math.sin(f * Math.PI) * 0.8; }));
    },
    rockWater(g, st) {
      const r = mesh(new THREE.DodecahedronGeometry(1.5, 0), rock, -1.4, 1.1, 0); r.scale.set(1, 1.1, 1.3); g.add(r);
      const stream = mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.2, 10, 1, true), water(), -0.3, 0.6, 0); stream.rotation.z = 0.9; stream.visible = false; stream.userData.dyn = true; g.add(stream);
      const pool = mesh(new THREE.CircleGeometry(1, 18), water(), 0.4, 0.04, 0); pool.rotation.x = -Math.PI / 2; pool.scale.setScalar(0.01); pool.userData.dyn = true; g.add(pool);
      st.spring = { stream, pool, T: -1 };
      st.rockAt = new THREE.Vector3(-0.2, 0, 0);
    },
    tablets(g) {
      for (const z of [-0.45, 0.45]) {
        const tb = bx(0.18, 1.3, 0.8, M(0xa8a090, 0.9), -1.2, 0.8, z); g.add(tb);
        g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.18, 14, 1, false, 0, Math.PI), M(0xa8a090, 0.9), -1.2, 1.45, z)).rotation.z = Math.PI / 2;
      }
      for (let k = 0; k < 4; k++) { const c = glowAt(g, 0x606070, 8, -3 + Math.cos(k) * 3, 7 + k * 0.5, Math.sin(k) * 3, 0.5); c.material.blending = THREE.NormalBlending; }
      glowAt(g, 0xfff0c0, 3, -1.2, 1.6, 0, 0.5);
    },
    calf(g) {
      g.add(bx(1.4, 0.7, 1, C.stone, -1.6, 0.35, 0));
      const calf = new THREE.Group(); calf.position.set(-1.6, 0.7, 0); g.add(calf);
      calf.add(bx(0.5, 0.45, 0.9, C.gold, 0, 0.55, 0)); calf.add(bx(0.32, 0.3, 0.35, C.gold, 0, 0.85, 0.55));
      for (const [x, z] of [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]]) calf.add(bx(0.1, 0.35, 0.1, C.gold, x, 0.17, z));
      for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.05, 0.25, 6), C.gold, s * 0.14, 1.1, 0.6); h.rotation.z = -s * 0.5; calf.add(h); }
      // 부서진 돌판
      for (let k = 0; k < 4; k++) { const p = bx(0.3, 0.08, 0.35, M(0xa8a090, 0.9), 0.3 + Math.random(), 0.04, -1.2 + k * 0.6); p.rotation.y = Math.random() * 3; g.add(p); }
    },
    tabernacle(g) {
      const cloth = M(0xe8e0d0, 0.9), blue = M(0x3a5a9a, 0.8);
      for (const z of [-3, 3]) for (let x = -5; x <= 0; x += 1.25) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), C.wood, x - 0.5, 0.8, z));
      wall(g, 5.2, 1.5, 0.04, -2.6, -3, cloth); wall(g, 5.2, 1.5, 0.04, -2.6, 3, cloth); wall(g, 0.04, 1.5, 6, -5.2, 0, cloth);
      g.add(bx(2.2, 1.8, 1.6, blue, -3.8, 0.9, 0)); g.add(bx(2.3, 0.08, 1.7, C.gold, -3.8, 1.84, 0)); // 성소
      g.add(bx(0.8, 0.5, 0.8, C.gold, -1.6, 0.25, 0)); fire(g, -1.6, 0.7, 0, 0.6); // 번제단
      const cloud = glowAt(g, 0xffffff, 5, -3.8, 4, 0, 0.6); anims.push((dt, t) => { cloud.position.y = 4 + Math.sin(t * 0.5) * 0.3; });
    },
    pillars(g) {
      const col = mesh(new THREE.CylinderGeometry(0.9, 1.4, 12, 16, 1, true), M(0xffffff, 0.6, { transparent: true, opacity: 0.4, emissive: 0xffffff, emissiveIntensity: 0.4, side: THREE.DoubleSide, depthWrite: false }), -2.4, 6, 0);
      col.castShadow = false; g.add(col);
      const fireG = glowAt(g, 0xff8a30, 5, -2.4, 3, 0, 0);
      anims.push((dt, t) => { const k = (Math.sin(t * 0.25) + 1) / 2; col.material.opacity = 0.15 + 0.3 * (1 - k); col.material.emissive.setRGB(1, 1 - k * 0.5, 1 - k * 0.8); fireG.material.opacity = k * 0.8; fireG.position.y = 2 + Math.sin(t * 3) * 0.3 + k * 2; });
    },
    serpent(g, st) {
      g.add(bx(0.12, 3.6, 0.12, C.woodDark, -0.8, 1.8, 0));
      const coil = mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 20, Math.PI * 3.2), bronze, -0.8, 3.1, 0); coil.rotation.y = Math.PI / 2; g.add(coil);
      g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), bronze, -0.8, 3.6, 0.15));
      glowAt(g, 0xffd890, 2, -0.8, 3.3, 0, 0.5);
      st.look = new THREE.Vector3(-0.8, 3.2, 0);
    },
    tents(g) {
      const tentM = [M(0x8a6a4a), M(0x6a5a4a), M(0xa08060)];
      for (let k = 0; k < 6; k++) { const t = mesh(new THREE.ConeGeometry(1.1, 1.4, 4), tentM[k % 3], -2 - (k % 3) * 2.4, 0.7, -3 + Math.floor(k / 3) * 3.4); t.rotation.y = Math.PI / 4; g.add(t); }
      camel(g, -1, 2.4);
      fire(g, -1.2, 0.3, -0.4, 0.6);
    },
    jordanDry(g, st) {
      // 요단 강: 언약궤를 멘 제사장들 앞에서 물이 그쳐 마른 땅이 됨
      const wm = water();
      const up = bx(16, 0.3, 3, wm, 0, 0.03, 0); up.castShadow = false; g.add(up);
      const heap = bx(3.2, 0.3, 3, wm, -9.5, 0.1, 0); heap.castShadow = false; g.add(heap); // 위쪽에 쌓인 물
      const ark = new THREE.Group(); ark.position.set(2.4, 0, 0); g.add(ark);
      ark.add(bx(0.9, 0.55, 0.55, C.gold, 0, 1.1, 0)); for (const s of [-1, 1]) ark.add(bx(1.8, 0.06, 0.06, C.gold, 0, 0.95, s * 0.35));
      for (const s of [-1, 1]) fig(ark, 0xf0ece0, 0, s * 0.7, 1.5);
      st.jordan = { up, heap, k: 0, want: 0 };
      anims.push((dt) => { const J = st.jordan; J.k += (J.want - J.k) * Math.min(1, dt * 0.6); J.up.scale.x = Math.max(0.01, 1 - J.k); J.up.position.x = -J.k * 8; J.heap.scale.y = 1 + J.k * 8; J.heap.position.y = 0.1 + J.k * 1.2; });
    },
    jerichoWall(g, st) {
      const wm = M(0xc8a878, 1);
      st.walls = [];
      for (let k = 0; k < 5; k++) { const w = bx(1.4, 2.6, 0.6, wm, -2.4, 1.3, -3 + k * 1.5); g.add(w); w.userData.dyn = true; st.walls.push(w); }
      fig(g, 0xf0ece0, 0.4, -1.4, 1.5, (f) => { const tr = mesh(new THREE.ConeGeometry(0.08, 0.6, 8), C.gold, 0.2, 1.3, 0.25); tr.rotation.x = -1.2; f.add(tr); });
      st.wallT = -1;
      anims.push((dt) => { if (st.wallT < 0) return; st.wallT += dt; st.walls.forEach((w, i) => { const k = Math.min(1, Math.max(0, (st.wallT - i * 0.15) / 1.2)); w.rotation.z = k * k * 1.4; w.position.y = 1.3 - k * 1.0; }); });
    },
    canaan(g) {
      const pole = bx(0.08, 0.08, 3, C.woodDark, -1.6, 1.6, 0); g.add(pole);
      for (const s of [-1, 1]) fig(g, 0x6a8a5a, -1.6, s * 1.3, 1.5);
      for (let k = 0; k < 22; k++) g.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), M(0x6a2a7a, 0.5), -1.6 + (Math.random() - 0.5) * 0.4, 1.35 - (k % 6) * 0.13, (Math.random() - 0.5) * 0.7));
      for (const [x, z] of [[-4, -3], [-4.5, 2.5], [-3, 4]]) { g.add(mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 6), C.woodDark, x, 0.8, z)); g.add(mesh(new THREE.IcosahedronGeometry(1.1, 1), C.leaf, x, 2.1, z)); }
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 12), M(0xf0f0e8), 1.4, 0.25, -1.6)); g.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 12), M(0xe8a830, 0.4), 1.4, 0.23, -0.8));
      flowers(g, 0, 0, 4, 30);
      glowAt(g, 0xfff0c0, 7, -1, 3, 0, 0.35);
    },
    // ----- 전신갑주 훈련 -----
    camp2(g) {
      g.add(bx(0.1, 3.2, 0.1, C.woodDark, -0.6, 1.6, 0));
      const flag = bx(0.03, 0.8, 1.3, M(0xd04a3a, 0.8), -0.6, 2.8, 0.66); g.add(flag);
      anims.push((dt, t) => { flag.rotation.y = Math.sin(t * 2) * 0.2; });
      for (let k = 0; k < 3; k++) g.add(bx(0.6, 0.6, 0.6, C.wood, -1.6, 0.3, -1 + k * 0.7));
    },
    rack(g, st) {
      g.add(bx(0.1, 1.8, 0.1, C.woodDark, -0.6, 0.9, -0.6)); g.add(bx(0.1, 1.8, 0.1, C.woodDark, -0.6, 0.9, 0.6)); g.add(bx(0.1, 0.1, 1.4, C.woodDark, -0.6, 1.75, 0));
      const steel = M(0xc9ced8, 0.28, { metalness: 0.75 }), gold = C.gold;
      const p = st.piece, h = new THREE.Group(); h.position.set(-0.4, 1.1, 0); g.add(h);
      if (p === 'belt') { const b = mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24), gold); b.rotation.x = Math.PI / 2; h.add(b); }
      if (p === 'breast') h.add(bx(0.2, 0.7, 0.6, steel, 0, 0, 0));
      if (p === 'shoes') for (const s of [-1, 1]) h.add(bx(0.22, 0.2, 0.4, M(0x7a5236, 0.7), 0, -0.9, s * 0.2));
      if (p === 'shield') { const s = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 22), steel); s.rotation.z = Math.PI / 2; h.add(s); h.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), gold, 0.05, 0, 0)); }
      if (p === 'helmet') h.add(mesh(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), steel));
      if (p === 'sword') { const s = bx(0.05, 1, 0.1, M(0xe8f2ff, 0.15, { metalness: 0.8, emissive: 0x88b8ff, emissiveIntensity: 0.5 }), 0, 0, 0); s.rotation.x = 0.3; h.add(s); }
      st.glow = glowAt(g, 0xfff2c0, 1.4, -0.4, 1.1, 0, 0.7); st.holder = h;
      anims.push((dt, t) => { h.position.y = 1.1 + Math.sin(t * 2) * 0.05; });
      // 훈련 장소
      if (p === 'shield') { // 불화살이 날아오는 어두운 망루
        const tw = bx(1.2, 3.4, 1.2, M(0x2a2228, 1), -3.6, 1.7, -6); g.add(tw); st.tower = new THREE.Vector3(-3.6, 3.2, -6);
        glowAt(g, 0xff5a20, 1.8, -3.6, 3.6, -6, 0.6);
      }
      if (p === 'sword') { // 짚 허수아비 셋
        st.dummies = [];
        for (let k = 0; k < 3; k++) {
          const d = new THREE.Group(); d.position.set(-1.6, 0, 2 + k * 2.4); g.add(d);
          d.add(bx(0.1, 1.6, 0.1, C.woodDark, 0, 0.8, 0)); d.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.8, 10), M(0xc8a860, 1), 0, 1.15, 0)); d.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), M(0x3a3038, 1), 0, 1.75, 0));
          d.add(bx(0.9, 0.08, 0.08, C.woodDark, 0, 1.35, 0));
          st.dummies.push({ g: d, down: false, T: -1 });
        }
      }
    },
    watch(g) {
      g.add(mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.3, 16), C.stone, -1.2, 0.15, 0));
      fire(g, -1.2, 0.5, 0, 0.8);
      const eye = glowAt(g, 0x330a0a, 5, -5, 1.4, -4, 0.6); eye.material.blending = THREE.NormalBlending; // 숲 속 어둠
      anims.push((dt, t) => { eye.position.x = -5 + Math.sin(t * 0.3) * 2; });
    },
    stand(g, st) {
      g.add(mesh(new THREE.CylinderGeometry(3, 3.2, 0.3, 24), C.stone, 0, 0.15, 0));
      const foe = new THREE.Group(); foe.position.set(0, 0.3, -2.6); g.add(foe);
      foe.add(mesh(new THREE.ConeGeometry(0.7, 2.2, 10), M(0x1a141a, 1), 0, 1.1, 0)); foe.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), M(0x1a141a, 1), 0, 2.3, 0));
      for (const s of [-1, 1]) foe.add(glowAt(foe, 0xff3020, 0.25, s * 0.1, 2.35, 0.25, 0.9));
      const dark = glowAt(foe, 0x0a0608, 5, 0, 1.4, 0, 0.6); dark.material.blending = THREE.NormalBlending;
      st.foe = { g: foe, T: -1 };
      anims.push((dt) => { const F = st.foe; if (F.T < 0) return; F.T += dt; const k = Math.min(1, F.T / 2.5); F.g.position.z = -2.6 - k * k * 18; F.g.position.y = 0.3 - k * 2; F.g.scale.setScalar(Math.max(0.01, 1 - k * 0.7)); if (F.T > 3) F.g.visible = false; });
      glowAt(g, 0xfff2c8, 6, 0, 3, 1.5, 0.35);
    },
    // ----- 요한계시록 -----
    patmos(g) {
      const sea = mesh(new THREE.CircleGeometry(4.5, 28), water(), -3, 0.02, 0); sea.rotation.x = -Math.PI / 2; g.add(sea);
      const isle = mesh(new THREE.SphereGeometry(1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), rock, -3, 0, 0); isle.scale.y = 0.6; g.add(isle);
      fig(g, 0x8a7a6a, -3, 0, 1.4, (f) => { f.position.y = 0.7; f.add(bx(0.3, 0.04, 0.4, M(0xf4ecd8), 0.2, 0.9, 0.2)); });
    },
    lampstands(g) {
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; const x = -2 + Math.cos(a) * 1.8, z = Math.sin(a) * 1.8; g.add(mesh(new THREE.CylinderGeometry(0.05, 0.15, 1.3, 8), C.gold, x, 0.65, z)); g.add(mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.12, 10), C.gold, x, 1.35, z)); fire(g, x, 1.5, z, 0.35); }
      glowAt(g, 0xffffff, 3.5, -2, 1.6, 0, 0.6);
    },
    churches(g) {
      for (let k = 0; k < 7; k++) { const x = -1.5 - (k % 2) * 2, z = -4.5 + k * 1.5; g.add(bx(1, 0.9, 1, C.white, x, 0.45, z)); const r = mesh(new THREE.ConeGeometry(0.8, 0.6, 4), C.red, x, 1.2, z); r.rotation.y = Math.PI / 4; g.add(r); glowAt(g, 0xffd890, 0.7, x + 0.52, 0.5, z, k === 0 ? 0.15 : 0.7); }
    },
    throne(g) {
      g.add(bx(2, 0.4, 2, C.pearl, -2, 0.2, 0)); g.add(bx(1.2, 2.2, 0.3, C.gold, -2.4, 1.3, 0)); g.add(bx(1.2, 0.3, 1, C.gold, -2, 0.55, 0));
      const bow = mesh(new THREE.TorusGeometry(2.4, 0.08, 6, 40, Math.PI), M(0x7fe0a0, 0.3, { emissive: 0x40c080, emissiveIntensity: 0.8 }), -2.2, 0.2, 0); bow.rotation.y = Math.PI / 2; g.add(bow);
      const sea = mesh(new THREE.CircleGeometry(2.8, 28), C.crystal, -2, 0.03, 0); sea.rotation.x = -Math.PI / 2; g.add(sea); // 유리 바다
      const glow = glowAt(g, 0xfff4d0, 6, -2, 2, 0, 0.6); anims.push((dt, t) => { glow.material.opacity = 0.5 + Math.sin(t) * 0.15; });
    },
    lamb(g) {
      g.add(mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.4, 20), C.pearl, -2.4, 0.2, 0));
      const l = new THREE.Group(); l.position.set(-2.4, 0.4, 0); g.add(l);
      l.add(mesh(new THREE.SphereGeometry(0.4, 12, 10), C.white, 0, 0.55, 0)); l.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), M(0xf0e8e0), 0, 0.75, 0.42));
      for (const [x, z] of [[-0.15, -0.2], [0.15, -0.2], [-0.15, 0.2], [0.15, 0.2]]) l.add(bx(0.07, 0.35, 0.07, M(0x3a3430), x, 0.17, z));
      glowAt(g, 0xfff4d0, 4, -2.4, 1.2, 0, 0.6);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6; fig(g, 0xf8f4ec, -2.4 + Math.cos(a) * 2.4, Math.sin(a) * 2.4, 1.3); }
    },
    seals(g, st) {
      const scroll = mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 12), M(0xf0e4c8), -1.4, 1.2, 0); scroll.rotation.x = Math.PI / 2; g.add(scroll);
      g.add(bx(0.6, 1, 0.6, C.stone, -1.4, 0.5, 0));
      st.sealsL = [];
      for (let k = 0; k < 7; k++) { const s = mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0xa02020, 0.4), -1.2, 1.25, -0.6 + k * 0.2); s.userData.dyn = true; g.add(s); st.sealsL.push(s); }
    },
    crowd(g) {
      const cols = [0xfffdf6, 0xf8f4ec];
      for (let k = 0; k < 18; k++) fig(g, cols[k % 2], -1.5 - (k % 3) * 1.1, -5 + Math.floor(k / 3) * 2, 1.4 + (k % 4) * 0.08, (f) => { const p = bx(0.04, 0.9, 0.35, C.leaf, 0.25, 1.4, 0); p.rotation.x = 0.3; f.add(p); anims.push((dt, t) => { p.rotation.z = Math.sin(t * 2 + k) * 0.3; }); });
      glowAt(g, 0xffffff, 8, -3, 2, 0, 0.3);
    },
    trumpets(g) {
      for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; const x = -3 + Math.cos(a) * 1.5, z = Math.sin(a) * 4; fig(g, 0xfffaf0, x, z, 1.5, (f) => { const t = mesh(new THREE.ConeGeometry(0.1, 0.7, 10), C.gold, 0.15, 1.45, 0.3); t.rotation.x = -1.1; f.add(t); }); }
      glowAt(g, 0xfff0c0, 6, -3, 3, 0, 0.3);
    },
    dragon(g) {
      const body = M(0x7a1a1a, 0.7);
      for (let k = 0; k < 8; k++) { const s = mesh(new THREE.SphereGeometry(0.45 - k * 0.04, 10, 8), body, -2 - Math.sin(k * 0.8) * 0.8, 0.3, -2.4 + k * 0.6); s.scale.y = 0.5; g.add(s); }
      const cross = new THREE.Group(); cross.position.set(-0.8, 0, 0.6); g.add(cross);
      cross.add(bx(0.18, 2.4, 0.18, M(0xf4ecd8), 0, 1.2, 0)); cross.add(bx(0.18, 0.18, 1.2, M(0xf4ecd8), 0, 1.7, 0));
      glowAt(g, 0xfff2c8, 3, -0.8, 1.6, 0.6, 0.6);
    },
    hallelujah(g) {
      for (let k = 0; k < 10; k++) fig(g, 0xfffdf6, -1.4 - (k % 2) * 1.2, -4 + k * 0.9, 1.4, (f) => { anims.push((dt, t) => { f.position.y = Math.abs(Math.sin(t * 3 + k)) * 0.12; }); });
      g.add(mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 18), C.gold, -4, 3, 0)).rotation.y = Math.PI / 2; // 많은 면류관
      glowAt(g, 0xffe8a0, 7, -3, 3, 0, 0.4);
    },
    books(g) {
      for (const [x, z, c] of [[-2.2, -1.2, 0x6a4a2a], [-2.2, 1.2, 0x4a3a2a], [2.2, 0, 0xf0e0b0]]) {
        g.add(bx(0.5, 0.9, 0.5, C.stone, x, 0.45, z));
        const b = bx(0.7, 0.08, 0.9, M(c, 0.6, c === 0xf0e0b0 ? { emissive: 0xffe0a0, emissiveIntensity: 0.6 } : {}), x, 0.95, z); b.rotation.z = 0.15; g.add(b);
      }
      glowAt(g, 0xfff0c0, 2.4, 2.2, 1.2, 0, 0.7);
    },
    newJerusalem(g) {
      const cm = M(0xc8f0ff, 0.05, { transparent: true, opacity: 0.75, emissive: 0x80d0ff, emissiveIntensity: 0.5 });
      for (const sd of [-1, 1]) { g.add(bx(4, 4, 0.6, cm, sd * 4.4, 2, 1)); g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 5.5, 10), C.pearl, sd * 2.2, 2.75, 1)); }
      const arch = mesh(new THREE.TorusGeometry(1.5, 0.3, 10, 24, Math.PI), C.pearl, 0, 4, 1); g.add(arch);
      const river = mesh(new THREE.PlaneGeometry(1.2, 9), C.crystal, 0, 0.04, -3.4); river.rotation.x = -Math.PI / 2; g.add(river);
      for (const sd of [-1, 1]) { g.add(mesh(new THREE.CylinderGeometry(0.2, 0.28, 2, 8), C.woodDark, sd * 1.6, 1, -2.5)); g.add(mesh(new THREE.IcosahedronGeometry(1.1, 1), M(0x4f9e58), sd * 1.6, 2.6, -2.5)); }
      const halo = glowAt(g, 0xe8f6ff, 12, 0, 4, 0, 0.55); anims.push((dt, t) => { halo.material.opacity = 0.45 + Math.sin(t * 0.8) * 0.12; });
    },
    // ----- 지혜의 길 -----
    scroll(g) {
      g.add(bx(0.6, 1.1, 0.6, C.stone, -0.6, 0.55, 0));
      const s = bx(0.5, 0.04, 0.9, M(0xf4ecd8), -0.6, 1.12, 0); s.rotation.z = 0.2; g.add(s);
      for (const z of [-0.47, 0.47]) { const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), C.wood, -0.6, 1.16, z); r.rotation.z = Math.PI / 2; g.add(r); }
      glowAt(g, 0xfff0c0, 1.6, -0.6, 1.3, 0, 0.6);
    },
    spring(g) {
      g.add(mesh(new THREE.CylinderGeometry(1, 1.1, 0.5, 18), C.stone, -1.2, 0.25, 0));
      const w = mesh(new THREE.CircleGeometry(0.9, 18), C.water, -1.2, 0.51, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      const jet = mesh(new THREE.CylinderGeometry(0.04, 0.12, 1, 8), C.crystal, -1.2, 1, 0); g.add(jet);
      anims.push((dt, t) => { jet.scale.y = 1 + Math.sin(t * 3) * 0.15; });
    },
    ants(g) {
      const hill = mesh(new THREE.ConeGeometry(0.9, 0.7, 12), M(0x9a7a50, 1), -1.2, 0.35, 0); g.add(hill);
      const ants = [];
      for (let k = 0; k < 12; k++) { const a = mesh(new THREE.SphereGeometry(0.05, 6, 4), M(0x1a1410), 0, 0.05, 0); a.scale.set(0.7, 0.6, 1.6); a.userData.dyn = true; g.add(a); ants.push(a); }
      const crumbs = mesh(new THREE.SphereGeometry(0.25, 8, 6), M(0xe8c88a), 1.2, 0.1, 2); g.add(crumbs);
      anims.push((dt, t) => ants.forEach((a, i) => { const f = (t * 0.12 + i / 12) % 1, back = f > 0.5, u = back ? (1 - f) * 2 : f * 2; a.position.set(-1.2 + u * 2.4, 0.05, u * 2 + Math.sin(i) * 0.15); a.rotation.y = Math.atan2(2.4, 2) + (back ? Math.PI : 0); }));
    },
    talk(g) {
      g.add(bx(1.8, 0.1, 0.5, C.wood, -1.2, 0.5, 0)); for (const z of [-0.7, 0.7]) g.add(bx(0.1, 0.5, 0.4, C.woodDark, -1.2, 0.25, z));
      fig(g, 0x6a8ad0, -1.2, -0.45, 1.2, (f) => { f.position.y = 0.3; }); fig(g, 0xd08a6a, -1.2, 0.45, 1.2, (f) => { f.position.y = 0.3; });
      glowAt(g, 0xffe8c0, 1.6, -1.2, 1.6, 0, 0.5);
    },
    vanity(g) {
      for (let k = 0; k < 5; k++) { const d = mesh(new THREE.SphereGeometry(0.6 + k * 0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), sand, -1.5 - k * 0.6, 0, -2 + k); d.scale.y = 0.4; g.add(d); }
      const tw = bx(0.9, 2.2, 0.9, M(0xc8b090, 1), -2.6, 0.9, 0.5); tw.rotation.z = 0.25; g.add(tw); // 무너져 가는 탑
      const dust = []; for (let k = 0; k < 6; k++) dust.push(glowAt(g, 0xe8d8b0, 1.2, -2, 1, 0, 0.3));
      anims.push((dt, t) => dust.forEach((d, i) => { const f = (t * 0.2 + i / 6) % 1; d.position.set(-3 + f * 5, 0.6 + Math.sin(f * 6 + i) * 0.3, -2 + i * 0.8); d.material.opacity = Math.sin(f * Math.PI) * 0.35; })); // 바람에 날리는 먼지
    },
    seasons(g) {
      const cols = [0xf4b6d0, 0x4f9e58, 0xe08a3a, 0xf4f4f8];
      cols.forEach((c, k) => { const z = -3 + k * 2; g.add(mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 6), C.woodDark, -1.4, 0.8, z)); if (k < 3) g.add(mesh(new THREE.IcosahedronGeometry(0.8, 1), M(c, 0.9), -1.4, 2, z)); else g.add(mesh(new THREE.ConeGeometry(0.7, 0.3, 8), M(c, 0.6), -1.4, 1.65, z)); });
    },
    two(g) {
      g.add(bx(1.2, 0.5, 2.6, rock, -1.8, 0.25, 0));
      fig(g, 0x5a8ac0, -0.8, -0.5, 1.5); fig(g, 0xc07a5a, -1.8, 0.6, 1.5, (f) => { f.position.y = 0.5; });
      const rope = bx(0.04, 0.04, 1.4, M(0xc8a870), -1.3, 1.2, 0); rope.rotation.x = 0.6; g.add(rope);
    },
    porch(g) {
      g.add(bx(5, 0.3, 3.4, C.white, 0, 0.15, -0.6));
      for (const x of [-2.2, -0.75, 0.75, 2.2]) g.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 3, 12), C.white, x, 1.65, -1.8));
      g.add(bx(5, 0.35, 0.8, C.white, 0, 3.3, -1.8));
      g.add(bx(1, 0.8, 0.6, C.gold, 0, 0.7, -0.6));
      glowAt(g, 0xfff0c0, 4, 0, 2, -1, 0.5);
    },
    // ----- 성령의 열매 -----
    vine2(g) {
      for (let k = 0; k < 5; k++) { g.add(bx(0.08, 1.8, 0.08, C.woodDark, -1, 0.9, -3 + k * 1.5)); }
      g.add(bx(0.06, 0.06, 6.2, C.woodDark, -1, 1.75, 0));
      for (let k = 0; k < 9; k++) { const l = mesh(new THREE.IcosahedronGeometry(0.4, 0), C.leaf, -1, 1.7, -3 + k * 0.75); g.add(l); g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), M(FRUIT_COL[k], 0.5), -0.8, 1.35, -3 + k * 0.75)); }
    },
    tree(g, st) {
      const c = FRUIT_COL[st.fruitIdx];
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 8), C.woodDark, -0.8, 0.9, 0));
      g.add(mesh(new THREE.IcosahedronGeometry(1.25, 1), C.leaf, -0.8, 2.4, 0));
      const fr = new THREE.Group(); fr.position.set(0.25, 2.0, 0); g.add(fr);
      fr.add(mesh(new THREE.SphereGeometry(0.22, 14, 10), M(c, 0.35, { emissive: c, emissiveIntensity: 0.45 })));
      fr.add(K.fxSprite('light_01', c, 1.1));
      st.fruitObj = fr;
      for (let k = 0; k < 6; k++) { const a = k * 1.05; g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M(c, 0.5), -0.8 + Math.cos(a) * 1.1, 2.1 + (k % 2) * 0.4, Math.sin(a) * 1.1)); }
      anims.push((dt, t) => { if (fr.visible) fr.position.y = 2.0 + Math.sin(t * 2 + st.fruitIdx) * 0.06; });
      if (st.fruitIdx === 8) { // 마지막 정거장: 아홉 열매를 담는 바구니
        const bk = new THREE.Group(); bk.position.set(-2.4, 0, 1.6); g.add(bk);
        bk.add(mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.5, 16, 1, true), M(0xa07a4a, 0.9, { side: THREE.DoubleSide }), 0, 0.25, 0));
        st.basket = FRUIT_COL.map((cc, k) => { const f = mesh(new THREE.SphereGeometry(0.16, 10, 8), M(cc, 0.35, { emissive: cc, emissiveIntensity: 0.5 }), Math.cos(k * 0.7) * 0.35, 0.45 + (k % 3) * 0.05, Math.sin(k * 0.7) * 0.35); f.visible = false; f.userData.dyn = true; bk.add(f); return f; });
      }
    },
    // ----- 믿음의 길 -----
    mist(g) {
      const m = []; for (let k = 0; k < 6; k++) { const s = glowAt(g, 0xffffff, 3, -1.5 + Math.cos(k) * 1.2, 0.8, Math.sin(k) * 2, 0.35); s.material.blending = THREE.NormalBlending; m.push(s); }
      glowAt(g, 0xfff0c0, 2, -2.6, 2.2, 0, 0.8); // 안개 너머의 빛
      anims.push((dt, t) => m.forEach((s, i) => { s.position.x = -1.5 + Math.cos(i + t * 0.2) * 1.4; }));
    },
    altar(g) {
      g.add(bx(1, 0.8, 1, C.stone, -1.2, 0.4, 0)); fire(g, -1.2, 1, 0, 0.7);
      const smoke = glowAt(g, 0xe8e8f0, 1.6, -1.2, 2.4, 0, 0.4); anims.push((dt, t) => { smoke.position.y = 2 + (t * 0.6 % 3); smoke.material.opacity = 0.4 * (1 - (t * 0.6 % 3) / 3); });
    },
    enoch(g) {
      const beam = mesh(new THREE.CylinderGeometry(0.5, 0.9, 14, 16, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0.25, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), -1.2, 7, 0);
      beam.castShadow = false; g.add(beam);
      g.add(bx(0.3, 0.06, 0.5, C.woodDark, -1.2, 0.04, 0.2)); g.add(bx(0.3, 0.06, 0.5, C.woodDark, -1.0, 0.04, -0.3)); // 남겨진 신발
      anims.push((dt, t) => { beam.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.08; });
    },
    ark2(g) {
      const hull = bx(1.6, 1, 4.4, C.wood, -2, 0.7, 0); g.add(hull); g.add(bx(1.2, 0.7, 2.8, C.woodDark, -2, 1.55, 0));
      const roof = mesh(new THREE.ConeGeometry(1.1, 0.6, 4), C.wood, -2, 2.2, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 2.2; g.add(roof);
      const bow = mesh(new THREE.TorusGeometry(4, 0.12, 6, 40, Math.PI), M(0xffffff, 0.3, { transparent: true, opacity: 0.5, emissive: 0xffd0a0, emissiveIntensity: 0.6 }), -3.5, 0, 0); bow.rotation.y = Math.PI / 2; g.add(bow);
    },
    tent(g) {
      const t = mesh(new THREE.ConeGeometry(1.3, 1.7, 4), M(0x8a6a4a), -1.8, 0.85, 0); t.rotation.y = Math.PI / 4; g.add(t);
      camel(g, -1.4, 2.2);
      const staff = bx(0.06, 1.8, 0.06, C.woodDark, 0, 0.9, -1.2); staff.rotation.x = 0.1; g.add(staff);
    },
    stars(g) {
      for (let k = 0; k < 20; k++) { const s = glowAt(g, 0xffffff, 0.35 + Math.random() * 0.3, -3 + Math.random() * 3, 3 + Math.random() * 4, -4 + Math.random() * 8, 0.9); anims.push((dt, t) => { s.material.opacity = 0.5 + Math.sin(t * 2 + k) * 0.4; }); }
      fig(g, 0x8a5a6a, -1, 0, 1.5);
    },
    moriah(g) {
      const hill = mesh(new THREE.SphereGeometry(2.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), rock, -1.6, 0, 0); hill.scale.y = 0.4; g.add(hill);
      g.add(bx(0.8, 0.5, 1.2, C.stone, -1.6, 1.05, 0)); for (let k = 0; k < 4; k++) g.add(bx(0.1, 0.1, 1.1, C.wood, -1.6, 1.36, -0.3 + k * 0.2));
      const ram = new THREE.Group(); ram.position.set(-0.2, 0, 1.8); g.add(ram); // 수풀에 걸린 숫양 (창 22:13)
      ram.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), M(0xe8e0d0), 0, 0.45, 0)); ram.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), M(0x8a7a5a), 0, 0.65, 0.25));
      g.add(mesh(new THREE.IcosahedronGeometry(0.5, 0), C.leaf, 0.2, 0.4, 2.3));
    },
    pyramid(g) {
      const py = mesh(new THREE.ConeGeometry(3, 3.4, 4), sand, -3.6, 1.7, 0); py.rotation.y = Math.PI / 4; g.add(py);
      g.add(bx(0.6, 0.5, 1.6, M(0x8a6a4a), -0.8, 0.25, 0)); // 요셉의 해골을 담을 궤 (출 13:19)
      palm(g, -1.4, 2.4);
    },
    reedBasket(g) {
      const w = mesh(new THREE.PlaneGeometry(4, 3), C.water, -1.6, 0.03, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      const b = mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.25, 12), M(0xb08a50, 1), -1.6, 0.12, 0); g.add(b);
      for (let k = 0; k < 8; k++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.2, 4), C.leaf, -3.4 + Math.random() * 0.6, 0.6, -1.5 + k * 0.4); r.rotation.z = (Math.random() - 0.5) * 0.3; g.add(r); }
      anims.push((dt, t) => { b.position.y = 0.12 + Math.sin(t * 1.5) * 0.03; });
    },
    waves(g) {
      for (const sd of [-1, 1]) { const w = bx(0.8, 2.8, 5, M(0x5fa8d0, 0.15, { transparent: true, opacity: 0.6, emissive: 0x1a4a70, emissiveIntensity: 0.3 }), -1.2 + sd * 1.2, 1.4, 0); w.castShadow = false; g.add(w); }
    },
    ruins(g) {
      for (let k = 0; k < 7; k++) { const b = bx(0.8 + Math.random() * 0.5, 0.5, 0.6, M(0xc8a878, 1), -1.4 - Math.random() * 2, 0.25 + (k % 2) * 0.3, -2.5 + k * 0.8); b.rotation.set(Math.random() * 0.4, Math.random() * 2, Math.random() * 0.4); g.add(b); }
    },
    scarlet(g) {
      wall(g, 0.6, 3.2, 3, -1.8, 0, M(0xc8a878, 1));
      g.add(bx(0.62, 0.7, 0.7, M(0x3a2a20), -1.8, 2.3, 0));
      g.add(bx(0.04, 2.2, 0.06, M(0xd01a2a, 0.5, { emissive: 0x700010, emissiveIntensity: 0.5 }), -1.46, 1.15, 0.1)); // 붉은 줄 (수 2:18)
    },
    witnesses(g) {
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; fig(g, 0xfffaf0, Math.cos(a) * 4, Math.sin(a) * 4, 1.4, (f) => { f.add(K.fxSprite('light_01', 0xfff0c0, 1.2)); f.children[f.children.length - 1].position.y = 1; }); }
      const cross = new THREE.Group(); cross.position.set(0, 0, -1); g.add(cross);
      cross.add(bx(0.22, 3, 0.22, C.wood, 0, 1.5, 0)); cross.add(bx(1.5, 0.22, 0.22, C.wood, 0, 2.2, 0));
      const halo = glowAt(g, 0xfff4d0, 6, 0, 2.4, -1, 0.6); anims.push((dt, t) => { halo.material.opacity = 0.45 + Math.sin(t) * 0.15; });
      flowers(g, 0, 0, 3.2, 26);
    },
  };
  return S;
}

// 장면 이름에서 설정 꺼내기 ('rack:belt' → 장면 rack, 조각 belt)
export function prepStation(kind, st) {
  if (kind && kind.startsWith('rack:')) { st.piece = kind.slice(5); return 'rack'; }
  if (kind && kind.startsWith('tree:')) { st.fruitIdx = +kind.slice(5); return 'tree'; }
  return kind;
}

// ---------- 들어설 때 효과 ----------
export function journeyEffects(K) {
  const { hit, sfx, burst, shot, me, wear } = K;
  return {
    hail(st) { if (st.hail) st.hail.T = 0; hit('impactPunch_medium_000', 0.3, 0.5); },
    sweet(st) { if (st.pool) { st.pool.material = K.C.water; } sfx('orb', 0.25, 1.1); },
    thunder2(st) { K.flash(0.9); hit('impactPunch_medium_000', 0.5, 0.4); setTimeout(() => { K.flash(0.7); hit('impactSoft_heavy_000', 0.5, 0.5); }, 700); shot(st.g.position, { dist: 16, el: 0.3, side: 0.5, dur: 6, mid: 0.6, y: 3 }); },
    lookup(st) { const p = st.look.clone(); st.g.localToWorld(p); K.faceTo(me, p); K.act('gaze', 4); },
    walls(st) { st.wallT = 0; [0, 300, 600].forEach((d) => setTimeout(() => hit('impactPlank_medium_000', 0.4, 0.5), d + 300)); },
    enlist() { wear('armor', []); hit('impactMetal_light_000', 0.3, 0.9); },
    seals(st) { (st.sealsL || []).forEach((s, i) => setTimeout(() => { s.visible = false; const p = s.getWorldPosition(new THREE.Vector3()); burst(p.x, p.y, p.z); hit('impactBell_heavy_000', 0.1, 1.2 + i * 0.1); }, 600 + i * 450)); },
    trumpets() { K.fanfare(K.audio, [392, 523, 659, 784], 0.9, 0.18, 0.05); },
  };
}

// ---------- 체험: 홍해·요단이 갈라짐, 만나 거두기, 반석 치기, 전신갑주 훈련, 열매 따기 ----------
export function journeySetup(K) {
  const { me, live, actions, avail, steps, act, faceTo, go, hit, sfx, burst, showVerse, wear, shot } = K;
  const by = (course, kind) => live.filter((S) => S.course.id === course && S.kindName === kind);
  const wpos = (S, v) => { const p = v.clone(); S.g.localToWorld(p); return p; };
  const dist = (p) => Math.hypot(me.x - p.x, me.z - p.z);
  const pieces = () => (me.av.userData.outfit === 'armor' ? me.av.userData.pieces || [] : null);

  // 홍해·요단: 다가가면 갈라지고, 멀어지면 다시 덮임
  const sea = by('exodus', 'redsea')[0], jordan = by('exodus', 'jordanDry')[0];
  let seaShot = false;
  steps.push(() => {
    if (sea) { const d = dist(sea); sea.sea.want = d < 16 ? 1 : d > 30 ? 0 : sea.sea.want; if (d < 16 && !seaShot) { seaShot = true; sfx('orb', 0.25, 0.7); hit('impactSoft_heavy_000', 0.35, 0.4); shot(sea.g.position, { dist: 16, el: 0.55, side: 0.25, dur: 6, mid: 0.6, y: 1 }); } if (d > 30) seaShot = false; }
    if (jordan) { const d = dist(jordan); jordan.jordan.want = d < 12 ? 1 : d > 26 ? 0 : jordan.jordan.want; }
  });

  // 만나: 땅에 내린 만나를 거둠 (다 거두면 다시 내림)
  const mannaS = by('exodus', 'manna')[0];
  if (mannaS) {
    let got = 0, refill = -1;
    const nearFlake = () => mannaS.flakes.find((f) => f.visible && dist(f.getWorldPosition(new THREE.Vector3())) < 2);
    actions.gather = () => { const f = nearFlake(); if (!f) return; faceTo(me, f.getWorldPosition(new THREE.Vector3())); act('plant', 0.9); setTimeout(() => { const p = f.getWorldPosition(new THREE.Vector3()); f.visible = false; burst(p.x, p.y + 0.2, p.z); sfx('orb', 0.15, 1.6); if (++got === mannaS.flakes.length) { showVerse('course-x-manna', { cooldown: 0, title: '하늘의 양식' }); refill = 40; got = 0; } }, 500); };
    avail.push(() => (dist(mannaS.show) < 6 && nearFlake() ? 'gather' : null));
    steps.push((dt) => { if (refill > 0 && (refill -= dt) <= 0) mannaS.flakes.forEach((f) => { f.visible = true; }); });
  }
  // 반석을 치면 물이 솟음
  const rockS = by('exodus', 'rockWater')[0];
  if (rockS) {
    const sp = rockS.spring, at = () => wpos(rockS, rockS.rockAt);
    actions.strike = () => go(at, () => { faceTo(me, wpos(rockS, new THREE.Vector3(-1.4, 0, 0))); act('draw', 0.8); setTimeout(() => { hit('impactPunch_medium_000', 0.4, 0.6); sp.T = 0; K.audio.splash(0.4); showVerse('course-x-rock', { cooldown: 30, delay: 3, title: '반석에서 나온 물' }); }, 500); }, 1.8);
    avail.push(() => (sp.T < 0 && dist(at()) < 3.5 ? 'strike' : null));
    steps.push((dt, t) => { if (sp.T < 0) return; sp.T += dt; sp.stream.visible = sp.T < 40; sp.stream.scale.y = 1 + Math.sin(t * 9) * 0.08; sp.pool.scale.setScalar(Math.min(1.4, sp.T * 0.5) * (sp.T < 40 ? 1 : Math.max(0.01, 1 - (sp.T - 40) / 3))); if (sp.T > 43) { sp.T = -1; sp.pool.scale.setScalar(0.01); } });
  }

  // ----- 전신갑주 훈련 -----
  const racks = live.filter((S) => S.course.id === 'armor' && S.piece);
  const nearRack = () => racks.find((S) => dist(S.show) < 3.4);
  actions.gear = () => {
    const S = nearRack(); if (!S) return;
    const have = pieces() || [];
    if (have.includes(S.piece)) return;
    act('worship', 0); act('share', 1.2);
    setTimeout(() => {
      wear('armor', [...have, S.piece]);
      burst(me.x, me.y + 1, me.z); hit('impactMetal_light_000', 0.35, 1 + have.length * 0.1); sfx('orb', 0.2, 1 + have.length * 0.1);
      if (S.holder) S.holder.visible = false;
      if (have.length + 1 === 6) setTimeout(() => showVerse('course-x-armorAll', { cooldown: 0, title: '하나님의 전신갑주' }), 1500);
    }, 900);
  };
  avail.push(() => { const S = nearRack(); const h = pieces(); return S && !(h || []).includes(S.piece) ? 'gear' : null; });
  // 걸이에 다시 걸어 둠 (훈련소로 돌아오면)
  steps.push(() => { for (const S of racks) if (S.holder && !S.holder.visible && !(pieces() || []).includes(S.piece) && dist(S.show) > 6) S.holder.visible = true; });

  // 평안의 복음의 신: 신을 신으면 앞길에 빛 고리 셋이 생기고 20초 안에 다 지나가기
  const shoeS = racks.find((S) => S.piece === 'shoes');
  if (shoeS) {
    const tr = K.TRAILS.armor, rings = [];
    for (let k = 0; k < 3; k++) {
      const q = tr.sample(shoeS.f + 0.035 + k * 0.025);
      const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 28), K.M(0xfff0c0, 0.3, { emissive: 0xffe090, emissiveIntensity: 1.2 }));
      r.position.set(q.x, K.gy(q.x, q.z) + 1.1, q.z); r.rotation.y = Math.atan2(q.dir.x, q.dir.z); r.visible = false; K.scene.add(r);
      rings.push({ r, x: q.x, z: q.z, hit: false });
    }
    let run = -1;
    steps.push((dt, t) => {
      const h = pieces();
      if (run < 0 && h && h.includes('shoes') && dist(shoeS.show) < 5 && !rings.some((g) => g.r.visible)) { run = 0; rings.forEach((g) => { g.r.visible = true; g.hit = false; g.r.scale.setScalar(1); }); }
      if (run < 0) return;
      run += dt;
      rings.forEach((g, i) => { g.r.rotation.z = t * 0.6 + i; if (!g.hit && dist(g) < 1.4) { g.hit = true; burst(g.x, g.r.position.y, g.z); sfx('orb', 0.2, 1.2 + i * 0.15); } if (g.hit) g.r.scale.multiplyScalar(Math.max(0.0, 1 - dt * 4)); });
      if (rings.every((g) => g.hit)) { run = -1; rings.forEach((g) => { g.r.visible = false; }); K.fanfare(K.audio, [523, 659, 784], 0.6, 0.15, 0.05); showVerse('course-x-feet', { cooldown: 0, delay: 0.6, title: '복음의 발' }); setTimeout(() => { run = -2; }, 0); }
      else if (run > 20 || dist(shoeS.show) > 60) { run = -1; rings.forEach((g) => { g.r.visible = false; }); }
    });
  }

  // 믿음의 방패: 망루에서 불화살이 날아옴. 방패를 들어(막기) 다섯 개를 막으면 끝
  const shieldS = racks.find((S) => S.piece === 'shield');
  if (shieldS) {
    const darts = []; let spawn = 2, blocked = 0, done = false, block = 0;
    const geo = new THREE.ConeGeometry(0.06, 0.6, 6); geo.rotateX(Math.PI / 2);
    const mat = K.M(0xff6020, 0.4, { emissive: 0xff4010, emissiveIntensity: 1.4 });
    actions.block = () => { block = 1.6; me.action = 'block'; faceTo(me, wpos(shieldS, shieldS.tower)); setTimeout(() => { if (me.action === 'block') me.action = null; }, 1600); hit('impactMetal_light_000', 0.15, 1.4); };
    const ready = () => { const h = pieces(); return h && h.includes('shield') && dist(shieldS.show) < 9; };
    avail.push(() => (ready() && !done ? 'block' : null));
    steps.push((dt) => {
      block -= dt;
      if (ready() && !done) {
        if ((spawn -= dt) < 0) {
          spawn = 2.4 + Math.random();
          const from = wpos(shieldS, shieldS.tower);
          const m = new THREE.Mesh(geo, mat); m.add(K.fxSprite('light_01', 0xff8040, 0.8)); m.position.copy(from); K.scene.add(m);
          darts.push({ m, from, T: 0 });
          sfx('impact/impactPunch_medium_000', 0.1, 1.6);
        }
      } else if (!ready()) { spawn = 2; if (dist(shieldS.show) > 30) { done = false; blocked = 0; } }
      for (let i = darts.length - 1; i >= 0; i--) {
        const D = darts[i]; D.T += dt;
        const k = Math.min(1, D.T / 1.8), to = new THREE.Vector3(me.x, me.y + 1.0, me.z);
        const p = D.from.clone().lerp(to, k); p.y += Math.sin(k * Math.PI) * 2;
        D.m.lookAt(p); D.m.position.copy(p);
        if (k >= 1) {
          K.scene.remove(D.m); darts.splice(i, 1);
          if (block > 0) { burst(p.x, p.y, p.z); hit('impactMetal_light_000', 0.35, 0.8); if (++blocked >= 5 && !done) { done = true; K.fanfare(K.audio, [523, 659, 784, 1047], 0.8, 0.18, 0.05); showVerse('course-x-shield', { cooldown: 0, delay: 0.5, title: '믿음의 방패' }); } }
          else { K.flash(0.25); hit('impactSoft_medium_000', 0.2, 0.8); }
        }
      }
    });
  }

  // 성령의 검: 허수아비를 말씀의 검으로 (예수님이 시험을 이기신 세 말씀)
  const swordS = racks.find((S) => S.piece === 'sword');
  if (swordS) {
    let cut = 0;
    const nearDummy = () => swordS.dummies.find((d) => !d.down && dist(d.g.getWorldPosition(new THREE.Vector3())) < 2.2);
    actions.slash = () => {
      const d = nearDummy(); if (!d) return;
      faceTo(me, d.g.getWorldPosition(new THREE.Vector3())); me.action = 'slash'; me.slashT = 0.45;
      setTimeout(() => { if (me.action === 'slash') me.action = null; }, 600);
      setTimeout(() => { d.down = true; d.T = 0; const p = d.g.getWorldPosition(new THREE.Vector3()); burst(p.x, p.y + 1.3, p.z); hit('impactPlank_medium_000', 0.4, 1.1); showVerse('course-x-sword' + (cut % 3), { cooldown: 0, title: '기록되었으되' }); cut++; }, 280);
    };
    avail.push(() => { const h = pieces(); return h && h.includes('sword') && nearDummy() ? 'slash' : null; });
    steps.push((dt) => { for (const d of swordS.dummies) { if (d.T < 0) continue; d.T += dt; d.g.rotation.x = -Math.min(1, d.T * 2) * 1.4; if (d.T > 25) { d.T = -1; d.down = false; d.g.rotation.x = 0; } } });
  }
  // 마지막: 전신갑주를 다 입고 오면 어둠이 물러감
  const standS = by('armor', 'stand')[0];
  if (standS) steps.push(() => { if (standS.foe.T < 0 && standS.foe.g.visible && dist(standS.g.position) < 6) { const h = pieces(); if (h && h.length >= 6) { standS.foe.T = 0; hit('impactSoft_heavy_000', 0.4, 0.4); setTimeout(() => showVerse('course-x-soldier', { cooldown: 0, title: '그리스도 예수의 좋은 군사' }), 9000); } } if (dist(standS.g.position) > 60 && !standS.foe.g.visible) { standS.foe.g.visible = true; standS.foe.T = -1; standS.foe.g.position.set(0, 0.3, -2.6); standS.foe.g.scale.setScalar(1); } });

  // ----- 성령의 열매: 나무마다 열매를 따서 바구니에 -----
  const trees = live.filter((S) => S.course.id === 'fruit' && S.fruitObj).sort((a, b) => a.fruitIdx - b.fruitIdx);
  const basket = trees.find((S) => S.basket);
  const picked = new Set();
  const nearTreeS = () => trees.find((S) => S.fruitObj.visible && dist(S.show) < 4.2);
  actions.pick = () => {
    const S = nearTreeS(); if (!S) return;
    const p = S.fruitObj.getWorldPosition(new THREE.Vector3());
    faceTo(me, p); act('shoot', 0.8);
    setTimeout(() => {
      S.fruitObj.visible = false; burst(p.x, p.y, p.z); sfx('orb', 0.2, 1 + S.fruitIdx * 0.08);
      picked.add(S.fruitIdx); if (basket) basket.basket[S.fruitIdx].visible = true;
      if (picked.size === 9) setTimeout(() => { K.fanfare(K.audio, [523, 659, 784, 1047], 1, 0.2, 0.06); showVerse('course-x-fruits', { cooldown: 0, title: '아홉 가지 열매' }); }, 900);
    }, 500);
  };
  avail.push(() => (nearTreeS() ? 'pick' : null));
  steps.push(() => { if (picked.size && trees.length && trees.every((S) => dist(S.show) > 70)) { picked.clear(); trees.forEach((S) => { S.fruitObj.visible = true; }); if (basket) basket.basket.forEach((f) => { f.visible = false; }); } });
}
