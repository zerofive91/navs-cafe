// 사도행전 마을 등록부 항목 (2026-11 0-나 땅과 바다: 마을을 엶. 사건은 1차부터)
//   기획: /mnt/project-files/plans/acts-village-plan.md (repo 밖). 땅·구역·항구·배 노선은 js/acts/layout.js(그림 없음, addRegion으로 땅 등록),
//   모형은 처음 들어갈 때 dynamic import (load → js/acts/build.js). 필드 설명은 js/villages/registry.js 맨 위
//   지금 있는 것: 땅·바다·섬 둘·길, 구역 17곳 빈 자리와 팻말, 항구 열한 곳, 쉼 자리, 수레꾼 아리스다고. 배 노선 일곱은 자료만 (타기는 2차 나)
import { REGION, CART, ZONES, SUBS, PORTS, ISLANDS, TRANSIT, AX, AZ, HALF_W, HALF_D, SEA, AEGEAN, ROADS, STREAM, PLAZA, SEATS_A, REST_SPOTS, AC_ACTS } from '../acts/layout.js';
import { TOWN_SAVES } from './saves.js';
import { ACTS_EVENTS } from '../profile.js';

const zoneAt = (id) => (id === 'jerusalem'
  ? { p: CART.arrive, look: CART.look }
  : { p: { x: ZONES[id].x, z: ZONES[id].z + ZONES[id].r * 0.5 }, look: { x: ZONES[id].x, z: ZONES[id].z } });
// 걸어서 갈 수 있는 구역 (섬 둘은 배 노선이 열리면: 2차 나). 병거·지도 목록이 씀
const LAND = Object.entries(ZONES).filter(([, z]) => !z.island);

export default {
  id: 'acts', name: '사도행전 마을', short: '사도행전', book: '사도행전', status: 'open',
  region: REGION,
  cart: CART, // 다락방 광장 남쪽 끝 (x, z, rot, stand, arrive, look). 갈 곳은 등록부 destinations (초보자 마을·요한복음 마을)
  // 입장 조건: 요한 마을과 같음 (기획서 12장 결정 4 A: 정원 안내를 마친 사람 누구나, 요한 마을을 먼저 권함)
  entry: (profile) => (profile.tut?.garden ? true : '정원지기 아담에게 정원 안내를 받으면 수레를 탈 수 있어요'),
  guide: {
    // 아리스다고 (행 19:29 · 20:4 · 27:2): 바울과 함께 다니던 마게도냐 데살로니가 사람. 요한 마을 수레꾼 두기고(20:4)와 같은 일행
    name: '수레꾼 아리스다고', look: { hoodie: 0x5f7a8c, hair: 0x2a221c, style: 0 },
    at: () => ({ x: CART.stand.x - 2.6, z: CART.stand.z - 0.6 }), // 수레 곁 서쪽 (요한 마을 두기고와 같은 놓임)
  },
  travel: {
    going: '사도행전 마을로 가는 중',
    arrive: '사도행전 마을에 왔어요',
    first: '사도행전 마을에 왔어요. 바다를 둘러 예루살렘에서 로마까지 길이 나 있어요. 마을은 지금 짓는 중이에요. 둘러보며 쉬어 가세요',
    // 흐린 막에 보이는 말씀 (사도행전 1:8, 개역한글). 구절 키(ac-…)는 1차에서 verses.js에 더함
    veil: ['오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅끝까지 이르러 내 증인이 되리라 하시니라', '사도행전 1:8'],
  },
  load({ q = '', scene, occluders, makeCart, makeSignpost }) {
    return import(`../acts/build.js${q}`).then((m) => {
      const r = m.buildActs({ scene, occluders, makeCart, makeSignpost });
      return { root: r.root, cart: r.cart, engine: null }; // 사건 엔진은 1차부터 (js/acts/engine.js)
    });
  },
  acts: AC_ACTS,
  save: TOWN_SAVES.find((t) => t.town === 'acts'), // profile.acts
  events: ACTS_EVENTS,
  progress: (profile) => ({ done: ACTS_EVENTS.filter((id) => profile.acts?.ev?.[id]?.done).length, total: ACTS_EVENTS.length }),
  // 병거는 같은 마을 안에서만: 걸어서 갈 수 있는 구역 15곳
  trips: {
    list: () => LAND.map(([id, z]) => ['a:' + id, z.name]),
    at: (id) => zoneAt(id.slice(2)),
  },
  map: {
    fit: (W, H) => { const k = Math.min(W / (HALF_W * 2 + 20), (H - 110) / (HALF_D * 2 + 20)) * 0.98; return { k, cx: AX, cz: AZ + 10 / k }; },
    title: '사도행전 마을',
    picks: () => LAND.map(([id, z]) => [id, z.name, id === 'jerusalem' ? '#ffe2a0' : '#d9c39a']),
    pick: (id) => zoneAt(id).p,
    // 땅·바다·섬·길·항구·배 노선(연 것은 실선)·구역 빈 자리·광장·수레
    draw({ g, sx, sy, k, W, H, line, circle, label }) {
      g.fillStyle = '#20282a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#b4b47c'; g.beginPath(); g.roundRect(sx(AX - HALF_W), sy(AZ - HALF_D), HALF_W * 2 * k, HALF_D * 2 * k, 10); g.fill();
      const gr = g.createLinearGradient(sx(AX - HALF_W), 0, sx(AX + HALF_W), 0); // 서쪽은 푸르게, 동쪽은 마르게
      gr.addColorStop(0, 'rgba(110,150,90,0.5)'); gr.addColorStop(1, 'rgba(210,190,130,0.45)');
      g.fillStyle = gr; g.beginPath(); g.roundRect(sx(AX - HALF_W), sy(AZ - HALF_D), HALF_W * 2 * k, HALF_D * 2 * k, 10); g.fill();
      g.fillStyle = '#3a85ad';
      for (const E of [SEA, AEGEAN]) { g.beginPath(); g.ellipse(sx(AX + E.u), sy(AZ + E.v), E.ru * k, E.rv * k, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#c9c08a';
      for (const I of Object.values(ISLANDS)) { g.beginPath(); g.arc(sx(I.x), sy(I.z), I.r * k, 0, Math.PI * 2); g.fill(); }
      line(STREAM.map(([u, v]) => ({ x: AX + u, z: AZ + v })), '#5aa0c0', Math.max(1.5, 2.2 * k));
      for (const r of ROADS) line(r.map(([u, v]) => ({ x: AX + u, z: AZ + v })), 'rgba(240,226,190,0.85)', Math.max(1.5, 2.6 * k));
      // 배 노선: 아직 안 연 것은 흐린 점선
      for (const R of TRANSIT) {
        if (R.kind === 'road') continue;
        line(R.route, 'rgba(230,240,255,0.45)', 1.2, [4, 5]);
      }
      for (const p of Object.values(PORTS)) circle(p.at.x, p.at.z, 1.1, '#e8d8b0', '#5a4128', 1, 3);
      for (const [id, z] of Object.entries(ZONES)) {
        circle(z.x, z.z, z.r, id === 'jerusalem' ? 'rgba(255,240,200,0.55)' : 'rgba(250,240,215,0.22)', 'rgba(255,245,215,0.7)', 1.2);
        label(z.name, z.x, z.z, { size: Math.max(9, Math.min(12, 2.2 * k + 6)), color: '#fff6e0', dy: id === 'jerusalem' ? -2 : 0 });
      }
      for (const s of Object.values(SUBS)) { circle(s.x, s.z, s.r, 'rgba(250,240,215,0.18)', 'rgba(255,245,215,0.5)', 1); label(s.name, s.x, s.z, { size: 9, color: '#f4ead2' }); }
      circle(PLAZA.x, PLAZA.z, 1.6, '#fff1c8', null, 1, 4);
      circle(CART.x, CART.z, 1.6, '#c99a5e', '#fff', 1.5, 4.5); label('수레', CART.x, CART.z, { size: 10, dy: 12 });
      label('사도행전 마을', AX, AZ - HALF_D - 6, { size: 13, color: '#fff6dc', weight: 700 });
    },
  },
  bodyClass: 'region-acts',
  trialSet: 'acts', // 시험 자료집 세트 (참조만)
  // ---- 선택 필드 (기획서 9장). 지금 엔진이 읽지 않는 것은 자리만 ----
  center: { x: AX, z: AZ }, half: { w: HALF_W, d: HALF_D },
  zones: ZONES,          // 구역 17곳 (병거 trips·지도 picks가 씀, 섬 둘은 2차 나부터)
  subs: SUBS,            // 곁 자리: 가이사랴·밀레도·보디올 항·압비오 저자
  ports: PORTS,          // 항구 열한 곳 { at 서는 자리, boat 배 자리, zone }
  seats: SEATS_A,        // 앉을 자리 (js/acts/layout.js가 layout seats에 이미 넣음, 참조만)
  rest: null,            // 쉼 놀이 판정 구역 (사도행전 1차 이후, 요한 E4와 같은 모양)
  restSpots: REST_SPOTS, // 쉼 자리 열다섯 (자리 말씀 머무름은 1차 이후 seatVerse로)
  seatVerse: null,
  transit: TRANSIT,      // 배 노선 일곱 { id, name, kind 'ship'|'road', from, to, route, opens, ref, open(profile) } — 타기는 2차 나 (js/village/transit.js)
  shopGoods: ['chariot', 'donkey', 'oil', 'salve'], // 수레꾼 아리스다고의 수레 짐 (요한 E6과 같은 모양, 여는 일은 그 뒤)
  quietZones: [],        // 1차에서 스데반 자리
  errands: null, daily: null, pieces: null,
  folk: null,            // (profile) → 지금 보여 줄 주민 목록 (자라는 마을, 1차부터)
  companions: [],
  next: '',
};
