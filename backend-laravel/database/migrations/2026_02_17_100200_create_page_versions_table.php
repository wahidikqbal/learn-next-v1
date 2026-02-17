<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('page_id')->constrained('site_pages')->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->string('status', 32)->default('draft');
            // Required shape: { "schemaVersion": number, "blocks": [...] }
            $table->jsonb('blocks_json');
            $table->jsonb('seo_json')->nullable();
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();

            $table->unique(['page_id', 'version_no']);
            $table->index(['page_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_versions');
    }
};

