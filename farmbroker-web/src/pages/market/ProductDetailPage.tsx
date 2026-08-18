import { ArrowLeft, Heart, MessageCircle, Minus, Plus, Route, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { useChatDock } from '@/chat/chatDockContext';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { addWishlist, createOrder, getWishlist, removeWishlist } from '@/services/wishlistService';
import { getMarketItem } from '@/services/marketService';
import type { MarketItem } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency, formatDate } from '@/utils/format';
import { ProductImage } from '@/pages/market/components/ProductImage';
import { ProductTraceabilityTimeline } from '@/pages/market/components/ProductTraceabilityTimeline';

// 상품 상세와 생산 이력, 수량 선택, 찜·구매 CTA를 제공하는 마켓 상세 화면입니다.
// 거래는 판매자와의 채팅이 기본이고, 바로 사고 싶을 때를 위해 단건 구매를 함께 둡니다.
export function ProductDetailPage() {
  const requireAuth = useRequireAuth();
  const chatDock = useChatDock();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  const [wished, setWished] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // 마감(CLOSED)·품절(stock 0) 상품은 목록에서 빠지지만 직접 URL로 들어올 수 있어 구매를 막는다.
  const isSoldOut = item != null && (item.status === 'CLOSED' || item.stock <= 0);

  // 이미 찜한 상품인지는 목록을 받아 판단합니다. 비로그인이면 조회 자체가 막히므로 조용히 넘깁니다.
  useEffect(() => {
    if (!item) return;
    let alive = true;
    getWishlist()
      .then((wishlist) => {
        if (alive) setWished(wishlist.items.some((line) => line.productId === item.productId));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [item]);

  // 이 마켓의 기본 거래 방식입니다. 방이 없으면 만들고 있으면 그 방을 엽니다.
  function handleChat() {
    if (!item) return;
    requireAuth(() => {
      setActionError(null);
      void chatDock.openContext('PRODUCT', item.productId).catch((caught: unknown) => {
        setActionError(caught instanceof Error ? caught.message : '채팅을 열지 못했습니다.');
      });
    });
  }

  function handleToggleWish() {
    if (!item) return;
    requireAuth(() => {
      setIsWishing(true);
      setActionError(null);
      const next = wished ? removeWishlist(item.productId) : addWishlist(item.productId);
      next
        .then(() => setWished((value) => !value))
        .catch((caught: unknown) => {
          setActionError(caught instanceof Error ? caught.message : '찜을 변경하지 못했습니다.');
        })
        .finally(() => setIsWishing(false));
    });
  }

  // 채팅으로 흥정하지 않고 바로 살 때의 경로입니다. 주문이 확정되면 완료 화면으로 보냅니다.
  function handleBuyNow() {
    if (!item) return;
    requireAuth(() => {
      setIsBuying(true);
      setActionError(null);
      createOrder(item.productId, quantity)
        .then((order) => navigate(ROUTES.orderComplete, { replace: true, state: { order } }))
        .catch((caught: unknown) => {
          setActionError(caught instanceof Error ? caught.message : '주문하지 못했습니다.');
        })
        .finally(() => setIsBuying(false));
    });
  }

  return (
    <PageContainer narrow>
      <Link
        className={buttonStyles({
          className: 'mb-5 -ml-3',
          size: 'sm',
          variant: 'ghost',
        })}
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
          <ProductImage
            alt={item.name}
            className="aspect-[4/3] w-full rounded-app object-cover shadow-card"
            src={item.imageUrl}
          />
          <Card padding="lg">
            <div className="flex flex-wrap gap-2">
              {/* 목록에선 제외되지만 직접 URL로 들어오면 마감 상품일 수 있어 뱃지로 명시한다 */}
              {isSoldOut ? <Badge tone="slate">판매 마감</Badge> : null}
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
                  disabled={isSoldOut || quantity === 1}
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
                  disabled={isSoldOut}
                  onClick={() => setQuantity((value) => Math.min(item.stock, value + 1))}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            {/* 거래는 채팅이 기본이라 구매보다 먼저 눈에 들어오게 둡니다. */}
            <Button className="mt-5 w-full" onClick={handleChat} variant="outline">
              <MessageCircle className="h-5 w-5" aria-hidden />
              판매자와 채팅
            </Button>
            <div className="mt-2 flex gap-2">
              {/* 찜은 품절이어도 누를 수 있습니다 — 다시 올라오길 기다리는 것도 관심 표시입니다. */}
              <Button
                aria-label={wished ? '찜 해제' : '찜하기'}
                aria-pressed={wished}
                disabled={isWishing}
                onClick={handleToggleWish}
                variant="outline"
              >
                <Heart
                  className={wished ? 'h-5 w-5 fill-current' : 'h-5 w-5'}
                  aria-hidden
                />
              </Button>
              <Button className="flex-1" disabled={isSoldOut || isBuying} onClick={handleBuyNow}>
                <ShoppingBag className="h-5 w-5" aria-hidden />
                {isSoldOut
                  ? '판매 마감된 상품입니다'
                  : isBuying
                    ? '주문 중...'
                    : `${formatCurrency(item.price * quantity)} 바로 구매`}
              </Button>
            </div>
            {actionError ? (
              <p className="mt-2 text-sm font-semibold text-feedback-danger" role="alert">
                {actionError}
              </p>
            ) : null}
          </Card>

          {/* 마일리지는 지도(Task 3) 전까지 null일 수 있어 있을 때만 카드를 노출한다 */}
          {item.foodMileageKm != null ? (
            <Card padding="lg">
              <h2 className="flex items-center gap-2 text-xl font-black text-ink-900">
                <Route className="h-5 w-5 text-leaf-700" aria-hidden />
                푸드 마일리지 절감
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                이 상품은 농장에서 픽업 지점까지 {item.foodMileageKm}km만 이동했습니다. 일반
                유통 대비 장거리 운송 부담을 줄입니다.
              </p>
            </Card>
          ) : null}

          {/* 등록 폼에서 입력 UI를 뺀 뒤로 새 상품에는 이력이 붙지 않는다.
              비어 있으면 카드째 감춰 판매자가 채울 수 없는 빈 자리를 남기지 않는다. */}
          {item.traceabilityEvents?.length ? (
            <Card padding="lg">
              <h2 className="text-xl font-black text-ink-900">생산 이력</h2>
              <div className="mt-4">
                <ProductTraceabilityTimeline events={item.traceabilityEvents} />
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </PageContainer>
  );
}
