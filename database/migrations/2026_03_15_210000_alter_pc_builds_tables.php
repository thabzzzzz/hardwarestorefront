<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pc_builds', function (Blueprint $table) {
            $table->uuid('share_token')->nullable()->after('id')->unique();
        });

        // Set tokens for existing
        $builds = DB::table('pc_builds')->get();
        foreach($builds as $build) {
            DB::table('pc_builds')->where('id', $build->id)->update(['share_token' => (string) Str::uuid()]);
        }

        Schema::table('pc_build_components', function (Blueprint $table) {
            $table->string('category')->nullable()->after('pc_build_id');
        });
    }

    public function down(): void
    {
        Schema::table('pc_builds', function (Blueprint $table) {
            $table->dropColumn('share_token');
        });

        Schema::table('pc_build_components', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};