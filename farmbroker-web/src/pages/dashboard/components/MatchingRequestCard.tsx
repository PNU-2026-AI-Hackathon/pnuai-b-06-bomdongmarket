import { FileText, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useChatDock } from '@/chat/chatDockContext';
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
  // 신청 상태는 유지한 채 받은 알림 목록에서만 치웁니다.
  onDismiss?: () => void;
  // 채팅이 열린 뒤 호출합니다. 이 카드를 감싼 알림 모달이 채팅 도크를 덮으므로 모달을 비켜 줍니다.
  onChatOpen?: () => void;
}

const statusTones: Record<MatchingStatus, BadgeTone> = {
  REQUESTED: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELED: 'red',
};

// 소유자가 받은 매칭 신청을 카드 단위로 확인하고 채팅·계약서로 이어갑니다.
// 버튼 구성은 공간 상세의 SpaceMatchingRequestCard와 같습니다 — 양측이 같은 흐름을 봅니다.
export function MatchingRequestCard({
  request,
  onDismiss,
  onChatOpen,
}: MatchingRequestCardProps) {
  const chatDock = useChatDock();
  const [chatError, setChatError] = useState<string | null>(null);

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
        {onDismiss ? (
          <Button
            aria-label={`${request.spaceTitle} 신청을 목록에서 지우기`}
            className="-mr-1 -mt-1 h-9 w-9 shrink-0 self-start px-0"
            onClick={onDismiss}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{request.message}</p>
      <div className="mt-4 grid gap-2">
        {/* 신청자와의 공간 문의 방을 엽니다. 이미 있으면 그 방이 열립니다. */}
        <Button
          className="w-full"
          onClick={() => {
            setChatError(null);
            void chatDock
              .openContext('SPACE', request.spaceId, request.farmerId)
              // 실패하면 닫지 않습니다 — 모달이 닫히면 아래 오류 문구를 볼 수 없습니다.
              .then(() => onChatOpen?.())
              .catch((caught: unknown) => {
                setChatError(
                  caught instanceof Error ? caught.message : '채팅을 열지 못했습니다.',
                );
              });
          }}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          채팅
        </Button>
        {chatError ? (
          <p className="text-sm font-semibold text-feedback-danger" role="alert">
            {chatError}
          </p>
        ) : null}
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
