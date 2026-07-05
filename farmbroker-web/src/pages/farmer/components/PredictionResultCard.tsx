import { Save, Send } from 'lucide-react';

import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { predictionMetrics } from '../constants/farmerContent';
import { formatCurrency } from '../../../utils/format';

// 수익 예측 결과 화면의 핵심 수치를 한눈에 보이도록 정리합니다.
export function PredictionResultCard() {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            Recommended Crop
          </p>
          <h2 className="mt-2 text-3xl font-black text-ink-900">Butterhead Lettuce</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Prediction is calculated based on area, crop type, and cultivation period.
          </p>
        </div>
        <div className="rounded-app bg-leaf-800 px-4 py-3 text-white">
          <span className="block text-xs font-semibold text-leaf-100">
            Payback Period
          </span>
          <span className="text-2xl font-black">7.5 mo</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {predictionMetrics.map((metric) => (
          <div key={metric.label} className="rounded-app bg-leaf-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-2 text-xl font-black text-ink-900">
              {formatCurrency(metric.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-app border border-leaf-100 bg-white p-4">
        <h3 className="font-bold text-ink-900">Smart farm layout preview</h3>
        <div className="mt-4 grid grid-cols-[1fr_1fr_0.5fr] gap-3">
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 rounded bg-leaf-100" />
            ))}
          </div>
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 rounded bg-leaf-200" />
            ))}
          </div>
          <div className="rounded bg-soil-100" aria-label="Water and packing zone" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline">
          <Save className="h-5 w-5" aria-hidden />
          Save Result
        </Button>
        <Button>
          <Send className="h-5 w-5" aria-hidden />
          Request Matching
        </Button>
      </div>
    </Card>
  );
}
