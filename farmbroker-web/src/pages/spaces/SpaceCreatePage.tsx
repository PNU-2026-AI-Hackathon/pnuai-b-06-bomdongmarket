import { ArrowRight, Camera, CheckCircle2, Upload } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { PageContainer } from '../../components/layout/PageContainer';
import { ROUTES } from '../../constants/routes';
import { createSpace } from '../../services/spaceService';
import { registrationSteps } from './constants/spaceOptions';

// 공실 제공자가 API 명세의 필수 공간 필드를 입력하는 모바일 우선 등록 폼입니다.
export function SpaceCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);

    // 데모에서는 FormData를 API 요청 DTO와 같은 모양으로 정리한 뒤 mock 서비스에 전달합니다.
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
      imageUrls: [],
    });

    setIsSaving(false);
    setSaved(true);
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-soil-500">
          Register Space
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink-900">Add a new grow space</h1>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-2">
        {registrationSteps.map((step, index) => (
          <div key={step}>
            <div className="h-1.5 rounded-full bg-leaf-100">
              <div
                className="h-full rounded-full bg-leaf-700"
                style={{ width: `${index === 0 ? 100 : index === 1 ? 66 : 33}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">{step}</p>
          </div>
        ))}
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Card className="grid gap-4 p-5">
          <Input
            defaultValue="Jangjeon-dong 20 pyeong retail space"
            label="Space Name"
            name="title"
            required
          />
          <Input
            defaultValue="Busan Geumjeong-gu Jangjeon-dong"
            label="Space Location"
            name="address"
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              defaultValue="66"
              label="Total Area"
              min={1}
              name="area"
              type="number"
            />
            <Input defaultValue="2" label="Floor" name="floor" type="number" />
            <Input
              defaultValue="500000"
              label="Desired Rent"
              min={0}
              name="monthlyRent"
              type="number"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink-900">Space conditions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['hasWater', 'Water Access'],
              ['hasElectricity', 'Electricity Access'],
              ['hasVentilation', 'Ventilation'],
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
            Notes
            <textarea
              className="mt-2 min-h-28 w-full rounded-app border border-leaf-100 bg-white px-3 py-3 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              defaultValue="Bright retail space with water access and room for multi-tier cultivation racks."
              name="description"
            />
          </label>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Photo Upload</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add images in the same order they should appear on cards.
              </p>
            </div>
            <Camera className="h-8 w-8 text-leaf-700" aria-hidden />
          </div>
          <button
            className="mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-app border border-dashed border-leaf-300 bg-leaf-50 text-sm font-semibold text-leaf-800"
            type="button"
          >
            <Upload className="mb-2 h-6 w-6" aria-hidden />
            Upload photos
          </button>
        </Card>

        {saved ? (
          <div className="rounded-app border border-leaf-200 bg-leaf-50 p-4 text-leaf-900">
            <CheckCircle2 className="inline h-5 w-5 align-[-4px]" aria-hidden /> Space
            saved to mock data. Continue to prediction for the demo flow.
          </div>
        ) : null}

        <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          {saved ? (
            <Button className="w-full" onClick={() => navigate(ROUTES.prediction)}>
              Continue to Profit Prediction
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          ) : (
            <Button className="w-full" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Next'}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </PageContainer>
  );
}
