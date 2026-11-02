// 정원에 나가면 카페 안 가구·소품을 모두 감추고, 그 자리에 수레바퀴 하나(한 번에 그리는 한 덩어리)만 둠
// 테두리(순종) · 바퀴살 넷(말씀·기도·교제·증거) · 가운데 통(그리스도)
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import { R_RIM_IN, R_HUB } from './layout.js';

export function makeWheelProxy() {
  const parts = [];
  const add = (geo, color) => {
    const g = geo.toNonIndexed();
    const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    parts.push(g);
  };
  const Y = 0.75; // 허리 높이에 눕혀 놓은 바퀴
  const R = R_RIM_IN + 0.8;
  // 테두리: 순종
  add(new THREE.TorusGeometry(R, 0.32, 8, 72).rotateX(Math.PI / 2).translate(0, Y, 0), 0xb8864f);
  add(new THREE.TorusGeometry(R - 0.55, 0.12, 6, 72).rotateX(Math.PI / 2).translate(0, Y + 0.05, 0), 0xe7c98f);
  // 바퀴살: 남 말씀(초록) · 북 기도(파랑) · 동 교제(주황) · 서 증거(빨강)
  const spokes = [[0, 1, 0x7fae6a], [0, -1, 0x6f9fd0], [1, 0, 0xe39a54], [-1, 0, 0xd06a5a]];
  const len = R - R_HUB - 0.6, mid = (R + R_HUB) / 2;
  for (const [dx, dz, col] of spokes) {
    const g = new THREE.CylinderGeometry(0.38, 0.38, len, 8).rotateX(Math.PI / 2);
    if (dx) g.rotateY(Math.PI / 2);
    add(g.translate(dx * mid, Y, dz * mid), col);
    // 바퀴살 끝 작은 구슬 (그 자리의 체험이 여기 모였다는 표시)
    add(new THREE.SphereGeometry(0.8, 12, 8).translate(dx * (mid + len * 0.18), Y + 0.15, dz * (mid + len * 0.18)), col);
  }
  // 가운데 통: 그리스도
  add(new THREE.CylinderGeometry(R_HUB * 0.55, R_HUB * 0.6, 0.5, 24, 1, true).translate(0, Y, 0), 0xf3e2b5);
  add(new THREE.TorusGeometry(R_HUB * 0.58, 0.18, 8, 36).rotateX(Math.PI / 2).translate(0, Y + 0.25, 0), 0xd9b56a);
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }));
  mesh.visible = false;
  mesh.userData.noCull = true;
  mesh.userData.small = false;
  mesh.name = 'wheelProxy';
  return mesh;
}
