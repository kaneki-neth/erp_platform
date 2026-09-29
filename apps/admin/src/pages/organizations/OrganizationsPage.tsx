import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi, CreateOrganizationData, OrganizationFilters } from '../../api/organizations';
import { Organization } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import {
  Building2,
  Plus,
  Search,
  Users,
  AlertCircle,
  Power,
  ChevronLeft,
  ChevronRight,
  Globe,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();

  const [filters, setFilters] = useState<OrganizationFilters>({
    page: 1,
    perPage: 15,
    search: '',
    status: '',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    legal_name: '',
    code: '',
    email: '',
    phone: '',
    timezone: 'UTC',
    currency: 'USD',
    owner_name: '',
    owner_email: '',
    owner_password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations-list', filters],
    queryFn: () => organizationApi.getOrganizations(filters),
  });

  const createOrgMutation = useMutation({
    mutationFn: organizationApi.createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-list'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create organization');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'suspended' | 'inactive' }) =>
      organizationApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-list'] });
      setShowStatusModal(false);
      setSelectedOrg(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update organization status');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      legal_name: '',
      code: '',
      email: '',
      phone: '',
      timezone: 'UTC',
      currency: 'USD',
      owner_name: '',
      owner_email: '',
      owner_password: '',
    });
    setSelectedOrg(null);
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createOrgMutation.mutate(formData);
  };

  const canCreateOrgs = user?.is_owner || hasPermission('organizations.create') || hasPermission('organizations.manage');
  const canManageOrgs = user?.is_owner || hasPermission('organizations.manage');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Organizations Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-tenant businesses, organizational entities, and regional configurations.
          </p>
        </div>

        {canCreateOrgs && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations by name, code, or slug..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Organization</th>
                <th className="px-6 py-3.5">Code / Identifier</th>
                <th className="px-6 py-3.5">Members</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Currency / Timezone</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading organizations...
                  </td>
                </tr>
              ) : !orgsData?.data || orgsData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                orgsData.data.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{org.name}</div>
                          <div className="text-xs text-slate-500">{org.legal_name || org.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-700">
                        {org.code || org.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to="/organization/members"
                        className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-full transition"
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        {org.members_count ?? 0} members
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {org.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : org.status === 'suspended' ? (
                        <Badge variant="warning">Suspended</Badge>
                      ) : (
                        <Badge variant="neutral">{org.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1 font-mono">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{org.currency || 'USD'}</span>
                        <span>•</span>
                        <span>{org.timezone || 'UTC'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to="/organization/settings"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Organization Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                        {canManageOrgs && (
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowStatusModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Change Status"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orgsData && orgsData.last_page > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {orgsData.from || 0} to {orgsData.to || 0} of {orgsData.total} organizations
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={!orgsData.prev_page_url}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-700">
                Page {orgsData.current_page} of {orgsData.last_page}
              </span>
              <button
                disabled={!orgsData.next_page_url}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Create New Organization</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Acme Retail"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.legal_name || ''}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Acme Retail Inc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ACM-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="UTC"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Initial Organization Administrator (Optional)
                </h4>
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={formData.owner_email || ''}
                        onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="admin@neworg.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Admin Name
                      </label>
                      <input
                        type="text"
                        value={formData.owner_name || ''}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="John Admin"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Initial Password (if creating new account)
                    </label>
                    <input
                      type="password"
                      minLength={8}
                      value={formData.owner_password || ''}
                      onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Update Organization Status</h3>
            <p className="text-xs text-slate-500 mb-4">
              Change the operational lifecycle status for <span className="font-semibold">{selectedOrg.name}</span>.
            </p>

            <div className="space-y-2 mb-6">
              {(['active', 'suspended', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => updateStatusMutation.mutate({ id: selectedOrg.id, status: st })}
                  disabled={updateStatusMutation.isPending || selectedOrg.status === st}
                  className={`w-full p-3 rounded-lg border text-left text-xs font-medium capitalize flex items-center justify-between transition ${
                    selectedOrg.status === st
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{st}</span>
                  {selectedOrg.status === st && <Badge variant="success">Current</Badge>}
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
