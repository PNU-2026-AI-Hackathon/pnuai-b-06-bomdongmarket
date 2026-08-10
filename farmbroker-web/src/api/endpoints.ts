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
    // spaceId를 주면 해당 공간에 보낸 내 신청만 — 신청 상세 화면이 목록 전체를 받지 않도록.
    myRequests: (spaceId?: number) =>
      spaceId === undefined
        ? '/matchings/my-requests'
        : `/matchings/my-requests?spaceId=${spaceId}`,
    received: '/matchings/received',
    accept: (matchingId: number | string) => `/matchings/${matchingId}/accept`,
    reject: (matchingId: number | string) => `/matchings/${matchingId}/reject`,
    cancel: (matchingId: number | string) => `/matchings/${matchingId}/cancel`,
  },
  crops: {
    list: '/crops',
    detail: (cropId: number | string) => `/crops/${cropId}`,
  },
} as const;
