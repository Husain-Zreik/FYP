<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--keep=7 : Number of most recent backups to retain}';

    protected $description = 'Dump the database to storage/app/private/backups and prune older backups';

    public function handle(): int
    {
        $connectionName = config('database.default');
        $connection = config("database.connections.{$connectionName}");

        if (($connection['driver'] ?? null) !== 'mysql') {
            $this->error("Unsupported database driver [{$connection['driver']}]. Only mysql is supported.");

            return self::FAILURE;
        }

        Storage::disk('local')->makeDirectory('backups');

        $filename = 'backup_'.now()->format('Y_m_d_His').'.sql';
        $dumpPath = Storage::disk('local')->path("backups/{$filename}");

        if (! $this->dump($connection, $dumpPath)) {
            return self::FAILURE;
        }

        $archivePath = $this->compress($dumpPath);

        $this->info('Backup created: storage/app/private/backups/'.basename($archivePath));

        $this->pruneOldBackups((int) $this->option('keep'));

        return self::SUCCESS;
    }

    private function dump(array $connection, string $dumpPath): bool
    {
        $process = new Process([
            'mysqldump',
            '--host='.$connection['host'],
            '--port='.$connection['port'],
            '--user='.$connection['username'],
            '--single-transaction',
            '--quick',
            '--routines',
            $connection['database'],
        ]);
        $process->setEnv(['MYSQL_PWD' => $connection['password']]);
        $process->setTimeout(600);

        $handle = fopen($dumpPath, 'w');

        try {
            $process->run(function (string $type, string $buffer) use ($handle): void {
                if ($type === Process::OUT) {
                    fwrite($handle, $buffer);
                }
            });
        } catch (\Throwable $e) {
            fclose($handle);
            @unlink($dumpPath);
            $this->error('Database backup failed: '.$e->getMessage());

            return false;
        }

        fclose($handle);

        if (! $process->isSuccessful()) {
            @unlink($dumpPath);
            $this->error('Database backup failed: '.$process->getErrorOutput());

            return false;
        }

        return true;
    }

    private function compress(string $dumpPath): string
    {
        $archivePath = $dumpPath.'.gz';

        $source = fopen($dumpPath, 'rb');
        $destination = gzopen($archivePath, 'wb9');

        while (! feof($source)) {
            gzwrite($destination, fread($source, 512 * 1024));
        }

        fclose($source);
        gzclose($destination);
        unlink($dumpPath);

        return $archivePath;
    }

    private function pruneOldBackups(int $keep): void
    {
        $backups = collect(Storage::disk('local')->files('backups'))
            ->filter(fn (string $file) => str_ends_with($file, '.sql.gz'))
            ->sortByDesc(fn (string $file) => Storage::disk('local')->lastModified($file))
            ->values();

        $backups->slice($keep)->each(function (string $file): void {
            Storage::disk('local')->delete($file);
            $this->line("Pruned old backup: {$file}");
        });
    }
}
