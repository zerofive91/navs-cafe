// 체험이 끝났음을 알리는 작은 알림판: 정원 체험(park·stories)이 알리고, 부탁(quests)이 듣는다
export const bus = new EventTarget();
export const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));
export const on = (name, f) => bus.addEventListener(name, (e) => f(e.detail));
