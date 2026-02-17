import crypto from 'crypto';
import { getPreviewTokenSecret } from '@/shared/config/env';

type PreviewTokenPayload = {
    pageId: string;
    ownerId: string;
    exp: number;
};

const DEFAULT_PREVIEW_TTL_SECONDS = 15 * 60;

function getSigningSecret(): string {
    const secret = getPreviewTokenSecret() || (process.env.AUTH_SECRET ?? '').trim();
    if (!secret) {
        throw new Error('Preview token secret is not configured.');
    }
    return secret;
}

function base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(input: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(input).digest('base64url');
}

export function createPreviewToken(input: {
    pageId: string;
    ownerId: string;
    ttlSeconds?: number;
}): {
    token: string;
    expiresAt: string;
} {
    const ttlSeconds = input.ttlSeconds ?? DEFAULT_PREVIEW_TTL_SECONDS;
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    const payload: PreviewTokenPayload = {
        pageId: input.pageId,
        ownerId: input.ownerId,
        exp: Math.floor(expiresAtMs / 1000),
    };

    const secret = getSigningSecret();
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(encodedPayload, secret);

    return {
        token: `${encodedPayload}.${signature}`,
        expiresAt: new Date(expiresAtMs).toISOString(),
    };
}

export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) {
        return null;
    }

    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) {
        return null;
    }

    let parsed: PreviewTokenPayload;
    try {
        parsed = JSON.parse(base64UrlDecode(encodedPayload)) as PreviewTokenPayload;
    } catch {
        return null;
    }

    if (
        typeof parsed.pageId !== 'string' ||
        typeof parsed.ownerId !== 'string' ||
        typeof parsed.exp !== 'number'
    ) {
        return null;
    }

    const secret = getSigningSecret();
    const expectedSignature = sign(encodedPayload, secret);
    const signatureMatches = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );

    if (!signatureMatches) {
        return null;
    }

    if (parsed.exp * 1000 <= Date.now()) {
        return null;
    }

    return parsed;
}

