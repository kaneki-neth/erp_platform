import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Building2, UserCircle2, ChevronDown, Check, Building } from 'lucide-react';
import { Badge } from './Badge';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, currentOrganization, availableOrganizations, switchOrganization, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (orgId: number) => {
    if (orgId === currentOrganization?.id) {
      setDropdownOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchOrganization(orgId);
      setDropdownOpen(false);
      // Reload page or refetch queries
      window.location.reload();
    } catch (e) {
      console.error('Failed to switch organization', e);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Organization Switcher Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800 text-sm">
                {currentOrganization?.name || 'Platform Core'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
              <span>{currentOrganization?.code || currentOrganization?.slug || 'default'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-sans font-medium uppercase">
                {currentOrganization?.status || 'active'}
              </span>
            </div>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Switch Organization Context
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {availableOrganizations.map((org) => {
                const isSelected = org.id === currentOrganization?.id;
                return (
                  <button
                    key={org.id}
                    disabled={isSwitching}
                    onClick={() => handleSwitch(org.id)}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-xs transition ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-slate-400" />
                      <div>
                        <div>{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{org.slug}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User info and Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <UserCircle2 className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-slate-700">{user?.name}</span>
          {user?.is_owner && (
            <Badge variant="warning" size="sm">
              Platform Admin
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
