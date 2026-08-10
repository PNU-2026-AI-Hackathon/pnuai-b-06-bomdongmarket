import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import type { SpaceDetail } from '@/types/api';
import { formatArea, formatCurrency } from '@/utils/format';

interface AppliedSpaceSummaryProps {
  space: SpaceDetail;
}

// 신청 화면에서 "어느 공간에 신청하는지"를 확인할 수 있도록 요약과 상세 이동 경로를 함께 둡니다.
export function AppliedSpaceSummary({ space }: AppliedSpaceSummaryProps) {
  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row">
        <RemoteImage
          alt={`${space.title} 대표 이미지`}
          className="h-32 w-full rounded-app object-cover sm:w-40"
          src={space.imageUrls[0]}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-content">{space.title}</h2>
          <p className="mt-1 text-body-sm text-content-muted">{space.address}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold text-content-subtle">월세</dt>
              <dd className="font-bold text-content">
                {formatCurrency(space.monthlyRent)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-content-subtle">면적</dt>
              <dd className="font-bold text-content">{formatArea(space.area)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-content-subtle">공간 제공자</dt>
              <dd className="font-bold text-content">{space.owner.nickname}</dd>
            </div>
          </dl>
        </div>
      </div>
      <Link
        className={buttonStyles({ className: 'mt-5 w-full sm:w-auto', variant: 'outline' })}
        to={ROUTES.spaceDetail(space.spaceId)}
      >
        공간 정보 보기
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
