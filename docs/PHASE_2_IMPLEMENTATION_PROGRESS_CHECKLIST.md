# Phase 2 Implementation Progress Checklist

## Status Legend
- `[x]` done
- `[~]` in progress
- `[ ]` not started

## Baseline Carried from End of Phase 1
- [x] Tenant resolver contract + host resolution active (Laravel).
- [x] Public SSR endpoint minimal working (`GET /api/public/site`).
- [x] Multi-page seed demo available (`/`, `/about`, `/contact`).
- [x] Next.js SSR reads payload from Laravel for demo tenant.

## A. Backend Laravel - Tenant Page Management
- [x] Implement `GET /api/tenants/{tenantId}/pages`
- [x] Implement `POST /api/tenants/{tenantId}/pages`
- [x] Implement `PATCH /api/pages/{pageId}`
- [x] Implement `DELETE /api/pages/{pageId}` soft delete
- [x] Slug validation and normalization
- [x] Slug conflict response mapping (`409`)

## B. Backend Laravel - Draft/Publish Versioning
- [x] Implement `PUT /api/pages/{pageId}/draft`
- [x] Implement `POST /api/pages/{pageId}/publish`
- [x] Archive previous published version on publish
- [x] Ensure atomic transaction for publish

## C. Backend Rules
- [x] Protect system pages from deletion
- [x] Keep system pages editable
- [x] Add reserved slug guard for system paths

## D. Next.js Integration
- [x] Dashboard page list switch to Laravel source
- [x] Dashboard create/edit/delete switch to Laravel endpoints
- [x] Editor save draft switch to Laravel endpoint
- [x] Editor publish per-page switch to Laravel endpoint
- [x] Feature flag/fallback strategy for legacy path

## E. Testing
- [x] Laravel feature tests for CRUD pages
- [x] Laravel feature tests for draft/publish flow
- [x] Laravel feature tests for owner listing + unpublish endpoint
- [x] Laravel feature tests for bootstrap website + reserved slug guard
- [x] Next integration tests for status mapping (page route + publish route, phase2 mode)
- [x] E2E create -> edit metadata -> publish -> public access by slug

## Current Focus
- [x] Phase 2 planning finalized, execution checklist ready.
- [x] Start implementation batch-1: backend CRUD pages.
- [x] Batch-2 implemented: draft/publish version workflow.
- [x] Batch-3 implemented: websites list source switch to Laravel + publish/unpublish/delete action switch by feature flag.
- [~] Batch-4 in progress: create/edit custom page API migration.
- [x] Batch-4 partial done: bootstrap create website flow moved to Laravel via feature flag.
- [x] Batch-4 partial done: route status mapping hardened for Laravel errors (404/409/422/403).
