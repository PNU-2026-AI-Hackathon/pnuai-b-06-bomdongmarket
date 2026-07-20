import { Check, X } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { MatchingRequest } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';
import { getMatchingStatusLabel } from '@/utils/labels';

interface MatchingRequestCardProps {
  request: MatchingRequest;
  isUpdating?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

// 소유자가 받은 매칭 신청을 카드 단위로 검토하고 수락/거절 액션을 시연합니다.
export function MatchingRequestCard({
  request,
  isUpdating = false,
  onAccept,
  onReject,
}: MatchingRequestCardProps) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {request.spaceImageUrl ? (
          <img
            alt=""
            className="h-20 w-20 shrink-0 rounded-app object-cover"
            src={request.spaceImageUrl}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={request.status === 'REQUESTED' ? 'yellow' : 'green'}>
              {getMatchingStatusLabel(request.status)}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              {formatDate(request.createdAt)}
            </span>
          </div>
          <h3 className="mt-2 truncate font-bold text-ink-900">{request.spaceTitle}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {request.farmerNickname}
            {request.monthlyRent !== undefined
              ? ` · ${formatCurrency(request.monthlyRent)}`
              : ''}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{request.message}</p>
      {request.status === 'REQUESTED' ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button disabled={isUpdating} onClick={onAccept} size="sm">
            <Check className="h-4 w-4" aria-hidden />
            {isUpdating ? '처리 중...' : '수락'}
          </Button>
          <Button disabled={isUpdating} onClick={onReject} size="sm" variant="outline">
            <X className="h-4 w-4" aria-hidden />
            거절
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
