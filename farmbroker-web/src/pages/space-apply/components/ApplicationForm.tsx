import { Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useDisclosure } from '@/hooks/useDisclosure';
import type { MatchingType } from '@/types/api';
import type { AsyncStatus } from '@/types/common';

interface ApplicationFormProps {
  status: AsyncStatus;
  error: string | null;
  onSubmit: (type: MatchingType, message: string) => void;
}

const DEFAULT_MESSAGE =
  '이 공간에서 스마트팜을 운영하고 싶습니다. 매칭 상담을 요청드립니다.';

// 아직 신청하지 않은 공간에 유형과 메시지를 담아 신청을 보내는 폼입니다.
// 신청은 공간 제공자에게 바로 전달되므로 제출 직전에 한 번 더 확인합니다.
export function ApplicationForm({ status, error, onSubmit }: ApplicationFormProps) {
  const [type, setType] = useState<MatchingType>('PROFIT');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const confirmation = useDisclosure();
  const isSubmitting = status === 'loading';
  const canSubmit = Boolean(message.trim()) && !isSubmitting;

  return (
    <Card padding="lg">
      <h2 className="text-xl font-black text-content">매칭 신청</h2>
      <p className="mt-2 text-body-sm text-content-muted">
        재배 목적과 운영 계획을 알려주면 공간 제공자가 수락 여부를 판단하는 데 도움이 됩니다.
      </p>

      <div className="mt-5 grid gap-4">
        <Select
          helperText="판매·납품이 목표면 수익, 자가 소비 목적이면 취미를 선택하세요."
          label="신청 유형"
          onChange={(event) => setType(event.target.value as MatchingType)}
          required
          value={type}
        >
          <option value="PROFIT">수익</option>
          <option value="HOBBY">취미</option>
        </Select>
        <Textarea
          helperText="최대 500자까지 입력할 수 있습니다."
          label="신청 메시지"
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          required
          value={message}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-feedback-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-5 w-full"
        disabled={!canSubmit}
        onClick={confirmation.open}
      >
        <Send className="h-5 w-5" aria-hidden />
        {isSubmitting ? '신청 중...' : '신청하기'}
      </Button>

      <ConfirmDialog
        confirmLabel="신청"
        description="공간 제공자에게 신청이 전달됩니다. 응답을 받기 전까지는 언제든 취소할 수 있습니다."
        isOpen={confirmation.isOpen}
        isPending={isSubmitting}
        onCancel={confirmation.close}
        onConfirm={() => {
          confirmation.close();
          onSubmit(type, message.trim());
        }}
        title="신청하시겠습니까?"
      />
    </Card>
  );
}
