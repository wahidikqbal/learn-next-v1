<?php

namespace App\Http\Controllers\Api\SitePage;

use App\Domain\SitePage\Services\SitePageService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function __construct(
        private readonly SitePageService $service,
    ) {
    }

    public function show(string $pageId)
    {
        $result = $this->service->getPageDetail($pageId);

        if (!$result['ok']) {
            return response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404);
        }

        return response()->json([
            'page' => $result['page'],
        ]);
    }

    public function update(Request $request, string $pageId)
    {
        $result = $this->service->updatePage($pageId, $request->all());

        if (!$result['ok']) {
            return match ($result['reason']) {
                'not_found' => response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404),
                'invalid_title' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Title is required']], 422),
                'invalid_slug' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Slug is invalid']], 422),
                'reserved_slug' => response()->json(['error' => ['code' => 'RESERVED_SLUG', 'message' => 'Slug is reserved for system pages']], 422),
                'slug_conflict' => response()->json(['error' => ['code' => 'SLUG_CONFLICT', 'message' => 'Slug already exists']], 409),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to update page']], 500),
            };
        }

        return response()->json([
            'page' => $result['page'],
        ]);
    }

    public function destroy(string $pageId)
    {
        $result = $this->service->deletePage($pageId);

        if (!$result['ok']) {
            return match ($result['reason']) {
                'not_found' => response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404),
                'system_page_locked' => response()->json(['error' => ['code' => 'SYSTEM_PAGE_LOCKED', 'message' => 'System page cannot be deleted']], 422),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to delete page']], 500),
            };
        }

        return response()->json(['ok' => true]);
    }

    public function saveDraft(Request $request, string $pageId)
    {
        $result = $this->service->saveDraft($pageId, $request->all());

        if (!$result['ok']) {
            return match ($result['reason']) {
                'not_found' => response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404),
                'invalid_blocks' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Blocks payload is invalid']], 422),
                'invalid_seo' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'SEO payload is invalid']], 422),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to save draft']], 500),
            };
        }

        return response()->json([
            'version' => $result['version'],
        ]);
    }

    public function publish(string $pageId)
    {
        $result = $this->service->publishPage($pageId);

        if (!$result['ok']) {
            return match ($result['reason']) {
                'not_found' => response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404),
                'draft_not_found' => response()->json(['error' => ['code' => 'DRAFT_NOT_FOUND', 'message' => 'No draft version available']], 422),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to publish page']], 500),
            };
        }

        return response()->json([
            'page' => $result['page'],
        ]);
    }

    public function unpublish(string $pageId)
    {
        $result = $this->service->unpublishPage($pageId);

        if (!$result['ok']) {
            return match ($result['reason']) {
                'not_found' => response()->json(['error' => ['code' => 'NOT_FOUND', 'message' => 'Page not found']], 404),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to unpublish page']], 500),
            };
        }

        return response()->json([
            'page' => $result['page'],
        ]);
    }
}
