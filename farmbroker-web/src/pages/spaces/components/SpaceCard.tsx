import { ArrowRight, Droplets, MapPin, Plug, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import type { SpaceSummary } from '@/types/api';
import { formatArea, formatCurrency } from '@/utils/format';

interface SpaceCardProps {
  space: SpaceSummary;
  compact?: boolean;
  // 지도 반경 검색의 중심에서 이 공간까지의 거리(km). 지도 검색 중일 때만 값이 있다.
  distanceKm?: number | null;
}

// 등록할 때 체크하지 않은 조건은 아이콘 자체를 내보내지 않습니다.
function availableFacilities(space: SpaceSummary) {
  return (
    [
      [space.hasWater, Droplets, '수도 사용 가능'],
      [space.hasElectricity, Plug, '전기 사용 가능'],
      [space.hasVentilation, Wind, '환기 가능'],
    ] as const
  ).filter(([enabled]) => enabled);
}

// 공간 목록과 개인 대시보드에서 함께 쓰는 카드형 공간 요약입니다.
export function SpaceCard({ space, compact = false, distanceKm }: SpaceCardProps) {
  const facilities = availableFacilities(space);

  return (
    <Card className="overflow-hidden" variant="interactive">
      <RemoteImage
        alt={space.title}
        className="h-44 w-full object-cover"
        src={space.imageUrl}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* 공개 목록에는 매칭 가능한 공간만 올라오므로 상태 배지는 달지 않습니다. */}
          <h2 className="line-clamp-2 text-lg font-bold text-ink-900">{space.title}</h2>
          <span className="shrink-0 rounded-app bg-accent-soft px-2.5 py-1 text-sm font-bold text-soil-700">
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
          {!compact && facilities.length > 0 ? (
            <div className="flex items-center gap-1 text-action">
              {facilities.map(([, Icon, label]) => (
                <span key={label}>
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{label}</span>
                </span>
              ))}
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
