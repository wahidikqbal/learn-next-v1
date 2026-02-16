import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createPageForOwner, listPagesForOwner } from '@/features/pages/services/page.service';

type CreatePagePayload = {
    name?: unknown;
    templateId?: unknown;
    subdomain?: unknown;
};

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await listPagesForOwner(session.user.id);

    return NextResponse.json({ pages });
}

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: CreatePagePayload;

    try {
        payload = (await request.json()) as CreatePagePayload;
    } catch {
        return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    const result = await createPageForOwner({
        ownerId: session.user.id,
        name: typeof payload.name === 'string' ? payload.name : '',
        templateId: typeof payload.templateId === 'string' ? payload.templateId : '',
        subdomain: typeof payload.subdomain === 'string' ? payload.subdomain : '',
    });

    if (!result.ok) {
        if (result.reason === 'invalid_name') {
            return NextResponse.json({ error: 'Nama halaman wajib diisi.' }, { status: 400 });
        }
        if (result.reason === 'invalid_template') {
            return NextResponse.json({ error: 'Template wajib dipilih.' }, { status: 400 });
        }
        if (result.reason === 'invalid_subdomain') {
            return NextResponse.json({ error: 'Subdomain tidak valid.' }, { status: 400 });
        }
        if (result.reason === 'template_not_found') {
            return NextResponse.json({ error: 'Template tidak ditemukan.' }, { status: 400 });
        }
        if (result.reason === 'subdomain_conflict') {
            return NextResponse.json(
                { error: 'Subdomain sudah dipakai. Gunakan subdomain lain.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: 'Gagal membuat halaman.' }, { status: 500 });
    }

    return NextResponse.json({ page: result.page }, { status: 201 });
}
