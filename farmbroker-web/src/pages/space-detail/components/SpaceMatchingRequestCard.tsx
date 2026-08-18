import { FileText, MessageCircle, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { useChatDock } from '@/chat/chatDockContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';
import { useDisclosure } from '@/hooks/useDisclosure';
import { findActiveApplication } from '@/pages/space-apply/hooks/useSpaceApplication';
import { cancelMatching, getMyMatchings } from '@/services/matchingService';
import type { MyMatching } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { getMatchingProgressLabel } from '@/utils/labels';

interface SpaceMatchingRequestCardProps {
  spaceId: number;
}

// 공간 상세에서 매칭 신청 화면으로 넘어가는 진입점이자, 이미 신청한 공간이면 후속 행동을 모으는 카드입니다.
// 상세 조회 응답에는 내 신청 정보가 없어 my-requests를 이 카드에서 따로 조회합니다.
export function SpaceMatchingRequestCard({ spaceId }: SpaceMatchingRequestCardProps) {
  const { isAuthenticated } = useAuth();
  const chatDock = useChatDock();
  const [chatError, setChatError] = useState<string | null>(null);
  const [application, setApplication] = useState<MyMatching | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const confirmation = useDisclosure();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isCurrent = true;
    setStatus('loading');
    getMyMatchings(spaceId)
      .then((matchings) => {
        if (!isCurrent) return;
        setApplication(findActiveApplication(matchings));
        setStatus('success');
      })
      .catch(() => {
        // 신청 이력을 못 불러와도 신청 화면 진입까지 막지는 않습니다.
        if (isCurrent) setStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, spaceId]);

  if (!isAuthenticated) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          로그인하면 이 공간의 매칭 상담을 신청할 수 있습니다. 신청이 수락되면 도심 농부
          역할이 추가됩니다.
        </p>
        <Link className="mt-5 inline-flex text-sm font-bold text-action" to={ROUTES.login}>
          로그인하고 매칭 신청하기
        </Link>
      </Card>
    );
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-5 text-body-sm text-content-muted" role="status">
          이 공간에 보낸 신청이 있는지 확인하는 중입니다
        </p>
      </Card>
    );
  }

  if (application) {
    // 취소는 아직 응답받지 않은 신청만 가능합니다(수락·거절 뒤에는 서버가 409로 막습니다).
    const canCancel = application.status === 'REQUESTED';

    const cancel = async () => {
      setIsCanceling(true);
      setCancelError(null);
      try {
        await cancelMatching(application.matchingId);
        // 취소하면 같은 공간에 다시 신청할 수 있으므로 신청 전 상태로 되돌립니다.
        setApplication(null);
      } catch (caught) {
        setCancelError(
          caught instanceof Error ? caught.message : '매칭 신청을 취소하지 못했습니다.',
        );
      } finally {
        setIsCanceling(false);
      }
    };

    return (
      <Card padding="lg">
        <h2 className="text-xl font-black text-content">내 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          이미 이 공간에 매칭을 신청했습니다. 현재 상태는{' '}
          {getMatchingProgressLabel(application.status)}입니다.
        </p>

        {cancelError ? (
          <p className="mt-4 text-sm font-semibold text-feedback-danger" role="alert">
            {cancelError}
          </p>
        ) : null}

        <div className="mt-5 grid gap-2">
          {/* 공간 문의 방을 엽니다. 이미 있으면 그 방이 열립니다. */}
          <Button
            className="w-full"
            onClick={() => {
              setChatError(null);
              void chatDock.openContext('SPACE', spaceId).catch((caught: unknown) => {
                setChatError(caught instanceof Error ? caught.message : '채팅을 열지 못했습니다.');
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
            to={ROUTES.contract(application.matchingId)}
          >
            <FileText className="h-5 w-5" aria-hidden />
            계약서
          </Link>
          {canCancel ? (
            <Button
              className="w-full"
              disabled={isCanceling}
              onClick={confirmation.open}
              variant="danger"
            >
              {isCanceling ? '취소 중...' : '신청 취소'}
            </Button>
          ) : null}
        </div>

        {canCancel ? (
          <ConfirmDialog
            confirmLabel="신청 취소"
            description="공간 제공자에게 보낸 신청이 철회됩니다. 취소한 뒤에도 같은 공간에 다시 신청할 수 있습니다."
            isOpen={confirmation.isOpen}
            isPending={isCanceling}
            onCancel={confirmation.close}
            onConfirm={() => {
              confirmation.close();
              void cancel();
            }}
            title="신청을 취소하시겠습니까?"
            tone="danger"
          />
        ) : null}
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
      <p className="mt-2 text-body-sm text-content-muted">
        재배 목적과 운영 계획을 적어 공간 제공자에게 매칭 상담을 요청하세요. 이미 신청한
        공간이면 진행 상태를 확인하고 취소할 수 있습니다.
      </p>
      <Link
        className={buttonStyles({ className: 'mt-5 w-full' })}
        to={ROUTES.spaceApply(spaceId)}
      >
        <Send className="h-5 w-5" aria-hidden />
        매칭 신청하기
      </Link>
    </Card>
  );
}
