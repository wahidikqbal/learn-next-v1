export function isTokenPreviewPath(pathname: string): boolean {
    return pathname.startsWith('/preview/token/');
}

export function isProtectedPath(pathname: string): boolean {
    return (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/websites') ||
        pathname.startsWith('/edit') ||
        (pathname.startsWith('/preview') && !isTokenPreviewPath(pathname)) ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/pages') ||
        pathname.startsWith('/api/publish') ||
        pathname.startsWith('/api/preview-token')
    );
}

export function isAdminPath(pathname: string): boolean {
    return pathname.startsWith('/admin');
}

export function isAdminApiPath(pathname: string): boolean {
    return pathname.startsWith('/api/admin');
}
