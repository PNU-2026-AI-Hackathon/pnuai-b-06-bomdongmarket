export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    withdrawalEligibility: '/users/me/withdrawal-eligibility',
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
    sent: '/matchings/sent',
    cancel: (matchingId: number | string) => `/matchings/${matchingId}/cancel`,
    dismiss: (matchingId: number | string) => `/matchings/${matchingId}/dismiss`,
    // 계약서는 매칭 1건에 붙습니다. 조건 저장이 PATCH인 것은 CORS 허용 메서드에 PUT이 없기 때문입니다.
    contract: (matchingId: number | string) => `/matchings/${matchingId}/contract`,
    contractAgree: (matchingId: number | string) =>
      `/matchings/${matchingId}/contract/agree`,
    contractCancel: (matchingId: number | string) =>
      `/matchings/${matchingId}/contract/cancel`,
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
  wishlist: {
    detail: '/wishlist',
    items: '/wishlist/items',
    item: (productId: number | string) => `/wishlist/items/${productId}`,
  },
  orders: {
    checkout: '/orders',
  },
  chat: {
    conversations: '/chat/conversations',
    conversation: (conversationId: number | string) => `/chat/conversations/${conversationId}`,
    messages: (conversationId: number | string) =>
      `/chat/conversations/${conversationId}/messages`,
    read: (conversationId: number | string) => `/chat/conversations/${conversationId}/read`,
    messageImage: (messageId: number | string) => `/chat/messages/${messageId}/image`,
  },
  blocks: {
    user: (userId: number | string) => `/blocks/${userId}`,
  },
} as const;
