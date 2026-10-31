// 카페에 어울리는 잔잔한 찬양 연주곡 (Pixabay 무료 라이선스, 출처는 assets/music/CREDITS.md)
// 처음에는 꺼져 있고, 위쪽 음표 버튼으로 켜고 끔. 곡 파일이 없으면 버튼을 숨김
export const PLAYLIST = [
  ['amazing-grace', '나 같은 죄인 살리신', 'Amazing Grace'],
  ['it-is-well', '내 평생에 가는 길', 'It Is Well with My Soul'],
  ['crown-him', '면류관 벗어서', 'Crown Him with Many Crowns · 피아노'],
  ['worship', 'Worship', '잔잔한 경배 연주'],
  ['bible-soundtrack', 'Bible Soundtrack', '말씀 묵상 연주'],
  ['jerusalem', 'Jerusalem', '예루살렘'],
  ['o-holy-night', '오 거룩한 밤', 'O Holy Night · 피아노'],
].map(([n, title, sub]) => ({ src: `assets/music/${n}.mp3`, title, sub }));

const VOLUME = 0.32;

// 음표 버튼을 누르면 곡 목록이 열림: 곡을 고르면 그 곡부터 차례로, 맨 위 단추로 끄고 켬
export function initMusic(button, icons) {
  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0;
  let idx = Math.floor(Math.random() * PLAYLIST.length), on = false, fails = 0, fadeT = 0;
  try {
    on = localStorage.getItem('navs-cafe-music') === 'on';
    const saved = PLAYLIST.findIndex((t) => t.src === localStorage.getItem('navs-cafe-track'));
    if (saved >= 0) idx = saved;
  } catch (e) { /* 무시 */ }
  const panel = document.createElement('div');
  panel.id = 'musicPanel';
  panel.hidden = true;
  document.body.appendChild(panel);
  const save = () => { try { localStorage.setItem('navs-cafe-music', on ? 'on' : 'off'); localStorage.setItem('navs-cafe-track', PLAYLIST[idx].src); } catch (e) { /* 무시 */ } };
  const paint = () => {
    button.innerHTML = on ? icons.music : icons.musicOff;
    button.setAttribute('aria-label', 'music');
    button.classList.toggle('on', on);
    panel.innerHTML = '';
    const head = document.createElement('button');
    head.className = 'mtoggle' + (on ? ' on' : '');
    head.innerHTML = (on ? icons.music : icons.musicOff) + '<span>' + (on ? '음악 끄기' : '음악 켜기') + '</span>';
    head.addEventListener('pointerdown', (e) => { e.stopPropagation(); setOn(!on); });
    panel.appendChild(head);
    PLAYLIST.forEach((t, k) => {
      const b = document.createElement('button');
      b.className = 'mtrack' + (k === idx && on ? ' now' : '');
      b.innerHTML = `<b>${t.title}</b><small>${t.sub}</small>`;
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); idx = k; setOn(true, true); });
      panel.appendChild(b);
    });
  };
  const fadeTo = (v, then) => {
    cancelAnimationFrame(fadeT);
    const from = audio.volume, t0 = performance.now();
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / 1500);
      audio.volume = from + (v - from) * u;
      if (u < 1) fadeT = requestAnimationFrame(step); else if (then) then();
    };
    step();
  };
  const play = () => {
    audio.src = PLAYLIST[idx % PLAYLIST.length].src;
    audio.volume = 0;
    audio.play().then(() => { fails = 0; fadeTo(VOLUME); }).catch(() => {});
    save(); paint();
  };
  function setOn(v, restart) {
    const was = on;
    on = v;
    save(); paint();
    if (on && (!was || restart)) { if (was) fadeTo(0, play); else play(); }
    if (!on) fadeTo(0, () => audio.pause());
  }
  audio.addEventListener('ended', () => { idx = (idx + 1) % PLAYLIST.length; play(); });
  audio.addEventListener('error', () => {
    if (++fails >= PLAYLIST.length) { button.hidden = true; panel.hidden = true; on = false; return; } // 곡 파일이 하나도 없음
    idx = (idx + 1) % PLAYLIST.length; if (on) play();
  });
  button.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
  });
  // 목록 밖을 누르면 닫힘
  window.addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && e.target !== button) panel.hidden = true; }, true);
  paint();
  // 입장 버튼을 누른 뒤(사용자 동작 이후)에만 자동으로 이어 재생
  return { resume: () => { if (on) play(); } };
}
