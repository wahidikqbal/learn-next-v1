<?php

namespace App\Domain\Navbar\Repositories;

use App\Models\NavbarConfig;
use Illuminate\Support\Collection;

class NavbarRepository
{
    public function findLatestDraft(string $tenantId): ?NavbarConfig
    {
        return NavbarConfig::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'draft')
            ->orderByDesc('version_no')
            ->first();
    }

    public function findLatestPublished(string $tenantId): ?NavbarConfig
    {
        return NavbarConfig::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->orderByDesc('version_no')
            ->first();
    }

    public function maxVersionNo(string $tenantId): int
    {
        return (int) (NavbarConfig::query()
            ->where('tenant_id', $tenantId)
            ->max('version_no') ?? 0);
    }

    public function createDraft(string $tenantId, int $versionNo, array $items): NavbarConfig
    {
        return NavbarConfig::query()->create([
            'tenant_id' => $tenantId,
            'version_no' => $versionNo,
            'status' => 'draft',
            'items_json' => $items,
            'published_at' => null,
        ]);
    }

    public function archivePublished(string $tenantId): int
    {
        return NavbarConfig::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->update([
                'status' => 'archived',
                'updated_at' => now(),
            ]);
    }

    public function publish(NavbarConfig $config): NavbarConfig
    {
        $config->status = 'published';
        $config->published_at = now();
        $config->save();

        return $config->refresh();
    }
}

