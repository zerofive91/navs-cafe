// 길찾기: 카페·정원은 격자 A* (이진 힙) + 직선 펴기, 숲속은 오솔길을 따라감
// (숲길이 길어져도 격자는 정원까지만 만들어 가벼움)
import { R_GARDEN, TRAILS, isFree, pathCost } from './layout.js';

const CELL = 0.35;
const GRID_R = R_GARDEN + 14; // 격자가 덮는 반지름
const HALF = Math.ceil(GRID_R);
const N = Math.ceil((HALF * 2) / CELL);
const free = new Uint8Array(N * N);
const cx = (i) => -HALF + i * CELL + CELL / 2;
const cost = new Uint8Array(N * N); // 칸마다 걷는 값: 길 1, 정원 잔디는 더 비쌈
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const f = isFree(cx(i), cx(j));
  free[j * N + i] = f ? 1 : 0;
  if (f) cost[j * N + i] = pathCost(cx(i), cx(j));
}

const toIdx = (v) => Math.max(0, Math.min(N - 1, Math.floor((v + HALF) / CELL)));
const center = (k) => ({ x: cx(k % N), z: cx(Math.floor(k / N)) });

const inGrid = (p) => Math.hypot(p.x, p.z) < GRID_R - 2;
export function nearestFree(p) {
  if (isFree(p.x, p.z)) return { x: p.x, z: p.z };
  if (!inGrid(p)) { // 숲: 둘레를 돌며 가까운 빈 곳
    for (let r = 0.3; r < 12; r += 0.3) for (let k = 0, n = Math.ceil(r * 6); k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (isFree(x, z)) return { x, z };
    }
    // 숲 깊은 곳을 눌렀으면 가장 가까운 오솔길 위로
    const L = locate(p);
    return L ? { x: L.T.pts[L.i].x, z: L.T.pts[L.i].z } : null;
  }
  const ci = toIdx(p.x), cj = toIdx(p.z);
  for (let r = 1; r < 160; r++) {
    let best = null, bd = Infinity;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= N || j >= N || !free[j * N + i]) continue;
      const q = center(j * N + i);
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d < bd) { bd = d; best = q; }
    }
    if (best) return best;
  }
  return null;
}

const costAt = (x, z) => cost[toIdx(z) * N + toIdx(x)] || 1;
// 두 점 사이 직선이 잔디를 밟는 길이(m)
function grassLen(a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(d / 0.35));
  let g = 0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (costAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t) > 1) g += d / steps;
  }
  return g;
}
export function lineFree(a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(d / 0.15);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (!isFree(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

class Heap {
  constructor() { this.k = []; this.f = []; }
  push(k, f) {
    const K = this.k, F = this.f;
    let i = K.length; K.push(k); F.push(f);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (F[p] <= f) break;
      K[i] = K[p]; F[i] = F[p]; i = p;
    }
    K[i] = k; F[i] = f;
  }
  pop() {
    const K = this.k, F = this.f;
    const top = K[0];
    const lk = K.pop(), lf = F.pop();
    if (K.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i, mf = lf;
        if (l < K.length && F[l] < mf) { m = l; mf = F[l]; }
        if (r < K.length && F[r] < mf) { m = r; mf = F[r]; }
        if (m === i) break;
        K[i] = K[m]; F[i] = F[m]; i = m;
      }
      K[i] = lk; F[i] = lf;
    }
    return top;
  }
  get size() { return this.k.length; }
}

const gScore = new Float32Array(N * N), came = new Int32Array(N * N), seen = new Uint32Array(N * N), shut = new Uint32Array(N * N);
let STAMP = 0;
export function findPath(from, to) {
  const goal = nearestFree(to);
  const start = isFree(from.x, from.z) ? from : nearestFree(from);
  if (!goal || !start) return [];
  // 가깝거나 잔디를 거의 밟지 않으면 곧장
  const direct = Math.hypot(goal.x - start.x, goal.z - start.z);
  if (direct < 40 && lineFree(start, goal) && (direct < 6 || grassLen(start, goal) < 2.5)) return [goal];
  if (inGrid(start) && inGrid(goal)) return gridPath(start, goal);
  return forestPath(start, goal);
}

// ---------- 숲: 오솔길 점(약 2m 간격)을 따라 ----------
const TS = Object.values(TRAILS).map((t) => {
  const pts = t.samples.filter((q, i) => i % 4 === 0 || i === t.samples.length - 1);
  return { t, pts };
});
for (const T of TS) if (T.t.from) {
  T.parent = TS.find((q) => q.t === TRAILS[T.t.from[0]]);
  const h = T.pts[0]; let bi = 0, bd = Infinity;
  T.parent.pts.forEach((q, i) => { const d = Math.hypot(q.x - h.x, q.z - h.z); if (d < bd) { bd = d; bi = i; } });
  T.join = bi;
}
// 숲 속 한 점에서 가장 가까운 오솔길 점
function locate(p) {
  let best = null, bd = Infinity;
  for (const T of TS) T.pts.forEach((q, i) => {
    if (Math.abs(q.x - p.x) > bd || Math.abs(q.z - p.z) > bd) return;
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < bd) { bd = d; best = { T, i }; }
  });
  return best;
}
// 오솔길 점 i에서 정원(격자 안)까지 거꾸로 따라 나오는 점들
function outward(T, i) {
  const out = [];
  for (;;) {
    for (let k = i; k >= 0; k--) { out.push(T.pts[k]); if (inGrid(T.pts[k]) && !T.t.from) return out; }
    if (!T.parent) return out;
    i = T.join; T = T.parent;
  }
}
const slice = (pts, a, b) => (a <= b ? pts.slice(a, b + 1) : pts.slice(b, a + 1).reverse());
function forestPath(start, goal) {
  const A = inGrid(start) ? null : locate(start), B = inGrid(goal) ? null : locate(goal);
  let mid;
  if (A && B && A.T === B.T) mid = slice(A.T.pts, A.i, B.i);
  else if (A && B && B.T.parent === A.T) mid = [...slice(A.T.pts, A.i, B.T.join), ...slice(B.T.pts, 0, B.i)];
  else if (A && B && A.T.parent === B.T) mid = [...slice(A.T.pts, A.i, 0), ...slice(B.T.pts, A.T.join, B.i)];
  else {
    const up = A ? outward(A.T, A.i) : [];
    const down = B ? outward(B.T, B.i).reverse() : [];
    const g0 = up.length ? up[up.length - 1] : start, g1 = down.length ? down[0] : goal;
    mid = [...up, ...(Math.hypot(g0.x - g1.x, g0.z - g1.z) > 0.5 ? gridPath(g0, g1) : []), ...down];
  }
  const path = [...mid, goal];
  // 막힌 곳(닫힌 낭떠러지 등)을 만나면 그 앞에서 멈춤
  let prev = start;
  for (let k = 0; k < path.length; k++) {
    if (!lineFree(prev, path[k])) return path.slice(0, k);
    prev = path[k];
  }
  return path;
}

function gridPath(start, goal) {
  const si = toIdx(start.z) * N + toIdx(start.x);
  const gi = toIdx(goal.z) * N + toIdx(goal.x);
  const gx = gi % N, gy = Math.floor(gi / N);
  // 칸 배열은 한 번만 만들고, 이번 찾기 표시(stamp)가 다르면 비어 있는 것으로 봄
  const stamp = ++STAMP;
  const G = (k) => (seen[k] === stamp ? gScore[k] : Infinity);
  const open = new Heap();
  seen[si] = stamp; gScore[si] = 0; came[si] = -1;
  open.push(si, 0);
  while (open.size) {
    const cur = open.pop();
    if (cur === gi) break;
    if (shut[cur] === stamp) continue;
    shut[cur] = stamp;
    const ci = cur % N, cj = Math.floor(cur / N);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nk = nj * N + ni;
      if (!free[nk] || shut[nk] === stamp) continue;
      if (di && dj && (!free[cj * N + ni] || !free[nj * N + ci])) continue;
      const g = gScore[cur] + (di && dj ? Math.SQRT2 : 1) * (cost[nk] + cost[cur]) * 0.5;
      if (g < G(nk)) {
        seen[nk] = stamp;
        gScore[nk] = g;
        came[nk] = cur;
        open.push(nk, g + Math.hypot(ni - gx, nj - gy) * 1.4);
      }
    }
  }
  if (seen[gi] !== stamp && gi !== si) return [];
  const cells = [];
  for (let k = gi; k !== -1 && k !== si; k = came[k]) cells.push(center(k));
  cells.reverse();
  if (!cells.length) return [goal];
  cells[cells.length - 1] = goal;
  // 직선 펴기: 막히지 않고, 원래 길보다 잔디를 더 밟지 않을 때만 건너뜀
  const gacc = [0];
  for (let k = 0; k < cells.length; k++) {
    const p = k ? cells[k - 1] : start;
    gacc.push(gacc[k] + (costAt(cells[k].x, cells[k].z) > 1 ? Math.hypot(cells[k].x - p.x, cells[k].z - p.z) : 0));
  }
  const out = [];
  let anchor = start, idx = 0, ai = 0; // ai: anchor까지 원래 길에서 잰 잔디 길이 인덱스
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) {
      if (k - idx > 300) continue;
      if (lineFree(anchor, cells[k]) && grassLen(anchor, cells[k]) <= gacc[k + 1] - gacc[ai] + 0.2) { far = k; break; }
    }
    out.push(cells[far]);
    anchor = cells[far];
    ai = far + 1;
    idx = far + 1;
  }
  return out;
}

// 길이 새로 열리거나 막힌 곳 둘레만 다시 계산 (예: 생명의 다리)
export function refreshNav(x, z, R) {
  if (Math.hypot(x, z) - R > GRID_R) return; // 숲은 격자가 없음
  for (let j = toIdx(z - R); j <= toIdx(z + R); j++) for (let i = toIdx(x - R); i <= toIdx(x + R); i++) {
    const f = isFree(cx(i), cx(j));
    free[j * N + i] = f ? 1 : 0;
    cost[j * N + i] = f ? pathCost(cx(i), cx(j)) : 0;
  }
}
