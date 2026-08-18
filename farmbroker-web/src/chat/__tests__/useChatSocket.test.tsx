import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatSocket } from '@/chat/useChatSocket';

const chatServiceMocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
}));

vi.mock('@/services/chatService', () => chatServiceMocks);

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    activate = vi.fn();
    deactivate = vi.fn().mockResolvedValue(undefined);
    subscribe = vi.fn();
  },
}));

describe('useChatSocket', () => {
  beforeEach(() => {
    chatServiceMocks.getConversations.mockReset();
  });

  it('비활성화된 뒤 끝난 목록 요청은 상태를 덮어쓰지 않는다', async () => {
    let rejectRequest: ((reason: Error) => void) | undefined;
    chatServiceMocks.getConversations.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );

    const { result, rerender } = renderHook(
      ({ enabled }) => useChatSocket(enabled, vi.fn()),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.status).toBe('loading'));
    rerender({ enabled: false });
    await waitFor(() => expect(result.current.status).toBe('idle'));

    await act(async () => rejectRequest?.(new Error('late failure')));

    expect(result.current.status).toBe('idle');
  });
});
