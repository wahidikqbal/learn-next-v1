<?php

namespace App\Domain\SitePage\Services;

use App\Domain\SitePage\Repositories\PageVersionRepository;
use App\Domain\SitePage\Repositories\SitePageRepository;
use App\Models\SitePage;
use App\Models\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SitePageService
{
    public function __construct(
        private readonly SitePageRepository $repository,
        private readonly PageVersionRepository $pageVersionRepository,
    ) {
    }

    public function listPages(string $tenantId): array
    {
        return $this->repository->listByTenant($tenantId)->map(function ($page) {
            return [
                'id' => (string) $page->id,
                'tenantId' => (string) $page->tenant_id,
                'title' => (string) $page->title,
                'slug' => (string) $page->slug,
                'pageType' => (string) $page->page_type,
                'layoutTemplate' => $page->layout_template,
                'isSystem' => (bool) $page->is_system,
                'isDeleted' => (bool) $page->is_deleted,
                'createdAt' => $page->created_at?->toISOString(),
                'updatedAt' => $page->updated_at?->toISOString(),
            ];
        })->all();
    }

    public function listPagesByOwner(string $ownerUserId): array
    {
        return $this->repository->listByOwnerUserId($ownerUserId)->map(function ($page) {
            return [
                'id' => (string) $page->id,
                'tenantId' => (string) $page->tenant_id,
                'title' => (string) $page->title,
                'slug' => (string) $page->slug,
                'pageType' => (string) $page->page_type,
                'layoutTemplate' => $page->layout_template,
                'subdomain' => (string) $page->tenant_subdomain,
                'isPublished' => (bool) $page->is_published,
                'createdAt' => $page->created_at ? Carbon::parse($page->created_at)->toISOString() : null,
                'updatedAt' => $page->updated_at ? Carbon::parse($page->updated_at)->toISOString() : null,
            ];
        })->all();
    }

    public function createPage(string $tenantId, array $payload): array
    {
        $title = trim((string) ($payload['title'] ?? ''));
        $slug = $this->normalizeSlug((string) ($payload['slug'] ?? ''));
        $pageType = trim((string) ($payload['page_type'] ?? 'custom')) ?: 'custom';
        $layoutTemplate = trim((string) ($payload['layout_template'] ?? ''));
        $isSystem = (bool) ($payload['is_system'] ?? false);

        if ($title === '') {
            return ['ok' => false, 'reason' => 'invalid_title'];
        }

        if (!$this->isValidSlug($slug)) {
            return ['ok' => false, 'reason' => 'invalid_slug'];
        }

        if ($this->isReservedSlug($slug) && !$isSystem) {
            return ['ok' => false, 'reason' => 'reserved_slug'];
        }

        try {
            $page = $this->repository->create([
                'tenant_id' => $tenantId,
                'title' => $title,
                'slug' => $slug,
                'page_type' => $pageType,
                'layout_template' => $layoutTemplate === '' ? null : $layoutTemplate,
                'is_system' => $isSystem,
                'is_deleted' => false,
            ]);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return ['ok' => false, 'reason' => 'slug_conflict'];
            }

            return ['ok' => false, 'reason' => 'unknown_error'];
        }

        return ['ok' => true, 'page' => $page];
    }

    public function updatePage(string $pageId, array $payload): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        $data = [];
        if (array_key_exists('title', $payload)) {
            $title = trim((string) $payload['title']);
            if ($title === '') {
                return ['ok' => false, 'reason' => 'invalid_title'];
            }
            $data['title'] = $title;
        }

        if (array_key_exists('slug', $payload)) {
            $slug = $this->normalizeSlug((string) $payload['slug']);
            if (!$this->isValidSlug($slug)) {
                return ['ok' => false, 'reason' => 'invalid_slug'];
            }
            if ($this->isReservedSlug($slug) && !(bool) $page->is_system) {
                return ['ok' => false, 'reason' => 'reserved_slug'];
            }
            $data['slug'] = $slug;
        }

        if (array_key_exists('layout_template', $payload)) {
            $layoutTemplate = trim((string) $payload['layout_template']);
            $data['layout_template'] = $layoutTemplate === '' ? null : $layoutTemplate;
        }

        if (array_key_exists('page_type', $payload)) {
            $pageType = trim((string) $payload['page_type']);
            if ($pageType !== '') {
                $data['page_type'] = $pageType;
            }
        }

        if (empty($data)) {
            return ['ok' => true, 'page' => $page];
        }

        try {
            $updated = $this->repository->update($page, $data);
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return ['ok' => false, 'reason' => 'slug_conflict'];
            }

            return ['ok' => false, 'reason' => 'unknown_error'];
        }

        return ['ok' => true, 'page' => $updated];
    }

    public function deletePage(string $pageId): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        if ((bool) $page->is_system) {
            return ['ok' => false, 'reason' => 'system_page_locked'];
        }

        $this->repository->softDelete($page);
        return ['ok' => true];
    }

    public function getPageDetail(string $pageId): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        $latestDraft = $this->pageVersionRepository->findLatestDraft((string) $page->id);
        $activeVersion = $latestDraft;

        if (!$activeVersion) {
            $activeVersion = $page->versions()
                ->where('status', 'published')
                ->orderByDesc('version_no')
                ->first();
        }

        $blocksEnvelope = $activeVersion?->blocks_json;
        if (!is_array($blocksEnvelope) || !array_key_exists('blocks', $blocksEnvelope)) {
            $blocksEnvelope = [
                'schemaVersion' => 1,
                'blocks' => [],
            ];
        }

        return [
            'ok' => true,
            'page' => [
                'id' => (string) $page->id,
                'tenantId' => (string) $page->tenant_id,
                'title' => (string) $page->title,
                'slug' => (string) $page->slug,
                'tenantSubdomain' => (string) $page->tenant->subdomain,
                'blocks' => $blocksEnvelope,
                'seo' => $activeVersion?->seo_json,
                'hasDraft' => (bool) $latestDraft,
            ],
        ];
    }

    public function saveDraft(string $pageId, array $payload): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        if (!array_key_exists('blocks', $payload)) {
            return ['ok' => false, 'reason' => 'invalid_blocks'];
        }

        $normalizedBlocks = $this->normalizeBlocksEnvelope($payload['blocks']);
        if ($normalizedBlocks === null) {
            return ['ok' => false, 'reason' => 'invalid_blocks'];
        }

        $seo = null;
        if (array_key_exists('seo', $payload)) {
            if (!is_array($payload['seo']) && !is_null($payload['seo'])) {
                return ['ok' => false, 'reason' => 'invalid_seo'];
            }
            $seo = is_array($payload['seo']) ? $payload['seo'] : null;
        }

        $versionNo = $this->pageVersionRepository->nextVersionNo((string) $page->id);
        $draft = $this->pageVersionRepository->createDraft(
            pageId: (string) $page->id,
            versionNo: $versionNo,
            blocksJson: $normalizedBlocks,
            seoJson: $seo,
        );

        return ['ok' => true, 'version' => $draft];
    }

    public function publishPage(string $pageId): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        $latestDraft = $this->pageVersionRepository->findLatestDraft((string) $page->id);
        if (!$latestDraft) {
            return ['ok' => false, 'reason' => 'draft_not_found'];
        }

        $published = DB::transaction(function () use ($page, $latestDraft) {
            $this->pageVersionRepository->archivePublishedByPage((string) $page->id);
            return $this->pageVersionRepository->publishVersion($latestDraft);
        });

        return [
            'ok' => true,
            'page' => [
                'id' => (string) $page->id,
                'slug' => (string) $page->slug,
                'subdomain' => (string) $page->tenant->subdomain,
                'publishedAt' => $published->published_at?->toISOString(),
                'versionNo' => (int) $published->version_no,
            ],
        ];
    }

    public function unpublishPage(string $pageId): array
    {
        $page = $this->repository->findById($pageId);
        if (!$page || $page->is_deleted) {
            return ['ok' => false, 'reason' => 'not_found'];
        }

        $published = $this->pageVersionRepository->findLatestPublished((string) $page->id);
        if (!$published) {
            return ['ok' => true, 'page' => [
                'id' => (string) $page->id,
                'slug' => (string) $page->slug,
                'subdomain' => (string) $page->tenant->subdomain,
                'publishedAt' => null,
            ]];
        }

        $this->pageVersionRepository->archiveVersion($published);

        return ['ok' => true, 'page' => [
            'id' => (string) $page->id,
            'slug' => (string) $page->slug,
            'subdomain' => (string) $page->tenant->subdomain,
            'publishedAt' => null,
        ]];
    }

    public function bootstrapWebsite(string $ownerUserId, array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        $subdomain = $this->normalizeSubdomain((string) ($payload['subdomain'] ?? ''));
        $layoutTemplate = trim((string) ($payload['template_id'] ?? 'default'));
        $homeBlocks = $payload['home_blocks'] ?? [];

        if ($name === '') {
            return ['ok' => false, 'reason' => 'invalid_name'];
        }

        if (!$this->isValidSubdomain($subdomain)) {
            return ['ok' => false, 'reason' => 'invalid_subdomain'];
        }

        $blocksEnvelope = $this->normalizeBlocksEnvelope($homeBlocks);
        if ($blocksEnvelope === null) {
            return ['ok' => false, 'reason' => 'invalid_blocks'];
        }

        try {
            $result = DB::transaction(function () use ($ownerUserId, $name, $subdomain, $layoutTemplate, $blocksEnvelope) {
                $tenant = Tenant::query()->create([
                    'owner_user_id' => $ownerUserId,
                    'name' => $name,
                    'subdomain' => $subdomain,
                    'status' => 'draft',
                    'published_at' => null,
                ]);

                $homePage = SitePage::query()->create([
                    'tenant_id' => $tenant->id,
                    'title' => 'Home',
                    'slug' => '/',
                    'page_type' => 'home',
                    'layout_template' => $layoutTemplate === '' ? 'default' : $layoutTemplate,
                    'is_system' => true,
                    'is_deleted' => false,
                ]);

                SitePage::query()->create([
                    'tenant_id' => $tenant->id,
                    'title' => 'About',
                    'slug' => '/about',
                    'page_type' => 'about',
                    'layout_template' => $layoutTemplate === '' ? 'default' : $layoutTemplate,
                    'is_system' => true,
                    'is_deleted' => false,
                ]);

                SitePage::query()->create([
                    'tenant_id' => $tenant->id,
                    'title' => 'Contact',
                    'slug' => '/contact',
                    'page_type' => 'contact',
                    'layout_template' => $layoutTemplate === '' ? 'default' : $layoutTemplate,
                    'is_system' => true,
                    'is_deleted' => false,
                ]);

                $this->pageVersionRepository->createDraft(
                    pageId: (string) $homePage->id,
                    versionNo: 1,
                    blocksJson: $blocksEnvelope,
                    seoJson: null,
                );

                return [
                    'tenant' => $tenant,
                    'homePage' => $homePage,
                ];
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueViolation($exception)) {
                return ['ok' => false, 'reason' => 'subdomain_conflict'];
            }

            return ['ok' => false, 'reason' => 'unknown_error'];
        }

        return [
            'ok' => true,
            'page' => [
                'id' => (string) $result['homePage']->id,
                'tenantId' => (string) $result['tenant']->id,
                'subdomain' => (string) $result['tenant']->subdomain,
            ],
        ];
    }

    private function normalizeSlug(string $slug): string
    {
        $normalized = '/'.ltrim(trim($slug), '/');
        if ($normalized === '//') {
            return '/';
        }

        $segments = array_values(array_filter(explode('/', $normalized)));
        if (count($segments) === 0) {
            return '/';
        }

        $segments = array_map(function (string $segment) {
            $segment = Str::lower($segment);
            $segment = preg_replace('/[^a-z0-9-]/', '-', $segment) ?? $segment;
            $segment = preg_replace('/-+/', '-', $segment) ?? $segment;
            return trim($segment, '-');
        }, $segments);

        $segments = array_values(array_filter($segments, fn ($segment) => $segment !== ''));
        if (count($segments) === 0) {
            return '/';
        }

        return '/'.implode('/', $segments);
    }

    private function isValidSlug(string $slug): bool
    {
        if ($slug === '/') {
            return true;
        }

        return (bool) preg_match('/^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/', $slug);
    }

    private function isUniqueViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $driverCode = (string) ($exception->errorInfo[1] ?? '');

        return $sqlState === '23505' || $driverCode === '19';
    }

    private function normalizeBlocksEnvelope(mixed $value): ?array
    {
        if (!is_array($value)) {
            return null;
        }

        $isAssoc = array_keys($value) !== range(0, count($value) - 1);

        if ($isAssoc && array_key_exists('schemaVersion', $value) && array_key_exists('blocks', $value)) {
            $schemaVersion = $value['schemaVersion'];
            $blocks = $value['blocks'];
            if (!is_int($schemaVersion) || $schemaVersion <= 0 || !is_array($blocks)) {
                return null;
            }

            return [
                'schemaVersion' => $schemaVersion,
                'blocks' => $blocks,
            ];
        }

        return [
            'schemaVersion' => 1,
            'blocks' => $value,
        ];
    }

    private function normalizeSubdomain(string $value): string
    {
        $normalized = Str::of($value)->trim()->lower()->toString();
        return trim($normalized, '.');
    }

    private function isValidSubdomain(string $subdomain): bool
    {
        if (strlen($subdomain) < 3 || strlen($subdomain) > 63) {
            return false;
        }

        return (bool) preg_match('/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/', $subdomain);
    }

    private function isReservedSlug(string $slug): bool
    {
        return in_array($slug, ['/', '/about', '/contact', '/artikel', '/article', '/product'], true);
    }
}
