// 격자 위 A* 길찾기 + 직선으로 갈 수 있는 구간은 펴주기
import { SIZE, isFree } from './world.js';

const CELL = 8;
const N = Math.ceil(SIZE / CELL);
const free = new Uint8Array(N * N);
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    free[j * N + i] = isFree(i * CELL + CELL / 2, j * CELL + CELL / 2) ? 1 : 0;
  }
}

const toCell = (p) => ({
  i: Math.max(0, Math.min(N - 1, Math.floor(p.x / CELL))),
  j: Math.max(0, Math.min(N - 1, Math.floor(p.y / CELL))),
});
const center = (i, j) => ({ x: i * CELL + CELL / 2, y: j * CELL + CELL / 2 });

// 막힌 곳을 누르면 가장 가까운 빈 칸으로
export function nearestFree(p) {
  if (isFree(p.x, p.y)) return { x: p.x, y: p.y };
  const c = toCell(p);
  for (let r = 1; r < 30; r++) {
    let best = null, bd = Infinity;
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = c.i + di, j = c.j + dj;
        if (i < 0 || j < 0 || i >= N || j >= N || !free[j * N + i]) continue;
        const q = center(i, j);
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < bd) { bd = d; best = q; }
      }
    }
    if (best) return best;
  }
  return null;
}

export function lineFree(a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.ceil(d / 4);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (!isFree(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
  }
  return true;
}

export function findPath(from, to) {
  const goal = nearestFree(to);
  if (!goal) return [];
  const start = isFree(from.x, from.y) ? from : nearestFree(from);
  if (!start) return [];
  if (lineFree(start, goal)) return [goal];

  const s = toCell(start), g = toCell(goal);
  const si = s.j * N + s.i, gi = g.j * N + g.i;
  const gScore = new Float32Array(N * N).fill(Infinity);
  const came = new Int32Array(N * N).fill(-1);
  const closed = new Uint8Array(N * N);
  const open = [si];
  gScore[si] = 0;
  const h = (k) => Math.hypot((k % N) - g.i, Math.floor(k / N) - g.j);
  const fScore = new Map([[si, h(si)]]);

  while (open.length) {
    let bi = 0;
    for (let k = 1; k < open.length; k++) if (fScore.get(open[k]) < fScore.get(open[bi])) bi = k;
    const cur = open[bi];
    open[bi] = open[open.length - 1];
    open.pop();
    if (cur === gi) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const ci = cur % N, cj = Math.floor(cur / N);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        const nk = nj * N + ni;
        if (!free[nk] || closed[nk]) continue;
        if (di && dj && (!free[cj * N + ni] || !free[nj * N + ci])) continue; // 모서리 끼임 방지
        const cost = gScore[cur] + (di && dj ? Math.SQRT2 : 1);
        if (cost < gScore[nk]) {
          gScore[nk] = cost;
          came[nk] = cur;
          fScore.set(nk, cost + h(nk));
          open.push(nk);
        }
      }
    }
  }
  if (came[gi] === -1 && gi !== si) return [];

  const cells = [];
  for (let k = gi; k !== -1 && k !== si; k = came[k]) cells.push(center(k % N, Math.floor(k / N)));
  cells.reverse();
  cells[cells.length - 1] = goal;

  // 펴주기: 보이는 가장 먼 점으로 건너뛰기
  const out = [];
  let anchor = start, idx = 0;
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) {
      if (lineFree(anchor, cells[k])) { far = k; break; }
    }
    out.push(cells[far]);
    anchor = cells[far];
    idx = far + 1;
  }
  return out;
}
