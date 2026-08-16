import { ArrowLeft, HeartOff } from 'lucide-react';
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
import { getWishlist, removeWishlist } from '@/services/wishlistService';
import type { Wishlist } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency } from '@/utils/format';

// 찜해 둔 상품을 모아 보는 화면입니다.
// 거래는 채팅으로 하므로 여기서 결제하지 않습니다 — 상세로 들어가 판매자와 이야기하거나 바로 구매합니다.
// 찜해 둔 사이 품절·마감될 수 있어, 서버가 줄마다 내려주는 purchasable을 그대로 따릅니다.
export function WishlistPage() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setWishlist(await getWishlist());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(productId: number) {
    setPendingId(productId);
    setError(null);
    try {
      setWishlist(await removeWishlist(productId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '찜을 해제하지 못했습니다.');
    } finally {
      setPendingId(null);
    }
  }

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
          description="마음에 둔 농산물입니다. 상세에서 판매자와 이야기하거나 바로 살 수 있습니다."
          eyebrow="로컬마켓"
          title="찜한 상품"
        />
      </div>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="찜 목록을 불러오는 중입니다" />
      ) : null}
      {status === 'error' ? <ErrorState message="찜 목록을 불러오지 못했습니다" /> : null}

      {status === 'success' && wishlist?.items.length === 0 ? (
        <EmptyState
          actionLabel="상품 둘러보기"
          description="마켓에서 마음에 드는 농산물에 하트를 눌러 보세요."
          onAction={() => navigate(ROUTES.market)}
          title="찜한 상품이 없습니다"
        />
      ) : null}

      {error ? (
        <p className="mb-4 text-sm font-semibold text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      {wishlist && wishlist.items.length > 0 ? (
        <div className="grid gap-4">
          {wishlist.items.map((item) => (
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
                    {/* 찜해 둔 뒤 사정이 바뀐 줄은 왜 살 수 없는지 알려 줍니다. */}
                    {!item.purchasable ? <Badge tone="slate">판매 마감</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(item.price)} / {item.unit}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      className={buttonStyles({ size: 'sm', variant: 'outline' })}
                      to={ROUTES.productDetail(item.productId)}
                    >
                      상세 보기
                    </Link>
                    <Button
                      aria-label={`${item.name} 찜 해제`}
                      disabled={pendingId === item.productId}
                      onClick={() => void handleRemove(item.productId)}
                      size="sm"
                      variant="ghost"
                    >
                      <HeartOff className="h-4 w-4" aria-hidden />
                      찜 해제
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
}
