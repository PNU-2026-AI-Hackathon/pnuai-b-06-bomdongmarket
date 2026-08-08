import { CheckCircle2 } from 'lucide-react';

import type { MarketTraceabilityEvent } from '@/types/api';
import { formatDate } from '@/utils/format';

interface ProductTraceabilityTimelineProps {
  events?: MarketTraceabilityEvent[];
}

// 상품 상세에서 생산 이력을 모바일에서도 읽기 쉬운 세로 타임라인으로 표시합니다.
// 이벤트는 GET /products/{id}의 traceabilityEvents를 그대로 받습니다(목록 응답에는 없음).
export function ProductTraceabilityTimeline({ events }: ProductTraceabilityTimelineProps) {
  const items = [...(events ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (items.length === 0) {
    return <p className="text-sm text-slate-600">등록된 생산 이력이 없습니다.</p>;
  }

  return (
    <ol className="grid gap-3">
      {items.map((event) => (
        <li className="flex gap-3" key={event.eventId}>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <span>
            <span className="block font-bold text-ink-900">{event.stage}</span>
            <span className="text-sm text-slate-600">
              {event.description ? `${event.description} · ` : ''}
              {formatDate(event.occurredAt)}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
