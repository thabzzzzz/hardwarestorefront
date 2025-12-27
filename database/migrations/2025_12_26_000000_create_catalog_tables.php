<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->unsignedBigInteger('vendor_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('model_number')->nullable();
            $table->date('release_date')->nullable();
            $table->timestamps();

            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->string('sku')->unique();
            $table->string('title')->nullable();
            $table->json('specs')->nullable();
            $table->json('attributes_normalized')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            $table->uuid('variant_id');
            $table->char('currency', 3)->default('ZAR');
            $table->bigInteger('amount_cents');
            $table->string('price_type')->default('retail');
            $table->timestampTz('valid_from')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestampTz('valid_to')->nullable();
            $table->timestamps();

            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('cascade');
        });

        Schema::create('stock_levels', function (Blueprint $table) {
            $table->id();
            $table->uuid('variant_id');
            $table->integer('qty_available')->default(0);
            $table->integer('qty_reserved')->default(0);
            $table->string('warehouse')->nullable();
            $table->string('status')->default('in_stock');
            $table->timestampTz('updated_at')->nullable();

            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('cascade');
        });

        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->uuid('product_id')->nullable();
            $table->uuid('variant_id')->nullable();
            $table->string('role')->default('gallery');
            $table->string('path');
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->string('alt')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('images');
        Schema::dropIfExists('stock_levels');
        Schema::dropIfExists('prices');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('vendors');
    }
};
