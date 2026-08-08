export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
  },
  spaces: {
    list: '/spaces',
    my: '/spaces/my',
    create: '/spaces',
    detail: (spaceId: number | string) => `/spaces/${spaceId}`,
  },
  ai: {
    recommend: '/ai/recommend',
  },
  profit: {
    estimate: '/profit/estimate',
  },
  files: {
    upload: '/files',
    detail: (fileName: string) => `/files/${fileName}`,
  },
  matchings: {
    create: '/matchings',
    myRequests: '/matchings/my-requests',
    received: '/matchings/received',
    accept: (matchingId: number | string) => `/matchings/${matchingId}/accept`,
    reject: (matchingId: number | string) => `/matchings/${matchingId}/reject`,
  },
  crops: {
    list: '/crops',
    detail: (cropId: number | string) => `/crops/${cropId}`,
  },
  products: {
    list: '/products',
    my: '/products/my',
    create: '/products',
    detail: (productId: number | string) => `/products/${productId}`,
  },
} as const;
