<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pesquisas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('titulo');
            $table->text('descricao')->nullable();
            $table->enum('tipo', ['clima', 'pulse', 'nps', 'risco', '360', 'cultura'])->default('clima');
            $table->enum('status', ['rascunho', 'ativa', 'encerrada', 'arquivada'])->default('rascunho');
            $table->boolean('anonima')->default(true);
            $table->date('prazo')->nullable();
            $table->timestamp('publicado_em')->nullable();
            $table->timestamp('encerrado_em')->nullable();
            $table->json('configuracoes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['empresa_id', 'status']);
        });

        Schema::create('perguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesquisa_id')->constrained('pesquisas')->cascadeOnDelete();
            $table->text('texto');
            $table->enum('tipo', ['likert', 'multipla_escolha', 'sim_nao', 'nps', 'texto_livre'])->default('likert');
            $table->string('dimensao')->nullable();
            $table->unsignedTinyInteger('ordem')->default(0);
            $table->boolean('obrigatoria')->default(true);
            $table->json('opcoes')->nullable();
            $table->timestamps();

            $table->index(['pesquisa_id', 'ordem']);
        });

        Schema::create('respostas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pergunta_id')->constrained('perguntas')->cascadeOnDelete();
            $table->foreignId('colaborador_id')->constrained('colaboradores')->cascadeOnDelete();
            $table->float('valor_numerico')->nullable();
            $table->text('valor_texto')->nullable();
            $table->unsignedTinyInteger('valor_opcao')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();

            $table->unique(['pergunta_id', 'colaborador_id']);
            $table->index(['colaborador_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('respostas');
        Schema::dropIfExists('perguntas');
        Schema::dropIfExists('pesquisas');
    }
};
