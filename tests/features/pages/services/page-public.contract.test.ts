import { describe, expect, it } from 'vitest';
import {
    extractRenderableBlocks,
    extractVisibleNavItems,
    parsePublicSitePayload,
} from '@/features/pages/services/page-public.service';

describe('page-public payload contract', () => {
    it('parses schema-versioned payload', () => {
        const payload = parsePublicSitePayload({
            version: 1,
            tenant: { name: 'Tenant A', theme: { primaryColor: '#2563eb' } },
            navbar: {
                items: [
                    { id: '1', label: 'Home', type: 'link', href: '/', hidden: false },
                    { id: '2', label: 'Hidden', type: 'link', href: '/hidden', hidden: true },
                ],
            },
            page: {
                slug: '/',
                blocks: { schemaVersion: 1, blocks: [{ id: 'hero' }] },
            },
            collections: { articles: [], products: [] },
        });

        expect(payload.tenant.name).toBe('Tenant A');
        expect(extractRenderableBlocks(payload)).toEqual([{ id: 'hero' }]);
        expect(extractVisibleNavItems(payload)).toHaveLength(1);
    });

    it('accepts legacy blocks array as fallback', () => {
        const payload = parsePublicSitePayload({
            tenant: { name: 'Tenant B' },
            navbar: { items: [] },
            page: {
                slug: '/about',
                blocks: [{ id: 'title' }],
            },
        });

        expect(extractRenderableBlocks(payload)).toEqual([{ id: 'title' }]);
    });
});

