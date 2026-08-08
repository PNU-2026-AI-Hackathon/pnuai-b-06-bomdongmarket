// 목록 필터용 — '전체'는 필터 미적용을 뜻하는 화면 전용 값이라 서버로 보내지 않습니다.
export const marketCategories = ['전체', '잎채소', '허브', '과채류'] as const;

// 등록·수정 폼용 — 백엔드 ProductCategory 라벨과 일치해야 합니다.
export const productCategories = ['잎채소', '허브', '과채류'] as const;

export const traceabilitySteps = [
  '파종',
  '생육 관리',
  '수확',
  '포장',
  '마켓 등록',
] as const;
