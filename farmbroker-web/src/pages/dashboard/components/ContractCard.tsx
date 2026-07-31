import { FileText } from 'lucide-react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { ContractSummary } from '@/types/api';
import { formatCurrency } from '@/utils/format';

interface ContractCardProps {
  contract: ContractSummary;
}

// 계약 관리를 테이블 대신 카드로 보여주는 컴포넌트입니다.
export function ContractCard({ contract }: ContractCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={contract.status === '완료' ? 'green' : 'yellow'}>
            {contract.status}
          </Badge>
          <h3 className="mt-3 text-lg font-black text-ink-900">{contract.spaceName}</h3>
          <p className="mt-1 text-sm text-slate-600">{contract.counterparty}</p>
        </div>
        <FileText className="h-6 w-6 text-leaf-700" aria-hidden />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-slate-500">월세</dt>
          <dd className="font-bold text-ink-900">
            {formatCurrency(contract.monthlyRent)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">계약 기간</dt>
          <dd className="font-bold text-ink-900">{contract.period}</dd>
        </div>
      </dl>
      <Button className="mt-4 w-full" variant="outline">
        검토하기
      </Button>
    </Card>
  );
}
