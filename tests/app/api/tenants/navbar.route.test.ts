import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT } from '@/app/api/tenants/[tenantId]/navbar/route';
import { auth } from '@/auth';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    getLaravelTenantNavbar,
    isLaravelNavbarError,
    saveLaravelTenantNavbarDraft,
} from '@/features/navbar/services/laravel-navbar.service';

vi.mock('@/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/config/env', () => ({
    isLaravelPhase2Enabled: vi.fn(() => true),
}));

vi.mock('@/features/navbar/services/laravel-navbar.service', () => ({
    getLaravelTenantNavbar: vi.fn(),
    isLaravelNavbarError: vi.fn(() => false),
    saveLaravelTenantNavbarDraft: vi.fn(),
}));

const authMock = vi.mocked(auth);
const phase2EnabledMock = vi.mocked(isLaravelPhase2Enabled);
const getLaravelTenantNavbarMock = vi.mocked(getLaravelTenantNavbar);
const saveLaravelTenantNavbarDraftMock = vi.mocked(saveLaravelTenantNavbarDraft);
const isLaravelNavbarErrorMock = vi.mocked(isLaravelNavbarError);

describe('/api/tenants/[tenantId]/navbar route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        phase2EnabledMock.mockReturnValue(true);
    });

    it('GET returns 401 when unauthenticated', async () => {
        authMock.mockResolvedValue(null as never);
        const response = await GET(new Request('http://localhost/api/tenants/t1/navbar'), {
            params: Promise.resolve({ tenantId: 't1' }),
        });

        expect(response.status).toBe(401);
    });

    it('GET returns navbar payload when successful', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } } as never);
        getLaravelTenantNavbarMock.mockResolvedValue({
            tenantId: 't1',
            status: 'draft',
            versionNo: 2,
            items: [],
        });

        const response = await GET(new Request('http://localhost/api/tenants/t1/navbar'), {
            params: Promise.resolve({ tenantId: 't1' }),
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            navbar: { tenantId: 't1', status: 'draft', versionNo: 2, items: [] },
        });
    });

    it('PUT returns 422 when items is not array', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } } as never);
        const response = await PUT(
            new Request('http://localhost/api/tenants/t1/navbar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: {} }),
            }),
            { params: Promise.resolve({ tenantId: 't1' }) }
        );

        expect(response.status).toBe(422);
    });

    it('PUT maps Laravel error status', async () => {
        authMock.mockResolvedValue({ user: { id: 'u1' } } as never);
        isLaravelNavbarErrorMock.mockReturnValue(true);
        saveLaravelTenantNavbarDraftMock.mockRejectedValue({ status: 404, message: 'Tenant not found' });

        const response = await PUT(
            new Request('http://localhost/api/tenants/t1/navbar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [] }),
            }),
            { params: Promise.resolve({ tenantId: 't1' }) }
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Tenant not found' });
    });
});

