# Laravel Phase 1 File Templates

## 1) Tenant Resolver Contract
`app/Domain/Tenant/Contracts/TenantResolver.php`
```php
<?php

namespace App\Domain\Tenant\Contracts;

use App\Domain\Tenant\DTO\TenantContext;

interface TenantResolver
{
    public function fromHost(string $host): ?TenantContext;
    public function fromSubdomain(string $subdomain): ?TenantContext;
    public function fromCustomDomain(string $domain): ?TenantContext;
}
```

## 2) Tenant Context DTO
`app/Domain/Tenant/DTO/TenantContext.php`
```php
<?php

namespace App\Domain\Tenant\DTO;

class TenantContext
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $subdomain,
        public readonly ?string $customDomain,
        public readonly string $status,
    ) {}
}
```

## 3) Resolver Implementation
`app/Domain/Tenant/Services/HostTenantResolver.php`
```php
<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Contracts\TenantResolver;
use App\Domain\Tenant\DTO\TenantContext;
use App\Models\Tenant;

class HostTenantResolver implements TenantResolver
{
    public function fromHost(string $host): ?TenantContext
    {
        $normalizedHost = strtolower(trim(explode(':', $host)[0] ?? ''));
        if ($normalizedHost === '') return null;

        $custom = Tenant::query()->where('custom_domain', $normalizedHost)->first();
        if ($custom) return $this->toContext($custom);

        $rootDomain = strtolower(config('tenancy.root_domain', 'localhost'));
        if ($normalizedHost === $rootDomain) return null;
        if (!str_ends_with($normalizedHost, '.' . $rootDomain)) return null;

        $subdomain = substr($normalizedHost, 0, -strlen('.' . $rootDomain));
        if (!$subdomain || str_contains($subdomain, '.')) return null;

        return $this->fromSubdomain($subdomain);
    }

    public function fromSubdomain(string $subdomain): ?TenantContext
    {
        $normalized = strtolower(trim($subdomain));
        if ($normalized === '') return null;

        $reserved = config('tenancy.reserved_subdomains', []);
        if (in_array($normalized, $reserved, true)) return null;

        $tenant = Tenant::query()->where('subdomain', $normalized)->first();
        return $tenant ? $this->toContext($tenant) : null;
    }

    public function fromCustomDomain(string $domain): ?TenantContext
    {
        $normalized = strtolower(trim($domain));
        if ($normalized === '') return null;
        $tenant = Tenant::query()->where('custom_domain', $normalized)->first();
        return $tenant ? $this->toContext($tenant) : null;
    }

    private function toContext(Tenant $tenant): TenantContext
    {
        return new TenantContext(
            id: $tenant->id,
            name: $tenant->name,
            subdomain: $tenant->subdomain,
            customDomain: $tenant->custom_domain,
            status: $tenant->status,
        );
    }
}
```

## 4) Public Site Repository
`app/Domain/PublicSite/Repositories/PublicSiteRepository.php`
```php
<?php

namespace App\Domain\PublicSite\Repositories;

use Illuminate\Support\Facades\DB;

class PublicSiteRepository
{
    public function getPublishedPageByTenantAndSlug(string $tenantId, string $slug): ?object
    {
        return DB::table('site_pages as sp')
            ->join('page_versions as pv', 'pv.page_id', '=', 'sp.id')
            ->where('sp.tenant_id', $tenantId)
            ->where('sp.slug', $slug)
            ->where('sp.is_deleted', false)
            ->where('pv.status', 'published')
            ->orderByDesc('pv.version_no')
            ->select([
                'sp.id as page_id',
                'sp.slug',
                'sp.title',
                'pv.blocks_json',
                'pv.seo_json',
                'pv.updated_at',
            ])
            ->first();
    }

    public function getPublishedNavbarByTenant(string $tenantId): ?object
    {
        return DB::table('navbar_configs')
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->orderByDesc('version_no')
            ->select(['items_json'])
            ->first();
    }
}
```

## 5) Public Site Service
`app/Domain/PublicSite/Services/PublicSiteService.php`
```php
<?php

namespace App\Domain\PublicSite\Services;

use App\Domain\PublicSite\Repositories\PublicSiteRepository;
use App\Domain\Tenant\Contracts\TenantResolver;

class PublicSiteService
{
    public function __construct(
        private readonly TenantResolver $tenantResolver,
        private readonly PublicSiteRepository $repository,
    ) {}

    public function getRenderPayload(string $host, string $slug): ?array
    {
        $tenant = $this->tenantResolver->fromHost($host);
        if (!$tenant) return null;

        $page = $this->repository->getPublishedPageByTenantAndSlug($tenant->id, $slug);
        if (!$page) return null;

        $navbar = $this->repository->getPublishedNavbarByTenant($tenant->id);

        return [
            'version' => 1,
            'tenant' => [
                'name' => $tenant->name,
                'theme' => new \stdClass(),
            ],
            'navbar' => [
                'items' => $navbar?->items_json ?? [],
            ],
            'page' => [
                'slug' => $page->slug,
                'blocks' => $page->blocks_json,
                'seo' => $page->seo_json ?? new \stdClass(),
            ],
            'collections' => [
                'articles' => [],
                'products' => [],
            ],
        ];
    }
}
```

## 6) Public Site Controller
`app/Http/Controllers/Api/PublicSite/PublicSiteController.php`
```php
<?php

namespace App\Http\Controllers\Api\PublicSite;

use App\Domain\PublicSite\Services\PublicSiteService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PublicSiteController extends Controller
{
    public function __construct(
        private readonly PublicSiteService $service,
    ) {}

    public function show(Request $request)
    {
        $validated = $request->validate([
            'host' => ['required', 'string'],
            'slug' => ['required', 'string'],
        ]);

        $payload = $this->service->getRenderPayload(
            host: $validated['host'],
            slug: $validated['slug'],
        );

        if (!$payload) {
            return response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Site not found']], 404);
        }

        return response()->json($payload);
    }
}
```

## 7) Route Registration
`routes/api.php`
```php
use App\Http\Controllers\Api\PublicSite\PublicSiteController;

Route::get('/public/site', [PublicSiteController::class, 'show']);
```

## 8) Service Binding
`app/Providers/AppServiceProvider.php`
```php
use App\Domain\Tenant\Contracts\TenantResolver;
use App\Domain\Tenant\Services\HostTenantResolver;

public function register(): void
{
    $this->app->bind(TenantResolver::class, HostTenantResolver::class);
}
```

## 9) Config Tenancy
`config/tenancy.php`
```php
<?php

return [
    'root_domain' => env('TENANCY_ROOT_DOMAIN', 'localhost'),
    'reserved_subdomains' => [
        'www',
        'app',
        'api',
        'admin',
    ],
];
```

