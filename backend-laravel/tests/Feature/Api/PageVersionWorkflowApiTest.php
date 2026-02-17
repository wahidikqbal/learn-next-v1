<?php

namespace Tests\Feature\Api;

use App\Models\PageVersion;
use App\Models\SitePage;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PageVersionWorkflowApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_save_draft_with_legacy_blocks_array_payload(): void
    {
        [$tenant, $page] = $this->createTenantAndPage();

        $response = $this->putJson("/api/pages/{$page->id}/draft", [
            'blocks' => [
                [
                    'id' => 'hero',
                    'type' => 'hero',
                    'props' => ['heading' => 'Hello'],
                ],
            ],
            'seo' => ['metaTitle' => 'Draft SEO'],
        ]);

        $response->assertOk()
            ->assertJsonPath('version.status', 'draft')
            ->assertJsonPath('version.version_no', 1);

        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_no' => 1,
            'status' => 'draft',
        ]);

        $saved = PageVersion::query()->where('page_id', $page->id)->firstOrFail();
        $this->assertSame(1, $saved->blocks_json['schemaVersion']);
        $this->assertIsArray($saved->blocks_json['blocks']);
    }

    public function test_publish_is_atomic_and_uses_latest_draft(): void
    {
        [$tenant, $page] = $this->createTenantAndPage();

        PageVersion::query()->create([
            'id' => (string) Str::uuid(),
            'page_id' => $page->id,
            'version_no' => 1,
            'status' => 'published',
            'blocks_json' => ['schemaVersion' => 1, 'blocks' => []],
            'seo_json' => null,
            'published_at' => now(),
        ]);

        PageVersion::query()->create([
            'id' => (string) Str::uuid(),
            'page_id' => $page->id,
            'version_no' => 2,
            'status' => 'draft',
            'blocks_json' => ['schemaVersion' => 1, 'blocks' => [['id' => 'v2']]],
            'seo_json' => null,
        ]);

        PageVersion::query()->create([
            'id' => (string) Str::uuid(),
            'page_id' => $page->id,
            'version_no' => 3,
            'status' => 'draft',
            'blocks_json' => ['schemaVersion' => 1, 'blocks' => [['id' => 'v3']]],
            'seo_json' => null,
        ]);

        $response = $this->postJson("/api/pages/{$page->id}/publish");
        $response->assertOk()
            ->assertJsonPath('page.slug', '/pricing')
            ->assertJsonPath('page.versionNo', 3);

        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_no' => 1,
            'status' => 'archived',
        ]);

        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_no' => 3,
            'status' => 'published',
        ]);
    }

    public function test_publish_returns_422_when_no_draft_exists(): void
    {
        [$tenant, $page] = $this->createTenantAndPage();

        $response = $this->postJson("/api/pages/{$page->id}/publish");
        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'DRAFT_NOT_FOUND');
    }

    public function test_can_unpublish_latest_published_version(): void
    {
        [$tenant, $page] = $this->createTenantAndPage();

        PageVersion::query()->create([
            'id' => (string) Str::uuid(),
            'page_id' => $page->id,
            'version_no' => 1,
            'status' => 'published',
            'blocks_json' => ['schemaVersion' => 1, 'blocks' => [['id' => 'v1']]],
            'seo_json' => null,
            'published_at' => now(),
        ]);

        $response = $this->postJson("/api/pages/{$page->id}/unpublish");
        $response->assertOk()
            ->assertJsonPath('page.id', $page->id)
            ->assertJsonPath('page.publishedAt', null);

        $this->assertDatabaseHas('page_versions', [
            'page_id' => $page->id,
            'version_no' => 1,
            'status' => 'archived',
        ]);
    }

    private function createTenantAndPage(): array
    {
        $tenant = Tenant::query()->create([
            'id' => (string) Str::uuid(),
            'owner_user_id' => 'owner-1',
            'name' => 'Tenant Workflow',
            'subdomain' => 'tenant-workflow',
            'status' => 'draft',
        ]);

        $page = SitePage::query()->create([
            'id' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'title' => 'Pricing',
            'slug' => '/pricing',
            'page_type' => 'custom',
            'is_system' => false,
            'is_deleted' => false,
        ]);

        return [$tenant, $page];
    }
}
