// 어둠의 시험 (2026-11 요한복음 마을, 기획서 5장): 넘어지지 않는 연습형. 틀리면 이유를 한 줄로 알려 주고 다시 고름
//   B 빛 비추기: 어둠이 등불 둘레를 좁혀 옴. 멈추지 않고 빛으로 걸어가면 이김 (요 1:5, 12:35)
//   D 대답: 질문에 마음으로 대답 (맞는 대답이 있는 심문형) (요 1:46, 9:25)
//   E 머물기: 속삭임이 "떠나" 할 때 움직이지 않고 앉아 있거나 기도 (요 15:4)
//   F 내려놓기: 손에 든 것(의심·핑계)을 내려놓고 말씀대로 계속함 (요 2:5)
//   (2차 가) A 말씀 고르기: 세 구절 가운데 속삭임을 이기는 말씀 하나 (요 6:6)
//   (2차 가) G 거슬러 걷기: 떠나가는 무리 사이를 밀리며 빛 쪽으로. 멈추면 무리에 밀려 뒤로 (요 6:66-68)
//   (2차 가) H 흐림 걷어내기: 화면의 물결·안개를 말씀 카드로 한 겹씩 걷어 냄 (요 6:20)
//   (2차 가) I 서두름·되돌아섬: "돌아가자"는 속삭임에도 말씀을 믿고 계속 걸음. 되돌아서면 가던 길을 알려 줌 (요 4:50)
//   마을 공용이라 2차·3차 사건과 초보자 마을 숲길에서도 같은 방식을 쓸 수 있음
// ui: engine.js의 말풍선 (open/close), whisper: 화면 위쪽 속삭임 한 줄, sky: 구역 조명 (B에서 어둠 정도)
import { VERSES } from '../verses.js';

const SUB = { answer: '대답', drop: '내려놓기', verse: '말씀 고르기', clear: '흐림 걷어내기' };
export function initTrials({ ui, me, toast, sfx, burst, whisper, sky, showVerse, lightPath, praying, push = null, fog = null }) {
  let cur = null; // 걸으며 하는 시험(B·E) 하나
  const won = new Set(); // 이번 사건 진행에서 이긴 시험 종류

  // 고르는 시험 (D 대답 · F 내려놓기 · A 말씀 고르기): 말풍선에 속삭임과 보기
  //   A의 보기는 { v: 'jn-6-6', ok } 처럼 말씀 키로 (본문과 장절을 보여 줌)
  const optText = (o) => { const v = o.v && VERSES[o.v]; return v ? `${v[0]} (${v[1]})` : o.t; };
  function choose(kind, { who, lie, q, opts, win, then, drop, sub }) {
    ui.open({
      dark: true, who: who || '어둠의 속삭임', sub: sub || `어둠의 시험 · ${SUB[kind]}`,
      text: lie, note: q,
      opts: opts.map((o) => ({ t: optText(o), ok: !!o.ok, why: o.why || '' })),
      onPick(o) {
        if (!o.ok) { sfx('impact/impactSoft_medium_000', 0.18, 0.8); return; }
        sfx('orb', 0.28, 1.15); burst(me.x, me.y + 1.4, me.z);
        if (drop) drop();
        setTimeout(() => { ui.close(); won.add(kind); if (win) showVerse(win, { cooldown: 0, delay: 0.3, title: { drop: '내려놓았어요', verse: '말씀을 붙들었어요' }[kind] || '대답했어요' }); then?.(); }, 1100);
      },
    });
  }
  const answer = (o) => choose('answer', o);
  const dropIt = (o) => choose('drop', o);
  const pick = (o) => choose('verse', o);
  // H 흐림 걷어내기: layers 차례로 고르기. 맞을 때마다 fog(남은 겹 / 전체)로 한 겹씩 걷힘. 다 걷히면 win 말씀
  function clear({ who, layers, win, then, onLayer }) {
    let k = 0;
    fog?.(1);
    const open = () => {
      const L = layers[k];
      choose('clear', {
        who, lie: L.lie, q: L.q || `물결과 어둠이 마음을 덮어요. 어떤 말씀으로 걷어 낼까요? (${k + 1}/${layers.length})`, opts: L.opts,
        then: () => {
          k++; fog?.((layers.length - k) / layers.length); onLayer?.(k);
          if (k < layers.length) setTimeout(open, 500);
          else { won.add('clear'); if (win) showVerse(win, { cooldown: 0, delay: 0.3, title: '걷혔어요' }); then?.(); }
        },
      });
    };
    open();
  }

  // B 빛 비추기: to까지 걸어가면 이김. 멈춰 있으면 어둠이 좁혀 오고(sky.dark), 기도하면 바닥에 빛 길
  function light({ to, r = 3, lines = [], then }) {
    cur = { kind: 'light', to, r, lines, then, k: 0.15, still: 0, li: 0, said: 0, lit: false, at: { x: me.x, z: me.z } };
  }
  // G 거슬러 걷기: to(자리 또는 함수)까지. 1초 넘게 멈추면 무리에 밀려 away 쪽으로 (push가 막힌 곳은 피함)
  function against({ to, r = 2, lines = [], then, away }) {
    cur = { kind: 'against', to, r, lines, then, away, still: 0, li: 0, said: 0, at: { x: me.x, z: me.z } };
    whisper(lines[0] || '');
  }
  // I 서두름·되돌아섬: to까지 걸어가면 이김. 가장 가까이 갔던 때보다 back m 넘게 멀어지면 말씀을 떠올려 줌
  function onward({ to, r = 3, lines = [], then, back = 7, turn = '' }) {
    const p = typeof to === 'function' ? to() : to;
    cur = { kind: 'onward', to, r, lines, then, back, turn, best: Math.hypot(me.x - p.x, me.z - p.z), wt: 0, li: 0, warned: false };
    whisper(lines[0] || '');
  }
  // E 머물기: ok()가 참인 동안 sec초를 채우면 이김. 일어나거나 떠나면 다시 처음부터 (넘어지지는 않음)
  function stay({ sec = 20, ok, lines = [], then, label = '머물기' }) {
    cur = { kind: 'stay', sec, ok, lines, then, label, t: 0, li: 0, wt: 0, broke: false };
    whisper(lines[0] || '');
  }
  function end() { cur = null; whisper(''); sky.darkness(0); }
  let last = 0;
  function step() {
    const now = performance.now(), dt = last ? Math.min(0.25, (now - last) / 1000) : 0; last = now; // 실제 흐른 시간 (헤드리스에서도 같게)
    if (!cur) return;
    const c = cur;
    if (c.kind === 'light') {
      const moved = Math.hypot(me.x - c.at.x, me.z - c.at.z); c.at = { x: me.x, z: me.z };
      const walking = moved > 0.02 || me.state === 'walk';
      c.still = walking ? 0 : c.still + dt;
      // 걸으면 등불 둘레가 넓어지고, 1초 넘게 멈추면 어둠이 좁혀 옴
      c.k = Math.max(0.1, Math.min(1, c.k + (walking ? -0.35 : c.still > 1 ? 0.22 : 0) * dt));
      sky.darkness(c.k);
      if (c.k > 0.45 && now - c.said > 3500 && c.lines.length) { c.said = now; whisper(c.lines[c.li++ % c.lines.length]); }
      else if (c.k < 0.3 && now - c.said > 2500) whisper('');
      if (c.k > 0.8 && !c.hinted) { c.hinted = true; toast('기도(X)하면 바닥에 빛 길이 보여요', 4); }
      if (praying() && !c.lit) { c.lit = true; lightPath(c.to); }
      if (Math.hypot(me.x - c.to.x, me.z - c.to.z) < c.r) { const f = c.then; end(); won.add('light'); f?.(); }
      return;
    }
    if (c.kind === 'against') {
      const p = typeof c.to === 'function' ? c.to() : c.to;
      const moved = Math.hypot(me.x - c.at.x, me.z - c.at.z); c.at = { x: me.x, z: me.z };
      c.still = moved > 0.02 || me.state === 'walk' ? 0 : c.still + dt;
      if (c.still > 1 && push && c.away) { const a = typeof c.away === 'function' ? c.away() : c.away, dx = a.x - me.x, dz = a.z - me.z, L = Math.hypot(dx, dz) || 1; push((dx / L) * 0.9 * dt, (dz / L) * 0.9 * dt); }
      if (now - c.said > 3800 && c.lines.length) { c.said = now; whisper(c.lines[c.li++ % c.lines.length]); }
      if (Math.hypot(me.x - p.x, me.z - p.z) < c.r) { const f = c.then; end(); won.add('against'); sfx('orb', 0.25, 1.2); burst(me.x, me.y + 1.4, me.z); f?.(); }
      return;
    }
    if (c.kind === 'onward') {
      const p = typeof c.to === 'function' ? c.to() : c.to, d = Math.hypot(me.x - p.x, me.z - p.z);
      if (d < c.best) c.best = d;
      if (!c.warned && d > c.best + c.back) { c.warned = true; toast(c.turn || '말씀을 믿고 가던 길로 다시 가요', 4); whisper(c.lines[0] || ''); sfx('impact/impactSoft_medium_000', 0.16, 0.8); }
      else if (c.warned && d < c.best + 2) c.warned = false;
      c.wt += dt;
      if (c.wt > 5 && c.lines.length) { c.wt = 0; whisper(c.lines[++c.li % c.lines.length]); }
      if (d < c.r) { const f = c.then; end(); won.add('onward'); sfx('orb', 0.25, 1.2); burst(me.x, me.y + 1.4, me.z); f?.(); }
      return;
    }
    if (c.kind === 'stay') {
      if (c.ok()) { c.t += dt; c.broke = false; }
      else if (c.t > 0 && !c.broke) { c.broke = true; c.t = 0; toast('다시 그 자리에 머물러요. 처음부터 세어요', 3); }
      c.wt += dt;
      if (c.wt > 4 && c.lines.length) { c.wt = 0; whisper(c.lines[++c.li % c.lines.length]); }
      if (c.t >= c.sec) { const f = c.then; end(); won.add('stay'); sfx('orb', 0.25, 1.2); burst(me.x, me.y + 1.4, me.z); f?.(); }
    }
  }
  return {
    answer, drop: dropIt, pick, clear, light, stay, against, onward, step, end,
    won: (k) => won.has(k), reset: () => { won.clear(); end(); fog?.(0); },
    active: () => !!cur,
    progress: () => (cur && cur.kind === 'stay' ? `${cur.label} ${Math.min(cur.sec, Math.floor(cur.t))}/${cur.sec}초` : ''),
  };
}
