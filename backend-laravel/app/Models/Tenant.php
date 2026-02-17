<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tenant extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'owner_user_id',
        'name',
        'subdomain',
        'custom_domain',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function sitePages(): HasMany
    {
        return $this->hasMany(SitePage::class);
    }

    public function navbarConfigs(): HasMany
    {
        return $this->hasMany(NavbarConfig::class);
    }
}
