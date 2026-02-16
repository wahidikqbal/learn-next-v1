import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { deleteUserByAdmin, setUserRoleByAdmin } from '@/features/admin/services/admin.service';
import { isPrimaryAdminEmail } from '@/lib/admin-config';

const { prismaMock } = vi.hoisted(() => ({
    prismaMock: {
        $transaction: vi.fn(),
        user: {
            findMany: vi.fn(),
        },
        page: {
            findMany: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

vi.mock('@/shared/lib/prisma', () => ({
    prisma: prismaMock,
}));

vi.mock('@/lib/admin-config', () => ({
    isPrimaryAdminEmail: vi.fn(),
}));

const isPrimaryAdminEmailMock = vi.mocked(isPrimaryAdminEmail);

describe('admin.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        isPrimaryAdminEmailMock.mockReturnValue(false);
    });

    it('returns invalid_input on empty userId for role update', async () => {
        const result = await setUserRoleByAdmin('', Role.ADMIN);

        expect(result).toEqual({
            ok: false,
            reason: 'invalid_input',
            message: 'Input role tidak valid.',
        });
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('protects last admin from downgrade', async () => {
        prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
            callback({
                user: {
                    findUnique: vi.fn().mockResolvedValue({ email: 'admin@site.com', role: Role.ADMIN }),
                    count: vi.fn().mockResolvedValue(1),
                    update: vi.fn(),
                },
            })
        );

        const result = await setUserRoleByAdmin('user-1', Role.USER);

        expect(result).toEqual({
            ok: false,
            reason: 'last_admin_protected',
            message: 'Admin terakhir tidak bisa diturunkan menjadi user.',
        });
    });

    it('updates role when valid', async () => {
        const updateMock = vi.fn().mockResolvedValue(undefined);
        prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
            callback({
                user: {
                    findUnique: vi.fn().mockResolvedValue({ email: 'user@site.com', role: Role.USER }),
                    count: vi.fn().mockResolvedValue(2),
                    update: updateMock,
                },
            })
        );

        const result = await setUserRoleByAdmin('user-1', Role.ADMIN);

        expect(result).toEqual({ ok: true });
        expect(updateMock).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { role: Role.ADMIN },
        });
    });

    it('protects self delete', async () => {
        const result = await deleteUserByAdmin({
            userId: 'user-1',
            actorUserId: 'user-1',
            actorEmail: 'user@site.com',
        });

        expect(result).toEqual({
            ok: false,
            reason: 'self_protected',
            message: 'Akun sendiri tidak bisa dihapus.',
        });
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('protects primary admin delete', async () => {
        isPrimaryAdminEmailMock.mockReturnValue(true);

        prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
            callback({
                user: {
                    findUnique: vi.fn().mockResolvedValue({ email: 'admin@site.com', role: Role.ADMIN }),
                    count: vi.fn().mockResolvedValue(2),
                    delete: vi.fn(),
                },
            })
        );

        const result = await deleteUserByAdmin({
            userId: 'target-1',
            actorUserId: 'actor-1',
            actorEmail: 'actor@site.com',
        });

        expect(result).toEqual({
            ok: false,
            reason: 'primary_admin_protected',
            message: 'Primary admin tidak bisa dihapus.',
        });
    });
});
