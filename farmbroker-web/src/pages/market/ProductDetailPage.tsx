import { ArrowLeft, Minus, Plus, Route, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { getMarketItem } from '@/services/marketService';
import type { MarketItem } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency, formatDate } from '@/utils/format';
import { ProductTraceabilityTimeline } from '@/pages/market/components/ProductTraceabilityTimeline';

// 상품 상세와 생산 이력, 수량 선택, 구매 CTA를 제공하는 마켓 상세 화면입니다.
export function ProductDetailPage() {
  const requireAuth = useRequireAuth();
  const { productId } = useParams();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        // URL의 productId가 없을 때도 데모가 끊기지 않도록 첫 상품을 기본값으로 사용합니다.
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
        마켓으로 돌아가기
      </Link>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="상품 상세 정보를 불러오는 중입니다" />
      ) : null}
      {status === 'error' ? (
        <ErrorState message="상품 정보를 불러오지 못했습니다" />
      ) : null}

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
                <Badge key={tag} tone={tag === '오늘 수확' ? 'yellow' : 'green'}>
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-black text-ink-900">{item.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {item.productionLocation} · {item.producerName}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              수확일 {formatDate(item.harvestDate)}
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
                  aria-label="수량 줄이기"
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
                  aria-label="수량 늘리기"
                  onClick={() => setQuantity((value) => Math.min(item.stock, value + 1))}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={() => requireAuth()}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {formatCurrency(item.price * quantity)} 구매하기
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-ink-900">
              <Route className="h-5 w-5 text-leaf-700" aria-hidden />
              푸드 마일리지 절감
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              이 상품은 농장에서 픽업 지점까지 {item.foodMileageKm}km만 이동했습니다. 일반
              유통 대비 장거리 운송 부담을 줄입니다.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-black text-ink-900">생산 이력</h2>
            <div className="mt-4">
              <ProductTraceabilityTimeline />
            </div>
          </Card>
        </div>
      ) : null}
    </PageContainer>
  );
}
