import { Check, Plus, Route } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/constants/routes';
import { ProductImage } from '@/pages/market/components/ProductImage';
import { addToCart } from '@/services/cartService';
import type { MarketItem } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';

interface ProductCardProps {
  item: MarketItem;
  distanceKm?: number | null;
}

// 마켓 목록의 2열/세로 카드에서 상품 신선도와 구매 액션을 보여줍니다.
export function ProductCard({ item, distanceKm }: ProductCardProps) {
  const requireAuth = useRequireAuth();
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  // 목록에서는 1개씩 담습니다. 수량 조절은 장바구니와 상세에서 합니다.
  // 비로그인이면 requireAuth가 로그인으로 보내고 담기는 실행되지 않습니다.
  function handleAdd() {
    requireAuth(() => {
      setState('adding');
      setError(null);
      addToCart(item.productId, 1)
        .then(() => {
          setState('added');
          // 담겼다는 표시만 잠깐 보여 주고 원래 버튼으로 돌아갑니다.
          window.setTimeout(() => setState('idle'), 1500);
        })
        .catch((caught: unknown) => {
          setState('idle');
          setError(caught instanceof Error ? caught.message : '담지 못했습니다.');
        });
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
            aria-label={`${item.name} 담기`}
            disabled={state !== 'idle'}
            onClick={handleAdd}
            size="sm"
            variant={state === 'added' ? 'outline' : 'primary'}
          >
            {state === 'added' ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            {state === 'added' ? '담김' : '담기'}
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
