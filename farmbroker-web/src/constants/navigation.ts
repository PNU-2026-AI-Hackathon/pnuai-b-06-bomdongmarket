import { Home, LayoutDashboard, MapPinned, ShoppingBasket } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import type { NavigationItem } from '@/types/common';

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: '홈', href: ROUTES.home, icon: Home },
  { label: '공간', href: ROUTES.spaces, icon: MapPinned },
  { label: '마켓', href: ROUTES.market, icon: ShoppingBasket },
  { label: '대시보드', href: ROUTES.dashboard, icon: LayoutDashboard },
];

export const MOBILE_NAVIGATION = PRIMARY_NAVIGATION;
