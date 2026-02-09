<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('source_variant_id')->nullable()->after('mpn')->index();

            // numeric normalizations
            $table->unsignedInteger('vram_gb_int')->nullable()->after('vram_gb');
            $table->unsignedInteger('bus_width_int')->nullable()->after('vram_gb_int');
            $table->unsignedInteger('boost_clock_mhz')->nullable()->after('bus_width_int');
            $table->unsignedInteger('tdp_watts_int')->nullable()->after('boost_clock_mhz');
            $table->unsignedInteger('cores_int')->nullable()->after('tdp_watts_int');
            $table->unsignedInteger('threads_int')->nullable()->after('cores_int');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn([
                'source_variant_id',
                'vram_gb_int',
                'bus_width_int',
                'boost_clock_mhz',
                'tdp_watts_int',
                'cores_int',
                'threads_int'
            ]);
        });
    }
};
