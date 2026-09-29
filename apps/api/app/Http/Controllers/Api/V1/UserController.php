<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\TenantContext;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.view')) {
            return $this->error('Unauthorized to view users.', 403);
        }

        $query = User::with(['roles.permissions']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($roleId = $request->input('role_id')) {
            $query->whereHas('roles', function ($q) use ($roleId) {
                $q->where('roles.id', $roleId);
            });
        }

        $users = $query->orderBy('id', 'desc')->paginate($request->integer('per_page', 15));

        return $this->success($users, 'Organization users retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.create')) {
            return $this->error('Unauthorized to create users.', 403);
        }

        $tenantId = TenantContext::getTenantId();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->where(fn ($query) => $query->where('organization_id', $tenantId)),
            ],
            'password' => ['required', 'string', 'min:8'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        $user = User::create([
            'organization_id' => $tenantId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'] ?? 'active',
            'is_owner' => false,
        ]);

        if (! empty($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        AuditLog::create([
            'organization_id' => $tenantId,
            'user_id' => $authUser->id,
            'action' => 'user.create',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'metadata' => [
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'roles' => $validated['roles'] ?? [],
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($user->load('roles.permissions'), 'User created successfully.', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.view')) {
            return $this->error('Unauthorized to view users.', 403);
        }

        $user = User::with('roles.permissions')->find($id);

        if (! $user) {
            return $this->error('User not found in your organization.', 404);
        }

        return $this->success($user, 'User details retrieved.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.update')) {
            return $this->error('Unauthorized to update users.', 403);
        }

        $user = User::find($id);
        if (! $user) {
            return $this->error('User not found in your organization.', 404);
        }

        $tenantId = TenantContext::getTenantId();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                Rule::unique('users')->where(fn ($query) => $query->where('organization_id', $tenantId))->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'status' => ['sometimes', 'in:active,inactive,suspended'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if (array_key_exists('roles', $validated)) {
            $user->roles()->sync($validated['roles'] ?? []);
        }

        AuditLog::create([
            'organization_id' => $tenantId,
            'user_id' => $authUser->id,
            'action' => 'user.update',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'metadata' => ['updated_fields' => array_keys($validated)],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($user->load('roles.permissions'), 'User updated successfully.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.delete')) {
            return $this->error('Unauthorized to delete users.', 403);
        }

        $user = User::find($id);
        if (! $user) {
            return $this->error('User not found in your organization.', 404);
        }

        if ($user->id === $authUser->id) {
            return $this->error('Cannot delete your own account.', 422);
        }

        if ($user->is_owner) {
            return $this->error('Organization owner account cannot be deleted.', 422);
        }

        $user->roles()->detach();
        $user->delete();

        AuditLog::create([
            'organization_id' => TenantContext::getTenantId(),
            'user_id' => $authUser->id,
            'action' => 'user.delete',
            'subject_type' => User::class,
            'subject_id' => $id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success(null, 'User deleted successfully.');
    }

    public function getRoles(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.view')) {
            return $this->error('Unauthorized to view user roles.', 403);
        }

        $user = User::with('roles.permissions')->find($id);
        if (! $user) {
            return $this->error('User not found in your organization.', 404);
        }

        return $this->success($user->roles, 'User roles retrieved successfully.');
    }

    public function syncRoles(Request $request, int $id): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('users.update') && ! $authUser->hasPermission('roles.manage')) {
            return $this->error('Unauthorized to manage user roles.', 403);
        }

        $user = User::find($id);
        if (! $user) {
            return $this->error('User not found in your organization.', 404);
        }

        $validated = $request->validate([
            'roles' => ['present', 'array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        $user->roles()->sync($validated['roles']);

        AuditLog::create([
            'organization_id' => TenantContext::getTenantId(),
            'user_id' => $authUser->id,
            'action' => 'user.roles.update',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'metadata' => ['assigned_roles' => $validated['roles']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($user->load('roles.permissions'), 'User roles updated successfully.');
    }
}
