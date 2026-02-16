'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { isPrimaryAdminEmail } from '@/lib/admin-config';
import type { AdminActionResult } from './action-types';

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

export async function setUserRoleAction(formData: FormData): Promise<AdminActionResult> {
    await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    const role = String(formData.get('role') ?? '');

    if (!userId || (role !== Role.ADMIN && role !== Role.USER)) {
        return { ok: false, reason: 'invalid_input', message: 'Input role tidak valid.' };
    }

    const didChange = await runWithSerializableRetry(() =>
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
                    data: { role: role as Role },
                });

                return { ok: true } as const;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )
    );

    if (didChange.ok) {
        revalidatePath('/admin');
    }

    return didChange;
}

export async function deleteAnyPageAction(formData: FormData) {
    await requireAdmin();
    const pageId = String(formData.get('pageId') ?? '');

    if (!pageId) {
        return;
    }

    await prisma.page.delete({
        where: { id: pageId },
    });

    revalidatePath('/admin');
}

export async function deleteUserAction(formData: FormData): Promise<AdminActionResult> {
    const session = await requireAdmin();
    const userId = String(formData.get('userId') ?? '');

    if (!userId) {
        return { ok: false, reason: 'invalid_input', message: 'Input user tidak valid.' };
    }

    if (userId === session.user.id) {
        return { ok: false, reason: 'self_protected', message: 'Akun sendiri tidak bisa dihapus.' };
    }

    const didDelete = await runWithSerializableRetry(() =>
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
                    session.user.email &&
                    targetUser.email.toLowerCase() === session.user.email.toLowerCase()
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

    if (didDelete.ok) {
        revalidatePath('/admin');
    }

    return didDelete;
}
