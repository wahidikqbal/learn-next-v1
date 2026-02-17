'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';
import { requireUser } from '@/lib/authz';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import { defaultTemplates } from '@/app/components/templates/defaults';
import {
    createPageForOwner,
    deletePageForActor,
    setPagePublishStatusForActor,
} from '@/features/pages/services/page.service';
import {
    bootstrapLaravelWebsite,
    deleteLaravelPage,
    isLaravelApiError,
    publishLaravelPage,
    unpublishLaravelPage,
} from '@/features/pages/services/laravel-page.service';

export async function createPageAction(formData: FormData) {
    const session = await requireUser();
    const name = String(formData.get('name') ?? '').trim();
    const templateId = String(formData.get('templateId') ?? '').trim();
    const subdomain = String(formData.get('subdomain') ?? '');

    if (isLaravelPhase2Enabled()) {
        const template = defaultTemplates.find((item) => item.id === templateId);
        if (!templateId || !template) {
            redirect('/dashboard?error=template-not-found');
        }

        try {
            const page = await bootstrapLaravelWebsite({
                ownerUserId: session.user.id,
                name,
                subdomain,
                templateId,
                homeBlocks: template.blocks,
            });

            redirect(`/edit/${page.id}`);
        } catch (error) {
            const maybeRedirectError = error as { digest?: string; message?: string } | undefined;
            if (
                maybeRedirectError?.message === 'NEXT_REDIRECT' ||
                (typeof maybeRedirectError?.digest === 'string' &&
                    maybeRedirectError.digest.startsWith('NEXT_REDIRECT'))
            ) {
                throw error;
            }

            console.warn('[phase2] Laravel bootstrap website failed in createPageAction.', error);
            if (isLaravelApiError(error)) {
                if (error.status === 409 || error.code === 'SUBDOMAIN_CONFLICT') {
                    redirect('/dashboard?error=subdomain-conflict');
                }
                if (error.status === 422) {
                    redirect('/dashboard?error=invalid-create');
                }
            }

            redirect('/dashboard?error=create-failed');
        }
    }

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

    if (isLaravelPhase2Enabled()) {
        try {
            await deleteLaravelPage(pageId);
            revalidatePath('/dashboard');
            revalidatePath('/websites');
            return;
        } catch (error) {
            console.warn('[phase2] Laravel delete action failed, fallback to legacy service.', error);
        }
    }

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

    if (isLaravelPhase2Enabled()) {
        try {
            await publishLaravelPage(pageId);
            revalidatePath('/dashboard');
            revalidatePath('/websites');
            return;
        } catch (error) {
            console.warn('[phase2] Laravel publish action failed, fallback to legacy service.', error);
        }
    }

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

    if (isLaravelPhase2Enabled()) {
        try {
            await unpublishLaravelPage(pageId);
            revalidatePath('/dashboard');
            revalidatePath('/websites');
            return;
        } catch (error) {
            console.warn('[phase2] Laravel unpublish action failed, fallback to legacy service.', error);
        }
    }

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
