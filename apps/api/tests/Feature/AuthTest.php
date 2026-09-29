<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@acme.com',
            'password' => 'password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'is_owner',
                        'organization' => [
                            'id',
                            'name',
                            'slug',
                        ],
                    ],
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@acme.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials provided.',
            ]);
    }

    public function test_authenticated_user_can_retrieve_profile(): void
    {
        $user = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'admin@acme.com')
            ->assertJsonPath('data.organization.slug', 'acme');
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $token = $user->createToken('test-logout-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertCount(0, $user->tokens);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $user->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'staff@acme.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson(['success' => false]);
    }

    public function test_inactive_organization_cannot_login(): void
    {
        $org = Organization::where('slug', 'acme')->first();
        $org->update(['status' => 'suspended']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@acme.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson(['success' => false]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }
}

