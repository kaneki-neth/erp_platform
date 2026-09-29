<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Database\Seeders\PlatformSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationContextAndSwitchingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformSeeder::class);
    }

    public function test_user_can_retrieve_available_organizations(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();

        $response = $this->actingAs($owner)->getJson('/api/v1/organizations/user-organizations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
            ]);

        $slugs = collect($response->json('data'))->pluck('slug');
        $this->assertTrue($slugs->contains('acme'));
        $this->assertTrue($slugs->contains('global'));
    }

    public function test_user_can_switch_organization_context(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($owner)->postJson('/api/v1/organizations/switch', [
            'organization_id' => $globalOrg->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.organization.slug', 'global');
    }

    public function test_unauthorized_user_cannot_switch_to_unjoined_organization(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        $response = $this->actingAs($staff)->postJson('/api/v1/organizations/switch', [
            'organization_id' => $globalOrg->id,
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'You do not have an active membership in this organization.');
    }

    public function test_tenant_context_is_dynamically_applied_via_header(): void
    {
        $owner = User::withoutGlobalScopes()->where('email', 'admin@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        // Acting as Acme user but sending X-Organization-Id: globalOrg->id
        $response = $this->actingAs($owner)
            ->withHeader('X-Organization-Id', (string) $globalOrg->id)
            ->getJson('/api/v1/organizations/current');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'global');
    }

    public function test_unauthorized_header_context_is_rejected(): void
    {
        $staff = User::withoutGlobalScopes()->where('email', 'staff@acme.com')->first();
        $globalOrg = Organization::where('slug', 'global')->first();

        // Staff attempts cross-tenant request via header
        $response = $this->actingAs($staff)
            ->withHeader('X-Organization-Id', (string) $globalOrg->id)
            ->getJson('/api/v1/organizations/current');

        $response->assertStatus(403);
    }
}
