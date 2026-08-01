import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { PageContainer } from '@/components/layout/PageContainer';
import { roleSections } from '@/pages/home/constants/homeContent';
import { cn } from '@/utils/cn';

const visualStyles = {
  provider: {
    panel: 'border-leaf-700 bg-leaf-900 text-white',
    icon: 'bg-white/10 text-leaf-100 ring-white/15',
    label: 'text-soil-300',
    description: 'text-leaf-50/75',
    item: 'border-white/10 bg-white/5 text-leaf-50',
  },
  farmer: {
    panel: 'border-soil-100 bg-soil-50 text-ink-900',
    icon: 'bg-soil-100 text-soil-700 ring-soil-300/30',
    label: 'text-soil-700',
    description: 'text-slate-600',
    item: 'border-soil-100 bg-white/70 text-ink-700',
  },
  consumer: {
    panel: 'border-skyfarm-200 bg-skyfarm-50 text-ink-900',
    icon: 'bg-white text-skyfarm-500 ring-skyfarm-200',
    label: 'text-skyfarm-500',
    description: 'text-slate-600',
    item: 'border-skyfarm-200 bg-white/75 text-ink-700',
  },
} as const;

export function RoleJourneySections() {
  return (
    <div>
      <PageContainer className="py-14 text-center lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
          One local cycle
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black text-ink-900 sm:text-4xl">
          공간에서 재배로, 수확에서 소비로 이어지는 도심 스마트팜 생태계
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          봄동마켓은 유휴공간, 도심 농부, 지역 소비자를 연결해 생산부터 판매까지 생활권
          안에서 순환하도록 돕습니다.
        </p>
      </PageContainer>

      {roleSections.map((role, index) => {
        const styles = visualStyles[role.id];

        return (
          <section
            key={role.id}
            className={cn(index % 2 === 1 ? 'border-y border-leaf-100 bg-white' : '')}
            aria-labelledby={`${role.id}-role-title`}
          >
            <PageContainer className="grid gap-8 py-14 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
              <div className={cn(index % 2 === 1 && 'lg:order-2')}>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
                  {role.eyebrow}
                </p>
                <p className="mt-4 text-base font-bold text-leaf-700">{role.label}</p>
                <h2
                  id={`${role.id}-role-title`}
                  className="mt-2 text-3xl font-black leading-tight text-ink-900 sm:text-4xl"
                >
                  {role.title}
                </h2>
                <p className="mt-5 text-base leading-7 text-slate-600">
                  {role.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {role.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="inline-flex items-center gap-1.5 rounded-full border border-leaf-100 bg-leaf-50 px-3 py-2 text-sm font-semibold text-leaf-800"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      {highlight}
                    </span>
                  ))}
                </div>
                <Link
                  className={buttonStyles({
                    variant: 'outline',
                    size: 'lg',
                    className: 'group mt-8 w-full sm:w-auto',
                  })}
                  to={role.href}
                >
                  {role.ctaLabel}
                  <ArrowUpRight
                    className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>

              <div
                className={cn(
                  'group relative overflow-hidden rounded-[1.5rem] border p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8',
                  styles.panel,
                  index % 2 === 1 && 'lg:order-1',
                )}
              >
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                <span
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-app ring-1',
                    styles.icon,
                  )}
                >
                  <role.icon className="h-7 w-7" aria-hidden />
                </span>
                <p
                  className={cn(
                    'relative mt-8 text-xs font-bold uppercase tracking-[0.16em]',
                    styles.label,
                  )}
                >
                  {role.previewLabel}
                </p>
                <h3 className="relative mt-3 text-2xl font-black leading-snug">
                  {role.previewTitle}
                </h3>
                <p className={cn('relative mt-4 text-sm leading-7', styles.description)}>
                  {role.previewDescription}
                </p>
                <div className="relative mt-7 grid gap-2 sm:grid-cols-3">
                  {role.highlights.map((highlight, highlightIndex) => (
                    <div
                      key={highlight}
                      className={cn('rounded-app border p-3', styles.item)}
                    >
                      <span className="text-xs font-black opacity-60">
                        0{highlightIndex + 1}
                      </span>
                      <p className="mt-2 text-sm font-bold">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </PageContainer>
          </section>
        );
      })}
    </div>
  );
}
