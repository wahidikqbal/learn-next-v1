import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPageForActor } from '@/features/pages/services/page.service';
import { createPreviewToken } from '@/shared/lib/preview-token';

type PreviewTokenPayload = {
    pageId?: unknown;
};

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: PreviewTokenPayload;
    try {
        payload = (await request.json()) as PreviewTokenPayload;
    } catch {
        return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    const pageId = typeof payload.pageId === 'string' ? payload.pageId : '';
    if (!pageId) {
        return NextResponse.json({ error: 'Page ID wajib diisi.' }, { status: 400 });
    }

    const access = await getPageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    if (!access.ok) {
        return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
    }

    try {
        const preview = createPreviewToken({
            pageId: access.page.id,
            ownerId: access.page.ownerId,
        });

        return NextResponse.json({
            token: preview.token,
            expiresAt: preview.expiresAt,
            previewUrl: `/preview/token/${preview.token}`,
        });
    } catch {
        return NextResponse.json({ error: 'Gagal membuat preview token.' }, { status: 500 });
    }
}

