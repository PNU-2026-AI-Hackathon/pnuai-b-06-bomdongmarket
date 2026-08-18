import { Heart, Route } from 'lucide-react';
import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/constants/routes';
import { ProductImage } from '@/pages/market/components/ProductImage';
import { addWishlist, removeWishlist } from '@/services/wishlistService';
import type { MarketItem } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';

interface ProductCardProps {
  item: MarketItem;
  distanceKm?: number | null;
  // 목록을 받아 온 쪽이 이미 찜한 상품을 알고 있으면 초기 상태로 넘겨 줍니다.
  initiallyWished?: boolean;
}

// 마켓 목록의 2열/세로 카드에서 상품 신선도와 찜 액션을 보여줍니다.
export function ProductCard({ item, distanceKm, initiallyWished = false }: ProductCardProps) {
  const requireAuth = useRequireAuth();
  const [wished, setWished] = useState(initiallyWished);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 찜 목록은 상품 목록보다 늦게 도착할 수 있어 useState 초기값만으로는 놓칩니다.
  // 값이 실제로 바뀔 때만 따라가므로, 여기서 누른 결과를 덮어쓰지는 않습니다.
  useEffect(() => {
    setWished(initiallyWished);
  }, [initiallyWished]);

  // 카드 전체가 상세로 가는 링크라 하트 클릭이 이동으로 새지 않게 전파를 막습니다.
  // 비로그인이면 requireAuth가 로그인으로 보내고 찜은 실행되지 않습니다.
  function handleToggleWish(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    requireAuth(() => {
      setIsPending(true);
      setError(null);
      const next = wished ? removeWishlist(item.productId) : addWishlist(item.productId);
      next
        .then(() => setWished((value) => !value))
        .catch((caught: unknown) => {
          setError(caught instanceof Error ? caught.message : '찜을 변경하지 못했습니다.');
        })
        .finally(() => setIsPending(false));
    });
  }

  return (
    <Card className="overflow-hidden">
      <Link to={ROUTES.productDetail(item.productId)}>
        <ProductImage alt={item.name} className="h-44 w-full object-cover" src={item.imageUrl} />
      </Link>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {item.freshnessTags.slice(0, 2).map((tag) => (
            <Badge key={tag} tone={tag === '오늘 수확' ? 'yellow' : 'green'}>
              {tag}
            </Badge>
          ))}
        </div>
        <Link to={ROUTES.productDetail(item.productId)}>
          <h2 className="mt-3 text-lg font-black text-ink-900">{item.name}</h2>
        </Link>
        <p className="mt-1 text-sm text-slate-600">{item.productionLocation}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Route className="h-3.5 w-3.5 text-leaf-700" aria-hidden />
          {/* 마일리지는 지도(Task 3) 전까지 null일 수 있어 있을 때만 노출한다 */}
          {distanceKm != null ? `중심에서 ${distanceKm.toFixed(1)}km · ` : ''}
          {item.foodMileageKm != null ? `푸드 마일리지 ${item.foodMileageKm}km · ` : ''}수확일{' '}
          {formatDate(item.harvestDate)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-black text-ink-900">
            {formatCurrency(item.price)}
            <span className="text-xs font-semibold text-slate-500"> / {item.unit}</span>
          </span>
          <Button
            aria-label={wished ? `${item.name} 찜 해제` : `${item.name} 찜하기`}
            aria-pressed={wished}
            disabled={isPending}
            onClick={handleToggleWish}
            size="sm"
            variant={wished ? 'primary' : 'outline'}
          >
            <Heart className={wished ? 'h-4 w-4 fill-current' : 'h-4 w-4'} aria-hidden />
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-sm font-medium text-feedback-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
