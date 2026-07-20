import { ArrowRight, Droplets, MapPin, Plug, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { ROUTES } from '@/constants/routes';
import type { SpaceSummary } from '@/types/api';
import { formatArea, formatCurrency } from '@/utils/format';
import { getSpaceStatusLabel } from '@/utils/labels';

interface SpaceCardProps {
  space: SpaceSummary;
  compact?: boolean;
}

// 공간 목록과 개인 대시보드에서 함께 쓰는 카드형 공간 요약입니다.
export function SpaceCard({ space, compact = false }: SpaceCardProps) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lift">
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
            <h3 className="mt-3 line-clamp-2 text-lg font-bold text-ink-900">
              {space.title}
            </h3>
          </div>
          <span className="rounded-app bg-soil-100 px-2.5 py-1 text-sm font-bold text-soil-700">
            {formatArea(space.area)}
          </span>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
          {space.address}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span>
            <span className="block text-xs font-semibold text-slate-500">월세</span>
            <span className="font-black text-ink-900">
              {formatCurrency(space.monthlyRent)}
            </span>
          </span>
          {!compact ? (
            <div className="flex items-center gap-1 text-leaf-700" aria-label="주요 시설">
              <Droplets className="h-4 w-4" aria-hidden />
              <Plug className="h-4 w-4" aria-hidden />
              <Wind className="h-4 w-4" aria-hidden />
            </div>
          ) : null}
        </div>
        <Link
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-app bg-leaf-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-leaf-800"
          to={ROUTES.spaceDetail(space.spaceId)}
        >
          자세히 보기 <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
