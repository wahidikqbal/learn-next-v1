'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';
import { requireUser } from '@/lib/authz';
import {
    createPageForOwner,
    deletePageForActor,
    setPagePublishStatusForActor,
} from '@/features/pages/services/page.service';

export async function createPageAction(formData: FormData) {
    const session = await requireUser();
    const name = String(formData.get('name') ?? '').trim();
    const templateId = String(formData.get('templateId') ?? '').trim();
    const subdomain = String(formData.get('subdomain') ?? '');

    const result = await createPageForOwner({
        ownerId: session.user.id,
        name,
        templateId,
        subdomain,
    });

    if (!result.ok) {
        if (result.reason === 'template_not_found') {
            redirect('/dashboard?error=template-not-found');
        }
        if (
            result.reason === 'invalid_name' ||
            result.reason === 'invalid_template' ||
            result.reason === 'invalid_subdomain'
        ) {
            redirect('/dashboard?error=invalid-create');
        }
        if (result.reason === 'subdomain_conflict') {
            redirect('/dashboard?error=subdomain-conflict');
        }
        redirect('/dashboard?error=create-failed');
    }

    redirect(`/edit/${result.page.id}`);
}

export async function deletePageAction(formData: FormData) {
    const session = await requireUser();
    const pageId = String(formData.get('pageId') ?? '');

    await deletePageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    revalidatePath('/dashboard');
    revalidatePath('/websites');
}

export async function publishPageAction(formData: FormData) {
    const session = await requireUser();
    const pageId = String(formData.get('pageId') ?? '');

    await setPagePublishStatusForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
        isPublished: true,
    });

    revalidatePath('/dashboard');
    revalidatePath('/websites');
}

export async function unpublishPageAction(formData: FormData) {
    const session = await requireUser();
    const pageId = String(formData.get('pageId') ?? '');

    await setPagePublishStatusForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
        isPublished: false,
    });

    revalidatePath('/dashboard');
    revalidatePath('/websites');
}

export async function signOutAction() {
    await signOut({ redirectTo: '/login' });
}
