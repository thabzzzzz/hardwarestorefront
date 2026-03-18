<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

class NormalizeProductSpecs extends Command
{
    protected $signature = 'specs:normalize';

    protected $description = 'Reads chaotic scraped JSON specs and creates a clean normalized JSON object for compatibility engine usage.';

    public function handle()
    {
        $this->info('Starting spec normalization...');
        $variants = ProductVariant::with('product')->get();
        $count = $variants->count();
        $this->info('Found ' . $count . ' variants to process.');

        $bar = $this->output->createProgressBar($count);

        foreach ($variants as $variant) {
            if (!$variant->product) {
                $bar->advance();
                continue;
            }
            $cat = strtolower($variant->product->product_type);
            $rawSpecs = $variant->raw_spec_tables ?? [];
            if (is_string($rawSpecs)) {
                $rawSpecs = json_decode($rawSpecs, true) ?? [];
            }
            if (empty($rawSpecs)) {
                $bar->advance();
                continue;
            }

            $cleanedSpecs = [];
            foreach ($rawSpecs as $group) {
                if (is_array($group)) {
                    foreach ($group as $tuple) {
                        if (is_array($tuple) && count($tuple) >= 2) {
                            $k = $tuple[0];
                            $v = $tuple[1];
                            $cleanKey = preg_replace('/^(.*?)\s+\1$/', '$1', $k);
                            $cleanKeySlug = Str::slug($cleanKey, '_');
                            $cleanedSpecs[$cleanKeySlug] = $v;
                        }
                    }
                }
            }

            $normalized = [];

            switch ($cat) {
                case 'cpus':
                    $normalized['socket'] = $this->extractSocket($cleanedSpecs);
                    $normalized['includes_cooler'] = $this->extractIncludedCooler($cleanedSpecs);
                    break;
                case 'motherboards':
                    $normalized['socket'] = $this->extractSocket($cleanedSpecs);
                    $normalized['form_factor'] = $this->extractMBFormFactor($cleanedSpecs);
                    $normalized['memory_type'] = $this->extractMemoryType($cleanedSpecs);
                    $normalized['memory_slots'] = $this->extractMemorySlots($cleanedSpecs);
                    break;
                case 'memory':
                case 'ram':
                    $normalized['memory_type'] = $this->extractMemoryType($cleanedSpecs);
                    $normalized['modules'] = $this->extractRamModules($cleanedSpecs);
                    break;
                case 'psu':
                case 'psus':
                case 'power-supplies':
                    $normalized['wattage'] = $this->extractWattage($cleanedSpecs);
                    $normalized['form_factor'] = $this->extractPSUFormFactor($cleanedSpecs);
                    break;
                case 'gpu':
                case 'gpus':
                case 'video-cards':
                    $normalized['length_mm'] = $this->extractGPULength($cleanedSpecs);
                    $normalized['recommended_psu'] = $this->extractRecommendedPSU($cleanedSpecs);
                    break;
                case 'cases':
                case 'computer-cases':
                    $normalized['max_gpu_length_mm'] = $this->extractMaxGPULengthCase($cleanedSpecs);
                    $normalized['max_psu_length_mm'] = $this->extractMaxPSULengthCase($cleanedSpecs);
                    $normalized['mb_form_factors'] = $this->extractCaseMBFormFactors($cleanedSpecs);
                    $normalized['case_type'] = $this->extractCaseType($cleanedSpecs);
                    break;
                case 'cpu-cooler':
                case 'cpu-coolers':
                    $normalized['supported_sockets'] = $this->extractCoolerSockets($cleanedSpecs);
                    $normalized['cooler_type'] = $this->extractCoolerType($cleanedSpecs);
                    $normalized['size_mm'] = $this->extractCoolerSize($cleanedSpecs);
                    break;
            }

            $normalized = array_filter($normalized, function ($val) {
                return !is_null($val);
            });

            if (empty($normalized)) {
                $this->info("Skipped (Empty " . $cat . "): " . $variant->id);
            } else {
                $this->info("Saved " . $cat . ": " . json_encode($normalized));
            }

            if (!empty($normalized)) {
                $variant->normalized_specs = $normalized;
                $variant->save();
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Spec normalization complete!');
    }

    private function getValuesByKeywords($specs, $keywords)
    {
        foreach ($keywords as $kw) {
            foreach ($specs as $k => $v) {
                if (Str::contains($k, $kw)) {
                    return $v;
                }
            }
        }
        return null;
    }

    private function extractSocket($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['socket']);
        if (!$val) return null;
        if (preg_match('/(AM[45]|LGA\s?\d+)/i', $val, $matches)) {
            $socket = strtoupper(trim($matches[1]));
            return preg_replace('/LGA(\d+)/', 'LGA $1', $socket);
        }
        return $val;
    }

    private function extractIncludedCooler($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['cooler_device', 'cooling_device']);
        if (!$val) return null;
        if (Str::contains(strtolower($val), ['included', 'wraith', 'intel'])) return true;
        if (Str::contains(strtolower($val), ['cooling device not included', 'none'])) return false;
        return null;
    }

    private function extractMBFormFactor($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['form_factor']);
        if (!$val) return null;
        if (preg_match('/(ATX|Micro\s?ATX|Mini\s?ITX|E-ATX)/i', $val, $matches)) {
            $ff = strtoupper(str_replace(' ', '', $matches[1]));
            if ($ff === 'MICROATX') return 'Micro ATX';
            if ($ff === 'MINIITX') return 'Mini ITX';
            return $ff;
        }
        return $val;
    }

    private function extractMemoryType($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['memory_standard', 'memory_type', 'speed', 'memory']);
        if (!$val) return null;
        if (preg_match('/(DDR[45])/i', $val, $matches)) {
            return strtoupper($matches[1]);
        }
        return null;
    }

    private function extractMemorySlots($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['number_of_memory_slots']);
        if (!$val) return null;
        if (preg_match('/(\d+)/', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractRamModules($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['capacity']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*x\s*(\d+)GB/i', $val, $matches)) {
            return [
                'count' => (int) $matches[1],
                'size_gb' => (int) $matches[2],
            ];
        }
        return null;
    }

    private function extractWattage($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['maximum_power']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*W/', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractPSUFormFactor($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['type']);
        if (!$val) return null;
        if (preg_match('/(SFX|ATX|TFX)/i', $val, $matches)) {
            return strtoupper($matches[1]);
        }
        return 'ATX';
    }

    private function extractGPULength($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['max_gpu_length', 'card_dimensions']);
        if (!$val) return null;
        if (preg_match('/^(\d+)\s*mm/i', $val, $matches)) {
            return (int) $matches[1];
        }
        if (preg_match('/(\d+)\s?x\s?\d+\s?x\s?\d+/i', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractRecommendedPSU($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['recommended_psu_wattage', 'thermal_design_power', 'suggested_power']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*W/i', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractMaxGPULengthCase($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['max_gpu_length']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*mm/i', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractMaxPSULengthCase($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['max_psu_length']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*mm/i', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    private function extractCaseMBFormFactors($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['motherboard_compatibility']);
        if (!$val) return null;
        $allowed = ['ATX', 'Micro ATX', 'Mini ITX', 'E-ATX'];
        $found = [];
        $valClean = str_ireplace('micro-atx', 'micro atx', $val);
        $valClean = str_ireplace('mini-itx', 'mini itx', $valClean);
        foreach ($allowed as $a) {
            if (stripos($valClean, $a) !== false) {
                $found[] = $a;
            }
        }
        return $found;
    }

    private function extractCaseType($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['type']);
        if (!$val) return null;
        return $val;
    }

    private function extractCoolerSockets($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['socket']);
        if (!$val) return null;
        $found = [];
        if (preg_match_all('/(AM[45]|LGA\s?\d+)/i', $val, $matches)) {
            foreach ($matches[1] as $m) {
                $socket = strtoupper(trim($m));
                $socket = preg_replace('/LGA(\d+)/', 'LGA $1', $socket);
                $found[] = $socket;
            }
        }
        return array_unique($found);
    }

    private function extractCoolerType($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['type', 'radiator', 'water']);
        if (!$val) return 'Air';
        if (stripos($val, 'Liquid') !== false || stripos($val, 'AIO') !== false) return 'AIO';
        return 'Air';
    }

    private function extractCoolerSize($specs)
    {
        $val = $this->getValuesByKeywords($specs, ['radiator_size', 'fan_size', 'max_cpu_cooler_height']);
        if (!$val) return null;
        if (preg_match('/(\d+)\s*mm/i', $val, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }
}
