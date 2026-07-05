import { Building2, ShoppingBasket, Sprout } from 'lucide-react';

export const authRoles = [
  {
    id: 'OWNER',
    label: 'Space Owner',
    description: 'Register unused spaces and manage contracts.',
    icon: Building2,
  },
  {
    id: 'FARMER',
    label: 'Urban Farmer',
    description: 'Find spaces and start smart farming.',
    icon: Sprout,
  },
  {
    id: 'CONSUMER',
    label: 'Local Consumer',
    description: 'Buy fresh produce from nearby smart farms.',
    icon: ShoppingBasket,
  },
] as const;
