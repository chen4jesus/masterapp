<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('bible_verses_chinese_union_simp', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('book');
            $table->unsignedTinyInteger('chapter');
            $table->unsignedTinyInteger('verse');
            $table->text('text');
            
            $table->index('book', 'ixb');
            $table->index('chapter', 'ixc');
            $table->index('verse', 'ixv');
            $table->index(['book', 'chapter', 'verse'], 'ixbcv');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('bible_verses_chinese_union_simp');
    }
}; 