# Implementation Progress Checklist

## Scope: Preview SSR + Public Navbar + Proxy Guard Sync

## A. Preview Token SSR
- [x] Tambah service integration `getPublicPreviewByToken` ke route SSR.
- [x] Tambah route baru `app/preview/token/[token]/page.tsx`.
- [x] Render halaman preview langsung dari payload API (bukan localStorage).
- [x] Tampilkan fallback UI saat token invalid/expired.
- [x] Integrasi generator preview token dari dashboard/editor action.
- [x] Tambah TTL/expired indicator di UI preview.

## B. Public Navbar Renderer (from `/api/public/site`)
- [x] Tambah renderer `shared/ui/navigation/PublicNavbar.tsx`.
- [x] Support item type `link`.
- [x] Support item type `dropdown` + child items.
- [x] Support item type `mega_menu` + child items.
- [x] Hormati flag `hidden` pada parent/child item.
- [x] Integrasi navbar ke:
  - `app/page.tsx`
  - `app/(public)/[...slug]/page.tsx`
- [x] Integrasi theme styling tenant (warna/font dari payload `tenant.theme`).

## C. Public Payload Normalization
- [x] Update `PublicSitePayload` agar kompatibel dengan contract baru:
  - `version`
  - `tenant.theme`
  - `page.blocks` envelope (`schemaVersion`, `blocks`)
  - `collections`
- [x] Tambah helper:
  - `extractRenderableBlocks(...)`
  - `extractVisibleNavItems(...)`
- [x] Tambah runtime validation schema (zod) untuk payload public.

## D. Proxy Guard Sync
- [x] Bypass auth untuk route token preview (`/preview/token/*`).
- [x] Pertahankan guard ketat untuk `/preview` non-token.
- [x] Sinkronkan matcher supaya skenario preview-token tercakup.
- [x] Tambah test middleware/proxy untuk matrix path authz.

## E. Verification
- [x] Typecheck lulus setelah perubahan.
- [x] Tambah test e2e minimal:
  - tenant host root render
  - tenant slug render
  - token preview render
  - unauthorized dashboard redirect
