import { ArrowLeft, Minus, Plus, Route, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageContainer } from '../../components/layout/PageContainer';
import { ROUTES } from '../../constants/routes';
import { getMarketItem } from '../../services/marketService';
import type { MarketItem } from '../../types/api';
import type { AsyncStatus } from '../../types/common';
import { formatCurrency, formatDate } from '../../utils/format';
import { ProductTraceabilityTimeline } from './components/ProductTraceabilityTimeline';

// 상품 상세와 생산 이력, 수량 선택, 구매 CTA를 제공하는 마켓 상세 화면입니다.
export function ProductDetailPage() {
  const { productId } = useParams();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        const result = await getMarketItem(Number(productId ?? 1));
        setItem(result);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    }

    void load();
  }, [productId]);

  return (
    <PageContainer narrow>
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-leaf-700"
        to={ROUTES.market}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to market
      </Link>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="Loading product detail" />
      ) : null}
      {status === 'error' ? <ErrorState message="Could not load product" /> : null}

      {item ? (
        <div className="grid gap-5">
          <img
            alt={item.name}
            className="aspect-[4/3] w-full rounded-app object-cover shadow-card"
            src={item.imageUrl}
          />
          <Card className="p-5">
            <div className="flex flex-wrap gap-2">
              {item.freshnessTags.map((tag) => (
                <Badge key={tag} tone={tag === 'Harvested Today' ? 'yellow' : 'green'}>
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-black text-ink-900">{item.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {item.productionLocation} · {item.producerName}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Harvested {formatDate(item.harvestDate)}
            </p>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-2xl font-black text-ink-900">
                {formatCurrency(item.price)}
                <span className="text-sm font-semibold text-slate-500">
                  {' '}
                  / {item.unit}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Decrease quantity"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  size="sm"
                  variant="outline"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <span className="min-w-10 text-center text-lg font-black text-ink-900">
                  {quantity}
                </span>
                <Button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => Math.min(item.stock, value + 1))}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            <Button className="mt-5 w-full">
              <ShoppingBag className="h-5 w-5" aria-hidden />
              Purchase {formatCurrency(item.price * quantity)}
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-ink-900">
              <Route className="h-5 w-5 text-leaf-700" aria-hidden />
              Food mileage reduction
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This item traveled {item.foodMileageKm} km from farm to pickup point,
              reducing long-haul transport compared with conventional distribution.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black text-ink-900">Production history</h2>
            <div className="mt-4">
              <ProductTraceabilityTimeline />
            </div>
          </Card>
        </div>
      ) : null}
    </PageContainer>
  );
}
