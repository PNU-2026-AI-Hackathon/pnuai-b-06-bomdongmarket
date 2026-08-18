import { Camera, Sprout } from 'lucide-react';
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
import { productCategories } from '@/pages/market/constants/marketOptions';
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
import type { AsyncStatus } from '@/types/common';
import { geocodeAddress } from '@/utils/geocode';
import { formatCurrency } from '@/utils/format';

// 판매자가 로컬마켓 상품을 등록·수정하는 화면입니다.
// 백엔드 계약(#54 합의사항, #56 구현)에 맞춰 요청 바디를 구성합니다.
// - category는 계약에 정의된 한글 라벨('잎채소'/'허브'/'과채류')만 전송합니다.
// - '어디서 생산했나요'는 계약(매칭 수락)한 공간(GET /matchings/my-requests 중 ACCEPTED)만
//   보여 주고, 고르면 생산 위치·주소·spaceId를 채웁니다. 생산 위치·주소는 직접 입력 대신
//   선택으로만 채워지도록 readOnly로 둡니다(내가 등록만 한 공실은 재배지가 아니라 제외).
// - address는 카카오맵으로 생산지를 찍는 데 쓰이므로 접이식 섹션이 아니라 기본 정보에 둡니다.
// - imageUrl은 POST /files 업로드 결과 URL입니다. 판매자가 사진을 인터넷 어딘가에 먼저
//   올려 둘 필요가 없도록 URL 입력 대신 로컬 파일 업로드만 받습니다.
// - 주소를 지오코딩해 위경도를 함께 저장합니다(실패해도 등록은 진행, 조회 시 폴백). 푸드 마일리지는 이 폼에서 받지 않습니다.
// 대표 사진은 필수입니다 — 사진 없는 상품은 목록에서 사실상 눌리지 않습니다.
// 상품 설명은 접이식으로 빼면 대부분 비운 채 등록해 기본 정보에 함께 둡니다.
// 생산 이력 입력은 등록 부담이 커 이 폼에서 뺐습니다(기존에 저장된 이력은 상세에 그대로 보입니다).
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

  const { workplaces, isLoading: isWorkplacesLoading } = useMyWorkplaces();
  const [spaceId, setSpaceId] = useState<number | null>(null);
  // 평소 주소 칸은 공간 선택으로만 채워지지만(직접 입력 불가), 지오코딩이 실패하면
  // 그 공간으로는 저장이 막혀 버리므로 그때만 칸을 열어 직접 고쳐 다시 시도하게 한다.
  const [addressEditable, setAddressEditable] = useState(false);
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
  // 재배는 계약한 공간에서만 이뤄지므로, 신규 등록은 계약 공간이 하나도 없으면 애초에 막는다.
  // (수정은 이미 그 공간으로 올린 상품이라 생산 위치가 채워져 있어 허용한다.)
  const noWorkplaceForNew = !isEdit && !isWorkplacesLoading && workplaces.length === 0;

  function importFromSpace(selectedId: string) {
    const picked = workplaces.find((place) => String(place.spaceId) === selectedId);
    if (!picked) {
      setSpaceId(null);
      return;
    }
    setSpaceId(picked.spaceId);
    // 공간을 새로 고르면 주소가 자동 채움으로 돌아가므로 직접 수정 상태를 해제한다.
    setAddressEditable(false);
    setFields((prev) => ({
      ...prev,
      productionLocation: picked.title,
      // 주소는 지도 표시에 쓰이므로 비어 있으면 덮지 않고 기존 입력을 지킵니다.
      address: picked.address || prev.address,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const imageUrl = fields.imageUrl.trim();
    if (!imageUrl) {
      setError('대표 사진을 한 장 올려 주세요.');
      setIsSaving(false);
      return;
    }

    // 생산 위치·주소는 '어디서 생산했나요'에서 계약한 공간을 고르면 채워진다(readOnly).
    // 고르지 않으면 생산 위치가 비어 제출을 막는다.
    if (!fields.productionLocation.trim()) {
      setError('상품을 생산한 공간을 선택해 주세요.');
      setIsSaving(false);
      return;
    }

    const trimmedAddress = fields.address.trim();
    let coords: { lat: number; lng: number } | null = null;
    if (trimmedAddress) {
      coords = await geocodeAddress(trimmedAddress).catch(() => null);
      // 주소가 있는데 좌표를 확보하지 못하면 저장을 막는다 — 주소⇒좌표 불일치를 원천 차단.
      // (수정: 백엔드 PATCH가 null을 '변경 없음'으로 봐 주소만 바뀌고 옛 좌표가 남는다.
      //  등록: 좌표 없이 저장하면 주소 지오코딩이 안 될 때 반경 검색에서 빠져 지도에 안 보인다.)
      if (!coords) {
        // 주소가 있는데 좌표를 못 구하면 그 공간으로는 저장이 계속 막힌다.
        // 주소 칸을 열어 사용자가 직접 고쳐(예: 검색되는 형태로) 다시 시도할 수 있게 한다.
        setAddressEditable(true);
        setError(
          '주소의 좌표를 확인하지 못했습니다. 아래 생산지 주소를 직접 고쳐 다시 시도해 주세요.',
        );
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      name: fields.name,
      category: fields.category,
      price: Number(fields.price),
      unit: composeUnit(fields.unitAmount, fields.unitType),
      stock: Number(fields.stock),
      imageUrl,
      description: fields.description.trim() || null,
      harvestDate: fields.harvestDate,
      productionLocation: fields.productionLocation,
      address: trimmedAddress || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      spaceId,
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
          {/* 재배는 계약(매칭 수락)한 공간에서만 이뤄지므로 그 공간만 보여 줍니다.
              고르면 생산 위치·주소가 자동으로 채워집니다(직접 입력 불가). */}
          {isWorkplacesLoading ? null : workplaces.length > 0 ? (
            <Select
              helperText="계약한 공간을 고르면 생산 위치와 주소가 자동으로 채워집니다."
              label="어디서 생산했나요"
              onChange={(event) => importFromSpace(event.target.value)}
              value={
                spaceId !== null && workplaces.some((place) => place.spaceId === spaceId)
                  ? String(spaceId)
                  : ''
              }
            >
              <option value="" disabled>
                생산한 공간을 선택하세요
              </option>
              {workplaces.map((place) => (
                <option key={place.spaceId} value={String(place.spaceId)}>
                  {place.title}
                </option>
              ))}
            </Select>
          ) : (
            <p className="rounded-app border border-line bg-surface-subtle p-3 text-xs font-medium text-content-subtle">
              계약된 재배 공간이 없습니다. 공간 매칭이 수락되면 이곳에서 생산 공간을 고를 수 있습니다.
            </p>
          )}
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
              helperText="위에서 고른 공간으로 자동 채워집니다."
              label="생산 위치"
              placeholder="공간을 선택하면 채워집니다"
              readOnly
              value={fields.productionLocation}
            />
          </div>
          {/* 주소는 지도에 위치를 찍는 데 쓰이며, 위에서 고른 공간으로 자동 채워집니다.
              지오코딩이 실패했을 때만 열려, 검색되는 형태로 직접 고쳐 다시 시도할 수 있습니다. */}
          <Input
            helperText={
              addressEditable
                ? '좌표를 확인하지 못해 직접 수정할 수 있습니다. 검색되는 주소로 고쳐 다시 저장해 주세요.'
                : '위에서 고른 공간의 주소로 자동 채워지며, 이 주소로 지도에 생산지를 표시합니다.'
            }
            label="생산지 주소"
            onChange={(event) => setField('address', event.target.value)}
            placeholder="공간을 선택하면 채워집니다"
            readOnly={!addressEditable}
            value={fields.address}
          />
          <Textarea
            helperText="재배 방식과 보관 방법을 적어 두면 구매자가 더 믿고 삽니다."
            label="상품 설명"
            onChange={(event) => setField('description', event.target.value)}
            placeholder="예: 무농약으로 키웠고 수확 당일 발송합니다. 냉장 보관해 주세요."
            rows={4}
            value={fields.description}
          />
        </FormSection>

        {/* 사진 없는 상품은 목록에서 사실상 눌리지 않아 필수로 받습니다. */}
        <FormSection
          description="구매자가 목록에서 가장 먼저 보는 화면입니다. 한 장은 꼭 올려 주세요."
          icon={<Camera className="h-8 w-8" aria-hidden />}
          title="대표 사진"
        >
          <ProductImageUploader
            onChange={(imageUrl) => setField('imageUrl', imageUrl)}
            onDiscard={(url) => setDiscardedUrls((prev) => [...prev, url])}
            value={fields.imageUrl}
          />
        </FormSection>

        {error ? (
          <p className="text-sm font-semibold text-feedback-danger" role="alert">
            {error}
          </p>
        ) : null}

        {/* 폼이 길어 모바일에서 제출 버튼이 화면 밖으로 밀리므로 공간 등록 화면과 같이 하단에 고정합니다. */}
        <div className="sticky bottom-20 z-10 rounded-app border border-leaf-100 bg-white p-3 shadow-lift lg:static lg:p-0 lg:shadow-none">
          {/* 계약 공간이 없으면 폼을 다 채운 뒤 막히지 않도록 버튼 단계에서 먼저 이유를 알린다. */}
          {noWorkplaceForNew ? (
            <p className="mb-2 text-xs font-semibold text-feedback-danger" role="status">
              계약된 재배 공간이 없어 상품을 등록할 수 없습니다. 공간 매칭이 수락되면 등록할 수 있습니다.
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={isSaving || noWorkplaceForNew}
            size="lg"
            type="submit"
          >
            {isSaving ? '저장 중...' : isEdit ? '수정 내용 저장' : '상품 등록하기'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
