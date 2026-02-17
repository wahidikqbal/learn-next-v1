import { getRootDomain } from '@/shared/config/env';

type HeaderLike = Headers | Record<string, string | string[] | undefined>;

export function extractHost(input: HeaderLike): string {
    if (typeof Headers !== 'undefined' && input instanceof Headers) {
        return (input.get('x-forwarded-host') ?? input.get('host') ?? '').trim().toLowerCase();
    }

    const headersMap = input as Record<string, string | string[] | undefined>;
    const forwardedHost = headersMap['x-forwarded-host'];
    if (typeof forwardedHost === 'string' && forwardedHost.trim()) {
        return forwardedHost.trim().toLowerCase();
    }

    if (Array.isArray(forwardedHost) && forwardedHost.length > 0) {
        return forwardedHost[0].trim().toLowerCase();
    }

    const host = headersMap.host;
    if (typeof host === 'string') {
        return host.trim().toLowerCase();
    }

    if (Array.isArray(host) && host.length > 0) {
        return host[0].trim().toLowerCase();
    }

    return '';
}

export function extractSubdomain(host: string, rootDomain: string = getRootDomain()): string | null {
    const normalizedHost = host.trim().toLowerCase().split(':')[0];
    const normalizedRoot = rootDomain.trim().toLowerCase().split(':')[0];

    if (!normalizedHost || !normalizedRoot) {
        return null;
    }

    if (normalizedHost === normalizedRoot) {
        return null;
    }

    const suffix = `.${normalizedRoot}`;
    if (!normalizedHost.endsWith(suffix)) {
        return null;
    }

    const candidate = normalizedHost.slice(0, -suffix.length);
    if (!candidate || candidate.includes('.')) {
        return null;
    }

    return candidate;
}
