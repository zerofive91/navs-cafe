// 요한복음 마을 등록부 항목 (2026-11 마을 등록부)
//   땅·구역·수레 자리는 js/john/layout.js(그림 없음, addRegion으로 땅 등록), 모형·사건은 처음 들어갈 때 dynamic import (load)
//   필드 설명은 js/villages/registry.js 맨 위
import { REGION, CART, ZONES, JN_ACTS, JX, JZ, HALF_W, HALF_D, LAKE, RIVER, RIVER_HALF, ROADS, PLAZA, SEATS_J } from '../john/layout.js';
import { TOWN_SAVES } from './saves.js';
import { JOHN_EVENTS } from '../profile.js';

// 마친 사건 수 (사건 'word'는 '와 보라'에 합쳐져 있어 22개)
const EVENTS = JOHN_EVENTS.filter((id) => id !== 'word');
const zoneAt = (id) => (id === 'light' ? { p: CART.arrive, look: CART.look } : { p: { x: ZONES[id].x, z: ZONES[id].z + ZONES[id].r * 0.5 }, look: { x: ZONES[id].x, z: ZONES[id].z } });

export default {
  id: 'john', name: '요한복음 마을', short: '요한복음', book: '요한복음', status: 'open',
  region: REGION,
  cart: CART, // 빛의 광장 남쪽 끝 (x, z, rot, stand, arrive, look)
  // 입장 조건: 정원 안내(아담)를 마쳤거나 '안내 끝내기'로 넘긴 사람 (기획서 9장 결정 3)
  entry: (profile) => (profile.tut?.garden ? true : '정원지기 아담에게 정원 안내를 받으면 수레를 탈 수 있어요'),
  guide: {
    name: '수레꾼 두기고', look: { hoodie: 0x7a6a52, hair: 0x2b211c, style: 0 },
    at: () => ({ x: CART.stand.x - 2.6, z: CART.stand.z - 0.6 }), // 수레 곁 서쪽. 마을 길 격자는 처음 들어갈 때 생기므로 계산한 자리 그대로
  },
  travel: {
    going: '요한복음 마을로 가는 중',
    arrive: '요한복음 마을에 왔어요',
    first: '요한복음 마을에 왔어요. 마을은 지금 짓는 중이에요. 둘러보며 쉬어 가세요',
    firstVerse: 'jn-20-31',
  },
  // 처음 들어갈 때: 모형(build)과 사건 모듈(engine·events·trials·modes)을 같은 주소 끝(q, 다시 시도할 때 ?retry=n)으로 불러 지음
  //   사건이 고장 나도 마을 오가기는 되도록 엔진은 따로 감쌈
  load({ q = '', scene, occluders, makeCart, makeSignpost, kit, here }) {
    return Promise.all(['build', 'engine', 'events', 'trials', 'modes', 'daily'].map((n) => import(`../john/${n}.js${q}`).catch((e) => { if (n !== 'daily') throw e; console.warn('오늘의 마을 모듈을 불러오지 못했어요', e); return null; }))).then(([m, E, Ev, Tr, Md, Dy]) => {
      const r = m.buildJohn({ scene, occluders, makeCart, makeSignpost });
      let engine = null;
      try {
        if (kit) {
          // 오늘의 마을(js/village/daily.js)을 사건 엔진에 이음: 엔진은 그대로 두고 kit.onChange와 엔진 객체를 한 겹 감쌈. 이음이 고장 나도 사건 엔진은 그대로 씀
          let link = null;
          try { link = Dy ? Dy.linkDaily({ ...kit, here }) : null; } catch (e) { console.warn('오늘의 마을을 준비하지 못했어요', e); }
          engine = E.initJohn({ ...(link ? link.kit : kit), here }, r, { EV: Ev.EV, ORDER: Ev.ORDER, initTrials: Tr.initTrials, initModes: Md.initModes });
          if (link) { try { engine = link.attach(engine, r, Ev); } catch (e) { console.warn('오늘의 마을을 사건 엔진에 잇지 못했어요', e); } }
        }
      } catch (e) { console.warn('요한복음 마을 사건을 준비하지 못했어요', e); }
      return { root: r.root, cart: r.cart, engine };
    });
  },
  acts: JN_ACTS, // 그 자리 단추 (main.js ACTIONS에 미리 등록, 엔진이 생기면 넘김)
  save: TOWN_SAVES.find((t) => t.town === 'john'), // profile.john
  events: EVENTS,
  progress: (profile) => ({ done: EVENTS.filter((id) => profile.john?.ev?.[id]?.done).length, total: EVENTS.length }),
  // 병거는 같은 마을 안에서만: 구역 12곳
  trips: {
    list: () => Object.entries(ZONES).map(([id, z]) => ['j:' + id, z.name]),
    at: (id) => zoneAt(id.slice(2)),
  },
  map: {
    fit: (W, H) => { const k = Math.min(W / (HALF_W * 2 + 20), (H - 110) / (HALF_D * 2 + 20)) * 0.98; return { k, cx: JX, cz: JZ + 10 / k }; },
    // 구역 목록 (이름을 누르면 그 빈 자리로 걸어감)
    title: '요한복음 마을',
    picks: () => Object.entries(ZONES).map(([id, z]) => [id, z.name, id === 'light' ? '#ffe2a0' : '#d9c39a']),
    pick: (id) => zoneAt(id).p,
    // 땅·호수·요단강·길·구역 빈 자리·빛의 광장·수레
    draw({ g, sx, sy, k, W, H, line, circle, label }) {
      g.fillStyle = '#2a2a20'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#9fa66f'; g.beginPath(); g.roundRect(sx(JX - HALF_W), sy(JZ - HALF_D), HALF_W * 2 * k, HALF_D * 2 * k, 10); g.fill();
      // 북(갈릴리)은 푸르게, 남(유대)은 마르게
      const gr = g.createLinearGradient(0, sy(JZ - HALF_D), 0, sy(JZ + HALF_D));
      gr.addColorStop(0, 'rgba(110,150,90,0.55)'); gr.addColorStop(1, 'rgba(200,180,120,0.45)');
      g.fillStyle = gr; g.beginPath(); g.roundRect(sx(JX - HALF_W), sy(JZ - HALF_D), HALF_W * 2 * k, HALF_D * 2 * k, 10); g.fill();
      g.save(); g.translate(sx(JX + LAKE.u), sy(JZ + LAKE.v)); g.scale(LAKE.ru, LAKE.rv);
      g.beginPath(); g.arc(0, 0, k, 0, Math.PI * 2); g.restore(); g.fillStyle = '#3a8fb5'; g.fill();
      line(RIVER.map(([u, v]) => ({ x: JX + u, z: JZ + v })), '#3a8fb5', Math.max(2, RIVER_HALF * 2 * k));
      for (const r of ROADS) line(r.map(([u, v]) => ({ x: JX + u, z: JZ + v })), 'rgba(240,226,190,0.85)', Math.max(1.5, 2.6 * k));
      for (const [id, z] of Object.entries(ZONES)) {
        circle(z.x, z.z, z.r, id === 'light' ? 'rgba(255,240,200,0.55)' : 'rgba(250,240,215,0.22)', 'rgba(255,245,215,0.7)', 1.2);
        label(z.name, z.x, z.z, { size: Math.max(10, Math.min(13, 2.4 * k + 7)), color: '#fff6e0', dy: id === 'light' ? -2 : 0 });
      }
      circle(PLAZA.x, PLAZA.z, 1.6, '#fff1c8', null, 1, 4);
      circle(CART.x, CART.z, 1.6, '#c99a5e', '#fff', 1.5, 4.5); label('수레 (초보자 마을)', CART.x, CART.z, { size: 10, dy: 12 });
      label('요한복음 마을', JX, JZ - HALF_D - 6, { size: 13, color: '#fff6dc', weight: 700 });
    },
  },
  bodyClass: 'region-john',
  trialSet: 'john', // 요한 마을 시험 (js/john/trials.js, 참조만)
  // ---- 선택 필드 (사도행전 기획서 9장 "등록부 요구사항"). 지금 엔진이 읽지 않는 것은 자리만 (값은 지금 쓰는 곳을 가리킴) ----
  center: { x: JX, z: JZ }, half: { w: HALF_W, d: HALF_D },
  zones: ZONES,          // 구역 12곳 (병거 trips·지도 picks가 씀)
  seats: SEATS_J,        // 앉을 자리 (js/john/layout.js가 layout seats에 이미 넣음, 참조만)
  rest: null,            // 쉼 놀이 판정 구역 [{ kind: 'shore'|'hill'|'roof', at, r, verse }] (요한 채우기 단위에서)
  seatVerse: null,       // (seat) → 머무름 묵상 구절 키
  transit: [],           // 마을 안 이동 노선 [{ id, from, to, route, open(profile) }] (밤바다 배는 사건 전용 galilee.js)
  shopGoods: [],         // 수레꾼이 파는 물품 id
  quietZones: ['passion'], // 부탁·오늘의 일을 두지 않는 구역 (수난과 동산 Z11)
  errands: null, daily: 'js/john/daily.js', pieces: null, // 공용 장치 자료 모듈 경로 (요한 채우기 E1·E3·E5). daily는 load가 같은 이름으로 불러옴 (등록부는 값만 둠)
  folk: null,            // (profile) → 지금 보여 줄 주민 목록 (자라는 마을)
  companions: [],        // 데리고 다닐 수 있는 동행
  next: 'acts',          // 졸업 뒤 다음 마을 (사도행전 마을이 열리면 안내에 씀)
};
