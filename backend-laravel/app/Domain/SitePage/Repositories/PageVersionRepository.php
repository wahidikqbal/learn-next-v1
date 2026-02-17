<?php

namespace App\Domain\SitePage\Repositories;

use App\Models\PageVersion;

class PageVersionRepository
{
    public function nextVersionNo(string $pageId): int
    {
        $max = PageVersion::query()
            ->where('page_id', $pageId)
            ->max('version_no');

        return ((int) $max) + 1;
    }

    public function createDraft(string $pageId, int $versionNo, array $blocksJson, ?array $seoJson): PageVersion
    {
        return PageVersion::query()->create([
            'page_id' => $pageId,
            'version_no' => $versionNo,
            'status' => 'draft',
            'blocks_json' => $blocksJson,
            'seo_json' => $seoJson,
            'published_at' => null,
        ]);
    }

    public function findLatestDraft(string $pageId): ?PageVersion
    {
        return PageVersion::query()
            ->where('page_id', $pageId)
            ->where('status', 'draft')
            ->orderByDesc('version_no')
            ->first();
    }

    public function archivePublishedByPage(string $pageId): void
    {
        PageVersion::query()
            ->where('page_id', $pageId)
            ->where('status', 'published')
            ->update([
                'status' => 'archived',
                'updated_at' => now(),
            ]);
    }

    public function findLatestPublished(string $pageId): ?PageVersion
    {
        return PageVersion::query()
            ->where('page_id', $pageId)
            ->where('status', 'published')
            ->orderByDesc('version_no')
            ->first();
    }

    public function archiveVersion(PageVersion $version): PageVersion
    {
        $version->status = 'archived';
        $version->save();

        return $version->refresh();
    }

    public function publishVersion(PageVersion $version): PageVersion
    {
        $version->status = 'published';
        $version->published_at = now();
        $version->save();

        return $version->refresh();
    }
}
