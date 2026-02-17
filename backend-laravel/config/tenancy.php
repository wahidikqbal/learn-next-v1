<?php

return [
    'root_domain' => env('TENANCY_ROOT_DOMAIN', 'localhost'),
    'reserved_subdomains' => [
        'www',
        'app',
        'api',
        'admin',
    ],
];

