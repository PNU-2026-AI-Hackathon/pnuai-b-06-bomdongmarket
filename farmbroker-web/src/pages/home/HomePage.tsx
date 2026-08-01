import { CampaignCarousel } from '@/pages/home/components/CampaignCarousel';
import { RoleJourneySections } from '@/pages/home/components/RoleJourneySections';

// 세 사용자 역할과 지역 순환 가치를 캠페인 포스터와 역할별 흐름으로 소개합니다.
export function HomePage() {
  return (
    <>
      <CampaignCarousel />
      <RoleJourneySections />
    </>
  );
}
