import { getJson } from '@/shared/api/http-client';
import { getLaravelApiBaseUrl } from '@/shared/config/env';
import { z } from 'zod';

export type PublicNavItem = {
    id: string;
    label: string;
    type: 'link' | 'dropdown' | 'mega_menu';
    href?: string | null;
    hidden?: boolean;
    items?: Array<{
        id: string;
        label: string;
        href: string;
        hidden?: boolean;
    }>;
};

export type BlockEnvelope = {
    schemaVersion: number;
    blocks: unknown[];
};

export type TenantTheme = {
    font?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
};

export type PublicSitePayload = {
    version?: number;
    tenant: {
        id?: string;
        name: string;
        subdomain?: string;
        theme?: TenantTheme;
    };
    page: {
        id?: string;
        slug: string;
        title?: string;
        seo?: {
            metaTitle?: string | null;
            metaDescription?: string | null;
            ogImage?: string | null;
        } | null;
        blocks: unknown[] | BlockEnvelope;
        updatedAt?: string;
    };
    navbar: {
        items?: PublicNavItem[];
    };
    collections?: {
        articles?: unknown[];
        products?: unknown[];
    };
};

export type PublicSitemapPayload = {
    urls: Array<{
        loc: string;
        lastmod?: string;
    }>;
};

export type PublicRobotsPayload = {
    rules: string;
};

const navChildSchema = z.object({
    id: z.string(),
    label: z.string(),
    href: z.string(),
    hidden: z.boolean().optional(),
});

const navItemSchema: z.ZodType<PublicNavItem> = z.lazy(() =>
    z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['link', 'dropdown', 'mega_menu']),
        href: z.string().nullable().optional(),
        hidden: z.boolean().optional(),
        items: z.array(navChildSchema).optional(),
    })
);

const blockEnvelopeSchema = z.object({
    schemaVersion: z.number().int().positive(),
    blocks: z.array(z.unknown()),
});

const tenantThemeSchema = z.object({
    font: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
});

const publicSitePayloadSchema = z.object({
    version: z.number().optional(),
    tenant: z.object({
        id: z.string().optional(),
        name: z.string(),
        subdomain: z.string().optional(),
        theme: tenantThemeSchema.optional(),
    }),
    page: z.object({
        id: z.string().optional(),
        slug: z.string(),
        title: z.string().optional(),
        seo: z
            .object({
                metaTitle: z.string().nullable().optional(),
                metaDescription: z.string().nullable().optional(),
                ogImage: z.string().nullable().optional(),
            })
            .nullable()
            .optional(),
        blocks: z.union([z.array(z.unknown()), blockEnvelopeSchema]),
        updatedAt: z.string().optional(),
    }),
    navbar: z.object({
        items: z.array(navItemSchema).optional(),
    }),
    collections: z
        .object({
            articles: z.array(z.unknown()).optional(),
            products: z.array(z.unknown()).optional(),
        })
        .optional(),
});

export function parsePublicSitePayload(input: unknown): PublicSitePayload {
    return publicSitePayloadSchema.parse(input);
}

export async function getPublicSiteByHostAndSlug(input: {
    host: string;
    slug: string;
}): Promise<PublicSitePayload> {
    const baseUrl = getLaravelApiBaseUrl();
    const data = await getJson<unknown>(baseUrl, '/public/site', {
        query: {
            host: input.host,
            slug: input.slug,
        },
    });
    return parsePublicSitePayload(data);
}

export async function getPublicSitemapByHost(host: string): Promise<PublicSitemapPayload> {
    const baseUrl = getLaravelApiBaseUrl();
    return getJson<PublicSitemapPayload>(baseUrl, '/public/sitemap', {
        query: { host },
    });
}

export async function getPublicRobotsByHost(host: string): Promise<PublicRobotsPayload> {
    const baseUrl = getLaravelApiBaseUrl();
    return getJson<PublicRobotsPayload>(baseUrl, '/public/robots', {
        query: { host },
    });
}

export function extractRenderableBlocks(payload: PublicSitePayload): unknown[] {
    const blocks = payload.page.blocks;
    if (Array.isArray(blocks)) {
        return blocks;
    }

    if (blocks && typeof blocks === 'object' && Array.isArray(blocks.blocks)) {
        return blocks.blocks;
    }

    return [];
}

export function extractVisibleNavItems(payload: PublicSitePayload): PublicNavItem[] {
    const items = payload.navbar.items ?? [];
    return items.filter((item) => !item.hidden);
}

export function extractTenantTheme(payload: PublicSitePayload): TenantTheme {
    return payload.tenant.theme ?? {};
}
