<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Canal de Escuta
        Schema::create('relatos_escuta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('colaborador_id')->nullable()->constrained('colaboradores')->nullOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->enum('modo', ['anonimo', 'identificado'])->default('anonimo');
            $table->string('categoria');
            $table->string('tag')->nullable();
            $table->text('texto');
            $table->enum('status', ['pendente', 'em_analise', 'resolvido', 'arquivado'])->default('pendente');
            $table->enum('prioridade', ['baixa', 'media', 'alta', 'critica'])->default('media');
            $table->text('nota_interna')->nullable();
            $table->foreignId('atendido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('atendido_em')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'status']);
            $table->index(['empresa_id', 'prioridade']);
        });

        // Riscos Psicossociais
        Schema::create('riscos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setor_id')->constrained('setores')->cascadeOnDelete();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('periodo', 10);
            $table->enum('nivel', ['baixo', 'moderado', 'alto', 'critico'])->default('baixo');
            $table->float('score');
            $table->json('dimensoes');
            $table->string('recomendacao_titulo')->nullable();
            $table->text('recomendacao_texto')->nullable();
            $table->boolean('gerado_por_ia')->default(true);
            $table->foreignId('validado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validado_em')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'periodo']);
            $table->index(['setor_id', 'periodo']);
        });

        // Relatórios Executivos
        Schema::create('relatorios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('periodo', 10);
            $table->enum('tipo', ['executivo', 'setorial', 'risco', 'comparativo'])->default('executivo');
            $table->enum('status', ['gerando', 'pronto', 'erro'])->default('gerando');
            $table->longText('resumo_executivo')->nullable();
            $table->json('pontos_positivos')->nullable();
            $table->json('pontos_atencao')->nullable();
            $table->json('recomendacoes')->nullable();
            $table->json('plano_acao')->nullable();
            $table->boolean('gerado_por_ia')->default(true);
            $table->foreignId('revisado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisado_em')->nullable();
            $table->string('pdf_path')->nullable();
            $table->json('metadados')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'periodo']);
        });

        // Comunicados
        Schema::create('comunicados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('setor_id')->nullable()->constrained('setores')->nullOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('titulo');
            $table->text('corpo');
            $table->enum('tipo', ['info', 'alerta', 'urgente'])->default('info');
            $table->boolean('publicado')->default(false);
            $table->timestamp('expira_em')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        // Pivot: leituras de comunicados
        Schema::create('comunicado_leituras', function (Blueprint $table) {
            $table->foreignId('comunicado_id')->constrained('comunicados')->cascadeOnDelete();
            $table->foreignId('colaborador_id')->constrained('colaboradores')->cascadeOnDelete();
            $table->timestamp('lido_em')->nullable();
            $table->primary(['comunicado_id', 'colaborador_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comunicado_leituras');
        Schema::dropIfExists('comunicados');
        Schema::dropIfExists('relatorios');
        Schema::dropIfExists('riscos');
        Schema::dropIfExists('relatos_escuta');
    }
};
