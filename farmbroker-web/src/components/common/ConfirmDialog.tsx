import { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/common/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  // danger는 되돌리기 어려운 action(신청 취소 등)에만 씁니다.
  tone?: 'default' | 'danger';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 되돌리기 어려운 action 직전에 한 번 더 묻는 확인 팝업입니다.
// 열림 상태는 호출부가 useDisclosure로 들고 있고, 이 컴포넌트는 표시와 접근성만 담당합니다.
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = '닫기',
  tone = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 열릴 때 확인 버튼으로 포커스를 옮겨 키보드만으로 바로 응답할 수 있게 합니다.
  useEffect(() => {
    if (isOpen) confirmRef.current?.focus();
  }, [isOpen]);

  // Escape는 취소로 처리합니다. 처리 중에는 요청이 뜬 채로 닫히지 않도록 막습니다.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onCancel]);

  // 팝업 뒤 본문이 스크롤되면 초점이 어디에 있는지 알기 어려워 잠가둡니다.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-ink-900/50"
        onClick={() => {
          if (!isPending) onCancel();
        }}
      />
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative w-full max-w-sm rounded-app border border-line bg-surface p-5 shadow-lift"
        role="dialog"
      >
        <h2 className="text-lg font-black text-content" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-body-sm text-content-muted" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onCancel} variant="ghost">
            {cancelLabel}
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            ref={confirmRef}
            variant={tone === 'danger' ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
