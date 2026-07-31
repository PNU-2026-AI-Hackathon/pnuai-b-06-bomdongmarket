import { TrendingUp } from 'lucide-react';

import { Card } from '@/components/common/Card';
import type { DashboardMetric } from '@/types/api';

interface MetricCardProps {
  metric: DashboardMetric;
}

// 홈 대시보드의 핵심 수치를 모바일 카드로 스캔하기 쉽게 보여줍니다.
export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
          <p className="mt-2 text-3xl font-black text-ink-900">{metric.value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-app bg-leaf-100 text-leaf-800">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{metric.helper}</p>
      <p className="mt-1 text-xs font-bold text-leaf-700">{metric.trend}</p>
    </Card>
  );
}
