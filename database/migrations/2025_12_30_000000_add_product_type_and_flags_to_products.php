<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_type')->nullable()->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_popular')->default(false)->index();
            $table->boolean('is_new')->default(false)->index();
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['product_type', 'is_featured', 'is_popular', 'is_new']);
        });
    }
};
