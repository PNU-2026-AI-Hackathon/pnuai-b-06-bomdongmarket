import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { ROUTES } from '@/constants/routes';
import { useSpaceMatching } from '@/pages/spaces/hooks/useSpaceMatching';
import type { SpaceSummary } from '@/types/api';
import { formatCurrency } from '@/utils/format';
import { getMatchingStatusLabel } from '@/utils/labels';

interface SpaceMatchingPanelProps {
  spaces: SpaceSummary[];
  initialSpaceId: number | null;
}

// 농부의 공간 선택, 매칭 신청, 신청 결과 확인을 공간 탐색 화면에 통합합니다.
export function SpaceMatchingPanel({ spaces, initialSpaceId }: SpaceMatchingPanelProps) {
  const { isAuthenticated, user } = useAuth();
  const isFarmer = isAuthenticated && user?.role === 'FARMER';
  const [spaceId, setSpaceId] = useState('');
  const handledInitialSpaceId = useRef<number | null>(null);
  const [message, setMessage] = useState(
    '이 공간에서 스마트팜을 운영하고 싶습니다. 매칭 상담을 요청드립니다.',
  );
  const {
    requests,
    requestsStatus,
    requestsError,
    submitStatus,
    submitError,
    submitted,
    loadRequests,
    submit,
  } = useSpaceMatching({ enabled: isFarmer });

  useEffect(() => {
    if (initialSpaceId !== handledInitialSpaceId.current) {
      const requestedSpace = spaces.find((space) => space.spaceId === initialSpaceId);
      if (requestedSpace) {
        setSpaceId(String(requestedSpace.spaceId));
        handledInitialSpaceId.current = initialSpaceId;
        return;
      }
      if (spaces.length === 0) return;
      setSpaceId('');
      handledInitialSpaceId.current = initialSpaceId;
      return;
    }
    if (!spaces.some((space) => String(space.spaceId) === spaceId)) setSpaceId('');
  }, [initialSpaceId, spaceId, spaces]);

  if (!isAuthenticated) {
    return (
      <Card id="matching-request" padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          관심 공간을 고른 뒤 도심 농부 계정으로 매칭 상담을 신청할 수 있습니다.
        </p>
        <Link
          className="mt-5 inline-flex text-sm font-bold text-action"
          to={ROUTES.login}
        >
          로그인하고 매칭 신청하기
        </Link>
      </Card>
    );
  }

  if (!user) {
    return <LoadingState label="매칭 신청 권한을 확인하는 중입니다" />;
  }

  if (!isFarmer) {
    return (
      <Card id="matching-request" padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          매칭 신청은 도심 농부 계정에서 사용할 수 있습니다. 공간 제공자는 대시보드에서
          받은 신청을 확인할 수 있습니다.
        </p>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!spaceId || !message.trim()) return;
    const succeeded = await submit({ spaceId: Number(spaceId), message: message.trim() });
    if (succeeded) setMessage('');
  };

  return (
    <section id="matching-request" aria-labelledby="matching-request-title">
      <Card padding="lg">
        <h2 id="matching-request-title" className="text-xl font-black text-content">
          공간 매칭 신청
        </h2>
        <p className="mt-2 text-body-sm text-content-muted">
          공간과 상담 메시지를 입력하면 공간 제공자에게 매칭 신청을 보냅니다.
        </p>
        <div className="mt-5 grid gap-4">
          <Select
            label="매칭할 공간"
            required
            value={spaceId}
            onChange={(event) => setSpaceId(event.target.value)}
          >
            <option value="">공간을 선택하세요</option>
            {spaces.map((space) => (
              <option key={space.spaceId} value={space.spaceId}>
                {space.title} · {formatCurrency(space.monthlyRent)}
              </option>
            ))}
          </Select>
          <Textarea
            helperText="최대 500자까지 입력할 수 있습니다."
            label="매칭 신청 메시지"
            maxLength={500}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        {submitError ? (
          <div className="mt-4" role="alert">
            <p className="text-sm font-semibold text-feedback-danger">{submitError}</p>
            <Button
              className="mt-3"
              onClick={() => void handleSubmit()}
              variant="outline"
            >
              매칭 신청 다시 시도
            </Button>
          </div>
        ) : null}
        {submitted ? (
          <p className="mt-4 text-sm font-semibold text-feedback-success" role="status">
            매칭 신청이 완료되었습니다. 신청 번호 {submitted.matchingId}의 결과를 아래에서
            확인하세요.
          </p>
        ) : null}
        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={!spaceId || !message.trim() || submitStatus === 'loading'}
          onClick={() => void handleSubmit()}
        >
          <Send className="h-5 w-5" aria-hidden />
          {submitStatus === 'loading' ? '매칭 신청 중...' : '매칭 신청 보내기'}
        </Button>
      </Card>

      <section className="mt-6" aria-labelledby="my-matching-results-title">
        <h2 id="my-matching-results-title" className="text-xl font-black text-content">
          내 매칭 신청 결과
        </h2>
        <div className="mt-4">
          {requestsStatus === 'idle' || requestsStatus === 'loading' ? (
            <LoadingState label="내 매칭 신청 결과를 불러오는 중입니다" />
          ) : null}
          {requestsStatus === 'error' ? (
            <ErrorState
              message={requestsError ?? '내 매칭 신청 결과를 불러오지 못했습니다.'}
              onRetry={() => void loadRequests()}
            />
          ) : null}
          {requestsStatus === 'success' && requests.length === 0 ? (
            <EmptyState
              description="관심 있는 공간을 선택해 첫 매칭 상담을 신청해보세요."
              title="아직 보낸 매칭 신청이 없습니다"
            />
          ) : null}
          {requestsStatus === 'success' && requests.length > 0 ? (
            <ul className="grid list-none gap-3 p-0">
              {requests.map((request) => (
                <li key={request.matchingId}>
                  <Card padding="md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-content">{request.spaceTitle}</h3>
                      <span className="text-sm font-semibold text-action">
                        {getMatchingStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-content-muted">
                      {request.ownerNickname} · {formatCurrency(request.monthlyRent)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </section>
  );
}
