# SaaS Production Refactor Blueprint

## Goal
- Make the codebase easier to maintain as features grow.
- Reduce auth/data-access drift across routes, server actions, and pages.
- Keep current behavior stable during migration (no big-bang rewrite).
- Stay aligned with current Next.js setup: `app/` at repository root (no forced move to `src/`).

## Current Risks
- Business logic duplicated in multiple entry points (`app/api/*`, server actions).
- Prisma queries spread across route handlers and page components.
- UI and feature/domain code boundaries are mixed.
- No tests and no CI gate for regressions.

## Target Architecture
Use a feature-first structure at repository root:

```txt
app/                           # Next.js routes only
features/
  auth/
    services/
    guards/
    schemas/
  pages/
    services/
    repositories/
    schemas/
    components/
    actions/
  admin/
    services/
    repositories/
    schemas/
    components/
shared/
  lib/                         # prisma client, logger, utils
  auth/                        # auth config, auth helpers
  config/                      # env, constants
  ui/                          # reusable UI primitives
  types/
tests/
```

## Boundary Rules
- `app/*` only orchestrates request/response and calls feature services.
- `features/*/services` contains business rules.
- `features/*/repositories` contains Prisma queries only.
- `shared/*` must not import from `features/*`.
- No direct Prisma usage inside page components or route handlers.

## Next.js Folder Note
- On current Next.js, both `app/` at root and `src/app/` are valid.
- This repository already uses root-level `app/`; keeping it is acceptable and avoids large path churn.

## Phase Plan (Safe Migration)

## Phase 1: Create Core Layers (No behavior change)
- Add shared layers and move shared primitives:
  - `lib/prisma.ts` -> `shared/lib/prisma.ts`
  - `lib/authz.ts` -> `shared/auth/guards.ts`
  - `auth.ts` -> `shared/auth/config.ts`
- Keep compatibility re-exports in old paths temporarily.
- Add `shared/config/env.ts` with runtime env validation.

Exit criteria:
- App builds and runs with identical behavior.
- Existing imports still work through compatibility re-exports.

## Phase 2: Extract Pages Domain
- Create:
  - `features/pages/repositories/page.repository.ts`
  - `features/pages/services/page.service.ts`
  - `features/pages/schemas/page.schema.ts`
- Move duplicated create/publish/update/delete logic from:
  - `app/api/pages/route.ts`
  - `app/api/pages/[pageId]/route.ts`
  - `app/api/pages/[pageId]/publish/route.ts`
  - `app/api/publish/route.ts`
  - `app/dashboard/actions.ts`
- Entry points call service methods only.

Exit criteria:
- Single source of truth for page business rules.
- No duplicated owner/admin check logic across handlers/actions.

## Phase 3: Extract Admin Domain
- Create:
  - `features/admin/repositories/user.repository.ts`
  - `features/admin/services/admin.service.ts`
- Move admin role/deletion logic from `app/admin/actions.ts`.
- Route/page layer only handles transport concerns and UI.

Exit criteria:
- Admin concurrency and protection rules live in one service.

## Phase 4: UI Cleanup
- Move generic reusable UI from `app/components/ui` to `shared/ui`.
- Keep page/editor-specific UI inside relevant feature folder.
- Standardize naming:
  - `ButtonOne.tsx` -> `Button.tsx`
  - `TitleOne.tsx` -> `Title.tsx`
  - avoid `*Component` suffix unless needed.

Exit criteria:
- New contributors can find reusable vs feature-specific UI quickly.

## Phase 5: Testing + CI
- Add tests:
  - Unit tests for services (owner/admin checks, publish rules).
  - Integration tests for API handlers (401/403/404/200 flows).
- Add CI workflow:
  - `lint`
  - `typecheck`
  - `build`
  - `test`

Exit criteria:
- PRs blocked when checks fail.
- Critical authz flows covered by automated tests.

## File Mapping (Starter)
- `lib/pages.ts` -> split into:
  - `features/pages/repositories/page.repository.ts`
  - `features/pages/services/page.query.service.ts`
- `app/dashboard/actions.ts` -> `features/pages/actions/page.actions.ts`
- `app/admin/actions.ts` -> `features/admin/actions/admin.actions.ts`
- `app/components/layout/AppSidebar.tsx` -> `shared/ui/navigation/AppSidebar.tsx`

## Coding Standards for SaaS Maintainability
- Keep transport layer thin (route handler/server action <= ~40 lines where possible).
- Validate all input at boundaries (schema-first).
- One business rule, one place.
- Prefer explicit return types in service/repository APIs.
- Log and classify errors centrally (`domain_error`, `authz_error`, `validation_error`).

## Suggested Execution Order
1. Phase 1 (core layers + compatibility re-exports).
2. Phase 2 (pages domain extraction).
3. Phase 3 (admin domain extraction).
4. Phase 4 (UI cleanup and renaming).
5. Phase 5 (tests + CI hard gate).

## First PR Scope Recommendation
- Do only Phase 1 + small part of Phase 2:
  - introduce `page.service.ts`
  - migrate `app/api/pages/[pageId]/publish/route.ts` to service call
- Keep PR small, measurable, and reversible.
