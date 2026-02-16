import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/auth';

export async function requireUser() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    return session;
}

export async function requireAdmin() {
    const session = await requireUser();

    if (session.user.role !== Role.ADMIN) {
        redirect('/dashboard');
    }

    return session;
}
