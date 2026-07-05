export type UserRole = 'OWNER' | 'FARMER' | 'CONSUMER';

export type SpaceStatus = 'AVAILABLE' | 'MATCHED' | 'CLOSED';

export type MatchingStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export type CropDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export type LightRequirement = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
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

export interface MatchingRequest {
  matchingId: number;
  spaceId: number;
  spaceTitle: string;
  spaceImageUrl: string | null;
  monthlyRent: number;
  ownerNickname: string;
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
  status: 'Request' | 'Negotiation' | 'Review' | 'Complete';
  monthlyRent: number;
  period: string;
}
