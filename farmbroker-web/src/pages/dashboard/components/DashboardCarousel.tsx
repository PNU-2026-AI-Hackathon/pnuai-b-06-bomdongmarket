import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Children, type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';

interface DashboardCarouselProps {
  title: string;
  children: ReactNode;
  emptyState: ReactNode;
}

// 대시보드의 카드 묶음을 터치 스크롤과 명시적인 이전/다음 버튼으로 탐색합니다.
export function DashboardCarousel({
  title,
  children,
  emptyState,
}: DashboardCarouselProps) {
  const titleId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const items = Children.toArray(children);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateControls = () => {
    const list = listRef.current;
    if (!list) return;
    setCanScrollPrevious(list.scrollLeft > 1);
    setCanScrollNext(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
  };

  useEffect(() => {
    updateControls();
    window.addEventListener('resize', updateControls);
    return () => window.removeEventListener('resize', updateControls);
  }, [items.length]);

  const scroll = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({
      left: direction * Math.max(list.clientWidth * 0.8, 256),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section aria-labelledby={titleId}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black text-content" id={titleId}>
          {title}
        </h2>
        {items.length > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              aria-label={title + ' 이전 항목'}
              className="h-11 w-11 px-0"
              disabled={!canScrollPrevious}
              onClick={() => scroll(-1)}
              variant="outline"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              aria-label={title + ' 다음 항목'}
              className="h-11 w-11 px-0"
              disabled={!canScrollNext}
              onClick={() => scroll(1)}
              variant="outline"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4">{emptyState}</div>
      ) : (
        <ul
          className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
          onScroll={updateControls}
          ref={listRef}
        >
          {items.map((item, index) => (
            <li className="w-64 shrink-0 snap-start sm:w-72 lg:w-80" key={index}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
