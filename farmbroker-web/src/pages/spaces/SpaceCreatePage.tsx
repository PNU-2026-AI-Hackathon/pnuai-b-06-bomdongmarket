import { ArrowRight, Camera } from 'lucide-react';
import { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageHeader } from '@/components/common/PageHeader';
import { Textarea } from '@/components/common/Textarea';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import type { SpaceCreateLocationState } from '@/pages/spaces/types';

// 공실 제공자가 API 명세의 필수 공간 필드를 입력하는 모바일 우선 등록 폼입니다.
// 실제 등록은 다음 단계인 수익 예측 확인 화면에서 확정합니다.
export function SpaceCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 예측 화면에서 수정하러 돌아온 경우 직전 입력값을 그대로 복원합니다.
  const previous = (location.state as SpaceCreateLocationState | null)?.input;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const imageUrls = String(formData.get('imageUrls') ?? '')
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean);

    const state: SpaceCreateLocationState = {
      input: {
        title: String(formData.get('title')),
        address: String(formData.get('address')),
        area: Number(formData.get('area')),
        monthlyRent: Number(formData.get('monthlyRent')),
        floor: Number(formData.get('floor')),
        hasWater: formData.get('hasWater') === 'on',
        hasElectricity: formData.get('hasElectricity') === 'on',
        hasVentilation: formData.get('hasVentilation') === 'on',
        description: String(formData.get('description')),
        imageUrls,
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
          />
          <Input
            defaultValue={previous?.address}
            label="공간 위치"
            name="address"
            placeholder="예: 부산광역시 금정구 장전동"
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              defaultValue={previous?.area}
              label="전체 면적"
              min={1}
              name="area"
              placeholder="예: 66"
              required
              type="number"
            />
            <Input
              defaultValue={previous?.floor}
              label="층수"
              name="floor"
              placeholder="예: 2"
              required
              type="number"
            />
            <Input
              defaultValue={previous?.monthlyRent}
              label="희망 월세"
              min={0}
              name="monthlyRent"
              placeholder="예: 500000"
              required
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
              <h2 className="text-lg font-bold text-ink-900">사진 업로드</h2>
              <p className="mt-1 text-sm text-slate-600">
                카드에 노출될 순서대로 이미지를 등록합니다.
              </p>
            </div>
            <Camera className="h-8 w-8 text-leaf-700" aria-hidden />
          </div>
          <p className="mt-4 rounded-app border border-dashed border-leaf-300 bg-leaf-50 p-4 text-sm font-semibold leading-6 text-leaf-800">
            Swagger 명세에는 별도 업로드 API가 없어 공개 이미지 URL을 줄 단위로
            입력합니다.
          </p>
          <div className="mt-4">
            <Textarea
              className="min-h-24"
              defaultValue={previous?.imageUrls?.join('\n')}
              label="이미지 URL"
              name="imageUrls"
              placeholder="https://example.com/space.jpg"
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
