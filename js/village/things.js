// 손에 드는 것·몸에 두르는 것·마을에 놓는 물건 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   모양(메시)은 마을마다 make(kind)로 (요한: 등불·물동이·잔·대야… js/john/engine.js carryMesh)

// 들고 다니기: hold(kind) 손에 쥠(null이면 내려놓음) · wear(group|null) 몸에 두름(앞치마) · reattach() 캐릭터를 새로 만들면(옷 바꾸기) 다시 쥐어 줌 · show(on) 마을 밖에선 감춤
export function initCarry({ me, make }) {
  let carried = null, carryKind = null, worn = null;
  const attach = (o) => { const hand = me.av.userData.arms?.[1]; if (hand && o.parent !== hand) hand.add(o); };
  const isUnder = (o, root) => { for (let p = o.parent; p; p = p.parent) if (p === root) return true; return false; };
  return {
    hold(kind) {
      if (carried) { carried.parent?.remove(carried); carried = null; }
      carryKind = kind || null;
      if (kind) { carried = make(kind); attach(carried); }
    },
    kind: () => carryKind,
    held: () => carried,
    wear(g) {
      if (worn) { worn.parent?.remove(worn); worn = null; }
      if (!g) return;
      worn = g; me.av.userData.body.add(worn);
    },
    reattach() {
      if (carried && !isUnder(carried, me.av)) attach(carried);
      if (worn && !isUnder(worn, me.av)) me.av.userData.body.add(worn);
    },
    show(on) { if (carried) carried.visible = on; if (worn) worn.visible = on; },
  };
}

// 마을에 놓는 물건 (부탁의 널어 둔 그물 등): 마을 모형(root) 안에 둠. at으로 그 자리 물건을 치움
export function initProps({ root, G, make }) {
  const props = [];
  return {
    prop: (kind, p) => { const g = make(kind); g.position.set(p.x, G(p), p.z); g.userData.at = { x: p.x, z: p.z }; root.add(g); props.push(g); return g; },
    propAt: (p) => { const i = props.findIndex((g) => Math.hypot(g.userData.at.x - p.x, g.userData.at.z - p.z) < 0.6); if (i >= 0) root.remove(props.splice(i, 1)[0]); },
    props: (none, later = 0) => { const old = props.splice(0); const drop = () => old.forEach((g) => root.remove(g)); if (later) setTimeout(drop, later); else drop(); },
  };
}
