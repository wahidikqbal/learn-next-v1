<?php

namespace App\Domain\SitePage\Repositories;

use App\Models\SitePage;
use Illuminate\Support\Facades\DB;

class SitePageRepository
{
    public function listByTenant(string $tenantId): \Illuminate\Database\Eloquent\Collection
    {
        return SitePage::query()
            ->where('tenant_id', $tenantId)
            ->where('is_deleted', false)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function listByOwnerUserId(string $ownerUserId): \Illuminate\Support\Collection
    {
        return DB::table('site_pages as sp')
            ->join('tenants as t', 't.id', '=', 'sp.tenant_id')
            ->leftJoin('page_versions as pv', function ($join) {
                $join->on('pv.page_id', '=', 'sp.id')
                    ->where('pv.status', '=', 'published');
            })
            ->where('t.owner_user_id', $ownerUserId)
            ->where('sp.is_deleted', false)
            ->groupBy([
                'sp.id',
                'sp.tenant_id',
                'sp.title',
                'sp.slug',
                'sp.layout_template',
                'sp.page_type',
                'sp.created_at',
                'sp.updated_at',
                't.subdomain',
            ])
            ->orderByDesc('sp.updated_at')
            ->select([
                'sp.id',
                'sp.tenant_id',
                'sp.title',
                'sp.slug',
                'sp.layout_template',
                'sp.page_type',
                'sp.created_at',
                'sp.updated_at',
                't.subdomain as tenant_subdomain',
                DB::raw("CASE WHEN COUNT(pv.id) > 0 THEN true ELSE false END as is_published"),
            ])
            ->get();
    }

    public function create(array $data): SitePage
    {
        return SitePage::query()->create($data);
    }

    public function findById(string $pageId): ?SitePage
    {
        return SitePage::query()->find($pageId);
    }

    public function update(SitePage $page, array $data): SitePage
    {
        $page->fill($data);
        $page->save();

        return $page->refresh();
    }

    public function softDelete(SitePage $page): void
    {
        $page->is_deleted = true;
        $page->save();
    }
}
