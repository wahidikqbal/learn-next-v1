import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PageRenderer from '@/app/components/PageRenderer';
import { schemaMap } from '@/app/components/editor/schemaMap';
import type { Block } from '@/app/components/editor/types/editor';
import {
    extractTenantTheme,
    extractRenderableBlocks,
    extractVisibleNavItems,
    getPublicSiteByHostAndSlug,
} from '@/features/pages/services/page-public.service';
import { extractHost, extractSubdomain } from '@/features/tenant/services/tenant-resolver';
import { getRootDomain } from '@/shared/config/env';
import PublicNavbar from '@/shared/ui/navigation/PublicNavbar';
import { buildPublicThemeStyle } from '@/shared/ui/theme/public-theme';

type PublicPageProps = {
    params: Promise<{
        slug: string[];
    }>;
};

function toSlugPath(slugSegments: string[]): string {
    return `/${slugSegments.join('/')}`;
}

export default async function PublicSlugPage({ params }: PublicPageProps) {
    const { slug } = await params;
    const slugPath = toSlugPath(slug);
    const requestHeaders = await headers();
    const host = extractHost(requestHeaders);
    const subdomain = extractSubdomain(host, getRootDomain());

    if (!subdomain) {
        notFound();
    }

    try {
        const site = await getPublicSiteByHostAndSlug({
            host,
            slug: slugPath,
        });
        const theme = extractTenantTheme(site);

        return (
            <main className="min-h-screen" style={buildPublicThemeStyle(theme)}>
                <PublicNavbar tenantName={site.tenant.name} items={extractVisibleNavItems(site)} theme={theme} />
                <PageRenderer blocks={extractRenderableBlocks(site) as Block[]} schemaMap={schemaMap} />
            </main>
        );
    } catch {
        notFound();
    }
}
