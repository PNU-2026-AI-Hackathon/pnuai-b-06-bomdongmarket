import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-action text-content-inverse shadow-lift hover:bg-action-hover disabled:bg-leaf-300 disabled:shadow-none disabled:hover:bg-leaf-300',
  secondary: 'bg-soil-300 text-ink-900 hover:bg-soil-500 focus-visible:ring-action',
  outline:
    'border border-line-strong bg-surface text-action hover:border-leaf-400 hover:bg-action-soft',
  ghost: 'bg-transparent text-content-muted hover:bg-action-soft hover:text-action',
  danger:
    'bg-feedback-danger text-content-inverse hover:bg-red-800 focus-visible:ring-red-400',
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
    'inline-flex items-center justify-center gap-2 rounded-app font-semibold transition-colors duration-ui focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
    variants[variant],
    sizes[size],
    className,
  );
}

export type { ButtonSize, ButtonVariant };
