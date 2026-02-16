import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import {
    createPageForOwner,
    publishCustomPageForOwner,
    publishPageForActor,
} from '@/features/pages/services/page.service';
import {
    createPageRecord,
    findPageById,
    setPagePublishedById,
} from '@/features/pages/repositories/page.repository';

vi.mock('@/features/pages/repositories/page.repository', () => ({
    createPageRecord: vi.fn(),
    deletePageById: vi.fn(),
    findPageById: vi.fn(),
    listPagesByOwner: vi.fn(),
    setPagePublishedById: vi.fn(),
    updatePageRecord: vi.fn(),
}));

vi.mock('@/app/components/templates/defaults', () => ({
    defaultTemplates: [
        {
            id: 'template-1',
            blocks: [{ id: 'hero', type: 'hero', props: { heading: 'Hello' } }],
        },
    ],
}));

vi.mock('@/lib/pages', () => ({
    normalizeSubdomain: (input: string) => input.trim().toLowerCase(),
    isValidSubdomain: (input: string) => /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(input),
}));

const createPageRecordMock = vi.mocked(createPageRecord);
const findPageByIdMock = vi.mocked(findPageById);
const setPagePublishedByIdMock = vi.mocked(setPagePublishedById);

describe('page.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns invalid_name for empty page name', async () => {
        const result = await createPageForOwner({
            ownerId: 'user-1',
            name: '   ',
            templateId: 'template-1',
            subdomain: 'my-page',
        });

        expect(result).toEqual({ ok: false, reason: 'invalid_name' });
        expect(createPageRecordMock).not.toHaveBeenCalled();
    });

    it('creates page with normalized subdomain and trimmed values', async () => {
        createPageRecordMock.mockResolvedValue({
            id: 'page-1',
            name: 'Landing',
            templateId: 'template-1',
            subdomain: 'new-site',
            ownerId: 'user-1',
            blocks: [],
            isPublished: false,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        } as never);

        const result = await createPageForOwner({
            ownerId: 'user-1',
            name: ' Landing ',
            templateId: 'template-1',
            subdomain: ' New-Site ',
        });

        expect(result.ok).toBe(true);
        expect(createPageRecordMock).toHaveBeenCalledWith(
            expect.objectContaining({
                ownerId: 'user-1',
                name: 'Landing',
                templateId: 'template-1',
                subdomain: 'new-site',
            })
        );
    });

    it('returns forbidden when non-owner non-admin publishes page', async () => {
        findPageByIdMock.mockResolvedValue({
            id: 'page-1',
            ownerId: 'owner-1',
        } as never);

        const result = await publishPageForActor({
            pageId: 'page-1',
            actorUserId: 'user-2',
            actorRole: Role.USER,
        });

        expect(result).toEqual({ ok: false, reason: 'forbidden' });
        expect(setPagePublishedByIdMock).not.toHaveBeenCalled();
    });

    it('publishes page for owner', async () => {
        findPageByIdMock.mockResolvedValue({
            id: 'page-1',
            ownerId: 'owner-1',
        } as never);
        setPagePublishedByIdMock.mockResolvedValue({
            id: 'page-1',
            subdomain: 'owner-site',
            updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        } as never);

        const result = await publishPageForActor({
            pageId: 'page-1',
            actorUserId: 'owner-1',
            actorRole: Role.USER,
        });

        expect(result.ok).toBe(true);
        expect(setPagePublishedByIdMock).toHaveBeenCalledWith({
            pageId: 'page-1',
            isPublished: true,
        });
    });

    it('returns invalid_blocks for custom publish when blocks is not array', async () => {
        const result = await publishCustomPageForOwner({
            ownerId: 'user-1',
            subdomain: 'custom-sub',
            blocks: { bad: true },
        });

        expect(result).toEqual({ ok: false, reason: 'invalid_blocks' });
        expect(createPageRecordMock).not.toHaveBeenCalled();
    });
});
