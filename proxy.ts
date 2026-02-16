import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

function extractSubdomain(hostHeader: string | null): string | null {
    if (!hostHeader) return null;

    const host = hostHeader.split(':')[0].toLowerCase();
    if (!host.endsWith('.localhost')) return null;

    const segments = host.split('.');
    if (segments.length < 2) return null;

    const subdomain = segments.slice(0, -1).join('.');
    if (!subdomain) return null;

    return subdomain;
}

function isProtectedPath(pathname: string): boolean {
    return (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/websites') ||
        pathname.startsWith('/edit') ||
        pathname.startsWith('/preview') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/pages') ||
        pathname.startsWith('/api/publish')
    );
}

function isAdminPath(pathname: string): boolean {
    return pathname.startsWith('/admin');
}

function isAdminApiPath(pathname: string): boolean {
    return pathname.startsWith('/api/admin');
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === '/') {
        const subdomain = extractSubdomain(request.headers.get('host'));
        if (subdomain) {
            const rewrittenUrl = request.nextUrl.clone();
            rewrittenUrl.pathname = `/published/${subdomain}`;

            return NextResponse.rewrite(rewrittenUrl);
        }
    }

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
        '/admin/:path*',
        '/api/pages/:path*',
        '/api/publish',
        '/api/admin/:path*',
    ],
};
