import { ArrowRight, Droplets, MapPin, Plug, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import type { SpaceSummary } from '@/types/api';
import { formatArea, formatCurrency } from '@/utils/format';
import { getSpaceStatusLabel } from '@/utils/labels';

interface SpaceCardProps {
  space: SpaceSummary;
  compact?: boolean;
  // 지도 반경 검색의 중심에서 이 공간까지의 거리(km). 지도 검색 중일 때만 값이 있다.
  distanceKm?: number | null;
}

// 공간 목록과 개인 대시보드에서 함께 쓰는 카드형 공간 요약입니다.
export function SpaceCard({ space, compact = false, distanceKm }: SpaceCardProps) {
  return (
    <Card className="overflow-hidden" variant="interactive">
      <RemoteImage
        alt={space.title}
        className="h-44 w-full object-cover"
        src={space.imageUrl}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge tone={space.status === 'AVAILABLE' ? 'green' : 'slate'}>
              {getSpaceStatusLabel(space.status)}
            </Badge>
            <h2 className="mt-3 line-clamp-2 text-lg font-bold text-ink-900">
              {space.title}
            </h2>
          </div>
          <span className="rounded-app bg-accent-soft px-2.5 py-1 text-sm font-bold text-soil-700">
            {formatArea(space.area)}
          </span>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-sm text-content-muted">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden />
          {space.address}
          {distanceKm != null ? (
            <>
              <span aria-hidden> · </span>
              <span className="font-bold text-action">{distanceKm.toFixed(1)}km</span>
            </>
          ) : null}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span>
            <span className="block text-xs font-semibold text-content-subtle">월세</span>
            <span className="font-black text-content">
              {formatCurrency(space.monthlyRent)}
            </span>
          </span>
          {!compact ? (
            <div className="flex items-center gap-1 text-action" aria-label="주요 시설">
              <Droplets className="h-4 w-4" aria-hidden />
              <Plug className="h-4 w-4" aria-hidden />
              <Wind className="h-4 w-4" aria-hidden />
            </div>
          ) : null}
        </div>
        <Link
          className={buttonStyles({ className: 'mt-5 w-full' })}
          to={ROUTES.spaceDetail(space.spaceId)}
        >
          자세히 보기 <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
