import type { MatchingStatus, MatchingType, SpaceStatus } from '@/types/api';

const spaceStatusLabels: Record<SpaceStatus, string> = {
  AVAILABLE: '매칭 가능',
  MATCHED: '매칭 완료',
  CLOSED: '마감',
};

// 신청부터 최종 계약까지의 진행 단계를 그대로 읽습니다.
// 공간 제공자가 신청을 일방적으로 수락·거절하는 경로는 없으므로 "수락됨/거절됨"은 쓰지 않습니다.
const matchingStatusLabels: Record<MatchingStatus, string> = {
  REQUESTED: '협의 중',
  ACCEPTED: '계약 확정',
  REJECTED: '계약 취소',
  CANCELED: '신청 취소',
};

// 백엔드와 주고받는 enum 값은 영어로 유지하고, 화면 표시는 한국어로 변환합니다.
export function getSpaceStatusLabel(status: SpaceStatus) {
  return spaceStatusLabels[status];
}

// 매칭 상태도 API 원본 값과 화면 라벨을 분리해 추후 다국어 처리가 쉬운 구조로 둡니다.
export function getMatchingStatusLabel(status: MatchingStatus) {
  return matchingStatusLabels[status];
}

const matchingTypeLabels: Record<MatchingType, string> = {
  PROFIT: '수익',
  HOBBY: '취미',
};

// 유형 도입 이전에 저장된 신청은 type이 null이라 "미지정"으로 표시합니다.
export function getMatchingTypeLabel(type: MatchingType | null) {
  return type ? matchingTypeLabels[type] : '미지정';
}
