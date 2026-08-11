import { TrendingUp } from 'lucide-react';

import { Card } from '@/components/common/Card';
import type { DashboardMetric } from '@/types/api';

interface MetricCardProps {
  metric: DashboardMetric;
  // 같은 페이지 안의 상세 섹션으로 보내는 앵커(#id). 대상 섹션이 없으면 생략합니다.
  href?: string;
}

// 홈 대시보드의 핵심 수치를 모바일 카드로 스캔하기 쉽게 보여줍니다.
export function MetricCard({ metric, href }: MetricCardProps) {
  const body = (
    <>
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
      {metric.trend ? (
        <p className="mt-1 text-xs font-bold text-leaf-700">{metric.trend}</p>
      ) : null}
    </>
  );

  if (!href) {
    return <Card className="p-4">{body}</Card>;
  }

  // 페이지 내 이동이라 react-router Link가 아닌 기본 앵커를 씁니다.
  return (
    <a
      aria-label={`${metric.label} 자세히 보기`}
      className="block rounded-app focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
      href={href}
    >
      <Card className="p-4" variant="interactive">
        {body}
      </Card>
    </a>
  );
}
