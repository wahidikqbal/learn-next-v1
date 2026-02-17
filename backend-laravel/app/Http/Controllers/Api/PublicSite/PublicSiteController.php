<?php

namespace App\Http\Controllers\Api\PublicSite;

use App\Domain\PublicSite\Services\PublicSiteService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PublicSiteController extends Controller
{
    public function __construct(
        private readonly PublicSiteService $service,
    ) {
    }

    public function show(Request $request)
    {
        $validated = $request->validate([
            'host' => ['required', 'string'],
            'slug' => ['required', 'string'],
        ]);

        $slug = '/'.ltrim((string) $validated['slug'], '/');
        if ($slug === '//') {
            $slug = '/';
        }

        $payload = $this->service->getRenderPayload(
            host: (string) $validated['host'],
            slug: $slug,
        );

        if (!$payload) {
            return response()->json([
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Site not found',
                ],
            ], 404);
        }

        return response()->json($payload);
    }
}

