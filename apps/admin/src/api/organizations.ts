import apiClient from './client';
import { ApiResponse, Organization, PaginatedData } from '../types';

export interface CreateOrganizationData {
  name: string;
  legal_name?: string;
  slug?: string;
  code?: string;
  description?: string;
  domain?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  owner_email?: string;
  owner_name?: string;
  owner_password?: string;
}

export interface OrganizationFilters {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}

export const organizationApi = {
  getOrganizations: async (filters: OrganizationFilters = {}): Promise<PaginatedData<Organization>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.perPage) params.append('per_page', filters.perPage.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<PaginatedData<Organization>>>(`/organizations${queryString}`);
    return res.data.data;
  },

  getOrganization: async (id: number): Promise<Organization> => {
    const res = await apiClient.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return res.data.data;
  },

  createOrganization: async (data: CreateOrganizationData): Promise<Organization> => {
    const res = await apiClient.post<ApiResponse<Organization>>('/organizations', data);
    return res.data.data;
  },

  updateOrganization: async (id: number, data: Partial<CreateOrganizationData>): Promise<Organization> => {
    const res = await apiClient.put<ApiResponse<Organization>>(`/organizations/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id: number, status: 'active' | 'inactive' | 'suspended' | 'archived'): Promise<Organization> => {
    const res = await apiClient.patch<ApiResponse<Organization>>(`/organizations/${id}/status`, { status });
    return res.data.data;
  },

  deleteOrganization: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/organizations/${id}`);
  },

  getCurrent: async (): Promise<Organization> => {
    const res = await apiClient.get<ApiResponse<Organization>>('/organizations/current');
    return res.data.data;
  },

  updateCurrentSettings: async (data: Partial<CreateOrganizationData> & { settings?: any }): Promise<Organization> => {
    const res = await apiClient.put<ApiResponse<Organization>>('/organizations/current/settings', data);
    return res.data.data;
  },

  switchOrganization: async (organizationId: number): Promise<{ organization: Organization; permissions: string[] }> => {
    const res = await apiClient.post<ApiResponse<{ organization: Organization; permissions: string[] }>>(
      '/organizations/switch',
      { organization_id: organizationId }
    );
    return res.data.data;
  },

  getUserOrganizations: async (): Promise<Organization[]> => {
    const res = await apiClient.get<ApiResponse<Organization[]>>('/organizations/user-organizations');
    return res.data.data;
  },
};
