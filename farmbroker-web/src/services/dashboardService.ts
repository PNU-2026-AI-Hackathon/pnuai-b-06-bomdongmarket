import { mockDelay } from '../mocks/handlers';
import {
  mockContracts,
  mockDashboardMetrics,
  mockMatchingRequests,
} from '../mocks/mockDashboard';
import type { ContractSummary, DashboardMetric, MatchingRequest } from '../types/api';

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  await mockDelay();
  return mockDashboardMetrics;
}

export async function getReceivedMatchings(): Promise<MatchingRequest[]> {
  await mockDelay();
  return mockMatchingRequests;
}

export async function getContracts(): Promise<ContractSummary[]> {
  await mockDelay();
  return mockContracts;
}
