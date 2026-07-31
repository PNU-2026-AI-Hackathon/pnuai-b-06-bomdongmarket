import { Plus, Route } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useRequireAuth } from '@/auth/useRequireAuth';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/constants/routes';
import type { MarketItem } from '@/types/api';
import { formatCurrency, formatDate } from '@/utils/format';

interface ProductCardProps {
  item: MarketItem;
}

// 마켓 목록의 2열/세로 카드에서 상품 신선도와 구매 액션을 보여줍니다.
export function ProductCard({ item }: ProductCardProps) {
  const requireAuth = useRequireAuth();

  return (
    <Card className="overflow-hidden">
      <Link to={ROUTES.productDetail(item.productId)}>
        <img alt={item.name} className="h-44 w-full object-cover" src={item.imageUrl} />
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
          푸드 마일리지 {item.foodMileageKm}km · 수확일 {formatDate(item.harvestDate)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-lg font-black text-ink-900">
            {formatCurrency(item.price)}
            <span className="text-xs font-semibold text-slate-500"> / {item.unit}</span>
          </span>
          <Button
            aria-label={`${item.name} 담기`}
            onClick={() => requireAuth()}
            size="sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            담기
          </Button>
        </div>
      </div>
    </Card>
  );
}
