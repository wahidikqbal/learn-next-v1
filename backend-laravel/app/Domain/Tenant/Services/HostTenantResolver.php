<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Tenant\Contracts\TenantResolver;
use App\Domain\Tenant\DTO\TenantContext;
use App\Models\Tenant;

class HostTenantResolver implements TenantResolver
{
    public function fromHost(string $host): ?TenantContext
    {
        $normalizedHost = strtolower(trim(explode(':', $host)[0] ?? ''));
        if ($normalizedHost === '') {
            return null;
        }

        $custom = Tenant::query()
            ->where('custom_domain', $normalizedHost)
            ->first();
        if ($custom) {
            return $this->toContext($custom);
        }

        $rootDomain = strtolower((string) config('tenancy.root_domain', 'localhost'));
        $rootHost = explode(':', $rootDomain)[0] ?? $rootDomain;
        if ($normalizedHost === $rootHost) {
            return null;
        }

        if (!str_ends_with($normalizedHost, '.'.$rootHost)) {
            return null;
        }

        $subdomain = substr($normalizedHost, 0, -strlen('.'.$rootHost));
        if (!$subdomain || str_contains($subdomain, '.')) {
            return null;
        }

        return $this->fromSubdomain($subdomain);
    }

    public function fromSubdomain(string $subdomain): ?TenantContext
    {
        $normalized = strtolower(trim($subdomain));
        if ($normalized === '') {
            return null;
        }

        $reserved = (array) config('tenancy.reserved_subdomains', []);
        if (in_array($normalized, $reserved, true)) {
            return null;
        }

        $tenant = Tenant::query()
            ->where('subdomain', $normalized)
            ->first();

        return $tenant ? $this->toContext($tenant) : null;
    }

    public function fromCustomDomain(string $domain): ?TenantContext
    {
        $normalized = strtolower(trim($domain));
        if ($normalized === '') {
            return null;
        }

        $tenant = Tenant::query()
            ->where('custom_domain', $normalized)
            ->first();

        return $tenant ? $this->toContext($tenant) : null;
    }

    private function toContext(Tenant $tenant): TenantContext
    {
        return new TenantContext(
            id: (string) $tenant->id,
            name: (string) $tenant->name,
            subdomain: (string) $tenant->subdomain,
            customDomain: $tenant->custom_domain ? (string) $tenant->custom_domain : null,
            status: (string) $tenant->status,
        );
    }
}

