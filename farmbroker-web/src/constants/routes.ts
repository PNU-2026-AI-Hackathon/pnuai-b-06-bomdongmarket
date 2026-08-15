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
  // 계약서는 공간이 아니라 매칭 1건에 붙는 화면이라 /matchings 아래에 둡니다.
  contract: (matchingId: number | string) => `/matchings/${matchingId}/contract`,
  market: '/market',
  // 정적 경로(/market/my·/market/new)가 /market/:productId 보다 우선 매칭됩니다.
  myProducts: '/market/my',
  cart: '/market/cart',
  orderComplete: '/market/order-complete',
  newProduct: '/market/new',
  productDetail: (productId: number | string) => `/market/${productId}`,
  editProduct: (productId: number | string) => `/market/${productId}/edit`,
  myPage: '/mypage',
  myPageProfile: '/mypage/profile',
  myPageWithdraw: '/mypage/withdraw',
} as const;
