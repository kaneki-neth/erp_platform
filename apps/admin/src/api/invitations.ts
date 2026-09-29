import apiClient from './client';
import { ApiResponse, OrganizationInvitation } from '../types';

export interface CreateInvitationData {
  email: string;
  role_id?: number;
  expires_in_days?: number;
}

export const invitationApi = {
  getInvitations: async (organizationId: number): Promise<OrganizationInvitation[]> => {
    const res = await apiClient.get<ApiResponse<OrganizationInvitation[]>>(
      `/organizations/${organizationId}/invitations`
    );
    return res.data.data;
  },

  createInvitation: async (organizationId: number, data: CreateInvitationData): Promise<OrganizationInvitation> => {
    const res = await apiClient.post<ApiResponse<OrganizationInvitation>>(
      `/organizations/${organizationId}/invitations`,
      data
    );
    return res.data.data;
  },

  getInvitationByToken: async (token: string): Promise<OrganizationInvitation> => {
    const res = await apiClient.get<ApiResponse<OrganizationInvitation>>(`/invitations/${token}`);
    return res.data.data;
  },

  acceptInvitation: async (token: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/invitations/${token}/accept`);
    return res.data.data;
  },

  cancelInvitation: async (organizationId: number, invitationId: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/organizations/${organizationId}/invitations/${invitationId}`);
  },
};
