<?php

namespace App\Domain\PublicSite\Repositories;

use Illuminate\Support\Facades\DB;

class PublicSiteRepository
{
    public function getPublishedPageByTenantAndSlug(string $tenantId, string $slug): ?object
    {
        return DB::table('site_pages as sp')
            ->join('page_versions as pv', 'pv.page_id', '=', 'sp.id')
            ->where('sp.tenant_id', $tenantId)
            ->where('sp.slug', $slug)
            ->where('sp.is_deleted', false)
            ->where('pv.status', 'published')
            ->orderByDesc('pv.version_no')
            ->select([
                'sp.id as page_id',
                'sp.slug',
                'sp.title',
                'pv.blocks_json',
                'pv.seo_json',
                'pv.updated_at',
            ])
            ->first();
    }

    public function getPublishedNavbarByTenant(string $tenantId): ?object
    {
        return DB::table('navbar_configs')
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->orderByDesc('version_no')
            ->select(['items_json'])
            ->first();
    }
}

