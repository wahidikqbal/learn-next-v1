const DEFAULT_APP_BASE_URL = 'http://localhost:3000';
const DEFAULT_ROOT_DOMAIN = 'localhost:3000';

function cleanTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function parseBaseUrl(rawUrl: string): URL | null {
    try {
        return new URL(rawUrl);
    } catch {
        return null;
    }
}

function getRawRootDomain(): string {
    const fromPublic = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (fromPublic && fromPublic.trim()) {
        return fromPublic.trim();
    }

    const fromServer = process.env.ROOT_DOMAIN;
    if (fromServer && fromServer.trim()) {
        return fromServer.trim();
    }

    return DEFAULT_ROOT_DOMAIN;
}

export function getAppBaseUrl(): string {
    const fromPublic = process.env.NEXT_PUBLIC_APP_BASE_URL;
    if (fromPublic && fromPublic.trim()) {
        return cleanTrailingSlash(fromPublic.trim());
    }

    const fromServer = process.env.APP_BASE_URL;
    if (fromServer && fromServer.trim()) {
        return cleanTrailingSlash(fromServer.trim());
    }

    return DEFAULT_APP_BASE_URL;
}

export function getRootDomain(): string {
    const rootDomain = getRawRootDomain();
    if (rootDomain) {
        return rootDomain;
    }

    const parsedBaseUrl = parseBaseUrl(getAppBaseUrl());
    if (!parsedBaseUrl) {
        return DEFAULT_ROOT_DOMAIN;
    }

    if (parsedBaseUrl.port) {
        return `${parsedBaseUrl.hostname}:${parsedBaseUrl.port}`;
    }

    return parsedBaseUrl.hostname;
}

export function getTenantProtocol(): 'http' | 'https' {
    const parsedBaseUrl = parseBaseUrl(getAppBaseUrl());
    if (parsedBaseUrl?.protocol === 'http:' || parsedBaseUrl?.protocol === 'https:') {
        return parsedBaseUrl.protocol.replace(':', '') as 'http' | 'https';
    }

    return getRootDomain().includes('localhost') ? 'http' : 'https';
}

export function buildTenantUrl(subdomain: string): string {
    return `${getTenantProtocol()}://${subdomain}.${getRootDomain()}`;
}

export function getLaravelApiBaseUrl(): string {
    const fromPublic = process.env.NEXT_PUBLIC_LARAVEL_API_BASE_URL;
    if (fromPublic && fromPublic.trim()) {
        return cleanTrailingSlash(fromPublic.trim());
    }

    const fromServer = process.env.LARAVEL_API_BASE_URL;
    if (fromServer && fromServer.trim()) {
        return cleanTrailingSlash(fromServer.trim());
    }

    return `${getAppBaseUrl()}/api`;
}

export function getPreviewTokenSecret(): string {
    const secret = process.env.PREVIEW_TOKEN_SECRET ?? '';
    return secret.trim();
}

export function isLaravelPhase2Enabled(): boolean {
    const fromPublic = process.env.NEXT_PUBLIC_ENABLE_LARAVEL_PHASE2;
    const fromServer = process.env.ENABLE_LARAVEL_PHASE2;
    const value = (fromPublic ?? fromServer ?? '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
}
