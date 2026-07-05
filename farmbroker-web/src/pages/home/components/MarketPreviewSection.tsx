import { ShoppingBasket } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '../../../components/common/Badge';
import { buttonStyles } from '../../../components/common/buttonStyles';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ROUTES } from '../../../constants/routes';
import { marketPreviewItems } from '../constants/homeContent';

// 로컬 마켓의 신선도와 이력 추적 가치를 홈 하단에서 미리 보여줍니다.
export function MarketPreviewSection() {
  return (
    <section
      className="border-y border-leaf-100 bg-white"
      aria-labelledby="market-preview-title"
    >
      <PageContainer className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge tone="yellow">Local Market</Badge>
          <h2
            id="market-preview-title"
            className="mt-3 text-2xl font-black text-ink-900 sm:text-3xl"
          >
            Fresh crops from nearby smart farms, with production history attached.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Consumers can compare harvest date, food mileage, and producer details before
            adding items to the basket.
          </p>
          <Link
            className={buttonStyles({ className: 'mt-6 w-full sm:w-auto' })}
            to={ROUTES.market}
          >
            <ShoppingBasket className="h-5 w-5" aria-hidden />
            Open Marketplace
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {marketPreviewItems.map((item, index) => (
            <div
              key={item}
              className="min-h-28 rounded-app border border-leaf-100 bg-leaf-50 p-4"
            >
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-leaf-600">
                0{index + 1}
              </span>
              <h3 className="mt-3 font-bold text-ink-900">{item}</h3>
              <p className="mt-1 text-sm text-slate-600">Harvested within 24 hours</p>
            </div>
          ))}
        </div>
      </PageContainer>
    </section>
  );
}
