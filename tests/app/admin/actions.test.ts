import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import {
    deleteAnyPageAction,
    deleteUserAction,
    setUserRoleAction,
} from '@/app/admin/actions';
import { requireAdmin } from '@/lib/authz';
import {
    deleteAnyPageByAdmin,
    deleteUserByAdmin,
    setUserRoleByAdmin,
} from '@/features/admin/services/admin.service';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
    requireAdmin: vi.fn(),
}));

vi.mock('@/features/admin/services/admin.service', () => ({
    deleteAnyPageByAdmin: vi.fn(),
    deleteUserByAdmin: vi.fn(),
    listAdminOverview: vi.fn(),
    setUserRoleByAdmin: vi.fn(),
}));

const requireAdminMock = vi.mocked(requireAdmin);
const setUserRoleByAdminMock = vi.mocked(setUserRoleByAdmin);
const deleteAnyPageByAdminMock = vi.mocked(deleteAnyPageByAdmin);
const deleteUserByAdminMock = vi.mocked(deleteUserByAdmin);
const revalidatePathMock = vi.mocked(revalidatePath);

describe('admin actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        requireAdminMock.mockResolvedValue({
            user: { id: 'admin-1', email: 'admin@example.com', role: Role.ADMIN },
        } as never);
    });

    it('setUserRoleAction returns invalid_input for invalid role', async () => {
        const formData = new FormData();
        formData.set('userId', 'user-1');
        formData.set('role', 'SUPER_ADMIN');

        const result = await setUserRoleAction(formData);

        expect(result).toEqual({
            ok: false,
            reason: 'invalid_input',
            message: 'Input role tidak valid.',
        });
        expect(setUserRoleByAdminMock).not.toHaveBeenCalled();
    });

    it('setUserRoleAction revalidates admin page on success', async () => {
        setUserRoleByAdminMock.mockResolvedValue({ ok: true });

        const formData = new FormData();
        formData.set('userId', 'user-1');
        formData.set('role', Role.ADMIN);

        const result = await setUserRoleAction(formData);

        expect(result).toEqual({ ok: true });
        expect(setUserRoleByAdminMock).toHaveBeenCalledWith('user-1', Role.ADMIN);
        expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
    });

    it('deleteAnyPageAction delegates to service and revalidates', async () => {
        const formData = new FormData();
        formData.set('pageId', 'page-1');

        await deleteAnyPageAction(formData);

        expect(deleteAnyPageByAdminMock).toHaveBeenCalledWith('page-1');
        expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
    });

    it('deleteUserAction forwards actor context to service', async () => {
        deleteUserByAdminMock.mockResolvedValue({ ok: true });

        const formData = new FormData();
        formData.set('userId', 'user-2');

        const result = await deleteUserAction(formData);

        expect(result).toEqual({ ok: true });
        expect(deleteUserByAdminMock).toHaveBeenCalledWith({
            userId: 'user-2',
            actorUserId: 'admin-1',
            actorEmail: 'admin@example.com',
        });
        expect(revalidatePathMock).toHaveBeenCalledWith('/admin');
    });

    it('deleteUserAction returns service failure without revalidate', async () => {
        deleteUserByAdminMock.mockResolvedValue({
            ok: false,
            reason: 'self_protected',
            message: 'Akun sendiri tidak bisa dihapus.',
        });

        const formData = new FormData();
        formData.set('userId', 'admin-1');

        const result = await deleteUserAction(formData);

        expect(result).toEqual({
            ok: false,
            reason: 'self_protected',
            message: 'Akun sendiri tidak bisa dihapus.',
        });
        expect(revalidatePathMock).not.toHaveBeenCalled();
    });
});
