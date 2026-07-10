import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-leaf-700 text-white shadow-lift hover:bg-leaf-800 disabled:bg-leaf-300 disabled:shadow-none disabled:hover:bg-leaf-300',
  secondary:
    'bg-soil-300 text-ink-900 hover:bg-soil-500 hover:text-white focus-visible:ring-soil-300',
  outline:
    'border border-leaf-200 bg-white text-leaf-800 hover:border-leaf-400 hover:bg-leaf-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-leaf-50 hover:text-leaf-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-app font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
    variants[variant],
    sizes[size],
    className,
  );
}

export type { ButtonSize, ButtonVariant };
