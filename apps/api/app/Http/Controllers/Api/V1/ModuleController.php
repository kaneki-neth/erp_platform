<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Module;
use App\Models\OrganizationModule;
use App\Services\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $tenantId = TenantContext::getTenantId();

        $modules = Module::all()->map(function ($module) use ($tenantId) {
            $orgModule = OrganizationModule::where('organization_id', $tenantId)
                ->where('module_id', $module->id)
                ->first();

            return [
                'id' => $module->id,
                'key' => $module->key,
                'name' => $module->name,
                'description' => $module->description,
                'is_core' => $module->is_core,
                'status' => $module->status,
                'is_enabled' => $orgModule ? (bool) $orgModule->is_enabled : false,
                'settings' => $orgModule ? $orgModule->settings : null,
            ];
        });

        return $this->success($modules, 'Platform modules retrieved successfully.');
    }

    public function toggle(Request $request, string $key): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('modules.manage')) {
            return $this->error('Unauthorized to configure organization modules.', 403);
        }

        $module = Module::where('key', $key)->first();
        if (! $module) {
            return $this->error('Module not found.', 404);
        }

        $tenantId = TenantContext::getTenantId();

        $orgModule = OrganizationModule::firstOrNew([
            'organization_id' => $tenantId,
            'module_id' => $module->id,
        ]);

        $isEnabled = $request->boolean('is_enabled', ! $orgModule->is_enabled);
        $orgModule->is_enabled = $isEnabled;
        $orgModule->save();

        AuditLog::create([
            'organization_id' => $tenantId,
            'user_id' => $authUser->id,
            'action' => 'module.toggle',
            'subject_type' => Module::class,
            'subject_id' => $module->id,
            'metadata' => ['key' => $module->key, 'is_enabled' => $isEnabled],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success([
            'module' => $module->key,
            'is_enabled' => $isEnabled,
        ], 'Module state updated successfully.');
    }
}
