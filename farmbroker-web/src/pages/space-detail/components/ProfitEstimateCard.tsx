import { Bot, ChartNoAxesCombined, Send } from 'lucide-react';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingState } from '@/components/common/LoadingState';
import type { AiRecommendation } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency, formatNumber } from '@/utils/format';

interface ProfitEstimateCardProps {
  recommendation: AiRecommendation | null;
  status: AsyncStatus;
  onRun: () => void;
}

// AI 추천 결과를 수익 예측과 매칭 신청 CTA로 이어주는 상세 페이지 보조 패널입니다.
export function ProfitEstimateCard({
  recommendation,
  status,
  onRun,
}: ProfitEstimateCardProps) {
  const requireAuth = useRequireAuth();

  if (status === 'loading') {
    return <LoadingState label="AI 추천을 실행하는 중입니다" />;
  }

  const primaryCrop = recommendation?.recommendedCrops[0];
  const expectedRevenue =
    primaryCrop?.expectedYieldKg && primaryCrop.avgPricePerKg
      ? primaryCrop.expectedYieldKg * primaryCrop.avgPricePerKg
      : 0;
  const operatingCost = Math.round(expectedRevenue * 0.34);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Badge tone="blue">AI 추천</Badge>
          <h2 className="mt-3 text-xl font-black text-ink-900">수익성과 작물 적합도</h2>
        </div>
        <Bot className="h-9 w-9 text-leaf-700" aria-hidden />
      </div>

      {!recommendation ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-600">
            이 공간의 면적, 시설, 월세 조건을 기준으로 데모용 Gemini 추천 결과를
            실행합니다. 응답 구조는 백엔드 API 명세와 동일하게 맞췄습니다.
          </p>
          <Button className="mt-5 w-full" onClick={onRun}>
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden />
            AI 추천 실행
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-app bg-leaf-50 p-3">
              <p className="text-xs font-semibold text-slate-500">추천 작물</p>
              <p className="mt-1 font-black text-ink-900">{primaryCrop?.cropName}</p>
            </div>
            <div className="rounded-app bg-soil-50 p-3">
              <p className="text-xs font-semibold text-slate-500">예상 매출</p>
              <p className="mt-1 font-black text-ink-900">
                {formatCurrency(expectedRevenue)}
              </p>
            </div>
            <div className="rounded-app bg-skyfarm-50 p-3">
              <p className="text-xs font-semibold text-slate-500">예상 순수익</p>
              <p className="mt-1 font-black text-ink-900">
                {formatCurrency(expectedRevenue - operatingCost)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-app border border-leaf-100 bg-white p-4">
            <h3 className="text-sm font-bold text-ink-900">배치 제안</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {recommendation.layoutSuggestion}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 rounded bg-leaf-100 ring-1 ring-leaf-200"
                  aria-label={`재배 선반 구역 ${formatNumber(index + 1)}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {recommendation.recommendedCrops.map((crop) => (
              <div
                key={crop.cropName}
                className="rounded-app border border-leaf-100 px-3 py-2"
              >
                <p className="font-bold text-ink-900">{crop.cropName}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{crop.reason}</p>
              </div>
            ))}
          </div>

          <Button className="mt-5 w-full" onClick={() => requireAuth()}>
            <Send className="h-5 w-5" aria-hidden />
            매칭 신청 보내기
          </Button>
        </div>
      )}
    </Card>
  );
}
