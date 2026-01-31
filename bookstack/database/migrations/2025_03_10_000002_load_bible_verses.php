<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
          {
              // Path to the SQL file
              $sqlFile = database_path('sql/chinese_union_simp.sql');

              // Check if the file exists
              if (File::exists($sqlFile)) {
                  // Read the SQL file
                  $sql = File::get($sqlFile);

                  // Execute the SQL statements
                  DB::unprepared($sql);
              } else {
                  throw new \Exception('SQL file not found: ' . $sqlFile);
              }
          }

          /**
           * Reverse the migrations.
           *
           * @return void
           */
          public function down()
          {
              // Truncate the table to remove all data
              DB::table('bible_verses_chinese_union_simp')->truncate();
          }
}; 