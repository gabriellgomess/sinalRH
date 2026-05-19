<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_respostas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('respondente_id')->constrained('nr1_respondentes')->cascadeOnDelete();
            $table->foreignId('avaliacao_id')->constrained('nr1_avaliacoes')->cascadeOnDelete();
            $table->unsignedTinyInteger('secao');   // 1–7
            $table->unsignedTinyInteger('item');    // número do item dentro da seção
            $table->enum('valor', ['S', 'P', 'N']); // Satisfatório | Parcialmente | Não satisfatório
            $table->timestamps();

            $table->unique(['respondente_id', 'secao', 'item']); // impede duplicata
            $table->index(['avaliacao_id', 'secao']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_respostas');
    }
};
