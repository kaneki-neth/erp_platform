import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi, CreateRoleData, UpdateRoleData } from '../../api/roles';
import { permissionApi } from '../../api/permissions';
import { Role, Permission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import {
  Shield,
  Plus,
  Search,
  Lock,
  Edit2,
  Trash2,
  AlertCircle,
  Key,
  Users,
  Info,
} from 'lucide-react';

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    slug: '',
    description: '',
    permissions: [],
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-list', search],
    queryFn: () => roleApi.getRoles(search),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions-list'],
    queryFn: () => permissionApi.getPermissions(false) as Promise<Permission[]>,
  });

  const permissions = Array.isArray(permissionsData) ? permissionsData : [];

  // Group permissions by module_key
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const key = perm.module_key || 'core';
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleData }) =>
      roleApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      setShowEditModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: roleApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      setShowDeleteModal(false);
      setSelectedRole(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to delete role');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', permissions: [] });
    setSelectedRole(null);
    setFormError(null);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions ? role.permissions.map((p) => p.id) : [],
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const handlePermissionToggle = (permId: number) => {
    const current = formData.permissions || [];
    if (current.includes(permId)) {
      setFormData({ ...formData, permissions: current.filter((id) => id !== permId) });
    } else {
      setFormData({ ...formData, permissions: [...current, permId] });
    }
  };

  const handleToggleGroup = (moduleKey: string) => {
    const groupPermIds = groupedPermissions[moduleKey]?.map((p) => p.id) || [];
    const current = formData.permissions || [];
    const allSelected = groupPermIds.every((id) => current.includes(id));

    if (allSelected) {
      // Deselect all in group
      setFormData({
        ...formData,
        permissions: current.filter((id) => !groupPermIds.includes(id)),
      });
    } else {
      // Select all in group
      const newPerms = Array.from(new Set([...current, ...groupPermIds]));
      setFormData({ ...formData, permissions: newPerms });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createRoleMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setFormError(null);
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: {
        name: selectedRole.is_system ? undefined : formData.name,
        description: formData.description,
        permissions: formData.permissions,
      },
    });
  };

  const canManageRoles = hasPermission('roles.manage') || hasPermission('roles.create');
  const canUpdateRoles = hasPermission('roles.manage') || hasPermission('roles.update');
  const canDeleteRoles = hasPermission('roles.manage') || hasPermission('roles.delete');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Roles & Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure platform security roles and granular module permission assignments.
          </p>
        </div>

        {canManageRoles && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Role Name</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Assigned Users</th>
                <th className="px-6 py-3.5">Permissions</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading organization roles...
                  </td>
                </tr>
              ) : !roles || roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          {role.is_system ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-2">
                            <span>{role.name}</span>
                            {role.is_system && <Badge variant="warning">System</Badge>}
                          </div>
                          <div className="text-xs font-mono text-slate-400">{role.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                      {role.description || <span className="italic text-slate-400">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        {role.users_count ?? 0} {role.users_count === 1 ? 'user' : 'users'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <Key className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                        {role.permissions_count ?? (role.permissions ? role.permissions.length : 0)} permissions
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canUpdateRoles && (
                          <button
                            onClick={() => handleOpenEdit(role)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteRoles && !role.is_system && (
                          <button
                            onClick={() => handleOpenDelete(role)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Create New Custom Role</span>
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Store Supervisor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Briefly describe what this role allows..."
                />
              </div>

              {/* Permission Matrix */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Permissions Matrix
                </label>
                <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50 max-h-64 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(([moduleKey, perms]) => {
                    const groupPermIds = perms.map((p) => p.id);
                    const allSelected = groupPermIds.every((id) =>
                      (formData.permissions || []).includes(id)
                    );

                    return (
                      <div key={moduleKey} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            {moduleKey} Module
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(moduleKey)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            const isChecked = (formData.permissions || []).includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <div className="font-semibold">{perm.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{perm.slug}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
                  disabled={createRoleMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {createRoleMutation.isPending ? 'Saving...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <span>
                  Edit Role: <span className="text-emerald-600">{selectedRole.name}</span>
                </span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {selectedRole.is_system && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 flex items-center space-x-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>This is a protected system role. Its name is locked, but its permissions can be modified.</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  required
                  disabled={selectedRole.is_system}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Briefly describe what this role allows..."
                />
              </div>

              {/* Permission Matrix */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Permissions Matrix
                </label>
                <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50 max-h-64 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(([moduleKey, perms]) => {
                    const groupPermIds = perms.map((p) => p.id);
                    const allSelected = groupPermIds.every((id) =>
                      (formData.permissions || []).includes(id)
                    );

                    return (
                      <div key={moduleKey} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            {moduleKey} Module
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(moduleKey)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            const isChecked = (formData.permissions || []).includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                  <div className="font-semibold">{perm.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{perm.slug}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? 'Saving Changes...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Custom Role</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete the role{' '}
              <span className="font-semibold text-slate-900">{selectedRole.name}</span>? This action cannot be undone.
            </p>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteRoleMutation.mutate(selectedRole.id)}
                disabled={deleteRoleMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {deleteRoleMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
