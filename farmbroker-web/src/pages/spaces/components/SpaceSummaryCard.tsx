import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { RemoteImage } from '@/components/common/RemoteImage';
import type { SpaceCreateInput } from '@/types/api';
import { formatArea, formatCurrency, formatNumber } from '@/utils/format';

interface SpaceSummaryCardProps {
  input: SpaceCreateInput;
}

const facilityLabels: [keyof SpaceCreateInput, string][] = [
  ['hasWater', '수도 사용 가능'],
  ['hasElectricity', '전기 사용 가능'],
  ['hasVentilation', '환기 가능'],
];

// 등록 직전에 입력한 공간 정보를 그대로 되짚어 볼 수 있게 요약합니다.
export function SpaceSummaryCard({ input }: SpaceSummaryCardProps) {
  const facilities = facilityLabels.filter(([key]) => input[key]);
  const imageCount = input.imageUrls?.length ?? 0;

  return (
    <Card padding="lg">
      <h2 className="text-lg font-bold text-content">입력한 공간 정보</h2>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          ['공간 이름', input.title],
          ['공간 위치', input.address],
          ['전체 면적', formatArea(input.area)],
          ['층수', `${formatNumber(input.floor)}층`],
          ['희망 월세', formatCurrency(input.monthlyRent)],
          ['등록 사진', `${formatNumber(imageCount)}장`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-app bg-surface-subtle p-3">
            <dt className="text-xs font-semibold text-content-subtle">{label}</dt>
            <dd className="mt-1 font-bold text-content">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <h3 className="text-sm font-bold text-content">공간 조건</h3>
        {facilities.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {facilities.map(([key, label]) => (
              <Badge key={key}>{label}</Badge>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-body-sm text-content-muted">
            선택한 공간 조건이 없습니다. 수정하기에서 수도, 전기, 환기 여부를 확인해
            주세요.
          </p>
        )}
      </div>

      {imageCount > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-content">등록할 사진</h3>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {input.imageUrls?.map((imageUrl, index) => (
              <li key={imageUrl} className="overflow-hidden rounded-app border border-line">
                <RemoteImage
                  alt={`등록할 공간 사진 ${formatNumber(index + 1)}`}
                  className="h-20 w-full object-cover"
                  src={imageUrl}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {input.description ? (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-content">상세 메모</h3>
          <p className="mt-2 text-body-sm text-content-muted">{input.description}</p>
        </div>
      ) : null}
    </Card>
  );
}
