import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import type { BadgeTone } from '@/components/common/Badge';
import type { ContractSummary, MatchingStatus } from '@/types/api';
import { formatCurrency } from '@/utils/format';
import { getMatchingStatusLabel, getMatchingTypeLabel } from '@/utils/labels';

interface ContractCardProps {
  contract: ContractSummary;
  onDismiss?: () => void;
}

const statusTones: Record<MatchingStatus, BadgeTone> = {
  REQUESTED: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELED: 'slate',
};

// 내가 보낸 신청 한 건을 카드로 보여주고, 상세·취소가 가능한 신청 화면으로 연결합니다.
export function ContractCard({ contract, onDismiss }: ContractCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <RemoteImage
          alt=""
          className="h-20 w-20 shrink-0 rounded-app object-cover"
          decorativeFallback
          src={contract.imageUrl}
        />
        <div className="min-w-0 flex-1">
          <Badge tone={statusTones[contract.status]}>
            {getMatchingStatusLabel(contract.status)}
          </Badge>
          <h3 className="mt-3 truncate text-lg font-black text-ink-900">
            {contract.spaceName}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{contract.counterparty}</p>
        </div>
        {onDismiss ? (
          <Button
            aria-label={`${contract.spaceName} 신청을 목록에서 지우기`}
            className="-mr-1 -mt-1 h-9 w-9 shrink-0 px-0"
            onClick={onDismiss}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-slate-500">월세</dt>
          <dd className="font-bold text-ink-900">
            {formatCurrency(contract.monthlyRent)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">유형</dt>
          <dd className="font-bold text-ink-900">
            {getMatchingTypeLabel(contract.type)}
          </dd>
        </div>
      </dl>
      <Link
        className={buttonStyles({ className: 'mt-4 w-full', variant: 'outline' })}
        to={ROUTES.spaceApply(contract.spaceId)}
      >
        자세히 보기
      </Link>
    </Card>
  );
}
