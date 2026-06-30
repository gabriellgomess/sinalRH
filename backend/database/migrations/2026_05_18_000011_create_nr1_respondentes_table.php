<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_respondentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('nr1_avaliacoes')->cascadeOnDelete();
            $table->foreignId('setor_id')->constrained('setores');
            $table->enum('sexo', ['masculino', 'feminino', 'nao_informado']);
            $table->enum('faixa_etaria', ['menos_18', '19_34', '35_44', '45_mais']);
            $table->timestamps();
            // Nenhum dado pessoal identificável — conformidade LGPD
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_respondentes');
    }
};
