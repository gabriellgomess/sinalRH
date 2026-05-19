<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_avaliacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('titulo');
            $table->string('codigo', 12)->unique(); // código público de acesso
            $table->date('aplicada_em')->nullable();
            $table->enum('status', ['rascunho', 'ativa', 'encerrada'])->default('rascunho');
            $table->text('observacoes')->nullable();
            $table->foreignId('criado_por')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_avaliacoes');
    }
};
