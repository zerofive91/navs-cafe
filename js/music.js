// 잔잔한 찬송가·성가곡 악기 연주 재생 목록 (저작권이 끝났거나 자유 이용 허락된 녹음만, 출처는 assets/music/CREDITS.md)
// 처음에는 꺼져 있고, 위쪽 음표 버튼으로 켜고 끔. 곡 파일이 없으면 버튼을 숨김
export const PLAYLIST = [
  'amazing-grace',        // Amazing Grace — 미 공군 군악대 현악 (퍼블릭 도메인)
  'fairest-lord-jesus',   // 주 예수보다 더 귀한 것은 없네(Schönster Herr Jesu) — 미 육군 군악대 (퍼블릭 도메인)
  'jesu-joy',             // 예수, 인간 소망의 기쁨 — 피아노 (CC BY-SA 4.0)
  'be-thou-my-vision',    // 내 맘의 주여 소망 되소서 — 기타 (퍼블릭 도메인)
  'eternal-father',       // Eternal Father, Strong to Save — 미 해병대 군악대 (퍼블릭 도메인)
  'thine-be-the-glory',   // 주님께 영광 — 오르간 (CC BY 3.0)
  'nearer-my-god',        // 내 주를 가까이 하게 함은 — 미 공군 군악대 (퍼블릭 도메인)
].map((n) => `assets/music/${n}.mp3`);

const VOLUME = 0.32;

export function initMusic(button, icons) {
  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0;
  let order = [...PLAYLIST].sort(() => Math.random() - 0.5);
  let idx = 0, on = false, fails = 0, fadeT = 0;
  try { on = localStorage.getItem('navs-cafe-music') === 'on'; } catch (e) { /* 무시 */ }
  const paint = () => { button.innerHTML = on ? icons.music : icons.musicOff; button.setAttribute('aria-label', on ? 'music off' : 'music on'); button.classList.toggle('on', on); };
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
    audio.src = order[idx % order.length];
    audio.play().then(() => { fails = 0; fadeTo(VOLUME); }).catch(() => {});
  };
  audio.addEventListener('ended', () => { idx++; play(); });
  audio.addEventListener('error', () => {
    if (++fails >= order.length) { button.hidden = true; on = false; return; } // 곡 파일이 하나도 없음
    idx++; if (on) play();
  });
  button.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    on = !on;
    try { localStorage.setItem('navs-cafe-music', on ? 'on' : 'off'); } catch (err) { /* 무시 */ }
    paint();
    if (on) play(); else fadeTo(0, () => audio.pause());
  });
  paint();
  // 입장 버튼을 누른 뒤(사용자 동작 이후)에만 자동으로 이어 재생
  return { resume: () => { if (on) play(); } };
}
