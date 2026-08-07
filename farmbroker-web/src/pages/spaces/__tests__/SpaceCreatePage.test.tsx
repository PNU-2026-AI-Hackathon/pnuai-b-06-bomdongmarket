import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SpaceCreatePage } from '@/pages/spaces/SpaceCreatePage';
import { renderWithProviders } from '@/test/renderWithProviders';

function imageFile(name: string, sizeBytes = 1024) {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/jpeg' });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('공간 이름'), '테스트 상가 공실');
  await user.type(screen.getByLabelText('공간 위치'), '부산광역시 금정구 장전동');
  await user.type(screen.getByLabelText('전체 면적'), '66');
  await user.type(screen.getByLabelText('층수'), '2');
  await user.type(screen.getByLabelText('희망 월세'), '500000');
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

    expect(screen.getByText(/공간 사진 0\/10장 등록됨/)).toBeInTheDocument();

    await user.upload(screen.getByLabelText('공간 사진 선택'), [
      imageFile('정면.jpg'),
      imageFile('내부.jpg'),
    ]);

    await waitFor(() => {
      expect(screen.getByText(/공간 사진 2\/10장 등록됨/)).toBeInTheDocument();
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
      expect(screen.getByText(/공간 사진 1\/10장 등록됨/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '공간 사진 1 삭제' }));

    expect(screen.getByText(/공간 사진 0\/10장 등록됨/)).toBeInTheDocument();
  });

  it('10장을 넘겨 선택하면 업로드를 막는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    const eleven = Array.from({ length: 11 }, (_, index) => imageFile(`사진${index}.jpg`));
    await user.upload(screen.getByLabelText('공간 사진 선택'), eleven);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '공간 사진은 10장까지 등록할 수 있습니다.',
    );
    expect(screen.getByText(/공간 사진 0\/10장 등록됨/)).toBeInTheDocument();
  });

  it('도면 없이 제출하면 막고 안내한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '도면을 최소 1장 등록해야 합니다.',
    );
  });

  // 음수가 들어가면 브라우저 제약 검증(min)이 제출 자체를 막아 다음 단계로 넘어가지 않는다.
  it('면적에 음수가 들어가면 제출되지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await user.type(screen.getByLabelText('공간 이름'), '테스트 공실');
    await user.type(screen.getByLabelText('공간 위치'), '부산광역시 금정구');
    await user.type(screen.getByLabelText('층수'), '2');
    await user.type(screen.getByLabelText('희망 월세'), '500000');
    await user.upload(screen.getByLabelText('도면 선택'), [imageFile('도면.png')]);
    await waitFor(() => {
      expect(screen.getByText(/도면 1\/10장 등록됨/)).toBeInTheDocument();
    });

    // '-' 키는 막혀 있으므로 붙여넣기 경로를 흉내 내 값을 직접 주입한다.
    const area = screen.getByLabelText('전체 면적');
    fireEvent.change(area, { target: { value: '-5' } });
    expect(area).toBeInvalid();

    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));

    // 등록 폼에 그대로 머문다 (예측 단계로 넘어가지 않음)
    expect(screen.getByLabelText('전체 면적')).toBeInTheDocument();
  });

  it('숫자 칸에 음수 방지 제약이 걸려 있다', () => {
    renderWithProviders(<SpaceCreatePage />);

    expect(screen.getByLabelText('전체 면적')).toHaveAttribute('min', '0');
    expect(screen.getByLabelText('희망 월세')).toHaveAttribute('min', '0');
    // 층수만 지하를 위해 음수를 허용한다.
    expect(screen.getByLabelText('층수')).toHaveAttribute('min', '-10');
  });

  it('면적 칸에서 음수 부호 키 입력을 막는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await user.type(screen.getByLabelText('전체 면적'), '-66');

    expect(screen.getByLabelText('전체 면적')).toHaveValue(66);
  });

  // 지하 공간은 층수가 음수다. 음수 방지를 층수까지 적용하면 안 된다.
  it('층수에는 지하를 뜻하는 음수를 허용한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await user.type(screen.getByLabelText('층수'), '-1');

    expect(screen.getByLabelText('층수')).toHaveValue(-1);
  });

  it('도면을 등록하면 안내가 사라진다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SpaceCreatePage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /수익 예측 확인/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('도면 선택'), [imageFile('도면.png')]);

    await waitFor(() => {
      expect(screen.getByText(/도면 1\/10장 등록됨/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
