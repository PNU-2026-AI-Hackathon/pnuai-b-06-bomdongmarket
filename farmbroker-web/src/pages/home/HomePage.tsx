import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { clearAuthSession } from '@/auth/session';
import { Footer } from '@/components/layout/Footer';
import { CampaignCarousel } from '@/pages/home/components/CampaignCarousel';
import { RoleJourneySections } from '@/pages/home/components/RoleJourneySections';

interface HomeLocationState {
  withdrawalCompleted?: boolean;
}

// 세 사용자 역할과 지역 순환 가치를 캠페인 포스터와 역할별 흐름으로 소개합니다.
export function HomePage() {
  const location = useLocation();
  const state = location.state as HomeLocationState | null;

  useEffect(() => {
    if (state?.withdrawalCompleted) clearAuthSession();
  }, [state?.withdrawalCompleted]);

  return (
    <>
      {state?.withdrawalCompleted ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6" role="status">
          <p className="rounded-app border border-line bg-feedback-success-soft p-3 text-sm font-semibold text-feedback-success">
            회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.
          </p>
        </div>
      ) : null}
      <CampaignCarousel />
      <RoleJourneySections />
      <Footer />
    </>
  );
}
