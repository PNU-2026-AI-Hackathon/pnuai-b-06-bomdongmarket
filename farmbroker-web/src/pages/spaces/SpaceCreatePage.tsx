import { ArrowRight, Camera } from 'lucide-react';
import { ChangeEvent, FormEvent, KeyboardEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageHeader } from '@/components/common/PageHeader';
import { Textarea } from '@/components/common/Textarea';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { AddressField, type AddressValue } from '@/pages/spaces/components/AddressField';
import { SpaceImageUploader } from '@/pages/spaces/components/SpaceImageUploader';
import { SpaceLocationMap } from '@/pages/spaces/components/SpaceLocationMap';
import {
  AREA_MAX,
  FLOOR_MAX,
  FLOOR_MIN,
  NUMBER_FIELD_MESSAGES,
  RENT_MIN,
  validateSpaceNumbers,
  type SpaceNumberErrors,
} from '@/pages/spaces/constants/spaceNumberLimits';
import type { SpaceCreateLocationState } from '@/pages/spaces/types';
import { geocodeAddress } from '@/utils/geocode';

// 면적·월세 칸에서 음수 입력 자체를 막습니다. type="number"는 '-'와 지수 표기('e')를 허용하기 때문입니다.
// 층수는 지하가 음수로 표현되므로 이 핸들러를 달지 않습니다.
function blockNegativeKeys(event: KeyboardEvent<HTMLInputElement>) {
  if (['-', '+', 'e', 'E'].includes(event.key)) {
    event.preventDefault();
  }
}

// 건물에 0층은 없지만 min/max는 연속 범위만 표현할 수 있어 '0 제외'를 속성으로 못 씁니다.
// 면적의 min 위반과 똑같이 브라우저 기본 경고 말풍선이 뜨도록 검증 문구를 직접 심습니다.
// 값이 0이 아니게 되면 반드시 지워야 합니다 — 남겨 두면 그 칸이 영원히 invalid로 남습니다.
function markZeroFloorInvalid(event: ChangeEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  input.setCustomValidity(
    input.valueAsNumber === 0 ? NUMBER_FIELD_MESSAGES.floorZero : '',
  );
}

// 공실 제공자가 API 명세의 필수 공간 필드를 입력하는 모바일 우선 등록 폼입니다.
// 실제 등록은 다음 단계인 수익 예측 확인 화면에서 확정합니다.
export function SpaceCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 예측 화면에서 수정하러 돌아온 경우 직전 입력값을 그대로 복원합니다.
  const previousState = location.state as SpaceCreateLocationState | null;
  const previous = previousState?.input;
  // 주소는 우편번호 검색으로만 채우므로 FormData 비제어 방식 대신 상태로 들고 있습니다.
  // 나머지 필드는 기존대로 제출 시점에 FormData로 읽습니다.
  // input.address는 두 칸을 합친 값이라 그대로 복원하면 칸 분리가 깨집니다. 나눠진 원본을 함께 받습니다.
  const [address, setAddress] = useState<AddressValue>(
    previousState?.addressParts ?? { roadAddress: previous?.address ?? '', detail: '' },
  );
  const [addressError, setAddressError] = useState<string | null>(null);
  // 사진은 고르는 즉시 업로드되므로 폼에는 서버가 돌려준 URL만 남습니다.
  const [imageUrls, setImageUrls] = useState<string[]>(previous?.imageUrls ?? []);
  const [imageError, setImageError] = useState<string | null>(null);
  const [numberErrors, setNumberErrors] = useState<SpaceNumberErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 주소 칸은 검색으로만 채우는 readOnly라 브라우저 required 검증에 기댈 수 없습니다.
    if (!address.roadAddress) {
      setAddressError('주소 검색으로 공간 위치를 선택해 주세요.');
      return;
    }
    setAddressError(null);

    // 사진은 파일 입력이라 브라우저 required 검증이 걸리지 않아 여기서 직접 막습니다.
    if (imageUrls.length === 0) {
      setImageError('공간 사진을 최소 1장 등록해야 합니다.');
      return;
    }
    setImageError(null);

    const formData = new FormData(event.currentTarget);
    const numbers = {
      area: Number(formData.get('area')),
      monthlyRent: Number(formData.get('monthlyRent')),
      floor: Number(formData.get('floor')),
    };

    // 키 입력 차단으로는 붙여넣기와 모바일 키패드를 막을 수 없어 제출 시점에 다시 검사합니다.
    const errors = validateSpaceNumbers(numbers);
    setNumberErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    // 좌표를 확보하지 못하면 등록을 진행하지 않는다. 좌표 없이 등록하면 주소가 지도에서
    // 위치를 못 잡아(폴백 지오코딩까지 실패하면 반경 결과에서 제외됨) 검색에 노출되지 않는다.
    const coords = await geocodeAddress(address.roadAddress).catch(() => null);
    if (!coords) {
      setAddressError(
        '주소의 좌표를 확인하지 못했습니다. 주소를 다시 확인하거나 잠시 후 다시 시도해 주세요.',
      );
      return;
    }

    const state: SpaceCreateLocationState = {
      // 수정하러 돌아왔을 때 두 칸을 그대로 되살리려면 합치기 전 값도 함께 넘겨야 합니다.
      addressParts: address,
      input: {
        title: String(formData.get('title')),
        address: [address.roadAddress, address.detail].filter(Boolean).join(' '),
        ...numbers,
        hasWater: formData.get('hasWater') === 'on',
        hasElectricity: formData.get('hasElectricity') === 'on',
        hasVentilation: formData.get('hasVentilation') === 'on',
        description: String(formData.get('description')),
        imageUrls,
        latitude: coords.lat,
        longitude: coords.lng,
      },
    };

    navigate(ROUTES.newSpacePrediction, { state });
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <PageHeader eyebrow="공간 등록" title="새 재배 공간 등록" />
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Card className="grid gap-4" padding="lg">
          <Input
            defaultValue={previous?.title}
            label="공간 이름"
            name="title"
            placeholder="예: 부산대 앞 20평 상가 공실"
            required
            requiredMark
          />
          <AddressField
            detail={address.detail}
            errorMessage={addressError}
            onChange={(next) => {
              setAddress(next);
              if (next.roadAddress) setAddressError(null);
            }}
            roadAddress={address.roadAddress}
          />
          {/* 고른 주소가 실제로 어디인지 등록 전에 눈으로 확인시켜 줍니다. */}
          <SpaceLocationMap address={address.roadAddress} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              defaultValue={previous?.area}
              errorMessage={numberErrors.area}
              label="전체 면적(㎡)"
              max={AREA_MAX}
              min={1}
              name="area"
              onKeyDown={blockNegativeKeys}
              placeholder="예: 66"
              required
              requiredMark
              step="any"
              type="number"
            />
            <Input
              defaultValue={previous?.floor}
              errorMessage={numberErrors.floor}
              helperText="지하는 -1, -2처럼 음수로 입력합니다"
              label="층수"
              max={FLOOR_MAX}
              min={FLOOR_MIN}
              name="floor"
              onChange={markZeroFloorInvalid}
              placeholder="예: 2"
              required
              requiredMark
              type="number"
            />
            <Input
              defaultValue={previous?.monthlyRent}
              errorMessage={numberErrors.monthlyRent}
              label="희망 월세(원)"
              min={RENT_MIN}
              name="monthlyRent"
              onKeyDown={blockNegativeKeys}
              placeholder="예: 500000"
              required
              requiredMark
              type="number"
            />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-ink-900">공간 조건</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                ['hasWater', '수도 사용 가능'],
                ['hasElectricity', '전기 사용 가능'],
                ['hasVentilation', '환기 가능'],
              ] as const
            ).map(([name, label]) => (
              <label
                key={name}
                className="flex min-h-12 items-center gap-3 rounded-app border border-leaf-100 bg-leaf-50 px-3 text-sm font-semibold text-ink-700"
              >
                <input
                  className="h-4 w-4 accent-leaf-700"
                  defaultChecked={previous ? previous[name] : true}
                  name={name}
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Textarea
              className="min-h-28"
              defaultValue={previous?.description}
              label="상세 메모"
              name="description"
              placeholder="예: 채광이 좋고 수도 사용이 가능하며 다단 재배 선반을 배치할 수 있는 상가 공간입니다."
            />
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">
                사진 업로드 <span className="text-feedback-danger">*</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                공간 상태를 확인할 수 있도록 최소 1장은 등록해 주세요. 먼저 선택한 사진이
                목록 카드의 대표 이미지가 됩니다.
              </p>
            </div>
            <Camera className="h-8 w-8 text-leaf-700" aria-hidden />
          </div>
          <div className="mt-4">
            <SpaceImageUploader
              onChange={(next) => {
                setImageUrls(next);
                if (next.length > 0) setImageError(null);
              }}
              requiredMessage={imageError}
              value={imageUrls}
            />
          </div>
        </Card>

        <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          <Button className="w-full" type="submit">
            수익 예측 확인
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
