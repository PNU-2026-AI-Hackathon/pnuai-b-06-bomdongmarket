import { useState } from 'react';

import { Card } from '@/components/common/Card';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { ContractCard } from '@/pages/dashboard/components/ContractCard';
import { contractProcess } from '@/pages/dashboard/constants/contractProcess';
import { useDashboard } from '@/pages/dashboard/hooks/useDashboard';

// 와이어프레임의 계약 관리 화면을 카드와 단계 표시기로 구현합니다.
export function ContractsPage() {
  const { contracts, status } = useDashboard();
  const [activeStatus, setActiveStatus] = useState('신청');
  // MVP에서는 신청 탭을 전체 신청 흐름의 진입점으로 보고 전체 계약을 보여줍니다.
  const filtered = contracts.filter((contract) =>
    activeStatus === '신청' ? true : contract.status === activeStatus,
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="계약 관리"
        title="계약 진행 상태를 카드로 확인하세요"
      />

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {contractProcess.map((step) => (
            <button
              key={step}
              className={`min-h-control rounded-full px-3 text-sm font-bold transition ${
                activeStatus === step
                  ? 'bg-leaf-700 text-white'
                  : 'bg-white text-leaf-800 ring-1 ring-leaf-100 hover:bg-leaf-50'
              }`}
              onClick={() => setActiveStatus(step)}
              type="button"
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-6" padding="md">
        <div className="grid grid-cols-4 gap-2">
          {contractProcess.map((step, index) => (
            <div key={step}>
              <div
                className={`h-2 rounded-full ${index < 3 ? 'bg-leaf-700' : 'bg-leaf-100'}`}
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {status === 'loading' || status === 'idle' ? (
          <LoadingState label="계약 목록을 불러오는 중입니다" />
        ) : (
          filtered.map((contract) => (
            <ContractCard contract={contract} key={contract.contractId} />
          ))
        )}
      </div>
    </PageContainer>
  );
}
