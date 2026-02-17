<?php

namespace App\Domain\Tenant\DTO;

class TenantContext
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $subdomain,
        public readonly ?string $customDomain,
        public readonly string $status,
    ) {
    }
}

