<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$router = app('router');

try {
    $response = app()->handle(Illuminate\Http\Request::create('/api/cpus', 'GET'));
    echo $response->getStatusCode() . "\n";
    echo $response->getContent();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}