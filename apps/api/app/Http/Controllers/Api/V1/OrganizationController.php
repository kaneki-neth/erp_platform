<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use App\Services\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.view') && ! $user->hasPermission('organizations.manage')) {
            // Standard users only see their own joined organizations
            $orgIds = $user->memberships()->where('status', 'active')->pluck('organization_id')
                ->push($user->organization_id)
                ->unique();

            $query = Organization::whereIn('id', $orgIds);
        } else {
            // Platform admin sees all organizations
            $query = Organization::query();
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('legal_name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $organizations = $query->withCount(['members', 'roles'])
            ->orderBy('id', 'desc')
            ->paginate($request->integer('per_page', 15));

        return $this->success($organizations, 'Organizations retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.create') && ! $user->hasPermission('organizations.manage')) {
            return $this->error('Unauthorized to create organizations.', 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:organizations,slug'],
            'code' => ['nullable', 'string', 'max:50', 'unique:organizations,code'],
            'description' => ['nullable', 'string', 'max:1000'],
            'domain' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'locale' => ['nullable', 'string', 'max:20'],
            'currency' => ['nullable', 'string', 'max:10'],
            'settings' => ['nullable', 'array'],
            // Optional owner setup: existing user email or new user credentials
            'owner_email' => ['nullable', 'email'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_password' => ['nullable', 'string', 'min:8'],
        ]);

        $slug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);
        if (Organization::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . uniqid();
        }

        $code = ! empty($validated['code']) ? strtoupper($validated['code']) : strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $validated['name']), 0, 6) . rand(100, 999));

        $organization = DB::transaction(function () use ($validated, $slug, $code, $user) {
            $org = Organization::create([
                'name' => $validated['name'],
                'legal_name' => $validated['legal_name'] ?? null,
                'slug' => $slug,
                'code' => $code,
                'description' => $validated['description'] ?? null,
                'domain' => $validated['domain'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'website' => $validated['website'] ?? null,
                'address' => $validated['address'] ?? null,
                'status' => 'active',
                'timezone' => $validated['timezone'] ?? 'UTC',
                'locale' => $validated['locale'] ?? 'en',
                'currency' => $validated['currency'] ?? 'USD',
                'settings' => $validated['settings'] ?? [],
            ]);

            // Create default Administrator role for the new organization
            $adminRole = Role::create([
                'organization_id' => $org->id,
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full administrative access to organization resources',
                'is_system' => true,
            ]);

            // Attach all core permissions to the admin role
            $allPerms = \App\Models\Permission::all();
            $adminRole->permissions()->sync($allPerms->pluck('id'));

            // Setup owner
            $ownerUser = null;
            if (! empty($validated['owner_email'])) {
                $ownerUser = User::withoutGlobalScopes()->where('email', $validated['owner_email'])->first();
                if (! $ownerUser && ! empty($validated['owner_password'])) {
                    $ownerUser = User::create([
                        'organization_id' => $org->id,
                        'name' => $validated['owner_name'] ?? 'Organization Admin',
                        'email' => $validated['owner_email'],
                        'password' => Hash::make($validated['owner_password']),
                        'is_owner' => false,
                        'status' => 'active',
                    ]);
                }
            }

            if (! $ownerUser) {
                $ownerUser = $user;
            }

            // Establish Membership
            OrganizationMembership::create([
                'user_id' => $ownerUser->id,
                'organization_id' => $org->id,
                'role_id' => $adminRole->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $ownerUser->roles()->syncWithoutDetaching([$adminRole->id]);

            AuditLog::create([
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'action' => 'organization.create',
                'subject_type' => Organization::class,
                'subject_id' => $org->id,
                'metadata' => ['name' => $org->name, 'code' => $org->code, 'owner_id' => $ownerUser->id],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $org;
        });

        return $this->success($organization->loadCount(['members', 'roles']), 'Organization created successfully.', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $organization = Organization::withCount(['members', 'roles'])->find($id);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        // Authorization check: platform owner or active member of this organization
        $hasAccess = $user->is_owner || 
            ($user->organization_id == $organization->id) ||
            $user->memberships()->where('organization_id', $organization->id)->where('status', 'active')->exists();

        if (! $hasAccess && ! $user->hasPermission('organizations.view')) {
            return $this->error('Unauthorized to view this organization.', 403);
        }

        $organization->load(['modules' => function ($query) {
            $query->wherePivot('is_enabled', true);
        }]);

        return $this->success($organization, 'Organization details retrieved.');
    }

    public function update(Request $request, ?int $id = null): JsonResponse
    {
        $user = $request->user();
        
        $orgId = $id ?? TenantContext::getTenantId() ?? $user->organization_id;
        $organization = Organization::find($orgId);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if (! $user->is_owner && ! $user->hasPermission('organizations.update', $organization->id) && ! $user->hasPermission('organizations.manage')) {
            return $this->error('Unauthorized to update organization details.', 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('organizations', 'code')->ignore($organization->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'domain' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['sometimes', 'string', 'max:50'],
            'locale' => ['sometimes', 'string', 'max:20'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'settings' => ['sometimes', 'array'],
        ]);

        $organization->update($validated);

        AuditLog::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'action' => 'organization.update',
            'subject_type' => Organization::class,
            'subject_id' => $organization->id,
            'metadata' => ['updated_fields' => array_keys($validated)],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($organization, 'Organization updated successfully.');
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.manage')) {
            return $this->error('Unauthorized to update organization status.', 403);
        }

        $organization = Organization::find($id);
        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive,suspended,archived'],
        ]);

        $organization->update(['status' => $validated['status']]);

        AuditLog::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'action' => 'organization.status.update',
            'subject_type' => Organization::class,
            'subject_id' => $organization->id,
            'metadata' => ['status' => $validated['status']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($organization, 'Organization status updated successfully.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.delete') && ! $user->hasPermission('organizations.manage')) {
            return $this->error('Unauthorized to delete organizations.', 403);
        }

        $organization = Organization::find($id);
        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if ($organization->id === TenantContext::getTenantId() && ! $user->is_owner) {
            return $this->error('Cannot delete the organization you are currently active in.', 422);
        }

        $organization->delete();

        AuditLog::create([
            'organization_id' => $id,
            'user_id' => $user->id,
            'action' => 'organization.delete',
            'subject_type' => Organization::class,
            'subject_id' => $id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success(null, 'Organization deleted successfully.');
    }

    public function current(Request $request): JsonResponse
    {
        $organization = TenantContext::getTenant() ?? $request->user()->organization;

        if (! $organization) {
            return $this->error('No active organization found.', 404);
        }

        $organization->loadCount(['members', 'roles']);
        $organization->load(['modules' => function ($query) {
            $query->wherePivot('is_enabled', true);
        }]);

        return $this->success($organization, 'Current organization profile retrieved.');
    }

    public function updateCurrentSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = TenantContext::getTenant() ?? $user->organization;

        if (! $organization) {
            return $this->error('No active organization found.', 404);
        }

        if (! $user->is_owner && ! $user->hasPermission('organizations.settings.update') && ! $user->hasPermission('organizations.update')) {
            return $this->error('Unauthorized to update organization settings.', 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['sometimes', 'string', 'max:50'],
            'locale' => ['sometimes', 'string', 'max:20'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'settings' => ['sometimes', 'array'],
        ]);

        $organization->update($validated);

        AuditLog::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'action' => 'organization.settings.update',
            'subject_type' => Organization::class,
            'subject_id' => $organization->id,
            'metadata' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($organization, 'Organization settings updated successfully.');
    }

    public function switch(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'organization_id' => ['required', 'exists:organizations,id'],
        ]);

        $targetOrg = Organization::find($validated['organization_id']);

        if (! $targetOrg || $targetOrg->status !== 'active') {
            return $this->error('Target organization is unavailable or inactive.', 422);
        }

        $hasAccess = $user->is_owner || 
            ($user->organization_id == $targetOrg->id) ||
            $user->memberships()->where('organization_id', $targetOrg->id)->where('status', 'active')->exists();

        if (! $hasAccess) {
            return $this->error('You do not have an active membership in this organization.', 403);
        }

        TenantContext::setTenant($targetOrg);

        AuditLog::create([
            'organization_id' => $targetOrg->id,
            'user_id' => $user->id,
            'action' => 'organization.switch',
            'subject_type' => Organization::class,
            'subject_id' => $targetOrg->id,
            'metadata' => ['target_organization_name' => $targetOrg->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        // Calculate permissions for the newly selected organization
        $effectivePermissions = $user->roles()
            ->where(function ($q) use ($targetOrg) {
                $q->where('roles.organization_id', $targetOrg->id)
                  ->orWhereNull('roles.organization_id');
            })
            ->with('permissions')
            ->get()
            ->flatMap->permissions->pluck('slug')->unique()->values();

        return $this->success([
            'organization' => $targetOrg,
            'permissions' => $effectivePermissions,
        ], "Switched context to {$targetOrg->name} successfully.");
    }

    public function userOrganizations(Request $request): JsonResponse
    {
        $user = $request->user();

        $activeOrganizations = $user->is_owner 
            ? Organization::where('status', 'active')->withCount(['members'])->get()
            : $user->organizations()->wherePivot('status', 'active')->withCount(['members'])->get();

        if ($activeOrganizations->isEmpty() && $user->organization) {
            $activeOrganizations = collect([$user->organization->loadCount(['members'])]);
        }

        return $this->success($activeOrganizations, 'User organizations retrieved successfully.');
    }
}
