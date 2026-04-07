<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pc_builds', function (Blueprint ) {
            ->unsignedBigInteger('target_budget')->nullable()->after('total_price');
        });
    }

    public function down(): void
    {
        Schema::table('pc_builds', function (Blueprint ) {
            ->dropColumn('target_budget');
        });
    }
};