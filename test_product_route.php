<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$slug = 'seagate-ironwolf-st4000vn006-4tb-5400-rpm-256mb-cache-sata-60gbs-35-internal';

echo "Testing slug: $slug\n";

$request = Illuminate\Http\Request::create("/api/products/$slug", 'GET');
$response = $app->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . substr($response->getContent(), 0, 500) . "...\n";
