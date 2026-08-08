import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { RemoteImage } from '@/components/common/RemoteImage';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { deleteProduct, getMyProducts } from '@/services/marketService';
import type { MarketItem } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency, formatDate } from '@/utils/format';

// 내가 등록한 로컬마켓 상품을 관리하는 화면입니다 (GET /products/my).
// 삭제는 계약상 소프트 삭제라 목록에서만 사라지고 데이터는 서버에 남습니다.
export function MyProductsPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setItems(await getMyProducts());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(productId: number) {
    setDeletingId(productId);
    setError(null);
    try {
      await deleteProduct(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '상품 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <PageHeader
          action={
            <Link className={buttonStyles({ size: 'sm' })} to={ROUTES.newProduct}>
              <Plus className="h-4 w-4" aria-hidden />
              상품 등록
            </Link>
          }
          description="등록한 상품의 가격과 재고를 관리합니다."
          eyebrow="로컬마켓"
          title="내 판매 상품"
        />
      </div>

      {status === 'loading' || status === 'idle' ? (
        <LoadingState label="내 판매 상품을 불러오는 중입니다" />
      ) : null}
      {status === 'error' ? <ErrorState message="상품 목록을 불러오지 못했습니다" /> : null}

      {status === 'success' && items.length === 0 ? (
        <EmptyState
          description="수확한 농산물을 등록하면 지역 소비자에게 바로 노출됩니다."
          title="아직 등록한 상품이 없습니다"
        />
      ) : null}

      {error ? (
        <p className="mb-4 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card className="overflow-hidden" key={item.productId}>
            <div className="flex gap-4 p-4">
              <RemoteImage
                alt={item.name}
                className="h-24 w-24 shrink-0 rounded-app object-cover"
                src={item.imageUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="green">{item.category}</Badge>
                  <span className="text-xs font-semibold text-slate-500">
                    수확일 {formatDate(item.harvestDate)}
                  </span>
                </div>
                <Link
                  className="mt-2 block truncate text-lg font-black text-ink-900"
                  to={ROUTES.productDetail(item.productId)}
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {formatCurrency(item.price)} / {item.unit} · 재고 {item.stock}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    className={buttonStyles({ size: 'sm', variant: 'outline' })}
                    to={ROUTES.editProduct(item.productId)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    수정
                  </Link>
                  <Button
                    disabled={deletingId === item.productId}
                    onClick={() => handleDelete(item.productId)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {deletingId === item.productId ? '삭제 중...' : '삭제'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
