import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfitPredictionPage } from '@/pages/farmer/ProfitPredictionPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('ProfitPredictionPage', () => {
  it('수익 예측 지표와 CTA를 렌더링한다', () => {
    renderWithProviders(<ProfitPredictionPage />);

    expect(screen.getByText(/예상 월 매출/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /결과 저장/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /매칭 신청/i })).toBeInTheDocument();
  });
});
