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

// 신청자 관점의 진행 상황 문구입니다. 배지 한 칸에 들어가야 해서 짧게 씁니다.
// getMatchingStatusLabel이 공간 제공자가 보는 신청의 상태 이름이라면,
// 이쪽은 신청을 보낸 사람이 "답변을 받았는가"를 확인하는 문구입니다.
// 취소한 신청은 목록에서 빠지므로 CANCELED는 타입 완결성을 위한 값입니다.
const matchingProgressLabels: Record<MatchingStatus, string> = {
  REQUESTED: '응답 대기중',
  ACCEPTED: '수락',
  REJECTED: '거절',
  CANCELED: '취소',
};

export function getMatchingProgressLabel(status: MatchingStatus) {
  return matchingProgressLabels[status];
}
