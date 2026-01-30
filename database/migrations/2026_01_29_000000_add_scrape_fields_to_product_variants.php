<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('mpn')->nullable()->after('sku');
            $table->string('source_name')->nullable()->after('attributes_normalized');
            $table->string('source_url')->nullable()->after('source_name');
            $table->timestampTz('scraped_at')->nullable()->after('source_url');
            $table->longText('raw_jsonld')->nullable()->after('scraped_at');
            $table->json('raw_spec_tables')->nullable()->after('raw_jsonld');
            $table->json('image_urls')->nullable()->after('raw_spec_tables');

            // normalized/spec fields for quick queries
            $table->string('vram_gb')->nullable()->after('image_urls');
            $table->string('vram_type')->nullable()->after('vram_gb');
            $table->string('bus_width_bit')->nullable()->after('vram_type');
            $table->string('boost_clock_ghz')->nullable()->after('bus_width_bit');
            $table->string('tdp_watts')->nullable()->after('boost_clock_ghz');
            $table->string('cores')->nullable()->after('tdp_watts');
            $table->string('threads')->nullable()->after('cores');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn([
                'mpn',
                'source_name',
                'source_url',
                'scraped_at',
                'raw_jsonld',
                'raw_spec_tables',
                'image_urls',
                'vram_gb',
                'vram_type',
                'bus_width_bit',
                'boost_clock_ghz',
                'tdp_watts',
                'cores',
                'threads'
            ]);
        });
    }
};
