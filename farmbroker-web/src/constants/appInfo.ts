const REPOSITORY_URL =
  'https://github.com/PNU-2026-AI-Hackathon/pnuai-b-06-bomdongmarket';

export const APP_INFO = {
  name: 'FarmBroker',
  team: '봄동마켓',
  tagline: '공간, 농부, 이웃 소비자를 연결하는 도심 스마트팜 중개 플랫폼',
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  demoLocation: '부산광역시',
  repositoryUrl: REPOSITORY_URL,
  issuesUrl: `${REPOSITORY_URL}/issues/new`,
} as const;
