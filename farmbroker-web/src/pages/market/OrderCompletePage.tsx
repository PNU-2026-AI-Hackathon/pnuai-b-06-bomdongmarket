import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { buttonStyles } from '@/components/common/buttonStyles';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import type { Order } from '@/types/api';
import { formatCurrency } from '@/utils/format';

// 거래 확정 화면.
// 이 서비스에는 결제 단계가 없습니다 — 대금은 판매자와 직접 정하고, 여기서는 거래를 기록하고
// 재고를 줄이는 것까지 합니다. 결제라고 적으면 카드가 빠져나간 것으로 읽혀 문구를 갈랐습니다.
// 내역은 거래 응답을 그대로 받아 보여 주므로, 새로고침하면 사라집니다(조회 API는 아직 없습니다).
export function OrderCompletePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = (location.state as { order?: Order } | null)?.order ?? null;

  if (!order) {
    return (
      <PageContainer narrow>
        <EmptyState
          actionLabel="마켓으로 가기"
          description="거래를 확정하면 이 화면에서 내역을 볼 수 있습니다."
          onAction={() => navigate(ROUTES.market)}
          title="표시할 주문이 없습니다"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <Card className="text-center" padding="lg">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <CheckCircle2 className="h-9 w-9" aria-hidden />
        </span>
        <h1 className="mt-4 text-3xl font-black text-ink-900">거래가 확정되었습니다</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          주문번호 {order.orderId}
          <br />
          판매자의 재고에서 주문 수량만큼 차감되었습니다.
        </p>
      </Card>

      <Card className="mt-4" padding="lg">
        <h2 className="text-xl font-bold text-ink-900">주문 내역</h2>
        <ul className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <li className="flex items-start justify-between gap-3" key={item.productId}>
              <span>
                <span className="block font-bold text-ink-900">{item.name}</span>
                <span className="text-sm text-slate-600">
                  {formatCurrency(item.unitPrice)} / {item.unit} · {item.quantity}개
                </span>
              </span>
              <span className="shrink-0 font-black text-ink-900">
                {formatCurrency(item.linePrice)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-slate-600">거래 금액</span>
          <span className="text-2xl font-black text-ink-900">
            {formatCurrency(order.totalPrice)}
          </span>
        </div>
      </Card>

      <Link className={buttonStyles({ className: 'mt-5 w-full', size: 'lg' })} to={ROUTES.market}>
        마켓 계속 둘러보기
      </Link>
    </PageContainer>
  );
}
