import { Bot, ChartNoAxesCombined, Send } from 'lucide-react';

import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { LoadingState } from '../../../components/common/LoadingState';
import type { AiRecommendation } from '../../../types/api';
import type { AsyncStatus } from '../../../types/common';
import { formatCurrency, formatNumber } from '../../../utils/format';

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
  if (status === 'loading') {
    return <LoadingState label="Running AI recommendation" />;
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
          <Badge tone="blue">AI Recommendation</Badge>
          <h2 className="mt-3 text-xl font-black text-ink-900">Profit and crop fit</h2>
        </div>
        <Bot className="h-9 w-9 text-leaf-700" aria-hidden />
      </div>

      {!recommendation ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-600">
            Run a mock Gemini recommendation using this space’s area, utilities, and rent.
            The response matches the backend API shape.
          </p>
          <Button className="mt-5 w-full" onClick={onRun}>
            <ChartNoAxesCombined className="h-5 w-5" aria-hidden />
            Run AI Recommendation
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-app bg-leaf-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Recommended Crop</p>
              <p className="mt-1 font-black text-ink-900">{primaryCrop?.cropName}</p>
            </div>
            <div className="rounded-app bg-soil-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Expected Revenue</p>
              <p className="mt-1 font-black text-ink-900">
                {formatCurrency(expectedRevenue)}
              </p>
            </div>
            <div className="rounded-app bg-skyfarm-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Net Profit</p>
              <p className="mt-1 font-black text-ink-900">
                {formatCurrency(expectedRevenue - operatingCost)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-app border border-leaf-100 bg-white p-4">
            <h3 className="text-sm font-bold text-ink-900">Layout suggestion</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {recommendation.layoutSuggestion}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 rounded bg-leaf-100 ring-1 ring-leaf-200"
                  aria-label={`Rack zone ${formatNumber(index + 1)}`}
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

          <Button className="mt-5 w-full">
            <Send className="h-5 w-5" aria-hidden />
            Send Matching Request
          </Button>
        </div>
      )}
    </Card>
  );
}
