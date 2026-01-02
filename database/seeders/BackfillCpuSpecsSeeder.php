<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BackfillCpuSpecsSeeder extends Seeder
{
    public function run()
    {
        $path = base_path('tmp/cpu_specs_to_fill.csv');
        if (!file_exists($path)) {
            $this->command->error("CSV not found: {$path}");
            return;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            $this->command->error("Failed to open CSV: {$path}");
            return;
        }

        $header = fgetcsv($handle);
        if ($header === false) {
            $this->command->error('CSV appears empty');
            fclose($handle);
            return;
        }

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $data = array_combine($header, $row);
                if ($data === false) {
                    continue;
                }

                $productId = $data['product_id'] ?? null;
                $slug = $data['slug'] ?? null;

                $cores = isset($data['cores']) && $data['cores'] !== '' ? (int) $data['cores'] : null;
                $boost = isset($data['boost_clock']) && $data['boost_clock'] !== '' ? $data['boost_clock'] : null;
                $micro = isset($data['microarchitecture']) && $data['microarchitecture'] !== '' ? $data['microarchitecture'] : null;
                $socket = isset($data['socket']) && $data['socket'] !== '' ? $data['socket'] : null;

                $update = [];
                if (!is_null($cores)) {
                    $update['cores'] = $cores;
                }
                if (!is_null($boost)) {
                    $update['boost_clock'] = $boost;
                }
                if (!is_null($micro)) {
                    $update['microarchitecture'] = $micro;
                }
                if (!is_null($socket)) {
                    $update['socket'] = $socket;
                }

                if (empty($update)) {
                    continue;
                }

                $affected = 0;
                if ($productId) {
                    $affected = DB::table('products')->where('id', $productId)->update($update);
                }

                if ($affected === 0 && $slug) {
                    $affected = DB::table('products')->where('slug', $slug)->update($update);
                }

                $display = $data['name'] ?? ($slug ?? $productId);
                $this->command->info("Updated {$display}: {$affected} rows");
            }

            DB::commit();
            $this->command->info('CPU specs backfill completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Backfill failed: ' . $e->getMessage());
        } finally {
            fclose($handle);
        }
    }
}
