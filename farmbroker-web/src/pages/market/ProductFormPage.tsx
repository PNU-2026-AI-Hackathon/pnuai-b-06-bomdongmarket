import { Camera, FileText, Plus, Route, Sprout, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/authContext';
import { hasRole } from '@/auth/roles';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
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
import {
  DEFAULT_SALE_UNIT,
  composeUnit,
  parseUnit,
  saleUnits,
  unitPriceHint,
} from '@/pages/market/constants/saleUnits';
import { useMyWorkplaces } from '@/pages/market/hooks/useMyWorkplaces';
import { deleteImage } from '@/services/fileService';
import { createProduct, getMarketItem, updateProduct } from '@/services/marketService';
import type { ProductEventInput } from '@/types/api';
import type { AsyncStatus } from '@/types/common';
import { formatCurrency } from '@/utils/format';

// 판매자가 로컬마켓 상품을 등록·수정하는 화면입니다.
// 백엔드 계약(#54 합의사항, #56 구현)에 맞춰 요청 바디를 구성합니다.
// - category는 계약에 정의된 한글 라벨('잎채소'/'허브'/'과채류')만 전송합니다.
// - '어디서 생산했나요'는 내가 등록한 공실(GET /spaces/my)과 매칭이 수락돼 재배 중인 공간
//   (GET /matchings/my-requests 중 ACCEPTED)을 합쳐 보여 주고, 고르면 생산 위치·주소·spaceId를 채웁니다.
//   spaceId는 FK가 아닌 스냅샷이라 직접 입력만으로도 등록됩니다.
// - address는 카카오맵으로 생산지를 찍는 데 쓰이므로 접이식 섹션이 아니라 기본 정보에 둡니다.
// - imageUrl은 POST /files 업로드 결과 URL입니다. 판매자가 사진을 인터넷 어딘가에 먼저
//   올려 둘 필요가 없도록 URL 입력 대신 로컬 파일 업로드만 받습니다.
// - 위경도·푸드 마일리지는 지도 연동(Task 3)에서 서버가 채우므로 이 폼에서 받지 않습니다.
// 필수는 기본 정보 한 섹션에 모으고 나머지는 접어 두어, 처음 여는 사람이 채울 칸이 적어 보이게 합니다.
export function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(productId);
  // 서버가 FARMER가 아닌 등록을 403으로 막으므로(#56) 폼을 다 채운 뒤 실패하지 않도록 먼저 안내합니다.
  const isFarmer = hasRole(user, 'FARMER');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<AsyncStatus>(isEdit ? 'loading' : 'success');

  const { workplaces } = useMyWorkplaces();
  const ownedPlaces = workplaces.filter((place) => place.source === 'owned');
  const farmingPlaces = workplaces.filter((place) => place.source === 'farming');
  const [spaceId, setSpaceId] = useState<number | null>(null);
  const [events, setEvents] = useState<ProductEventInput[]>([]);
  const [discardedUrls, setDiscardedUrls] = useState<string[]>([]);
  const [fields, setFields] = useState({
    name: '',
    category: productCategories[0] as string,
    price: '',
    unitAmount: '',
    unitType: DEFAULT_SALE_UNIT as string,
    stock: '',
    harvestDate: '',
    description: '',
    imageUrl: '',
    productionLocation: '',
    address: '',
  });

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
          // 자유 입력으로 저장된 옛 값('팩' 등)은 양을 알 수 없어 빈 칸으로 두고 다시 받습니다.
          unitAmount: parseUnit(item.unit)?.amount ?? '',
          unitType: parseUnit(item.unit)?.unit ?? DEFAULT_SALE_UNIT,
          stock: String(item.stock),
          harvestDate: item.harvestDate,
          description: item.description ?? '',
          imageUrl: item.imageUrl ?? '',
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

  const composedUnit = composeUnit(fields.unitAmount, fields.unitType);
  const salePreview =
    composedUnit && fields.price
      ? `${composedUnit} · ${formatCurrency(Number(fields.price))}`
      : null;
  const pricePerBase = unitPriceHint(fields.price, fields.unitAmount, fields.unitType);

  function importFromSpace(selectedId: string) {
    const picked = workplaces.find((place) => String(place.spaceId) === selectedId);
    if (!picked) {
      setSpaceId(null);
      return;
    }
    setSpaceId(picked.spaceId);
    setFields((prev) => ({
      ...prev,
      productionLocation: picked.title,
      // 주소는 지도 표시에 쓰이므로 비어 있으면 덮지 않고 기존 입력을 지킵니다.
      address: picked.address || prev.address,
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

    const imageUrl = fields.imageUrl.trim();
    const payload = {
      name: fields.name,
      category: fields.category,
      price: Number(fields.price),
      unit: composeUnit(fields.unitAmount, fields.unitType),
      stock: Number(fields.stock),
      // 수정에서 사진을 비울 때는 null이 '변경 없음'으로 해석되지 않도록 제거 의사를 따로 보냅니다.
      ...(imageUrl ? { imageUrl } : isEdit ? { removeImageUrl: true } : { imageUrl: null }),
      description: fields.description.trim() || null,
      harvestDate: fields.harvestDate,
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
      // 저장된 사진은 되돌린 선택일 수 있으므로 삭제 대상에서 빼고, 저장 성공 뒤에만 정리합니다.
      const urlsToDelete = [...new Set(discardedUrls)].filter(
        (url) => url !== result.imageUrl,
      );
      await Promise.all(
        urlsToDelete.map((url) => deleteImage(url).catch(() => undefined)),
      );
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

  if (!isFarmer) {
    return (
      <PageContainer narrow>
        <EmptyState
          description="공간 제공자와의 매칭이 수락되면 도심 농부가 되고, 그때부터 수확물을 등록할 수 있습니다."
          title="아직 상품을 등록할 수 없습니다"
        />
      </PageContainer>
    );
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

      {/* 입력 본문만 16px로 키웁니다(공통 기본값은 14px).
          모바일에서 읽기 편하고, iOS 사파리가 16px 미만 입력에 포커스할 때 페이지를 강제 확대하는 것도 막힙니다.
          공통 컴포넌트를 바꾸면 로그인·공간 등록 등 다른 담당자 화면까지 영향을 주므로 이 화면에만 한정합니다. */}
      <form
        className="grid gap-5 pb-4 [&_input]:text-base [&_select]:text-base [&_textarea]:text-base"
        onSubmit={handleSubmit}
      >
        <FormSection
          description="여섯 칸만 채우면 바로 판매를 시작할 수 있습니다."
          icon={<Sprout className="h-8 w-8" aria-hidden />}
          title="기본 정보"
        >
          {/* 내 공실과 매칭이 수락돼 재배 중인 남의 공간을 함께 보여 줍니다.
              고르면 생산 위치·주소가 한 번에 채워져 직접 칠 칸이 줄어듭니다. */}
          {workplaces.length > 0 ? (
            <Select
              helperText="고르면 생산 위치와 주소가 자동으로 채워집니다."
              label="어디서 생산했나요"
              onChange={(event) => importFromSpace(event.target.value)}
              value={spaceId === null ? '' : String(spaceId)}
            >
              <option value="">직접 입력할게요</option>
              {ownedPlaces.length > 0 ? (
                <optgroup label="내가 등록한 공간">
                  {ownedPlaces.map((place) => (
                    <option key={place.spaceId} value={String(place.spaceId)}>
                      {place.title}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {farmingPlaces.length > 0 ? (
                <optgroup label="내가 재배 중인 공간">
                  {farmingPlaces.map((place) => (
                    <option key={place.spaceId} value={String(place.spaceId)}>
                      {place.title}
                    </option>
                  ))}
                </optgroup>
              ) : null}
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
          {/* 한 번에 파는 양과 그 값을 붙여 두면 '무엇을 얼마에 파는지'를 한 줄로 읽을 수 있습니다. */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="한 번에 파는 양"
              min={0}
              onChange={(event) => setField('unitAmount', event.target.value)}
              placeholder="200"
              required
              step="any"
              type="number"
              value={fields.unitAmount}
            />
            <Select
              label="단위"
              onChange={(event) => setField('unitType', event.target.value)}
              required
              value={fields.unitType}
            >
              {saleUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
            <Input
              label="가격(원)"
              min={0}
              onChange={(event) => setField('price', event.target.value)}
              placeholder="4300"
              required
              type="number"
              value={fields.price}
            />
          </div>

          {/* 구매자가 보게 될 문구를 그대로 미리 보여 줍니다.
              '팩'처럼 양을 알 수 없는 표기를 막는 것이 이 칸들의 목적이라, 결과를 눈으로 확인시켜 줍니다. */}
          <div className="rounded-app bg-leaf-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-600">구매자에게 이렇게 보입니다</p>
            <p className="mt-1 text-lg font-black text-ink-900">
              {salePreview ?? '양과 가격을 입력하면 여기에 표시됩니다'}
            </p>
            {pricePerBase ? (
              <p className="mt-1 text-sm font-semibold text-leaf-700">{pricePerBase}</p>
            ) : null}
          </div>

          <Input
            helperText="위 묶음을 몇 개까지 팔 수 있는지 적습니다."
            label="재고 수량"
            min={0}
            onChange={(event) => setField('stock', event.target.value)}
            placeholder="24"
            required
            type="number"
            value={fields.stock}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="수확일"
              onChange={(event) => setField('harvestDate', event.target.value)}
              required
              type="date"
              value={fields.harvestDate}
            />
            <Input
              helperText="구매자에게 보이는 이름입니다."
              label="생산 위치"
              maxLength={255}
              onChange={(event) => setField('productionLocation', event.target.value)}
              placeholder="예: 장전 스마트팜"
              required
              value={fields.productionLocation}
            />
          </div>
          {/* 주소는 지도에 위치를 찍는 데 쓰이므로 접어 두지 않고 기본 정보에 둡니다. */}
          <Input
            helperText="이 주소로 지도에 생산지를 표시합니다. 비워 두면 지도에 나오지 않습니다."
            label="생산지 주소"
            maxLength={255}
            onChange={(event) => setField('address', event.target.value)}
            placeholder="예: 부산광역시 금정구 장전동 30"
            value={fields.address}
          />
        </FormSection>

        <FormSection
          description="비워 두면 기본 이미지가 표시됩니다."
          icon={<Camera className="h-8 w-8" aria-hidden />}
          optional
          title="대표 사진"
        >
          <ProductImageUploader
            onChange={(imageUrl) => setField('imageUrl', imageUrl)}
            onDiscard={(url) => setDiscardedUrls((prev) => [...prev, url])}
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
