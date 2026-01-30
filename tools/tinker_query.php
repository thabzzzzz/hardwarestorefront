<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/..//bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $tables = array_map(function($t){ return $t->table_name; },
        DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
    );
    $out = [];
    foreach ($tables as $tbl) {
        try {
            $rows = DB::table($tbl)->limit(5)->get()->map(function($r){ return (array)$r; })->toArray();
            $out[$tbl] = $rows;
        } catch (Exception $e) {
            $out[$tbl] = ['error' => $e->getMessage()];
        }
    }
    echo json_encode($out);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
