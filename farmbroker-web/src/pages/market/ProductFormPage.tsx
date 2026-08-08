import { Camera, FileText, Plus, Route, Sprout, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { PageContainer } from '@/components/layout/PageContainer';
import { ROUTES } from '@/constants/routes';
import { FormSection } from '@/pages/market/components/FormSection';
import { ProductImageUploader } from '@/pages/market/components/ProductImageUploader';
import {
  productCategories,
  traceabilitySteps,
} from '@/pages/market/constants/marketOptions';
import { createProduct, getMarketItem, updateProduct } from '@/services/marketService';
import { getMySpaces } from '@/services/spaceService';
import type { ProductEventInput, SpaceSummary } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

// 판매자가 로컬마켓 상품을 등록·수정하는 화면입니다.
// 백엔드 계약(#54 합의사항, #56 구현)에 맞춰 요청 바디를 구성합니다.
// - category는 계약에 정의된 한글 라벨('잎채소'/'허브'/'과채류')만 전송합니다.
// - '내 작업장에서 불러오기'는 GET /spaces/my 로 내 공간을 불러와 생산 위치·주소·spaceId를 채웁니다.
//   spaceId는 FK가 아닌 스냅샷이라 직접 입력만으로도 등록됩니다.
// - imageUrl은 POST /files 업로드 결과 URL입니다. 판매자가 사진을 인터넷 어딘가에 먼저
//   올려 둘 필요가 없도록 URL 입력 대신 로컬 파일 업로드만 받습니다.
// - 위경도·푸드 마일리지는 지도 연동(Task 3)에서 서버가 채우므로 이 폼에서 받지 않습니다.
// 필수는 기본 정보 한 섹션에 모으고 나머지는 접어 두어, 처음 여는 사람이 채울 칸이 적어 보이게 합니다.
export function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<AsyncStatus>(isEdit ? 'loading' : 'success');

  const [mySpaces, setMySpaces] = useState<SpaceSummary[]>([]);
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [events, setEvents] = useState<ProductEventInput[]>([]);
  const [fields, setFields] = useState({
    name: '',
    category: productCategories[0] as string,
    price: '',
    unit: '',
    stock: '',
    harvestDate: '',
    description: '',
    imageUrl: '',
    producerName: '',
    productionLocation: '',
    address: '',
  });

  // '작업장에서 가져오기'용 목록. 공간이 없어도 직접 입력으로 등록할 수 있어 실패는 무시합니다.
  useEffect(() => {
    void getMySpaces()
      .then(setMySpaces)
      .catch(() => setMySpaces([]));
  }, []);

  useEffect(() => {
    if (!productId) return;
    async function load() {
      setLoadStatus('loading');
      try {
        const item = await getMarketItem(Number(productId));
        setFields({
          name: item.name,
          category: item.category,
          price: String(item.price),
          unit: item.unit,
          stock: String(item.stock),
          harvestDate: item.harvestDate,
          description: item.description ?? '',
          imageUrl: item.imageUrl ?? '',
          producerName: item.producerName,
          productionLocation: item.productionLocation,
          address: item.address ?? '',
        });
        setSpaceId(item.spaceId ?? null);
        setEvents(
          (item.traceabilityEvents ?? []).map((event) => ({
            stage: event.stage,
            description: event.description ?? '',
            occurredAt: event.occurredAt,
            sortOrder: event.sortOrder,
          })),
        );
        setLoadStatus('success');
      } catch {
        setLoadStatus('error');
      }
    }
    void load();
  }, [productId]);

  function setField(key: keyof typeof fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function importFromSpace(selectedId: string) {
    const picked = mySpaces.find((space) => String(space.spaceId) === selectedId);
    if (!picked) {
      setSpaceId(null);
      return;
    }
    setSpaceId(picked.spaceId);
    setFields((prev) => ({
      ...prev,
      productionLocation: picked.title,
      address: picked.address ?? prev.address,
    }));
  }

  function addEvent() {
    setEvents((prev) => [
      ...prev,
      { stage: traceabilitySteps[0], description: '', occurredAt: '', sortOrder: prev.length },
    ]);
  }

  function updateEvent(index: number, patch: Partial<ProductEventInput>) {
    setEvents((prev) => prev.map((event, i) => (i === index ? { ...event, ...patch } : event)));
  }

  function removeEvent(index: number) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      name: fields.name,
      category: fields.category,
      price: Number(fields.price),
      unit: fields.unit,
      stock: Number(fields.stock),
      // 비우면 목록·상세가 기본 이미지를 사용합니다.
      imageUrl: fields.imageUrl.trim() || null,
      description: fields.description.trim() || null,
      harvestDate: fields.harvestDate,
      // 미입력 시 서버가 판매자 닉네임을 기본값으로 사용합니다(계약).
      producerName: fields.producerName.trim() || null,
      productionLocation: fields.productionLocation,
      address: fields.address.trim() || null,
      spaceId,
      // 단계와 일자가 모두 채워진 이력만 보냅니다(서버 필수값).
      events: events
        .filter((item) => item.stage && item.occurredAt)
        .map((item, index) => ({ ...item, sortOrder: index })),
    };

    try {
      const result = isEdit
        ? await updateProduct(Number(productId), payload)
        : await createProduct(payload);
      navigate(ROUTES.productDetail(result.productId));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `상품 ${isEdit ? '수정' : '등록'}에 실패했습니다.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loadStatus === 'loading') {
    return (
      <PageContainer narrow>
        <LoadingState label="상품 정보를 불러오는 중입니다" />
      </PageContainer>
    );
  }

  if (loadStatus === 'error') {
    return (
      <PageContainer narrow>
        <ErrorState message="상품 정보를 불러오지 못했습니다" />
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      <div className="mb-6">
        <PageHeader
          description={
            isEdit
              ? '가격과 재고를 수정하면 마켓에 바로 반영됩니다.'
              : '수확한 농산물을 지역 소비자에게 직접 판매합니다.'
          }
          eyebrow="로컬마켓"
          title={isEdit ? '상품 수정' : '상품 등록'}
        />
      </div>

      <form className="grid gap-5 pb-4" onSubmit={handleSubmit}>
        <FormSection
          description="여섯 칸만 채우면 바로 판매를 시작할 수 있습니다."
          icon={<Sprout className="h-8 w-8" aria-hidden />}
          title="기본 정보"
        >
          {/* 등록한 작업장을 고르면 생산 위치·주소가 한 번에 채워져 직접 칠 칸이 줄어듭니다. */}
          {mySpaces.length > 0 ? (
            <Select
              helperText="고르면 생산 위치와 주소가 자동으로 채워집니다."
              label="내 작업장에서 불러오기"
              onChange={(event) => importFromSpace(event.target.value)}
              value={spaceId === null ? '' : String(spaceId)}
            >
              <option value="">직접 입력할게요</option>
              {mySpaces.map((space) => (
                <option key={space.spaceId} value={String(space.spaceId)}>
                  {space.title}
                </option>
              ))}
            </Select>
          ) : null}
          <Input
            label="상품명"
            maxLength={100}
            onChange={(event) => setField('name', event.target.value)}
            placeholder="예: 버터헤드 상추"
            required
            value={fields.name}
          />
          <Select
            label="카테고리"
            onChange={(event) => setField('category', event.target.value)}
            required
            value={fields.category}
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="가격(원)"
              min={0}
              onChange={(event) => setField('price', event.target.value)}
              placeholder="4300"
              required
              type="number"
              value={fields.price}
            />
            <Input
              label="판매 단위"
              maxLength={20}
              onChange={(event) => setField('unit', event.target.value)}
              placeholder="팩"
              required
              value={fields.unit}
            />
            <Input
              label="재고"
              min={0}
              onChange={(event) => setField('stock', event.target.value)}
              placeholder="24"
              required
              type="number"
              value={fields.stock}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="수확일"
              onChange={(event) => setField('harvestDate', event.target.value)}
              required
              type="date"
              value={fields.harvestDate}
            />
            <Input
              label="생산 위치"
              maxLength={255}
              onChange={(event) => setField('productionLocation', event.target.value)}
              placeholder="예: 장전 스마트팜"
              required
              value={fields.productionLocation}
            />
          </div>
        </FormSection>

        <FormSection
          description="비워 두면 기본 이미지가 표시됩니다."
          icon={<Camera className="h-8 w-8" aria-hidden />}
          optional
          title="대표 사진"
        >
          <ProductImageUploader
            onChange={(imageUrl) => setField('imageUrl', imageUrl)}
            value={fields.imageUrl}
          />
        </FormSection>

        <FormSection
          collapsible
          description="적어 두면 구매자가 더 믿고 삽니다. 나중에 수정해도 됩니다."
          icon={<FileText className="h-8 w-8" aria-hidden />}
          optional
          title="상세 정보"
        >
          <Textarea
            label="상품 설명"
            onChange={(event) => setField('description', event.target.value)}
            placeholder="재배 방식과 보관 방법을 적어 주세요."
            rows={4}
            value={fields.description}
          />
          <Input
            helperText="지도 표시에 사용됩니다."
            label="주소"
            maxLength={255}
            onChange={(event) => setField('address', event.target.value)}
            placeholder="예: 부산광역시 금정구 장전동"
            value={fields.address}
          />
          <Input
            helperText="비워 두면 내 닉네임으로 표시됩니다."
            label="생산자명"
            maxLength={60}
            onChange={(event) => setField('producerName', event.target.value)}
            placeholder="예: 어반리프"
            value={fields.producerName}
          />
        </FormSection>

        <FormSection
          collapsible
          defaultOpen={events.length > 0}
          description="파종부터 등록까지의 과정을 남기면 상세 화면에 타임라인으로 표시됩니다."
          icon={<Route className="h-8 w-8" aria-hidden />}
          optional
          title="생산 이력"
        >
          {events.map((event, index) => (
            <div className="grid gap-3 rounded-app border border-leaf-100 p-4" key={index}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="단계"
                  onChange={(changed) => updateEvent(index, { stage: changed.target.value })}
                  value={event.stage}
                >
                  {traceabilitySteps.map((step) => (
                    <option key={step} value={step}>
                      {step}
                    </option>
                  ))}
                </Select>
                <Input
                  label="일자"
                  onChange={(changed) => updateEvent(index, { occurredAt: changed.target.value })}
                  type="date"
                  value={event.occurredAt}
                />
              </div>
              <Input
                label="설명"
                onChange={(changed) => updateEvent(index, { description: changed.target.value })}
                placeholder="예: 육묘 트레이에 파종"
                value={event.description ?? ''}
              />
              <Button
                className="justify-self-start"
                onClick={() => removeEvent(index)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                삭제
              </Button>
            </div>
          ))}
          <Button
            className="w-full"
            onClick={addEvent}
            type="button"
            variant="outline"
          >
            <Plus className="h-5 w-5" aria-hidden />
            {events.length === 0 ? '첫 이력 추가' : '이력 추가'}
          </Button>
        </FormSection>

        {error ? (
          <p className="text-sm font-semibold text-feedback-danger" role="alert">
            {error}
          </p>
        ) : null}

        {/* 폼이 길어 모바일에서 제출 버튼이 화면 밖으로 밀리므로 공간 등록 화면과 같이 하단에 고정합니다. */}
        <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          <Button className="w-full" disabled={isSaving} size="lg" type="submit">
            {isSaving ? '저장 중...' : isEdit ? '수정 내용 저장' : '상품 등록하기'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
