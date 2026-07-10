import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Header } from '@/components/layout/Header';
import { PRIMARY_NAVIGATION } from '@/constants/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Header', () => {
  it('데스크톱 내비게이션에 넓은 간격과 클릭 영역을 제공한다', () => {
    const { getByRole } = renderWithProviders(<Header />);
    const navigation = getByRole('navigation', { name: '주요 내비게이션' });

    expect(navigation).toHaveClass('gap-2', 'xl:gap-3');

    PRIMARY_NAVIGATION.forEach((item) => {
      const link = within(navigation).getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
      expect(link).toHaveClass('min-h-11', 'px-4', 'xl:px-5');
    });
  });
});
