<?php

namespace App\Http\Controllers\Api\SitePage;

use App\Domain\SitePage\Services\SitePageService;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantPageController extends Controller
{
    public function __construct(
        private readonly SitePageService $service,
    ) {
    }

    public function index(string $tenantId)
    {
        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            return response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Tenant not found']], 404);
        }

        return response()->json([
            'items' => $this->service->listPages($tenantId),
        ]);
    }

    public function indexByOwner(string $ownerUserId)
    {
        return response()->json([
            'items' => $this->service->listPagesByOwner($ownerUserId),
        ]);
    }

    public function store(Request $request, string $tenantId)
    {
        $tenant = Tenant::query()->find($tenantId);
        if (!$tenant) {
            return response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Tenant not found']], 404);
        }

        $result = $this->service->createPage($tenantId, $request->all());

        if (!$result['ok']) {
            return match ($result['reason']) {
                'invalid_title' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Title is required']], 422),
                'invalid_slug' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Slug is invalid']], 422),
                'reserved_slug' => response()->json(['error' => ['code' => 'RESERVED_SLUG', 'message' => 'Slug is reserved for system pages']], 422),
                'slug_conflict' => response()->json(['error' => ['code' => 'SLUG_CONFLICT', 'message' => 'Slug already exists']], 409),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to create page']], 500),
            };
        }

        return response()->json([
            'page' => $result['page'],
        ], 201);
    }
}
