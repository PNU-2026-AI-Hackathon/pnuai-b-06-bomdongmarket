import { X } from 'lucide-react';
import { useEffect } from 'react';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  onClick?: () => void;
}

interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const AUTO_DISMISS_MS = 5000;

// 화면 오른쪽 위에 잠깐 떠 있다가 사라지는 알림입니다.
// 스크린리더가 읽도록 aria-live 영역에 담고, 알림 자체는 버튼이라 눌러서 해당 화면으로 갈 수 있습니다.
export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <div className="pointer-events-auto flex items-start gap-2 rounded-app border border-leaf-100 bg-white p-3 shadow-lift">
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => {
          toast.onClick?.();
          onDismiss(toast.id);
        }}
        type="button"
      >
        <p className="truncate text-sm font-bold text-ink-900">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 truncate text-sm text-slate-600">{toast.description}</p>
        ) : null}
      </button>
      <button
        aria-label="알림 닫기"
        className="shrink-0 rounded-app p-1 text-slate-500 transition duration-ui hover:bg-leaf-50"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
