const MOCK_LATENCY_MS = 180;

export async function mockDelay() {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_LATENCY_MS));
}

export function createMockPage<T>(items: T[], page = 0, size = 10) {
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
