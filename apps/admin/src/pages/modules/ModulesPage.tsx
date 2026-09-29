import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleApi } from '../../api/modules';
import { Boxes, Sparkles } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ModulesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules-list'],
    queryFn: moduleApi.getModules,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      moduleApi.toggleModule(key, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules-list'] });
      queryClient.invalidateQueries({ queryKey: ['current-organization'] });
    },
  });

  const handleToggle = (key: string, currentStatus: boolean) => {
    toggleMutation.mutate({ key, isEnabled: !currentStatus });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Boxes className="w-6 h-6 text-emerald-600" />
          <span>Platform Modules</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Enable or disable business modules for this tenant organization without altering core architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Loading modular capabilities...
          </div>
        ) : (
          modules?.map((mod) => (
            <div
              key={mod.key}
              className={`bg-white rounded-xl border p-6 flex flex-col justify-between transition shadow-sm ${
                mod.is_enabled
                  ? 'border-emerald-200 ring-1 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {mod.key.toUpperCase().slice(0, 3)}
                  </div>
                  {mod.is_enabled ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : mod.status === 'coming_soon' ? (
                    <Badge variant="warning">Coming Soon</Badge>
                  ) : (
                    <Badge variant="neutral">Disabled</Badge>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-4">{mod.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                  {mod.description || 'Business capability module.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">module: {mod.key}</span>
                {mod.status !== 'coming_soon' ? (
                  <button
                    onClick={() => handleToggle(mod.key, mod.is_enabled)}
                    disabled={toggleMutation.isPending}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      mod.is_enabled
                        ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {mod.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                ) : (
                  <span className="text-xs text-amber-600 font-medium flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>In Roadmap</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
