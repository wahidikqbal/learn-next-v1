import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { publishCustomPageForOwner } from '@/features/pages/services/page.service';

type PublishPayload = {
    subdomain?: unknown;
    blocks?: unknown;
    templateId?: unknown;
    name?: unknown;
};

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: PublishPayload;

    try {
        payload = (await request.json()) as PublishPayload;
    } catch {
        return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    const result = await publishCustomPageForOwner({
        ownerId: session.user.id,
        subdomain: payload.subdomain,
        blocks: payload.blocks,
        templateId: payload.templateId,
        name: payload.name,
    });

    if (!result.ok) {
        if (result.reason === 'invalid_subdomain') {
            return NextResponse.json({ error: 'Subdomain tidak valid.' }, { status: 400 });
        }
        if (result.reason === 'invalid_blocks') {
            return NextResponse.json({ error: 'Data blocks tidak valid.' }, { status: 400 });
        }
        if (result.reason === 'subdomain_conflict') {
            return NextResponse.json(
                { error: 'Subdomain sudah dipakai.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: 'Publish gagal.' }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        pageId: result.page.id,
        subdomain: result.page.subdomain,
        publishedAt: result.page.publishedAt,
        url: `http://${result.page.subdomain}.localhost:3000`,
    });
}
