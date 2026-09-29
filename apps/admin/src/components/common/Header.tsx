import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Building2, UserCircle2 } from 'lucide-react';
import { Badge } from './Badge';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-3">
        <Building2 className="w-5 h-5 text-emerald-600" />
        <span className="font-semibold text-slate-800 text-base">
          {user?.organization?.name || 'Platform Core'}
        </span>
        <Badge variant="primary" size="sm">
          Tenant: {user?.organization?.slug || 'default'}
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <UserCircle2 className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-slate-700">{user?.name}</span>
          {user?.is_owner && (
            <Badge variant="warning" size="sm">
              Owner
            </Badge>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
