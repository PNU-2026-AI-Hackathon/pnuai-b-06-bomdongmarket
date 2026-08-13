export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  dashboardApplications: '/dashboard#my-applications-title',
  spaces: '/spaces',
  newSpace: '/spaces/new',
  newSpacePrediction: '/spaces/new/prediction',
  spaceDetail: (spaceId: number | string) => `/spaces/${spaceId}`,
  // 신청 작성과 기존 신청 조회·취소를 겸하는 화면입니다.
  spaceApply: (spaceId: number | string) => `/spaces/${spaceId}/apply`,
  market: '/market',
  productDetail: (productId: number | string) => `/market/${productId}`,
  myPage: '/mypage',
  myPageProfile: '/mypage/profile',
  myPageWithdraw: '/mypage/withdraw',
} as const;
