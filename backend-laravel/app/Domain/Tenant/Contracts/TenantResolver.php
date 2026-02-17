<?php

namespace App\Domain\Tenant\Contracts;

use App\Domain\Tenant\DTO\TenantContext;

interface TenantResolver
{
    public function fromHost(string $host): ?TenantContext;

    public function fromSubdomain(string $subdomain): ?TenantContext;

    public function fromCustomDomain(string $domain): ?TenantContext;
}

