<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_authorized_user_can_list_roles_with_counts(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'is_system',
                        'users_count',
                        'permissions_count',
                        'permissions',
                    ],
                ],
            ]);
    }

    public function test_authorized_user_can_create_custom_role_with_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $perm = Permission::where('slug', 'users.view')->first();

        $response = $this->actingAs($owner)->postJson('/api/v1/roles', [
            'name' => 'Supervisor',
            'description' => 'Shift supervisor with partial privileges',
            'permissions' => [$perm->id],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Supervisor')
            ->assertJsonPath('data.slug', 'supervisor')
            ->assertJsonPath('data.is_system', false);

        $this->assertDatabaseHas('roles', [
            'name' => 'Supervisor',
            'slug' => 'supervisor',
            'organization_id' => $owner->organization_id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'role.create',
            'organization_id' => $owner->organization_id,
        ]);
    }

    public function test_unauthorized_user_cannot_create_role(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();

        $response = $this->actingAs($staff)->postJson('/api/v1/roles', [
            'name' => 'Manager',
        ]);

        $response->assertStatus(403);
    }

    public function test_authorized_user_can_show_role(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $role = Role::where('slug', 'admin')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $role->id)
            ->assertJsonPath('data.slug', 'admin');
    }

    public function test_authorized_user_can_update_role_and_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $customRole = Role::create([
            'organization_id' => $owner->organization_id,
            'name' => 'Cashier',
            'slug' => 'cashier',
            'is_system' => false,
        ]);
        $perm = Permission::where('slug', 'users.view')->first();

        $response = $this->actingAs($owner)->putJson("/api/v1/roles/{$customRole->id}", [
            'name' => 'Senior Cashier',
            'description' => 'Updated cashier description',
            'permissions' => [$perm->id],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Senior Cashier')
            ->assertJsonPath('data.description', 'Updated cashier description');

        $this->assertTrue($customRole->fresh()->permissions->contains('id', $perm->id));
    }

    public function test_cannot_delete_system_roles(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $systemRole = Role::where('slug', 'admin')->where('is_system', true)->first();

        $response = $this->actingAs($owner)->deleteJson("/api/v1/roles/{$systemRole->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'System roles cannot be deleted.');
    }

    public function test_cannot_delete_role_assigned_to_users(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $staffRole = Role::where('slug', 'staff')->first();

        $response = $this->actingAs($owner)->deleteJson("/api/v1/roles/{$staffRole->id}");

        $response->assertStatus(422);
    }

    public function test_can_delete_unassigned_custom_role(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $customRole = Role::create([
            'organization_id' => $owner->organization_id,
            'name' => 'Temp Role',
            'slug' => 'temp-role',
            'is_system' => false,
        ]);

        $response = $this->actingAs($owner)->deleteJson("/api/v1/roles/{$customRole->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('roles', ['id' => $customRole->id]);
    }

    public function test_can_get_and_sync_role_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $customRole = Role::create([
            'organization_id' => $owner->organization_id,
            'name' => 'Auditor',
            'slug' => 'auditor',
            'is_system' => false,
        ]);
        $perm = Permission::where('slug', 'roles.view')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/roles/{$customRole->id}/permissions");
        $response->assertStatus(200);

        $syncResponse = $this->actingAs($owner)->putJson("/api/v1/roles/{$customRole->id}/permissions", [
            'permissions' => [$perm->id],
        ]);
        $syncResponse->assertStatus(200);

        $this->assertTrue($customRole->fresh()->permissions->contains('id', $perm->id));
    }
}
