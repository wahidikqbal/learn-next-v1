import { describe, expect, it } from 'vitest';
import { createPreviewToken, verifyPreviewToken } from '@/shared/lib/preview-token';

describe('preview-token', () => {
    it('creates and verifies signed token', () => {
        process.env.PREVIEW_TOKEN_SECRET = 'test-preview-secret';

        const { token } = createPreviewToken({
            pageId: 'page-1',
            ownerId: 'owner-1',
            ttlSeconds: 60,
        });

        const parsed = verifyPreviewToken(token);
        expect(parsed).not.toBeNull();
        expect(parsed?.pageId).toBe('page-1');
        expect(parsed?.ownerId).toBe('owner-1');
    });

    it('returns null for malformed token', () => {
        process.env.PREVIEW_TOKEN_SECRET = 'test-preview-secret';
        expect(verifyPreviewToken('bad-token')).toBeNull();
    });
});

