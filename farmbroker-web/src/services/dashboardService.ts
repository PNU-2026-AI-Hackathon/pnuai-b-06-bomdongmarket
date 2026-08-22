import { getWishlist } from '@/services/wishlistService';
import {
  getMyMatchings,
  getReceivedMatchings,
  getSentMatchingNotifications,
} from '@/services/matchingService';
import { getMySpaces } from '@/services/spaceService';
import type {
  WishlistLine,
  ContractSummary,
  ContractedSpaceSummary,
  MatchingRequest,
  MyMatching,
  SpaceSummary,
} from '@/types/api';

export interface DashboardData {
  ownedSpaces: SpaceSummary[];
  contractedSpaces: ContractedSpaceSummary[];
  receivedApplications: MatchingRequest[];
  sentApplications: ContractSummary[];
  wishlistItems: WishlistLine[];
}

export interface ApplicationNotifications {
  receivedApplications: MatchingRequest[];
  sentApplications: ContractSummary[];
}

// 알림 모달에서 쓰는 보낸 신청 요약으로 API 응답을 변환합니다.
function sentToContract(matching: MyMatching): ContractSummary {
  return {
    contractId: matching.matchingId,
    spaceId: matching.spaceId,
    spaceName: matching.spaceTitle,
    counterparty: matching.ownerNickname,
    status: matching.status,
    monthlyRent: matching.monthlyRent,
    type: matching.type,
    imageUrl: matching.spaceImageUrl,
  };
}

// 헤더 알림은 현재 페이지와 무관하게 필요한 신청 목록만 불러옵니다.
export async function getApplicationNotifications(
  isOwner: boolean,
): Promise<ApplicationNotifications> {
  const [received, sent] = await Promise.all([
    isOwner ? getReceivedMatchings() : Promise.resolve([]),
    getSentMatchingNotifications(),
  ]);

  return {
    receivedApplications: received,
    sentApplications: sent
      .filter((matching) => matching.status !== 'CANCELED')
      .map(sentToContract),
  };
}

// 사용자가 공간 제공자이자 신청자일 수 있어, 양쪽에서 수락된 같은 공간은 한 번만 보여줍니다.
export function buildContractedSpaces(
  received: MatchingRequest[],
  sent: MyMatching[],
): ContractedSpaceSummary[] {
  const bySpaceId = new Map<number, ContractedSpaceSummary>();

  const add = (space: ContractedSpaceSummary) => {
    const existing = bySpaceId.get(space.spaceId);
    if (!existing || (!existing.imageUrl && space.imageUrl)) {
      bySpaceId.set(space.spaceId, space);
    }
  };

  received
    .filter((matching) => matching.status === 'ACCEPTED')
    .forEach((matching) =>
      add({
        matchingId: matching.matchingId,
        spaceId: matching.spaceId,
        spaceName: matching.spaceTitle,
        imageUrl: matching.spaceImageUrl ?? null,
        status: 'ACCEPTED',
      }),
    );

  sent
    .filter((matching) => matching.status === 'ACCEPTED')
    .forEach((matching) =>
      add({
        matchingId: matching.matchingId,
        spaceId: matching.spaceId,
        spaceName: matching.spaceTitle,
        imageUrl: matching.spaceImageUrl,
        status: 'ACCEPTED',
      }),
    );

  return [...bySpaceId.values()];
}

// 대시보드의 네 데이터 소스를 함께 불러와 화면별 요약으로 정리합니다.
export async function getDashboardData(): Promise<DashboardData> {
  const [ownedSpaces, received, sent, wishlist] = await Promise.all([
    getMySpaces(),
    getReceivedMatchings(),
    getMyMatchings(),
    getWishlist(),
  ]);
  const spacesById = new Map(ownedSpaces.map((space) => [space.spaceId, space]));
  const receivedApplications = received.map((matching) => {
    const space = spacesById.get(matching.spaceId);
    return {
      ...matching,
      spaceImageUrl: matching.spaceImageUrl ?? space?.imageUrl ?? null,
      monthlyRent: matching.monthlyRent ?? space?.monthlyRent,
    };
  });
  const sentApplications = sent
    .filter((matching) => matching.status !== 'CANCELED')
    .map(sentToContract);

  return {
    ownedSpaces,
    contractedSpaces: buildContractedSpaces(receivedApplications, sent),
    receivedApplications,
    sentApplications,
    wishlistItems: wishlist.items,
  };
}
