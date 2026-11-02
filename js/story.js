// 성경 큰 이야기 (2026-11): 창조에서 새 하늘과 새 땅까지 열두 장을 차례로 따라 걷는 긴 부탁
//   카페의 누가(눅 1:3 "차례대로 써 보내는 것이")가 들려주고, 장마다 정원·숲길 입구·카페의 한 자리에 금빛 기둥이 섬
//   그 자리에 가서(어떤 장은 기도·말씀·빛 바라보기·인사를 하면) 그 장의 말씀이 뜨고 다음 장으로
import * as THREE from 'three';
import { PARK, TRAILS, SPOTS, Q, R_PARK, floorY } from './layout.js';
import { nearestFree } from './nav.js';
import { nameTag } from './tutorial.js';
import { gateOf } from './dungeon.js';
import { VERSES, showVerse } from './verses.js';
import { ITEMS, addSteps, earn, giveItem } from './profile.js';

const V = (k, text, ref) => { VERSES[k] = [text, ref]; return k; };
ITEMS.life = { name: '생명의 이야기', verse: ['오직 이것을 기록함은 너희로 예수께서 하나님의 아들 그리스도이심을 믿게 하려 함이요 또 너희로 믿고 그 이름을 힘입어 생명을 얻게 하려 함이니라', '요한복음 20:31'] };

// 숲길 입구는 정원 안쪽(둘레길)에 서서 바라봄
const gateIn = (id) => { const g = gateOf(TRAILS[id]); const k = (R_PARK - 2) / Math.hypot(g.x, g.z); return { x: g.x * k, z: g.z * k }; };
const CH = [
  { t: '창조', where: '푸른 초장', at: () => PARK.meadow, r: 9, v: V('st-1', '하나님이 그 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되며 아침이 되니 이는 여섯째 날이니라', '창세기 1:31') },
  { t: '노아의 언약', where: '노아의 방주', at: () => PARK.ark, r: 12, v: V('st-2', '내가 내 무지개를 구름 속에 두었나니 이것이 나의 세상과의 언약의 증거니라', '창세기 9:13') },
  { t: '아브라함의 부르심', where: '순종 훈련장(카페 북쪽)에서 기도', at: () => PARK.t_obey, r: 12, act: 'pray', v: V('st-3', '여호와께서 아브람에게 이르시되 너는 너의 본토 친척 아비 집을 떠나 내가 네게 지시할 땅으로 가라', '창세기 12:1') },
  { t: '출애굽', where: '출애굽의 길 입구', at: () => gateIn('exodus'), r: 7, v: V('st-4', '모세가 백성에게 이르되 너희는 두려워 말고 가만히 서서 여호와께서 오늘날 너희를 위하여 행하시는 구원을 보라 너희가 오늘 본 애굽 사람을 또 다시는 영원히 보지 못하리라', '출애굽기 14:13') },
  { t: '목자 다윗', where: '다윗과 골리앗', at: () => PARK.david, r: 9, v: V('st-5', '여호와는 나의 목자시니 내가 부족함이 없으리로다', '시편 23:1') },
  { t: '요나와 선지자들', where: '요나의 바다', at: () => PARK.jonah, r: 9, v: V('st-6', '나는 감사하는 목소리로 주께 제사를 드리며 나의 서원을 주께 갚겠나이다 구원은 여호와께로서 말미암나이다 하니라', '요나 2:9') },
  { t: '구주의 나심', where: '동방박사의 길 입구', at: () => gateIn('magi'), r: 7, v: V('st-7', '오늘날 다윗의 동네에 너희를 위하여 구주가 나셨으니 곧 그리스도 주시니라', '누가복음 2:11') },
  { t: '생명의 떡', where: '벳새다 들녘', at: () => PARK.bethsaida, r: 11, v: V('st-8', '예수께서 가라사대 내가 곧 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라', '요한복음 6:35') },
  { t: '십자가', where: '고난의 길 입구에서 기도', at: () => gateIn('passion'), r: 7, act: 'pray', v: V('st-9', '예수께서 신 포도주를 받으신 후 가라사대 다 이루었다 하시고 머리를 숙이시고 영혼이 돌아가시니라', '요한복음 19:30') },
  { t: '부활', where: '카페 가운데 빛을 바라보기', at: () => SPOTS.light, r: 5, act: 'gaze', v: V('st-10', '그가 여기 계시지 않고 그의 말씀하시던대로 살아나셨느니라 와서 그의 누우셨던 곳을 보라', '마태복음 28:6') },
  { t: '땅끝까지', where: '카페 증거의 물가에서 손 흔들기', at: () => Q.witness, r: 9, act: 'wave', v: V('st-11', '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅끝까지 이르러 내 증인이 되리라 하시니라', '사도행전 1:8') },
  { t: '새 하늘과 새 땅', where: '하늘 소망의 길 입구', at: () => gateIn('heaven'), r: 7, v: V('st-12', '보좌에 앉으신 이가 가라사대 보라 내가 만물을 새롭게 하노라 하시고 또 가라사대 이 말은 신실하고 참되니 기록하라 하시고', '요한계시록 21:5') },
];
V('st-luke', '그 모든 일을 근원부터 자세히 미루어 살핀 나도 데오빌로 각하에게 차례대로 써 보내는 것이 좋은줄 알았노니', '누가복음 1:3');

export function initStory(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange } = K;
  const started = () => profile.tut && profile.tut.story;
  const n = () => Math.min(CH.length, profile.story | 0);

  // ---------- 누가: 말씀 자리 곁 ----------
  const l = Math.hypot(Q.word.x, Q.word.z);
  const at = nearestFree({ x: Q.word.x - (Q.word.x / l) * 7, z: Q.word.z - (Q.word.z / l) * 7 }) || Q.word;
  const luke = makeChar({ hoodie: 0x4a6a5a, hair: 0x5a4030, bag: 0x4a6a5a, style: 0, pants: 0x4a4038 }, at.x, at.z);
  luke.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
  luke.tag = nameTag('누가'); luke.av.add(luke.tag);
  luke.home = { x: at.x, z: at.z }; luke.face0 = Math.atan2(-at.x, -at.z); luke.face = luke.face0;
  npcs.push(luke);
  const book = fxSprite('light_01', 0xffe8a0, 0.9); book.position.y = 2.7; luke.av.add(book);

  // ---------- 금빛 기둥: 지금 장의 자리 ----------
  const beam = new THREE.Group();
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.y = 15; beam.add(m); const s = fxSprite('star_06', 0xfff0c0, 2.4); s.position.y = 3; beam.add(s); beam.userData.star = s; }
  beam.visible = false; scene.add(beam);

  // ---------- 말풍선과 진행 표시 ----------
  const box = document.createElement('div');
  box.className = 'npcb'; box.id = 'story'; box.hidden = true;
  box.innerHTML = '<div class="who"><b>누가</b><span class="n"></span></div><p class="say"></p><div class="row"><button class="later">나중에</button><button class="next"></button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  const chip = document.createElement('div'); chip.id = 'storyChip'; chip.hidden = true; document.body.appendChild(chip);
  let shown = false, closedNear = false;
  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (e.target.classList.contains('later')) { close(); closedNear = true; }
    else if (e.target.classList.contains('next')) {
      if (!started()) { profile.tut = profile.tut || {}; profile.tut.story = 'start'; save(); sfx('orb', 0.2, 1.1); showVerse('st-luke', { cooldown: 0, title: '큰 이야기를 시작해요' }); }
      close(); closedNear = true; update();
    }
  });
  const close = () => { box.hidden = true; shown = false; document.body.classList.remove('talking'); };
  function talk() {
    const k = n();
    $('.n').textContent = k >= CH.length ? '큰 이야기 · 다 마침' : `큰 이야기 · ${k + 1} / ${CH.length}`;
    const say = !started()
      ? '저는 의사 누가예요. 처음부터 자세히 살펴 차례대로 기록했지요. 성경은 창조에서 새 하늘과 새 땅까지 한 줄기 큰 이야기예요. 열두 장을 차례로 따라 걸어 볼래요? 금빛 기둥이 선 곳으로 가면 돼요.'
      : k >= CH.length ? '열두 장을 다 걸었군요! 이 모든 이야기는 예수 그리스도를 가리켜요. 언제든 다시 들러 이야기 나눠요.'
        : `지금은 ${k + 1}장 "${CH[k].t}"예요. ${CH[k].where}${CH[k].act ? '' : '로 가 보세요'}. 금빛 기둥이 그 자리를 비춰요.`;
    $('.say').textContent = say;
    $('.next').textContent = started() ? '네' : '따라 걸을게요';
    $('.later').hidden = !!started();
    box.hidden = false; shown = true;
    document.body.classList.add('talking');
    luke.face = Math.atan2(me.x - luke.x, me.z - luke.z);
  }
  function update() {
    const k = n(), on = !!started() && k < CH.length;
    chip.hidden = !on;
    beam.visible = on;
    if (!on) return;
    const c = CH[k], p = c.at();
    beam.position.set(p.x, floorY(p.x, p.z), p.z);
    chip.textContent = `큰 이야기 ${k + 1}/${CH.length} · ${c.t}: ${c.where}`;
  }
  function finishChapter() {
    const k = n(), c = CH[k];
    profile.story = k + 1;
    addSteps(profile, 5); earn(profile, 1);
    sfx('orb', 0.3, 1.0); burst(me.x, me.y + 1.4, me.z);
    showVerse(c.v, { cooldown: 0, title: `큰 이야기 ${k + 1}장 · ${c.t}` });
    if (k + 1 >= CH.length) {
      giveItem(profile, 'life'); addSteps(profile, 20); earn(profile, 10);
      setTimeout(() => toast('성경 큰 이야기 열두 장을 다 걸었어요! "생명의 이야기"와 10 데나리온을 받았어요 (걸음 +20)', 7), 3500);
    } else setTimeout(() => toast(`다음은 ${k + 2}장 "${CH[k + 1].t}": ${CH[k + 1].where} (걸음 +5, 1 데나리온)`, 6), 3500);
    save(); onChange?.(); update();
  }
  let T = 0;
  function step(dt, t) {
    beam.userData.star.material.rotation = t * 0.4;
    if (beam.visible) beam.children[0].material.opacity = 0.18 + Math.sin(t * 2) * 0.06;
    const dL = Math.hypot(me.x - luke.x, me.z - luke.z);
    if (dL < 6 && me.state !== 'walk') luke.face = Math.atan2(me.x - luke.x, me.z - luke.z);
    if (shown && dL > 5) close();
    if (dL > 4) closedNear = false;
    if (!shown && !closedNear && dL < 2.8 && me.state !== 'walk' && !busy()) talk();
    if ((T += dt) < 0.25) return; T = 0;
    if (!started() || n() >= CH.length) return;
    const c = CH[n()], p = c.at();
    if (Math.hypot(me.x - p.x, me.z - p.z) > c.r) return;
    if (c.act && !(me.action === c.act || (c.act === 'wave' && me.action === 'share'))) {
      if (!c.said) { c.said = true; toast(`여기예요. ${c.where.split('에서 ').pop()}를 해 보세요`, 4); }
      return;
    }
    finishChapter();
  }
  update();
  // 왼쪽 부탁 창에 보일 지금 장
  function info() {
    const k = n();
    if (!started() || k >= CH.length) return null;
    const c = CH[k], p = c.at();
    return { k: k + 1, total: CH.length, title: c.t, where: c.where, verse: VERSES[c.v], target: { x: p.x, z: p.z } };
  }
  return { step, luke, active: () => shown, CH, update, info };
}
