// 글자 없는 버튼 아이콘 (SVG)
const svg = (body) =>
  `<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  map: svg('<path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3z"/><path d="M11 5v19M21 8v19"/><circle cx="16" cy="14" r="1.6"/>'),
  gear: svg('<path d="M10 6h12l2 8-8 4-8-4z"/><path d="M8 14v8l8 5 8-5v-8"/><path d="M16 18v9"/>'),
  block: svg('<path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8z"/><path d="M16 9v14M11 15h10"/>'),
  slash: svg('<path d="M24 4l4 4-15 15-4-4z"/><path d="M9 19l-4 4 4 4 4-4M5 27l-2 2"/>'),
  pick: svg('<circle cx="16" cy="20" r="7"/><path d="M16 13c0-4 2-7 6-8"/><path d="M16 12c-3-3-7-2-8 0 3 2 6 2 8 0z"/>'),
  gather: svg('<path d="M5 18h22l-3 9H8z"/><circle cx="11" cy="12" r="1.6"/><circle cx="17" cy="8" r="1.6"/><circle cx="21" cy="13" r="1.6"/><circle cx="15" cy="14" r="1.6"/>'),
  strike: svg('<path d="M8 28L22 6"/><path d="M20 22c0 3 2 5 4 5s4-2 4-5-4-8-4-8-4 5-4 8z"/>'),
  shrug: svg('<rect x="9" y="9" width="14" height="14" rx="3"/><path d="M12 9V6h8v3"/><path d="M16 26v3M11 27l-2 2M21 27l2 2"/>'),
  gift: svg('<rect x="5" y="13" width="22" height="14" rx="2"/><path d="M4 9h24v4H4zM16 9v18"/><path d="M16 9c-2-5-8-5-7-1s7 1 7 1 6 3 7-1-5-4-7 1"/>'),
  receive: svg('<path d="M8 28V6h16v22"/><path d="M4 28h24"/><circle cx="20" cy="17" r="1.2"/><path d="M14 13a3 3 0 0 1 6 0c0 3-3 4-3 6" opacity=".0"/><path d="M13 16c0-2 3-3 3 0 0-3 3-2 3 0s-3 4-3 4-3-2-3-4z"/>'),
  recline: svg('<path d="M4 22l6-2 8 1 10-6"/><path d="M6 26h20"/><circle cx="9" cy="14" r="2.5"/><path d="M24 9c1 1 2 1 3 0M21 6c1 1 2 1 3 0"/>'),
  trumpet: svg('<path d="M4 13v6l5-1V14z"/><path d="M9 14l13-6v16L9 18"/><path d="M25 12a5 5 0 0 1 0 8"/><path d="M12 19l1 5h3l-1-4.5"/>'),
  sling: svg('<circle cx="22" cy="9" r="3"/><path d="M6 27c2-6 6-10 13-15"/><path d="M6 27c4-3 9-6 13-15"/><path d="M5 21l2 6 6-1"/>'),
  jonah: svg('<path d="M4 16c4-6 12-8 18-4l6-4v16l-6-4c-6 4-14 2-18-4z"/><circle cx="9" cy="14.5" r="1"/><path d="M4 16h5"/>'),
  scroll: svg('<path d="M9 6h14a3 3 0 0 1 0 6h-2v12a3 3 0 0 1-3 3H8"/><path d="M9 6a3 3 0 0 0-3 3v15a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3z"/><path d="M15 15h3M15 19h3"/>'),
  // 메뉴: 커피, 차, 크루아상, 도넛, 머핀 / 먹기
  coffee: svg('<path d="M9 11h14l-1.5 15a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8z"/><path d="M8 11h16M10.5 7h11l1 4h-13z"/><path d="M9.8 17h12.4"/>'),
  tea: svg('<path d="M6 12h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M22 14h2a3 3 0 0 1 0 6h-2"/><path d="M14 12V6M14 6l3 3h-3"/>'),
  croissant: svg('<path d="M4 20c2-8 8-12 12-12s10 4 12 12c-3-2-6-2-8 0-2-3-6-3-8 0-2-2-5-2-8 0z"/><path d="M12 9l1 9M20 9l-1 9"/>'),
  donut: svg('<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3.5"/><path d="M9 11l1 1M21 9l-1 1.5M23 19l-1.5-.5M11 22l1-1"/>'),
  muffin: svg('<path d="M8 17h16l-2 10H10z"/><path d="M7 17a9 7 0 0 1 18 0z"/><path d="M13 20v5M19 20v5M16 20v5"/>'),
  eat: svg('<path d="M5 19c2-7 7-10 11-10s9 3 11 10c-3-2-6-2-8 0-2-3-5-3-6 0-2-2-5-2-8 0z"/><circle cx="25.5" cy="8.5" r="3.2" fill="currentColor" stroke="none" opacity=".25"/>'),
  // 풍랑을 잔잔케: 들어 올린 손과 고요해지는 물결
  calm: svg('<path d="M16 15V5M12.5 15V7.5M19.5 15V7.5M23 15v-4.5M9 17v-5"/><path d="M9 17c0 3 3 5 7 5s7-2 7-5v-2"/><path d="M4 27c3-1.5 5-1.5 8 0s5 1.5 8 0 5-1.5 8 0"/>'),
  // 오병이어: 바구니와 떡
  loaves: svg('<path d="M5 15h22l-2.5 10a2 2 0 0 1-2 1.5h-13a2 2 0 0 1-2-1.5z"/><path d="M9 15c0-3 2.5-5 5-5s3 2 3 2 1-3 4-3 4 3 4 6"/><path d="M9 20h14"/>'),
  // 정원 산책: 꽃
  garden: svg('<circle cx="16" cy="10" r="2.5"/><path d="M16 4.5a3 3 0 0 1 0 0M13.5 10a3 3 0 1 1 2.5-4 3 3 0 1 1 2.5 4 3 3 0 1 1-1 4.5 3 3 0 1 1-3 0 3 3 0 1 1-1-4.5z"/><path d="M16 15v13M16 23c-3-3-6-3-8-2M16 21c3-3 6-3 8-2"/>'),
  // 음악 켜기/끄기
  music: svg('<path d="M12 24V8l14-3v16"/><circle cx="9" cy="24" r="3"/><circle cx="23" cy="21" r="3"/>'),
  musicOff: svg('<path d="M12 24V8l14-3v16" opacity=".45"/><circle cx="9" cy="24" r="3" opacity=".45"/><circle cx="23" cy="21" r="3" opacity=".45"/><path d="M5 5l22 22"/>'),
  // 점프
  jump: svg('<circle cx="16" cy="6" r="3"/><path d="M16 9v8M11 13l5-2 5 2M12 23l4-6 4 6"/><path d="M8 28h16" stroke-dasharray="2 3"/>'),
  // 앉기 / 일어서기
  sit: svg('<circle cx="13" cy="6" r="3"/><path d="M13 10v8h8v8M8 26V16"/><path d="M6 20h4"/>'),
  stand: svg('<circle cx="16" cy="5" r="3"/><path d="M16 9v10M11 14l5-2 5 2M12 28l4-9 4 9"/>'),
  // 전도: 빛을 건넴
  share: svg('<circle cx="8" cy="9" r="3"/><circle cx="24" cy="9" r="3"/><path d="M4 26v-6a4 4 0 0 1 8 0M20 26v-6a4 4 0 0 1 8 0"/><circle cx="16" cy="17" r="2.2" fill="currentColor"/><path d="M12 17h1.5M18.5 17H20"/>'),
  // 3인칭(캐릭터 뒤에서) / 1인칭(눈으로) 시점
  third: svg('<circle cx="19" cy="9" r="3"/><path d="M14 26v-6a5 5 0 0 1 10 0v6"/><path d="M4 18l4-2v6l-4-2z"/><rect x="8" y="15" width="5" height="8" rx="1"/>'),
  first: svg('<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16z"/><circle cx="16" cy="16" r="4"/>'),
  // 빛 바라보기 (그리스도)
  gaze: svg('<circle cx="16" cy="16" r="5"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8"/>'),
  // 빛 아래 서기 (그리스도)
  light: svg('<circle cx="16" cy="16" r="5"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8"/>'),
  // 배에 타기 (증거)
  boat: svg('<path d="M4 19h24l-3 6H7z"/><path d="M16 19V5l8 11h-8"/><path d="M4 28c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1 2 1 4 1"/>'),
  // 책 읽기 (말씀)
  read: svg('<path d="M16 9c-3-2-7-2-10-1v16c3-1 7-1 10 1 3-2 7-2 10-1V8c-3-1-7-1-10 1z"/><path d="M16 9v16"/>'),
  // 손 모으기 (기도)
  pray: svg('<path d="M15 27V13l-3-6c-1-2-3-1-3 1v10l-3 4"/><path d="M17 27V13l3-6c1-2 3-1 3 1v10l3 4"/>'),
  // 주문 (교제)
  order: svg('<path d="M7 12h15v7a6 6 0 0 1-6 6h-3a6 6 0 0 1-6-6z"/><path d="M22 14h2a3 3 0 0 1 0 6h-2"/><path d="M12 5c0 2 2 2 2 4M17 5c0 2 2 2 2 4"/>'),
  // 마시기
  sip: svg('<path d="M10 9h12l-1.5 16a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2z"/><path d="M10 14h12"/>'),
  // 맞이하기 (증거)
  welcome: svg('<path d="M6 27V6h12v21"/><path d="M18 27h8"/><circle cx="14" cy="17" r="1"/><path d="M22 10l4 2-4 2"/>'),
  // 손 흔들기
  // V-Hand 인사 (하나님과의 관계, 사람과의 관계)
  vhand: svg('<path d="M12 17L9 5.5a1.8 1.8 0 0 1 3.4-1L16 15"/><path d="M16 15l3-10.5a1.8 1.8 0 0 1 3.4 1L20 17"/><path d="M11 17c-1.5 0-2.5 1-2.5 2.5V22a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-4c0-1.2-1-2-2.2-2H13"/>'),
  wave: svg('<path d="M10 18V9a2 2 0 0 1 4 0v7"/><path d="M14 15V7a2 2 0 0 1 4 0v8"/><path d="M18 15V9a2 2 0 0 1 4 0v9a8 8 0 0 1-8 8h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l3 3"/>'),
  // 낚시 (한 세겔)
  fish: svg('<path d="M7 27L24 5"/><path d="M24 5v15"/><path d="M21 22a3 3 0 1 0 6 0"/><path d="M5 27h6"/>'),
  // 나무 오르기 / 내려오기
  climb: svg('<path d="M14 30V18M14 22l-5-5M14 19l5-6"/><path d="M14 18c-6 0-9-4-9-8a9 9 0 0 1 18 0c0 4-3 8-9 8z"/><path d="M24 26v-8M21 21l3-3 3 3"/>'),
  down: svg('<path d="M16 5v18"/><path d="M9 16l7 7 7-7"/><path d="M6 28h20"/>'),
  // 정원에서 걷기 / 달리기
  walk: svg('<circle cx="16" cy="6" r="2.5"/><path d="M16 10v9l-3 8M16 19l3 8M12 14l4-3 4 3"/>'),
  run: svg('<circle cx="19" cy="5.5" r="2.5"/><path d="M17 10l-3 7 5 3-2 7M14 17l-6 1M17 10l5 4 4-1"/><path d="M4 12h5M3 17h4"/>'),
  // 화면 눕히기
  rotate: svg('<rect x="9" y="4" width="14" height="24" rx="2.5"/><path d="M4 20a12 12 0 0 0 9 8.5"/><path d="M10 25.5l3 3-3.5 2"/>'),
  // 찬양: 높이 든 두 손과 음표
  praise: svg('<path d="M9 27v-8l-3-9a1.4 1.4 0 0 1 2.6-1L11 15V5.5a1.4 1.4 0 0 1 2.8 0V15"/><path d="M23 27v-8l3-9a1.4 1.4 0 0 0-2.6-1L21 15V5.5a1.4 1.4 0 0 0-2.8 0V15"/>'),
  // 테마파크 액티비티
  kick: svg('<circle cx="21" cy="21" r="6"/><path d="M21 15l-2.5 3.5 2.5 3 3-1.5"/><path d="M5 9l5 2 2 6-4 6"/>'),
  shoot: svg('<circle cx="12" cy="20" r="6"/><path d="M6 20h12M12 14v12"/><path d="M20 6h8M22 6l2 6 2-6"/><path d="M17 15c2-4 4-6 6-7"/>'),
  tennis: svg('<ellipse cx="13" cy="12" rx="6" ry="8" transform="rotate(-35 13 12)"/><path d="M17.5 18.5L26 27"/><circle cx="24" cy="9" r="2.6"/>'),
  badminton: svg('<path d="M10 22l9-9"/><path d="M19 13l5-7 3 3-7 5z"/><circle cx="8" cy="24" r="2.5"/>'),
  pingpong: svg('<circle cx="13" cy="13" r="8"/><path d="M18.5 18.5L25 25"/><circle cx="25" cy="8" r="2.2"/>'),
  grill: svg('<path d="M6 14h20a10 10 0 0 1-20 0z"/><path d="M11 24l-2 5M21 24l2 5"/><path d="M11 10c0-2 2-2 2-4M16 10c0-2 2-2 2-4M21 10c0-2 2-2 2-4"/>'),
  sow: svg('<path d="M6 26h20"/><path d="M10 26v-4M16 26v-6M22 26v-4"/><path d="M16 20c-3 0-4-3-4-5 2 0 4 1 4 5zM16 20c3 0 4-3 4-5-2 0-4 1-4 5z"/><circle cx="9" cy="8" r="1"/><circle cx="14" cy="6" r="1"/><circle cx="19" cy="9" r="1"/>'),
  plant: svg('<path d="M6 26h20"/><path d="M16 26V14"/><path d="M16 18c-5 0-7-4-7-7 4 0 7 2 7 7zM16 15c4 0 6-3 6-6-3 0-6 2-6 6z"/>'),
  draw: svg('<path d="M7 14h18v12H7z"/><path d="M5 9h22"/><path d="M8 9V5M24 9V5"/><path d="M16 9v6"/><path d="M13 15h6l-1 4h-4z"/>'),
  rainbow: svg('<path d="M4 24a12 12 0 0 1 24 0"/><path d="M8 24a8 8 0 0 1 16 0"/><path d="M12 24a4 4 0 0 1 8 0"/>'),
  // 내려놓기
  putdown: svg('<path d="M10 9h10l-1 8a2 2 0 0 1-2 1.8h-4a2 2 0 0 1-2-1.8z"/><path d="M20 11h1.5a2 2 0 0 1 0 4H20"/><path d="M4 24h24"/><path d="M15 3v3"/>'),
  // 물주기 (순종)
  water: svg('<path d="M6 14h14v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/><path d="M20 16l7-5"/><path d="M9 14c0-4 2-6 5-6"/><path d="M27 15v2M25 19v2"/>'),
  // 쟁반 반납 (순종)
  tray: svg('<path d="M5 20h22"/><path d="M8 20a8 8 0 0 1 16 0"/><path d="M16 10V8"/><path d="M16 26v-3M11 26h10"/>'),
  // 함께 있기: 혼자 / 랜덤으로 함께 / 초대 링크 / 지금 함께 있는 사람
  solo: svg('<circle cx="16" cy="10" r="4"/><path d="M8 27v-3a8 8 0 0 1 16 0v3"/>'),
  together: svg('<circle cx="16" cy="9" r="3.4"/><circle cx="7.5" cy="13" r="2.8"/><circle cx="24.5" cy="13" r="2.8"/><path d="M10 27v-3a6 6 0 0 1 12 0v3"/><path d="M3 26v-2a4.5 4.5 0 0 1 7-3.7M29 26v-2a4.5 4.5 0 0 0-7-3.7"/>'),
  invite: svg('<path d="M13.5 18.5l5-5"/><path d="M11 15l-3 3a4.2 4.2 0 0 0 6 6l3-3"/><path d="M21 17l3-3a4.2 4.2 0 0 0-6-6l-3 3"/>'),
  door: svg('<path d="M9 28V8a7 7 0 0 1 14 0v20M5 28h22"/><circle cx="19" cy="18" r="1" fill="currentColor"/>'),
  people: svg('<circle cx="12" cy="11" r="3.6"/><circle cx="22" cy="12.5" r="3"/><path d="M5 26v-2a7 7 0 0 1 14 0v2"/><path d="M19.5 26v-2a6 6 0 0 1 8-5.6"/>'),
};
