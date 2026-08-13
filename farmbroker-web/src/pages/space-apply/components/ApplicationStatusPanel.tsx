import { MessageCircle } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDisclosure } from '@/hooks/useDisclosure';
import type { BadgeTone } from '@/components/common/Badge';
import type { MatchingStatus, MyMatching } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatDate } from '@/utils/format';
import { getMatchingProgressLabel, getMatchingTypeLabel } from '@/utils/labels';

interface ApplicationStatusPanelProps {
  application: MyMatching;
  actionStatus: AsyncStatus;
  actionError: string | null;
  onCancel: () => void;
}

const statusTones: Record<MatchingStatus, BadgeTone> = {
  REQUESTED: 'yellow',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELED: 'slate',
};

// 이미 보낸 신청의 내용과 매칭 상태를 보여주고, 아직 응답 전이면 취소할 수 있게 합니다.
export function ApplicationStatusPanel({
  application,
  actionStatus,
  actionError,
  onCancel,
}: ApplicationStatusPanelProps) {
  const confirmation = useDisclosure();
  const isCanceling = actionStatus === 'loading';
  const isWaiting = application.status === 'REQUESTED';

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black text-content">내 신청</h2>
        <Badge tone={statusTones[application.status]}>
          {getMatchingProgressLabel(application.status)}
        </Badge>
      </div>

      <dl className="mt-5 grid gap-4">
        <div>
          <dt className="text-xs font-semibold text-content-subtle">신청 유형</dt>
          <dd className="font-bold text-content">
            {getMatchingTypeLabel(application.type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-content-subtle">신청일</dt>
          <dd className="font-bold text-content">{formatDate(application.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-content-subtle">신청 메시지</dt>
          <dd className="mt-1 whitespace-pre-wrap text-body-sm text-content">
            {application.message}
          </dd>
        </div>
      </dl>

      {/* 신청을 보낸 시점부터 공간 제공자와 이야기할 자리가 필요하므로 수락 전에도 노출합니다. */}
      <div className="mt-5">
        <Button className="w-full" disabled variant="outline">
          <MessageCircle className="h-5 w-5" aria-hidden />
          채팅방으로 이동
        </Button>
        <p className="mt-2 text-xs font-normal text-content-subtle">
          채팅 기능은 준비 중입니다. 그때까지는 공간 제공자에게 직접 연락해 주세요.
        </p>
      </div>

      {actionError ? (
        <p className="mt-4 text-sm font-semibold text-feedback-danger" role="alert">
          {actionError}
        </p>
      ) : null}

      {isWaiting ? (
        <>
          <Button
            className="mt-5 w-full"
            disabled={isCanceling}
            onClick={confirmation.open}
            variant="danger"
          >
            {isCanceling ? '취소 중...' : '신청 취소'}
          </Button>
          <ConfirmDialog
            confirmLabel="신청 취소"
            description="공간 제공자에게 보낸 신청이 철회됩니다. 취소한 뒤에도 같은 공간에 다시 신청할 수 있습니다."
            isOpen={confirmation.isOpen}
            isPending={isCanceling}
            onCancel={confirmation.close}
            onConfirm={() => {
              confirmation.close();
              onCancel();
            }}
            title="신청을 취소하시겠습니까?"
            tone="danger"
          />
        </>
      ) : null}
    </Card>
  );
}
