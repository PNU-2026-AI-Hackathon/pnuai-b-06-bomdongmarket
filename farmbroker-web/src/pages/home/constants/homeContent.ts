import { Building2, ShoppingBasket, Sprout } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import type { CampaignSlide, RoleSectionContent } from '@/pages/home/types';

export const campaignSlides: CampaignSlide[] = [
  {
    id: 'vacant-space',
    eyebrow: '공간 전환 캠페인',
    title: '비어 있는 공간이 동네의 가장 가까운 농장이 됩니다.',
    description:
      '면적과 시설 조건을 바탕으로 스마트팜 설치 가능성과 예상 수익을 미리 살펴보세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1800&q=85',
    imageAlt: '잎채소를 재배하는 실내 스마트팜',
    ctaLabel: '등록 공간 둘러보기',
    href: ROUTES.spaces,
    highlights: ['공간 조건 분석', '예상 수익 확인'],
  },
  {
    id: 'urban-farmer',
    eyebrow: '도심 농부 시작 지원',
    title: '토지를 사지 않고도 내 조건에 맞는 공간에서 재배를 시작하세요.',
    description:
      '월세와 시설을 비교하고, 공간에 맞는 작물과 예상 수익을 확인한 뒤 매칭을 준비할 수 있습니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1800&q=85',
    imageAlt: '스마트팜에서 자라는 어린 작물',
    ctaLabel: '재배 공간 둘러보기',
    href: ROUTES.spaces,
    highlights: ['선호 공간 추천', '작물 추천'],
  },
  {
    id: 'local-market',
    eyebrow: '오늘 수확 로컬 마켓',
    title: '가까운 농장의 오늘 수확 작물을 생산 이력과 함께 만나보세요.',
    description:
      '수확일, 생산자, 푸드 마일리지를 비교해 더 신선하고 투명한 로컬 푸드를 선택하세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=1800&q=85',
    imageAlt: '수확을 앞둔 신선한 잎채소',
    ctaLabel: '로컬 마켓 열기',
    href: ROUTES.market,
    highlights: ['수확일 확인', '생산 이력 조회'],
  },
];

export const roleSections: RoleSectionContent[] = [
  {
    id: 'provider',
    eyebrow: 'For space providers',
    label: '공간 제공자',
    title: '비어 있는 공간을 생산과 수익이 시작되는 스마트팜으로 바꾸세요.',
    description:
      '공간의 면적·구조·시설 조건을 등록하면 설치 가능성과 예상 수익을 미리 확인하고, 도심 농부의 매칭 신청부터 계약까지 한곳에서 관리할 수 있습니다.',
    icon: Building2,
    ctaLabel: '등록 공간 둘러보기',
    href: ROUTES.spaces,
    highlights: ['공간 조건 분석', '예상 수익 확인', '농부 매칭·계약'],
    previewLabel: '공실 전환 가이드',
    previewTitle: '전문 지식 없이도 설치 가능성과 경제성을 먼저 확인하세요.',
    previewDescription:
      '방치된 공실을 임대 수익과 생산 활동이 가능한 공간으로 전환하는 첫 단계를 안내합니다.',
  },
  {
    id: 'farmer',
    eyebrow: 'For urban farmers',
    label: '도심 농부',
    title: '비싼 토지를 사지 않고, 내 조건에 맞는 공간에서 재배를 시작하세요.',
    description:
      '면적·월세·시설 조건을 비교하고 추천 작물과 예상 수익을 확인한 뒤, 공간 제공자에게 매칭을 신청할 수 있습니다.',
    icon: Sprout,
    ctaLabel: '재배 공간 둘러보기',
    href: ROUTES.spaces,
    highlights: ['선호 공간 추천', '작물 추천', '수익 예측'],
    previewLabel: '서비스형 농업',
    previewTitle: '소자본으로 시작할 수 있는 생활권 기반 재배 공간을 찾으세요.',
    previewDescription:
      '토지를 매입하는 대신 도심 유휴공간을 임대해 스마트팜 진입 비용과 불확실성을 낮춥니다.',
  },
  {
    id: 'consumer',
    eyebrow: 'For local consumers',
    label: '로컬 소비자',
    title: '근처 스마트팜의 신선한 작물을 생산 이력과 함께 확인하세요.',
    description:
      '소비자는 장바구니에 담기 전에 수확일, 푸드 마일리지, 생산자 정보를 비교할 수 있습니다.',
    icon: ShoppingBasket,
    ctaLabel: '마켓 둘러보기',
    href: ROUTES.market,
    highlights: ['오늘 수확', '푸드 마일리지', '생산 이력'],
    previewLabel: '로컬 직거래',
    previewTitle: '생산부터 소비까지 생활권 안에서 이어지는 신선한 선택입니다.',
    previewDescription:
      '장거리 유통을 줄여 신선도를 높이고, 생산 공간과 이력을 투명하게 확인할 수 있습니다.',
  },
];
