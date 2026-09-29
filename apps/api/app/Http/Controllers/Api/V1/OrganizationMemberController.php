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
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class OrganizationMemberController extends Controller
{
    use ApiResponse;

    public function index(Request $request, int $organizationId): JsonResponse
    {
        $authUser = $request->user();
        $organization = Organization::find($organizationId);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if (! $authUser->is_owner && 
            ! $authUser->hasPermission('organizations.members.view', $organizationId) && 
            ! $authUser->hasPermission('users.view', $organizationId) &&
            $authUser->organization_id != $organizationId &&
            ! $authUser->memberships()->where('organization_id', $organizationId)->where('status', 'active')->exists()) {
            return $this->error('Unauthorized to view organization members.', 403);
        }

        $query = OrganizationMembership::with(['user', 'role.permissions'])
            ->where('organization_id', $organizationId);

        if ($search = $request->input('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $members = $query->orderBy('id', 'desc')->paginate($request->integer('per_page', 15));

        return $this->success($members, 'Organization members retrieved successfully.');
    }

    public function store(Request $request, int $organizationId): JsonResponse
    {
        $authUser = $request->user();
        $organization = Organization::find($organizationId);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if (! $authUser->is_owner && ! $authUser->hasPermission('organizations.members.create', $organizationId) && ! $authUser->hasPermission('users.create', $organizationId)) {
            return $this->error('Unauthorized to add organization members.', 403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'name' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'status' => ['nullable', 'in:active,invited,suspended'],
        ]);

        // Find or create user
        $user = User::withoutGlobalScopes()->where('email', $validated['email'])->first();

        if (! $user) {
            $password = ! empty($validated['password']) ? $validated['password'] : 'Password123!';
            $user = User::create([
                'organization_id' => $organizationId,
                'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                'email' => $validated['email'],
                'password' => Hash::make($password),
                'is_owner' => false,
                'status' => 'active',
            ]);
        }

        // Check if membership already exists
        $existing = OrganizationMembership::where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->first();

        if ($existing) {
            return $this->error('User is already a member of this organization.', 422);
        }

        $membership = OrganizationMembership::create([
            'user_id' => $user->id,
            'organization_id' => $organizationId,
            'role_id' => $validated['role_id'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'joined_at' => now(),
        ]);

        if (! empty($validated['role_id'])) {
            $user->roles()->syncWithoutDetaching([$validated['role_id']]);
        }

        AuditLog::create([
            'organization_id' => $organizationId,
            'user_id' => $authUser->id,
            'action' => 'member.add',
            'subject_type' => OrganizationMembership::class,
            'subject_id' => $membership->id,
            'metadata' => ['member_user_id' => $user->id, 'email' => $user->email, 'role_id' => $validated['role_id'] ?? null],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($membership->load(['user', 'role.permissions']), 'Member added to organization successfully.', 201);
    }

    public function show(Request $request, int $organizationId, int $userId): JsonResponse
    {
        $authUser = $request->user();
        $membership = OrganizationMembership::with(['user', 'role.permissions', 'organization'])
            ->where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->first();

        if (! $membership) {
            return $this->error('Organization member not found.', 404);
        }

        if (! $authUser->is_owner && 
            ! $authUser->hasPermission('organizations.members.view', $organizationId) && 
            $authUser->id !== $userId) {
            return $this->error('Unauthorized to view this member.', 403);
        }

        return $this->success($membership, 'Organization member retrieved successfully.');
    }

    public function update(Request $request, int $organizationId, int $userId): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('organizations.members.update', $organizationId) && ! $authUser->hasPermission('users.update', $organizationId)) {
            return $this->error('Unauthorized to update organization member.', 403);
        }

        $membership = OrganizationMembership::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->first();

        if (! $membership) {
            return $this->error('Organization member not found.', 404);
        }

        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
            'status' => ['sometimes', 'in:active,suspended,removed,invited'],
        ]);

        if (array_key_exists('role_id', $validated)) {
            $membership->role_id = $validated['role_id'];
            if ($validated['role_id']) {
                $membership->user->roles()->syncWithoutDetaching([$validated['role_id']]);
            }
        }

        if (isset($validated['status'])) {
            $membership->status = $validated['status'];
        }

        $membership->save();

        AuditLog::create([
            'organization_id' => $organizationId,
            'user_id' => $authUser->id,
            'action' => 'member.update',
            'subject_type' => OrganizationMembership::class,
            'subject_id' => $membership->id,
            'metadata' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($membership->load(['user', 'role.permissions']), 'Organization member updated successfully.');
    }

    public function destroy(Request $request, int $organizationId, int $userId): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->is_owner && ! $authUser->hasPermission('organizations.members.delete', $organizationId) && ! $authUser->hasPermission('users.delete', $organizationId)) {
            return $this->error('Unauthorized to remove organization members.', 403);
        }

        $membership = OrganizationMembership::where('organization_id', $organizationId)
            ->where('user_id', $userId)
            ->first();

        if (! $membership) {
            return $this->error('Organization member not found.', 404);
        }

        // Cannot remove own membership if only owner
        if ($authUser->id === $userId && $authUser->is_owner) {
            return $this->error('Organization owner cannot be removed from their own organization.', 422);
        }

        $membership->delete();

        AuditLog::create([
            'organization_id' => $organizationId,
            'user_id' => $authUser->id,
            'action' => 'member.remove',
            'subject_type' => OrganizationMembership::class,
            'subject_id' => $membership->id,
            'metadata' => ['removed_user_id' => $userId],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success(null, 'Member removed from organization successfully.');
    }
}
