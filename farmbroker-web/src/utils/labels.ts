import type { MatchingStatus, SpaceStatus } from '@/types/api';

const spaceStatusLabels: Record<SpaceStatus, string> = {
  AVAILABLE: '매칭 가능',
  MATCHED: '매칭 완료',
  CLOSED: '마감',
};

const matchingStatusLabels: Record<MatchingStatus, string> = {
  REQUESTED: '신청 대기',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  CANCELED: '취소됨',
};

// 백엔드와 주고받는 enum 값은 영어로 유지하고, 화면 표시는 한국어로 변환합니다.
export function getSpaceStatusLabel(status: SpaceStatus) {
  return spaceStatusLabels[status];
}

// 매칭 상태도 API 원본 값과 화면 라벨을 분리해 추후 다국어 처리가 쉬운 구조로 둡니다.
export function getMatchingStatusLabel(status: MatchingStatus) {
  return matchingStatusLabels[status];
}
