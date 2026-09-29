<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_authorized_user_can_list_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/permissions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'module_key',
                    ],
                ],
            ]);
    }

    public function test_authorized_user_can_list_grouped_permissions(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/permissions?grouped=true');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'core',
                ],
            ]);
    }

    public function test_authorized_user_can_show_permission(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $perm = Permission::where('slug', 'users.view')->first();

        $response = $this->actingAs($owner)->getJson("/api/v1/permissions/{$perm->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'users.view');
    }
}
