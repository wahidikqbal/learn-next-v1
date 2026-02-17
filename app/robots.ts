import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getPublicRobotsByHost } from '@/features/pages/services/page-public.service';
import { extractHost, extractSubdomain } from '@/features/tenant/services/tenant-resolver';
import { buildTenantUrl, getRootDomain } from '@/shared/config/env';

export const dynamic = 'force-dynamic';

function parseRobotsRules(raw: string): { allow?: string; disallow?: string } {
    const lines = raw.split('\n').map((line) => line.trim());
    const allowLine = lines.find((line) => line.toLowerCase().startsWith('allow:'));
    const disallowLine = lines.find((line) => line.toLowerCase().startsWith('disallow:'));

    return {
        allow: allowLine ? allowLine.split(':').slice(1).join(':').trim() : '/',
        disallow: disallowLine ? disallowLine.split(':').slice(1).join(':').trim() : undefined,
    };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
    const requestHeaders = await headers();
    const host = extractHost(requestHeaders);
    const subdomain = extractSubdomain(host, getRootDomain());

    if (!subdomain) {
        return {
            rules: { userAgent: '*', allow: '/' },
        };
    }

    try {
        const payload = await getPublicRobotsByHost(host);
        const parsed = parseRobotsRules(payload.rules);
        return {
            rules: {
                userAgent: '*',
                allow: parsed.allow ?? '/',
                disallow: parsed.disallow,
            },
            sitemap: `${buildTenantUrl(subdomain)}/sitemap.xml`,
        };
    } catch {
        return {
            rules: { userAgent: '*', allow: '/' },
            sitemap: `${buildTenantUrl(subdomain)}/sitemap.xml`,
        };
    }
}

