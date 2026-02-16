import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deletePageForActor, getPageForActor, updatePageForActor } from '@/features/pages/services/page.service';

type PageParams = {
    params: Promise<{ pageId: string }>;
};

type UpdatePagePayload = {
    name?: unknown;
    subdomain?: unknown;
    blocks?: unknown;
};

export async function GET(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    const result = await getPageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    if (!result.ok) {
        return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ page: result.page });
}

export async function PATCH(request: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    let payload: UpdatePagePayload;

    try {
        payload = (await request.json()) as UpdatePagePayload;
    } catch {
        return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    const result = await updatePageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
        name: payload.name,
        subdomain: payload.subdomain,
        blocks: payload.blocks,
    });

    if (!result.ok) {
        if (result.reason === 'not_found' || result.reason === 'forbidden') {
            return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
        }
        if (result.reason === 'invalid_subdomain') {
            return NextResponse.json({ error: 'Subdomain tidak valid.' }, { status: 400 });
        }
        if (result.reason === 'subdomain_conflict') {
            return NextResponse.json(
                { error: 'Subdomain sudah dipakai. Gunakan subdomain lain.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: 'Gagal memperbarui halaman.' }, { status: 500 });
    }

    return NextResponse.json({ page: result.page });
}

export async function DELETE(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    const result = await deletePageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    if (!result.ok) {
        return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
