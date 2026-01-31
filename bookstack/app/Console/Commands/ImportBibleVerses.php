<?php

namespace BookStack\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportBibleVerses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bible:import {--file=resources/bible/chinese_union_simp.sql : Path to the SQL file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Bible verses from SQL file into the database';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $filePath = $this->option('file');
        
        if (!File::exists($filePath)) {
            $this->error("SQL file not found: {$filePath}");
            return 1;
        }
        
        $this->info("Importing Bible verses from {$filePath}...");
        
        // Check if the table exists
        if (!$this->tableExists('bible_verses_chinese_union_simp')) {
            $this->info("Creating table bible_verses_chinese_union_simp...");
            $this->createTable();
        } else {
            if ($this->confirm('Table already exists. Do you want to truncate it before importing?', true)) {
                DB::table('bible_verses_chinese_union_simp')->truncate();
                $this->info("Table truncated.");
            }
        }
        
        // Read the SQL file
        $sql = File::get($filePath);
        
        // Extract INSERT statements
        preg_match_all("/INSERT INTO `bible_verses_chinese_union_simp` VALUES \((.*?)\);/", $sql, $matches);
        
        if (empty($matches[1])) {
            $this->error("No INSERT statements found in the SQL file.");
            return 1;
        }
        
        $totalVerses = count($matches[1]);
        $this->info("Found {$totalVerses} verses to import.");
        
        $bar = $this->output->createProgressBar($totalVerses);
        $bar->start();
        
        $batchSize = 100;
        $batch = [];
        
        foreach ($matches[1] as $index => $values) {
            // Split the values by comma, but respect the text field which might contain commas
            $parts = $this->splitValues($values);
            
            if (count($parts) < 5) {
                $this->error("Invalid values format: {$values}");
                continue;
            }
            
            $batch[] = [
                'id' => (int) $parts[0],
                'book' => (int) $parts[1],
                'chapter' => (int) $parts[2],
                'verse' => (int) $parts[3],
                'text' => trim($parts[4], "'"),
            ];
            
            // Insert in batches for better performance
            if (count($batch) >= $batchSize || $index === $totalVerses - 1) {
                DB::table('bible_verses_chinese_union_simp')->insert($batch);
                $batch = [];
                $bar->advance(count($batch));
            }
        }
        
        $bar->finish();
        $this->newLine();
        
        $this->info("Bible verses imported successfully!");
        
        return 0;
    }
    
    /**
     * Check if the table exists
     *
     * @param string $tableName
     * @return bool
     */
    private function tableExists($tableName)
    {
        return DB::getSchemaBuilder()->hasTable($tableName);
    }
    
    /**
     * Create the Bible verses table
     *
     * @return void
     */
    private function createTable()
    {
        DB::statement("
            CREATE TABLE `bible_verses_chinese_union_simp` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `book` tinyint(3) unsigned NOT NULL,
              `chapter` tinyint(3) unsigned NOT NULL,
              `verse` tinyint(3) unsigned NOT NULL,
              `text` text CHARACTER SET utf8 NOT NULL,
              PRIMARY KEY (`id`),
              KEY `ixb` (`book`),
              KEY `ixc` (`chapter`),
              KEY `ixv` (`verse`),
              KEY `ixbcv` (`book`,`chapter`,`verse`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
        ");
    }
    
    /**
     * Split the values string respecting the text field
     *
     * @param string $values
     * @return array
     */
    private function splitValues($values)
    {
        $result = [];
        $current = '';
        $inQuotes = false;
        
        for ($i = 0; $i < strlen($values); $i++) {
            $char = $values[$i];
            
            if ($char === "'" && ($i === 0 || $values[$i-1] !== '\\')) {
                $inQuotes = !$inQuotes;
                $current .= $char;
            } elseif ($char === ',' && !$inQuotes) {
                $result[] = $current;
                $current = '';
            } else {
                $current .= $char;
            }
        }
        
        if ($current !== '') {
            $result[] = $current;
        }
        
        return $result;
    }
} 