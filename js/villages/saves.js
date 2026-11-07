// 마을별 저장 칸 (2026-11 마을 등록부): profile[key]를 채우는 fill과 두 기기 기록을 합치는 merge
//   account.js mergeProfile()이 이 목록을 돌며 합침. 등록부 js/villages/<id>.js의 save도 이 항목을 가리킴
//   채우기(fill)는 지금 profile.js fill()에 마을마다 한 줄로 둠 (profile.js는 이 파일을 부르지 않음 → 순환 import 없음)
//   새 마을: profile.js에 fillX·mergeX(같은 모양이면 fillTown·mergeTown에 사건 순서만)와 fill() 한 줄·PROFILE_KEYS, 여기 한 줄
//   칸 모양 약속: 적어도 { last: 0|1, seen: 처음 가 본 때 } (등록부 lastTown·visitedTowns가 읽음)
import { fillJohn, mergeJohn, fillActs, mergeActs } from '../profile.js';

export const TOWN_SAVES = [
  { town: 'john', key: 'john', fill: fillJohn, merge: mergeJohn },
  { town: 'acts', key: 'acts', fill: fillActs, merge: mergeActs }, // 사도행전 마을 (2026-11 0-나): profile.js fillTown·mergeTown
];
