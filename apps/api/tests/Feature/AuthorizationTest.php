<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_user_with_permission_can_access_protected_endpoint(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        // Staff has users.view
        $response = $this->actingAs($staff)->getJson('/api/v1/users');

        $response->assertStatus(200);
    }

    public function test_user_without_permission_receives_forbidden(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        // Staff does NOT have users.create
        $response = $this->actingAs($staff)->postJson('/api/v1/users', [
            'name' => 'Forbidden User',
            'email' => 'forbidden@acme.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_organization_owner_bypasses_granular_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        // Strip owner's roles to verify is_owner bypass
        $owner->roles()->detach();

        $response = $this->actingAs($owner)->getJson('/api/v1/users');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_requests_receive_unauthorized(): void
    {
        $this->getJson('/api/v1/users')->assertStatus(401);
        $this->getJson('/api/v1/roles')->assertStatus(401);
        $this->getJson('/api/v1/permissions')->assertStatus(401);
    }
}
