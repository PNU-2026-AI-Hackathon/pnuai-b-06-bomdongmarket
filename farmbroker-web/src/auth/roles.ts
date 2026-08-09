import type { User, UserRole } from '@/types/api';

// 역할 표시 문구를 한곳에 모읍니다. 이전에는 가입 폼·마이페이지·홈 소개 영역이
// 각자 다른 라벨('공간 대여자' / '공간 제공자' / 'provider')을 쓰고 있었습니다.
export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: '공간 제공자',
  FARMER: '도심 농부',
  CONSUMER: '소비자',
};

// 역할은 여러 개를 동시에 가질 수 있으므로 항상 보유 여부로 확인합니다.
// 로컬마켓 상품 등록처럼 특정 역할이 필요한 기능의 게이팅에 사용합니다.
export function hasRole(user: User | null | undefined, role: UserRole): boolean {
  return user?.roles?.includes(role) ?? false;
}

// 표시 순서를 고정해 같은 조합이 화면마다 다른 순서로 보이지 않게 합니다.
const DISPLAY_ORDER: UserRole[] = ['OWNER', 'FARMER', 'CONSUMER'];

export function sortRoles(roles: UserRole[] | undefined): UserRole[] {
  if (!roles) return [];
  return DISPLAY_ORDER.filter((role) => roles.includes(role));
}
