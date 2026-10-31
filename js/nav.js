// 격자 A* 길찾기 (이진 힙) + 직선 펴기
import { R_HALL, isFree } from './layout.js';

const CELL = 0.35;
const HALF = R_HALL + 1;
const N = Math.ceil((HALF * 2) / CELL);
const free = new Uint8Array(N * N);
const cx = (i) => -HALF + i * CELL + CELL / 2;
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) free[j * N + i] = isFree(cx(i), cx(j)) ? 1 : 0;

const toIdx = (v) => Math.max(0, Math.min(N - 1, Math.floor((v + HALF) / CELL)));
const center = (k) => ({ x: cx(k % N), z: cx(Math.floor(k / N)) });

export function nearestFree(p) {
  if (isFree(p.x, p.z)) return { x: p.x, z: p.z };
  const ci = toIdx(p.x), cj = toIdx(p.z);
  for (let r = 1; r < 40; r++) {
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
  const goal = nearestFree(to);
  const start = isFree(from.x, from.z) ? from : nearestFree(from);
  if (!goal || !start) return [];
  if (lineFree(start, goal)) return [goal];

  const si = toIdx(start.z) * N + toIdx(start.x);
  const gi = toIdx(goal.z) * N + toIdx(goal.x);
  const gx = gi % N, gy = Math.floor(gi / N);
  const gScore = new Float32Array(N * N).fill(Infinity);
  const came = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);
  const open = new Heap();
  gScore[si] = 0;
  open.push(si, 0);
  while (open.size) {
    const cur = open.pop();
    if (cur === gi) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const ci = cur % N, cj = Math.floor(cur / N);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nk = nj * N + ni;
      if (!free[nk] || closed[nk]) continue;
      if (di && dj && (!free[cj * N + ni] || !free[nj * N + ci])) continue;
      const cost = gScore[cur] + (di && dj ? Math.SQRT2 : 1);
      if (cost < gScore[nk]) {
        gScore[nk] = cost;
        came[nk] = cur;
        open.push(nk, cost + Math.hypot(ni - gx, nj - gy));
      }
    }
  }
  if (came[gi] === -1 && gi !== si) return [];
  const cells = [];
  for (let k = gi; k !== -1 && k !== si; k = came[k]) cells.push(center(k));
  cells.reverse();
  if (!cells.length) return [goal];
  cells[cells.length - 1] = goal;
  const out = [];
  let anchor = start, idx = 0;
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) if (lineFree(anchor, cells[k])) { far = k; break; }
    out.push(cells[far]);
    anchor = cells[far];
    idx = far + 1;
  }
  return out;
}
