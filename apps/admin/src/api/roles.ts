import apiClient from './client';
import { ApiResponse, Permission, Role } from '../types';

export interface CreateRoleData {
  name: string;
  slug?: string;
  description?: string;
  permissions?: number[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: number[];
}

export const roleApi = {
  getRoles: async (search?: string): Promise<Role[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiClient.get<ApiResponse<Role[]>>(`/roles${params}`);
    return res.data.data;
  },

  getRole: async (id: number): Promise<Role> => {
    const res = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
    return res.data.data;
  },

  createRole: async (data: CreateRoleData): Promise<Role> => {
    const res = await apiClient.post<ApiResponse<Role>>('/roles', data);
    return res.data.data;
  },

  updateRole: async (id: number, data: UpdateRoleData): Promise<Role> => {
    const res = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return res.data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/roles/${id}`);
  },

  getRolePermissions: async (id: number): Promise<Permission[]> => {
    const res = await apiClient.get<ApiResponse<Permission[]>>(`/roles/${id}/permissions`);
    return res.data.data;
  },

  syncRolePermissions: async (id: number, permissions: number[]): Promise<Role> => {
    const res = await apiClient.put<ApiResponse<Role>>(`/roles/${id}/permissions`, { permissions });
    return res.data.data;
  },
};
