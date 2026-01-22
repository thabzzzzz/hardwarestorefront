<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    DB::connection()->getPdo();
    echo "DB connected\n";
    $count = App\Models\Product::count();
    echo "Products: $count\n";
} catch (Exception $e) {
    echo "DB error: " . $e->getMessage() . "\n";
}