import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { ROUTES } from '@/constants/routes';
import { ProductImage } from '@/pages/market/components/ProductImage';
import type { WishlistLine } from '@/types/api';
import { formatCurrency } from '@/utils/format';

interface DashboardWishlistItemCardProps {
  item: WishlistLine;
}

// 마켓 찜 상품을 조회 전용으로 보여주고 상품 상세로 연결합니다.
export function DashboardWishlistItemCard({ item }: DashboardWishlistItemCardProps) {
  return (
    <Link
      aria-label={item.name + ' 상품 상세 보기'}
      className="block h-full rounded-app focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
      to={ROUTES.productDetail(item.productId)}
    >
      <Card className="h-full overflow-hidden" variant="interactive">
        <ProductImage
          alt={item.name}
          className="h-40 w-full object-cover"
          src={item.imageUrl}
        />
        <div className="p-4">
          <Badge tone={item.purchasable ? 'green' : 'slate'}>
            {item.purchasable ? '거래 가능' : '판매완료'}
          </Badge>
          <h3 className="mt-3 line-clamp-2 text-lg font-bold text-content">
            {item.name}
          </h3>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="font-black text-content">{formatCurrency(item.price)}</span>
            <span className="text-xs font-semibold text-content-subtle">/ {item.unit}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
