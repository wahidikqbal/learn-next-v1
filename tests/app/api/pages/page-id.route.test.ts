import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { DELETE, GET, PATCH } from '@/app/api/pages/[pageId]/route';
import { auth } from '@/auth';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    deletePageForActor,
    getPageForActor,
    updatePageForActor,
} from '@/features/pages/services/page.service';
import {
    deleteLaravelPage,
    getLaravelPageById,
    isLaravelApiError,
    saveLaravelPageDraft,
    updateLaravelPage,
} from '@/features/pages/services/laravel-page.service';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/features/pages/services/page.service', () => ({
    deletePageForActor: vi.fn(),
    getPageForActor: vi.fn(),
    publishCustomPageForOwner: vi.fn(),
    publishPageForActor: vi.fn(),
    updatePageForActor: vi.fn(),
}));

vi.mock('@/shared/config/env', () => ({
    isLaravelPhase2Enabled: vi.fn(() => false),
}));

vi.mock('@/features/pages/services/laravel-page.service', () => ({
    deleteLaravelPage: vi.fn(),
    getLaravelPageById: vi.fn(),
    isLaravelApiError: vi.fn(() => false),
    saveLaravelPageDraft: vi.fn(),
    updateLaravelPage: vi.fn(),
}));

const authMock = vi.mocked(auth);
const isLaravelPhase2EnabledMock = vi.mocked(isLaravelPhase2Enabled);
const getPageForActorMock = vi.mocked(getPageForActor);
const updatePageForActorMock = vi.mocked(updatePageForActor);
const deletePageForActorMock = vi.mocked(deletePageForActor);
const getLaravelPageByIdMock = vi.mocked(getLaravelPageById);
const saveLaravelPageDraftMock = vi.mocked(saveLaravelPageDraft);
const updateLaravelPageMock = vi.mocked(updateLaravelPage);
const deleteLaravelPageMock = vi.mocked(deleteLaravelPage);
const isLaravelApiErrorMock = vi.mocked(isLaravelApiError);

describe('/api/pages/[pageId] route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isLaravelPhase2EnabledMock.mockReturnValue(false);
    });

    describe('GET', () => {
        it('returns 401 when unauthenticated', async () => {
            authMock.mockResolvedValue(null as never);

            const response = await GET(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(401);
            expect(await response.json()).toEqual({ error: 'Unauthorized' });
        });

        it('returns 404 when page not found/forbidden', async () => {
            authMock.mockResolvedValue({
                user: { id: 'user-1', role: Role.USER },
            } as never);
            getPageForActorMock.mockResolvedValue({ ok: false, reason: 'not_found' });

            const response = await GET(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: 'Halaman tidak ditemukan.' });
        });

        it('returns 200 with page payload', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            getPageForActorMock.mockResolvedValue({
                ok: true,
                page: { id: 'page-1', name: 'My Page', slug: '/' },
            } as never);

            const response = await GET(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ page: { id: 'page-1', name: 'My Page', slug: '/' } });
        });

        it('returns Laravel page payload when phase2 is enabled', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            isLaravelPhase2EnabledMock.mockReturnValue(true);
            getLaravelPageByIdMock.mockResolvedValue({
                id: 'page-1',
                tenantId: 'tenant-1',
                title: 'Laravel Page',
                slug: '/about',
                tenantSubdomain: 'demo',
                blocks: { schemaVersion: 1, blocks: [] },
                hasDraft: true,
            });

            const response = await GET(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                page: { id: 'page-1', name: 'Laravel Page', slug: '/about', subdomain: 'demo', blocks: [] },
            });
        });
    });

    describe('PATCH', () => {
        it('returns 400 on invalid JSON payload', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{',
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Payload tidak valid.' });
        });

        it('returns 400 for invalid subdomain', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            updatePageForActorMock.mockResolvedValue({ ok: false, reason: 'invalid_subdomain' });

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subdomain: 'INVALID***' }),
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Subdomain tidak valid.' });
        });

        it('returns 200 for successful update', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            updatePageForActorMock.mockResolvedValue({
                ok: true,
                page: { id: 'page-1', name: 'Updated Name', slug: '/' },
            } as never);

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Updated Name' }),
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ page: { id: 'page-1', name: 'Updated Name', slug: '/' } });
        });

        it('returns 422 when subdomain update requested in phase2', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            isLaravelPhase2EnabledMock.mockReturnValue(true);

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subdomain: 'new-subdomain' }),
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(422);
            expect(await response.json()).toEqual({
                error: 'Subdomain tenant tidak bisa diubah dari editor halaman.',
            });
        });

        it('maps Laravel 409 error to slug conflict', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            isLaravelPhase2EnabledMock.mockReturnValue(true);
            isLaravelApiErrorMock.mockReturnValue(true);
            updateLaravelPageMock.mockRejectedValue({ status: 409 });

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'Updated Name' }),
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(409);
            expect(await response.json()).toEqual({ error: 'Slug sudah dipakai.' });
        });

        it('saves draft and returns latest Laravel page in phase2', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            isLaravelPhase2EnabledMock.mockReturnValue(true);
            saveLaravelPageDraftMock.mockResolvedValue(undefined);
            getLaravelPageByIdMock.mockResolvedValue({
                id: 'page-1',
                tenantId: 'tenant-1',
                title: 'Updated Laravel',
                slug: '/',
                tenantSubdomain: 'demo',
                blocks: {
                    schemaVersion: 1,
                    blocks: [{ id: 'hero', type: 'hero', props: { heading: 'Hello' } }],
                },
                hasDraft: true,
            });

            const response = await PATCH(
                new Request('http://localhost/api/pages/page-1', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blocks: [{ id: 'hero', type: 'hero', props: { heading: 'Hello' } }] }),
                }),
                { params: Promise.resolve({ pageId: 'page-1' }) }
            );

            expect(response.status).toBe(200);
            expect(saveLaravelPageDraftMock).toHaveBeenCalled();
            expect(await response.json()).toEqual({
                page: {
                    id: 'page-1',
                    name: 'Updated Laravel',
                    slug: '/',
                    subdomain: 'demo',
                    blocks: [{ id: 'hero', type: 'hero', props: { heading: 'Hello' } }],
                },
            });
        });
    });

    describe('DELETE', () => {
        it('returns 404 when delete target not found', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            deletePageForActorMock.mockResolvedValue({ ok: false, reason: 'not_found' });

            const response = await DELETE(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: 'Halaman tidak ditemukan.' });
        });

        it('returns 200 for successful delete', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            deletePageForActorMock.mockResolvedValue({ ok: true });

            const response = await DELETE(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ success: true });
        });

        it('maps Laravel 422 delete error for system page in phase2', async () => {
            authMock.mockResolvedValue({
                user: { id: 'owner-1', role: Role.USER },
            } as never);
            isLaravelPhase2EnabledMock.mockReturnValue(true);
            isLaravelApiErrorMock.mockReturnValue(true);
            deleteLaravelPageMock.mockRejectedValue({ status: 422 });

            const response = await DELETE(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(422);
            expect(await response.json()).toEqual({ error: 'Halaman sistem tidak bisa dihapus.' });
        });
    });
});
