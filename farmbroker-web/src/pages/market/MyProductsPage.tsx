import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
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
import { PageContainer } from '@/components/layout/PageContainer';
import { ProductImage } from '@/pages/market/components/ProductImage';
import { ROUTES } from '@/constants/routes';
import { deleteProduct, getMyProducts, updateProduct } from '@/services/marketService';
import type { MarketItem } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency, formatDate } from '@/utils/format';

// 내가 등록한 로컬마켓 상품을 관리하는 화면입니다 (GET /products/my).
// 삭제는 계약상 소프트 삭제라 목록에서만 사라지고 데이터는 서버에 남습니다.
export function MyProductsPage() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resumingId, setResumingId] = useState<number | null>(null);
  // 삭제는 화면에서 되돌릴 수 없어(서버는 소프트 삭제지만 복구 화면이 없다) 한 번 더 확인받습니다.
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
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
      setConfirmingId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '상품 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleResume(productId: number) {
    setResumingId(productId);
    setError(null);
    try {
      await updateProduct(productId, { status: 'ON_SALE' });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '판매 재개에 실패했습니다.');
    } finally {
      setResumingId(null);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <PageHeader
          action={
            <Link className={buttonStyles()} to={ROUTES.newProduct}>
              <Plus className="h-5 w-5" aria-hidden />
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
        <p className="mb-4 text-sm font-semibold text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card className="overflow-hidden" key={item.productId}>
            <div className="flex gap-4 p-4">
              <ProductImage
                alt={item.name}
                className="h-24 w-24 shrink-0 rounded-app object-cover"
                src={item.imageUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="green">{item.category}</Badge>
                  {/* 공개 목록은 판매중·재고 있는 상품만 노출되므로, 왜 마켓에 안 보이는지 여기서 알려 줍니다. */}
                  {/* 재고가 다 빠진 것과 내가 판매를 멈춘 것은 다른 상태입니다. */}
                  {item.status === 'CLOSED' ? (
                    <Badge tone="slate">{item.stock <= 0 ? '판매완료' : '판매 중지'}</Badge>
                  ) : null}
                  {item.status !== 'CLOSED' && item.stock <= 0 ? (
                    <Badge tone="slate">품절 · 마켓 미노출</Badge>
                  ) : null}
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

                {confirmingId === item.productId ? (
                  <div className="mt-3 rounded-app border border-feedback-danger/40 bg-feedback-danger-soft p-3">
                    <p className="text-sm font-semibold text-ink-900">
                      &lsquo;{item.name}&rsquo;을(를) 삭제할까요?
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      마켓에서 바로 내려가고, 이 화면에서는 되돌릴 수 없습니다.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        disabled={deletingId === item.productId}
                        onClick={() => handleDelete(item.productId)}
                        size="sm"
                        variant="danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {deletingId === item.productId ? '삭제 중...' : '삭제합니다'}
                      </Button>
                      <Button
                        disabled={deletingId === item.productId}
                        onClick={() => setConfirmingId(null)}
                        size="sm"
                        variant="outline"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      className={buttonStyles({ size: 'sm', variant: 'outline' })}
                      to={ROUTES.editProduct(item.productId)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      수정
                    </Link>
                    {item.status === 'CLOSED' && item.stock > 0 ? (
                      <Button
                        disabled={resumingId === item.productId}
                        onClick={() => handleResume(item.productId)}
                        size="sm"
                        variant="outline"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        {resumingId === item.productId ? '재개 중...' : '판매 재개'}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => setConfirmingId(item.productId)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      삭제
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
