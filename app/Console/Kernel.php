<?php

namespace App\Console;

use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Console\Scheduling\Schedule;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Weekly reconciliation of product types and flags
        $schedule->command('product:reconcile-flags')->weekly();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        // register import command
        $this->commands([
            \App\Console\Commands\ImportNeweggCsv::class,
        ]);

        require base_path('routes/console.php');
    }
}
