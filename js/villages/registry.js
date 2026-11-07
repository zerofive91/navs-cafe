// 마을 등록부 (2026-11): 마을 하나 = 자료 한 묶음. 마을 사이 다니기(region.js)·지도(map.js)·수레 안내인(cartguide.js)·병거(shop.js)·
//   할 일 기록(questlog.js)·저장 합치기(profile.js·account.js, js/villages/saves.js)가 이 목록을 돎. 새 마을은 js/villages/<id>.js 한 파일 + 아래 한 줄
//
// 항목 필드 (설계 메모: /mnt/project-files/plans/village-registry-design.md, repo 밖)
//   id, name, short, book    마을 id·이름·짧은 이름·성경 권
//   status                   'open'(지도·수레에 보임) | 'soon'(자리만, 어디에도 안 보임)
//   region                   layout.addRegion으로 등록한 땅 { floorY, isFree, pathCost, nav, env, arrive, look }. 초보자 마을은 null
//   cart                     이 마을 수레 { x, z, rot, stand(오르는 자리), arrive(왔을 때 서는 자리), look(왔을 때 보는 쪽), to?(갈 수 있는 마을 id 목록),
//                              sign?·signRot?(이정표 자리·방향: 초보자 마을 길목만, 다른 마을 이정표는 load가 지음) }
//   entry(profile)           true면 들어갈 수 있음, 글이면 못 들어가는 까닭(알림으로 보임)
//   guide                    수레 안내인 { name, look(옷 색), at() → 서는 자리 } (말 문구는 cartguide.js 마을 id별)
//   travel                   { going(흐린 막 글), arrive, first(처음 왔을 때 알림), firstVerse }
//   load(ctx)                처음 들어갈 때 모형·사건을 지음 → Promise<{ root, cart, engine }>
//   acts                     그 자리 단추 이름 (main.js ACTIONS에 미리 등록, 엔진이 생기면 넘김)
//   save                     saves.js 항목(profile[key], 적어도 { last, seen }) | null
//   events, progress(p)      사건 id 목록, 진행 { done, total }
//   trips                    병거 목적지 { list() → [[id, 이름]], at(id) → { p, look } }
//   map                      { fit(W,H) → { k, cx, cz }, draw(D), title, picks() → [[id, 이름, 색]], pick(id) → 점 } | null(초보자 마을 본래 그림)
//   bodyClass                이 마을에 있는 동안 body class
//   trialSet                 시험 자료집 세트 id (지금은 참조만)
//   선택 필드 (사도행전 기획서 9장, 지금 엔진은 읽지 않음 · 자리만): center, half, zones, seats, rest[], seatVerse(seat), transit[], shopGoods[],
//     quietZones[], errands·daily·pieces(공용 장치 자료 모듈 경로), folk(profile), companions[], next(졸업 뒤 다음 마을)
import base from './base.js';
import john from './john.js';
import acts from './acts.js';

export const VILLAGES = [base, john, acts]; // 지도 마을 탭 순서
const BY_ID = new Map(VILLAGES.map((v) => [v.id, v]));
export const village = (id) => BY_ID.get(id) || null;
export const openVillages = () => VILLAGES.filter((v) => v.status === 'open');
// 이 마을 수레가 가는 곳: cart.to가 있으면 그 목록(열린 마을만), 없으면 초보자 마을에서는 열린 다른 마을 모두, 다른 마을에서는 초보자 마을로
export function destinations(from) {
  const to = village(from)?.cart?.to;
  if (to) return to.map(village).filter((v) => v && v.status === 'open' && v.id !== from);
  return from === 'base' ? openVillages().filter((v) => v.id !== 'base') : [base];
}
// 저장 칸이 있는 마을
const saved = () => VILLAGES.filter((v) => v.save);
// 지도 "마을" 탭: 초보자 마을 + 가 본 열린 마을
export const visitedTowns = (profile) => openVillages().filter((v) => v.id === 'base' || profile[v.save?.key]?.seen).map((v) => v.id);
// 마지막에 있던 마을 (다시 들어오면 그 마을 도착 자리에서 시작). 열리지 않은 마을이면 초보자 마을
//   지금은 마을 칸의 last를 읽음. 공통 칸 profile.town(기획서 9장)은 아직 쓰지 않음: profile.js fill이 이 칸을 남기지 않고,
//   예전 기기와 섞이면 town과 last가 어긋날 수 있어서. 사도행전 0-나 단위에서 profile.js fill·합치기에 town을 넣을 때 여기와 markTown만 바꾸면 됨
export const lastTown = (profile) => saved().find((v) => v.status === 'open' && profile[v.save.key]?.last)?.id || 'base';
// 마을에 들어감: 그 마을 칸만 last 1, 나머지 0. 처음 가 본 마을이면 seen을 적고 true
export function markTown(profile, id) {
  let first = false;
  for (const v of saved()) {
    const s = profile[v.save.key]; if (!s) continue;
    s.last = v.id === id ? 1 : 0;
    if (v.id === id && !s.seen) { s.seen = Date.now(); first = true; }
  }
  return first;
}
