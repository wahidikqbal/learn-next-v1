import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { DELETE, GET, PATCH } from '@/app/api/pages/[pageId]/route';
import { auth } from '@/auth';
import {
    deletePageForActor,
    getPageForActor,
    updatePageForActor,
} from '@/features/pages/services/page.service';

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

const authMock = vi.mocked(auth);
const getPageForActorMock = vi.mocked(getPageForActor);
const updatePageForActorMock = vi.mocked(updatePageForActor);
const deletePageForActorMock = vi.mocked(deletePageForActor);

describe('/api/pages/[pageId] route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
                page: { id: 'page-1', name: 'My Page' },
            } as never);

            const response = await GET(new Request('http://localhost/api/pages/page-1'), {
                params: Promise.resolve({ pageId: 'page-1' }),
            });

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ page: { id: 'page-1', name: 'My Page' } });
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
                page: { id: 'page-1', name: 'Updated Name' },
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
            expect(await response.json()).toEqual({ page: { id: 'page-1', name: 'Updated Name' } });
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
    });
});
