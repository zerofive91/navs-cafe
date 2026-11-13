// 요한복음 마을 장면 영상 자료 (2026-11 T04 P1). 재생기는 js/village/scene.js, 대본은 t04-scene-scripts.md J1
//   글(자막·말·한 줄·한 걸음 더)은 대본 글자 그대로. 장절 표시는 대본의 근거라 화면에 넣지 않음
//   예수님은 따뜻한 빛(light)만. 예수님의 말씀은 말씀 카드(word)로만. 사람의 말(say)은 본문에 있는 말과 증인의 안내 말(★) 한 가지
//   자리는 (P) => 자리 (P = js/john/layout.js SP). at(p, du, dv): 그 자리에서 조금 옮긴 곳
const at = (p, du = 0, dv = 0) => ({ x: p.x + du, z: p.z + dv });

export const SCENES = {
  // ---------- 가나의 혼인잔치 (요 2:1-11) ----------
  //   무대: 가나 잔치 집 마당. 배우: 하인(증인)·연회장·손님·신랑(있는 사람) + 장면 때만 서는 예수님의 어머니·제자 둘·다른 하인
  //   따뜻한 빛: 식탁 서쪽 끝 곁 (차양 밖) → (5) 돌항아리 곁 → (10) 식탁 곁에서 환해짐
  cana: {
    title: '가나의 혼인잔치', sky: 'feast', max: 70,
    view: { at: (P) => at(P.feast[1], 0.5, 1.6), face: (P) => at(P.servant, 1.0, 0) }, // 서서 보는 자리: 식탁 북쪽, 식탁·빛·항아리가 함께 보임
    cast: ['servant', 'master', 'guest0', 'guest1'],
    extras: {
      sc_mom: { name: '예수님의 어머니', look: { hoodie: 0x4a5a7a, hair: 0x2b211c, style: 1 }, at: (P) => at(P.guests[0], 0.2, -1.3), faceTo: (P) => P.feast[0] },
      sc_dis0: { name: '제자', look: { hoodie: 0x6a8aa8, hair: 0x4a3324 }, at: (P) => at(P.feast[0], -4.2, 0.0), faceTo: (P) => P.feast[0] },
      sc_dis1: { name: '제자', look: { hoodie: 0x8a9a6a, hair: 0x2b211c }, at: (P) => at(P.feast[0], -4.4, -2.0), faceTo: (P) => P.feast[0] },
      sc_serv: { name: '하인', look: { hoodie: 0xd8ccb0, hair: 0x2b211c }, at: (P) => at(P.servant, -1.2, 0.4), faceTo: (P) => P.feast[0] },
    },
    open: [
      // 1 마당 전경, 식탁에 손님들, 식탁 곁에 따뜻한 빛
      { fx: ['jars', 'empty'], light: { at: (P) => at(P.feast[0], -3.0, -1.0) }, cam: { at: (P) => P.feast[1], dist: 13, el: 0.42, side: 0.25, mid: 0.55, y: 1.2 },
        sub: '가나 마을에 결혼 잔치가 열렸어요. 예수님과 제자들도 초대받았어요.' },
      // 2 하인이 빈 항아리를 기울여 봄
      { walk: { who: 'servant', to: (P) => at(P.servant, 0.95, -0.2) }, cam: { at: (P) => at(P.servant, 0.9, -0.6), dist: 5, el: 0.08, side: 0.35, mid: 0.92, y: 1.0 }, wait: 1.2 },
      { pose: { who: 'servant', act: 'water', face: (P) => at(P.servant, 0.95, -1.2) },
        sub: '그런데 큰일이에요. 포도주가 다 떨어졌어요. 잔치 집은 무척 부끄러웠을 거예요.' },
      // 3 예수님의 어머니가 빛 쪽으로 다가가 섬
      { pose: { who: 'servant', act: null }, walk: { who: 'sc_mom', to: (P) => at(P.feast[0], -2.0, -2.3), slow: 0.7 }, cam: { at: (P) => at(P.feast[0], -2.4, -1.6), dist: 8, el: 0.3, side: -0.3, mid: 0.7 }, wait: 2.2 },
      { pose: { who: 'sc_mom', face: (P) => at(P.feast[0], -3.0, -1.0) }, say: ['예수님의 어머니', '포도주가 없구나.'] },
      // 4 어머니가 하인들 쪽으로 돌아섬, 하인 둘이 귀를 기울임
      { pose: { who: 'sc_mom', look: 'servant' }, cam: { at: (P) => at(P.servant, 1.4, 1.0), dist: 5, el: 0.08, side: 0.5, mid: 0.92, y: 1.0 } },
      { pose: { who: 'servant', act: 'wait', look: 'sc_mom' }, sub: '어머니가 하인들에게 말했어요.', word: 'jn-2-5' },
      // 5 돌항아리 여섯, 빛이 항아리 곁으로 옮겨 옴
      { light: { at: (P) => at(P.servant, 3.1, 0.1) }, pose: { who: 'sc_serv', act: 'wait', look: 'sc_mom' }, cam: { at: (P) => at(P.servant, 0.4, -1.0), dist: 5, el: 0.08, side: 0.2, mid: 0.92, y: 1.0 },
        sub: '큰 돌항아리 여섯 개가 있었어요. 예수님이 말씀하셨어요.', word: 'jn-2-7' },
      // 6 하인이 아이를 바라보며 손짓
      { pose: { who: 'servant', act: 'wave', look: 'me' }, cam: { at: (P) => P.servant, dist: 5, el: 0.08, side: 0.6, mid: 0.92, y: 1.0 },
        say: ['하인', '우리 같이 물을 길어 와요!'] },
    ],
    close: [
      // 7 연회장이 잔을 들어 맛보고 놀라 뒤로 물러남
      { fx: ['jars', 'wine'], light: { at: (P) => at(P.feast[0], -3.0, -1.0) }, pose: { who: 'master', act: 'sip', look: 'guest1' }, cam: { at: (P) => P.master, dist: 6.5, el: 0.28, side: 0.45, mid: 0.7 }, wait: 1.6 },
      { pose: { who: 'master', act: null }, walk: { who: 'master', to: (P) => at(P.master, 0.9, 0.3), slow: 0.5 }, sfx: ['orb', 0.22, 1.2],
        sub: '잔치 맡은 사람이 맛을 보고 깜짝 놀랐어요. 물이 좋은 포도주가 되었거든요.' },
      // 8 연회장이 신랑에게
      { pose: { who: 'master', act: 'wave', look: 'guest1' }, cam: { at: (P) => at(P.guests[1], 1.4, 0.3), dist: 6.5, el: 0.28, side: -0.4, mid: 0.7 },
        say: ['연회장', '지금까지 좋은 포도주를 남겨 두었군요!'] },
      // 9 하인 둘이 서로 마주 봄
      { pose: { who: 'servant', act: null, look: 'sc_serv' }, cam: { at: (P) => at(P.servant, -0.6, 0.2), dist: 5, el: 0.08, side: 0.4, mid: 0.92, y: 1.0 } },
      { pose: { who: 'sc_serv', act: null, look: 'servant' }, sub: '어디서 났는지 하인들은 알았어요. 말씀대로 물을 채운 사람들이니까요.' },
      // 10 빛이 환해지고 제자 둘이 빛 쪽으로 돌아섬
      { light: { at: (P) => at(P.feast[0], -3.0, -1.0), k: 1.6 }, pose: { who: 'sc_dis0', act: 'praise', face: (P) => at(P.feast[0], -3.0, -1.0) },
        cam: { at: (P) => at(P.feast[0], -3.0, -1.0), dist: 8, el: 0.32, side: -0.25, mid: 0.75, y: 1.5 }, sfx: ['orb', 0.25, 1.0], wait: 1.2 },
      { pose: { who: 'sc_dis1', act: 'praise', face: (P) => at(P.feast[0], -3.0, -1.0) },
        sub: '이것이 예수님의 첫 번째 표적이에요. 제자들이 예수님을 믿었어요.', word: 'jn-2-11' },
    ],
    line: '표적은 "예수님이 누구신지 보여 주는 표시"예요. 예수님은 말씀으로 물을 포도주로 바꾸시는 분이에요.',
    more: {
      text: '요한은 예수님이 하신 많은 일 가운데 몇 가지만 골라 적었어요. 왜 그랬는지 책 끝에 써 두었어요.',
      word: 'jn-20-31',
      ask: '하인들은 왜 까닭도 모르면서 물을 끝까지 채웠을까요?',
    },
  },
};
