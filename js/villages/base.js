// 초보자 마을 (카페·정원·숲길) 등록부 항목 (2026-11 마을 등록부)
//   땅은 원점 둘레(js/layout.js, region 없음). 숲길 코스·정원 부탁·가게·훈련장은 그대로 각 모듈에 있고, 여기는 마을 사이 일에 쓰는 것만 모음
//   필드 설명은 js/villages/registry.js 맨 위
import { VILLAGE_GATE, PARK, SPAWN, isFree } from '../layout.js';
import { nearestFree } from '../nav.js';

const G = VILLAGE_GATE;
// 병거 목적지 (shop.js 병거 삯): 같은 마을 안에서만
const TRIPS = [
  ['cafe', '카페 입구'], ['market', '루디아의 가게'],
  ['t_word', '말씀 훈련장'], ['t_pray', '기도 훈련장'], ['t_fellow', '교제 훈련장'], ['t_witness', '증거 훈련장'], ['t_obey', '순종 훈련장'],
  ['warfare', '영적 전쟁 훈련소'], ['emmaus', '엠마오 가는 길'], ['mount', '산 위의 가르침'], ['prison', '빌립보 감옥'], ['shiloh', '실로의 성막'], ['meadow', '푸른 초장'], ['sower', '씨 뿌리는 밭'], ['mustard', '겨자씨'], ['vine', '포도나무'], ['fold', '잃은 양'], ['well', '우물'],
  ['jericho', '여리고 성'], ['david', '다윗과 골리앗'], ['jonah', '요나의 바다'], ['ark', '노아의 방주'],
  ['zacc', '삭개오의 뽕나무'], ['road', '여리고 길'], ['wild', '들짐승 들판'], ['bethsaida', '벳새다 들녘'],
].filter(([id]) => id === 'cafe' || PARK[id]);

export default {
  id: 'base', name: '초보자 마을', short: '초보자', book: '', status: 'open',
  region: null, // 원점 둘레 (x < FAR_X)
  // 정원 바깥 둘레길 246°의 마을 길목. 다른 마을에서 돌아오면 수레에 오르는 자리(stand)에 서서 카페 쪽을 봄
  cart: { x: G.cart.x, z: G.cart.z, rot: G.rot - Math.PI / 2, stand: G.stand, arrive: G.stand, look: { x: 0, z: 0 }, sign: G.sign, signRot: Math.atan2(-G.n.x, -G.n.z) },
  entry: () => true,
  guide: {
    name: '수레꾼 에바브라', look: { hoodie: 0xb08a58, hair: 0x4a3324, style: 1 },
    at: () => { const p = G.at(-1.0, 4.7); return isFree(p.x, p.z) ? p : (nearestFree(p) || p); }, // 이정표와 수레 사이
  },
  travel: { going: '초보자 마을로 돌아가는 중', arrive: '초보자 마을로 돌아왔어요' },
  load: null, acts: [], save: null,
  events: [], progress: null,
  trips: {
    list: () => TRIPS,
    at(id) {
      if (id === 'cafe') return { p: { x: SPAWN.x, z: SPAWN.z + 6 }, look: { x: 0, z: 0 } };
      const z = PARK[id];
      return { p: z.at(0, -(z.d / 2 + 3)), look: { x: z.x, z: z.z } };
    },
  },
  map: null, // map.js 본래 그림 (숲길 코스·정원 구역·훈련장)
  bodyClass: '',
  trialSet: 'forest', // 숲길 시험 (참조만)
  // ---- 선택 필드 (사도행전 기획서 9장 "등록부 요구사항"). 초보자 마을은 각 모듈에 그대로 있어 비워 둠 ----
  center: { x: 0, z: 0 }, half: null, seats: null, rest: null, seatVerse: null, transit: [], shopGoods: [], quietZones: [],
  errands: null, daily: null, pieces: null, folk: null, companions: [], next: 'john',
};
