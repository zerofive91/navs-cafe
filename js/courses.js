// 숲속 코스 네 갈래: 천로역정 구원 코스, 생명의 다리(복음), 천국을 사모하는 길, 예수님을 만나는 길
// 길을 따라 걸으며 정거장에 다가가면 장면과 함께 말씀이 뜨고, 길가 등불이 켜짐
import * as THREE from 'three';
import { TRAILS, R_PARK } from './layout.js';
import { showVerse, VERSES } from './verses.js';
import { place } from './props.js';
import { fanfare } from './stories.js';

// 각 정거장: [이름, 말씀, 장소, 장면 만들기, 들어설 때]
const COURSES = {
  pilgrim: {
    name: '천로역정', color: 0xffc070,
    st: [
      ['멸망의 도시', ['수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라', '마태복음 11:28'], 'city', 'burden'],
      ['낙심의 늪', ['나를 기가 막힐 웅덩이와 수렁에서 끌어올리시고 내 발을 반석 위에 두사 내 걸음을 견고케 하셨도다', '시편 40:2'], 'slough', 'splash'],
      ['좁은 문', ['구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾을 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니', '마태복음 7:7'], 'gate', 'knock'],
      ['해석자의 집', ['내 눈을 열어서 주의 법의 기이한 것을 보게 하소서', '시편 119:18'], 'house'],
      ['십자가', ['그가 찔림은 우리의 허물을 인함이요 그가 상함은 우리의 죄악을 인함이라 그가 징계를 받음으로 우리는 평화를 누리고 그가 맞음으로 우리는 나음을 입었도다', '이사야 53:5'], 'cross', 'unburden'],
      ['고난의 언덕', ['오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리의 날개 치며 올라감 같을 것이요 달음박질하여도 곤비치 아니하겠고 걸어가도 피곤치 아니하리로다', '이사야 40:31'], 'hill'],
      ['허영의 시장', ['이 세상도, 그 정욕도 지나가되 오직 하나님의 뜻을 행하는 이는 영원히 거하느니라', '요한일서 2:17'], 'fair'],
      ['의심의 성', ['또 약속하신 이는 미쁘시니 우리가 믿는 도리의 소망을 움직이지 말며 굳게 잡아', '히브리서 10:23'], 'castle', 'key'],
      ['죽음의 강', ['네가 물 가운데로 지날 때에 내가 함께 할 것이라 강을 건널 때에 물이 너를 침몰치 못할 것이며', '이사야 43:2'], 'river', 'splash'],
      ['하늘의 도성', ['내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니 이제 후로는 나를 위하여 의의 면류관이 예비되었으므로', '디모데후서 4:7-8'], 'city-gold', 'arrive'],
    ],
  },
  gospel: {
    name: '생명의 다리', color: 0xfff4d8,
    st: [
      ['하나님의 사랑', ['하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라', '요한복음 3:16'], 'sun'],
      ['풍성한 생명', ['내가 온 것은 양으로 생명을 얻게 하고 더 풍성히 얻게 하려는 것이니라', '요한복음 10:10'], 'fruit'],
      ['죄로 막힌 길', ['오직 너희 죄악이 너희와 너희 하나님 사이를 내었고 너희 죄가 그 얼굴을 가리워서 너희를 듣지 않으시게 함이니라', '이사야 59:2'], 'broken'],
      ['죄의 삯', ['죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라', '로마서 6:23'], 'grave'],
      ['사람의 노력', ['너희가 그 은혜를 인하여 믿음으로 말미암아 구원을 얻었나니 이것이 너희에게서 난 것이 아니요 하나님의 선물이라 행위에서 난 것이 아니니 이는 누구든지 자랑치 못하게 함이니라', '에베소서 2:8-9'], 'ladders'],
      ['십자가 다리', ['그리스도께서도 한번 죄를 위하여 죽으사 의인으로서 불의한 자를 대신하셨으니 이는 우리를 하나님 앞으로 인도하려 하심이라', '베드로전서 3:18'], 'bridge', 'bridge'],
      ['영접', ['영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니', '요한복음 1:12'], 'door'],
      ['영생의 확신', ['내가 진실로 진실로 너희에게 이르노니 내 말을 듣고 또 나 보내신 이를 믿는 자는 영생을 얻었고 심판에 이르지 아니하나니 사망에서 생명으로 옮겼느니라', '요한복음 5:24'], 'dawn', 'arrive'],
    ],
  },
  heaven: {
    name: '천국을 사모하는 길', color: 0xbfe0ff,
    st: [
      ['나그네', ['이 사람들은 다 믿음을 따라 죽었으며 약속을 받지 못하였으되 그것들을 멀리서 보고 환영하며 또 땅에서는 외국인과 나그네로라 증거하였으니', '히브리서 11:13'], 'traveler'],
      ['더 나은 본향', ['저희가 이제는 더 나은 본향을 사모하니 곧 하늘에 있는 것이라 그러므로 하나님이 저희 하나님이라 일컬음 받으심을 부끄러워 아니하시고 저희를 위하여 한 성을 예비하셨느니라', '히브리서 11:16'], 'signpost'],
      ['거할 곳', ['내 아버지 집에 거할 곳이 많도다 그렇지 아니하면 너희에게 일렀으리라 내가 너희를 위하여 처소를 예비하러 가노니', '요한복음 14:2'], 'home'],
      ['눈물이 없는 곳', ['모든 눈물을 그 눈에서 씻기시매 다시 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니 처음 것들이 다 지나갔음이러라', '요한계시록 21:4'], 'tears'],
      ['하늘 시민권', ['오직 우리의 시민권은 하늘에 있는지라 거기로서 구원하는 자 곧 주 예수 그리스도를 기다리노니', '빌립보서 3:20'], 'pillar'],
      ['생명수의 강', ['또 저가 수정 같이 맑은 생명수의 강을 내게 보이니 하나님과 및 어린 양의 보좌로부터 나서 길 가운데로 흐르더라', '요한계시록 22:1'], 'lifeRiver', 'splash'],
      ['영원한 영광', ['우리의 잠시 받는 환난의 경한 것이 지극히 크고 영원한 영광의 중한 것을 우리에게 이루게 함이니', '고린도후서 4:17'], 'glory'],
      ['새 예루살렘', ['그 열두 문은 열두 진주니 문마다 한 진주요 성의 길은 맑은 유리 같은 정금이더라', '요한계시록 21:21'], 'pearl', 'arrive'],
    ],
    after: ['이것들을 증거하신 이가 가라사대 내가 진실로 속히 오리라 하시거늘 아멘 주 예수여 오시옵소서', '요한계시록 22:20'],
  },
  jesus: {
    name: '예수님을 만나는 길', color: 0xffd0b0,
    st: [
      ['나심', ['오늘날 다윗의 동네에 너희를 위하여 구주가 나셨으니 곧 그리스도 주시니라', '누가복음 2:11'], 'manger'],
      ['세례', ['하늘로서 소리가 있어 말씀하시되 이는 내 사랑하는 아들이요 내 기뻐하는 자라 하시니라', '마태복음 3:17'], 'jordan', 'dove'],
      ['산 위의 가르침', ['심령이 가난한 자는 복이 있나니 천국이 저희 것임이요', '마태복음 5:3'], 'mount'],
      ['생명의 떡', ['나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라', '요한복음 6:35'], 'loaves'],
      ['세상의 빛', ['나는 세상의 빛이니 나를 따르는 자는 어두움에 다니지 아니하고 생명의 빛을 얻으리라', '요한복음 8:12'], 'lamp'],
      ['섬기러 오심', ['인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기 목숨을 많은 사람의 대속물로 주려 함이니라', '마가복음 10:45'], 'basin'],
      ['십자가', ['예수께서 신 포도주를 받으신 후 가라사대 다 이루었다 하시고 머리를 숙이시고 영혼이 돌아가시니라', '요한복음 19:30'], 'calvary'],
      ['빈 무덤', ['여기 계시지 않고 살아나셨느니라', '누가복음 24:6'], 'tomb', 'risen'],
      ['다시 오실 주', ['너희 가운데서 하늘로 올리우신 이 예수는 하늘로 가심을 본 그대로 오시리라', '사도행전 1:11'], 'clouds', 'arrive'],
    ],
  },
};

export function addCourses(ctx) {
  const { scene, me, sfx, fxSprite, burst, steps, audio, H } = ctx;
  const { M, MAT, shadow, ease, G0 } = H;
  const hit = (name, vol = 0.3, rate = 1) => sfx('impact/' + name, vol, rate);
  const C = {
    path: M(0xcbb894, 1), dark: M(0x5b5550, 0.95), grey: M(0x8f8a84, 0.95), mud: M(0x6a5236, 0.6),
    wood: MAT.wood, woodDark: MAT.woodDark, stone: MAT.stone, white: MAT.white,
    gold: M(0xe8c060, 0.3, { metalness: 0.5, emissive: 0x6a4a10, emissiveIntensity: 0.4 }),
    pearl: M(0xf8f4ee, 0.2, { emissive: 0xfff4e0, emissiveIntensity: 0.35 }),
    water: M(0x6fb6d6, 0.15, { transparent: true, opacity: 0.85, emissive: 0x1a4a60, emissiveIntensity: 0.3 }),
    crystal: M(0xb8ecff, 0.05, { transparent: true, opacity: 0.8, emissive: 0x60c8ff, emissiveIntensity: 0.6 }),
    leaf: MAT.leaf, red: M(0xb84a3a, 0.7), warm: M(0xffe0a0, 0.5, { emissive: 0xffc060, emissiveIntensity: 1 }),
    abyss: M(0x0c0a0a, 1),
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const bx = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const glowAt = (g, color, size, x, y, z, op = 0.8) => { const s = fxSprite('light_01', color, size); s.position.set(x, y, z); s.material.opacity = op; g.add(s); return s; };
  const anims = []; // (dt, t) 장면 움직임

  // 길 바닥: 둘레길 바깥부터 숲 끝까지 띠 모양
  for (const tr of Object.values(TRAILS)) {
    const S = tr.samples.filter((q) => Math.hypot(q.x, q.z) > R_PARK + 1.3);
    const pos = [], idx = [];
    S.forEach((q, i) => {
      const n = S[Math.min(i + 1, S.length - 1)], p = S[Math.max(i - 1, 0)];
      const dx = n.x - p.x, dz = n.z - p.z, l = Math.hypot(dx, dz) || 1;
      const rx = -dz / l * 1.25, rz = dx / l * 1.25;
      pos.push(q.x + rx, G0 + 0.016, q.z + rz, q.x - rx, G0 + 0.016, q.z - rz);
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const strip = new THREE.Mesh(geo, C.path); strip.receiveShadow = true;
    if (geo.attributes.normal.array[1] < 0) { idx.reverse(); geo.setIndex(idx); geo.computeVertexNormals(); }
    scene.add(strip);
    // 끝 빈터
    const cl = new THREE.Mesh(new THREE.CircleGeometry(7, 40), C.path);
    cl.rotation.x = -Math.PI / 2; cl.position.set(tr.end.x, G0 + 0.015, tr.end.z); cl.receiveShadow = true;
    scene.add(cl);
  }

  // ---------- 장면들 (그룹 안: +z = 길 앞쪽, +x = 길 쪽(side 정거장) / 오른쪽(가운데 정거장)) ----------
  const scenes = {
    city(g) {
      for (const [x, z, h, r] of [[1.2, -1.6, 2.2, 0.15], [-0.3, 0.2, 1.6, -0.2], [0.9, 1.8, 2.6, 0.1]]) {
        const hs = bx(1.3, h, 1.3, C.dark, x, h / 2, z); hs.rotation.z = r * 0.3; hs.rotation.y = r; g.add(hs);
        const roof = mesh(new THREE.ConeGeometry(1.05, 0.8, 4), C.grey, x, h + 0.35, z); roof.rotation.y = Math.PI / 4 + r; g.add(roof);
      }
      const smoke = glowAt(g, 0x777777, 2.2, 0.4, 3.4, 0, 0.35);
      anims.push((dt, t) => { smoke.position.y = 3.2 + Math.sin(t * 0.7) * 0.3; });
    },
    slough(g) {
      const m = mesh(new THREE.CircleGeometry(2.6, 24), C.mud, 1.6, 0.02, 0); m.rotation.x = -Math.PI / 2; m.scale.set(1, 1.4, 1); g.add(m);
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8), C.stone, 2.6 - k * 0.15, 0.05, -1.8 + k * 1.2));
      for (let k = 0; k < 5; k++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.9, 4), C.leaf, 0.4 + Math.random(), 0.45, -2 + Math.random() * 4); r.rotation.z = (Math.random() - 0.5) * 0.4; g.add(r); }
    },
    gate(g) {
      for (const s of [-1, 1]) g.add(bx(0.3, 2.8, 0.3, C.woodDark, s * 1.55, 1.4, 0));
      g.add(bx(3.5, 0.3, 0.35, C.woodDark, 0, 2.9, 0));
      const door = new THREE.Group(); door.position.set(-1.4, 0, 0);
      door.add(bx(1.3, 2.3, 0.08, C.wood, 0.65, 1.2, 0)); door.rotation.y = -1.9; g.add(door);
      g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), C.warm, 0, 3.25, 0)); glowAt(g, 0xffd890, 1.4, 0, 3.25, 0);
    },
    house(g) {
      g.add(bx(2.6, 2.2, 2.6, C.white, 0, 1.1, 0));
      const roof = mesh(new THREE.ConeGeometry(2.2, 1.2, 4), C.red, 0, 2.8, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(bx(0.06, 0.6, 0.6, C.warm, 1.31, 1.4, 0.6)); g.add(bx(0.06, 1.3, 0.7, C.woodDark, 1.31, 0.65, -0.6));
      glowAt(g, 0xffd890, 1.6, 1.5, 1.4, 0.6, 0.6);
    },
    cross(g, st) {
      const hill = mesh(new THREE.SphereGeometry(2.2, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8aa86a, 1), -0.3, 0, 0); hill.scale.y = 0.45; g.add(hill);
      g.add(bx(0.26, 3.4, 0.26, C.woodDark, -0.3, 2.3, 0));
      g.add(bx(0.24, 0.24, 1.8, C.woodDark, -0.3, 3.2, 0));
      // 무덤: 짐이 굴러 들어가는 곳
      const rock = mesh(new THREE.SphereGeometry(1.1, 12, 8), C.grey, 0.4, 0.5, 2.6); rock.scale.set(1, 0.8, 1); g.add(rock);
      const hole = mesh(new THREE.CircleGeometry(0.42, 14), C.abyss, 1.35, 0.45, 2.6); hole.rotation.y = Math.PI / 2; g.add(hole);
      st.tomb = new THREE.Vector3(1.35, 0.4, 2.6);
      glowAt(g, 0xfff0c0, 2.4, -0.3, 3.4, 0, 0.35);
    },
    hill(g) {
      const h = mesh(new THREE.ConeGeometry(2.6, 2.2, 8), M(0x9a9080, 1), -0.6, 1.1, 0); g.add(h);
      for (let k = 0; k < 4; k++) g.add(bx(0.7, 0.18, 0.5, C.stone, 1.1 - k * 0.45, 0.1 + k * 0.4, 0));
      const arbor = new THREE.Group(); arbor.position.set(-0.6, 2.2, 0);
      for (const s of [-1, 1]) arbor.add(bx(0.08, 0.9, 0.08, C.wood, 0, 0.45, s * 0.5));
      arbor.add(bx(0.5, 0.06, 1.2, C.leaf, 0, 0.95, 0)); g.add(arbor);
    },
    fair(g) {
      const cols = [0xd9534f, 0x5b8def, 0xf0ad4e, 0x9b59b6];
      for (let k = 0; k < 3; k++) {
        const z = -2.4 + k * 2.4;
        g.add(bx(0.9, 1, 1.8, C.wood, 0.2, 0.5, z));
        for (let s = 0; s < 4; s++) g.add(bx(1.2, 0.08, 0.45, M(cols[(k + s) % 4], 0.6), 0.2, 1.9 - s * 0.01, z - 0.67 + s * 0.45));
        for (const s of [-1, 1]) g.add(bx(0.06, 1.9, 0.06, C.woodDark, 0.75, 0.95, z + s * 0.85));
        const shine = glowAt(g, cols[k], 0.5, 0.3, 1.25, z, 0.8);
        anims.push((dt, t) => { shine.material.opacity = 0.4 + Math.abs(Math.sin(t * 4 + k)) * 0.5; });
      }
    },
    castle(g, st) {
      const tw = mesh(new THREE.CylinderGeometry(1.4, 1.6, 4.2, 10), C.dark, -0.6, 2.1, 0); g.add(tw);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.add(bx(0.4, 0.45, 0.4, C.dark, -0.6 + Math.cos(a) * 1.3, 4.4, Math.sin(a) * 1.3)); }
      g.add(bx(0.1, 1.5, 0.9, M(0x2a2420), 0.82, 0.75, 0));
      // 약속이라는 열쇠 (천로역정)
      const key = new THREE.Group(); key.position.set(1.6, 1.3, 0);
      const ringK = mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), C.gold); key.add(ringK);
      key.add(bx(0.06, 0.06, 0.6, C.gold, 0, 0, 0.42)); key.add(bx(0.06, 0.16, 0.06, C.gold, 0, -0.08, 0.66));
      key.add(fxSprite('light_01', 0xffe090, 1));
      g.add(key); st.key = key;
      anims.push((dt, t) => { key.rotation.y = t * 1.2; key.position.y = 1.3 + Math.sin(t * 2) * 0.08; });
    },
    river(g) {
      const w = mesh(new THREE.PlaneGeometry(14, 2.6), C.water, 0, 0.025, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (let k = 0; k < 5; k++) g.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 8), C.stone, (k - 2) * 0.12, 0.05, -1 + k * 0.5));
      anims.push((dt, t) => { w.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.08; });
    },
    'city-gold'(g) {
      for (const s of [-1, 1]) {
        g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 5.5, 10), C.pearl, s * 2.2, 2.75, 0));
        g.add(mesh(new THREE.ConeGeometry(0.85, 1.4, 10), C.gold, s * 2.2, 6.2, 0));
        g.add(bx(4, 3.2, 0.7, C.pearl, s * 4.6, 1.6, 0.4));
      }
      const arch = mesh(new THREE.TorusGeometry(1.6, 0.25, 10, 24, Math.PI), C.gold, 0, 4, 0); g.add(arch);
      const street = mesh(new THREE.PlaneGeometry(2.4, 6), C.gold, 0, 0.03, -3.2); street.rotation.x = -Math.PI / 2; g.add(street);
      const halo = glowAt(g, 0xfff0b0, 7, 0, 3.4, 0.4, 0.6);
      anims.push((dt, t) => { halo.material.opacity = 0.5 + Math.sin(t * 1.3) * 0.15; });
    },
    sun(g) {
      const sunG = glowAt(g, 0xffe6a0, 4, -0.4, 3.6, 0, 0.9);
      g.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), C.warm, -0.4, 3.6, 0));
      flowers(g, 0, 0, 1.6, 16);
      anims.push((dt, t) => { sunG.material.opacity = 0.7 + Math.sin(t) * 0.15; });
    },
    fruit(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 2, 8), C.woodDark, -0.3, 1, 0));
      const cr = mesh(new THREE.IcosahedronGeometry(1.3, 1), C.leaf, -0.3, 2.6, 0); g.add(cr);
      for (let k = 0; k < 10; k++) { const a = k * 2.4; g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), M(k % 2 ? 0xe05a3a : 0xf0b03a, 0.5), -0.3 + Math.cos(a) * 1.15, 2.3 + (k % 3) * 0.3, Math.sin(a) * 1.15)); }
      flowers(g, 0.6, 0, 1.4, 10);
    },
    broken(g) {
      for (let k = 0; k < 6; k++) { const s = mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0), C.dark, (Math.random() - 0.3) * 2, 0.2, -1.5 + k * 0.6); s.rotation.set(Math.random(), Math.random(), 0); g.add(s); }
      g.add(bx(0.25, 1.6, 0.25, C.woodDark, -0.4, 0.8, 0));
      const sign = bx(0.06, 0.25, 1.2, C.woodDark, -0.3, 1.4, 0.3); sign.rotation.x = 0.5; g.add(sign); // 부러진 이정표
    },
    grave(g) {
      g.add(bx(0.35, 1.3, 0.9, C.grey, -0.2, 0.65, 0));
      g.add(bx(0.5, 0.25, 1.4, C.dark, -0.2, 0.12, 0));
      const mist = glowAt(g, 0x555566, 3, 0, 0.5, 0, 0.4);
      anims.push((dt, t) => { mist.material.opacity = 0.3 + Math.sin(t * 0.8) * 0.1; });
    },
    ladders(g) {
      for (let k = 0; k < 3; k++) {
        const l = new THREE.Group(); l.position.set(-0.4, 0, -1.4 + k * 1.4); l.rotation.z = 0.5 + k * 0.15;
        for (const s of [-1, 1]) l.add(bx(0.06, 2.4, 0.06, C.wood, 0, 1.2, s * 0.25));
        for (let r = 0; r < 5; r++) l.add(bx(0.05, 0.05, 0.5, C.wood, 0, 0.3 + r * 0.45, 0));
        g.add(l);
      }
      const hole = mesh(new THREE.CircleGeometry(1.6, 18), C.abyss, -1.3, 0.02, 0); hole.rotation.x = -Math.PI / 2; g.add(hole);
    },
    bridge(g, st) {
      // 길을 가로지르는 골짜기, 그 위에 누운 십자가 다리
      const gap = mesh(new THREE.PlaneGeometry(22, 4.2), C.abyss, 0, 0.018, 0); gap.rotation.x = -Math.PI / 2; g.add(gap);
      for (const s of [-1, 1]) for (let k = 0; k < 14; k++) {
        const r = mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.3, 0), C.dark, -10 + k * 1.55, 0.1, s * (2.1 + Math.random() * 0.3));
        if (Math.abs(r.position.x) > 1.5) g.add(r);
      }
      const fog = glowAt(g, 0x222233, 6, 0, 0.2, 0, 0.5); void fog;
      const beamM = M(0x9a6a40, 0.7, { emissive: 0xffd080, emissiveIntensity: 0 });
      g.add(bx(1.7, 0.16, 7.5, beamM, 0, 0.08, 0.3));
      g.add(bx(5.2, 0.16, 1.5, beamM, 0, 0.09, 1.5));
      st.beam = beamM;
    },
    door(g) {
      for (const s of [-1, 1]) g.add(bx(0.2, 2.6, 0.2, C.wood, 0, 1.3, s * 0.75));
      g.add(bx(0.24, 0.24, 1.7, C.wood, 0, 2.6, 0));
      const light = mesh(new THREE.PlaneGeometry(1.3, 2.4), M(0xfff2d0, 0.4, { emissive: 0xffe6b0, emissiveIntensity: 1.1, side: THREE.DoubleSide }), 0, 1.25, 0); light.rotation.y = Math.PI / 2; g.add(light);
      const leaf = bx(0.08, 2.4, 1.3, C.woodDark, 0.6, 1.2, -1.2); leaf.rotation.y = 0.9; g.add(leaf);
      glowAt(g, 0xfff0c0, 3, 0.3, 1.3, 0, 0.6);
    },
    dawn(g) {
      g.add(bx(0.5, 0.08, 1.8, C.wood, -0.2, 0.45, 0)); for (const s of [-1, 1]) g.add(bx(0.4, 0.45, 0.08, C.woodDark, -0.2, 0.22, s * 0.8));
      flowers(g, 0, 0, 2.4, 22, 0xffffff);
      const sun = glowAt(g, 0xffd890, 9, -2.5, 5, 0, 0.7);
      anims.push((dt, t) => { sun.material.opacity = 0.55 + Math.sin(t * 0.6) * 0.15; });
    },
    traveler(g) {
      const staff = bx(0.07, 1.8, 0.07, C.woodDark, -0.3, 0.9, 0.3); staff.rotation.x = 0.15; g.add(staff);
      g.add(bx(0.5, 0.4, 0.5, M(0x8a6a4a), -0.4, 0.2, -0.4));
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 8), C.warm, -0.3, 1.7, 0.6)); glowAt(g, 0xffd080, 1.2, -0.3, 1.7, 0.6);
    },
    signpost(g) { place(g, 'assets/camp/signpost.glb', { x: 0, z: 0, y: 0, rot: 0, height: 2 }); glowAt(g, 0xfff0d0, 1.5, 0, 2.2, 0, 0.4); },
    home(g) {
      g.add(bx(2.4, 2, 2.4, C.white, -0.2, 1, 0));
      const roof = mesh(new THREE.ConeGeometry(2, 1.1, 4), M(0x6a8fb8, 0.7), -0.2, 2.55, 0); roof.rotation.y = Math.PI / 4; g.add(roof);
      g.add(bx(0.06, 1.4, 0.8, C.warm, 1.01, 0.7, 0)); g.add(bx(0.06, 0.5, 0.5, C.warm, 1.01, 1.4, -0.75)); g.add(bx(0.06, 0.5, 0.5, C.warm, 1.01, 1.4, 0.75));
      glowAt(g, 0xffd890, 2.2, 1.3, 1, 0, 0.6);
    },
    tears(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.6, 16), C.stone, -0.2, 0.3, 0));
      const pool = mesh(new THREE.CircleGeometry(0.7, 16), C.crystal, -0.2, 0.61, 0); pool.rotation.x = -Math.PI / 2; g.add(pool);
      const drops = [];
      for (let k = 0; k < 6; k++) { const d = glowAt(g, 0xcfeaff, 0.35, -0.2, 2, 0); drops.push(d); }
      anims.push((dt, t) => drops.forEach((d, i) => { const f = (t * 0.35 + i / 6) % 1; d.position.set(-0.2 + Math.cos(i * 2.1) * 0.4, 2.6 - f * 2, Math.sin(i * 2.1) * 0.4); d.material.opacity = Math.sin(f * Math.PI) * 0.9; }));
      flowers(g, -0.2, 0, 1.5, 12, 0xffffff);
    },
    pillar(g) {
      const p = mesh(new THREE.CylinderGeometry(0.35, 0.35, 14, 16, 1, true), M(0xfff8e0, 0.2, { transparent: true, opacity: 0.25, emissive: 0xfff0c0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), -0.3, 7, 0);
      p.castShadow = false; g.add(p);
      g.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.3, 16), C.stone, -0.3, 0.15, 0));
      anims.push((dt, t) => { p.material.opacity = 0.18 + Math.sin(t * 1.5) * 0.07; });
    },
    lifeRiver(g) {
      const w = mesh(new THREE.PlaneGeometry(16, 2.4), C.crystal, 0, 0.03, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (const s of [-1, 1]) {
        const tg = new THREE.Group(); tg.position.set(s * 4, 0, 0); g.add(tg);
        tg.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.4, 8), C.woodDark, 0, 1.2, 0));
        tg.add(mesh(new THREE.IcosahedronGeometry(1.5, 1), M(0x4f9e58), 0, 3, 0));
        for (let k = 0; k < 12; k++) { const a = k * 0.52; tg.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), C.gold, Math.cos(a) * 1.35, 2.7 + (k % 3) * 0.3, Math.sin(a) * 1.35)); }
      }
      anims.push((dt, t) => { w.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.15; });
    },
    glory(g) { flowers(g, 0, 0, 2.6, 40, 0xffd34a); glowAt(g, 0xffe8a0, 5, 0, 1.5, 0, 0.5); },
    pearl(g) {
      const gate = mesh(new THREE.TorusGeometry(2.4, 0.55, 16, 40), C.pearl, 0, 2.4, 0); g.add(gate);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.28, 14, 10), C.pearl, Math.cos(a) * 3.4, 2.4 + Math.sin(a) * 3.4, 0)); }
      const street = mesh(new THREE.PlaneGeometry(2.4, 7), C.gold, 0, 0.03, -3.4); street.rotation.x = -Math.PI / 2; g.add(street);
      for (const s of [-1, 1]) g.add(bx(5, 3, 0.6, M(0xc8e8f0, 0.1, { transparent: true, opacity: 0.7, emissive: 0x88c8e8, emissiveIntensity: 0.4 }), s * 5.3, 1.5, 0.4));
      const halo = glowAt(g, 0xe8f6ff, 9, 0, 3, 0.6, 0.6);
      anims.push((dt, t) => { halo.material.opacity = 0.45 + Math.sin(t) * 0.15; gate.rotation.z = t * 0.05; });
    },
    manger(g) {
      for (const [x, z] of [[-1.2, -1.2], [-1.2, 1.2], [0.6, -1.2], [0.6, 1.2]]) g.add(bx(0.15, 2, 0.15, C.woodDark, x, 1, z));
      const roof = bx(2.4, 0.12, 3, C.wood, -0.3, 2.1, 0); roof.rotation.z = 0.2; g.add(roof);
      g.add(bx(0.7, 0.45, 1.1, C.wood, -0.3, 0.3, 0)); g.add(bx(0.6, 0.1, 1.0, M(0xe8c870, 0.9, { emissive: 0xffd070, emissiveIntensity: 0.5 }), -0.3, 0.55, 0));
      glowAt(g, 0xfff0c0, 1.8, -0.3, 0.7, 0, 0.8);
      const star = glowAt(g, 0xffffff, 1.6, -0.3, 6, 0, 0.95); const s2 = fxSprite('star_06', 0xfff4c0, 1.2); star.add(s2);
      anims.push((dt, t) => { star.material.opacity = 0.8 + Math.sin(t * 3) * 0.15; });
    },
    jordan(g, st) {
      const w = mesh(new THREE.PlaneGeometry(14, 2.6), C.water, 0, 0.025, 0); w.rotation.x = -Math.PI / 2; g.add(w);
      for (let k = 0; k < 6; k++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 4), C.leaf, -6 + Math.random() * 3, 0.5, (Math.random() - 0.5) * 2.6); g.add(r); }
      const beam = mesh(new THREE.CylinderGeometry(0.2, 1.4, 12, 16, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), 0, 6, 0);
      beam.castShadow = false; g.add(beam);
      const dove = new THREE.Group();
      const body = mesh(new THREE.SphereGeometry(0.16, 10, 8), C.white); body.scale.set(0.8, 0.8, 1.5); dove.add(body);
      const wings = [];
      for (const s of [-1, 1]) { const w2 = mesh(new THREE.PlaneGeometry(0.5, 0.22), M(0xffffff, 0.6, { side: THREE.DoubleSide })); w2.rotation.x = -Math.PI / 2; w2.position.x = s * 0.28; dove.add(w2); wings.push(w2); }
      dove.visible = false; g.add(dove);
      st.dove = { dove, wings, beam, T: -1 };
    },
    mount(g) {
      const m = mesh(new THREE.SphereGeometry(2.6, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x86a865, 1), -1.2, 0, 0); m.scale.y = 0.5; g.add(m);
      for (let k = 0; k < 7; k++) { const a = -1 + k * 0.33; g.add(mesh(new THREE.DodecahedronGeometry(0.25, 0), C.stone, -1.2 + Math.cos(a) * 3, 0.15, Math.sin(a) * 3)); }
      flowers(g, -1.2, 0, 2, 14, 0xb48ae0);
    },
    loaves(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.4, 14), M(0xb08850, 0.9), -0.2, 0.55, 0));
      g.add(bx(0.5, 0.35, 1.4, C.woodDark, -0.2, 0.18, 0));
      for (let k = 0; k < 5; k++) { const l = mesh(new THREE.SphereGeometry(0.16, 10, 8), M(0xd9a35a, 0.8), -0.2 + Math.cos(k * 1.26) * 0.25, 0.8, Math.sin(k * 1.26) * 0.25); l.scale.y = 0.6; g.add(l); }
      for (const s of [-1, 1]) { const f = mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0x8aa0b0, 0.5), -0.15, 0.82, s * 0.12); f.scale.set(0.6, 0.5, 2); g.add(f); }
      glowAt(g, 0xffe0a0, 1.2, -0.2, 0.9, 0, 0.5);
    },
    lamp(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.6, 8), C.woodDark, -0.2, 1.3, 0));
      g.add(mesh(new THREE.SphereGeometry(0.28, 14, 10), C.warm, -0.2, 2.75, 0));
      const l = glowAt(g, 0xffe0a0, 5, -0.2, 2.75, 0, 0.9);
      anims.push((dt, t) => { l.material.opacity = 0.75 + Math.sin(t * 2) * 0.15; });
    },
    basin(g) {
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.3, 16), M(0xc2a07a), -0.2, 0.15, 0));
      const wtr = mesh(new THREE.CircleGeometry(0.44, 16), C.water, -0.2, 0.29, 0); wtr.rotation.x = -Math.PI / 2; g.add(wtr);
      const towel = bx(0.05, 0.4, 0.6, C.white, -0.5, 0.5, 0.7); towel.rotation.z = 0.3; g.add(towel);
      g.add(bx(0.5, 0.45, 0.5, C.wood, -0.6, 0.22, -0.9));
    },
    calvary(g) {
      const hill = mesh(new THREE.SphereGeometry(3, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x9a9070, 1), -1.4, 0, 0); hill.scale.y = 0.5; g.add(hill);
      for (const [z, h] of [[-1.6, 2.6], [0, 3.4], [1.6, 2.6]]) {
        g.add(bx(0.22, h, 0.22, C.woodDark, -1.4, 1.4 + h / 2 - 0.4, z));
        g.add(bx(0.2, 0.2, h * 0.5, C.woodDark, -1.4, 1.4 + h - 1.1, z));
      }
    },
    tomb(g, st) {
      const rock = mesh(new THREE.SphereGeometry(1.9, 14, 10), C.grey, -1, 1.1, 0); rock.scale.set(1, 0.8, 1.2); g.add(rock);
      const hole = mesh(new THREE.CircleGeometry(0.65, 18), M(0xfff0c8, 0.5, { emissive: 0xfff0c0, emissiveIntensity: 1.2 }), 0.82, 0.75, 0); hole.rotation.y = Math.PI / 2; g.add(hole);
      const stoneW = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.25, 18), C.stone, 0.75, 0.8, 1.4); stoneW.rotation.z = Math.PI / 2; g.add(stoneW);
      st.light = glowAt(g, 0xfff4d0, 3, 1.2, 0.8, 0, 0.6);
    },
    clouds(g) {
      const cm = M(0xffffff, 0.9, { emissive: 0xffffff, emissiveIntensity: 0.25 });
      for (let k = 0; k < 9; k++) g.add(mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.7, 12, 10), cm, Math.cos(k) * 2.4, 7 + Math.sin(k * 2) * 0.5, Math.sin(k) * 2.4));
      const beams = [];
      for (let k = 0; k < 3; k++) {
        const b = mesh(new THREE.CylinderGeometry(0.3, 1.6, 7, 14, 1, true), M(0xfff8e0, 0.3, { transparent: true, opacity: 0.18, emissive: 0xfff4d0, emissiveIntensity: 1, side: THREE.DoubleSide, depthWrite: false }), (k - 1) * 1.8, 3.5, (k % 2) * 0.8);
        b.castShadow = false; g.add(b); beams.push(b);
      }
      anims.push((dt, t) => beams.forEach((b, i) => { b.material.opacity = 0.12 + Math.sin(t * 0.8 + i * 2) * 0.06; }));
      flowers(g, 0, 0, 3, 18, 0xffffff);
    },
  };
  // 꽃: 한 번에 그리는 인스턴스 (그리기 횟수를 줄임)
  const flowerGeo = new THREE.SphereGeometry(0.08, 6, 4);
  const flowerMat = M(0xffffff, 0.6);
  function flowers(g, x, z, R, n, col) {
    const cols = col ? [col] : [0xf28fb0, 0xffd34a, 0xffffff, 0xb48ae0];
    const im = new THREE.InstancedMesh(flowerGeo, flowerMat, n);
    const m4 = new THREE.Matrix4(), c = new THREE.Color();
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, r = R * (0.4 + Math.random() * 0.6);
      m4.makeTranslation(x + Math.cos(a) * r, 0.16, z + Math.sin(a) * r);
      im.setMatrixAt(k, m4); im.setColorAt(k, c.set(cols[k % cols.length]));
    }
    g.add(im);
  }

  // 짐 (천로역정): 등에 멘 가방이 커졌다가 십자가 앞에서 굴러 떨어짐
  const bag = me.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1);
  const bag0 = bag ? { s: bag.scale.clone(), p: bag.position.clone() } : null;
  let burden = false, roll = null;
  const setBurden = (on) => {
    burden = on;
    if (!bag) return;
    if (on) { bag.scale.set(bag0.s.x * 1.9, bag0.s.y * 1.9, bag0.s.z * 2.3); bag.position.set(bag0.p.x, bag0.p.y + 0.06, bag0.p.z - 0.1); }
    else { bag.scale.copy(bag0.s); bag.position.copy(bag0.p); }
  };
  const effects = {
    burden() { if (!burden) { setBurden(true); hit('impactSoft_heavy_000', 0.3, 0.7); } },
    splash() { audio.splash(0.35); },
    knock() { [0, 350, 700].forEach((d) => setTimeout(() => hit('impactWood_light_000', 0.4, 0.8), d)); setTimeout(() => sfx('orb', 0.2), 1300); },
    unburden(st) {
      if (!burden || !bag) return;
      const w = new THREE.Vector3(); bag.getWorldPosition(w);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.45), bag.material);
      box.position.copy(w); box.castShadow = true; scene.add(box);
      bag.visible = false; setBurden(false);
      const to = st.tomb.clone(); st.g.localToWorld(to);
      roll = { box, from: w.clone(), to, T: 0 };
      hit('impactSoft_heavy_000', 0.4, 0.8);
      setTimeout(() => { if (bag) bag.visible = true; }, 3500);
    },
    key(st) { if (st.key) { burst(...st.key.getWorldPosition(new THREE.Vector3()).toArray()); hit('impactMetal_light_000', 0.3, 1.3); } },
    bridge(st) { st.glowT = 0; sfx('orb', 0.25, 0.9); },
    dove(st) { if (st.dove) st.dove.T = 0; },
    risen(st) { if (st.light) st.light.material.opacity = 1; hit('impactBell_heavy_000', 0.2, 1.2); },
    arrive(st, course) {
      fanfare(audio, [523, 659, 784, 1047], 1.2, 0.2, 0.06);
      for (let i = 0; i < 14; i++) setTimeout(() => burst(st.x + (Math.random() - 0.5) * 6, 0.5 + Math.random() * 3, st.z + (Math.random() - 0.5) * 6), i * 120);
      if (course.after) setTimeout(() => showVerse('course-' + course.id + '-after', { cooldown: 0, title: course.name }), 12000);
    },
  };

  // 정거장 세우기
  const live = [];
  for (const [id, course] of Object.entries(COURSES)) {
    const tr = TRAILS[id];
    course.id = id;
    if (course.after) VERSES['course-' + id + '-after'] = course.after;
    tr.stations.forEach((st, i) => {
      const [name, verse, kind, fx] = course.st[i];
      const key = 'course-' + id + '-' + i;
      VERSES[key] = verse;
      const g = new THREE.Group();
      const base = st.side ? st.show : (i === tr.stations.length - 1 ? { x: st.x + st.dir.x * 5, z: st.z + st.dir.z * 5 } : st);
      g.position.set(base.x, G0, base.z);
      // +z = 길 앞, side 정거장은 +x가 길 쪽을 보도록
      g.rotation.y = Math.atan2(st.dir.x, st.dir.z) + (st.side < 0 ? Math.PI : 0);
      scene.add(g);
      const S = { ...st, g, name, key, fx, i };
      if (scenes[kind]) scenes[kind](g, S);
      g.traverse((c) => { if (c.isMesh) { c.castShadow = !c.material.transparent; c.receiveShadow = true; } });
      // 길가 등불: 지나가면 켜짐
      const lp = st.side ? { x: st.x - st.right.x * st.side * 1.8, z: st.z - st.right.z * st.side * 1.8 } : { x: st.x + st.right.x * 1.8, z: st.z + st.right.z * 1.8 };
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6), MAT.woodDark); post.position.set(lp.x, G0 + 0.65, lp.z); scene.add(post);
      const bulbM = M(0x8a8070, 0.5, { emissive: course.color, emissiveIntensity: 0 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bulbM); bulb.position.set(lp.x, G0 + 1.38, lp.z); scene.add(bulb);
      const halo = fxSprite('light_01', course.color, 0.9 + i * 0.08); halo.position.copy(bulb.position); halo.material.opacity = 0; scene.add(halo);
      S.lit = (on) => { bulbM.emissiveIntensity = on ? 1.3 : 0; halo.material.opacity = on ? 0.75 : 0; };
      S.title = `${course.name} ${i + 1}/${tr.stations.length} · ${name}`;
      S.course = course; S.near = false;
      live.push(S);
    });
    // 길 입구: 나무 아치와 코스 빛깔 등
    const p0 = tr.samples.find((q) => Math.hypot(q.x, q.z) > R_PARK + 2.2) || tr.samples[0];
    const p1 = tr.samples[tr.samples.indexOf(p0) + 2] || p0;
    const ang = Math.atan2(p1.x - p0.x, p1.z - p0.z);
    const arch = new THREE.Group(); arch.position.set(p0.x, G0, p0.z); arch.rotation.y = ang; scene.add(arch);
    for (const s of [-1, 1]) arch.add(bx(0.2, 2.8, 0.2, C.woodDark, s * 1.45, 1.4, 0));
    arch.add(bx(3.3, 0.22, 0.26, C.woodDark, 0, 2.85, 0));
    const lamp = mesh(new THREE.SphereGeometry(0.2, 12, 10), M(0xffffff, 0.4, { emissive: course.color, emissiveIntensity: 1.2 }), 0, 2.45, 0); arch.add(lamp);
    const lg = fxSprite('light_01', course.color, 1.8); lg.position.set(0, 2.45, 0); lg.material.opacity = 0.8; arch.add(lg);
    shadow(arch);
  }

  steps.push((dt, t) => {
    for (const f of anims) f(dt, t);
    for (const S of live) {
      const d = Math.min(Math.hypot(me.x - S.x, me.z - S.z), S.side ? Math.hypot(me.x - S.show.x, me.z - S.show.z) + 0.6 : 99);
      const isEnd = S.i === TRAILS[S.course.id].stations.length - 1;
      const inside = d < (isEnd ? 5 : 2.8);
      if (inside && !S.near) {
        S.lit(true);
        if (showVerse(S.key, { cooldown: 40, delay: 0.2, title: S.title }) !== false || S.fx === 'burden' || S.fx === 'unburden') {
          if (S.fx && effects[S.fx]) effects[S.fx](S, S.course);
        }
      }
      S.near = inside;
      if (S.glowT >= 0 && S.beam) { S.glowT += dt; S.beam.emissiveIntensity = Math.max(0, Math.sin(Math.min(1, S.glowT / 2) * Math.PI / 2)) * 0.6; }
      if (S.dove && S.dove.T >= 0) {
        const D = S.dove; D.T += dt;
        D.dove.visible = D.T < 10;
        const k = ease(D.T / 3);
        D.dove.position.set(0, 9 - k * 6.8, 0);
        D.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * 14) * (1 - k * 0.7) * (i ? 1 : -1); });
        D.beam.material.opacity = Math.min(0.3, D.T * 0.15) * (D.T < 9 ? 1 : Math.max(0, 1 - (D.T - 9)));
        if (D.T > 10) { D.T = -1; D.beam.material.opacity = 0; }
      }
    }
    // 짐이 굴러 무덤으로
    if (roll) {
      roll.T += dt;
      const k = Math.min(1, roll.T / 2.2);
      roll.box.position.lerpVectors(roll.from, roll.to, ease(k));
      roll.box.position.y = Math.max(G0 + 0.3, roll.from.y * (1 - k * 3)) ;
      roll.box.rotation.x += dt * 6;
      if (k >= 1) { scene.remove(roll.box); roll = null; sfx('orb', 0.25, 1.2); }
    }
    // 길을 벗어나 건물 쪽으로 돌아가면 짐도 내려놓음
    if (burden && Math.hypot(me.x, me.z) < R_PARK - 6) setBurden(false);
  });
}
