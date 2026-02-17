import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishPageForActor } from '@/features/pages/services/page.service';
import { buildTenantUrl } from '@/shared/config/env';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import { isLaravelApiError, publishLaravelPage } from '@/features/pages/services/laravel-page.service';

type PageParams = {
    params: Promise<{ pageId: string }>;
};

export async function POST(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    if (isLaravelPhase2Enabled()) {
        try {
            const page = await publishLaravelPage(pageId);
            return NextResponse.json({
                success: true,
                subdomain: page.subdomain,
                publishedAt: page.publishedAt,
                url: buildTenantUrl(page.subdomain),
            });
        } catch (error) {
            if (isLaravelApiError(error)) {
                if (error.status === 404) {
                    return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
                }
                if (error.status === 403) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
                }
                if (error.status === 422) {
                    return NextResponse.json({ error: 'Draft belum tersedia untuk dipublish.' }, { status: 422 });
                }
                return NextResponse.json({ error: 'Gagal publish halaman.' }, { status: 500 });
            }

            console.warn('[phase2] Laravel POST publish failed, fallback to legacy behavior.', error);
        }
    }

    const result = await publishPageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    if (!result.ok && result.reason === 'not_found') {
        return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
    }

    if (!result.ok && result.reason === 'forbidden') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!result.ok) {
        return NextResponse.json({ error: 'Gagal publish halaman.' }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        subdomain: result.page.subdomain,
        publishedAt: result.page.publishedAt,
        url: buildTenantUrl(result.page.subdomain),
    });
}
