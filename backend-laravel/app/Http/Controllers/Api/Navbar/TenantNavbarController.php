<?php

namespace App\Http\Controllers\Api\Navbar;

use App\Domain\Navbar\Services\NavbarService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantNavbarController extends Controller
{
    public function __construct(
        private readonly NavbarService $service,
    ) {
    }

    public function show(string $tenantId)
    {
        $result = $this->service->getNavbar($tenantId);
        if (!$result['ok']) {
            return response()->json(['error' => ['code' => 'TENANT_NOT_FOUND', 'message' => 'Tenant not found']], 404);
        }

        return response()->json([
            'navbar' => $result['navbar'],
        ]);
    }

    public function saveDraft(Request $request, string $tenantId)
    {
        $result = $this->service->saveDraft($tenantId, $request->input('items'));

        if (!$result['ok']) {
            return match ($result['reason']) {
                'tenant_not_found' => response()->json(['error' => ['code' => 'TENANT_NOT_FOUND', 'message' => 'Tenant not found']], 404),
                'invalid_items' => response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Navbar items payload is invalid']], 422),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to save navbar draft']], 500),
            };
        }

        return response()->json([
            'navbar' => $result['navbar'],
        ]);
    }

    public function publish(string $tenantId)
    {
        $result = $this->service->publish($tenantId);

        if (!$result['ok']) {
            return match ($result['reason']) {
                'tenant_not_found' => response()->json(['error' => ['code' => 'TENANT_NOT_FOUND', 'message' => 'Tenant not found']], 404),
                'draft_not_found' => response()->json(['error' => ['code' => 'DRAFT_NOT_FOUND', 'message' => 'No draft navbar available']], 422),
                default => response()->json(['error' => ['code' => 'UNKNOWN_ERROR', 'message' => 'Failed to publish navbar']], 500),
            };
        }

        return response()->json([
            'navbar' => $result['navbar'],
        ]);
    }
}

