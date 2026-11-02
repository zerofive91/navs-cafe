// 계정으로 이어 하기 (2026-11): 아이디 + 비밀번호로 들어오면 어느 기기에서든 같은 캐릭터로 이어 함
// 혼자·다같이·모임 어느 문으로 들어가도 같은 계정의 데이터를 씀
// 서버: Supabase 함수 account_signup / account_login / account_load / account_save / account_logout
//   (supabase/accounts.sql). 표는 직접 읽을 수 없고 함수로만, 비밀번호는 bcrypt로만 저장
// 기기 안에는 아이디와 들어올 때 받은 토큰만 둠 (비밀번호는 두지 않음)
// 한 계정은 한 번에 한 기기에서만: 카페에 들어갈 때 계정 채널(Realtime Presence)에 이름을 올리고,
//   나중에 들어온 기기가 있으면 먼저 있던 기기는 멈춤(저장도 멈춤). '여기서 이어 하기'를 누르면 다시 가져옴
import { loadLib } from './together.js';
const SUPABASE_URL = 'https://esbhbhjnpupcrjwbnwet.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BJB1Jth8sAEJllf9nnvA3A_iHQB5-Sz'; // 공개용(publishable) 키
const ACC = 'navs-cafe-account';
const KEYS = { profile: 'navs-cafe-profile', look: 'navs-cafe-look3d', found: 'navs-cafe-found', seeds: 'navs-cafe-seeds' };
const MSG = {
  taken: '이미 있는 아이디예요. 다른 아이디를 써 주세요.',
  wrong: '비밀번호가 맞지 않아요.',
  nouser: '없는 아이디예요. 처음이면 "새로 만들기"를 눌러 주세요.',
  locked: '여러 번 틀려서 5분 동안 잠겼어요. 잠시 뒤에 다시 해 주세요.',
  pass: '비밀번호는 4자 이상으로 해 주세요.',
  id: '아이디는 2~16자로 해 주세요.',
  net: '지금은 연결하지 못했어요. 잠시 뒤에 다시 해 주세요.',
  missing: '계정 기능을 준비하고 있어요. 조금만 기다려 주세요.',
  token: '다시 들어와 주세요.',
};

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 안 됨 */ } };

async function rpc(name, args, keepalive = false) {
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', keepalive, headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  } catch (e) { return { error: 'net' }; }
  if (r.status === 404) return { error: 'missing' };
  if (!r.ok) return { error: 'net' };
  try { return await r.json(); } catch (e) { return { error: 'net' }; }
}

// 이 기기에 있는 것 모두 (캐릭터·모습·찾은 코스·심은 씨)
const snapshot = () => ({ v: 1, profile: read(KEYS.profile), look: read(KEYS.look), found: read(KEYS.found), seeds: read(KEYS.seeds) });

// 두 기기의 기록을 합침: 걸음·능력치는 큰 쪽, 받은 것·마친 것은 모두
function mergeProfile(a, b) {
  if (!a) return b; if (!b) return a;
  const obj = (x, y) => ({ ...(x || {}), ...(y || {}) });
  const stats = { ...(a.stats || {}) };
  for (const [k, v] of Object.entries(b.stats || {})) stats[k] = Math.max(stats[k] | 0, v | 0);
  const m = {
    ...a, ...b,
    name: b.name || a.name,
    steps: Math.max(a.steps | 0, b.steps | 0),
    items: [...new Set([...(b.items || []), ...(a.items || [])])],
    stats,
    gear: { owned: [...new Set([...(a.gear?.owned || []), ...(b.gear?.owned || [])])], worn: b.gear?.worn || a.gear?.worn || [] },
    pets: Object.fromEntries([...new Set([...Object.keys(a.pets || {}), ...Object.keys(b.pets || {})])].map((k) => [k, Math.max(a.pets?.[k] | 0, b.pets?.[k] | 0)])),
    story: Math.max(a.story | 0, b.story | 0),
    tut: obj(a.tut, b.tut), train: obj(a.train, b.train), quests: obj(a.quests, b.quests), dungeon: obj(a.dungeon, b.dungeon),
    warfare: Object.fromEntries([...new Set([...Object.keys(a.warfare || {}), ...Object.keys(b.warfare || {})])].map((k) => [k, Math.max(a.warfare?.[k] | 0, b.warfare?.[k] | 0)])),
    since: [a.since, b.since].filter(Boolean).sort()[0] || null,
    // 지갑과 소모품은 더하거나 큰 쪽을 고르면 쓴 돈이 되살아나므로, 마지막으로 바뀐 쪽을 그대로 씀
    ...((b.walletAt | 0) >= (a.walletAt | 0) ? { coins: b.coins ?? a.coins ?? null, bag: b.bag || {}, sold: b.sold || [], walletAt: b.walletAt | 0 } : { coins: a.coins ?? null, bag: a.bag || {}, sold: a.sold || [], walletAt: a.walletAt | 0 }),
  };
  m.items = m.items.filter((id) => !m.sold.includes(id)); // 판 물품은 다른 기기 기록에서 되살아나지 않음
  return m;
}
function merge(local, server) {
  if (!server || !server.profile) return local;
  const found = { ...(local.found || {}) };
  for (const [k, v] of Object.entries(server.found || {})) found[k] = [...new Set([...(found[k] || []), ...v])];
  const seeds = [...(server.seeds || [])];
  for (const s of local.seeds || []) if (!seeds.some((q) => Math.abs(q.x - s.x) < 0.3 && Math.abs(q.z - s.z) < 0.3)) seeds.push(s);
  return { v: 1, profile: mergeProfile(local.profile, server.profile), look: server.look || local.look, found, seeds };
}

export function initAccount({ apply, toast, kicked }) {
  let acc = read(ACC); // { id, token }
  let pushT = null, busy = false, away = false; // away: 다른 기기로 넘어감

  // 서버 것과 합쳐 이 기기에 쓰고, 지금 장면에도 바로 반영
  function take(server) {
    const m = merge(snapshot(), server);
    for (const [k, key] of Object.entries(KEYS)) if (m[k] != null) write(key, m[k]);
    apply?.(m);
    return m;
  }
  async function push(keepalive = false) {
    clearTimeout(pushT); pushT = null;
    if (!acc || away) return;
    const r = await rpc('account_save', { p_id: acc.id, p_token: acc.token, p_data: snapshot() }, keepalive);
    if (r.error === 'token') { acc = null; write(ACC, null); toast?.('계정에서 나와졌어요. 다시 들어와 주세요.', 5); render(); }
  }
  const schedule = () => { if (acc && !away) { clearTimeout(pushT); pushT = setTimeout(push, 2500); } };
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pushT) push(true); });
  addEventListener('pagehide', () => { if (pushT) push(true); });

  // 처음 열 때: 계정이 있으면 서버 것을 받아 합침 (들어가기 단추는 이것을 잠깐 기다림)
  const ready = (async () => {
    if (!acc) return;
    const r = await rpc('account_load', { p_id: acc.id, p_token: acc.token });
    if (r.error === 'token') { acc = null; write(ACC, null); return; }
    if (r.error) return;
    take(r.data); schedule();
  })();

  // ---------- 한 번에 한 기기 ----------
  const devId = Math.random().toString(36).slice(2, 10);
  let rt = null, chan = null, entered = false; // entered: 카페에 들어간 뒤
  async function leaveChan() { if (chan) { const c = chan; chan = null; try { await rt.removeChannel(c); } catch (e) { /* 무시 */ } } }
  async function claim() {
    entered = true;
    if (!acc) return;
    try {
      const lib = await loadLib();
      rt = rt || lib.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 2 } } });
    } catch (e) { return; } // 연결 못 하면 그냥 둠
    await leaveChan();
    const at = Date.now(), id = acc.id;
    const ch = rt.channel('wlc-acct-' + id, { config: { presence: { key: devId } } });
    chan = ch;
    ch.on('presence', { event: 'sync' }, () => {
      if (chan !== ch || away) return;
      const newer = Object.entries(ch.presenceState()).some(([k, v]) => k !== devId && v[0] && v[0].at > at);
      if (!newer) return;
      away = true; clearTimeout(pushT); pushT = null;
      leaveChan();
      kicked?.();
    });
    ch.subscribe((status) => { if (status === 'SUBSCRIBED') ch.track({ at }); });
  }

  // ---------- 창 ----------
  const box = document.createElement('div');
  box.id = 'acct'; box.hidden = true;
  document.body.appendChild(box);
  function render(msg = '') {
    if (acc) {
      box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button><h3>계정</h3>
        <p class="who"><b>${esc(acc.id)}</b> 계정으로 들어와 있어요</p>
        <p class="sub">다른 기기에서도 같은 아이디와 비밀번호로 들어오면 그대로 이어 해요. 혼자·다같이·모임 어디로 들어가도 같은 캐릭터예요.</p>
        <p class="msg">${msg}</p>
        <div class="row"><button data-do="out">나가기(로그아웃)</button><button class="go" data-do="close">확인</button></div></div>`;
    } else {
      box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button><h3>계정으로 이어 하기</h3>
        <p class="sub">아이디와 비밀번호를 정해 두면 다른 기기에서도 같은 캐릭터로 이어 할 수 있어요.</p>
        <label><span>아이디</span><input name="id" maxlength="16" autocomplete="username" spellcheck="false" placeholder="2~16자"></label>
        <label><span>비밀번호</span><input name="pass" type="password" maxlength="40" autocomplete="current-password" placeholder="4자 이상"></label>
        <p class="msg">${msg}</p>
        <div class="row"><button data-do="new">새로 만들기</button><button class="go" data-do="in">들어오기</button></div></div>`;
    }
    for (const i of box.querySelectorAll('input')) { i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') act('in'); }); i.addEventListener('keyup', (e) => e.stopPropagation()); }
    if (chip) chip.textContent = acc ? `👤 ${acc.id}` : '계정으로 이어 하기';
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  box.addEventListener('pointerdown', (e) => e.stopPropagation());
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.classList.contains('close')) return close();
    const d = e.target.closest('[data-do]'); if (d) act(d.dataset.do);
  });
  const val = (n) => (box.querySelector(`input[name="${n}"]`)?.value || '').trim();
  async function act(what) {
    if (busy) return;
    if (what === 'close') return close();
    if (what === 'out') {
      if (pushT) await push();
      if (acc) rpc('account_logout', { p_id: acc.id, p_token: acc.token });
      leaveChan();
      acc = null; write(ACC, null); render('나왔어요. 이 기기의 기록은 그대로 남아 있어요.'); return;
    }
    const id = val('id').toLowerCase(), pass = val('pass');
    if (id.length < 2 || id.length > 16) return render(MSG.id);
    if (pass.length < 4) return render(MSG.pass);
    busy = true; box.querySelector('.msg').textContent = '잠깐만요...';
    const r = what === 'new'
      ? await rpc('account_signup', { p_id: id, p_pass: pass, p_data: snapshot() })
      : await rpc('account_login', { p_id: id, p_pass: pass });
    busy = false;
    if (r.error) { render(MSG[r.error] || MSG.net); const i = box.querySelector('input[name="id"]'); if (i) i.value = id; return; }
    acc = { id, token: r.token }; write(ACC, acc);
    if (what === 'in') { take(r.data); push(); }
    if (entered) claim(); // 카페 안에서 들어왔으면 이 기기가 이 계정을 맡음
    render(what === 'new' ? '계정을 만들었어요! 이제 다른 기기에서도 이 아이디로 들어오면 이어 해요.' : '들어왔어요. 이 계정의 캐릭터로 이어 해요.');
  }
  function open() { render(); box.hidden = false; setTimeout(() => box.querySelector('input')?.focus(), 50); }
  function close() { box.hidden = true; }

  // 입구 화면의 작은 단추
  const enter = document.getElementById('enter');
  let chip = null;
  if (enter) {
    chip = document.createElement('button');
    chip.className = 'acct';
    chip.addEventListener('click', (e) => { e.stopPropagation(); open(); });
    enter.appendChild(chip);
  }
  render();

  return { ready, open, schedule, claim, get away() { return away; }, get id() { return acc ? acc.id : null; } };
}
