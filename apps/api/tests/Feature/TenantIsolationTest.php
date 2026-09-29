<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_user_can_only_see_users_from_their_own_organization(): void
    {
        $acmeUser = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalUser = User::withoutGlobalScopes()->where('email', 'admin@global.com')->first();

        // Acme user queries user index
        $response = $this->actingAs($acmeUser)->getJson('/api/v1/users');

        $response->assertStatus(200);

        $emails = collect($response->json('data.data'))->pluck('email');
        
        $this->assertTrue($emails->contains('admin@acme.com'));
        $this->assertTrue($emails->contains('staff@acme.com'));
        $this->assertFalse($emails->contains('admin@global.com'));
    }

    public function test_user_cannot_access_user_from_different_organization_by_id(): void
    {
        $acmeUser = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalUser = User::withoutGlobalScopes()->where('email', 'admin@global.com')->first();

        // Acme user attempts to query Global user ID
        $response = $this->actingAs($acmeUser)->getJson("/api/v1/users/{$globalUser->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_update_user_from_different_organization(): void
    {
        $acmeUser = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalUser = User::withoutGlobalScopes()->where('email', 'admin@global.com')->first();

        // Acme user attempts to update Global user
        $response = $this->actingAs($acmeUser)->putJson("/api/v1/users/{$globalUser->id}", [
            'name' => 'Hacked Global User',
        ]);

        $response->assertStatus(404);

        $freshGlobal = User::withoutGlobalScopes()->find($globalUser->id);
        $this->assertNotEquals('Hacked Global User', $freshGlobal->name);
    }

    public function test_organization_modules_are_isolated_per_tenant(): void
    {
        $acmeUser = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalUser = User::withoutGlobalScopes()->where('email', 'admin@global.com')->first();

        // Check Acme modules (POS is enabled, CRM is not)
        $acmeResponse = $this->actingAs($acmeUser)->getJson('/api/v1/modules');
        $acmeModules = collect($acmeResponse->json('data'))->keyBy('key');

        $this->assertTrue($acmeModules['pos']['is_enabled']);
        $this->assertFalse($acmeModules['crm']['is_enabled']);

        // Check Global modules (CRM is enabled, POS is not)
        $globalResponse = $this->actingAs($globalUser)->getJson('/api/v1/modules');
        $globalModules = collect($globalResponse->json('data'))->keyBy('key');

        $this->assertFalse($globalModules['pos']['is_enabled']);
        $this->assertTrue($globalModules['crm']['is_enabled']);
    }

    public function test_roles_are_isolated_per_tenant(): void
    {
        $acmeUser = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalUser = User::withoutGlobalScopes()->where('email', 'admin@global.com')->first();

        // Global user creates a custom role
        $globalRole = \App\Models\Role::create([
            'organization_id' => $globalUser->organization_id,
            'name' => 'Secret Global Role',
            'slug' => 'secret-global-role',
            'is_system' => false,
        ]);

        // Acme user cannot see the global role in list
        $response = $this->actingAs($acmeUser)->getJson('/api/v1/roles');
        $response->assertStatus(200);
        $roleNames = collect($response->json('data'))->pluck('name');
        $this->assertFalse($roleNames->contains('Secret Global Role'));

        // Acme user cannot access or update global role by ID
        $this->actingAs($acmeUser)->getJson("/api/v1/roles/{$globalRole->id}")->assertStatus(404);
        $this->actingAs($acmeUser)->putJson("/api/v1/roles/{$globalRole->id}", ['name' => 'Hijacked'])->assertStatus(404);
    }
}

