import { X } from 'lucide-react';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ContractCard } from '@/pages/dashboard/components/ContractCard';
import { MatchingRequestCard } from '@/pages/dashboard/components/MatchingRequestCard';
import type { ContractSummary, MatchingRequest } from '@/types/api';

interface ApplicationNotificationsDialogProps {
  isOpen: boolean;
  isOwner: boolean;
  receivedApplications: MatchingRequest[];
  sentApplications: ContractSummary[];
  actionError: string | null;
  status?: 'idle' | 'loading' | 'success' | 'error';
  loadError?: string | null;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onDismiss: (matchingId: number, direction: 'received' | 'sent') => Promise<void>;
  onRetry?: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function EmptyApplicationList({ message }: { message: string }) {
  return (
    <Card padding="md" variant="subtle">
      <p className="text-sm text-content-muted">{message}</p>
    </Card>
  );
}

// 받은 신청과 보낸 신청을 어느 화면에서든 헤더를 통해 확인하고 관리합니다.
export function ApplicationNotificationsDialog({
  isOpen,
  isOwner,
  receivedApplications,
  sentApplications,
  actionError,
  status = 'success',
  loadError,
  returnFocusRef,
  onClose,
  onDismiss,
  onRetry,
}: ApplicationNotificationsDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dismissTargetRef = useRef(false);
  const [dismissTarget, setDismissTarget] = useState<{
    matchingId: number;
    spaceName: string;
    direction: 'received' | 'sent';
  } | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  dismissTargetRef.current = dismissTarget !== null;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const returnFocusTarget = returnFocusRef.current;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dismissTargetRef.current) return;
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusTarget?.focus();
    };
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center p-4 sm:items-center">
      <button
        aria-label="신청 알림 닫기"
        className="absolute inset-0 bg-content/50"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative flex h-full max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-app border border-line bg-surface p-4 shadow-lift sm:h-auto sm:p-5"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-eyebrow text-accent">매칭 알림</p>
            <h2 className="mt-1 text-xl font-black text-content sm:text-2xl" id={titleId}>
              받은 신청과 보낸 신청
            </h2>
          </div>
          <Button
            aria-label="신청 알림 닫기"
            className="h-11 w-11 shrink-0 px-0"
            onClick={onClose}
            ref={closeRef}
            variant="ghost"
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        {actionError ? (
          <p
            className="mt-4 rounded-app bg-feedback-danger-soft p-3 text-sm font-semibold text-feedback-danger"
            role="alert"
          >
            {actionError}
          </p>
        ) : null}

        <div className="mt-5 min-h-0 overflow-y-auto pr-1">
          {status === 'loading' || status === 'idle' ? (
            <LoadingState label="신청 알림을 불러오는 중입니다" />
          ) : null}
          {status === 'error' ? (
            <ErrorState
              message={loadError ?? '신청 알림을 불러오지 못했습니다.'}
              onRetry={onRetry}
            />
          ) : null}
          {status === 'success' ? (
            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              {isOwner ? (
                <section
                  aria-labelledby="received-applications-title"
                  className="min-w-0"
                >
                  <h3
                    className="text-lg font-black text-content"
                    id="received-applications-title"
                  >
                    받은 신청
                  </h3>
                  {receivedApplications.length === 0 ? (
                    <div className="mt-3">
                      <EmptyApplicationList message="받은 매칭 신청이 없습니다." />
                    </div>
                  ) : (
                    <ul className="mt-3 grid min-w-0 gap-3">
                      {receivedApplications.map((request) => (
                        <li className="min-w-0" key={request.matchingId}>
                          <MatchingRequestCard
                            onChatOpen={onClose}
                            onDismiss={() =>
                              setDismissTarget({
                                matchingId: request.matchingId,
                                spaceName: request.spaceTitle,
                                direction: 'received',
                              })
                            }
                            request={request}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              <section aria-labelledby="sent-applications-title" className="min-w-0">
                <h3
                  className="text-lg font-black text-content"
                  id="sent-applications-title"
                >
                  보낸 신청
                </h3>
                {sentApplications.length === 0 ? (
                  <div className="mt-3">
                    <EmptyApplicationList message="보낸 매칭 신청이 없습니다." />
                  </div>
                ) : (
                  <ul className="mt-3 grid min-w-0 gap-3">
                    {sentApplications.map((application) => (
                      <li className="min-w-0" key={application.contractId}>
                        <ContractCard
                          contract={application}
                          onDismiss={() =>
                            setDismissTarget({
                              matchingId: application.contractId,
                              spaceName: application.spaceName,
                              direction: 'sent',
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        cancelLabel="취소"
        confirmLabel="지우기"
        description={
          dismissTarget
            ? `${dismissTarget.spaceName} 신청은 알림 목록에서만 사라지며 신청과 계약 상태는 유지됩니다.`
            : undefined
        }
        isOpen={dismissTarget !== null}
        isPending={isDismissing}
        onCancel={() => setDismissTarget(null)}
        onConfirm={() => {
          if (!dismissTarget) return;
          setIsDismissing(true);
          void onDismiss(dismissTarget.matchingId, dismissTarget.direction).finally(
            () => {
              setIsDismissing(false);
              setDismissTarget(null);
            },
          );
        }}
        title="신청 알림을 지울까요?"
        tone="danger"
      />
    </div>
  );
}
