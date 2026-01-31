<?php

namespace BookStack\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ConvertBibleJsonToSql extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bible:convert-json-to-sql 
                            {--input=resources/bible/chinese_union_simp.json : Path to the JSON file}
                            {--output=resources/bible/chinese_union_simp.sql : Path to the output SQL file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Convert Bible JSON file to SQL format';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $inputPath = $this->option('input');
        $outputPath = $this->option('output');
        
        if (!File::exists($inputPath)) {
            $this->error("JSON file not found: {$inputPath}");
            return 1;
        }
        
        $this->info("Converting Bible JSON file to SQL format...");
        $this->info("Input: {$inputPath}");
        $this->info("Output: {$outputPath}");
        
        try {
            // Read the JSON file
            $jsonContent = File::get($inputPath);
            $verses = json_decode($jsonContent, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error("Error decoding JSON: " . json_last_error_msg());
                return 1;
            }
            
            $this->info("Found " . count($verses) . " verses in the JSON file.");
            
            // Create SQL content
            $sqlContent = $this->createSqlContent($verses);
            
            // Write to the output file
            File::put($outputPath, $sqlContent);
            
            $this->info("SQL file created successfully: {$outputPath}");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("Error converting JSON to SQL: " . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * Create SQL content from verses array
     *
     * @param array $verses
     * @return string
     */
    private function createSqlContent(array $verses)
    {
        $sql = "-- Bible Verses SQL for Chinese Union (Simplified) Version\n";
        $sql .= "-- Generated on " . date('Y-m-d H:i:s') . "\n\n";
        
        // Create table
        $sql .= "CREATE TABLE IF NOT EXISTS `bible_verses_chinese_union_simp` (\n";
        $sql .= "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
        $sql .= "  `book` tinyint(3) unsigned NOT NULL,\n";
        $sql .= "  `chapter` tinyint(3) unsigned NOT NULL,\n";
        $sql .= "  `verse` tinyint(3) unsigned NOT NULL,\n";
        $sql .= "  `text` text CHARACTER SET utf8 NOT NULL,\n";
        $sql .= "  PRIMARY KEY (`id`),\n";
        $sql .= "  KEY `ixb` (`book`),\n";
        $sql .= "  KEY `ixc` (`chapter`),\n";
        $sql .= "  KEY `ixv` (`verse`),\n";
        $sql .= "  KEY `ixbcv` (`book`,`chapter`,`verse`)\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;\n\n";
        
        // Insert data
        $sql .= "-- Truncate the table first\n";
        $sql .= "TRUNCATE TABLE `bible_verses_chinese_union_simp`;\n\n";
        
        $sql .= "-- Insert data\n";
        
        $batchSize = 100;
        $batchCount = 0;
        $valueStrings = [];
        
        foreach ($verses as $index => $verse) {
            // Escape single quotes in the text
            $text = str_replace("'", "''", $verse['text']);
            
            $valueStrings[] = "({$index}, {$verse['book']}, {$verse['chapter']}, {$verse['verse']}, '{$text}')";
            
            // Insert in batches
            if (count($valueStrings) >= $batchSize) {
                $sql .= "INSERT INTO `bible_verses_chinese_union_simp` VALUES " . implode(",\n", $valueStrings) . ";\n";
                $valueStrings = [];
                $batchCount++;
                
                // Add a newline every 10 batches for readability
                if ($batchCount % 10 === 0) {
                    $sql .= "\n";
                }
            }
        }
        
        // Insert any remaining values
        if (!empty($valueStrings)) {
            $sql .= "INSERT INTO `bible_verses_chinese_union_simp` VALUES " . implode(",\n", $valueStrings) . ";\n";
        }
        
        return $sql;
    }
} 