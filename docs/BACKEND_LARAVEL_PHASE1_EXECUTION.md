# Backend Laravel Phase 1 Execution (Concrete)

## Goal Phase 1
Deliver backend foundation without breaking current app:
- Tenant data model ready (`tenants`, `site_pages`, `page_versions`, `navbar_configs`)
- Tenant resolver abstraction in place
- Minimal public SSR endpoint works: `GET /api/public/site?host=...&slug=...`
- Compatible with PostgreSQL and existing transition strategy

## Target Backend Folder Structure
```txt
backend-laravel/
  app/
    Domain/
      Tenant/
        Contracts/
          TenantResolver.php
        DTO/
          TenantContext.php
        Services/
          HostTenantResolver.php
      PublicSite/
        DTO/
          PublicSitePayload.php
        Repositories/
          PublicSiteRepository.php
        Services/
          PublicSiteService.php
      Shared/
        Exceptions/
          TenantNotFoundException.php
    Http/
      Controllers/
        Api/
          PublicSite/
            PublicSiteController.php
      Resources/
        Api/
          PublicSiteResource.php
    Models/
      Tenant.php
      SitePage.php
      PageVersion.php
      NavbarConfig.php
  database/
    migrations/
    seeders/
  routes/
    api.php
  config/
    tenancy.php
  tests/
    Feature/
      Api/
        PublicSiteEndpointTest.php
    Unit/
      Domain/
        Tenant/
          HostTenantResolverTest.php
```

## Phase 1 Migration Plan (PostgreSQL)

### 1) `tenants`
Fields:
- `id` UUID/ULID primary key
- `owner_user_id` string/bigint (depends auth source)
- `name` string
- `subdomain` string unique
- `custom_domain` string nullable unique
- `status` enum/string (`draft|published|suspended`)
- `published_at` timestamp nullable
- `created_at`, `updated_at`

Indexes:
- unique `subdomain`
- unique `custom_domain`
- index `owner_user_id`

### 2) `site_pages`
Fields:
- `id`
- `tenant_id` fk -> `tenants.id`
- `title` string
- `slug` string
- `page_type` enum/string (`home|contact|about|article_index|product_index|custom`)
- `layout_template` string nullable
- `is_system` boolean default false
- `is_deleted` boolean default false
- `created_at`, `updated_at`

Indexes:
- unique (`tenant_id`, `slug`)
- index (`tenant_id`, `page_type`)

### 3) `page_versions`
Fields:
- `id`
- `page_id` fk -> `site_pages.id`
- `version_no` int
- `status` enum/string (`draft|published|archived`)
- `blocks_json` jsonb  // required envelope: `{ schemaVersion, blocks }`
- `seo_json` jsonb nullable
- `published_at` timestamp nullable
- `created_at`, `updated_at`

Indexes:
- unique (`page_id`, `version_no`)
- index (`page_id`, `status`)

### 4) `navbar_configs`
Fields:
- `id`
- `tenant_id` fk -> `tenants.id`
- `version_no` int
- `status` enum/string (`draft|published|archived`)
- `items_json` jsonb
- `published_at` timestamp nullable
- `created_at`, `updated_at`

Indexes:
- unique (`tenant_id`, `version_no`)
- index (`tenant_id`, `status`)

## Tenant Resolver Contract
Create `app/Domain/Tenant/Contracts/TenantResolver.php`:
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

Initial implementation `HostTenantResolver`:
- Normalize host (lowercase, strip port)
- Resolve priority:
  1. exact match `custom_domain`
  2. subdomain under configured root domain
- Return `TenantContext` DTO (tenant id, name, subdomain/custom domain, status)

`config/tenancy.php` minimum:
- `root_domain` (example: `domain.com`)
- `reserved_subdomains` (`www`, `app`, `api`, etc.)

## Minimal Working Endpoint: `/api/public/site`

### Route
`routes/api.php`
```php
Route::get('/public/site', [PublicSiteController::class, 'show']);
```

### Request contract
Query:
- `host` required
- `slug` required (default `/`)

### Controller flow
1. Validate `host` + `slug`
2. Resolve tenant with `TenantResolver::fromHost($host)`
3. Load published navbar + published page version by slug
4. Return stable payload:
```json
{
  "version": 1,
  "tenant": { "name": "..." , "theme": {} },
  "navbar": { "items": [] },
  "page": {
    "slug": "/about",
    "blocks": { "schemaVersion": 1, "blocks": [] },
    "seo": {}
  },
  "collections": {
    "articles": [],
    "products": []
  }
}
```

### Minimal fallback behavior
- Tenant not found -> `404`
- Slug not found on published state -> `404`
- Invalid host/slug -> `422`

## Repository Query Rules (Critical)
- All queries must include tenant scope
- Never fetch by slug alone without tenant condition
- For published page:
  - `site_pages.slug = :slug`
  - `page_versions.status = 'published'`
  - latest `version_no` if multiple

## Seed Strategy (Phase 1)
Create one sample tenant seed:
- subdomain: `demo`
- pages: `/`, `/about`, `/contact`
- each page has one published version with block envelope
- navbar published version with 2-3 basic links

Purpose: unblock Next SSR integration immediately.

## Feature Tests to Ship in Phase 1
1. `PublicSiteEndpointTest`
- returns 200 with valid payload for existing tenant+slug
- returns 404 for unknown tenant
- returns 404 for unknown slug

2. `HostTenantResolverTest`
- resolves by subdomain host
- resolves by custom domain
- rejects reserved/invalid host

## Day-by-Day Execution (Suggested)
Day 1:
- setup folder skeleton + contract interfaces + DTO
- create migrations

Day 2:
- implement resolver + tenancy config + model relations

Day 3:
- implement repository + public site service + endpoint
- add seed demo tenant/page/navbar

Day 4:
- add feature tests + harden payload shape
- connect Next.js `getPublicSiteByHostAndSlug` to real backend endpoint

## Done Criteria Phase 1 (Backend)
- Migrations run clean on PostgreSQL.
- Resolver contract + implementation active.
- `/api/public/site` returns stable payload contract.
- Tests green for resolver and endpoint.
- Next.js public SSR can consume backend payload for at least `/`.

## Ready-to-Use Draft Files
- SQL draft: `docs/backend-laravel/PHASE1_POSTGRES_SQL_DRAFT.sql`
- Laravel templates: `docs/backend-laravel/LARAVEL_PHASE1_FILE_TEMPLATES.md`
