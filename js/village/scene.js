// 장면 영상 (마을 공용, 2026-11 T04 P1): 게임 속 인물·따뜻한 빛·자막·말씀 카드로 만든 짧은 장면
//   실제 영상 파일이 아니라 박자(beat) 목록을 차례로 돌림. 장면 자료는 마을마다 (js/john/scenes.js)
//   한 장면 = open(여는 장면: 문제까지) · close(맺는 장면: 결말) 박자 목록 + line(맺는 한 줄) + more(한 걸음 더: 글·말씀 카드·물음)
//
// initScene(cfg) → { play(id, { part: 'open'|'close'|'all', then }), stop(why), step(dt), playing(), seen(id, part), has(id), sky() }
//   cfg: me, people({ N, person, X.walkNpc }), SCENES, P(자리 표), shot, sfx, warm(p, h, k)(따뜻한 빛: p가 null이면 끔), fx({ 이름: (값) => 되돌릴 함수 }),
//        inTown(), standUp, seenKey('navs-cafe-<마을>-scenes')
//   박자 한 칸에 아래 것을 함께 적을 수 있음 (적힌 순서와 상관없이 cam → light → sky → fx → walk → pose → sfx → 글 순으로)
//     cam  { at, dist, el, side, mid, y }   카메라 (main.js shot: 나를 축으로 대상 쪽을 봄)
//     light { at, h, k } | false             따뜻한 빛 (예수님). 옮기면 천천히 미끄러져 감. k: 밝기(크기) 배율
//     sub  '자막'                            화면 아래 해설
//     say  ['누가', '말']                    사람의 말 (자막 자리에 이름과 함께). 예수님은 쓰지 않음 (자료 검사)
//     word '구절 키'                         말씀 카드 (아이가 고른 성경으로). 예수님·하나님의 말씀은 이것으로만
//     walk { who, to, slow }                 걷기 (곧게)
//     pose { who, act, face, look }          몸짓(act: avatar.js 동작, null이면 멈춤)·바라보기(face: 자리, look: 다른 배우 키)
//     sky  '이름' | null                     그 시각의 빛 (마을 SKY 표 이름). 장면이 끝나면 마을이 정함
//     sfx  [이름, 세기, 빠르기]
//     fx   '이름' | ['이름', 값]             마을 연출 훅 (돌항아리 등). 훅이 돌려준 함수는 장면이 끝날 때 불러 되돌림
//     wait 초                                글이 없는 박자를 머무는 시간
//   장면 머리: title, sky(시각), max(초), cast(있는 사람 키), extras(장면 때만 서는 배우 { name, look, at, faceTo }), view({ at, face }: 서서 보는 자리)
//   글이 있는 박자는 읽을 시간(2초 + 글자 수 × 0.16초, 3~9초)만큼 머물고 넘어감. 화면을 누르면 바로 다음. 마지막 박자는 눌러야 넘어감
//   [넘기기](Esc)는 언제든 바로 끝. 끝나는 길은 finish 하나: 배우 복원 → 빛·연출 되돌림 → 틀 걷기 → 잠금 풂 → then 한 번
//   미리 보기 막음 (T04 3.3): localStorage['navs-cafe-preview'] === '1'일 때만 장면이 있음 (has가 거짓이면 엔진은 예전 그대로)
//     주소 끝 ?preview=1 로 켜고 ?preview=0 으로 끔
import { VERSES, hushVerses } from '../verses.js';
import { bibleText, bibleReady } from '../bible.js';
import { nearestFree } from '../nav.js';

const PREVIEW = 'navs-cafe-preview';
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 이번만 */ } };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* 이번만 */ } };
try {
  const q = new URLSearchParams(location.search).get('preview');
  if (q === '1') lsSet(PREVIEW, '1'); else if (q === '0') lsDel(PREVIEW);
} catch (e) { /* 주소를 못 읽으면 그대로 */ }
export const previewOn = () => lsGet(PREVIEW) === '1';

const KINDS = ['cam', 'light', 'sub', 'say', 'word', 'walk', 'pose', 'sky', 'sfx', 'fx', 'wait'];
const JESUS = /^(jesus|예수|예수님)$/i;
const readSec = (t) => Math.max(3, Math.min(9, 2 + t.length * 0.16));
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 자료 검사: 비트 종류 오타, 없는 배우, 예수님 배우·말풍선, 없는 구절 키 (지을 때 한 번 경고)
export function checkScenes(SCENES, N = {}) {
  const warn = [];
  for (const [id, sc] of Object.entries(SCENES)) {
    const actors = new Set([...(sc.cast || []), ...Object.keys(sc.extras || {})]);
    for (const k of actors) if (JESUS.test(k)) warn.push(`${id}: 예수님 배우(${k})는 둘 수 없어요. 따뜻한 빛(light)만 써요`);
    for (const k of sc.cast || []) if (!N[k]) warn.push(`${id}: 없는 배우 ${k}`);
    const beats = [...(sc.open || []), ...(sc.close || [])];
    beats.forEach((b, i) => {
      for (const k of Object.keys(b)) if (!KINDS.includes(k)) warn.push(`${id} 박자 ${i + 1}: 모르는 종류 ${k}`);
      for (const k of ['walk', 'pose']) if (b[k]) { const w = b[k].who; if (JESUS.test(w)) warn.push(`${id} 박자 ${i + 1}: 예수님 배우(${k})는 둘 수 없어요`); else if (!actors.has(w)) warn.push(`${id} 박자 ${i + 1}: 배우 목록에 없는 ${w}`); }
      if (b.say && JESUS.test(String(b.say[0]).trim())) warn.push(`${id} 박자 ${i + 1}: 예수님의 말씀은 말풍선이 아니라 말씀 카드(word)로만`);
      if (b.word && !VERSES[b.word]) warn.push(`${id} 박자 ${i + 1}: 없는 구절 ${b.word}`);
    });
    if (sc.more?.word && !VERSES[sc.more.word]) warn.push(`${id} 한 걸음 더: 없는 구절 ${sc.more.word}`);
  }
  if (warn.length) console.warn(`장면 자료를 확인해요: ${warn.join(' / ')}`);
  return warn;
}

export function initScene(cfg) {
  const { me, people, SCENES, P = {}, shot, sfx, warm, fx = {}, inTown = () => true, standUp, seenKey } = cfg;
  const N = people.N;
  checkScenes(SCENES, N);
  const pt = (a) => (typeof a === 'function' ? a(P) : a);

  // ---------- 본 장면 (이 기기) ----------
  const seenList = () => { try { return JSON.parse(lsGet(seenKey) || '[]'); } catch (e) { return []; } };
  const tag = (id, part) => (part === 'close' ? `${id}:close` : id);
  const seen = (id, part = 'open') => seenList().includes(tag(id, part));
  const markSeen = (id, part) => { const l = seenList(); const t = tag(id, part); if (!l.includes(t)) { l.push(t); lsSet(seenKey, JSON.stringify(l)); } };
  const has = (id) => !!id && !!SCENES[id] && previewOn();

  // ---------- 화면 틀 ----------
  let el = null;
  function frame() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'scene'; el.className = 'scene'; el.hidden = true;
    el.innerHTML = '<div class="sc-band top"></div><div class="sc-band bot"></div>'
      + '<button class="sc-skip" type="button">넘기기</button>'
      + '<div class="sc-word" hidden><p></p><cite></cite></div>'
      + '<div class="sc-sub" hidden><b></b><p></p><i class="sc-bar"><i></i></i><span class="sc-tap" aria-hidden="true">▸</span></div>'
      + '<div class="sc-end" hidden></div>';
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); if (e.target.closest('button')) return; tapNext(); });
    el.querySelector('.sc-skip').addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); finish('skip'); });
    document.body.appendChild(el);
    return el;
  }
  const $ = (s) => el.querySelector(s);
  async function fillWord(box, key) {
    const v = VERSES[key]; if (!v) { box.hidden = true; return; }
    box.querySelector('p').textContent = bibleText(v[0]);
    box.querySelector('cite').textContent = v[1];
    box.hidden = false;
    try { await bibleReady(); if (cur && box.querySelector('cite').textContent === v[1]) box.querySelector('p').textContent = bibleText(v[0]); } catch (e) { /* 원문 그대로 */ }
  }

  // ---------- 재생 ----------
  let cur = null; // { id, sc, part, beats, i, t, hold, tap, then, snaps, undo, skyName, light, total }
  const playing = () => !!cur;

  // 배우 복원표: 처음 건드릴 때 적어 둠
  function actor(k) {
    const n = N[k]; if (!n) return null;
    if (!cur.snaps.has(k)) {
      cur.snaps.set(k, {
        x: n.x, z: n.z, home: n.home && { ...n.home }, face: n.face, action: n.action ?? null, hide: !!n.hide, fixFace: !!n.fixFace,
        seat: n.seat || null, state: n.state, slow: n.slow, follow: !!n.follow, tag: n.tag ? n.tag.visible : null, mark: n.mark ? n.mark.visible : null,
      });
      n.fixFace = true; n.follow = false;
      if (n.tag) n.tag.visible = false;
      if (n.mark) n.mark.visible = false;
    }
    return n;
  }
  function restore() {
    for (const [k, s] of cur.snaps) {
      const n = N[k]; if (!n) continue;
      n.path = []; n.x = s.x; n.z = s.z; n.home = s.home; n.face = s.face; n.action = s.action; n.hide = s.hide; n.fixFace = s.fixFace;
      n.seat = s.seat; n.state = s.state === 'walk' ? 'idle' : s.state; n.slow = s.slow; n.follow = s.follow;
      if (n.tag && s.tag != null) n.tag.visible = s.tag;
      if (n.mark && s.mark != null) n.mark.visible = s.mark;
    }
    cur.snaps.clear();
  }
  // 장면 전용 배우 (처음 재생할 때 세움, 장면 밖에서는 숨김)
  function extras(sc) {
    for (const [k, x] of Object.entries(sc.extras || {})) {
      if (!N[k]) { const n = people.person(k, x.name, x.look, pt(x.at), pt(x.faceTo || x.at)); n.hide = true; if (n.tag) n.tag.visible = false; }
      const n = actor(k);
      const q = pt(x.at);
      n.path = []; n.state = 'idle'; n.x = q.x; n.z = q.z; n.home = { x: q.x, z: q.z }; n.action = null; n.seat = null; n.hide = false;
      if (x.faceTo) { const f = pt(x.faceTo); n.face = Math.atan2(f.x - q.x, f.z - q.z); }
    }
  }
  const lookAt = (n, p) => { if (p) n.face = Math.atan2(p.x - n.x, p.z - n.z); };

  function apply(b) {
    if (b.cam) { const c = b.cam; cur.cam = [pt(c.at), { dist: c.dist ?? 9, el: c.el ?? 0.32, side: c.side ?? 0.4, mid: c.mid ?? 0.6, y: c.y ?? 1.3 }]; shot?.(cur.cam[0], { ...cur.cam[1], dur: 60 }); }
    if (b.light === false) { cur.light = null; warm?.(null); } else if (b.light) {
      const to = pt(b.light.at), h = b.light.h ?? 1.5, k = b.light.k ?? 1;
      if (!cur.light) { cur.light = { x: to.x, z: to.z, h, k, to: { x: to.x, z: to.z }, kTo: k }; warm?.(cur.light, h, k); } else { cur.light.to = { x: to.x, z: to.z }; cur.light.kTo = k; cur.light.h = h; }
    }
    if ('sky' in b) cur.skyName = b.sky;
    if (b.fx) { const [name, v] = [].concat(b.fx); const u = fx[name]?.(v); if (typeof u === 'function') cur.undo.push(u); }
    if (b.walk) { const n = actor(b.walk.who), to = pt(b.walk.to); if (n && to) { people.X.walkNpc(b.walk.who, [to]); if (b.walk.slow) n.slow = b.walk.slow; } }
    if (b.pose) {
      const n = actor(b.pose.who);
      if (n) {
        if ('act' in b.pose) n.action = b.pose.act;
        if (b.pose.face) lookAt(n, pt(b.pose.face));
        if (b.pose.look) { const o = b.pose.look === 'me' ? me : N[b.pose.look]; lookAt(n, o); }
      }
    }
    if (b.sfx) sfx?.(...[].concat(b.sfx));
    // 글
    const sub = $('.sc-sub'), word = $('.sc-word');
    let text = '';
    if (b.sub || b.say) {
      const who = b.say ? b.say[0] : '', t = b.say ? b.say[1] : b.sub;
      sub.querySelector('b').textContent = who; sub.querySelector('b').hidden = !who;
      sub.querySelector('p').textContent = t;
      sub.classList.toggle('say', !!b.say);
      sub.hidden = false; text += t;
    } else sub.hidden = true;
    if (b.word) { fillWord(word, b.word); text += VERSES[b.word]?.[0] || ''; } else word.hidden = true;
    const last = cur.i === cur.beats.length - 1;
    cur.tap = last && !!text; // 마지막 박자는 눌러야
    cur.hold = text ? readSec(text) : (b.wait ?? (b.walk ? 1.6 : 0.6));
    cur.t = 0;
    sub.classList.toggle('tap', cur.tap);
    const bar = sub.querySelector('.sc-bar i');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; if (!cur.tap && text) { void bar.offsetWidth; bar.style.transition = `width ${cur.hold}s linear`; bar.style.width = '100%'; } }
  }
  function next() {
    cur.i++;
    if (cur.i >= cur.beats.length) return endBeats();
    try { apply(cur.beats[cur.i]); } catch (err) { console.warn('장면 박자를 하지 못했어요', err); finish('error'); }
  }
  // 박자가 다 끝남: 맺는 장면이면 한 줄 + [이야기 계속하기]·[한 걸음 더 ▸], 아니면 끝
  function endBeats() {
    if (cur.part === 'open' || !cur.sc.line) return finish('end');
    cur.panel = true;
    $('.sc-sub').hidden = true; $('.sc-word').hidden = true;
    const end = $('.sc-end');
    end.innerHTML = `<small>${esc(cur.sc.title || '')}</small><p>${esc(cur.sc.line)}</p><div class="row"><button type="button" class="later">이야기 계속하기</button>${cur.sc.more ? '<button type="button" class="next">한 걸음 더 ▸</button>' : ''}</div>`;
    end.hidden = false;
    end.querySelector('.later').addEventListener('click', () => finish('end'));
    end.querySelector('.next')?.addEventListener('click', more);
  }
  function more() {
    const m = cur.sc.more, end = $('.sc-end');
    end.innerHTML = `<small>${esc(cur.sc.title || '')}</small><p>${esc(m.text)}</p><div class="sc-word in"><p></p><cite></cite></div><p class="sc-q">💭 ${esc(m.ask)}</p><div class="row"><button type="button" class="next">이야기 계속하기</button></div>`;
    fillWord(end.querySelector('.sc-word'), m.word);
    end.querySelector('.next').addEventListener('click', () => finish('end'));
    end.scrollTop = 0;
  }
  function tapNext() {
    if (!cur || cur.panel) return;
    next();
  }
  function onKey(e) {
    if (!cur) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); finish('skip'); return; }
    if (!cur.panel && /^(Enter|NumpadEnter|Space)$/.test(e.code)) { e.stopPropagation(); e.preventDefault(); tapNext(); }
  }

  function play(id, { part = 'open', then = null } = {}) {
    const sc = SCENES[id];
    if (cur || !sc || !has(id)) { if (then) setTimeout(then, 0); return false; }
    const beats = part === 'all' ? [...(sc.open || []), ...(sc.close || [])] : [...(sc[part] || [])];
    cur = { id, sc, part, beats, cam: null, i: -1, t: 0, hold: 0, tap: false, then, snaps: new Map(), undo: [], skyName: sc.sky, light: null, total: 0, panel: false };
    try {
      frame();
      $('.sc-end').hidden = true; $('.sc-sub').hidden = true; $('.sc-word').hidden = true;
      el.hidden = false;
      document.body.classList.add('cine');
      hushVerses(true);
      if (me.state === 'walk') me.state = 'idle';
      me.path = []; me.task = null;
      me.action = null;
      // 서서 보는 자리 (sc.view): 앉아 있지 않으면 무대가 잘 보이는 곳으로 옮겨 섬 (장면이 끝나도 그 자리에서 이어서)
      if (sc.view && !me.seat) { const v = pt(sc.view.at), q = nearestFree(v) || v; me.x = q.x; me.z = q.z; const f = pt(sc.view.face); if (f) me.face = Math.atan2(f.x - me.x, f.z - me.z); }
      extras(sc);
      for (const k of sc.cast || []) actor(k); // 있는 배우도 이름표·머리 표시를 감추고 얼굴을 고정 (복원표에 적음)
      window.addEventListener('keydown', onKey, true);
      next();
    } catch (err) { console.warn('장면을 시작하지 못했어요', err); finish('error'); }
    return true;
  }
  // 끝내는 길은 하나 (정상·넘기기·오류·마을 떠남·시간 초과)
  function finish(why = 'end') {
    if (!cur) return;
    const c = cur;
    const step = (f) => { try { f(); } catch (err) { console.warn('장면 정리 중', err); } };
    step(() => restore());
    step(() => { for (const k of Object.keys(c.sc.extras || {})) if (N[k]) N[k].hide = true; });
    step(() => warm?.(null));
    step(() => { for (const u of c.undo.splice(0).reverse()) u(); });
    step(() => { if (c.cam) shot?.(c.cam[0], { ...c.cam[1], dur: 0 }); }); // 지금 시점에서 천천히 내 뒤로 (방향이 휙 돌지 않게)
    step(() => { el.hidden = true; $('.sc-end').innerHTML = ''; });
    step(() => hushVerses(false));
    document.body.classList.remove('cine');
    window.removeEventListener('keydown', onKey, true);
    if (c.part !== 'all') step(() => markSeen(c.id, c.part)); // 넘긴 장면도 본 것으로 (다시 저절로 나오지 않게)
    cur = null;
    c.why = why;
    if (c.then) setTimeout(() => { try { c.then(why); } catch (err) { console.warn(err); } }, 0);
  }
  function step(dt) {
    if (!cur) return;
    try {
      if (!inTown()) return finish('away');
      cur.total += dt;
      // 따뜻한 빛 미끄러지기
      const L = cur.light;
      if (L && (Math.hypot(L.to.x - L.x, L.to.z - L.z) > 0.01 || Math.abs(L.kTo - L.k) > 0.01)) {
        const a = Math.min(1, dt * 1.6);
        L.x += (L.to.x - L.x) * a; L.z += (L.to.z - L.z) * a; L.k += (L.kTo - L.k) * a;
        warm?.(L, L.h, L.k);
      }
      const lim = (cur.sc.max || 60) * 1.5;
      if (cur.panel || cur.tap) return; // 아이가 누를 때까지 (잠금은 그대로, 넘기기는 늘 됨)
      if (cur.total > lim) return finish('timeout');
      if ((cur.t += dt) >= Math.min(cur.hold, 15)) next();
    } catch (err) { console.warn('장면이 멈췄어요', err); finish('error'); }
  }
  return {
    play, stop: (why = 'stop') => finish(why), step, playing, seen, has,
    sky: () => (cur ? cur.skyName ?? null : undefined), // 장면이 원하는 시각 (재생 중이 아니면 undefined: 마을이 정함)
    get current() { return cur ? { id: cur.id, part: cur.part, i: cur.i, n: cur.beats.length, panel: cur.panel, tap: cur.tap } : null; }, // 시험용
  };
}
