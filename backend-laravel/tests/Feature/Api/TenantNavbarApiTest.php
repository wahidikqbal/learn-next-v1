<?php

namespace Tests\Feature\Api;

use App\Models\NavbarConfig;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantNavbarApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_save_draft_and_get_navbar_for_tenant(): void
    {
        $tenant = $this->createTenant('owner-navbar-1', 'tenant-navbar-1');

        $saveResponse = $this->putJson("/api/tenants/{$tenant->id}/navbar", [
            'items' => [
                [
                    'id' => 'nav-home',
                    'label' => 'Home',
                    'type' => 'link',
                    'href' => '/',
                    'hidden' => false,
                ],
                [
                    'id' => 'nav-company',
                    'label' => 'Company',
                    'type' => 'dropdown',
                    'items' => [
                        ['id' => 'about', 'label' => 'About', 'href' => '/about'],
                    ],
                ],
            ],
        ]);

        $saveResponse->assertOk()
            ->assertJsonPath('navbar.status', 'draft')
            ->assertJsonPath('navbar.versionNo', 1)
            ->assertJsonPath('navbar.items.0.id', 'nav-home');

        $getResponse = $this->getJson("/api/tenants/{$tenant->id}/navbar");
        $getResponse->assertOk()
            ->assertJsonPath('navbar.status', 'draft')
            ->assertJsonPath('navbar.items.1.type', 'dropdown');
    }

    public function test_publish_navbar_archives_previous_published_version(): void
    {
        $tenant = $this->createTenant('owner-navbar-2', 'tenant-navbar-2');

        NavbarConfig::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'version_no' => 1,
            'status' => 'published',
            'items_json' => [['id' => 'old', 'label' => 'Old', 'type' => 'link', 'href' => '/', 'hidden' => false, 'items' => []]],
            'published_at' => now(),
        ]);

        NavbarConfig::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'version_no' => 2,
            'status' => 'draft',
            'items_json' => [['id' => 'new', 'label' => 'New', 'type' => 'link', 'href' => '/', 'hidden' => false, 'items' => []]],
            'published_at' => null,
        ]);

        $publishResponse = $this->postJson("/api/tenants/{$tenant->id}/navbar/publish");
        $publishResponse->assertOk()
            ->assertJsonPath('navbar.status', 'published')
            ->assertJsonPath('navbar.versionNo', 2);

        $this->assertDatabaseHas('navbar_configs', [
            'tenant_id' => $tenant->id,
            'version_no' => 1,
            'status' => 'archived',
        ]);
        $this->assertDatabaseHas('navbar_configs', [
            'tenant_id' => $tenant->id,
            'version_no' => 2,
            'status' => 'published',
        ]);
    }

    public function test_save_draft_returns_422_for_invalid_items_payload(): void
    {
        $tenant = $this->createTenant('owner-navbar-3', 'tenant-navbar-3');

        $response = $this->putJson("/api/tenants/{$tenant->id}/navbar", [
            'items' => [
                [
                    'id' => 'broken',
                    'label' => 'Broken',
                    'type' => 'link',
                    // href missing for link type
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    private function createTenant(string $ownerUserId, string $subdomain): Tenant
    {
        return Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => $ownerUserId,
            'name' => 'Tenant Navbar',
            'subdomain' => $subdomain,
            'status' => 'draft',
        ]);
    }
}

