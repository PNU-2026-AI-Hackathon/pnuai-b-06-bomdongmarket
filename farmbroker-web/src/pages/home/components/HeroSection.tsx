import { ArrowRight, ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonStyles } from '../../../components/common/buttonStyles';
import { heroContent, valuePoints } from '../constants/homeContent';

// 홈 첫 화면에서 서비스의 세 사용자군과 핵심 가치를 바로 이해시키는 온보딩 히어로입니다.
export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-ink-900 text-white"
      aria-labelledby="home-hero-title"
    >
      <img
        src={heroContent.imageUrl}
        alt="Indoor smart farm with leafy greens"
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="via-ink-900/82 to-leaf-900/42 absolute inset-0 bg-gradient-to-r from-ink-900" />
      <div className="relative mx-auto grid min-h-[620px] max-w-7xl content-end gap-8 px-4 pb-12 pt-24 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.65fr)] lg:items-end lg:pb-16">
        <div className="max-w-3xl">
          <p className="bg-white/14 mb-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold text-leaf-50 ring-1 ring-white/15">
            Bomdong Market
          </p>
          <h1
            id="home-hero-title"
            className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl"
          >
            {heroContent.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-leaf-50/90 sm:text-lg">
            {heroContent.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className={buttonStyles({
                variant: 'secondary',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
              to={heroContent.primaryCta.href}
            >
              {heroContent.primaryCta.label}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              className={buttonStyles({
                variant: 'outline',
                size: 'lg',
                className:
                  'w-full border-white/40 bg-white/10 text-white hover:bg-white hover:text-leaf-900 sm:w-auto',
              })}
              to={heroContent.secondaryCta.href}
            >
              <ShoppingBasket className="h-5 w-5" aria-hidden />
              {heroContent.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {valuePoints.map((point) => (
            <div
              key={point.label}
              className="border-white/14 bg-white/12 rounded-app border p-4 backdrop-blur"
            >
              <point.icon className="h-6 w-6 text-soil-300" aria-hidden />
              <h2 className="mt-3 text-base font-bold">{point.label}</h2>
              <p className="text-leaf-50/82 mt-1 text-sm leading-6">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
