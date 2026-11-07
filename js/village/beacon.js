// 금빛 기둥(다음 사건·지금 단계 자리)과 빛나는 자리 고리 (마을 공용, 2026-11 사도행전 0-가: js/john/engine.js에서 그대로 옮김)
//   show(p, on): 기둥 자리·보이기 · put(p): 지금 단계 고리 (null이면 감춤) · rings(pts): 덧고리 셋 (사건이 여러 자리를 한꺼번에 비출 때)
//   step(now): 별 돌기·빛 숨쉬기 (매 프레임, 마을 안에서만)
import * as THREE from 'three';

export function initBeacon({ scene, fxSprite, G }) {
  const beam = new THREE.Group();
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.y = 15; beam.add(m); const s = fxSprite('star_06', 0xfff0c0, 2.4); s.position.y = 3; beam.add(s); beam.userData.star = s; }
  beam.visible = false; scene.add(beam);
  const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xffe7a0, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const makeRing = () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.85, 36), ringMat()); m.rotation.x = -Math.PI / 2;
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    glow.position.y = 1.3; m.add(glow); glow.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); return m;
  };
  const ring = makeRing();
  const extraRings = [makeRing(), makeRing(), makeRing()];
  const putRing = (m, p) => { m.position.set(p.x, G(p) + 0.06, p.z); m.visible = true; };
  return {
    beam, ring,
    rings: (pts) => { extraRings.forEach((m, i) => { if (pts && pts[i]) putRing(m, pts[i]); else m.visible = false; }); },
    show(p, on) { beam.visible = on; if (p) beam.position.set(p.x, G(p), p.z); },
    put(p) { if (p) putRing(ring, p); else ring.visible = false; },
    hide() { beam.visible = false; ring.visible = false; },
    step(now) {
      beam.userData.star.material.rotation = now / 2500;
      beam.children[0].material.opacity = 0.18 + Math.sin(now / 500) * 0.06;
      const pulse = Math.sin(now / 400);
      for (const m of [ring, ...extraRings]) if (m.visible) { m.material.opacity = 0.45 + 0.3 * pulse; m.children[0].material.opacity = 0.13 + 0.07 * pulse; }
    },
  };
}
