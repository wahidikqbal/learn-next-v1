import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getPublicSitemapByHost } from '@/features/pages/services/page-public.service';
import { extractHost, extractSubdomain } from '@/features/tenant/services/tenant-resolver';
import { buildTenantUrl, getRootDomain } from '@/shared/config/env';
import { getPublishedPage } from '@/lib/pages';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const requestHeaders = await headers();
    const host = extractHost(requestHeaders);

    try {
        const payload = await getPublicSitemapByHost(host);
        return payload.urls.map((url) => ({
            url: url.loc,
            lastModified: url.lastmod ? new Date(url.lastmod) : undefined,
        }));
    } catch {
        const subdomain = extractSubdomain(host, getRootDomain());
        if (!subdomain) {
            return [];
        }

        const legacySite = await getPublishedPage(subdomain);
        if (!legacySite) {
            return [];
        }

        return [
            {
                url: buildTenantUrl(subdomain),
                lastModified: new Date(legacySite.updatedAt),
            },
        ];
    }
}

