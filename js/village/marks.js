// 머리 위 표시 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   증인: 할 사건 두루마리 · 마침 별 · 여섯 모드를 다 채우면 금빛 별 (n.mark, 한 증인에 하나: 두 사건의 증인도 하나)
//   부탁하는 사람: 작은 초록 말풍선 (오늘 받을 수 있는 부탁이 있을 때, 증인 표시가 있으면 옆으로 비킴)
import * as THREE from 'three';

const markTex = (kind) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  if (kind === 'scroll') {
    g.fillStyle = '#f6e7c0'; g.strokeStyle = '#8f6744'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(16, 14, 32, 36, 4); g.fill(); g.stroke();
    for (const y of [14, 50]) { g.beginPath(); g.ellipse(32, y, 20, 5, 0, 0, Math.PI * 2); g.fillStyle = '#e8c878'; g.fill(); g.stroke(); }
  } else if (kind === 'ask') {
    g.fillStyle = '#eaf6e4'; g.strokeStyle = '#4f8a46'; g.lineWidth = 3;
    g.beginPath(); g.roundRect(8, 10, 48, 34, 10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(22, 43); g.lineTo(18, 56); g.lineTo(32, 44); g.fillStyle = '#eaf6e4'; g.fill(); g.stroke();
    g.fillStyle = '#4f8a46'; for (const x of [21, 32, 43]) { g.beginPath(); g.arc(x, 27, 3.6, 0, Math.PI * 2); g.fill(); }
  } else {
    g.fillStyle = kind === 'gold' ? '#ffcf3a' : '#fff4d0'; g.strokeStyle = kind === 'gold' ? '#b07a10' : '#b0a070'; g.lineWidth = 2.5; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(32 + Math.cos(a) * r, 33 + Math.sin(a) * r); }
    g.closePath(); g.fill(); g.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// N: 마을 사람들 · witnesses: 사건 증인 key (사건 순서대로) · askers: 부탁하는 사람 key (N에 있는 사람만 표시)
export function initMarks({ N, witnesses, askers = [] }) {
  const TEX = { scroll: markTex('scroll'), star: markTex('star'), gold: markTex('gold'), ask: markTex('ask') };
  for (const k of witnesses) {
    const n = N[k];
    if (n.mark) continue;
    n.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.scroll, transparent: true, depthWrite: false }));
    n.mark.scale.setScalar(0.5); n.mark.position.y = 2.75; n.av.add(n.mark);
  }
  const keys = [...new Set(witnesses)];
  const ask = [...new Set(askers)].filter((k) => N[k]).map((k) => {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.ask, transparent: true, depthWrite: false }));
    m.scale.setScalar(0.42); m.visible = false; N[k].av.add(m); return { k, m };
  });
  // witness(k) → { on, kind: 'scroll'|'star'|'gold', id(흔들림 박자) } · offers: 지금 부탁 표시할 사람 Set (null이면 모두 감춤)
  function step(now, witness, offers) {
    for (const k of keys) {
      const w = witness(k), n = N[k];
      n.mark.visible = w.on;
      n.mark.material.map = TEX[w.kind];
      n.mark.position.y = 2.75 + Math.sin(now / 500 + w.id.length) * 0.06;
    }
    for (const { k, m } of ask) { m.visible = !!offers && offers.has(k); if (m.visible) m.position.set(N[k].mark?.visible ? 0.42 : 0, 2.78 + Math.sin(now / 450) * 0.05, 0); }
  }
  return { step };
}
