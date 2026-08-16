import type { User } from '@/types/api';

// Access Token은 httpOnly 쿠키(백엔드 발급)에만 존재하며 JS에서 접근하지 않는다.
// 여기서는 첫 페인트를 위한 사용자 프로필 캐시만 관리한다. 로그인 상태의 최종 진실은 쿠키다.
const AUTH_USER_KEY = 'farmbroker.user';

export const AUTH_SESSION_CHANGED_EVENT = 'farmbroker:auth-session-changed';

function notifySessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function getStoredUser(): User | null {
  const value = window.sessionStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as User;
  } catch {
    window.sessionStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function saveAuthSession(user: User) {
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifySessionChanged();
}

export function updateStoredUser(user: User) {
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.sessionStorage.removeItem(AUTH_USER_KEY);
}

export function clearAuthSession() {
  clearStoredUser();
  notifySessionChanged();
}
