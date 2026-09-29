import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, LoginCredentials } from '../api/auth';
import { organizationApi } from '../api/organizations';
import { Organization, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentOrganization: Organization | null;
  availableOrganizations: Organization[];
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchOrganization: (orgId: number) => Promise<void>;
  hasPermission: (permissionSlug: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentOrganization: Organization | null = user?.organization || null;
  const availableOrganizations: Organization[] = user?.organizations || (user?.organization ? [user.organization] : []);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('auth_user', JSON.stringify(profile));
          if (profile.organization?.id) {
            localStorage.setItem('active_org_id', profile.organization.id.toString());
          }
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('active_org_id');
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      if (data.user?.organization?.id) {
        localStorage.setItem('active_org_id', data.user.organization.id.toString());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('active_org_id');
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('auth_user', JSON.stringify(profile));
      if (profile.organization?.id) {
        localStorage.setItem('active_org_id', profile.organization.id.toString());
      }
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const switchOrganization = async (orgId: number) => {
    setIsLoading(true);
    try {
      await organizationApi.switchOrganization(orgId);
      localStorage.setItem('active_org_id', orgId.toString());
      
      // Refresh profile to update context and effective permissions
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('auth_user', JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionSlug: string): boolean => {
    if (!user) return false;
    if (user.is_owner) return true;
    if (Array.isArray(user.permissions) && user.permissions.includes(permissionSlug)) {
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentOrganization,
        availableOrganizations,
        isLoading,
        login,
        logout,
        refreshUser,
        switchOrganization,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
