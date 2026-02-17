# SaaS Web Builder Production Blueprint

## Product Direction
Target product: multi-tenant web builder (SaaS) with tenant domain model:
- `subdomain.domain.com`
- SSR for public pages
- draft / preview / publish workflow
- template-based starter + customizable page editor (Puck-like block experience -> https://puckeditor.com/)

This blueprint replaces the previous single-page publish model with a tenant website model.

## Core Requirements
- Responsive frontend across editor, dashboard, and published site.
- Tenant chooses unique subdomain.
- Tenant chooses template.
- Template auto-creates 3-5 default pages:
  - Home (`/`)
  - Contact (`/contact`)
  - About (`/about`)
  - Articles index (`/artikel`) + detail (`/artikel/[slug]`)
  - Product/Service index (`/product`) + detail (`/product/[slug]`) + checkout flow
- Page/slug can be deleted (except required system page if configured as locked).
- Navbar builder:
  - direct link item
  - dropdown item with child links
  - mega menu item with child links
  - visibility toggle (`hidden`)
- Custom page builder:
  - custom slug (`/my-page`)
  - add/remove/reorder blocks
- SEO per page:
  - meta title
  - meta description
  - og image
- SEO per tenant:
  - `sitemap.xml`
  - `robots.txt`
- Auth: Google OAuth only.
- Reusable components and strict domain boundaries.

## Recommended Architecture
Use separated backend + frontend:
- Backend: Laravel API (tenant/business/content/checkout domain).
- Frontend: Next.js app router (SSR rendering + editor UI + dashboard UI).

## Critical Abstractions (Must Have Early)

### 1. Tenant Resolution Contract (Laravel)
Create dedicated resolver layer:
- `TenantResolver::fromHost($host)`
- `TenantResolver::fromSubdomain($subdomain)`
- `TenantResolver::fromCustomDomain($domain)`

Why:
- prevent refactor blast saat tambah custom domain
- support staging/preview/internal domain strategy dari awal
- keep tenancy logic out of controllers

### High-Level Split
- Laravel handles:
  - tenancy resolution + domain ownership
  - content persistence (pages/articles/products/navbar/menus)
  - publishing state + versions
  - checkout/order endpoints
  - access control, subscription status, quotas
- Next.js handles:
  - editor and dashboard UX
  - SSR public page rendering (fetching published snapshot from API)
  - preview rendering for draft versions
  - metadata + sitemap + robots routes per tenant

## Domain Model (Target)
Current model is still single `Page`. Move to these entities:

1. `tenants`
- `id`, `owner_user_id`, `name`, `subdomain` (unique), `status`, `published_at`

2. `site_pages`
- `id`, `tenant_id`, `title`, `slug`, `page_type`, `layout_template`, `is_system`, `is_deleted`
- unique: (`tenant_id`, `slug`)

3. `page_versions`
- `id`, `page_id`, `version_no`, `status` (`draft|published|archived`), `blocks_json`, `seo_json`, `published_at`

4. `articles`
- `id`, `tenant_id`, `title`, `slug`, `excerpt`, `content_json`, `cover_image`, `seo_json`, `status`, `published_at`

5. `products`
- `id`, `tenant_id`, `name`, `slug`, `description_json`, `price`, `currency`, `images_json`, `seo_json`, `status`, `published_at`

6. `navbar_configs`
- `id`, `tenant_id`, `version_no`, `status`, `items_json`

7. `orders` (minimal first)
- `id`, `tenant_id`, `product_id`, `buyer_json`, `amount`, `currency`, `status`, `provider`, `provider_ref`

8. `templates` (versioned)
- `id`, `key`, `name`, `version`, `config_json`, `is_active`

9. `tenant_template_installs`
- `id`, `tenant_id`, `template_id`, `template_version`, `installed_config_json`

Why template versioning:
- tenant lama tetap stabil
- tenant baru bisa pakai versi terbaru
- update template tidak merusak site existing

## Rendering Strategy (SSR + Preview + Publish)
Public request flow:
1. Resolve tenant from host/subdomain.
2. Fetch single render payload (tenant + navbar + page + collections) by slug.
3. Render SSR page in Next.js.

Preview flow:
1. Dashboard/editor requests preview token.
2. Next.js SSR preview route reads draft snapshot by token.
3. Render draft without affecting published content.

Publish flow:
1. Validate tenant rules (plan/quota/subdomain).
2. Promote draft version to published atomically.
3. Invalidate cache/tag for tenant routes.

## URL Contract
- Home: `https://{subdomain}.{rootDomain}/`
- Contact: `https://{subdomain}.{rootDomain}/contact`
- About: `https://{subdomain}.{rootDomain}/about`
- Articles index/detail: `/artikel`, `/artikel/[slug]`
- Products index/detail: `/product`, `/product/[slug]`
- Custom pages: `/{slug}`
- SEO:
  - `/{tenant}/sitemap.xml` resolved by host
  - `/{tenant}/robots.txt` resolved by host

## Template Bootstrapping
When tenant selects template:
1. Create tenant.
2. Seed required system pages (home/contact/about/artikel/product).
3. Seed default navbar structure.
4. Seed starter blocks per page.
5. Mark all as draft until first publish.

## Recommended Next.js Structure
```txt
app/
  (dashboard)/
    dashboard/
    editor/[pageId]/
    articles/
    products/
    navbar/
  (public)/
    [[...slug]]/page.tsx             # SSR host-based resolver
  sitemap.ts                          # tenant-aware via host
  robots.ts                           # tenant-aware via host
features/
  tenant/
  pages/
  articles/
  products/
  navbar/
  publish/
  checkout/
shared/
  api/
  auth/
  config/
  seo/
  ui/
```

## API Contract (Laravel)
Minimum endpoints:
- `POST /api/tenants`
- `GET /api/tenants/:id`
- `PATCH /api/tenants/:id/subdomain`
- `GET /api/tenants/:id/pages`
- `POST /api/tenants/:id/pages`
- `PATCH /api/pages/:id`
- `DELETE /api/pages/:id`
- `POST /api/pages/:id/publish`
- `GET /api/tenants/:id/navbar`
- `PUT /api/tenants/:id/navbar`
- `GET /api/tenants/:id/articles`
- `POST /api/tenants/:id/articles`
- `GET /api/tenants/:id/products`
- `POST /api/tenants/:id/products`
- `POST /api/checkout/session`
- `GET /api/public/site?host=...&slug=...` (published SSR payload)
- `GET /api/public/preview?token=...` (draft SSR payload)

Public SSR endpoint rule:
- keep response as stable render contract
- avoid leaking relational graph
- one request for one page render

## Migration Plan (No Big-Bang)
## Phase 1: Keep Current App Running
- Keep existing `Page` flow as compatibility mode.
- Introduce new `tenant/pages/version/navbar` tables.
- Add mapping adapter from old `Page.blocks` to new `page_versions.blocks_json`.

Exit criteria:
- Existing routes remain stable.
- New schema available in parallel.

## Phase 2: Tenant + Multi-Page Foundation
- Add tenant creation by template selection.
- Implement required system pages and slug constraints.
- Implement host/subdomain resolver for SSR public route.
- Implement `TenantResolver` abstraction (host/subdomain/custom-domain).

Exit criteria:
- One tenant can serve `/`, `/about`, `/contact` by SSR.

## Phase 3: Articles + Products + Checkout
- Build dashboard CRUD for articles/products.
- Render index/detail pages SSR.
- Add checkout endpoint and order persistence.

Exit criteria:
- `/artikel` and `/product` fully working with detail + checkout.

## Phase 4: Navbar Builder + Custom Pages
- Implement navbar item types (link/dropdown/mega-menu).
- Implement custom page creation and slug conflict validation.
- Add hidden toggle behavior in renderer.

Exit criteria:
- Tenant can build nav and custom pages without code changes.

## Phase 5: SEO + Publish Discipline
- Add per-page metadata editor.
- Add per-tenant dynamic sitemap and robots.
- Harden preview token flow and publish atomicity.

Exit criteria:
- SEO artifacts are generated per tenant and visible publicly.

## Phase 6: Production Hardening
- Add automated tests (unit/integration/e2e) for tenant isolation and publishing.
- Add observability, audit log, and CI gates.
- Prepare feature flags for billing and quota enforcement.

Exit criteria:
- Stable production rollout with rollback strategy.

## Non-Functional Rules
- SSR-first for public pages.
- All write operations validated at API boundary.
- Tenant isolation mandatory in all queries.
- Editor data stored as schema-versioned JSON envelope:
  - `blocks_json = { schemaVersion: number, blocks: [...] }`
- No direct DB access from Next.js once Laravel API is active.

## Deferred Features (Planned Next)
- Rate limit
- CAPTCHA
- Subscription/Billing (Mayar)
- Paid vs unpaid feature gating

## Execution Docs
- `docs/PHASE_1_EXECUTION_CHECKLIST.md`
- `docs/WEB_BUILDER_API_CONTRACT.md`
- `docs/DATA_MODEL_TARGET.md`
- `docs/BACKEND_LARAVEL_PHASE1_EXECUTION.md`
