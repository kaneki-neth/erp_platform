import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Boxes, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const navItems = [
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
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Phase 1 IAM Ready</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Platform Administration
        </div>
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission) && !hasPermission('roles.manage')) {
            return null;
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>IAM Centralized Access</span>
        </div>
      </div>
    </aside>
  );
};

