<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Services\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.view') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to view roles.', 403);
        }

        $query = Role::with(['permissions'])->withCount(['users', 'permissions']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $roles = $query->orderBy('is_system', 'desc')->orderBy('name', 'asc')->get();

        return $this->success($roles, 'Roles retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.create') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to create roles.', 403);
        }

        $tenantId = TenantContext::getTenantId();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('roles')->where(fn ($query) => $query->where('organization_id', $tenantId)),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $slug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['name']);

        // Ensure unique slug within organization
        $existing = Role::where('slug', $slug)->first();
        if ($existing) {
            $slug = $slug . '-' . uniqid();
        }

        $role = Role::create([
            'organization_id' => $tenantId,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_system' => false,
        ]);

        if (! empty($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        AuditLog::create([
            'organization_id' => $tenantId,
            'user_id' => $authUser->id,
            'action' => 'role.create',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'metadata' => [
                'name' => $role->name,
                'slug' => $role->slug,
                'permissions' => $validated['permissions'] ?? [],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($role->load('permissions')->loadCount(['users', 'permissions']), 'Role created successfully.', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.view') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to view roles.', 403);
        }

        $role = Role::with(['permissions', 'users'])->withCount(['users', 'permissions'])->find($id);

        if (! $role) {
            return $this->error('Role not found in your organization.', 404);
        }

        return $this->success($role, 'Role details retrieved successfully.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.update') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to update roles.', 403);
        }

        $role = Role::find($id);
        if (! $role) {
            return $this->error('Role not found in your organization.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        if (isset($validated['name']) && ! $role->is_system) {
            $role->name = $validated['name'];
        }

        if (array_key_exists('description', $validated)) {
            $role->description = $validated['description'];
        }

        $role->save();

        if (array_key_exists('permissions', $validated)) {
            $role->permissions()->sync($validated['permissions'] ?? []);
        }

        AuditLog::create([
            'organization_id' => TenantContext::getTenantId(),
            'user_id' => $authUser->id,
            'action' => 'role.update',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'metadata' => [
                'name' => $role->name,
                'permissions_count' => isset($validated['permissions']) ? count($validated['permissions']) : null,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($role->load('permissions')->loadCount(['users', 'permissions']), 'Role updated successfully.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.delete') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to delete roles.', 403);
        }

        $role = Role::withCount('users')->find($id);
        if (! $role) {
            return $this->error('Role not found in your organization.', 404);
        }

        if ($role->is_system) {
            return $this->error('System roles cannot be deleted.', 422);
        }

        if ($role->users_count > 0) {
            return $this->error('Cannot delete role while it is still assigned to users.', 422);
        }

        $role->permissions()->detach();
        $role->users()->detach();
        $role->delete();

        AuditLog::create([
            'organization_id' => TenantContext::getTenantId(),
            'user_id' => $authUser->id,
            'action' => 'role.delete',
            'subject_type' => Role::class,
            'subject_id' => $id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success(null, 'Role deleted successfully.');
    }

    public function getPermissions(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.view') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to view role permissions.', 403);
        }

        $role = Role::with('permissions')->find($id);
        if (! $role) {
            return $this->error('Role not found in your organization.', 404);
        }

        return $this->success($role->permissions, 'Role permissions retrieved successfully.');
    }

    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('roles.update') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to manage role permissions.', 403);
        }

        $role = Role::find($id);
        if (! $role) {
            return $this->error('Role not found in your organization.', 404);
        }

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role->permissions()->sync($validated['permissions']);

        AuditLog::create([
            'organization_id' => TenantContext::getTenantId(),
            'user_id' => $authUser->id,
            'action' => 'role.permissions.update',
            'subject_type' => Role::class,
            'subject_id' => $role->id,
            'metadata' => ['permissions' => $validated['permissions']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($role->load('permissions')->loadCount(['users', 'permissions']), 'Role permissions updated successfully.');
    }
}

