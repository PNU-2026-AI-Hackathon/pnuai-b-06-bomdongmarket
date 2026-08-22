import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { hasRole } from '@/auth/roles';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/common/Select';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDisclosure } from '@/hooks/useDisclosure';
import {
  AMOUNT_MIN,
  blockNonPositiveIntegerKeys,
  validateAmounts,
  type ContractAmountErrors,
} from '@/pages/contract/constants/contractAmounts';
import {
  nextDay,
  startDateBounds,
  validatePeriod,
  type ContractPeriodErrors,
} from '@/pages/contract/constants/contractDates';
import { useContract } from '@/pages/contract/hooks/useContract';
import type {
  ContractDetail,
  ContractParty,
  ContractTermsInput,
  MaintenanceFeePayer,
} from '@/types/api';

// 매칭 1건에 붙는 계약서 화면입니다.
// 이름(양측 닉네임)과 주소는 기존 정보를 그대로 보여주고, 금액·관리비 책임소재·계약기간만 입력받습니다.
// 입력은 공간 제공자만 가능하고, 저장하면 상대도 같은 값을 봅니다.
// '계약'은 양측이 모두 눌러야 확정되고, '계약 취소'는 한 쪽만 눌러도 취소됩니다.
export function ContractPage() {
  const { matchingId } = useParams();
  const { user, refreshUser } = useAuth();
  const { contract, status, error, isSubmitting, actionError, reload, save, agree, cancel } =
    useContract(Number(matchingId));
  const agreeConfirmation = useDisclosure();
  const cancelConfirmation = useDisclosure();
  // 저장하지 않은 입력값으로는 동의할 수 없습니다 — 동의 요청은 저장된 조건에 대한 것이라
  // 화면에 보이는 금액과 다른 조건에 동의하게 됩니다.
  const [termsDirty, setTermsDirty] = useState(false);

  // 양측이 동의해 계약이 확정되면 서버가 신청자에게 FARMER 역할을 부여합니다.
  // 그 사실은 계약 응답에 담기지 않으므로 여기서 사용자 정보를 다시 받아
  // 새로고침 없이 상품 등록 같은 농부 전용 기능이 열리게 합니다.
  // viewerRole은 이 계약에서의 위치(신청자/공간 제공자)라 공간 제공자 쪽에서는 호출되지 않습니다.
  const farmerRoleGranted =
    contract?.status === 'ACCEPTED' &&
    contract.viewerRole === 'FARMER' &&
    !hasRole(user, 'FARMER');

  useEffect(() => {
    if (farmerRoleGranted) void refreshUser();
  }, [farmerRoleGranted, refreshUser]);

  return (
    <PageContainer narrow>
      <PageHeader
        description="양측이 모두 계약에 동의하면 확정됩니다. 조건 입력은 공간 제공자만 할 수 있습니다."
        eyebrow="계약서"
        title="공간 계약서"
      />

      <div className="mt-8">
        {status === 'idle' || status === 'loading' ? (
          <LoadingState label="계약서를 불러오는 중입니다" />
        ) : status === 'error' || !contract ? (
          <ErrorState
            message={error ?? '계약서를 불러오지 못했습니다.'}
            onRetry={() => void reload()}
          />
        ) : (
          <div className="grid gap-4">
            <PartiesCard contract={contract} />
            <TermsCard
              contract={contract}
              isSubmitting={isSubmitting}
              onDirtyChange={setTermsDirty}
              onSave={save}
            />
            <AgreementCard contract={contract} />

            {actionError ? (
              <p className="text-sm font-semibold text-feedback-danger" role="alert">
                {actionError}
              </p>
            ) : null}

            {termsDirty ? (
              <p className="text-body-sm font-semibold text-content" role="status">
                저장하지 않은 변경사항이 있습니다. 먼저 저장해 주세요.
              </p>
            ) : null}

            {contract.status === 'REQUESTED' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  disabled={isSubmitting || viewerAgreed(contract) || termsDirty}
                  onClick={agreeConfirmation.open}
                >
                  {viewerAgreed(contract) ? '동의 완료' : '계약'}
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={cancelConfirmation.open}
                  variant="danger"
                >
                  계약 취소
                </Button>
              </div>
            ) : (
              <p className="text-body-sm font-semibold text-content" role="status">
                {contract.status === 'ACCEPTED'
                  ? '계약이 확정되었습니다.'
                  : '이 계약은 취소되었습니다.'}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="계약 동의"
        description="양측이 모두 동의하면 계약이 확정됩니다. 확정한 뒤에는 조건을 바꿀 수 없습니다."
        isOpen={agreeConfirmation.isOpen}
        isPending={isSubmitting}
        onCancel={agreeConfirmation.close}
        onConfirm={() => {
          agreeConfirmation.close();
          void agree();
        }}
        title="계약에 동의하시겠습니까?"
      />
      <ConfirmDialog
        confirmLabel="계약 취소"
        description="한 쪽이라도 취소하면 이 계약은 취소되며 되돌릴 수 없습니다."
        isOpen={cancelConfirmation.isOpen}
        isPending={isSubmitting}
        onCancel={cancelConfirmation.close}
        onConfirm={() => {
          cancelConfirmation.close();
          void cancel();
        }}
        title="계약을 취소하시겠습니까?"
        tone="danger"
      />
    </PageContainer>
  );
}

// 지금 보고 있는 사람이 이미 동의했는지. 같은 사람이 '계약'을 두 번 누를 필요는 없습니다.
function viewerAgreed(contract: ContractDetail) {
  return contract.viewerRole === 'OWNER' ? contract.ownerAgreed : contract.farmerAgreed;
}

// 이름과 주소는 입력받지 않고 기존 정보를 그대로 보여주는 자리라 dl로 씁니다.
function PartiesCard({ contract }: { contract: ContractDetail }) {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">계약 당사자</h2>
      <dl className="mt-4 grid gap-3 text-body-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-content-muted">공간 제공자</dt>
          <dd className="font-bold text-content">{contract.ownerNickname}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-content-muted">도심 농부</dt>
          <dd className="font-bold text-content">{contract.farmerNickname}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-content-muted">공간 주소</dt>
          <dd className="text-right font-bold text-content">{contract.address}</dd>
        </div>
      </dl>
    </Card>
  );
}

interface TermsCardProps {
  contract: ContractDetail;
  isSubmitting: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (input: ContractTermsInput) => void;
}

function TermsCard({ contract, isSubmitting, onDirtyChange, onSave }: TermsCardProps) {
  const isOwner = contract.viewerRole === 'OWNER';
  // 확정·취소된 계약은 조건을 바꿀 수 없습니다(서버도 같은 규칙으로 막습니다).
  const canEdit = isOwner && contract.status === 'REQUESTED';
  // 조건이 저장되면(내가 저장했든 상대가 저장했든) 입력값을 서버 값에 다시 맞춥니다.
  const [monthlyRent, setMonthlyRent] = useState(contract.monthlyRent?.toString() ?? '');
  const [maintenanceFee, setMaintenanceFee] = useState(
    contract.maintenanceFee?.toString() ?? '',
  );
  const [maintenanceFeePayer, setMaintenanceFeePayer] = useState<MaintenanceFeePayer | ''>(
    contract.maintenanceFeePayer ?? '',
  );
  const [deposit, setDeposit] = useState(contract.deposit?.toString() ?? '');
  const [startDate, setStartDate] = useState(contract.startDate ?? '');
  const [endDate, setEndDate] = useState(contract.endDate ?? '');
  const [amountErrors, setAmountErrors] = useState<ContractAmountErrors>({});
  const [periodErrors, setPeriodErrors] = useState<ContractPeriodErrors>({});
  const [payerError, setPayerError] = useState<string | null>(null);
  // 달력 경계는 화면을 여는 순간의 오늘을 기준으로 한 번만 잡습니다 —
  // 매 렌더마다 새로 계산하면 값이 같아도 min/max가 계속 바뀝니다.
  const dateBounds = useMemo(() => startDateBounds(), []);

  useEffect(() => {
    setMonthlyRent(contract.monthlyRent?.toString() ?? '');
    setMaintenanceFee(contract.maintenanceFee?.toString() ?? '');
    setMaintenanceFeePayer(contract.maintenanceFeePayer ?? '');
    setDeposit(contract.deposit?.toString() ?? '');
    setStartDate(contract.startDate ?? '');
    setEndDate(contract.endDate ?? '');
  }, [
    contract.monthlyRent,
    contract.maintenanceFee,
    contract.maintenanceFeePayer,
    contract.deposit,
    contract.startDate,
    contract.endDate,
  ]);

  // 입력값이 저장된 조건과 하나라도 다르면 저장 전까지 동의를 막습니다.
  // 도심 농부는 입력이 readOnly라 canEdit에서 걸러집니다.
  const isDirty =
    canEdit &&
    (monthlyRent !== (contract.monthlyRent?.toString() ?? '') ||
      maintenanceFee !== (contract.maintenanceFee?.toString() ?? '') ||
      maintenanceFeePayer !== (contract.maintenanceFeePayer ?? '') ||
      deposit !== (contract.deposit?.toString() ?? '') ||
      startDate !== (contract.startDate ?? '') ||
      endDate !== (contract.endDate ?? ''));

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    // 붙여넣기·모바일 키패드는 키 입력 차단을 지나쳐 오므로 여기서 다시 걸러 냅니다.
    const errors = validateAmounts({ monthlyRent, maintenanceFee, deposit });
    setAmountErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    // 달력의 min/max를 지나쳐 온 값도 여기서 다시 걸러 냅니다.
    const periodIssues = validatePeriod({ startDate, endDate });
    setPeriodErrors(periodIssues);
    if (Object.keys(periodIssues).length > 0) {
      return;
    }

    // 브라우저 검증을 끈 대신(아래 noValidate) 필수 선택도 여기서 확인합니다.
    if (!maintenanceFeePayer) {
      setPayerError('관리비 책임소재를 선택해 주세요.');
      return;
    }

    setPayerError(null);
    onSave({
      monthlyRent: Number(monthlyRent),
      maintenanceFee: Number(maintenanceFee),
      maintenanceFeePayer: maintenanceFeePayer as MaintenanceFeePayer,
      deposit: Number(deposit),
      startDate,
      endDate,
    });
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">계약 조건</h2>
      <p className="mt-2 text-body-sm text-content-muted">
        {isOwner
          ? '금액과 계약기간을 입력하고 저장하면 도심 농부도 같은 내용을 봅니다.'
          : '공간 제공자가 입력한 조건입니다. 수정은 공간 제공자만 할 수 있습니다.'}
      </p>

      {/* 브라우저 기본 검증을 끕니다. 켜 두면 이 변경 이전에 저장된 계약처럼
          시작일이 이미 ±2주 밖인 계약에서 제출 자체가 취소되어, 아무 안내 없이
          저장 버튼이 먹통이 됩니다. 검증은 아래 submit이 모두 맡아 같은 자리에
          한국어 문구로 보여 줍니다(min/max는 달력을 좁히는 역할만 합니다). */}
      <form className="mt-5 grid gap-4" noValidate onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            errorMessage={amountErrors.monthlyRent}
            label="월세"
            min={AMOUNT_MIN}
            name="monthlyRent"
            onChange={(event) => setMonthlyRent(event.target.value)}
            onKeyDown={blockNonPositiveIntegerKeys}
            readOnly={!canEdit}
            required
            step={1}
            type="number"
            value={monthlyRent}
          />
          <Input
            errorMessage={amountErrors.deposit}
            label="보증금"
            min={AMOUNT_MIN}
            name="deposit"
            onChange={(event) => setDeposit(event.target.value)}
            onKeyDown={blockNonPositiveIntegerKeys}
            readOnly={!canEdit}
            required
            step={1}
            type="number"
            value={deposit}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            errorMessage={amountErrors.maintenanceFee}
            label="관리비"
            min={AMOUNT_MIN}
            name="maintenanceFee"
            onChange={(event) => setMaintenanceFee(event.target.value)}
            onKeyDown={blockNonPositiveIntegerKeys}
            readOnly={!canEdit}
            required
            step={1}
            type="number"
            value={maintenanceFee}
          />
          {/* 관리비를 내는 쪽은 둘 중 하나라 역할 이름 대신 각자의 닉네임으로 고릅니다. */}
          <Select
            disabled={!canEdit}
            errorMessage={payerError ?? undefined}
            label="관리비 책임소재"
            name="maintenanceFeePayer"
            onChange={(event) =>
              setMaintenanceFeePayer(event.target.value as MaintenanceFeePayer | '')
            }
            required
            value={maintenanceFeePayer}
          >
            <option value="">선택해 주세요</option>
            <option value="OWNER">{contract.ownerNickname}</option>
            <option value="FARMER">{contract.farmerNickname}</option>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 달력 자체를 좁혀 고를 수 없는 날짜를 먼저 회색으로 만듭니다.
              회색으로 막힌 이유를 알 수 있게 시작일에는 안내 문구를 함께 둡니다. */}
          <Input
            errorMessage={periodErrors.startDate}
            helperText="오늘부터 앞뒤 2주 이내"
            label="계약 시작일"
            max={dateBounds.max}
            min={dateBounds.min}
            name="startDate"
            onChange={(event) => setStartDate(event.target.value)}
            readOnly={!canEdit}
            required
            type="date"
            value={startDate}
          />
          <Input
            errorMessage={periodErrors.endDate}
            label="계약 종료일"
            min={startDate ? nextDay(startDate) : undefined}
            name="endDate"
            onChange={(event) => setEndDate(event.target.value)}
            readOnly={!canEdit}
            required
            type="date"
            value={endDate}
          />
        </div>
        {canEdit ? (
          <Button className="sm:justify-self-end" disabled={isSubmitting} type="submit">
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        ) : null}
      </form>
    </Card>
  );
}

// 계약 취소(REJECTED)든 신청 철회(CANCELED)든 더 기다릴 동의가 없다는 점은 같습니다.
function isCanceled(contract: ContractDetail) {
  return contract.status === 'REJECTED' || contract.status === 'CANCELED';
}

// 취소는 누른 쪽에만 표시합니다 — 상대는 취소 직전의 동의 상태를 그대로 둡니다.
// 다만 누가 취소했는지 서버가 모르는 계약(확정에 밀린 자동 거절, 취소자 기록 이전에 쌓인 건)은
// 한쪽을 고를 근거가 없어 예전처럼 양쪽에 표시합니다.
function canceledParty(contract: ContractDetail, party: ContractParty) {
  return (
    isCanceled(contract) && (contract.canceledBy === null || contract.canceledBy === party)
  );
}

function AgreementCard({ contract }: { contract: ContractDetail }) {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">동의 현황</h2>
      <ul className="mt-4 grid gap-3 text-body-sm">
        <AgreementRow
          agreed={contract.ownerAgreed}
          canceled={canceledParty(contract, 'OWNER')}
          label={contract.ownerNickname}
        />
        <AgreementRow
          agreed={contract.farmerAgreed}
          canceled={canceledParty(contract, 'FARMER')}
          label={contract.farmerNickname}
        />
      </ul>
    </Card>
  );
}

interface AgreementRowProps {
  agreed: boolean;
  canceled: boolean;
  label: string;
}

// 색만으로 상태를 구분하지 않도록 배지 안에 문구를 함께 넣습니다.
// 취소된 계약에서는 더 기다릴 동의가 없으므로 '동의 대기' 대신 취소를 알립니다.
function AgreementRow({ agreed, canceled, label }: AgreementRowProps) {
  const badge = agreed
    ? { tone: 'green' as const, text: '동의 완료' }
    : canceled
      ? { tone: 'red' as const, text: '계약 취소' }
      : { tone: 'slate' as const, text: '동의 대기' };

  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-content-muted">{label}</span>
      <Badge tone={badge.tone}>{badge.text}</Badge>
    </li>
  );
}
