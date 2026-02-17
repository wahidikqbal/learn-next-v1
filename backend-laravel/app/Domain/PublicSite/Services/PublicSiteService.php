<?php

namespace App\Domain\PublicSite\Services;

use App\Domain\PublicSite\Repositories\PublicSiteRepository;
use App\Domain\Tenant\Contracts\TenantResolver;
use stdClass;

class PublicSiteService
{
    public function __construct(
        private readonly TenantResolver $tenantResolver,
        private readonly PublicSiteRepository $repository,
    ) {
    }

    public function getRenderPayload(string $host, string $slug): ?array
    {
        $tenant = $this->tenantResolver->fromHost($host);
        if (!$tenant) {
            return null;
        }

        $page = $this->repository->getPublishedPageByTenantAndSlug($tenant->id, $slug);
        if (!$page) {
            return null;
        }

        $navbar = $this->repository->getPublishedNavbarByTenant($tenant->id);

        return [
            'version' => 1,
            'tenant' => [
                'name' => $tenant->name,
                'theme' => new stdClass(),
            ],
            'navbar' => [
                'items' => $this->normalizeJson($navbar?->items_json, []),
            ],
            'page' => [
                'slug' => (string) $page->slug,
                'blocks' => $this->normalizeJson($page->blocks_json, [
                    'schemaVersion' => 1,
                    'blocks' => [],
                ]),
                'seo' => $this->normalizeJson($page->seo_json, new stdClass()),
            ],
            'collections' => [
                'articles' => [],
                'products' => [],
            ],
        ];
    }

    private function normalizeJson(mixed $value, mixed $fallback): mixed
    {
        if (is_array($value) || is_object($value)) {
            return $value;
        }

        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        return $fallback;
    }
}

