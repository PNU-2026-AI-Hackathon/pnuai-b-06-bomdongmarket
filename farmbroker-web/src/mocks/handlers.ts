const MOCK_LATENCY_MS = 180;

export async function mockDelay() {
  // 발표 데모에서 실제 API처럼 로딩 상태가 잠깐 보이도록 최소 지연을 둡니다.
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_LATENCY_MS));
}

export function createMockPage<T>(items: T[], page = 0, size = 10) {
  // 백엔드의 PageResponse 형태와 맞춰 프론트 페이징 컴포넌트를 그대로 재사용할 수 있게 합니다.
  const start = page * size;
  const content = items.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}
