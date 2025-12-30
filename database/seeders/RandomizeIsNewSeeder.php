<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RandomizeIsNewSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Randomizing is_new flag: selecting 5 random products');

        // Clear all
        DB::statement("UPDATE products SET is_new = false");

        // Pick 5 random product ids and mark as new
        DB::statement("UPDATE products SET is_new = true WHERE id IN (SELECT id FROM products ORDER BY random() LIMIT 5)");

        $count = DB::select("SELECT count(*) AS cnt FROM products WHERE is_new = true");
        $this->command->info('Products with is_new=1: ' . ($count[0]->cnt ?? 0));
    }
}
