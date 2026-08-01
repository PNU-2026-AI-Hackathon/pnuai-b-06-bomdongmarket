import { ArrowRight, Camera, CheckCircle2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { createSpace } from '@/services/spaceService';

// 공실 제공자가 API 명세의 필수 공간 필드를 입력하는 모바일 우선 등록 폼입니다.
export function SpaceCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const imageUrls = String(formData.get('imageUrls') ?? '')
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean);

    setIsSaving(true);
    setError(null);

    try {
      await createSpace({
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
      });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '공간 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
          공간 등록
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink-900">새 재배 공간 등록</h1>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Card className="grid gap-4 p-5">
          <Input
            label="공간 이름"
            name="title"
            placeholder="예: 부산대 앞 20평 상가 공실"
            required
          />
          <Input
            label="공간 위치"
            name="address"
            placeholder="예: 부산광역시 금정구 장전동"
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="전체 면적"
              min={1}
              name="area"
              placeholder="예: 66"
              required
              type="number"
            />
            <Input label="층수" name="floor" placeholder="예: 2" required type="number" />
            <Input
              label="희망 월세"
              min={0}
              name="monthlyRent"
              placeholder="예: 500000"
              required
              type="number"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink-900">공간 조건</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['hasWater', '수도 사용 가능'],
              ['hasElectricity', '전기 사용 가능'],
              ['hasVentilation', '환기 가능'],
            ].map(([name, label]) => (
              <label
                key={name}
                className="flex min-h-12 items-center gap-3 rounded-app border border-leaf-100 bg-leaf-50 px-3 text-sm font-semibold text-ink-700"
              >
                <input
                  className="h-4 w-4 accent-leaf-700"
                  defaultChecked
                  name={name}
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </div>
          <label className="mt-4 block text-sm font-medium text-ink-700">
            상세 메모
            <textarea
              className="mt-2 min-h-28 w-full rounded-app border border-leaf-100 bg-white px-3 py-3 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              name="description"
              placeholder="예: 채광이 좋고 수도 사용이 가능하며 다단 재배 선반을 배치할 수 있는 상가 공간입니다."
            />
          </label>
        </Card>

        <Card className="p-5">
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
          <label className="mt-4 block text-sm font-medium text-ink-700">
            이미지 URL
            <textarea
              className="mt-2 min-h-24 w-full rounded-app border border-leaf-100 bg-white px-3 py-3 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              name="imageUrls"
              placeholder="https://example.com/space.jpg"
            />
          </label>
        </Card>

        {error ? (
          <div
            className="rounded-app border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {saved ? (
          <div className="rounded-app border border-leaf-200 bg-leaf-50 p-4 text-leaf-900">
            <CheckCircle2 className="inline h-5 w-5 align-[-4px]" aria-hidden /> 공간
            등록이 완료되었습니다. 수익 예측 화면으로 이어서 확인해보세요.
          </div>
        ) : null}

        <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          {saved ? (
            <Button className="w-full" onClick={() => navigate(ROUTES.prediction)}>
              수익 예측으로 이동
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          ) : (
            <Button className="w-full" disabled={isSaving} type="submit">
              {isSaving ? '등록 중...' : '공간 등록'}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </PageContainer>
  );
}
