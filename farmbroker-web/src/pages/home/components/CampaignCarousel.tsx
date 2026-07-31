import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { FocusEvent } from 'react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { campaignSlides } from '@/pages/home/constants/homeContent';
import { useAutoCarousel } from '@/pages/home/hooks/useAutoCarousel';

const AUTO_ADVANCE_MS = 5500;

export function CampaignCarousel() {
  const {
    activeIndex,
    isManuallyPaused,
    setActiveIndex,
    setIsInteracting,
    showNext,
    showPrevious,
    toggleAutoPlay,
  } = useAutoCarousel(campaignSlides.length, AUTO_ADVANCE_MS);

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsInteracting(false);
    }
  }

  return (
    <section
      aria-label="봄동마켓 캠페인"
      aria-roledescription="carousel"
      className="relative overflow-hidden bg-ink-900 text-white"
      onBlurCapture={handleBlur}
      onFocusCapture={() => setIsInteracting(true)}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      <div
        aria-live="off"
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {campaignSlides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              key={slide.id}
              aria-hidden={!isActive}
              aria-label={`${index + 1} / ${campaignSlides.length}`}
              aria-roledescription="slide"
              className="relative min-h-[560px] w-full shrink-0 overflow-hidden"
            >
              <img
                alt={slide.imageAlt}
                className="absolute inset-0 h-full w-full object-cover opacity-60"
                loading={index === 0 ? 'eager' : 'lazy'}
                src={slide.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/85 to-leaf-900/30" />
              <div className="relative mx-auto grid min-h-[560px] max-w-7xl content-end gap-8 px-4 pb-20 pt-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:pb-20">
                <div className="max-w-3xl">
                  <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-leaf-50 ring-1 ring-white/20 backdrop-blur">
                    {slide.eyebrow}
                  </p>
                  <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                    {slide.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-leaf-50/90 sm:text-lg">
                    {slide.description}
                  </p>
                  <Link
                    className={buttonStyles({
                      variant: 'secondary',
                      size: 'lg',
                      className: 'mt-8 w-full sm:w-auto',
                    })}
                    tabIndex={isActive ? 0 : -1}
                    to={slide.href}
                  >
                    {slide.ctaLabel}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                </div>

                <div className="hidden gap-3 lg:grid">
                  {slide.highlights.map((highlight, highlightIndex) => (
                    <div
                      key={highlight}
                      className="rounded-app border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                    >
                      <span className="text-xs font-bold tracking-[0.16em] text-soil-300">
                        0{highlightIndex + 1}
                      </span>
                      <p className="mt-2 font-bold text-white">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <button
          aria-label="이전 캠페인"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/55 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-soil-300"
          onClick={showPrevious}
          type="button"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          aria-label={isManuallyPaused ? '자동 넘김 재생' : '자동 넘김 일시정지'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/55 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-soil-300"
          onClick={toggleAutoPlay}
          type="button"
        >
          {isManuallyPaused ? (
            <Play className="h-4 w-4" aria-hidden />
          ) : (
            <Pause className="h-4 w-4" aria-hidden />
          )}
        </button>
        <button
          aria-label="다음 캠페인"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/55 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-soil-300"
          onClick={showNext}
          type="button"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900/45 px-3 py-2 backdrop-blur">
        {campaignSlides.map((slide, index) => (
          <button
            key={slide.id}
            aria-current={index === activeIndex ? 'true' : undefined}
            aria-label={`${slide.eyebrow} 보기`}
            className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-soil-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ${
              index === activeIndex
                ? 'w-8 bg-soil-300'
                : 'w-2.5 bg-white/55 hover:bg-white'
            }`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
