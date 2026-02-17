<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('navbar_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->unsignedInteger('version_no');
            $table->string('status', 32)->default('draft');
            $table->jsonb('items_json');
            $table->timestampTz('published_at')->nullable();
            $table->timestampsTz();

            $table->unique(['tenant_id', 'version_no']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('navbar_configs');
    }
};

