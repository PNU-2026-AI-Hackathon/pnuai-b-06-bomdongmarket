import type { MatchingStatus, MatchingType, SpaceStatus } from '@/types/api';

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

const matchingTypeLabels: Record<MatchingType, string> = {
  PROFIT: '수익',
  HOBBY: '취미',
};

// 유형 도입 이전에 저장된 신청은 type이 null이라 "미지정"으로 표시합니다.
export function getMatchingTypeLabel(type: MatchingType | null) {
  return type ? matchingTypeLabels[type] : '미지정';
}

// 신청자 관점의 진행 상황 문구입니다.
// getMatchingStatusLabel이 상태 자체의 이름이라면, 이쪽은 "답변을 받았는가"를 알려줍니다.
const matchingProgressLabels: Record<MatchingStatus, string> = {
  REQUESTED: '응답 대기중',
  ACCEPTED: '답변 도착 · 수락됨',
  REJECTED: '답변 도착 · 거절됨',
  CANCELED: '신청 취소됨',
};

export function getMatchingProgressLabel(status: MatchingStatus) {
  return matchingProgressLabels[status];
}
