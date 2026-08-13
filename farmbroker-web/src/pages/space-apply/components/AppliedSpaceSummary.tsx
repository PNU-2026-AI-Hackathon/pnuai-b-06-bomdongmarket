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
    <Card className="flex h-full flex-col" padding="lg">
      {/* 옆 카드에 맞춰 늘어난 높이를 flex-1로 이어받아 아래쪽에 빈 공간이 남지 않게 합니다. */}
      <div className="flex flex-1 flex-col gap-4 sm:flex-row">
        <RemoteImage
          alt={`${space.title} 대표 이미지`}
          className="h-32 w-full rounded-app object-cover sm:h-auto sm:w-1/2 sm:self-stretch"
          src={space.imageUrls[0]}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-xl font-black text-content">{space.title}</h2>
          <p className="mt-1 text-body-sm text-content-muted">{space.address}</p>
          <dl className="mt-4 grid gap-3">
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
          {/* mt-auto로 칼럼 바닥에 붙여, 늘어난 이미지의 아래 선과 버튼 아래 선을 맞춥니다. */}
          <div className="mt-5 flex justify-end sm:mt-auto sm:pt-5">
            <Link
              className={buttonStyles({ className: 'w-full sm:w-auto', variant: 'outline' })}
              to={ROUTES.spaceDetail(space.spaceId)}
            >
              공간 정보 보기
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
