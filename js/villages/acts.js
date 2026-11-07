// 사도행전 마을 자리 (2026-11 마을 등록부): 아직 준비 중이라 지도 탭·수레·병거 어디에도 나오지 않음 (status 'soon')
//   기획: /mnt/project-files/plans/acts-village-plan.md (repo 밖). 세우는 순서는 등록부 설계 메모 "사도행전 마을 세우는 순서"
//   열 때 채울 것: region(js/acts/layout.js addRegion, 기획서 center x 3200), cart, guide(수레꾼 아리스다고), travel, load, acts, save(profile.acts),
//   events(24), progress, trips·zones(17곳), map, seats, rest, seatVerse, transit(배 노선 일곱), shopGoods, quietZones, errands·daily·pieces, folk, companions
export default {
  id: 'acts', name: '사도행전 마을', short: '사도행전', book: '사도행전', status: 'soon',
  region: null, cart: null,
  entry: () => '사도행전 마을은 아직 짓는 중이에요',
  guide: null, travel: null, load: null, acts: [], save: null,
  events: [], progress: null, trips: null, map: null,
  bodyClass: 'region-acts',
  trialSet: 'acts', // 시험 자료집 세트 (참조만)
  // ---- 선택 필드 (기획서 9장). 값은 기획서 예 ----
  center: { x: 3200, z: 0 }, half: { w: 180, d: 150 }, zones: null, seats: null, rest: null, seatVerse: null,
  transit: [], shopGoods: ['chariot', 'donkey', 'oil', 'salve'], quietZones: [], errands: null, daily: null, pieces: null,
  folk: null, companions: [], next: '',
};
