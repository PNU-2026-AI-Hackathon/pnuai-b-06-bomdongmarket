import { formatNumber } from '@/utils/format';

// 판매 단위는 '수량 + 단위'로만 받습니다.
// '팩'·'봉지' 같은 포장 형태는 양을 알려 주지 않아 구매자가 얼마를 사는지 알 수 없고,
// 결제 금액이 무엇에 대한 값인지도 불분명해집니다. 포장 형태는 사진과 상품 설명에 적습니다.
export const saleUnits = [
  { value: 'g', label: 'g · 그램', kind: 'weight', gramsPerUnit: 1 },
  { value: 'kg', label: 'kg · 킬로그램', kind: 'weight', gramsPerUnit: 1000 },
  { value: '개', label: '개 · 낱개', kind: 'count', gramsPerUnit: 0 },
  { value: '단', label: '단 · 묶음', kind: 'count', gramsPerUnit: 0 },
] as const;

export type SaleUnitValue = (typeof saleUnits)[number]['value'];

export const DEFAULT_SALE_UNIT: SaleUnitValue = 'g';

function findUnit(unit: string) {
  return saleUnits.find((item) => item.value === unit);
}

// 백엔드 계약의 unit은 문자열 한 칸이라(최대 20자) 화면에서 받은 수량·단위를 합쳐 보냅니다.
export function composeUnit(amount: string, unit: string) {
  const trimmed = amount.trim();
  if (!trimmed) return '';
  return `${trimmed}${unit}`;
}

// 수정 화면에서 기존 unit 문자열을 두 칸으로 되돌립니다.
// 예전에 '팩'처럼 자유 입력으로 저장된 값은 수량을 알 수 없으므로 null을 돌려주고,
// 화면이 빈 칸으로 두어 판매자가 정확한 양을 다시 적도록 합니다.
export function parseUnit(text: string | null | undefined) {
  const matched = /^(\d+(?:\.\d+)?)\s*(.+)$/.exec((text ?? '').trim());
  if (!matched) return null;

  const [, amount, unit] = matched;
  return findUnit(unit) ? { amount, unit: unit as SaleUnitValue } : null;
}

// 구매자가 '이게 비싼 건가'를 바로 알 수 있도록 기준량 단가를 환산해 보여 줍니다.
// 무게는 100g당, 낱개·묶음은 1개(1단)당으로 맞춥니다.
export function unitPriceHint(price: string, amount: string, unit: string) {
  const priceValue = Number(price);
  const amountValue = Number(amount);
  const spec = findUnit(unit);

  if (!spec || !Number.isFinite(priceValue) || !Number.isFinite(amountValue)) return null;
  if (priceValue <= 0 || amountValue <= 0) return null;

  if (spec.kind === 'weight') {
    const grams = amountValue * spec.gramsPerUnit;
    return `100g당 약 ${formatNumber(Math.round((priceValue / grams) * 100))}원`;
  }

  // 1개에 1개 값이라는 안내는 아무것도 알려 주지 않으므로 생략합니다.
  if (amountValue === 1) return null;
  return `1${unit}당 약 ${formatNumber(Math.round(priceValue / amountValue))}원`;
}
