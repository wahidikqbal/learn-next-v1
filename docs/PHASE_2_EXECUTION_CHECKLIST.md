# Phase 2 Execution Checklist (Tenant Multi-Page Foundation)

## Objective
Menuntaskan fondasi multi-page tenant secara operasional (bukan seed-only), dengan backend Laravel sebagai source of truth.

## Scope
- CRUD page tenant (`site_pages`) + slug management.
- Version workflow draft/publish (`page_versions`).
- Rule halaman sistem (`/`, `/about`, `/contact`) untuk proteksi penghapusan.
- Integrasi dashboard Next.js ke endpoint Laravel untuk read/write page.

## Stream A - Backend Laravel

1. Tenant Pages API (CRUD)
- [x] `GET /api/tenants/{tenantId}/pages`
- [x] `POST /api/tenants/{tenantId}/pages`
- [x] `PATCH /api/pages/{pageId}`
- [x] `DELETE /api/pages/{pageId}` (soft delete)
- [x] Validation:
  - slug wajib format `/slug`
  - unique per tenant (`tenant_id + slug`)
  - slug reserved rules untuk path sistem

2. System Page Rules
- [x] Tandai page sistem (`is_system=true`) saat bootstrap tenant.
- [x] Cegah delete page sistem default (configurable lock).
- [~] Izinkan edit konten/SEO page sistem.

3. Draft / Publish Endpoint
- [x] `PUT /api/pages/{pageId}/draft`
- [x] `POST /api/pages/{pageId}/publish`
- [x] Aturan publish atomik:
  - previous `published` -> `archived`
  - target draft terbaru -> `published`

4. Repository + Service Layer Hardening
- [~] Semua query wajib tenant-scoped.
- [x] Tidak ada query by slug tanpa tenant context.
- [x] Gunakan service domain, controller tetap tipis.

5. Backend Tests
- [x] Feature test: CRUD pages.
- [x] Feature test: slug conflict (`409`).
- [x] Feature test: system page delete blocked.
- [x] Feature test: publish atomik.
- [x] Feature test: owner pages list + unpublish endpoint.

## Stream B - Next.js Integration

1. Dashboard Page Source Switch
- [x] List pages dari Laravel API, bukan Prisma legacy.
- [x] Create/edit/delete page via Laravel endpoints.
  - create website bootstrap via Laravel: done
  - delete page via Laravel: done
  - edit metadata/title/slug from route handler phase2: done
  - UI metadata edit (name/slug) di editor page-id: done

2. Editor Save Flow
- [x] Save ke endpoint draft Laravel (`PUT /api/pages/{id}/draft`).
- [x] Publish trigger ke Laravel (`POST /api/pages/{id}/publish`).

3. Compatibility Window
- [x] Keep fallback legacy read sementara (feature flag/env).
- [x] Tambah log warning jika fallback legacy dipakai.

4. Frontend Tests
- [x] Integration test route handlers untuk failure map (401/403/404/409/422).
- [x] E2E: create page -> publish -> accessible via `http://demo.localhost:3000/{slug}`.
  - implemented at `tests/e2e/phase2-dashboard-flow.spec.ts`
  - verified pass with phase2 env enabled and Laravel API live

## Delivery Order (Recommended)
1. Backend CRUD pages + validations.
2. Backend draft/publish endpoints + tests.
3. Next.js dashboard integration.
4. Next.js editor save/publish integration.
5. Remove/disable legacy path via flag.

## Done Criteria
- Tenant bisa create custom page dari dashboard.
- Slug unik per tenant tervalidasi.
- Draft tersimpan sebagai page version.
- Publish per page berjalan atomik.
- Page yang dipublish dapat diakses SSR pada `http://{subdomain}.localhost:3000/{slug}`.
