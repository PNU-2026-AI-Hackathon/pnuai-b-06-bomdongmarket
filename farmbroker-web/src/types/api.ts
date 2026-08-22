export type UserRole = 'OWNER' | 'FARMER' | 'CONSUMER';

export type SpaceStatus = 'AVAILABLE' | 'MATCHED' | 'CLOSED';

export type MatchingStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

// 농부가 공간을 어떤 목적으로 쓰려는지. 유형 도입 이전 신청은 null로 내려옵니다.
export type MatchingType = 'PROFIT' | 'HOBBY';

export type CropDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export type LightRequirement = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}

export interface User {
  userId: number;
  email: string;
  nickname: string;
  // 역할은 가입 시 고르는 값이 아니라 활동에 따라 누적된다.
  // 가입 시 CONSUMER, 공간을 등록하면 OWNER, 매칭이 수락되면 FARMER가 더해진다.
  roles: UserRole[];
}

export interface UserUpdateInput {
  nickname: string;
  currentPassword?: string;
  newPassword?: string;
}

export type WithdrawalBlockReason = 'ACTIVE_CONTRACT_EXISTS';

export interface WithdrawalEligibility {
  withdrawable: boolean;
  activeContractCount: number;
  reason: WithdrawalBlockReason | null;
}

export interface UserWithdrawalInput {
  currentPassword: string;
  agreement: true;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  // Access Token은 httpOnly 쿠키로 내려가므로 응답 본문에는 사용자 정보만 담긴다.
  user: User;
}

export interface SignupInput extends LoginInput {
  nickname: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserSummary {
  userId: number;
  nickname: string;
}

export interface SpaceSummary {
  spaceId: number;
  title: string;
  address: string;
  area: number;
  monthlyRent: number;
  // 목록 카드가 실제 등록값대로 시설 아이콘을 보여줘야 해서 요약에도 담깁니다.
  hasWater: boolean;
  hasElectricity: boolean;
  hasVentilation: boolean;
  status: SpaceStatus;
  imageUrl: string | null;
  // 지도 검색용 좌표. 등록 시 프론트가 주소를 지오코딩해 저장하며, 없으면 프론트가 폴백 지오코딩한다.
  latitude?: number | null;
  longitude?: number | null;
}

export interface SpaceDetail extends SpaceSummary {
  floor: number;
  description: string;
  imageUrls: string[];
  floorPlanUrls: string[];
  owner: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceSearchParams {
  keyword?: string;
  minArea?: number;
  maxRent?: number;
  sort?: 'latest' | 'area' | 'rent';
  page?: number;
  size?: number;
}

export interface SpaceCreateInput {
  title: string;
  address: string;
  area: number;
  monthlyRent: number;
  floor: number;
  hasWater: boolean;
  hasElectricity: boolean;
  hasVentilation: boolean;
  description?: string;
  // 공간 사진은 최소 1장이 필수입니다 (백엔드 SpaceCreateRequest와 동일).
  imageUrls: string[];
  // 등록 폼에서는 더 이상 도면을 받지 않습니다. 이미 등록된 공간의 수정 요청에만 쓰입니다.
  floorPlanUrls?: string[];
  // 지도용 좌표(선택). 폼에서 주소를 지오코딩해 함께 보낸다(실패 시 null).
  latitude?: number | null;
  longitude?: number | null;
}

export type SpaceUpdateInput = Partial<SpaceCreateInput> & {
  status?: Extract<SpaceStatus, 'AVAILABLE' | 'CLOSED'>;
};

export interface SpaceMutationResult extends SpaceCreateInput {
  spaceId: number;
  imageUrls: string[];
  floorPlanUrls: string[];
  status: SpaceStatus;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceDeleteResult {
  spaceId: number;
  deleted: boolean;
}

export interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
}

export interface CropSummary {
  cropId: number;
  name: string;
  category: string;
  difficulty: CropDifficulty;
  growingPeriodDays: number;
  avgPricePerKg: number;
  imageUrl: string;
}

export interface CropDetail extends CropSummary {
  optimalTempMin: number;
  optimalTempMax: number;
  optimalHumidity: number;
  lightRequirement: LightRequirement;
  yieldPerSqmKg: number;
  description: string;
  dataSource: 'SEED' | 'AI';
}

export interface CropSearchParams {
  keyword?: string;
  category?: string;
  difficulty?: CropDifficulty;
}

export interface CropRecommendation {
  cropName: string;
  cropId: number | null;
  reason: string;
  expectedYieldKg: number | null;
  avgPricePerKg: number | null;
}

// 서버의 결정론적 수익 계산기(ProfitCalculator) 결과입니다. 금액은 KRW/월, 적자는 음수로 옵니다.
export interface ProfitEstimate {
  cropName: string;
  // 계산 근거(표준 가정값 포함)
  totalAreaM2: number;
  cultivableRatio: number;
  areaUtilizationPercent: number;
  moduleLayers: number;
  ceilingHeightM: number;
  availableFloorAreaM2: number;
  cultivationAreaM2: number;
  lightingPowerW: number;
  averageMonthlyEnergyKwh: number;
  // 생산·매출
  monthlyTotalProductionKg: number;
  monthlySalesKg: number;
  pricePerKgKrw: number;
  monthlyRevenueKrw: number;
  // 비용
  electricityCostKrw: number;
  waterCostKrw: number;
  materialCostKrw: number;
  laborCostKrw: number;
  depreciationAndOtherCostKrw: number;
  monthlyOperatingCostKrw: number;
  // 손익·배분·계약 추천
  monthlyOperatingProfitKrw: number;
  landlordShareRatio: number;
  landlordExpectedIncomeKrw: number;
  desiredMonthlyRentKrw: number;
  businessOperatingProfitKrw: number;
  operatingLoss: boolean;
  longTermRecommended: boolean;
  recommendation: string;
  contractType: string;
}

// 등록 전 예측이라 spaceId 없이 공간 등록 폼의 면적·월세만 보냅니다.
export interface ProfitEstimateInput {
  area: number;
  monthlyRent: number;
}

export interface AiRecommendation {
  recommendationId: number;
  spaceId: number;
  recommendedCrops: CropRecommendation[];
  layoutSuggestion: string;
  cautions: string[];
  createdAt: string;
  profitEstimate: ProfitEstimate | null;
}

export interface AiRecommendationInput {
  spaceId: number;
  preferredCrop?: string;
  purpose?: string;
  additionalInfo?: string;
}

export interface MatchingApplyInput {
  spaceId: number;
  type: MatchingType;
  message: string;
}

export interface MatchingApplyResult extends MatchingApplyInput {
  matchingId: number;
  farmerId: number;
  ownerId: number;
  status: MatchingStatus;
  createdAt: string;
}

export interface MatchingStatusResult {
  matchingId: number;
  status: MatchingStatus;
  respondedAt: string;
}

export interface MyMatching {
  matchingId: number;
  spaceId: number;
  spaceTitle: string;
  spaceImageUrl: string | null;
  monthlyRent: number;
  ownerNickname: string;
  type: MatchingType | null;
  message: string;
  status: MatchingStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface MatchingRequest {
  matchingId: number;
  spaceId: number;
  spaceTitle: string;
  spaceImageUrl?: string | null;
  monthlyRent?: number;
  ownerNickname?: string;
  farmerId: number;
  farmerNickname: string;
  type: MatchingType | null;
  message: string;
  status: MatchingStatus;
  createdAt: string;
  respondedAt: string | null;
}

// 매칭 1건에 붙는 계약서. 대시보드의 ContractSummary(매칭 요약의 별칭)와는 다른 화면이라
// 이름을 ContractDetail로 구분한다.
// 계약 진행 상태는 별도 타입 없이 MatchingStatus를 그대로 쓴다 —
// REQUESTED(협의 중) / ACCEPTED(최종 계약) / REJECTED(계약 취소) / CANCELED(신청 철회).

// 계약 당사자는 공간 제공자와 도심 농부 둘뿐이다. 요청자 판정과 관리비 책임소재가 같은 값을 쓴다.
export type ContractParty = 'OWNER' | 'FARMER';

// 서버가 요청자를 어느 쪽으로 판정했는지. 조건 입력 권한은 이 값 하나로 결정된다.
export type ContractViewerRole = ContractParty;

// 관리비를 내는 쪽. 화면에는 이 값 대신 해당 당사자의 닉네임을 보여준다.
export type MaintenanceFeePayer = ContractParty;

export interface ContractDetail {
  matchingId: number;
  spaceId: number;
  // 이름·주소는 입력받지 않고 기존 정보(양측 닉네임, 공간 주소)를 그대로 싣는다.
  address: string;
  ownerNickname: string;
  farmerNickname: string;
  // 아직 공간 제공자가 조건을 저장하지 않았으면 null이다.
  monthlyRent: number | null;
  maintenanceFee: number | null;
  maintenanceFeePayer: MaintenanceFeePayer | null;
  deposit: number | null;
  startDate: string | null; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
  // 지금 보고 있는 조건의 번호(저장할 때마다 +1). 동의 요청에 그대로 실어 보내면
  // 서버가 오래 열린 화면에서 온 동의를 409로 거른다.
  termsVersion: number;
  ownerAgreed: boolean;
  farmerAgreed: boolean;
  // 계약을 취소한 쪽. 취소 표시를 누른 사람에게만 붙이는 데 쓴다.
  // 아직 취소되지 않았거나, 확정에 밀려 자동 거절된 신청은 null이다.
  canceledBy: ContractParty | null;
  status: MatchingStatus;
  viewerRole: ContractViewerRole;
}

export interface ContractTermsInput {
  monthlyRent: number;
  maintenanceFee: number;
  maintenanceFeePayer: MaintenanceFeePayer;
  deposit: number;
  startDate: string;
  endDate: string;
}

// 생산 이력 이벤트(상품 상세에서 내려옴). 등록/수정 시 백엔드에 배열로 함께 전달한다.
export interface MarketTraceabilityEvent {
  eventId: number;
  stage: string;
  description: string | null;
  occurredAt: string;
  sortOrder: number;
}

export interface MarketItem {
  productId: number;
  name: string;
  category: string;
  productionLocation: string;
  producerName: string;
  harvestDate: string;
  price: number;
  unit: string;
  // 사진 없이 등록 가능(백엔드 nullable) → 렌더 시 placeholder guard가 필요하다.
  imageUrl: string | null;
  freshnessTags: string[];
  // 위경도·마일리지는 지도(Task 3) 전까지 백엔드에서 null로 내려올 수 있어 렌더 시 guard가 필요하다.
  foodMileageKm: number | null;
  stock: number;
  // 판매 상태(ON_SALE/CLOSED)는 목록·상세 양쪽에 내려온다.
  // 공개 목록은 ON_SALE·재고>0만 나오지만 판매자 본인 목록(GET /products/my)은 마감·품절도 포함한다.
  status?: string;
  // 주소·위경도는 지도 검색을 위해 목록·상세 양쪽에 내려온다(등록 시 저장, 없으면 프론트가 폴백 지오코딩).
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // 아래는 상세(GET /products/{id})에서만 추가로 내려오는 필드 — 목록 응답에는 없다.
  // 내가 등록한 상품인지 판단해 구매 버튼을 감추는 데 씁니다.
  sellerId?: number;
  sellerNickname?: string;
  description?: string | null;
  spaceId?: number | null;
  createdAt?: string;
  traceabilityEvents?: MarketTraceabilityEvent[];
}

// 상품 등록(POST /products)·수정(PATCH /products/{id}) 요청 바디.
// 서버가 정하는 값(sellerNickname·freshnessTags·status)은 보내지 않는다.
// 위경도는 폼에서 주소를 지오코딩해 함께 보낸다(실패 시 null). 푸드 마일리지는 서버가 채운다.
export interface ProductEventInput {
  stage: string;
  description?: string | null;
  occurredAt: string;
  sortOrder?: number;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string | null;
  description?: string | null;
  harvestDate: string;
  // producerName은 요청에 없습니다 — 서버가 판매자 닉네임으로 고정합니다(#56 리뷰 반영).
  productionLocation: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // '작업장에서 가져오기'로 채운 경우에만 값이 있는 느슨한 스냅샷(FK 아님)
  spaceId?: number | null;
  events?: ProductEventInput[];
}


// 찜한 상품 한 줄. 수량·합계가 없다 — 찜은 관심 목록이고 수량은 주문할 때 정한다.
export interface WishlistLine {
  productId: number;
  name: string;
  unit: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  // 찜해 둔 사이 품절·마감됐을 수 있어 서버가 매번 다시 계산해 준다.
  purchasable: boolean;
}

export interface Wishlist {
  items: WishlistLine[];
}

// 주문 줄은 주문 시점 값으로 고정된다 — 판매자가 나중에 가격을 바꿔도 내역은 그대로다.
export interface OrderLine {
  productId: number;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  linePrice: number;
}

export interface Order {
  orderId: number;
  totalPrice: number;
  createdAt: string;
  items: OrderLine[];
}
// 대시보드·계약 화면이 쓰는 "내가 보낸 신청" 한 건의 요약.
// contractId는 매칭 ID와 같고, spaceId는 신청 상세(/spaces/:spaceId/apply) 링크를 만드는 데 씁니다.
export interface ContractSummary {
  contractId: number;
  spaceId: number;
  spaceName: string;
  counterparty: string;
  status: MatchingStatus;
  monthlyRent: number;
  type: MatchingType | null;
  imageUrl: string | null;
}

// 받은/보낸 신청 중 수락된 공간을 대시보드 카드로 합친 요약입니다.
export interface ContractedSpaceSummary {
  matchingId: number;
  spaceId: number;
  spaceName: string;
  imageUrl: string | null;
  status: Extract<MatchingStatus, 'ACCEPTED'>;
}

// ── 채팅 ──
// 방은 (맥락, 두 참여자) 조합으로 유일합니다. 맥락은 공간 문의(SPACE)와 마켓 상품(PRODUCT) 둘입니다.
export type ChatContextType = 'SPACE' | 'PRODUCT';

export type ChatMessageType = 'TEXT' | 'IMAGE';

export interface Conversation {
  conversationId: number;
  contextType: ChatContextType;
  contextId: number;
  contextTitle: string;
  contextImageUrl: string | null;
  otherUserId: number;
  otherUserNickname: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  // 어느 쪽이든 차단하면 true입니다. 입력창을 막고, 매칭 재신청도 막습니다.
  blocked: boolean;
  // 공간 문의 대화에 걸린 두 사람 사이의 최근 매칭입니다. 상품 문의에는 없습니다.
  matchingId?: number | null;
  // ACCEPTED 일 때만 계약을 쓸 수 있습니다.
  matchingStatus?: string | null;
}

export interface ConversationList {
  conversations: Conversation[];
  page: number;
  size: number;
  hasNext: boolean;
}

export interface ChatMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  type: ChatMessageType;
  text: string | null;
  imagePath: string | null;
  imageContentType: string | null;
  createdAt: string;
}

export interface ChatMessageList {
  messages: ChatMessage[];
  // 위로 더 불러올 때 넘기는 커서입니다.
  nextBeforeId: number | null;
  hasNext: boolean;
}

export interface ChatReadResult {
  conversationId: number;
  lastReadMessageId: number | null;
  unreadCount: number;
}
