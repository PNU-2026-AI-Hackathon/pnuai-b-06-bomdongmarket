import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { Card } from '@/components/common/Card';
import { buttonStyles } from '@/components/common/buttonStyles';
import { ROUTES } from '@/constants/routes';

interface SpaceMatchingRequestCardProps {
  spaceId: number;
}

// 공간 상세에서 매칭 신청 화면으로 넘어가는 진입점입니다.
// 유형·메시지 입력과 신청 현황은 신청 화면이 함께 담당하므로 여기서는 안내와 이동만 합니다.
export function SpaceMatchingRequestCard({ spaceId }: SpaceMatchingRequestCardProps) {
  const { isAuthenticated } = useAuth();

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
