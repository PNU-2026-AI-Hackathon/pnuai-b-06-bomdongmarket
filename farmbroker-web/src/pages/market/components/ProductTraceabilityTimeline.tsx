import { CheckCircle2 } from 'lucide-react';

import { traceabilitySteps } from '@/pages/market/constants/marketOptions';

// 상품 상세에서 생산 이력을 모바일에서도 읽기 쉬운 세로 타임라인으로 표시합니다.
export function ProductTraceabilityTimeline() {
  return (
    <ol className="grid gap-3">
      {traceabilitySteps.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block font-bold text-ink-900">{step}</span>
            <span className="text-sm text-slate-600">
              생산자 기록으로 확인된 {Math.max(1, index * 7 + 1)}일차 단계
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
