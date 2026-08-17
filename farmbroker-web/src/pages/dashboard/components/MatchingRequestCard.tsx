import { FileText, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge, type BadgeTone } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import type { MatchingRequest, MatchingStatus } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';
import { getMatchingStatusLabel } from '@/utils/labels';

interface MatchingRequestCardProps {
  request: MatchingRequest;
  // 협의가 끝난 신청을 목록에서 치웁니다. 협의 중인 신청에는 노출하지 않습니다.
  onDismiss?: () => void;
}

const statusTones: Record<MatchingStatus, BadgeTone> = {
  REQUESTED: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELED: 'red',
};

// 소유자가 받은 매칭 신청을 카드 단위로 확인하고 채팅·계약서로 이어갑니다.
// 버튼 구성은 공간 상세의 SpaceMatchingRequestCard와 같습니다 — 양측이 같은 흐름을 봅니다.
export function MatchingRequestCard({ request, onDismiss }: MatchingRequestCardProps) {
  const isWaiting = request.status === 'REQUESTED';

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <RemoteImage
          alt=""
          className="h-20 w-20 shrink-0 rounded-app object-cover"
          decorativeFallback
          src={request.spaceImageUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTones[request.status]}>
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
        {!isWaiting && onDismiss ? (
          <button
            aria-label={`${request.spaceTitle} 신청을 목록에서 지우기`}
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-app text-content-subtle transition-colors duration-ui hover:bg-action-soft hover:text-action focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
            onClick={onDismiss}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{request.message}</p>
      <div className="mt-4 grid gap-2">
        {/* 채팅은 화면만 먼저 만든 자리로, 아직 연결된 기능이 없습니다. */}
        <Button className="w-full">
          <MessageCircle className="h-5 w-5" aria-hidden />
          채팅
        </Button>
        <Link
          className={buttonStyles({ variant: 'outline', className: 'w-full' })}
          to={ROUTES.contract(request.matchingId)}
        >
          <FileText className="h-5 w-5" aria-hidden />
          계약서
        </Link>
      </div>
    </Card>
  );
}
