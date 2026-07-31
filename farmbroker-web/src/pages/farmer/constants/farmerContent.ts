// 수익 예측과 계약 화면에서 공유하는 표시용 상수입니다.
// 실제 예측 API가 연결되면 predictionMetrics는 응답 데이터로 교체합니다.
export const predictionMetrics = [
  { label: '예상 월 매출', value: 1280000 },
  { label: '예상 운영비', value: 430000 },
  { label: '예상 순수익', value: 850000 },
] as const;

export const contractProcess = ['신청', '협의', '검토', '완료'] as const;
