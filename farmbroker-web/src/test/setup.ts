import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// 채팅 도크가 뜨는 화면(AppLayout)을 렌더하는 테스트가 있습니다.
// 실제 WebSocket 을 열면 백엔드가 없어 실패하고 3초마다 재연결을 돌려,
// 테스트가 끝난 뒤에도 타이머가 남아 다른 테스트를 흔듭니다.
// 연결을 시도하지 않는 껍데기로 바꿔 둡니다.
class NoopWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly readyState = NoopWebSocket.CLOSED;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: (() => void) | null = null;

  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

Object.defineProperty(window, 'WebSocket', { writable: true, value: NoopWebSocket });
Object.defineProperty(globalThis, 'WebSocket', { writable: true, value: NoopWebSocket });
