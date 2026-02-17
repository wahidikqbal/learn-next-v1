<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PageVersion extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'page_id',
        'version_no',
        'status',
        'blocks_json',
        'seo_json',
        'published_at',
    ];

    protected $casts = [
        'blocks_json' => 'array',
        'seo_json' => 'array',
        'published_at' => 'datetime',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(SitePage::class, 'page_id');
    }
}
