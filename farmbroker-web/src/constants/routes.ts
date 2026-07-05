export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  spaces: '/spaces',
  newSpace: '/spaces/new',
  spaceDetail: (spaceId: number | string) => `/spaces/${spaceId}`,
  farmer: '/farmer',
  prediction: '/prediction',
  contracts: '/contracts',
  market: '/market',
  productDetail: (productId: number | string) => `/market/${productId}`,
  myPage: '/mypage',
} as const;
