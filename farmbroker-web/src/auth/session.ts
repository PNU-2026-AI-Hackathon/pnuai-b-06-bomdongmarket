import type { LoginResult, User } from '@/types/api';

const AUTH_TOKEN_KEY = 'farmbroker.accessToken';
const AUTH_USER_KEY = 'farmbroker.user';

export const AUTH_SESSION_CHANGED_EVENT = 'farmbroker:auth-session-changed';

function notifySessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function getAccessToken() {
  return window.sessionStorage.getItem(AUTH_TOKEN_KEY);
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

export function saveAuthSession({ accessToken, user }: LoginResult) {
  window.sessionStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifySessionChanged();
}

export function updateStoredUser(user: User) {
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  notifySessionChanged();
}
