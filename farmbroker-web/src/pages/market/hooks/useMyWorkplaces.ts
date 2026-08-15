import { useEffect, useState } from 'react';

import { getMyMatchings } from '@/services/matchingService';
import { getMySpaces, getSpaceDetail } from '@/services/spaceService';

export interface Workplace {
  spaceId: number;
  title: string;
  address: string;
  // 소유한 공실인지, 매칭이 수락돼 재배 중인 남의 공간인지 구분해 목록에서 묶어 보여 줍니다.
  source: 'owned' | 'farming';
}

// 상품을 어디서 생산했는지 고를 목록입니다.
// 판매자는 두 가지 경로로 재배 공간을 갖습니다.
//   1) 자기가 등록한 공실 (GET /spaces/my)
//   2) 남의 공실에 신청해 매칭이 수락된 곳 (GET /matchings/my-requests 중 ACCEPTED)
// 2번은 매칭 응답에 주소가 없어(spaceTitle까지만 내려옴) 공간 상세로 주소를 채웁니다.
export function useMyWorkplaces() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      // 한쪽이 실패해도 나머지로 고를 수 있어야 하므로 개별 실패를 빈 배열로 흡수합니다.
      const [owned, matchings] = await Promise.all([
        getMySpaces().catch(() => []),
        getMyMatchings().catch(() => []),
      ]);

      const accepted = matchings.filter((matching) => matching.status === 'ACCEPTED');
      const details = await Promise.all(
        accepted.map((matching) =>
          getSpaceDetail(matching.spaceId).catch(() => null),
        ),
      );

      const farming: Workplace[] = accepted.map((matching, index) => ({
        spaceId: matching.spaceId,
        title: matching.spaceTitle,
        // 상세 조회가 실패하면 주소는 판매자가 직접 채우게 둡니다.
        address: details[index]?.address ?? '',
        source: 'farming',
      }));

      const merged: Workplace[] = [
        ...owned.map((space) => ({
          spaceId: space.spaceId,
          title: space.title,
          address: space.address,
          source: 'owned' as const,
        })),
        ...farming,
      ];

      // 내 공실에 내가 직접 재배 신청한 경우 같은 공간이 두 번 나올 수 있습니다.
      const unique = merged.filter(
        (item, index) => merged.findIndex((other) => other.spaceId === item.spaceId) === index,
      );

      if (alive) {
        setWorkplaces(unique);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  return { workplaces, isLoading };
}
