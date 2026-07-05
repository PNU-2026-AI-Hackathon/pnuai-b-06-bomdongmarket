import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '../../../components/common/Card';
import { PageContainer } from '../../../components/layout/PageContainer';
import { quickActions, roleCards } from '../constants/homeContent';

// 역할 선택과 데모용 빠른 액션을 한곳에 모아 발표 흐름을 빠르게 시작하게 합니다.
export function ServiceOverviewSection() {
  return (
    <PageContainer className="pb-8 lg:pb-12">
      <section aria-labelledby="role-selection-title">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
              Choose your role
            </p>
            <h2
              id="role-selection-title"
              className="mt-2 text-2xl font-black text-ink-900 sm:text-3xl"
            >
              Your app experience starts from a clear role.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Space owners, urban farmers, and local consumers all share one marketplace,
            but each flow stays focused on the next practical action.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roleCards.map((role) => (
            <Link key={role.label} to={role.href}>
              <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lift">
                <role.icon className="h-8 w-8 text-leaf-700" aria-hidden />
                <h3 className="mt-4 text-lg font-bold text-ink-900">{role.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {role.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-leaf-700">
                  Continue <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="text-2xl font-black text-ink-900">
          Quick actions for the demo
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="rounded-app border border-leaf-100 bg-white p-4 shadow-card transition hover:border-soil-300"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app bg-leaf-100 text-leaf-800">
                  <action.icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold text-ink-900">{action.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {action.description}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
