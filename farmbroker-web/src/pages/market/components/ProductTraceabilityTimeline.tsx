import { CheckCircle2 } from 'lucide-react';

import type { MarketTraceabilityEvent } from '@/types/api';
import { formatDate } from '@/utils/format';

interface ProductTraceabilityTimelineProps {
  events: MarketTraceabilityEvent[];
}

// 상품 상세의 생산 이력을 실제 등록된 이벤트로 표시한다(모바일에서도 읽기 쉬운 세로 타임라인).
// 이력을 등록하지 않은 상품은 단계를 지어내지 않고 빈 상태를 보여준다 — 직거래 신뢰상 허위 이력을 만들지 않는다.
export function ProductTraceabilityTimeline({ events }: ProductTraceabilityTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">아직 등록된 생산 이력이 없습니다.</p>
    );
  }

  const ordered = [...events].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ol className="grid gap-3">
      {ordered.map((event) => (
        <li key={event.eventId} className="flex gap-3">
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
