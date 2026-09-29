import apiClient from './client';
import { ApiResponse, User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
