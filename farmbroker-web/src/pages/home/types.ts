import type { LucideIcon } from 'lucide-react';

export interface CampaignSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  href: string;
  highlights: readonly string[];
}

export interface RoleSectionContent {
  id: 'provider' | 'farmer' | 'consumer';
  eyebrow: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  ctaLabel: string;
  href: string;
  highlights: readonly string[];
  previewLabel: string;
  previewTitle: string;
  previewDescription: string;
}
