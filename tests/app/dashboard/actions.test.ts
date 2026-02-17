import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import {
    createPageAction,
    deletePageAction,
    publishPageAction,
    signOutAction,
    unpublishPageAction,
} from '@/app/dashboard/actions';
import { requireUser } from '@/lib/authz';
import {
    createPageForOwner,
    deletePageForActor,
    setPagePublishStatusForActor,
} from '@/features/pages/services/page.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
    }),
}));

vi.mock('@/lib/authz', () => ({
    requireUser: vi.fn(),
}));

vi.mock('@/features/pages/services/page.service', () => ({
    createPageForOwner: vi.fn(),
    deletePageForActor: vi.fn(),
    getPageForActor: vi.fn(),
    listPagesForOwner: vi.fn(),
    publishCustomPageForOwner: vi.fn(),
    publishPageForActor: vi.fn(),
    setPagePublishStatusForActor: vi.fn(),
    updatePageForActor: vi.fn(),
}));

vi.mock('@/auth', () => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

const requireUserMock = vi.mocked(requireUser);
const createPageForOwnerMock = vi.mocked(createPageForOwner);
const deletePageForActorMock = vi.mocked(deletePageForActor);
const setPagePublishStatusForActorMock = vi.mocked(setPagePublishStatusForActor);
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);
const signOutMock = vi.mocked(signOut);

describe('dashboard actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireUserMock.mockResolvedValue({
            user: { id: 'user-1', role: Role.USER },
        } as never);
    });

    it('createPageAction redirects to edit page on success', async () => {
        createPageForOwnerMock.mockResolvedValue({
            ok: true,
            page: { id: 'page-123' },
        } as never);

        const formData = new FormData();
        formData.set('name', 'Landing');
        formData.set('templateId', 'template-1');
        formData.set('subdomain', 'landing');

        await expect(createPageAction(formData)).rejects.toThrow('NEXT_REDIRECT:/edit/page-123');
        expect(createPageForOwnerMock).toHaveBeenCalledWith({
            ownerId: 'user-1',
            name: 'Landing',
            templateId: 'template-1',
            subdomain: 'landing',
        });
    });

    it('createPageAction maps template_not_found error to proper redirect', async () => {
        createPageForOwnerMock.mockResolvedValue({
            ok: false,
            reason: 'template_not_found',
        });

        const formData = new FormData();
        formData.set('name', 'Landing');
        formData.set('templateId', 'missing');
        formData.set('subdomain', 'landing');

        await expect(createPageAction(formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard?error=template-not-found');
    });

    it('deletePageAction calls service with actor context and revalidates pages', async () => {
        const formData = new FormData();
        formData.set('pageId', 'page-1');

        await deletePageAction(formData);

        expect(deletePageForActorMock).toHaveBeenCalledWith({
            pageId: 'page-1',
            actorUserId: 'user-1',
            actorRole: Role.USER,
        });
        expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard');
        expect(revalidatePathMock).toHaveBeenCalledWith('/websites');
    });

    it('publishPageAction sets isPublished true', async () => {
        const formData = new FormData();
        formData.set('pageId', 'page-1');

        await publishPageAction(formData);

        expect(setPagePublishStatusForActorMock).toHaveBeenCalledWith({
            pageId: 'page-1',
            actorUserId: 'user-1',
            actorRole: Role.USER,
            isPublished: true,
        });
    });

    it('unpublishPageAction sets isPublished false', async () => {
        const formData = new FormData();
        formData.set('pageId', 'page-1');

        await unpublishPageAction(formData);

        expect(setPagePublishStatusForActorMock).toHaveBeenCalledWith({
            pageId: 'page-1',
            actorUserId: 'user-1',
            actorRole: Role.USER,
            isPublished: false,
        });
    });

    it('signOutAction forwards redirect target to auth signOut', async () => {
        await signOutAction();

        expect(signOutMock).toHaveBeenCalledWith({ redirectTo: '/login' });
    });

    it('calls redirect with create-failed for unknown create error', async () => {
        createPageForOwnerMock.mockResolvedValue({
            ok: false,
            reason: 'unknown_error',
        });

        const formData = new FormData();
        formData.set('name', 'Landing');
        formData.set('templateId', 'template-1');
        formData.set('subdomain', 'landing');

        await expect(createPageAction(formData)).rejects.toThrow('NEXT_REDIRECT:/dashboard?error=create-failed');
        expect(redirectMock).toHaveBeenCalled();
    });
});
