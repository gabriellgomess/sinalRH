<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->string('relatorio_ia_status', 30)->nullable()->default(null)->after('proxima_avaliacao_em');
            $table->json('relatorio_ia_dados')->nullable()->default(null)->after('relatorio_ia_status');
        });
    }

    public function down(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->dropColumn(['relatorio_ia_status', 'relatorio_ia_dados']);
        });
    }
};
