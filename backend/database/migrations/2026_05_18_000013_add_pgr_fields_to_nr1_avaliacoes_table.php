<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->string('versao', 10)->default('1.0')->after('observacoes');
            $table->date('proxima_avaliacao_em')->nullable()->after('versao');
            $table->string('aprovado_por', 200)->nullable()->after('proxima_avaliacao_em');
            $table->string('aprovado_cargo', 200)->nullable()->after('aprovado_por');
            $table->date('aprovado_em')->nullable()->after('aprovado_cargo');
        });
    }

    public function down(): void
    {
        Schema::table('nr1_avaliacoes', function (Blueprint $table) {
            $table->dropColumn(['versao', 'proxima_avaliacao_em', 'aprovado_por', 'aprovado_cargo', 'aprovado_em']);
        });
    }
};
