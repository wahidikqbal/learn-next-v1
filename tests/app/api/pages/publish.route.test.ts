import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { POST } from '@/app/api/pages/[pageId]/publish/route';
import { auth } from '@/auth';
import { publishPageForActor } from '@/features/pages/services/page.service';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import { isLaravelApiError, publishLaravelPage } from '@/features/pages/services/laravel-page.service';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/features/pages/services/page.service', () => ({
    publishPageForActor: vi.fn(),
}));

vi.mock('@/shared/config/env', () => ({
    buildTenantUrl: vi.fn((subdomain: string) => `http://${subdomain}.localhost:3000`),
    isLaravelPhase2Enabled: vi.fn(() => false),
}));

vi.mock('@/features/pages/services/laravel-page.service', () => ({
    isLaravelApiError: vi.fn(() => false),
    publishLaravelPage: vi.fn(),
}));

const authMock = vi.mocked(auth);
const publishPageForActorMock = vi.mocked(publishPageForActor);
const isLaravelPhase2EnabledMock = vi.mocked(isLaravelPhase2Enabled);
const publishLaravelPageMock = vi.mocked(publishLaravelPage);
const isLaravelApiErrorMock = vi.mocked(isLaravelApiError);

describe('POST /api/pages/[pageId]/publish', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isLaravelPhase2EnabledMock.mockReturnValue(false);
    });

    it('returns 401 when user is not authenticated', async () => {
        authMock.mockResolvedValue(null as never);

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 404 when page is not found', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
        publishPageForActorMock.mockResolvedValue({ ok: false, reason: 'not_found' });

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Halaman tidak ditemukan.' });
    });

    it('returns 403 when actor is forbidden', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-2', role: Role.USER },
        } as never);
        publishPageForActorMock.mockResolvedValue({ ok: false, reason: 'forbidden' });

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns success payload when publish is successful', async () => {
        const publishedAt = new Date('2026-02-16T00:00:00.000Z');
        authMock.mockResolvedValue({
            user: { id: 'owner-1', role: Role.USER },
        } as never);
        publishPageForActorMock.mockResolvedValue({
            ok: true,
            page: {
                subdomain: 'my-site',
                publishedAt,
            },
        });

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true,
            subdomain: 'my-site',
            publishedAt: publishedAt.toISOString(),
            url: 'http://my-site.localhost:3000',
        });
    });

    it('returns success payload from Laravel when phase2 is enabled', async () => {
        authMock.mockResolvedValue({
            user: { id: 'owner-1', role: Role.USER },
        } as never);
        isLaravelPhase2EnabledMock.mockReturnValue(true);
        publishLaravelPageMock.mockResolvedValue({
            subdomain: 'tenant-laravel',
            publishedAt: '2026-02-17T10:00:00.000Z',
        });

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true,
            subdomain: 'tenant-laravel',
            publishedAt: '2026-02-17T10:00:00.000Z',
            url: 'http://tenant-laravel.localhost:3000',
        });
    });

    it('maps Laravel 422 publish error when no draft', async () => {
        authMock.mockResolvedValue({
            user: { id: 'owner-1', role: Role.USER },
        } as never);
        isLaravelPhase2EnabledMock.mockReturnValue(true);
        isLaravelApiErrorMock.mockReturnValue(true);
        publishLaravelPageMock.mockRejectedValue({ status: 422 });

        const response = await POST(new Request('http://localhost/api/pages/page-1/publish'), {
            params: Promise.resolve({ pageId: 'page-1' }),
        });

        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({ error: 'Draft belum tersedia untuk dipublish.' });
    });
});
