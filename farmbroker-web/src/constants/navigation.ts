import { Home, LayoutDashboard, MapPinned, ShoppingBasket, Sprout } from 'lucide-react';

import { ROUTES } from './routes';
import type { NavigationItem } from '../types/common';

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: 'Home', href: ROUTES.home, icon: Home },
  { label: 'Spaces', href: ROUTES.spaces, icon: MapPinned },
  { label: 'Farmer', href: ROUTES.farmer, icon: Sprout },
  { label: 'Market', href: ROUTES.market, icon: ShoppingBasket },
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
];

export const MOBILE_NAVIGATION = PRIMARY_NAVIGATION;
