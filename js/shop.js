// 지갑과 가게 (2026-11): 성경 시대의 돈(데나리온·세겔·므나·달란트)으로 소모품을 사고, 받은 물품을 팔아 돈으로 바꿈
//   돈은 훈련·부탁·숲길 시험을 마치면 받고, 증거의 물가에서 낚은 고기 입에서 하루 한 번 한 세겔(마 17:27)
//   가게: 정원 동쪽 간식 가게 곁의 루디아(두아디라성의 자주 장사, 행 16:14)
//   소모품: 등잔 기름(숲길 시험에서 틀린 말씀 하나 걷어 냄) · 보리떡(넘어져도 그 자리에서 일어남) · 향(기도 +1)
//   다니기 (2026-11 둘째): 병거 삯(고른 곳으로 순간이동, 행 8:28) · 나귀 빌리기(2분 빨리, 마 21:2) · 안약(3분 동안 할 일의 사람에게 빛기둥, 계 3:18)
import * as THREE from 'three';
import { PARK, isFree, floorY, regionIdAt } from './layout.js';
import { village } from './villages/registry.js';
import { nearestFree } from './nav.js';
import { nameTag } from './tutorial.js';
import { GOODS, ITEMS, MONEY, SELL, fmtMoney, earn, spend, addGood, useGood, sellItem, openWallet, addStat } from './profile.js';
import { showVerse, VERSES } from './verses.js';
import { COS, COS_KINDS, cosApi, cosLocked } from './cosmetic.js';

VERSES['shop-lydia'] = ['두아디라성의 자주 장사로서 하나님을 공경하는 루디아라 하는 한 여자가 들었는데 주께서 그 마음을 열어 바울의 말을 청종하게 하신지라', '사도행전 16:14'];
VERSES['shop-first'] = ['네 재물과 네 소산물의 처음 익은 열매로 여호와를 공경하라', '잠언 3:9'];
for (const [id, g] of Object.entries(GOODS)) VERSES['good-' + id] = g.verse;
for (const [id, g] of Object.entries(COS)) VERSES['cos-' + id] = g.verse;

export function initShop(K) {
  const { scene, me, makeChar, npcs, profile, save, toast, sfx, burst, act, busy, onChange, guides } = K;
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
  let only = null; // 고른 물품만 여는 창이면 { ids, who(안내인 NPC) }: 사기만, 값·지갑은 루디아와 같은 길
  function render(msg = '') {
    const bag = profile.bag || {};
    const sellable = profile.items.filter((id) => SELL(id) > 0);
    if (only) {
      box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button>
      <h3>수레 짐</h3>
      <p class="sub">루디아의 가게에서 받아 온 짐이에요. 값도 같고 지갑도 하나예요. 팔기와 꾸미기는 정원 동쪽 루디아에게서만 해요.</p>
      <p class="purse">지갑 <b>${fmtMoney(profile.coins)}</b></p>
      <div class="list">${only.ids.filter((id) => GOODS[id]).map((id) => { const g = GOODS[id]; return `<div class="it"><div><b>${g.name}</b> <span class="have">${bag[id] ? `가진 것 ${bag[id]}` : ''}</span><small>${g.use}</small></div><button data-buy="${id}" ${profile.coins < g.price ? 'disabled' : ''}>${g.price} 데나리온</button></div>`; }).join('')}</div>
      <p class="msg">${msg}</p></div>`;
      return;
    }
    box.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button>
      <h3>루디아의 가게</h3>
      <p class="sub">두아디라에서 온 자주 장사 루디아예요. 주께서 제 마음을 열어 주셨지요. 필요한 것을 골라 보세요.</p>
      <p class="purse">지갑 <b>${fmtMoney(profile.coins)}</b></p>
      <div class="tabs"><button data-tab="buy" class="${tab === 'buy' ? 'on' : ''}">사기</button><button data-tab="cos" class="${tab === 'cos' ? 'on' : ''}">꾸미기</button><button data-tab="sell" class="${tab === 'sell' ? 'on' : ''}">팔기</button><button data-tab="money" class="${tab === 'money' ? 'on' : ''}">성경의 돈</button></div>
      <div class="list">${tab === 'buy'
        ? Object.entries(GOODS).map(([id, g]) => `<div class="it"><div><b>${g.name}</b> <span class="have">${bag[id] ? `가진 것 ${bag[id]}` : ''}</span><small>${g.use}</small></div><button data-buy="${id}" ${profile.coins < g.price ? 'disabled' : ''}>${g.price} 데나리온</button></div>`).join('')
        : tab === 'cos'
          ? `<p class="sub">날개·탈것·머리 장식은 능력이 없는 꾸미기예요. 사면 바로 갖추고, 내 카드에서 벗거나 바꿀 수 있어요. 다른 사람에게도 보여요.</p>${COS_KINDS.map(([k, kn]) => `<p class="kind">${kn}</p>${Object.entries(COS).filter(([, g]) => g.kind === k).map(([id, g]) => { const own = cosApi?.owned(id), lock = cosLocked(profile, id); return `<div class="it"><div><b>${g.name}</b> <span class="have">${own ? (cosApi.worn(id) ? '갖춤' : '가짐') : lock ? `${lock}부터` : ''}</span><small>${g.verse[1]}</small></div>${own ? `<button data-wear="${id}">${cosApi.worn(id) ? '벗기' : '갖추기'}</button>` : `<button data-cos="${id}" ${profile.coins < g.price || lock ? 'disabled' : ''}>${g.price} 데나리온</button>`}</div>`; }).join('')}`).join('')}`
          : tab === 'sell'
          ? (sellable.length ? sellable.map((id) => `<div class="it"><div><b>${ITEMS[id] ? ITEMS[id].name : id}</b><small>${ITEMS[id] ? ITEMS[id].verse[1] : ''}</small></div><button data-sell="${id}">${SELL(id)} 데나리온 받기</button></div>`).join('') : '<p class="none">팔 수 있는 물품이 아직 없어요. 훈련장과 부탁에서 받을 수 있어요.</p>')
          : `<p class="money">${MONEY.map((m) => `<span><b>1 ${m.name}</b> = ${m.v === 1 ? '하루 품삯, 1 드라크마' : `${m.v.toLocaleString()} 데나리온`} <em>${m.ref}</em></span>`).join('')}<span><b>2 렙돈</b> 가난한 과부가 넣은 전부 <em>누가복음 21:2</em></span></p>
             <p class="sub">돈은 훈련장(5)·부탁(3)·숲길 시험(3~8)을 마치면 받아요. 증거의 물가에서 배에 앉아 낚시하면 고기 입에서 하루 한 번 한 세겔을 얻어요.</p>`}</div>
      <p class="msg">${msg}</p></div>`;
  }
  box.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target === box || e.target.classList.contains('close')) return close();
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; return render(); }
    const b = e.target.closest('[data-buy]');
    if (b && !b.disabled) {
      const id = b.dataset.buy, g = GOODS[id];
      if (only && !only.ids.includes(id)) return;
      if (!spend(profile, g.price)) return render('돈이 모자라요.');
      addGood(profile, id); sfx('cup', 0.2, 1.3); save(); onChange?.();
      return render(`${g.name}을(를) 샀어요. ${g.use}.`);
    }
    const cb = e.target.closest('[data-cos]');
    if (cb && !cb.disabled && cosApi) {
      const id = cb.dataset.cos, msg = cosApi.buy(id);
      if (cosApi.owned(id)) { sfx('cup', 0.2, 1.5); save(); onChange?.(); showVerse('cos-' + id, { cooldown: 0, title: COS[id].name }); }
      return render(msg);
    }
    const wb = e.target.closest('[data-wear]');
    if (wb && cosApi) return render(cosApi.toggle(wb.dataset.wear));
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
    only = null; tab = 'buy'; render(); box.hidden = false;
    lydia.face = Math.atan2(me.x - lydia.x, me.z - lydia.z);
    showVerse('shop-lydia', { cooldown: 120, delay: 0.4 });
  }
  // 고른 물품만 여는 창 (수레꾼 두기고의 수레 짐 등): ids는 GOODS의 id, who는 곁에 서 있는 안내인(멀어지면 닫힘)
  function openGoods(ids, who) {
    only = { ids: ids || [], who }; render(); box.hidden = false;
  }
  function close() { box.hidden = true; only = null; }

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
    if (id === 'chariot') return openTrip();
    if (id === 'donkey') {
      if (!useGood(profile, 'donkey')) return;
      me.donkeyUntil = performance.now() + 120000;
      sfx('impact/impactSoft_medium_000', 0.2, 1.4); burst(me.x, me.y + 0.6, me.z);
      showVerse('good-donkey', { cooldown: 0, title: '나귀를 빌렸어요' });
      toast('2분 동안 나귀를 타고 빨리 다녀요', 3); save(); onChange?.();
      return;
    }
    if (id === 'salve') {
      if (!useGood(profile, 'salve')) return;
      salveUntil = performance.now() + 180000;
      const n = (guides?.() || []).length;
      showVerse('good-salve', { cooldown: 0, title: '눈에 안약을 발랐어요' });
      const pn = K.pieceLeft?.() | 0; // 마을 안이면 못 찾은 두루마리 조각 수
      toast(pn ? '눈이 밝아졌어요! 못 찾은 두루마리 조각 가운데 가까운 셋 위에 3분 동안 빛기둥이 서요' : n ? `눈이 밝아졌어요! 할 일이 남은 사람 ${n}명의 머리 위에 3분 동안 빛기둥이 서요` : '눈이 밝아졌지만, 지금은 할 일이 남은 사람이 없어요', 4.5);
      save(); onChange?.();
      return;
    }
    toast(`${GOODS[id].name}: ${GOODS[id].use}`, 4); // 기름·떡은 숲길 시험에서 저절로 씀
  }

  // ---------- 병거: 고른 곳으로 (순간이동) ----------
  // 병거는 같은 마을 안에서만 (2026-11 요한복음 마을): 목적지 목록과 자리는 마을 등록부의 trips (js/villages/<id>.js)
  const tripsHere = () => (village(regionIdAt(me.x, me.z)) || village('base')).trips;
  const placesHere = () => tripsHere()?.list() || [];
  const placeOf = (id) => tripsHere()?.at(id) || null; // trips가 없는 마을이면 null
  const trip = document.createElement('div');
  trip.id = 'trip'; trip.hidden = true;
  document.body.appendChild(trip);
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;background:#f6ecd8;opacity:0;pointer-events:none;transition:opacity .45s;z-index:72';
  document.body.appendChild(veil);
  function openTrip() {
    if (!(profile.bag?.chariot > 0)) { toast('병거 삯이 없어요. 루디아의 가게에서 살 수 있어요', 3.5); return; }
    if (busy?.() || me.climb) { toast('지금 하던 일을 마친 뒤에 병거를 타요', 3); return; }
    if (!placesHere().length) { toast('이 마을에서는 병거를 쓸 수 없어요', 3); return; } // trips가 없는 마을
    trip.innerHTML = `<div class="pad"><button class="close" aria-label="닫기">×</button><h3>병거 타기</h3><p class="sub">어디로 갈까요? (병거 삯 ${profile.bag.chariot}개)</p><div class="list">${placesHere().map(([id, n]) => `<button data-to="${id}">${n}</button>`).join('')}</div></div>`;
    trip.hidden = false;
  }
  trip.addEventListener('pointerdown', (e) => e.stopPropagation()); // 끌어서 내려 보기(스크롤)가 되도록, 고르기는 click에서
  trip.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target === trip || e.target.classList.contains('close')) { trip.hidden = true; return; }
    const b = e.target.closest('[data-to]'); if (!b) return;
    trip.hidden = true;
    go(b.dataset.to, b.textContent);
  });
  function go(id, name) {
    const at = placeOf(id); if (!at) return; // 삯을 쓰기 전에 확인
    if (!useGood(profile, 'chariot')) return;
    const { p, look } = at;
    const to = nearestFree(p) || p;
    if (me.seat) K.standUp?.(me);
    me.path = []; me.task = null; me.action = null; me.state = 'idle';
    veil.style.opacity = '1'; sfx('impact/impactSoft_medium_000', 0.2, 0.9);
    setTimeout(() => {
      me.x = to.x; me.z = to.z; me.y = floorY(to.x, to.z); me.vy = 0; me.hop = 0;
      me.face = Math.atan2(look.x - to.x, look.z - to.z);
      K.camBehind?.();
      veil.style.opacity = '0';
      showVerse('good-chariot', { cooldown: 300, title: '병거를 타고 왔어요' });
      toast(`${name}에 왔어요 (남은 병거 삯 ${profile.bag.chariot | 0})`, 3);
      save(); onChange?.();
    }, 650);
  }
  addEventListener('keydown', (e) => { if (!trip.hidden && e.code === 'Escape') { e.stopPropagation(); trip.hidden = true; } }, true);

  // ---------- 안약: 할 일이 남은 사람 머리 위의 빛기둥 ----------
  let salveUntil = 0;
  const beams = new Map();
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, 14, 12, 1, true);
  function stepSalve(t) {
    const on = performance.now() < salveUntil;
    const list = on ? guides?.() || [] : [];
    const want = new Set(list);
    for (const [n, b] of beams) if (!want.has(n)) { n.av.remove(b); beams.delete(n); }
    for (const n of list) {
      let b = beams.get(n);
      if (!b) { b = new THREE.Mesh(beamGeo, beamMat); b.position.y = 8.5; b.renderOrder = 4; n.av.add(b); beams.set(n, b); }
    }
    beamMat.opacity = 0.25 + Math.sin(t * 3) * 0.1;
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
    open, openGoods, close, use, shekel, lydia,
    // 이 마을의 그 자리로 병거 (T02 J1 요한 마을 다음 이야기 카드): id는 trips 목록 id ('j:cana'). 삯이 없거나 자리가 없으면 false
    rideTo(id) { const pl = placesHere().find(([k]) => k === id); if (!pl || !(profile.bag?.chariot > 0)) return false; go(id, pl[1]); return true; },
    salveOn: () => performance.now() < salveUntil, // 안약 효과가 켜져 있는가 (마을의 두루마리 조각 빛기둥이 읽음)
    available: () => (near() && me.state !== 'walk' && !busy?.() ? [['shop', 'shop']] : []),
    actions: { shop: open },
    active: () => !box.hidden || !trip.hidden,
    step(dt, t) { stepSalve(t || 0); if (!box.hidden && (only ? Math.hypot(me.x - only.who.x, me.z - only.who.z) > 5 : !near(5))) close(); if (box.hidden && near(6) && me.state !== 'walk') lydia.face = Math.atan2(me.x - lydia.x, me.z - lydia.z); },
  };
}
