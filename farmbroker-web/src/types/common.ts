import type { LucideIcon } from 'lucide-react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}
