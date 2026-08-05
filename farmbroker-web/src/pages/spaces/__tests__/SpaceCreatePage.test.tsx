import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SpaceCreatePage } from '@/pages/spaces/SpaceCreatePage';
import { renderWithProviders } from '@/test/renderWithProviders';

function imageFile(name: string, sizeBytes = 1024) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/jpeg' });
}

describe('SpaceCreatePage', () => {
  it('공간 예시를 입력값이 아닌 placeholder로 보여준다', () => {
    renderWithProviders(<SpaceCreatePage />);

    expect(screen.getByLabelText('공간 이름')).toHaveValue('');
    expect(
      screen.getByPlaceholderText('예: 부산대 앞 20평 상가 공실'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('예: 부산광역시 금정구 장전동'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 66')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('예: 500000')).toBeInTheDocument();
    expect(screen.getByLabelText('상세 메모')).toHaveValue('');
  });

  it('선택한 사진을 업로드하고 미리보기와 등록 장수를 보여준다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    expect(screen.getByText(/0\/10장 등록됨/)).toBeInTheDocument();

    await user.upload(screen.getByLabelText('공간 사진 선택'), [
      imageFile('정면.jpg'),
      imageFile('내부.jpg'),
    ]);

    await waitFor(() => {
      expect(screen.getByText(/2\/10장 등록됨/)).toBeInTheDocument();
    });
    expect(screen.getByAltText('등록한 공간 사진 1')).toBeInTheDocument();
    // 첫 사진이 목록 카드의 대표 이미지가 됩니다.
    expect(screen.getByText('대표')).toBeInTheDocument();
  });

  it('삭제 버튼으로 선택한 사진을 뺀다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await user.upload(screen.getByLabelText('공간 사진 선택'), [imageFile('정면.jpg')]);
    await waitFor(() => {
      expect(screen.getByText(/1\/10장 등록됨/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '공간 사진 1 삭제' }));

    expect(screen.getByText(/0\/10장 등록됨/)).toBeInTheDocument();
  });

  it('10장을 넘겨 선택하면 업로드를 막는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    const eleven = Array.from({ length: 11 }, (_, index) => imageFile(`사진${index}.jpg`));
    await user.upload(screen.getByLabelText('공간 사진 선택'), eleven);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '사진은 10장까지 등록할 수 있습니다.',
    );
    expect(screen.getByText(/0\/10장 등록됨/)).toBeInTheDocument();
  });
});
