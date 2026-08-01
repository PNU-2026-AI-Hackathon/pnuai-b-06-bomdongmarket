import { useCallback, useEffect, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

export function useAutoCarousel(itemCount: number, intervalMs: number) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const isAutoPaused = prefersReducedMotion || isManuallyPaused || isInteracting;

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + itemCount) % itemCount);
  }, [itemCount]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % itemCount);
  }, [itemCount]);

  useEffect(() => {
    if (isAutoPaused || itemCount < 2) return undefined;

    const timer = window.setInterval(showNext, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, isAutoPaused, itemCount, showNext]);

  return {
    activeIndex,
    isManuallyPaused,
    setActiveIndex,
    setIsInteracting,
    showNext,
    showPrevious,
    toggleAutoPlay: () => setIsManuallyPaused((current) => !current),
  };
}
