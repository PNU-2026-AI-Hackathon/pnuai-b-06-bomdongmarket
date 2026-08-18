import { useEffect, useState } from 'react';

import { getMyMatchings } from '@/services/matchingService';
import { getSpaceDetail } from '@/services/spaceService';

export interface Workplace {
  spaceId: number;
  title: string;
  address: string;
}

// 상품을 어디서 생산했는지 고를 목록입니다.
// 재배는 계약(매칭 수락)한 공간에서만 이뤄지므로, 내가 신청해 매칭이 수락된 공간
// (GET /matchings/my-requests 중 ACCEPTED)만 보여 줍니다.
// (내가 등록만 한 공실은 임대 대상이지 내가 재배하는 곳이 아니라 목록에서 제외합니다.)
// 매칭 응답에는 주소가 없어(spaceTitle까지만 내려옴) 공간 상세로 주소를 채웁니다.
export function useMyWorkplaces() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      const matchings = await getMyMatchings().catch(() => []);
      const accepted = matchings.filter((matching) => matching.status === 'ACCEPTED');
      const details = await Promise.all(
        accepted.map((matching) => getSpaceDetail(matching.spaceId).catch(() => null)),
      );

      const contracted: Workplace[] = accepted.map((matching, index) => ({
        spaceId: matching.spaceId,
        title: matching.spaceTitle,
        // 상세 조회가 실패하면 주소는 빈 값으로 둔다(지도 표시만 생략됨).
        address: details[index]?.address ?? '',
      }));

      // 같은 공간에 여러 번 신청이 수락된 경우 중복을 제거한다.
      const unique = contracted.filter(
        (item, index) =>
          contracted.findIndex((other) => other.spaceId === item.spaceId) === index,
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
