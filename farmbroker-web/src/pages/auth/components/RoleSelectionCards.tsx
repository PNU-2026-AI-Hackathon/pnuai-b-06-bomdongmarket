import { Check } from 'lucide-react';

import type { UserRole } from '../../../types/api';
import { authRoles } from '../constants/authContent';

interface RoleSelectionCardsProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

// 로그인 전 역할을 선택해 이후 대시보드 경험이 달라질 수 있음을 보여줍니다.
export function RoleSelectionCards({ value, onChange }: RoleSelectionCardsProps) {
  return (
    <div className="grid gap-3">
      {authRoles.map((role) => {
        const selected = value === role.id;
        return (
          <button
            key={role.id}
            className={`flex min-h-20 items-center gap-3 rounded-app border p-3 text-left transition ${
              selected
                ? 'border-leaf-600 bg-leaf-50'
                : 'border-leaf-100 bg-white hover:border-leaf-300'
            }`}
            onClick={() => onChange(role.id)}
            type="button"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app bg-leaf-100 text-leaf-800">
              <role.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink-900">{role.label}</span>
              <span className="mt-1 block text-sm text-slate-600">
                {role.description}
              </span>
            </span>
            {selected ? <Check className="h-5 w-5 text-leaf-700" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
