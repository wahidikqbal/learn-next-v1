import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    getLaravelTenantNavbar,
    isLaravelNavbarError,
    type NavbarMenuItem,
    saveLaravelTenantNavbarDraft,
} from '@/features/navbar/services/laravel-navbar.service';

type TenantParams = {
    params: Promise<{ tenantId: string }>;
};

export async function GET(_: Request, { params }: TenantParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isLaravelPhase2Enabled()) {
        return NextResponse.json({ error: 'Laravel phase2 is disabled.' }, { status: 400 });
    }

    const { tenantId } = await params;

    try {
        const navbar = await getLaravelTenantNavbar(tenantId);
        return NextResponse.json({ navbar });
    } catch (error) {
        if (isLaravelNavbarError(error)) {
            if (error.status === 404) {
                return NextResponse.json({ error: 'Tenant tidak ditemukan.' }, { status: 404 });
            }
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Gagal memuat navbar.' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: TenantParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isLaravelPhase2Enabled()) {
        return NextResponse.json({ error: 'Laravel phase2 is disabled.' }, { status: 400 });
    }

    const { tenantId } = await params;
    let payload: { items?: unknown };

    try {
        payload = (await request.json()) as { items?: unknown };
    } catch {
        return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 });
    }

    if (!Array.isArray(payload.items)) {
        return NextResponse.json({ error: 'Items navbar harus berupa array.' }, { status: 422 });
    }

    try {
        const navbar = await saveLaravelTenantNavbarDraft(tenantId, payload.items as NavbarMenuItem[]);
        return NextResponse.json({ navbar });
    } catch (error) {
        if (isLaravelNavbarError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Gagal menyimpan navbar draft.' }, { status: 500 });
    }
}
