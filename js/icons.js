// 글자 없는 버튼 아이콘 (SVG)
const svg = (body) =>
  `<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
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
  // 물주기 (순종)
  water: svg('<path d="M6 14h14v8a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/><path d="M20 16l7-5"/><path d="M9 14c0-4 2-6 5-6"/><path d="M27 15v2M25 19v2"/>'),
  // 쟁반 반납 (순종)
  tray: svg('<path d="M5 20h22"/><path d="M8 20a8 8 0 0 1 16 0"/><path d="M16 10V8"/><path d="M16 26v-3M11 26h10"/>'),
};
