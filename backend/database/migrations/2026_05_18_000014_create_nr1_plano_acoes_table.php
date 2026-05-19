<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nr1_plano_acoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('nr1_avaliacoes')->cascadeOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->tinyInteger('secao')->nullable();
            $table->text('risco_descricao');
            $table->text('acao');
            $table->string('responsavel', 200);
            $table->string('responsavel_cargo', 200)->nullable();
            $table->date('data_prevista')->nullable();
            $table->date('data_conclusao')->nullable();
            $table->enum('status', ['planejada', 'em_andamento', 'concluida', 'cancelada'])->default('planejada');
            $table->enum('prioridade', ['alta', 'media', 'baixa'])->default('media');
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nr1_plano_acoes');
    }
};
