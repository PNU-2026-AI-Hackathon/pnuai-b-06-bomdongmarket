import type { AiRecommendation, CropDetail, SpaceDetail } from '../types/api';

export const mockSpaces: SpaceDetail[] = [
  {
    spaceId: 1,
    title: 'Jangjeon-dong 20 pyeong retail space',
    address: 'Busan Geumjeong-gu Jangjeon-dong',
    area: 66,
    monthlyRent: 500000,
    floor: 2,
    hasWater: true,
    hasElectricity: true,
    hasVentilation: true,
    description:
      'A bright second-floor retail vacancy near Busan National University with water access and stable power for modular indoor racks.',
    imageUrl:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&w=900&q=80',
    ],
    status: 'AVAILABLE',
    owner: { userId: 1, nickname: 'Green Space Lab' },
    createdAt: '2026-06-29T15:00:00',
    updatedAt: '2026-06-29T15:00:00',
  },
  {
    spaceId: 2,
    title: 'Seomyeon basement grow room',
    address: 'Busan Busanjin-gu Seomyeon',
    area: 42,
    monthlyRent: 350000,
    floor: -1,
    hasWater: true,
    hasElectricity: true,
    hasVentilation: false,
    description:
      'Compact basement space suitable for herbs or sprouts after adding a dedicated ventilation kit.',
    imageUrl:
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80',
    ],
    status: 'AVAILABLE',
    owner: { userId: 3, nickname: 'Seomyeon Owner' },
    createdAt: '2026-06-25T10:20:00',
    updatedAt: '2026-06-28T13:30:00',
  },
  {
    spaceId: 3,
    title: 'Haeundae rooftop greenhouse',
    address: 'Busan Haeundae-gu U-dong',
    area: 95,
    monthlyRent: 920000,
    floor: 7,
    hasWater: true,
    hasElectricity: true,
    hasVentilation: true,
    description:
      'Rooftop unit with strong sunlight and panoramic access, ideal for premium leafy greens and tourism-linked sales.',
    imageUrl:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    ],
    status: 'MATCHED',
    owner: { userId: 4, nickname: 'Roof & Roots' },
    createdAt: '2026-06-21T09:00:00',
    updatedAt: '2026-07-01T11:15:00',
  },
  {
    spaceId: 4,
    title: 'Myeongnyun station storage unit',
    address: 'Busan Dongnae-gu Myeongnyun-dong',
    area: 58,
    monthlyRent: 430000,
    floor: 1,
    hasWater: false,
    hasElectricity: true,
    hasVentilation: true,
    description:
      'Street-level storage space with excellent access. A water tank module is recommended before cultivation.',
    imageUrl:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
    imageUrls: [
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
    ],
    status: 'AVAILABLE',
    owner: { userId: 5, nickname: 'Dongnae Space' },
    createdAt: '2026-06-18T12:40:00',
    updatedAt: '2026-06-19T08:10:00',
  },
];

export const mockCrops: CropDetail[] = [
  {
    cropId: 3,
    name: 'Butterhead Lettuce',
    category: 'Leafy Greens',
    difficulty: 'EASY',
    growingPeriodDays: 30,
    optimalTempMin: 15,
    optimalTempMax: 22,
    optimalHumidity: 65,
    lightRequirement: 'MEDIUM',
    yieldPerSqmKg: 3.5,
    avgPricePerKg: 7000,
    description:
      'A reliable indoor crop with short cycles, stable local demand, and easy quality control.',
    imageUrl:
      'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=900&q=80',
    dataSource: 'SEED',
  },
  {
    cropId: 5,
    name: 'Basil',
    category: 'Herbs',
    difficulty: 'NORMAL',
    growingPeriodDays: 42,
    optimalTempMin: 20,
    optimalTempMax: 27,
    optimalHumidity: 60,
    lightRequirement: 'HIGH',
    yieldPerSqmKg: 1.7,
    avgPricePerKg: 30000,
    description:
      'A premium herb crop suited to restaurants and local subscription boxes.',
    imageUrl:
      'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=900&q=80',
    dataSource: 'SEED',
  },
];

export const mockRecommendation: AiRecommendation = {
  recommendationId: 1,
  spaceId: 1,
  recommendedCrops: [
    {
      cropName: 'Butterhead Lettuce',
      cropId: 3,
      reason:
        'Short growth cycles and moderate lighting needs make it a strong first crop for this area.',
      expectedYieldKg: 80,
      avgPricePerKg: 7000,
    },
    {
      cropName: 'Basil',
      cropId: 5,
      reason:
        'High unit price and compact spacing can improve revenue once airflow is tuned.',
      expectedYieldKg: 12,
      avgPricePerKg: 30000,
    },
  ],
  layoutSuggestion:
    'Place three-tier racks through the center lane, reserve the wall side for water tanks and a packing bench, and keep one clear service aisle.',
  cautions: [
    'Monitor ventilation daily during humid weeks.',
    'Start with low-power LED zones before expanding the rack count.',
  ],
  createdAt: '2026-07-05T14:00:00',
};
