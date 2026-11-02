// 지갑과 가게 (2026-11): 성경 시대의 돈(데나리온·세겔·므나·달란트)으로 소모품을 사고, 받은 물품을 팔아 돈으로 바꿈
//   돈은 훈련·부탁·숲길 시험을 마치면 받고, 증거의 물가에서 낚은 고기 입에서 하루 한 번 한 세겔(마 17:27)
//   가게: 정원 동쪽 간식 가게 곁의 루디아(두아디라성의 자주 장사, 행 16:14)
//   소모품: 등잔 기름(숲길 시험에서 틀린 말씀 하나 걷어 냄) · 보리떡(넘어져도 그 자리에서 일어남) · 향(기도 +1)
import * as THREE from 'three';
import { PARK, isFree } from './layout.js';
import { nameTag } from './tutorial.js';
import { GOODS, ITEMS, MONEY, SELL, fmtMoney, earn, spend, addGood, useGood, sellItem, openWallet, addStat } from './profile.js';
import { showVerse, VERSES } from './verses.js';

VERSES['shop-lydia'] = ['두아디라성의 자주 장사로서 하나님을 공경하는 루디아라 하는 한 여자가 들었는데 주께서 그 마음을 열어 바울의 말을 청종하게 하신지라', '사도행전 16:14'];
VERSES['shop-first'] = ['네 재물과 네 소산물의 처음 익은 열매로 여호와를 공경하라', '잠언 3:9'];
for (const [id, g] of Object.entries(GOODS)) VERSES['good-' + id] = g.verse;

export function initShop(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, act, busy, onChange } = K;
  const granted = openWallet(profile); // 지갑이 처음 생기면 그동안 한 일만큼 채워 줌
  if (granted) setTimeout(() => toast(`지갑이 생겼어요! 그동안 한 일로 ${fmtMoney(granted)}를 받았어요. 정원 동쪽 가게의 루디아에게 가 보세요.`, 6), 6000);

  // ---------- 루디아 ----------
  const zn = PARK.market;
  let at = zn.at(6.4, 0.2);
  for (let k = 0; k < 20 && !isFree(at.x, at.z); k++) at = zn.at(6.4 + (k % 2 ? 1 : -1) * (k * 0.3), 0.2 - k * 0.15);
  const lydia = makeChar({ hoodie: 0x7a3a7a, hair: 0x2a1a14, bag: 0x7a3a7a, style: 0, pants: 0x4a3a48 }, at.x, at.z);
  lydia.av.userData.body.children.find((c) => c.geometry && c.geometry.type === 'BoxGeometry' && c.position.z < -0.1).visible = false;
  lydia.tag = nameTag('루디아'); lydia.av.add(lydia.tag);
  lydia.home = { x: at.x, z: at.z }; lydia.face0 = Math.atan2(-zn.n.x, -zn.n.z); lydia.face = lydia.face0;
  npcs.push(lydia);
  // 머리 위의 작은 금화 표시
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xe6c35a, metalness: 0.7, roughness: 0.3, emissive: 0x6a4a10, emissiveIntensity: 0.5 }));
  coin.rotation.x = Math.PI / 2; coin.position.y = 2.75; lydia.av.add(coin);
  const near = (d = 3) => Math.hypot(me.x - lydia.x, me.z - lydia.z) < d;

  // ---------- 가게 창 ----------
  const box = document.createElement('div');
  box.id = 'shop'; box.hidden = true;
  document.body.appendChild(box);
  let tab = 'buy';
  function render(msg = '') {
    const bag = profile.bag || {};
    const sellable = profile.items.filter((id) => SELL(id) > 0);
    box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button>
      <h3>루디아의 가게</h3>
      <p class="sub">두아디라에서 온 자주 장사 루디아예요. 주께서 제 마음을 열어 주셨지요. 필요한 것을 골라 보세요.</p>
      <p class="purse">지갑 <b>${fmtMoney(profile.coins)}</b></p>
      <div class="tabs"><button data-tab="buy" class="${tab === 'buy' ? 'on' : ''}">사기</button><button data-tab="sell" class="${tab === 'sell' ? 'on' : ''}">팔기</button><button data-tab="money" class="${tab === 'money' ? 'on' : ''}">성경의 돈</button></div>
      <div class="list">${tab === 'buy'
        ? Object.entries(GOODS).map(([id, g]) => `<div class="it"><div><b>${g.name}</b> <span class="have">${bag[id] ? `가진 것 ${bag[id]}` : ''}</span><small>${g.use}</small></div><button data-buy="${id}" ${profile.coins < g.price ? 'disabled' : ''}>${g.price} 데나리온</button></div>`).join('')
        : tab === 'sell'
          ? (sellable.length ? sellable.map((id) => `<div class="it"><div><b>${ITEMS[id] ? ITEMS[id].name : id}</b><small>${ITEMS[id] ? ITEMS[id].verse[1] : ''}</small></div><button data-sell="${id}">${SELL(id)} 데나리온 받기</button></div>`).join('') : '<p class="none">팔 수 있는 물품이 아직 없어요. 훈련장과 부탁에서 받을 수 있어요.</p>')
          : `<p class="money">${MONEY.map((m) => `<span><b>1 ${m.name}</b> = ${m.v === 1 ? '하루 품삯, 1 드라크마' : `${m.v.toLocaleString()} 데나리온`} <em>${m.ref}</em></span>`).join('')}<span><b>2 렙돈</b> 가난한 과부가 넣은 전부 <em>누가복음 21:2</em></span></p>
             <p class="sub">돈은 훈련장(5)·부탁(3)·숲길 시험(3~8)을 마치면 받아요. 증거의 물가에서 배에 앉아 낚시하면 고기 입에서 하루 한 번 한 세겔을 얻어요.</p>`}</div>
      <p class="msg">${msg}</p></div>`;
  }
  box.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    if (e.target === box || e.target.classList.contains('close')) return close();
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; return render(); }
    const b = e.target.closest('[data-buy]');
    if (b && !b.disabled) {
      const id = b.dataset.buy, g = GOODS[id];
      if (!spend(profile, g.price)) return render('돈이 모자라요.');
      addGood(profile, id); sfx('cup', 0.2, 1.3); save(); onChange?.();
      return render(`${g.name}을(를) 샀어요. ${g.use}.`);
    }
    const s = e.target.closest('[data-sell]');
    if (s) {
      const id = s.dataset.sell, v = sellItem(profile, id);
      if (!v) return;
      sfx('share', 0.2); save(); onChange?.();
      return render(`${ITEMS[id] ? ITEMS[id].name : id}을(를) 팔고 ${v} 데나리온을 받았어요.`);
    }
  });
  addEventListener('keydown', (e) => { if (!box.hidden && e.code === 'Escape') { e.stopPropagation(); close(); } }, true);
  function open() {
    tab = 'buy'; render(); box.hidden = false;
    lydia.face = Math.atan2(me.x - lydia.x, me.z - lydia.z);
    showVerse('shop-lydia', { cooldown: 120, delay: 0.4 });
  }
  function close() { box.hidden = true; }

  // ---------- 소모품 쓰기 (내 카드에서) ----------
  function use(id) {
    if (id === 'spice') {
      if (!useGood(profile, 'spice')) return;
      act('pray', 6);
      for (let q = 0; q < 8; q++) setTimeout(() => burst(me.x + (Math.random() - 0.5) * 0.6, me.y + 1.2 + q * 0.25, me.z + (Math.random() - 0.5) * 0.6), q * 220);
      addStat(profile, 'prayer', 1); save(); onChange?.();
      showVerse('good-spice', { cooldown: 0, title: '향을 피우고 기도해요' });
      toast('기도 +1', 2.5);
      return;
    }
    toast(`${GOODS[id].name}: ${GOODS[id].use}`, 4); // 기름·떡은 숲길 시험에서 저절로 씀
  }

  // ---------- 고기 입의 한 세겔 (하루 한 번) ----------
  function shekel() {
    const day = new Date().toISOString().slice(0, 10);
    if (profile.fishDay === day) return false;
    profile.fishDay = day; earn(profile, 4); save(); onChange?.();
    setTimeout(() => toast('한 세겔(4 데나리온)을 지갑에 넣었어요', 3), 1500);
    return true;
  }

  return {
    open, close, use, shekel, lydia,
    active: () => !box.hidden,
    available: () => (near() && me.state !== 'walk' && !busy?.() ? [['shop', 'shop']] : []),
    actions: { shop: open },
    step() { if (!box.hidden && !near(5)) close(); if (box.hidden && near(6) && me.state !== 'walk') lydia.face = Math.atan2(me.x - lydia.x, me.z - lydia.z); },
  };
}
