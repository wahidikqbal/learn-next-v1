import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishPageForActor } from '@/features/pages/services/page.service';
import { buildTenantUrl } from '@/shared/config/env';

type PageParams = {
    params: Promise<{ pageId: string }>;
};

export async function POST(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
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
