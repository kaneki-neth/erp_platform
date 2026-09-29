import apiClient from './client';
import { ApiResponse, ModuleItem } from '../types';

export const moduleApi = {
  getModules: async (): Promise<ModuleItem[]> => {
    const res = await apiClient.get<ApiResponse<ModuleItem[]>>('/modules');
    return res.data.data;
  },

  toggleModule: async (key: string, isEnabled: boolean): Promise<{ module: string; is_enabled: boolean }> => {
    const res = await apiClient.post<ApiResponse<{ module: string; is_enabled: boolean }>>(`/modules/${key}/toggle`, {
      is_enabled: isEnabled,
    });
    return res.data.data;
  },
};
