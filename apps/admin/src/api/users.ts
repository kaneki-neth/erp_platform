import apiClient from './client';
import { ApiResponse, PaginatedData, Role, User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  status?: 'active' | 'inactive' | 'suspended';
  roles?: number[];
}

export interface UserFilters {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  roleId?: number;
}

export const userApi = {
  getUsers: async (filters: UserFilters = {}): Promise<PaginatedData<User>> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.perPage) params.append('per_page', filters.perPage.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.roleId) params.append('role_id', filters.roleId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<PaginatedData<User>>>(`/users${queryString}`);
    return res.data.data;
  },

  getUser: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },

  updateUser: async (id: number, data: Partial<CreateUserData>): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
  },

  getUserRoles: async (id: number): Promise<Role[]> => {
    const res = await apiClient.get<ApiResponse<Role[]>>(`/users/${id}/roles`);
    return res.data.data;
  },

  syncUserRoles: async (id: number, roles: number[]): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}/roles`, { roles });
    return res.data.data;
  },
};

