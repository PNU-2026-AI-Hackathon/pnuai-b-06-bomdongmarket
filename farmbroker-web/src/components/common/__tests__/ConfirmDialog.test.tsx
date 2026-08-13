import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      confirmLabel="신청"
      description="신청 후에도 취소할 수 있습니다."
      isOpen
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="신청하시겠습니까?"
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('닫혀 있으면 아무것도 렌더링하지 않는다', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('제목과 설명을 dialog에 연결하고 확인 버튼에 포커스를 준다', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: '신청하시겠습니까?' });

    expect(dialog).toHaveAccessibleDescription('신청 후에도 취소할 수 있습니다.');
    expect(screen.getByRole('button', { name: '신청' })).toHaveFocus();
  });

  it('확인과 닫기가 각각의 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole('button', { name: '신청' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape를 누르면 취소로 처리한다', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('처리 중에는 두 버튼과 Escape를 모두 막는다', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog({ isPending: true });

    expect(screen.getByRole('button', { name: '신청' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '닫기' })).toBeDisabled();

    await user.keyboard('{Escape}');

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
