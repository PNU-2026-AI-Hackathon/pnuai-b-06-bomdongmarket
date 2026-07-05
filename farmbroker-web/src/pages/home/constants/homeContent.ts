import {
  Building2,
  ClipboardList,
  Landmark,
  ShoppingBasket,
  Sprout,
  TrendingUp,
} from 'lucide-react';

import { ROUTES } from '../../../constants/routes';

export const heroContent = {
  title: 'Turn unused spaces into urban smart farms',
  description:
    'Connect spaces, farmers, and local consumers in one circular smart farming platform.',
  imageUrl:
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1600&q=80',
  primaryCta: { label: 'Get Started', href: ROUTES.dashboard },
  secondaryCta: { label: 'Explore Marketplace', href: ROUTES.market },
};

export const valuePoints = [
  {
    label: 'Monetize Vacant Spaces',
    description: 'Register idle urban space and receive qualified farmer requests.',
    icon: Building2,
  },
  {
    label: 'Start Smart Farming',
    description: 'Use AI crop recommendations and matching scores before investing.',
    icon: Sprout,
  },
  {
    label: 'Buy Local Fresh Produce',
    description: 'Shop traceable crops harvested close to your neighborhood.',
    icon: ShoppingBasket,
  },
];

export const roleCards = [
  {
    label: 'Space Owner',
    description: 'Register unused spaces and manage contracts.',
    icon: Landmark,
    href: ROUTES.newSpace,
  },
  {
    label: 'Urban Farmer',
    description: 'Find spaces and start smart farming.',
    icon: Sprout,
    href: ROUTES.farmer,
  },
  {
    label: 'Local Consumer',
    description: 'Buy fresh produce from nearby smart farms.',
    icon: ShoppingBasket,
    href: ROUTES.market,
  },
];

export const quickActions = [
  {
    label: 'Register Space',
    description: 'Add location, utilities, rent, and photos.',
    icon: Building2,
    href: ROUTES.newSpace,
  },
  {
    label: 'Run Profit Simulation',
    description: 'Estimate crops, yield, cost, and payback.',
    icon: TrendingUp,
    href: ROUTES.prediction,
  },
  {
    label: 'Find Matching',
    description: 'Review spaces ranked for farmer fit.',
    icon: ClipboardList,
    href: ROUTES.farmer,
  },
];

export const marketPreviewItems = [
  'Butterhead Lettuce',
  'Basil',
  'Arugula',
  'Bok Choy',
] as const;
