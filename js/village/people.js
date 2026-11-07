// 마을 사람 세우기·움직이기 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   person(key, 이름, 옷, 자리, 바라볼 곳): 빈 자리에 세우고 이름표를 닮. N[key]로 찾음 (사건 도구 모듈도 같은 person·N을 받아 씀)
//   사람의 기준 자리 home0·face0 (그만두거나 마치면 돌아감), 지금 자리 home. step(마을 안?): 90m 안만 보임, 따라오기, 서 있을 때 나를 봄
import { nameTag } from '../tutorial.js';
import { findPath, nearestFree } from '../nav.js';

export function initPeople({ me, makeChar, npcs }) {
  const N = {};
  const dist = (a, b = me) => Math.hypot(a.x - b.x, a.z - b.z);
  const person = (key, name, look, p, faceTo) => {
    const q = nearestFree(p) || p;
    const n = makeChar({ hair: 0x3b2a22, style: 0, pants: 0x5a5048, ...look, bag: look.hoodie }, q.x, q.z);
    const bag = n.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1); if (bag) bag.visible = false;
    n.tag = nameTag(name); n.av.add(n.tag);
    n.home = { x: q.x, z: q.z }; n.home0 = { ...n.home };
    n.face0 = faceTo ? Math.atan2(faceTo.x - q.x, faceTo.z - q.z) : 0; n.face = n.face0;
    n.key = key; n.name = name;
    npcs.push(n); N[key] = n;
    return n;
  };
  // 기준 자리로 바로 돌려놓음 (따라오기는 그대로)
  const home = (n) => { n.path = []; n.state = 'idle'; n.x = n.home0.x; n.z = n.home0.z; n.home = { ...n.home0 }; n.face = n.face0; };
  // 사건 단계(X)가 쓰는 도구
  const X = {
    walkNpc: (k, pts, viaPath) => {
      const n = N[k]; if (!n) return;
      const last = pts[pts.length - 1];
      n.path = viaPath ? findPath(n, last) : pts.map((p) => ({ x: p.x, z: p.z }));
      if (!n.path.length) { const q = nearestFree(last) || last; n.x = q.x; n.z = q.z; }
      n.home = { x: last.x, z: last.z }; n.state = n.path.length ? 'walk' : 'idle'; n.action = null;
    },
    follow: (k) => { N[k].follow = true; N[k].action = null; },
    unfollow: (k) => { N[k].follow = false; N[k].home = { x: N[k].x, z: N[k].z }; },
    dn: (k, p) => dist(p, N[k]),
    npcAt: (k) => N[k],
    resetNpc: (k) => { const n = N[k]; if (!n) return; n.follow = false; home(n); },
  };
  function step(town) {
    for (const n of Object.values(N)) {
      const d = dist(n);
      n.av.visible = town && d < 90 && !n.hide;
      if (!town) continue;
      // 따라오는 사람 (나다나엘 등)
      if (n.follow) {
        if (d > 2.4 && n.state !== 'walk') { const a = Math.atan2(n.x - me.x, n.z - me.z); const p = nearestFree({ x: me.x + Math.sin(a) * 1.4, z: me.z + Math.cos(a) * 1.4 }); if (p) { n.path = [p]; n.state = 'walk'; } }
        n.home = { x: n.x, z: n.z };
      }
      if (n.state !== 'walk') { n.x = n.home.x; n.z = n.home.z; if (n.action !== 'wave' && !n.fixFace) n.face = d < 6 ? Math.atan2(me.x - n.x, me.z - n.z) : n.face0; }
    }
  }
  return { N, person, home, X, step };
}
