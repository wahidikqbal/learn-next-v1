import { getJson } from '@/shared/api/http-client';
import { getLaravelApiBaseUrl } from '@/shared/config/env';

class LaravelNavbarError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code?: string,
    ) {
        super(message);
    }
}

type LaravelNavbarErrorBody = {
    error?: {
        code?: string;
        message?: string;
    } | string;
};

export type NavbarMenuChild = {
    id: string;
    label: string;
    href: string;
    hidden?: boolean;
};

export type NavbarMenuItem = {
    id: string;
    label: string;
    type: 'link' | 'dropdown' | 'mega_menu';
    href?: string | null;
    hidden?: boolean;
    items?: NavbarMenuChild[];
};

export type TenantNavbarPayload = {
    tenantId: string;
    status: 'draft' | 'published';
    versionNo: number;
    items: NavbarMenuItem[];
    publishedAt?: string | null;
};

async function parseAndThrow(response: Response, fallbackMessage: string): Promise<never> {
    let message = fallbackMessage;
    let code: string | undefined;

    try {
        const body = (await response.json()) as LaravelNavbarErrorBody;
        if (typeof body.error === 'string' && body.error.trim()) {
            message = body.error;
        } else if (typeof body.error === 'object' && body.error !== null) {
            if (typeof body.error.message === 'string' && body.error.message.trim()) {
                message = body.error.message;
            }
            if (typeof body.error.code === 'string') {
                code = body.error.code;
            }
        }
    } catch {
        // Use fallback message.
    }

    throw new LaravelNavbarError(message, response.status, code);
}

export async function getLaravelTenantNavbar(tenantId: string): Promise<TenantNavbarPayload> {
    const baseUrl = getLaravelApiBaseUrl();
    const data = await getJson<{ navbar: TenantNavbarPayload }>(baseUrl, `/tenants/${tenantId}/navbar`);
    return data.navbar;
}

export async function saveLaravelTenantNavbarDraft(
    tenantId: string,
    items: NavbarMenuItem[],
): Promise<TenantNavbarPayload> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/tenants/${tenantId}/navbar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });

    if (!response.ok) {
        await parseAndThrow(response, 'Failed to save navbar draft in Laravel.');
    }

    const data = (await response.json()) as { navbar: TenantNavbarPayload };
    return data.navbar;
}

export async function publishLaravelTenantNavbar(tenantId: string): Promise<TenantNavbarPayload> {
    const baseUrl = getLaravelApiBaseUrl();
    const response = await fetch(`${baseUrl}/tenants/${tenantId}/navbar/publish`, {
        method: 'POST',
    });

    if (!response.ok) {
        await parseAndThrow(response, 'Failed to publish navbar in Laravel.');
    }

    const data = (await response.json()) as { navbar: TenantNavbarPayload };
    return data.navbar;
}

export function isLaravelNavbarError(error: unknown): error is LaravelNavbarError {
    return error instanceof LaravelNavbarError;
}

