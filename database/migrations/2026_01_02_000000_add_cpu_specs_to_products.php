<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('cores')->nullable()->after('product_type');
            $table->string('boost_clock')->nullable()->after('cores');
            $table->string('microarchitecture')->nullable()->after('boost_clock');
            $table->string('socket')->nullable()->after('microarchitecture');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cores', 'boost_clock', 'microarchitecture', 'socket']);
        });
    }
};
