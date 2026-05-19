<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresa_produtos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->enum('produto', ['diagnostico_nr1', 'plano_acao_nr1', 'canal_escuta']);
            $table->enum('tipo', ['pontual', 'recorrente_mensal']);
            $table->decimal('valor_unitario', 10, 2)->nullable(); // por colaborador (diagnostico)
            $table->decimal('valor_mensal',   10, 2)->nullable(); // recorrente
            $table->unsignedSmallInteger('quantidade_aplicacoes')->nullable(); // ex: 2 para diagnostico
            $table->date('data_inicio');
            $table->date('data_fim')->nullable();
            $table->date('proxima_cobranca_em')->nullable();
            $table->enum('status', ['ativo', 'pausado', 'encerrado', 'inadimplente'])->default('ativo');
            $table->string('numero_contrato', 50)->nullable();
            $table->date('data_assinatura_contrato')->nullable();
            $table->text('observacoes')->nullable();
            $table->foreignId('contratado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['empresa_id', 'produto', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresa_produtos');
    }
};
