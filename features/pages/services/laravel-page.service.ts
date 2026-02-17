import { getJson, HttpError } from '@/shared/api/http-client';
import { getLaravelApiBaseUrl } from '@/shared/config/env';
import type { Block } from '@/app/components/editor/types/editor';

class LaravelApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code?: string,
    ) {
        super(message);
    }
}

type LaravelErrorBody = {
    error?: {
        code?: string;
        message?: string;
    } | string;
};

async function parseLaravelError(response: Response, fallbackMessage: string): Promise<never> {
    let code: string | undefined;
    let message = fallbackMessage;

    try {
        const body = (await response.json()) as LaravelErrorBody;
        if (typeof body.error === 'string' && body.error.trim()) {
            message = body.error;
        } else if (typeof body.error === 'object' && body.error !== null) {
            if (typeof body.error.code === 'string') {
                code = body.error.code;
            }
            if (typeof body.error.message === 'string' && body.error.message.trim()) {
                message = body.error.message;
            }
        }
    } catch {
        // Keep fallback message when response body is not JSON.
    }

    throw new LaravelApiError(message, response.status, code);
}

type LaravelPageEnvelope = {
    schemaVersion: number;
    blocks: Block[];
};

export type LaravelPageDetail = {
    id: string;
    tenantId: string;
    title: string;
    slug: string;
    tenantSubdomain: string;
    blocks: LaravelPageEnvelope;
    seo?: Record<string, unknown> | null;
    hasDraft: boolean;
};

export type LaravelOwnerPage = {
    id: string;
    tenantId: string;
    title: string;
    slug: string;
    subdomain: string;
    isPublished: boolean;
    pageType: string;
    layoutTemplate?: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export async function listLaravelPagesByOwner(ownerUserId: string): Promise<LaravelOwnerPage[]> {
    const baseUrl = getLaravelApiBaseUrl();
    const data = await getJson<{ items: LaravelOwnerPage[] }>(baseUrl, `/owners/${ownerUserId}/pages`);
    return data.items;
}

export async function bootstrapLaravelWebsite(input: {
    ownerUserId: string;
    name: string;
    subdomain: string;
    templateId: string;
    homeBlocks: Block[];
}): Promise<{
    id: string;
    tenantId: string;
    subdomain: string;
}> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/owners/${input.ownerUserId}/sites/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: input.name,
            subdomain: input.subdomain,
            template_id: input.templateId,
            home_blocks: input.homeBlocks,
        }),
    });

    if (!response.ok) {
        await parseLaravelError(response, `Failed to bootstrap website in Laravel (${response.status}).`);
    }

    const data = (await response.json()) as {
        page: {
            id: string;
            tenantId: string;
            subdomain: string;
        };
    };

    return data.page;
}

export async function getLaravelPageById(pageId: string): Promise<LaravelPageDetail> {
    const baseUrl = getLaravelApiBaseUrl();

    try {
        const data = await getJson<{ page: LaravelPageDetail }>(baseUrl, `/pages/${pageId}`);
        return data.page;
    } catch (error) {
        if (error instanceof HttpError) {
            throw new LaravelApiError(error.message, error.status);
        }
        throw error;
    }
}

export async function saveLaravelPageDraft(input: {
    pageId: string;
    blocks: Block[];
}): Promise<void> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/pages/${input.pageId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            blocks: {
                schemaVersion: 1,
                blocks: input.blocks,
            },
        }),
    });

    if (!response.ok) {
        await parseLaravelError(response, 'Failed to save draft to Laravel.');
    }
}

export async function updateLaravelPage(input: {
    pageId: string;
    title?: string;
    slug?: string;
}): Promise<void> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/pages/${input.pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...(typeof input.title === 'string' ? { title: input.title } : {}),
            ...(typeof input.slug === 'string' ? { slug: input.slug } : {}),
        }),
    });

    if (!response.ok) {
        await parseLaravelError(response, 'Failed to update page metadata in Laravel.');
    }
}

export async function publishLaravelPage(pageId: string): Promise<{
    subdomain: string;
    publishedAt: string | null;
}> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/pages/${pageId}/publish`, {
        method: 'POST',
    });

    if (!response.ok) {
        await parseLaravelError(response, 'Failed to publish page in Laravel.');
    }

    const data = (await response.json()) as {
        page: { subdomain: string; publishedAt: string | null };
    };

    return data.page;
}

export async function unpublishLaravelPage(pageId: string): Promise<{
    subdomain: string;
    publishedAt: string | null;
}> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/pages/${pageId}/unpublish`, {
        method: 'POST',
    });

    if (!response.ok) {
        await parseLaravelError(response, 'Failed to unpublish page in Laravel.');
    }

    const data = (await response.json()) as {
        page: { subdomain: string; publishedAt: string | null };
    };

    return data.page;
}

export async function deleteLaravelPage(pageId: string): Promise<void> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/pages/${pageId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        await parseLaravelError(response, 'Failed to delete page in Laravel.');
    }
}

export function isLaravelApiError(value: unknown): value is LaravelApiError {
    return value instanceof LaravelApiError;
}
