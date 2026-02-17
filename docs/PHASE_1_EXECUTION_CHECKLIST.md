# Phase 1 Execution Checklist (Next.js + Laravel Split)

## Scope
Phase 1 fokus pada fondasi tanpa mematikan alur lama:
- Alur lama `Page` tetap jalan.
- Fondasi tenant + multi-page + versioning mulai dibuat.
- Adapter sementara dari data lama ke model baru.

## Stream A - Next.js (repo ini)

1. Tambah shared config untuk domain/tenant
- Add: `shared/config/env.ts`
- Add env contract:
  - `ROOT_DOMAIN`
  - `APP_BASE_URL`
  - `LARAVEL_API_BASE_URL`
  - `PREVIEW_TOKEN_SECRET`
- Exit:
  - semua route publish/preview tidak hardcode `localhost:3000`.

2. Buat resolver host/subdomain reusable
- Add: `features/tenant/services/tenant-resolver.ts`
- Add helper:
  - `extractHost(headers)`
  - `extractSubdomain(host, rootDomain)`
- Exit:
  - resolver bisa dipakai route public, sitemap, robots.

3. Siapkan route public SSR tunggal berbasis host
- Add:
  - `app/page.tsx` (root host-aware)
  - `app/(public)/[...slug]/page.tsx` (non-root slug)
- Logic:
  - resolve host + slug
  - call API `GET /api/public/site?host=...&slug=...`
  - render layout + blocks
- Exit:
  - tenant bisa akses `/`, `/about`, `/contact` via host.

4. Siapkan SEO route tenant-aware
- Add: `app/sitemap.ts`
- Add: `app/robots.ts`
- Logic:
  - baca host, fetch daftar page slug publish
  - generate per tenant
- Exit:
  - sitemap/robots berbeda antar tenant.

5. Siapkan API client layer (jangan fetch inline tersebar)
- Add: `shared/api/http-client.ts`
- Add: `features/pages/services/page-public.service.ts`
- Add: `features/pages/services/page-preview.service.ts`
- Exit:
  - akses API terpusat, typed, dan punya error mapping.

6. Adaptasi publish URL generation
- Update: `app/components/editor/EditorToolbar.tsx`
- Update: `app/api/publish/route.ts`
- Update: `app/api/pages/[pageId]/publish/route.ts`
- Remove hardcode `.localhost:3000`; pakai `ROOT_DOMAIN`.
- Exit:
  - publish URL konsisten per environment.

7. Compatibility adapter model lama
- Add: `features/pages/services/page-legacy-adapter.ts`
- Purpose:
  - map `Page.blocks` lama ke payload `page_versions.blocks_json`.
- Exit:
  - data lama tetap bisa tampil pada renderer baru.

## Stream B - Laravel API (repo terpisah)

1. Boot proyek API + auth bridge
- Setup Sanctum/JWT untuk auth antar Next dan Laravel.
- Endpoint `GET /api/me` untuk validasi sesi.

2. Tenant resolver abstraction (critical)
- Add service contract:
  - `TenantResolver::fromHost($host)`
  - `TenantResolver::fromSubdomain($subdomain)`
  - `TenantResolver::fromCustomDomain($domain)`
- Semua endpoint public SSR wajib lewat resolver ini.

3. Implement schema Phase 1
- Tables:
  - `tenants`
  - `site_pages`
  - `page_versions`
  - `navbar_configs`
- Tambah index tenant isolation:
  - `site_pages (tenant_id, slug) unique`
  - `page_versions (page_id, status)`

4. Public read endpoints (SSR source of truth)
- `GET /api/public/site?host=...&slug=...`
- `GET /api/public/sitemap?host=...`
- `GET /api/public/robots?host=...`
- `/api/public/site` harus return single stable render payload:
  - `tenant`
  - `navbar`
  - `page` (`blocks` envelope with `schemaVersion`)
  - `collections` (`articles`, `products`)

5. Preview endpoint
- `GET /api/public/preview?token=...`
- token signed + short TTL.

## Stream C - Data Migration

1. Snapshot existing `Page` ke model baru
- Script migrasi satu arah:
  - create tenant by `ownerId + subdomain`
  - create `site_pages` slug `/`
  - create `page_versions` status `published|draft` menyesuaikan `isPublished`
  - map blocks ke envelope `{ schemaVersion: 1, blocks: [...] }`

2. Backfill idempotent
- script harus aman dijalankan ulang.

3. Template versioning seed (minimum)
- Seed `templates` dengan pasangan `key + version`.
- Simpan `tenant_template_installs` saat tenant dibuat.

## Definition of Done Phase 1
- Alur lama tidak rusak (`dashboard`, `edit`, `publish`, `preview`).
- Sudah ada jalur SSR baru berbasis host untuk minimal 3 halaman sistem.
- URL publish tidak hardcode localhost.
- API call layer terpusat dan typed.
- Dokumen kontrak API + model data dipakai bersama frontend/backend.
