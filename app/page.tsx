import { headers } from 'next/headers';
import WelcomeComponent from '@/app/components/client/WelcomeComponent';
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
import { getPublishedPage } from '@/lib/pages';
import PublicNavbar from '@/shared/ui/navigation/PublicNavbar';
import { buildPublicThemeStyle } from '@/shared/ui/theme/public-theme';

export default async function HomePage() {
    const requestHeaders = await headers();
    const host = extractHost(requestHeaders);
    const subdomain = extractSubdomain(host, getRootDomain());

    if (!subdomain) {
        return <WelcomeComponent />;
    }

    try {
        const site = await getPublicSiteByHostAndSlug({
            host,
            slug: '/',
        });
        const theme = extractTenantTheme(site);

        return (
            <main className="min-h-screen" style={buildPublicThemeStyle(theme)}>
                <PublicNavbar tenantName={site.tenant.name} items={extractVisibleNavItems(site)} theme={theme} />
                <PageRenderer blocks={extractRenderableBlocks(site) as Block[]} schemaMap={schemaMap} />
            </main>
        );
    } catch {
        const legacySite = await getPublishedPage(subdomain);
        if (!legacySite) {
            return <WelcomeComponent />;
        }

        return (
            <main className="min-h-screen bg-white">
                <PageRenderer blocks={legacySite.blocks} schemaMap={schemaMap} />
            </main>
        );
    }
}
