# Auth Cutover Plan (A -> B)

## Context
- Current state (A, transition): NextAuth + Prisma session remains in Next.js database (`webbuilder`).
- Target state (B): Laravel becomes authentication source of truth, Next.js consumes Laravel-issued auth context (token/session).

## Why Move to B
- Clear ownership boundary: backend API + auth in one place (Laravel).
- Easier multi-client expansion (mobile app, partner API, headless usage).
- Reduced dual-schema maintenance and less auth drift risk.

## Migration Principles
- No big-bang auth rewrite.
- Dual-run compatibility window.
- Every cutover step has rollback.
- Track auth errors with explicit telemetry before final switch.

## Phase 0 - Preconditions
- [ ] Freeze auth-related schema changes in NextAuth tables.
- [ ] Add auth observability baseline:
  - login success/failure
  - token refresh failure
  - unauthorized API call rate
- [ ] Define canonical identity keys (`google_sub`, `email`) and mapping policy.

## Phase 1 - Laravel Auth Foundation
- [ ] Implement Laravel Google OAuth flow and callback.
- [ ] Create Laravel auth/session tables (or Sanctum/JWT strategy).
- [ ] Add endpoint `GET /api/auth/me` returning normalized user payload.
- [ ] Add endpoint `POST /api/auth/logout`.

## Phase 2 - Next.js Consumer Mode
- [ ] Add middleware/token reader in Next.js for Laravel-issued auth token.
- [ ] Add auth service adapter in Next:
  - legacy mode: NextAuth session
  - new mode: Laravel token introspection (`/api/auth/me`)
- [ ] Feature flag: `ENABLE_LARAVEL_AUTH`.

## Phase 3 - Dual-Run + Shadow Validation
- [ ] Keep NextAuth active, but shadow-check identity against Laravel auth response.
- [ ] Log mismatch events:
  - role mismatch
  - user not found in Laravel
  - expired/invalid token
- [ ] Resolve all mismatch classes to zero critical issues.

## Phase 4 - Cutover
- [ ] Switch protected routes to Laravel auth mode (`ENABLE_LARAVEL_AUTH=1`).
- [ ] Keep rollback toggle for one release window.
- [ ] Disable new NextAuth session creation after stability period.

## Phase 5 - Cleanup
- [ ] Remove NextAuth adapters/handlers from runtime path.
- [ ] Remove unused auth tables from Next.js DB (after backup + retention window).
- [ ] Finalize documentation and runbook.

## Rollback Plan
- Toggle `ENABLE_LARAVEL_AUTH=0`.
- Re-enable NextAuth session checks immediately.
- Keep user-facing session continuity by preserving cookie compatibility during window.

## Done Criteria
- All protected flows work with Laravel auth only.
- Next.js no longer depends on NextAuth DB session tables for runtime auth.
- Monitoring shows no elevated unauthorized/refresh errors for 7 consecutive days.

