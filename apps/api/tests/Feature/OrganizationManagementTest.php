<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_owner_can_list_organizations(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/organizations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'slug',
                            'code',
                            'status',
                            'members_count',
                        ],
                    ],
                ],
            ]);
    }

    public function test_authorized_user_can_create_organization_with_initial_owner(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->postJson('/api/v1/organizations', [
            'name' => 'Nexus Logistics',
            'legal_name' => 'Nexus Logistics Ltd.',
            'code' => 'NEX-001',
            'email' => 'contact@nexus.example.com',
            'currency' => 'GBP',
            'timezone' => 'Europe/London',
            'owner_email' => 'director@nexus.example.com',
            'owner_password' => 'password123',
            'owner_name' => 'Nexus Director',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Nexus Logistics')
            ->assertJsonPath('data.code', 'NEX-001');

        $this->assertDatabaseHas('organizations', [
            'name' => 'Nexus Logistics',
            'code' => 'NEX-001',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'director@nexus.example.com',
        ]);

        $this->assertDatabaseHas('organization_memberships', [
            'status' => 'active',
        ]);
    }

    public function test_unauthorized_user_cannot_create_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($staff)->postJson('/api/v1/organizations', [
            'name' => 'Illegal Org',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_can_view_current_organization(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/organizations/current');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'acme');
    }

    public function test_authorized_user_can_update_organization_settings(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->putJson('/api/v1/organizations/current/settings', [
            'name' => 'Acme Retail Solutions Global',
            'phone' => '+1 (555) 999-8888',
            'timezone' => 'America/Chicago',
            'currency' => 'CAD',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Acme Retail Solutions Global')
            ->assertJsonPath('data.phone', '+1 (555) 999-8888')
            ->assertJsonPath('data.timezone', 'America/Chicago');
    }

    public function test_authorized_user_can_update_organization_status(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $global = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($owner)->patchJson("/api/v1/organizations/{$global->id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertEquals('suspended', $global->fresh()->status);
    }
}
