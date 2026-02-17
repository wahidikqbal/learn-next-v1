import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deletePageForActor, getPageForActor, updatePageForActor } from '@/features/pages/services/page.service';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    deleteLaravelPage,
    getLaravelPageById,
    isLaravelApiError,
    saveLaravelPageDraft,
    updateLaravelPage,
} from '@/features/pages/services/laravel-page.service';

type PageParams = {
    params: Promise<{ pageId: string }>;
};

type UpdatePagePayload = {
    name?: unknown;
    subdomain?: unknown;
    slug?: unknown;
    blocks?: unknown;
};

export async function GET(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    if (isLaravelPhase2Enabled()) {
        try {
            const page = await getLaravelPageById(pageId);
            return NextResponse.json({
                page: {
                    id: page.id,
                    name: page.title,
                    slug: page.slug,
                    subdomain: page.tenantSubdomain,
                    blocks: page.blocks.blocks,
                },
            });
        } catch (error) {
            if (isLaravelApiError(error)) {
                if (error.status === 404) {
                    return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
                }
                if (error.status === 403) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
                }
                if (error.status === 401) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
                return NextResponse.json({ error: 'Gagal memuat halaman.' }, { status: 500 });
            }

            console.warn('[phase2] Laravel GET /pages failed, fallback to legacy service.', error);
        }
    }

    const result = await getPageForActor({
        pageId,
        actorUserId: session.user.id,
        actorRole: session.user.role,
    });

    if (!result.ok) {
        return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
        page: {
            ...result.page,
            slug: '/',
        },
    });
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

    if (isLaravelPhase2Enabled()) {
        try {
            if (typeof payload.subdomain === 'string') {
                return NextResponse.json(
                    { error: 'Subdomain tenant tidak bisa diubah dari editor halaman.' },
                    { status: 422 }
                );
            }

            if (typeof payload.name === 'string' || typeof payload.slug === 'string') {
                await updateLaravelPage({
                    pageId,
                    ...(typeof payload.name === 'string' ? { title: payload.name } : {}),
                    ...(typeof payload.slug === 'string' ? { slug: payload.slug } : {}),
                });
            }

            if (Array.isArray(payload.blocks)) {
                await saveLaravelPageDraft({
                    pageId,
                    blocks: payload.blocks,
                });
            }

            const page = await getLaravelPageById(pageId);
            return NextResponse.json({
                page: {
                    id: page.id,
                    name: page.title,
                    slug: page.slug,
                    subdomain: page.tenantSubdomain,
                    blocks: page.blocks.blocks,
                },
            });
        } catch (error) {
            if (isLaravelApiError(error)) {
                if (error.status === 404) {
                    return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
                }
                if (error.status === 409) {
                    return NextResponse.json({ error: 'Slug sudah dipakai.' }, { status: 409 });
                }
                if (error.status === 422) {
                    return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 422 });
                }
                return NextResponse.json({ error: 'Gagal memperbarui halaman.' }, { status: 500 });
            }

            console.warn('[phase2] Laravel PATCH failed, fallback to legacy update.', error);
        }
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

    return NextResponse.json({
        page: {
            ...result.page,
            slug: '/',
        },
    });
}

export async function DELETE(_: Request, { params }: PageParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    if (isLaravelPhase2Enabled()) {
        try {
            await deleteLaravelPage(pageId);
            return NextResponse.json({ success: true });
        } catch (error) {
            if (isLaravelApiError(error)) {
                if (error.status === 404) {
                    return NextResponse.json({ error: 'Halaman tidak ditemukan.' }, { status: 404 });
                }
                if (error.status === 422) {
                    return NextResponse.json({ error: 'Halaman sistem tidak bisa dihapus.' }, { status: 422 });
                }
                return NextResponse.json({ error: 'Gagal menghapus halaman.' }, { status: 500 });
            }

            console.warn('[phase2] Laravel DELETE /pages failed, fallback to legacy service.', error);
        }
    }

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
