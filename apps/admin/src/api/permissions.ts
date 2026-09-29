import apiClient from './client';
import { ApiResponse, Permission } from '../types';

export const permissionApi = {
  getPermissions: async (grouped = false): Promise<Permission[] | Record<string, Permission[]>> => {
    const res = await apiClient.get<ApiResponse<Permission[] | Record<string, Permission[]>>>(
      `/permissions${grouped ? '?grouped=true' : ''}`
    );
    return res.data.data;
  },

  getPermission: async (id: number): Promise<Permission> => {
    const res = await apiClient.get<ApiResponse<Permission>>(`/permissions/${id}`);
    return res.data.data;
  },
};
