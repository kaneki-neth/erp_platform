<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_owner_can_list_users_with_filters(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/users?search=Sarah&status=active');

        $response->assertStatus(200)
            ->assertJsonPath('data.data.0.email', 'staff@acme.com');
    }

    public function test_unauthorized_user_without_permission_cannot_list_users(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        // Remove roles from staff
        $staff->roles()->detach();

        $response = $this->actingAs($staff)->getJson('/api/v1/users');

        $response->assertStatus(403);
    }

    public function test_authorized_user_can_create_user(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staffRole = Role::where('slug', 'staff')->first();

        $response = $this->actingAs($owner)->postJson('/api/v1/users', [
            'name' => 'Jane Smith',
            'email' => 'jane@acme.com',
            'password' => 'password123',
            'status' => 'active',
            'roles' => [$staffRole->id],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Jane Smith')
            ->assertJsonPath('data.email', 'jane@acme.com');

        $this->assertDatabaseHas('users', [
            'email' => 'jane@acme.com',
            'organization_id' => $owner->organization_id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user.create',
            'organization_id' => $owner->organization_id,
        ]);
    }

    public function test_unauthorized_user_cannot_create_user(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($staff)->postJson('/api/v1/users', [
            'name' => 'Hacker User',
            'email' => 'hacker@acme.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_authorized_user_can_show_user(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/users/{$staff->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $staff->id)
            ->assertJsonPath('data.email', 'staff@acme.com');
    }

    public function test_authorized_user_can_update_user_and_status(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($owner)->putJson("/api/v1/users/{$staff->id}", [
            'name' => 'Sarah Connor Updated',
            'status' => 'inactive',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Sarah Connor Updated')
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'name' => 'Sarah Connor Updated',
            'status' => 'inactive',
        ]);
    }

    public function test_cannot_delete_self_or_owner(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        // Try deleting own account
        $response = $this->actingAs($owner)->deleteJson("/api/v1/users/{$owner->id}");
        $response->assertStatus(422);
    }

    public function test_authorized_user_can_delete_user(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($owner)->deleteJson("/api/v1/users/{$staff->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('users', [
            'id' => $staff->id,
        ]);
    }

    public function test_authorized_user_can_get_and_sync_roles(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $adminRole = Role::where('slug', 'admin')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/users/{$staff->id}/roles");
        $response->assertStatus(200);

        $syncResponse = $this->actingAs($owner)->putJson("/api/v1/users/{$staff->id}/roles", [
            'roles' => [$adminRole->id],
        ]);
        $syncResponse->assertStatus(200);

        $this->assertTrue($staff->fresh()->roles->contains('id', $adminRole->id));
    }
}
