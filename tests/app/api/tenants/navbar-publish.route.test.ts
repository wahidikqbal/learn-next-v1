import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/tenants/[tenantId]/navbar/publish/route';
import { auth } from '@/auth';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    isLaravelNavbarError,
    publishLaravelTenantNavbar,
} from '@/features/navbar/services/laravel-navbar.service';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/config/env', () => ({
    isLaravelPhase2Enabled: vi.fn(() => true),
}));

vi.mock('@/features/navbar/services/laravel-navbar.service', () => ({
    isLaravelNavbarError: vi.fn(() => false),
    publishLaravelTenantNavbar: vi.fn(),
}));

const authMock = vi.mocked(auth);
const phase2EnabledMock = vi.mocked(isLaravelPhase2Enabled);
const publishLaravelTenantNavbarMock = vi.mocked(publishLaravelTenantNavbar);
const isLaravelNavbarErrorMock = vi.mocked(isLaravelNavbarError);

describe('POST /api/tenants/[tenantId]/navbar/publish', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        phase2EnabledMock.mockReturnValue(true);
    });

    it('returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null as never);
        const response = await POST(new Request('http://localhost/api/tenants/t1/navbar/publish'), {
            params: Promise.resolve({ tenantId: 't1' }),
        });

        expect(response.status).toBe(401);
    });

    it('returns navbar payload on success', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } } as never);
        publishLaravelTenantNavbarMock.mockResolvedValue({
            tenantId: 't1',
            status: 'published',
            versionNo: 3,
            items: [],
            publishedAt: '2026-02-17T00:00:00.000Z',
        });

        const response = await POST(new Request('http://localhost/api/tenants/t1/navbar/publish'), {
            params: Promise.resolve({ tenantId: 't1' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            navbar: {
                tenantId: 't1',
                status: 'published',
                versionNo: 3,
                items: [],
                publishedAt: '2026-02-17T00:00:00.000Z',
            },
        });
    });

    it('maps Laravel error status/code', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } } as never);
        isLaravelNavbarErrorMock.mockReturnValue(true);
        publishLaravelTenantNavbarMock.mockRejectedValue({ status: 422, message: 'No draft navbar available' });

        const response = await POST(new Request('http://localhost/api/tenants/t1/navbar/publish'), {
            params: Promise.resolve({ tenantId: 't1' }),
        });

        expect(response.status).toBe(422);
        expect(await response.json()).toEqual({ error: 'No draft navbar available' });
    });
});

