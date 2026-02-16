import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { isPrimaryAdminEmail } from '@/lib/admin-config';
import type { AdminActionResult } from '@/features/admin/types/admin-action-result';

const SERIALIZABLE_RETRY_LIMIT = 2;

async function runWithSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            const isWriteConflict =
                error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

            if (!isWriteConflict || attempt >= SERIALIZABLE_RETRY_LIMIT) {
                throw error;
            }
        }
    }
}

type DeleteUserByAdminInput = {
    userId: string;
    actorUserId: string;
    actorEmail: string | null | undefined;
};

export async function listAdminOverview() {
    return Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { pages: true },
                },
            },
        }),
        prisma.page.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                owner: true,
            },
        }),
    ]);
}

export async function setUserRoleByAdmin(userId: string, role: Role): Promise<AdminActionResult> {
    if (!userId || (role !== Role.ADMIN && role !== Role.USER)) {
        return { ok: false, reason: 'invalid_input', message: 'Input role tidak valid.' };
    }

    return runWithSerializableRetry(() =>
        prisma.$transaction(
            async (tx) => {
                const targetUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: { email: true, role: true },
                });

                if (!targetUser) {
                    return { ok: false, reason: 'not_found', message: 'User tidak ditemukan.' } as const;
                }

                if (isPrimaryAdminEmail(targetUser.email)) {
                    return {
                        ok: false,
                        reason: 'primary_admin_protected',
                        message: 'Primary admin tidak bisa diubah rolenya.',
                    } as const;
                }

                if (targetUser.role === Role.ADMIN && role === Role.USER) {
                    const adminCount = await tx.user.count({
                        where: { role: Role.ADMIN },
                    });

                    if (adminCount <= 1) {
                        return {
                            ok: false,
                            reason: 'last_admin_protected',
                            message: 'Admin terakhir tidak bisa diturunkan menjadi user.',
                        } as const;
                    }
                }

                await tx.user.update({
                    where: { id: userId },
                    data: { role },
                });

                return { ok: true } as const;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )
    );
}

export async function deleteAnyPageByAdmin(pageId: string) {
    if (!pageId) {
        return;
    }

    await prisma.page.delete({
        where: { id: pageId },
    });
}

export async function deleteUserByAdmin(input: DeleteUserByAdminInput): Promise<AdminActionResult> {
    const userId = input.userId;

    if (!userId) {
        return { ok: false, reason: 'invalid_input', message: 'Input user tidak valid.' };
    }

    if (userId === input.actorUserId) {
        return { ok: false, reason: 'self_protected', message: 'Akun sendiri tidak bisa dihapus.' };
    }

    return runWithSerializableRetry(() =>
        prisma.$transaction(
            async (tx) => {
                const targetUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: { email: true, role: true },
                });

                if (!targetUser) {
                    return { ok: false, reason: 'not_found', message: 'User tidak ditemukan.' } as const;
                }

                if (isPrimaryAdminEmail(targetUser.email)) {
                    return {
                        ok: false,
                        reason: 'primary_admin_protected',
                        message: 'Primary admin tidak bisa dihapus.',
                    } as const;
                }

                if (
                    targetUser.email &&
                    input.actorEmail &&
                    targetUser.email.toLowerCase() === input.actorEmail.toLowerCase()
                ) {
                    return { ok: false, reason: 'self_protected', message: 'Akun sendiri tidak bisa dihapus.' } as const;
                }

                if (targetUser.role === Role.ADMIN) {
                    const adminCount = await tx.user.count({
                        where: { role: Role.ADMIN },
                    });

                    if (adminCount <= 1) {
                        return {
                            ok: false,
                            reason: 'last_admin_protected',
                            message: 'Admin terakhir tidak bisa dihapus.',
                        } as const;
                    }
                }

                await tx.user.delete({
                    where: { id: userId },
                });

                return { ok: true } as const;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )
    );
}
