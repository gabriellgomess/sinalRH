<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ead_teste_tentativas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teste_id')->constrained('ead_testes')->cascadeOnDelete();
            $table->foreignId('colaborador_id')->constrained('colaboradores')->cascadeOnDelete();
            $table->unsignedSmallInteger('numero_tentativa')->default(1);
            $table->json('respostas')->nullable();     // {pergunta_id: [indices]}
            $table->unsignedTinyInteger('nota')->default(0); // 0..100
            $table->boolean('aprovado')->default(false);
            $table->timestamp('finalizada_em')->nullable();
            $table->timestamps();

            $table->index(['teste_id', 'colaborador_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ead_teste_tentativas');
    }
};
