import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Boxes,
  Building2,
  Settings,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { hasPermission, currentOrganization } = useAuth();

  const organizationNavItems = [
    {
      to: '/organizations',
      label: 'All Organizations',
      icon: Building2,
      permission: 'organizations.view',
    },
    {
      to: '/organization/members',
      label: 'Team Members',
      icon: UserCheck,
      permission: 'organizations.members.view',
    },
    {
      to: '/organization/settings',
      label: 'Tenant Settings',
      icon: Settings,
      permission: 'organizations.settings.view',
    },
  ];

  const adminNavItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, permission: null },
    { to: '/users', label: 'User Directory', icon: Users, permission: 'users.view' },
    { to: '/roles', label: 'Roles & Permissions', icon: Shield, permission: 'roles.view' },
    { to: '/modules', label: 'Platform Modules', icon: Boxes, permission: 'modules.view' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          E
        </div>
        <div>
          <span className="font-bold text-white tracking-wide text-sm block">ERP PLATFORM</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Multi-Tenant Ready</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {/* Current Tenant Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Organization</span>
            {currentOrganization && (
              <span className="text-[10px] text-emerald-400 font-mono font-normal truncate max-w-[90px]">
                {currentOrganization.code || currentOrganization.name}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {organizationNavItems.map((item) => {
              if (
                item.permission &&
                !hasPermission(item.permission) &&
                !hasPermission('organizations.manage') &&
                !hasPermission('roles.manage')
              ) {
                return null;
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Administration Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Admin
          </div>
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              if (
                item.permission &&
                !hasPermission(item.permission) &&
                !hasPermission('roles.manage')
              ) {
                return null;
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Tenant Context Active</span>
        </div>
      </div>
    </aside>
  );
};
