// 함께 있기 (Supabase Realtime)
// 세 가지 모드:
//   solo   — 혼자. 서버에 연결하지 않음.
//   random — 랜덤으로 함께. 한 카페에 최대 RANDOM_CAP명, 넘으면 다음 카페(2호점, 3호점 …)로.
//   invite — 초대 링크(?c=코드)를 받은 사람끼리만 같은 카페. 최대 INVITE_CAP명.
//
// 무료 플랜 한도(초당 메시지 100개, 한 달 200만 개)를 아끼려고
// 위치는 매 프레임 보내지 않고, 걷는 동안에만 몇 초에 한 번, 동작이 바뀔 때만 보냄.
// 받는 쪽은 마지막 위치와 속도로 부드럽게 이어서 움직여 보여 줌.

import { setOutfit } from './avatar.js';

const SUPABASE_URL = 'https://esbhbhjnpupcrjwbnwet.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BJB1Jth8sAEJllf9nnvA3A_iHQB5-Sz'; // 공개용(publishable) 키
export const RANDOM_CAP = 10;
export const INVITE_CAP = 10;
const MAX_CAFES = 30;

let libPromise = null;
function loadLib() {
  if (window.supabase) return Promise.resolve(window.supabase);
  if (!libPromise) {
    libPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'vendor/supabase.js';
      s.onload = () => res(window.supabase);
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

const rid = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

export function inviteCodeFromUrl() {
  const c = new URLSearchParams(location.search).get('c');
  return c && /^[a-z0-9]{4,16}$/.test(c) ? c : null;
}
export function newInviteCode() { return rid(8); }
export function inviteLink(code) { return location.origin + location.pathname + '?c=' + code; }

export function initTogether({ scene, me, look, makeChar, poseAvatar, upgradeCup }) {
  const myId = rid(10);
  const people = new Map(); // id -> 원격 캐릭터
  let client = null, channel = null;
  const st = { mode: 'solo', room: null, code: null, count: 1, onChange: () => {} };

  // ---------- 원격 캐릭터 ----------
  function addPerson(id, lk) {
    if (people.has(id)) return people.get(id);
    const ch = makeChar(lk || {}, 0, 0);
    ch.remote = true;
    ch.av.visible = false; // 첫 위치를 받기 전에는 숨김
    ch.net = null;
    upgradeCup(ch.av);
    people.set(id, ch);
    return ch;
  }
  function removePerson(id) {
    const ch = people.get(id);
    if (!ch) return;
    scene.remove(ch.av);
    people.delete(id);
  }
  // 받은 위치를 그대로 따라가면 띄엄띄엄 끊겨 보이므로, 조금(보내는 주기만큼) 늦게 지나온 점들 사이를 이어서 보여 줌
  function applyState(id, m) {
    const ch = people.get(id) || addPerson(id, m.look);
    const now = Date.now();
    const ts = m.ts || now;
    ch.off = Math.min(ch.off === undefined ? Infinity : ch.off + 0.02, now - ts); // 서로 다른 시계의 차이 (가장 빨리 온 것 기준)
    ch.buf = ch.buf || [];
    if (ch.buf.length && ts <= ch.buf[ch.buf.length - 1].ts) ch.buf.length = 0; // 순서가 뒤바뀌면 새로 시작
    ch.buf.push({ ts, x: m.x, z: m.z, y: m.y });
    if (ch.buf.length > 10) ch.buf.shift();
    ch.net = { ...m, period: m.p || 1 };
    if (!ch.av.visible) { ch.x = m.x; ch.z = m.z; ch.y = m.y; ch.av.rotation.y = m.f; ch.av.visible = true; }
    if (m.o !== undefined && m.o !== ch.outfitKey) { ch.outfitKey = m.o; setOutfit(ch.av, m.o === 'glory' ? 'glory' : m.o ? 'armor' : null, m.o && m.o !== 'glory' ? m.o.split(',') : undefined); }
  }
  function sampleBuf(ch) {
    const B = ch.buf, n = ch.net;
    if (!B || !B.length) return null;
    const delay = Math.min(1600, n.period * 1150 + 150);
    const rt = Date.now() - (ch.off || 0) - delay;
    if (rt <= B[0].ts) return B[0];
    for (let i = 1; i < B.length; i++) if (rt <= B[i].ts) {
      const a = B[i - 1], b = B[i], k = (rt - a.ts) / Math.max(1, b.ts - a.ts);
      return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, y: a.y + (b.y - a.y) * k, moving: true };
    }
    return B[B.length - 1];
  }
  function step(dt, t) {
    for (const ch of people.values()) {
      const n = ch.net;
      if (!n) continue;
      const q = sampleBuf(ch);
      const k = 1 - Math.exp(-dt * 14);
      const dx = q.x - ch.x, dz = q.z - ch.z;
      if (Math.hypot(dx, dz) > 12) { ch.x = q.x; ch.z = q.z; } else { ch.x += dx * k; ch.z += dz * k; }
      ch.y += (q.y - ch.y) * Math.min(1, dt * 12);
      const sp = Math.hypot(dx, dz) / Math.max(dt, 1e-3);
      if (q.moving && Math.hypot(dx, dz) > 0.01) n.f = Math.atan2(dx, dz); // 지나가는 방향을 바라봄
      ch.walkHold = q.moving && sp > 0.15 ? 0.4 : (ch.walkHold || 0) - dt; // 잠깐 멈칫해도 걷는 모습 유지
      ch.walkingNow = ch.walkHold > 0;
      ch.face = n.f;
      ch.state = n.st === 'sit' ? 'sit' : ch.walkingNow || n.st === 'walk' && q.moving ? 'walk' : 'idle';
      ch.running = !!n.run;
      ch.action = n.a || null;
      ch.item = n.i || null;
      ch.drink = n.d || null;
      ch.food = n.fd || null;
      ch.bites = n.b || 0;
      ch.racket = n.r || null;
      ch.swim = !!n.sw;
      ch.seat = n.s ? { kind: n.s, free: true } : null;
      ch.av.position.set(ch.x, ch.y, ch.z);
      let da = ch.face - ch.av.rotation.y;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      ch.av.rotation.y += da * Math.min(1, dt * 10);
      poseAvatar(ch.av, ch, t, dt);
    }
    if (channel) sendStep(dt);
  }

  // ---------- 보내기 ----------
  let sinceSend = 99, lastKey = '', dirty = false;
  function snapshot() {
    const hop = me.hop || 0; // 점프·나무 타기 높이
    return {
      x: +me.x.toFixed(2), z: +me.z.toFixed(2), y: +(me.y + hop + (me.sinkY || 0) + (me.swimY || 0)).toFixed(2), f: +me.face.toFixed(2),
      st: me.state === 'walk' ? 'walk' : me.state === 'sit' ? 'sit' : 'idle',
      run: me.running ? 1 : 0, a: me.action || 0, i: me.item || 0, d: me.drink || 0, fd: me.food || 0, b: me.bites || 0,
      r: me.racket || 0, sw: me.swim ? 1 : 0, s: me.state === 'sit' && me.seat ? me.seat.kind : 0,
      o: outfitCode(), ts: Date.now(),
    };
  }
  const outfitCode = () => { const u = me.av.userData; return u.outfit === 'glory' ? 'glory' : u.outfit ? (u.pieces || []).join(',') || 'armor' : ''; };
  // 사람이 많을수록 천천히 보냄: 2명 0.5초, 4명 0.8초, 10명 2초
  const period = () => Math.max(0.5, 0.2 * st.count);
  function send() {
    const m = snapshot();
    m.p = period();
    m.look = look;
    channel.send({ type: 'broadcast', event: 'm', payload: { id: myId, m } });
    sinceSend = 0;
    lastKey = key(m);
    dirty = false;
  }
  const key = (m) => [m.st, m.run, m.a, m.i, m.d, m.fd, m.b, m.r, m.sw, m.s, m.o].join('|');
  function sendStep(dt) {
    if (st.count < 2) return; // 혼자 있는 방에서는 보내지 않음
    sinceSend += dt;
    const m = snapshot();
    if (key(m) !== lastKey) dirty = true;
    if (dirty && sinceSend > 0.35) return send();
    if (m.st === 'walk' && sinceSend > period()) return send();
  }

  // ---------- 방 들어가기 ----------
  async function tryRoom(name, cap) {
    const at = Date.now(); // 먼저 들어온 순서로 자리를 정함
    const pending = new Map();
    const ch = client.channel(name, { config: { presence: { key: myId }, broadcast: { self: false } } });
    const result = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      ch.on('presence', { event: 'sync' }, () => {
        const ps = ch.presenceState();
        if (!ps[myId]) return;
        if (done) return onPresence(ch);
        const order = Object.entries(ps)
          .map(([k, v]) => ({ k, at: v[0] && v[0].at || 0 }))
          .sort((a, b) => a.at - b.at || (a.k < b.k ? -1 : 1));
        finish(order.findIndex((o) => o.k === myId) < cap ? 'ok' : 'full');
      });
      ch.on('broadcast', { event: 'm' }, ({ payload }) => {
        if (!payload || !payload.id || payload.id === myId) return;
        if (channel === ch) applyState(payload.id, payload.m); else pending.set(payload.id, payload.m);
      });
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') ch.track({ at, look });
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish('error');
      });
      setTimeout(() => finish('error'), 12000);
    });
    if (result !== 'ok') { await client.removeChannel(ch); return result; }
    channel = ch;
    st.room = name;
    onPresence(ch);
    for (const [id, m] of pending) if (ch.presenceState()[id]) applyState(id, m);
    send(); // 이미 있던 사람들에게 내 자리 알림
    return 'ok';
  }
  function onPresence(ch) {
    if (ch !== channel) return;
    const ps = ch.presenceState();
    for (const id of [...people.keys()]) if (!ps[id]) removePerson(id);
    const before = st.count;
    st.count = Object.keys(ps).length;
    for (const [id, v] of Object.entries(ps)) if (id !== myId && !people.has(id)) addPerson(id, v[0] && v[0].look);
    if (st.count > before && channel) send(); // 새로 온 사람에게 내 자리 알림
    st.onChange(st);
  }

  async function start(mode, code) {
    st.mode = mode;
    st.code = code || null;
    if (mode === 'solo') { st.onChange(st); return 'ok'; }
    try {
      const lib = await loadLib();
      client = lib.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 5 } } });
    } catch (e) { st.mode = 'solo'; st.onChange(st); return 'error'; }
    let r = 'error';
    if (mode === 'invite') {
      r = await tryRoom('wlc-inv-' + code, INVITE_CAP);
    } else {
      for (let i = 1; i <= MAX_CAFES; i++) {
        r = await tryRoom('wlc-cafe-' + i, RANDOM_CAP);
        if (r === 'ok') { st.cafe = i; break; }
        if (r === 'error') break;
      }
    }
    if (r !== 'ok') { st.mode = 'solo'; st.onChange(st); }
    return r;
  }

  window.addEventListener('pagehide', () => { if (channel) { channel.untrack(); client.removeChannel(channel); } });

  return { st, start, step, people, applyState }; // applyState: 시험용으로도 씀
}
