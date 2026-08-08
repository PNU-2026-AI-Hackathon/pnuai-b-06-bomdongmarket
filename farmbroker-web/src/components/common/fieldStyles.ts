import { cn } from '@/utils/cn';

export function fieldControlStyles({
  className,
  hasIcon = false,
  invalid = false,
}: {
  className?: string;
  hasIcon?: boolean;
  invalid?: boolean;
} = {}) {
  return cn(
    // 본문은 16px을 씁니다. 모바일 우선 화면이라 14px은 읽기 부담이고,
    // iOS 사파리는 16px 미만 입력에 포커스하면 페이지를 강제로 확대합니다.
    'min-h-control w-full rounded-app border border-line bg-surface px-3 text-base text-content transition-colors duration-ui placeholder:text-content-subtle hover:border-line-strong focus:border-action focus:outline-none focus:ring-2 focus:ring-action-soft disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-content-subtle',
    hasIcon && 'pl-10',
    invalid &&
      'border-feedback-danger/60 hover:border-feedback-danger focus:border-feedback-danger focus:ring-feedback-danger-soft',
    className,
  );
}
