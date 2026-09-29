import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi, AddMemberData } from '../../api/members';
import { invitationApi, CreateInvitationData } from '../../api/invitations';
import { roleApi } from '../../api/roles';
import { useAuth } from '../../context/AuthContext';
import { OrganizationMembership, OrganizationInvitation, Role } from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Mail,
  UserPlus,
  Search,
  Shield,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  Copy,
  Check,
  Send,
  XCircle,
  UserCheck,
  UserX,
} from 'lucide-react';

export const OrganizationMembersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrganization, hasPermission } = useAuth();

  const orgId = currentOrganization?.id;

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showCancelInviteModal, setShowCancelInviteModal] = useState(false);

  const [selectedMember, setSelectedMember] = useState<OrganizationMembership | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<OrganizationInvitation | null>(null);

  // Invite modal tab ('invite' or 'direct')
  const [inviteType, setInviteType] = useState<'invite' | 'direct'>('invite');
  const [inviteData, setInviteData] = useState<CreateInvitationData>({
    email: '',
    role_id: undefined,
    expires_in_days: 7,
  });
  const [directMemberData, setDirectMemberData] = useState<AddMemberData>({
    email: '',
    name: '',
    password: '',
    role_id: undefined,
    status: 'active',
  });

  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Queries
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgId, search, statusFilter],
    queryFn: () =>
      orgId
        ? memberApi.getMembers(orgId, { search, status: statusFilter })
        : Promise.reject('No organization'),
    enabled: !!orgId && activeTab === 'members',
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: () =>
      orgId ? invitationApi.getInvitations(orgId) : Promise.reject('No organization'),
    enabled: !!orgId && activeTab === 'invitations',
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['org-roles', orgId],
    queryFn: () => roleApi.getRoles(),
    enabled: !!orgId,
  });

  // Mutations
  const createInviteMutation = useMutation({
    mutationFn: (data: CreateInvitationData) => invitationApi.createInvitation(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
      setShowInviteModal(false);
      resetForms();
      setActiveTab('invitations');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  const addDirectMemberMutation = useMutation({
    mutationFn: (data: AddMemberData) => memberApi.addMember(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setShowInviteModal(false);
      resetForms();
      setActiveTab('members');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to add member');
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: { role_id?: number | null; status?: any } }) =>
      memberApi.updateMember(orgId!, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setShowEditRoleModal(false);
      setSelectedMember(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => memberApi.removeMember(orgId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setShowRemoveMemberModal(false);
      setSelectedMember(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to remove member');
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: number) => invitationApi.cancelInvitation(orgId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
      setShowCancelInviteModal(false);
      setSelectedInvite(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to cancel invitation');
    },
  });

  const resetForms = () => {
    setInviteData({ email: '', role_id: undefined, expires_in_days: 7 });
    setDirectMemberData({ email: '', name: '', password: '', role_id: undefined, status: 'active' });
    setFormError(null);
  };

  const handleCopyLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleOpenEditRole = (member: OrganizationMembership) => {
    setSelectedMember(member);
    setSelectedRoleId(member.role_id || undefined);
    setFormError(null);
    setShowEditRoleModal(true);
  };

  const handleToggleMemberStatus = (member: OrganizationMembership) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    updateMemberMutation.mutate({
      userId: member.user_id,
      data: { status: nextStatus },
    });
  };

  const canManageMembers =
    hasPermission('organizations.members.manage') ||
    hasPermission('organizations.members.create') ||
    hasPermission('organizations.manage');

  const canUpdateMembers =
    hasPermission('organizations.members.manage') ||
    hasPermission('organizations.members.update') ||
    hasPermission('organizations.manage');

  const canDeleteMembers =
    hasPermission('organizations.members.manage') ||
    hasPermission('organizations.members.delete') ||
    hasPermission('organizations.manage');

  if (!orgId) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-600" />
        <div>
          <h3 className="font-semibold text-sm">No Active Organization Selected</h3>
          <p className="text-xs mt-1">Please select an organization from the top header to manage members and invitations.</p>
        </div>
      </div>
    );
  }

  const members = membersData?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Organization Members</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage active tenant team members, organization roles, and pending invitations.
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => {
              resetForms();
              setShowInviteModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add or Invite Member</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'members'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Roster ({membersData?.total ?? members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'invitations'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Pending Invitations ({invitations ? invitations.length : 0})</span>
        </button>
      </div>

      {/* Tab 1: Active Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {membersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Loading organization members...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                              {(member.user?.name || member.user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{member.user?.name || 'Unnamed User'}</div>
                              <div className="text-xs text-slate-400">{member.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {member.role ? (
                            <span className="inline-flex items-center text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                              <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {member.role.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No role assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              member.status === 'active'
                                ? 'success'
                                : member.status === 'suspended'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {member.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString()
                            : new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {canUpdateMembers && (
                              <>
                                <button
                                  onClick={() => handleOpenEditRole(member)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="Change Role"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleMemberStatus(member)}
                                  className={`p-1.5 rounded-lg transition ${
                                    member.status === 'active'
                                      ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={member.status === 'active' ? 'Suspend Member' : 'Activate Member'}
                                >
                                  {member.status === 'active' ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                            {canDeleteMembers && (
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowRemoveMemberModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remove from Organization"
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
        </div>
      )}

      {/* Tab 2: Pending Invitations */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Invited Email</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Expires At</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Invitation Link</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitationsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Loading invitations...
                      </td>
                    </tr>
                  ) : !invitations || invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No pending invitations.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-slate-900">{invitation.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {invitation.role ? (
                            <span className="inline-flex items-center text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                              <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              {invitation.role.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No role specified</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              invitation.status === 'pending'
                                ? 'warning'
                                : invitation.status === 'accepted'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {invitation.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleCopyLink(invitation.token)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-mono transition"
                            title="Copy invitation link"
                          >
                            {copiedToken === invitation.token ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-sans text-xs">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canDeleteMembers && invitation.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedInvite(invitation);
                                setShowCancelInviteModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Invitation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite / Add Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Add Member to Organization</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Invite Type Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInviteType('invite')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  inviteType === 'invite' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Send Email Invitation
              </button>
              <button
                type="button"
                onClick={() => setInviteType('direct')}
                className={`flex-1 py-1.5 rounded-md transition ${
                  inviteType === 'direct' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Direct User Addition
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {inviteType === 'invite' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormError(null);
                  createInviteMutation.mutate(inviteData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    User Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="teammate@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Role (Optional)
                  </label>
                  <select
                    value={inviteData.role_id || ''}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        role_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No predefined role</option>
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Invitation Validity
                  </label>
                  <select
                    value={inviteData.expires_in_days || 7}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, expires_in_days: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createInviteMutation.isPending}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{createInviteMutation.isPending ? 'Sending...' : 'Generate & Send Invite'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormError(null);
                  addDirectMemberMutation.mutate(directMemberData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    User Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={directMemberData.email}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="user@example.com"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    If this user already exists, they will be attached to this organization.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name (if new user)
                  </label>
                  <input
                    type="text"
                    value={directMemberData.name || ''}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Password (if new user)
                  </label>
                  <input
                    type="password"
                    value={directMemberData.password || ''}
                    onChange={(e) => setDirectMemberData({ ...directMemberData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Temporary password..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Role
                  </label>
                  <select
                    value={directMemberData.role_id || ''}
                    onChange={(e) =>
                      setDirectMemberData({
                        ...directMemberData,
                        role_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No predefined role</option>
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addDirectMemberMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {addDirectMemberMutation.isPending ? 'Adding Member...' : 'Add Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {showEditRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Change Member Role</span>
              </h3>
              <button
                onClick={() => setShowEditRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError(null);
                updateMemberMutation.mutate({
                  userId: selectedMember.user_id,
                  data: { role_id: selectedRoleId ?? null },
                });
              }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  Update role for{' '}
                  <span className="font-semibold text-slate-900">
                    {selectedMember.user?.name || selectedMember.user?.email}
                  </span>
                </p>
                <select
                  value={selectedRoleId || ''}
                  onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">No Role (Default Member)</option>
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditRoleModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMemberMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {updateMemberMutation.isPending ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remove Member */}
      {showRemoveMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Remove Organization Member</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-slate-900">
                {selectedMember.user?.name || selectedMember.user?.email}
              </span>{' '}
              from this organization? They will lose all access to this tenant's data immediately.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowRemoveMemberModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeMemberMutation.mutate(selectedMember.user_id)}
                disabled={removeMemberMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {removeMemberMutation.isPending ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Invitation */}
      {showCancelInviteModal && selectedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cancel Invitation</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to cancel the invitation sent to{' '}
              <span className="font-semibold text-slate-900">{selectedInvite.email}</span>? The invitation link will be
              rendered invalid.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelInviteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => cancelInviteMutation.mutate(selectedInvite.id)}
                disabled={cancelInviteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {cancelInviteMutation.isPending ? 'Cancelling...' : 'Cancel Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
