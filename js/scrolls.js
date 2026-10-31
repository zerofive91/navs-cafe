// 말씀 보물찾기: 정원 곳곳에 숨은 빛나는 두루마리 12개를 찾아 모으면 구절이 하나씩 열림
// 모은 기록은 이 기기에 남고, 12개를 다 모은 뒤 표시를 누르면 다시 숨겨짐
import * as THREE from 'three';
import { PARK, GATE, R_WALK, polar } from './layout.js';
import { nearestFree } from './nav.js';
import { showVerse, VERSES } from './verses.js';

const SCROLLS = [
  ['태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라', '요한복음 1:1'],
  ['하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라', '요한복음 3:16'],
  ['예수께서 가라사대 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라', '요한복음 14:6'],
  ['모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니', '디모데후서 3:16'],
  ['너는 마음을 다하고 목숨을 다하고 뜻을 다하여 주 너의 하나님을 사랑하라', '마태복음 22:37'],
  ['너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라', '마태복음 6:33'],
  ['오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니', '갈라디아서 5:22-23'],
  ['사랑은 오래 참고 사랑은 온유하며 투기하는 자가 되지 아니하며', '고린도전서 13:4'],
  ['너희가 그 은혜를 인하여 믿음으로 말미암아 구원을 얻었나니 이것이 너희에게서 난 것이 아니요 하나님의 선물이라', '에베소서 2:8'],
  ['믿음은 바라는 것들의 실상이요 보지 못하는 것들의 증거니', '히브리서 11:1'],
  ['볼지어다 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가', '요한계시록 3:20'],
  ['주의 말씀은 내 발에 등이요 내 길에 빛이니이다', '시편 119:105'],
];
void VERSES;

// 숨겨 둘 자리: 구역 가장자리, 나무 사이, 길 끝 (걸을 수 있는 가까운 곳으로 맞춤)
const SPOTS = () => [
  PARK.mustard.at(4.5, 3.5), PARK.sower.at(-7.5, 3), PARK.vine.at(5, 1), PARK.fold.at(5.5, 3),
  PARK.well.at(-3.5, 2.5), PARK.camp.at(6.5, 3.5), PARK.ark.at(-12, 3), PARK.soccer.at(-12.5, 6),
  PARK.tennis.at(9.5, 4), PARK.pool.at(-8, 3), PARK.meadow.at(9, 6), { x: 1.8, z: GATE.r + 2.5 },
  polar(R_WALK + 3.5, 255),
].slice(0, 12).map((p) => nearestFree(p) || p);

const KEY = 'navs-cafe-scrolls';
function load() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch (e) { /* 무시 */ } }

export function initScrolls({ scene, me, sfx, fxSprite, burst, icon }) {
  const got = load();
  const paper = new THREE.MeshStandardMaterial({ color: 0xf6e7c4, roughness: 0.7, emissive: 0xffd58a, emissiveIntensity: 0.35 });
  const rod = new THREE.MeshStandardMaterial({ color: 0x9a6a3e, roughness: 0.6 });
  const tie = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 });
  const items = SPOTS().map((p, k) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 14), paper);
    body.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const end = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 8), rod); end.rotation.z = Math.PI / 2; end.position.x = s * 0.25; g.add(end); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.015, 6, 16), tie); band.rotation.y = Math.PI / 2;
    const glow = fxSprite('light_01', 0xffe2a0, 1.1);
    g.add(body, band, glow);
    g.position.set(p.x, -0.5 + 0.7, p.z);
    g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    g.visible = !got.has(k);
    scene.add(g);
    return { g, glow, k, p };
  });
  // 왼쪽 위 두루마리 표시: 모은 수
  const chip = document.createElement('button');
  chip.id = 'scrollChip';
  chip.setAttribute('aria-label', 'scrolls');
  document.body.appendChild(chip);
  const paint = () => { chip.innerHTML = icon + `<span>${got.size}/${SCROLLS.length}</span>`; chip.classList.toggle('done', got.size === SCROLLS.length); };
  paint();
  chip.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (got.size === SCROLLS.length) { got.clear(); save(got); items.forEach((it) => { it.g.visible = true; }); paint(); sfx('orb', 0.2); }
    else if (got.size) { const k = [...got][Math.floor(Math.random() * got.size)]; showScroll(k); }
  });
  function showScroll(k) {
    VERSES['__scroll' + k] = SCROLLS[k];
    showVerse('__scroll' + k, { cooldown: 0, delay: 0.3, title: `말씀 두루마리 ${got.size} / ${SCROLLS.length}` });
  }
  return {
    spots: items.map((it) => it.p),
    step(dt, t) {
      for (const it of items) {
        if (!it.g.visible) continue;
        it.g.position.y = -0.5 + 0.7 + Math.sin(t * 2 + it.k) * 0.08;
        it.g.rotation.y = t * 0.8 + it.k;
        it.glow.material.opacity = 0.5 + Math.sin(t * 3 + it.k) * 0.25;
        if (Math.hypot(me.x - it.p.x, me.z - it.p.z) < 1.2) {
          it.g.visible = false;
          got.add(it.k); save(got); paint();
          burst(it.p.x, 0.4, it.p.z); sfx('share', 0.3);
          if (got.size === SCROLLS.length) {
            VERSES.__scrollAll = ['이 책의 말씀을 읽는 자와 듣는 자들과 그 가운데 기록한 것을 지키는 자들이 복이 있나니 때가 가까움이라', '요한계시록 1:3'];
            showScroll(it.k);
            setTimeout(() => showVerse('__scrollAll', { cooldown: 0, title: '두루마리 열두 개를 다 모았어요' }), 9000);
          } else showScroll(it.k);
        }
      }
    },
  };
}
