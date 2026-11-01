// 전체 지도: 카페·정원·숲속 코스와 내 위치(화살표), 함께 있는 사람들
// 찾은 코스는 길과 정거장(지나온 곳은 채운 점)까지 보이고, 아직 못 찾은 코스는 입구만 반짝임
// 지도를 누르면 그곳으로 걸어감
import { TRAILS, PARK, R_HALL, R_WALK, R_PARK, R_GARDEN, BRIDGE, FLOWER_BEDS, TERRAIN, JONAH_SEA, CITY, Q, GATE } from './layout.js';
import { COURSE_META, COURSE_STATIONS as STN, foundCourses } from './courses.js';
import { nearestFree, findPath } from './nav.js';

export function initMap({ me, people, walkTo, say, icon, placesEl, before }) {
  const btn = document.createElement('button');
  btn.className = 'place';
  btn.setAttribute('aria-label', 'map');
  btn.innerHTML = icon;
  placesEl.insertBefore(btn, before || null);

  const wrap = document.createElement('div');
  wrap.id = 'map';
  wrap.hidden = true;
  const cv = document.createElement('canvas');
  const close = document.createElement('button');
  close.className = 'close'; close.setAttribute('aria-label', 'close'); close.textContent = '×';
  wrap.append(cv, close);
  document.body.appendChild(wrap);
  const g = cv.getContext('2d');

  // 보기: 가운데(cx, cz)와 1m당 화면 점 수(k)
  const V = { cx: 0, cz: 0, k: 1 };
  let raf = 0, dpr = 1, W = 0, Hh = 0;
  const fit = () => {
    const found = foundCourses();
    let R = R_GARDEN + 6;
    for (const id of Object.keys(found)) { const t = TRAILS[id]; if (t) for (const q of t.samples) R = Math.max(R, Math.hypot(q.x, q.z) + 10); }
    V.cx = 0; V.cz = 0; V.k = Math.min(W, Hh) / (2 * R) * 0.96;
  };
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    // 화면 눕히기(body를 90도 돌림)에서도 맞도록 돌리기 전 크기를 씀
    W = wrap.clientWidth; Hh = wrap.clientHeight;
    cv.width = W * dpr; cv.height = Hh * dpr;
    cv.style.width = W + 'px'; cv.style.height = Hh + 'px';
  };
  const sx = (x) => W / 2 + (x - V.cx) * V.k, sy = (z) => Hh / 2 + (z - V.cz) * V.k;
  const wx = (px) => V.cx + (px - W / 2) / V.k, wz = (py) => V.cz + (py - Hh / 2) / V.k;
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  const circle = (x, z, r, fill, stroke, lw = 1, minPx = 0.5) => {
    g.beginPath(); g.arc(sx(x), sy(z), Math.max(minPx, r * V.k), 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  };
  const line = (pts, color, w, dash) => {
    g.beginPath();
    pts.forEach((q, i) => (i ? g.lineTo(sx(q.x), sy(q.z)) : g.moveTo(sx(q.x), sy(q.z))));
    g.strokeStyle = color; g.lineWidth = w; g.setLineDash(dash || []); g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.setLineDash([]);
  };

  // 땅 높낮이 그림: 높을수록 밝은 갈색·흰색, 해가 왼쪽 위에서 비추는 음영, 모래는 노랗게 (한 번만 그려 둠)
  const relief = (() => {
    const T = TERRAIN, S = 2, M = Math.floor((T.n - 1) / S) + 1;
    const c = document.createElement('canvas'); c.width = M; c.height = M;
    const cx = c.getContext('2d'), img = cx.createImageData(M, M), d = img.data;
    const h = (a, b) => T.h[Math.min(T.n - 1, b * S) * T.n + Math.min(T.n - 1, a * S)];
    for (let b = 0; b < M; b++) for (let a = 0; a < M; a++) {
      const H = h(a, b), sand = T.sand[Math.min(T.n - 1, b * S) * T.n + Math.min(T.n - 1, a * S)], o = (b * M + a) * 4;
      if (H < 0.05 && !sand) { d[o + 3] = 0; continue; }
      const shade = Math.max(-1, Math.min(1, ((h(a - 1, b - 1) || 0) - (h(a + 1, b + 1) || 0)) * 0.35));
      let r, gg, bl;
      if (sand) { r = 226; gg = 201; bl = 143; }
      else { const k = Math.min(1, H / 22); r = 70 + 120 * k; gg = 110 + 70 * k; bl = 72 + 110 * k; }
      d[o] = r + shade * 40; d[o + 1] = gg + shade * 40; d[o + 2] = bl + shade * 40; d[o + 3] = sand ? 220 : Math.min(235, 60 + H * 40);
    }
    cx.putImageData(img, 0, 0);
    return { c, x0: -T.half, size: (M - 1) * S * T.cell };
  })();
  const KOR = { sower: '씨 뿌리는 밭', mustard: '겨자씨', vine: '포도나무', fold: '잃은 양', well: '우물', pool: '수영장', camp: '캠핑', bbq: '바비큐', ark: '노아의 방주', soccer: '축구장', basket: '농구장', tennis: '테니스장', badminton: '배드민턴장', pingpong: '탁구', meadow: '푸른 초장', jericho: '여리고 성', david: '다윗과 골리앗', jonah: '요나의 바다', market: '간식 가게' };
  const label = (text, x, z, { size = 12, color = '#fff6e0', weight = 600, dy = 0 } = {}) => {
    g.font = `${weight} ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = /^#[0-6]/.test(color) ? 'rgba(255,250,235,0.7)' : 'rgba(0,0,0,0.6)'; g.strokeText(text, sx(x), sy(z) + dy);
    g.fillStyle = color; g.fillText(text, sx(x), sy(z) + dy);
  };
  function draw(t) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#1d2a22'; g.fillRect(0, 0, W, Hh);
    const found = foundCourses();
    // 숲 (어둑한 초록) 과 정원
    circle(0, 0, 298, '#243b2b');
    circle(0, 0, R_GARDEN, '#3f6b45');
    circle(0, 0, R_PARK, null, 'rgba(230,220,190,0.55)', Math.max(1.5, 2.2 * V.k));
    circle(0, 0, R_WALK, null, 'rgba(230,220,190,0.45)', Math.max(1, 1.8 * V.k));
    // 숲속 높낮이 (산·골짜기·사막)
    g.imageSmoothingEnabled = true;
    g.drawImage(relief.c, sx(relief.x0), sy(relief.x0), relief.size * V.k, relief.size * V.k);
    // 요나의 바다
    {
      const Z = PARK.jonah, S = JONAH_SEA; g.beginPath();
      for (let v = S.v0; v <= S.v1; v += 0.5) { const p = Z.at(S.shore(v), v); v === S.v0 ? g.moveTo(sx(p.x), sy(p.z)) : g.lineTo(sx(p.x), sy(p.z)); }
      for (const [u, v] of [[S.u1 - 1, S.v1], [S.u1, S.v1 - 1], [S.u1, S.v0 + 1], [S.u1 - 1, S.v0]]) { const p = Z.at(u, v); g.lineTo(sx(p.x), sy(p.z)); }
      g.closePath(); g.fillStyle = '#3a8fb5'; g.fill();
    }
    // 입구 길
    line([{ x: 0, z: R_HALL }, { x: 0, z: R_GARDEN }], 'rgba(220,215,200,0.6)', Math.max(1.5, 3 * V.k));
    // 꽃밭
    for (const f of FLOWER_BEDS) circle(f.x, f.z, f.r, '#c98aa8');
    // 구역 (놀이·이야기 체험)
    for (const zn of Object.values(PARK)) {
      g.save(); g.translate(sx(zn.x), sy(zn.z)); g.rotate(Math.atan2(zn.n.z, zn.n.x));
      g.fillStyle = 'rgba(240,230,200,0.28)'; g.strokeStyle = 'rgba(255,245,215,0.45)'; g.lineWidth = 1;
      g.beginPath(); g.roundRect(-zn.d / 2 * V.k, -zn.w / 2 * V.k, zn.d * V.k, zn.w * V.k, 3); g.fill(); g.stroke();
      g.restore();
    }
    // 카페
    circle(0, 0, R_HALL, '#d9c7a2', 'rgba(255,255,255,0.8)', 1.5);
    circle(0, 0, R_HALL * 0.8, '#8fc4d8');
    circle(0, 0, 5, '#fff6dc');
    // 이름: 정원 구역, 카페 네 구역 (가까이 볼수록 더 많이)
    const fz = Math.max(10, Math.min(14, 2.6 * V.k + 6));
    if (V.k > 1.1) for (const [id, zn] of Object.entries(PARK)) label(KOR[id] || id, zn.x, zn.z, { size: fz - 1, color: '#fff1cf' });
    if (V.k > 1.6) {
      for (const [id, nm] of [['prayer', '기도'], ['fellow', '교제'], ['witness', '증거'], ['word', '말씀']]) label(nm, Q[id].x, Q[id].z, { size: fz, color: '#3a2a18', weight: 700 });
      label('그리스도', 0, 0, { size: fz - 1, color: '#6b4a1a', weight: 700 });
      label('좁은 문', 0, GATE.r, { size: fz - 1, dy: -10 });
    }
    label('Wheel Life Cafe', 0, -R_HALL - 4, { size: Math.max(11, fz), color: '#fff6dc', weight: 700 });
    // 숲속 코스
    for (const [id, tr] of Object.entries(TRAILS)) {
      const meta = COURSE_META[id]; if (!meta) continue;
      const seen = found[id];
      const col = hex(meta.color);
      if (!seen) {
        if (tr.from) continue; // 갈림길은 큰 길을 찾아야 보임
        // 입구만 반짝임
        const p = tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 2) || tr.samples[0];
        const a = 0.45 + 0.35 * Math.sin(t * 3 + id.length);
        circle(p.x, p.z, 2.2, `rgba(255,240,200,${a})`, null, 1, 7);
        circle(p.x, p.z, 1.2, col, null, 1, 3.5);
        label(meta.name, p.x, p.z, { size: 11, color: col, dy: -14 });
        continue;
      }
      line(tr.samples, 'rgba(0,0,0,0.35)', Math.max(3, 3.4 * V.k));
      line(tr.samples, col, Math.max(2, 2.2 * V.k));
      if (id === 'bridge') { // 낭떠러지와 다리
        const B = BRIDGE, c = [B.at(-B.U, -B.gap), B.at(B.U, -B.gap), B.at(B.U, B.gap), B.at(-B.U, B.gap)];
        g.beginPath(); c.forEach((q, i) => (i ? g.lineTo(sx(q.x), sy(q.z)) : g.moveTo(sx(q.x), sy(q.z)))); g.closePath();
        g.fillStyle = '#0a0808'; g.fill();
        if (B.open) line([B.at(0, -B.gap - 1), B.at(0, B.gap + 1)], '#f4e3b0', Math.max(2, 2.4 * V.k));
      }
      tr.stations.forEach((st, i) => {
        const done = seen.includes(i), end = i === tr.stations.length - 1;
        const r = end ? 2.6 : 1.5;
        circle(st.x, st.z, r + 0.6, 'rgba(0,0,0,0.4)', null, 1, end ? 6 : 4.5);
        circle(st.x, st.z, r, done ? col : '#1d2a22', col, 1.5, end ? 4.5 : 3);
        if (V.k > 2.2 && done && STN[id]) label(STN[id][i], st.x, st.z, { size: 11, color: '#fff6e0', weight: 500, dy: -12 });
      });
      // 이름 (지나온 길의 끝에)
      const e = tr.end, ly = Math.max(16, sy(e.z) - 4 * V.k - 6), fs = Math.max(11, Math.min(15, 4 * V.k));
      g.font = `600 ${fs}px system-ui, sans-serif`; g.textAlign = 'center';
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.strokeText(meta.name, sx(e.x), ly);
      g.fillStyle = col; g.fillText(meta.name, sx(e.x), ly);
    }
    if (found.pilgrim) { circle(CITY.x, CITY.z, (CITY.r0 + CITY.r1) / 2, null, '#f6f0e2', Math.max(2, 1.2 * V.k)); if (V.k > 1.4) label('시온산', CITY.x, CITY.z, { size: 11, color: '#fff', dy: 16 }); }
    if (found.sinai && TERRAIN.sinai) label('시내산', TERRAIN.sinai.x, TERRAIN.sinai.z, { size: 11, color: '#e8d8c0' });
    // 함께 있는 사람들
    for (const p of people()) circle(p.x, p.z, 1.1, '#ffd36b', '#4a3a10', 1, 4);
    // 나: 바라보는 쪽으로 화살표 + 숨 쉬는 빛
    const px = sx(me.x), py = sy(me.z);
    g.beginPath(); g.arc(px, py, 10 + 4 * Math.sin(t * 4), 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
    g.save(); g.translate(px, py); g.rotate(-me.face + Math.PI);
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath();
    g.fillStyle = '#ff6a5a'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.fill(); g.stroke();
    g.restore();
  }
  // 갈 수 없는 곳을 눌렀을 때 그 자리에 잠깐 떴다 사라지는 ✕
  const drawNope = (t) => {
    if (!nope) return;
    const a = 1 - (t - nope.t) / 1.6;
    if (a <= 0) { nope = null; return; }
    const X = sx(nope.x), Y = sy(nope.z), r = 9 + (1 - a) * 4;
    g.save(); g.globalAlpha = a; g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(X - r, Y - r); g.lineTo(X + r, Y + r); g.moveTo(X + r, Y - r); g.lineTo(X - r, Y + r); g.stroke();
    g.strokeStyle = '#ff7a6a'; g.lineWidth = 3.5; g.stroke();
    g.restore();
  };
  const loop = (now) => { draw(now / 1000); drawNope(now / 1000); raf = requestAnimationFrame(loop); };

  function open() {
    wrap.hidden = false; resize(); fit();
    // 내가 보이도록 (멀리 있으면 나를 가운데로)
    if (Math.abs(sx(me.x) - W / 2) > W / 2 - 30 || Math.abs(sy(me.z) - Hh / 2) > Hh / 2 - 30) { V.cx = me.x; V.cz = me.z; }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function shut() { wrap.hidden = true; cancelAnimationFrame(raf); }
  btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); wrap.hidden ? open() : shut(); });
  close.addEventListener('pointerdown', (e) => { e.stopPropagation(); shut(); });
  window.addEventListener('resize', () => { if (!wrap.hidden) resize(); });

  // 끌어서 옮기기, 두 손가락·휠로 확대, 짧게 누르면 그곳으로 걸어가기
  const pts = new Map();
  let moved = 0, pinch = null, nope = null;
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: V.k }; } });
  cv.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.offsetX - p.x, dy = e.offsetY - p.y;
    p.x = e.offsetX; p.y = e.offsetY;
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; V.k = Math.max(0.5, Math.min(14, pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); moved += 99; return; }
    moved += Math.abs(dx) + Math.abs(dy);
    V.cx -= dx / V.k; V.cz -= dy / V.k;
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (moved < 8 && pts.size === 0) {
      let p = { x: wx(e.offsetX), z: wz(e.offsetY) };
      // 숲속 코스 입구 근처를 누르면 시작 문(아치) 바로 앞, 정원 쪽 길 위로
      const snap = Math.max(7, 26 / V.k);
      for (const tr of Object.values(TRAILS)) {
        if (tr.from) continue;
        const gate = tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 2.2) || tr.samples[0];
        if (Math.hypot(p.x - gate.x, p.z - gate.z) < snap) { p = tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 0.6) || tr.samples[0]; break; }
      }
      const q = nearestFree(p);
      const path = q ? findPath(me, q) : [];
      if (q && (path.length || Math.hypot(q.x - me.x, q.z - me.z) < 1)) { walkTo(me, q, null, path); shut(); }
      else { nope = { x: p.x, z: p.z, t: performance.now() / 1000 }; say?.('그곳은 걸어서 갈 수 없어요', 2); }
    }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => pts.delete(e.pointerId));
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const x = wx(e.offsetX), z = wz(e.offsetY);
    V.k = Math.max(0.5, Math.min(14, V.k * Math.exp(-e.deltaY * 0.0015)));
    V.cx = x - (e.offsetX - W / 2) / V.k; V.cz = z - (e.offsetY - Hh / 2) / V.k;
  }, { passive: false });
  return { open, shut, el: wrap, toScreen: (x, z) => ({ x: sx(x), y: sy(z) }) }; // toScreen: 시험용
}
