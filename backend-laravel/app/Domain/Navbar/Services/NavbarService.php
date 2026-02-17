<?php

namespace App\Domain\Navbar\Services;

use App\Domain\Navbar\Repositories\NavbarRepository;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class NavbarService
{
    public function __construct(
        private readonly NavbarRepository $repository,
    ) {
    }

    public function getNavbar(string $tenantId): array
    {
        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            return ['ok' => false, 'reason' => 'tenant_not_found'];
        }

        $draft = $this->repository->findLatestDraft($tenantId);
        if ($draft) {
            return [
                'ok' => true,
                'navbar' => [
                    'tenantId' => $tenantId,
                    'status' => 'draft',
                    'versionNo' => (int) $draft->version_no,
                    'items' => is_array($draft->items_json) ? $draft->items_json : [],
                ],
            ];
        }

        $published = $this->repository->findLatestPublished($tenantId);
        if ($published) {
            return [
                'ok' => true,
                'navbar' => [
                    'tenantId' => $tenantId,
                    'status' => 'published',
                    'versionNo' => (int) $published->version_no,
                    'items' => is_array($published->items_json) ? $published->items_json : [],
                ],
            ];
        }

        return [
            'ok' => true,
            'navbar' => [
                'tenantId' => $tenantId,
                'status' => 'draft',
                'versionNo' => 0,
                'items' => [],
            ],
        ];
    }

    public function saveDraft(string $tenantId, mixed $items): array
    {
        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            return ['ok' => false, 'reason' => 'tenant_not_found'];
        }

        $normalizedItems = $this->validateAndNormalizeItems($items);
        if ($normalizedItems === null) {
            return ['ok' => false, 'reason' => 'invalid_items'];
        }

        $nextVersionNo = $this->repository->maxVersionNo($tenantId) + 1;
        $draft = $this->repository->createDraft($tenantId, $nextVersionNo, $normalizedItems);

        return [
            'ok' => true,
            'navbar' => [
                'tenantId' => $tenantId,
                'status' => 'draft',
                'versionNo' => (int) $draft->version_no,
                'items' => $draft->items_json,
            ],
        ];
    }

    public function publish(string $tenantId): array
    {
        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            return ['ok' => false, 'reason' => 'tenant_not_found'];
        }

        $draft = $this->repository->findLatestDraft($tenantId);
        if (!$draft) {
            return ['ok' => false, 'reason' => 'draft_not_found'];
        }

        $published = DB::transaction(function () use ($tenantId, $draft) {
            $this->repository->archivePublished($tenantId);
            return $this->repository->publish($draft);
        });

        return [
            'ok' => true,
            'navbar' => [
                'tenantId' => $tenantId,
                'status' => 'published',
                'versionNo' => (int) $published->version_no,
                'items' => $published->items_json,
                'publishedAt' => $published->published_at?->toISOString(),
            ],
        ];
    }

    private function validateAndNormalizeItems(mixed $items): ?array
    {
        if (!is_array($items)) {
            return null;
        }

        $normalized = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                return null;
            }

            $id = trim((string) ($item['id'] ?? ''));
            $label = trim((string) ($item['label'] ?? ''));
            $type = trim((string) ($item['type'] ?? ''));
            $href = array_key_exists('href', $item) ? trim((string) ($item['href'] ?? '')) : null;
            $hidden = (bool) ($item['hidden'] ?? false);

            if ($id === '' || $label === '' || !in_array($type, ['link', 'dropdown', 'mega_menu'], true)) {
                return null;
            }

            if ($type === 'link' && (!is_string($href) || $href === '')) {
                return null;
            }

            $children = [];
            if (array_key_exists('items', $item)) {
                if (!is_array($item['items'])) {
                    return null;
                }

                foreach ($item['items'] as $child) {
                    if (!is_array($child)) {
                        return null;
                    }

                    $childId = trim((string) ($child['id'] ?? ''));
                    $childLabel = trim((string) ($child['label'] ?? ''));
                    $childHref = trim((string) ($child['href'] ?? ''));
                    $childHidden = (bool) ($child['hidden'] ?? false);

                    if ($childId === '' || $childLabel === '' || $childHref === '') {
                        return null;
                    }

                    $children[] = [
                        'id' => $childId,
                        'label' => $childLabel,
                        'href' => $childHref,
                        'hidden' => $childHidden,
                    ];
                }
            }

            $normalized[] = [
                'id' => $id,
                'label' => $label,
                'type' => $type,
                'href' => $href,
                'hidden' => $hidden,
                'items' => $children,
            ];
        }

        return $normalized;
    }
}

