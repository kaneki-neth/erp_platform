<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    use ApiResponse;

    public function current(Request $request): JsonResponse
    {
        $organization = TenantContext::getTenant() ?? $request->user()->organization;

        if (! $organization) {
            return $this->error('No active organization found.', 404);
        }

        $organization->load(['modules' => function ($query) {
            $query->wherePivot('is_enabled', true);
        }]);

        return $this->success($organization, 'Current organization profile retrieved.');
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.update')) {
            return $this->error('Unauthorized to update organization settings.', 403);
        }

        $organization = TenantContext::getTenant() ?? $user->organization;

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'settings' => ['sometimes', 'array'],
        ]);

        $organization->update($validated);

        AuditLog::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'action' => 'organization.update',
            'subject_type' => get_class($organization),
            'subject_id' => $organization->id,
            'metadata' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($organization, 'Organization updated successfully.');
    }
}
