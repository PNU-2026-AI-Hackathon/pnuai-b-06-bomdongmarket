import type { SelectOption } from '../../../types/common';

export const sortOptions: SelectOption<'latest' | 'area' | 'rent'>[] = [
  { label: 'Latest', value: 'latest' },
  { label: 'Largest area', value: 'area' },
  { label: 'Lowest rent', value: 'rent' },
];

export const facilityLabels = {
  hasWater: 'Water',
  hasElectricity: 'Electricity',
  hasVentilation: 'Ventilation',
} as const;

export const registrationSteps = ['Location', 'Conditions', 'Photos', 'Review'] as const;
