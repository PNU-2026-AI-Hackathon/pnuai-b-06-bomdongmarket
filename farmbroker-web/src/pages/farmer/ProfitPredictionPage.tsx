import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageContainer } from '../../components/layout/PageContainer';
import { ROUTES } from '../../constants/routes';
import { PredictionResultCard } from './components/PredictionResultCard';

// 공간 등록 이후 시연할 수 있는 수익 예측 결과 화면입니다.
export function ProfitPredictionPage() {
  return (
    <PageContainer narrow>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-leaf-700"
        to={ROUTES.newSpace}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to registration
      </Link>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
          Profit Prediction
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink-900">
          Expected return from the selected space
        </h1>
      </div>
      <PredictionResultCard />
    </PageContainer>
  );
}
