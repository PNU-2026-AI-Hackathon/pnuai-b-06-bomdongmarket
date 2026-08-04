import { Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Textarea } from '@/components/common/Textarea';
import { ROUTES } from '@/constants/routes';
import { useMatchingApplication } from '@/pages/space-detail/hooks/useMatchingApplication';

interface SpaceMatchingRequestCardProps {
  spaceId: number;
}

// 공간 상세에서 농부가 바로 상담을 신청할 수 있는 카드입니다.
export function SpaceMatchingRequestCard({ spaceId }: SpaceMatchingRequestCardProps) {
  const { isAuthenticated, user } = useAuth();
  const isFarmer = isAuthenticated && user?.role === 'FARMER';
  const [message, setMessage] = useState(
    '이 공간에서 스마트팜을 운영하고 싶습니다. 매칭 상담을 요청드립니다.',
  );
  const { status, error, result, submit } = useMatchingApplication(spaceId, isFarmer);

  if (!isAuthenticated) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          도심 농부 계정으로 로그인하면 이 공간의 매칭 상담을 신청할 수 있습니다.
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

  if (!user) return null;

  if (!isFarmer) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
        <p className="mt-2 text-body-sm text-content-muted">
          매칭 신청은 도심 농부 계정에서 사용할 수 있습니다.
        </p>
      </Card>
    );
  }

  const apply = async () => {
    if (!message.trim()) return;
    const succeeded = await submit(message.trim());
    if (succeeded) setMessage('');
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">공간 매칭 신청</h2>
      <p className="mt-2 text-body-sm text-content-muted">
        운영 계획을 간단히 적어 공간 제공자에게 매칭 상담을 요청하세요.
      </p>
      <div className="mt-5">
        <Textarea
          helperText="최대 500자까지 입력할 수 있습니다. 신청 결과는 대시보드에서 확인하세요."
          label="매칭 신청 메시지"
          maxLength={500}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>
      {error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm font-semibold text-feedback-danger">{error}</p>
          <Button className="mt-3" onClick={() => void apply()} variant="outline">
            매칭 신청 다시 시도
          </Button>
        </div>
      ) : null}
      {result ? (
        <p className="mt-4 text-sm font-semibold text-feedback-success" role="status">
          매칭 신청이 완료되었습니다. 신청 번호 {result.matchingId}의 결과는 대시보드에서
          확인하세요.
        </p>
      ) : null}
      <Button
        className="mt-5 w-full"
        disabled={!message.trim() || status === 'loading'}
        onClick={() => void apply()}
      >
        <Send className="h-5 w-5" aria-hidden />
        {status === 'loading' ? '매칭 신청 중...' : '매칭 신청 보내기'}
      </Button>
    </Card>
  );
}
