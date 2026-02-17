import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminApiPath, isAdminPath, isProtectedPath } from '@/features/tenant/services/proxy-guards';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const session = await auth();
    const isAuthenticated = Boolean(session?.user?.id);
    const isAdmin = session?.user?.role === 'ADMIN';

    if (pathname === '/login' && isAuthenticated) {
        const destination = isAdmin ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(destination, request.url));
    }

    if (isProtectedPath(pathname) && !isAuthenticated) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if ((isAdminPath(pathname) || isAdminApiPath(pathname)) && !isAdmin) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/',
        '/login',
        '/dashboard/:path*',
        '/websites/:path*',
        '/edit/:path*',
        '/preview/:path*',
        '/preview/token/:path*',
        '/admin/:path*',
        '/api/pages/:path*',
        '/api/publish',
        '/api/preview-token',
        '/api/admin/:path*',
    ],
};
