import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';
import type { ProfitEstimate } from '@/types/api';
import { formatArea, formatCurrency, formatNumber } from '@/utils/format';

interface PredictionResultCardProps {
  estimates: ProfitEstimate[];
}

// 음수 금액은 그대로 노출하되 손실이라는 사실이 색과 부호로 함께 읽히게 합니다.
function profitTone(value: number) {
  return value < 0 ? 'text-feedback-danger' : 'text-content';
}

// 서버 수익 계산기 결과를 대표 작물 중심으로 보여주고 계산 근거와 대안 작물을 함께 제공합니다.
export function PredictionResultCard({ estimates }: PredictionResultCardProps) {
  const [best, ...alternatives] = estimates;

  const metrics = [
    { label: '예상 월 매출', value: best.monthlyRevenueKrw },
    { label: '예상 월 운영비', value: best.monthlyOperatingCostKrw },
    { label: '예상 월 영업이익', value: best.monthlyOperatingProfitKrw },
  ];

  const costs = [
    { label: '전기비', value: best.electricityCostKrw },
    { label: '수도비', value: best.waterCostKrw },
    { label: '재료비', value: best.materialCostKrw },
    { label: '인건비', value: best.laborCostKrw },
    { label: '감가상각 등', value: best.depreciationAndOtherCostKrw },
  ];

  const basis = [
    { label: '면적 활용률', value: `${formatNumber(best.areaUtilizationPercent)}%` },
    { label: '다단 재배대', value: `${formatNumber(best.moduleLayers)}층` },
    { label: '총 재배면적', value: formatArea(best.cultivationAreaM2) },
    {
      label: '월평균 전력량',
      value: `${formatNumber(best.averageMonthlyEnergyKwh)}kWh`,
    },
    { label: '월 판매량', value: `${formatNumber(best.monthlySalesKg)}kg` },
    { label: 'kg당 단가', value: formatCurrency(best.pricePerKgKrw) },
  ];

  return (
    <Card padding="lg">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-eyebrow uppercase text-accent">추천 작물</p>
          <h2 className="mt-2 text-3xl font-black text-content">{best.cropName}</h2>
          <p className="mt-3 max-w-xl text-body-sm text-content-muted">
            {best.recommendation}
          </p>
        </div>
        <Badge tone={best.longTermRecommended ? 'green' : 'yellow'}>
          {best.contractType}
        </Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-app bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-content-subtle">{metric.label}</p>
            <p className={cn('mt-2 text-xl font-black', profitTone(metric.value))}>
              {formatCurrency(metric.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-app border border-line bg-surface p-4">
        <h3 className="font-bold text-content">공간 제공자 예상 수익</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-content-subtle">
              예상 배분수익 (영업이익의 {formatNumber(best.landlordShareRatio * 100)}%)
            </p>
            <p
              className={cn(
                'mt-1 text-2xl font-black',
                profitTone(best.landlordExpectedIncomeKrw),
              )}
            >
              {formatCurrency(best.landlordExpectedIncomeKrw)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-content-subtle">입력한 희망 월세</p>
            <p className="mt-1 text-2xl font-black text-content">
              {formatCurrency(best.desiredMonthlyRentKrw)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-app border border-line bg-surface p-4">
        <h3 className="font-bold text-content">예상 월 비용 내역</h3>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {costs.map((cost) => (
            <div key={cost.label} className="flex justify-between gap-3 text-body-sm">
              <dt className="text-content-muted">{cost.label}</dt>
              <dd className="font-bold text-content">{formatCurrency(cost.value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 rounded-app border border-line bg-surface p-4">
        <h3 className="font-bold text-content">계산 근거</h3>
        <p className="mt-2 text-body-sm text-content-muted">
          재배 가능 비율, 다단 층수, 천장고는 실측값이 없어 표준 가정값을 사용한 추정치입니다.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {basis.map((item) => (
            <div key={item.label} className="flex justify-between gap-3 text-body-sm">
              <dt className="text-content-muted">{item.label}</dt>
              <dd className="font-bold text-content">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {alternatives.length > 0 ? (
        <div className="mt-6 rounded-app border border-line bg-surface p-4">
          <h3 className="font-bold text-content">다른 작물 비교</h3>
          <ul className="mt-3 grid gap-2">
            {alternatives.map((estimate) => (
              <li
                key={estimate.cropName}
                className="flex flex-wrap items-center justify-between gap-2 rounded-app bg-surface-subtle px-3 py-2"
              >
                <span className="font-bold text-content">{estimate.cropName}</span>
                <span className="text-body-sm text-content-muted">
                  배분수익{' '}
                  <span
                    className={cn(
                      'font-bold',
                      profitTone(estimate.landlordExpectedIncomeKrw),
                    )}
                  >
                    {formatCurrency(estimate.landlordExpectedIncomeKrw)}
                  </span>{' '}
                  · {estimate.contractType}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
