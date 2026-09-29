import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../../api/organizations';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Languages,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Manila',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Dubai',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Australia/Sydney',
];

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'USD - US Dollar ($)' },
  { code: 'PHP', name: 'PHP - Philippine Peso (₱)' },
  { code: 'EUR', name: 'EUR - Euro (€)' },
  { code: 'GBP', name: 'GBP - British Pound (£)' },
  { code: 'JPY', name: 'JPY - Japanese Yen (¥)' },
  { code: 'CAD', name: 'CAD - Canadian Dollar ($)' },
  { code: 'AUD', name: 'AUD - Australian Dollar ($)' },
  { code: 'SGD', name: 'SGD - Singapore Dollar ($)' },
];

const COMMON_LOCALES = [
  { code: 'en', name: 'English (en)' },
  { code: 'es', name: 'Spanish (es)' },
  { code: 'fr', name: 'French (fr)' },
  { code: 'de', name: 'German (de)' },
  { code: 'ja', name: 'Japanese (ja)' },
  { code: 'zh', name: 'Chinese (zh)' },
];

export const OrganizationSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrganization, hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    code: '',
    description: '',
    domain: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    timezone: 'UTC',
    locale: 'en',
    currency: 'USD',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ['current-organization-settings', currentOrganization?.id],
    queryFn: organizationApi.getCurrent,
    enabled: !!currentOrganization,
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        legal_name: organization.legal_name || '',
        code: organization.code || '',
        description: organization.description || '',
        domain: organization.domain || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        timezone: organization.timezone || 'UTC',
        locale: organization.locale || 'en',
        currency: organization.currency || 'USD',
      });
    }
  }, [organization]);

  const updateSettingsMutation = useMutation({
    mutationFn: organizationApi.updateCurrentSettings,
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(['current-organization-settings', updatedOrg.id], updatedOrg);
      queryClient.invalidateQueries({ queryKey: ['current-organization-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
      setSuccessMessage('Organization settings updated successfully.');
      setFormError(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setSuccessMessage(null);
      setFormError(err.response?.data?.message || 'Failed to update organization settings.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    updateSettingsMutation.mutate(formData);
  };

  const canEdit =
    hasPermission('organizations.settings.update') ||
    hasPermission('organizations.settings.manage') ||
    hasPermission('organizations.manage');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
        <span>Loading organization settings...</span>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load organization settings</h3>
          <p className="text-xs mt-1">Please make sure you have an active organization selected and sufficient permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
                <Badge variant={organization.status === 'active' ? 'success' : 'danger'}>
                  {organization.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage organization profile, contact information, and regional preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>General Organization Profile</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Basic identity and legal identifiers for this tenant.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Acme Global Corporation"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Legal / Registered Name
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Acme Holdings Inc."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Organization Code
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="ACME-CORP"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Domain / Subdomain
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="acme.erp-platform.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="Enterprise tenant for commercial operations and distribution..."
              />
            </div>
          </div>
        </div>

        {/* Contact & Address Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Contact & Communication</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official contact channels and physical address for invoicing and notices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Official Email</span>
              </label>
              <input
                type="email"
                disabled={!canEdit}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="contact@acme.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Website</span>
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="https://acme.com"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Registered Address</span>
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="100 Enterprise Way, Suite 400, New York, NY 10001, USA"
              />
            </div>
          </div>
        </div>

        {/* Regional & Localization Settings Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Regional & Localization Preferences</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set the default timezone, system language, and currency formatting for all organization modules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Timezone</span>
              </label>
              <select
                disabled={!canEdit}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>Locale / Language</span>
              </label>
              <select
                disabled={!canEdit}
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {COMMON_LOCALES.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating Currency</span>
              </label>
              <select
                disabled={!canEdit}
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {COMMON_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{updateSettingsMutation.isPending ? 'Saving Settings...' : 'Save Organization Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
