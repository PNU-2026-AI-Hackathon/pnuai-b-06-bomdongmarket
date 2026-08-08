export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  spaces: '/spaces',
  newSpace: '/spaces/new',
  newSpacePrediction: '/spaces/new/prediction',
  spaceDetail: (spaceId: number | string) => `/spaces/${spaceId}`,
  contracts: '/contracts',
  market: '/market',
  // 정적 경로(/market/my·/market/new)가 /market/:productId 보다 우선 매칭됩니다.
  myProducts: '/market/my',
  newProduct: '/market/new',
  productDetail: (productId: number | string) => `/market/${productId}`,
  editProduct: (productId: number | string) => `/market/${productId}/edit`,
  myPage: '/mypage',
} as const;
