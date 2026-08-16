import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/common/Card';

interface FormSectionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  // 선택 입력 섹션임을 배지로 알려 필수 항목과 한눈에 구분되게 합니다.
  optional?: boolean;
  // 접을 수 있는 섹션은 처음에 닫혀 있어 폼이 짧아 보입니다.
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}

function SectionHeading({
  title,
  description,
  icon,
  optional,
}: Pick<FormSectionProps, 'title' | 'description' | 'icon' | 'optional'>) {
  return (
    <div className="flex flex-1 items-start justify-between gap-3 text-left">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-ink-900">
          {title}
          {optional ? (
            <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-semibold text-leaf-700">
              선택
            </span>
          ) : null}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-leaf-700" aria-hidden>
        {icon}
      </span>
    </div>
  );
}

// 상품 등록·수정 폼의 섹션 골격입니다.
// 제목·설명·우측 아이콘 배치는 공간 등록 화면(SpaceCreatePage)과 같은 형태를 씁니다.
export function FormSection({
  title,
  description,
  icon,
  optional = false,
  collapsible = false,
  defaultOpen = false,
  children,
}: FormSectionProps) {
  if (!collapsible) {
    return (
      <Card padding="lg">
        <SectionHeading
          description={description}
          icon={icon}
          optional={optional}
          title={title}
        />
        <div className="mt-5 grid gap-4">{children}</div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <details className="group" open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
          <SectionHeading
            description={description}
            icon={icon}
            optional={optional}
            title={title}
          />
          <ChevronDown
            className="mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-ui group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-5 grid gap-4">{children}</div>
      </details>
    </Card>
  );
}
