import apiClient from './client';
import { ApiResponse, OrganizationMembership, PaginatedData } from '../types';

export interface AddMemberData {
  email: string;
  name?: string;
  password?: string;
  role_id?: number;
  status?: 'active' | 'invited' | 'suspended';
}

export interface MemberFilters {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}

export const memberApi = {
  getMembers: async (organizationId: number, filters: MemberFilters = {}): Promise<PaginatedData<OrganizationMembership>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.perPage) params.append('per_page', filters.perPage.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<PaginatedData<OrganizationMembership>>>(
      `/organizations/${organizationId}/members${queryString}`
    );
    return res.data.data;
  },

  getMember: async (organizationId: number, userId: number): Promise<OrganizationMembership> => {
    const res = await apiClient.get<ApiResponse<OrganizationMembership>>(
      `/organizations/${organizationId}/members/${userId}`
    );
    return res.data.data;
  },

  addMember: async (organizationId: number, data: AddMemberData): Promise<OrganizationMembership> => {
    const res = await apiClient.post<ApiResponse<OrganizationMembership>>(
      `/organizations/${organizationId}/members`,
      data
    );
    return res.data.data;
  },

  updateMember: async (
    organizationId: number,
    userId: number,
    data: { role_id?: number | null; status?: 'active' | 'suspended' | 'removed' | 'invited' }
  ): Promise<OrganizationMembership> => {
    const res = await apiClient.put<ApiResponse<OrganizationMembership>>(
      `/organizations/${organizationId}/members/${userId}`,
      data
    );
    return res.data.data;
  },

  removeMember: async (organizationId: number, userId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/organizations/${organizationId}/members/${userId}`);
  },
};
