// 장비 (2026-11): 하나님의 전신갑주 여섯 (엡 6:14-17)과 등불 (시 119:105)
//   돈으로 사지 않고, 훈련·부탁·숲길 시험을 해 나가면 하나씩 주어짐. 내 카드에서 갖추고 벗음
//   숲길 시험에서 쓰임: 방패(한 길에 한 번 넘어지지 않음) · 투구(넘어져도 앞 정거장으로 안 돌아감) · 검(한 길에 한 번 작은 속삭임을 단번에)
//   허리띠(오래 머뭇거리면 진리가 비침) · 신(숲길에서 더 빨리) · 흉배(여섯을 다 갖추면 시험을 이긴 걸음이 두 배) · 등불(숲길을 밝힘)
import * as THREE from 'three';
import { setOutfit } from './avatar.js';
import { R_PARK } from './layout.js';
import { saveProfile } from './profile.js';

const done = (o) => Object.keys(o || {}).length;
const tierWins = (p, TIER, t) => Object.keys(p.dungeon || {}).filter((id) => (TIER[id] || 0) >= t).length;
export const GEAR = {
  belt: { why: '말씀 훈련을 마쳐서', name: '진리의 허리띠', how: '말씀 훈련을 마치면', does: '숲길 시험에서 오래 머뭇거리면 맞는 말씀이 비쳐요', verse: ['그런즉 서서 진리로 너희 허리 띠를 띠고 의의 흉배를 붙이고', '에베소서 6:14'], got: (p) => !!p.train?.word },
  breast: { why: '순종 훈련을 마쳐서', name: '의의 흉배', how: '순종 훈련을 마치면', does: '전신갑주 여섯을 다 갖추면 숲길 시험을 이긴 걸음이 두 배', verse: ['그런즉 서서 진리로 너희 허리 띠를 띠고 의의 흉배를 붙이고', '에베소서 6:14'], got: (p) => !!p.train?.obey },
  shoes: { why: '증거 훈련을 마쳐서', name: '복음의 신', how: '증거 훈련을 마치면', does: '숲길에서 더 빨리 걸어요', verse: ['평안의 복음의 예비한 것으로 신을 신고', '에베소서 6:15'], got: (p) => !!p.train?.witness },
  shield: { why: '★★ 숲길 하나를 이겨서', name: '믿음의 방패', how: '★★ 숲길 하나를 이기면', does: '한 길에 한 번, 틀린 말씀을 골라도 넘어지지 않아요', verse: ['모든 것 위에 믿음의 방패를 가지고 이로써 능히 악한 자의 모든 화전을 소멸하고', '에베소서 6:16'], got: (p, T) => tierWins(p, T, 2) > 0 },
  helmet: { why: '부탁 다섯을 들어주어서', name: '구원의 투구', how: '부탁 다섯을 들어주면', does: '넘어져도 앞 정거장으로 돌아가지 않고 그 자리에서 일어나요', verse: ['구원의 투구와 성령의 검 곧 하나님의 말씀을 가지라', '에베소서 6:17'], got: (p) => Object.values(p.quests || {}).filter((v) => v === 'done').length >= 5 },
  sword: { why: '숲길 셋을 이겨서', name: '성령의 검', how: '숲길 셋을 이기면', does: '한 길에 한 번, 작은 속삭임을 말씀으로 단번에 물리쳐요', verse: ['구원의 투구와 성령의 검 곧 하나님의 말씀을 가지라', '에베소서 6:17'], got: (p) => done(p.dungeon) >= 3 },
  lamp: { why: '순종 훈련에서 받아서', name: '등불', how: '순종 훈련에서 받은 등불', does: '어두운 숲길을 밝혀요', verse: ['주의 말씀은 내 발에 등이요 내 길에 빛이니이다', '시편 119:105'], got: (p) => p.items.includes('lamp') },
};
export const ARMOR6 = ['belt', 'breast', 'shoes', 'shield', 'helmet', 'sword'];

export function initGear({ me, profile, scene, toast, sfx, burst, TIER }) {
  profile.gear = profile.gear && typeof profile.gear === 'object' ? profile.gear : { owned: [], worn: [] };
  const G = profile.gear;
  G.owned = G.owned || []; G.worn = G.worn || [];
  const owned = (id) => G.owned.includes(id);
  const worn = (id) => G.worn.includes(id) && owned(id);
  // 새로 받은 장비 알림: 무엇을 왜 받았는지 하나하나 알려 줌 (여럿이 한꺼번에 와도 다 말함)
  const tell = (list) => {
    const what = list.map((g) => `${g.why} ${g.name}`).join(', ');
    toast(list.length === 1
      ? `${what}을(를) 받아 갖추었어요 (${list[0].verse[1]}). ${list[0].does}. 내 카드에서 벗을 수 있어요`
      : `그동안 해 온 일로 장비 ${list.length}개를 받아 갖추었어요: ${what}. 내 카드에서 하나씩 보고 벗을 수 있어요`, 7 + list.length);
  };
  function check(first) {
    const got = [];
    for (const [id, g] of Object.entries(GEAR)) if (!owned(id) && g.got(profile, TIER)) { G.owned.push(id); G.worn.push(id); got.push(g); }
    if (!got.length) return;
    saveProfile(profile); apply(true);
    if (first) setTimeout(() => tell(got), 6000); // 들어오자마자는 다른 안내와 겹치므로 조금 뒤에
    else { tell(got); sfx('orb', 0.25, 0.8); burst(me.x, me.y + 1.4, me.z); }
  }
  // 겉모습: 코스가 입힌 옷이 없을 때 내가 갖춘 갑주를 입음
  let shownKey = null, toldCourse = false;
  function apply(force) {
    const u = me.av.userData;
    if (u.courseOutfit) {
      shownKey = null;
      // 숲길·천로역정이 잠시 입혀 준 갑주는 내가 받은 장비와 다름을 한 번 알려 줌
      if (u.outfit === 'armor' && !toldCourse) { toldCourse = true; toast('이 길에서만 잠시 입는 갑주예요. 정원으로 나가면 벗고, 내가 받은 장비는 내 카드에서 볼 수 있어요', 6); }
      return;
    }
    const pieces = ARMOR6.filter(worn);
    const key = pieces.join(',');
    if (!force && key === shownKey && (u.outfit || null) === (pieces.length ? 'armor' : null)) return;
    shownKey = key;
    setOutfit(me.av, pieces.length ? 'armor' : null, pieces);
    u.pieces = pieces.length ? pieces : null;
  }
  // 등불: 숲길에서 내 둘레를 밝힘
  const light = new THREE.PointLight(0xffd890, 0, 14, 1.6);
  light.position.set(0, 1.6, 0.3);
  scene.add(light);
  let T = 0;
  function step(dt) {
    T += dt;
    if (T > 1) { T = 0; check(false); apply(false); }
    const inForest = Math.hypot(me.x, me.z) > R_PARK + 2;
    light.intensity += ((worn('lamp') && inForest ? 2.2 : 0) - light.intensity) * Math.min(1, dt * 3);
    light.position.set(me.x, me.y + 1.7, me.z);
    me.boost = worn('shoes') && inForest ? 1.15 : 1;
  }
  function toggle(id) {
    if (!owned(id)) { toast(`${GEAR[id].name}: ${GEAR[id].how} 받아요`, 4); return; }
    if (worn(id)) G.worn = G.worn.filter((x) => x !== id); else G.worn.push(id);
    saveProfile(profile); apply(true);
    const g = GEAR[id];
    toast(worn(id) ? `${g.name}을(를) 갖추었어요 (${g.verse[1]}). ${g.does}` : `${g.name}을(를) 벗었어요`, 4);
  }
  check(true); apply(true);
  return { step, toggle, worn, owned, full: () => ARMOR6.every(worn), apply };
}
