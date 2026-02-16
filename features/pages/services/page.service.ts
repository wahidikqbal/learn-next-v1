import { Prisma, Role } from '@prisma/client';
import { defaultTemplates } from '@/app/components/templates/defaults';
import { isValidSubdomain, normalizeSubdomain } from '@/lib/pages';
import {
    createPageRecord,
    deletePageById,
    findPageById,
    listPagesByOwner,
    setPagePublishedById,
    updatePageRecord,
} from '@/features/pages/repositories/page.repository';

type ActorContext = {
    actorUserId: string;
    actorRole: Role;
};

type CreatePageInput = {
    ownerId: string;
    name: string;
    templateId: string;
    subdomain: string;
};

type PublishCustomPageInput = {
    ownerId: string;
    subdomain?: unknown;
    blocks?: unknown;
    templateId?: unknown;
    name?: unknown;
};

type UpdatePageInput = ActorContext & {
    pageId: string;
    name?: unknown;
    subdomain?: unknown;
    blocks?: unknown;
};

type AccessPageInput = ActorContext & {
    pageId: string;
};

type SetPublishInput = AccessPageInput & {
    isPublished: boolean;
};

type AccessResult =
    | { ok: false; reason: 'not_found' }
    | { ok: false; reason: 'forbidden' }
    | { ok: true; page: NonNullable<Awaited<ReturnType<typeof findPageById>>> };

type CreatePageResult =
    | { ok: false; reason: 'invalid_name' }
    | { ok: false; reason: 'invalid_template' }
    | { ok: false; reason: 'invalid_subdomain' }
    | { ok: false; reason: 'template_not_found' }
    | { ok: false; reason: 'subdomain_conflict' }
    | { ok: false; reason: 'unknown_error' }
    | { ok: true; page: Awaited<ReturnType<typeof createPageRecord>> };

type UpdatePageResult =
    | { ok: false; reason: 'not_found' }
    | { ok: false; reason: 'forbidden' }
    | { ok: false; reason: 'invalid_subdomain' }
    | { ok: false; reason: 'subdomain_conflict' }
    | { ok: false; reason: 'unknown_error' }
    | { ok: true; page: Awaited<ReturnType<typeof updatePageRecord>> };

type DeletePageResult =
    | { ok: false; reason: 'not_found' }
    | { ok: false; reason: 'forbidden' }
    | { ok: true };

type PublishPageResult =
    | { ok: false; reason: 'not_found' }
    | { ok: false; reason: 'forbidden' }
    | {
        ok: true;
        page: {
            subdomain: string;
            publishedAt: Date;
        };
    };

type PublishCustomPageResult =
    | { ok: false; reason: 'invalid_subdomain' }
    | { ok: false; reason: 'invalid_blocks' }
    | { ok: false; reason: 'subdomain_conflict' }
    | { ok: false; reason: 'unknown_error' }
    | {
        ok: true;
        page: {
            id: string;
            subdomain: string;
            publishedAt: Date;
        };
    };

export async function listPagesForOwner(ownerId: string) {
    return listPagesByOwner(ownerId);
}

export async function createPageForOwner(input: CreatePageInput): Promise<CreatePageResult> {
    const name = input.name.trim();
    const templateId = input.templateId.trim();
    const subdomain = normalizeSubdomain(input.subdomain);

    if (!name) {
        return { ok: false, reason: 'invalid_name' };
    }

    if (!templateId) {
        return { ok: false, reason: 'invalid_template' };
    }

    if (!isValidSubdomain(subdomain)) {
        return { ok: false, reason: 'invalid_subdomain' };
    }

    const template = defaultTemplates.find((item) => item.id === templateId);

    if (!template) {
        return { ok: false, reason: 'template_not_found' };
    }

    try {
        const page = await createPageRecord({
            name,
            templateId,
            subdomain,
            ownerId: input.ownerId,
            blocks: template.blocks as unknown as Prisma.InputJsonValue,
        });

        return { ok: true, page };
    } catch (error: unknown) {
        const typedError = error as { code?: string };
        if (typedError.code === 'P2002') {
            return { ok: false, reason: 'subdomain_conflict' };
        }
        return { ok: false, reason: 'unknown_error' };
    }
}

async function ensurePageAccess(input: AccessPageInput): Promise<AccessResult> {
    const page = await findPageById(input.pageId);

    if (!page) {
        return { ok: false, reason: 'not_found' };
    }

    const canAccess = input.actorRole === Role.ADMIN || page.ownerId === input.actorUserId;

    if (!canAccess) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true, page };
}

export async function getPageForActor(input: AccessPageInput) {
    return ensurePageAccess(input);
}

export async function updatePageForActor(input: UpdatePageInput): Promise<UpdatePageResult> {
    const access = await ensurePageAccess({
        pageId: input.pageId,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
    });

    if (!access.ok) {
        return access;
    }

    const data: Prisma.PageUpdateInput = {};

    if (typeof input.name === 'string' && input.name.trim()) {
        data.name = input.name.trim();
    }

    if (typeof input.subdomain === 'string') {
        const normalizedSubdomain = normalizeSubdomain(input.subdomain);
        if (!isValidSubdomain(normalizedSubdomain)) {
            return { ok: false, reason: 'invalid_subdomain' };
        }
        data.subdomain = normalizedSubdomain;
    }

    if (Array.isArray(input.blocks)) {
        data.blocks = input.blocks as unknown as Prisma.InputJsonValue;
    }

    try {
        const page = await updatePageRecord({
            pageId: input.pageId,
            data,
        });

        return { ok: true, page };
    } catch (error: unknown) {
        const typedError = error as { code?: string };
        if (typedError.code === 'P2002') {
            return { ok: false, reason: 'subdomain_conflict' };
        }
        return { ok: false, reason: 'unknown_error' };
    }
}

export async function deletePageForActor(input: AccessPageInput): Promise<DeletePageResult> {
    const access = await ensurePageAccess(input);

    if (!access.ok) {
        return access;
    }

    await deletePageById(access.page.id);
    return { ok: true };
}

export async function setPagePublishStatusForActor(input: SetPublishInput): Promise<PublishPageResult> {
    const access = await ensurePageAccess(input);

    if (!access.ok) {
        return access;
    }

    const updatedPage = await setPagePublishedById({
        pageId: access.page.id,
        isPublished: input.isPublished,
    });

    return {
        ok: true,
        page: {
            subdomain: updatedPage.subdomain,
            publishedAt: updatedPage.updatedAt,
        },
    };
}

export async function publishPageForActor(input: AccessPageInput): Promise<PublishPageResult> {
    return setPagePublishStatusForActor({
        ...input,
        isPublished: true,
    });
}

export async function publishCustomPageForOwner(input: PublishCustomPageInput): Promise<PublishCustomPageResult> {
    const subdomain = typeof input.subdomain === 'string'
        ? normalizeSubdomain(input.subdomain)
        : '';

    if (!isValidSubdomain(subdomain)) {
        return { ok: false, reason: 'invalid_subdomain' };
    }

    if (!Array.isArray(input.blocks)) {
        return { ok: false, reason: 'invalid_blocks' };
    }

    const name = typeof input.name === 'string' && input.name.trim()
        ? input.name.trim()
        : `Website ${new Date().toLocaleDateString('id-ID')}`;

    const templateId = typeof input.templateId === 'string' && input.templateId.trim()
        ? input.templateId.trim()
        : 'custom';

    try {
        const page = await createPageRecord({
            name,
            templateId,
            subdomain,
            ownerId: input.ownerId,
            blocks: input.blocks as Prisma.InputJsonValue,
            isPublished: true,
        });

        return {
            ok: true,
            page: {
                id: page.id,
                subdomain: page.subdomain,
                publishedAt: page.updatedAt,
            },
        };
    } catch (error: unknown) {
        const typedError = error as { code?: string };
        if (typedError.code === 'P2002') {
            return { ok: false, reason: 'subdomain_conflict' };
        }
        return { ok: false, reason: 'unknown_error' };
    }
}
