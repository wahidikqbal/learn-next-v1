import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isLaravelPhase2Enabled } from '@/shared/config/env';
import {
    isLaravelNavbarError,
    publishLaravelTenantNavbar,
} from '@/features/navbar/services/laravel-navbar.service';

type TenantParams = {
    params: Promise<{ tenantId: string }>;
};

export async function POST(_: Request, { params }: TenantParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isLaravelPhase2Enabled()) {
        return NextResponse.json({ error: 'Laravel phase2 is disabled.' }, { status: 400 });
    }

    const { tenantId } = await params;

    try {
        const navbar = await publishLaravelTenantNavbar(tenantId);
        return NextResponse.json({ navbar });
    } catch (error) {
        if (isLaravelNavbarError(error)) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Gagal publish navbar.' }, { status: 500 });
    }
}

