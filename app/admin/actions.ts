'use server';

import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { requireAdmin } from '@/lib/authz';
import {
    deleteAnyPageByAdmin,
    deleteUserByAdmin,
    setUserRoleByAdmin,
} from '@/features/admin/services/admin.service';
import type { AdminActionResult } from './action-types';

export async function setUserRoleAction(formData: FormData): Promise<AdminActionResult> {
    await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    const roleValue = String(formData.get('role') ?? '');
    const role = roleValue === Role.ADMIN ? Role.ADMIN : roleValue === Role.USER ? Role.USER : null;

    if (!role) {
        return { ok: false, reason: 'invalid_input', message: 'Input role tidak valid.' };
    }

    const didChange = await setUserRoleByAdmin(userId, role);

    if (didChange.ok) {
        revalidatePath('/admin');
    }

    return didChange;
}

export async function deleteAnyPageAction(formData: FormData) {
    await requireAdmin();
    const pageId = String(formData.get('pageId') ?? '');

    await deleteAnyPageByAdmin(pageId);
    revalidatePath('/admin');
}

export async function deleteUserAction(formData: FormData): Promise<AdminActionResult> {
    const session = await requireAdmin();
    const userId = String(formData.get('userId') ?? '');

    const didDelete = await deleteUserByAdmin({
        userId,
        actorUserId: session.user.id,
        actorEmail: session.user.email,
    });

    if (didDelete.ok) {
        revalidatePath('/admin');
    }

    return didDelete;
}
