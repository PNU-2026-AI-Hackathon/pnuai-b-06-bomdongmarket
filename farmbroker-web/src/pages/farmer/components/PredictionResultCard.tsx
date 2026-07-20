import { Save, Send } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

const predictionMetricLabels = ['예상 월 매출', '예상 운영비', '예상 순수익'] as const;

// 수익 예측 결과 화면의 핵심 수치를 한눈에 보이도록 정리합니다.
export function PredictionResultCard() {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
            추천 작물
          </p>
          <h2 className="mt-2 text-3xl font-black text-ink-900">버터헤드 상추</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            예측 결과는 면적, 작물 종류, 재배 기간을 기준으로 계산됩니다.
          </p>
        </div>
        <div className="rounded-app bg-leaf-800 px-4 py-3 text-white">
          <span className="block text-xs font-semibold text-leaf-100">회수 기간</span>
          <span className="text-2xl font-black">7.5개월</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {predictionMetricLabels.map((label) => (
          <div key={label} className="rounded-app bg-leaf-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black text-ink-900">계산 전</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-app border border-leaf-100 bg-white p-4">
        <h3 className="font-bold text-ink-900">스마트팜 배치 미리보기</h3>
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
          <div className="rounded bg-soil-100" aria-label="급수 및 포장 구역" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline">
          <Save className="h-5 w-5" aria-hidden />
          결과 저장
        </Button>
        <Button>
          <Send className="h-5 w-5" aria-hidden />
          매칭 신청
        </Button>
      </div>
    </Card>
  );
}
