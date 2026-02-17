<?php

namespace App\Http\Controllers\Api\SitePage;

use App\Domain\SitePage\Services\SitePageService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OwnerSiteController extends Controller
{
    public function __construct(
        private readonly SitePageService $service,
    ) {
    }

    public function bootstrap(Request $request, string $ownerUserId)
    {
        $result = $this->service->bootstrapWebsite($ownerUserId, $request->all());

        if (!$result['ok']) {
            return match ($result['reason']) {
                'invalid_name' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Name is required']], 422),
                'invalid_subdomain' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Subdomain is invalid']], 422),
                'invalid_blocks' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Blocks payload is invalid']], 422),
                'subdomain_conflict' => response()->json(['error' => ['code' => 'SUBDOMAIN_CONFLICT', 'message' => 'Subdomain already exists']], 409),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to bootstrap website']], 500),
            };
        }

        return response()->json([
            'page' => $result['page'],
        ], 201);
    }
}

