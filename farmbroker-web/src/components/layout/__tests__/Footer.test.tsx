import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Footer } from '@/components/layout/Footer';
import { APP_INFO } from '@/constants/appInfo';
import { PRIMARY_NAVIGATION } from '@/constants/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Footer', () => {
  it('팀 이름과 저작권, 서비스 바로가기를 제공한다', () => {
    const { getByRole } = renderWithProviders(<Footer />);
    const footer = getByRole('contentinfo');

    expect(within(footer).getByText(APP_INFO.team)).toBeInTheDocument();
    expect(
      within(footer).getByText(
        `© ${new Date().getFullYear()} ${APP_INFO.team}. All rights reserved.`,
      ),
    ).toBeInTheDocument();

    const navigation = within(footer).getByRole('navigation', {
      name: '서비스 바로가기',
    });

    PRIMARY_NAVIGATION.forEach((item) => {
      expect(within(navigation).getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.href,
      );
    });
  });

  it('문의와 저장소 링크를 새 탭에서 연다', () => {
    const { getByRole } = renderWithProviders(<Footer />);

    const links = [
      { name: '문의하기', href: APP_INFO.issuesUrl },
      { name: 'GitHub 저장소', href: APP_INFO.repositoryUrl },
    ];

    links.forEach(({ name, href }) => {
      const link = getByRole('link', { name });

      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
  });
});
