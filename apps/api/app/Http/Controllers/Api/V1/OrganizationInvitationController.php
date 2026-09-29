<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationInvitationController extends Controller
{
    use ApiResponse;

    public function index(Request $request, int $organizationId): JsonResponse
    {
        $user = $request->user();
        $organization = Organization::find($organizationId);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if (! $user->is_owner && ! $user->hasPermission('organizations.invitations.view', $organizationId) && ! $user->hasPermission('organizations.members.view', $organizationId)) {
            return $this->error('Unauthorized to view invitations.', 403);
        }

        $invitations = OrganizationInvitation::with(['role', 'invitedBy'])
            ->where('organization_id', $organizationId)
            ->orderBy('id', 'desc')
            ->get();

        return $this->success($invitations, 'Organization invitations retrieved.');
    }

    public function store(Request $request, int $organizationId): JsonResponse
    {
        $user = $request->user();
        $organization = Organization::find($organizationId);

        if (! $organization) {
            return $this->error('Organization not found.', 404);
        }

        if (! $user->is_owner && ! $user->hasPermission('organizations.invitations.create', $organizationId) && ! $user->hasPermission('organizations.members.create', $organizationId)) {
            return $this->error('Unauthorized to create invitations.', 403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        // Check if active pending invitation already exists for this email
        $existing = OrganizationInvitation::where('organization_id', $organizationId)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return $this->error('A pending invitation already exists for this email.', 422);
        }

        $token = Str::random(48);
        $days = $validated['expires_in_days'] ?? 7;

        $invitation = OrganizationInvitation::create([
            'organization_id' => $organizationId,
            'invited_by_user_id' => $user->id,
            'role_id' => $validated['role_id'] ?? null,
            'email' => $validated['email'],
            'token' => $token,
            'status' => 'pending',
            'expires_at' => now()->addDays($days),
        ]);

        AuditLog::create([
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'action' => 'invitation.create',
            'subject_type' => OrganizationInvitation::class,
            'subject_id' => $invitation->id,
            'metadata' => ['email' => $invitation->email, 'role_id' => $invitation->role_id],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($invitation->load(['role', 'organization']), 'Invitation created successfully.', 201);
    }

    public function show(string $token): JsonResponse
    {
        $invitation = OrganizationInvitation::with(['organization', 'role'])
            ->where('token', $token)
            ->first();

        if (! $invitation) {
            return $this->error('Invalid invitation token.', 404);
        }

        if ($invitation->isExpired()) {
            return $this->error('This invitation has expired.', 410);
        }

        if ($invitation->status !== 'pending') {
            return $this->error("This invitation has already been {$invitation->status}.", 422);
        }

        return $this->success($invitation, 'Invitation details retrieved.');
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        $user = $request->user();
        $invitation = OrganizationInvitation::where('token', $token)->first();

        if (! $invitation) {
            return $this->error('Invalid invitation token.', 404);
        }

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);
            return $this->error('This invitation has expired.', 410);
        }

        if ($invitation->status !== 'pending') {
            return $this->error("This invitation is no longer active (status: {$invitation->status}).", 422);
        }

        $membership = $invitation->accept($user);

        AuditLog::create([
            'organization_id' => $invitation->organization_id,
            'user_id' => $user->id,
            'action' => 'invitation.accept',
            'subject_type' => OrganizationInvitation::class,
            'subject_id' => $invitation->id,
            'metadata' => ['accepted_user_id' => $user->id],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success($membership->load(['organization', 'role']), 'Invitation accepted successfully.');
    }

    public function cancel(Request $request, int $organizationId, int $invitationId): JsonResponse
    {
        $user = $request->user();
        if (! $user->is_owner && ! $user->hasPermission('organizations.invitations.cancel', $organizationId) && ! $user->hasPermission('organizations.members.delete', $organizationId)) {
            return $this->error('Unauthorized to cancel invitations.', 403);
        }

        $invitation = OrganizationInvitation::where('organization_id', $organizationId)
            ->where('id', $invitationId)
            ->first();

        if (! $invitation) {
            return $this->error('Invitation not found.', 404);
        }

        $invitation->update(['status' => 'cancelled']);

        AuditLog::create([
            'organization_id' => $organizationId,
            'user_id' => $user->id,
            'action' => 'invitation.cancel',
            'subject_type' => OrganizationInvitation::class,
            'subject_id' => $invitation->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->success(null, 'Invitation cancelled successfully.');
    }
}
