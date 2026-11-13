// 동물 돌보기 (2026-11): 정원 바깥 띠 '들짐승 들판'의 동물을 꼴로 세 번 돌보면 길들어, 내 곁에서 따라다님
//   의인은 그 육축의 생명을 돌아보나 (잠 12:10). 꼴은 루디아의 가게에서 삼. 한 번 돌보면 잠시 쉬었다가 다시
//   데리고 다닐 동물은 내 카드에서 고름 (한 번에 하나)
import * as THREE from 'three';
import { PARK, floorY, isFree } from './layout.js';
import { loadFresh } from './park.js';
import { nameTag } from './tutorial.js';
import { VERSES, showVerse } from './verses.js';
import { jo, useGood, saveProfile } from './profile.js';

export const PETS = {
  chick: { name: '병아리', h: 0.36, u: -8, v: -3, verse: ['암탉이 그 새끼를 날개 아래 모음 같이', '마태복음 23:37'] },
  deer: { name: '사슴', h: 0.9, u: -3, v: 3, verse: ['하나님이여 사슴이 시냇물을 찾기에 갈급함 같이 내 영혼이 주를 찾기에 갈급하니이다', '시편 42:1'] },
  dog: { name: '강아지', h: 0.5, u: 3, v: -2, verse: ['개들도 제 주인의 상에서 떨어지는 부스러기를 먹나이다', '마태복음 15:27'] },
  bunny: { name: '사반', h: 0.4, u: 8, v: 3, verse: ['약한 종류로되 집을 바위 사이에 짓는 사반과', '잠언 30:26'] },
};
const NEED = 3, REST = 20; // 세 번 돌보면 길듦, 한 번 돌본 뒤 20초 쉼
for (const [id, p] of Object.entries(PETS)) VERSES['pet-' + id] = p.verse;
VERSES['pet-care'] = ['의인은 그 육축의 생명을 돌아보나 악인의 긍휼은 잔인이니라', '잠언 12:10'];

export function initPets({ scene, me, profile, toast, sfx, burst, onChange }) {
  profile.pets = profile.pets || {};
  const zn = PARK.wild;
  const ents = {};
  const mixers = [];
  for (const [id, P] of Object.entries(PETS)) {
    let home = zn.at(P.u, P.v);
    if (!isFree(home.x, home.z)) home = zn.at(P.u + 1, P.v - 1);
    const holder = new THREE.Group();
    holder.position.set(home.x, floorY(home.x, home.z), home.z);
    scene.add(holder);
    const tag = nameTag(P.name); tag.position.y = P.h + 0.55; holder.add(tag);
    const e = { id, P, holder, tag, home, x: home.x, z: home.z, face: Math.random() * 6, A: {}, cur: null, wait: Math.random() * 3, tgt: null, restUntil: 0 };
    ents[id] = e;
    loadFresh('assets/pets/animal-' + id + '.glb').then((gl) => {
      if (!gl) return;
      const o = gl.scene;
      const bb = new THREE.Box3().setFromObject(o);
      o.scale.setScalar(P.h / (bb.max.y - bb.min.y));
      o.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      holder.add(o);
      const mixer = new THREE.AnimationMixer(o);
      e.A = Object.fromEntries(gl.animations.map((a) => [a.name, mixer.clipAction(a)]));
      mixers.push(mixer);
      play(e, 'idle');
    });
  }
  function play(e, n, once) {
    const a = e.A[n] || e.A.idle; if (!a || (e.cur === a && !once)) return;
    if (e.cur) e.cur.fadeOut(0.2);
    a.reset().fadeIn(0.2).play();
    if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; } else a.setLoop(THREE.LoopRepeat, Infinity);
    e.cur = a;
  }
  const tamed = (id) => (profile.pets[id] | 0) >= NEED;
  const nearest = () => { let best = null, bd = 2.4; for (const e of Object.values(ents)) { if (profile.pet === e.id) continue; const d = Math.hypot(me.x - e.x, me.z - e.z); if (d < bd) { bd = d; best = e; } } return best; };

  // 돌보기: 꼴을 먹임
  function care() {
    const e = nearest(); if (!e) return;
    if (tamed(e.id)) { play(e, 'gesture-positive', true); e.wait = 2; toast(`${e.P.name}${jo(e.P.name, '이', '가')} 반가워해요. 내 카드에서 데리고 다닐 수 있어요`, 3.5); return; }
    const now = performance.now() / 1000;
    if (now < e.restUntil) { toast(`${e.P.name}${jo(e.P.name, '이', '가')} 아직 먹고 있어요. 조금 있다가 다시 돌봐 주세요`, 3); return; }
    if (!useGood(profile, 'fodder')) { toast('꼴이 없어요. 간식 가게 곁 루디아의 가게에서 꼴 한 단(1 데나리온)을 살 수 있어요', 4.5); return; }
    e.restUntil = now + REST;
    profile.pets[e.id] = (profile.pets[e.id] | 0) + 1;
    e.face = Math.atan2(me.x - e.x, me.z - e.z);
    play(e, 'eat', true); e.wait = 2.5; e.tgt = null;
    sfx('cup', 0.15, 1.3);
    for (let q = 0; q < 4; q++) setTimeout(() => burst(e.x, floorY(e.x, e.z) + e.P.h + 0.2 + q * 0.15, e.z), q * 160);
    if (tamed(e.id)) {
      if (!profile.pet) profile.pet = e.id;
      saveProfile(profile); onChange?.();
      showVerse('pet-' + e.id, { cooldown: 0, title: `${e.P.name}${jo(e.P.name, '이', '가')} 길들었어요` });
      setTimeout(() => toast(profile.pet === e.id ? `${e.P.name}${jo(e.P.name, '이', '가')} 이제 나를 따라와요. 내 카드에서 바꿀 수 있어요` : `${e.P.name}${jo(e.P.name, '이', '가')} 길들었어요. 내 카드에서 데리고 다닐 수 있어요`, 5), 2500);
    } else {
      saveProfile(profile); onChange?.();
      if ((profile.pets[e.id] | 0) === 1) showVerse('pet-care', { cooldown: 60 });
      toast(`${e.P.name}${jo(e.P.name, '을', '를')} 돌봤어요 (${profile.pets[e.id]} / ${NEED})`, 3);
    }
  }
  function choose(id) {
    profile.pet = profile.pet === id ? '' : id;
    saveProfile(profile); onChange?.();
    toast(profile.pet ? `${PETS[id].name}${jo(PETS[id].name, '과', '와')} 함께 다녀요` : `${PETS[id].name}${jo(PETS[id].name, '은', '는')} 들판에서 쉬어요`, 3);
  }

  function step(dt) {
    for (const m of mixers) m.update(dt);
    for (const e of Object.values(ents)) {
      const following = profile.pet === e.id && tamed(e.id);
      let speed = 0;
      if (following) {
        const d = Math.hypot(me.x - e.x, me.z - e.z);
        if (d > 30) { const a = me.face + Math.PI; e.x = me.x + Math.sin(a) * 1.5; e.z = me.z + Math.cos(a) * 1.5; } // 너무 멀면 곁으로
        else if (d > 2.2) {
          speed = Math.min(d - 1.6, d > 5 ? 6.5 : 3.2) * dt;
          const a = Math.atan2(me.x - e.x, me.z - e.z);
          const nx = e.x + Math.sin(a) * speed, nz = e.z + Math.cos(a) * speed;
          if (isFree(nx, nz)) { e.x = nx; e.z = nz; } else { e.x += Math.sin(a) * speed * 0.5; e.z += Math.cos(a) * speed * 0.5; }
          e.face = a;
        }
      } else {
        // 들판 안에서 천천히 거닒
        const dh = Math.hypot(e.home.x - e.x, e.home.z - e.z);
        if (dh > 40) { e.x = e.home.x; e.z = e.home.z; }
        if (e.wait > 0) e.wait -= dt;
        else if (!e.tgt) e.tgt = zn.at((Math.random() - 0.5) * zn.w * 0.8, (Math.random() - 0.5) * zn.d * 0.7);
        if (e.tgt && e.wait <= 0) {
          const dx = e.tgt.x - e.x, dz = e.tgt.z - e.z, d = Math.hypot(dx, dz);
          if (d < 0.2 || dh > 14) { e.tgt = dh > 14 ? e.home : null; e.wait = 2 + Math.random() * 4; }
          else { speed = Math.min(d, 0.7 * dt); e.x += (dx / d) * speed; e.z += (dz / d) * speed; e.face = Math.atan2(dx, dz); }
        }
        // 가까이 오면 바라봄
        if (Math.hypot(me.x - e.x, me.z - e.z) < 4 && !speed) e.face = Math.atan2(me.x - e.x, me.z - e.z);
      }
      if (e.wait <= 0 || following) play(e, speed > 0.001 ? (speed / dt > 3 ? 'run' : 'walk') : 'idle');
      e.holder.position.set(e.x, floorY(e.x, e.z), e.z);
      let da = e.face - e.holder.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
      e.holder.rotation.y += da * Math.min(1, dt * 6);
      e.tag.visible = Math.hypot(me.x - e.x, me.z - e.z) < 8;
    }
  }
  return {
    step, care, choose, ents, tamed,
    available: () => (me.state !== 'walk' && nearest() ? [['care', 'care']] : []),
    actions: { care },
  };
}
