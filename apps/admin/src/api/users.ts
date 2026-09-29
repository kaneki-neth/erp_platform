import apiClient from './client';
import { ApiResponse, PaginatedData, User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  roles?: number[];
}

export const userApi = {
  getUsers: async (page = 1, perPage = 15): Promise<PaginatedData<User>> => {
    const res = await apiClient.get<ApiResponse<PaginatedData<User>>>(`/users?page=${page}&per_page=${perPage}`);
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
};
