<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_teste_perguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teste_id')->constrained('ead_testes')->cascadeOnDelete();
            $table->text('enunciado');
            $table->enum('tipo', ['multipla_escolha', 'verdadeiro_falso'])->default('multipla_escolha');
            $table->json('opcoes')->nullable();            // ["A", "B", "C", ...]
            $table->json('resposta_correta');              // indices corretos, ex: [1] ou [0,2]
            $table->unsignedSmallInteger('peso')->default(1);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();

            $table->index(['teste_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_teste_perguntas');
    }
};
