<?php

namespace Tests\Feature\Api;

use App\Models\SitePage;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantPagesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_and_create_pages_for_tenant(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant A',
            'subdomain' => 'tenant-a',
            'status' => 'draft',
        ]);

        $listResponse = $this->getJson("/api/tenants/{$tenant->id}/pages");
        $listResponse->assertOk()->assertJson(['items' => []]);

        $createResponse = $this->postJson("/api/tenants/{$tenant->id}/pages", [
            'title' => 'Pricing',
            'slug' => '/pricing',
            'page_type' => 'custom',
        ]);

        $createResponse->assertCreated();
        $this->assertDatabaseHas('site_pages', [
            'tenant_id' => $tenant->id,
            'slug' => '/pricing',
            'title' => 'Pricing',
        ]);
    }

    public function test_returns_409_on_slug_conflict_within_same_tenant(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant B',
            'subdomain' => 'tenant-b',
            'status' => 'draft',
        ]);

        SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'Pricing',
            'slug' => '/pricing',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        $response = $this->postJson("/api/tenants/{$tenant->id}/pages", [
            'title' => 'Another Pricing',
            'slug' => '/pricing',
            'page_type' => 'custom',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'SLUG_CONFLICT');
    }

    public function test_reserved_slug_is_blocked_for_custom_page_create_and_update(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant Reserved',
            'subdomain' => 'tenant-reserved',
            'status' => 'draft',
        ]);

        $createResponse = $this->postJson("/api/tenants/{$tenant->id}/pages", [
            'title' => 'Product',
            'slug' => '/product',
            'page_type' => 'custom',
            'is_system' => false,
        ]);

        $createResponse->assertStatus(422)
            ->assertJsonPath('error.code', 'RESERVED_SLUG');

        $page = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'FAQ',
            'slug' => '/faq',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        $updateResponse = $this->patchJson("/api/pages/{$page->id}", [
            'slug' => '/about',
        ]);

        $updateResponse->assertStatus(422)
            ->assertJsonPath('error.code', 'RESERVED_SLUG');
    }

    public function test_can_update_page_slug_and_title(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant C',
            'subdomain' => 'tenant-c',
            'status' => 'draft',
        ]);

        $page = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'Old Title',
            'slug' => '/old-title',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        $response = $this->patchJson("/api/pages/{$page->id}", [
            'title' => 'New Title',
            'slug' => '/new-title',
        ]);

        $response->assertOk()
            ->assertJsonPath('page.title', 'New Title')
            ->assertJsonPath('page.slug', '/new-title');

        $this->assertDatabaseHas('site_pages', [
            'id' => $page->id,
            'title' => 'New Title',
            'slug' => '/new-title',
        ]);
    }

    public function test_can_get_page_detail_by_id(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant E',
            'subdomain' => 'tenant-e',
            'status' => 'draft',
        ]);

        $page = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'About',
            'slug' => '/about',
            'page_type' => 'about',
            'is_system' => true,
            'is_deleted' => false,
        ]);

        $response = $this->getJson("/api/pages/{$page->id}");
        $response->assertOk()
            ->assertJsonPath('page.id', $page->id)
            ->assertJsonPath('page.tenantSubdomain', 'tenant-e')
            ->assertJsonPath('page.blocks.schemaVersion', 1);
    }

    public function test_system_page_cannot_be_deleted_but_custom_page_can(): void
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant D',
            'subdomain' => 'tenant-d',
            'status' => 'draft',
        ]);

        $systemPage = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'Home',
            'slug' => '/',
            'page_type' => 'home',
            'is_system' => true,
            'is_deleted' => false,
        ]);

        $customPage = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'FAQ',
            'slug' => '/faq',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        $lockedResponse = $this->deleteJson("/api/pages/{$systemPage->id}");
        $lockedResponse->assertStatus(422)
            ->assertJsonPath('error.code', 'SYSTEM_PAGE_LOCKED');

        $deleteResponse = $this->deleteJson("/api/pages/{$customPage->id}");
        $deleteResponse->assertOk()->assertJson(['ok' => true]);

        $this->assertDatabaseHas('site_pages', [
            'id' => $customPage->id,
            'is_deleted' => true,
        ]);
    }

    public function test_can_list_pages_by_owner_user_id(): void
    {
        $tenantA = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant A',
            'subdomain' => 'tenant-a',
            'status' => 'draft',
        ]);

        $tenantB = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-2',
            'name' => 'Tenant B',
            'subdomain' => 'tenant-b',
            'status' => 'draft',
        ]);

        SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantA->id,
            'title' => 'Owner One Page',
            'slug' => '/owner-one',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenantB->id,
            'title' => 'Owner Two Page',
            'slug' => '/owner-two',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        $response = $this->getJson('/api/owners/owner-1/pages');
        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.title', 'Owner One Page')
            ->assertJsonPath('items.0.subdomain', 'tenant-a');
    }

    public function test_can_bootstrap_owner_website_and_return_home_page_id(): void
    {
        $response = $this->postJson('/api/owners/owner-bootstrap/sites/bootstrap', [
            'name' => 'My Website',
            'subdomain' => 'my-website',
            'template_id' => 'default',
            'home_blocks' => [
                [
                    'id' => 'hero',
                    'type' => 'hero',
                    'props' => ['heading' => 'Hello world'],
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('page.subdomain', 'my-website');

        $tenant = Tenant::query()->where('subdomain', 'my-website')->firstOrFail();
        $this->assertDatabaseHas('site_pages', [
            'tenant_id' => $tenant->id,
            'slug' => '/',
            'is_system' => true,
        ]);
        $this->assertDatabaseHas('site_pages', [
            'tenant_id' => $tenant->id,
            'slug' => '/about',
            'is_system' => true,
        ]);
        $this->assertDatabaseHas('site_pages', [
            'tenant_id' => $tenant->id,
            'slug' => '/contact',
            'is_system' => true,
        ]);
    }

    public function test_bootstrap_returns_409_on_subdomain_conflict(): void
    {
        Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant Existing',
            'subdomain' => 'conflict-subdomain',
            'status' => 'draft',
        ]);

        $response = $this->postJson('/api/owners/owner-2/sites/bootstrap', [
            'name' => 'Another Website',
            'subdomain' => 'conflict-subdomain',
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'SUBDOMAIN_CONFLICT');
    }
}
