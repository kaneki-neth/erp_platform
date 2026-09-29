<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        // Support tenant resolution by matching user email
        $user = User::withoutGlobalScopes()
            ->with(['organization', 'roles.permissions'])
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return $this->error('Invalid credentials provided.', 401);
        }

        if ($user->status !== 'active') {
            return $this->error('Your account is currently inactive.', 403);
        }

        if ($user->organization && $user->organization->status !== 'active') {
            return $this->error('Your organization account is inactive.', 403);
        }

        $deviceName = $credentials['device_name'] ?? 'web-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        // Record audit log
        AuditLog::create([
            'organization_id' => $user->organization_id,
            'user_id' => $user->id,
            'action' => 'auth.login',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'metadata' => ['device' => $deviceName],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $activeOrganizations = $user->is_owner 
            ? \App\Models\Organization::where('status', 'active')->get(['id', 'name', 'slug', 'code', 'status'])
            : $user->getActiveOrganizations()->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'code' => $org->code,
                'status' => $org->status,
                'role' => $org->pivot->role_id ? \App\Models\Role::find($org->pivot->role_id)?->name : null,
            ]);

        // If user has no memberships yet, fallback to primary organization
        if ($activeOrganizations->isEmpty() && $user->organization) {
            $activeOrganizations = collect([$user->organization]);
        }

        return $this->success([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_owner' => $user->is_owner,
                'organization' => $user->organization,
                'organizations' => $activeOrganizations,
                'roles' => $user->roles->pluck('slug'),
                'permissions' => $user->roles->flatMap->permissions->pluck('slug')->unique()->values(),
            ],
        ], 'Authentication successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()->delete();

            AuditLog::create([
                'organization_id' => \App\Services\TenantContext::getTenantId() ?? $user->organization_id,
                'user_id' => $user->id,
                'action' => 'auth.logout',
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        return $this->success(null, 'Successfully logged out.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['organization', 'roles.permissions']);
        $currentOrg = \App\Services\TenantContext::getTenant() ?? $user->organization;

        $activeOrganizations = $user->is_owner 
            ? \App\Models\Organization::where('status', 'active')->get(['id', 'name', 'slug', 'code', 'status'])
            : $user->getActiveOrganizations()->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'code' => $org->code,
                'status' => $org->status,
                'role' => $org->pivot->role_id ? \App\Models\Role::find($org->pivot->role_id)?->name : null,
            ]);

        if ($activeOrganizations->isEmpty() && $user->organization) {
            $activeOrganizations = collect([$user->organization]);
        }

        // Calculate permissions for current organization context
        $effectivePermissions = $user->roles()
            ->where(function ($q) use ($currentOrg) {
                if ($currentOrg) {
                    $q->where('roles.organization_id', $currentOrg->id)
                      ->orWhereNull('roles.organization_id');
                }
            })
            ->with('permissions')
            ->get()
            ->flatMap->permissions->pluck('slug')->unique()->values();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_owner' => $user->is_owner,
            'organization' => $currentOrg,
            'organizations' => $activeOrganizations,
            'roles' => $user->roles->pluck('slug'),
            'permissions' => $effectivePermissions,
        ], 'Authenticated user profile retrieved.');
    }
}
