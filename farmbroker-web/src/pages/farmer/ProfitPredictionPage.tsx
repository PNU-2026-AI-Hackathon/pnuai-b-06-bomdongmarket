import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { PredictionResultCard } from '@/pages/farmer/components/PredictionResultCard';

// 공간 등록 이후 시연할 수 있는 수익 예측 결과 화면입니다.
export function ProfitPredictionPage() {
  return (
    <PageContainer narrow>
      <Link
        className={buttonStyles({
          className: 'mb-5 -ml-3',
          size: 'sm',
          variant: 'ghost',
        })}
        to={ROUTES.newSpace}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        등록 화면으로 돌아가기
      </Link>
      <div className="mb-6">
        <PageHeader
          eyebrow="수익 예측"
          title="선택한 공간의 예상 수익을 확인하세요"
        />
      </div>
      <PredictionResultCard />
    </PageContainer>
  );
}
