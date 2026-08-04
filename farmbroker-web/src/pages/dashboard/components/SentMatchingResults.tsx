import { Link } from 'react-router-dom';

import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/constants/routes';
import type { MyMatching } from '@/types/api';
import { formatCurrency } from '@/utils/format';
import { getMatchingStatusLabel } from '@/utils/labels';

interface SentMatchingResultsProps {
  matchings: MyMatching[];
}

// 농부가 보낸 매칭 신청의 처리 결과를 대시보드에서 명확히 확인합니다.
export function SentMatchingResults({ matchings }: SentMatchingResultsProps) {
  if (matchings.length === 0) {
    return (
      <EmptyState
        description="관심 있는 공간의 상세 화면에서 매칭 상담을 신청해보세요."
        title="보낸 매칭 신청이 없습니다"
      />
    );
  }

  return (
    <ul className="grid list-none gap-4 p-0">
      {matchings.map((matching) => (
        <li key={matching.matchingId}>
          <Link
            aria-label={`${matching.spaceTitle} 상세 보기`}
            className="block rounded-app focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
            to={ROUTES.spaceDetail(matching.spaceId)}
          >
            <Card padding="md" variant="interactive">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-content">{matching.spaceTitle}</h3>
                <span className="text-sm font-semibold text-action">
                  {getMatchingStatusLabel(matching.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-content-muted">
                {matching.ownerNickname} · {formatCurrency(matching.monthlyRent)}
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
