import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { POST } from '@/app/api/preview-token/route';
import { auth } from '@/auth';
import { getPageForActor } from '@/features/pages/services/page.service';
import { createPreviewToken } from '@/shared/lib/preview-token';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/features/pages/services/page.service', () => ({
    getPageForActor: vi.fn(),
}));

vi.mock('@/shared/lib/preview-token', () => ({
    createPreviewToken: vi.fn(),
    verifyPreviewToken: vi.fn(),
}));

const authMock = vi.mocked(auth);
const getPageForActorMock = vi.mocked(getPageForActor);
const createPreviewTokenMock = vi.mocked(createPreviewToken);

describe('POST /api/preview-token', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when user is unauthenticated', async () => {
        authMock.mockResolvedValue(null as never);

        const response = await POST(
            new Request('http://localhost/api/preview-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId: 'page-1' }),
            })
        );

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when pageId is empty', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);

        const response = await POST(
            new Request('http://localhost/api/preview-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId: '' }),
            })
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Page ID wajib diisi.' });
    });

    it('returns 404 when page access is denied/not found', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
        getPageForActorMock.mockResolvedValue({ ok: false, reason: 'not_found' });

        const response = await POST(
            new Request('http://localhost/api/preview-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId: 'page-1' }),
            })
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Halaman tidak ditemukan.' });
    });

    it('returns token payload when successful', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
        getPageForActorMock.mockResolvedValue({
            ok: true,
            page: { id: 'page-1', ownerId: 'user-1' },
        } as never);
        createPreviewTokenMock.mockReturnValue({
            token: 'signed-token',
            expiresAt: '2026-02-18T00:00:00.000Z',
        });

        const response = await POST(
            new Request('http://localhost/api/preview-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId: 'page-1' }),
            })
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            token: 'signed-token',
            expiresAt: '2026-02-18T00:00:00.000Z',
            previewUrl: '/preview/token/signed-token',
        });
    });
});

