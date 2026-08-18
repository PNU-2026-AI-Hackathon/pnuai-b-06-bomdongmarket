import { useEffect, useState } from 'react';

import { getWishlist } from '@/services/wishlistService';

// 이미 찜한 상품의 id 집합입니다.
// 목록 카드는 상품마다 찜 여부를 따로 물어볼 수 없어(상품 수만큼 요청이 나갑니다)
// 화면당 한 번만 찜 목록을 받아 여기서 조회합니다.
// 비로그인이면 조회 자체가 401이라 빈 집합으로 두고 조용히 넘깁니다 — 하트는 비어 보이고,
// 누르는 순간 requireAuth가 로그인으로 보냅니다.
export function useWishedIds(enabled: boolean) {
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled) {
      setWishedIds(new Set());
      return;
    }

    let alive = true;
    getWishlist()
      .then((wishlist) => {
        if (alive) setWishedIds(new Set(wishlist.items.map((item) => item.productId)));
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [enabled]);

  return wishedIds;
}
