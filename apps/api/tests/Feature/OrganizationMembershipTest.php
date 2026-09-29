<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationMembershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_authorized_user_can_list_organization_members(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/organizations/{$org->id}/members");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'user_id',
                            'organization_id',
                            'status',
                            'user' => ['id', 'name', 'email'],
                        ],
                    ],
                ],
            ]);
    }

    public function test_authorized_user_can_add_member_to_organization(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();
        $staffRole = Role::withoutGlobalScopes()->where('organization_id', $org->id)->where('slug', 'staff')->first();

        $response = $this->actingAs($owner)->postJson("/api/v1/organizations/{$org->id}/members", [
            'email' => 'newstaff@acme.com',
            'name' => 'New Staff Member',
            'role_id' => $staffRole->id,
            'status' => 'active',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('organization_memberships', [
            'organization_id' => $org->id,
            'role_id' => $staffRole->id,
        ]);
    }

    public function test_duplicate_membership_is_rejected(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        // Attempt to add admin@acme.com who is already a member
        $response = $this->actingAs($owner)->postJson("/api/v1/organizations/{$org->id}/members", [
            'email' => 'admin@acme.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'User is already a member of this organization.');
    }

    public function test_authorized_user_can_update_member_status_and_role(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();
        $adminRole = Role::withoutGlobalScopes()->where('organization_id', $org->id)->where('slug', 'admin')->first();

        $response = $this->actingAs($owner)->putJson("/api/v1/organizations/{$org->id}/members/{$staff->id}", [
            'role_id' => $adminRole->id,
            'status' => 'suspended',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'suspended')
            ->assertJsonPath('data.role_id', $adminRole->id);

        $this->assertDatabaseHas('organization_memberships', [
            'user_id' => $staff->id,
            'organization_id' => $org->id,
            'status' => 'suspended',
        ]);
    }

    public function test_authorized_user_can_remove_member(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $org = Organization::where('slug', 'acme')->first();

        $response = $this->actingAs($owner)->deleteJson("/api/v1/organizations/{$org->id}/members/{$staff->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('organization_memberships', [
            'user_id' => $staff->id,
            'organization_id' => $org->id,
        ]);
    }
}
