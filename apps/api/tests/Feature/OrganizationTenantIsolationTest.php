<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_user_cannot_access_members_of_unauthorized_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        // Sarah Connor (staff in Acme only) tries to query Global Dynamics members
        $response = $this->actingAs($staff)->getJson("/api/v1/organizations/{$globalOrg->id}/members");

        $response->assertStatus(403);
    }

    public function test_user_cannot_add_member_to_unauthorized_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($staff)->postJson("/api/v1/organizations/{$globalOrg->id}/members", [
            'email' => 'infiltrator@example.com',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_update_settings_of_another_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($staff)->putJson("/api/v1/organizations/{$globalOrg->id}", [
            'name' => 'Hacked Global Dynamics',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_access_invitations_of_another_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($staff)->getJson("/api/v1/organizations/{$globalOrg->id}/invitations");

        $response->assertStatus(403);
    }
}
