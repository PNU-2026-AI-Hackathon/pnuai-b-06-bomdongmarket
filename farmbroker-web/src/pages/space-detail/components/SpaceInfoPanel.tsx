import { Building2, Droplets, Plug, UserRound, Wind } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import type { SpaceDetail } from '@/types/api';
import { formatArea, formatCurrency } from '@/utils/format';
import { getSpaceStatusLabel } from '@/utils/labels';

interface SpaceInfoPanelProps {
  space: SpaceDetail;
}

const facilityIcons = {
  hasWater: Droplets,
  hasElectricity: Plug,
  hasVentilation: Wind,
} as const;

// 공간 상세의 핵심 조건, 등록자 정보, 임대료를 카드 하나로 요약합니다.
export function SpaceInfoPanel({ space }: SpaceInfoPanelProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={space.status === 'AVAILABLE' ? 'green' : 'slate'}>
          {getSpaceStatusLabel(space.status)}
        </Badge>
        <Badge tone="yellow">{formatArea(space.area)}</Badge>
        <Badge tone="blue">{space.floor}F</Badge>
      </div>
      <h1 className="mt-4 text-3xl font-black text-ink-900">{space.title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{space.description}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-app bg-leaf-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">월세</dt>
          <dd className="mt-1 font-black text-ink-900">
            {formatCurrency(space.monthlyRent)}
          </dd>
        </div>
        <div className="rounded-app bg-leaf-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">위치</dt>
          <dd className="mt-1 text-sm font-bold text-ink-900">{space.address}</dd>
        </div>
        <div className="rounded-app bg-leaf-50 p-3">
          <dt className="text-xs font-semibold text-slate-500">등록자</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink-900">
            <UserRound className="h-4 w-4 text-leaf-700" aria-hidden />
            {space.owner.nickname}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <Building2 className="h-4 w-4 text-leaf-700" aria-hidden />
          공간 조건
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(
            [
              ['hasWater', '수도'],
              ['hasElectricity', '전기'],
              ['hasVentilation', '환기'],
            ] as const
          ).map(([key, label]) => {
            const Icon = facilityIcons[key];
            const enabled = space[key];
            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-app border border-leaf-100 px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 text-leaf-700" aria-hidden />
                <span className="font-semibold text-ink-700">{label}</span>
                <span className="ml-auto text-xs font-bold text-slate-500">
                  {enabled ? '가능' : '보완 필요'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
