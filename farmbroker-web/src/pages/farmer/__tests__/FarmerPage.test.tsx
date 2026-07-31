import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { FarmerPage } from '@/pages/farmer/FarmerPage';
import { ProfitPredictionPage } from '@/pages/farmer/ProfitPredictionPage';

describe('Farmer pages', () => {
  it('백엔드 공간 정보를 렌더링하고 키워드 필터링을 지원한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FarmerPage />);

    expect(await screen.findAllByText(/상세에서 AI 작물 추천/i)).not.toHaveLength(0);
    expect(screen.queryByText(/적합도/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/예상 수익/i)).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /추천 공간 검색/i }), '서면');

    await waitFor(() => {
      expect(screen.getByText(/서면 지하 재배 공간/i)).toBeInTheDocument();
    });
  });

  it('수익 예측 지표와 CTA를 렌더링한다', () => {
    renderWithProviders(<ProfitPredictionPage />);

    expect(screen.getByText(/예상 월 매출/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /결과 저장/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /매칭 신청/i })).toBeInTheDocument();
  });
});
