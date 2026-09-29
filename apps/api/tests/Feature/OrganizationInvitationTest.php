<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_authorized_user_can_create_invitation(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();
        $staffRole = Role::withoutGlobalScopes()->where('organization_id', $org->id)->where('slug', 'staff')->first();

        $response = $this->actingAs($owner)->postJson("/api/v1/organizations/{$org->id}/invitations", [
            'email' => 'invited@example.com',
            'role_id' => $staffRole->id,
            'expires_in_days' => 5,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'invited@example.com')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('organization_invitations', [
            'email' => 'invited@example.com',
            'organization_id' => $org->id,
            'status' => 'pending',
        ]);
    }

    public function test_can_view_invitation_by_token(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'testview@example.com',
            'token' => 'sample-invitation-token-123',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->getJson("/api/v1/invitations/{$invitation->token}");

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'testview@example.com')
            ->assertJsonPath('data.organization.slug', 'acme');
    }

    public function test_user_can_accept_invitation(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();
        $staffRole = Role::withoutGlobalScopes()->where('organization_id', $org->id)->where('slug', 'staff')->first();

        $newMember = User::create([
            'organization_id' => $org->id,
            'name' => 'Accepted User',
            'email' => 'accepted@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'invited_by_user_id' => $owner->id,
            'role_id' => $staffRole->id,
            'email' => 'accepted@example.com',
            'token' => 'accept-token-456',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($newMember)->postJson("/api/v1/invitations/{$invitation->token}/accept");

        $response->assertStatus(200);

        $this->assertEquals('accepted', $invitation->fresh()->status);
        $this->assertDatabaseHas('organization_memberships', [
            'user_id' => $newMember->id,
            'organization_id' => $org->id,
            'status' => 'active',
        ]);
    }

    public function test_expired_invitation_is_rejected(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'expired@example.com',
            'token' => 'expired-token-789',
            'status' => 'pending',
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($owner)->postJson("/api/v1/invitations/{$invitation->token}/accept");

        $response->assertStatus(410);
    }

    public function test_authorized_user_can_cancel_invitation(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'invited_by_user_id' => $owner->id,
            'email' => 'cancel@example.com',
            'token' => 'cancel-token-999',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($owner)->deleteJson("/api/v1/organizations/{$org->id}/invitations/{$invitation->id}");

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $invitation->fresh()->status);
    }
}
