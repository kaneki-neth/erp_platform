import apiClient from './client';
import { ApiResponse, Organization } from '../types';

export const organizationApi = {
  getCurrent: async (): Promise<Organization> => {
    const res = await apiClient.get<ApiResponse<Organization>>('/organizations/current');
    return res.data.data;
  },

  updateCurrent: async (data: Partial<Organization>): Promise<Organization> => {
    const res = await apiClient.patch<ApiResponse<Organization>>('/organizations/current', data);
    return res.data.data;
  },
};
