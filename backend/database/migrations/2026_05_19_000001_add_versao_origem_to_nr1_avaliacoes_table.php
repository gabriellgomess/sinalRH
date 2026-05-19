<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->foreignId('versao_origem_id')
                ->nullable()
                ->after('versao')
                ->constrained('nr1_avaliacoes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->dropForeign(['versao_origem_id']);
            $table->dropColumn('versao_origem_id');
        });
    }
};
