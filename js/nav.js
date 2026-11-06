// 길찾기: 카페·정원은 격자 A* (이진 힙) + 직선 펴기, 숲속은 오솔길을 따라감
// (숲길이 길어져도 격자는 정원까지만 만들어 가벼움)
// 마을(지역, 2026-11): 먼 자리의 마을은 그 마을 상자만 덮는 격자를 따로 가짐. 처음 그 마을에 들어갈 때 만듦 (ensureNav)
//   마을이 다르면 걸어서 갈 수 없음 (수레로만): findPath는 빈 길을 돌려줌
import { R_GARDEN, TRAILS, isFree, pathCost, FAR_X, REGIONS, regionAt } from './layout.js';

const CELL = 0.35;
const GRID_R = R_GARDEN + 14; // 격자가 덮는 반지름
const HALF = Math.ceil(GRID_R);
const N = Math.ceil((HALF * 2) / CELL);

// 격자 하나: 왼쪽 위 모서리(x0, z0), 칸 크기, 가로·세로 칸 수
function makeGrid(x0, z0, nx, nz, cell) {
  const n = nx * nz;
  const G = {
    x0, z0, nx, nz, cell,
    free: new Uint8Array(n), cost: new Uint8Array(n),
    gScore: new Float32Array(n), came: new Int32Array(n), seen: new Uint32Array(n), shut: new Uint32Array(n), stamp: 0,
  };
  G.ci = (x) => Math.max(0, Math.min(nx - 1, Math.floor((x - x0) / cell)));
  G.cj = (z) => Math.max(0, Math.min(nz - 1, Math.floor((z - z0) / cell)));
  G.cx = (i) => x0 + i * cell + cell / 2;
  G.cz = (j) => z0 + j * cell + cell / 2;
  G.center = (k) => ({ x: G.cx(k % nx), z: G.cz(Math.floor(k / nx)) });
  G.costAt = (x, z) => G.cost[G.cj(z) * nx + G.ci(x)] || 1;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const f = isFree(G.cx(i), G.cz(j));
    G.free[j * nx + i] = f ? 1 : 0;
    if (f) G.cost[j * nx + i] = pathCost(G.cx(i), G.cz(j));
  }
  return G;
}

// 초보자 마을: 원점 둘레 정사각 격자 (숲은 격자 밖, 오솔길을 따라감)
const BASE = makeGrid(-HALF, -HALF, N, N, CELL);
BASE.inGrid = (p) => Math.hypot(p.x, p.z) < GRID_R - 2;
BASE.id = 'base';
// 마을 격자: 지역 id → 격자 (처음 쓸 때 만듦. 요한복음 마을 300×380m, 0.5m 칸이면 약 0.2초)
const REGION_GRIDS = new Map();
export function ensureNav(id) {
  if (REGION_GRIDS.has(id)) return REGION_GRIDS.get(id);
  const R = REGIONS.find((g) => g.id === id);
  if (!R || !R.nav) return null;
  const b = R.nav, nx = Math.ceil((b.x1 - b.x0) / b.cell), nz = Math.ceil((b.z1 - b.z0) / b.cell);
  const G = makeGrid(b.x0, b.z0, nx, nz, b.cell);
  G.inGrid = (p) => p.x > b.x0 + 0.5 && p.x < b.x1 - 0.5 && p.z > b.z0 + 0.5 && p.z < b.z1 - 0.5;
  G.id = id;
  REGION_GRIDS.set(id, G);
  return G;
}
// 이 점이 속한 격자 (초보자 마을이면 BASE, 마을이면 그 마을 격자, 어디도 아니면 null)
function gridOf(p) {
  if (p.x < FAR_X) return BASE;
  const R = regionAt(p.x, p.z);
  return R ? ensureNav(R.id) : null;
}

const inGrid = (p) => BASE.inGrid(p);
export function nearestFree(p) {
  if (isFree(p.x, p.z)) return { x: p.x, z: p.z };
  const G = gridOf(p);
  if (!G) return null;
  if (G === BASE && !inGrid(p)) { // 숲: 둘레를 돌며 가까운 빈 곳
    for (let r = 0.3; r < 12; r += 0.3) for (let k = 0, n = Math.ceil(r * 6); k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (isFree(x, z)) return { x, z };
    }
    // 숲 깊은 곳을 눌렀으면 가장 가까운 오솔길 위로
    const L = locate(p);
    return L ? { x: L.T.pts[L.i].x, z: L.T.pts[L.i].z } : null;
  }
  const { nx, nz, free } = G;
  const ci = G.ci(p.x), cj = G.cj(p.z);
  for (let r = 1; r < 160; r++) {
    let best = null, bd = Infinity;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz || !free[j * nx + i]) continue;
      const q = G.center(j * nx + i);
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d < bd) { bd = d; best = q; }
    }
    if (best) return best;
  }
  return null;
}

// 두 점 사이 직선이 잔디를 밟는 길이(m)
function grassLen(G, a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(d / 0.35));
  let g = 0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (G.costAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t) > 1) g += d / steps;
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

export function findPath(from, to) {
  const G = gridOf(from);
  if (!G || gridOf(to) !== G) return []; // 다른 마을: 걸어서는 못 감 (수레로)
  const goal = nearestFree(to);
  const start = isFree(from.x, from.z) ? from : nearestFree(from);
  if (!goal || !start) return [];
  // 가깝거나 잔디를 거의 밟지 않으면 곧장
  const direct = Math.hypot(goal.x - start.x, goal.z - start.z);
  if (direct < 40 && lineFree(start, goal) && (direct < 6 || grassLen(G, start, goal) < 2.5)) return [goal];
  if (G !== BASE) return gridPath(G, start, goal);
  if (inGrid(start) && inGrid(goal)) return gridPath(BASE, start, goal);
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
    mid = [...up, ...(Math.hypot(g0.x - g1.x, g0.z - g1.z) > 0.5 ? gridPath(BASE, g0, g1) : []), ...down];
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

function gridPath(G, start, goal) {
  const { nx: NX, nz: NZ, free, cost, gScore, came, seen, shut } = G;
  const si = G.cj(start.z) * NX + G.ci(start.x);
  const gi = G.cj(goal.z) * NX + G.ci(goal.x);
  const gx = gi % NX, gy = Math.floor(gi / NX);
  // 칸 배열은 한 번만 만들고, 이번 찾기 표시(stamp)가 다르면 비어 있는 것으로 봄
  const stamp = ++G.stamp;
  const gs = (k) => (seen[k] === stamp ? gScore[k] : Infinity);
  const open = new Heap();
  seen[si] = stamp; gScore[si] = 0; came[si] = -1;
  open.push(si, 0);
  while (open.size) {
    const cur = open.pop();
    if (cur === gi) break;
    if (shut[cur] === stamp) continue;
    shut[cur] = stamp;
    const ci = cur % NX, cj = Math.floor(cur / NX);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
      const nk = nj * NX + ni;
      if (!free[nk] || shut[nk] === stamp) continue;
      if (di && dj && (!free[cj * NX + ni] || !free[nj * NX + ci])) continue;
      const g = gScore[cur] + (di && dj ? Math.SQRT2 : 1) * (cost[nk] + cost[cur]) * 0.5;
      if (g < gs(nk)) {
        seen[nk] = stamp;
        gScore[nk] = g;
        came[nk] = cur;
        open.push(nk, g + Math.hypot(ni - gx, nj - gy) * 1.4);
      }
    }
  }
  if (seen[gi] !== stamp && gi !== si) return [];
  const cells = [];
  for (let k = gi; k !== -1 && k !== si; k = came[k]) cells.push(G.center(k));
  cells.reverse();
  if (!cells.length) return [goal];
  cells[cells.length - 1] = goal;
  // 직선 펴기: 막히지 않고, 원래 길보다 잔디를 더 밟지 않을 때만 건너뜀
  const gacc = [0];
  for (let k = 0; k < cells.length; k++) {
    const p = k ? cells[k - 1] : start;
    gacc.push(gacc[k] + (G.costAt(cells[k].x, cells[k].z) > 1 ? Math.hypot(cells[k].x - p.x, cells[k].z - p.z) : 0));
  }
  const out = [];
  let anchor = start, idx = 0, ai = 0; // ai: anchor까지 원래 길에서 잰 잔디 길이 인덱스
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) {
      if (k - idx > 300) continue;
      if (lineFree(anchor, cells[k]) && grassLen(G, anchor, cells[k]) <= gacc[k + 1] - gacc[ai] + 0.2) { far = k; break; }
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
  const G = gridOf({ x, z });
  if (!G) return;
  if (G === BASE && Math.hypot(x, z) - R > GRID_R) return; // 숲은 격자가 없음
  for (let j = G.cj(z - R); j <= G.cj(z + R); j++) for (let i = G.ci(x - R); i <= G.ci(x + R); i++) {
    const f = isFree(G.cx(i), G.cz(j));
    G.free[j * G.nx + i] = f ? 1 : 0;
    G.cost[j * G.nx + i] = f ? pathCost(G.cx(i), G.cz(j)) : 0;
  }
}
