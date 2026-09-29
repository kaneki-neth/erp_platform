export interface Organization {
  id: number;
  name: string;
  slug: string;
  domain?: string | null;
  status: 'active' | 'suspended' | 'archived';
  settings?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
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
