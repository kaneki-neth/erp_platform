import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../../api/organizations';
import { userApi } from '../../api/users';
import { moduleApi } from '../../api/modules';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Users, Boxes, ShieldCheck, CheckCircle2, Server, Database } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();

  const { data: organization } = useQuery({
    queryKey: ['current-organization'],
    queryFn: organizationApi.getCurrent,
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userApi.getUsers({ page: 1, perPage: 5 }),
  });

  const { data: modules, isLoading: isModulesLoading } = useQuery({
    queryKey: ['modules-list'],
    queryFn: moduleApi.getModules,
  });

  const enabledModules = modules?.filter((m) => m.is_enabled) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phase 0 Foundation Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Tenant: <strong className="text-white">{organization?.name || user?.organization?.name}</strong> • 
            Status: <span className="text-emerald-400 capitalize font-medium">{organization?.status || 'Active'}</span>
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Organization
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block truncate max-w-[200px]">
              {organization?.name || 'Loading...'}
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              Slug: {organization?.slug}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Tenant Users
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {isUsersLoading ? '...' : usersData?.total ?? 0}
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              Scoped to organization
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Enabled Modules
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {isModulesLoading ? '...' : `${enabledModules.length} / ${modules?.length ?? 0}`}
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              Configured for tenant
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Modular Architecture & Tenant Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enabled Business Modules */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <span>Tenant Active Modules</span>
            </h3>
            <Badge variant="primary">Modular Monolith</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Modules enabled for this specific tenant organization.
          </p>

          <div className="space-y-3">
            {enabledModules.length === 0 && (
              <p className="text-sm text-slate-400 italic">No business modules enabled yet.</p>
            )}
            {enabledModules.map((mod) => (
              <div
                key={mod.key}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
                    <span>{mod.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Architectural Verification Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>Architecture & Isolation Status</span>
          </h3>

          <div className="space-y-3.5">
            <div className="flex items-start space-x-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900 block">Single-Database Multi-Tenancy</span>
                <span className="text-emerald-700">Global scope filters every query strictly by organization_id.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-blue-900 block">API-First Separation</span>
                <span className="text-blue-700">Client runs completely decoupled over REST /api/v1 (No Inertia/Blade).</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-purple-900 block">Sanctum Token Authentication</span>
                <span className="text-purple-700">Ready for Web Admin and future offline-first Mobile POS sync.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
