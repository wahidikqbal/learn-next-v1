# Phase 3 Implementation Progress Checklist

## Status Legend
- `[x]` done
- `[~]` in progress
- `[ ]` not started

## A. Backend Laravel Navbar
- [x] Add navbar repository/service/controller domain
- [x] Implement `GET /api/tenants/{tenantId}/navbar`
- [x] Implement `PUT /api/tenants/{tenantId}/navbar` (save draft)
- [x] Implement `POST /api/tenants/{tenantId}/navbar/publish`
- [x] Navbar publish archive behavior for previous published version
- [x] Validation item type/link/children/hidden

## B. Backend Tests
- [x] Feature test save + get navbar
- [x] Feature test publish navbar flow
- [x] Feature test invalid payload mapping (`422`)

## C. Next.js Integration
- [x] Add Laravel navbar service (`features/navbar/services/laravel-navbar.service.ts`)
- [x] Add Next proxy route GET/PUT navbar tenant
- [x] Add Next proxy route POST navbar publish
- [x] Integrate navbar CRUD UI in dashboard/editor

## D. Public SSR Contract
- [x] Public SSR payload already includes `navbar.items`
- [x] Public navbar renderer supports `link/dropdown/mega_menu`
- [x] Hidden item filtering active

## Current Focus
- [x] Build navbar editor UI flow using new tenant navbar API proxy.
- [x] Add route-level unit tests for new navbar proxy endpoints.
- [~] Add e2e navbar draft->publish visual verification.
