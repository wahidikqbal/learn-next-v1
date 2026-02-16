import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { POST } from '@/app/api/publish/route';
import { auth } from '@/auth';
import { publishCustomPageForOwner } from '@/features/pages/services/page.service';

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
const publishCustomPageForOwnerMock = vi.mocked(publishCustomPageForOwner);

describe('POST /api/publish', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when user is not authenticated', async () => {
        authMock.mockResolvedValue(null as never);

        const response = await POST(new Request('http://localhost/api/publish', { method: 'POST' }));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when payload is invalid JSON', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);

        const response = await POST(
            new Request('http://localhost/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{',
            })
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Payload tidak valid.' });
    });

    it('returns 409 when subdomain already exists', async () => {
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
        publishCustomPageForOwnerMock.mockResolvedValue({
            ok: false,
            reason: 'subdomain_conflict',
        });

        const response = await POST(
            new Request('http://localhost/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: 'my-subdomain',
                    blocks: [],
                }),
            })
        );

        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({ error: 'Subdomain sudah dipakai.' });
    });

    it('returns 200 with publish payload when successful', async () => {
        const publishedAt = new Date('2026-02-16T10:00:00.000Z');
        authMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
        publishCustomPageForOwnerMock.mockResolvedValue({
            ok: true,
            page: {
                id: 'page-1',
                subdomain: 'my-subdomain',
                publishedAt,
            },
        });

        const response = await POST(
            new Request('http://localhost/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: 'my-subdomain',
                    blocks: [],
                    templateId: 'custom',
                    name: 'My Site',
                }),
            })
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true,
            pageId: 'page-1',
            subdomain: 'my-subdomain',
            publishedAt: publishedAt.toISOString(),
            url: 'http://my-subdomain.localhost:3000',
        });
    });
});
