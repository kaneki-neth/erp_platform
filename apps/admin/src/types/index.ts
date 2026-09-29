export interface Organization {
  id: number;
  name: string;
  legal_name?: string | null;
  slug: string;
  code?: string | null;
  description?: string | null;
  domain?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  timezone?: string;
  locale?: string;
  currency?: string;
  settings?: Record<string, any> | null;
  members_count?: number;
  roles_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: number;
  user_id: number;
  organization_id: number;
  role_id?: number | null;
  status: 'active' | 'invited' | 'suspended' | 'removed';
  joined_at?: string | null;
  user?: User;
  organization?: Organization;
  role?: Role;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvitation {
  id: number;
  organization_id: number;
  invited_by_user_id: number;
  role_id?: number | null;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string | null;
  role?: Role;
  organization?: Organization;
  invited_by?: User;
  created_at: string;
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  module_key: string;
  description?: string | null;
}

export interface Role {
  id: number;
  organization_id?: number | null;
  name: string;
  slug: string;
  description?: string | null;
  is_system: boolean;
  users_count?: number;
  permissions_count?: number;
  permissions?: Permission[];
}

export interface User {
  id: number;
  organization_id: number;
  name: string;
  email: string;
  is_owner: boolean;
  status: 'active' | 'inactive' | 'suspended';
  organization?: Organization;
  organizations?: Organization[];
  roles?: Role[] | string[];
  permissions?: string[];
  created_at?: string;
}

export interface ModuleItem {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  is_core: boolean;
  status: 'available' | 'beta' | 'coming_soon' | 'deprecated';
  is_enabled: boolean;
  settings?: Record<string, any> | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}
