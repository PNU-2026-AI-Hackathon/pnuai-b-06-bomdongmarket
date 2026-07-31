import type { SelectOption } from '@/types/common';

export const sortOptions: SelectOption<'latest' | 'area' | 'rent'>[] = [
  { label: '최신순', value: 'latest' },
  { label: '넓은 면적순', value: 'area' },
  { label: '낮은 월세순', value: 'rent' },
];

export const facilityLabels = {
  hasWater: '수도',
  hasElectricity: '전기',
  hasVentilation: '환기',
} as const;
