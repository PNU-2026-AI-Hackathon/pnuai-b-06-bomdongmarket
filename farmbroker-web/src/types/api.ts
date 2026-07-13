export type UserRole = 'OWNER' | 'FARMER' | 'CONSUMER';

export type SpaceStatus = 'AVAILABLE' | 'MATCHED' | 'CLOSED';

export type MatchingStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

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
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

export interface SignupInput extends LoginInput {
  nickname: string;
  role: UserRole;
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
  status: SpaceStatus;
  imageUrl: string | null;
}

export interface SpaceDetail extends SpaceSummary {
  floor: number;
  hasWater: boolean;
  hasElectricity: boolean;
  hasVentilation: boolean;
  description: string;
  imageUrls: string[];
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
  imageUrls?: string[];
}

export type SpaceUpdateInput = Partial<SpaceCreateInput> & {
  status?: Extract<SpaceStatus, 'AVAILABLE' | 'CLOSED'>;
};

export interface SpaceMutationResult extends SpaceCreateInput {
  spaceId: number;
  imageUrls: string[];
  status: SpaceStatus;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceDeleteResult {
  spaceId: number;
  deleted: boolean;
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

export interface AiRecommendation {
  recommendationId: number;
  spaceId: number;
  recommendedCrops: CropRecommendation[];
  layoutSuggestion: string;
  cautions: string[];
  createdAt: string;
}

export interface AiRecommendationInput {
  spaceId: number;
  preferredCrop?: string;
  purpose?: string;
  additionalInfo?: string;
}

export interface MatchingApplyInput {
  spaceId: number;
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
  message: string;
  status: MatchingStatus;
  createdAt: string;
  respondedAt: string | null;
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
  imageUrl: string;
  freshnessTags: string[];
  foodMileageKm: number;
  stock: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
  trend: string;
}

export interface ContractSummary {
  contractId: number;
  spaceName: string;
  counterparty: string;
  status: '신청' | '협의' | '검토' | '완료';
  monthlyRent: number;
  period: string;
}
