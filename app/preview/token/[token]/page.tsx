import Link from 'next/link';
import PageRenderer from '@/app/components/PageRenderer';
import { schemaMap } from '@/app/components/editor/schemaMap';
import type { Block } from '@/app/components/editor/types/editor';
import { getPublicPreviewByToken } from '@/features/pages/services/page-preview.service';
import {
    extractRenderableBlocks,
    extractTenantTheme,
    extractVisibleNavItems,
} from '@/features/pages/services/page-public.service';
import PublicNavbar from '@/shared/ui/navigation/PublicNavbar';
import { buildPublicThemeStyle } from '@/shared/ui/theme/public-theme';
import { verifyPreviewToken } from '@/shared/lib/preview-token';
import { findPageById } from '@/features/pages/repositories/page.repository';

type TokenPreviewPageProps = {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ expiresAt?: string }>;
};

function getPreviewTtlStatus(expiresAt?: string): {
    text: string;
    tone: 'active' | 'expired' | 'unknown';
} {
    if (!expiresAt) {
        return {
            text: 'Preview token aktif sementara.',
            tone: 'unknown',
        };
    }

    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime())) {
        return {
            text: 'Masa berlaku token tidak terbaca.',
            tone: 'unknown',
        };
    }

    const diffMs = expiry.getTime() - Date.now();
    if (diffMs <= 0) {
        return {
            text: 'Preview token sudah expired.',
            tone: 'expired',
        };
    }

    const diffMin = Math.ceil(diffMs / 60000);
    return {
        text: `Preview token aktif ~${diffMin} menit lagi.`,
        tone: 'active',
    };
}

export default async function TokenPreviewPage({ params, searchParams }: TokenPreviewPageProps) {
    const { token } = await params;
    const { expiresAt } = await searchParams;
    const ttl = getPreviewTtlStatus(expiresAt);
    const ttlClassName =
        ttl.tone === 'active'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : ttl.tone === 'expired'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-700';

    try {
        const payload = await getPublicPreviewByToken(token);
        const theme = extractTenantTheme(payload);

        return (
            <main className="min-h-screen" style={buildPublicThemeStyle(theme)}>
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
                        <p className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${ttlClassName}`}>
                            {ttl.text}
                        </p>
                    </div>
                </div>
                <PublicNavbar tenantName={payload.tenant.name} items={extractVisibleNavItems(payload)} theme={theme} />
                <PageRenderer blocks={extractRenderableBlocks(payload) as Block[]} schemaMap={schemaMap} />
            </main>
        );
    } catch {
        const fallbackToken = verifyPreviewToken(token);
        if (fallbackToken) {
            const page = await findPageById(fallbackToken.pageId);

            if (page && page.ownerId === fallbackToken.ownerId) {
                return (
                    <main className="min-h-screen bg-white">
                        <div className="border-b border-slate-200 bg-white">
                            <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
                                <p className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${ttlClassName}`}>
                                    {ttl.text}
                                </p>
                            </div>
                        </div>
                        <PageRenderer blocks={page.blocks as unknown as Block[]} schemaMap={schemaMap} />
                    </main>
                );
            }
        }

        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-semibold text-slate-900">Preview Token Tidak Valid</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Link preview sudah tidak berlaku atau token tidak ditemukan.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>
            </main>
        );
    }
}
