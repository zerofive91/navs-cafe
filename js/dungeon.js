// 숲길 던전 (2026-11): 숲 코스마다 난이도(별 하나~셋)와 들어갈 수 있는 단계가 있음
//   대적은 사람이 아니라 어둠의 속삭임 (엡 6:12). 속삭임이 길을 막으면 세 구절 중 맞는 말씀을 골라 물리침
//   (예수님의 광야 시험처럼, 암송 없이 고르기만). 막히면 기도(X)하면 맞는 말씀이 떠오름
//   잘못 고르면 넘어지지만 바로 앞 정거장에서 다시 일어남 (미 7:8)
//   길의 속삭임을 모두 물리치면 걸음·말씀·순종이 자람. 생명의 다리·복음·고난의 길은 누구나 걷는 열린 길
//   형식 (2026-11 단위 5): 작은 시험은 고르기, 길 끝 큰 시험은 채우기(구절 빈칸 낱말 고르기) 또는
//   버티기(속삭임이 되풀이되는 동안 말씀을 붙들고 그 자리에 서 있기, 떠나면 넘어지지 않고 "다시 서기").
//   틀린 보기를 고르면 "왜 아닌가" 한 줄(그 구절이 실제로 말하는 바)을 보여 줌
//   자료집 (2026-11 단위 10): 시험 자료는 js/trials.js 하나 (훈련소와 같이 씀). 속삭임마다 문항은 처음 만날 때 고름
//   (이번 걸음에 나온 것·최근 본 것은 뒤로). 길을 다 이긴 뒤 입구로 돌아오면 속삭임이 새로 생겨 다시 걸을 때 다른 시험을 만남
import * as THREE from 'three';
import { TRAILS, R_PARK, floorY } from './layout.js';
import { showVerse } from './verses.js';
import { STAGES, stageOf, addSteps, addStat, earn, useGood, GOODS } from './profile.js';
import { BY, pool, draw, markSeen, vkey, verseOf, firstRedoToday } from './trials.js';
import { bibleMode } from './bible.js';

// 채우기는 지금 고른 번역(개역한글 / AI 현대어)으로 빈칸을 냄. 현대어 짝은 처음 한 번 불러 둠 (bible.js와 같은 모듈)
let MOD = null;
import('./bible-modern.js').then(({ MODERN }) => { MOD = new Map(MODERN); }).catch(() => { /* 개역한글로 */ });
const KIND_NAME = { fill: '채우기', hold: '버티기' };
const PROMPT = {
  pick: '어떤 말씀으로 대답할까요? 보기를 눌러요. 모르겠으면 두 손 모은 단추 (X)',
  fill: '빈칸에 맞는 낱말을 눌러요. 모르겠으면 두 손 모은 단추 (X)',
  hold: '움직이지 말고 서 있어요. 등불이 다 차면 이겨요',
};
const HOLD_R = 1.2; // 버티기: 이만큼 벗어나면 자리를 떠난 것

// 별 하나: 새싹부터, 별 둘: 제자부터, 별 셋: 일꾼부터
export const TIER = {
  creation: 1, magi: 1, jesus: 1, fruit: 1,
  exodus: 2, pilgrim: 2, wisdom: 2, faith: 2, deity: 2, humanity: 2, love: 2, obey: 2, heaven: 2,
  armor: 3, revelation: 3,
};
export const TIER_STAGE = { 1: '새싹', 2: '제자', 3: '일꾼' };
export const stars = (id) => (TIER[id] ? '★'.repeat(TIER[id]) : '');
const REWARD = { 1: 30, 2: 50, 3: 80 };

// 시험 자료(속삭임·틀린 보기·이기는 까닭·갈래·형식)는 js/trials.js, 말씀은 verseOf(id) (숲길 'dg-<id>', 훈련소 장면 'wf-<id>')
//   길마다 자기 세트(길 문항 + 그 길에 맞는 훈련소 장면, 없으면 common). 출제는 trials.js draw

const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const shuffle = (a, seed) => { const r = a.slice(); let s = seed || 1; for (let i = r.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const gateOf = (tr) => tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 2.2) || tr.samples[0];
const rootOf = (id) => { let t = TRAILS[id]; while (t && t.from) t = TRAILS[t.from[0]]; return t ? t.id : id; };

export function initDungeon(K) {
  const { scene, me, profile, save, toast, sfx, burst, fxSprite, busy, onChange, courseName } = K;
  const wears = (id) => !!K.gear?.()?.worn(id); // 장비 (gear.js)
  const shieldUsed = new Set(), swordUsed = new Set(); // 한 길에 한 번씩 (길을 이기면 다시)
  const stageIx = () => STAGES.indexOf(stageOf(profile.steps));
  const needIx = (id) => (TIER[id] || 1) - 1; // 새싹 0, 제자 1, 일꾼 2
  const open = (id) => !TIER[id] || stageIx() >= needIx(id);
  const gy = (p) => floorY(p.x, p.z);

  // ---------- 길 입구 표지: 별과 들어갈 수 있는 단계 ----------
  const signTex = (text, sub) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgba(60,44,30,0.82)'; g.beginPath(); g.roundRect(18, 6, 220, 84, 18); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffd56a'; g.font = '700 34px system-ui, sans-serif'; g.fillText(text, 128, 34);
    g.fillStyle = '#fff4dc'; g.font = '600 24px "Noto Serif KR", serif'; g.fillText(sub, 128, 70);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const signs = [];
  for (const id of Object.keys(TIER)) {
    const tr = TRAILS[id]; if (!tr) continue;
    const p = gateOf(tr);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTex(stars(id), TIER_STAGE[TIER[id]] + '부터'), transparent: true, depthWrite: false }));
    sp.scale.set(2.2, 0.82, 1); sp.position.set(p.x, gy(p) + 3.75, p.z); scene.add(sp);
    signs.push({ sp, p });
  }

  // ---------- 어둠의 속삭임 ----------
  const darkMat = () => new THREE.MeshBasicMaterial({ color: 0x1c1626, transparent: true, opacity: 0.55, depthWrite: false });
  const shades = [];
  const byCourse = {};
  for (const [id, tier] of Object.entries(TIER)) {
    const tr = TRAILS[id]; if (!tr) continue;
    const st = tr.stations, last = st.length - 1, n = tier + 1;
    const gaps = new Set();
    for (let k = 0; k < n - 1; k++) gaps.add(Math.max(0, Math.min(last - 2, Math.round(((k + 1) * (last - 1)) / n) - 1)));
    gaps.add(last - 1);
    const list = [...gaps].sort((a, b) => a - b);
    byCourse[id] = [];
    list.forEach((gi, k) => {
      const isBig = gi === last - 1;
      const p = tr.sample((st[gi].f + st[gi + 1].f) / 2);
      const g = new THREE.Group();
      const parts = [];
      for (let q = 0; q < 5; q++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55 - q * 0.05, 12, 10), darkMat()); g.add(m); parts.push(m); }
      for (let q = 0; q < 3; q++) { const s = fxSprite('circle_05', 0x2a2038, 2.6); s.material.blending = THREE.NormalBlending; s.material.opacity = 0.45; s.position.y = 1 + q * 0.5; g.add(s); parts.push(s); }
      g.scale.setScalar(isBig ? 1.9 : 1);
      g.position.set(p.x, gy(p), p.z); scene.add(g);
      const S = { id, k, g, parts, x: p.x, z: p.z, back: st[gi], lie: null, big: isBig, beaten: false, fade: -1 }; // lie: 처음 만날 때 고름 (assign)
      shades.push(S); byCourse[id].push(S);
    });
  }

  // 이 속삭임의 문항 고르기: 작은 시험은 그 길의 작은 문항(+맞는 훈련소 장면), 큰 시험은 그 길의 큰 문항 (세트가 없으면 common)
  //   같은 걸음의 다른 속삭임에 이미 정해진 문항은 피함. 한 번 정하면 이길 때까지 그대로 (넘어져 다시 와도 같은 시험)
  function assign(S) {
    const used = byCourse[S.id].map((x) => x.lie).filter(Boolean);
    const own = (at) => { const l = pool(at, { path: S.id, tier: TIER[S.id] || 3 }); return l.length ? l : pool(at, { path: 'common' }); };
    const T = (!S.big && draw(own('small'), S.id, { avoid: used })[0]) || draw(own('big'), S.id, { avoid: used })[0];
    return T.id;
  }
  // 다시 걷기: 길을 다 이긴 뒤 입구 가까이 오면 속삭임이 새로 생김 (문항은 다시 고름, 최근 본 것은 뒤로)
  function revive(id) {
    for (const S of byCourse[id]) {
      Object.assign(S, { beaten: false, fade: -1, lie: null, sz: null, wait: false, belt: false });
      S.g.scale.setScalar(S.big ? 1.9 : 1);
      S.parts.forEach((m) => { m.material.opacity = m.isSprite ? 0.45 : 0.55; });
    }
    entered.delete(id);
  }

  // ---------- 시험 말풍선 ----------
  const box = document.createElement('div');
  box.className = 'npcb trial'; box.id = 'trial'; box.hidden = true;
  box.innerHTML = '<div class="who"><b></b><span class="n"></span></div><p class="scene" hidden></p><p class="say"></p><div class="verse" hidden></div><div class="opts"></div><div class="row"><button class="later">나중에 할래요</button><button class="again" hidden>다시 서기</button><button class="oil" hidden></button></div>';
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  let cur = null, closedFor = null, opts = [];
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = e.target.closest('.opt');
    if (o) return choose(Number(o.dataset.i));
    if (e.target.classList.contains('later')) { closedFor = cur; close(); }
    if (e.target.classList.contains('oil')) pourOil();
    if (e.target.classList.contains('again')) again();
  });
  addEventListener('keydown', (e) => {
    if (!cur || cur.wait) return;
    const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
    if (m) { e.stopPropagation(); e.preventDefault(); if (cur.kind !== 'hold') choose(Number(m[1]) - 1); else if (m[1] === '1') again(); }
    else if (e.code === 'KeyX') hint(); // 기도하면 맞는 말씀이 떠오름 (기도 동작은 그대로)
  }, true);
  const close = () => { box.hidden = true; cur = null; document.body.classList.remove('talking', 'trialing'); bigOff(); };
  function meet(S) {
    // 성령의 검: 한 길에 한 번 작은 속삭임을 단번에 (히 4:12)
    if (!S.big && wears('sword') && !swordUsed.has(S.id)) {
      swordUsed.add(S.id);
      S.beaten = true; S.fade = 0;
      sfx('impact/impactMetal_light_000', 0.3, 1.2); burst(S.x, gy(S) + 1.2, S.z);
      showVerse('dg-sword', { cooldown: 0, title: '성령의 검으로 물리쳤어요' });
      setTimeout(() => checkWin(S.id), 900);
      return;
    }
    cur = S; S.metAt = performance.now();
    if (S.big) bigOn(S);
    me.path = []; me.task = null; if (me.state === 'walk') me.state = 'idle';
    me.face = Math.atan2(S.x - me.x, S.z - me.z);
    if (!S.lie) S.lie = assign(S);
    const T = BY[S.lie], ref = verseOf(T.id);
    S.kind = T.kind || 'pick';
    markSeen(S.id, T.id);
    const list = byCourse[S.id];
    $('.who b').textContent = (S.big ? '큰 시험 · ' : '') + '마음의 소리' + (KIND_NAME[S.kind] ? ' · ' + KIND_NAME[S.kind] : '') + (T.who ? ' · ' + T.who : '');
    const sc = $('.scene'); sc.hidden = !T.scene; sc.textContent = T.scene || ''; // 훈련소 장면이 숲길에 나올 때
    $('.n').textContent = `${courseName(S.id)} · ${list.indexOf(S) + 1} / ${list.length}`;
    say(T.lie, PROMPT[S.kind]);
    const vb = $('.verse'); vb.textContent = ''; vb.hidden = S.kind === 'pick';
    $('.again').hidden = true;
    if (S.kind === 'fill') {
      // 빈칸 구절 + 낱말 셋 (f0이 정답)
      const f = fillOf(T); S.words = f.words; S.right = 'f0';
      opts = shuffle(['f0', 'f1', 'f2'], hash(S.id + S.k + performance.now()));
      const at = f.text.indexOf(f.words[0]), sp = document.createElement('span'), b = document.createElement('b'), em = document.createElement('em');
      b.className = 'blank'; em.textContent = ref[1];
      sp.append(f.text.slice(0, at), b, f.text.slice(at + f.words[0].length), em);
      vb.append(sp);
      $('.opts').innerHTML = opts.map((k, i) => `<button class="opt word" data-i="${i}"><kbd>${i + 1}</kbd><span>${f.words[Number(k[1])]}</span></button>`).join('');
    } else if (S.kind === 'hold') {
      // 붙들 말씀(현대어는 bible.js가 바꿔 보여 줌) + 등불
      opts = []; S.right = null; $('.opts').innerHTML = '';
      vb.innerHTML = `<span>${ref[0]} <em>${ref[1]}</em></span><i class="lamp"><b></b></i>`;
      Object.assign(S, { p: 0, grace: 1.2, broken: false, wt: 0, wi: 0, lines: [T.lie, ...(T.hold?.more || [])], ax: me.x, az: me.z, prayed: false, lastT: performance.now() });
      lampB = vb.querySelector('.lamp b');
    } else {
      S.right = T.id;
      opts = shuffle([T.id, 'n0', 'n1'], hash(S.id + S.k + performance.now())); // n0·n1 = 속삭임에 넘어간 대답 (T.no 글)
      $('.opts').innerHTML = opts.map((k, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd>${k === T.id ? `<span>${verseOf(k)[0]} <em>${verseOf(k)[1]}</em></span>` : `<span>${T.no[Number(k[1])]}</span>`}</button>`).join('');
    }
    box.hidden = false; box.classList.remove('ok');
    S.oiled = false; oilBtn();
    document.body.classList.add('talking', 'trialing');
    sfx('impact/impactSoft_heavy_000', 0.2, 0.5);
  }
  // 속삭임 한 줄 + 그 아래 작은 글(물음 / 왜 이기는지 / 왜 아닌가)
  function say(line, note) {
    const el = $('.say'), q = document.createElement('span'), sm = document.createElement('small');
    q.className = 'q'; q.textContent = `"${line}"`; sm.textContent = note;
    el.textContent = ''; el.append(q, sm);
  }
  const note = (text, cls) => { const sm = $('.say small'); if (sm) { sm.textContent = text; sm.className = cls || ''; } };
  function fillOf(T) {
    const krv = verseOf(T.id)[0], mod = bibleMode() === 'modern' && MOD && MOD.get(krv);
    return mod && T.fill.m ? { text: mod, words: T.fill.m } : { text: krv, words: T.fill.k };
  }
  // 틀린 보기를 골랐을 때: 고르기는 한 문장, 채우기는 그 낱말이 왜 아닌지
  const WRONG_NOTE = '음, 다시 골라 봐요. 그 말은 마음의 소리가 바라는 대답이에요.';
  function whyNot(S, k) {
    if (S.kind === 'fill') return BY[S.lie].fill.why[Number(k[1]) - 1] || '';
    return WRONG_NOTE; // 틀린 보기는 속삭임에 넘어간 대답 (trials.js no)
  }
  function winTrial(S, i) {
    S.beaten = true; S.fade = 0; S.wait = true; S.sz = S.g.scale.x; // 버티며 줄어든 크기에서 흩어지게
    box.classList.add('ok'); if (i != null) $(`.opt[data-i="${i}"]`)?.classList.add('hint');
    if (S.kind === 'fill') { const b = $('.verse .blank'); if (b) { b.textContent = S.words[0]; b.classList.add('on'); } }
    if (S.kind === 'hold') { lamp(1); $('.again').hidden = true; }
    const win = BY[S.lie].win; if (win) note(win); // 이 말씀이 왜 이기는지 한 줄
    sfx('orb', 0.3, 1.2); burst(S.x, gy(S) + 1.2, S.z);
    showVerse(vkey(BY[S.lie]), { cooldown: 0, title: '말씀으로 물리쳤어요' });
    setTimeout(() => { S.wait = false; if (cur === S) close(); checkWin(S.id); }, win ? 2200 : 900);
  }
  function choose(i) {
    const S = cur; if (!S || S.wait || S.kind === 'hold' || opts[i] == null) return;
    if (opts[i] === S.right) return winTrial(S, i);
    const why = whyNot(S, opts[i]);
    if (why) note(why, 'why');
    if (wears('shield') && !shieldUsed.has(S.id)) {
      // 믿음의 방패: 한 길에 한 번 넘어지지 않음 (엡 6:16)
      shieldUsed.add(S.id);
      const b = $(`.opt[data-i="${i}"]`); if (b) { b.classList.add('no'); b.disabled = true; }
      sfx('impact/impactMetal_light_000', 0.3, 0.8);
      toast('믿음의 방패가 불화살을 막아 넘어지지 않았어요. 다른 말씀을 골라 보세요', 4);
    } else if (useGood(profile, 'loaf')) {
      // 보리떡이 있으면: 넘어져도 그 자리에서 먹고 다시 일어나 다른 말씀을 고름 (왕상 19:7)
      const b = $(`.opt[data-i="${i}"]`); if (b) { b.classList.add('no'); b.disabled = true; }
      sfx('impact/impactSoft_medium_000', 0.25, 0.7);
      toast(`넘어졌지만 보리떡을 먹고 그 자리에서 다시 일어났어요 (남은 보리떡 ${profile.bag.loaf | 0})`, 4);
      save(); onChange?.();
    } else {
      // 넘어짐: 화면이 잠깐 어두워지고 앞 정거장에서 다시 일어남
      S.wait = true;
      const b = $(`.opt[data-i="${i}"]`); if (b) b.classList.add('no');
      sfx('impact/impactSoft_medium_000', 0.3, 0.6);
      veil.style.opacity = '0.85';
      setTimeout(() => {
        let p = S.back;
        if (wears('helmet')) { // 구원의 투구: 앞 정거장까지 돌아가지 않고 속삭임 몇 걸음 앞에서 일어남
          const dx = S.back.x - S.x, dz = S.back.z - S.z, l = Math.hypot(dx, dz) || 1, k = Math.min(1, 6.5 / l);
          p = { x: S.x + dx * k, z: S.z + dz * k, dir: S.back.dir };
        }
        me.x = p.x; me.z = p.z; me.path = []; me.state = 'idle'; me.task = null; me.face = Math.atan2(p.dir.x, p.dir.z);
        S.wait = false; closedFor = null; close();
        veil.style.opacity = '0';
        showVerse('dg-rise', { cooldown: 0, title: '넘어져도 다시 일어나요' });
      }, why ? 2200 : 1300); // "왜 아닌가"를 읽을 틈 (창은 막보다 위에 있음)
    }
  }
  // ---------- 버티기: 속삭임이 되풀이되는 동안 말씀을 붙들고 서 있기 ----------
  let lampB = null; // 등불 막대 (meet에서 찾아 둠)
  const lamp = (k) => { if (lampB) lampB.style.width = `${Math.round(k * 100)}%`; };
  function holdStep(S) {
    // 시간은 프레임 dt(main.js가 0.05로 자름)가 아니라 실제 지난 시간으로 잼: 느린 기기에서도 8~12초 그대로 (한 번에 0.25초까지)
    const now = performance.now(), dt = Math.min(0.25, Math.max(0, (now - (S.lastT || now)) / 1000));
    S.lastT = now;
    if (S.broken) return;
    if (S.grace > 0) { S.grace -= dt; S.ax = me.x; S.az = me.z; return; } // 멈춰 설 때까지는 자리를 따라감
    if (Math.hypot(me.x - S.ax, me.z - S.az) > HOLD_R) {
      // 자리를 떠남: 넘어지지 않고 처음부터 다시 서기
      S.broken = true; S.p = 0; lamp(0);
      note('자리를 떠났어요. 괜찮아요! \'다시 서기\'를 눌러요', 'why');
      $('.again').hidden = false;
      sfx('impact/impactSoft_medium_000', 0.15, 0.9);
      return;
    }
    const need = (BY[S.lie].hold?.secs || 10) * (K.resting?.() ? 0.6 : 1); // 쉼 모드면 더 짧게
    S.p = Math.min(1, S.p + (dt / need) * (me.action === 'pray' ? 1.25 : 1)); // 기도하며 붙들면 조금 더 빨리
    lamp(S.p);
    S.wt += dt;
    if (S.wt > 2.6 && S.lines.length > 1) {
      S.wt = 0; S.wi = (S.wi + 1) % S.lines.length;
      const q = $('.say .q'); if (q) { q.textContent = `"${S.lines[S.wi]}"`; q.classList.remove('re'); void q.offsetWidth; q.classList.add('re'); }
    }
    if (S.p >= 1) winTrial(S, null);
  }
  function again() {
    const S = cur; if (!S || S.kind !== 'hold' || !S.broken || S.wait) return;
    Object.assign(S, { broken: false, p: 0, grace: 0.6, ax: me.x, az: me.z, lastT: performance.now() });
    $('.again').hidden = true; note(PROMPT.hold); lamp(0);
  }

  // ---------- 큰 시험 연출: 길 끝의 큰 속삭임 ----------
  //   숲이 어두워지고 화면 가장자리가 짙어지며, 큰 그림자가 숨 쉬듯 부풀고 천둥이 울림. 이기면 빛이 터지며 걷힘
  let fog0 = null;
  const dusk = new THREE.Color(0x2a2236);
  function bigOn(S) {
    document.body.classList.add('bigtrial');
    if (scene.fog && !fog0) fog0 = { c: scene.fog.color.clone(), near: scene.fog.near, far: scene.fog.far };
    S.boom = 0;
    sfx('impact/impactSoft_heavy_000', 0.35, 0.35);
    setTimeout(() => sfx('impact/impactSoft_heavy_000', 0.3, 0.3), 700);
    K.shot?.(S, { dist: 11, el: 0.3, side: 0.7, dur: 6, mid: 0.6, y: 1.8 });
  }
  function bigPulse(t) {
    if (fog0 && scene.fog) { scene.fog.color.lerp(dusk, 0.05); scene.fog.near += (fog0.near * 0.35 - scene.fog.near) * 0.05; scene.fog.far += (fog0.far * 0.45 - scene.fog.far) * 0.05; }
    if (cur && !cur.beaten) cur.g.scale.setScalar(1.9 * (1 - 0.35 * (cur.kind === 'hold' ? cur.p || 0 : 0)) * (1 + Math.sin(t * 2.2) * 0.08)); // 버티면 그림자가 줄어듦
    if (cur && Math.random() < 0.004) sfx('impact/impactSoft_heavy_000', 0.18, 0.3); // 먼 천둥
  }
  function bigOff() {
    document.body.classList.remove('bigtrial');
    if (fog0 && scene.fog) { const f = fog0; fog0 = null; let k = 0; const back = () => { k += 0.08; scene.fog.color.lerp(f.c, 0.15); scene.fog.near += (f.near - scene.fog.near) * 0.15; scene.fog.far += (f.far - scene.fog.far) * 0.15; if (k < 1.6) requestAnimationFrame(back); else { scene.fog.color.copy(f.c); scene.fog.near = f.near; scene.fog.far = f.far; } }; back(); }
  }
  function victory(S) {
    // 빛이 동그랗게 퍼지며 어둠이 걷힘
    const ring = fxSprite('circle_05', 0xfff0c0, 1); ring.position.set(S.x, gy(S) + 1.2, S.z); scene.add(ring);
    let k = 0; const grow = () => { k += 0.03; ring.scale.setScalar(1 + k * 18); ring.material.opacity = Math.max(0, 1 - k); if (k < 1) requestAnimationFrame(grow); else scene.remove(ring); }; grow();
    for (let q = 0; q < 16; q++) setTimeout(() => burst(S.x + (Math.random() - 0.5) * 5, gy(S) + 0.5 + Math.random() * 3, S.z + (Math.random() - 0.5) * 5), q * 80);
    sfx('orb', 0.35, 0.7);
  }

  // 등잔 기름: 틀린 말씀 하나를 걷어 냄 (한 속삭임에 한 번)
  function oilBtn() {
    const b = $('.oil'), n = (profile.bag && profile.bag.oil) | 0;
    b.hidden = !cur || cur.kind === 'hold' || cur.oiled || !n;
    b.textContent = `${GOODS.oil.name} 붓기 (${n})`;
  }
  function pourOil() {
    if (!cur || cur.wait || cur.oiled) return;
    const wrong = opts.map((k, i) => [k, i]).filter(([k, i]) => k !== cur.right && !$(`.opt[data-i="${i}"]`)?.classList.contains('no'));
    if (!wrong.length || !useGood(profile, 'oil')) return;
    cur.oiled = true;
    const b = $(`.opt[data-i="${wrong[0][1]}"]`); if (b) { b.classList.add('no'); b.disabled = true; }
    sfx('orb', 0.2, 1.4); toast(cur.kind === 'fill' ? '등불이 밝아져 맞지 않는 낱말 하나가 드러났어요' : '등불이 밝아져, 속삭임에 넘어간 대답 하나가 흐려졌어요', 3);
    save(); onChange?.(); oilBtn();
  }
  function hint() {
    if (!cur || cur.wait) return;
    if (cur.kind === 'hold') { if (!cur.prayed && !cur.broken) { cur.prayed = true; note('기도하며 말씀을 붙들어요. 무릎 꿇은 채로도 버틸 수 있어요'); } return; } // 알림 대신 창 안 글 (가로 폰에서 등불을 덮지 않게)
    const i = opts.indexOf(cur.right);
    $(`.opt[data-i="${i}"]`)?.classList.add('hint');
    toast('기도하니 마음에 떠오르는 말씀이 있어요', 3);
  }
  function checkWin(id) {
    const list = byCourse[id];
    const left = list.filter((S) => !S.beaten).length;
    if (left) { toast(`이 길에 남은 검은 그림자 ${left}곳`, 2.5); return; }
    shieldUsed.delete(id); swordUsed.delete(id);
    const bigS = list.find((S) => S.big); if (bigS) victory(bigS);
    profile.dungeon = profile.dungeon || {};
    if (profile.dungeon[id]) { // 다시 이김: 길마다 하루 첫 번째만 걸음 +5·1 데나리온, 그 뒤 같은 날은 걸음 +1
      const first = firstRedoToday(id);
      addSteps(profile, first ? 5 : 1); if (first) earn(profile, 1); save(); onChange?.();
      toast(`${courseName(id)}의 시험을 다시 이겼어요 (걸음 +${first ? '5, 1 데나리온' : '1 · 데나리온은 하루 한 번'})`, 4); return;
    }
    profile.dungeon[id] = 'clear';
    const n = REWARD[TIER[id]] * (K.gear?.()?.full() ? 2 : 1); // 전신갑주를 다 갖추면 두 배
    addStat(profile, 'word', 5); addStat(profile, 'obey', 5);
    const pay = { 1: 3, 2: 5, 3: 8 }[TIER[id]] || 3; earn(profile, pay);
    const up = addSteps(profile, n);
    save(); onChange?.();
    setTimeout(() => {
      showVerse('dg-win', { cooldown: 0, title: `${courseName(id)} ${stars(id)} 이겼어요` });
      // 알림은 하나로 (R3): 보상과 성장 소식을 한 번에. 쉼 모드(앉아 쉬는 중)에서는 반짝임을 절반으로
      toast(`${courseName(id)} 길을 이겼어요! 잘했어요. (걸음 +${n}, 말씀 +5, 순종 +5, ${pay} 데나리온)` + (up ? ` · ${profile.name || '나'}님이 ${up.name}${josa(up.name)} 자랐어요! 이제 ${stars2(up)} 길이 열려요` : ''), up ? 7 : 5);
      for (let q = 0; q < (K.resting?.() ? 5 : 10); q++) setTimeout(() => burst(me.x + (Math.random() - 0.5) * 3, me.y + 1 + Math.random() * 2, me.z + (Math.random() - 0.5) * 3), q * 120);
    }, 2400);
  }
  const josa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? '으로' : '로'; };
  const stars2 = (st) => '★'.repeat(Math.min(3, STAGES.indexOf(st) + 1));

  // 넘어질 때 화면을 덮는 막
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;background:#120e18;opacity:0;pointer-events:none;transition:opacity .5s;z-index:30';
  document.body.appendChild(veil);

  // ---------- 매 프레임 ----------
  let lockAt = 0, lockSaid = 0;
  const entered = new Set();
  let enterSaid = false;
  function step(dt, t) {
    const now = performance.now() / 1000;
    // 표지와 속삭임은 가까이 있을 때만 그림
    for (const s of signs) s.sp.visible = Math.abs(s.p.x - me.x) < 70 && Math.abs(s.p.z - me.z) < 70;
    for (const S of shades) {
      const d = Math.hypot(me.x - S.x, me.z - S.z);
      S.g.visible = (!S.beaten || S.fade >= 0) && d < 70;
      if (!S.g.visible) continue;
      if (S.fade >= 0) { S.fade += dt; const k = Math.max(0, 1 - S.fade / 1.2); S.g.scale.setScalar((S.sz || (S.big ? 1.9 : 1)) * (1 + (1 - k) * 0.6)); S.parts.forEach((m) => { m.material.opacity = (m.isSprite ? 0.45 : 0.55) * k; }); if (k <= 0) { S.fade = -1; S.g.visible = false; } continue; }
      S.parts.forEach((m, q) => { if (m.isMesh) m.position.set(Math.sin(t * (1.1 + q * 0.3) + q) * 0.45, 0.8 + q * 0.32 + Math.sin(t * 2 + q) * 0.12, Math.cos(t * (0.9 + q * 0.25) + q * 2) * 0.45); else m.material.rotation = t * 0.3 * (q % 2 ? 1 : -1); });
    }
    // 시험: 속삭임 곁에 오면 길을 막고 물음
    if (cur) {
      if (!cur.wait && Math.hypot(me.x - cur.x, me.z - cur.z) > 8) close();
      else if (cur.kind === 'hold') { if (!cur.wait) holdStep(cur); }
      else if (cur && !cur.wait && !cur.belt && wears('belt') && performance.now() - cur.metAt > 8000) { cur.belt = true; hint(); toast('진리의 허리띠가 맞는 말씀을 비춰 줘요', 2.5); }
      if (cur && cur.big) bigPulse(t);
    } else if (!busy()) {
      let near = null;
      for (const S of shades) if (!S.beaten && Math.hypot(me.x - S.x, me.z - S.z) < (S.big ? 5.5 : 4.2)) near = S;
      if (near && near !== closedFor) meet(near);
      if (!near) closedFor = null;
    }
    // 잠긴 길과 처음 들어선 길 (0.3초마다)
    if (now - lockAt < 0.3) return;
    lockAt = now;
    // 다 이긴 길의 입구 가까이 오면 속삭임이 새로 생김 (입구는 정원 둘레 바로 바깥이라 아래 정원 안 검사보다 먼저 봄)
    if (!cur) for (const [cid, list] of Object.entries(byCourse)) {
      if (!list.every((S) => S.beaten)) continue; // 흩어지는 중인 것도 됨 (멀리 있으면 흩어짐이 끝나지 않으므로, revive가 되돌림)
      const g = gateOf(TRAILS[cid]); if (Math.hypot(me.x - g.x, me.z - g.z) < 6) revive(cid);
    }
    const r = Math.hypot(me.x, me.z);
    if (r < R_PARK + 2.5) return;
    let best = null, bd = 3.2;
    for (const tr of Object.values(TRAILS)) {
      const q0 = tr.samples[0], qn = tr.samples[tr.samples.length - 1];
      if (Math.min(Math.hypot(q0.x - me.x, q0.z - me.z), Math.hypot(qn.x - me.x, qn.z - me.z)) > tr.len + 4) continue;
      for (let i = 0; i < tr.samples.length; i += 2) { const q = tr.samples[i]; const d = Math.abs(q.x - me.x) + Math.abs(q.z - me.z); if (d < bd) { bd = d; best = tr.id; } }
    }
    if (!best) return;
    const id = rootOf(best);
    if (!TIER[id]) return;
    if (!open(id)) {
      const g = gateOf(TRAILS[id]), k = (R_PARK - 1.2) / Math.hypot(g.x, g.z);
      me.x = g.x * k; me.z = g.z * k; me.path = []; me.state = 'idle'; me.task = null; me.face = Math.atan2(-g.x, -g.z);
      if (now - lockSaid > 4) { lockSaid = now; toast(`${courseName(id)} ${stars(id)}: '${TIER_STAGE[TIER[id]]}'가 되면 들어와요. 걸음이 ${STAGES[needIx(id)].need}이 되어야 해요 (지금 ${profile.steps | 0}). 정원 훈련장이나 부탁을 해 봐요.`, 6); sfx('impact/impactSoft_medium_000', 0.2, 0.8); }
      return;
    }
    if (!entered.has(id)) {
      if (!enterSaid) { enterSaid = true; showVerse('dg-enter', { cooldown: 0, title: '숲길에 들어왔어요' }); }
      entered.add(id);
      const n = byCourse[id].filter((S) => !S.beaten).length;
      if (n) setTimeout(() => toast(`${courseName(id)} ${stars(id)}: 이 길에 검은 그림자가 ${['', '한', '두', '세', '네'][n] || n} 군데 있어요. 가까이 가면 말씀으로 이겨요.`, 5), 600);
    }
  }

  // ---------- 길 끝에서 입구로 돌아가기 ----------
  const ends = Object.values(TRAILS).map((tr) => ({ id: tr.id, p: tr.end, said: false }));
  const nearEnd = () => ends.find((e) => Math.hypot(me.x - e.p.x, me.z - e.p.z) < 9);
  function goBack() {
    const e = nearEnd(); if (!e) return;
    const g = gateOf(TRAILS[rootOf(e.id)]), k = (R_PARK - 1.5) / Math.hypot(g.x, g.z);
    veil.style.opacity = '0.9'; sfx('orb', 0.2, 0.9);
    setTimeout(() => {
      me.x = g.x * k; me.z = g.z * k; me.path = []; me.state = 'idle'; me.task = null; me.action = null; me.face = Math.atan2(-g.x, -g.z);
      veil.style.opacity = '0';
      toast(`${courseName(rootOf(e.id))} 입구로 돌아왔어요`, 3);
    }, 700);
  }
  function endHint() {
    const e = nearEnd(); if (!e || e.said) return;
    e.said = true;
    setTimeout(() => toast('길 끝까지 왔어요! 반짝이는 문 단추를 누르면 입구로 가요 (E)', 5), 4000);
  }

  return {
    actions: { goback: goBack },
    available: () => (nearEnd() && !cur ? [['place', 'goback']] : []),
    step: (dt, t) => { step(dt, t); endHint(); },
    active: () => !!cur, open, shades, byCourse,
    onPress(name) { if (cur && name === 'pray') hint(); },
  };
}
