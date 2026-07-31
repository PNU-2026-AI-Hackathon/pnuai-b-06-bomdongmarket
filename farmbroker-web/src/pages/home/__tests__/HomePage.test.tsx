import { act, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomePage } from '@/pages/home/HomePage';
import { campaignSlides, roleSections } from '@/pages/home/constants/homeContent';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('HomePage', () => {
  it('캠페인과 세 역할별 둘러보기 섹션을 렌더링한다', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: campaignSlides[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '봄동마켓 캠페인' })).toBeInTheDocument();

    roleSections.forEach((role) => {
      const heading = screen.getByRole('heading', { name: role.title });
      const section = heading.closest('section');

      expect(section).not.toBeNull();
      expect(
        within(section as HTMLElement).getByRole('link', {
          name: new RegExp(role.ctaLabel),
        }),
      ).toHaveAttribute('href', role.href);
    });
  });

  it('캠페인 포스터를 자동으로 다음 항목으로 전환한다', () => {
    vi.useFakeTimers();

    try {
      renderWithProviders(<HomePage />);
      const firstIndicator = screen.getByRole('button', {
        name: `${campaignSlides[0].eyebrow} 보기`,
      });
      const secondIndicator = screen.getByRole('button', {
        name: `${campaignSlides[1].eyebrow} 보기`,
      });

      expect(firstIndicator).toHaveAttribute('aria-current', 'true');

      act(() => {
        vi.advanceTimersByTime(5500);
      });

      expect(secondIndicator).toHaveAttribute('aria-current', 'true');
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
