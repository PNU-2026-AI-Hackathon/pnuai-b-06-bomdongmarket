import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { ProductImage } from '@/pages/market/components/ProductImage';
import {
  changeCartQuantity,
  checkout,
  getCart,
  removeFromCart,
} from '@/services/cartService';
import type { Cart } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency } from '@/utils/format';

// 담은 상품을 확인하고 결제하는 화면입니다.
// 실제 결제(PG)는 연동하지 않습니다 — 주문 확정과 재고 차감까지만 이뤄지고 완료 화면으로 넘어갑니다.
// 담아 둔 사이 품절·마감될 수 있어, 서버가 줄마다 내려주는 purchasable을 그대로 따릅니다.
export function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setCart(await getCart());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(productId: number, action: () => Promise<Cart>) {
    setPendingId(productId);
    setError(null);
    try {
      setCart(await action());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '장바구니를 수정하지 못했습니다.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleCheckout() {
    setIsPaying(true);
    setError(null);
    try {
      const order = await checkout();
      navigate(ROUTES.orderComplete, { replace: true, state: { order } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '결제에 실패했습니다.');
      // 재고가 모자라 실패했을 수 있어 최신 상태로 다시 불러옵니다.
      void load();
    } finally {
      setIsPaying(false);
    }
  }

  const buyableCount = cart?.items.filter((item) => item.purchasable).length ?? 0;

  return (
    <PageContainer narrow>
      <Link
        className={buttonStyles({ className: 'mb-5 -ml-3', size: 'sm', variant: 'ghost' })}
        to={ROUTES.market}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        마켓으로 돌아가기
      </Link>

      <div className="mb-6">
        <PageHeader
          description="결제하면 판매자의 재고에서 바로 차감됩니다."
          eyebrow="로컬마켓"
          title="장바구니"
        />
      </div>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="장바구니를 불러오는 중입니다" />
      ) : null}
      {status === 'error' ? <ErrorState message="장바구니를 불러오지 못했습니다" /> : null}

      {status === 'success' && cart?.items.length === 0 ? (
        <EmptyState
          actionLabel="상품 둘러보기"
          description="마켓에서 마음에 드는 농산물을 담아 보세요."
          onAction={() => navigate(ROUTES.market)}
          title="장바구니가 비어 있습니다"
        />
      ) : null}

      {error ? (
        <p className="mb-4 text-sm font-semibold text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      {cart && cart.items.length > 0 ? (
        <div className="grid gap-4">
          {cart.items.map((item) => (
            <Card className="overflow-hidden" key={item.productId}>
              <div className="flex gap-4 p-4">
                <ProductImage
                  alt={item.name}
                  className="h-24 w-24 shrink-0 rounded-app object-cover"
                  src={item.imageUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="truncate text-lg font-black text-ink-900"
                      to={ROUTES.productDetail(item.productId)}
                    >
                      {item.name}
                    </Link>
                    {/* 담은 뒤 사정이 바뀐 줄은 왜 결제가 안 되는지 알려 줍니다. */}
                    {!item.purchasable ? (
                      <Badge tone="slate">
                        {item.stock === 0 ? '품절' : `재고 ${item.stock}개 남음`}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(item.price)} / {item.unit}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        aria-label={`${item.name} 수량 줄이기`}
                        disabled={pendingId === item.productId || item.quantity <= 1}
                        onClick={() =>
                          void run(item.productId, () =>
                            changeCartQuantity(item.productId, item.quantity - 1),
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </Button>
                      <span className="min-w-10 text-center text-lg font-black text-ink-900">
                        {item.quantity}
                      </span>
                      <Button
                        aria-label={`${item.name} 수량 늘리기`}
                        disabled={pendingId === item.productId || item.quantity >= item.stock}
                        onClick={() =>
                          void run(item.productId, () =>
                            changeCartQuantity(item.productId, item.quantity + 1),
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-ink-900">
                        {formatCurrency(item.linePrice)}
                      </span>
                      <Button
                        aria-label={`${item.name} 빼기`}
                        disabled={pendingId === item.productId}
                        onClick={() =>
                          void run(item.productId, () => removeFromCart(item.productId))
                        }
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Card padding="lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">결제 예정 금액</span>
              <span className="text-2xl font-black text-ink-900">
                {formatCurrency(cart.totalPrice)}
              </span>
            </div>
            {buyableCount < cart.items.length ? (
              <p className="mt-2 text-sm text-slate-600">
                지금 살 수 없는 상품은 결제 금액에서 빠졌습니다.
              </p>
            ) : null}
          </Card>

          {/* 모바일에서 결제 버튼이 화면 밖으로 밀리지 않도록 하단에 고정합니다. */}
          <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
            <Button
              className="w-full"
              disabled={isPaying || buyableCount === 0}
              onClick={() => void handleCheckout()}
              size="lg"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {isPaying ? '결제 중...' : `${formatCurrency(cart.totalPrice)} 결제하기`}
            </Button>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
