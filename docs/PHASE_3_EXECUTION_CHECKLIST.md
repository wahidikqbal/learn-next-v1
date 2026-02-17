# Phase 3 Execution Checklist (Navbar Builder + Public SSR Contract)

## Objective
Menyelesaikan fondasi navbar builder tenant dengan alur draft/publish, lalu memastikan renderer public SSR membaca contract navbar dari payload Laravel secara konsisten.

## Stream A - Backend Laravel Navbar

1. Navbar Draft/Publish API
- [x] `GET /api/tenants/{tenantId}/navbar`
- [x] `PUT /api/tenants/{tenantId}/navbar`
- [x] `POST /api/tenants/{tenantId}/navbar/publish`
- [x] Aturan publish atomik:
  - previous `published` -> `archived`
  - latest `draft` -> `published`

2. Validation Rules
- [x] Validate item `type` (`link|dropdown|mega_menu`)
- [x] Validate `link` must include `href`
- [x] Validate child item structure (`id`, `label`, `href`)
- [x] Support `hidden` flag on item/child

3. Backend Tests
- [x] Feature test: save draft + read
- [x] Feature test: publish and archive previous
- [x] Feature test: invalid payload -> `422`

## Stream B - Next.js Integration

1. API Proxy Layer
- [x] `GET /api/tenants/{tenantId}/navbar` (proxy to Laravel)
- [x] `PUT /api/tenants/{tenantId}/navbar` (proxy to Laravel)
- [x] `POST /api/tenants/{tenantId}/navbar/publish` (proxy to Laravel)
- [x] Error mapping for common Laravel response codes

2. Public Renderer Contract
- [x] Public navbar renderer consumes payload item types `link/dropdown/mega_menu`
- [x] Hidden items excluded in renderer
- [x] Renderer used in:
  - `/` tenant root
  - `/(public)/[...slug]`
  - preview token page

3. Frontend Tests
- [x] Add route tests for navbar proxy handlers
- [ ] Add e2e navbar draft->publish visual verification

## Done Criteria
- Tenant navbar bisa disimpan sebagai draft.
- Tenant navbar bisa dipublish tanpa merusak versi published sebelumnya.
- Public SSR menampilkan navbar berdasarkan published contract Laravel.
