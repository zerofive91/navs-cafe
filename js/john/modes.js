// 말씀의 손 선택 모드 (2026-11 요한복음 마을, 기획서 3.1): 공부 · 암송 · 묵상
//   공부: 본문에서 답을 찾는 관찰 질문 하나. 틀리면 그 구절을 다시 보여 줌
//   암송: 핵심 구절 하나를 어절 조각 3~4개로 차례대로 맞추기. 어렵지 않게 '다음 조각 보기'로 도움을 받을 수 있음
//   묵상: 쉼 자리에 앉거나 누워 20초 머물기 + 묵상 질문 한 줄. 마음 한 줄은 이 기기에만 남김 (계정으로 올리지 않음)
import { VERSES } from '../verses.js';
import { bibleMode } from '../bible.js';
import { MODERN } from '../bible-modern.js';

const NOTES = 'navs-cafe-john-notes';
const modernOf = (krv) => (MODERN.find((p) => p[0] === krv) || [])[1] || krv;
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 구절을 n 조각으로 (어절 수가 고르게)
export function pieces(text, n) {
  const w = text.replace(/\s+/g, ' ').trim().split(' ');
  n = Math.max(2, Math.min(n, w.length));
  const out = [];
  for (let i = 0; i < n; i++) out.push(w.slice(Math.round((i * w.length) / n), Math.round(((i + 1) * w.length) / n)).join(' '));
  return out.filter(Boolean);
}

export function initModes({ ui, me, toast, sfx, burst, showVerse, walkTo, nearestFree }) {
  // ---------- 공부 ----------
  function study(ev, done) {
    const S = ev.study, v = VERSES[S.v];
    ui.open({
      who: ev.who, sub: `공부 · ${ev.title}`, text: S.q, note: '본문에서 답을 찾아요',
      opts: S.a.map((t, i) => ({ t, ok: i === S.ok, why: v ? `본문을 다시 봐요: "${v[0]}" (${v[1]})` : '' })),
      onPick(o) {
        if (!o.ok) { sfx('impact/impactSoft_medium_000', 0.16, 0.9); return; }
        sfx('orb', 0.24, 1.2);
        setTimeout(() => { ui.close(); showVerse(S.v, { cooldown: 0, title: '공부' }); done(); }, 900);
      },
    });
  }

  // ---------- 암송 ----------
  function memo(ev, done) {
    const key = ev.memo.v, v = VERSES[key];
    if (!v) return;
    const text = bibleMode() === 'modern' ? modernOf(v[0]) : v[0]; // 지금 고른 번역으로 외움
    const parts = pieces(text, ev.memo.parts || 4);
    const order = parts.map((_, i) => i).sort(() => Math.random() - 0.5);
    if (order.every((x, i) => x === i)) order.reverse(); // 처음부터 맞춰져 있지 않게
    let got = 0, helps = 0;
    const box = document.createElement('div');
    box.className = 'jmemo';
    const render = () => {
      box.innerHTML = `<p class="line">${parts.slice(0, got).map(esc).join(' ')}<span class="blank">${got < parts.length ? ' …' : ''}</span></p>
        <div class="pcs">${order.map((i) => `<button data-i="${i}" ${i < got ? 'disabled' : ''}>${esc(parts[i])}</button>`).join('')}</div>
        <p class="ref">${esc(v[1])}</p>`;
    };
    render();
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const i = +b.dataset.i;
      if (i !== got) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); sfx('tap', 0.12, 0.7); return; }
      got++; sfx('tap', 0.18, 1 + got * 0.1); render();
      if (got >= parts.length) {
        sfx('orb', 0.26, 1.2); burst(me.x, me.y + 1.4, me.z);
        setTimeout(() => { ui.close(); toast(helps ? '말씀을 마음에 새겼어요. 다음엔 도움 없이도 해 봐요' : '말씀을 마음에 새겼어요!', 4); done(); }, 900);
      }
    });
    ui.open({
      who: ev.who, sub: `암송 · ${ev.title}`, text: '말씀 조각을 차례대로 눌러 구절을 이어요.', extra: box,
      buttons: [
        { t: '나중에', cls: 'later', fn: () => ui.close() },
        { t: '다음 조각 보기', cls: 'help', keep: true, fn: () => { helps++; const b = box.querySelector(`button[data-i="${got}"]`); if (b) { b.classList.remove('hint'); void b.offsetWidth; b.classList.add('hint'); } } },
      ],
    });
  }

  // ---------- 묵상 ----------
  let med = null; // { ev, at, sec, t, done }
  function meditate(ev, at, done) {
    const M = ev.med;
    med = { ev, at, sec: M.sec || 20, t: 0, done, lie: !!M.lie };
    ui.open({
      who: ev.who, sub: `묵상 · ${ev.title}`, text: M.q,
      note: `${M.where || '쉼 자리'}에 ${M.lie ? '누워(K)' : '앉아(J)'} ${med.sec}초 머물며 이 질문을 마음에 품어요.`,
      quote: M.v,
      buttons: [
        { t: '그만두기', cls: 'later', fn: () => { med = null; ui.close(); } },
        { t: '그 자리로', cls: 'next', fn: () => { ui.close(); const q = nearestFree(at) || at; walkTo(me, q, () => toast(M.lie ? '누워서(K) 잠시 머물러요' : '앉아서(J) 잠시 머물러요', 3)); } },
      ],
    });
  }
  let last = 0;
  function step() {
    const now = performance.now(), dt = last ? Math.min(0.25, (now - last) / 1000) : 0; last = now;
    if (!med || ui.isOpen()) return;
    const near = Math.hypot(me.x - med.at.x, me.z - med.at.z) < 3.2;
    const resting = me.state === 'sit' && (!med.lie || (me.seat && me.seat.kind === 'lie'));
    if (near && resting) med.t += dt;
    if (med.t >= med.sec) {
      const m = med; med = null;
      sfx('orb', 0.22, 1.1);
      note(m.ev, m.done);
    }
  }
  // 마음 한 줄 (이 기기에만)
  function note(ev, done) {
    const box = document.createElement('div');
    box.className = 'jnote';
    box.innerHTML = '<textarea maxlength="140" rows="2" placeholder="마음에 떠오른 한 줄 (이 기기에만 남아요, 비워 둬도 돼요)"></textarea>';
    const ta = box.querySelector('textarea');
    ta.addEventListener('keydown', (e) => e.stopPropagation()); // 글을 쓰는 동안 단축키가 눌리지 않게
    ta.addEventListener('pointerdown', (e) => e.stopPropagation());
    const save = () => {
      const t = ta.value.trim();
      if (t) { try { const all = JSON.parse(localStorage.getItem(NOTES) || '{}'); (all[ev.id] = all[ev.id] || []).push({ at: Date.now(), t }); localStorage.setItem(NOTES, JSON.stringify(all)); } catch (e) { /* 저장 안 됨 */ } }
      ui.close(); done();
    };
    ui.open({ who: ev.who, sub: `묵상 · ${ev.title}`, text: ev.med.q, extra: box, buttons: [{ t: '마치기', cls: 'next', fn: save }] });
  }
  function notes(id) { try { return (JSON.parse(localStorage.getItem(NOTES) || '{}')[id] || []); } catch (e) { return []; } }
  return {
    study, memo, meditate, step, notes,
    active: () => !!med,
    progress: () => (med ? `묵상 ${Math.min(med.sec, Math.floor(med.t))}/${med.sec}초 · ${med.ev.med.where || ''}` : ''),
    target: () => (med ? med.at : null),
    cancel: () => { med = null; },
  };
}
