export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  spaces: '/spaces',
  newSpace: '/spaces/new',
  newSpacePrediction: '/spaces/new/prediction',
  spaceDetail: (spaceId: number | string) => `/spaces/${spaceId}`,
  // 신청 작성과 기존 신청 조회·취소를 겸하는 화면입니다.
  spaceApply: (spaceId: number | string) => `/spaces/${spaceId}/apply`,
  contracts: '/contracts',
  market: '/market',
  productDetail: (productId: number | string) => `/market/${productId}`,
  myPage: '/mypage',
} as const;
