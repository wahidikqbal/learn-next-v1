import { describe, expect, it } from 'vitest';
import {
    isAdminApiPath,
    isAdminPath,
    isProtectedPath,
    isTokenPreviewPath,
} from '@/features/tenant/services/proxy-guards';

describe('proxy-guards', () => {
    it('detects token preview path correctly', () => {
        expect(isTokenPreviewPath('/preview/token/abc')).toBe(true);
        expect(isTokenPreviewPath('/preview/123')).toBe(false);
    });

    it('marks protected paths correctly', () => {
        expect(isProtectedPath('/dashboard')).toBe(true);
        expect(isProtectedPath('/websites')).toBe(true);
        expect(isProtectedPath('/edit/1')).toBe(true);
        expect(isProtectedPath('/preview/123')).toBe(true);
        expect(isProtectedPath('/preview/token/abc')).toBe(false);
        expect(isProtectedPath('/api/pages/1')).toBe(true);
        expect(isProtectedPath('/api/publish')).toBe(true);
        expect(isProtectedPath('/api/preview-token')).toBe(true);
        expect(isProtectedPath('/')).toBe(false);
    });

    it('marks admin paths correctly', () => {
        expect(isAdminPath('/admin')).toBe(true);
        expect(isAdminPath('/admin/users')).toBe(true);
        expect(isAdminPath('/dashboard')).toBe(false);
        expect(isAdminApiPath('/api/admin/users')).toBe(true);
        expect(isAdminApiPath('/api/pages')).toBe(false);
    });
});
