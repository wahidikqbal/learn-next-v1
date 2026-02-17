<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('title', 191);
            $table->string('slug', 255);
            $table->string('page_type', 64);
            $table->string('layout_template', 191)->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_deleted')->default(false);
            $table->timestampsTz();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'page_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_pages');
    }
};

