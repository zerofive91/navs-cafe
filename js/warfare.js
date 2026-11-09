// 영적 전쟁 훈련소 (2026-11): 전신갑주 길 입구 곁, 바울이 가르침 (딤후 2:3)
//   믿음의 선진들과 사도들이 실제로 겪은 시험(유혹·미혹·두려움·교만)을 그대로 맞닥뜨리고,
//   그들이 붙든 말씀(또는 그 시험을 이기는 말씀)을 세 구절 가운데 골라 이기는 연습
//   네 시험돌 앞 빛나는 자리에 서면 그 갈래의 시험 셋이 차례로 옴 (장면 둘 + 숲길에서 만나는 속삭임 하나). 바울에게 가면 네 갈래를 섞은 실전 연습(다섯)
//   연습이므로 틀려도 넘어지지 않고, 왜 맞지 않는지 알려 준 뒤 다시 고름. 막히면 기도(X)하면 맞는 말씀이 떠오름
//   처음 이긴 시험돌마다 말씀·순종이 자라고, 네 돌을 다 이기면 바울이 선한 싸움의 말씀을 들려줌
import { offerTalk as offerTalkGate } from './talkgate.js';
import { createDialog } from './dialog.js';
import * as THREE from 'three';
import { WARFARE, floorY } from './layout.js';
import { VERSES, showVerse } from './verses.js';
import { CATS, CAT, BY, SCENES, verseOf, pool, draw, markSeen } from './trials.js';
import { nameTag } from './tutorial.js';
import { addStat, addSteps, earn } from './profile.js';
import { setOutfit } from './avatar.js';

// 시험 자료(네 갈래 CATS와 24장면)는 js/trials.js로 옮김 (2026-11 단위 10). 숲길 시험과 같은 자료집을 연습 규칙으로 씀
//   시험돌 한 번 = 그 갈래 장면 둘 + 같은 갈래 숲길 속삭임 하나, 실전 = 장면 셋 + 숲길 둘 (안 본 것 먼저)
export { CATS };
const S = SCENES; // 장면 목록 (예전 이름 그대로 내보냄)

VERSES['wf-soldier'] = ['네가 그리스도 예수의 좋은 군사로 나와 함께 고난을 받을찌니', '디모데후서 2:3'];
VERSES['wf-resist'] = ['그런즉 너희는 하나님께 순복할찌어다 마귀를 대적하라 그리하면 너희를 피하리라', '야고보서 4:7'];
VERSES['wf-fight'] = ['내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니', '디모데후서 4:7'];

const ROUND = 3, REAL = 5;
const FLAG = { tempt: '주황', lie: '보라', fear: '파란', pride: '노란' }; // 시험돌 깃발 색 (trials.js CATS.color)
const KIND = { tempt: '욕심을 부추기는', lie: '거짓말로 속이는', fear: '겁을 주는', pride: '뽐내게 하는' }; // 틀렸을 때 문장에 쓰는 말
const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [r[i], r[j]] = [r[j], r[i]]; } return r; };
const jo = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

export function initWarfare(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, fxSprite, busy, onChange } = K;
  const Z = WARFARE.zone;
  const G = (p) => floorY(p.x, p.z);
  const M = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
  const rec = () => { profile.warfare = profile.warfare || {}; return profile.warfare; };
  const won = (cat) => (rec()[cat] | 0) > 0;
  const label = (text, size = 0.9, dark = false) => {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 64;
    const g = cv.getContext('2d');
    g.font = '700 32px "Noto Serif KR", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = Math.min(300, g.measureText(text).width + 44);
    g.fillStyle = dark ? 'rgba(48,36,62,0.9)' : 'rgba(255,250,238,0.92)'; g.beginPath(); g.roundRect(160 - w / 2, 6, w, 52, 26); g.fill();
    g.fillStyle = dark ? '#f1e4ff' : '#6b4c32'; g.fillText(text, 160, 33);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(size * 2.5, size * 0.5, 1);
    return sp;
  };
  const glowRing = (r, color) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; return m;
  };

  // ---------- 훈련소 마당: 흙바닥, 네 시험돌, 깃발 ----------
  {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 48), M(0xcdb88e, 1));
    floor.rotation.x = -Math.PI / 2; floor.scale.set(Z.w / 2 + 1, Z.d / 2 + 1, 1);
    floor.rotation.z = -Z.rot; floor.position.set(Z.x, G(Z) + 0.03, Z.z); floor.receiveShadow = true; scene.add(floor);
    // 입구 팻말
    const sign = label('영적 전쟁 훈련소', 1.1, true); const p = Z.at(0, -6.4); sign.position.set(p.x, G(p) + 3.2, p.z); scene.add(sign);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), M(0x6a5038)); post.position.set(p.x, G(p) + 1.4, p.z); post.castShadow = true; scene.add(post);
  }
  const stones = WARFARE.stones.map((p, i) => {
    const c = CATS[i];
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), M(0x8a8478, 0.95)); rock.scale.set(1, 0.85, 0.8); rock.position.y = 0.55; g.add(rock);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 6, 24), M(c.color, 0.5, { emissive: c.color, emissiveIntensity: 0.25 })); band.rotation.x = Math.PI / 2; band.position.y = 0.6; g.add(band);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), M(c.color, 0.9, { side: THREE.DoubleSide })); flag.position.set(0.35, 2.05, 0); g.add(flag);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 6), M(0x6a5038)); pole.position.y = 1.15; g.add(pole);
    const todo = label(c.name, 0.75), done = label('✓ ' + c.name, 0.75);
    for (const sp of [todo, done]) { sp.position.y = 2.8; g.add(sp); }
    const again = label('다시 서면 시작해요', 0.62); again.position.y = 2.25; again.visible = false; g.add(again); // 나중에 하기로 한 돌 밑에 계속 보임
    const ring = glowRing(1.0, c.color); ring.position.set(p.stand.x - p.x, 0.05, p.stand.z - p.z); g.add(ring);
    g.position.set(p.x, G(p), p.z); g.rotation.y = Z.rot; scene.add(g);
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return { g, ring, flag, todo, done, again, p, c };
  });

  // ---------- 바울: 그리스도 예수의 좋은 군사 (갑주를 입음) ----------
  const paul = makeChar({ hoodie: 0x7a5a8a, hair: 0x4a3a30, bag: 0x7a5a8a, style: 0, pants: 0x5a5048 }, WARFARE.npc.x, WARFARE.npc.z);
  { const bag = paul.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false; }
  try { setOutfit(paul.av, 'armor'); } catch (e) { /* 갑주를 못 입혀도 그대로 */ }
  paul.tag = nameTag('바울'); paul.av.add(paul.tag);
  paul.home = { ...WARFARE.npc }; paul.face0 = Math.atan2(Z.x - paul.x, Z.z - paul.z); paul.face = paul.face0;
  npcs.push(paul);
  const paulSign = label('영적 전쟁 훈련', 0.75); paulSign.position.y = 2.75; paulSign.renderOrder = 5; paul.av.add(paulSign);
  const paulSign2 = label('실전 연습 해 볼래요?', 0.75); paulSign2.position.y = 2.75; paulSign2.renderOrder = 5; paulSign2.visible = false; paul.av.add(paulSign2); // 네 돌을 다 이긴 뒤

  // ---------- 어둠의 그림자 (시험이 오면 돌 위로 떠오름) ----------
  const shade = new THREE.Group();
  const parts = [];
  for (let q = 0; q < 5; q++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5 - q * 0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0x1c1626, transparent: true, opacity: 0.55, depthWrite: false })); shade.add(m); parts.push(m); }
  for (let q = 0; q < 3; q++) { const s = fxSprite('circle_05', 0x2a2038, 2.4); s.material.blending = THREE.NormalBlending; s.material.opacity = 0.45; s.position.y = 1 + q * 0.5; shade.add(s); parts.push(s); }
  shade.visible = false; scene.add(shade);
  let fade = -1;

  // ---------- 바울과 말하기 (dialog.js). id는 길잡이(#wtalk)와 겹치지 않게 #ptalk ----------
  const dlg = createDialog({ id: 'ptalk' });
  let offer = false, sticky = false; // sticky: 바울 곁이 아니어도 떠 있는 말풍선 (칭찬·처음 안내)
  const hideTalk = () => { dlg.close(); offer = false; sticky = false; };
  const allWon = () => CATS.every((c) => won(c.id));
  const GUIDE = [{ label: '하는 방법', on: () => guide('how') }, { label: '진행 보기', on: () => guide('prog') }];
  function offerTalk() {
    offer = true;
    const first = !CATS.some((c) => won(c.id)) && !rec().met;
    rec().met = 1;
    const say = first
      ? '저는 바울이에요. 마음속에 나쁜 생각을 부추기는 \'마음의 소리\'가 있어요. 깃발 돌 앞 빛 동그라미에 서서 말씀으로 이겨 봐요!'
      : allWon() ? '와, 네 돌을 다 이겼어요! 이번엔 섞어서 다섯 번 와요. 아래 \'실전 연습\'을 눌러요.'
        : `다시 왔군요! 아직 ${CATS.filter((c) => !won(c.id)).map((c) => `${FLAG[c.id]} 깃발(${c.name})`).join(', ')} 돌이 남았어요. 그 돌 앞 빛 동그라미에 서 봐요.`;
    dlg.open({
      who: '바울', n: '영적 전쟁 훈련소', say, verse: 'wf-soldier',
      guide: GUIDE,
      choices: [
        { label: '나중에', cls: 'later', on: hideTalk },
        { label: '실전 연습', cls: 'next', main: true, on: () => { hideTalk(); start('real'); } },
      ],
      esc: hideTalk,
    });
  }
  function guide(kind) {
    let say, how = '';
    if (kind === 'how') {
      say = '① 깃발 돌 앞 빛 동그라미에 서요. ② 마음의 소리를 이기는 말씀을 눌러요. ③ 모르겠으면 두 손 모은 단추를 눌러요 (X). 틀려도 괜찮아요, 다시 골라요.';
      how = '네 돌: 유혹은 욕심, 미혹은 참말처럼 꾸민 거짓말, 두려움은 겁, 교만은 내가 최고라는 마음이에요. 처음 이긴 돌마다 말씀 +3, 순종 +2, 걸음 +5, 2 데나리온을 받아요.';
    } else {
      const R = rec();
      say = CATS.map((c) => `${c.name} ${won(c.id) ? `✓ (${R[c.id]}번 이김)` : '아직'}`).join(' · ') + ` · 실전 ${R.real | 0}번 이김` + (allWon() ? '. 네 시험을 다 이겼어요!' : '.');
    }
    dlg.update({ say, how, verse: '' });
  }

  // 네 돌을 다 이긴 뒤 바울의 칭찬: 다른 창이 열려 있으면 기다렸다가 말풍선으로 (알림만으로 두지 않음)
  function praise(tries) {
    if (offer || run) return;
    if (busy()) { if (tries < 25) setTimeout(() => praise(tries + 1), 800); return; }
    offer = true; sticky = true;
    dlg.open({
      who: '바울', n: '영적 전쟁 훈련소',
      say: '네 돌을 모두 말씀으로 이겼군요, 대단해요! 이제 섞어서 오는 실전 연습도 해 볼래요?',
      how: '말씀 +5, 5 데나리온을 받았어요',
      choices: [
        { label: '나중에', cls: 'later', on: hideTalk },
        { label: '실전 연습', cls: 'next', main: true, on: () => { hideTalk(); start('real'); } },
      ],
      esc: hideTalk, focus: false,
    });
  }
  // 바울 말을 듣기 전에 시험돌을 밟았을 때: 처음 한 번만 먼저 알려 줌
  let introSeen = false;
  function introBubble(at) {
    introSeen = true; offer = true; sticky = true;
    dlg.open({
      who: '바울', n: '영적 전쟁 훈련소',
      say: '여기는 영적 전쟁 훈련소예요. 바울에게 먼저 말을 걸어 봐요',
      choices: [{ label: '알겠어요', cls: 'next', main: true, on: () => { hideTalk(); left = at; } }],
      esc: () => { hideTalk(); left = at; }, focus: false,
    });
  }

  // ---------- 시험 창 ----------
  const box = document.createElement('div');
  box.className = 'npcb trial'; box.id = 'wtrial'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="scene"></p><p class="say"></p><div class="opts"></div><p class="why" hidden></p><div class="row"><button class="later">나중에 할래요</button><button class="next" hidden>다음 시험</button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  let run = null, opts = [];
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = e.target.closest('.opt');
    if (o) return choose(Number(o.dataset.i));
    if (e.target.classList.contains('later')) stop('나중에 해요. 돌 앞에서 한 걸음 나왔다가 다시 서면 시작해요');
    if (e.target.classList.contains('next')) next();
  });
  addEventListener('keydown', (e) => {
    if (!run || box.hidden) return;
    const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
    if (m && !run.ok) { e.stopPropagation(); e.preventDefault(); choose(Number(m[1]) - 1); }
    else if ((e.code === 'Enter' || e.code === 'Space') && run.ok) { e.stopPropagation(); e.preventDefault(); next(); }
    else if (e.code === 'KeyX') hint();
  }, true);

  function start(kind) {
    // 장면 먼저(성경 인물 이야기), 숲길 속삭임을 하나(실전은 둘) 섞음. 안 본 것·오래전에 본 것 먼저 (trials.js draw)
    const cat = kind === 'real' ? null : kind, nf = kind === 'real' ? 2 : 1, n = kind === 'real' ? REAL : ROUND;
    const sc = draw(pool('camp', { cat, scene: true }), 'camp', { n: n - nf }), fo = draw(pool('camp', { cat, scene: false }), 'camp', { n: nf });
    const list = kind === 'real' ? shuffle([...sc, ...fo]) : [...sc, ...fo];
    const at = kind === 'real' ? WARFARE.center : stones[CATS.findIndex((c) => c.id === kind)].p;
    run = { kind, list, i: 0, miss: 0, at, ok: false };
    me.path = []; me.task = null; if (me.state === 'walk') me.state = 'idle';
    if (kind === 'real') { document.body.classList.add('bigtrial'); sfx('impact/impactSoft_heavy_000', 0.3, 0.4); }
    show();
  }
  function show() {
    const s = run.list[run.i], c = CAT[s.cat];
    run.ok = false;
    markSeen('camp', s.id);
    // 그림자: 시험돌 위(실전은 가운데)
    const p = run.at;
    shade.position.set(p.x, G(p) + (run.kind === 'real' ? 0.2 : 0.9), p.z); shade.visible = true; fade = -1;
    shade.scale.setScalar(run.kind === 'real' ? 1.5 : 1);
    parts.forEach((m) => { m.material.opacity = m.isSprite ? 0.45 : 0.55; });
    me.face = Math.atan2(p.x - me.x, p.z - me.z);
    const who = s.who || '숲길에서 온 마음의 소리'; // 숲길 문항은 사람 대신
    $('.who b').textContent = `${c.name}의 시험 · ${who}`;
    $('.n').textContent = `${run.kind === 'real' ? '실전 연습' : c.name + ' 시험돌'} · ${run.i + 1} / ${run.list.length}`;
    $('.scene').textContent = s.scene ? s.scene : '숲길에서 이런 마음의 소리를 만나요. 숲길에서는 틀리면 넘어지니 여기서 연습해요.';
    $('.say').textContent = `"${s.lie}"`;
    const sm = document.createElement('small'); sm.textContent = run.kind === 'real' ? '어떤 마음의 소리인지 알아채고, 이기는 말씀을 눌러요. 모르겠으면 두 손 모은 단추 (X)' : (s.who ? `${s.who}${jo(s.who, '이', '가')} 붙든 말씀을 눌러요.` : '이 마음의 소리를 이기는 말씀을 눌러요.') + ' 모르겠으면 두 손 모은 단추 (X)'; $('.say').append(sm);
    opts = shuffle([s.id, ...s.no]);
    $('.opts').innerHTML = opts.map((k, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${verseOf(k)[0]} <em>${verseOf(k)[1]}</em></span></button>`).join('');
    $('.why').hidden = true; $('.next').hidden = true;
    box.hidden = false; box.classList.remove('ok');
    document.body.classList.add('talking', 'trialing');
    sfx('impact/impactSoft_heavy_000', 0.18, 0.55);
  }
  function choose(i) {
    if (!run || run.ok || opts[i] == null) return;
    const s = run.list[run.i], c = CAT[s.cat];
    const b = $(`.opt[data-i="${i}"]`);
    if (opts[i] === s.id) {
      run.ok = true;
      box.classList.add('ok'); b?.classList.add('hint');
      $('.why').hidden = false; $('.why').textContent = `✓ ${s.win}`;
      $('.next').hidden = false; $('.next').textContent = run.i + 1 < run.list.length ? '다음 시험' : '마치기';
      fade = 0; sfx('orb', 0.3, 1.2); burst(shade.position.x, shade.position.y + 1, shade.position.z);
      return;
    }
    run.miss++;
    if (b) { b.classList.add('no'); b.disabled = true; }
    const other = CAT[BY[opts[i]].cat];
    $('.why').hidden = false;
    $('.why').textContent = other.id === c.id
      ? `그 말씀도 좋은 말씀이에요. 그런데 지금은 ${KIND[c.id]} 마음의 소리예요. 다시 골라 봐요.`
      : `그 말씀은 ${other.name}${jo(other.name, '을', '를')} 이길 때 붙드는 말씀이에요. 지금은 ${KIND[c.id]} 마음의 소리예요. 다시 골라 봐요.`;
    sfx('impact/impactSoft_medium_000', 0.22, 0.7);
  }
  function hint() {
    if (!run || run.ok) return;
    const i = opts.indexOf(run.list[run.i].id);
    $(`.opt[data-i="${i}"]`)?.classList.add('hint');
    toast('기도하니 말씀 하나가 반짝여요', 3);
  }
  function next() {
    if (!run || !run.ok) return;
    run.i++;
    if (run.i < run.list.length) { show(); return; }
    finish();
  }
  function close() {
    box.hidden = true; shade.visible = false;
    document.body.classList.remove('talking', 'trialing', 'bigtrial');
  }
  function stop(say) { if (!run) return; const k = run.kind; run = null; close(); left = k; if (say) toast(say, 3); }
  let left = null; // 물러난 시험돌 (자리에서 벗어나야 다시 시작)
  function finish() {
    const R = rec(), kind = run.kind, miss = run.miss, at = run.at;
    const first = !(R[kind] | 0);
    R[kind] = (R[kind] | 0) + 1;
    run = null; close(); left = kind;
    for (let q = 0; q < 10; q++) setTimeout(() => burst(at.x + (Math.random() - 0.5) * 3, G(at) + 0.6 + Math.random() * 2, at.z + (Math.random() - 0.5) * 3), q * 90);
    sfx('orb', 0.32, 0.8);
    const clean = miss ? '' : ' 한 번도 틀리지 않았어요!';
    if (kind === 'real') {
      if (first) { addStat(profile, 'word', 5); addStat(profile, 'obey', 3); earn(profile, 4); addSteps(profile, 8); toast(`실전 연습을 이겼어요!${clean} (말씀 +5, 순종 +3, 걸음 +8, 4 데나리온)`, 6); }
      else { addSteps(profile, 3); earn(profile, 1); toast(`실전 연습을 다시 이겼어요.${clean} (걸음 +3, 1 데나리온)`, 5); }
      showVerse('wf-resist', { cooldown: 0, title: '마귀를 대적하라' });
    } else {
      const c = CAT[kind];
      if (first) { addStat(profile, 'word', 3); addStat(profile, 'obey', 2); earn(profile, 2); addSteps(profile, 5); toast(`${c.name}의 시험돌을 이겼어요!${clean} (말씀 +3, 순종 +2, 걸음 +5, 2 데나리온)`, 6); }
      else { addSteps(profile, 1); toast(`${c.name}의 시험을 다시 이겼어요.${clean} (걸음 +1)`, 4); }
      if (first && allWon()) {
        earn(profile, 5); addStat(profile, 'word', 5);
        setTimeout(() => { showVerse('wf-fight', { cooldown: 0, title: '네 시험을 다 이겼어요' }); praise(0); paul.action = 'wave'; setTimeout(() => { paul.action = null; }, 2400); }, 2600);
      } else showVerse('wf-resist', { cooldown: 0, title: '말씀으로 이겼어요' });
    }
    save(); onChange?.();
  }

  // ---------- 기도 단추 (main.js pressAction) ----------
  function onPress(name) { if (run && name === 'pray') hint(); }

  // ---------- 매 프레임 ----------
  let called = false;
  function step(dt, t) {
    const dz = Math.hypot(me.x - Z.x, me.z - Z.z);
    const vis = dz < 80;
    for (const s of stones) {
      s.g.visible = vis; if (!vis) continue;
      const w = won(s.c.id);
      s.todo.visible = !w; s.done.visible = w; s.again.visible = !run && left === s.c.id;
      s.flag.rotation.y = Math.sin(t * 2 + s.p.x) * 0.25;
      s.ring.material.opacity = run ? 0 : 0.35 + Math.sin(t * 3 + s.p.z) * 0.2;
    }
    // 그림자
    if (shade.visible) {
      if (fade >= 0) {
        fade += dt; const k = Math.max(0, 1 - fade / 1.0);
        parts.forEach((m) => { m.material.opacity = (m.isSprite ? 0.45 : 0.55) * k; });
        if (k <= 0) { shade.visible = false; fade = -1; }
      } else parts.forEach((m, q) => { if (m.isMesh) m.position.set(Math.sin(t * (1.1 + q * 0.3) + q) * 0.4, 0.8 + q * 0.3 + Math.sin(t * 2 + q) * 0.12, Math.cos(t * (0.9 + q * 0.25) + q * 2) * 0.4); else m.material.rotation = t * 0.3 * (q % 2 ? 1 : -1); });
    }
    // 바울: 가까이 오면 나를 봄, 팻말은 멀리서만
    const dp = Math.hypot(me.x - paul.x, me.z - paul.z);
    if (paul.state !== 'walk') paul.face = dp < 8 ? Math.atan2(me.x - paul.x, me.z - paul.z) : paul.face0;
    const all = allWon();
    paulSign.visible = dp > 4.5 && !all; paulSign2.visible = dp > 4.5 && all;
    if (sticky && Math.hypot(me.x - Z.x, me.z - Z.z) > 24) hideTalk();
    if (run) {
      if (Math.hypot(me.x - run.at.x, me.z - run.at.z) > (run.kind === 'real' ? 12 : 7)) stop('돌에서 멀어져서 멈췄어요. 다시 서면 새로 시작해요');
      return;
    }
    // 들어서면 바울이 부름
    if (dz > 26) called = false;
    else if (!called && dz < 16 && dp > 4.5 && me.state === 'walk' && !busy()) {
      called = true; paul.action = 'wave'; setTimeout(() => { if (paul.action === 'wave') paul.action = null; }, 2400);
    }
    if (busy()) { if (offer && !sticky) hideTalk(); return; }
    // 바울 곁
    if (dp < 3.6) { if (!offer) offerTalkGate('warfare', paul, () => offerTalk()); } else if (offer && !sticky) hideTalk(); // 말 걸기 단추를 눌러야 열림
    // 시험돌 앞 빛나는 자리
    let at = null;
    for (const s of stones) if (Math.hypot(me.x - s.p.stand.x, me.z - s.p.stand.z) < 1.2) at = s.c.id;
    if (!at) left = null;
    else if (at !== left && !offer) { if (!rec().met && !introSeen) introBubble(at); else start(at); }
  }
  function pin() { if (paul.state !== 'walk') { paul.x = paul.home.x; paul.z = paul.home.z; } }

  return { step, pin, onPress, active: () => !!run || offer, start, S, CATS, get run() { return run; } };
}
