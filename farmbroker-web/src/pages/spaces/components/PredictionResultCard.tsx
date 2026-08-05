import { Card } from '@/components/common/Card';
import { LoadingState } from '@/components/common/LoadingState';
import {
  paybackPeriod,
  predictionMetrics,
} from '@/pages/spaces/constants/predictionContent';
import type { AiRecommendation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency } from '@/utils/format';

interface PredictionResultCardProps {
  recommendation: AiRecommendation | null;
  status: AsyncStatus;
}

// 등록 확인 단계에서 추천 작물과 예상 수익 지표를 한눈에 보이도록 정리합니다.
export function PredictionResultCard({
  recommendation,
  status,
}: PredictionResultCardProps) {
  if (status === 'loading' || !recommendation) {
    return <LoadingState label="수익 예측을 계산하는 중입니다" />;
  }

  const primaryCrop = recommendation.recommendedCrops[0];

  return (
    <Card padding="lg">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-eyebrow uppercase text-accent">추천 작물</p>
          <h2 className="mt-2 text-3xl font-black text-content">
            {primaryCrop.cropName}
          </h2>
          <p className="mt-3 max-w-xl text-body-sm text-content-muted">
            예측 결과는 면적, 작물 종류, 재배 기간을 기준으로 계산됩니다.
          </p>
        </div>
        <div className="rounded-app bg-action-hover px-4 py-3 text-content-inverse">
          <span className="block text-xs font-semibold">회수 기간</span>
          <span className="text-2xl font-black">{paybackPeriod}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {predictionMetrics.map((metric) => (
          <div key={metric.label} className="rounded-app bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-content-subtle">{metric.label}</p>
            <p className="mt-2 text-xl font-black text-content">
              {formatCurrency(metric.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-app border border-line bg-surface p-4">
        <h3 className="font-bold text-content">스마트팜 배치 미리보기</h3>
        <p className="mt-2 text-body-sm text-content-muted">
          {recommendation.layoutSuggestion}
        </p>
        <div className="mt-4 grid grid-cols-[1fr_1fr_0.5fr] gap-3">
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 rounded bg-action-soft" />
            ))}
          </div>
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 rounded bg-line-strong" />
            ))}
          </div>
          <div className="rounded bg-accent-soft" aria-label="급수 및 포장 구역" />
        </div>
      </div>

      <div className="mt-6 rounded-app border border-line bg-surface p-4">
        <h3 className="font-bold text-content">확인이 필요한 점</h3>
        <ul className="mt-2 grid gap-2">
          {recommendation.cautions.map((caution) => (
            <li key={caution} className="text-body-sm text-content-muted">
              {caution}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
